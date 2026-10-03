const fs = require('fs');

const fixUrl = (file) => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/\$\{apiUrl\}\/api\/public/g, '${apiUrl}/api/v1/public');
  fs.writeFileSync(file, content, 'utf8');
};

fixUrl('apps/web/src/app/api/booking/route.ts');
fixUrl('apps/web/src/app/api/menu-orders/route.ts');
console.log('Fixed proxy URLs to use v1!');
