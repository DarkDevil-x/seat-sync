const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = [...walk('./api'), ...walk('./server')];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  // Match import/export from relative paths without extensions
  const regex = /(from\s+['"]\.\.?\/[^'"]+)(['"])/g;
  let changed = false;
  
  content = content.replace(regex, (match, p1, p2) => {
    if (!p1.endsWith('.js') && !p1.endsWith('.ts')) {
      changed = true;
      return p1 + '.js' + p2;
    }
    return match;
  });

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed imports in', file);
  }
});
