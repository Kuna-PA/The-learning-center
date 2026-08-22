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
    last_login  INTEGER
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token      TEXT PRIMARY KEY,
    username   TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(username);

  -- ความคืบหน้าเก็บเป็น JSON ก้อนเดียว โครงเดียวกับฝั่งเบราว์เซอร์
  CREATE TABLE IF NOT EXISTS progress (
    username   TEXT PRIMARY KEY REFERENCES users(username) ON DELETE CASCADE,
    data       TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  );
`);

const q = (sql) => db.prepare(sql);

// ---------- users ----------
const S = {
  getUser: q('SELECT * FROM users WHERE username = ?'),
  allUsers: q('SELECT username, display, role, disabled, must_change, created_at, last_login FROM users ORDER BY created_at'),
  countUsers: q('SELECT COUNT(*) AS n FROM users'),
  insertUser: q(`INSERT INTO users (username, display, role, salt, hash, disabled, must_change, created_at)
                 VALUES (?, ?, ?, ?, ?, 0, ?, ?)`),
  updatePass: q('UPDATE users SET salt = ?, hash = ?, must_change = ? WHERE username = ?'),
  updateRole: q('UPDATE users SET role = ? WHERE username = ?'),
  updateDisabled: q('UPDATE users SET disabled = ? WHERE username = ?'),
  updateDisplay: q('UPDATE users SET display = ? WHERE username = ?'),
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

export const progress = {
  get: (username) => {
    const row = S.getProgress.get(username);
    if (!row) return null;
    try { return { data: JSON.parse(row.data), updatedAt: row.updated_at }; }
    catch { return null; }
  },
  save: (username, data) => S.upsertProgress.run(username, JSON.stringify(data), Date.now()),
  clear: (username) => S.deleteProgress.run(username),
  all: () => S.allProgress.all().map((r) => {
    try { return { username: r.username, data: JSON.parse(r.data), updatedAt: r.updated_at }; }
    catch { return { username: r.username, data: null, updatedAt: r.updated_at }; }
  }),
};

export default db;
