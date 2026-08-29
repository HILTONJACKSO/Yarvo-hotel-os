import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardMetrics() {
    // We default to UTC for start and end of "today"
    const now = new Date();
    const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const endOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

    // 1. Occupancy Rate
    const totalRooms = await this.prisma.room.count();
    const occupiedRooms = await this.prisma.room.count({
      where: { status: 'OCCUPIED' },
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
      },
    });

    // 3. Pending Reservations (Pending arrivals today or in future)
    const pendingReservations = await this.prisma.reservation.count({
      where: {
        status: 'PENDING',
      },
    });

    // 4. Today's Collected Revenue (Sum of FolioLineItems that are PAYMENT and created today)
    const revenueItems = await this.prisma.folioLineItem.aggregate({
      _sum: { amount: true },
      where: {
        type: 'PAYMENT',
        createdAt: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
    });

    const ticketRevenueItems = await this.prisma.ticket.aggregate({
      _sum: { price: true },
      where: {
        issueDate: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
    });

    // 5. Outstanding Revenue (Unpaid open folio balances + unpaid company balances)
    const openFolios = await this.prisma.folio.aggregate({
      _sum: { balance: true },
      where: { status: 'OPEN' }
    });
    
    const companyBalances = await this.prisma.company.aggregate({
      _sum: { balance: true }
    });

    const todaysRevenue = (revenueItems._sum.amount?.toNumber() || 0) + (ticketRevenueItems._sum.price?.toNumber() || 0);
    const outstandingRevenue = (openFolios._sum.balance?.toNumber() || 0) + (companyBalances._sum.balance?.toNumber() || 0);

    return {
      occupancyRate,
      checkInsToday,
      pendingReservations,
      todaysRevenue: todaysRevenue.toFixed(2),
      outstandingRevenue: outstandingRevenue.toFixed(2),
    };
  }

  async getRevenueChart() {
    const now = new Date();
    const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    
    // Last 7 days
    const startOfPeriod = new Date(startOfToday.getTime() - 6 * 24 * 60 * 60 * 1000);

    // Group by Date requires a raw query in Prisma or aggregating in memory.
    // We will aggregate in memory since hotel transaction volume per 7 days is manageable.
    const payments = await this.prisma.folioLineItem.findMany({
      where: {
        type: 'PAYMENT',
        createdAt: {
          gte: startOfPeriod,
        },
      },
      select: { amount: true, createdAt: true },
    });

    // Map to a dictionary by local date string
    const dailyRevenue: Record<string, number> = {};
    
    // Initialize the last 7 days with 0
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfPeriod.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split('T')[0];
      dailyRevenue[dateStr] = 0;
    }

    // Accumulate amounts
    payments.forEach((payment) => {
      const dateStr = payment.createdAt.toISOString().split('T')[0];
      if (dailyRevenue[dateStr] !== undefined) {
        dailyRevenue[dateStr] += payment.amount.toNumber();
      }
    });

    // Format for Recharts
    const chartData = Object.keys(dailyRevenue).map((date) => ({
      date,
      revenue: dailyRevenue[date],
    })).sort((a, b) => a.date.localeCompare(b.date));

    return chartData;
  }

  // --- F&B Analytics ---

  async getFbMetrics() {
    const now = new Date();
    const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    
    const d = new Date(now);
    const day = d.getUTCDay() || 7; 
    if (day !== 1) d.setUTCHours(-24 * (day - 1));
    const startOfWeek = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
    
    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));

    const getFbRevenueForPeriod = async (startDate: Date) => {
      const result = await this.prisma.posOrder.aggregate({
        _sum: { totalAmount: true },
        where: {
          OR: [
            { status: 'PAID', updatedAt: { gte: startDate } },
            { status: 'BILLED_TO_ROOM', folio: { status: 'CLOSED', updatedAt: { gte: startDate } } }
          ]
        }
      });
      return result._sum.totalAmount?.toNumber() || 0;
    };

    return {
      todayFbRevenue: await getFbRevenueForPeriod(startOfToday),
      weekFbRevenue: await getFbRevenueForPeriod(startOfWeek),
      monthFbRevenue: await getFbRevenueForPeriod(startOfMonth),
    };
  }

  async getFbRevenueChart() {
    const now = new Date();
    const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const startOfPeriod = new Date(startOfToday.getTime() - 6 * 24 * 60 * 60 * 1000);

    const orders = await this.prisma.posOrder.findMany({
      where: {
        OR: [
          { status: 'PAID', updatedAt: { gte: startOfPeriod } },
          { status: 'BILLED_TO_ROOM', folio: { status: 'CLOSED', updatedAt: { gte: startOfPeriod } } }
        ]
      },
      select: { totalAmount: true, updatedAt: true },
    });

    const dailyRevenue: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
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

  async getFbTopItems() {
    const topItems = await this.prisma.posOrderItem.groupBy({
      by: ['menuItemId'],
      _sum: { quantity: true },
      where: { status: 'SERVED' },
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

  async getRevenueByMethod() {
    const folioPayments = await this.prisma.folioLineItem.groupBy({
      by: ['category'],
      _sum: { amount: true },
      where: { type: 'PAYMENT' }
    });

    const posPayments = await this.prisma.posPayment.groupBy({
      by: ['method'],
      _sum: { amount: true }
    });

    const combined: Record<string, number> = {
      CASH: 0,
      CARD: 0,
      MOBILE_MONEY: 0,
      BANK: 0,
      OTHER: 0
    };

    // Map FolioLineItem categories
    folioPayments.forEach(p => {
      const val = p._sum.amount?.toNumber() || 0;
      if (p.category === 'PAYMENT_CASH') combined.CASH += val;
      else if (p.category === 'PAYMENT_CARD') combined.CARD += val;
      else if (p.category === 'PAYMENT_MOBILE') combined.MOBILE_MONEY += val;
      else if (p.category === 'PAYMENT_BANK') combined.BANK += val;
      else combined.OTHER += val;
    });

    // Map PosPayment methods
    posPayments.forEach(p => {
      const val = p._sum.amount?.toNumber() || 0;
      if (p.method === 'PAYMENT_CASH') combined.CASH += val;
      else if (p.method === 'PAYMENT_CARD') combined.CARD += val;
      else if (p.method === 'PAYMENT_MOBILE') combined.MOBILE_MONEY += val;
      else if (p.method === 'PAYMENT_BANK') combined.BANK += val;
      else combined.OTHER += val;
    });

    const chartData = Object.keys(combined).map(method => ({
      method,
      revenue: combined[method]
    })).filter(d => d.revenue > 0);

    return chartData;
  }

  async getOccupancyHeatmap() {
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
      where: { isActive: true },
      select: { 
        id: true, 
        name: true, 
        _count: { select: { rooms: { where: { isActive: true } } } } 
      }
    });

    const reservations = await this.prisma.reservation.findMany({
      where: {
        status: { in: ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'] },
        checkInDate: { lt: endPeriod },
        checkOutDate: { gt: startPeriod }
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

  async getRecentActivity() {
    // Fetch last 5 reservations
    const reservations = await this.prisma.reservation.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { guest: true, room: true },
    });

    // Fetch last 5 room status changes (Check-ins/Check-outs)
    const statusChanges = await this.prisma.roomStatusHistory.findMany({
      take: 5,
      orderBy: { changedAt: 'desc' },
      include: { room: true },
    });

    // Fetch last 5 POS orders
    const posOrders = await this.prisma.posOrder.findMany({
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

  // --- Financial Reports ---

  async getProfitAndLoss() {
    const revenueItems = await this.prisma.folioLineItem.groupBy({
      by: ['category'],
      _sum: { amount: true },
      where: { type: 'CHARGE' },
    });

    const expenseItems = await this.prisma.expense.groupBy({
      by: ['category'],
      _sum: { amount: true },
    });

    const ticketRevenue = await this.prisma.ticket.aggregate({
      _sum: { price: true },
    });

    const revenues: any[] = revenueItems.map(r => ({
      category: r.category,
      amount: r._sum.amount ? r._sum.amount.toNumber() : 0,
    }));
    
    if (ticketRevenue._sum.price && ticketRevenue._sum.price.toNumber() > 0) {
      revenues.push({
        category: 'FACILITIES_TICKETS',
        amount: ticketRevenue._sum.price.toNumber(),
      });
    }

    const totalRevenue = revenues.reduce((sum, r) => sum + r.amount, 0);

    const expenses = expenseItems.map(e => ({
      category: e.category,
      amount: e._sum.amount ? e._sum.amount.toNumber() : 0,
    }));
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    const netProfit = totalRevenue - totalExpenses;

    return { revenues, totalRevenue, expenses, totalExpenses, netProfit };
  }

  async getTrialBalance() {
    // Assets & Expenses = Debits
    // Liabilities & Revenue = Credits
    const pnl = await this.getProfitAndLoss();
    const payments = await this.prisma.folioLineItem.aggregate({
      _sum: { amount: true },
      where: { type: 'PAYMENT' }
    });
    const cash = payments._sum.amount ? payments._sum.amount.toNumber() : 0;
    
    // Unpaid Folios (AR)
    const openFolios = await this.prisma.folio.aggregate({
      _sum: { balance: true },
      where: { status: 'OPEN' }
    });
    const accountsReceivable = openFolios._sum.balance ? openFolios._sum.balance.toNumber() : 0;

    const debits = [
      { account: 'Cash/Bank', amount: cash },
      { account: 'Accounts Receivable', amount: accountsReceivable },
      { account: 'Total Expenses', amount: pnl.totalExpenses }
    ];

    const credits = [
      { account: 'Total Revenue', amount: pnl.totalRevenue }
    ];

    // In a fully balanced system, debits would equal credits. Here we just show the balances.
    const totalDebits = debits.reduce((sum, d) => sum + d.amount, 0);
    const totalCredits = credits.reduce((sum, c) => sum + c.amount, 0);

    return { debits, totalDebits, credits, totalCredits };
  }

  async getBalanceSheet() {
    const payments = await this.prisma.folioLineItem.aggregate({
      _sum: { amount: true },
      where: { type: 'PAYMENT' }
    });
    const cash = payments._sum.amount ? payments._sum.amount.toNumber() : 0;
    
    const openFolios = await this.prisma.folio.aggregate({
      _sum: { balance: true },
      where: { status: 'OPEN' }
    });
    const accountsReceivable = openFolios._sum.balance ? openFolios._sum.balance.toNumber() : 0;

    const totalAssets = cash + accountsReceivable;
    
    // In our simplified system, we don't have explicit liabilities tracked yet
    const liabilities: any[] = [];
    const totalLiabilities = 0;
    
    const equity = totalAssets - totalLiabilities;

    return {
      assets: [
        { name: 'Cash/Bank', amount: cash },
        { name: 'Accounts Receivable', amount: accountsReceivable }
      ],
      totalAssets,
      liabilities,
      totalLiabilities,
      equity
    };
  }
}

