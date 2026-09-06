import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';

@Injectable()
export class TicketsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createTicketDto: CreateTicketDto, userId: string) {
    return this.prisma.ticket.create({
      data: {
        type: createTicketDto.type,
        guestName: createTicketDto.guestName,
        guestPhone: createTicketDto.guestPhone,
        price: createTicketDto.price,
        paymentMethod: createTicketDto.paymentMethod,
        validDate: new Date(createTicketDto.validDate),
        issuedById: userId,
      },
    });
  }

  
  async getDailyStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tickets = await this.prisma.ticket.findMany({
      where: {
        createdAt: { gte: today },
        status: { in: ['USED', 'ISSUED'] },
      }
    });

    const totalTickets = tickets.reduce((sum, t) => sum + t.adultCount + t.childCount, 0);
    const totalRevenue = tickets.reduce((sum, t) => sum + Number(t.totalAmount), 0);
    
    const adultsCount = tickets.reduce((sum, t) => sum + t.adultCount, 0);
    const childrenCount = tickets.reduce((sum, t) => sum + t.childCount, 0);
    
    // Pool vs Entry stats can be deduced if we differentiate ticket types, 
    // but the request is for total ticket revenue and counts.
    
    return { totalOrders: totalTickets, totalRevenue, adultsCount, childrenCount };
  }

  async findAll() {
    return this.prisma.ticket.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { firstName: true, lastName: true } },
      },
    });
  }

    async markAsUsed(id: string) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found');
    if (ticket.status !== 'VALID') throw new BadRequestException(`Cannot use a ticket that is ${ticket.status}`);

    return this.prisma.ticket.update({
      where: { id },
      data: { status: 'USED' },
    });
  }

  async markAsReturned(id: string) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found');
    if (ticket.status === 'USED') throw new BadRequestException('Cannot return a used ticket'); // Use standard error since BadRequestException is not imported yet

    return this.prisma.ticket.update({
      where: { id },
      data: { status: 'RETURNED' },
    });
  }

  // --- Ticket Tiers ---

  async getTiers() {
    return this.prisma.ticketTier.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createTier(data: { name: string; price: number }) {
    return this.prisma.ticketTier.create({
      data: {
        name: data.name,
        price: data.price,
      },
    });
  }

  async deleteTier(id: string) {
    return this.prisma.ticketTier.update({
      where: { id },
      data: { isActive: false },
    });
  }
}

