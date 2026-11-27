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
 * แปลงคำสั่งที่ใช้ path เต็ม ให้กลายเป็น "cd เข้าไปก่อน แล้วพิมพ์ชื่อสั้น ๆ"
 * ซึ่งเป็นวิธีที่คนทำงานจริงพิมพ์กัน — ใช้ทดสอบว่าตัวตรวจ task ยืดหยุ่นพอ
 * คืนเป็น array ของคำสั่ง (อาจมี cd นำหน้า) · ถ้าแปลงไม่ได้ก็คืนคำสั่งเดิม
 *
 * ข้ามกรณีที่การ cd ไม่สมเหตุสมผลกับคนจริง ๆ ด้วย ไม่งั้นจะได้ผลลวง:
 *   · mkdir — ยัง cd เข้าไปในโฟลเดอร์ที่กำลังจะสร้างไม่ได้
 *   · โฟลเดอร์ปลายทางที่ยังไม่มีอยู่ ณ ตอนนั้น
 *   · /dev/sdb และพวก device node — ไม่มีใคร cd /dev แล้วพิมพ์ pvcreate sdb
 */
export function viaCd(dev, cmd) {
  const text = String(cmd);
  if (!dev.absolutize || !dev.completePath) return [cmd];
  if (/^\s*(sudo\s+)?mkdir\b/.test(text)) return [cmd];
  const m = text.match(/(^|\s)(\/[\w.][\w./-]*)(?=\s|$)/g);
  if (!m) return [cmd];
  const path = m[m.length - 1].trim();
  if (path.startsWith('/dev/')) return [cmd];
  const cut = path.lastIndexOf('/');
  if (cut <= 0) return [cmd];                       // ของที่อยู่ราก / ไม่ต้องแปลง
  const dir = path.slice(0, cut), base = path.slice(cut + 1);
  if (!base) return [cmd];
  if (!dev.completePath(dir + '/').length) return [cmd];   // โฟลเดอร์ยังไม่มี
  return [`cd ${dir}`, text.replace(path, base)];
}

/**
 * เล่น Lab หนึ่งชุดด้วยคำใบ้ของมันเอง แล้วรายงานผลรายข้อ
 * @param {object} lab
 * @param {{relative?:boolean, clobber?:number}} [opts]
 *        relative = พิมพ์แบบ cd เข้าไปก่อนแล้วใช้ชื่อสั้น
 *        clobber  = ดัชนี task ที่จะเปลี่ยน >> เป็น > (จำลองคนที่เขียนทับแทนต่อท้าย)
 * @returns {{ok:boolean, done:boolean[], failedTasks:number[], crashes:Array}}
 */
export function solveLab(lab, opts = {}) {
  const dev = createDevice(lab.device, lab.init || {});
  // ต้องมี .abs เหมือน js/terminal.js ไม่งั้นชุดทดสอบจะไม่ได้ทดสอบเส้นทางเดียวกับของจริง
  const history = [];
  history.abs = [];
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
    const raw = opts.clobber === i
      ? String(lab.tasks[i].hint).replace(/>>/g, '>')     // จำลองการใช้ > เขียนทับ
      : lab.tasks[i].hint;
    for (const hint of hintCommands(raw)) {
      for (const cmd of (opts.relative ? viaCd(dev, hint) : [hint])) {
        let out = [];
        const abs = dev.absolutize ? dev.absolutize(cmd.trim()) : cmd.trim();
        try { out = dev.exec(cmd) || []; }
        catch (e) { crashes.push({ where: `task #${i + 1} · ${cmd}`, msg: e.message }); continue; }
        if (!execFailed(out) && cmd.trim()) { history.push(cmd.trim()); history.abs.push(abs); }
        evaluate();
      }
    }
  }

  const failedTasks = done.map((d, i) => (d ? -1 : i)).filter(i => i >= 0);
  return { ok: failedTasks.length === 0 && crashes.length === 0, done, failedTasks, crashes };
}
