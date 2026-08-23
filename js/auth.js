// ============================================================
//  ระบบผู้ใช้และสิทธิ์ (admin / user) — ทำงานได้สองโหมด
//
//  server : มีเซิร์ฟเวอร์ตอบ → บัญชีอยู่ในฐานข้อมูล รหัสผ่านแฮชด้วย scrypt
//           เซสชันเป็นคุกกี้ httpOnly · ความคืบหน้าตามตัวข้ามเครื่อง
//  local  : ไม่มีเซิร์ฟเวอร์ (เช่นเปิดจาก static hosting) → เก็บในเบราว์เซอร์เครื่องนั้น
//
//  โหมดถูกเลือกอัตโนมัติตอน bootstrap() และ getter อย่าง auth.current
//  ยังเรียกแบบ synchronous ได้เหมือนเดิมเพราะอ่านจากแคช
// ============================================================
import { api, ApiError } from './api.js';
import { localAuth } from './local-mode.js';

let cache = { user: null, users: {} };
let mode = 'server';          // 'server' | 'local'

const fail = (e) => ({ ok: false, msg: e instanceof ApiError ? e.message : 'ติดต่อเซิร์ฟเวอร์ไม่ได้' });

export const auth = {
  get current() { return cache.user; },
  get username() { return cache.user ? cache.user.username : null; },
  get isAdmin() { return !!cache.user && cache.user.role === 'admin'; },
  get users() { return cache.users; },
  get mode() { return mode; },
  get isLocal() { return mode === 'local'; },

  /** ตรวจว่ามีเซิร์ฟเวอร์ไหม แล้วอ่านเซสชันปัจจุบัน — เรียกครั้งเดียวตอนเปิดหน้า */
  async bootstrap() {
    try {
      const r = await api.get('/api/auth/me');
      mode = 'server';
      cache.user = r.user || null;
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        mode = 'server';          // เซิร์ฟเวอร์ตอบอยู่ แค่ยังไม่ได้ล็อกอิน
        cache.user = null;
      } else {
        mode = 'local';
        cache.user = localAuth.current();
      }
    }
    return cache.user;
  },

  async login(username, password) {
    if (mode === 'local') {
      const r = await localAuth.login(username, password);
      if (r.ok) cache.user = r.user;
      return r;
    }
    try {
      const r = await api.post('/api/auth/login', { username, password });
      cache.user = r.user;
      return { ok: true, user: r.user };
    } catch (e) { return fail(e); }
  },

  async register(username, password, display, role = 'user') {
    if (mode === 'local') {
      const r = await localAuth.register(username, password, display, role);
      if (r.ok && (!cache.user || cache.user.role !== 'admin')) cache.user = r.user;
      await auth.loadUsers();
      return r;
    }
    try {
      // ผู้ดูแลระบบสร้างบัญชีให้คนอื่น — ต้องไม่ไปเปลี่ยนเซสชันของตัวเอง
      if (cache.user && cache.user.role === 'admin') {
        const r = await api.post('/api/admin/users', { username, password, display, role });
        await auth.loadUsers();
        return { ok: true, user: r.user };
      }
      const r = await api.post('/api/auth/register', { username, password, display });
      cache.user = r.user;
      return { ok: true, user: r.user };
    } catch (e) { return fail(e); }
  },

  async logout() {
    if (mode === 'local') localAuth.logout();
    else { try { await api.post('/api/auth/logout'); } catch { /* ออกฝั่งเราอยู่ดี */ } }
    cache = { user: null, users: {} };
  },

  async changePassword(username, newPass, oldPass = null) {
    if (mode === 'local') return localAuth.changePassword(username, newPass, oldPass);
    try {
      if (cache.user && username === cache.user.username) {
        await api.post('/api/auth/password', { newPass, oldPass });
        cache.user = { ...cache.user, mustChange: false };
      } else {
        await api.patch(`/api/admin/user/${encodeURIComponent(username)}`, { password: newPass });
        await auth.loadUsers();
      }
      return { ok: true };
    } catch (e) { return fail(e); }
  },

  async setDisplay(username, display) {
    if (mode === 'local') {
      const r = localAuth.setDisplay(username, display);
      if (cache.user && username === cache.user.username) cache.user = { ...cache.user, display };
      await auth.loadUsers();
      return r;
    }
    try {
      if (cache.user && username === cache.user.username) {
        const r = await api.post('/api/auth/display', { display });
        cache.user = { ...cache.user, display: r.display };
      } else {
        await api.patch(`/api/admin/user/${encodeURIComponent(username)}`, { display });
        await auth.loadUsers();
      }
      return { ok: true };
    } catch (e) { return fail(e); }
  },

  async setRole(username, role) {
    if (mode === 'local') { const r = localAuth.setRole(username, role); await auth.loadUsers(); return r; }
    try {
      await api.patch(`/api/admin/user/${encodeURIComponent(username)}`, { role });
      await auth.loadUsers();
      return { ok: true };
    } catch (e) { return fail(e); }
  },

  async setDisabled(username, v) {
    if (mode === 'local') { const r = localAuth.setDisabled(username, v); await auth.loadUsers(); return r; }
    try {
      await api.patch(`/api/admin/user/${encodeURIComponent(username)}`, { disabled: !!v });
      await auth.loadUsers();
      return { ok: true };
    } catch (e) { return fail(e); }
  },

  async remove(username) {
    if (mode === 'local') { const r = localAuth.remove(username); await auth.loadUsers(); return r; }
    try {
      await api.del(`/api/admin/user/${encodeURIComponent(username)}`);
      await auth.loadUsers();
      return { ok: true };
    } catch (e) { return fail(e); }
  },

  /** โหลดรายชื่อผู้ใช้ทั้งหมด (เฉพาะ admin) มาไว้ใน auth.users */
  async loadUsers() {
    if (!auth.isAdmin) { cache.users = {}; return cache.users; }
    if (mode === 'local') { cache.users = localAuth.listUsers(); return cache.users; }
    try {
      const r = await api.get('/api/admin/users');
      cache.users = Object.fromEntries(r.users.map((u) => [u.username, u]));
    } catch { cache.users = {}; }
    return cache.users;
  },

  /** จำนวนบัญชีในระบบ — ใช้ตัดสินว่าจะโชว์คำแนะนำครั้งแรกไหม */
  async accountCount() {
    if (mode === 'local') return localAuth.count();
    try { return (await api.get('/api/health')).users; } catch { return null; }
  },

  /** ข้อมูลเซิร์ฟเวอร์ที่หน้าล็อกอินต้องใช้ — จำนวนบัญชี และเปิดให้สมัครเองไหม */
  async serverInfo() {
    if (mode === 'local') return { users: localAuth.count(), openRegister: true };
    try { return await api.get('/api/health'); } catch { return null; }
  },
};
