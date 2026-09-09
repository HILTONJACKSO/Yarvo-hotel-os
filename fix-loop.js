const fs = require('fs');
let code = fs.readFileSync('apps/api/src/modules/analytics/analytics.service.ts', 'utf8');
code = code.replace(
  /const dailyRevenue: Record<string, number> = \{\};\r?\n    for \(let i = 0; i < 7; i\+\+\)/g,
  'const dailyRevenue: Record<string, number> = {};\n    let days = 7; if (start && end) days = Math.ceil((endOfPeriod.getTime() - startOfPeriod.getTime()) / (1000 * 3600 * 24)); for (let i = 0; i < days; i++)'
);
fs.writeFileSync('apps/api/src/modules/analytics/analytics.service.ts', code);
