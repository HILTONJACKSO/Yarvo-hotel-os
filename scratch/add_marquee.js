const fs = require('fs');

let content = fs.readFileSync('apps/web/src/app/page.tsx', 'utf8');

// 1. Add import
if (!content.includes('DigitalMenuMarquee')) {
  content = content.replace('import { BookingBarInteractive } from "../components/landing/BookingBarInteractive";', 'import { BookingBarInteractive } from "../components/landing/BookingBarInteractive";\nimport { DigitalMenuMarquee } from "../components/landing/DigitalMenuMarquee";');
}

// 2. Add Component to LandingPage
if (!content.includes('<DigitalMenuMarquee />')) {
  content = content.replace('<CoverflowTestimonialsSection />', '<DigitalMenuMarquee />\n        <CoverflowTestimonialsSection />');
}

fs.writeFileSync('apps/web/src/app/page.tsx', content, 'utf8');
console.log('Added DigitalMenuMarquee!');
