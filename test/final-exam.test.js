// ============================================================
//  ข้อสอบรวบยอด — ชุดสุดท้ายที่เปิดให้ทำเมื่อเรียนจบครบทุกบท
//
//  ตรรกะทั้งหมดอยู่ใน js/final-exam.js ซึ่งเป็นฟังก์ชันบริสุทธิ์
//  จึงทดสอบได้โดยไม่ต้องมีเบราว์เซอร์ และหน้าเว็บกับชุดทดสอบใช้ตัวเดียวกันจริง ๆ
//
//  สิ่งที่ต้องไม่พังเด็ดขาด
//    1. ล็อกจริง — ผู้เรียนที่ยังไม่ครบทุกบท/ยังไม่ถึง 90% ต้องเข้าไม่ได้
//    2. ครอบคลุมจริง — ข้อสอบต้องมาจากทุกหัวข้อทุกระดับ ไม่ใช่กระจุกอยู่หัวข้อเดียว
//    3. ไม่มีข้อซ้ำในชุดเดียวกัน
// ============================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { TRACKS } from '../data/tracks/index.js';
import { SURVIVAL_LABS } from '../data/labs/survival.js';
import {
  FINAL_COUNT, FINAL_UNLOCK_SCORE, FINAL_PASS_SCORE,
  buildFinalSet, finalReadiness, blockersByTrack, levelGroups,
} from '../js/final-exam.js';

/** ลำดับที่คาดเดาได้ — ใช้แทนการสุ่มเวลาต้องการผลเดิมทุกครั้ง */
const noShuffle = (a) => a.slice();

/** ความคืบหน้าของคนที่เรียนจบครบทุกบทด้วยคะแนน pct */
function perfectProgress(pct = 100) {
  const p = { xp: 0, read: {}, quiz: {}, labs: {} };
  for (const t of TRACKS) {
    for (const lv of Object.keys(t.levels)) {
      p.read[`${t.id}:${lv}`] = true;
      p.quiz[`${t.id}:${lv}`] = { best: pct, attempts: 1, passed: true, at: Date.now() };
      for (const lab of (t.levels[lv].labs || [])) p.labs[`${t.id}:${lab.id}`] = { done: true, best: 99, total: 99 };
    }
  }
  return p;
}

// ---------------- การออกข้อสอบ ----------------
test('ออกข้อสอบรวบยอดได้ครบ 50 ข้อ และไม่มีข้อซ้ำกันในชุดเดียว', () => {
  const set = buildFinalSet(TRACKS);
  assert.equal(set.length, FINAL_COUNT);
  assert.equal(new Set(set.map(q => q.q)).size, FINAL_COUNT, 'มีคำถามซ้ำในชุดเดียวกัน');
});

test('ทุกหัวข้อทุกระดับต้องมีคำถามโผล่มาอย่างน้อยหนึ่งข้อ', () => {
  const groups = levelGroups(TRACKS);
  assert.ok(groups.length <= FINAL_COUNT,
    `ตอนนี้มี ${groups.length} ระดับ แต่ข้อสอบออกแค่ ${FINAL_COUNT} ข้อ — ต้องเพิ่มจำนวนข้อ ไม่งั้นบางบทจะไม่ถูกวัดเลย`);
  // ทำซ้ำหลายรอบ เพราะการแจกข้อใช้การสุ่ม
  for (let round = 0; round < 20; round++) {
    const covered = new Set(buildFinalSet(TRACKS).map(q => `${q.track}:${q.level}`));
    assert.equal(covered.size, groups.length, 'มีระดับที่ไม่ถูกออกข้อสอบเลย');
  }
});

test('ทุกข้อต้องติดป้ายว่ามาจากหัวข้อและระดับไหน — หน้าสรุปผลใช้บอกว่าควรทบทวนเรื่องใด', () => {
  for (const q of buildFinalSet(TRACKS)) {
    assert.ok(q.track && q.trackName, `ข้อ "${String(q.q).slice(0, 40)}" ไม่มีชื่อหัวข้อกำกับ`);
    assert.ok(Number.isInteger(q.level) && q.level >= 1, 'ไม่มีเลขระดับกำกับ');
    assert.ok(['mcq', 'multi', 'cmd'].includes(q.type), `type "${q.type}" ใช้กับเครื่องเล่นข้อสอบไม่ได้`);
  }
});

test('ไม่เอาหมวดเอาชีวิตรอดมาออกข้อสอบ — หมวดนั้นวัดการลงมือทำ ไม่ใช่ความรู้ที่ถามเป็นข้อได้', () => {
  const svIds = new Set(SURVIVAL_LABS.map(l => l.id));
  const trackIds = new Set(TRACKS.map(t => t.id));
  for (const q of buildFinalSet(TRACKS)) {
    assert.ok(trackIds.has(q.track), `ข้อสอบมาจาก "${q.track}" ซึ่งไม่ใช่หัวข้อในหลักสูตร`);
    assert.ok(!svIds.has(q.track), 'มีข้อจากหมวดเอาชีวิตรอดหลุดเข้ามา');
  }
});

test('คลังเล็กกว่าจำนวนข้อที่ขอ ก็ต้องไม่ค้างเป็นลูปไม่รู้จบ', () => {
  const tiny = [{
    id: 'tiny', name: 'Tiny', icon: 'T',
    levels: { 1: { quiz: [{ type: 'mcq', q: 'ก', opts: ['a', 'b'], a: 0, why: 'w' }] } },
  }];
  const set = buildFinalSet(tiny, 50, noShuffle);
  assert.equal(set.length, 1);
});

// ---------------- เงื่อนไขปลดล็อก ----------------
test('ผู้เรียนที่ยังไม่เริ่ม ต้องถูกล็อกและเห็นว่าเหลือกี่บท', () => {
  const r = finalReadiness(null, TRACKS);
  assert.equal(r.ready, false);
  assert.equal(r.doneLevels, 0);
  assert.equal(r.totalLevels, levelGroups(TRACKS).length);
  assert.equal(r.blockers.length, r.totalLevels);
});

test('เรียนจบครบทุกบทด้วยคะแนนเต็ม ต้องปลดล็อก', () => {
  const r = finalReadiness(perfectProgress(100), TRACKS);
  assert.equal(r.ready, true, r.blockers.slice(0, 3).map(b => `${b.track} L${b.level}: ${b.miss}`).join(' | '));
  assert.equal(r.blockers.length, 0);
  assert.equal(r.doneLevels, r.totalLevels);
});

test(`สอบผ่านทุกบทแต่ได้แค่ ${FINAL_UNLOCK_SCORE - 1}% ยังต้องล็อกอยู่`, () => {
  const r = finalReadiness(perfectProgress(FINAL_UNLOCK_SCORE - 1), TRACKS);
  assert.equal(r.ready, false);
  assert.equal(r.blockers.length, r.totalLevels);
  assert.ok(r.blockers[0].miss.some(m => m.includes(`${FINAL_UNLOCK_SCORE}%`)),
    'ต้องบอกผู้เรียนให้ชัดว่าคะแนนยังไม่ถึงเกณฑ์');
});

test(`ได้พอดี ${FINAL_UNLOCK_SCORE}% ถือว่าผ่านเกณฑ์ — ขอบเขตต้องไม่กินเข้าไปหนึ่งหน่วย`, () => {
  assert.equal(finalReadiness(perfectProgress(FINAL_UNLOCK_SCORE), TRACKS).ready, true);
});

test('ขาดแค่บทเดียวก็ยังเข้าไม่ได้ และต้องชี้ได้ว่าบทไหน', () => {
  const p = perfectProgress(100);
  const t = TRACKS[2], lv = Object.keys(t.levels)[1];
  p.quiz[`${t.id}:${lv}`] = { best: 72, attempts: 4, passed: true, at: Date.now() };
  const r = finalReadiness(p, TRACKS);
  assert.equal(r.ready, false);
  assert.equal(r.blockers.length, 1);
  assert.equal(r.blockers[0].track, t.id);
  assert.equal(r.blockers[0].level, +lv);
  assert.equal(r.doneLevels, r.totalLevels - 1);
});

test('Lab ที่ยังทำไม่ครบก็กั้นไว้ ถึงจะสอบได้เต็มก็ตาม', () => {
  const p = perfectProgress(100);
  const withLab = TRACKS.flatMap(t => Object.entries(t.levels)
    .filter(([, d]) => (d.labs || []).length)
    .map(([lv, d]) => ({ t, lv: +lv, lab: d.labs[0] })))[0];
  assert.ok(withLab, 'ไม่มีระดับไหนมี Lab เลย — เงื่อนไขข้อนี้ทดสอบไม่ได้');
  delete p.labs[`${withLab.t.id}:${withLab.lab.id}`];
  const r = finalReadiness(p, TRACKS);
  assert.equal(r.ready, false);
  assert.ok(r.blockers.some(b => b.track === withLab.t.id && b.level === withLab.lv
    && b.miss.some(m => m.includes('Lab'))));
});

test('ยังไม่ได้อ่านบทเรียนก็ยังไม่ถือว่าเรียนจบบทนั้น', () => {
  const p = perfectProgress(100);
  const t = TRACKS[0];
  delete p.read[`${t.id}:1`];
  const r = finalReadiness(p, TRACKS);
  assert.equal(r.ready, false);
  assert.ok(r.blockers.some(b => b.track === t.id && b.level === 1 && b.miss.includes('ยังไม่ได้อ่านบทเรียน')));
});

test('รวมอุปสรรคเป็นรายหัวข้อได้ถูกต้อง — หน้าเว็บแสดงทีละหัวข้อ ไม่ใช่ไล่ 38 บรรทัด', () => {
  const grouped = blockersByTrack(finalReadiness(null, TRACKS).blockers);
  assert.equal(grouped.length, TRACKS.length);
  for (const g of grouped) {
    const t = TRACKS.find(x => x.id === g.track);
    assert.equal(g.levels.length, Object.keys(t.levels).length);
  }
});

// ---------------- เกณฑ์คะแนน ----------------
test('เกณฑ์ของข้อสอบรวบยอดต้องสูงกว่าแบบทดสอบท้ายบท ไม่งั้นก็ไม่ใช่ด่านสุดท้าย', async () => {
  const { PASS_SCORE } = await import('../data/levels.js');
  assert.ok(FINAL_PASS_SCORE > PASS_SCORE);
  assert.ok(FINAL_UNLOCK_SCORE > PASS_SCORE);
});
