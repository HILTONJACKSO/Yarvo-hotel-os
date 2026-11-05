import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CreateMenuOrderDto } from './dto/create-menu-order.dto';
import { CreateEventBookingDto } from './dto/create-event-booking.dto';

@Injectable()
export class PublicService {
  async getActivities() {
    return this.prisma.activity.findMany({ where: { isActive: true } });
  }

  async getWebsiteContent() {
    const property = await this.prisma.property.findFirst({
      select: {
        id: true,
        websiteContent: true,
      }
    });
    return {
      propertyId: property?.id,
      content: property?.websiteContent || {},
    };
  }

  async updateWebsiteContent(content: any) {
    let property = await this.prisma.property.findFirst();
    if (!property) {
      throw new BadRequestException('No property found');
    }
    let parsedContent = content;
    if (typeof content === 'string') {
      try {
        parsedContent = JSON.parse(content);
      } catch (e) {}
    }
    return this.prisma.property.update({
      where: { id: property.id },
      data: {
        websiteContent: parsedContent,
      },
      select: {
        id: true,
        websiteContent: true,
      }
    });
  }

  private readonly logger = new Logger(PublicService.name);

  constructor(private prisma: PrismaService) {}

  async getRoomTypes() {
    return this.prisma.roomType.findMany({
      where: { isActive: true },
      select: {
        id: true, name: true, code: true, description: true,
        maxOccupancy: true, maxAdults: true, maxChildren: true,
        baseRateUsd: true, amenities: true, images: true,
      }
    });
  }

  async checkAvailability(checkIn: string, checkOut: string, adults: number) {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkInDate >= checkOutDate) {
      throw new BadRequestException('Check-out date must be after check-in date');
    }

    const roomTypes = await this.prisma.roomType.findMany({
      where: { isActive: true, maxAdults: { gte: adults } }
    });

    const availability = [];
    for (const rt of roomTypes) {
      const totalRooms = await this.prisma.room.count({
        where: { roomTypeId: rt.id, isActive: true, status: { notIn: ['OUT_OF_ORDER', 'MAINTENANCE'] } }
      });

      const overlappingReservations = await this.prisma.reservation.count({
        where: {
          roomTypeId: rt.id,
          status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] },
          AND: [{ checkInDate: { lt: checkOutDate } }, { checkOutDate: { gt: checkInDate } }]
        }
      });

      const availableRooms = totalRooms - overlappingReservations;
      if (availableRooms > 0) {
        availability.push({
          roomType: {
            id: rt.id, name: rt.name, code: rt.code, baseRateUsd: rt.baseRateUsd, images: rt.images,
          },
          availableRooms
        });
      }
    }
    return availability;
  }

  async createBooking(dto: CreateBookingDto & { whatsapp?: string }) {
    const checkInDate = new Date(dto.checkInDate);
    const checkOutDate = new Date(dto.checkOutDate);

    if (checkInDate >= checkOutDate) {
      throw new BadRequestException('Check-out date must be after check-in date');
    }

    // 1. Verify availability and get a specific room
    const roomType = await this.prisma.roomType.findUnique({ where: { id: dto.roomTypeId } });
    if (!roomType) throw new BadRequestException('Invalid room type');

    const totalRooms = await this.prisma.room.findMany({
      where: { roomTypeId: roomType.id, isActive: true, status: { notIn: ['OUT_OF_ORDER', 'MAINTENANCE'] } }
    });

    const overlappingReservations = await this.prisma.reservation.findMany({
      where: {
        roomTypeId: roomType.id,
        status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] },
        AND: [{ checkInDate: { lt: checkOutDate } }, { checkOutDate: { gt: checkInDate } }]
      }
    });

    const bookedRoomIds = overlappingReservations.map(r => r.roomId).filter(Boolean);
    const availableRoom = totalRooms.find(r => !bookedRoomIds.includes(r.id));

    if (!availableRoom) {
      throw new BadRequestException('No availability for the selected dates and room type.');
    }

    // 2. Find or create guest (and keep latest phone/whatsapp updated)
    const guestWhatsappNormalized = (dto.whatsapp || dto.phone || '').trim();
    let guest = await this.prisma.guest.findFirst({ where: { email: dto.email } });
    if (!guest) {
      guest = await this.prisma.guest.create({
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email,
          phone: dto.phone,
          whatsapp: guestWhatsappNormalized,
        }
      });
    } else {
      guest = await this.prisma.guest.update({
        where: { id: guest.id },
        data: {
          firstName: dto.firstName || guest.firstName,
          lastName: dto.lastName || guest.lastName,
          phone: dto.phone || guest.phone,
          whatsapp: guestWhatsappNormalized || guest.whatsapp || guest.phone,
        }
      });
    }

    // 3. Generate Sequential Booking Reference VC-YYYY-XXXX safely
    const year = new Date().getFullYear();
    let seqNum = (await this.prisma.reservation.count({
      where: { createdAt: { gte: new Date(`${year}-01-01`) } }
    })) + 1;
    let confirmationCode = `VC-${year}-${seqNum.toString().padStart(4, '0')}`;
    while (await this.prisma.reservation.findUnique({ where: { confirmationCode } })) {
      seqNum++;
      confirmationCode = `VC-${year}-${seqNum.toString().padStart(4, '0')}`;
    }

    // 4. Calculate total amount (tax-inclusive — never add extra tax on top of subtotal)
    const nights = Math.max(1, Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 3600 * 24)));
    const roomsCount = Math.max(1, Number(dto.roomsCount || 1));
    let totalAmount = Number(roomType.baseRateUsd) * nights * roomsCount;
    
    // 4.5. Process Activities
    const activityItems = [];
    if (dto.activities && dto.activities.length > 0) {
      for (const act of dto.activities) {
        const activity = await this.prisma.activity.findUnique({ where: { id: act.activityId } });
        if (activity) {
          const actTotal = Number(activity.price) * act.quantity;
          totalAmount += actTotal;
          activityItems.push({
            activityId: activity.id,
            quantity: act.quantity,
            totalPrice: actTotal
          });
        }
      }
    }

    const specialReqWithRooms = [
      roomsCount > 1 ? `[Requested Accommodations: ${roomsCount} Rooms/Tents]` : '',
      dto.specialRequests || ''
    ].filter(Boolean).join('\n');

    // 5. Create confirmed reservation
    const reservation = await this.prisma.reservation.create({
      data: {
        confirmationCode,
        guestId: guest.id,
        roomTypeId: roomType.id,
        roomId: availableRoom.id,
        checkInDate,
        checkOutDate,
        adultsCount: dto.adultsCount,
        childrenCount: dto.childrenCount || 0,
        specialRequests: specialReqWithRooms,
        status: 'CONFIRMED',
        totalAmount: totalAmount,
        activities: {
          create: activityItems
        }
      },
      include: {
        roomType: true,
        room: true,
        guest: true,
        activities: { include: { activity: true } }
      }
    });

    // 6. Send Notifications without awaiting so it doesn't block response
    this.sendNotifications(reservation).catch(err => {
      this.logger.error(`Failed to send notifications for ${confirmationCode}:`, err);
    });

    return {
      confirmationCode: reservation.confirmationCode,
      status: reservation.status,
      totalAmount: Number(reservation.totalAmount),
      checkInDate: reservation.checkInDate,
      checkOutDate: reservation.checkOutDate,
      nights,
      roomsCount,
      adultsCount: reservation.adultsCount,
      roomTypeName: reservation.roomType?.name,
      roomNumber: reservation.room?.number,
      guestName: `${reservation.guest?.firstName || ''} ${reservation.guest?.lastName || ''}`.trim(),
      guestEmail: reservation.guest?.email,
      guestPhone: reservation.guest?.phone,
      guestWhatsapp: reservation.guest?.whatsapp || reservation.guest?.phone,
      activities: (reservation.activities || []).map((a: any) => ({
        name: a.activity?.name || 'Activity',
        quantity: a.quantity,
        totalPrice: Number(a.totalPrice),
      })),
      message: 'Booking confirmed successfully!',
    };
  }

  async getBookingByCode(code: string) {
    if (!code) return null;
    const reservation = await this.prisma.reservation.findFirst({
      where: { confirmationCode: { equals: code, mode: 'insensitive' } },
      include: {
        roomType: true,
        room: true,
        guest: true,
        activities: { include: { activity: true } },
      },
    });
    return reservation;
  }

  async subscribeNewsletter(emailRaw: string) {
    const email = (emailRaw || '').trim().toLowerCase();
    if (!email || !email.includes('@')) {
      throw new BadRequestException('Please provide a valid email address.');
    }

    const property = await this.prisma.property.findFirst();
    if (!property) {
      throw new BadRequestException('Property configuration not found.');
    }

    const currentContent: any =
      property.websiteContent && typeof property.websiteContent === 'object'
        ? { ...(property.websiteContent as any) }
        : {};

    const existingList: Array<{ email: string; subscribedAt: string }> = Array.isArray(currentContent.newsletterSubscribers)
      ? currentContent.newsletterSubscribers
      : [];

    const alreadyExists = existingList.some(item => (item.email || '').toLowerCase() === email);
    const updatedList = alreadyExists
      ? existingList
      : [{ email, subscribedAt: new Date().toISOString() }, ...existingList];

    currentContent.newsletterSubscribers = updatedList;

    await this.prisma.property.update({
      where: { id: property.id },
      data: { websiteContent: currentContent },
    });

    // Notify resort email via Resend if configured
    const resortEmail =
      currentContent?.general?.email ||
      process.env.ADMIN_EMAIL ||
      'kwaleebeachresort1@gmail.com';

    if (process.env.RESEND_API_KEY) {
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.HOTEL_EMAIL || 'reservations@kwaleebeachresort.com',
          to: resortEmail,
          subject: `New Newsletter Subscriber: ${email}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1F1F1F;">
              <h2 style="color: #1B2418;">New Newsletter Subscription</h2>
              <p>A visitor on the Kwalee Beach Resort website has requested to join the newsletter:</p>
              <div style="background: #FAF9F4; padding: 16px; border-radius: 8px; margin: 16px 0;">
                <p><strong>Subscriber Email:</strong> <a href="mailto:${email}">${email}</a></p>
                <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
                <p><strong>Total Subscribers:</strong> ${updatedList.length}</p>
              </div>
            </div>
          `,
        }),
      }).catch(err => this.logger.error('Newsletter email notification error:', err));
    }

    return {
      success: true,
      email,
      alreadySubscribed: alreadyExists,
      totalSubscribers: updatedList.length,
      message: 'Thank you for subscribing to the Kwalee Beach Resort newsletter!',
    };
  }

  async getNewsletterSubscribers() {
    const property = await this.prisma.property.findFirst({
      select: { websiteContent: true },
    });
    const content: any = property?.websiteContent || {};
    return Array.isArray(content.newsletterSubscribers) ? content.newsletterSubscribers : [];
  }

  private normalizeWhatsAppRecipient(rawPhone: string): string {
    const digits = (rawPhone || '').replace(/[^0-9]/g, '');
    if (!digits) return '';
    if (digits.startsWith('00')) return digits.slice(2);
    if (digits.startsWith('0') && digits.length === 10) {
      return '231' + digits.slice(1);
    }
    if (digits.length === 9 && (digits.startsWith('77') || digits.startsWith('88') || digits.startsWith('55'))) {
      return '231' + digits;
    }
    return digits;
  }

  private async sendNotifications(reservation: any) {
    const checkInStr = reservation.checkInDate instanceof Date
      ? reservation.checkInDate.toISOString().split('T')[0]
      : String(reservation.checkInDate).split('T')[0];
    const checkOutStr = reservation.checkOutDate instanceof Date
      ? reservation.checkOutDate.toISOString().split('T')[0]
      : String(reservation.checkOutDate).split('T')[0];
    const guestFullName = `${reservation.guest?.firstName || ''} ${reservation.guest?.lastName || ''}`.trim();
    const guestWaRaw = reservation.guest?.whatsapp || reservation.guest?.phone || '';
    const normalizedWa = this.normalizeWhatsAppRecipient(guestWaRaw);

    // A. Automatic Email Confirmation to Guest's Personal Email
    try {
      if (process.env.RESEND_API_KEY && reservation.guest?.email) {
        const activitiesHtml = Array.isArray(reservation.activities) && reservation.activities.length > 0
          ? `<p><strong>Selected Activities:</strong> ${reservation.activities.map((a: any) => `${a.activity?.name || 'Activity'} (x${a.quantity}) - $${Number(a.totalPrice).toFixed(2)}`).join(', ')}</p>`
          : '';

        const emailHtml = `
          <div style="font-family: Georgia, serif; max-width: 620px; margin: 0 auto; color: #1F1F1F; border: 1px solid #E8E1D7; border-radius: 12px; overflow: hidden;">
            <div style="background: #1B2418; color: #FFFFFF; padding: 28px 24px; text-align: center;">
              <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 3px; color: #DFB776; margin: 0 0 6px;">Kwalee Beach Resort</p>
              <h2 style="margin: 0; font-size: 24px;">Room Reserved • Booking Confirmed</h2>
            </div>
            <div style="padding: 24px; background: #FFFFFF; font-family: sans-serif;">
              <p>Dear <strong>${guestFullName}</strong>,</p>
              <p>Thank you for choosing <strong>Kwalee Beach Resort</strong>! Your room has been reserved and your booking has been confirmed. Please find your official reservation details below:</p>
              <div style="background: #FAF9F4; padding: 20px; border-radius: 10px; border: 1px solid #E8E1D7; margin: 20px 0;">
                <p style="margin: 6px 0;"><strong>Booking Reference:</strong> <span style="font-family: monospace; font-size: 16px; color: #1B2418;">${reservation.confirmationCode}</span></p>
                <p style="margin: 6px 0;"><strong>Guest Name:</strong> ${guestFullName}</p>
                <p style="margin: 6px 0;"><strong>Email:</strong> ${reservation.guest.email}</p>
                <p style="margin: 6px 0;"><strong>Phone / WhatsApp:</strong> ${guestWaRaw}</p>
                <hr style="border: none; border-top: 1px solid #E8E1D7; margin: 12px 0;" />
                <p style="margin: 6px 0;"><strong>Accommodation:</strong> ${reservation.roomType?.name || 'Accommodation'} (Unit: ${reservation.room?.number || 'Assigned'})</p>
                <p style="margin: 6px 0;"><strong>Guests:</strong> ${reservation.adultsCount || 1} Guest(s)</p>
                <p style="margin: 6px 0;"><strong>Check-In Date:</strong> ${checkInStr} (2:00 PM)</p>
                <p style="margin: 6px 0;"><strong>Check-Out Date:</strong> ${checkOutStr} (11:00 AM)</p>
                ${activitiesHtml}
                <p style="margin: 10px 0 4px; font-size: 16px;"><strong>Total Amount:</strong> $${Number(reservation.totalAmount).toFixed(2)}</p>
                <p style="margin: 4px 0;"><strong>Status:</strong> ${reservation.status}</p>
              </div>
              <p style="font-size: 13px; color: #555;">Please present your booking reference <strong>${reservation.confirmationCode}</strong> upon arrival at the resort front desk. We look forward to welcoming you!</p>
            </div>
          </div>
        `;
        
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: process.env.HOTEL_EMAIL || 'reservations@kwaleebeachresort.com',
            to: reservation.guest.email,
            subject: `Booking Confirmed (${reservation.confirmationCode}) - Kwalee Beach Resort`,
            html: emailHtml
          })
        });

        const status = res.ok ? 'SENT' : 'FAILED';
        await this.prisma.notificationLog.create({
          data: {
            reservationId: reservation.id,
            type: 'EMAIL',
            recipient: reservation.guest.email,
            status,
            errorMessage: res.ok ? null : await res.text()
          }
        });
      }
    } catch (e) {
      this.logger.error('Email error:', e);
    }

    // B. Automatic WhatsApp Notification to Guest's Personal WhatsApp Number
    try {
      const msg = [
        `*KWALEE BEACH RESORT — BOOKING CONFIRMED*`,
        `Hello ${guestFullName}, your room is reserved and your booking has been received!`,
        ``,
        `*Booking Ref:* ${reservation.confirmationCode}`,
        `*Accommodation:* ${reservation.roomType?.name || 'Room'} (Unit ${reservation.room?.number || 'Assigned'})`,
        `*Guests:* ${reservation.adultsCount || 1}`,
        `*Check-In:* ${checkInStr} (2:00 PM)`,
        `*Check-Out:* ${checkOutStr} (11:00 AM)`,
        `*Total Amount:* $${Number(reservation.totalAmount).toFixed(2)}`,
        `*Status:* ${reservation.status}`,
        ``,
        `Please present your booking reference *${reservation.confirmationCode}* at the Front Desk upon arrival. We look forward to welcoming you!`
      ].join('\n');

      if (process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID && normalizedWa) {
        const res = await fetch(`https://graph.facebook.com/v17.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: normalizedWa,
            type: "text",
            text: { body: msg }
          })
        });

        const status = res.ok ? 'SENT' : 'FAILED';
        await this.prisma.notificationLog.create({
          data: {
            reservationId: reservation.id,
            type: 'WHATSAPP',
            recipient: normalizedWa,
            status,
            errorMessage: res.ok ? null : await res.text()
          }
        });
      } else if (process.env.WHATSAPP_WEBHOOK_URL && normalizedWa) {
        const res = await fetch(process.env.WHATSAPP_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: normalizedWa,
            message: msg,
            reservationCode: reservation.confirmationCode,
          }),
        });
        await this.prisma.notificationLog.create({
          data: {
            reservationId: reservation.id,
            type: 'WHATSAPP',
            recipient: normalizedWa,
            status: res.ok ? 'SENT' : 'FAILED',
            errorMessage: res.ok ? null : await res.text()
          }
        });
      }
    } catch (e) {
      this.logger.error('WhatsApp error:', e);
    }

    // C. Admin Notification
    try {
      if (process.env.RESEND_API_KEY && process.env.ADMIN_EMAIL) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: process.env.HOTEL_EMAIL || 'reservations@kwaleebeachresort.com',
            to: process.env.ADMIN_EMAIL,
            subject: `New Website Booking: ${reservation.confirmationCode}`,
            html: `<p>New booking received from <strong>${guestFullName}</strong> (${reservation.guest?.email}, ${guestWaRaw}) for ${reservation.roomType?.name} (${checkInStr} to ${checkOutStr}). Total: $${Number(reservation.totalAmount).toFixed(2)}.</p>`
          })
        });
        await this.prisma.notificationLog.create({
          data: {
            reservationId: reservation.id,
            type: 'ADMIN_EMAIL',
            recipient: process.env.ADMIN_EMAIL,
            status: 'SENT'
          }
        });
      }
    } catch (e) {}
  }

  async getDigitalMenu() {
    return this.prisma.posCategory.findMany({
      include: {
        items: {
          where: { isAvailable: true },
          select: { id: true, name: true, description: true, price: true, type: true, image: true, images: true }
        }
      }
    });
  }

  async createMenuOrder(dto: CreateMenuOrderDto) {
    const room = await this.prisma.room.findFirst({ where: { number: dto.roomNumber } });
    if (!room) throw new BadRequestException('Room not found');
    const reservation = await this.prisma.reservation.findFirst({
      where: { roomId: room.id, status: 'CHECKED_IN' },
      include: { folio: true }
    });
    if (!reservation || !reservation.folio) throw new BadRequestException('No active folio found');
    
    let totalAmount = 0;
    const orderItemsData = [];
    for (const item of dto.items) {
      const menuItem = await this.prisma.posMenuItem.findUnique({ where: { id: item.menuItemId } });
      if (!menuItem) throw new BadRequestException('Item not found');
      totalAmount += (Number(menuItem.price) * item.quantity);
      orderItemsData.push({ menuItemId: menuItem.id, quantity: item.quantity, notes: item.notes, status: 'PENDING' });
    }

    const posOrder = await this.prisma.posOrder.create({
      data: { status: 'OPEN', totalAmount, folioId: reservation.folio.id, items: { create: orderItemsData } },
      include: { items: true }
    });
    return { success: true, orderId: posOrder.id, message: 'Order placed!' };
  }

  async getEventSpaces() {
    return this.prisma.eventSpace.findMany({ where: { isActive: true }, });
  }

  async createEventBooking(dto: CreateEventBookingDto) {
    let space = dto.spaceId ? await this.prisma.eventSpace.findUnique({ where: { id: dto.spaceId } }) : null;
    const matchedActivity = (!space && dto.spaceId)
      ? await this.prisma.activity.findUnique({ where: { id: dto.spaceId } })
      : null;

    if (!space) {
      space = await this.prisma.eventSpace.findFirst({ where: { isActive: true } });
    }
    if (!space) {
      space = await this.prisma.eventSpace.findFirst();
    }
    if (!space) throw new BadRequestException('No event spaces available in the system.');

    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);
    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime()) || startTime >= endTime) {
      throw new BadRequestException('Invalid start or end time. End time must be after start time.');
    }

    const attendeesCount = Math.max(1, Number(dto.attendeesCount || 1));
    let totalAmount = 0;
    if (matchedActivity) {
      totalAmount = Number(matchedActivity.price || 0) * attendeesCount;
    } else {
      const hours = Math.max(1, Math.ceil((endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)));
      const unitPrice = Number(space.pricePerHour || space.pricePerDay || 50);
      totalAmount = unitPrice * hours;
    }

    const booking = await this.prisma.eventBooking.create({
      data: {
        spaceId: space.id,
        guestName: dto.guestName,
        guestEmail: dto.guestEmail && dto.guestEmail.trim() !== '' ? dto.guestEmail.trim() : null,
        guestPhone: dto.guestPhone,
        eventType: dto.eventType || (matchedActivity ? `Activity: ${matchedActivity.name}` : space.name) || 'Event Reservation',
        attendeesCount,
        startTime,
        endTime,
        totalAmount,
        status: 'PENDING',
        specialRequests: dto.specialRequests || null,
      }
    });

    return { success: true, bookingId: booking.id, message: 'Event booking request submitted successfully.' };
  }
}
