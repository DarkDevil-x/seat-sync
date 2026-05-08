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

const apiFiles = walk('./api').map(f => f.replace(/\\/g, '/').replace('api/', ''));

// We will move 'api' to 'server/api'
const imports = [];
const routes = [];

apiFiles.forEach((file, index) => {
  if (file === 'index.ts') return; // skip if any
  const varName = `route_${index}`;
  const importPath = `../server/api/${file.replace('.ts', '.js')}`;
  imports.push(`import ${varName} from '${importPath}';`);
  
  // Convert file path to route
  // e.g. auth/google/callback.ts -> /api/auth/google/callback
  // e.g. auth/google/index.ts -> /api/auth/google
  // e.g. bookings/[id].ts -> /api/bookings/(dynamic)
  let routePath = '/api/' + file.replace('.ts', '');
  if (routePath.endsWith('/index')) routePath = routePath.replace('/index', '');
  
  // Handle dynamic parameters [id]
  if (routePath.includes('[id]')) {
    const regexPath = routePath.replace('[id]', '([^/]+)');
    routes.push(`
  const match_${index} = pathname.match(/^${regexPath.replace(/\//g, '\\/')}$/);
  if (match_${index}) {
    req.query.id = match_${index}[1];
    return ${varName}(req, res);
  }`);
  } else {
    routes.push(`  if (pathname === '${routePath}') return ${varName}(req, res);`);
  }
});

const routerCode = `
import type { VercelRequest, VercelResponse } from '@vercel/node';

${imports.join('\n')}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const pathname = req.url ? req.url.split('?')[0] : '/';

${routes.join('\n')}

  return res.status(404).json({ error: 'Route not found: ' + pathname });
}
`;

fs.writeFileSync('router.ts', routerCode);
console.log('Router generated.');
