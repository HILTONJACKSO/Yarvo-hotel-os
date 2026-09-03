const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk(path.join(__dirname, '..', 'apps', 'api', 'src'));
let changedFiles = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content.replace(/@Roles\(([^)]+)\)/g, (match, p1) => {
    if (p1.includes('SUPER_ADMIN')) {
      const roles = p1.split(',').map(r => r.trim().replace(/'/g, ''));
      if (!roles.includes('ADMIN')) roles.splice(1, 0, 'ADMIN');
      if (!roles.includes('CEO')) roles.splice(2, 0, 'CEO');
      
      const newRolesStr = roles.map(r => `'${r}'`).join(', ');
      return `@Roles(${newRolesStr})`;
    }
    return match;
  });
  
  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log('Updated', file);
    changedFiles++;
  }
}
console.log('Total changed:', changedFiles);
