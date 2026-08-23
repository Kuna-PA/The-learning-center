// ============================================================
//  ลงทะเบียน Service Worker — ทำให้แอปเปิดได้ตอนเน็ตหลุด และติดตั้งลงเครื่องได้
//  ตัว logic ของแคชอยู่ใน sw.js ที่ราก repo (ต้องอยู่ที่รากเพื่อให้ scope ครอบทั้งเว็บ)
// ============================================================

/**
 * @param {(fn: () => void) => void} onUpdate  เรียกเมื่อมีเวอร์ชันใหม่รออยู่
 *        ส่งฟังก์ชันสำหรับ "อัปเดตเดี๋ยวนี้" กลับไปให้หน้าเว็บเอาไปผูกกับปุ่ม
 */
export function registerServiceWorker(onUpdate) {
  if (!('serviceWorker' in navigator)) return;
  // เปิดจาก file:// จะลงทะเบียนไม่ได้อยู่แล้ว ไม่ต้องพยายามให้ console แดง
  if (location.protocol !== 'http:' && location.protocol !== 'https:') return;

  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('sw.js');

      reg.addEventListener('updatefound', () => {
        const sw = reg.installing;
        if (!sw) return;
        sw.addEventListener('statechange', () => {
          // มีตัวใหม่ติดตั้งเสร็จ ทั้งที่ตัวเก่ายังคุมหน้าอยู่ = เป็นการอัปเดต ไม่ใช่ติดตั้งครั้งแรก
          if (sw.state === 'installed' && navigator.serviceWorker.controller && onUpdate) {
            onUpdate(() => { sw.postMessage('skip-waiting'); location.reload(); });
          }
        });
      });
    } catch { /* ไม่มี service worker ก็ใช้งานแบบออนไลน์ได้ตามปกติ */ }
  });
}
