// ============================================================
//  ตั้งรหัสผ่านใหม่ให้ผู้ใช้ — สำหรับกู้คืนตอนลืมรหัส admin
//  ต้องมีสิทธิ์เข้าถึงไฟล์ฐานข้อมูลบนเครื่องเซิร์ฟเวอร์ (คือเป็นผู้ดูแลเครื่องอยู่แล้ว)
//
//  รันด้วย:  npm run reset-password -- admin
//            -> สุ่มรหัสให้แล้วพิมพ์ออกมาครั้งเดียว
//            npm run reset-password -- admin 'รหัสที่ต้องการ'
//
//  ผู้ใช้จะถูกบังคับให้ตั้งรหัสใหม่อีกครั้งตอนล็อกอิน
//  ควรหยุดเซิร์ฟเวอร์ก่อนรัน แล้วค่อยสตาร์ตใหม่
// ============================================================
import { randomBytes } from 'node:crypto';

const [username, given] = process.argv.slice(2);

if (!username) {
  console.error('ใช้: npm run reset-password -- <ชื่อผู้ใช้> [รหัสใหม่]');
  console.error('ถ้าไม่ใส่รหัสใหม่ จะสุ่มให้');
  process.exit(1);
}

// import หลังตรวจ argument เพราะการ import จะเปิด/สร้างไฟล์ฐานข้อมูลทันที
const { users } = await import('../server/db.js');
const { changePassword, MIN_PASSWORD } = await import('../server/auth.js');

if (!users.get(username)) {
  console.error(`ไม่พบผู้ใช้ "${username}"`);
  console.error('ผู้ใช้ที่มีอยู่: ' + (users.all().map((u) => u.username).join(', ') || '(ยังไม่มีใครเลย)'));
  process.exit(1);
}

if (given && given.length < MIN_PASSWORD) {
  console.error(`รหัสผ่านต้องยาวอย่างน้อย ${MIN_PASSWORD} ตัวอักษร`);
  process.exit(1);
}

const password = given || randomBytes(9).toString('base64url');
const r = changePassword({ username, newPass: password, mustChange: 1 });

if (!r.ok) {
  console.error('ตั้งรหัสใหม่ไม่สำเร็จ: ' + r.msg);
  process.exit(1);
}

console.log('');
console.log(`  ตั้งรหัสใหม่ให้ "${username}" เรียบร้อย`);
if (!given) console.log(`    รหัสผ่าน : ${password}`);
console.log('    ต้องเปลี่ยนรหัสอีกครั้งทันทีที่ล็อกอิน');
console.log('');
