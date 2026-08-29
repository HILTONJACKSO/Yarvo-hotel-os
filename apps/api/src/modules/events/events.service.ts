import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateEventSpaceDto, UpdateEventSpaceDto, CreateEventBookingDto, UpdateEventBookingDto } from './dto/event.dto';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  // Event Spaces
  async getSpaces() {
    return this.prisma.eventSpace.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async getSpace(id: string) {
    const space = await this.prisma.eventSpace.findUnique({
      where: { id },
      include: { bookings: true },
    });
    if (!space) throw new NotFoundException('Event space not found');
    return space;
  }

  async createSpace(data: CreateEventSpaceDto) {
    return this.prisma.eventSpace.create({
      data,
    });
  }

  async updateSpace(id: string, data: UpdateEventSpaceDto) {
    return this.prisma.eventSpace.update({
      where: { id },
      data,
    });
  }

  async deleteSpace(id: string) {
    return this.prisma.eventSpace.delete({
      where: { id },
    });
  }

  // Event Bookings
  async getBookings() {
    return this.prisma.eventBooking.findMany({
      include: { space: true },
      orderBy: { startTime: 'desc' },
    });
  }

  async getBooking(id: string) {
    const booking = await this.prisma.eventBooking.findUnique({
      where: { id },
      include: { space: true },
    });
    if (!booking) throw new NotFoundException('Event booking not found');
    return booking;
  }

  async createBooking(data: CreateEventBookingDto) {
    return this.prisma.eventBooking.create({
      data: {
        spaceId: data.spaceId,
        guestName: data.guestName,
        guestEmail: data.guestEmail,
        guestPhone: data.guestPhone,
        eventType: data.eventType,
        attendeesCount: data.attendeesCount,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        status: data.status || 'PENDING',
        totalAmount: data.totalAmount,
        amountPaid: data.amountPaid || 0,
        specialRequests: data.specialRequests,
      },
      include: { space: true },
    });
  }

  async updateBooking(id: string, data: UpdateEventBookingDto) {
    const updateData: any = { ...data };
    if (data.startTime) updateData.startTime = new Date(data.startTime);
    if (data.endTime) updateData.endTime = new Date(data.endTime);
    
    return this.prisma.eventBooking.update({
      where: { id },
      data: updateData,
      include: { space: true },
    });
  }

  async deleteBooking(id: string) {
    return this.prisma.eventBooking.delete({
      where: { id },
    });
  }
}

