/* Minimal static file server — avoids pulling in an extra dependency.
   Usage: node scripts/serve.mjs [root] [port] */
import { createServer } from 'node:http';
import { stat, readFile } from 'node:fs/promises';
import { join, extname, resolve, sep } from 'node:path';
import { gzipSync } from 'node:zlib';

/* GitHub Pages gzips text responses. Without this, local measurements punish
   the site for bytes production would never send. */
const COMPRESSIBLE = /^(text\/|application\/(json|xml|manifest))/;

const root = resolve(process.argv[2] || '.');
const port = Number(process.argv[3] || 8080);

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml', '.webmanifest': 'application/manifest+json',
};

createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.endsWith('/')) p += 'index.html';
    const file = resolve(join(root, p));
    // Keep requests inside the served root.
    if (file !== root && !file.startsWith(root + sep)) throw new Error('escape');
    const s = await stat(file);
    if (s.isDirectory()) throw new Error('dir');
    let body = await readFile(file);
    const type = TYPES[extname(file).toLowerCase()] || 'application/octet-stream';
    const headers = { 'Content-Type': type, 'Cache-Control': 'no-store' };

    if (COMPRESSIBLE.test(type) && (req.headers['accept-encoding'] || '').includes('gzip')) {
      body = gzipSync(body);
      headers['Content-Encoding'] = 'gzip';
      headers.Vary = 'Accept-Encoding';
    }
    headers['Content-Length'] = body.length;

    res.writeHead(200, headers);
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404');
  }
}).listen(port, () => console.log(`serving ${root} on http://localhost:${port}`));
