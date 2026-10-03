const fs = require('fs');

const updateNav = () => {
  let content = fs.readFileSync('apps/web/src/components/landing/Navbar.tsx', 'utf8');
  content = content.replace('href: "#stay"', 'href: "/#stay"');
  content = content.replace('href: "#beach"', 'href: "/#beach"');
  content = content.replace('href: "#pool"', 'href: "/#pool"');
  content = content.replace('href: "#dining"', 'href: "/dining"');
  content = content.replace('href: "#events"', 'href: "/#events"');
  content = content.replace('href: "#gallery"', 'href: "/#gallery"');
  content = content.replace('href: "#contact"', 'href: "/#contact"');
  
  // also the mobile menu and the header actions?
  content = content.replace(/href="#book"/g, 'href="/#book"');

  fs.writeFileSync('apps/web/src/components/landing/Navbar.tsx', content, 'utf8');
};

const updateFooter = () => {
  let content = fs.readFileSync('apps/web/src/components/landing/Footer.tsx', 'utf8');
  content = content.replace('href="#stay"', 'href="/#stay"');
  content = content.replace('href="#beach"', 'href="/#beach"');
  content = content.replace('href="#pool"', 'href="/#pool"');
  content = content.replace('href="#dining"', 'href="/dining"');
  content = content.replace('href="#events"', 'href="/#events"');
  content = content.replace('href="#gallery"', 'href="/#gallery"');
  
  fs.writeFileSync('apps/web/src/components/landing/Footer.tsx', content, 'utf8');
};

updateNav();
updateFooter();
console.log('Updated links!');
