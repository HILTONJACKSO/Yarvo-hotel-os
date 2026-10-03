const fs = require('fs');

let content = fs.readFileSync('apps/web/src/app/page.tsx', 'utf8');

// 1. Add import
if (!content.includes('BookingBarInteractive')) {
  // Find a good place to put the import
  content = content.replace('import Link from "next/link";', 'import Link from "next/link";\nimport { BookingBarInteractive } from "../components/landing/BookingBarInteractive";');
}

// 2. Remove local BookingBar component
const startIdx = content.indexOf('const BookingBar = () => {');
const endIdx = content.indexOf('};', content.indexOf('</section>', startIdx)) + 2;

if (startIdx !== -1 && endIdx !== -1) {
  content = content.substring(0, startIdx) + content.substring(endIdx);
}

// 3. Replace <BookingBar /> in render
content = content.replace('<BookingBar />', '<BookingBarInteractive />');

fs.writeFileSync('apps/web/src/app/page.tsx', content, 'utf8');
console.log('Replaced BookingBar!');
