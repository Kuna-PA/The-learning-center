// ============================================================
//  Service Worker — ทำให้เว็บเปิดได้แม้เน็ตหลุด
//
//  ที่มา: "โหมดออฟไลน์" เดิมหมายถึงเก็บความคืบหน้าไว้ในเบราว์เซอร์เท่านั้น
//  แต่ตัวหน้าเว็บยังต้องโหลดจากเน็ตทุกครั้ง — เน็ตหลุดแล้วกดรีเฟรชคือจอขาว
//  ไฟล์นี้แก้ตรงนั้น: เข้าเว็บครั้งแรกเมื่อไร ครั้งต่อไปเปิดได้โดยไม่ต้องมีเน็ต
//
//  กลยุทธ์: ลองเน็ตก่อนเสมอ (network-first) แล้วค่อยตกไปใช้แคช
//  เลือกแบบนี้เพราะแอปโหลด ES module หลายสิบไฟล์ — ถ้าใช้แคชก่อน
//  ผู้เรียนอาจได้ไฟล์เก่าปนใหม่จนพังแบบหาสาเหตุยาก
//
//  /api/ ไม่แตะเลย — บัญชีและความคืบหน้าต้องเป็นของสดจากเซิร์ฟเวอร์เสมอ
// ============================================================
const VERSION = 'lc-v2';
const CACHE = 'learning-center-' + VERSION;

// โครงหลักที่ต้องมีตั้งแต่ยังไม่เคยเปิดหน้าไหนเลย ที่เหลือเก็บเองตอนใช้งานจริง
const PRECACHE = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './assets/logo-mark.png',
  './assets/logo-full.png',
  './assets/julong.png',
  './assets/julong-full.png',
  './assets/favicon.png',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
];

const FONT_HOSTS = ['https://fonts.googleapis.com', 'https://fonts.gstatic.com'];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // ทีละไฟล์ ไม่ใช้ addAll — ไฟล์เดียวพลาดต้องไม่ทำให้ติดตั้งล้มทั้งชุด
    await Promise.allSettled(PRECACHE.map((u) => cache.add(new Request(u, { cache: 'reload' }))));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith('learning-center-') && k !== CACHE)
      .map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (e) => {
  if (e.data === 'skip-waiting') self.skipWaiting();
});

const cacheable = (url) =>
  url.origin === self.location.origin ? !url.pathname.startsWith('/api/') : FONT_HOSTS.includes(url.origin);

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (!cacheable(url)) return;      // /api/ และโดเมนอื่น ปล่อยผ่านไปตามปกติ

  e.respondWith((async () => {
    try {
      const res = await fetch(req);
      if (res && (res.ok || res.type === 'opaque')) {
        const cache = await caches.open(CACHE);
        cache.put(req, res.clone());
      }
      return res;
    } catch (err) {
      const hit = await caches.match(req, { ignoreSearch: url.origin === self.location.origin });
      if (hit) return hit;
      // เปิดหน้าใหม่ตอนออฟไลน์ — คืนตัวแอปไป แล้วให้ router ฝั่งหน้าเว็บจัดการต่อ
      if (req.mode === 'navigate') {
        const shell = await caches.match('./index.html');
        if (shell) return shell;
      }
      throw err;
    }
  })());
});
