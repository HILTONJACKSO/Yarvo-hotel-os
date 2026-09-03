const fs = require('fs');
const files = [
  'apps/api/src/modules/audit-logs/audit-logs.controller.ts',
  'apps/api/src/modules/companies/companies.controller.ts',
  'apps/api/src/modules/guests/guests.controller.ts',
  'apps/api/src/modules/reservations/reservations.controller.ts'
];
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/'ACCOUNTING'/g, "'ACCOUNTANT'");
  fs.writeFileSync(f, content);
  console.log('Updated ' + f);
});
