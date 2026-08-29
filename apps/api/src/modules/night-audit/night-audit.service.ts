import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class NightAuditService {
  constructor(private readonly prisma: PrismaService) {}

  async runAudit(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already run for today
    const existing = await this.prisma.nightAudit.findFirst({
      where: {
        auditDate: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      }
    });

    if (existing && existing.status === 'COMPLETED') {
      throw new BadRequestException('Night audit already completed for today.');
    }

    const audit = await this.prisma.nightAudit.create({
      data: {
        auditDate: today,
        status: 'STARTED',
        performedById: userId,
      }
    });

    try {
      // 1. Post Room Charges
      const checkedInReservations = await this.prisma.reservation.findMany({
        where: { status: 'CHECKED_IN' },
        include: { roomType: { include: { taxes: true } }, folio: true }
      });

      let postedCount = 0;
      let totalPostedAmount = 0;

      for (const res of checkedInReservations) {
        if (res.folio && res.folio.status === 'OPEN') {
          const rate = Number(res.roomType.baseRateUsd);
          
          let taxAmount = 0;
          if (res.roomType.taxes) {
            for (const tax of res.roomType.taxes) {
              if (tax.isActive) {
                if (tax.type === 'PERCENTAGE') {
                  taxAmount += rate * (Number(tax.rate) / 100);
                } else if (tax.type === 'FLAT_AMOUNT') {
                  taxAmount += Number(tax.rate);
                }
              }
            }
          }
          
          const totalCharge = rate + taxAmount;
          
          await this.prisma.folioLineItem.create({
            data: {
              folioId: res.folio.id,
              type: 'CHARGE',
              category: 'ROOM',
              amount: totalCharge,
              description: `Night Audit Room Charge for ${today.toLocaleDateString()}` + (taxAmount > 0 ? ` (Inc. Tax: $${taxAmount.toFixed(2)})` : ''),
              createdById: userId
            }
          });
          
          await this.prisma.folio.update({
            where: { id: res.folio.id },
            data: { balance: { increment: totalCharge } }
          });

          postedCount++;
          totalPostedAmount += totalCharge;
        }
      }

      // 2. Calculate daily aggregates
      const startOfDay = today;
      const endOfDay = new Date(today.getTime() + 24 * 60 * 60 * 1000);

      const roomRevAggr = await this.prisma.folioLineItem.aggregate({
        _sum: { amount: true },
        where: { type: 'CHARGE', category: 'ROOM', createdAt: { gte: startOfDay, lt: endOfDay } }
      });

      const fbRevAggr = await this.prisma.posOrder.aggregate({
        _sum: { totalAmount: true },
        where: { status: 'PAID', createdAt: { gte: startOfDay, lt: endOfDay } }
      });

      const paymentsAggr = await this.prisma.folioLineItem.aggregate({
        _sum: { amount: true },
        where: { type: 'PAYMENT', createdAt: { gte: startOfDay, lt: endOfDay } }
      });

      // 3. Mark Completed
      const completedAudit = await this.prisma.nightAudit.update({
        where: { id: audit.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          totalRoomRevenue: roomRevAggr._sum.amount || 0,
          totalFbRevenue: fbRevAggr._sum.totalAmount || 0,
          totalPayments: paymentsAggr._sum.amount || 0,
          notes: `Posted charges for ${postedCount} rooms. Total room charge amount: $${totalPostedAmount.toFixed(2)}`
        }
      });

      return completedAudit;
    } catch (err: any) {
      await this.prisma.nightAudit.update({
        where: { id: audit.id },
        data: { status: 'FAILED', notes: err.message }
      });
      throw new BadRequestException(`Night Audit failed: ${err.message}`);
    }
  }

  async getHistory() {
    return this.prisma.nightAudit.findMany({
      orderBy: { auditDate: 'desc' },
      include: {
        user: { select: { firstName: true, lastName: true } }
      }
    });
  }
}

