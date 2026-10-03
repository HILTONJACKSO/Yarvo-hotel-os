const fs = require('fs');
let content = fs.readFileSync('apps/web/src/components/landing/DigitalMenuMarquee.tsx', 'utf8');

content = content.replace(
  'return (\n    <section',
  'return (\n    <>\n    <section'
);

fs.writeFileSync('apps/web/src/components/landing/DigitalMenuMarquee.tsx', content);
console.log('Fixed fragment error!');
