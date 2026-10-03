const fs = require('fs');

let content = fs.readFileSync('apps/web/next.config.ts', 'utf8');

if (!content.includes('images: {')) {
  content = content.replace(
    `output: 'standalone',`,
    `images: {\n    remotePatterns: [\n      { protocol: 'https', hostname: 'images.unsplash.com' },\n      { protocol: 'http', hostname: 'localhost' },\n      { protocol: 'https', hostname: 'api.kwaleebeachresort.com' }\n    ]\n  },\n  output: 'standalone',`
  );
  fs.writeFileSync('apps/web/next.config.ts', content, 'utf8');
  console.log('Added images config to next.config.ts');
}
