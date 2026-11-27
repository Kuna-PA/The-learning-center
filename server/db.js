// ============================================================
//  ฐานข้อมูล — ใช้ node:sqlite ที่ติดมากับ Node เอง (ไม่ต้องลงอะไรเพิ่ม)
//  เก็บผู้ใช้ เซสชัน และความคืบหน้าของผู้เรียน
// ============================================================
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = process.env.LC_DATA_DIR || join(root, 'data-db');
mkdirSync(DATA_DIR, { recursive: true });

export const DB_PATH = join(DATA_DIR, 'learning-center.db');
const db = new DatabaseSync(DB_PATH);

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    username    TEXT PRIMARY KEY,
    display     TEXT NOT NULL,
    role        TEXT NOT NULL DEFAULT 'user',
    salt        TEXT NOT NULL,
    hash        TEXT NOT NULL,
    disabled    INTEGER NOT NULL DEFAULT 0,
    must_change INTEGER NOT NULL DEFAULT 0,
    created_at  INTEGER NOT NULL,
    last_login  INTEGER,
    email       TEXT NOT NULL DEFAULT '',
    emp_id      TEXT NOT NULL DEFAULT '',
    mfa_secret  TEXT NOT NULL DEFAULT '',
    mfa_enabled INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token      TEXT PRIMARY KEY,
    username   TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(username);

  -- เนื้อหาที่ผู้ดูแลเพิ่มเอง (บทเรียน/ข้อสอบ/Lab) เก็บเป็น JSON ก้อนเดียว มีแถวเดียวเสมอ
  CREATE TABLE IF NOT EXISTS content (
    id         INTEGER PRIMARY KEY CHECK (id = 1),
    data       TEXT NOT NULL,
    updated_at INTEGER NOT NULL,
    updated_by TEXT
  );

  -- ความคืบหน้าเก็บเป็น JSON ก้อนเดียว โครงเดียวกับฝั่งเบราว์เซอร์
  CREATE TABLE IF NOT EXISTS progress (
    username   TEXT PRIMARY KEY REFERENCES users(username) ON DELETE CASCADE,
    data       TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  );
`);

/**
 * เติมคอลัมน์ที่เพิ่มมาทีหลังให้ฐานเดิมที่สร้างไว้ก่อน
 * CREATE TABLE IF NOT EXISTS ไม่แตะตารางที่มีอยู่แล้ว ฐานเก่าจึงไม่ได้คอลัมน์ใหม่
 * และ ALTER TABLE จะพังถ้าคอลัมน์มีอยู่แล้ว ต้องถามก่อนทุกครั้ง
 */
function addColumnIfMissing(table, column, decl) {
  const has = db.prepare(`PRAGMA table_info(${table})`).all().some((c) => c.name === column);
  if (!has) db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${decl}`);
}
addColumnIfMissing('users', 'email', "TEXT NOT NULL DEFAULT ''");
addColumnIfMissing('users', 'emp_id', "TEXT NOT NULL DEFAULT ''");
addColumnIfMissing('users', 'mfa_secret', "TEXT NOT NULL DEFAULT ''");
addColumnIfMissing('users', 'mfa_enabled', 'INTEGER NOT NULL DEFAULT 0');

const q = (sql) => db.prepare(sql);

// ---------- users ----------
const S = {
  getUser: q('SELECT * FROM users WHERE username = ?'),
  allUsers: q(`SELECT username, display, role, disabled, must_change, created_at, last_login,
                      email, emp_id, mfa_enabled FROM users ORDER BY created_at`),
  countUsers: q('SELECT COUNT(*) AS n FROM users'),
  insertUser: q(`INSERT INTO users (username, display, role, salt, hash, disabled, must_change, created_at)
                 VALUES (?, ?, ?, ?, ?, 0, ?, ?)`),
  updatePass: q('UPDATE users SET salt = ?, hash = ?, must_change = ? WHERE username = ?'),
  updateRole: q('UPDATE users SET role = ? WHERE username = ?'),
  updateDisabled: q('UPDATE users SET disabled = ? WHERE username = ?'),
  updateDisplay: q('UPDATE users SET display = ? WHERE username = ?'),
  updateProfile: q('UPDATE users SET display = ?, email = ?, emp_id = ? WHERE username = ?'),
  updateMfa: q('UPDATE users SET mfa_secret = ?, mfa_enabled = ? WHERE username = ?'),
  touchLogin: q('UPDATE users SET last_login = ? WHERE username = ?'),
  deleteUser: q('DELETE FROM users WHERE username = ?'),

  // ---------- sessions ----------
  insertSession: q('INSERT INTO sessions (token, username, created_at, expires_at) VALUES (?, ?, ?, ?)'),
  getSession: q(`SELECT s.token, s.username, s.expires_at, u.display, u.role, u.disabled, u.must_change
                 FROM sessions s JOIN users u ON u.username = s.username
                 WHERE s.token = ?`),
  deleteSession: q('DELETE FROM sessions WHERE token = ?'),
  deleteUserSessions: q('DELETE FROM sessions WHERE username = ?'),
  purgeSessions: q('DELETE FROM sessions WHERE expires_at < ?'),

  // ---------- progress ----------
  getProgress: q('SELECT data, updated_at FROM progress WHERE username = ?'),
  upsertProgress: q(`INSERT INTO progress (username, data, updated_at) VALUES (?, ?, ?)
                     ON CONFLICT(username) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`),
  deleteProgress: q('DELETE FROM progress WHERE username = ?'),
  allProgress: q('SELECT username, data, updated_at FROM progress'),
};

export const users = {
  get: (username) => S.getUser.get(username) || null,
  all: () => S.allUsers.all(),
  count: () => S.countUsers.get().n,
  create: ({ username, display, role, salt, hash, mustChange = 0 }) =>
    S.insertUser.run(username, display, role, salt, hash, mustChange ? 1 : 0, Date.now()),
  setPassword: (username, salt, hash, mustChange = 0) => S.updatePass.run(salt, hash, mustChange ? 1 : 0, username),
  setRole: (username, role) => S.updateRole.run(role, username),
  setDisabled: (username, v) => S.updateDisabled.run(v ? 1 : 0, username),
  setDisplay: (username, display) => S.updateDisplay.run(display, username),
  /** แก้ข้อมูลประจำตัว — ผู้ดูแลใช้จากหน้าจัดการผู้ใช้ */
  setProfile: (username, { display, email, empId }) =>
    S.updateProfile.run(String(display), String(email ?? ''), String(empId ?? ''), username),
  /** เก็บกุญแจ MFA · enabled = 0 คือยังตั้งค้างไว้ ยังไม่ได้ยืนยันด้วยรหัสจากแอป */
  setMfa: (username, secret, enabled) => S.updateMfa.run(String(secret || ''), enabled ? 1 : 0, username),
  touchLogin: (username) => S.touchLogin.run(Date.now(), username),
  remove: (username) => S.deleteUser.run(username),
};

export const sessions = {
  create: (token, username, ttlMs) => S.insertSession.run(token, username, Date.now(), Date.now() + ttlMs),
  get: (token) => {
    if (!token) return null;
    const row = S.getSession.get(token);
    if (!row) return null;
    if (row.expires_at < Date.now()) { S.deleteSession.run(token); return null; }
    return row;
  },
  destroy: (token) => S.deleteSession.run(token),
  destroyUser: (username) => S.deleteUserSessions.run(username),
  purge: () => S.purgeSessions.run(Date.now()),
};

/** โครงความคืบหน้าเปล่า — ต้องตรงกับ blank() ฝั่ง js/store.js */
const BLANK_PROGRESS = () => ({
  version: 1, xp: 0, read: {}, quiz: {}, labs: {}, final: null, unlockAll: false, createdAt: Date.now(),
});

export const progress = {
  get: (username) => {
    const row = S.getProgress.get(username);
    if (!row) return null;
    try { return { data: JSON.parse(row.data), updatedAt: row.updated_at }; }
    catch { return null; }
  },
  save: (username, data) => S.upsertProgress.run(username, JSON.stringify(data), Date.now()),
  /**
   * ล้างความคืบหน้า — เขียนทับด้วยก้อนว่าง ไม่ใช่ลบแถวทิ้ง
   *
   * ถ้าลบแถว GET /api/progress จะตอบ data: null ซึ่งฝั่งเบราว์เซอร์ตีความว่า
   * "บัญชีนี้ยังไม่เคยมีข้อมูลบนเซิร์ฟเวอร์" แล้วยกแคชที่ค้างอยู่ในเครื่องขึ้นไปแทน
   * ผลคือสิ่งที่ผู้ดูแลเพิ่งล้างไปกลับคืนมาทันทีที่ผู้ใช้ล็อกอิน
   * การเขียนก้อนว่างทับทำให้แยกออกว่า "ถูกล้างโดยตั้งใจ" ต่างจาก "ยังไม่เคยมี"
   */
  clear: (username) => S.upsertProgress.run(username, JSON.stringify(BLANK_PROGRESS()), Date.now()),
  /** ลบแถวทิ้งจริง ๆ — ใช้ตอนลบบัญชี ไม่ใช่ตอนล้างความคืบหน้า */
  remove: (username) => S.deleteProgress.run(username),
  all: () => S.allProgress.all().map((r) => {
    try { return { username: r.username, data: JSON.parse(r.data), updatedAt: r.updated_at }; }
    catch { return { username: r.username, data: null, updatedAt: r.updated_at }; }
  }),
};

// ---------- เนื้อหาที่ผู้ดูแลเพิ่มเอง ----------
const contentStmt = {
  get: q('SELECT data, updated_at, updated_by FROM content WHERE id = 1'),
  save: q(`INSERT INTO content (id, data, updated_at, updated_by) VALUES (1, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET data = excluded.data,
             updated_at = excluded.updated_at, updated_by = excluded.updated_by`),
};

export const content = {
  get() {
    const row = contentStmt.get.get();
    if (!row) return null;
    try { return { data: JSON.parse(row.data), updatedAt: row.updated_at, updatedBy: row.updated_by }; }
    catch { return null; }
  },
  save(data, by) {
    contentStmt.save.run(JSON.stringify(data), Date.now(), by || null);
  },
};

export default db;
