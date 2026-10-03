const fs = require('fs');
let content = fs.readFileSync('apps/web/src/app/page.tsx', 'utf8');

content = content.replace('import { DigitalMenuMarquee } from "../components/landing/DigitalMenuMarquee";\n', '');
content = content.replace('        <DigitalMenuMarquee />\n', '');
content = content.replace('<DigitalMenuMarquee />\n', '');

fs.writeFileSync('apps/web/src/app/page.tsx', content);
console.log('Removed from home!');
