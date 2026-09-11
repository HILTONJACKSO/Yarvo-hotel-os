const fs = require('fs');
let code = fs.readFileSync('apps/web/src/app/dashboard/cashier/page.tsx', 'utf8');
code = code.replace("{o.table ? \\Table \\ : 'Walk-in'}", "{o.table ? 'Table ' + o.table.number : 'Walk-in'}");
code = code.replace("- {o.id.substring(0,6)} -             {Number(o.totalAmount).toFixed(2)}", "- {o.id.substring(0,6)} - ");
fs.writeFileSync('apps/web/src/app/dashboard/cashier/page.tsx', code);
