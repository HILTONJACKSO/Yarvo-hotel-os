const fs = require('fs');

const files = [
  'apps/web/src/app/dashboard/billing/page.tsx',
  'apps/web/src/app/dashboard/cashier/page.tsx',
  'apps/web/src/app/dashboard/inventory/page.tsx',
  'apps/web/src/app/dashboard/tickets/page.tsx',
  'apps/web/src/components/front-desk/CheckOutModal.tsx'
];

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    content = content.replace(/iframe\.style\.position = 'fixed';\s*iframe\.style\.right = '0';\s*iframe\.style\.bottom = '0';\s*iframe\.style\.width = '0';\s*iframe\.style\.height = '0';\s*iframe\.style\.border = '0';/g,
`    iframe.style.position = 'absolute';
    iframe.style.left = '-9999px';
    iframe.style.top = '-9999px';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';`);
    
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed', file);
  }
}
