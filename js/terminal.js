// ---------- คอมโพเนนต์ Command Prompt ที่ใช้ร่วมกันทั้ง Lab และ Playground ----------
import { createDevice, DEVICE_LABELS } from './devices/index.js';

const esc = s => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function createTerminal({ device, initial = {}, onExec, height }) {
  let dev = createDevice(device, initial);
  const history = [];      // เฉพาะคำสั่งที่ "ทำงานสำเร็จ" — ใช้ตรวจ lab
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
    if (cmd.trim() && !failed) history.push(cmd.trim());

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
    history.length = 0; recall.length = 0;
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
      const list = (dev.completions ? dev.completions() : []);

      // จับแบบตรงตัวก่อน ถ้าไม่เจอค่อยจับแบบย่อทีละคำ ("sho run" -> "show running-config")
      let hits = list.filter(c => c.toLowerCase().startsWith(cur.toLowerCase()));
      if (!hits.length) {
        const words = cur.trim().split(/\s+/);
        hits = list.filter(c => {
          const cw = c.trim().split(/\s+/);
          return cw.length >= words.length
            && words.every((w, i) => cw[i].toLowerCase().startsWith(w.toLowerCase()));
        });
      }
      if (!hits.length) return;
      if (hits.length === 1) { input.value = hits[0]; return; }

      // เติมให้ไกลที่สุดเท่าที่ทุกตัวเลือกยังตรงกัน เหมือน Tab ของ IOS จริง
      // เช่น "sh" -> "show " และ "show int" -> "show interfaces "
      const common = hits.reduce((a, c) => {
        let i = 0;
        while (i < a.length && i < c.length && a[i].toLowerCase() === c[i].toLowerCase()) i++;
        return a.slice(0, i);
      });
      if (common.length && common.toLowerCase() !== cur.toLowerCase()) { input.value = common; return; }

      // เติมต่อไม่ได้แล้ว — โชว์ตัวเลือกที่เหลือให้เลือกเอง
      writeEcho(cur);
      write(hits.map(h => '  ' + h));
      body.scrollTop = body.scrollHeight;
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
