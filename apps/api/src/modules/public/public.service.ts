import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CreateMenuOrderDto } from './dto/create-menu-order.dto';
import { CreateEventBookingDto } from './dto/create-event-booking.dto';

@Injectable()
export class PublicService {
  constructor(private prisma: PrismaService) {}

  async getRoomTypes() {
    return this.prisma.roomType.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        code: true,
        description: true,
        maxOccupancy: true,
        maxAdults: true,
        maxChildren: true,
        baseRateUsd: true,
        amenities: true,
        images: true,
      }
    });
  }

  async checkAvailability(checkIn: string, checkOut: string, adults: number) {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkInDate >= checkOutDate) {
      throw new BadRequestException('Check-out date must be after check-in date');
    }

    // Get all active room types
    const roomTypes = await this.prisma.roomType.findMany({
      where: { 
        isActive: true,
        maxAdults: { gte: adults }
      }
    });

    const availability = [];

    for (const rt of roomTypes) {
      // Find all rooms of this type
      const totalRooms = await this.prisma.room.count({
        where: { roomTypeId: rt.id, isActive: true }
      });

      // Find reservations for this room type that overlap with the requested dates
      const overlappingReservations = await this.prisma.reservation.count({
        where: {
          roomTypeId: rt.id,
          status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] },
          AND: [
            { checkInDate: { lt: checkOutDate } },
            { checkOutDate: { gt: checkInDate } }
          ]
        }
      });

      const availableRooms = totalRooms - overlappingReservations;

      if (availableRooms > 0) {
        availability.push({
          roomType: {
            id: rt.id,
            name: rt.name,
            code: rt.code,
            baseRateUsd: rt.baseRateUsd,
            images: rt.images,
          },
          availableRooms
        });
      }
    }

    return availability;
  }

  async createBooking(dto: CreateBookingDto) {
    // 1. Validate dates
    const checkInDate = new Date(dto.checkInDate);
    const checkOutDate = new Date(dto.checkOutDate);

    if (checkInDate >= checkOutDate) {
      throw new BadRequestException('Check-out date must be after check-in date');
    }

    // 2. Find or create guest
    let guest = await this.prisma.guest.findFirst({
      where: { email: dto.email }
    });

    if (!guest) {
      guest = await this.prisma.guest.create({
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email,
          phone: dto.phone,
        }
      });
    }

    // 3. Generate confirmation code
    const confirmationCode = 'BCH-' + Math.random().toString(36).substring(2, 8).toUpperCase();

    // 4. Create reservation
    const reservation = await this.prisma.reservation.create({
      data: {
        confirmationCode,
        guestId: guest.id,
        roomTypeId: dto.roomTypeId,
        checkInDate,
        checkOutDate,
        adultsCount: dto.adultsCount,
        childrenCount: dto.childrenCount || 0,
        specialRequests: dto.specialRequests,
        status: 'PENDING',
      }
    });

    return {
      confirmationCode: reservation.confirmationCode,
      status: reservation.status,
      message: 'Booking submitted successfully. Awaiting confirmation.',
    };
  }

  async getDigitalMenu() {
    return this.prisma.posCategory.findMany({
      include: {
        items: {
          where: { isAvailable: true },
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            type: true,
            image: true,
          }
        }
      }
    });
  }

  async createMenuOrder(dto: CreateMenuOrderDto) {
    // 1. Find room
    const room = await this.prisma.room.findFirst({
      where: { number: dto.roomNumber }
    });

    if (!room) {
      throw new BadRequestException('Room not found');
    }

    // 2. Find active checked-in reservation for this room
    const reservation = await this.prisma.reservation.findFirst({
      where: {
        roomId: room.id,
        status: 'CHECKED_IN'
      },
      include: {
        folio: true
      }
    });

    if (!reservation) {
      throw new BadRequestException('No active check-in found for this room. Please contact front desk.');
    }

    if (!reservation.folio) {
      throw new BadRequestException('No active folio found for this room.');
    }

    // 3. Get menu items to calculate total
    let totalAmount = 0;
    const orderItemsData = [];

    for (const item of dto.items) {
      const menuItem = await this.prisma.posMenuItem.findUnique({
        where: { id: item.menuItemId }
      });
      if (!menuItem) {
        throw new BadRequestException(`Menu item ${item.menuItemId} not found`);
      }
      
      totalAmount += (Number(menuItem.price) * item.quantity);
      
      orderItemsData.push({
        menuItemId: menuItem.id,
        quantity: item.quantity,
        notes: item.notes,
        status: 'PENDING'
      });
    }

    // 4. Create PosOrder
    const posOrder = await this.prisma.posOrder.create({
      data: {
        status: 'OPEN',
        totalAmount,
        folioId: reservation.folio.id,
        items: {
          create: orderItemsData
        }
      },
      include: {
        items: true
      }
    });

    // 5. Post to Folio immediately (since it's a room service order, we can post it or keep it OPEN until fulfilled)
    // For now, we leave it OPEN. The kitchen will see it, prepare it, and once SERVED/BILLED_TO_ROOM, it can hit the folio.
    // Actually, in Yarvo OS, PosOrders hit the folio when they are finalized or billed. 

    return {
      success: true,
      orderId: posOrder.id,
      message: 'Room service order placed successfully. It is being prepared!'
    };
  }

  async getEventSpaces() {
    return this.prisma.eventSpace.findMany({
      where: { isActive: true },
    });
  }

  async createEventBooking(dto: CreateEventBookingDto) {
    const space = await this.prisma.eventSpace.findUnique({ where: { id: dto.spaceId } });
    if (!space) throw new BadRequestException('Event space not found');

    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);
    if (startTime >= endTime) throw new BadRequestException('End time must be after start time');

    // Calculate roughly hours
    const hours = Math.ceil((endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60));
    const totalAmount = Number(space.pricePerHour) * hours;

    const booking = await this.prisma.eventBooking.create({
      data: {
        spaceId: dto.spaceId,
        guestName: dto.guestName,
        guestEmail: dto.guestEmail,
        guestPhone: dto.guestPhone,
        eventType: dto.eventType,
        attendeesCount: dto.attendeesCount,
        startTime,
        endTime,
        totalAmount,
        status: 'PENDING',
        specialRequests: dto.specialRequests,
      }
    });

    return {
      success: true,
      bookingId: booking.id,
      message: 'Event booking request submitted successfully. We will contact you shortly.'
    };
  }

}
