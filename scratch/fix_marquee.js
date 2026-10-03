const fs = require('fs');
let content = fs.readFileSync('apps/web/src/components/landing/DigitalMenuMarquee.tsx', 'utf8');

content = content.replace(/\\`/g, '`');
content = content.replace(/\\\$/g, '$');

fs.writeFileSync('apps/web/src/components/landing/DigitalMenuMarquee.tsx', content);
console.log('Fixed syntax error!');
