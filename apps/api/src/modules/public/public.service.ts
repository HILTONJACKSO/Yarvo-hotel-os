import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CreateMenuOrderDto } from './dto/create-menu-order.dto';
import { CreateEventBookingDto } from './dto/create-event-booking.dto';

@Injectable()
export class PublicService {
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

    // 2. Find or create guest
    let guest = await this.prisma.guest.findFirst({ where: { email: dto.email } });
    if (!guest) {
      guest = await this.prisma.guest.create({
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email,
          phone: dto.phone,
          whatsapp: dto.whatsapp || dto.phone,
        }
      });
    } else if (dto.whatsapp && !guest.whatsapp) {
      guest = await this.prisma.guest.update({
        where: { id: guest.id },
        data: { whatsapp: dto.whatsapp }
      });
    }

    // 3. Generate Sequential Booking Reference VC-YYYY-XXXX
    const year = new Date().getFullYear();
    const count = await this.prisma.reservation.count({
      where: { createdAt: { gte: new Date(`${year}-01-01`) } }
    });
    const seq = (count + 1).toString().padStart(4, '0');
    const confirmationCode = `VC-${year}-${seq}`;

    // 4. Calculate total amount
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 3600 * 24));
    const totalAmount = Number(roomType.baseRateUsd) * nights;

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
        specialRequests: dto.specialRequests,
        status: 'CONFIRMED',
        totalAmount: totalAmount,
      },
      include: {
        roomType: true,
        room: true,
        guest: true
      }
    });

    // 6. Send Notifications without awaiting so it doesn't block response
    this.sendNotifications(reservation).catch(err => {
      this.logger.error(`Failed to send notifications for ${confirmationCode}:`, err);
    });

    return {
      confirmationCode: reservation.confirmationCode,
      status: reservation.status,
      message: 'Booking confirmed successfully!',
    };
  }

  private async sendNotifications(reservation: any) {
    // A. Resend Email
    try {
      if (process.env.RESEND_API_KEY) {
        const emailHtml = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1F1F1F;">
            <h2 style="color: #1B2418;">Booking Confirmed!</h2>
            <p>Dear ${reservation.guest.firstName},</p>
            <p>Your booking at <strong>Kwalee Beach Resort</strong> has been received successfully.</p>
            <div style="background: #FAF9F4; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Reservation Number:</strong> ${reservation.confirmationCode}</p>
              <p><strong>Room:</strong> ${reservation.roomType.name} (${reservation.room.number})</p>
              <p><strong>Check-in:</strong> ${reservation.checkInDate.toISOString().split('T')[0]}</p>
              <p><strong>Check-out:</strong> ${reservation.checkOutDate.toISOString().split('T')[0]}</p>
              <p><strong>Total Amount:</strong> $${Number(reservation.totalAmount).toFixed(2)}</p>
              <p><strong>Status:</strong> ${reservation.status}</p>
            </div>
            <p>We look forward to welcoming you.</p>
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
            subject: `Booking Confirmed: ${reservation.confirmationCode}`,
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

    // B. WhatsApp Notification
    try {
      if (process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID && reservation.guest.whatsapp) {
        const msg = `Hello ${reservation.guest.firstName},\n\nYour booking at Kwalee Beach Resort is confirmed!\n\nBooking: ${reservation.confirmationCode}\nRoom: ${reservation.roomType.name}\nCheck-in: ${reservation.checkInDate.toISOString().split('T')[0]}\nCheck-out: ${reservation.checkOutDate.toISOString().split('T')[0]}\nTotal: $${Number(reservation.totalAmount).toFixed(2)}\n\nWe look forward to welcoming you!`;
        
        const res = await fetch(`https://graph.facebook.com/v17.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: reservation.guest.whatsapp.replace(/[^0-9]/g, ''),
            type: "text",
            text: { body: msg }
          })
        });

        const status = res.ok ? 'SENT' : 'FAILED';
        await this.prisma.notificationLog.create({
          data: {
            reservationId: reservation.id,
            type: 'WHATSAPP',
            recipient: reservation.guest.whatsapp,
            status,
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
            subject: `New Booking: ${reservation.confirmationCode}`,
            html: `<p>New booking received from ${reservation.guest.firstName} ${reservation.guest.lastName} for ${reservation.roomType.name}.</p>`
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
          select: { id: true, name: true, description: true, price: true, type: true, image: true, }
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
    const space = await this.prisma.eventSpace.findUnique({ where: { id: dto.spaceId } });
    if (!space) throw new BadRequestException('Event space not found');

    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);
    if (startTime >= endTime) throw new BadRequestException('End time must be after start time');

    const hours = Math.ceil((endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60));
    const totalAmount = Number(space.pricePerHour) * hours;

    const booking = await this.prisma.eventBooking.create({
      data: {
        spaceId: dto.spaceId, guestName: dto.guestName, guestEmail: dto.guestEmail, guestPhone: dto.guestPhone,
        eventType: dto.eventType, attendeesCount: dto.attendeesCount, startTime, endTime, totalAmount,
        status: 'PENDING', specialRequests: dto.specialRequests,
      }
    });

    return { success: true, bookingId: booking.id, message: 'Event booking request submitted successfully.' };
  }
}
