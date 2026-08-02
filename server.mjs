import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const HOST = '127.0.0.1';
const PORT = 5173;
const ROOT = process.cwd();
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

createServer(async (request, response) => {
  try {
    const urlPath = decodeURIComponent(new URL(request.url, `http://${HOST}`).pathname);
    const requestedPath = urlPath === '/' ? 'index.html' : urlPath.slice(1);
    const safePath = normalize(requestedPath).replace(/^(\.\.[/\\])+/, '');
    let filePath = join(ROOT, safePath);

    if ((await stat(filePath)).isDirectory()) filePath = join(filePath, 'index.html');
    const file = await readFile(filePath);
    response.writeHead(200, { 'Content-Type': TYPES[extname(filePath)] || 'application/octet-stream' });
    response.end(file);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Файл не найден');
  }
}).listen(PORT, HOST, () => {
  console.log(`Игра запущена: http://${HOST}:${PORT}`);
  console.log('Для остановки нажмите Ctrl + C');
});
