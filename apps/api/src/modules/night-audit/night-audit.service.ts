import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class NightAuditService {
  constructor(private readonly prisma: PrismaService) {}

  private isBoutiqueMenuItem(menuItem: any): boolean {
    if (!menuItem) return false;
    const itemType = (menuItem.type || '').toUpperCase();
    if (itemType === 'MERCHANDISE' || itemType === 'BOUTIQUE') return true;
    const catName = (menuItem.category?.name || '').toLowerCase();
    if (
      catName.includes('boutique') ||
      catName.includes('merchandise') ||
      catName.includes('shop') ||
      catName.includes('gift') ||
      catName.includes('souvenir')
    ) {
      return true;
    }
    if (Array.isArray(menuItem.recipes)) {
      for (const r of menuItem.recipes) {
        const invCat = (r.inventoryItem?.category || '').toUpperCase();
        if (invCat.includes('BOUTIQUE') || Number(r.inventoryItem?.stockBoutique || 0) > 0) {
          return true;
        }
      }
    }
    return false;
  }

  async calculateDailyBreakdown(auditDate: Date) {
    const d = new Date(auditDate);
    const startOfDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));

    // 1. Room Revenue (Payments made on checked-in / checked-out room folios on this date)
    const folioPayments = await this.prisma.folioLineItem.findMany({
      where: {
        type: 'PAYMENT',
        createdAt: { gte: startOfDay, lte: endOfDay },
        folio: {
          reservation: {
            status: { in: ['CHECKED_IN', 'CHECKED_OUT'] },
          },
        },
      },
    });
    const roomRevenue = folioPayments.reduce((sum, p) => sum + Math.abs(Number(p.amount || 0)), 0);

    // 2. POS Orders -> Split into F&B Revenue vs Boutique Revenue
    const posOrders = await this.prisma.posOrder.findMany({
      where: {
        status: { not: 'CANCELLED' },
        OR: [
          { status: 'PAID', updatedAt: { gte: startOfDay, lte: endOfDay } },
          { payments: { some: { createdAt: { gte: startOfDay, lte: endOfDay } } } },
        ],
      },
      include: {
        payments: true,
        items: {
          include: {
            menuItem: {
              include: {
                category: true,
                recipes: { include: { inventoryItem: true } },
              },
            },
            returnRequest: true,
          },
        },
      },
    });

    let fbRevenue = 0;
    let boutiqueRevenue = 0;

    for (const order of posOrders) {
      const activeItems = (order.items || []).filter((item) => {
        if (['CANCELLED', 'RETURNED', 'RETURN_REQUESTED'].includes(item.status)) return false;
        if (item.returnRequest && item.returnRequest.status !== 'REJECTED') return false;
        return true;
      });
      if (activeItems.length === 0) continue;

      const orderGross = activeItems.reduce(
        (sum, it) => sum + Number(it.menuItem?.price || 0) * (it.quantity || 1),
        0,
      );
      if (orderGross <= 0) continue;

      // Determine how much was collected on this day for this order
      const paymentsToday = (order.payments || [])
        .filter((p) => {
          const pt = new Date(p.createdAt);
          return pt >= startOfDay && pt <= endOfDay;
        })
        .reduce((sum, p) => sum + Number(p.amount || 0), 0);

      const discount = Number(order.discountAmount || 0);
      const netOrderTotal = Math.max(0, orderGross - discount);
      const collectedForOrder =
        paymentsToday > 0
          ? Math.min(netOrderTotal, paymentsToday)
          : order.status === 'PAID'
            ? netOrderTotal
            : 0;

      if (collectedForOrder <= 0) continue;

      const boutiqueGross = activeItems
        .filter((it) => this.isBoutiqueMenuItem(it.menuItem))
        .reduce((sum, it) => sum + Number(it.menuItem?.price || 0) * (it.quantity || 1), 0);
      const fbGross = Math.max(0, orderGross - boutiqueGross);

      const boutiqueShare = (boutiqueGross / orderGross) * collectedForOrder;
      const fbShare = (fbGross / orderGross) * collectedForOrder;

      boutiqueRevenue += boutiqueShare;
      fbRevenue += fbShare;
    }

    // 3. Entry & Pool Tickets Revenue
    const tickets = await this.prisma.ticket.findMany({
      where: {
        issueDate: { gte: startOfDay, lte: endOfDay },
        status: { in: ['VALID', 'USED'] },
      },
    });

    let entryTicketRevenue = 0;
    let poolTicketRevenue = 0;
    for (const t of tickets) {
      const price = Number(t.price || 0);
      if ((t.type || '').toLowerCase().includes('pool')) {
        poolTicketRevenue += price;
      } else {
        entryTicketRevenue += price;
      }
    }
    const totalTicketRevenue = entryTicketRevenue + poolTicketRevenue;

    // 4. Events Revenue vs Activities, Tours & Packages Revenue
    const eventBookings = await this.prisma.eventBooking.findMany({
      where: {
        status: { in: ['CONFIRMED', 'COMPLETED'] },
        OR: [
          { createdAt: { gte: startOfDay, lte: endOfDay } },
          { startTime: { gte: startOfDay, lte: endOfDay } },
        ],
      },
    });

    let eventsRevenue = 0;
    let activitiesRevenue = 0;

    for (const eb of eventBookings) {
      const et = (eb.eventType || '').toLowerCase();
      const amt = Number(eb.amountPaid || 0) > 0 ? Number(eb.amountPaid) : Number(eb.totalAmount || 0);
      if (et.startsWith('activity:') || et.startsWith('tour:') || et.startsWith('package:')) {
        activitiesRevenue += amt;
      } else {
        eventsRevenue += amt;
      }
    }

    // Also include BookingActivity & FolioLineItem (TOUR, ACTIVITY, PACKAGE) for the day
    const bookingActivities = await this.prisma.bookingActivity.findMany({
      where: {
        createdAt: { gte: startOfDay, lte: endOfDay },
        reservation: { status: { in: ['CHECKED_IN', 'CHECKED_OUT'] } },
      },
      include: { reservation: true, activity: true },
    });

    const seenActivityRefs = new Set<string>();
    for (const ba of bookingActivities) {
      const amt = Number(ba.totalPrice || 0);
      activitiesRevenue += amt;
      if (ba.reservation?.confirmationCode) {
        seenActivityRefs.add(`${ba.reservation.confirmationCode}:${amt.toFixed(2)}`);
      }
    }

    const folioActivityItems = await this.prisma.folioLineItem.findMany({
      where: {
        type: 'CHARGE',
        category: { in: ['TOUR', 'ACTIVITY', 'PACKAGE'] },
        createdAt: { gte: startOfDay, lte: endOfDay },
      },
    });
    for (const fa of folioActivityItems) {
      const amt = Math.abs(Number(fa.amount || 0));
      const key = `${fa.referenceCode || ''}:${amt.toFixed(2)}`;
      if (fa.referenceCode && seenActivityRefs.has(key)) continue;
      activitiesRevenue += amt;
    }

    // 5. Discounts
    const folioDiscountsAggr = await this.prisma.folioLineItem.aggregate({
      _sum: { amount: true },
      where: {
        OR: [
          { type: 'ADJUSTMENT' },
          { description: { contains: 'Discount', mode: 'insensitive' } },
        ],
        createdAt: { gte: startOfDay, lte: endOfDay },
      },
    });
    const posDiscountsAggr = await this.prisma.posOrder.aggregate({
      _sum: { discountAmount: true },
      where: { updatedAt: { gte: startOfDay, lte: endOfDay } },
    });
    const totalDiscounts =
      Math.abs(Number(folioDiscountsAggr._sum.amount || 0)) +
      Number(posDiscountsAggr._sum.discountAmount || 0);

    const totalPayments =
      roomRevenue +
      fbRevenue +
      boutiqueRevenue +
      totalTicketRevenue +
      eventsRevenue +
      activitiesRevenue;

    return {
      roomRevenue: Number(roomRevenue.toFixed(2)),
      fbRevenue: Number(fbRevenue.toFixed(2)),
      boutiqueRevenue: Number(boutiqueRevenue.toFixed(2)),
      entryTicketRevenue: Number(entryTicketRevenue.toFixed(2)),
      poolTicketRevenue: Number(poolTicketRevenue.toFixed(2)),
      totalTicketRevenue: Number(totalTicketRevenue.toFixed(2)),
      eventsRevenue: Number(eventsRevenue.toFixed(2)),
      activitiesRevenue: Number(activitiesRevenue.toFixed(2)),
      totalDiscounts: Number(totalDiscounts.toFixed(2)),
      totalPayments: Number(totalPayments.toFixed(2)),
    };
  }

  async runAudit(userId: string) {
    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

    let audit = await this.prisma.nightAudit.findFirst({
      where: {
        auditDate: {
          gte: today,
          lte: endOfDay,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!audit) {
      audit = await this.prisma.nightAudit.create({
        data: {
          auditDate: today,
          status: 'STARTED',
          performedById: userId,
        },
      });
    }

    try {
      // 1. Post nightly Room Charges for any CHECKED_IN guest not yet charged by Night Audit today
      const checkedInReservations = await this.prisma.reservation.findMany({
        where: { status: 'CHECKED_IN' },
        include: {
          roomType: { include: { taxes: true } },
          folio: { include: { lineItems: true } },
        },
      });

      let postedCount = 0;
      let totalPostedAmount = 0;

      for (const res of checkedInReservations) {
        if (res.folio && res.folio.status === 'OPEN') {
          const alreadyPostedToday = (res.folio.lineItems || []).some(
            (li) =>
              li.type === 'CHARGE' &&
              li.category === 'ROOM' &&
              new Date(li.createdAt) >= today &&
              (li.description || '').startsWith('Night Audit Room Charge'),
          );
          if (alreadyPostedToday) continue;

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

          const totalCharge = rate;

          await this.prisma.folioLineItem.create({
            data: {
              folioId: res.folio.id,
              type: 'CHARGE',
              category: 'ROOM',
              amount: totalCharge,
              description:
                `Night Audit Room Charge for ${today.toISOString().split('T')[0]}` +
                (taxAmount > 0 ? ` (Inc. Tax: $${taxAmount.toFixed(2)})` : ''),
              createdById: userId,
            },
          });

          await this.prisma.folio.update({
            where: { id: res.folio.id },
            data: { balance: { increment: totalCharge } },
          });

          postedCount++;
          totalPostedAmount += totalCharge;
        }
      }

      // 2. Calculate all daily revenue aggregates (Room, F&B, Boutique, Entry, Pool, Events, Activities/Tours/Packages)
      const breakdown = await this.calculateDailyBreakdown(today);

      const completedAudit = await this.prisma.nightAudit.update({
        where: { id: audit.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          performedById: userId,
          totalRoomRevenue: breakdown.roomRevenue,
          totalFbRevenue: breakdown.fbRevenue,
          totalPayments: breakdown.totalPayments,
          totalTicketRevenue: breakdown.totalTicketRevenue,
          totalDiscounts: breakdown.totalDiscounts,
          notes: JSON.stringify({
            __isNightAuditBreakdown: true,
            ...breakdown,
            postedCount,
            totalPostedAmount,
          }),
        },
        include: {
          user: { select: { firstName: true, lastName: true } },
        },
      });

      return {
        ...completedAudit,
        breakdown,
      };
    } catch (err: any) {
      await this.prisma.nightAudit.update({
        where: { id: audit.id },
        data: { status: 'FAILED', notes: err.message },
      });
      throw new BadRequestException(`Night Audit failed: ${err.message}`);
    }
  }

  async getHistory(start?: string, end?: string) {
    const where: any = {};
    if (start && end) {
      where.auditDate = {
        gte: new Date(`${start.split('T')[0]}T00:00:00.000Z`),
        lte: new Date(`${end.split('T')[0]}T23:59:59.999Z`),
      };
    }
    const audits = await this.prisma.nightAudit.findMany({
      where,
      orderBy: { auditDate: 'desc' },
      include: {
        user: { select: { firstName: true, lastName: true } },
      },
    });

    const enriched = await Promise.all(
      audits.map(async (a) => {
        const liveBreakdown = await this.calculateDailyBreakdown(a.auditDate);
        return {
          ...a,
          totalRoomRevenue: liveBreakdown.roomRevenue,
          totalFbRevenue: liveBreakdown.fbRevenue,
          totalBoutiqueRevenue: liveBreakdown.boutiqueRevenue,
          totalEntryTicketRevenue: liveBreakdown.entryTicketRevenue,
          totalPoolTicketRevenue: liveBreakdown.poolTicketRevenue,
          totalTicketRevenue: liveBreakdown.totalTicketRevenue,
          totalEventsRevenue: liveBreakdown.eventsRevenue,
          totalActivitiesRevenue: liveBreakdown.activitiesRevenue,
          totalPayments: liveBreakdown.totalPayments,
          breakdown: liveBreakdown,
        };
      }),
    );

    return enriched;
  }
}
