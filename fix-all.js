const fs = require('fs');
let code = fs.readFileSync('apps/api/src/modules/analytics/analytics.service.ts', 'utf8');

// Convert everything to LF for easy matching
code = code.replace(/\r\n/g, '\n');

// 1. getRevenueChart
code = code.replace(
  'async getRevenueChart() {\n    const now = new Date();\n    const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));\n    \n    // Last 7 days\n    const startOfPeriod = new Date(startOfToday.getTime() - 6 * 24 * 60 * 60 * 1000);',
  'async getRevenueChart(start?: string, end?: string) {\n    const now = new Date();\n    const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));\n    \n    let startOfPeriod = new Date(startOfToday.getTime() - 6 * 24 * 60 * 60 * 1000);\n    let endOfPeriod = now;\n    if (start && end) {\n      startOfPeriod = new Date(start);\n      endOfPeriod = new Date(new Date(end).setUTCHours(23, 59, 59, 999));\n    }'
);

// 2. getFbMetrics
code = code.replace(
  'monthFbIndex: Math.max(0, (monthRev - monthDed) / 4),\n    };',
  'monthFbIndex: Math.max(0, (monthRev - monthDed) / 4),\n      customRangeRevenue: start && end ? await getFbRevenueForPeriod(new Date(start), new Date(new Date(end).setUTCHours(23, 59, 59, 999))) : null\n    };'
);

// 3. getFbRevenueChart
code = code.replace(
  'async getFbRevenueChart() {\n    const now = new Date();\n    const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));\n    const startOfPeriod = new Date(startOfToday.getTime() - 6 * 24 * 60 * 60 * 1000);',
  'async getFbRevenueChart(start?: string, end?: string) {\n    const now = new Date();\n    const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));\n    let startOfPeriod = new Date(startOfToday.getTime() - 6 * 24 * 60 * 60 * 1000);\n    let endOfPeriod = now;\n    if (start && end) {\n      startOfPeriod = new Date(start);\n      endOfPeriod = new Date(new Date(end).setUTCHours(23, 59, 59, 999));\n    }'
);
code = code.replace(
  'OR: [\n          { status: \'PAID\', updatedAt: { gte: startOfPeriod } },\n          { status: \'BILLED_TO_ROOM\', folio: { status: \'CLOSED\', updatedAt: { gte: startOfPeriod } } }\n        ]',
  'OR: [\n          { status: \'PAID\', updatedAt: { gte: startOfPeriod, lte: endOfPeriod } },\n          { status: \'BILLED_TO_ROOM\', folio: { status: \'CLOSED\', updatedAt: { gte: startOfPeriod, lte: endOfPeriod } } }\n        ]'
);

// 4. getTicketsMetrics
code = code.replace(
  'const monthRevenue = tickets\n      .filter(t => new Date(t.issueDate) >= startOfMonth)\n      .reduce((acc, t) => acc + Number(t.price), 0);',
  'const monthRevenue = tickets\n      .filter(t => new Date(t.issueDate) >= startOfMonth)\n      .reduce((acc, t) => acc + Number(t.price), 0);\n\n    let customRangeRevenue = null;\n    if (start && end) {\n      const startDate = new Date(start);\n      const endDate = new Date(new Date(end).setUTCHours(23, 59, 59, 999));\n      customRangeRevenue = tickets\n        .filter(t => {\n          const d = new Date(t.issueDate);\n          return d >= startDate && d <= endDate;\n        })\n        .reduce((acc, t) => acc + Number(t.price), 0);\n    }'
);
code = code.replace(
  'monthRevenue,\n      validCount,',
  'monthRevenue,\n      customRangeRevenue,\n      validCount,'
);

// 5. getEventsMetrics
code = code.replace(
  'const monthRevenue = bookings\n      .filter(b => new Date(b.startTime) >= startOfMonth)\n      .reduce((acc, b) => acc + Number(b.totalAmount), 0);',
  'const monthRevenue = bookings\n      .filter((b: any) => new Date(b.startTime) >= startOfMonth)\n      .reduce((acc: number, b: any) => acc + Number(b.totalAmount), 0);\n\n    let customRangeRevenue = null;\n    if (start && end) {\n      const startDate = new Date(start);\n      const endDate = new Date(new Date(end).setUTCHours(23, 59, 59, 999));\n      customRangeRevenue = bookings\n        .filter((b: any) => {\n          const d = new Date(b.startTime);\n          return d >= startDate && d <= endDate;\n        })\n        .reduce((acc: number, b: any) => acc + Number(b.totalAmount), 0);\n    }'
);
code = code.replace(
  'monthRevenue,\n      bookings:',
  'monthRevenue,\n      customRangeRevenue,\n      bookings:'
);

code = code.replace(
  'bookings: bookings.map(b => ({\n        id: b.id,\n        eventType: b.eventType,\n        status: b.status,\n        date: b.startTime,\n        revenue: b.totalAmount\n      }))',
  'bookings: bookings.map((b: any) => ({\n        id: b.id,\n        eventType: b.eventType,\n        status: b.status,\n        date: b.startTime,\n        revenue: b.totalAmount\n      }))'
);

fs.writeFileSync('apps/api/src/modules/analytics/analytics.service.ts', code);
