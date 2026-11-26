// ============================================================
//  ข้อสอบรวบยอด (Final Exam) — ด่านสุดท้ายหลังเรียนจบครบทุกหัวข้อ
//
//  ต่างจากแบบทดสอบท้ายบทตรงที่
//    · รวมคำถามจาก "ทุกหัวข้อ ทุกระดับ" มาไว้ในชุดเดียว 50 ข้อ
//    · ล็อกไว้จนกว่าจะเรียนจบครบทุกบท และทุกบทต้องทำคะแนนได้ 90% ขึ้นไป
//    · ไม่นับหมวดเอาชีวิตรอด — หมวดนั้นวัดการลงมือทำ ไม่ใช่ความรู้ที่ถามเป็นข้อ ๆ ได้
//
//  เขียนเป็นฟังก์ชันบริสุทธิ์ (รับ progress + tracks เข้า คืนผลออก) เหมือน admin-stats.js
//  เพื่อให้ทั้งหน้าผู้เรียน หน้าผู้ดูแล และชุดทดสอบ ใช้ตรรกะเดียวกันตัวเดียว
// ============================================================
import { levelStatus } from './admin-stats.js';

/** จำนวนข้อในหนึ่งชุด */
export const FINAL_COUNT = 50;
/** คะแนนขั้นต่ำของ "ทุกบท" ที่ต้องทำได้ก่อนจึงจะปลดล็อกข้อสอบรวบยอด */
export const FINAL_UNLOCK_SCORE = 90;
/** คะแนนขั้นต่ำที่ถือว่าสอบผ่านข้อสอบรวบยอด */
export const FINAL_PASS_SCORE = 90;

/** สลับลำดับแบบ Fisher-Yates โดยไม่แตะ array ต้นฉบับ */
export const shuffled = (arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/** ทุกระดับของทุกหัวข้อที่มีข้อสอบอยู่จริง เรียงตามลำดับในเมนู */
export function levelGroups(tracks) {
  const out = [];
  for (const t of tracks) {
    for (const lv of Object.keys(t.levels).map(Number).sort((a, b) => a - b)) {
      const pool = (t.levels[lv] || {}).quiz || [];
      if (pool.length) out.push({ track: t.id, trackName: t.name, icon: t.icon, level: lv, pool });
    }
  }
  return out;
}

/**
 * ออกข้อสอบรวบยอดหนึ่งชุด
 *
 * แจกแบบวนรอบ: รอบแรกทุกระดับได้ข้อละหนึ่งก่อน แล้วค่อยวนแจกส่วนที่เหลือ
 * ผลคือ **ทุกระดับของทุกหัวข้อมีคำถามโผล่มาแน่นอนอย่างน้อยหนึ่งข้อ** ตราบใดที่
 * จำนวนข้อที่ออก >= จำนวนระดับ — ซึ่งตรงกับเจตนาว่า "รวบรวมเนื้อหาทั้งหมด"
 * ถ้าวันหนึ่งระดับเยอะกว่าจำนวนข้อ ลำดับที่สุ่มไว้จะเป็นตัวตัดสินว่าระดับไหนได้ไป
 *
 * @param {Array} tracks     TRACKS
 * @param {number} count     จำนวนข้อที่ต้องการ
 * @param {Function} shuffle ฟังก์ชันสลับลำดับ — ส่งตัวที่คาดเดาได้เข้ามาได้ตอนทดสอบ
 */
export function buildFinalSet(tracks, count = FINAL_COUNT, shuffle = shuffled) {
  const groups = shuffle(levelGroups(tracks)).map(g => ({ ...g, pool: shuffle(g.pool) }));
  if (!groups.length) return [];

  const picked = [];
  for (let round = 0; picked.length < count; round++) {
    let added = 0;
    for (const g of groups) {
      if (picked.length >= count) break;
      const q = g.pool[round];
      if (!q) continue;
      picked.push({ ...q, track: g.track, trackName: g.trackName, icon: g.icon, level: g.level });
      added++;
    }
    if (!added) break;                 // คลังข้อสอบหมดจริง ๆ ออกได้ไม่ครบก็ต้องยอม
  }
  return shuffle(picked);
}

/**
 * ยังขาดอะไรก่อนจะปลดล็อกข้อสอบรวบยอด
 * @returns {{ready:boolean, doneLevels:number, totalLevels:number, blockers:Array}}
 */
export function finalReadiness(progress, tracks) {
  const blockers = [];
  let doneLevels = 0, totalLevels = 0;

  for (const t of tracks) {
    for (const lv of Object.keys(t.levels).map(Number).sort((a, b) => a - b)) {
      totalLevels++;
      const s = levelStatus(progress, t, lv);
      const miss = [];
      if (!s.read) miss.push('ยังไม่ได้อ่านบทเรียน');
      if (!s.passed) miss.push('ยังสอบไม่ผ่าน');
      else if (s.best < FINAL_UNLOCK_SCORE) miss.push(`ทำได้ ${s.best}% ยังไม่ถึง ${FINAL_UNLOCK_SCORE}%`);
      if (s.labsTotal && s.labsDone < s.labsTotal) miss.push(`Lab เหลือ ${s.labsTotal - s.labsDone}/${s.labsTotal} ชุด`);

      if (miss.length) blockers.push({ track: t.id, trackName: t.name, icon: t.icon, level: lv, miss });
      else doneLevels++;
    }
  }
  return { ready: blockers.length === 0, doneLevels, totalLevels, blockers };
}

/** รวมอุปสรรคเป็นรายหัวข้อ — ใช้แสดงผลให้อ่านง่ายกว่ารายระดับยาว ๆ */
export function blockersByTrack(blockers) {
  const map = new Map();
  for (const b of blockers) {
    if (!map.has(b.track)) map.set(b.track, { track: b.track, trackName: b.trackName, icon: b.icon, levels: [] });
    map.get(b.track).levels.push({ level: b.level, miss: b.miss });
  }
  return [...map.values()];
}
