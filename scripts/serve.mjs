// Tiny static server for testing the website.
//   node scripts/serve.mjs            → this computer only: http://localhost:8080
//   node scripts/serve.mjs 8080 --lan → also your phone on the same Wi-Fi (prints the address)
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize, dirname } from 'node:path';
import { networkInterfaces } from 'node:os';
import { fileURLToPath } from 'node:url';

const webRoot = join(dirname(fileURLToPath(import.meta.url)), '..', 'web');
const args = process.argv.slice(2);
const lan = args.includes('--lan');
const port = Number(args.find((a) => /^\d+$/.test(a)) || process.env.PORT || 8080);
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8',
};

createServer(async (req, res) => {
  try {
    let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    path = normalize(path).replace(/^([\\/])+/, '');
    let file = join(webRoot, path);
    if (!file.startsWith(webRoot)) { res.writeHead(403).end(); return; }
    if ((await stat(file).catch(() => null))?.isDirectory()) file = join(file, 'index.html');
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found');
  }
}).listen(port, lan ? '0.0.0.0' : '127.0.0.1', () => {
  console.log(`Health Plate running at http://localhost:${port}`);
  if (lan) {
    const ips = Object.values(networkInterfaces()).flat()
      .filter((n) => n && n.family === 'IPv4' && !n.internal).map((n) => n.address);
    ips.forEach((ip) => console.log(`On your phone (same Wi-Fi): http://${ip}:${port}`));
    console.log('Windows may ask to allow Node.js through the firewall: allow it on private networks.');
  }
});
