const fs = require('fs');
let code = fs.readFileSync('apps/web/src/app/dashboard/reports/page.tsx', 'utf8');

// Fix types
code = code.replace('type FbMetrics = { todayFbRevenue: number; todayFbIndex: number; weekFbRevenue: number; weekFbIndex: number; monthFbRevenue: number; monthFbIndex: number; };', 'type FbMetrics = { todayFbRevenue: number; todayFbIndex: number; weekFbRevenue: number; weekFbIndex: number; monthFbRevenue: number; monthFbIndex: number; customRangeRevenue?: number; };');
code = code.replace('type TicketMetrics = { adultTickets: number; kidTickets: number; poolTickets: number; totalRevenue: number; todayRevenue: number; weekRevenue: number; monthRevenue: number; validCount: number; usedCount: number; chart: { month: string; adults: number; kids: number; pool: number; revenue: number; }[]; };', 'type TicketMetrics = { adultTickets: number; kidTickets: number; poolTickets: number; totalRevenue: number; todayRevenue: number; weekRevenue: number; monthRevenue: number; customRangeRevenue?: number; validCount: number; usedCount: number; chart: { month: string; adults: number; kids: number; pool: number; revenue: number; }[]; };');
code = code.replace('type EventMetrics = { totalBookings: number; confirmedCount: number; totalRevenue: number; todayRevenue: number; weekRevenue: number; monthRevenue: number; bookings: any[]; };', 'type EventMetrics = { totalBookings: number; confirmedCount: number; totalRevenue: number; todayRevenue: number; weekRevenue: number; monthRevenue: number; customRangeRevenue?: number; bookings: any[]; };');

// Fix render
code = code.replace('{startDate && endDate && fbMetrics?.customRangeRevenue != null && (', '{fbMetrics?.customRangeRevenue != null && fbMetrics?.customRangeRevenue !== undefined && (');
code = code.replace('{startDate && endDate && ticketMetrics?.customRangeRevenue != null && (', '{ticketMetrics?.customRangeRevenue != null && ticketMetrics?.customRangeRevenue !== undefined && (');
code = code.replace('{startDate && endDate && eventMetrics?.customRangeRevenue != null && (', '{eventMetrics?.customRangeRevenue != null && eventMetrics?.customRangeRevenue !== undefined && (');

fs.writeFileSync('apps/web/src/app/dashboard/reports/page.tsx', code);
