// ---------- คอมโพเนนต์ Command Prompt ที่ใช้ร่วมกันทั้ง Lab และ Playground ----------
import { createDevice, DEVICE_LABELS } from './devices/index.js';

const esc = s => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** ส่วนที่ยาวที่สุดที่ทุกตัวเลือกยังตรงกัน — ใช้เติมแบบ Tab */
const sharedPrefix = (hits, caseless = false) => hits.reduce((a, c) => {
  const eq = (x, y) => (caseless ? x.toLowerCase() === y.toLowerCase() : x === y);
  let i = 0;
  while (i < a.length && i < c.length && eq(a[i], c[i])) i++;
  return a.slice(0, i);
});

/**
 * ตัดสินว่ากด Tab แล้วควรเกิดอะไร — แยกออกมาเป็นฟังก์ชันบริสุทธิ์เพื่อให้ทดสอบได้
 * โดยไม่ต้องมี DOM (เคยมีบั๊กหลุดเพราะตรรกะนี้อยู่ใน event handler ล้วน ๆ)
 *
 * @param {string} cur  ข้อความที่พิมพ์อยู่ตอนนี้
 * @param {{completePath?:Function, completions?:Function}} dev
 * @returns {{value?:string, list?:string[]}}  value = เติมให้เลย · list = โชว์ตัวเลือก
 */
export function tabComplete(cur, dev) {
  if (!cur || !cur.trim()) return {};
  const token = (cur.match(/(\S*)$/) || ['', ''])[1];
  const lead = cur.slice(0, cur.length - token.length);
  const all = () => (dev.completions ? dev.completions() : []);

  /** เติมส่วนที่ตรงกัน ถ้าเติมต่อไม่ได้ก็คืนรายการให้ไปโชว์ */
  const offer = (hits, prefix, suffix = '', caseless = false) => {
    if (!hits.length) return {};
    if (hits.length === 1) return { value: prefix + hits[0] + suffix };
    const shared = sharedPrefix(hits, caseless);
    if (shared && prefix + shared !== cur) return { value: prefix + shared };
    return { list: hits };
  };

  // Linux กับ Windows มีระบบไฟล์จำลองจริง จึงเติมแบบ shell ได้
  if (typeof dev.completePath === 'function') {
    // กำลังพิมพ์อาร์กิวเมนต์ → เติมได้เฉพาะชื่อไฟล์ในไดเรกทอรีปัจจุบัน
    // **ห้ามตกไปใช้รายการตัวอย่างคำสั่ง** เพราะตัวอย่างมี path เต็มติดมาด้วย
    // (เคยทำให้พิมพ์ `cat` แล้วกด Tab ตอนอยู่ /tmp กลับได้ `cat /etc/`
    //  ซึ่งมาจากตัวอย่าง `cat /etc/passwd` กับ `cat /etc/os-release` ในรายการ)
    if (lead.trim()) return offer(dev.completePath(token), lead);

    // กำลังพิมพ์ชื่อคำสั่ง → เอาเฉพาะคำแรกของตัวอย่างแต่ละอัน แล้วเติมเว้นวรรคให้
    const names = [...new Set(all().map(c => c.trim().split(/\s+/)[0]))].sort();
    return offer(names.filter(n => n.toLowerCase().startsWith(token.toLowerCase())), lead, ' ');
  }

  // Cisco / MikroTik เป็นภาษาคำสั่งเป็นชั้น ๆ — เติมทั้งบรรทัดจากรายการตัวอย่าง
  // จับแบบตรงตัวก่อน ถ้าไม่เจอค่อยจับแบบย่อทีละคำ ("sho run" -> "show running-config")
  const list = all();
  let hits = list.filter(c => c.toLowerCase().startsWith(cur.toLowerCase()));
  if (!hits.length) {
    const words = cur.trim().split(/\s+/);
    hits = list.filter(c => {
      const cw = c.trim().split(/\s+/);
      return cw.length >= words.length
        && words.every((w, i) => cw[i].toLowerCase().startsWith(w.toLowerCase()));
    });
  }
  if (!hits.length) return {};
  if (hits.length === 1) return { value: hits[0] };
  const common = sharedPrefix(hits, true);
  if (common.length && common.toLowerCase() !== cur.toLowerCase()) return { value: common };
  return { list: hits };
}

export function createTerminal({ device, initial = {}, onExec, height }) {
  let dev = createDevice(device, initial);
  // เฉพาะคำสั่งที่ "ทำงานสำเร็จ" — ใช้ตรวจ lab
  // history.abs เรียงดัชนีตรงกัน เก็บคำสั่งเดียวกันในรูปที่ขยาย path สัมพัทธ์เป็น path เต็มแล้ว
  // เพราะตัวตรวจ task เขียน regex ด้วย path เต็ม ผู้เรียนที่ cd เข้าไปก่อนแล้วพิมพ์ชื่อไฟล์
  // เปล่า ๆ จึงเคยทำ task ไม่ผ่านทั้งที่ทำถูก (ดู said() ใน data/said.js)
  const history = [];
  history.abs = [];
  const recall = [];       // ทุกคำสั่งที่พิมพ์ รวมที่ผิด — ใช้กับปุ่มลูกศรขึ้น/ลง
  let hIdx = -1;

  const el = document.createElement('div');
  el.className = 'term-shell';
  el.innerHTML = `
    <div class="term-bar">
      <div class="lights"><i style="background:#ff5f57"></i><i style="background:#febc2e"></i><i style="background:#28c840"></i></div>
      <span class="t-title">${esc(DEVICE_LABELS[device] || device)}</span>
      <span style="margin-left:auto;display:flex;gap:6px">
        <button class="btn sm ghost" data-act="help">?</button>
        <button class="btn sm ghost" data-act="clear">clear</button>
        <button class="btn sm ghost" data-act="reset">reset</button>
      </span>
    </div>
    <div class="term-body" tabindex="-1"></div>
    <div class="term-input-row"><span class="pr"></span><input class="term-in" spellcheck="false" autocomplete="off" autocapitalize="off"></div>
  `;

  const body = el.querySelector('.term-body');
  const input = el.querySelector('.term-in');
  const prEl = el.querySelector('.term-input-row .pr');
  if (height) body.style.maxHeight = height;

  function write(items) {
    if (!items || !items.length) return;
    const frag = document.createDocumentFragment();
    for (const it of items) {
      const line = document.createElement('div');
      if (typeof it === 'string') line.textContent = it;
      else { line.textContent = it.s; if (it.c) line.className = it.c; }
      frag.appendChild(line);
    }
    body.appendChild(frag);
    body.scrollTop = body.scrollHeight;
  }

  function writeEcho(cmd) {
    const line = document.createElement('div');
    line.innerHTML = `<span class="pr">${esc(dev.prompt())}</span><span class="in">${esc(cmd)}</span>`;
    body.appendChild(line);
  }

  function syncPrompt() { prEl.textContent = dev.prompt(); }

  function clear() { body.innerHTML = ''; }

  function run(raw) {
    const cmd = raw;
    // ต้องแปลงก่อนรัน เพราะคำสั่งอย่าง cd จะเปลี่ยน cwd ไปแล้วถ้ารอหลังรัน
    const abs = dev.absolutize ? dev.absolutize(cmd.trim()) : cmd.trim();
    writeEcho(cmd);
    if (cmd.trim()) { recall.push(cmd.trim()); hIdx = recall.length; }
    let out = [];
    try { out = dev.exec(cmd) || []; }
    catch (e) { out = [{ s: 'ข้อผิดพลาดภายใน emulator: ' + e.message, c: 'err' }]; }

    // คำสั่งที่ "ล้มเหลวทั้งหมด" จะไม่ถูกนับว่าทำแล้ว — พิมพ์ผิดต้องไม่ผ่าน task
    // (ping ที่ไม่ตอบ หรือ grep ที่เจอบางไฟล์ ยังถือว่าคำสั่งทำงานสำเร็จ)
    const anyErr = out.some(o => o && typeof o === 'object' && o.c === 'err');
    const anyOk = out.some(o => typeof o === 'string'
      ? o.trim() !== ''
      : (o && o.c !== 'err' && String(o.s).trim() !== ''));
    const failed = anyErr && !anyOk;
    if (cmd.trim() && !failed) { history.push(cmd.trim()); history.abs.push(abs); }

    if (out.length === 1 && out[0] === '\x00CLEAR') { clear(); }
    else write(out);
    syncPrompt();
    body.scrollTop = body.scrollHeight;
    if (onExec) onExec({ cmd: cmd.trim(), state: dev.state, history, failed });
  }

  function reset() {
    dev = createDevice(device, initial);
    clear();
    write(dev.banner());
    syncPrompt();
    history.length = 0; history.abs.length = 0; recall.length = 0;
    if (onExec) onExec({ cmd: '', state: dev.state, history });
  }

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const v = input.value;
      input.value = '';
      run(v);
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      if (hIdx > 0) { hIdx--; input.value = recall[hIdx]; }
      e.preventDefault();
    } else if (e.key === 'ArrowDown') {
      if (hIdx < recall.length - 1) { hIdx++; input.value = recall[hIdx]; }
      else { hIdx = recall.length; input.value = ''; }
      e.preventDefault();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const cur = input.value;
      if (!cur.trim()) return;

      const r = tabComplete(cur, dev);
      if (r.value !== undefined) { input.value = r.value; return; }
      if (r.list) {
        // เติมต่อไม่ได้แล้ว — โชว์ตัวเลือกที่เหลือให้เลือกเอง
        writeEcho(cur);
        write(r.list.map(x => '  ' + x));
        body.scrollTop = body.scrollHeight;
      }
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault(); clear();
    } else if (e.key === 'c' && e.ctrlKey) {
      e.preventDefault();
      writeEcho(input.value + '^C');
      input.value = '';
    }
  });

  body.addEventListener('click', () => {
    if (!window.getSelection().toString()) input.focus();
  });

  el.querySelectorAll('[data-act]').forEach(b => {
    b.addEventListener('click', () => {
      const a = b.dataset.act;
      if (a === 'clear') clear();
      if (a === 'reset') reset();
      if (a === 'help') { writeEcho('?'); write(dev.hint()); body.scrollTop = body.scrollHeight; }
      input.focus();
    });
  });

  // เริ่มต้น
  write(dev.banner());
  syncPrompt();

  return {
    el,
    get device() { return dev; },
    get history() { return history; },
    focus: () => input.focus(),
    reset,
    runSilent: cmd => run(cmd),
  };
}
