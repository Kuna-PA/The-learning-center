// ============================================================
//  การยืนยันตัวตนฝั่งเซิร์ฟเวอร์
//  - รหัสผ่านเก็บเป็น scrypt hash พร้อม salt รายคน (ไม่เคยเก็บรหัสจริง)
//  - เซสชันเป็น token สุ่มใน cookie แบบ httpOnly — สคริปต์ในหน้าเว็บอ่านไม่ได้
// ============================================================
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { users, sessions, progress } from './db.js';

const SESSION_TTL = 30 * 24 * 3600 * 1000;   // 30 วัน
const COOKIE = 'lc_session';
const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 };

const hashPassword = (password, salt) =>
  scryptSync(String(password), salt, SCRYPT.keylen, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p }).toString('hex');

/** เทียบแบบ constant-time เพื่อไม่ให้เดารหัสจากเวลาที่ใช้ตอบ */
function samePassword(password, row) {
  const got = Buffer.from(hashPassword(password, row.salt), 'hex');
  const want = Buffer.from(row.hash, 'hex');
  return got.length === want.length && timingSafeEqual(got, want);
}

const newSalt = () => randomBytes(16).toString('hex');
const newToken = () => randomBytes(32).toString('hex');

export const USERNAME_RE = /^[a-z0-9._-]{3,20}$/;
export const MIN_PASSWORD = 8;

/** ครั้งแรกที่ยังไม่มีใครในระบบ สร้าง admin ให้ พร้อมบังคับเปลี่ยนรหัส */
export function ensureFirstAdmin() {
  if (users.count() > 0) return null;
  // ไม่ตั้งรหัสตายตัวไว้ในโค้ด — ถ้าไม่ได้กำหนดมาเองจะสุ่มให้ แล้วพิมพ์ออก console ครั้งเดียว
  const fromEnv = String(process.env.LC_ADMIN_PASSWORD || '');
  const usable = fromEnv.length >= MIN_PASSWORD;
  const password = usable ? fromEnv : randomBytes(9).toString('base64url');
  const salt = newSalt();
  users.create({
    username: 'admin', display: 'ผู้ดูแลระบบ', role: 'admin',
    salt, hash: hashPassword(password, salt), mustChange: 1,
  });
  return { username: 'admin', password, generated: !usable, envTooShort: !!fromEnv && !usable };
}

export function register({ username, password, display, role = 'user', mustChange = 0 }) {
  const uname = String(username || '').trim().toLowerCase();
  if (!USERNAME_RE.test(uname)) return { ok: false, msg: 'ชื่อผู้ใช้ต้องเป็น a-z 0-9 . _ - ยาว 3–20 ตัว' };
  if (users.get(uname)) return { ok: false, msg: 'มีชื่อผู้ใช้นี้อยู่แล้ว' };
  if (String(password || '').length < MIN_PASSWORD) return { ok: false, msg: `รหัสผ่านต้องยาวอย่างน้อย ${MIN_PASSWORD} ตัวอักษร` };
  const salt = newSalt();
  users.create({ username: uname, display: display || uname, role, salt, hash: hashPassword(password, salt), mustChange });
  return { ok: true, user: publicUser(users.get(uname)) };
}

/**
 * จำกัดการเดารหัส 2 ชั้น
 *  - รายชื่อผู้ใช้ : กันเดารหัสของคนใดคนหนึ่ง (ล็อกเร็ว)
 *  - ราย IP       : กันยิงหว่านสลับชื่อไปเรื่อย ๆ ซึ่งชั้นแรกจับไม่ได้เลย
 *                   เพดาน IP ตั้งสูงกว่ามาก เพื่อไม่ให้ NAT ทั้งออฟฟิศโดนล็อกเพราะคนเดียวพิมพ์ผิด
 */
const failures = new Map();
const ipFailures = new Map();
const LOCK_AFTER = 8;
const LOCK_MS = 5 * 60 * 1000;
const IP_LOCK_AFTER = 30;
const IP_LOCK_MS = 10 * 60 * 1000;

const locked = (map, key, after, ms) => {
  const f = map.get(key);
  if (!f || f.count < after) return 0;
  const left = ms - (Date.now() - f.at);
  return left > 0 ? Math.ceil(left / 1000) : 0;
};
const noteFail = (map, key) => {
  if (!key) return;
  const cur = map.get(key) || { count: 0 };
  map.set(key, { count: cur.count + 1, at: Date.now() });
};

/** ล้างตัวนับที่หมดอายุ ไม่ให้ Map โตไม่หยุดจากการยิงสุ่มชื่อ */
export function purgeLoginFailures(now = Date.now()) {
  for (const [k, f] of failures) if (now - f.at > LOCK_MS) failures.delete(k);
  for (const [k, f] of ipFailures) if (now - f.at > IP_LOCK_MS) ipFailures.delete(k);
}

export function login({ username, password, ip = null }) {
  const uname = String(username || '').trim().toLowerCase();
  const waitUser = locked(failures, uname, LOCK_AFTER, LOCK_MS);
  const waitIp = ip ? locked(ipFailures, ip, IP_LOCK_AFTER, IP_LOCK_MS) : 0;
  const wait = Math.max(waitUser, waitIp);
  if (wait) return { ok: false, msg: `ใส่รหัสผิดหลายครั้งเกินไป ลองใหม่ใน ${wait} วินาที` };

  const row = users.get(uname);
  // ตอบข้อความเดียวกันทั้งกรณีไม่มีผู้ใช้และรหัสผิด เพื่อไม่ให้ใช้เดาว่ามีชื่อนี้ในระบบไหม
  if (!row || !samePassword(password, row)) {
    noteFail(failures, uname);
    noteFail(ipFailures, ip);
    return { ok: false, msg: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' };
  }
  if (row.disabled) return { ok: false, msg: 'บัญชีนี้ถูกระงับการใช้งาน' };

  failures.delete(uname);
  if (ip) ipFailures.delete(ip);
  users.touchLogin(uname);
  const token = newToken();
  sessions.create(token, uname, SESSION_TTL);
  return { ok: true, token, ttl: SESSION_TTL, user: publicUser(users.get(uname)) };
}

export function changePassword({ username, newPass, oldPass = null, mustChange = 0 }) {
  const row = users.get(username);
  if (!row) return { ok: false, msg: 'ไม่พบผู้ใช้' };
  if (oldPass !== null && !samePassword(oldPass, row)) return { ok: false, msg: 'รหัสผ่านเดิมไม่ถูกต้อง' };
  if (String(newPass || '').length < MIN_PASSWORD) return { ok: false, msg: `รหัสผ่านใหม่ต้องยาวอย่างน้อย ${MIN_PASSWORD} ตัวอักษร` };
  const salt = newSalt();
  users.setPassword(username, salt, hashPassword(newPass, salt), mustChange);
  return { ok: true };
}

export function removeUser(username) {
  if (username === 'admin') return { ok: false, msg: 'ห้ามลบบัญชี admin หลัก' };
  if (!users.get(username)) return { ok: false, msg: 'ไม่พบผู้ใช้' };
  sessions.destroyUser(username);
  progress.clear(username);
  users.remove(username);
  return { ok: true };
}

export const publicUser = (row) => (row ? {
  username: row.username,
  display: row.display,
  role: row.role,
  disabled: !!row.disabled,
  mustChange: !!row.must_change,
  createdAt: row.created_at,
  lastLogin: row.last_login,
} : null);

// ---------- cookie ----------
export function readCookie(req, name = COOKIE) {
  const raw = req.headers.cookie || '';
  for (const part of raw.split(';')) {
    const i = part.indexOf('=');
    if (i > 0 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return null;
}

/**
 * request นี้มาทาง HTTPS ไหม — ดูทั้ง TLS ตรง ๆ และ header ที่ reverse proxy ใส่มาให้
 * ตั้ง LC_SECURE_COOKIE=1 เพื่อบังคับ (กรณี proxy ไม่ได้ส่ง X-Forwarded-Proto)
 */
export function isSecureRequest(req) {
  if (process.env.LC_SECURE_COOKIE === '1') return true;
  if (process.env.LC_SECURE_COOKIE === '0') return false;
  if (req?.socket?.encrypted) return true;
  return String(req?.headers?.['x-forwarded-proto'] || '').split(',')[0].trim() === 'https';
}

export const sessionCookie = (token, ttl, secure = false) =>
  `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(ttl / 1000)}${secure ? '; Secure' : ''}`;
export const clearCookie = (secure = false) =>
  `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure ? '; Secure' : ''}`;

/** ผู้ใช้ของ request นี้ (หรือ null) */
export function currentUser(req) {
  const row = sessions.get(readCookie(req));
  if (!row) return null;
  if (row.disabled) return null;
  return {
    username: row.username, display: row.display, role: row.role,
    mustChange: !!row.must_change, token: row.token,
  };
}

export { SESSION_TTL, COOKIE };
