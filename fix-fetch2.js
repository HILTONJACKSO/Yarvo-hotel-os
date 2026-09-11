const fs = require('fs');
let code = fs.readFileSync('apps/web/src/app/dashboard/cashier/page.tsx', 'utf8');
code = code.replace(/fetch\(\\\$\{API_URL\}\/api/g, 'fetch(\/api');
code = code.replace(/orders, \{ credentials/g, 'orders, { credentials');
code = code.replace(/tables, \{ credentials/g, 'tables, { credentials');
code = code.replace(/orders\/transfer, \{/g, 'orders/transfer, {');
fs.writeFileSync('apps/web/src/app/dashboard/cashier/page.tsx', code);
