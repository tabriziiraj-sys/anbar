const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3008;
const DIST_DIR = path.join(__dirname, 'dist');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'font/otf',
};

const server = http.createServer((req, res) => {
  let filePath = path.join(DIST_DIR, req.url === '/' ? 'index.html' : req.url);
  
  // اگر فایل وجود نداشت، index.html را برگردان (برای SPA routing)
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<html><body><h1>404 - File Not Found</h1></body></html>', 'utf-8');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<html><body><h1>500 - Server Error</h1></body></html>', 'utf-8');
      }
      return;
    }

    res.writeHead(200, { 
      'Content-Type': contentType,
      'Cache-Control': 'no-cache'
    });
    res.end(content, 'utf-8');
  });
});

server.listen(PORT, () => {
  console.log('');
  console.log('========================================================');
  console.log('       Anbarino - Warehouse Management System');
  console.log('========================================================');
  console.log('');
  console.log('  [OK] Server started successfully');
  console.log('  [OK] Port: ' + PORT);
  console.log('');
  console.log('  Access URL:');
  console.log('     http://localhost:' + PORT);
  console.log('');
  console.log('  Test Users:');
  console.log('     admin / 1234');
  console.log('     sara / 1234');
  console.log('');
  console.log('========================================================');
  console.log('  Press Ctrl+C to stop the server');
  console.log('========================================================');
  console.log('');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error('');
    console.error('========================================================');
    console.error('  [ERROR] Port 3008 is already in use');
    console.error('========================================================');
    console.error('');
    console.error('  Please close the program using this port');
    console.error('  or change the port in server.cjs');
    console.error('');
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});
