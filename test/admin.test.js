// ============================================================
//  แดชบอร์ดผู้ดูแล และเนื้อหาที่ผู้ดูแลเพิ่มเอง
//  ตัวเลขบนแดชบอร์ดคือสิ่งที่หัวหน้าทีมใช้ตัดสินใจ ถ้าผิดแล้วไม่มีใครรู้ก็อันตรายกว่าไม่มี
// ============================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { TRACKS, ALL_LABS, rebuildAllLabs } from '../data/tracks/index.js';
import { SURVIVAL_LABS } from '../data/labs/survival.js';
import { summarise, overview, toCsv, levelPct } from '../js/admin-stats.js';
import { compileCheck, mergeCustom, validateCustom, sanitizeHtml, blankCustom } from '../data/custom.js';
import { createDevice } from '../js/devices/index.js';

const CONTENT = { tracks: TRACKS, allLabs: ALL_LABS, survivalLabs: SURVIVAL_LABS };
const track = TRACKS[0];
const firstLab = (track.levels[1].labs || [])[0];

// ---------------- สรุปความคืบหน้า ----------------
test('ผู้เรียนที่ยังไม่เริ่ม ต้องได้ 0 ทุกช่อง', () => {
  const s = summarise(null, CONTENT);
  assert.equal(s.pct, 0);
  assert.equal(s.xp, 0);
  assert.equal(s.quizPassed, 0);
  assert.equal(s.started, false);
  assert.equal(s.perTrack.length, TRACKS.length);
});

test('อ่านบทเรียน สอบผ่าน และทำ Lab แล้ว ตัวเลขต้องขยับตามสูตรเดียวกับหน้าผู้เรียน', () => {
  const progress = {
    xp: 120,
    read: { [`${track.id}:1`]: true },
    quiz: { [`${track.id}:1`]: { best: 90, attempts: 2, passed: true } },
    labs: firstLab ? { [`${track.id}:${firstLab.id}`]: { done: true } } : {},
  };
  const s = summarise(progress, CONTENT);
  const lv1 = s.perTrack[0].levels[0];

  assert.equal(lv1.read, true);
  assert.equal(lv1.passed, true);
  assert.equal(lv1.best, 90);
  assert.equal(s.quizPassed, 1);
  assert.ok(s.pct > 0);
  assert.equal(s.started, true);

  // อ่าน 30 + สอบผ่าน 40 + Lab ตามสัดส่วน 30
  const expect = 30 + 40 + Math.round((lv1.labsDone / lv1.labsTotal) * 30);
  assert.equal(levelPct(progress, track, 1), lv1.labsTotal ? expect : 100);
});

test('ภาพรวมนับคนที่ยังไม่เริ่ม และคนที่เข้าใช้ล่าสุดได้', () => {
  const now = Date.UTC(2026, 7, 23);
  const users = [
    { username: 'a', role: 'user', lastLogin: now - 2 * 86400000, progress: { xp: 500, read: { [`${track.id}:1`]: true }, quiz: {}, labs: {} } },
    { username: 'b', role: 'user', lastLogin: now - 40 * 86400000, progress: null },
    { username: 'admin', role: 'admin', lastLogin: now, progress: null },
  ];
  const o = overview(users, CONTENT, now);

  assert.equal(o.users, 3);
  assert.equal(o.learners, 2);
  assert.equal(o.active7, 2, 'a กับ admin เข้าใช้ใน 7 วัน');
  assert.equal(o.neverStarted, 1, 'b ยังไม่เริ่ม (admin ไม่ถูกนับเป็นผู้เรียน)');
  assert.equal(o.xpTotal, 500);
  assert.equal(o.perTrack.length, TRACKS.length);
  assert.equal(o.rows[0].user.username, 'a', 'เรียงคนที่คืบหน้ามากที่สุดขึ้นก่อน');
});

test('CSV มีหัวตารางครบและมีบรรทัดต่อผู้เรียนหนึ่งคน', () => {
  const users = [{ username: 'somchai', display: 'สมชาย, ทดสอบ', role: 'user', lastLogin: Date.now(), progress: { xp: 10 } }];
  const o = overview(users, CONTENT);
  const csv = toCsv(o.rows, CONTENT).split('\n');

  assert.match(csv[0], /^username,display,role/);
  assert.equal(csv.length, 2);
  assert.match(csv[1], /"สมชาย, ทดสอบ"/, 'ค่าที่มีจุลภาคต้องถูกครอบด้วยเครื่องหมายคำพูด');
  // ช่องที่มีจุลภาคถูกครอบด้วยเครื่องหมายคำพูดอยู่ ต้องแทนที่ก่อนถึงจะนับคอลัมน์ได้ตรง
  const cols = (line) => line.replace(/"([^"]|"")*"/g, 'X').split(',').length;
  assert.equal(cols(csv[1]), cols(csv[0]), 'จำนวนคอลัมน์ของข้อมูลต้องเท่ากับหัวตาราง');
});

// ---------------- เนื้อหาที่ผู้ดูแลเพิ่มเอง ----------------
test('กติกาตรวจ Lab ทำงานได้ทุกชนิด', () => {
  const linux = createDevice('linux', {});
  linux.exec('sudo systemctl start nginx');
  const history = ['sudo systemctl start nginx'];

  assert.equal(compileCheck([{ kind: 'ran', pattern: 'systemctl start nginx' }])(linux.state, history), true);
  assert.equal(compileCheck([{ kind: 'ran', pattern: 'systemctl stop nginx' }])(linux.state, history), false);
  assert.equal(compileCheck([{ kind: 'state', path: 'services.nginx.active', op: 'eq', value: 'true' }])(linux.state, history), true);
  assert.equal(compileCheck([{ kind: 'state', path: 'hostname', op: 'eq', value: 'srv01' }])(linux.state, history), true);
  assert.equal(compileCheck([{ kind: 'ranCount', pattern: 'systemctl', min: 2 }])(linux.state, history), false);
  assert.equal(compileCheck([{ kind: 'file', path: '/etc/hostname', contains: 'srv01' }])(linux.state, history), true);
  assert.equal(compileCheck([{ kind: 'file', path: '/etc/ไม่มีไฟล์นี้', contains: 'x' }])(linux.state, history), false);
  assert.equal(compileCheck([])(linux.state, history), false, 'ไม่มีกติกาเลยต้องไม่ผ่านเอง');
});

test('กติกาหลายข้อในขั้นเดียว ต้องผ่านครบทุกข้อ', () => {
  const linux = createDevice('linux', {});
  linux.exec('sudo systemctl start nginx');
  const both = compileCheck([
    { kind: 'ran', pattern: 'systemctl start nginx' },
    { kind: 'state', path: 'services.nginx.enabled', op: 'eq', value: 'true' },
  ]);
  assert.equal(both(linux.state, ['sudo systemctl start nginx']), false, 'ยังไม่ได้ enable จึงต้องไม่ผ่าน');
  linux.exec('sudo systemctl enable nginx');
  assert.equal(both(linux.state, ['sudo systemctl start nginx', 'sudo systemctl enable nginx']), true);
});

test('กติกาที่เขียน regex ผิด ต้องไม่ทำให้ทั้ง Lab พัง', () => {
  const linux = createDevice('linux', {});
  const check = compileCheck([{ kind: 'ran', pattern: 'ping [1.2.3' }]);
  assert.equal(check(linux.state, ['ping [1.2.3']), true, 'ตกไปเทียบแบบข้อความตรง ๆ แทน');
  assert.equal(check(linux.state, ['ping 8.8.8.8']), false);
});

test('HTML ที่ผู้ดูแลพิมพ์ ต้องถูกตัดส่วนที่รันสคริปต์ได้ออก', () => {
  const dirty = '<p onclick="alert(1)">ปกติ</p><script>alert(2)</script><a href="javascript:alert(3)">ลิงก์</a>';
  const clean = sanitizeHtml(dirty);
  assert.doesNotMatch(clean, /<script/i);
  assert.doesNotMatch(clean, /onclick/i);
  assert.doesNotMatch(clean, /javascript:/i);
  assert.match(clean, /ปกติ/, 'เนื้อหาปกติต้องอยู่ครบ');
});

test('ตัวตรวจเนื้อหาจับของที่กรอกไม่ครบได้', () => {
  const bad = {
    ...blankCustom(),
    sections: [{ id: 's1', track: 'ไม่มีหัวข้อนี้', level: 1, t: '', h: '' }],
    quiz: [{ id: 'q1', track: TRACKS[0].id, level: 1, type: 'mcq', q: 'ถาม', why: 'เพราะ', opts: ['a'], a: 5 }],
    labs: [{ id: 'l1', track: TRACKS[0].id, level: 1, title: '', device: 'linux', tasks: [] }],
  };
  const problems = validateCustom(bad, { tracks: TRACKS });
  assert.ok(problems.length >= 4, 'ต้องรายงานปัญหาทุกจุด: ' + JSON.stringify(problems));
  assert.equal(validateCustom(blankCustom(), { tracks: TRACKS }).length, 0);
});

test('เนื้อหาที่เพิ่มเองถูก merge เข้าไปในหัวข้อเดิม และ Lab ที่เพิ่มเล่นได้จริง', () => {
  // ทำสำเนา TRACKS ระดับที่ต้องใช้ เพื่อไม่ให้เทสต์อื่นได้รับผลกระทบ
  const target = TRACKS.find(t => t.id === 'linux');
  const before = {
    sections: (target.levels[1].sections || []).length,
    quiz: (target.levels[1].quiz || []).length,
    labs: (target.levels[1].labs || []).length,
  };

  mergeCustom(TRACKS, {
    ...blankCustom(),
    sections: [{ id: 's1', track: 'linux', level: 1, t: 'บทเรียนใหม่', h: '<p>เนื้อหา</p>' }],
    quiz: [{ id: 'q1', track: 'linux', level: 1, type: 'mcq', q: 'ถาม?', opts: ['ก', 'ข'], a: 1, why: 'เพราะ' }],
    labs: [{
      id: 'custom-lab-1', track: 'linux', level: 1, title: 'Lab ที่ผู้ดูแลสร้าง', device: 'linux',
      brief: 'ลองดู',
      tasks: [{ t: 'เริ่ม nginx', hint: 'sudo systemctl start nginx', rules: [{ kind: 'state', path: 'services.nginx.active', op: 'eq', value: 'true' }] }],
    }],
  });
  rebuildAllLabs();

  assert.equal((target.levels[1].sections || []).length, before.sections + 1);
  assert.equal((target.levels[1].quiz || []).length, before.quiz + 1);
  assert.equal((target.levels[1].labs || []).length, before.labs + 1);

  const lab = ALL_LABS.find(l => l.id === 'custom-lab-1');
  assert.ok(lab, 'Lab ที่เพิ่มเองต้องอยู่ในรายการ Lab ทั้งหมด');

  const dev = createDevice(lab.device, lab.init || {});
  assert.equal(lab.tasks[0].check(dev.state, []), false, 'ยังไม่ได้ทำ ต้องยังไม่ผ่าน');
  dev.exec('sudo systemctl start nginx');
  assert.equal(lab.tasks[0].check(dev.state, ['sudo systemctl start nginx']), true, 'ทำตามคำใบ้แล้วต้องผ่าน');
});
