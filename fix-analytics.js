const fs = require('fs');
let code = fs.readFileSync('apps/api/src/modules/analytics/analytics.service.ts', 'utf8');

code = code.replace('async getFbMetrics() {', 'async getFbMetrics(start?: string, end?: string) {');
code = code.replace('const getFbRevenueForPeriod = async (startDate: Date) => {', 'const getFbRevenueForPeriod = async (startDate: Date, endDate?: Date) => {\n      const dateFilter: any = { gte: startDate };\n      if (endDate) dateFilter.lte = endDate;');
code = code.replace('OR: [\n            { status: \'PAID\', updatedAt: { gte: startDate } },\n            { status: \'BILLED_TO_ROOM\', folio: { status: \'CLOSED\', updatedAt: { gte: startDate } } }\n          ]', 'OR: [\n            { status: \'PAID\', updatedAt: dateFilter },\n            { status: \'BILLED_TO_ROOM\', folio: { status: \'CLOSED\', updatedAt: dateFilter } }\n          ]');
code = code.replace('return result._sum.totalAmount?.toNumber() || 0;', 'return result._sum.totalAmount ? Number(result._sum.totalAmount) : 0;');
code = code.replace('monthFbIndex: Math.max(0, (monthRev - monthDed) / 4),\n    };', 'monthFbIndex: Math.max(0, (monthRev - monthDed) / 4),\n      customRangeRevenue: start && end ? await getFbRevenueForPeriod(new Date(start), new Date(new Date(end).setUTCHours(23, 59, 59, 999))) : null\n    };');

code = code.replace('async getTicketsMetrics() {', 'async getTicketsMetrics(start?: string, end?: string) {');
code = code.replace('const monthRevenue = tickets\n      .filter(t => new Date(t.issueDate) >= startOfMonth)\n      .reduce((acc, t) => acc + Number(t.price), 0);', 'const monthRevenue = tickets\n      .filter(t => new Date(t.issueDate) >= startOfMonth)\n      .reduce((acc, t) => acc + Number(t.price), 0);\n\n    let customRangeRevenue = null;\n    if (start && end) {\n      const startDate = new Date(start);\n      const endDate = new Date(new Date(end).setUTCHours(23, 59, 59, 999));\n      customRangeRevenue = tickets\n        .filter(t => {\n          const d = new Date(t.issueDate);\n          return d >= startDate && d <= endDate;\n        })\n        .reduce((acc, t) => acc + Number(t.price), 0);\n    }');
code = code.replace('monthRevenue,\n      validCount', 'monthRevenue,\n      customRangeRevenue,\n      validCount');

code = code.replace('async getEventsMetrics() {', 'async getEventsMetrics(start?: string, end?: string) {');
code = code.replace('const monthRevenue = bookings\n      .filter(b => new Date(b.startTime) >= startOfMonth)\n      .reduce((acc, b) => acc + Number(b.totalAmount), 0);', 'const monthRevenue = bookings\n      .filter(b => new Date(b.startTime) >= startOfMonth)\n      .reduce((acc, b) => acc + Number(b.totalAmount), 0);\n\n    let customRangeRevenue = null;\n    if (start && end) {\n      const startDate = new Date(start);\n      const endDate = new Date(new Date(end).setUTCHours(23, 59, 59, 999));\n      customRangeRevenue = bookings\n        .filter(b => {\n          const d = new Date(b.startTime);\n          return d >= startDate && d <= endDate;\n        })\n        .reduce((acc, b) => acc + Number(b.totalAmount), 0);\n    }');
code = code.replace('monthRevenue,\n      bookings', 'monthRevenue,\n      customRangeRevenue,\n      bookings');

fs.writeFileSync('apps/api/src/modules/analytics/analytics.service.ts', code);
