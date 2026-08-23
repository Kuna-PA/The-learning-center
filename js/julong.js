// ============================================================
//  จูล่ง — ผู้ช่วยประจำเว็บ
//
//  ตอบจาก "เนื้อหาที่มีอยู่ในเว็บนี้เอง" — บทเรียน คำใบ้ของ Lab คำอธิบายเฉลย
//  และรายการคำสั่งของ emulator แต่ละตัว จึงทำงานได้แม้เปิดจาก static hosting
//  ที่ไม่มีเซิร์ฟเวอร์ และไม่ต้องใช้ API key ที่จะหลุดถ้าฝังไว้ในหน้าเว็บ
//
//  หลักการที่ยึดไว้
//    - ตอน "ทำ Lab" ช่วยเต็มที่ ไล่คำใบ้ทีละขั้นจากบอกเป้าหมาย ไปจนถึงคำสั่งจริง
//    - ตอน "ทำข้อสอบ" ไม่บอกคำตอบ แต่ชี้ไปที่บทเรียนที่เกี่ยวข้องให้ไปอ่านเอง
//      เพราะถ้าบอกคำตอบก็ไม่เหลือความหมายของการวัดผล
// ============================================================
import { TRACKS } from '../data/tracks/index.js';
import { createDevice, DEVICE_LABELS } from './devices/index.js';

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const strip = s => String(s).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

// ---------- ดัชนีเนื้อหาสำหรับค้นหา ----------
let INDEX = null;
function buildIndex() {
  if (INDEX) return INDEX;
  INDEX = [];
  TRACKS.forEach(t => {
    Object.entries(t.levels).forEach(([lv, d]) => {
      (d.sections || []).forEach((s, i) => {
        INDEX.push({
          kind: 'บทเรียน', track: t.id, trackName: t.name, icon: t.icon, level: +lv,
          title: strip(s.t), body: strip(s.h),
          href: `#/learn/${t.id}/${lv}`, anchor: `s${i}`,
        });
      });
      (d.quiz || []).forEach(q => {
        // ใช้เฉพาะคำอธิบายเฉลย ไม่เอาตัวเลือกมาไว้ในดัชนี จะได้ไม่เผลอเฉลยข้อสอบ
        INDEX.push({
          kind: 'คำอธิบาย', track: t.id, trackName: t.name, icon: t.icon, level: +lv,
          title: strip(q.q), body: strip(q.why || ''),
          href: `#/learn/${t.id}/${lv}`,
        });
      });
    });
  });
  return INDEX;
}

/** ให้คะแนนความเกี่ยวข้องแบบง่าย — ชื่อหัวข้อมีน้ำหนักมากกว่าเนื้อหา */
function search(query, { trackId = null, limit = 4 } = {}) {
  const terms = String(query).toLowerCase().split(/\s+/).filter(w => w.length > 1);
  if (!terms.length) return [];
  const count = (hay, needle) => {
    let n = 0, i = 0;
    while ((i = hay.indexOf(needle, i)) >= 0) { n++; i += needle.length; }
    return n;
  };
  return buildIndex()
    .map(item => {
      const title = item.title.toLowerCase();
      const body = item.body.toLowerCase();
      let score = 0;
      terms.forEach(w => { score += count(title, w) * 8 + Math.min(count(body, w), 6) * 2; });
      if (trackId && item.track === trackId) score *= 1.6;   // หัวข้อที่กำลังเรียนอยู่มาก่อน
      if (item.kind === 'บทเรียน') score *= 1.3;
      return { ...item, score };
    })
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/** ตัดข้อความรอบ ๆ คำที่ค้นเจอ เพื่อให้เห็นบริบท */
function snippet(text, query, len = 190) {
  const terms = String(query).toLowerCase().split(/\s+/).filter(w => w.length > 1);
  const low = text.toLowerCase();
  let at = -1;
  for (const w of terms) { at = low.indexOf(w); if (at >= 0) break; }
  if (at < 0) return text.slice(0, len) + (text.length > len ? '…' : '');
  const from = Math.max(0, at - 60);
  return (from ? '…' : '') + text.slice(from, from + len) + (from + len < text.length ? '…' : '');
}

// ---------- คำสั่งที่อุปกรณ์แต่ละตัวรองรับ ----------
const cmdCache = {};
function deviceCommands(device) {
  if (!device) return [];
  if (cmdCache[device]) return cmdCache[device];
  try {
    const d = createDevice(device, {});
    cmdCache[device] = (d.completions ? d.completions() : []) || [];
  } catch { cmdCache[device] = []; }
  return cmdCache[device];
}

// ============================================================
//  ตัวผู้ช่วย
// ============================================================
export function createJulong({ getCtx }) {
  const el = document.createElement('div');
  el.className = 'jl-wrap';
  el.innerHTML = `
    <button class="jl-fab" id="jl-fab" aria-label="ถามจูล่ง">
      <span class="jl-face">🐎</span><span class="jl-fab-name">จูล่ง</span>
    </button>
    <div class="jl-panel" id="jl-panel" hidden>
      <div class="jl-head">
        <div class="jl-title"><span class="jl-face">🐎</span>
          <div><b>จูล่ง</b><div class="jl-sub" id="jl-where">ผู้ช่วยประจำศูนย์เรียนรู้</div></div>
        </div>
        <button class="jl-x" id="jl-close" aria-label="ปิด">✕</button>
      </div>
      <div class="jl-body" id="jl-body"></div>
      <div class="jl-quick" id="jl-quick"></div>
      <form class="jl-form" id="jl-form">
        <input id="jl-input" placeholder="ถามได้เลย เช่น VLAN คืออะไร" autocomplete="off">
        <button class="btn sm primary" type="submit">ถาม</button>
      </form>
    </div>`;

  const $ = s => el.querySelector(s);
  const body = () => $('#jl-body');
  let hintStep = {};          // ระดับคำใบ้ที่ปล่อยไปแล้วของแต่ละ task

  const bubble = (who, html) => {
    const d = document.createElement('div');
    d.className = `jl-msg ${who}`;
    d.innerHTML = html;
    body().appendChild(d);
    body().scrollTop = body().scrollHeight;
    d.querySelectorAll('[data-go]').forEach(a =>
      a.addEventListener('click', () => { location.hash = a.dataset.go; close(); }));
    return d;
  };
  const say = html => bubble('jl', html);
  const me = text => bubble('me', esc(text));

  // ---------- คำตอบแต่ละแบบ ----------
  function greet() {
    const c = getCtx();
    body().innerHTML = '';
    if (c.kind === 'lab') {
      say(`ข้าคือ <b>จูล่ง</b> ขอรับ — ตอนนี้ท่านกำลังทำ <b>${esc(c.labTitle)}</b><br>
        ติดตรงไหนเรียกข้าได้ทันที ข้าจะค่อย ๆ ใบ้ให้ทีละขั้น ไม่บอกคำตอบรวดเดียว`);
    } else if (c.kind === 'quiz') {
      say(`ข้าคือ <b>จูล่ง</b> ขอรับ — ตอนนี้ท่านกำลังทำแบบทดสอบอยู่<br>
        <b>ข้าจะไม่บอกคำตอบ</b> เพราะจะทำให้การวัดผลไม่มีความหมาย
        แต่ถามหลักการหรือศัพท์ที่ไม่เข้าใจได้ ข้าจะชี้บทเรียนที่เกี่ยวข้องให้`);
    } else {
      say(`ข้าคือ <b>จูล่ง</b> ผู้ช่วยประจำศูนย์เรียนรู้ขอรับ<br>
        ถามเรื่องในบทเรียนได้ทุกเรื่อง เช่น <i>VLAN คืออะไร</i> · <i>subnet /26 ใช้ได้กี่เครื่อง</i> ·
        <i>ARP ทำงานยังไง</i> — ข้าจะค้นจากบทเรียนในเว็บนี้มาตอบพร้อมบอกว่าอยู่หัวข้อไหน`);
    }
    renderQuick();
  }

  function renderQuick() {
    const c = getCtx();
    const chips = c.kind === 'lab'
      ? ['ใบ้หน่อย', 'ข้อนี้ทำยังไง', 'มีคำสั่งอะไรใช้ได้บ้าง', 'ติดตรงไหนแล้ว']
      : c.kind === 'quiz'
        ? ['อธิบายหลักการให้หน่อย', 'ไปอ่านบทเรียน']
        : ['VLAN คืออะไร', 'subnet คิดยังไง', 'OSI 7 ชั้น', 'DHCP ทำงานยังไง'];
    $('#jl-quick').innerHTML = chips.map(t => `<button class="jl-chip">${esc(t)}</button>`).join('');
    $('#jl-quick').querySelectorAll('.jl-chip').forEach(b =>
      b.addEventListener('click', () => ask(b.textContent)));
  }

  /** คำใบ้แบบไล่ระดับ — ยิ่งถามซ้ำยิ่งบอกละเอียดขึ้น */
  function labHint() {
    const c = getCtx();
    const i = c.tasks.findIndex((_, k) => !c.done[k]);
    if (i < 0) return say('ท่านทำครบทุกข้อแล้วขอรับ 🎉 กดปุ่ม Next ด้านบนเพื่อไปต่อได้เลย');
    const task = c.tasks[i];
    const step = (hintStep[i] = (hintStep[i] || 0) + 1);
    const goal = strip(task.t);

    if (step === 1) {
      return say(`ข้อที่ท่านค้างอยู่คือข้อ <b>${i + 1}</b> — ${esc(goal)}<br>
        <span class="jl-dim">ลองนึกก่อนว่าสิ่งที่โจทย์ต้องการอยู่ในเมนูหรือหมวดคำสั่งไหน
        ถ้ายังไม่ออก ถามข้าอีกครั้งข้าจะใบ้ให้ลึกขึ้น</span>`);
    }
    if (step === 2) {
      const first = String(task.hint || '').trim().split(/\s+/)[0];
      const fam = first ? `หมวดคำสั่งที่ต้องใช้ขึ้นต้นด้วย <code>${esc(first)}</code>` : 'ลองดูคำสั่งที่เกี่ยวกับเรื่องนี้ในบทเรียน';
      const found = search(goal, { trackId: c.track, limit: 1 })[0];
      return say(`ใกล้แล้วขอรับ — ${fam}<br>
        ${found ? `เรื่องนี้อธิบายไว้ที่ <b>${esc(found.title)}</b>
          <button class="jl-link" data-go="${found.href}">เปิดบทเรียน</button><br>` : ''}
        <span class="jl-dim">ถามข้าอีกครั้ง ข้าจะบอกคำสั่งเต็ม ๆ</span>`);
    }
    return say(`คำสั่งที่ต้องใช้คือ<br><code class="jl-cmd">${esc(task.hint || '(ข้อนี้ไม่ได้ให้คำใบ้ไว้)')}</code><br>
      <span class="jl-dim">พิมพ์ลงในเทอร์มินัลด้านซ้ายได้เลยขอรับ</span>`);
  }

  function labCommands() {
    const c = getCtx();
    const cmds = deviceCommands(c.device);
    if (!cmds.length) return say('อุปกรณ์นี้ยังไม่มีรายการคำสั่งให้ข้าดูขอรับ ลองกดปุ่ม <b>?</b> ที่มุมขวาบนของเทอร์มินัล');
    const show = cmds.slice(0, 14);
    say(`คำสั่งที่ใช้ได้บ่อยบน <b>${esc(DEVICE_LABELS[c.device] || c.device)}</b>:<br>
      ${show.map(x => `<code class="jl-cmd">${esc(x)}</code>`).join('')}
      <span class="jl-dim">ยังมีอีก ${Math.max(0, cmds.length - show.length)} คำสั่ง — กดปุ่ม <b>?</b> ในเทอร์มินัลเพื่อดูตามตำแหน่งที่อยู่</span>`);
  }

  function labStatus() {
    const c = getCtx();
    const n = c.done.filter(Boolean).length;
    const left = c.tasks.map((t, i) => ({ t, i })).filter(x => !c.done[x.i]);
    say(`ตอนนี้ท่านทำได้ <b>${n}/${c.tasks.length}</b> ข้อขอรับ<br>
      ${left.length ? `ที่ยังเหลือคือ:<br>${left.slice(0, 5).map(x => `• ข้อ ${x.i + 1} ${esc(strip(x.t.t))}`).join('<br>')}`
        : 'ครบแล้วทุกข้อ 🎉'}`);
  }

  function answerFromLessons(q) {
    const c = getCtx();
    const hits = search(q, { trackId: c.track, limit: 3 });
    if (!hits.length) {
      return say(`ข้าหาไม่เจอในบทเรียนขอรับ ลองใช้คำที่สั้นลงหรือเป็นศัพท์เทคนิคดู
        เช่น <i>VLAN</i> · <i>subnet</i> · <i>ARP</i> · <i>DHCP</i> · <i>STP</i>`);
    }
    const [best, ...rest] = hits;
    say(`เรื่องนี้อยู่ในหัวข้อ <b>${esc(best.title)}</b>
      <span class="jl-dim">(${best.icon} ${esc(best.trackName)} ระดับ ${best.level})</span><br>
      <div class="jl-quote">${esc(snippet(best.body, q))}</div>
      <button class="jl-link" data-go="${best.href}">เปิดบทเรียนนี้</button>
      ${rest.length ? `<div class="jl-dim" style="margin-top:8px">ที่เกี่ยวข้องอีก:</div>
        ${rest.map(r => `<button class="jl-link" data-go="${r.href}">${r.icon} ${esc(r.title)}</button>`).join('')}` : ''}`);
  }

  // ---------- ตัวแยกเจตนา ----------
  function ask(text) {
    const q = String(text || '').trim();
    if (!q) return;
    me(q);
    $('#jl-input').value = '';
    const c = getCtx();
    const low = q.toLowerCase();

    const wantHint = /ใบ้|hint|ช่วย|ทำยังไง|ทำไง|ยังไง|ไม่รู้|ติด|ข้อนี้/.test(low);
    const wantCmds = /คำสั่ง|command|ใช้อะไรได้|มีอะไรบ้าง/.test(low);
    const wantStatus = /ติดตรงไหน|เหลืออะไร|สถานะ|ทำไปกี่ข้อ/.test(low);

    if (c.kind === 'lab') {
      if (wantStatus) return labStatus();
      if (wantCmds) return labCommands();
      if (wantHint) return labHint();
      return answerFromLessons(q);
    }

    if (c.kind === 'quiz') {
      // ตั้งใจไม่ตอบคำถามที่ขอคำตอบตรง ๆ ระหว่างสอบ
      if (/ข้อนี้ตอบ|เฉลย|ตอบอะไร|ข้อไหนถูก|answer/.test(low)) {
        return say(`ข้าไม่บอกคำตอบระหว่างสอบขอรับ 🙏 ไม่งั้นคะแนนก็ไม่ได้บอกอะไรเลย<br>
          แต่ถ้าท่านถามว่า <i>หลักการเรื่องนี้คืออะไร</i> ข้าจะพาไปดูบทเรียนให้
          และหลังส่งข้อสอบแล้วจะมีคำอธิบายเฉลยครบทุกข้อ`);
      }
      return answerFromLessons(q);
    }

    if (wantCmds && c.device) return labCommands();
    return answerFromLessons(q);
  }

  // ---------- ป๊อปอัพแสดงความยินดีตอนทำ Lab จบ ----------
  const CHEER = 'ยอดเยี่ยมมากเจ้าเด็กน้อย แต่ยังห่างชั้นกับข้าเยอะ ' +
    'จงหมั่นฝึกตนให้เป็นนิจ ดุจเหล็กกล้าผ่านไฟ ฮ่าฮ่าฮ่า';

  function celebrate({ title = '', sub = '' } = {}) {
    el.querySelector('.jl-cheer')?.remove();
    const box = document.createElement('div');
    box.className = 'jl-cheer';
    box.innerHTML = `
      <div class="jl-cheer-card" role="dialog" aria-label="จูล่งแสดงความยินดี">
        <div class="jl-cheer-face">🐎</div>
        <div class="jl-cheer-name">จูล่ง</div>
        ${title ? `<div class="jl-cheer-title">${esc(title)}</div>` : ''}
        <div class="jl-cheer-say">“${esc(CHEER)}”</div>
        ${sub ? `<div class="jl-cheer-sub">${esc(sub)}</div>` : ''}
        <button class="btn sm primary" data-close>รับคำ</button>
      </div>`;
    const bye = () => box.remove();
    box.addEventListener('click', e => { if (e.target === box || e.target.hasAttribute('data-close')) bye(); });
    document.addEventListener('keydown', function onEsc(e) {
      if (e.key === 'Escape') { bye(); document.removeEventListener('keydown', onEsc); }
    });
    el.appendChild(box);
    setTimeout(() => box.querySelector('[data-close]')?.focus(), 60);
    // เก็บไว้ในบทสนทนาด้วย เผื่อเปิดแผงมาดูย้อนหลัง
    say(`<b>${esc(title || 'ทำ Lab จบแล้ว')}</b><br>“${esc(CHEER)}”`);
  }

  // ---------- เปิด/ปิด ----------
  /** อัปเดตหัวแผงและปุ่มลัดให้ตรงกับหน้าที่กำลังเปิดอยู่ */
  function syncCtx() {
    const c = getCtx();
    $('#jl-where').textContent =
      c.kind === 'lab' ? 'กำลังช่วยเรื่อง Lab' :
      c.kind === 'quiz' ? 'โหมดสอบ — ไม่บอกคำตอบ' : 'ผู้ช่วยประจำศูนย์เรียนรู้';
    if (!$('#jl-panel').hidden) renderQuick();
  }
  function open() {
    $('#jl-panel').hidden = false;
    $('#jl-fab').classList.add('open');
    syncCtx();
    if (!body().children.length) greet(); else renderQuick();
    setTimeout(() => $('#jl-input').focus(), 30);
  }
  function close() { $('#jl-panel').hidden = true; $('#jl-fab').classList.remove('open'); }
  function toggle() { $('#jl-panel').hidden ? open() : close(); }

  $('#jl-fab').addEventListener('click', toggle);
  $('#jl-close').addEventListener('click', close);
  $('#jl-form').addEventListener('submit', e => { e.preventDefault(); ask($('#jl-input').value); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

  return {
    el, open, close, toggle, syncCtx, celebrate,
    reset: () => { hintStep = {}; body().innerHTML = ''; el.querySelector('.jl-cheer')?.remove(); },
  };
}
