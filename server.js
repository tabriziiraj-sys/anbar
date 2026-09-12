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
        res.end('<html><body><h1>404 - فایل یافت نشد</h1></body></html>', 'utf-8');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`<html><body><h1>500 - خطای سرور</h1><p>${err.code}</p></body></html>`, 'utf-8');
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
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║              انبارینو - سیستم مدیریت انبار                 ║');
  console.log('║                                                            ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log('║                                                            ║');
  console.log(`║  ✓ سرور با موفقیت راه‌اندازی شد                             ║`);
  console.log(`║  ✓ پورت: ${PORT}                                                 ║`);
  console.log('║                                                            ║');
  console.log('║  🌐 آدرس دسترسی:                                          ║');
  console.log(`║     http://localhost:${PORT}                                     ║`);
  console.log('║                                                            ║');
  console.log('║  👤 کاربرهای آزمایشی:                                      ║');
  console.log('║     admin / 1234                                           ║');
  console.log('║     sara / 1234                                            ║');
  console.log('║                                                            ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log('║  برای توقف سرور: Ctrl+C                                    ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error('');
    console.error('╔════════════════════════════════════════════════════════════╗');
    console.error('║  ✗ خطا: پورت 3008 در حال استفاده است                      ║');
    console.error('║                                                            ║');
    console.error('║  لطفاً برنامه‌ای که از این پورت استفاده می‌کند را ببندید   ║');
    console.error('║  یا پورت را در فایل server.js تغییر دهید.                  ║');
    console.error('╚════════════════════════════════════════════════════════════╝');
    console.error('');
  } else {
    console.error('خطای سرور:', err);
  }
  process.exit(1);
});
