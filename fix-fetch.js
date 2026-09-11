const fs = require('fs');
let code = fs.readFileSync('apps/web/src/app/dashboard/cashier/page.tsx', 'utf8');
code = code.replace(/fetch\(\\\/api/g, 'fetch(${API_URL}/api');
fs.writeFileSync('apps/web/src/app/dashboard/cashier/page.tsx', code);
