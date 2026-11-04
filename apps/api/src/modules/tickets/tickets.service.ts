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

  
  
  async getDailyStats(startDate?: string, endDate?: string) {
    const whereClause: any = {
      status: { in: ['VALID', 'USED'] },
    };

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        const start = new Date(`${startDate}T00:00:00.000`);
        if (!isNaN(start.getTime())) whereClause.createdAt.gte = start;
      }
      if (endDate) {
        const end = new Date(`${endDate}T23:59:59.999`);
        if (!isNaN(end.getTime())) whereClause.createdAt.lte = end;
      }
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      whereClause.createdAt = { gte: today };
    }

    const tickets = await this.prisma.ticket.findMany({
      where: whereClause,
    });

    const totalTickets = tickets.length;
    const totalRevenue = tickets.reduce((sum, t) => sum + Number(t.price), 0);
    
    // Entry Breakdown
    const entryAll = tickets.filter(t => t.type.toUpperCase().includes('ENTRY'));
    const entryAdults = entryAll.filter(t => t.type.toUpperCase().includes('ADULT') || (!t.type.toUpperCase().includes('KID') && !t.type.toUpperCase().includes('CHILD')));
    const entryKids = entryAll.filter(t => t.type.toUpperCase().includes('KID') || t.type.toUpperCase().includes('CHILD'));
    
    // Pool Breakdown
    const poolAll = tickets.filter(t => t.type.toUpperCase().includes('POOL') || t.type.toUpperCase().includes('SWIM'));
    const poolAdults = poolAll.filter(t => t.type.toUpperCase().includes('ADULT') || (!t.type.toUpperCase().includes('KID') && !t.type.toUpperCase().includes('CHILD')));
    const poolKids = poolAll.filter(t => t.type.toUpperCase().includes('KID') || t.type.toUpperCase().includes('CHILD'));
    
    const totalEntryCount = entryAll.length;
    const totalEntryRevenue = entryAll.reduce((sum, t) => sum + Number(t.price), 0);
    const totalPoolCount = poolAll.length;
    const totalPoolRevenue = poolAll.reduce((sum, t) => sum + Number(t.price), 0);

    const breakdown = {
      entryAdults: { count: entryAdults.length, revenue: entryAdults.reduce((sum, t) => sum + Number(t.price), 0) },
      entryKids: { count: entryKids.length, revenue: entryKids.reduce((sum, t) => sum + Number(t.price), 0) },
      poolAdults: { count: poolAdults.length, revenue: poolAdults.reduce((sum, t) => sum + Number(t.price), 0) },
      poolKids: { count: poolKids.length, revenue: poolKids.reduce((sum, t) => sum + Number(t.price), 0) }
    };
    
    return {
      totalOrders: totalTickets,
      totalVisitors: totalTickets,
      totalRevenue,
      totalEntryCount,
      totalEntryRevenue,
      totalPoolCount,
      totalPoolRevenue,
      breakdown,
    };
  }

  async findAll(startDate?: string, endDate?: string) {
    const whereClause: any = {};
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        const start = new Date(`${startDate}T00:00:00.000`);
        if (!isNaN(start.getTime())) whereClause.createdAt.gte = start;
      }
      if (endDate) {
        const end = new Date(`${endDate}T23:59:59.999`);
        if (!isNaN(end.getTime())) whereClause.createdAt.lte = end;
      }
    }

    return this.prisma.ticket.findMany({
      where: whereClause,
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

