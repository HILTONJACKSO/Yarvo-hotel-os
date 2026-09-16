import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateChargeDto } from './dto/create-charge.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class FoliosService {
  constructor(private readonly prisma: PrismaService) {}

  async getStatement(folioId: string) {
    const folio = await this.prisma.folio.findUnique({
      where: { id: folioId },
      include: {
        reservation: {
          include: {
            guest: true,
            room: true,
          }
        },
        lineItems: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!folio) {
      throw new NotFoundException(`Folio with ID ${folioId} not found`);
    }

    return folio;
  }

  async getAllFolios(status?: 'OPEN' | 'CLOSED') {
    const where: any = {};
    if (status) {
      where.status = status;
    }

    return this.prisma.folio.findMany({
      where,
      include: {
        reservation: {
          include: {
            guest: true,
            room: true,
          }
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async postCharge(folioId: string, chargeDto: CreateChargeDto, userId?: string) {
    if (chargeDto.amount <= 0) {
      throw new BadRequestException('Charge amount must be greater than 0');
    }

    return this.prisma.$transaction(async (tx) => {
      const folio = await tx.folio.findUnique({ where: { id: folioId } });
      if (!folio) throw new NotFoundException(`Folio not found`);
      if (folio.status === 'CLOSED') throw new BadRequestException('Cannot post charges to a closed folio.');

      // 1. Create the Line Item
      const lineItem = await tx.folioLineItem.create({
        data: {
          folioId,
          type: 'CHARGE',
          category: chargeDto.category,
          amount: new Prisma.Decimal(chargeDto.amount),
          description: chargeDto.description,
          referenceCode: chargeDto.referenceCode,
          createdById: userId,
        },
      });

      // 2. Update Folio Balance (Add charge amount to balance)
      await tx.folio.update({
        where: { id: folioId },
        data: {
          balance: { increment: chargeDto.amount },
        },
      });

      return lineItem;
    });
  }

  async postPayment(folioId: string, paymentDto: CreatePaymentDto, userId?: string) {
    if (paymentDto.amount <= 0) {
      throw new BadRequestException('Payment amount must be greater than 0');
    }

    return this.prisma.$transaction(async (tx) => {
      const folio = await tx.folio.findUnique({ where: { id: folioId } });
      if (!folio) throw new NotFoundException(`Folio not found`);
      if (folio.status === 'CLOSED') throw new BadRequestException('Cannot post payments to a closed folio.');

      // 1. Create the Line Item (Negative amount for standard accounting, or just keep type=PAYMENT and decrement)
      const lineItem = await tx.folioLineItem.create({
        data: {
          folioId,
          type: 'PAYMENT',
          category: paymentDto.category,
          // Storing amount as positive in the DB for the line item itself (standard POS convention)
          amount: new Prisma.Decimal(paymentDto.amount), 
          description: paymentDto.description,
          referenceCode: paymentDto.referenceCode,
          createdById: userId,
        },
      });

      // 2. Update Folio Balance (Subtract payment amount from balance)
      await tx.folio.update({
        where: { id: folioId },
        data: {
          balance: { decrement: paymentDto.amount },
        },
      });

      return lineItem;
    });
  }
  async closeFolio(folioId: string, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const folio = await tx.folio.findUnique({ where: { id: folioId } });
      if (!folio) throw new NotFoundException(`Folio not found`);
      if (folio.status === 'CLOSED') throw new BadRequestException('Folio is already closed.');
      if (Number(folio.balance) !== 0) {
         throw new BadRequestException('Cannot close a folio with a non-zero balance.');
      }

      return tx.folio.update({
        where: { id: folioId },
        data: { status: 'CLOSED' }
      });
    });
  }
  async postDiscount(folioId: string, paymentDto: CreatePaymentDto, userId?: string) {
    if (paymentDto.amount <= 0) {
      throw new BadRequestException('Discount amount must be greater than 0');
    }

    return this.prisma.$transaction(async (tx) => {
      const folio = await tx.folio.findUnique({ where: { id: folioId } });
      if (!folio) throw new NotFoundException(`Folio not found`);
      if (folio.status === 'CLOSED') throw new BadRequestException('Cannot post discounts to a closed folio.');

      // 1. Create the Line Item
      const lineItem = await tx.folioLineItem.create({
        data: {
          folioId,
          type: 'ADJUSTMENT',
          category: 'OTHER',
          amount: new Prisma.Decimal(paymentDto.amount * -1), // Negative amount for discount logic or positive depending on UI? Wait, postPayment did positive, but balance decrements. For ADJUSTMENT, if we decrement balance, we might as well keep it positive in LineItem or negative. I will keep it positive for consistency and decrement the folio balance.
          description: paymentDto.description || 'Discount',
          referenceCode: paymentDto.referenceCode,
          createdById: userId,
        },
      });

      // 2. Update Folio Balance (Subtract discount amount from balance)
      await tx.folio.update({
        where: { id: folioId },
        data: {
          balance: { decrement: paymentDto.amount },
        },
      });

      return lineItem;
    });
  }
}