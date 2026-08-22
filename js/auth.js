// ============================================================
//  ระบบผู้ใช้และสิทธิ์ (admin / user)
//  หมายเหตุสำคัญ: ทำงานฝั่งเบราว์เซอร์ล้วน ใช้สำหรับ "แยกความคืบหน้ารายคน
//  และแยกเมนูตามบทบาท" เท่านั้น ไม่ใช่ระบบความปลอดภัยจริง
//  ห้ามใช้รหัสผ่านเดียวกับระบบงานจริง
// ============================================================
const KEY = 'sysengLC.auth.v1';

// hash แบบเบา (djb2 + salt) — กันการเห็นรหัสตรง ๆ ใน localStorage เท่านั้น
function hash(pw, salt) {
  let h = 5381;
  const s = salt + '|' + pw;
  for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
  let h2 = 52711;
  for (let i = s.length - 1; i >= 0; i--) h2 = ((h2 * 31) ^ s.charCodeAt(i)) >>> 0;
  return (h.toString(36) + h2.toString(36)).padStart(14, '0');
}
const newSalt = () => Math.random().toString(36).slice(2, 10);

function blank() {
  const salt = newSalt();
  return {
    version: 1,
    users: {
      admin: {
        username: 'admin', display: 'ผู้ดูแลระบบ', role: 'admin',
        salt, pass: hash('admin123', salt),
        mustChange: true, createdAt: Date.now(), lastLogin: null,
      },
    },
    session: null,
  };
}

let data = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return blank();
    const d = JSON.parse(raw);
    if (!d.users || !d.users.admin) return blank();
    return d;
  } catch { return blank(); }
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { }
}

export const auth = {
  get users() { return data.users; },
  get current() { return data.session ? data.users[data.session] : null; },
  get isAdmin() { const u = this.current; return !!u && u.role === 'admin'; },
  get username() { return data.session; },

  login(username, password) {
    const u = data.users[String(username || '').trim().toLowerCase()];
    if (!u) return { ok: false, msg: 'ไม่พบผู้ใช้นี้' };
    if (u.disabled) return { ok: false, msg: 'บัญชีนี้ถูกระงับการใช้งาน' };
    if (hash(password, u.salt) !== u.pass) return { ok: false, msg: 'รหัสผ่านไม่ถูกต้อง' };
    u.lastLogin = Date.now();
    data.session = u.username;
    save();
    return { ok: true, user: u };
  },

  logout() { data.session = null; save(); },

  register(username, password, display, role = 'user') {
    const uname = String(username || '').trim().toLowerCase();
    if (!/^[a-z0-9._-]{3,20}$/.test(uname)) return { ok: false, msg: 'ชื่อผู้ใช้ต้องเป็น a-z 0-9 . _ - ยาว 3–20 ตัว' };
    if (data.users[uname]) return { ok: false, msg: 'มีชื่อผู้ใช้นี้อยู่แล้ว' };
    if (String(password || '').length < 6) return { ok: false, msg: 'รหัสผ่านต้องยาวอย่างน้อย 6 ตัวอักษร' };
    const salt = newSalt();
    data.users[uname] = {
      username: uname, display: display || uname, role,
      salt, pass: hash(password, salt),
      mustChange: false, createdAt: Date.now(), lastLogin: null,
    };
    save();
    return { ok: true };
  },

  changePassword(username, newPass, oldPass = null) {
    const u = data.users[username];
    if (!u) return { ok: false, msg: 'ไม่พบผู้ใช้' };
    if (oldPass !== null && hash(oldPass, u.salt) !== u.pass) return { ok: false, msg: 'รหัสผ่านเดิมไม่ถูกต้อง' };
    if (String(newPass || '').length < 6) return { ok: false, msg: 'รหัสผ่านใหม่ต้องยาวอย่างน้อย 6 ตัวอักษร' };
    u.salt = newSalt();
    u.pass = hash(newPass, u.salt);
    u.mustChange = false;
    save();
    return { ok: true };
  },

  setRole(username, role) {
    const u = data.users[username];
    if (!u) return { ok: false, msg: 'ไม่พบผู้ใช้' };
    if (username === 'admin' && role !== 'admin') return { ok: false, msg: 'ห้ามลดสิทธิ์บัญชี admin หลัก' };
    u.role = role; save();
    return { ok: true };
  },

  setDisabled(username, v) {
    const u = data.users[username];
    if (!u) return { ok: false, msg: 'ไม่พบผู้ใช้' };
    if (username === 'admin') return { ok: false, msg: 'ห้ามระงับบัญชี admin หลัก' };
    u.disabled = !!v; save();
    return { ok: true };
  },

  remove(username) {
    if (username === 'admin') return { ok: false, msg: 'ห้ามลบบัญชี admin หลัก' };
    if (!data.users[username]) return { ok: false, msg: 'ไม่พบผู้ใช้' };
    delete data.users[username];
    try { localStorage.removeItem(`sysengLC.v1:${username}`); } catch { }
    if (data.session === username) data.session = null;
    save();
    return { ok: true };
  },

  setDisplay(username, display) {
    const u = data.users[username];
    if (!u) return { ok: false, msg: 'ไม่พบผู้ใช้' };
    u.display = display || username; save();
    return { ok: true };
  },
};
