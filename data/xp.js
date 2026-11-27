// ============================================================
//  เศรษฐศาสตร์ของ XP และเกณฑ์ขึ้น RANK
//
//  เดิมเกณฑ์ RANK เป็นตัวเลขตายตัว [0, 900, 2600, 5300, 8800] ซึ่งคิดไว้ตอน
//  เนื้อหาทั้งเว็บให้ XP ได้ราว 13,200 · พอเพิ่ม Lab กับข้อสอบเข้าไปเรื่อย ๆ
//  จนตอนนี้ได้ถึงราว 19,000 เกณฑ์เดิมจึงเตี้ยเกินไป — เรียนจบ Network หัวข้อเดียว
//  ก็ไต่ไปได้หลายขั้น และพอจบ 4 หัวข้อก็ตัน Expert ทั้งที่ยังเหลือของอีกครึ่งเว็บ
//  (มีผู้เรียนถามเข้ามาตรง ๆ ว่า "เป็น Expert แล้วจะเก็บอะไรต่อ")
//
//  ไฟล์นี้จึง **คิดเพดาน XP จากเนื้อหาจริง** แล้วตั้งเกณฑ์เป็นสัดส่วนของเพดานนั้น
//  เพิ่ม Lab หรือข้อสอบเมื่อไร เกณฑ์ขยับตามเอง ไม่ต้องมาไล่แก้เลขอีก
//
//  **RANK กับ "ระดับในหัวข้อ" เป็นคนละบันได** แม้จะใช้ชื่อชุดเดียวกัน
//    · ระดับในหัวข้อ — ปลดล็อกทีละขั้นภายในหัวข้อนั้น ด้วยการสอบผ่านและทำ Lab ครบ
//      ขึ้นหัวข้อใหม่ก็เริ่มที่ระดับ 1 ของหัวข้อนั้นเสมอ ไม่ว่า RANK จะสูงแค่ไหน
//    · RANK — ภาพรวมทั้งเว็บ คิดจาก XP ที่สะสมได้จากทุกหัวข้อรวมกัน
// ============================================================
import { TRACKS, ALL_LABS } from './tracks/index.js';
import { SURVIVAL_LABS } from './labs/survival.js';

/** XP ที่จ่ายให้แต่ละอย่าง — ต้องตรงกับที่ js/store.js จ่ายจริง */
export const XP_RATE = {
  read: 10,         // อ่านบทเรียนจบหนึ่งบท
  quizBest: 50,     // ไต่คะแนนสอบจาก 0 ถึง 100 (จ่ายครึ่งหนึ่งของส่วนที่ดีขึ้น)
  quizPass: 50,     // สอบผ่านครั้งแรกของบทนั้น
  lab: 80,          // ทำ Lab จบหนึ่งชุด (รวมหมวดเอาชีวิตรอด)
  finalPass: 500,   // ผ่านข้อสอบรวบยอดครั้งแรก
  finalBest: 100,   // ไต่คะแนนข้อสอบรวบยอดจาก 0 ถึง 100
};

/** เพดาน XP ที่เนื้อหาชุดปัจจุบันให้ได้ทั้งหมด */
export function maxXp(tracks = TRACKS, allLabs = ALL_LABS, survival = SURVIVAL_LABS) {
  const levels = tracks.reduce((a, t) => a + Object.keys(t.levels).length, 0);
  return levels * (XP_RATE.read + XP_RATE.quizBest + XP_RATE.quizPass)
    + (allLabs.length + survival.length) * XP_RATE.lab
    + XP_RATE.finalPass + XP_RATE.finalBest;
}

/**
 * สัดส่วนของเพดาน XP ที่ต้องเก็บได้ก่อนขึ้นแต่ละ RANK (ดัชนีตรงกับ LEVELS)
 * วางให้ "เรียนจบหนึ่งหัวข้อ" ขยับได้ราวหนึ่งขั้น และขั้นสูงสุดต้องกวาดเกือบทั้งเว็บ
 *   1 Novice 0% · 2 Adv.Beginner 8% · 3 Competent 22%
 *   4 Proficient 42% · 5 Expert 65% · 6 Mastery 88%
 */
export const TIER_RATIO = [0, 0.08, 0.22, 0.42, 0.65, 0.88];

/** เกณฑ์ XP ของแต่ละ RANK — ปัดเป็นหลักสิบให้อ่านง่าย */
export const XP_TIERS = TIER_RATIO.map((r) => Math.round((maxXp() * r) / 10) * 10);

/** RANK ปัจจุบันจาก XP — คืนเลข 1 ถึง XP_TIERS.length */
export function tierOf(xp) {
  let t = 1;
  XP_TIERS.forEach((v, i) => { if (xp >= v) t = i + 1; });
  return t;
}

/** RANK ปัจจุบันพร้อมช่วงคะแนนและความคืบหน้าภายในขั้น */
export function tierProgress(xp) {
  const t = tierOf(xp);
  const lo = XP_TIERS[t - 1];
  const hi = XP_TIERS[t] ?? lo;                       // ขั้นสูงสุดไม่มีขั้นถัดไปแล้ว
  const max = t >= XP_TIERS.length;
  return {
    t, lo, hi, max,
    pct: max ? 100 : Math.min(100, Math.round(((xp - lo) / (hi - lo)) * 100)),
  };
}
