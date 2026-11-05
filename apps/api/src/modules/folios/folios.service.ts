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
            roomType: true,
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
    try {
      // 1. Auto-heal: Ensure any CHECKED_IN reservation has an OPEN folio
      const checkedInWithoutFolio = await this.prisma.reservation.findMany({
        where: {
          status: 'CHECKED_IN',
          folio: null,
        },
        include: {
          roomType: true,
        },
      });

      for (const res of checkedInWithoutFolio) {
        const checkInTime = new Date(res.checkInDate).getTime();
        const checkOutTime = new Date(res.checkOutDate).getTime();
        let nights = Math.ceil((checkOutTime - checkInTime) / (1000 * 60 * 60 * 24));
        if (nights < 1) nights = 1;

        let roomsCount = 1;
        const matchRooms = (res.specialRequests || '').match(/\[Requested Accommodations:\s*(\d+)/i);
        if (matchRooms && matchRooms[1]) {
          roomsCount = Math.max(1, parseInt(matchRooms[1], 10) || 1);
        }

        const baseRate = Number(res.roomType?.baseRateUsd || 0);
        const roomChargeTotal = nights * baseRate * roomsCount;

        const activities = await this.prisma.bookingActivity.findMany({
          where: { reservationId: res.id },
          include: { activity: true }
        });
        let activitiesTotal = 0;
        for (const act of activities) {
          activitiesTotal += Number(act.totalPrice);
        }

        const newFolio = await this.prisma.folio.create({
          data: {
            reservationId: res.id,
            status: 'OPEN',
            balance: roomChargeTotal + activitiesTotal,
          },
        });

        await this.prisma.folioLineItem.create({
          data: {
            folioId: newFolio.id,
            type: 'CHARGE',
            category: 'ROOM',
            amount: roomChargeTotal,
            description: roomsCount > 1
              ? `Room Charge (${roomsCount} accommodations × ${nights} night(s) @ $${baseRate.toFixed(2)})`
              : `Room Charge (${nights} night(s) @ $${baseRate.toFixed(2)})`,
            referenceCode: res.confirmationCode,
          },
        });

        for (const act of activities) {
          const catMap = { 'TOUR': 'TOUR', 'EVENT': 'EVENT', 'PACKAGE': 'PACKAGE', 'ACTIVITY': 'ACTIVITY' };
          await this.prisma.folioLineItem.create({
            data: {
              folioId: newFolio.id,
              type: 'CHARGE',
              category: (catMap as any)[act.activity.type] || 'OTHER',
              amount: Number(act.totalPrice),
              description: `${act.activity.type.charAt(0).toUpperCase() + act.activity.type.slice(1).toLowerCase()}: ${act.activity.name} (Qty: ${act.quantity})`,
              referenceCode: res.confirmationCode,
            },
          });
        }
      }

      // 2. Auto-heal: Reopen any CLOSED folio that still has a positive pending balance (> 0)
      await this.prisma.folio.updateMany({
        where: {
          status: 'CLOSED',
          balance: { gt: 0 },
        },
        data: {
          status: 'OPEN',
        },
      });
    } catch (e) {
      // Non-blocking auto-heal
    }

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
            roomType: true,
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
      const folio = await tx.folio.findUnique({
        where: { id: folioId },
        include: { reservation: true },
      });
      if (!folio) throw new NotFoundException(`Folio not found`);
      if (folio.status === 'CLOSED') return folio;
      if (Number(folio.balance) > 0) {
        throw new BadRequestException('Cannot close a folio with an unpaid balance greater than $0.00.');
      }

      if (folio.reservation && folio.reservation.status === 'CHECKED_IN') {
        await tx.reservation.update({
          where: { id: folio.reservation.id },
          data: { status: 'CHECKED_OUT' },
        });
        if (folio.reservation.roomId) {
          const room = await tx.room.findUnique({ where: { id: folio.reservation.roomId } });
          if (room && room.status !== 'DIRTY') {
            await tx.room.update({
              where: { id: folio.reservation.roomId },
              data: { status: 'DIRTY' },
            });
            await tx.roomStatusHistory.create({
              data: {
                roomId: folio.reservation.roomId,
                previousStatus: room.status,
                newStatus: 'DIRTY',
                reason: `Folio closed / check-out for reservation ${folio.reservation.confirmationCode}`,
                changedById: userId,
              },
            });
          }
        }
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