import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateChargeDto } from './dto/create-charge.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdateLineItemDto } from './dto/update-line-item.dto';
import { Prisma } from '@prisma/client';

export function computeFolioBalance(items: { type: string; amount: any }[]): number {
  let balance = 0;
  for (const item of items) {
    const amt = Math.abs(Number(item.amount));
    if (item.type === 'CHARGE') {
      balance += amt;
    } else if (item.type === 'PAYMENT' || item.type === 'ADJUSTMENT') {
      balance -= amt;
    }
  }
  return Math.round(balance * 100) / 100;
}

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
        lineItems: {
          orderBy: { createdAt: 'asc' },
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

      // 2. Synchronize Folio Balance accurately
      const allItems = await tx.folioLineItem.findMany({ where: { folioId } });
      const newBalance = computeFolioBalance(allItems);
      await tx.folio.update({
        where: { id: folioId },
        data: {
          balance: new Prisma.Decimal(newBalance),
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

      // 1. Create the Line Item
      const lineItem = await tx.folioLineItem.create({
        data: {
          folioId,
          type: 'PAYMENT',
          category: paymentDto.category,
          amount: new Prisma.Decimal(paymentDto.amount), 
          description: paymentDto.description,
          referenceCode: paymentDto.referenceCode,
          createdById: userId,
        },
      });

      // 2. Synchronize Folio Balance accurately
      const allItems = await tx.folioLineItem.findMany({ where: { folioId } });
      const newBalance = computeFolioBalance(allItems);
      await tx.folio.update({
        where: { id: folioId },
        data: {
          balance: new Prisma.Decimal(newBalance),
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
          amount: new Prisma.Decimal(paymentDto.amount * -1),
          description: paymentDto.description ? (paymentDto.description.toLowerCase().startsWith('discount to register -') ? paymentDto.description : `Discount to register - ${paymentDto.description}`) : 'Discount to register - Folio Discount',
          referenceCode: paymentDto.referenceCode,
          createdById: userId,
        },
      });

      // 2. Synchronize Folio Balance accurately
      const allItems = await tx.folioLineItem.findMany({ where: { folioId } });
      const newBalance = computeFolioBalance(allItems);
      await tx.folio.update({
        where: { id: folioId },
        data: {
          balance: new Prisma.Decimal(newBalance),
        },
      });

      return lineItem;
    });
  }

  async updateLineItem(folioId: string, itemId: string, dto: UpdateLineItemDto, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const folio = await tx.folio.findUnique({
        where: { id: folioId },
        include: { lineItems: true },
      });
      if (!folio) throw new NotFoundException('Folio not found');
      if (folio.status === 'CLOSED') throw new BadRequestException('Cannot modify a closed folio.');

      const existingItem = folio.lineItems.find(li => li.id === itemId);
      if (!existingItem) throw new NotFoundException('Line item not found in this folio');

      const dataToUpdate: any = {};
      if (dto.category !== undefined) dataToUpdate.category = dto.category;
      if (dto.type !== undefined) dataToUpdate.type = dto.type;
      if (dto.description !== undefined) dataToUpdate.description = dto.description;
      if (dto.referenceCode !== undefined) dataToUpdate.referenceCode = dto.referenceCode;

      const itemType = dto.type || existingItem.type;
      if (dto.amount !== undefined) {
        if (dto.amount <= 0) throw new BadRequestException('Amount must be greater than 0');
        const absAmount = Math.abs(dto.amount);
        dataToUpdate.amount = itemType === 'ADJUSTMENT' ? new Prisma.Decimal(-absAmount) : new Prisma.Decimal(absAmount);
      }

      await tx.folioLineItem.update({
        where: { id: itemId },
        data: dataToUpdate,
      });

      // Recalculate balance across all line items
      const allItems = await tx.folioLineItem.findMany({ where: { folioId } });
      const newBalance = computeFolioBalance(allItems);

      const updatedFolio = await tx.folio.update({
        where: { id: folioId },
        data: { balance: new Prisma.Decimal(newBalance) },
        include: {
          reservation: {
            include: { guest: true, room: true },
          },
          lineItems: { orderBy: { createdAt: 'asc' } },
        },
      });

      return updatedFolio;
    });
  }

  async deleteLineItem(folioId: string, itemId: string, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const folio = await tx.folio.findUnique({
        where: { id: folioId },
        include: { lineItems: true },
      });
      if (!folio) throw new NotFoundException('Folio not found');
      if (folio.status === 'CLOSED') throw new BadRequestException('Cannot modify a closed folio.');

      const existingItem = folio.lineItems.find(li => li.id === itemId);
      if (!existingItem) throw new NotFoundException('Line item not found in this folio');

      await tx.folioLineItem.delete({
        where: { id: itemId },
      });

      // Recalculate balance
      const allItems = await tx.folioLineItem.findMany({ where: { folioId } });
      const newBalance = computeFolioBalance(allItems);

      const updatedFolio = await tx.folio.update({
        where: { id: folioId },
        data: { balance: new Prisma.Decimal(newBalance) },
        include: {
          reservation: {
            include: { guest: true, room: true },
          },
          lineItems: { orderBy: { createdAt: 'asc' } },
        },
      });

      return updatedFolio;
    });
  }

  async deleteFolio(folioId: string, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const folio = await tx.folio.findUnique({ where: { id: folioId } });
      if (!folio) throw new NotFoundException('Folio not found');

      // Unlink any linked POS orders
      await tx.posOrder.updateMany({
        where: { folioId },
        data: { folioId: null },
      });

      // Delete all line items
      await tx.folioLineItem.deleteMany({
        where: { folioId },
      });

      // Delete the folio
      const deleted = await tx.folio.delete({
        where: { id: folioId },
      });

      return deleted;
    });
  }
}