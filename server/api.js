// ============================================================
//  REST API — ทุกเส้นทางอยู่ใต้ /api
//  ผู้ใช้ทั่วไปแก้ได้เฉพาะของตัวเอง · admin เห็นและจัดการได้ทุกคน
// ============================================================
import { users, sessions, progress, content } from './db.js';
import {
  register, login, changePassword, removeUser, publicUser,
  currentUser, sessionCookie, clearCookie, isSecureRequest,
  SESSION_TTL, USERNAME_RE, MIN_PASSWORD,
} from './auth.js';

// เปิดให้คนนอกสมัครเองได้ไหม — ตั้ง LC_OPEN_REGISTER=0 เมื่อเอาขึ้นอินเทอร์เน็ตแล้วอยากให้ admin เป็นคนสร้างบัญชีเท่านั้น
export const OPEN_REGISTER = process.env.LC_OPEN_REGISTER !== '0';

/**
 * IP ของผู้เรียก — ใช้จำกัดการเดารหัส
 * ไม่เชื่อ X-Forwarded-For เว้นแต่ตั้ง LC_TRUST_PROXY=1 เอง
 * เพราะถ้าเชื่อทั้งที่ไม่มี proxy ใครก็ปลอม header หนีการนับได้
 */
const clientIp = (req) => {
  if (process.env.LC_TRUST_PROXY === '1') {
    const fwd = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
    if (fwd) return fwd;
  }
  return req.socket?.remoteAddress || null;
};

// เส้นทางที่ยังเรียกได้ทั้งที่ยังไม่ได้เปลี่ยนรหัสเริ่มต้น
const ALLOW_WHILE_LOCKED = new Set(['auth/me', 'auth/password', 'auth/logout', 'health']);

const json = (res, code, body, headers = {}) => {
  const txt = JSON.stringify(body);
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...headers,
  });
  res.end(txt);
};

const MAX_BODY = 1 << 20;   // 1 MB — ความคืบหน้าก้อนเดียวไม่ควรใหญ่กว่านี้

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY) { reject(new Error('payload ใหญ่เกินไป')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
      catch { reject(new Error('รูปแบบ JSON ไม่ถูกต้อง')); }
    });
    req.on('error', reject);
  });
}

/**
 * โครงเนื้อหาที่ผู้ดูแลเพิ่มเอง — เก็บเฉพาะ field ที่รู้จัก
 * ตัวตรวจเนื้อหาแบบละเอียด (เช่นเฉลยอยู่ในช่วงตัวเลือกไหม) อยู่ที่ data/custom.js
 * ฝั่งนี้ทำหน้าที่กันของแปลกปลอมและกันขนาดล้นเท่านั้น
 */
function sanitiseContent(c) {
  const arr = (v) => (Array.isArray(v) ? v : []);
  const out = {
    version: 1,
    updatedAt: Number(c?.updatedAt) || Date.now(),
    sections: arr(c?.sections).map(s => ({
      id: String(s.id || ''), track: String(s.track || ''), level: Number(s.level) || 1,
      t: String(s.t || ''), h: String(s.h || ''),
    })),
    quiz: arr(c?.quiz).map(q => ({
      id: String(q.id || ''), track: String(q.track || ''), level: Number(q.level) || 1,
      type: String(q.type || 'mcq'), q: String(q.q || ''), why: String(q.why || ''),
      opts: arr(q.opts).map(String), a: Array.isArray(q.a) ? q.a.map(Number) : Number(q.a) || 0,
      ans: arr(q.ans).map(String),
    })),
    labs: arr(c?.labs).map(l => ({
      id: String(l.id || ''), track: String(l.track || ''), level: Number(l.level) || 1,
      title: String(l.title || ''), brief: String(l.brief || ''), device: String(l.device || ''),
      debrief: String(l.debrief || ''),
      tasks: arr(l.tasks).map(t => ({
        t: String(t.t || ''), hint: String(t.hint || ''),
        rules: arr(t.rules).map(r => ({
          kind: String(r.kind || ''), pattern: String(r.pattern || ''), min: Number(r.min) || 0,
          path: String(r.path || ''), op: String(r.op || ''), value: String(r.value ?? ''),
          contains: String(r.contains || ''),
        })),
      })),
    })),
  };
  const total = out.sections.length + out.quiz.length + out.labs.length;
  if (total > 2000) throw new Error('เนื้อหาที่เพิ่มเองเยอะผิดปกติ');
  return out;
}

/** โครงความคืบหน้าที่ยอมรับ — กันไม่ให้ client ยัดอะไรแปลก ๆ ลงฐานข้อมูล */
function sanitiseProgress(p) {
  const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
  const out = {
    version: 1,
    xp: Math.max(0, Math.min(1e7, Number(p?.xp) || 0)),
    read: obj(p?.read),
    quiz: obj(p?.quiz),
    labs: obj(p?.labs),
    unlockAll: !!p?.unlockAll,
    createdAt: Number(p?.createdAt) || Date.now(),
  };
  if (Object.keys(out.read).length > 5000 || Object.keys(out.quiz).length > 5000
    || Object.keys(out.labs).length > 5000) throw new Error('ข้อมูลความคืบหน้าใหญ่ผิดปกติ');
  return out;
}

export default async function api(req, res, pathname) {
  const parts = pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean);
  const me = currentUser(req);
  const isAdmin = !!me && me.role === 'admin';
  const method = req.method;

  const needAuth = () => { json(res, 401, { error: 'ต้องเข้าสู่ระบบก่อน' }); return true; };
  const needAdmin = () => { json(res, 403, { error: 'ต้องเป็นผู้ดูแลระบบ' }); return true; };

  let body = {};
  if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
    try { body = await readBody(req); }
    catch (e) { return json(res, 400, { error: e.message }); }
  }

  // บังคับเปลี่ยนรหัสที่ "เซิร์ฟเวอร์" ไม่ใช่แค่ที่หน้าจอ — ไม่งั้นข้ามได้ด้วยการยิง API ตรง
  if (me && me.mustChange && !ALLOW_WHILE_LOCKED.has(parts.join('/'))) {
    return json(res, 403, { error: 'ต้องตั้งรหัสผ่านใหม่ก่อนจึงจะใช้งานส่วนอื่นได้', code: 'must_change' });
  }

  // ---------------- auth ----------------
  if (parts[0] === 'auth') {
    if (parts[1] === 'me' && method === 'GET') {
      return json(res, 200, { user: me ? publicUser(users.get(me.username)) : null });
    }
    if (parts[1] === 'register' && method === 'POST') {
      if (!OPEN_REGISTER) return json(res, 403, { error: 'เซิร์ฟเวอร์นี้ปิดรับสมัครเอง — ให้ผู้ดูแลระบบสร้างบัญชีให้' });
      const r = register({ username: body.username, password: body.password, display: body.display });
      if (!r.ok) return json(res, 400, { error: r.msg });
      const l = login({ username: body.username, password: body.password, ip: clientIp(req) });
      return json(res, 201, { user: r.user }, { 'Set-Cookie': sessionCookie(l.token, SESSION_TTL, isSecureRequest(req)) });
    }
    if (parts[1] === 'login' && method === 'POST') {
      const r = login({ username: body.username, password: body.password, ip: clientIp(req) });
      if (!r.ok) return json(res, 401, { error: r.msg });
      return json(res, 200, { user: r.user }, { 'Set-Cookie': sessionCookie(r.token, r.ttl, isSecureRequest(req)) });
    }
    if (parts[1] === 'logout' && method === 'POST') {
      if (me) sessions.destroy(me.token);
      return json(res, 200, { ok: true }, { 'Set-Cookie': clearCookie(isSecureRequest(req)) });
    }
    if (parts[1] === 'password' && method === 'POST') {
      if (!me) return needAuth();
      // ต้องยืนยันรหัสเดิมเสมอ — เดิมถ้า client ไม่ส่ง oldPass มาก็เปลี่ยนได้เลย
      // แปลว่าใครยืมเครื่องที่ล็อกอินค้างไว้ ยึดบัญชีได้ทันทีโดยไม่รู้รหัสเดิม
      const r = changePassword({ username: me.username, newPass: body.newPass, oldPass: String(body.oldPass ?? '') });
      return r.ok ? json(res, 200, { ok: true }) : json(res, 400, { error: r.msg });
    }
    if (parts[1] === 'display' && method === 'POST') {
      if (!me) return needAuth();
      const d = String(body.display || '').trim().slice(0, 40) || me.username;
      users.setDisplay(me.username, d);
      return json(res, 200, { ok: true, display: d });
    }
    return json(res, 404, { error: 'ไม่พบเส้นทางนี้' });
  }

  // ---------------- progress ของตัวเอง ----------------
  if (parts[0] === 'progress') {
    if (!me) return needAuth();
    if (method === 'GET') {
      const row = progress.get(me.username);
      return json(res, 200, { data: row ? row.data : null, updatedAt: row ? row.updatedAt : null });
    }
    // POST รองรับด้วยเพราะ navigator.sendBeacon ส่งได้แค่ POST (ใช้ตอนผู้ใช้ปิดแท็บ)
    if (method === 'PUT' || method === 'POST') {
      let clean;
      try { clean = sanitiseProgress(body.data ?? body); }
      catch (e) { return json(res, 400, { error: e.message }); }
      progress.save(me.username, clean);
      return json(res, 200, { ok: true, updatedAt: Date.now() });
    }
    if (method === 'DELETE') {
      progress.clear(me.username);
      return json(res, 200, { ok: true });
    }
  }

  // ---------------- admin ----------------
  if (parts[0] === 'admin') {
    if (!me) return needAuth();
    if (!isAdmin) return needAdmin();

    if (parts[1] === 'users' && method === 'GET') {
      const prog = Object.fromEntries(progress.all().map((p) => [p.username, p.data]));
      return json(res, 200, {
        users: users.all().map((u) => {
          const p = prog[u.username] || {};
          return {
            ...publicUser(u),
            xp: p.xp || 0,
            labsDone: Object.values(p.labs || {}).filter((l) => l.done).length,
            quizPassed: Object.values(p.quiz || {}).filter((q) => q.passed).length,
            // ส่งก้อนความคืบหน้ามาด้วย เพื่อให้หน้า admin คำนวณใบประกาศได้โดยไม่ต้องยิงรายคน
            progress: prog[u.username] || null,
          };
        }),
      });
    }
    if (parts[1] === 'users' && method === 'POST') {
      const r = register({
        username: body.username, password: body.password,
        display: body.display, role: body.role === 'admin' ? 'admin' : 'user',
        mustChange: 1,   // รหัสที่ผู้ดูแลตั้งให้ ผู้ดูแลก็รู้ — ต้องให้เจ้าตัวเปลี่ยนก่อนใช้งาน
      });
      return r.ok ? json(res, 201, { user: r.user }) : json(res, 400, { error: r.msg });
    }

    const target = parts[2] ? String(parts[2]).toLowerCase() : null;
    if (parts[1] === 'user' && target) {
      if (!users.get(target)) return json(res, 404, { error: 'ไม่พบผู้ใช้' });

      if (method === 'PATCH') {
        if ('role' in body) {
          if (target === 'admin' && body.role !== 'admin') return json(res, 400, { error: 'ห้ามลดสิทธิ์บัญชี admin หลัก' });
          users.setRole(target, body.role === 'admin' ? 'admin' : 'user');
        }
        if ('disabled' in body) {
          if (target === 'admin') return json(res, 400, { error: 'ห้ามระงับบัญชี admin หลัก' });
          users.setDisabled(target, !!body.disabled);
          if (body.disabled) sessions.destroyUser(target);
        }
        if ('display' in body) users.setDisplay(target, String(body.display || '').trim().slice(0, 40) || target);
        if ('password' in body) {
          const r = changePassword({ username: target, newPass: body.password, mustChange: 1 });
          if (!r.ok) return json(res, 400, { error: r.msg });
          sessions.destroyUser(target);   // บังคับให้ล็อกอินใหม่ด้วยรหัสใหม่
        }
        return json(res, 200, { user: publicUser(users.get(target)) });
      }
      if (method === 'DELETE') {
        const r = removeUser(target);
        return r.ok ? json(res, 200, { ok: true }) : json(res, 400, { error: r.msg });
      }
    }

    if (parts[1] === 'progress' && target) {
      if (method === 'GET') {
        const row = progress.get(target);
        return json(res, 200, { data: row ? row.data : null, updatedAt: row ? row.updatedAt : null });
      }
      if (method === 'DELETE') { progress.clear(target); return json(res, 200, { ok: true }); }
    }
  }

  // ---------------- เนื้อหาที่ผู้ดูแลเพิ่มเอง ----------------
  // ผู้เรียนทุกคนต้องอ่านได้ (ไม่งั้นจะไม่เห็นบทเรียนที่เพิ่มเข้ามา) แต่เขียนได้เฉพาะ admin
  if (parts[0] === 'content') {
    if (!me) return needAuth();
    if (method === 'GET') {
      const row = content.get();
      return json(res, 200, { data: row ? row.data : null, updatedAt: row ? row.updatedAt : null, updatedBy: row ? row.updatedBy : null });
    }
    if (method === 'PUT' || method === 'POST') {
      if (!isAdmin) return needAdmin();
      let clean;
      try { clean = sanitiseContent(body.data ?? body); }
      catch (e) { return json(res, 400, { error: e.message }); }
      content.save(clean, me.username);
      return json(res, 200, { ok: true, updatedAt: Date.now() });
    }
    return json(res, 405, { error: 'วิธีเรียกไม่ถูกต้อง' });
  }

  // ---------------- health ----------------
  if (parts[0] === 'health' && method === 'GET') {
    return json(res, 200, {
      ok: true, users: users.count(), uptime: Math.round(process.uptime()),
      openRegister: OPEN_REGISTER,
    });
  }

  return json(res, 404, { error: 'ไม่พบเส้นทางนี้' });
}

export { USERNAME_RE, MIN_PASSWORD };
