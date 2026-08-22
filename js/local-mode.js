// ============================================================
//  โหมดออฟไลน์ — ใช้เมื่อไม่มีเซิร์ฟเวอร์ตอบ (เช่น เปิดจาก static hosting)
//
//  เก็บบัญชีและความคืบหน้าไว้ใน localStorage ของเบราว์เซอร์เครื่องนั้น
//  เหมาะกับการลองใช้หรือเรียนคนเดียว — ถ้าต้องการให้ความคืบหน้าตามตัวข้ามเครื่อง
//  และให้ผู้ดูแลเห็นของทุกคน ต้องรันเซิร์ฟเวอร์ (npm start) แล้วเปิดผ่านเซิร์ฟเวอร์นั้น
//
//  ย้ำ: โหมดนี้ไม่ใช่ระบบยืนยันตัวตนจริง — ใครเปิด devtools ก็แก้ข้อมูลได้
//  ห้ามใช้รหัสผ่านเดียวกับระบบงานจริง
// ============================================================
const AUTH_KEY = 'sysengLC.auth.v2';

const load = (key, fallback) => {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
  catch { return fallback; }
};
const save = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* โควตาเต็ม */ }
};

/** แฮชด้วย SHA-256 ของเบราว์เซอร์ ถ้าไม่มี (บริบทไม่ปลอดภัย) ค่อยถอยไปใช้ตัวเบา */
async function hash(password, salt) {
  const text = `${salt}|${password}`;
  if (globalThis.crypto?.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h * 33) ^ text.charCodeAt(i)) >>> 0;
  return h.toString(36);
}
const newSalt = () => Math.random().toString(36).slice(2, 12);

function db() {
  const d = load(AUTH_KEY, null);
  return d && d.users ? d : { version: 2, users: {}, session: null };
}

export const MIN_PASSWORD = 8;
const USERNAME_RE = /^[a-z0-9._-]{3,20}$/;

export const localAuth = {
  /** จำนวนบัญชีในเครื่องนี้ — ใช้ตัดสินว่าจะโชว์คำแนะนำครั้งแรกไหม */
  count() { return Object.keys(db().users).length; },

  current() {
    const d = db();
    const u = d.session ? d.users[d.session] : null;
    return u ? publicUser(u) : null;
  },

  async login(username, password) {
    const d = db();
    const uname = String(username || '').trim().toLowerCase();
    const u = d.users[uname];
    if (!u || (await hash(password, u.salt)) !== u.pass) {
      return { ok: false, msg: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' };
    }
    if (u.disabled) return { ok: false, msg: 'บัญชีนี้ถูกระงับการใช้งาน' };
    u.lastLogin = Date.now();
    d.session = uname;
    save(AUTH_KEY, d);
    return { ok: true, user: publicUser(u) };
  },

  async register(username, password, display, role = 'user') {
    const d = db();
    const uname = String(username || '').trim().toLowerCase();
    if (!USERNAME_RE.test(uname)) return { ok: false, msg: 'ชื่อผู้ใช้ต้องเป็น a-z 0-9 . _ - ยาว 3–20 ตัว' };
    if (d.users[uname]) return { ok: false, msg: 'มีชื่อผู้ใช้นี้อยู่แล้ว' };
    if (String(password || '').length < MIN_PASSWORD) {
      return { ok: false, msg: `รหัสผ่านต้องยาวอย่างน้อย ${MIN_PASSWORD} ตัวอักษร` };
    }
    const salt = newSalt();
    // คนแรกของเครื่องนี้ได้เป็นผู้ดูแลระบบเสมอ ไม่งั้นจะไม่มีใครเข้าหน้าจัดการได้เลย
    const isFirst = Object.keys(d.users).length === 0;
    d.users[uname] = {
      username: uname, display: display || uname, role: isFirst ? 'admin' : role,
      salt, pass: await hash(password, salt), disabled: false,
      createdAt: Date.now(), lastLogin: null,
    };
    // ผู้ดูแลสร้างบัญชีให้คนอื่นต้องไม่เด้งเซสชันตัวเอง
    const actor = d.session ? d.users[d.session] : null;
    if (!actor || actor.role !== 'admin') d.session = uname;
    save(AUTH_KEY, d);
    return { ok: true, user: publicUser(d.users[uname]) };
  },

  logout() { const d = db(); d.session = null; save(AUTH_KEY, d); },

  async changePassword(username, newPass, oldPass = null) {
    const d = db();
    const u = d.users[username];
    if (!u) return { ok: false, msg: 'ไม่พบผู้ใช้' };
    if (oldPass !== null && (await hash(oldPass, u.salt)) !== u.pass) {
      return { ok: false, msg: 'รหัสผ่านเดิมไม่ถูกต้อง' };
    }
    if (String(newPass || '').length < MIN_PASSWORD) {
      return { ok: false, msg: `รหัสผ่านใหม่ต้องยาวอย่างน้อย ${MIN_PASSWORD} ตัวอักษร` };
    }
    u.salt = newSalt();
    u.pass = await hash(newPass, u.salt);
    save(AUTH_KEY, d);
    return { ok: true };
  },

  setDisplay(username, display) {
    const d = db();
    if (!d.users[username]) return { ok: false, msg: 'ไม่พบผู้ใช้' };
    d.users[username].display = String(display || '').trim().slice(0, 40) || username;
    save(AUTH_KEY, d);
    return { ok: true };
  },

  setRole(username, role) {
    const d = db();
    if (!d.users[username]) return { ok: false, msg: 'ไม่พบผู้ใช้' };
    const admins = Object.values(d.users).filter((u) => u.role === 'admin');
    if (role !== 'admin' && admins.length === 1 && admins[0].username === username) {
      return { ok: false, msg: 'ต้องเหลือผู้ดูแลระบบอย่างน้อยหนึ่งคน' };
    }
    d.users[username].role = role === 'admin' ? 'admin' : 'user';
    save(AUTH_KEY, d);
    return { ok: true };
  },

  setDisabled(username, v) {
    const d = db();
    if (!d.users[username]) return { ok: false, msg: 'ไม่พบผู้ใช้' };
    d.users[username].disabled = !!v;
    save(AUTH_KEY, d);
    return { ok: true };
  },

  remove(username) {
    const d = db();
    if (!d.users[username]) return { ok: false, msg: 'ไม่พบผู้ใช้' };
    const admins = Object.values(d.users).filter((u) => u.role === 'admin');
    if (admins.length === 1 && admins[0].username === username) {
      return { ok: false, msg: 'ต้องเหลือผู้ดูแลระบบอย่างน้อยหนึ่งคน' };
    }
    delete d.users[username];
    if (d.session === username) d.session = null;
    save(AUTH_KEY, d);
    try { localStorage.removeItem(`sysengLC.v1:${username}`); } catch { /* ไม่มีก็ข้าม */ }
    return { ok: true };
  },

  /** รายชื่อผู้ใช้ทั้งหมดพร้อมความคืบหน้า — โครงเดียวกับที่ API ของเซิร์ฟเวอร์ส่งมา */
  listUsers() {
    const d = db();
    return Object.fromEntries(Object.values(d.users).map((u) => {
      const p = load(`sysengLC.v1:${u.username}`, null) || {};
      return [u.username, {
        ...publicUser(u),
        xp: p.xp || 0,
        labsDone: Object.values(p.labs || {}).filter((l) => l.done).length,
        quizPassed: Object.values(p.quiz || {}).filter((q) => q.passed).length,
        progress: Object.keys(p).length ? p : null,
      }];
    }));
  },

  progressOf(username) { return load(`sysengLC.v1:${username}`, null); },
  clearProgressOf(username) {
    try { localStorage.removeItem(`sysengLC.v1:${username}`); } catch { /* ไม่มีก็ข้าม */ }
    return true;
  },
};

const publicUser = (u) => ({
  username: u.username,
  display: u.display,
  role: u.role,
  disabled: !!u.disabled,
  mustChange: false,
  createdAt: u.createdAt,
  lastLogin: u.lastLogin,
});
