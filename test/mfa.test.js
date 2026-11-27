// ============================================================
//  ยืนยันสองขั้นตอน (TOTP) และข้อมูลประจำตัวของผู้ใช้
//
//  TOTP เขียนเองเพราะโปรเจกต์ไม่มี dependency — จึงต้องยันกับเวกเตอร์ทดสอบ
//  ของ RFC 4226/6238 ตรง ๆ ถ้าคลาดไปแม้แต่หลักเดียว แอป authenticator
//  ในมือถือจะใช้ร่วมกันไม่ได้เลย และไม่มีทางรู้จนกว่าจะมีคนลองใช้จริง
// ============================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { startServer, client } from './helpers/server.js';
import {
  base32Encode, base32Decode, hotp, totp, verifyTotp, newSecret, otpauthUri, prettySecret,
} from '../server/totp.js';

const RFC_KEY = base32Encode(Buffer.from('12345678901234567890'));

// ---------------- ตัวเลขต้องตรงกับสเปก ----------------
test('HOTP ตรงกับเวกเตอร์ทดสอบทั้ง 10 ตัวของ RFC 4226', () => {
  const want = ['755224', '287082', '359152', '969429', '338314',
    '254676', '287922', '162583', '399871', '520489'];
  assert.deepEqual(want.map((_, i) => hotp(RFC_KEY, i)), want);
});

test('TOTP ตรงกับเวกเตอร์ทดสอบของ RFC 6238 (SHA-1)', () => {
  const vec = [[59, '94287082'], [1111111109, '07081804'], [1111111111, '14050471'],
    [1234567890, '89005924'], [2000000000, '69279037'], [20000000000, '65353130']];
  for (const [sec, want] of vec) {
    assert.equal(totp(RFC_KEY, { t: sec * 1000, digits: 8 }), want, `T=${sec}`);
  }
});

test('base32 แปลงไป-กลับได้ และรับกุญแจที่ผู้ใช้ก๊อปมาพร้อมช่องว่าง', () => {
  for (const txt of ['', 'a', 'ab', 'abc', 'abcd', 'abcde', 'hello world', '12345678901234567890']) {
    assert.equal(base32Decode(base32Encode(Buffer.from(txt))).toString(), txt, txt);
  }
  const key = newSecret();
  assert.deepEqual(base32Decode(prettySecret(key)), base32Decode(key), 'เว้นวรรคแล้วต้องถอดได้เหมือนกัน');
  assert.throws(() => base32Decode('1189!!'), /base32/, 'อักขระนอกชุดต้องฟ้อง');
});

test('ยอมให้นาฬิกาคลาด ±1 ช่วง แต่ไม่เกินนั้น', () => {
  const key = newSecret();
  const t = 1700000000000;
  assert.equal(verifyTotp(key, totp(key, { t }), { t }), true, 'ช่วงปัจจุบัน');
  assert.equal(verifyTotp(key, totp(key, { t: t - 30000 }), { t }), true, 'ช้าไป 30 วินาที');
  assert.equal(verifyTotp(key, totp(key, { t: t + 30000 }), { t }), true, 'เร็วไป 30 วินาที');
  assert.equal(verifyTotp(key, totp(key, { t: t - 90000 }), { t }), false, 'ช้าไป 90 วินาที ต้องไม่ผ่าน');
  assert.equal(verifyTotp(key, totp(key, { t: t + 90000 }), { t }), false, 'เร็วไป 90 วินาที ต้องไม่ผ่าน');
});

test('รหัสที่รูปแบบผิดต้องไม่ผ่าน โดยไม่ต้องไปคำนวณอะไร', () => {
  const key = newSecret();
  for (const bad of ['', '12345', '1234567', 'abcdef', null, undefined, '12 34 56 78']) {
    assert.equal(verifyTotp(key, bad), false, JSON.stringify(bad));
  }
});

test('otpauth URI มีครบทุกค่าที่แอป authenticator ต้องใช้', () => {
  const uri = otpauthUri({ user: 'somchai', secret: 'JBSWY3DPEHPK3PXP' });
  const u = new URL(uri);
  assert.equal(u.protocol, 'otpauth:');
  assert.equal(decodeURIComponent(u.pathname), '/ASD ACADEMY:somchai');
  assert.equal(u.searchParams.get('secret'), 'JBSWY3DPEHPK3PXP');
  assert.equal(u.searchParams.get('algorithm'), 'SHA1');
  assert.equal(u.searchParams.get('digits'), '6');
  assert.equal(u.searchParams.get('period'), '30');
});

// ---------------- เส้นทาง API ----------------
test('ตั้งและใช้งานยืนยันสองขั้นตอนได้ครบวงจร', async (t) => {
  const srv = await startServer();
  t.after(() => srv.stop());

  const u = client(srv.base);
  await u.req('POST', '/api/auth/register', { username: 'somchai', password: 'pass12345' });

  await t.test('แก้ข้อมูลประจำตัวของตัวเองได้', async () => {
    const r = await u.req('PATCH', '/api/auth/profile',
      { display: 'สมชาย ใจดี', email: 'somchai@dits.co.th', empId: 'EMP-00123' });
    assert.equal(r.status, 200);
    assert.equal(r.data.user.email, 'somchai@dits.co.th');
    assert.equal(r.data.user.empId, 'EMP-00123');
    assert.equal(r.data.user.mfaEnabled, false);
  });

  await t.test('อีเมลผิดรูปแบบต้องไม่ถูกบันทึก', async () => {
    assert.equal((await u.req('PATCH', '/api/auth/profile', { email: 'ไม่ใช่อีเมล' })).status, 400);
    assert.equal((await u.req('GET', '/api/auth/me')).data.user.email, 'somchai@dits.co.th', 'ของเดิมต้องไม่ถูกแตะ');
  });

  let secret = null;
  await t.test('ขอกุญแจแล้วยังไม่เปิดใช้จนกว่าจะยืนยันด้วยรหัสจริง', async () => {
    const r = await u.req('POST', '/api/auth/mfa/setup');
    assert.equal(r.status, 200);
    secret = r.data.secret;
    assert.match(secret, /^[A-Z2-7]{32}$/, 'กุญแจ 160 บิตเป็น base32 32 ตัว');
    assert.equal((await u.req('GET', '/api/auth/me')).data.user.mfaEnabled, false,
      'ขอกุญแจเฉย ๆ ต้องยังไม่เปิดใช้ ไม่งั้นผู้ใช้จะล็อกตัวเองออกจากระบบ');

    assert.equal((await u.req('POST', '/api/auth/mfa/enable', { code: '000000' })).status, 400);
    assert.equal((await u.req('GET', '/api/auth/me')).data.user.mfaEnabled, false);

    assert.equal((await u.req('POST', '/api/auth/mfa/enable', { code: totp(secret) })).status, 200);
    assert.equal((await u.req('GET', '/api/auth/me')).data.user.mfaEnabled, true);
  });

  await t.test('ล็อกอินต้องผ่านสองขั้น และขั้นแรกยังไม่ได้เซสชัน', async () => {
    const fresh = client(srv.base);
    const first = await fresh.req('POST', '/api/auth/login', { username: 'somchai', password: 'pass12345' });
    assert.equal(first.status, 200);
    assert.equal(first.data.mfaRequired, true);
    assert.ok(first.data.pending);
    assert.equal(first.data.user, undefined, 'ห้ามส่งข้อมูลผู้ใช้กลับมาก่อนผ่านขั้นที่สอง');
    assert.equal((await fresh.req('GET', '/api/auth/me')).data.user, null, 'ยังต้องไม่มีเซสชัน');

    assert.equal((await fresh.req('POST', '/api/auth/login-mfa',
      { pending: first.data.pending, code: '123456' })).status, 401, 'รหัสผิดต้องไม่ผ่าน');

    const second = await fresh.req('POST', '/api/auth/login-mfa',
      { pending: first.data.pending, code: totp(secret) });
    assert.equal(second.status, 200);
    assert.equal(second.data.user.username, 'somchai');
    assert.equal((await fresh.req('GET', '/api/auth/me')).data.user.username, 'somchai');
  });

  await t.test('pending ปลอมหรือหมดอายุต้องไม่ผ่าน', async () => {
    const fresh = client(srv.base);
    const r = await fresh.req('POST', '/api/auth/login-mfa', { pending: 'ไม่มีจริง', code: totp(secret) });
    assert.equal(r.status, 401);
    assert.equal(r.data.expired, true, 'ต้องบอกหน้าเว็บได้ว่าให้กลับไปเริ่มที่หน้าล็อกอิน');
  });

  await t.test('ปิดเองต้องยืนยันด้วยรหัสผ่าน', async () => {
    assert.equal((await u.req('POST', '/api/auth/mfa/disable', { password: 'ผิดแน่นอน' })).status, 400);
    assert.equal((await u.req('GET', '/api/auth/me')).data.user.mfaEnabled, true);
    assert.equal((await u.req('POST', '/api/auth/mfa/disable', { password: 'pass12345' })).status, 200);
    assert.equal((await u.req('GET', '/api/auth/me')).data.user.mfaEnabled, false);
    // ปิดแล้วล็อกอินด้วยรหัสผ่านอย่างเดียวต้องได้เลย
    const fresh = client(srv.base);
    const r = await fresh.req('POST', '/api/auth/login', { username: 'somchai', password: 'pass12345' });
    assert.equal(r.data.mfaRequired, undefined);
    assert.equal(r.data.user.username, 'somchai');
  });
});

test('ผู้ดูแลแก้ข้อมูลผู้เรียนและปิด MFA ให้ได้ตอนทำมือถือหาย', async (t) => {
  const srv = await startServer();
  t.after(() => srv.stop());

  const u = client(srv.base);
  await u.req('POST', '/api/auth/register', { username: 'ploy', password: 'pass12345' });
  const secret = (await u.req('POST', '/api/auth/mfa/setup')).data.secret;
  await u.req('POST', '/api/auth/mfa/enable', { code: totp(secret) });

  const admin = client(srv.base);
  await admin.req('POST', '/api/auth/login', { username: 'admin', password: srv.adminPass });
  await admin.req('POST', '/api/auth/password', { oldPass: srv.adminPass, newPass: 'admin-new-98765' });

  await t.test('แก้ชื่อ อีเมล รหัสพนักงาน พร้อมกันได้', async () => {
    const r = await admin.req('PATCH', '/api/admin/user/ploy',
      { display: 'พลอย สดใส', email: 'ploy@dits.co.th', empId: 'EMP-00456' });
    assert.equal(r.status, 200);
    assert.equal(r.data.user.display, 'พลอย สดใส');
    assert.equal(r.data.user.email, 'ploy@dits.co.th');
    assert.equal(r.data.user.empId, 'EMP-00456');
  });

  await t.test('อีเมลผิดรูปแบบต้องถูกปฏิเสธทั้งคำขอ', async () => {
    assert.equal((await admin.req('PATCH', '/api/admin/user/ploy',
      { display: 'ชื่อใหม่', email: 'abc' })).status, 400);
    const got = (await admin.req('GET', '/api/admin/users')).data.users.find(x => x.username === 'ploy');
    assert.equal(got.display, 'พลอย สดใส', 'ของเดิมต้องไม่ถูกแก้บางส่วน');
  });

  await t.test('รายชื่อผู้ใช้ที่ผู้ดูแลเห็น ต้องมีอีเมลและสถานะ MFA แต่ห้ามมีกุญแจ', async () => {
    const got = (await admin.req('GET', '/api/admin/users')).data.users.find(x => x.username === 'ploy');
    assert.equal(got.email, 'ploy@dits.co.th');
    assert.equal(got.empId, 'EMP-00456');
    assert.equal(got.mfaEnabled, true);
    assert.equal(got.mfaSecret, undefined);
    assert.equal(got.mfa_secret, undefined);
  });

  await t.test('ผู้เรียนปิด MFA ของคนอื่นไม่ได้', async () => {
    assert.equal((await u.req('PATCH', '/api/admin/user/ploy', { mfaEnabled: false })).status, 403);
  });

  await t.test('ผู้ดูแลปิดให้ได้ แล้วเจ้าตัวล็อกอินด้วยรหัสผ่านอย่างเดียว', async () => {
    assert.equal((await admin.req('PATCH', '/api/admin/user/ploy', { mfaEnabled: false })).status, 200);
    const fresh = client(srv.base);
    const r = await fresh.req('POST', '/api/auth/login', { username: 'ploy', password: 'pass12345' });
    assert.equal(r.data.mfaRequired, undefined);
    assert.equal(r.data.user.username, 'ploy');
  });
});
