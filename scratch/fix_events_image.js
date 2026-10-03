const fs = require('fs');
let content = fs.readFileSync('apps/web/src/app/page.tsx', 'utf8');

const oldEvents = 'events: "1511795409834-ef04bbd61620",';
const newEvents = 'events: "1499793983690-e29da59ef1c2",'; // known working ID

content = content.replace(oldEvents, newEvents);
fs.writeFileSync('apps/web/src/app/page.tsx', content, 'utf8');
console.log('Fixed broken events image ID!');
