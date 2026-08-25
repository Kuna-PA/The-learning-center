// ============================================================
//  เซิร์ฟเวอร์ต้องกันของสำคัญได้จริง แม้จะยิง API ตรงโดยไม่ผ่านหน้าเว็บ
//  ทุกเคสในนี้คือสิ่งที่ "หน้าจอกันให้ไม่ได้"
// ============================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { startServer, client } from './helpers/server.js';

test('สถานะเซิร์ฟเวอร์และไฟล์ที่ห้ามเสิร์ฟ', async (t) => {
  const srv = await startServer();
  t.after(() => srv.stop());
  const c = client(srv.base);

  const h = await c.req('GET', '/api/health');
  assert.equal(h.status, 200);
  assert.equal(h.data.ok, true);

  await t.test('หน้าเว็บมี security header ครบ', async () => {
    const r = await c.req('GET', '/index.html');
    assert.equal(r.status, 200);
    assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(r.headers.get('x-frame-options'), 'DENY');
    const csp = r.headers.get('content-security-policy') || '';
    assert.ok(csp.includes("script-src 'self'"), 'CSP ต้องจำกัดสคริปต์ไว้ที่ของตัวเอง');
    assert.ok(csp.includes("frame-ancestors 'none'"), 'CSP ต้องกันไม่ให้ถูกฝังใน iframe');
  });

  await t.test('โค้ดฝั่งเซิร์ฟเวอร์ ฐานข้อมูล และชุดทดสอบ ต้องไม่ถูกเสิร์ฟออกไป', async () => {
    const blocked = ['/server/db.js', '/server/auth.js', '/data-db/learning-center.db',
      '/test/api.test.js', '/scripts/validate-content.mjs'];
    for (const p of blocked) {
      const r = await c.req('GET', p);
      assert.equal(r.status, 403, p + ' ต้องถูกปฏิเสธ แต่ได้ ' + r.status);
    }
  });
});

test('บัญชีและเซสชัน', async (t) => {
  const srv = await startServer();
  t.after(() => srv.stop());
  const c = client(srv.base);

  await t.test('สมัครแล้วได้คุกกี้ที่สคริปต์อ่านไม่ได้', async () => {
    const r = await c.req('POST', '/api/auth/register', { username: 'somchai', password: 'pass12345', display: 'สมชาย' });
    assert.equal(r.status, 201);
    const cookie = r.setCookie.join(';');
    assert.match(cookie, /HttpOnly/i);
    assert.match(cookie, /SameSite=Lax/i);
    assert.doesNotMatch(cookie, /Secure/i, 'ต่อผ่าน http ธรรมดาไม่ควรติด Secure ไม่งั้นเบราว์เซอร์ทิ้งคุกกี้');
  });

  await t.test('รหัสผ่านสั้นเกินไปต้องไม่ผ่าน', async () => {
    const r = await c.req('POST', '/api/auth/register', { username: 'sanchai', password: 'sh0rt' });
    assert.equal(r.status, 400);
  });

  await t.test('ข้อความตอบตอนล็อกอินพลาด ต้องไม่บอกว่ามีชื่อนี้ในระบบไหม', async () => {
    const c2 = client(srv.base);
    const noUser = await c2.req('POST', '/api/auth/login', { username: 'ghost', password: 'whatever1' });
    const wrongPw = await c2.req('POST', '/api/auth/login', { username: 'somchai', password: 'wrongpass1' });
    assert.equal(noUser.status, 401);
    assert.equal(wrongPw.status, 401);
    assert.equal(noUser.data.error, wrongPw.data.error);
  });

  await t.test('ใส่รหัสผิดรัว ๆ ต้องโดนล็อก', async () => {
    const c2 = client(srv.base);
    let locked = false;
    for (let i = 0; i < 12; i++) {
      const r = await c2.req('POST', '/api/auth/login', { username: 'somchai', password: 'nope' + i });
      const msg = (r.data && r.data.error) || '';
      if (/ลองใหม่ใน/.test(msg)) { locked = true; break; }
    }
    assert.ok(locked, 'ยิงรหัสผิด 12 ครั้งแล้วยังไม่โดนล็อก');
  });

  await t.test('เปลี่ยนรหัสผ่านตัวเองต้องยืนยันรหัสเดิม', async () => {
    const me = client(srv.base);
    await me.req('POST', '/api/auth/register', { username: 'nuch', password: 'pass12345' });
    const noOld = await me.req('POST', '/api/auth/password', { newPass: 'newpass12345' });
    assert.equal(noOld.status, 400, 'ไม่ส่งรหัสเดิมมาก็เปลี่ยนได้ = ยืมเครื่องที่ล็อกอินค้างไว้แล้วยึดบัญชีได้');
    const ok = await me.req('POST', '/api/auth/password', { oldPass: 'pass12345', newPass: 'newpass12345' });
    assert.equal(ok.status, 200);
  });
});

test('ความคืบหน้าเป็นของใครของมัน', async (t) => {
  const srv = await startServer();
  t.after(() => srv.stop());

  const anon = client(srv.base);
  assert.equal((await anon.req('GET', '/api/progress')).status, 401);

  const u = client(srv.base);
  await u.req('POST', '/api/auth/register', { username: 'ploy', password: 'pass12345' });
  const saved = await u.req('PUT', '/api/progress', { data: { xp: 120, labs: { 'linux:l1': { done: true } } } });
  assert.equal(saved.status, 200);
  const got = await u.req('GET', '/api/progress');
  assert.equal(got.data.data.xp, 120);

  await t.test('ผู้ใช้ธรรมดาแตะเส้นทางของ admin ไม่ได้', async () => {
    assert.equal((await u.req('GET', '/api/admin/users')).status, 403);
    assert.equal((await u.req('DELETE', '/api/admin/progress/ploy')).status, 403);
  });

  await t.test('ก้อนความคืบหน้าที่ใหญ่ผิดปกติต้องถูกปฏิเสธ', async () => {
    const labs = {};
    for (let i = 0; i < 5001; i++) labs['x' + i] = { done: true };
    assert.equal((await u.req('PUT', '/api/progress', { data: { xp: 1, labs } })).status, 400);
  });
});

test('บัญชีที่ผู้ดูแลตั้งรหัสให้ ต้องเปลี่ยนรหัสก่อนใช้งาน', async (t) => {
  const srv = await startServer();
  t.after(() => srv.stop());

  const admin = client(srv.base);
  const login = await admin.req('POST', '/api/auth/login', { username: 'admin', password: srv.adminPass });
  assert.equal(login.status, 200);
  assert.equal(login.data.user.mustChange, true, 'admin ที่เพิ่งสร้างต้องติดธงให้เปลี่ยนรหัส');

  await t.test('admin ที่ยังไม่เปลี่ยนรหัส ก็ยังทำอะไรไม่ได้', async () => {
    const r = await admin.req('GET', '/api/admin/users');
    assert.equal(r.status, 403);
    assert.equal(r.data.code, 'must_change');
  });

  await admin.req('POST', '/api/auth/password', { oldPass: srv.adminPass, newPass: 'admin-new-98765' });
  assert.equal((await admin.req('GET', '/api/admin/users')).status, 200);

  await t.test('ผู้ใช้ที่ admin สร้าง ต้องเปลี่ยนรหัสก่อนถึงจะบันทึกความคืบหน้าได้', async () => {
    const created = await admin.req('POST', '/api/admin/users', { username: 'newbie', password: 'temp12345', display: 'น้องใหม่' });
    assert.equal(created.status, 201);

    const u = client(srv.base);
    const li = await u.req('POST', '/api/auth/login', { username: 'newbie', password: 'temp12345' });
    assert.equal(li.data.user.mustChange, true);
    const blocked = await u.req('PUT', '/api/progress', { data: { xp: 5 } });
    assert.equal(blocked.status, 403);
    assert.equal(blocked.data.code, 'must_change');

    const changed = await u.req('POST', '/api/auth/password', { oldPass: 'temp12345', newPass: 'mine-98765' });
    assert.equal(changed.status, 200);
    assert.equal((await u.req('PUT', '/api/progress', { data: { xp: 5 } })).status, 200);
  });

  await t.test('admin รีเซ็ตรหัสให้ใคร คนนั้นต้องเปลี่ยนรหัสอีกครั้ง', async () => {
    assert.equal((await admin.req('PATCH', '/api/admin/user/newbie', { password: 'reset-12345' })).status, 200);
    const u = client(srv.base);
    const li = await u.req('POST', '/api/auth/login', { username: 'newbie', password: 'reset-12345' });
    assert.equal(li.data.user.mustChange, true);
    assert.equal((await u.req('GET', '/api/progress')).status, 403);
  });
});

test('ปิดรับสมัครเองได้ด้วย LC_OPEN_REGISTER=0', async (t) => {
  const srv = await startServer({ LC_OPEN_REGISTER: '0' });
  t.after(() => srv.stop());
  const c = client(srv.base);

  assert.equal((await c.req('GET', '/api/health')).data.openRegister, false);
  const r = await c.req('POST', '/api/auth/register', { username: 'outsider', password: 'pass12345' });
  assert.equal(r.status, 403);
});

test('บังคับคุกกี้ Secure ได้เมื่ออยู่หลัง HTTPS', async (t) => {
  const srv = await startServer({ LC_SECURE_COOKIE: '1' });
  t.after(() => srv.stop());
  const c = client(srv.base);
  const r = await c.req('POST', '/api/auth/register', { username: 'secured', password: 'pass12345' });
  assert.match(r.setCookie.join(';'), /Secure/i);
});

test('เนื้อหาที่ผู้ดูแลเพิ่มเอง — เก็บรูปที่ฝังมาไว้ และตัดรูปที่ที่มาไม่ถูกต้องทิ้ง', async (t) => {
  const srv = await startServer();
  t.after(() => srv.stop());

  const admin = client(srv.base);
  await admin.req('POST', '/api/auth/login', { username: 'admin', password: srv.adminPass });
  await admin.req('POST', '/api/auth/password', { oldPass: srv.adminPass, newPass: 'admin-new-98765' });

  const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==';
  const payload = {
    version: 1,
    sections: [{ id: 's1', track: 'linux', level: 1, t: 'มีรูป', h: '<p>[[รูป 1]]</p>', imgs: [png, 'javascript:alert(1)'] }],
    quiz: [{ id: 'q1', track: 'linux', level: 1, type: 'mcq', q: 'ถาม', why: 'เพราะ', opts: ['ก', 'ข'], a: 0, img: png }],
    labs: [{
      id: 'l1', track: 'linux', level: 1, title: 'Lab', device: 'linux', img: 'http://evil/x.png',
      tasks: [{ t: 'ทำ', hint: 'ls', rules: [{ kind: 'ran', pattern: 'ls' }] }],
    }],
  };
  assert.equal((await admin.req('PUT', '/api/content', { data: payload })).status, 200);

  const got = (await admin.req('GET', '/api/content')).data.data;
  assert.deepEqual(got.sections[0].imgs, [png], 'รูปที่ที่มาไม่ถูกต้องต้องถูกตัดทิ้ง');
  assert.equal(got.quiz[0].img, png);
  assert.equal(got.labs[0].img, '', 'ลิงก์ http ธรรมดาต้องไม่ถูกเก็บ');

  await t.test('ผู้เรียนอ่านเนื้อหาได้ แต่เขียนไม่ได้', async () => {
    const u = client(srv.base);
    await u.req('POST', '/api/auth/register', { username: 'learner', password: 'pass12345' });
    assert.equal((await u.req('GET', '/api/content')).status, 200);
    assert.equal((await u.req('PUT', '/api/content', { data: payload })).status, 403);
  });

  await t.test('คนที่ยังไม่ล็อกอิน อ่านเนื้อหาไม่ได้', async () => {
    const anon = client(srv.base);
    assert.equal((await anon.req('GET', '/api/content')).status, 401);
  });
});
