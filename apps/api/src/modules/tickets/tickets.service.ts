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
        status: { in: ['VALID', 'USED'] },
      }
    });

    const totalTickets = tickets.length;
    const totalRevenue = tickets.reduce((sum, t) => sum + Number(t.price), 0);
    
    // Entry Breakdown
    const entryAdults = tickets.filter(t => t.type.toUpperCase().includes('ENTRY') && t.type.toUpperCase().includes('ADULT'));
    const entryKids = tickets.filter(t => t.type.toUpperCase().includes('ENTRY') && (t.type.toUpperCase().includes('KID') || t.type.toUpperCase().includes('CHILD')));
    
    // Pool Breakdown
    const poolAdults = tickets.filter(t => t.type.toUpperCase().includes('POOL') && t.type.toUpperCase().includes('ADULT'));
    const poolKids = tickets.filter(t => t.type.toUpperCase().includes('POOL') && (t.type.toUpperCase().includes('KID') || t.type.toUpperCase().includes('CHILD')));
    
    const breakdown = {
      entryAdults: { count: entryAdults.length, revenue: entryAdults.reduce((sum, t) => sum + Number(t.price), 0) },
      entryKids: { count: entryKids.length, revenue: entryKids.reduce((sum, t) => sum + Number(t.price), 0) },
      poolAdults: { count: poolAdults.length, revenue: poolAdults.reduce((sum, t) => sum + Number(t.price), 0) },
      poolKids: { count: poolKids.length, revenue: poolKids.reduce((sum, t) => sum + Number(t.price), 0) }
    };
    
    return { totalOrders: totalTickets, totalRevenue, breakdown };
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

