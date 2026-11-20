import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  private computeReservationRoomAmount(res: any): number {
    // 1. Check if folio has explicit ROOM charge line items
    if (res?.folio && Array.isArray(res.folio.lineItems) && res.folio.lineItems.length > 0) {
      let roomCharges = 0;
      let adjustments = 0;
      for (const li of res.folio.lineItems) {
        if (li.type === 'CHARGE' && li.category === 'ROOM') {
          roomCharges += Math.abs(Number(li.amount || 0));
        } else if (li.type === 'ADJUSTMENT') {
          adjustments += Math.abs(Number(li.amount || 0));
        }
      }
      if (roomCharges > 0) {
        return Math.max(0, Math.round((roomCharges - adjustments) * 100) / 100);
      }
    }

    // 2. Check reservation.totalAmount
    const explicitTotal = Number(res?.totalAmount || 0);
    if (explicitTotal > 0) {
      return Math.round(explicitTotal * 100) / 100;
    }

    // 3. Fallback: calculate from roomType baseRateUsd * nights * roomsCount
    const checkInTime = res?.checkInDate ? new Date(res.checkInDate).getTime() : 0;
    const checkOutTime = res?.checkOutDate ? new Date(res.checkOutDate).getTime() : 0;
    let nights = Math.ceil((checkOutTime - checkInTime) / (1000 * 60 * 60 * 24));
    if (!nights || nights < 1) nights = 1;

    let roomsCount = 1;
    const matchRooms = (res?.specialRequests || '').match(/\[Requested Accommodations:\s*(\d+)/i);
    if (matchRooms && matchRooms[1]) {
      roomsCount = Math.max(1, parseInt(matchRooms[1], 10) || 1);
    }

    const baseRate = Number(res?.roomType?.baseRateUsd || 0);
    return Math.round(nights * baseRate * roomsCount * 100) / 100;
  }

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

  async getHotelMetrics(start?: string, end?: string, propertyId?: string) {
    const now = new Date();
    const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const endOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
    const startOfWeek = new Date(startOfToday);
    const day = startOfToday.getUTCDay() || 7;
    startOfWeek.setUTCDate(startOfToday.getUTCDate() - (day - 1));
    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));

    const propCondition = propertyId ? { OR: [{ propertyId }, { propertyId: null }] } : {};

    // Strict rule: Room revenue is ONLY counted when the guest was checked in (CHECKED_IN or CHECKED_OUT)
    // AND payment has been made on the folio, recorded on the date of payment.
    const folioPayments = await this.prisma.folioLineItem.findMany({
      where: {
        type: 'PAYMENT',
        folio: {
          ...(propertyId ? propCondition : {}),
          reservation: {
            status: { in: ['CHECKED_IN', 'CHECKED_OUT'] },
          },
        },
      },
      include: {
        folio: {
          include: {
            reservation: {
              include: {
                guest: true,
                room: true,
                roomType: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const reservations = await this.prisma.reservation.findMany({
      where: {
        status: { in: ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'] },
        ...propCondition,
      },
    });

    const paymentEntries = folioPayments.map((p) => {
      const res = p.folio?.reservation;
      const amt = Math.abs(Number(p.amount || 0));
      return {
        id: p.id,
        confirmationCode: res?.confirmationCode || p.referenceCode || p.id.substring(0, 6).toUpperCase(),
        guestName: res?.guest ? `${res.guest.firstName} ${res.guest.lastName}`.trim() : 'Hotel Guest',
        roomNumber: res?.room?.number || res?.roomType?.name || 'Room',
        roomTypeName: res?.roomType?.name || 'Room',
        status: res?.status || 'PAID',
        date: p.createdAt,
        checkInDate: res?.checkInDate || p.createdAt,
        checkOutDate: res?.checkOutDate || p.createdAt,
        revenue: Math.round(amt * 100) / 100,
      };
    });

    const totalRevenue = paymentEntries.reduce((sum, s) => sum + s.revenue, 0);
    const todayRevenue = paymentEntries
      .filter((s) => {
        const d = new Date(s.date);
        return d >= startOfToday && d <= endOfToday;
      })
      .reduce((sum, s) => sum + s.revenue, 0);
    const weekRevenue = paymentEntries
      .filter((s) => new Date(s.date) >= startOfWeek)
      .reduce((sum, s) => sum + s.revenue, 0);
    const monthRevenue = paymentEntries
      .filter((s) => new Date(s.date) >= startOfMonth)
      .reduce((sum, s) => sum + s.revenue, 0);

    let customRangeRevenue: number | null = null;
    if (start && end) {
      const startDate = new Date(`${start.split('T')[0]}T00:00:00.000Z`);
      const endDate = new Date(`${end.split('T')[0]}T23:59:59.999Z`);
      customRangeRevenue = paymentEntries
        .filter((s) => {
          const d = new Date(s.date);
          return d >= startDate && d <= endDate;
        })
        .reduce((sum, s) => sum + s.revenue, 0);
    }

    return {
      todayRevenue: Number(todayRevenue.toFixed(2)),
      weekRevenue: Number(weekRevenue.toFixed(2)),
      monthRevenue: Number(monthRevenue.toFixed(2)),
      customRangeRevenue: customRangeRevenue !== null ? Number(customRangeRevenue.toFixed(2)) : null,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      totalBookings: reservations.length,
      checkedInCount: reservations.filter((r) => r.status === 'CHECKED_IN').length,
      confirmedCount: reservations.filter((r) => r.status === 'CONFIRMED').length,
      checkedOutCount: reservations.filter((r) => r.status === 'CHECKED_OUT').length,
      bookings: paymentEntries.slice(0, 30),
    };
  }

  async getDashboardMetrics(propertyId?: string) {
    const now = new Date();
    const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const endOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

    const propCondition = propertyId ? { OR: [{ propertyId }, { propertyId: null }] } : {};

    // 1. Occupancy Rate
    const totalRooms = await this.prisma.room.count({
      where: {
        isActive: true,
        ...(propertyId ? { propertyId } : {}),
      },
    });
    const occupiedRooms = await this.prisma.room.count({
      where: {
        status: 'OCCUPIED',
        isActive: true,
        ...(propertyId ? { propertyId } : {}),
      },
    });
    
    let occupancyRate = '0.0%';
    if (totalRooms > 0) {
      occupancyRate = ((occupiedRooms / totalRooms) * 100).toFixed(1) + '%';
    }

    // 2. Check-Ins Today: ONLY count guests whose arrival date (checkInDate) is TODAY (not tomorrow, next week, or next month)
    const checkInsToday = await this.prisma.reservation.count({
      where: {
        checkInDate: {
          gte: startOfToday,
          lte: endOfToday,
        },
        status: { in: ['CONFIRMED', 'CHECKED_IN'] },
        ...propCondition,
      },
    });

    // 3. Pending Reservations
    const pendingReservations = await this.prisma.reservation.count({
      where: {
        status: { in: ['PENDING', 'CONFIRMED'] },
        ...propCondition,
      },
    });

    // 4. Today's Collected Revenue: Strictly payment-based on the date of payment
    // a. Room / Folio payments made TODAY for checked-in or checked-out guests
    const folioPaymentsToday = await this.prisma.folioLineItem.findMany({
      where: {
        type: 'PAYMENT',
        createdAt: { gte: startOfToday, lte: endOfToday },
        folio: {
          ...(propertyId ? propCondition : {}),
          reservation: {
            status: { in: ['CHECKED_IN', 'CHECKED_OUT'] },
          },
        },
      },
      select: { amount: true },
    });
    const roomPaidToday = folioPaymentsToday.reduce((sum, p) => sum + Math.abs(Number(p.amount || 0)), 0);

    // b. POS Payments made TODAY
    const posPaymentsToday = await this.prisma.posPayment.aggregate({
      _sum: { amount: true },
      where: {
        createdAt: { gte: startOfToday, lte: endOfToday },
        order: { status: { not: 'CANCELLED' } },
        ...(propertyId ? { OR: [{ propertyId }, { order: { propertyId } }, { propertyId: null }] } : {}),
      },
    });
    const legacyPaidOrdersToday = await this.prisma.posOrder.aggregate({
      _sum: { totalAmount: true },
      where: {
        status: 'PAID',
        updatedAt: { gte: startOfToday, lte: endOfToday },
        payments: { none: {} },
        ...propCondition,
      },
    });
    const posPaidToday =
      (posPaymentsToday._sum.amount?.toNumber() || 0) +
      (legacyPaidOrdersToday._sum.totalAmount?.toNumber() || 0);

    // c. Tickets paid/issued TODAY
    const ticketRevenueItems = await this.prisma.ticket.aggregate({
      _sum: { price: true },
      where: {
        issueDate: { gte: startOfToday, lte: endOfToday },
        status: { in: ['VALID', 'USED'] },
        ...propCondition,
      },
    });
    const ticketsPaidToday = ticketRevenueItems._sum.price?.toNumber() || 0;

    const todaysRevenue = roomPaidToday + posPaidToday + ticketsPaidToday;

    // 5. Outstanding Revenue (Unpaid open folio balances + unpaid company balances + unpaid POS orders)
    const openFolios = await this.prisma.folio.aggregate({
      _sum: { balance: true },
      where: {
        status: 'OPEN',
        ...propCondition,
      },
    });
    
    const companyBalances = await this.prisma.company.aggregate({
      _sum: { balance: true },
      where: propertyId ? { propertyId } : {},
    });

    const openPosOrders = await this.prisma.posOrder.findMany({
      where: {
        status: { in: ['OPEN', 'SERVED'] },
        items: { some: {} },
        ...propCondition,
      },
      include: { payments: true },
    });
    const posOutstanding = openPosOrders.reduce((sum, o) => {
      const paid = (o.payments || []).reduce((s, p) => s + Number(p.amount || 0), 0);
      const rem = Math.max(0, Number(o.totalAmount || 0) - Number(o.discountAmount || 0) - paid);
      return sum + rem;
    }, 0);

    const outstandingRevenue = (openFolios._sum.balance?.toNumber() || 0) + (companyBalances._sum.balance?.toNumber() || 0) + posOutstanding;

    return {
      occupancyRate,
      checkInsToday,
      pendingReservations,
      todaysRevenue: todaysRevenue.toFixed(2),
      outstandingRevenue: outstandingRevenue.toFixed(2),
    };
  }

  async getRevenueChart(start?: string, end?: string, propertyId?: string) {
    const now = new Date();
    const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    
    let startOfPeriod = new Date(startOfToday.getTime() - 6 * 24 * 60 * 60 * 1000);
    let endOfPeriod = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
    if (start && end) {
      startOfPeriod = new Date(`${start.split('T')[0]}T00:00:00.000Z`);
      endOfPeriod = new Date(`${end.split('T')[0]}T23:59:59.999Z`);
    }

    const propCondition = propertyId ? { OR: [{ propertyId }, { propertyId: null }] } : {};

    // 1. Folio payments for checked-in / checked-out guests on date of payment
    const payments = await this.prisma.folioLineItem.findMany({
      where: { 
        type: 'PAYMENT', 
        createdAt: { gte: startOfPeriod, lte: endOfPeriod },
        folio: {
          ...(propertyId ? propCondition : {}),
          reservation: {
            status: { in: ['CHECKED_IN', 'CHECKED_OUT'] },
          },
        },
      },
      select: { amount: true, createdAt: true },
    });

    // 2. POS payments on date of payment
    const posPayments = await this.prisma.posPayment.findMany({
      where: { 
        createdAt: { gte: startOfPeriod, lte: endOfPeriod },
        order: { status: { not: 'CANCELLED' } },
        ...(propertyId ? { OR: [{ propertyId }, { order: { propertyId } }, { propertyId: null }] } : {}),
      },
      select: { amount: true, createdAt: true },
    });

    const paidOrdersWithoutPayments = await this.prisma.posOrder.findMany({
      where: { 
        status: 'PAID', 
        updatedAt: { gte: startOfPeriod, lte: endOfPeriod },
        payments: { none: {} },
        ...propCondition,
      },
      select: { totalAmount: true, updatedAt: true },
    });

    // 3. Ticket sales
    const tickets = await this.prisma.ticket.findMany({
      where: { 
        issueDate: { gte: startOfPeriod, lte: endOfPeriod }, 
        status: { in: ['VALID', 'USED'] },
        ...propCondition,
      },
      select: { price: true, issueDate: true },
    });

    const dailyRevenue: Record<string, number> = {};
    let days = 7;
    if (start && end) {
      days = Math.max(1, Math.ceil((endOfPeriod.getTime() - startOfPeriod.getTime()) / (1000 * 3600 * 24)));
    }
    for (let i = 0; i < days; i++) {
      const d = new Date(startOfPeriod.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split('T')[0];
      dailyRevenue[dateStr] = 0;
    }

    payments.forEach((payment) => {
      const dateStr = payment.createdAt.toISOString().split('T')[0];
      const amt = Math.abs(payment.amount.toNumber());
      if (dailyRevenue[dateStr] !== undefined) dailyRevenue[dateStr] += amt;
    });

    posPayments.forEach((payment) => {
      const dateStr = payment.createdAt.toISOString().split('T')[0];
      if (dailyRevenue[dateStr] !== undefined) dailyRevenue[dateStr] += payment.amount.toNumber();
    });

    paidOrdersWithoutPayments.forEach((o) => {
      const dateStr = o.updatedAt.toISOString().split('T')[0];
      if (dailyRevenue[dateStr] !== undefined) dailyRevenue[dateStr] += o.totalAmount.toNumber();
    });

    tickets.forEach((ticket) => {
      const dateStr = ticket.issueDate.toISOString().split('T')[0];
      if (dailyRevenue[dateStr] !== undefined) dailyRevenue[dateStr] += ticket.price.toNumber();
    });

    const chartData = Object.keys(dailyRevenue).map((date) => ({
      date,
      revenue: Number(dailyRevenue[date].toFixed(2)),
    })).sort((a, b) => a.date.localeCompare(b.date));

    return chartData;
  }

  // --- F&B Analytics ---

  async getFbMetrics(start?: string, end?: string, propertyId?: string) {
    const now = new Date();
    const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    
    const d = new Date(now);
    const day = d.getUTCDay() || 7; 
    if (day !== 1) d.setUTCHours(-24 * (day - 1));
    const startOfWeek = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
    
    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));

    const propCondition = propertyId ? { OR: [{ propertyId }, { propertyId: null }] } : {};

    const getFbRevenueForPeriod = async (startDate: Date, endDate?: Date) => {
      const dateFilter: any = { gte: startDate };
      if (endDate) dateFilter.lte = endDate;
      const result = await this.prisma.posOrder.aggregate({
        _sum: { totalAmount: true },
        where: {
          ...propCondition,
          OR: [
            { status: 'PAID', updatedAt: dateFilter },
            { status: 'BILLED_TO_ROOM', updatedAt: dateFilter }
          ]
        }
      });
      return result._sum.totalAmount ? Number(result._sum.totalAmount) : 0;
    };

    const getFbDeductionsForPeriod = async (startDate: Date, endDate?: Date) => {
      const dateFilter: any = { gte: startDate };
      if (endDate) dateFilter.lte = endDate;
      const result = await this.prisma.expense.aggregate({
        _sum: { amount: true },
        where: {
          ...propCondition,
          date: dateFilter,
          OR: [
            { category: 'SUPPLIES' },
            { description: { contains: 'food', mode: 'insensitive' } },
            { description: { contains: 'beverage', mode: 'insensitive' } },
            { description: { contains: 'kitchen', mode: 'insensitive' } },
            { description: { contains: 'bar', mode: 'insensitive' } }
          ]
        }
      });
      return result._sum.amount?.toNumber() || 0;
    };

    const todayRev = await getFbRevenueForPeriod(startOfToday);
    const todayDed = await getFbDeductionsForPeriod(startOfToday);
    const weekRev = await getFbRevenueForPeriod(startOfWeek);
    const weekDed = await getFbDeductionsForPeriod(startOfWeek);
    const monthRev = await getFbRevenueForPeriod(startOfMonth);
    const monthDed = await getFbDeductionsForPeriod(startOfMonth);

    return {
      todayFbRevenue: todayRev,
      todayFbIndex: Math.max(0, (todayRev - todayDed) / 4),
      weekFbRevenue: weekRev,
      weekFbIndex: Math.max(0, (weekRev - weekDed) / 4),
      monthFbRevenue: monthRev,
      monthFbIndex: Math.max(0, (monthRev - monthDed) / 4),
      customRangeRevenue: start && end ? await getFbRevenueForPeriod(new Date(start), new Date(new Date(end).setUTCHours(23, 59, 59, 999))) : null
    };
  }

  async getFbRevenueChart(start?: string, end?: string, propertyId?: string) {
    const now = new Date();
    const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    let startOfPeriod = new Date(startOfToday.getTime() - 6 * 24 * 60 * 60 * 1000);
    let endOfPeriod = now;
    if (start && end) {
      startOfPeriod = new Date(start);
      endOfPeriod = new Date(new Date(end).setUTCHours(23, 59, 59, 999));
    }

    const propCondition = propertyId ? { OR: [{ propertyId }, { propertyId: null }] } : {};

    const orders = await this.prisma.posOrder.findMany({
      where: {
        ...propCondition,
        OR: [
          { status: 'PAID', updatedAt: { gte: startOfPeriod, lte: endOfPeriod } },
          { status: 'BILLED_TO_ROOM', updatedAt: { gte: startOfPeriod, lte: endOfPeriod } }
        ]
      },
      select: { totalAmount: true, updatedAt: true },
    });

    const dailyRevenue: Record<string, number> = {};
    let days = 7; if (start && end) days = Math.ceil((endOfPeriod.getTime() - startOfPeriod.getTime()) / (1000 * 3600 * 24)); for (let i = 0; i < days; i++) {
      const d = new Date(startOfPeriod.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split('T')[0];
      dailyRevenue[dateStr] = 0;
    }

    orders.forEach((o) => {
      const dateStr = o.updatedAt.toISOString().split('T')[0];
      if (dailyRevenue[dateStr] !== undefined) {
        dailyRevenue[dateStr] += o.totalAmount.toNumber();
      }
    });

    return Object.keys(dailyRevenue).map((date) => ({
      date,
      revenue: dailyRevenue[date],
    })).sort((a, b) => a.date.localeCompare(b.date));
  }

  async getFbTopItems(start?: string, end?: string, propertyId?: string) {
    const propCondition = propertyId ? { OR: [{ propertyId }, { propertyId: null }] } : {};
    let gte: Date | undefined;
    let lte: Date | undefined;
    if (start && end) {
      gte = new Date(start);
      lte = new Date(new Date(end).setUTCHours(23, 59, 59, 999));
    }

    const topItems = await this.prisma.posOrderItem.groupBy({
      by: ['menuItemId'],
      _sum: { quantity: true },
      where: { 
        status: { in: ['SERVED', 'READY', 'COOKING', 'PENDING'] },
        ...(gte && lte ? { createdAt: { gte, lte } } : {}),
        ...(propertyId ? { order: propCondition } : {})
      },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 10
    });

    const itemsWithDetails = await Promise.all(topItems.map(async (ti) => {
      const menu = await this.prisma.posMenuItem.findUnique({ where: { id: ti.menuItemId }});
      return {
        id: ti.menuItemId,
        name: menu?.name || 'Unknown',
        quantity: ti._sum.quantity || 0,
        revenue: (menu?.price ? menu.price.toNumber() * (ti._sum.quantity || 0) : 0)
      };
    }));

    return itemsWithDetails;
  }

  // --- Boutique Analytics ---

  async getBoutiqueMetrics(start?: string, end?: string, propertyId?: string) {
    const now = new Date();
    const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const startOfWeek = new Date(startOfToday);
    const day = startOfToday.getUTCDay() || 7;
    startOfWeek.setUTCDate(startOfToday.getUTCDate() - (day - 1));
    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));

    const propCondition = propertyId ? { OR: [{ propertyId }, { propertyId: null }] } : {};

    const orders = await this.prisma.posOrder.findMany({
      where: {
        ...propCondition,
        OR: [
          { status: 'PAID' },
          { status: 'BILLED_TO_ROOM', folio: { status: 'CLOSED' } },
        ],
      },
      include: {
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
      orderBy: { updatedAt: 'desc' },
    });

    let todayRevenue = 0;
    let weekRevenue = 0;
    let monthRevenue = 0;
    let totalRevenue = 0;
    let customRangeRevenue: number | null = start && end ? 0 : null;
    let totalItemsSold = 0;
    let totalOrders = 0;

    const customStart = start ? new Date(`${start.split('T')[0]}T00:00:00.000Z`) : null;
    const customEnd = end ? new Date(`${end.split('T')[0]}T23:59:59.999Z`) : null;

    const itemStatsMap = new Map<string, { id: string; name: string; quantity: number; revenue: number }>();
    const dailyMap: Record<string, number> = {};

    let chartStart = new Date(startOfToday.getTime() - 6 * 24 * 60 * 60 * 1000);
    let chartEnd = now;
    if (customStart && customEnd) {
      chartStart = customStart;
      chartEnd = customEnd;
    }
    const chartDays = Math.max(1, Math.ceil((chartEnd.getTime() - chartStart.getTime()) / (1000 * 3600 * 24)));
    for (let i = 0; i < chartDays; i++) {
      const d = new Date(chartStart.getTime() + i * 24 * 60 * 60 * 1000);
      dailyMap[d.toISOString().split('T')[0]] = 0;
    }

    for (const order of orders) {
      const activeItems = (order.items || []).filter((item) => {
        if (['CANCELLED', 'RETURNED', 'RETURN_REQUESTED'].includes(item.status)) return false;
        if (item.returnRequest && item.returnRequest.status !== 'REJECTED') return false;
        return true;
      });
      if (activeItems.length === 0) continue;

      const boutiqueItems = activeItems.filter((item) => this.isBoutiqueMenuItem(item.menuItem));
      if (boutiqueItems.length === 0) continue;

      const orderGross = activeItems.reduce(
        (sum, it) => sum + Number(it.menuItem?.price || 0) * (it.quantity || 1),
        0,
      );
      if (orderGross <= 0) continue;

      const boutiqueGross = boutiqueItems.reduce(
        (sum, it) => sum + Number(it.menuItem?.price || 0) * (it.quantity || 1),
        0,
      );
      const orderDiscount = Number(order.discountAmount || 0);
      const allocatedDiscount = Math.min(boutiqueGross, orderDiscount * (boutiqueGross / orderGross));
      const boutiqueNet = Math.max(0, boutiqueGross - allocatedDiscount);

      const orderDate = new Date(order.updatedAt || order.createdAt);
      totalOrders += 1;
      totalRevenue += boutiqueNet;

      if (orderDate >= startOfToday) todayRevenue += boutiqueNet;
      if (orderDate >= startOfWeek) weekRevenue += boutiqueNet;
      if (orderDate >= startOfMonth) monthRevenue += boutiqueNet;
      if (customStart && customEnd && customRangeRevenue !== null) {
        if (orderDate >= customStart && orderDate <= customEnd) {
          customRangeRevenue += boutiqueNet;
        }
      }

      const dateStr = orderDate.toISOString().split('T')[0];
      if (dailyMap[dateStr] !== undefined) {
        dailyMap[dateStr] += boutiqueNet;
      }

      for (const bi of boutiqueItems) {
        const qty = Number(bi.quantity || 1);
        const rev = Number(bi.menuItem?.price || 0) * qty;
        totalItemsSold += qty;
        const existing = itemStatsMap.get(bi.menuItemId);
        if (existing) {
          existing.quantity += qty;
          existing.revenue += rev;
        } else {
          itemStatsMap.set(bi.menuItemId, {
            id: bi.menuItemId,
            name: bi.menuItem?.name || 'Boutique Item',
            quantity: qty,
            revenue: rev,
          });
        }
      }
    }

    const topItems = Array.from(itemStatsMap.values())
      .map((it) => ({ ...it, revenue: Number(it.revenue.toFixed(2)) }))
      .sort((a, b) => b.revenue - a.revenue);

    const chart = Object.keys(dailyMap)
      .map((date) => ({ date, revenue: Number(dailyMap[date].toFixed(2)) }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      todayRevenue: Number(todayRevenue.toFixed(2)),
      weekRevenue: Number(weekRevenue.toFixed(2)),
      monthRevenue: Number(monthRevenue.toFixed(2)),
      customRangeRevenue: customRangeRevenue !== null ? Number(customRangeRevenue.toFixed(2)) : null,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      totalItemsSold,
      totalOrders,
      topItems,
      chart,
    };
  }

  // --- Activities, Tours & Packages Analytics ---

  async getActivitiesMetrics(start?: string, end?: string, propertyId?: string) {
    const now = new Date();
    const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const startOfWeek = new Date(startOfToday);
    const day = startOfToday.getUTCDay() || 7;
    startOfWeek.setUTCDate(startOfToday.getUTCDate() - (day - 1));
    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));

    const propCondition = propertyId ? { OR: [{ propertyId }, { propertyId: null }] } : {};

    // 1. BookingActivity records linked to reservations
    const bookingActivities = await this.prisma.bookingActivity.findMany({
      where: {
        reservation: { status: { notIn: ['CANCELLED', 'NO_SHOW'] } },
        ...propCondition,
      },
      include: {
        activity: true,
        reservation: { include: { guest: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 2. Direct FolioLineItem charges for TOUR, ACTIVITY, PACKAGE
    const folioActivityCharges = await this.prisma.folioLineItem.findMany({
      where: {
        type: 'CHARGE',
        category: { in: ['TOUR', 'ACTIVITY', 'PACKAGE'] },
        ...(propertyId ? { folio: propCondition } : {}),
      },
      include: {
        folio: { include: { reservation: { include: { guest: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 3. Website / EventBooking entries for Tours, Activities, or Packages
    const eventActivityBookings = await this.prisma.eventBooking.findMany({
      where: {
        status: { not: 'CANCELLED' },
        OR: [
          { eventType: { startsWith: 'Activity:', mode: 'insensitive' } },
          { eventType: { startsWith: 'Tour:', mode: 'insensitive' } },
          { eventType: { startsWith: 'Package:', mode: 'insensitive' } },
        ],
        ...(propertyId ? { space: propCondition } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });

    const unifiedBookings: Array<{
      id: string;
      type: 'TOUR' | 'ACTIVITY' | 'PACKAGE';
      name: string;
      guestName: string;
      status: string;
      date: Date;
      revenue: number;
    }> = [];

    const seenReservationRefKeys = new Set<string>();

    for (const ba of bookingActivities) {
      const rawType = (ba.activity?.type || 'TOUR').toUpperCase();
      const normType: 'TOUR' | 'ACTIVITY' | 'PACKAGE' =
        rawType === 'PACKAGE' ? 'PACKAGE' : rawType === 'ACTIVITY' ? 'ACTIVITY' : 'TOUR';
      const amt = Number(ba.totalPrice || 0);
      if (ba.reservation?.confirmationCode) {
        seenReservationRefKeys.add(`${ba.reservation.confirmationCode}:${normType}:${amt.toFixed(2)}`);
      }
      unifiedBookings.push({
        id: `ba-${ba.id}`,
        type: normType,
        name: ba.activity?.name || normType,
        guestName: ba.reservation?.guest
          ? `${ba.reservation.guest.firstName} ${ba.reservation.guest.lastName}`.trim()
          : 'Hotel Guest',
        status: ba.reservation?.status || 'CONFIRMED',
        date: ba.createdAt,
        revenue: amt,
      });
    }

    for (const fc of folioActivityCharges) {
      const rawCat = (fc.category || 'ACTIVITY').toUpperCase();
      const normType: 'TOUR' | 'ACTIVITY' | 'PACKAGE' =
        rawCat === 'PACKAGE' ? 'PACKAGE' : rawCat === 'TOUR' ? 'TOUR' : 'ACTIVITY';
      const amt = Math.abs(Number(fc.amount || 0));
      const refCode = fc.referenceCode || fc.folio?.reservation?.confirmationCode || '';
      if (refCode && seenReservationRefKeys.has(`${refCode}:${normType}:${amt.toFixed(2)}`)) {
        continue;
      }
      unifiedBookings.push({
        id: `fc-${fc.id}`,
        type: normType,
        name: fc.description || normType,
        guestName: fc.folio?.reservation?.guest
          ? `${fc.folio.reservation.guest.firstName} ${fc.folio.reservation.guest.lastName}`.trim()
          : 'Folio Guest',
        status: 'CHARGED',
        date: fc.createdAt,
        revenue: amt,
      });
    }

    for (const eb of eventActivityBookings) {
      const et = eb.eventType || '';
      const lower = et.toLowerCase();
      const normType: 'TOUR' | 'ACTIVITY' | 'PACKAGE' = lower.startsWith('package:')
        ? 'PACKAGE'
        : lower.startsWith('tour:')
          ? 'TOUR'
          : 'ACTIVITY';
      unifiedBookings.push({
        id: `eb-${eb.id}`,
        type: normType,
        name: et.replace(/^(Activity|Tour|Package):\s*/i, '') || et,
        guestName: eb.guestName || 'Guest',
        status: eb.status,
        date: eb.startTime || eb.createdAt,
        revenue: Number(eb.totalAmount || 0),
      });
    }

    unifiedBookings.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const totalRevenue = unifiedBookings.reduce((sum, b) => sum + b.revenue, 0);
    const todayRevenue = unifiedBookings
      .filter((b) => new Date(b.date) >= startOfToday)
      .reduce((sum, b) => sum + b.revenue, 0);
    const weekRevenue = unifiedBookings
      .filter((b) => new Date(b.date) >= startOfWeek)
      .reduce((sum, b) => sum + b.revenue, 0);
    const monthRevenue = unifiedBookings
      .filter((b) => new Date(b.date) >= startOfMonth)
      .reduce((sum, b) => sum + b.revenue, 0);

    let customRangeRevenue: number | null = null;
    if (start && end) {
      const startDate = new Date(`${start.split('T')[0]}T00:00:00.000Z`);
      const endDate = new Date(`${end.split('T')[0]}T23:59:59.999Z`);
      customRangeRevenue = unifiedBookings
        .filter((b) => {
          const d = new Date(b.date);
          return d >= startDate && d <= endDate;
        })
        .reduce((sum, b) => sum + b.revenue, 0);
    }

    const tourItems = unifiedBookings.filter((b) => b.type === 'TOUR');
    const activityItems = unifiedBookings.filter((b) => b.type === 'ACTIVITY');
    const packageItems = unifiedBookings.filter((b) => b.type === 'PACKAGE');

    return {
      totalBookings: unifiedBookings.length,
      tourCount: tourItems.length,
      activityCount: activityItems.length,
      packageCount: packageItems.length,
      tourRevenue: Number(tourItems.reduce((s, b) => s + b.revenue, 0).toFixed(2)),
      activityRevenue: Number(activityItems.reduce((s, b) => s + b.revenue, 0).toFixed(2)),
      packageRevenue: Number(packageItems.reduce((s, b) => s + b.revenue, 0).toFixed(2)),
      totalRevenue: Number(totalRevenue.toFixed(2)),
      todayRevenue: Number(todayRevenue.toFixed(2)),
      weekRevenue: Number(weekRevenue.toFixed(2)),
      monthRevenue: Number(monthRevenue.toFixed(2)),
      customRangeRevenue: customRangeRevenue !== null ? Number(customRangeRevenue.toFixed(2)) : null,
      bookings: unifiedBookings,
    };
  }

  async getRevenueByMethod(start?: string, end?: string, propertyId?: string) {
    let gte: Date | undefined;
    let lte: Date | undefined;
    if (start) {
      const cleanStart = start.includes('T') ? start.split('T')[0] : start;
      gte = new Date(`${cleanStart}T00:00:00.000Z`);
    }
    if (end) {
      const cleanEnd = end.includes('T') ? end.split('T')[0] : end;
      lte = new Date(`${cleanEnd}T23:59:59.999Z`);
    }
    const propCondition = propertyId ? { OR: [{ propertyId }, { propertyId: null }] } : {};

    const folioPayments = await this.prisma.folioLineItem.groupBy({
      by: ['category'],
      _sum: { amount: true },
      where: { 
        type: 'PAYMENT',
        ...(gte && lte ? { createdAt: { gte, lte } } : gte ? { createdAt: { gte } } : lte ? { createdAt: { lte } } : {}),
        ...(propertyId ? { folio: propCondition } : {})
      }
    });

    const posPayments = await this.prisma.posPayment.groupBy({
      by: ['method'],
      _sum: { amount: true },
      where: {
        ...(gte && lte ? { createdAt: { gte, lte } } : gte ? { createdAt: { gte } } : lte ? { createdAt: { lte } } : {}),
        ...(propertyId ? { OR: [{ propertyId }, { order: { propertyId } }, { propertyId: null }] } : {}),
        order: { status: { in: ['PAID', 'COMPLETED', 'SETTLED', 'CLOSED'] } }
      }
    });

    const normalizeMethod = (raw: string | null | undefined): string => {
      if (!raw) return 'OTHER';
      const m = raw.trim().toUpperCase().replace(/^PAYMENT_/, '');
      if (m === 'CASH') return 'CASH';
      if (m === 'CARD' || m === 'CREDIT_CARD' || m === 'DEBIT_CARD' || m === 'VISA' || m === 'MASTERCARD') return 'CARD';
      if (m === 'MOBILE' || m === 'MOBILE_MONEY' || m === 'MOMO' || m === 'ORANGE' || m === 'MTN' || m === 'ORANGE_MONEY') return 'MOBILE_MONEY';
      if (m === 'BANK' || m === 'BANK_TRANSFER' || m === 'TRANSFER' || m === 'WIRE' || m === 'CHECK' || m === 'CHEQUE') return 'BANK';
      if (m === 'CORPORATE') return 'CORPORATE';
      return 'OTHER';
    };

    const combined: Record<string, number> = {
      CASH: 0,
      CARD: 0,
      MOBILE_MONEY: 0,
      BANK: 0,
      CORPORATE: 0,
      OTHER: 0
    };

    folioPayments.forEach(p => {
      const val = p._sum.amount ? Number(p._sum.amount) : 0;
      const key = normalizeMethod(p.category);
      combined[key] = (combined[key] || 0) + val;
    });

    posPayments.forEach(p => {
      const val = p._sum.amount ? Number(p._sum.amount) : 0;
      const key = normalizeMethod(p.method);
      combined[key] = (combined[key] || 0) + val;
    });

    const chartData = Object.keys(combined).map(method => ({
      method,
      revenue: Number(combined[method].toFixed(2))
    })).filter(d => d.revenue > 0);

    return chartData;
  }

  async getOccupancyHeatmap(start?: string, end?: string, propertyId?: string) {
    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    
    const startPeriod = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const endPeriod = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000); 

    const dates: string[] = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(startPeriod.getTime() + i * 24 * 60 * 60 * 1000);
      dates.push(d.toISOString().split('T')[0]);
    }

    const roomTypes = await this.prisma.roomType.findMany({
      where: { 
        isActive: true,
        ...(propertyId ? { propertyId } : {})
      },
      select: { 
        id: true, 
        name: true, 
        _count: { select: { rooms: { where: { isActive: true, ...(propertyId ? { propertyId } : {}) } } } } 
      }
    });

    const reservations = await this.prisma.reservation.findMany({
      where: {
        status: { in: ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'] },
        checkInDate: { lt: endPeriod },
        checkOutDate: { gt: startPeriod },
        ...(propertyId ? { propertyId } : {})
      },
      select: { roomTypeId: true, checkInDate: true, checkOutDate: true }
    });

    const roomTypesData = roomTypes.map(rt => {
      const data = dates.map(dateStr => {
        let occupiedCount = 0;
        
        reservations.forEach(res => {
          if (res.roomTypeId === rt.id) {
            const checkInStr = res.checkInDate.toISOString().split('T')[0];
            const checkOutStr = res.checkOutDate.toISOString().split('T')[0];
            if (checkInStr <= dateStr && checkOutStr > dateStr) {
              occupiedCount++;
            }
          }
        });

        const total = rt._count.rooms || 0;
        let pct = 0;
        if (total > 0) {
          pct = Math.round((occupiedCount / total) * 100);
          if (pct > 100) pct = 100;
        }

        return {
          date: dateStr,
          occupancyPct: pct,
          occupied: occupiedCount,
          total: total
        };
      });

      return {
        id: rt.id,
        name: rt.name,
        data
      };
    });

    return { dates, roomTypes: roomTypesData };
  }

  async getRecentActivity(start?: string, end?: string, propertyId?: string) {
    const propCondition = propertyId ? { OR: [{ propertyId }, { propertyId: null }] } : {};

    const reservations = await this.prisma.reservation.findMany({
      where: propertyId ? { propertyId } : {},
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { guest: true, room: true, roomType: true },
    });

    const statusChanges = await this.prisma.roomStatusHistory.findMany({
      where: propertyId ? { room: { propertyId } } : {},
      take: 5,
      orderBy: { changedAt: 'desc' },
      include: { room: true },
    });

    const posOrders = await this.prisma.posOrder.findMany({
      where: propCondition,
      take: 5,
      orderBy: { createdAt: 'desc' },
    });

    const activityList = [
      ...reservations.map(r => ({
        id: `res-${r.id}`,
        type: 'RESERVATION',
        title: `New Reservation: ${r.guest.firstName} ${r.guest.lastName}`,
        description: `Room ${r.room?.number || r.roomType?.name || 'Assigned at Check-In'} - ${r.status} ($${this.computeReservationRoomAmount(r).toFixed(2)})`,
        timestamp: r.createdAt,
      })),
      ...statusChanges.map(s => ({
        id: `status-${s.id}`,
        type: 'ROOM_STATUS',
        title: `Room ${s.room?.number} Status Changed`,
        description: `${s.previousStatus} ➔ ${s.newStatus}`,
        timestamp: s.changedAt,
      })),
      ...posOrders.map(p => ({
        id: `pos-${p.id}`,
        type: 'POS_ORDER',
        title: `POS Order Created`,
        description: `Status: ${p.status} - Total: $${p.totalAmount.toString()}`,
        timestamp: p.createdAt,
      }))
    ];

    activityList.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return activityList.slice(0, 8);
  }

  async getTicketsMetrics(start?: string, end?: string, propertyId?: string) {
    const now = new Date();
    const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const startOfWeek = new Date(startOfToday);
    const day = startOfToday.getUTCDay() || 7;
    startOfWeek.setUTCDate(startOfToday.getUTCDate() - (day - 1));
    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

    const propCondition = propertyId ? { OR: [{ propertyId }, { propertyId: null }] } : {};

    const tickets = await this.prisma.ticket.findMany({
      where: { 
        status: { not: 'RETURNED' },
        ...propCondition
      }
    });

    const adultTickets = tickets.filter(t => t.type.toLowerCase().includes('adult')).length;
    const kidTickets = tickets.filter(t => t.type.toLowerCase().includes('kid')).length;
    const poolTickets = tickets.filter(t => t.type.toLowerCase().includes('pool')).length;

    const totalRevenue = tickets.reduce((acc, t) => acc + Number(t.price), 0);
    const validCount = tickets.filter(t => t.status === 'VALID').length;
    const usedCount = tickets.filter(t => t.status === 'USED').length;

    const todayRevenue = tickets
      .filter(t => new Date(t.issueDate) >= startOfToday)
      .reduce((acc, t) => acc + Number(t.price), 0);

    const weekRevenue = tickets
      .filter(t => new Date(t.issueDate) >= startOfWeek)
      .reduce((acc, t) => acc + Number(t.price), 0);

    const monthRevenue = tickets
      .filter(t => new Date(t.issueDate) >= startOfMonth)
      .reduce((acc, t) => acc + Number(t.price), 0);

    let customRangeRevenue = null;
    if (start && end) {
      const startDate = new Date(start);
      const endDate = new Date(new Date(end).setUTCHours(23, 59, 59, 999));
      customRangeRevenue = tickets
        .filter(t => {
          const d = new Date(t.issueDate);
          return d >= startDate && d <= endDate;
        })
        .reduce((acc, t) => acc + Number(t.price), 0);
    }

    const monthlyData = tickets.reduce((acc: any, t) => {
      const month = new Date(t.issueDate).toLocaleString('default', { month: 'short' });
      if (!acc[month]) acc[month] = { month, adults: 0, kids: 0, pool: 0, revenue: 0 };
      if (t.type.toLowerCase().includes('adult')) acc[month].adults += 1;
      if (t.type.toLowerCase().includes('kid')) acc[month].kids += 1;
      if (t.type.toLowerCase().includes('pool')) acc[month].pool += 1;
      acc[month].revenue += Number(t.price);
      return acc;
    }, {});

    return {
      adultTickets,
      kidTickets,
      poolTickets,
      totalRevenue,
      todayRevenue,
      weekRevenue,
      monthRevenue,
      customRangeRevenue,
      validCount,
      usedCount,
      chart: Object.values(monthlyData)
    };
  }

  async getEventsMetrics(start?: string, end?: string, propertyId?: string) {
    const now = new Date();
    const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const startOfWeek = new Date(startOfToday);
    const day = startOfToday.getUTCDay() || 7;
    startOfWeek.setUTCDate(startOfToday.getUTCDate() - (day - 1));
    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

    const bookings = await this.prisma.eventBooking.findMany({
      where: propertyId ? { space: { propertyId } } : {},
      include: { space: true }
    });

    const totalRevenue = bookings.reduce((acc, b) => acc + Number(b.totalAmount), 0);
    const confirmedCount = bookings.filter(b => b.status === 'CONFIRMED').length;

    const todayRevenue = bookings
      .filter(b => new Date(b.startTime) >= startOfToday)
      .reduce((acc, b) => acc + Number(b.totalAmount), 0);

    const weekRevenue = bookings
      .filter(b => new Date(b.startTime) >= startOfWeek)
      .reduce((acc, b) => acc + Number(b.totalAmount), 0);

    const monthRevenue = bookings
      .filter((b: any) => new Date(b.startTime) >= startOfMonth)
      .reduce((acc: number, b: any) => acc + Number(b.totalAmount), 0);

    let customRangeRevenue = null;
    if (start && end) {
      const startDate = new Date(start);
      const endDate = new Date(new Date(end).setUTCHours(23, 59, 59, 999));
      customRangeRevenue = bookings
        .filter((b: any) => {
          const d = new Date(b.startTime);
          return d >= startDate && d <= endDate;
        })
        .reduce((acc: number, b: any) => acc + Number(b.totalAmount), 0);
    }
    
    return {
      totalBookings: bookings.length,
      confirmedCount,
      totalRevenue,
      todayRevenue,
      weekRevenue,
      monthRevenue,
      customRangeRevenue,
      bookings: bookings.map((b: any) => ({
        id: b.id,
        eventType: b.eventType,
        status: b.status,
        date: b.startTime,
        revenue: b.totalAmount
      }))
    };
  }

  // --- Financial Reports ---

  async getProfitAndLoss(start?: string, end?: string, propertyId?: string) {
    let gte: Date | undefined;
    let lte: Date | undefined;
    if (start && end) {
      gte = new Date(start);
      lte = new Date(new Date(end).setUTCHours(23, 59, 59, 999));
    }

    const propCondition = propertyId ? { OR: [{ propertyId }, { propertyId: null }] } : {};

    const whereFolioCharge: any = { 
      type: 'CHARGE',
      ...(gte && lte ? { createdAt: { gte, lte } } : {}),
      ...(propertyId ? { folio: propCondition } : {})
    };

    const folioRevenueItems = await this.prisma.folioLineItem.groupBy({
      by: ['category'],
      _sum: { amount: true },
      where: whereFolioCharge,
    });

    const wherePosOrders: any = {
      status: 'PAID',
      ...(gte && lte ? { updatedAt: { gte, lte } } : {}),
      ...propCondition,
    };

    const paidPosOrders = await this.prisma.posOrder.findMany({
      where: wherePosOrders,
      include: {
        items: {
          include: {
            menuItem: {
              include: { category: true }
            }
          }
        }
      }
    });

    const posCategoryTotals: Record<string, number> = {};
    for (const order of paidPosOrders) {
      const orderTotal = Number(order.totalAmount || 0);
      if (orderTotal <= 0) continue;

      if (!order.items || order.items.length === 0) {
        posCategoryTotals['FOOD_AND_BEVERAGE'] = (posCategoryTotals['FOOD_AND_BEVERAGE'] || 0) + orderTotal;
        continue;
      }

      const grossSum = order.items.reduce((sum, it) => sum + (Number(it.menuItem?.price || 0) * (it.quantity || 1)), 0);
      for (const it of order.items) {
        const itemPrice = Number(it.menuItem?.price || 0);
        const itemGross = itemPrice * (it.quantity || 1);
        const itemAmount = grossSum > 0 ? (itemGross / grossSum) * orderTotal : orderTotal / order.items.length;

        let catName = it.menuItem?.category?.name;
        if (!catName) {
          const type = (it.menuItem?.type || '').toUpperCase();
          if (type === 'DRINK' || type === 'BAR') catName = 'BAR';
          else if (type === 'FOOD') catName = 'RESTAURANT';
          else if (type === 'MERCHANDISE' || type === 'BOUTIQUE') catName = 'BOUTIQUE';
          else catName = 'FOOD_AND_BEVERAGE';
        }
        posCategoryTotals[catName] = (posCategoryTotals[catName] || 0) + itemAmount;
      }
    }

    const whereTickets: any = {
      status: { in: ['VALID', 'USED'] },
      ...(gte && lte ? { issueDate: { gte, lte } } : {}),
      ...propCondition,
    };
    const ticketRevenue = await this.prisma.ticket.aggregate({
      _sum: { price: true },
      where: whereTickets,
    });

    const categoryMap = new Map<string, number>();

    folioRevenueItems.forEach(r => {
      const cat = r.category || 'ROOM_CHARGE';
      const amt = r._sum.amount ? r._sum.amount.toNumber() : 0;
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + amt);
    });

    Object.entries(posCategoryTotals).forEach(([cat, amt]) => {
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + amt);
    });

    const ticketAmt = ticketRevenue._sum.price ? ticketRevenue._sum.price.toNumber() : 0;
    if (ticketAmt > 0) {
      categoryMap.set('FACILITIES_TICKETS', (categoryMap.get('FACILITIES_TICKETS') || 0) + ticketAmt);
    }

    const revenues = Array.from(categoryMap.entries()).map(([category, amount]) => ({
      category,
      amount: Math.round(amount * 100) / 100,
    }));

    const totalRevenue = Math.round(revenues.reduce((sum, r) => sum + r.amount, 0) * 100) / 100;

    const whereExpense: any = {
      ...(gte && lte ? { date: { gte, lte } } : {}),
      ...propCondition,
    };

    const expenseItems = await this.prisma.expense.groupBy({
      by: ['category'],
      _sum: { amount: true },
      where: whereExpense,
    });

    const expenses = expenseItems.map(e => ({
      category: e.category,
      amount: e._sum.amount ? Math.round(e._sum.amount.toNumber() * 100) / 100 : 0,
    }));
    const totalExpenses = Math.round(expenses.reduce((sum, e) => sum + e.amount, 0) * 100) / 100;

    const netProfit = Math.round((totalRevenue - totalExpenses) * 100) / 100;

    return { revenues, totalRevenue, expenses, totalExpenses, netProfit };
  }

  async getBalanceSheet(start?: string, end?: string, propertyId?: string) {
    let gte: Date | undefined;
    let lte: Date | undefined;
    if (start && end) {
      gte = new Date(start);
      lte = new Date(new Date(end).setUTCHours(23, 59, 59, 999));
    }

    const propCondition = propertyId ? { OR: [{ propertyId }, { propertyId: null }] } : {};

    const whereFolioPayments: any = {
      type: 'PAYMENT',
      ...(gte && lte ? { createdAt: { gte, lte } } : {}),
      ...(propertyId ? { folio: propCondition } : {}),
    };
    const folioPayments = await this.prisma.folioLineItem.aggregate({
      _sum: { amount: true },
      where: whereFolioPayments,
    });

    const wherePosPayments: any = {
      order: { status: 'PAID' },
      ...(gte && lte ? { createdAt: { gte, lte } } : {}),
      ...(propertyId ? { OR: [{ propertyId }, { order: { propertyId } }, { propertyId: null }] } : {}),
    };
    const posPaymentsAgg = await this.prisma.posPayment.aggregate({
      _sum: { amount: true },
      where: wherePosPayments,
    });

    const wherePaidOrders: any = {
      status: 'PAID',
      ...(gte && lte ? { updatedAt: { gte, lte } } : {}),
      ...propCondition,
    };
    const paidOrdersAgg = await this.prisma.posOrder.aggregate({
      _sum: { totalAmount: true },
      where: wherePaidOrders,
    });

    const posCash = Math.max(
      posPaymentsAgg._sum.amount ? posPaymentsAgg._sum.amount.toNumber() : 0,
      paidOrdersAgg._sum.totalAmount ? paidOrdersAgg._sum.totalAmount.toNumber() : 0
    );

    const whereTickets: any = {
      status: { in: ['VALID', 'USED'] },
      ...(gte && lte ? { issueDate: { gte, lte } } : {}),
      ...propCondition,
    };
    const ticketPayments = await this.prisma.ticket.aggregate({
      _sum: { price: true },
      where: whereTickets,
    });

    const totalCashInflow = (folioPayments._sum.amount?.toNumber() || 0) +
      posCash +
      (ticketPayments._sum.price?.toNumber() || 0);

    const whereExpenses: any = {
      ...(gte && lte ? { date: { gte, lte } } : {}),
      ...propCondition,
    };
    const expensesAgg = await this.prisma.expense.aggregate({
      _sum: { amount: true },
      where: whereExpenses,
    });
    const totalExpensesPaid = expensesAgg._sum.amount?.toNumber() || 0;

    const netCash = totalCashInflow - totalExpensesPaid;
    const cash = netCash > 0 ? Math.round(netCash * 100) / 100 : 0;
    const cashOverdraft = netCash < 0 ? Math.round(Math.abs(netCash) * 100) / 100 : 0;

    const whereOpenFolios: any = {
      status: 'OPEN',
      ...(gte && lte ? { updatedAt: { gte, lte } } : {}),
      ...propCondition,
    };
    const openFolios = await this.prisma.folio.aggregate({
      _sum: { balance: true },
      where: whereOpenFolios,
    });

    const whereOpenPos: any = {
      status: { in: ['OPEN', 'SERVED', 'PREPARING', 'READY'] },
      ...(gte && lte ? { updatedAt: { gte, lte } } : {}),
      ...propCondition,
    };
    const openPos = await this.prisma.posOrder.aggregate({
      _sum: { totalAmount: true, discountAmount: true },
      where: whereOpenPos,
    });
    const posReceivable = (openPos._sum.totalAmount?.toNumber() || 0) - (openPos._sum.discountAmount?.toNumber() || 0);

    const companyBalances = await this.prisma.company.aggregate({
      _sum: { balance: true },
      where: propertyId ? { propertyId } : {},
    });

    const accountsReceivable = Math.round(
      ((openFolios._sum.balance?.toNumber() || 0) +
       (posReceivable > 0 ? posReceivable : 0) +
       (companyBalances._sum.balance?.toNumber() || 0)) * 100
    ) / 100;

    const totalAssets = Math.round((cash + accountsReceivable) * 100) / 100;

    const liabilities: any[] = [];
    if (cashOverdraft > 0) {
      liabilities.push({ name: 'Short-term Liabilities / Cash Advance', amount: cashOverdraft });
    }
    const totalLiabilities = Math.round(liabilities.reduce((sum, l) => sum + l.amount, 0) * 100) / 100;

    const equity = Math.round((totalAssets - totalLiabilities) * 100) / 100;

    return {
      assets: [
        { name: 'Cash/Bank', amount: cash },
        { name: 'Accounts Receivable', amount: accountsReceivable },
      ],
      totalAssets,
      liabilities,
      totalLiabilities,
      equity,
    };
  }

  async getTrialBalance(start?: string, end?: string, propertyId?: string) {
    const pnl = await this.getProfitAndLoss(start, end, propertyId);
    const bs = await this.getBalanceSheet(start, end, propertyId);

    const debits: { account: string; amount: number }[] = [];
    const credits: { account: string; amount: number }[] = [];

    const cashAsset = bs.assets.find(a => a.name === 'Cash/Bank')?.amount || 0;
    const arAsset = bs.assets.find(a => a.name === 'Accounts Receivable')?.amount || 0;

    debits.push({ account: 'Cash/Bank', amount: cashAsset });
    debits.push({ account: 'Accounts Receivable', amount: arAsset });

    if (pnl.expenses.length > 0) {
      pnl.expenses.forEach(e => {
        debits.push({
          account: `${e.category.replace(/_/g, ' ')} Expense`,
          amount: e.amount,
        });
      });
    } else {
      debits.push({ account: 'Total Expenses', amount: 0 });
    }

    if (pnl.revenues.length > 0) {
      pnl.revenues.forEach(r => {
        credits.push({
          account: `${r.category.replace(/_/g, ' ')} Revenue`,
          amount: r.amount,
        });
      });
    } else {
      credits.push({ account: 'Total Revenue', amount: 0 });
    }

    if (bs.liabilities.length > 0) {
      bs.liabilities.forEach(l => {
        credits.push({
          account: l.name,
          amount: l.amount,
        });
      });
    }

    let sumDebits = Math.round(debits.reduce((sum, d) => sum + d.amount, 0) * 100) / 100;
    let sumCredits = Math.round(credits.reduce((sum, c) => sum + c.amount, 0) * 100) / 100;
    const diff = Math.round((sumDebits - sumCredits) * 100) / 100;

    if (diff > 0) {
      credits.push({ account: "Owner's Equity / Balancing", amount: diff });
      sumCredits = Math.round((sumCredits + diff) * 100) / 100;
    } else if (diff < 0) {
      debits.push({ account: 'Retained Earnings Adjustment', amount: Math.abs(diff) });
      sumDebits = Math.round((sumDebits + Math.abs(diff)) * 100) / 100;
    }

    return {
      debits,
      totalDebits: sumDebits,
      credits,
      totalCredits: sumCredits,
    };
  }

  async getDiscounts(startDate?: string, endDate?: string, propertyId?: string) {
    const propCondition = propertyId ? { OR: [{ propertyId }, { propertyId: null }] } : {};

    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }
    const hasDateFilter = Boolean(startDate || endDate);

    const folioDiscounts = await this.prisma.folioLineItem.findMany({
      where: {
        ...(hasDateFilter ? { createdAt: dateFilter } : {}),
        ...(propertyId ? { folio: propCondition } : {}),
        OR: [
          { type: 'ADJUSTMENT' },
          { description: { contains: 'Discount', mode: 'insensitive' } }
        ]
      },
      include: {
        folio: {
          include: { reservation: { include: { guest: true, room: true } } }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const posDiscounts = await this.prisma.posOrder.findMany({
      where: {
        ...(hasDateFilter ? { createdAt: dateFilter } : {}),
        discountAmount: { gt: 0 },
        ...propCondition,
      },
      include: { table: true, items: { include: { menuItem: true } } },
      orderBy: { createdAt: 'desc' }
    });

    const formattedFolio = folioDiscounts.map((d: any) => ({
      id: d.id,
      source: 'FOLIO',
      date: d.createdAt,
      amount: d.amount,
      description: d.description || 'Folio Adjustment',
      reference: d.folio?.reservation?.guest ? `${d.folio.reservation.guest.firstName} ${d.folio.reservation.guest.lastName} (Room ${d.folio.reservation.room?.number || 'N/A'})` : 'Unknown Folio'
    }));

    const formattedPos = posDiscounts.map((d: any) => {
      const itemsStr = d.items?.map((i: any) => `${i.quantity}x ${i.menuItem?.name || 'Item'}`).join(', ') || 'POS Discount';
      return {
        id: d.id,
        source: 'POS',
        date: d.createdAt,
        amount: d.discountAmount,
        description: d.discountReason ? `${itemsStr} - ${d.discountReason}` : itemsStr,
        reference: d.table ? `Table ${d.table.number}` : 'Takeout/Walk-in'
      };
    });

    const combined = [...formattedFolio, ...formattedPos].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return combined;
  }
}
