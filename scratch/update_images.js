const fs = require('fs');
let content = fs.readFileSync('apps/web/src/app/page.tsx', 'utf8');

const newImages = `const IMAGES = {
  hero: "1611892440504-42a792e24d32", // Hotel room luxury
  intro: "1582719508461-905c673771fd", // Relaxation / Room
  beach: "1507525428034-b723cf961d3e", // Beach 
  pool: "1576013462273-d1a460851ec0", // Pool
  bar: "1514362545857-3bc16c4c7d1b", // Drinks
  dining: "1544148103-0773bf10d330", // Restaurant
  events: "1511795409834-ef04bbd61620", // Event
  rooms: {
    r1: "1582719508461-905c673771fd", // Room 1
    r2: "1631049307264-da0ec9d70304", // Room 2
  },
  sunset: "1507525428034-b723cf961d3e"
};`;

const startIdx = content.indexOf('const IMAGES = {');
const endIdx = content.indexOf('};', startIdx) + 2;

if (startIdx !== -1 && endIdx !== -1) {
  content = content.substring(0, startIdx) + newImages + content.substring(endIdx);
  fs.writeFileSync('apps/web/src/app/page.tsx', content, 'utf8');
  console.log('Images updated!');
}
