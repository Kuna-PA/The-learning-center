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

// ส่งธงที่เซิร์ฟเวอร์แนบมาต่อไปด้วย (เช่น expired ของขั้นยืนยันสองขั้นตอน)
// หน้าจอจะได้ตัดสินใจถูกว่าให้ลองใหม่ตรงนั้น หรือต้องกลับไปเริ่มที่หน้าล็อกอิน
const fail = (e) => (e instanceof ApiError
  ? { ok: false, msg: e.message, status: e.status, ...(e.body || {}), error: undefined }
  : { ok: false, msg: 'ติดต่อเซิร์ฟเวอร์ไม่ได้' });

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
      // บัญชีที่เปิดยืนยันสองขั้นตอนยังไม่ได้เซสชัน ต้องส่งรหัสจากแอปอีกขั้น
      if (r.mfaRequired) return { ok: true, mfaRequired: true, pending: r.pending };
      cache.user = r.user;
      return { ok: true, user: r.user };
    } catch (e) { return fail(e); }
  },

  /** ขั้นที่สองของการล็อกอิน — ส่ง pending ที่ได้จากขั้นแรกพร้อมรหัส 6 หลัก */
  async loginMfa(pending, code) {
    if (mode === 'local') return { ok: false, msg: 'โหมดออฟไลน์ไม่มีการยืนยันสองขั้นตอน' };
    try {
      const r = await api.post('/api/auth/login-mfa', { pending, code });
      cache.user = r.user;
      return { ok: true, user: r.user };
    } catch (e) { return fail(e); }
  },

  /** แก้ข้อมูลประจำตัวของตัวเอง — ชื่อที่แสดง อีเมล รหัสพนักงาน */
  async updateProfile(patch) {
    if (mode === 'local') {
      const r = localAuth.setDisplay(cache.user.username, patch.display ?? cache.user.display);
      if (r.ok) cache.user = r.user;
      return r.ok ? r : { ok: false, msg: r.msg || 'แก้ไขไม่สำเร็จ' };
    }
    try {
      const r = await api.patch('/api/auth/profile', patch);
      cache.user = r.user;
      return { ok: true, user: r.user };
    } catch (e) { return fail(e); }
  },

  /** ---------- ยืนยันสองขั้นตอนของบัญชีตัวเอง ---------- */
  async mfaSetup() {
    try { return { ok: true, ...(await api.post('/api/auth/mfa/setup')) }; }
    catch (e) { return fail(e); }
  },
  async mfaEnable(code) {
    try { await api.post('/api/auth/mfa/enable', { code }); cache.user = await this.refresh(); return { ok: true }; }
    catch (e) { return fail(e); }
  },
  async mfaDisable(password) {
    try { await api.post('/api/auth/mfa/disable', { password }); cache.user = await this.refresh(); return { ok: true }; }
    catch (e) { return fail(e); }
  },
  /** ดึงข้อมูลบัญชีตัวเองใหม่จากเซิร์ฟเวอร์ */
  async refresh() {
    try { const r = await api.get('/api/auth/me'); return r.user; }
    catch { return cache.user; }
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

  /**
   * ผู้ดูแลแก้ข้อมูลของผู้เรียนคนหนึ่ง — ส่งเฉพาะช่องที่มีมาใน patch
   * รวมทั้งปิด MFA ให้ด้วย (patch.mfaEnabled === false) ตอนผู้เรียนทำมือถือหาย
   */
  async adminUpdateProfile(username, patch) {
    if (mode === 'local') {
      // โหมดออฟไลน์เก็บได้แค่ชื่อที่แสดง อีเมลกับรหัสพนักงานต้องมีเซิร์ฟเวอร์
      if (patch.display !== undefined) localAuth.setDisplay(username, patch.display);
      if (patch.role !== undefined) localAuth.setRole(username, patch.role);
      if (patch.disabled !== undefined) localAuth.setDisabled(username, patch.disabled);
      await auth.loadUsers();
      return { ok: true };
    }
    try {
      await api.patch(`/api/admin/user/${encodeURIComponent(username)}`, patch);
      await auth.loadUsers();
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
