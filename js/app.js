import { TRACKS, trackById, ALL_LABS, labById } from '../data/tracks/index.js';
import { SURVIVAL_LABS, severityLabel, difficultyLabel } from '../data/labs/survival.js';
import { LEVELS, DREYFUS, levelOf, PASS_SCORE } from '../data/levels.js';
import { store, tierProgress, setStoreUser, progressOf, clearProgressOf } from './store.js';
import { auth } from './auth.js';
import { createTerminal } from './terminal.js';
import { createWindowsGui } from './gui/windows-gui.js';
import { normCmd } from './devices/util.js';
import { DEVICE_LABELS, DEVICE_SHORT } from './devices/index.js';

const $ = s => document.querySelector(s);
const view = () => $('#view');

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };

function toast(msg, kind = '') {
  const t = h(`<div class="toast ${kind}">${msg}</div>`);
  $('#toast-wrap').appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(20px)'; t.style.transition = '.3s'; }, 3200);
  setTimeout(() => t.remove(), 3600);
}

// ---------------- ความยากแบบ TryHackMe ----------------
const DIFF = { 1: ['easy', 'EASY'], 2: ['easy', 'EASY'], 3: ['medium', 'MEDIUM'], 4: ['hard', 'HARD'], 5: ['insane', 'INSANE'], 6: ['insane', 'INSANE'] };
const diffPill = lv => { const [c, t] = DIFF[lv] || DIFF[1]; return `<span class="diff ${c}">${t}</span>`; };

function ring(pct, size = 96, color = 'var(--acc)') {
  const r = size / 2 - 7, C = 2 * Math.PI * r;
  return `<div class="ring" style="width:${size}px;height:${size}px">
    <svg width="${size}" height="${size}">
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="#212837" stroke-width="7"></circle>
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="7"
        stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C - C * pct / 100}"></circle>
    </svg><div class="val">${pct}%</div></div>`;
}

// ---------------- progress ----------------
function levelUnlocked(trackId, level) {
  // admin เข้าได้ทุกระดับทุกเมนู — ต้องตรวจ/แก้เนื้อหาได้โดยไม่ต้องไล่สอบก่อน
  // (ใบประกาศยังต้องผ่านแบบทดสอบและ lab จริง ดู trackCertified)
  if (auth.isAdmin || store.all.unlockAll || +level === 1) return true;
  return !unlockNeeds(trackId, level).length;
}

/**
 * สิ่งที่ยังขาดก่อนจะปลดล็อกระดับนี้ — คืนเป็นข้อความพร้อมแสดง
 * ต้องผ่านแบบทดสอบระดับก่อนหน้า "และ" ทำ Lab ของระดับนั้นให้ครบ
 * (สอบผ่านอย่างเดียวแต่ไม่เคยลงมือทำ ยังไม่ถือว่าข้ามระดับได้)
 */
function unlockNeeds(trackId, level) {
  const prev = +level - 1;
  const t = trackById(trackId);
  if (!t || prev < 1) return [];
  const need = [];
  const q = store.quizOf(trackId, prev);
  if (!(q && q.passed)) need.push(`สอบระดับ ${prev} ให้ได้ ${PASS_SCORE}%`);
  const labs = (t.levels[prev] || {}).labs || [];
  const left = labs.filter(l => !(store.labOf(trackId, l.id) || {}).done).length;
  if (left) need.push(`ทำ Lab ระดับ ${prev} ให้ครบ (เหลือ ${left}/${labs.length} ชุด)`);
  return need;
}

/** ข้อความบอกเงื่อนไขที่ยังขาด ใช้ร่วมกันทุกที่ที่เด้งเตือน */
const unlockMsg = (trackId, level) => `ยังไม่ปลดล็อก — ต้อง${unlockNeeds(trackId, level).join(' และ ')}`;
function levelStatus(trackId, level) {
  const q = store.quizOf(trackId, level);
  const t = trackById(trackId);
  const labs = ((t.levels[level] || {}).labs || []);
  const labsDone = labs.filter(l => (store.labOf(trackId, l.id) || {}).done).length;
  return {
    read: store.isRead(trackId, level), quiz: q, passed: !!(q && q.passed),
    labsDone, labsTotal: labs.length, unlocked: levelUnlocked(trackId, level),
  };
}
function levelPct(trackId, level) {
  const s = levelStatus(trackId, level);
  // ระดับที่ไม่มี Lab (หัวข้อเชิงทฤษฎีล้วน) ต้องถ่วงน้ำหนักเฉพาะอ่าน+สอบ
  // ไม่งั้นจะค้างอยู่ที่ 70% ตลอดไปเพราะไม่มี Lab ให้ทำ
  if (!s.labsTotal) return (s.read ? 40 : 0) + (s.passed ? 60 : 0);
  let p = 0;
  if (s.read) p += 30;
  if (s.passed) p += 40;
  p += Math.round((s.labsDone / s.labsTotal) * 30);
  return Math.min(100, p);
}
/** หารด้วยจำนวนระดับที่หัวข้อนั้นมีจริง — บาง track มี 6 ระดับ ไม่ใช่ 5 ทุกอัน */
const trackPct = (id) => {
  const lv = Object.keys(trackById(id).levels);
  return lv.length ? Math.round(lv.reduce((a, l) => a + levelPct(id, +l), 0) / lv.length) : 0;
};
const overallPct = () => Math.round(TRACKS.reduce((a, t) => a + trackPct(t.id), 0) / TRACKS.length);

const survivalDone = () => SURVIVAL_LABS.filter(l => (store.labOf('survival', l.id) || {}).done).length;

/** ระดับที่หัวข้อนี้มีจริง — บาง track ยาวกว่า 5 ระดับ (เช่น CCNA ที่แบ่งตาม 6 domain) */
const levelsOf = id => Object.keys((trackById(id) || { levels: {} }).levels).map(Number).sort((a, b) => a - b);
const maxLevel = id => Math.max(...levelsOf(id), 1);
/** จำนวนระดับมากที่สุดในบรรดาทุกหัวข้อ — ใช้ทำหัวตารางที่ต้องครอบคลุมทุก track */
const widestLevels = () => LEVELS.filter(l => TRACKS.some(t => t.levels[l.n]));
/** จำนวนแบบทดสอบทั้งหมด = ผลรวมของระดับที่แต่ละหัวข้อมีจริง */
const quizTotal = () => TRACKS.reduce((a, t) => a + Object.keys(t.levels).length, 0);

// track ถือว่า "จบ" เมื่อผ่านแบบทดสอบครบ 5 ระดับ และทำ lab ครบทุกชุด
function trackCertified(id) {
  const lv = levelsOf(id);
  return lv.length > 0 && lv.every(l => {
    const s = levelStatus(id, l);
    return s.passed && s.labsDone === s.labsTotal;
  });
}
const allCertified = () => TRACKS.every(t => trackCertified(t.id));

function certCode(trackId) {
  const u = auth.username || 'guest';
  let n = 7;
  const s = `${u}|${trackId}|${trackPct(trackId)}`;
  for (let i = 0; i < s.length; i++) n = ((n * 33) ^ s.charCodeAt(i)) >>> 0;
  return n.toString(36).toUpperCase().padStart(8, '0').slice(0, 8);
}

// ================= LOGIN =================
let loginMode = 'login';
let serverUsers = null;      // จำนวนบัญชีในระบบ — ใช้ตัดสินว่าจะโชว์คำแนะนำครั้งแรกไหม
let serverUp = true;

function renderLogin(err = '') {
  $('#app').hidden = true;
  const lw = $('#login-wrap');
  lw.hidden = false;
  const hasUsers = serverUsers;
  lw.innerHTML = `
    <div class="login-card">
      <div class="brand">
        <div class="brand-mark">SE</div>
        <div><div class="brand-title">Learning Center</div><div class="brand-sub">IT &amp; SysEng</div></div>
      </div>
      <h1>${loginMode === 'login' ? 'เข้าสู่ระบบ' : 'สมัครบัญชีผู้เรียน'}</h1>
      <div class="sub">${loginMode === 'login' ? 'ความคืบหน้าจะถูกเก็บแยกตามบัญชีของคุณ' : 'สร้างบัญชีใหม่เพื่อเริ่มเก็บความคืบหน้า'}</div>
      <div class="login-tabs">
        <button data-m="login" class="${loginMode === 'login' ? 'on' : ''}">เข้าสู่ระบบ</button>
        <button data-m="register" class="${loginMode === 'register' ? 'on' : ''}">สมัครใหม่</button>
      </div>
      ${err ? `<div class="login-err">${esc(err)}</div>` : ''}
      <form id="login-form">
        <div class="fld"><label>ชื่อผู้ใช้</label>
          <input id="f-user" autocomplete="username" placeholder="เช่น somchai" spellcheck="false"></div>
        ${loginMode === 'register' ? `<div class="fld"><label>ชื่อที่แสดง</label>
          <input id="f-display" placeholder="ชื่อ-นามสกุล (ใช้พิมพ์บนใบประกาศ)"></div>` : ''}
        <div class="fld"><label>รหัสผ่าน</label>
          <input id="f-pass" type="password" autocomplete="current-password" placeholder="••••••••"></div>
        ${loginMode === 'register' ? `<div class="fld"><label>ยืนยันรหัสผ่าน</label>
          <input id="f-pass2" type="password" placeholder="••••••••"></div>` : ''}
        <button class="btn primary block" type="submit" style="margin-top:6px">
          ${loginMode === 'login' ? 'เข้าสู่ระบบ' : 'สมัครและเข้าใช้งาน'}</button>
      </form>
      ${loginMode === 'login' && serverUp && hasUsers === 1 ? `<div class="hint-box">
        <b>ครั้งแรกใช้งาน?</b> ล็อกอินด้วยบัญชีผู้ดูแลที่เซิร์ฟเวอร์สร้างให้<br>
        ผู้ใช้ <code>admin</code> · รหัสผ่านตามที่ขึ้นใน console ตอนเปิดเซิร์ฟเวอร์<br>
        แล้วเปลี่ยนรหัสผ่านทันทีที่หน้า "บัญชีของฉัน"</div>` : ''}
      ${loginMode === 'login' && !serverUp && hasUsers === 0 ? `<div class="hint-box">
        <b>ยังไม่มีบัญชีในเบราว์เซอร์นี้</b> — กด "สมัครบัญชี" เพื่อสร้างบัญชีแรก
        (บัญชีแรกจะได้สิทธิ์ผู้ดูแลระบบอัตโนมัติ)</div>` : ''}
      ${serverUp ? `<div class="hint-box" style="border-style:solid">
        🔒 <b>โหมดเซิร์ฟเวอร์</b> — บัญชีและความคืบหน้าเก็บที่เซิร์ฟเวอร์
        รหัสผ่านแฮชด้วย scrypt เซสชันเป็นคุกกี้ httpOnly เข้าเรียนจากเครื่องไหนก็ต่อจากที่ค้างไว้ได้</div>`
      : `<div class="hint-box" style="border-style:solid;border-color:var(--warn)">
        💾 <b>โหมดออฟไลน์</b> — หน้านี้เปิดจาก static hosting จึงไม่มีเซิร์ฟเวอร์ให้เก็บข้อมูล
        บัญชีและความคืบหน้าจะอยู่ใน<b>เบราว์เซอร์เครื่องนี้เท่านั้น</b> ล้างข้อมูลเบราว์เซอร์แล้วหาย
        และไม่ตามไปเครื่องอื่น<br>
        อยากให้ความคืบหน้าตามตัวและผู้ดูแลเห็นของทุกคน ให้รันเซิร์ฟเวอร์เองด้วย
        <code>npm start</code> แล้วเปิดผ่านเซิร์ฟเวอร์นั้น</div>`}
    </div>`;

  lw.querySelectorAll('[data-m]').forEach(b =>
    b.addEventListener('click', () => { loginMode = b.dataset.m; renderLogin(); }));

  $('#login-form').addEventListener('submit', async e => {
    e.preventDefault();
    const u = $('#f-user').value.trim().toLowerCase();
    const p = $('#f-pass').value;
    const btn = $('#login-form button[type="submit"]');
    if (btn) { btn.disabled = true; btn.textContent = 'กำลังติดต่อเซิร์ฟเวอร์...'; }
    if (loginMode === 'login') {
      const r = await auth.login(u, p);
      if (!r.ok) return renderLogin(r.msg);
      await startSession();
    } else {
      if (p !== $('#f-pass2').value) return renderLogin('รหัสผ่านทั้งสองช่องไม่ตรงกัน');
      const r = await auth.register(u, p, $('#f-display').value.trim(), 'user');
      if (!r.ok) return renderLogin(r.msg);
      await startSession();
    }
  });
  $('#f-user').focus();
}

async function startSession() {
  $('#login-wrap').hidden = true;
  $('#app').hidden = false;
  await setStoreUser(auth.username);
  if (auth.isAdmin) await auth.loadUsers();
  if (!location.hash || location.hash === '#/') location.hash = '#/';
  route();
  if (auth.current.mustChange) {
    toast('แนะนำให้เปลี่ยนรหัสผ่านเริ่มต้นที่หน้า "บัญชีของฉัน"', 'bad');
  }
}

// ================= CHROME =================
function renderNav() {
  const nav = $('#nav');
  const hash = location.hash || '#/';
  const on = href => hash === href || hash.startsWith(href + '/');
  const item = (href, ico, label, extra = '') =>
    `<div class="nav-i ${on(href) ? 'on' : ''}" data-href="${href}">
       <span class="ico">${ico}</span><span>${label}</span>${extra}</div>`;

  nav.innerHTML =
    item('#/', '🏠', 'หน้าหลัก') +
    item('#/levels', '🪜', 'ระดับความรู้') +
    `<div class="nav-h">Learning Paths</div>` +
    TRACKS.map(t => item(`#/track/${t.id}`, t.icon, t.name, `<span class="pct">${trackPct(t.id)}%</span>`)).join('') +
    `<div class="nav-h">ลงมือทำ</div>` +
    item('#/survival', '🔥', 'เอาชีวิตรอด', `<span class="cnt">${survivalDone()}/${SURVIVAL_LABS.length}</span>`) +
    item('#/labs', '🧪', 'Lab ทั้งหมด', `<span class="cnt">${ALL_LABS.length}</span>`) +
    item('#/terminal', '⌨️', 'Command Prompt') +
    `<div class="nav-h">ของฉัน</div>` +
    item('#/progress', '📊', 'ความคืบหน้า') +
    item('#/certificate', '🏅', 'ใบประกาศนียบัตร') +
    item('#/account', '👤', 'บัญชีของฉัน') +
    (auth.isAdmin ? `<div class="nav-h">ผู้ดูแลระบบ</div>` + item('#/admin', '🛠️', 'จัดการผู้ใช้') : '');

  nav.querySelectorAll('.nav-i').forEach(n =>
    n.addEventListener('click', () => { location.hash = n.dataset.href; $('#sidebar').classList.remove('open'); }));
}

function renderSide() {
  const u = auth.current;
  $('#user-box').innerHTML = `
    <div class="avatar ${u.role === 'admin' ? 'adm' : ''}">${esc((u.display || u.username)[0].toUpperCase())}</div>
    <div style="flex:1;min-width:0">
      <div class="nm">${esc(u.display || u.username)}</div>
      <div class="rl">${u.role === 'admin' ? '⚡ admin' : 'member'}</div>
    </div>`;
  const tp = tierProgress(store.xp);
  const lv = LEVELS[tp.t - 1];
  $('#side-level').textContent = `${lv.icon} ${lv.name}`;
  $('#side-bar').style.width = tp.pct + '%';
  $('#side-xp').textContent = `${store.xp} XP`;
  $('#side-next').textContent = tp.t < 5 ? `→ ${tp.hi}` : 'MAX';
  renderRankBadge(tp, lv);
}

/** ป้ายอันดับลอยมุมขวาล่าง — เห็นได้ทุกหน้าโดยไม่ต้องเปิดเมนูข้าง */
function renderRankBadge(tp, lv) {
  const el = $('#rank-badge');
  if (!el) return;
  const color = lv.color;                       // เช่น var(--lv3)
  el.style.setProperty('--rb', color);
  // เงาเรืองใช้สีเดียวกับ tier แต่จาง — ใช้ color-mix เพื่อไม่ต้องแปลงค่าเอง
  el.style.setProperty('--rb-glow', `color-mix(in srgb, ${color} 45%, transparent)`);
  el.innerHTML = `
    <span class="rb-ico">${lv.icon}</span>
    <span style="min-width:96px">
      <span class="rb-name">${lv.name}</span>
      <span class="rb-xp" style="display:block">${store.xp} XP ${tp.t < 5 ? `· → ${tp.hi}` : '· MAX'}</span>
      <span class="rb-bar" style="display:block"><i style="width:${tp.pct}%"></i></span>
    </span>`;
  el.hidden = false;
}

function crumbs(parts) {
  $('#crumbs').innerHTML = parts.map((p, i) =>
    (i ? '<span class="sep">/</span>' : '') +
    (p.href ? `<span class="lk" data-h="${p.href}">${p.t}</span>` : `<b>${p.t}</b>`)).join(' ');
  $('#crumbs').querySelectorAll('[data-h]').forEach(e =>
    e.addEventListener('click', () => location.hash = e.dataset.h));
}

function topStats() {
  const labsDone = ALL_LABS.filter(l => (store.labOf(l.track, l.id) || {}).done).length;
  const quizPassed = TRACKS.reduce((a, t) =>
    a + Object.keys(t.levels).filter(l => (store.quizOf(t.id, +l) || {}).passed).length, 0);
  $('#topbar-stats').innerHTML =
    `<span title="XP สะสม">⚡ ${store.xp}</span>` +
    `<span title="แบบทดสอบที่ผ่าน">✅ ${quizPassed}/${quizTotal()}</span>` +
    `<span title="Lab">🧪 ${labsDone}/${ALL_LABS.length}</span>` +
    `<span title="เอาชีวิตรอด">🔥 ${survivalDone()}/${SURVIVAL_LABS.length}</span>`;
}
const refreshChrome = () => { renderNav(); renderSide(); topStats(); };

// ================= VIEWS =================
function vDashboard() {
  crumbs([{ t: 'หน้าหลัก' }]);
  const pct = overallPct();
  const u = auth.current;
  view().innerHTML = `
    <div class="room-hero" style="--hero:rgba(230,57,74,.22)">
      <div class="room-ico">🛡️</div>
      <div class="room-meta">
        <span class="pill acc">LEARNING CENTER</span>
        <h1>สวัสดี ${esc(u.display || u.username)} 👋</h1>
        <p>เส้นทางเรียนรู้สำหรับ IT / System / Network Engineer — 6 หัวข้อ 5–6 ระดับ
           พร้อม Lab ที่มี command prompt จำลอง และหมวด "เอาชีวิตรอด" ที่จำลองเหตุการณ์จริง</p>
      </div>
      <div class="room-side">
        ${ring(pct, 96)}
        <div class="muted" style="font-size:10.5px;margin-top:6px;font-family:var(--mono)">ความคืบหน้ารวม</div>
      </div>
    </div>

    <div class="grid g5" style="margin-bottom:6px">
      ${[['⚡', store.xp, 'XP สะสม', 'var(--acc-2)'],
      ['✅', TRACKS.reduce((a, t) => a + Object.keys(t.levels).filter(l => (store.quizOf(t.id, +l) || {}).passed).length, 0) + '/' + quizTotal(), 'แบบทดสอบผ่าน', 'var(--ok)'],
      ['🧪', ALL_LABS.filter(l => (store.labOf(l.track, l.id) || {}).done).length + '/' + ALL_LABS.length, 'Lab สำเร็จ', 'var(--info)'],
      ['🔥', survivalDone() + '/' + SURVIVAL_LABS.length, 'เอาชีวิตรอด', 'var(--acc)'],
      ['🏅', TRACKS.filter(t => trackCertified(t.id)).length + '/' + TRACKS.length, 'ใบประกาศ', 'var(--purple)']]
      .map(([i, v, l, c]) => `<div class="card" style="text-align:center;padding:14px">
        <div style="font-size:20px">${i}</div>
        <div style="font-family:var(--mono);font-size:20px;font-weight:700;color:${c}">${v}</div>
        <div class="muted" style="font-size:10.5px;text-transform:uppercase;letter-spacing:1px">${l}</div>
      </div>`).join('')}
    </div>

    <h2 class="sec">Learning Paths</h2>
    <div class="grid g2" id="tk-grid"></div>

    <h2 class="sec">🔥 เอาชีวิตรอด — เหตุการณ์ล่าสุด</h2>
    <div class="grid g2" id="sv-preview"></div>
    <div style="text-align:center;margin-top:12px">
      <button class="btn" id="more-sv">ดูเหตุการณ์ทั้งหมด (${SURVIVAL_LABS.length}) →</button>
    </div>`;

  $('#tk-grid').innerHTML = TRACKS.map(t => {
    const p = trackPct(t.id);
    const dots = levelsOf(t.id).map(l => {
      const s = levelStatus(t.id, l);
      return `<div class="dot ${s.passed && s.labsDone === s.labsTotal ? 'f' : (s.read || s.quiz) ? 'h' : ''}"></div>`;
    }).join('');
    return `<div class="tk-card" data-t="${t.id}">
      <div class="tk-top">
        <div class="tk-ico">${t.icon}</div>
        <div style="flex:1"><h3>${t.name}</h3><div class="sub">${t.sub}</div></div>
        ${trackCertified(t.id) ? '<span class="pill ok">🏅 จบแล้ว</span>' : `<div style="font-family:var(--mono);font-size:13px;color:var(--acc-hi)">${p}%</div>`}
      </div>
      <div style="font-size:12.5px;color:var(--txt-mute);line-height:1.5">${t.desc}</div>
      <div class="dots">${dots}</div>
    </div>`;
  }).join('');

  $('#sv-preview').innerHTML = SURVIVAL_LABS.slice(0, 2).map(svCard).join('');
  view().querySelectorAll('.tk-card').forEach(c => c.addEventListener('click', () => location.hash = `#/track/${c.dataset.t}`));
  view().querySelectorAll('[data-go]').forEach(c => c.addEventListener('click', () => location.hash = c.dataset.go));
  $('#more-sv').addEventListener('click', () => location.hash = '#/survival');
}

function vLevels() {
  crumbs([{ t: 'หน้าหลัก', href: '#/' }, { t: 'ระดับความรู้' }]);
  view().innerHTML = `
    <div class="page-head">
      <h1>ระดับความรู้ 5 ขั้น</h1>
      <p>อ้างอิงโมเดล Dreyfus — ทุกหัวข้อแบ่งเนื้อหาตาม 5 ระดับนี้
      ปลดล็อกระดับถัดไปเมื่อ<b>สอบได้ ${PASS_SCORE}% ขึ้นไปและทำ Lab ของระดับนั้นครบทุกชุด</b></p>
    </div>
    ${DREYFUS.map(l => `
      <div class="sect" style="border-left:3px solid ${l.color}">
        <h3><span class="num" style="color:${l.color};border-color:${l.color}">LEVEL ${l.n}</span>
          ${l.icon} ${l.name} — ${l.th} ${diffPill(l.n)}</h3>
        <p>${l.desc}</p>
        <div class="muted" style="font-size:12.3px;margin-bottom:6px">สิ่งที่คนระดับนี้ทำได้:</div>
        <ul>${l.can.map(c => `<li>${c}</li>`).join('')}</ul>
        <div class="row" style="margin-top:10px">
          ${TRACKS.filter(t => t.levels[l.n]).map(t => `<span class="pill" style="cursor:pointer" data-go="#/learn/${t.id}/${l.n}">${t.icon} ${t.name}</span>`).join('')}
        </div>
      </div>`).join('')}`;
  view().querySelectorAll('[data-go]').forEach(e => e.addEventListener('click', () => location.hash = e.dataset.go));
}

function vTrack(id) {
  const t = trackById(id);
  if (!t) return vNotFound();
  crumbs([{ t: 'หน้าหลัก', href: '#/' }, { t: t.name }]);
  const p = trackPct(id);
  const done = trackCertified(id);

  view().innerHTML = `
    <div class="room-hero" style="--hero:rgba(230,57,74,.2)">
      <div class="room-ico">${t.icon}</div>
      <div class="room-meta">
        <div class="row" style="gap:7px">
          <span class="pill acc">LEARNING PATH</span>
          ${done ? '<span class="pill ok">🏅 ได้รับใบประกาศแล้ว</span>' : ''}
        </div>
        <h1>${t.name}</h1>
        <p>${t.desc}</p>
      </div>
      <div class="room-side">${ring(p, 96)}
        <div class="muted" style="font-size:10.5px;margin-top:6px;font-family:var(--mono)">${t.sub}</div></div>
    </div>
    <div class="grid g2" id="lvs"></div>`;

  $('#lvs').innerHTML = levelsOf(id).map(levelOf).map(l => {
    const d = t.levels[l.n], s = levelStatus(id, l.n), pct = levelPct(id, l.n);
    let badge = '<span class="pill lock">🔒 ล็อก</span>';
    if (s.unlocked) badge = s.passed ? `<span class="pill ok">✓ ${s.quiz.best}%</span>`
      : s.quiz ? `<span class="pill warn">${s.quiz.best}%</span>`
        : s.read ? '<span class="pill">อ่านแล้ว</span>' : '<span class="pill">ยังไม่เริ่ม</span>';
    return `<div class="lv-card ${s.unlocked ? '' : 'locked'}" style="--lc:${l.color}" data-l="${l.n}">
      <div class="row" style="justify-content:space-between">
        <div class="lv-n">LEVEL ${l.n} · ${l.name}</div>${badge}
      </div>
      <h3>${l.icon} ${d.title}</h3>
      <div style="margin-bottom:8px">${diffPill(l.n)}</div>
      <p>${d.objectives[0]}</p>
      <div class="bar"><div class="bar-fill" style="width:${pct}%"></div></div>
      <div class="row" style="margin-top:10px;font-size:11px;color:var(--txt-mute);gap:13px;font-family:var(--mono)">
        <span>📖 ${d.sections.length}</span><span>📝 ${d.quiz.length}</span><span>🧪 ${s.labsDone}/${s.labsTotal}</span>
      </div>
    </div>`;
  }).join('');

  view().querySelectorAll('.lv-card').forEach(c => c.addEventListener('click', () => {
    const l = +c.dataset.l;
    // ระดับที่ล็อกก็เข้าไปดูได้ว่ามี Lab อะไรบ้าง — หน้าระดับจะบอกเงื่อนไขปลดล็อกเอง
    if (!levelUnlocked(id, l)) toast(`ระดับ ${l} ยังล็อก — ดูได้ว่ามี Lab อะไรรออยู่`);
    location.hash = `#/learn/${id}/${l}`;
  }));
}

function vLearn(id, level) {
  const t = trackById(id);
  if (!t || !t.levels[level]) return vNotFound();
  const d = t.levels[level], l = levelOf(level);
  // ระดับที่ยังไม่ปลดล็อกยังเปิดดูได้ — เห็นว่ามี Lab อะไรรออยู่เท่ากับหน้า "Lab ทั้งหมด"
  // แต่บทเรียนและแบบทดสอบยังปิด และกดเข้า Lab ไม่ได้
  const open = levelUnlocked(id, level);
  crumbs([{ t: 'หน้าหลัก', href: '#/' }, { t: t.name, href: `#/track/${id}` }, { t: `L${level}` }]);

  const labCard = (lb) => {
    const rec = store.labOf(id, lb.id);
    return `<div class="tk-card ${open ? '' : 'locked'}"
      ${open ? `data-go="#/lab/${id}/${lb.id}"` : 'data-lock="1"'}>
      <div class="row" style="justify-content:space-between;align-items:flex-start">
        <h3 style="font-size:14.5px;margin:0;flex:1">${lb.title}</h3>
        ${!open ? '<span class="pill lock">🔒</span>'
        : rec && rec.done ? '<span class="pill ok">✓</span>'
          : rec && rec.best ? `<span class="pill warn">${rec.best}/${lb.tasks.length}</span>` : ''}
      </div>
      <div style="font-size:12.4px;color:var(--txt-mute);line-height:1.5">${lb.brief}</div>
      <div class="row" style="font-size:11px;color:var(--txt-mute)">
        <span class="pill">${DEVICE_LABELS[lb.device]}</span><span>${lb.tasks.length} ขั้นตอน</span></div>
    </div>`;
  };

  view().innerHTML = `
    <div class="room-hero" style="--hero:${l.color}22">
      <div class="room-ico">${open ? l.icon : '🔒'}</div>
      <div class="room-meta">
        <div class="row" style="gap:7px">
          <span class="pill" style="color:${l.color};border-color:${l.color}">LEVEL ${level} · ${l.name}</span>
          ${diffPill(level)}<span class="pill">${t.icon} ${t.name}</span>
          ${open ? '' : '<span class="pill lock">🔒 ยังล็อกอยู่</span>'}
        </div>
        <h1>${d.title}</h1>
      </div>
      <div class="room-side">${ring(levelPct(id, level), 96, l.color)}</div>
    </div>

    ${open ? '' : `<div class="note warn" id="lock-note" style="margin-bottom:14px">
      <b>ระดับนี้ยังล็อกอยู่</b> — ต้องทำให้ครบก่อน:
      <ul style="margin:6px 0 0;padding-left:20px">
        ${unlockNeeds(id, level).map(x => `<li>${x}</li>`).join('')}
      </ul>
      ${(d.labs || []).length ? `<div class="muted" style="font-size:12px;margin-top:6px">
        ด้านล่างคือ Lab ทั้ง ${d.labs.length} ชุดที่รออยู่ในระดับนี้</div>` : ''}
      <div style="margin-top:10px"><button class="btn sm primary" id="to-prev">← ไปที่ระดับ ${+level - 1}</button></div>
    </div>`}

    <div class="lesson">
      <div>
        <div class="sect">
          <h3><span class="num">TASK</span> จบบทนี้แล้วคุณจะ...</h3>
          <ul>${d.objectives.map(o => `<li>${o}</li>`).join('')}</ul>
        </div>
        ${open ? d.sections.map((s, i) => `<div class="sect" id="s${i}">
          <h3><span class="num">${i + 1}</span> ${s.t}</h3>${s.h}</div>`).join('') : ''}

        ${open ? `<div class="card" style="text-align:center">
          <h3 style="margin:0 0 6px">พร้อมทดสอบความเข้าใจหรือยัง?</h3>
          <p class="muted" style="font-size:12.8px;margin:0 0 14px">
            ${d.quiz.length} ข้อ · ต้องได้ ${PASS_SCORE}% ขึ้นไป${(d.labs || []).length ? ' <b>และทำ Lab ของระดับนี้ให้ครบ</b>' : ''} จึงจะปลดล็อกระดับถัดไป</p>
          <button class="btn primary" id="to-quiz">📝 ทำแบบทดสอบ</button>
        </div>` : ''}

        ${(d.labs || []).length ? `<h2 class="sec">Lab ของระดับนี้ (${d.labs.length})</h2>
        <div class="grid g2">${d.labs.map(labCard).join('')}</div>` : ''}
      </div>

      <div class="toc">
        <h4>ในบทนี้</h4>
        ${open ? d.sections.map((s, i) => `<a data-s="s${i}">${i + 1}. ${s.t}</a>`).join('')
      : '<div class="muted" style="font-size:12px;padding:5px 8px">บทเรียนจะเปิดเมื่อปลดล็อกระดับนี้</div>'}
        <div style="border-top:1px solid var(--line-soft);margin:9px 0 7px"></div>
        ${open ? `<a data-go="#/quiz/${id}/${level}">📝 แบบทดสอบ (${d.quiz.length})</a>` : ''}
        ${(d.labs || []).map(lb => open
        ? `<a data-go="#/lab/${id}/${lb.id}">🧪 ${lb.title.split('—')[0].trim()}</a>`
        : `<div class="muted" style="font-size:12.4px;padding:5px 8px">🔒 ${lb.title.split('—')[0].trim()}</div>`).join('')}
        <div style="border-top:1px solid var(--line-soft);margin:9px 0 7px"></div>
        ${level > 1 ? `<a data-go="#/learn/${id}/${+level - 1}">← ระดับ ${+level - 1}</a>` : ''}
        ${+level < maxLevel(id) ? `<a data-go="#/learn/${id}/${+level + 1}">ระดับ ${+level + 1} →</a>` : ''}
      </div>
    </div>`;

  view().querySelectorAll('.toc a[data-s]').forEach(a =>
    a.addEventListener('click', () => $('#' + a.dataset.s).scrollIntoView({ behavior: 'smooth' })));
  view().querySelectorAll('[data-go]').forEach(a => a.addEventListener('click', () => location.hash = a.dataset.go));
  view().querySelectorAll('[data-lock]').forEach(c => c.addEventListener('click', () =>
    toast(unlockMsg(id, level), 'bad')));
  $('#to-quiz')?.addEventListener('click', () => location.hash = `#/quiz/${id}/${level}`);
  $('#to-prev')?.addEventListener('click', () => { location.hash = `#/learn/${id}/${+level - 1}`; });

  if (!open) return;   // ระดับที่ล็อกอยู่ไม่นับว่าอ่านแล้วและไม่ได้ XP
  const g = store.markRead(id, level);
  if (g) { toast(`+${g} XP · อ่านบทเรียนแล้ว`, 'ok'); refreshChrome(); }
}

// ---------------- QUIZ ----------------
function vQuiz(id, level) {
  const t = trackById(id);
  if (!t || !t.levels[level]) return vNotFound();
  if (!levelUnlocked(id, level)) {
    toast(unlockMsg(id, level), 'bad');
    location.hash = `#/learn/${id}/${level}`;
    return;
  }
  const d = t.levels[level], l = levelOf(level), items = d.quiz;
  crumbs([{ t: 'หน้าหลัก', href: '#/' }, { t: t.name, href: `#/track/${id}` },
  { t: `L${level}`, href: `#/learn/${id}/${level}` }, { t: 'แบบทดสอบ' }]);

  const st = { i: 0, ans: new Array(items.length).fill(null), checked: new Array(items.length).fill(false), correct: new Array(items.length).fill(false) };

  view().innerHTML = `<div class="q-wrap">
    <div class="q-head">
      <div class="row"><span class="pill acc">${t.icon} ${t.name} · L${level}</span>${diffPill(level)}</div>
      <div class="q-prog"><div id="qbar" style="width:0"></div></div>
      <div class="muted" style="font-family:var(--mono);font-size:12px" id="qcount"></div>
    </div><div id="qbox"></div></div>`;

  function renderQ() {
    const q = items[st.i];
    $('#qbar').style.width = (st.i / items.length * 100) + '%';
    $('#qcount').textContent = `${st.i + 1} / ${items.length}`;
    const typeLabel = { mcq: 'เลือกคำตอบที่ถูกที่สุด', multi: 'เลือกได้มากกว่า 1 ข้อ', cmd: 'พิมพ์คำสั่ง' }[q.type];

    $('#qbox').innerHTML = `<div class="q-card">
      <div class="q-type">${typeLabel}</div><div class="q-text">${q.q}</div>
      <div id="opts"></div><div id="expl"></div>
      <div class="q-foot"><button class="btn ghost" id="skip">ข้าม</button>
      <button class="btn primary" id="act">ตรวจคำตอบ</button></div></div>`;

    const optsEl = $('#opts');
    if (q.type === 'cmd') {
      optsEl.innerHTML = `<input class="q-input" id="cmdin" placeholder="พิมพ์คำสั่งที่นี่..." autocomplete="off" spellcheck="false">`;
      const inp = $('#cmdin');
      inp.value = st.ans[st.i] ?? '';
      inp.disabled = st.checked[st.i];
      inp.focus();
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') $('#act').click(); });
    } else {
      const sel = st.ans[st.i];
      optsEl.innerHTML = q.opts.map((o, i) => {
        const isSel = q.type === 'multi' ? (sel || []).includes(i) : sel === i;
        const isCorrect = q.type === 'multi' ? q.a.includes(i) : q.a === i;
        let cls = '';
        if (st.checked[st.i]) cls = isCorrect ? 'correct' : (isSel ? 'wrong' : '');
        else if (isSel) cls = 'sel';
        const mark = st.checked[st.i] ? (isCorrect ? '✓' : (isSel ? '✕' : String.fromCharCode(65 + i))) : String.fromCharCode(65 + i);
        return `<div class="opt ${cls}" data-i="${i}"><div class="mk">${mark}</div><div class="ot">${o}</div></div>`;
      }).join('');
      if (!st.checked[st.i]) optsEl.querySelectorAll('.opt').forEach(o => o.addEventListener('click', () => {
        const i = +o.dataset.i;
        if (q.type === 'multi') {
          const cur = new Set(st.ans[st.i] || []);
          cur.has(i) ? cur.delete(i) : cur.add(i);
          st.ans[st.i] = [...cur];
        } else st.ans[st.i] = i;
        renderQ();
      }));
    }
    if (st.checked[st.i]) showExpl();
    $('#skip').addEventListener('click', next);
    $('#act').textContent = st.checked[st.i] ? (st.i === items.length - 1 ? 'ดูผลลัพธ์' : 'ข้อถัดไป →') : 'ตรวจคำตอบ';
    $('#act').addEventListener('click', () => st.checked[st.i] ? next() : check());
  }

  function check() {
    const q = items[st.i];
    let ok = false;
    if (q.type === 'cmd') {
      const v = normCmd($('#cmdin').value);
      st.ans[st.i] = $('#cmdin').value;
      ok = q.ans.some(a => normCmd(a) === v);
    } else if (q.type === 'multi') {
      const a = (st.ans[st.i] || []).slice().sort().join(',');
      ok = a === q.a.slice().sort().join(',') && a !== '';
    } else {
      if (st.ans[st.i] === null) return toast('เลือกคำตอบก่อนนะ', 'bad');
      ok = st.ans[st.i] === q.a;
    }
    st.checked[st.i] = true; st.correct[st.i] = ok;
    renderQ();
  }

  function showExpl() {
    const q = items[st.i], ok = st.correct[st.i];
    const extra = (q.type === 'cmd' && !ok) ? `<div style="margin-top:6px">คำตอบที่ถูก: <code>${esc(q.ans[0])}</code></div>` : '';
    $('#expl').innerHTML = `<div class="expl ${ok ? 'ok' : 'bad'}">
      <div class="t">${ok ? '✅ ถูกต้อง' : '❌ ยังไม่ถูก'}</div><div>${q.why}</div>${extra}</div>`;
  }

  function next() {
    if (st.i < items.length - 1) { st.i++; renderQ(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    else finish();
  }

  function finish() {
    const right = st.correct.filter(Boolean).length;
    const pct = Math.round(right / items.length * 100);
    const passed = pct >= PASS_SCORE;
    const gained = store.recordQuiz(id, level, pct, passed);
    refreshChrome();
    const C = 2 * Math.PI * 62;
    view().innerHTML = `<div class="q-wrap"><div class="card result">
      <div class="score-ring"><svg width="150" height="150">
        <circle cx="75" cy="75" r="62" fill="none" stroke="#212837" stroke-width="11"></circle>
        <circle cx="75" cy="75" r="62" fill="none" stroke="${passed ? 'var(--ok)' : 'var(--warn)'}"
          stroke-width="11" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C - C * pct / 100}"></circle>
      </svg><div class="val">${pct}%</div></div>
      <h2>${passed ? '🎉 ผ่านแล้ว!' : '📚 ยังไม่ผ่าน ลองอีกครั้ง'}</h2>
      <p class="muted">ตอบถูก ${right}/${items.length} · เกณฑ์ ${PASS_SCORE}%${gained ? ` · <b style="color:var(--ok)">+${gained} XP</b>` : ''}</p>
      ${passed && +level < maxLevel(id) ? `<p class="dim">ทำ Lab ระดับนี้ให้ครบเพื่อปลดล็อกระดับ ${+level + 1}</p>` : ''}
      ${passed && +level === maxLevel(id) && trackCertified(id) ? `<p style="color:var(--acc-2)"><b>🏅 คุณจบหัวข้อนี้ครบแล้ว — รับใบประกาศได้เลย</b></p>` : ''}
      <div class="row" style="justify-content:center;margin-top:16px">
        <button class="btn" id="again">ทำใหม่</button>
        <button class="btn" id="back">กลับไปอ่าน</button>
        ${passed && +level < maxLevel(id) ? `<button class="btn primary" id="nextlv">ระดับ ${+level + 1} →</button>` : ''}
        ${(t.levels[level].labs || []).length ? `<button class="btn ok" id="dolab">🧪 ทำ Lab</button>` : ''}
      </div>
      <div class="review"><h4 style="margin:0 0 8px;font-size:12px;color:var(--txt-mute);font-family:var(--mono)">สรุปรายข้อ</h4>
        ${items.map((q, i) => `<div class="ri"><span>${st.correct[i] ? '✅' : '❌'}</span>
        <div><div>${q.q}</div><div class="muted" style="font-size:12.2px;margin-top:3px">${q.why}</div></div></div>`).join('')}
      </div></div></div>`;
    $('#again').addEventListener('click', () => vQuiz(id, level));
    $('#back').addEventListener('click', () => location.hash = `#/learn/${id}/${level}`);
    const n = $('#nextlv'); if (n) n.addEventListener('click', () => location.hash = `#/learn/${id}/${+level + 1}`);
    const dl = $('#dolab'); if (dl) dl.addEventListener('click', () => location.hash = `#/lab/${id}/${t.levels[level].labs[0].id}`);
    if (passed) toast(`ผ่านระดับ ${level} ของ ${t.name}!`, 'ok');
  }
  renderQ();
}

// ---------------- LAB (ใช้ร่วมกับ survival) ----------------
/**
 * ปลายทางของปุ่มท้าย Lab — Lab ถัดไปในหัวข้อเดียวกัน และทางกลับไปบทเรียนที่มา
 * Lab ถัดไปจะข้ามระดับที่ผู้เรียนคนนี้ยังปลดล็อกไม่ได้
 */
function labNav(lab, trackId) {
  if (trackId === 'survival') {
    const i = SURVIVAL_LABS.findIndex(l => l.id === lab.id);
    const n = SURVIVAL_LABS[i + 1];
    return {
      group: 'หมวดนี้',
      back: '#/survival', backLabel: 'กลับไปหมวดเอาชีวิตรอด',
      next: n ? { href: `#/survive/${n.id}`, title: n.title } : null,
    };
  }
  const inTrack = ALL_LABS.filter(l => l.track === trackId);
  const i = inTrack.findIndex(l => l.id === lab.id);
  const n = inTrack.slice(i + 1).find(l => levelUnlocked(l.track, l.level));
  return {
    group: 'หัวข้อนี้',
    back: `#/learn/${trackId}/${lab.level}`, backLabel: `กลับไปบทเรียนระดับ ${lab.level}`,
    next: n ? { href: `#/lab/${n.track}/${n.id}`, title: n.title, level: n.level } : null,
  };
}

function runLabView({ lab, trackId, backHref, hero }) {
  const done = new Array(lab.tasks.length).fill(false);
  let recorded = (store.labOf(trackId, lab.id) || {}).done;

  view().innerHTML = `
    ${hero}
    <div class="lab">
      <div id="term-mount"></div>
      <div class="lab-side">
        <!-- ปุ่มจบ Lab อยู่เหนือรายการสิ่งที่ต้องทำ จะได้ไม่ต้องเลื่อนหาตอนทำเสร็จ -->
        <div id="nav-slot"></div>
        <div class="tasks">
          <h4>สิ่งที่ต้องทำ <span class="muted" style="font-weight:400;font-size:11.5px;font-family:var(--mono)">(<span id="tdone">0</span>/${lab.tasks.length})</span></h4>
          <div class="bar" style="margin:8px 0 4px"><div class="bar-fill" id="tbar" style="width:0"></div></div>
          <div id="tlist"></div>
          <button class="btn sm ghost block" id="toggle-hints" style="margin-top:10px">แสดง/ซ่อนคำใบ้</button>
        </div>
        <div class="cheat" id="cheat-slot"></div>
        <div class="cheat"><h5>หมายเหตุ</h5>
          <div style="font-family:var(--sans);font-size:11.8px;line-height:1.6">
            คำสั่งที่พิมพ์ผิดจะไม่ถูกนับว่าทำแล้ว — ต้องรันสำเร็จจริงเท่านั้น</div></div>
        <div id="debrief-slot"></div>
      </div>
    </div>`;

  let showHints = false;
  function renderTasks() {
    $('#tlist').innerHTML = lab.tasks.map((tk, i) => `
      <div class="task ${done[i] ? 'done' : ''}">
        <div class="chk">${done[i] ? '✓' : ''}</div>
        <div style="flex:1"><div class="tt">${tk.t}</div>
        ${showHints && !done[i] && tk.hint ? `<div class="hint">💡 ${esc(tk.hint)}</div>` : ''}</div>
      </div>`).join('');
    const n = done.filter(Boolean).length;
    $('#tdone').textContent = n;
    $('#tbar').style.width = (n / lab.tasks.length * 100) + '%';
  }
  $('#toggle-hints').addEventListener('click', () => { showHints = !showHints; renderTasks(); });

  // ปุ่มท้าย Lab: ไป Lab ถัดไป · กลับบทเรียนที่มา · กลับหน้าหลัก
  const nav = labNav(lab, trackId);
  let finished = false;
  function showFinish() {
    if (finished) return;
    finished = true;
    $('#nav-slot').innerHTML = `<div class="card" id="lab-finish" style="margin-bottom:12px;border-color:var(--ok)">
      <h4 style="margin:0 0 4px;font-size:13px;font-family:var(--mono);color:var(--ok)">✓ ทำครบทุกข้อแล้ว</h4>
      ${nav.next ? `<div class="muted" style="font-size:11.8px;line-height:1.5;margin-bottom:10px">
        ถัดไป: ${esc(nav.next.title)}</div>`
      : `<div class="muted" style="font-size:11.8px;line-height:1.5;margin-bottom:10px">
        นี่คือ Lab สุดท้ายที่เปิดให้ทำใน${nav.group}แล้ว</div>`}
      <div class="row" style="gap:7px">
        ${nav.next ? '<button class="btn sm primary" data-nav="next">Next →</button>' : ''}
        <button class="btn sm" data-nav="back">↩ Return</button>
        <button class="btn sm ghost" data-nav="home">🏠 Home</button>
      </div>
      <div class="muted" style="font-size:11px;margin-top:8px">Return = ${esc(nav.backLabel)}</div>
    </div>`;
    const go = { next: nav.next && nav.next.href, back: backHref || nav.back, home: '#/' };
    $('#nav-slot').querySelectorAll('[data-nav]').forEach(b =>
      b.addEventListener('click', () => { location.hash = go[b.dataset.nav]; }));
  }

  const isGui = lab.device === 'windows-gui';
  const term = (isGui ? createWindowsGui : createTerminal)({
    device: lab.device, initial: lab.init || {},
    onExec: ({ state, history }) => {
      let changed = false;
      lab.tasks.forEach((tk, i) => {
        if (done[i]) return;
        let ok = false;
        try { ok = !!tk.check(state, history); } catch { ok = false; }
        if (ok) { done[i] = true; changed = true; }
      });
      if (!changed) return;
      renderTasks();
      const n = done.filter(Boolean).length;
      store.recordLab(trackId, lab.id, n, lab.tasks.length);
      refreshChrome();
      if (n === lab.tasks.length) {
        showFinish();
        if (!recorded) {
          recorded = true;
          toast('🎉 ทำสำเร็จครบทุกข้อ!', 'ok');
          if (lab.debrief) {
            $('#debrief-slot').innerHTML = `<div class="card" style="margin-top:12px">
              <h4 style="margin:0 0 8px;font-size:13px;font-family:var(--mono);color:var(--ok)">📋 DEBRIEF</h4>
              <div class="debrief">${lab.debrief}</div></div>`;
          }
        }
        $('#nav-slot').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else toast('✅ ผ่านอีกหนึ่งข้อ', 'ok');
    },
  });
  $('#cheat-slot').innerHTML = isGui
    ? `<h5>วิธีใช้หน้าจอ GUI</h5>
       <div style="font-family:var(--sans);font-size:11.8px;line-height:1.7">
         • <b>ดับเบิลคลิก</b>ไอคอนบนเดสก์ท็อปเพื่อเปิดโปรแกรม<br>
         • ลากแถบหัวหน้าต่างเพื่อย้าย · ปุ่ม – ย่อ · ✕ ปิด<br>
         • ปุ่ม <b>Start</b> มุมล่างซ้ายมีรายการโปรแกรมทั้งหมด<br>
         • มี <b>Command Prompt</b> ให้ใช้ด้วยถ้าอยากพิมพ์คำสั่ง
       </div>`
    : `<h5>คีย์ลัด</h5>
       <div>↑ / ↓ — เรียกคำสั่งเก่า</div>
       <div>Tab — เติมคำสั่งอัตโนมัติ</div>
       <div>Ctrl+L — ล้างหน้าจอ</div>
       <div>? — ดูคำสั่งที่ใช้ได้</div>`;
  $('#term-mount').appendChild(term.el);
  renderTasks();
  term.focus();
}

function vLab(trackId, labId) {
  const lab = labById(trackId, labId);
  if (!lab) return vNotFound();
  // พิมพ์ URL ตรงมาก็ข้ามด่านไม่ได้ — เงื่อนไขเดียวกับหน้า Learning Path
  if (!levelUnlocked(trackId, lab.level)) {
    toast(unlockMsg(trackId, lab.level), 'bad');
    location.hash = `#/track/${trackId}`;
    return;
  }
  const t = trackById(trackId), l = levelOf(lab.level);
  crumbs([{ t: 'หน้าหลัก', href: '#/' }, { t: t.name, href: `#/track/${trackId}` },
  { t: `L${lab.level}`, href: `#/learn/${trackId}/${lab.level}` }, { t: 'Lab' }]);

  runLabView({
    lab, trackId,
    hero: `<div class="room-hero" style="--hero:${l.color}1f">
      <div class="room-ico">🧪</div>
      <div class="room-meta">
        <div class="row" style="gap:7px">
          <span class="pill">${t.icon} ${t.name}</span>${diffPill(lab.level)}
          <span class="pill">${DEVICE_LABELS[lab.device] || lab.device}</span>
        </div>
        <h1>${lab.title}</h1><p>${lab.brief}</p>
      </div></div>`,
  });
}

// ---------------- SURVIVAL ----------------
function svCard(l) {
  const rec = store.labOf('survival', l.id);
  const sev = severityLabel[l.severity] || severityLabel.high;
  const dif = difficultyLabel[l.difficulty] || difficultyLabel.medium;
  return `<div class="sv-card" style="--sv:${sev.color}" data-go="#/survive/${l.id}">
    <div class="sv-top">
      <div class="sv-ico">${l.icon}</div>
      <div style="flex:1">
        <div class="row" style="gap:6px;margin-bottom:5px">
          <span class="diff ${dif.cls}">${dif.th}</span>
          <span class="pill" style="color:${sev.color};border-color:${sev.color}55">${sev.icon} ${sev.th}</span>
          <span class="pill">⏱ ${l.time}</span>
          <span class="pill">${DEVICE_LABELS[l.device] || l.device}</span>
        </div>
        <h3>${l.title}</h3>
      </div>
      ${rec && rec.done ? '<span class="pill ok">✓ รอด</span>' : rec && rec.best ? `<span class="pill warn">${rec.best}/${l.tasks.length}</span>` : ''}
    </div>
    <div class="sv-story">${l.story}</div>
    <div class="sv-impact">⚠️ ${l.impact}</div>
  </div>`;
}

let svFilter = { diff: 'all', device: 'all', status: 'all' };

function vSurvival() {
  crumbs([{ t: 'หน้าหลัก', href: '#/' }, { t: 'เอาชีวิตรอด' }]);
  const d = survivalDone();
  const byDiff = {};
  SURVIVAL_LABS.forEach(l => { byDiff[l.difficulty] = (byDiff[l.difficulty] || 0) + 1; });
  const devices = [...new Set(SURVIVAL_LABS.map(l => l.device))];

  view().innerHTML = `
    <div class="room-hero" style="--hero:rgba(230,57,74,.3)">
      <div class="room-ico">🔥</div>
      <div class="room-meta">
        <span class="pill acc">SURVIVAL MODE</span>
        <h1>เอาชีวิตรอด <span class="muted" style="font-size:16px;font-weight:400">${SURVIVAL_LABS.length} เหตุการณ์</span></h1>
        <p>เหตุการณ์จริงที่คุณจะเจอหน้างาน — ไม่มีคู่มือทีละขั้น มีแต่<b>อาการ ความกดดัน และเวลา</b>
           แต่ละเหตุการณ์มีสรุปบทเรียน (debrief) ให้อ่านเมื่อแก้ได้สำเร็จ</p>
      </div>
      <div class="room-side">${ring(Math.round(d / SURVIVAL_LABS.length * 100), 96, 'var(--acc)')}
        <div class="muted" style="font-size:10.5px;margin-top:6px;font-family:var(--mono)">รอดแล้ว ${d}/${SURVIVAL_LABS.length}</div></div>
    </div>

    <div class="card" style="padding:12px 14px;margin-bottom:16px">
      <div class="row" style="gap:16px;align-items:flex-start">
        <div>
          <div class="muted" style="font-size:10px;letter-spacing:1px;margin-bottom:6px;font-family:var(--mono)">ความยาก</div>
          <div class="row" id="s-diff" style="gap:6px">
            <span class="pill ${svFilter.diff === 'all' ? 'acc' : ''}" data-v="all" style="cursor:pointer">ทั้งหมด</span>
            ${Object.entries(difficultyLabel).map(([k, v]) =>
      `<span class="diff ${v.cls}" data-v="${k}" style="cursor:pointer;opacity:${svFilter.diff === 'all' || svFilter.diff === k ? 1 : .4}">${v.th} ${byDiff[k] || 0}</span>`).join('')}
          </div>
        </div>
        <div>
          <div class="muted" style="font-size:10px;letter-spacing:1px;margin-bottom:6px;font-family:var(--mono)">ระบบ</div>
          <div class="row" id="s-device" style="gap:6px">
            <span class="pill ${svFilter.device === 'all' ? 'acc' : ''}" data-v="all" style="cursor:pointer">ทั้งหมด</span>
            ${devices.map(dv => `<span class="pill ${svFilter.device === dv ? 'acc' : ''}" data-v="${dv}" style="cursor:pointer">${DEVICE_SHORT[dv] || dv}</span>`).join('')}
          </div>
        </div>
        <div>
          <div class="muted" style="font-size:10px;letter-spacing:1px;margin-bottom:6px;font-family:var(--mono)">สถานะ</div>
          <div class="row" id="s-status" style="gap:6px">
            ${[['all', 'ทั้งหมด'], ['todo', 'ยังไม่รอด'], ['done', 'รอดแล้ว']]
      .map(([v, t]) => `<span class="pill ${svFilter.status === v ? 'acc' : ''}" data-v="${v}" style="cursor:pointer">${t}</span>`).join('')}
          </div>
        </div>
      </div>
    </div>

    <div id="svgrid"></div>`;

  const order = { easy: 0, medium: 1, hard: 2, insane: 3 };
  const shown = SURVIVAL_LABS.filter(l => {
    const rec = store.labOf('survival', l.id) || {};
    if (svFilter.diff !== 'all' && l.difficulty !== svFilter.diff) return false;
    if (svFilter.device !== 'all' && l.device !== svFilter.device) return false;
    if (svFilter.status === 'done' && !rec.done) return false;
    if (svFilter.status === 'todo' && rec.done) return false;
    return true;
  }).sort((a, b) => (order[a.difficulty] ?? 9) - (order[b.difficulty] ?? 9));

  if (!shown.length) {
    $('#svgrid').innerHTML = `<div class="empty"><div class="big">🔍</div><p>ไม่มีเหตุการณ์ที่ตรงกับตัวกรอง</p></div>`;
  } else {
    const groups = {};
    shown.forEach(l => (groups[l.difficulty] ||= []).push(l));
    $('#svgrid').innerHTML = Object.entries(groups).map(([k, labs]) => {
      const v = difficultyLabel[k] || difficultyLabel.medium;
      return `<h2 class="sec">ระดับ ${v.th} <span class="muted" style="font-weight:400">(${labs.length})</span></h2>
      <div class="grid g2">${labs.map(svCard).join('')}</div>`;
    }).join('');
  }

  const wire = (sel, key) => $(sel).querySelectorAll('[data-v]').forEach(e =>
    e.addEventListener('click', () => { svFilter[key] = e.dataset.v; vSurvival(); }));
  wire('#s-diff', 'diff'); wire('#s-device', 'device'); wire('#s-status', 'status');
  view().querySelectorAll('[data-go]').forEach(c => c.addEventListener('click', () => location.hash = c.dataset.go));
}

function vSurvive(id) {
  const lab = SURVIVAL_LABS.find(l => l.id === id);
  if (!lab) return vNotFound();
  const sev = severityLabel[lab.severity] || severityLabel.high;
  const dif = difficultyLabel[lab.difficulty] || difficultyLabel.medium;
  crumbs([{ t: 'หน้าหลัก', href: '#/' }, { t: 'เอาชีวิตรอด', href: '#/survival' }, { t: lab.title }]);

  runLabView({
    lab, trackId: 'survival',
    hero: `
      <div class="alarm">
        <div class="hdr"><span class="blink">🚨</span> INCIDENT · ${sev.th} · แจ้งโดย ${esc(lab.caller)} · เป้าหมาย ${lab.time}</div>
        <div style="font-size:13.6px;line-height:1.7">${lab.story}</div>
      </div>
      <div class="room-hero" style="--hero:${sev.color}2a">
        <div class="room-ico">${lab.icon}</div>
        <div class="room-meta">
          <div class="row" style="gap:7px">
            <span class="diff ${dif.cls}">ความยาก ${dif.th}</span>
            <span class="pill" style="color:${sev.color};border-color:${sev.color}55">${sev.icon} ผลกระทบ${sev.th}</span>
            <span class="pill">${DEVICE_LABELS[lab.device] || lab.device}</span>
          </div>
          <h1>${lab.title}</h1>
          <p>⚠️ <b>ผลกระทบ:</b> ${lab.impact}</p>
        </div>
      </div>`,
  });
}

// ---------------- LABS LIST ----------------
let labFilter = { track: 'all', level: 'all', status: 'all' };
function vLabs() {
  crumbs([{ t: 'หน้าหลัก', href: '#/' }, { t: 'Lab ทั้งหมด' }]);
  const doneCount = ALL_LABS.filter(l => (store.labOf(l.track, l.id) || {}).done).length;
  const steps = ALL_LABS.reduce((a, l) => a + l.tasks.length, 0);
  const lockedCount = ALL_LABS.filter(l => !levelUnlocked(l.track, l.level)).length;

  view().innerHTML = `
    <div class="page-head">
      <h1>Lab ทั้งหมด <span class="muted" style="font-size:16px;font-weight:400">${ALL_LABS.length} ชุด · ${steps} ขั้นตอน</span></h1>
      <p>ทุก Lab ตรวจผลจากสถานะจริงของอุปกรณ์ — ทำสำเร็จแล้ว <b style="color:var(--ok)">${doneCount}</b> จาก ${ALL_LABS.length}
      ${lockedCount ? `· <span class="muted">🔒 ยังล็อกอยู่ ${lockedCount} ชุด (ผ่านแบบทดสอบระดับก่อนหน้าเพื่อปลดล็อก)</span>` : ''}</p>
    </div>
    <div class="card" style="padding:12px 14px;margin-bottom:16px">
      <div class="row" style="gap:16px;align-items:flex-start">
        ${[['หัวข้อ', 'f-track', [['all', 'ทั้งหมด'], ...TRACKS.map(t => [t.id, `${t.icon} ${t.name}`])], labFilter.track],
      ['ระดับ', 'f-level', [['all', 'ทั้งหมด'], ...LEVELS.map(l => [String(l.n), 'L' + l.n])], labFilter.level],
      ['สถานะ', 'f-status', [['all', 'ทั้งหมด'], ['todo', 'ยังไม่เสร็จ'], ['done', 'สำเร็จแล้ว']], labFilter.status]]
      .map(([lbl, fid, opts, cur]) => `<div>
        <div class="muted" style="font-size:10px;letter-spacing:1px;margin-bottom:6px;font-family:var(--mono)">${lbl}</div>
        <div class="row" id="${fid}" style="gap:6px">
          ${opts.map(([v, t]) => `<span class="pill ${cur === v ? 'acc' : ''}" data-v="${v}" style="cursor:pointer">${t}</span>`).join('')}
        </div></div>`).join('')}
      </div>
    </div>
    <div id="labgrid"></div>`;

  const shown = ALL_LABS.filter(l => {
    const rec = store.labOf(l.track, l.id) || {};
    if (labFilter.track !== 'all' && l.track !== labFilter.track) return false;
    if (labFilter.level !== 'all' && String(l.level) !== labFilter.level) return false;
    if (labFilter.status === 'done' && !rec.done) return false;
    if (labFilter.status === 'todo' && rec.done) return false;
    return true;
  });

  if (!shown.length) $('#labgrid').innerHTML = `<div class="empty"><div class="big">🔍</div><p>ไม่มี Lab ที่ตรงกับตัวกรอง</p></div>`;
  else {
    const groups = {};
    shown.forEach(l => (groups[l.track] ||= []).push(l));
    $('#labgrid').innerHTML = Object.entries(groups).map(([tid, labs]) => {
      const t = trackById(tid);
      return `<h2 class="sec">${t.icon} ${t.name} <span class="muted" style="font-weight:400">(${labs.length})</span></h2>
      <div class="grid g2">${labs.sort((a, b) => a.level - b.level).map(l => {
        const rec = store.labOf(l.track, l.id), n = rec ? (rec.best || 0) : 0;
        // ระดับที่ยังไม่ปลดล็อกก็ยังแสดงให้เห็นว่ามีอะไรรออยู่ แต่กดเข้าไม่ได้ — ตรงกับหน้า Learning Path
        const open = levelUnlocked(l.track, l.level);
        return `<div class="tk-card ${open ? '' : 'locked'}"
          ${open ? `data-go="#/lab/${l.track}/${l.id}"` : `data-lock="${l.track}:${l.level}"`}>
          <div class="row" style="justify-content:space-between;align-items:flex-start">
            <div style="flex:1">${diffPill(l.level)}<h3 style="font-size:14.5px;margin:7px 0 0">${l.title}</h3></div>
            ${!open ? '<span class="pill lock">🔒 ล็อก</span>'
        : rec && rec.done ? '<span class="pill ok">✓ สำเร็จ</span>' : n ? `<span class="pill warn">${n}/${l.tasks.length}</span>` : ''}
          </div>
          <div style="font-size:12.4px;color:var(--txt-mute);line-height:1.5">${l.brief}</div>
          <div class="row" style="font-size:11px;color:var(--txt-mute)">
            <span class="pill">${DEVICE_LABELS[l.device]}</span><span>${l.tasks.length} ขั้นตอน</span></div>
        </div>`;
      }).join('')}</div>`;
    }).join('');
  }

  const wire = (sel, key) => $(sel).querySelectorAll('[data-v]').forEach(e =>
    e.addEventListener('click', () => { labFilter[key] = e.dataset.v; vLabs(); }));
  wire('#f-track', 'track'); wire('#f-level', 'level'); wire('#f-status', 'status');
  view().querySelectorAll('[data-go]').forEach(c => c.addEventListener('click', () => location.hash = c.dataset.go));
  view().querySelectorAll('[data-lock]').forEach(c => c.addEventListener('click', () => {
    const [tid, lv] = c.dataset.lock.split(':');
    toast(`${trackById(tid).name}: ${unlockMsg(tid, lv)}`, 'bad');
  }));
}

// ---------------- TERMINAL PLAYGROUND ----------------
let pgDevice = 'cisco';
function vTerminal() {
  crumbs([{ t: 'หน้าหลัก', href: '#/' }, { t: 'Command Prompt' }]);
  view().innerHTML = `
    <div class="page-head">
      <h1>Command Prompt</h1>
      <p>ห้องฝึกอิสระ ไม่มีโจทย์กำกับ — ทุกอุปกรณ์จำลองสถานะจริง พิมพ์ <code>?</code> เพื่อดูคำสั่งที่รองรับ</p>
    </div>
    <div class="row" id="devsel" style="margin-bottom:14px">
      ${Object.keys(DEVICE_LABELS).map(d => `<button class="btn sm ${d === pgDevice ? 'primary' : ''}" data-d="${d}">${DEVICE_LABELS[d]}</button>`).join('')}
    </div>
    <div id="pg"></div>
    <div class="card" id="samples-card" style="margin-top:14px">
      <h3 style="margin:0 0 8px;font-size:13px;font-family:var(--mono)">ตัวอย่างคำสั่ง (คลิกเพื่อรัน)</h3>
      <div id="samples" class="row" style="gap:6px"></div>
    </div>`;

  $('#devsel').querySelectorAll('[data-d]').forEach(b =>
    b.addEventListener('click', () => { pgDevice = b.dataset.d; vTerminal(); }));

  // หน้าจอ GUI เป็นเดสก์ท็อปจำลอง ไม่ใช่หน้าจอพิมพ์คำสั่ง
  const isGui = pgDevice === 'windows-gui';
  const term = isGui
    ? createWindowsGui({ device: pgDevice, initial: {} })
    : createTerminal({ device: pgDevice, height: '54vh' });
  $('#pg').appendChild(term.el);
  term.focus();

  if (isGui) {
    // เดสก์ท็อปไม่มี runSilent — แทนด้วยวิธีใช้หน้าจอ
    $('#samples-card').innerHTML = `
      <h3 style="margin:0 0 8px;font-size:13px;font-family:var(--mono)">วิธีใช้หน้าจอ GUI</h3>
      <div style="font-size:12px;line-height:1.8">
        • <b>ดับเบิ้ลคลิก</b>ไอคอนบนเดสก์ท็อปเพื่อเปิดโปรแกรม<br>
        • ลากแถบหัวหน้าต่างเพื่อย้าย · ปุ่ม – ย่อ · ✕ ปิด<br>
        • ปุ่ม <b>Start</b> มุมล่างซ้ายมีรายการโปรแกรมทั้งหมด<br>
        • มี <b>Command Prompt</b> ให้ใช้ด้วยถ้าอยากพิมพ์คำสั่ง
      </div>`;
    return;
  }

  const list = term.device.completions ? term.device.completions().slice(0, 14) : [];
  $('#samples').innerHTML = list.map(c => `<span class="pill" style="cursor:pointer" data-c="${esc(c)}">${esc(c)}</span>`).join('');
  $('#samples').querySelectorAll('[data-c]').forEach(p =>
    p.addEventListener('click', () => { term.runSilent(p.dataset.c); term.focus(); }));
}

// ---------------- PROGRESS ----------------
function vProgress() {
  crumbs([{ t: 'หน้าหลัก', href: '#/' }, { t: 'ความคืบหน้า' }]);
  const tp = tierProgress(store.xp), cur = LEVELS[tp.t - 1];

  view().innerHTML = `
    <div class="page-head"><h1>ความคืบหน้าของคุณ</h1>
      <p>เก็บไว้ในเบราว์เซอร์ของคุณเอง แยกตามบัญชีผู้ใช้ ไม่ได้ส่งออกไปที่ไหน</p></div>

    <div class="card" style="display:flex;gap:22px;align-items:center;flex-wrap:wrap;margin-bottom:16px">
      <div style="font-size:42px">${cur.icon}</div>
      <div style="flex:1;min-width:220px">
        <div class="muted" style="font-size:10.5px;letter-spacing:1.5px;font-family:var(--mono)">RANK ปัจจุบัน</div>
        <div style="font-size:19px;font-weight:700">${cur.name} — ${cur.th}</div>
        <div class="muted" style="font-size:12.3px;margin-bottom:8px">${cur.desc}</div>
        <div class="bar"><div class="bar-fill" style="width:${tp.pct}%"></div></div>
        <div class="row" style="justify-content:space-between;font-family:var(--mono);font-size:10.5px;color:var(--txt-mute);margin-top:5px">
          <span>${store.xp} XP</span><span>${tp.t < 5 ? tp.hi + ' XP' : 'สูงสุดแล้ว'}</span></div>
      </div>
    </div>

    <h2 class="sec">รายหัวข้อ</h2>
    <table class="tbl">
      <tr><th>หัวข้อ</th>${widestLevels().map(l => `<th style="text-align:center">L${l.n}</th>`).join('')}<th>รวม</th><th>ใบประกาศ</th></tr>
      ${TRACKS.map(t => `<tr><td><b>${t.icon} ${t.name}</b></td>
        ${widestLevels().map(l => {
    if (!t.levels[l.n]) return '<td style="text-align:center" class="muted">—</td>';
    const s = levelStatus(t.id, l.n);
    const icon = !s.unlocked ? '🔒' : s.passed && s.labsDone === s.labsTotal ? '🟢' : s.passed ? '🟡' : s.read ? '⚪' : '·';
    return `<td style="text-align:center" title="${s.quiz ? 'ทำได้ ' + s.quiz.best + '%' : 'ยังไม่ทำ'} · lab ${s.labsDone}/${s.labsTotal}">${icon}</td>`;
  }).join('')}
        <td style="font-family:var(--mono);color:var(--acc-hi)">${trackPct(t.id)}%</td>
        <td>${trackCertified(t.id) ? '🏅' : '—'}</td></tr>`).join('')}
    </table>
    <div class="muted" style="font-size:11.5px">🟢 ผ่านครบ · 🟡 ผ่านแบบทดสอบ · ⚪ อ่านแล้ว · 🔒 ยังล็อก</div>

    <h2 class="sec">🔥 เอาชีวิตรอด</h2>
    <div class="grid g3">
      ${SURVIVAL_LABS.map(l => {
    const rec = store.labOf('survival', l.id);
    return `<div class="card" style="padding:11px 13px;cursor:pointer" data-go="#/survive/${l.id}">
      <div class="row" style="gap:8px"><div style="font-size:19px">${l.icon}</div>
      <div style="flex:1;font-size:12.8px">${l.title}</div>
      ${rec && rec.done ? '<span class="pill ok">✓</span>' : `<span class="pill">${rec ? rec.best : 0}/${l.tasks.length}</span>`}</div></div>`;
  }).join('')}
    </div>

    <h2 class="sec">ตั้งค่า</h2>
    <div class="card">
      <label class="row" style="cursor:pointer;margin-bottom:14px">
        <input type="checkbox" id="unlock" ${store.all.unlockAll ? 'checked' : ''} style="width:17px;height:17px">
        <div><b>ปลดล็อกทุกระดับ</b>
          <div class="muted" style="font-size:12.3px">ข้ามเงื่อนไขการทำแบบทดสอบให้ผ่านก่อน — เหมาะกับคนที่มีพื้นฐานแล้ว
          (หมายเหตุ: ใบประกาศยังต้องผ่านแบบทดสอบและ lab จริงเท่านั้น)</div>
          ${auth.isAdmin ? '<div class="muted" style="font-size:12.3px;color:var(--ok)">บัญชีผู้ดูแลระบบเข้าได้ทุกระดับอยู่แล้ว ไม่ต้องติ๊กช่องนี้</div>' : ''}</div>
      </label>
      <div class="row">
        <button class="btn sm" id="exp">ดาวน์โหลดความคืบหน้า (.json)</button>
        <button class="btn sm" id="imp">นำเข้าไฟล์</button>
        <button class="btn sm danger" id="rst">ล้างความคืบหน้าของฉัน</button>
        <input type="file" id="impf" accept="application/json" hidden>
      </div>
    </div>`;

  view().querySelectorAll('[data-go]').forEach(c => c.addEventListener('click', () => location.hash = c.dataset.go));
  $('#unlock').addEventListener('change', e => { store.setUnlockAll(e.target.checked); refreshChrome(); vProgress(); });
  $('#exp').addEventListener('click', () => {
    const blob = new Blob([store.export()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `learning-center-${auth.username}.json`;
    a.click(); URL.revokeObjectURL(a.href);
  });
  $('#imp').addEventListener('click', () => $('#impf').click());
  $('#impf').addEventListener('change', e => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      if (store.import(r.result)) { toast('นำเข้าเรียบร้อย', 'ok'); refreshChrome(); vProgress(); }
      else toast('ไฟล์ไม่ถูกต้อง', 'bad');
    };
    r.readAsText(f);
  });
  $('#rst').addEventListener('click', () => {
    if (confirm('ล้างความคืบหน้าทั้งหมดของบัญชีนี้ใช่หรือไม่?')) {
      store.reset(); refreshChrome(); vProgress(); toast('ล้างแล้ว');
    }
  });
}

// ---------------- CERTIFICATE ----------------
function certCard(t) {
  const ok = trackCertified(t.id);
  const u = auth.current;
  const lv = levelsOf(t.id);
  const rec = store.quizOf(t.id, maxLevel(t.id));
  const avg = Math.round(lv.reduce((a, l) => a + ((store.quizOf(t.id, l) || {}).best || 0), 0) / (lv.length || 1));
  const labs = ALL_LABS.filter(l => l.track === t.id).length;
  const date = ok && rec ? new Date(rec.at).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';
  return `<div class="cert ${ok ? '' : 'locked'}" style="margin-bottom:18px">
    <div class="cert-seal">${ok ? '🏅' : '🔒'}</div>
    <h2>Certificate of Completion</h2>
    <div class="what">ขอมอบใบประกาศนียบัตรฉบับนี้ให้แก่</div>
    <div class="who">${esc(u.display || u.username)}</div>
    <div class="what">ผู้สำเร็จหลักสูตร <span class="track-name">${t.icon} ${t.name}</span><br>
      ครบทั้ง ${lv.length} ระดับ ของหัวข้อนี้</div>
    <div class="cert-stats">
      <div><b>${avg}%</b><span>คะแนนเฉลี่ย</span></div>
      <div><b>${lv.length}/${lv.length}</b><span>ระดับ</span></div>
      <div><b>${labs}</b><span>Lab</span></div>
    </div>
    <div class="cert-foot">
      <span>ออกให้เมื่อ ${date}</span>
      <span>รหัสอ้างอิง ${ok ? certCode(t.id) : '––––––––'}</span>
    </div>
    ${ok ? `<div class="no-print" style="margin-top:16px"><button class="btn primary" data-print="1">🖨️ พิมพ์ / บันทึกเป็น PDF</button></div>`
      : `<div class="no-print muted" style="margin-top:14px;font-size:12.5px">
         ต้องผ่านแบบทดสอบทั้ง ${lv.length} ระดับ และทำ Lab ครบทุกชุดของหัวข้อนี้ก่อน</div>`}
  </div>`;
}

function vCertificate() {
  crumbs([{ t: 'หน้าหลัก', href: '#/' }, { t: 'ใบประกาศนียบัตร' }]);
  const u = auth.current;
  const gotAll = allCertified();
  const totalLabs = ALL_LABS.length + SURVIVAL_LABS.length;
  const doneLabs = ALL_LABS.filter(l => (store.labOf(l.track, l.id) || {}).done).length + survivalDone();

  view().innerHTML = `
    <div class="page-head no-print">
      <h1>ใบประกาศนียบัตร</h1>
      <p>ได้รับเมื่อ<b>ผ่านแบบทดสอบครบทุกระดับ</b> และ<b>ทำ Lab ครบทุกชุด</b>ของหัวข้อนั้น
         — ใบ Master จะได้เมื่อจบครบทุกหัวข้อ</p>
    </div>

    ${gotAll ? `<div class="cert master" style="margin-bottom:22px">
      <div class="cert-seal">👑</div>
      <h2>Master Certificate</h2>
      <div class="what">ขอมอบใบประกาศนียบัตรสูงสุดให้แก่</div>
      <div class="who">${esc(u.display || u.username)}</div>
      <div class="what">ผู้สำเร็จหลักสูตร <span class="track-name">ครบทั้ง ${TRACKS.length} หัวข้อ</span><br>
        Cisco Switch · MikroTik Router · MikroTik Switch · Windows Server · Linux · Cyber Security</div>
      <div class="cert-stats">
        <div><b>${quizTotal()}</b><span>ระดับที่ผ่าน</span></div>
        <div><b>${doneLabs}/${totalLabs}</b><span>Lab</span></div>
        <div><b>${store.xp}</b><span>XP</span></div>
      </div>
      <div class="cert-foot">
        <span>ออกให้เมื่อ ${new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        <span>รหัสอ้างอิง ${certCode('master')}</span>
      </div>
      <div class="no-print" style="margin-top:16px"><button class="btn primary" data-print="1">🖨️ พิมพ์ / บันทึกเป็น PDF</button></div>
    </div>` : `<div class="card no-print" style="margin-bottom:20px;text-align:center">
      <div style="font-size:34px">👑</div>
      <h3 style="margin:6px 0 4px">Master Certificate</h3>
      <p class="muted" style="font-size:13px;margin:0">
        จบครบ ${TRACKS.filter(t => trackCertified(t.id)).length} จาก ${TRACKS.length} หัวข้อ —
        เหลืออีก ${TRACKS.length - TRACKS.filter(t => trackCertified(t.id)).length} หัวข้อจึงจะได้รับใบนี้</p>
    </div>`}

    <h2 class="sec no-print">ใบประกาศรายหัวข้อ</h2>
    ${TRACKS.map(certCard).join('')}`;

  view().querySelectorAll('[data-print]').forEach(b => b.addEventListener('click', () => window.print()));
}

// ---------------- ACCOUNT ----------------
function vAccount() {
  crumbs([{ t: 'หน้าหลัก', href: '#/' }, { t: 'บัญชีของฉัน' }]);
  const u = auth.current;
  view().innerHTML = `
    <div class="page-head"><h1>บัญชีของฉัน</h1>
      <p>แก้ชื่อที่แสดง (ใช้พิมพ์บนใบประกาศ) และเปลี่ยนรหัสผ่าน</p></div>

    <div class="grid g2">
      <div class="card">
        <h3 style="margin:0 0 12px;font-size:15px">ข้อมูลบัญชี</h3>
        <table class="tbl"><tr><th>ชื่อผู้ใช้</th><td><code>${esc(u.username)}</code></td></tr>
        <tr><th>บทบาท</th><td>${u.role === 'admin' ? '⚡ ผู้ดูแลระบบ (admin)' : 'ผู้เรียน (user)'}</td></tr>
        <tr><th>สร้างเมื่อ</th><td>${new Date(u.createdAt).toLocaleString('th-TH')}</td></tr>
        <tr><th>เข้าล่าสุด</th><td>${u.lastLogin ? new Date(u.lastLogin).toLocaleString('th-TH') : '—'}</td></tr></table>
        <div class="fld" style="margin-top:12px"><label>ชื่อที่แสดง / ชื่อบนใบประกาศ</label>
          <input id="a-display" value="${esc(u.display || '')}"></div>
        <button class="btn primary sm" id="a-save">บันทึกชื่อ</button>
      </div>

      <div class="card">
        <h3 style="margin:0 0 12px;font-size:15px">เปลี่ยนรหัสผ่าน</h3>
        ${u.mustChange ? `<div class="login-err">คุณยังใช้รหัสผ่านเริ่มต้นอยู่ — แนะนำให้เปลี่ยนทันที</div>` : ''}
        <div class="fld"><label>รหัสผ่านเดิม</label><input id="p-old" type="password"></div>
        <div class="fld"><label>รหัสผ่านใหม่ (อย่างน้อย 6 ตัว)</label><input id="p-new" type="password"></div>
        <div class="fld"><label>ยืนยันรหัสผ่านใหม่</label><input id="p-new2" type="password"></div>
        <button class="btn primary sm" id="p-save">เปลี่ยนรหัสผ่าน</button>
      </div>
    </div>`;

  $('#a-save').addEventListener('click', async () => {
    await auth.setDisplay(u.username, $('#a-display').value.trim());
    refreshChrome(); toast('บันทึกชื่อแล้ว', 'ok');
  });
  $('#p-save').addEventListener('click', async () => {
    if ($('#p-new').value !== $('#p-new2').value) return toast('รหัสผ่านใหม่ไม่ตรงกัน', 'bad');
    const r = await auth.changePassword(u.username, $('#p-new').value, $('#p-old').value);
    if (!r.ok) return toast(r.msg, 'bad');
    toast('เปลี่ยนรหัสผ่านเรียบร้อย', 'ok');
    vAccount();
  });
}

// ---------------- ADMIN ----------------
function vAdmin() {
  if (!auth.isAdmin) { location.hash = '#/'; return; }
  crumbs([{ t: 'หน้าหลัก', href: '#/' }, { t: 'จัดการผู้ใช้' }]);
  const users = Object.values(auth.users);

  const summary = un => {
    const p = (auth.users[un] || {}).progress;
    if (!p) return { xp: 0, quiz: 0, labs: 0, certs: 0 };
    const quiz = Object.values(p.quiz || {}).filter(q => q.passed).length;
    const labs = Object.values(p.labs || {}).filter(l => l.done).length;
    const certs = TRACKS.filter(t => Object.keys(t.levels).map(Number).every(l => {
      const q = (p.quiz || {})[`${t.id}:${l}`];
      const tl = (t.levels[l].labs || []);
      return q && q.passed && tl.every(lb => ((p.labs || {})[`${t.id}:${lb.id}`] || {}).done);
    })).length;
    return { xp: p.xp || 0, quiz, labs, certs };
  };

  view().innerHTML = `
    <div class="page-head"><h1>จัดการผู้ใช้</h1>
      <p>เพิ่ม/ลบผู้ใช้ กำหนดบทบาท และดูความคืบหน้าของทุกคน — เห็นเฉพาะบัญชี admin</p></div>

    <div class="card" style="margin-bottom:16px">
      <h3 style="margin:0 0 12px;font-size:15px">เพิ่มผู้ใช้ใหม่</h3>
      <div class="row" style="align-items:flex-end;gap:12px">
        <div class="fld" style="margin:0;flex:1;min-width:140px"><label>ชื่อผู้ใช้</label><input id="n-user" placeholder="a-z 0-9"></div>
        <div class="fld" style="margin:0;flex:1;min-width:140px"><label>ชื่อที่แสดง</label><input id="n-display" placeholder="ชื่อ-นามสกุล"></div>
        <div class="fld" style="margin:0;flex:1;min-width:130px"><label>รหัสผ่าน</label><input id="n-pass" type="text" placeholder="อย่างน้อย 6 ตัว"></div>
        <div class="fld" style="margin:0;min-width:110px"><label>บทบาท</label>
          <select id="n-role"><option value="user">user</option><option value="admin">admin</option></select></div>
        <button class="btn primary" id="n-add">เพิ่ม</button>
      </div>
    </div>

    <h2 class="sec">ผู้ใช้ทั้งหมด (${users.length})</h2>
    <div class="card" style="padding:0;overflow:hidden">
      <table class="adm">
        <tr><th>ผู้ใช้</th><th>บทบาท</th><th>XP</th><th>แบบทดสอบ</th><th>Lab</th><th>ใบประกาศ</th><th>เข้าล่าสุด</th><th>จัดการ</th></tr>
        ${users.map(u => {
    const s = summary(u.username);
    return `<tr>
      <td><div class="row" style="gap:9px;flex-wrap:nowrap">
        <div class="avatar ${u.role === 'admin' ? 'adm' : ''}" style="width:28px;height:28px;flex:0 0 28px;font-size:12px">${esc((u.display || u.username)[0].toUpperCase())}</div>
        <div><div style="font-size:13px;font-weight:600">${esc(u.display || u.username)}</div>
        <div class="muted" style="font-size:10.5px;font-family:var(--mono)">${esc(u.username)}${u.disabled ? ' · ระงับ' : ''}</div></div></div></td>
      <td><span class="pill ${u.role === 'admin' ? 'acc' : ''}">${u.role}</span></td>
      <td style="font-family:var(--mono)">${s.xp}</td>
      <td style="font-family:var(--mono)">${s.quiz}/${quizTotal()}</td>
      <td style="font-family:var(--mono)">${s.labs}</td>
      <td style="font-family:var(--mono)">${s.certs ? '🏅 ' + s.certs : '—'}</td>
      <td class="muted" style="font-size:11.5px">${u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('th-TH') : '—'}</td>
      <td><div class="row" style="gap:5px;flex-wrap:nowrap">
        <button class="btn sm ghost" data-act="role" data-u="${u.username}">สลับบทบาท</button>
        <button class="btn sm ghost" data-act="pass" data-u="${u.username}">รีเซ็ตรหัส</button>
        <button class="btn sm ghost" data-act="prog" data-u="${u.username}">ล้างคืบหน้า</button>
        <button class="btn sm danger" data-act="del" data-u="${u.username}">ลบ</button>
      </div></td></tr>`;
  }).join('')}
      </table>
    </div>

    <div class="note warn" style="margin-top:16px">
      <b>ข้อจำกัดที่ต้องรู้:</b> ระบบผู้ใช้นี้ทำงานในเบราว์เซอร์ (localStorage) ของเครื่องนี้เท่านั้น
      ไม่มีเซิร์ฟเวอร์ ไม่ได้เข้ารหัสระดับใช้งานจริง และไม่ sync ข้ามเครื่อง
      — เหมาะกับการแยกความคืบหน้าของผู้เรียนหลายคนบนเครื่องเดียวกัน ไม่ใช่ระบบยืนยันตัวตนจริง
    </div>`;

  $('#n-add').addEventListener('click', async () => {
    const r = await auth.register($('#n-user').value, $('#n-pass').value, $('#n-display').value.trim(), $('#n-role').value);
    if (!r.ok) return toast(r.msg, 'bad');
    toast('เพิ่มผู้ใช้แล้ว', 'ok'); vAdmin();
  });

  view().querySelectorAll('[data-act]').forEach(b => b.addEventListener('click', async () => {
    const un = b.dataset.u, act = b.dataset.act;
    if (act === 'role') {
      const cur = auth.users[un].role;
      const r = await auth.setRole(un, cur === 'admin' ? 'user' : 'admin');
      if (!r.ok) return toast(r.msg, 'bad');
      toast(`เปลี่ยนบทบาทของ ${un} แล้ว`, 'ok');
    }
    if (act === 'pass') {
      const np = prompt(`ตั้งรหัสผ่านใหม่ให้ ${un} (อย่างน้อย 6 ตัว)`);
      if (!np) return;
      const r = await auth.changePassword(un, np);
      if (!r.ok) return toast(r.msg, 'bad');
      toast('รีเซ็ตรหัสผ่านแล้ว', 'ok');
    }
    if (act === 'prog') {
      if (!confirm(`ล้างความคืบหน้าทั้งหมดของ ${un} ใช่หรือไม่?`)) return;
      await clearProgressOf(un);
      if (un === auth.username) await setStoreUser(un);
      await auth.loadUsers();   // ตัวเลขในตารางต้องอัปเดตตามด้วย
      toast('ล้างความคืบหน้าแล้ว', 'ok');
    }
    if (act === 'del') {
      if (!confirm(`ลบผู้ใช้ ${un} และความคืบหน้าทั้งหมดใช่หรือไม่?`)) return;
      const r = await auth.remove(un);
      if (!r.ok) return toast(r.msg, 'bad');
      toast('ลบผู้ใช้แล้ว', 'ok');
    }
    refreshChrome(); vAdmin();
  }));
}

function vNotFound() {
  crumbs([{ t: 'ไม่พบหน้า' }]);
  view().innerHTML = `<div class="empty"><div class="big">🧭</div>
    <h2>ไม่พบหน้าที่ต้องการ</h2><p>ลิงก์อาจไม่ถูกต้อง</p>
    <button class="btn primary" id="gohome">กลับหน้าหลัก</button></div>`;
  $('#gohome').addEventListener('click', () => location.hash = '#/');
}

// ---------------- ROUTER ----------------
function route() {
  if (!auth.current) return renderLogin();
  const parts = (location.hash.replace(/^#\/?/, '') || '').split('/').filter(Boolean);
  window.scrollTo(0, 0);
  refreshChrome();
  switch (parts[0]) {
    case undefined: return vDashboard();
    case 'levels': return vLevels();
    case 'track': return vTrack(parts[1]);
    case 'learn': return vLearn(parts[1], +parts[2]);
    case 'quiz': return vQuiz(parts[1], +parts[2]);
    case 'lab': return vLab(parts[1], parts[2]);
    case 'labs': return vLabs();
    case 'survival': return vSurvival();
    case 'survive': return vSurvive(parts[1]);
    case 'terminal': return vTerminal();
    case 'progress': return vProgress();
    case 'certificate': return vCertificate();
    case 'account': return vAccount();
    case 'admin': return vAdmin();
    default: return vNotFound();
  }
}

window.addEventListener('hashchange', route);
window.addEventListener('progress-changed', () => { if (auth.current) { renderSide(); topStats(); } });
$('#menu-toggle').addEventListener('click', () => $('#sidebar').classList.toggle('open'));
$('#rank-badge').addEventListener('click', () => { location.hash = '#/progress'; });
$('#btn-logout').addEventListener('click', async () => {
  await auth.logout(); await setStoreUser(null); loginMode = 'login'; renderLogin();
});

// ---------------- BOOT ----------------
// อ่านเซสชันจากเซิร์ฟเวอร์ก่อน แล้วค่อยตัดสินว่าจะเข้าหน้าเรียนหรือหน้าล็อกอิน
(async () => {
  await auth.bootstrap();               // ตัดสินเองว่าเป็นโหมดเซิร์ฟเวอร์หรือออฟไลน์
  serverUp = !auth.isLocal;
  serverUsers = await auth.accountCount();
  if (auth.current) await startSession();
  else renderLogin();
})();
