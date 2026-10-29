import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardMetrics(propertyId?: string) {
    // We default to UTC for start and end of "today"
    const now = new Date();
    const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const endOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

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
    
    // Formatting as a percentage string e.g., "75.0%"
    let occupancyRate = '0.0%';
    if (totalRooms > 0) {
      occupancyRate = ((occupiedRooms / totalRooms) * 100).toFixed(1) + '%';
    }

    // 2. Check-Ins Today
    const checkInsToday = await this.prisma.reservation.count({
      where: {
        checkInDate: {
          gte: startOfToday,
          lte: endOfToday,
        },
        status: 'CHECKED_IN',
        ...(propertyId ? { propertyId } : {}),
      },
    });

    // 3. Pending Reservations (Pending arrivals today or in future)
    const pendingReservations = await this.prisma.reservation.count({
      where: {
        status: 'PENDING',
        ...(propertyId ? { propertyId } : {}),
      },
    });

    // 4. Today's Collected Revenue
    const revenueItems = await this.prisma.folioLineItem.aggregate({
      _sum: { amount: true },
      where: {
        type: 'PAYMENT',
        createdAt: { gte: startOfToday, lte: endOfToday },
        ...(propertyId ? { folio: { propertyId } } : {}),
      },
    });

    const ticketRevenueItems = await this.prisma.ticket.aggregate({
      _sum: { price: true },
      where: {
        issueDate: { gte: startOfToday, lte: endOfToday },
        status: { in: ['VALID', 'USED'] },
        ...(propertyId ? { propertyId } : {}),
      },
    });

    const posRevenuePayments = await this.prisma.posPayment.aggregate({
      _sum: { amount: true },
      where: {
        createdAt: { gte: startOfToday, lte: endOfToday },
        ...(propertyId ? { OR: [{ propertyId }, { order: { propertyId } }, { propertyId: null }] } : {}),
      },
    });

    const paidPosOrders = await this.prisma.posOrder.aggregate({
      _sum: { totalAmount: true },
      where: {
        status: 'PAID',
        updatedAt: { gte: startOfToday, lte: endOfToday },
        ...(propertyId ? { OR: [{ propertyId }, { propertyId: null }] } : {}),
      }
    });

    const posRevenue = Math.max(
      posRevenuePayments._sum.amount?.toNumber() || 0,
      paidPosOrders._sum.totalAmount?.toNumber() || 0
    );

    // 5. Outstanding Revenue (Unpaid open folio balances + unpaid company balances + unpaid POS orders)
    const openFolios = await this.prisma.folio.aggregate({
      _sum: { balance: true },
      where: {
        status: 'OPEN',
        ...(propertyId ? { propertyId } : {}),
      }
    });
    
    const companyBalances = await this.prisma.company.aggregate({
      _sum: { balance: true },
      where: propertyId ? { propertyId } : {},
    });

    const openPosOrders = await this.prisma.posOrder.aggregate({
      _sum: { totalAmount: true, discountAmount: true },
      where: {
        status: { in: ['OPEN', 'SERVED'] },
        ...(propertyId ? { propertyId } : {}),
      }
    });
    const posOutstanding = (openPosOrders._sum.totalAmount?.toNumber() || 0) - (openPosOrders._sum.discountAmount?.toNumber() || 0);

    const todaysRevenue = (revenueItems._sum.amount?.toNumber() || 0) + 
      (ticketRevenueItems._sum.price?.toNumber() || 0) + 
      posRevenue;
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
    let endOfPeriod = now;
    if (start && end) {
      startOfPeriod = new Date(start);
      endOfPeriod = new Date(new Date(end).setUTCHours(23, 59, 59, 999));
    }

    const propCondition = propertyId ? { OR: [{ propertyId }, { propertyId: null }] } : {};

    // Folio payments
    const payments = await this.prisma.folioLineItem.findMany({
      where: { 
        type: 'PAYMENT', 
        createdAt: { gte: startOfPeriod, lte: endOfPeriod },
        ...(propertyId ? { folio: propCondition } : {})
      },
      select: { amount: true, createdAt: true },
    });

    // POS payments
    const posPayments = await this.prisma.posPayment.findMany({
      where: { 
        createdAt: { gte: startOfPeriod, lte: endOfPeriod },
        ...(propertyId ? { OR: [{ propertyId }, { order: { propertyId } }, { propertyId: null }] } : {})
      },
      select: { amount: true, createdAt: true },
    });

    // Also get paid POS orders if posPayments is empty or missing
    const paidOrders = await this.prisma.posOrder.findMany({
      where: { 
        status: 'PAID', 
        updatedAt: { gte: startOfPeriod, lte: endOfPeriod },
        ...propCondition
      },
      select: { totalAmount: true, updatedAt: true, payments: { select: { id: true } } }
    });

    // Ticket sales
    const tickets = await this.prisma.ticket.findMany({
      where: { 
        issueDate: { gte: startOfPeriod, lte: endOfPeriod }, 
        status: { in: ['VALID', 'USED'] },
        ...propCondition
      },
      select: { price: true, issueDate: true },
    });

    // Map to a dictionary by local date string
    const dailyRevenue: Record<string, number> = {};
    
    // Initialize the last 7 days with 0
    let days = 7; if (start && end) days = Math.ceil((endOfPeriod.getTime() - startOfPeriod.getTime()) / (1000 * 3600 * 24)); for (let i = 0; i < days; i++) {
      const d = new Date(startOfPeriod.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split('T')[0];
      dailyRevenue[dateStr] = 0;
    }

    // Accumulate amounts
    payments.forEach((payment) => {
      const dateStr = payment.createdAt.toISOString().split('T')[0];
      if (dailyRevenue[dateStr] !== undefined) dailyRevenue[dateStr] += payment.amount.toNumber();
    });

    posPayments.forEach((payment) => {
      const dateStr = payment.createdAt.toISOString().split('T')[0];
      if (dailyRevenue[dateStr] !== undefined) dailyRevenue[dateStr] += payment.amount.toNumber();
    });

    paidOrders.forEach((o) => {
      if (!o.payments || o.payments.length === 0) {
        const dateStr = o.updatedAt.toISOString().split('T')[0];
        if (dailyRevenue[dateStr] !== undefined) dailyRevenue[dateStr] += o.totalAmount.toNumber();
      }
    });

    tickets.forEach((ticket) => {
      const dateStr = ticket.issueDate.toISOString().split('T')[0];
      if (dailyRevenue[dateStr] !== undefined) dailyRevenue[dateStr] += ticket.price.toNumber();
    });

    // Format for Recharts
    const chartData = Object.keys(dailyRevenue).map((date) => ({
      date,
      revenue: dailyRevenue[date],
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
            { status: 'BILLED_TO_ROOM', folio: { status: 'CLOSED', updatedAt: dateFilter } }
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
          { status: 'BILLED_TO_ROOM', folio: { status: 'CLOSED', updatedAt: { gte: startOfPeriod, lte: endOfPeriod } } }
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

    // Map FolioLineItem categories
    folioPayments.forEach(p => {
      const val = p._sum.amount ? Number(p._sum.amount) : 0;
      const key = normalizeMethod(p.category);
      combined[key] = (combined[key] || 0) + val;
    });

    // Map PosPayment methods
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
    
    // 14 day window: 7 days ago to 6 days from now
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
        const d = new Date(dateStr);
        let occupiedCount = 0;
        
        reservations.forEach(res => {
          if (res.roomTypeId === rt.id) {
            // Using string dates to ignore timezone shifts for simple day comparison
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
          // clamp just in case of overbooking
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

    // Fetch last 5 reservations
    const reservations = await this.prisma.reservation.findMany({
      where: propertyId ? { propertyId } : {},
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { guest: true, room: true },
    });

    // Fetch last 5 room status changes (Check-ins/Check-outs)
    const statusChanges = await this.prisma.roomStatusHistory.findMany({
      where: propertyId ? { room: { propertyId } } : {},
      take: 5,
      orderBy: { changedAt: 'desc' },
      include: { room: true },
    });

    // Fetch last 5 POS orders
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
        description: `Room ${r.room?.number || 'Pending'} - ${r.status}`,
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

    // Group by month
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

    // 1. Folio Line Items (Room Charges, Laundry, etc.)
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

    // 2. POS Orders (Food, Drinks, Bar sales)
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

    // Categorize POS revenues
    const posCategoryTotals: Record<string, number> = {};
    for (const order of paidPosOrders) {
      const orderTotal = Number(order.totalAmount || 0);
      if (orderTotal <= 0) continue;

      if (!order.items || order.items.length === 0) {
        posCategoryTotals['FOOD_AND_BEVERAGE'] = (posCategoryTotals['FOOD_AND_BEVERAGE'] || 0) + orderTotal;
        continue;
      }

      // Calculate gross items sum to apportion total proportionally
      const grossSum = order.items.reduce((sum, it) => sum + (Number(it.menuItem?.price || 0) * (it.quantity || 1)), 0);
      for (const it of order.items) {
        const itemPrice = Number(it.menuItem?.price || 0);
        const itemGross = itemPrice * (it.quantity || 1);
        const itemAmount = grossSum > 0 ? (itemGross / grossSum) * orderTotal : orderTotal / order.items.length;

        // Determine category label
        let catName = it.menuItem?.category?.name;
        if (!catName) {
          const type = (it.menuItem?.type || '').toUpperCase();
          if (type === 'DRINK' || type === 'BAR') catName = 'BAR';
          else if (type === 'FOOD') catName = 'RESTAURANT';
          else catName = 'FOOD_AND_BEVERAGE';
        }
        posCategoryTotals[catName] = (posCategoryTotals[catName] || 0) + itemAmount;
      }
    }

    // 3. Tickets Revenue
    const whereTickets: any = {
      status: { in: ['VALID', 'USED'] },
      ...(gte && lte ? { issueDate: { gte, lte } } : {}),
      ...propCondition,
    };
    const ticketRevenue = await this.prisma.ticket.aggregate({
      _sum: { price: true },
      where: whereTickets,
    });

    // Build consolidated revenues list
    const categoryMap = new Map<string, number>();

    // From Folio
    folioRevenueItems.forEach(r => {
      const cat = r.category || 'ROOM_CHARGE';
      const amt = r._sum.amount ? r._sum.amount.toNumber() : 0;
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + amt);
    });

    // From POS
    Object.entries(posCategoryTotals).forEach(([cat, amt]) => {
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + amt);
    });

    // From Tickets
    const ticketAmt = ticketRevenue._sum.price ? ticketRevenue._sum.price.toNumber() : 0;
    if (ticketAmt > 0) {
      categoryMap.set('FACILITIES_TICKETS', (categoryMap.get('FACILITIES_TICKETS') || 0) + ticketAmt);
    }

    const revenues = Array.from(categoryMap.entries()).map(([category, amount]) => ({
      category,
      amount: Math.round(amount * 100) / 100,
    }));

    const totalRevenue = Math.round(revenues.reduce((sum, r) => sum + r.amount, 0) * 100) / 100;

    // 4. Expenses
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

    // 1. Cash Inflows:
    // a. Folio payments
    const whereFolioPayments: any = {
      type: 'PAYMENT',
      ...(gte && lte ? { createdAt: { gte, lte } } : {}),
      ...(propertyId ? { folio: propCondition } : {}),
    };
    const folioPayments = await this.prisma.folioLineItem.aggregate({
      _sum: { amount: true },
      where: whereFolioPayments,
    });

    // b. POS payments from settled orders
    const wherePosPayments: any = {
      order: { status: 'PAID' },
      ...(gte && lte ? { createdAt: { gte, lte } } : {}),
      ...(propertyId ? { OR: [{ propertyId }, { order: { propertyId } }, { propertyId: null }] } : {}),
    };
    const posPaymentsAgg = await this.prisma.posPayment.aggregate({
      _sum: { amount: true },
      where: wherePosPayments,
    });

    // Also check settled POS orders total as safety fallback
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

    // c. Ticket payments
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

    // 2. Cash Outflows: Expenses paid
    const whereExpenses: any = {
      ...(gte && lte ? { date: { gte, lte } } : {}),
      ...propCondition,
    };
    const expensesAgg = await this.prisma.expense.aggregate({
      _sum: { amount: true },
      where: whereExpenses,
    });
    const totalExpensesPaid = expensesAgg._sum.amount?.toNumber() || 0;

    // Net Cash/Bank balance
    const netCash = totalCashInflow - totalExpensesPaid;
    const cash = netCash > 0 ? Math.round(netCash * 100) / 100 : 0;
    const cashOverdraft = netCash < 0 ? Math.round(Math.abs(netCash) * 100) / 100 : 0;

    // 3. Accounts Receivable (AR)
    // a. Open Folios
    const whereOpenFolios: any = {
      status: 'OPEN',
      ...(gte && lte ? { updatedAt: { gte, lte } } : {}),
      ...propCondition,
    };
    const openFolios = await this.prisma.folio.aggregate({
      _sum: { balance: true },
      where: whereOpenFolios,
    });

    // b. Unsettled open/served POS orders
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

    // c. Company balances
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

    // 4. Liabilities
    const liabilities: any[] = [];
    if (cashOverdraft > 0) {
      liabilities.push({ name: 'Short-term Liabilities / Cash Advance', amount: cashOverdraft });
    }
    const totalLiabilities = Math.round(liabilities.reduce((sum, l) => sum + l.amount, 0) * 100) / 100;

    // 5. Equity (Assets = Liabilities + Equity => Equity = Assets - Liabilities)
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

    // Assets are Debits
    const cashAsset = bs.assets.find(a => a.name === 'Cash/Bank')?.amount || 0;
    const arAsset = bs.assets.find(a => a.name === 'Accounts Receivable')?.amount || 0;

    debits.push({ account: 'Cash/Bank', amount: cashAsset });
    debits.push({ account: 'Accounts Receivable', amount: arAsset });

    // Expenses are Debits
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

    // Revenues are Credits
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

    // Liabilities are Credits
    if (bs.liabilities.length > 0) {
      bs.liabilities.forEach(l => {
        credits.push({
          account: l.name,
          amount: l.amount,
        });
      });
    }

    // Double-Entry Balancing Check:
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
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    const propCondition = propertyId ? { OR: [{ propertyId }, { propertyId: null }] } : {};

    // 1. Get Folio Discounts
    const folioDiscounts = await this.prisma.folioLineItem.findMany({
      where: {
        createdAt: { gte: start, lte: end },
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

    // 2. Get POS Discounts
    const posDiscounts = await this.prisma.posOrder.findMany({
      where: {
        createdAt: { gte: start, lte: end },
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