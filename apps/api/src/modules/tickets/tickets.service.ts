import { Injectable, NotFoundException } from '@nestjs/common';
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
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    return this.prisma.ticket.update({
      where: { id },
      data: { status: 'USED' },
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

