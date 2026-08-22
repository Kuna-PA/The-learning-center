// ============================================================
//  ระบบผู้ใช้และสิทธิ์ (admin / user)
//  ตัวจริงอยู่ฝั่งเซิร์ฟเวอร์: รหัสผ่านเก็บเป็น scrypt hash และเซสชันเป็น
//  cookie แบบ httpOnly — ไฟล์นี้เป็นแค่ตัวเรียก API + แคชผู้ใช้ปัจจุบัน
//
//  getter อย่าง auth.current / auth.isAdmin ยังเรียกแบบ synchronous ได้
//  เพราะอ่านจากแคชที่ bootstrap() เติมไว้ตอนเปิดหน้า
// ============================================================
import { api, ApiError } from './api.js';

let cache = { user: null, users: {} };

const fail = (e) => ({ ok: false, msg: e instanceof ApiError ? e.message : 'ติดต่อเซิร์ฟเวอร์ไม่ได้' });

export const auth = {
  get current() { return cache.user; },
  get username() { return cache.user ? cache.user.username : null; },
  get isAdmin() { return !!cache.user && cache.user.role === 'admin'; },
  get users() { return cache.users; },

  /** อ่านเซสชันปัจจุบันจากเซิร์ฟเวอร์ — เรียกครั้งเดียวตอนเปิดหน้า */
  async bootstrap() {
    try {
      const r = await api.get('/api/auth/me');
      cache.user = r.user || null;
    } catch { cache.user = null; }
    return cache.user;
  },

  async login(username, password) {
    try {
      const r = await api.post('/api/auth/login', { username, password });
      cache.user = r.user;
      return { ok: true, user: r.user };
    } catch (e) { return fail(e); }
  },

  async register(username, password, display, role = 'user') {
    try {
      // ผู้ดูแลระบบสร้างบัญชีให้คนอื่น — ต้องไม่ไปเปลี่ยนเซสชันของตัวเอง
      if (cache.user && cache.user.role === 'admin') {
        const r = await api.post('/api/admin/users', { username, password, display, role });
        await auth.loadUsers();
        return { ok: true, user: r.user };
      }
      // ผู้ใช้สมัครเอง — สมัครเสร็จล็อกอินให้เลย
      const r = await api.post('/api/auth/register', { username, password, display });
      cache.user = r.user;
      return { ok: true, user: r.user };
    } catch (e) { return fail(e); }
  },

  async logout() {
    try { await api.post('/api/auth/logout'); } catch { /* ออกจากระบบฝั่งเราอยู่ดี */ }
    cache = { user: null, users: {} };
  },

  async changePassword(username, newPass, oldPass = null) {
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
    try {
      await api.patch(`/api/admin/user/${encodeURIComponent(username)}`, { role });
      await auth.loadUsers();
      return { ok: true };
    } catch (e) { return fail(e); }
  },

  async setDisabled(username, v) {
    try {
      await api.patch(`/api/admin/user/${encodeURIComponent(username)}`, { disabled: !!v });
      await auth.loadUsers();
      return { ok: true };
    } catch (e) { return fail(e); }
  },

  async remove(username) {
    try {
      await api.del(`/api/admin/user/${encodeURIComponent(username)}`);
      await auth.loadUsers();
      return { ok: true };
    } catch (e) { return fail(e); }
  },

  /** โหลดรายชื่อผู้ใช้ทั้งหมด (เฉพาะ admin) มาไว้ใน auth.users */
  async loadUsers() {
    if (!auth.isAdmin) { cache.users = {}; return cache.users; }
    try {
      const r = await api.get('/api/admin/users');
      cache.users = Object.fromEntries(r.users.map((u) => [u.username, u]));
    } catch { cache.users = {}; }
    return cache.users;
  },
};
