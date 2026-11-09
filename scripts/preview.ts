/*
 * npm run preview
 * Serves the static export in out/ the way Vercel does: /burden serves burden.html,
 * /burden/ redirects to /burden, and anything unknown gets 404.html with a 404 status.
 * Set PORT to change the port.
 */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const ROOT = path.resolve(process.cwd(), 'out');
const PORT = Number(process.env.PORT ?? 4173);

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.ipynb': 'application/x-ipynb+json',
  '.map': 'application/json; charset=utf-8',
};

if (!fs.existsSync(ROOT)) {
  console.error('No out/ folder yet. Run npm run build first.');
  process.exit(1);
}

function resolveFile(pathname: string): string | null {
  const safe = path.normalize(pathname).replace(/^([/\\])+/, '');
  const candidates = [safe, `${safe}.html`, path.join(safe, 'index.html')];
  for (const candidate of candidates) {
    const full = path.join(ROOT, candidate);
    if (full.startsWith(ROOT) && fs.existsSync(full) && fs.statSync(full).isFile()) return full;
  }
  return null;
}

const server = http.createServer((request, response) => {
  const { pathname } = new URL(request.url ?? '/', 'http://localhost');

  if (pathname.length > 1 && pathname.endsWith('/')) {
    response.writeHead(308, { Location: pathname.replace(/\/+$/, '') });
    response.end();
    return;
  }

  const file = resolveFile(decodeURIComponent(pathname));
  const target = file ?? path.join(ROOT, '404.html');
  response.writeHead(file ? 200 : 404, {
    'Content-Type': TYPES[path.extname(target)] ?? 'application/octet-stream',
  });
  fs.createReadStream(target).pipe(response);
});

server.listen(PORT, () => {
  console.log(`Serving out/ at http://localhost:${PORT}`);
});
