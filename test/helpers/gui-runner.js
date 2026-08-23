// ============================================================
//  ตัวรัน Lab แบบหน้าจอ GUI โดยไม่ต้องมี DOM
//  ใช้ GUI_ACTIONS ตัวเดียวกับที่หน้าจอจริงเรียก — จึงทดสอบได้ว่าคลิกแล้ว state เปลี่ยนตรงกัน
//
//  สคริปต์ของแต่ละ lab อยู่ใน gui-solutions.js เขียนเป็น [action, params] ตามลำดับที่ต้องคลิก
//    ['$cmd', 'ipconfig /all']     พิมพ์ในหน้าต่าง Command Prompt
//    ['$hist', 'gui:gpo-edit:X']   การกดที่เปลี่ยนแค่หน้าจอ ไม่เปลี่ยน state
// ============================================================
import { createDevice } from '../../js/devices/index.js';
import { GUI_ACTIONS } from '../../js/gui/windows-gui.js';

export function runGuiScript(lab, script) {
  const dev = createDevice('windows-gui', lab.init || {});
  const history = [];
  const problems = [];
  const done = new Array(lab.tasks.length).fill(false);

  // ตรวจหลังทุกการกระทำเหมือนหน้าจอจริง — task ที่ผ่านแล้วจะไม่ถูกยกเลิกทีหลัง
  // (เช่น lab ที่ให้ disable บัญชีก่อน แล้วค่อย enable คืนตอนจบ)
  const evaluate = () => {
    lab.tasks.forEach((t, i) => {
      if (done[i]) return;
      try { done[i] = !!t.check(dev.state, history); }
      catch (e) { problems.push(`check #${i + 1} พัง: ${e.message}`); }
    });
  };

  evaluate();

  for (const [action, params] of script) {
    if (action === '$cmd') {
      // หน้าต่าง Command Prompt ใน GUI ใช้ emulator ตัวเดียวกับฝั่ง PowerShell
      const out = dev.exec(params) || [];
      const anyErr = out.some(o => o && typeof o === 'object' && o.c === 'err');
      const anyOk = out.some(o => typeof o === 'string'
        ? o.trim() !== '' : (o && o.c !== 'err' && String(o.s).trim() !== ''));
      if (anyErr && !anyOk) problems.push(`คำสั่ง "${params}" ล้มเหลวทั้งหมด`);
      else history.push(String(params).trim());
    } else if (action === '$hist') {
      history.push(String(params));
    } else {
      const fn = GUI_ACTIONS[action];
      if (!fn) { problems.push(`ไม่มี action "${action}" ใน GUI_ACTIONS`); continue; }
      const line = fn(dev.state, params || {});
      if (line) history.push(line);
    }
    evaluate();
  }

  return {
    ok: done.every(Boolean) && !problems.length,
    done, problems, history, state: dev.state,
    failedTasks: done.map((d, i) => (d ? -1 : i + 1)).filter(i => i > 0),
  };
}
