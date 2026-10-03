const fs = require('fs');
let content = fs.readFileSync('apps/web/src/components/landing/DigitalMenuMarquee.tsx', 'utf8');

content = content.replace(
  'return (\n    <div className="w-full">\n    <section',
  'return (\n    <>\n    <section'
);

content = content.replace(
  '      {/* Order Modal */}',
  '    </section>\n\n      {/* Order Modal */}'
);

content = content.replace(
  '      )}\n    </div>\n  );\n};',
  '      )}\n    </>\n  );\n};'
);

fs.writeFileSync('apps/web/src/components/landing/DigitalMenuMarquee.tsx', content);
console.log('Fixed section closing tag!');
