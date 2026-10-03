const fs = require('fs');
let content = fs.readFileSync('apps/web/src/app/dining/page.tsx', 'utf8');

// The file has literals like \` and \${
content = content.replace(/\\`/g, '`');
content = content.replace(/\\\${/g, '${');

fs.writeFileSync('apps/web/src/app/dining/page.tsx', content);
console.log('Fixed backslashes!');
