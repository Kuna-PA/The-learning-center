// รวม Lab เพิ่มเติมทั้งหมด แล้ว merge เข้ากับ track ตอน import
import cisco from './cisco-extra.js';
import mtRouter from './mikrotik-router-extra.js';
import mtSwitch from './mikrotik-switch-extra.js';
import win from './windows-extra.js';
import winGui from './windows-gui.js';
import linux from './linux-extra.js';

// รวมชุด lab หลายชุดที่แยกไฟล์กันไว้ ให้อยู่ในระดับเดียวกัน
const mergeByLevel = (...sets) => {
  const out = {};
  sets.forEach(set => Object.entries(set).forEach(([lvl, labs]) => {
    (out[lvl] ||= []).push(...labs);
  }));
  return out;
};

export const EXTRA_LABS = {
  'cisco-switch': cisco,
  'mikrotik-router': mtRouter,
  'mikrotik-switch': mtSwitch,
  'windows-server': mergeByLevel(win, winGui),
  'linux': linux,
};

export function mergeExtraLabs(tracks) {
  tracks.forEach(t => {
    const extra = EXTRA_LABS[t.id];
    if (!extra) return;
    Object.entries(extra).forEach(([lvl, labs]) => {
      const target = t.levels[lvl];
      if (!target) return;
      target.labs = [...(target.labs || []), ...labs];
    });
  });
  return tracks;
}
