// ============================================================
//  ตัวรัน Lab แบบไม่ต้องมีหน้าจอ — ใช้ตรรกะเดียวกับ js/terminal.js
//  ชุดทดสอบเรียกตัวนี้เพื่อ "เล่น Lab ให้จบ" แล้วดูว่าทุก task ผ่านไหม
// ============================================================
import { createDevice } from '../../js/devices/index.js';
import { TRACKS } from '../../data/tracks/index.js';
import { SURVIVAL_LABS } from '../../data/labs/survival.js';

/** ทุก Lab ในระบบ พร้อมที่มา — รวมหมวดเอาชีวิตรอด */
export function allLabs() {
  const fromTracks = TRACKS.flatMap(t =>
    Object.entries(t.levels).flatMap(([lvl, d]) =>
      (d.labs || []).map(l => ({ ...l, track: t.id, level: +lvl }))));
  const survival = SURVIVAL_LABS.map(l => ({ ...l, track: 'survival', level: 0 }));
  return [...fromTracks, ...survival];
}

export const cliLabs = () => allLabs().filter(l => l.device !== 'windows-gui');
export const guiLabs = () => allLabs().filter(l => l.device === 'windows-gui');

/** แยกคำใบ้เป็นคำสั่งทีละบรรทัด — คำใบ้ใช้ " → " คั่นลำดับคำสั่ง */
export const hintCommands = (hint) =>
  String(hint || '').split(/→|->/).map(s => s.trim()).filter(Boolean);

/**
 * ตัดสินว่าคำสั่งนี้ "รันสำเร็จ" ไหม — ต้องตรงกับ js/terminal.js
 * ผิดทั้งหมด = ไม่นับลง history (task จึงไม่ผ่านเพราะพิมพ์ผิด)
 */
export function execFailed(out) {
  const anyErr = out.some(o => o && typeof o === 'object' && o.c === 'err');
  const anyOk = out.some(o => typeof o === 'string'
    ? o.trim() !== ''
    : (o && o.c !== 'err' && String(o.s).trim() !== ''));
  return anyErr && !anyOk;
}

/**
 * เล่น Lab หนึ่งชุดด้วยคำใบ้ของมันเอง แล้วรายงานผลรายข้อ
 * @returns {{ok:boolean, done:boolean[], failedTasks:number[], crashes:Array}}
 */
export function solveLab(lab) {
  const dev = createDevice(lab.device, lab.init || {});
  const history = [];
  const done = new Array(lab.tasks.length).fill(false);
  const crashes = [];

  const evaluate = () => {
    lab.tasks.forEach((tk, i) => {
      if (done[i]) return;
      try { done[i] = !!tk.check(dev.state, history); }
      catch (e) { crashes.push({ where: `check #${i + 1}`, msg: e.message }); }
    });
  };

  evaluate();   // บาง task ผ่านตั้งแต่สถานะเริ่มต้น (เช่น "ตรวจสอบว่ายังไม่ได้ตั้งค่า")

  for (let i = 0; i < lab.tasks.length; i++) {
    for (const cmd of hintCommands(lab.tasks[i].hint)) {
      let out = [];
      try { out = dev.exec(cmd) || []; }
      catch (e) { crashes.push({ where: `task #${i + 1} · ${cmd}`, msg: e.message }); continue; }
      if (!execFailed(out) && cmd.trim()) history.push(cmd.trim());
      evaluate();
    }
  }

  const failedTasks = done.map((d, i) => (d ? -1 : i)).filter(i => i >= 0);
  return { ok: failedTasks.length === 0 && crashes.length === 0, done, failedTasks, crashes };
}
