const fs = require('fs');
let content = fs.readFileSync('apps/web/src/components/landing/DigitalMenuMarquee.tsx', 'utf8');

content = content.replace(
  'return (\n    <>\n    <section',
  'return (\n    <div className="w-full">\n    <section'
);

content = content.replace(
  '      )}\n    </>\n  );\n};',
  '      )}\n    </div>\n  );\n};'
);

fs.writeFileSync('apps/web/src/components/landing/DigitalMenuMarquee.tsx', content);
console.log('Fixed fragment error by using div!');
