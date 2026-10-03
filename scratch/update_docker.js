const fs = require('fs');

let content = fs.readFileSync('docker-compose.prod.yml', 'utf8');

// Add PUBLIC_API_KEY to api environment if not there
if (content.includes('- CORS_ORIGINS=https://kwaleebeachresort.com,https://www.kwaleebeachresort.com') && !content.includes('PUBLIC_API_KEY')) {
  content = content.replace(
    '- CORS_ORIGINS=https://kwaleebeachresort.com,https://www.kwaleebeachresort.com',
    '- CORS_ORIGINS=https://kwaleebeachresort.com,https://www.kwaleebeachresort.com\n      - PUBLIC_API_KEY=yarvo_pub_test_1234567890abcdef'
  );
}

// Add PUBLIC_API_KEY and INTERNAL_API_URL to web environment if not there
if (content.includes('- NEXT_PUBLIC_APP_NAME="Kwalee Beach Resort"') && !content.includes('INTERNAL_API_URL')) {
  content = content.replace(
    '- NEXT_PUBLIC_APP_NAME="Kwalee Beach Resort"',
    '- NEXT_PUBLIC_APP_NAME="Kwalee Beach Resort"\n      - INTERNAL_API_URL=http://api:3001\n      - PUBLIC_API_KEY=yarvo_pub_test_1234567890abcdef'
  );
}

fs.writeFileSync('docker-compose.prod.yml', content, 'utf8');
console.log('Updated docker-compose.prod.yml');
