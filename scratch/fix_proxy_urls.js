const fs = require('fs');

const fixUrl = (file) => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/\$\{apiUrl\}\/public/g, '${apiUrl}/api/public');
  fs.writeFileSync(file, content, 'utf8');
};

fixUrl('apps/web/src/app/api/booking/route.ts');
fixUrl('apps/web/src/app/api/menu-orders/route.ts');
console.log('Fixed proxy URLs!');
