// ============================================================
//  ตรวจเนื้อหาอย่างเดียว — ใช้ก่อน commit เนื้อหาใหม่
//    node scripts/validate-content.mjs
//  ออก exit code 1 ถ้ามีปัญหา เพื่อให้ CI จับได้
// ============================================================
import { validateContent, contentStats } from '../test/helpers/validate-content.js';

const problems = validateContent();
const s = contentStats();

console.log('เนื้อหาที่ตรวจ:');
console.log(`  หัวข้อ ${s.tracks} · ระดับรวม ${s.levels} · ข้อสอบ ${s.quiz} ข้อ`);
console.log(`  Lab ${s.labs} ชุด (${s.labTasks} ขั้นตอน) · เอาชีวิตรอด ${s.survival} เหตุการณ์ (${s.survivalTasks} ขั้นตอน)`);
console.log('');

if (!problems.length) {
  console.log('ไม่พบปัญหา');
  process.exit(0);
}
console.error(`พบปัญหา ${problems.length} รายการ:`);
for (const p of problems) console.error('  - ' + p);
process.exit(1);
