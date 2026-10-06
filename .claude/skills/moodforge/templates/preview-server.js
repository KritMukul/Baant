// Zero-dep preview server for the design-pipeline visual companion fallback.
//
// Use when the brainstorming visual companion is not available (CLI demo,
// standalone preview, anything outside a full pipeline session).
//
// Run with:
//   nohup node templates/preview-server.js path/to/preview.html > /tmp/preview.log 2>&1 &
//
// The server prints the URL to stdout (and the log file). Capture it from
// the log, then open the user's browser pointed at the URL — never ask
// them to click a link.

import http from 'node:http';
import fs from 'node:fs';
import { exec } from 'node:child_process';

const file = process.argv[2] || 'preview.html';
const html = fs.readFileSync(file, 'utf8');

const server = http.createServer((_, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
});

server.listen(0, '127.0.0.1', () => {
  const { port } = server.address();
  const url = `http://127.0.0.1:${port}`;
  const opener = process.platform === 'darwin' ? 'open'
               : process.platform === 'win32'  ? 'start ""'
               : 'xdg-open';
  exec(`${opener} ${url}`);
  console.log(url);
});
