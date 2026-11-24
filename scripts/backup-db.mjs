// ============================================================
//  สำรองฐานข้อมูล — ใช้ได้ทั้งตอนเซิร์ฟเวอร์กำลังทำงาน
//
//  ฐานข้อมูลเปิดโหมด WAL ไว้ การ copy ไฟล์ .db เฉย ๆ ตอนเซิร์ฟเวอร์ยังรัน
//  อาจได้ของไม่ครบ (ธุรกรรมล่าสุดยังอยู่ใน -wal) สคริปต์นี้ใช้ backup API
//  ของ SQLite เอง จึงได้ไฟล์ที่สมบูรณ์ในตัวเดียวและไม่ต้องหยุดเซิร์ฟเวอร์
//
//  รันด้วย:  npm run backup            -> เก็บไว้ที่ ./backup/
//            npm run backup -- D:\เก็บของ\lc.db
// ============================================================
import { DatabaseSync, backup } from 'node:sqlite';
import { mkdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(process.env.LC_DATA_DIR || join(root, 'data-db'), 'learning-center.db');

/** ชื่อไฟล์ตามวันเวลา เรียงตามตัวอักษรแล้วได้ลำดับเวลาพอดี */
const stamp = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
};

const dest = process.argv[2] || join(root, 'backup', `learning-center-${stamp()}.db`);

try {
  statSync(SRC);
} catch {
  console.error(`ไม่พบฐานข้อมูลที่ ${SRC}`);
  console.error('ถ้าเก็บไว้ที่อื่น ให้ตั้ง LC_DATA_DIR ให้ตรงกับที่เซิร์ฟเวอร์ใช้');
  process.exit(1);
}

mkdirSync(dirname(dest), { recursive: true });

const db = new DatabaseSync(SRC, { readOnly: true });
try {
  await backup(db, dest);
  const kb = Math.round(statSync(dest).size / 1024);
  console.log(`สำรองเรียบร้อย: ${dest}  (${kb} KB)`);
  console.log('กู้คืนโดยหยุดเซิร์ฟเวอร์ แล้วเอาไฟล์นี้ไปวางทับ learning-center.db');
} catch (e) {
  console.error('สำรองไม่สำเร็จ:', e.message);
  process.exit(1);
} finally {
  db.close();
}
