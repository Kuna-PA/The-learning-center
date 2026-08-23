// ============================================================
//  IT / SysEng Learning Center — เซิร์ฟเวอร์
//  เสิร์ฟไฟล์หน้าเว็บ + REST API สำหรับบัญชีผู้ใช้และความคืบหน้า
//  ใช้เฉพาะของที่ติดมากับ Node เอง ไม่มี dependency ภายนอก
//
//  รันด้วย:  node server.js
//  ตัวแปรที่ตั้งได้:  PORT (ค่าเริ่มต้น 5173) · LC_DATA_DIR · LC_ADMIN_PASSWORD
// ============================================================
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import api, { OPEN_REGISTER } from './server/api.js';
import { ensureFirstAdmin, isSecureRequest, purgeLoginFailures } from './server/auth.js';
import { sessions, DB_PATH } from './server/db.js';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 5173;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
};

// ไฟล์ฐานข้อมูลและโค้ดฝั่งเซิร์ฟเวอร์ ห้ามเสิร์ฟออกไปเด็ดขาด
const BLOCKED = [/^[/\\]?server([/\\]|\.js$)/i, /^[/\\]?data-db[/\\]/i, /\.db($|-)/i, /^[/\\]?test[/\\]/i, /^[/\\]?scripts[/\\]/i, /^[/\\]?node_modules[/\\]/i];

/**
 * header ความปลอดภัยที่ต้องติดไปกับทุก response
 * CSP อนุญาตเฉพาะสคริปต์ของตัวเอง (แอปนี้ไม่มี inline script และไม่ใช้ eval เลย)
 * ส่วน style ต้องเปิด unsafe-inline เพราะหน้าเว็บใช้ style="" กับ element ที่สร้างจาก JS
 */
const securityHeaders = (secure) => ({
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data:",
    "connect-src 'self'",
    "base-uri 'none'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; '),
  ...(secure ? { 'Strict-Transport-Security': 'max-age=15552000; includeSubDomains' } : {}),
});

function serveStatic(req, res, pathname) {
  const sec = securityHeaders(isSecureRequest(req));
  const p = pathname === '/' ? '/index.html' : pathname;
  const rel = path.normalize(p).replace(/^(\.\.[/\\])+/, '');
  if (BLOCKED.some((re) => re.test(rel))) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8', ...sec });
    return res.end('403 Forbidden');
  }
  const file = path.join(ROOT, rel);
  if (!file.startsWith(ROOT)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8', ...sec });
    return res.end('403 Forbidden');
  }
  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8', ...sec });
      return res.end('404 Not Found: ' + pathname);
    }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
      ...sec,
    });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  const pathname = decodeURIComponent((req.url || '/').split('?')[0]);

  if (pathname === '/api' || pathname.startsWith('/api/')) {
    try {
      await api(req, res, pathname);
    } catch (e) {
      console.error('[api]', e);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' }));
      }
    }
    return;
  }

  serveStatic(req, res, pathname);
});

server.listen(PORT, () => {
  const first = ensureFirstAdmin();
  console.log(`Learning Center พร้อมใช้งานที่  http://localhost:${PORT}`);
  console.log(`ฐานข้อมูล: ${DB_PATH}`);
  if (first) {
    console.log('');
    console.log('  สร้างบัญชีผู้ดูแลระบบให้แล้ว:');
    console.log(`    ชื่อผู้ใช้ : ${first.username}`);
    console.log(`    รหัสผ่าน  : ${first.password}`);
    if (first.envTooShort) console.log('    (LC_ADMIN_PASSWORD ที่ตั้งมาสั้นเกินไป จึงสุ่มให้ใหม่)');
    console.log('    รหัสนี้แสดงครั้งเดียวเท่านั้น และต้องเปลี่ยนทันทีที่ล็อกอินครั้งแรก');
    console.log('');
  }
  if (OPEN_REGISTER) {
    console.log('  หมายเหตุ: เปิดให้คนนอกสมัครบัญชีเองได้');
    console.log('            ถ้าเครื่องนี้ออกอินเทอร์เน็ต ให้ปิดด้วย LC_OPEN_REGISTER=0');
    console.log('');
  }
  sessions.purge();
  setInterval(() => { sessions.purge(); purgeLoginFailures(); }, 6 * 3600 * 1000).unref?.();
});
