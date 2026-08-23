// ============================================================
//  คลังข้อสอบเพิ่มเติม — แยกจากไฟล์บทเรียนเพื่อให้เติมได้เรื่อย ๆ
//
//  ยิ่งคลังใหญ่ยิ่งเดาข้อสอบไม่ได้ เพราะระบบสุ่มออกครั้งละ ~70%
//  (สูงสุด 15 ข้อ) และหมุนเวียนข้อที่ยังไม่เคยออกก่อนเสมอ
//
//  รูปแบบ: { '<trackId>': { <level>: [ ...ข้อสอบ ] } }
//  ข้อสอบใช้โครงเดียวกับในไฟล์ track — mcq / multi / cmd และต้องมี why เสมอ
// ============================================================
import mikrotikSwitch from './mikrotik-switch.js';
import ciscoSwitch from './cisco-switch.js';
import linux from './linux.js';
import windowsServer from './windows-server.js';
import network from './network.js';
import mikrotikRouter from './mikrotik-router.js';
import cyberSecurity from './cyber-security.js';

export const EXTRA_QUIZ = {
  'mikrotik-switch': mikrotikSwitch,
  'cisco-switch': ciscoSwitch,
  'linux': linux,
  'windows-server': windowsServer,
  'network': network,
  'mikrotik-router': mikrotikRouter,
  'cyber-security': cyberSecurity,
};

/** ต่อข้อสอบเพิ่มเติมเข้าท้ายคลังเดิมของแต่ละระดับ */
export function mergeExtraQuiz(tracks) {
  tracks.forEach(t => {
    const extra = EXTRA_QUIZ[t.id];
    if (!extra) return;
    Object.entries(extra).forEach(([lv, items]) => {
      const target = t.levels[lv];
      if (!target || !items || !items.length) return;
      target.quiz = [...(target.quiz || []), ...items];
    });
  });
  return tracks;
}
