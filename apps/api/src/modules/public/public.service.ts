import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';

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
}
