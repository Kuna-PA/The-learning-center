// ============================================================
//  เนื้อหาต้องถูกโครงเสมอ — บทเรียน ข้อสอบ Lab
//  จับของที่ผิดตั้งแต่ตอน commit ไม่ใช่ตอนผู้เรียนกดเข้าไปเจอ
// ============================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { validateContent, contentStats } from './helpers/validate-content.js';
import { TRACKS, ALL_LABS, labById } from '../data/tracks/index.js';
import { LEVELS } from '../data/levels.js';

test('เนื้อหาทั้งระบบผ่านการตรวจโครงสร้าง', () => {
  assert.deepEqual(validateContent(), []);
});

test('ตัวเลขเนื้อหายังอยู่ในระดับที่ควรเป็น (กัน import หลุดทั้งไฟล์)', () => {
  const s = contentStats();
  assert.ok(s.tracks >= 6, `เหลือ ${s.tracks} หัวข้อ`);
  assert.ok(s.quiz >= 900, `เหลือข้อสอบ ${s.quiz} ข้อ`);
  assert.ok(s.labs >= 130, `เหลือ lab ${s.labs} ชุด`);
  assert.ok(s.survival >= 25, `เหลือเหตุการณ์เอาชีวิตรอด ${s.survival} ชุด`);
  console.log('   ' + JSON.stringify(s));
});

test('ทุก lab หาเจอด้วย labById (router ใช้เส้นทางนี้)', () => {
  for (const l of ALL_LABS) assert.ok(labById(l.track, l.id), `หา ${l.track}/${l.id} ไม่เจอ`);
});

test('ทุกระดับที่หัวข้อใช้ ต้องมีนิยามใน data/levels.js', () => {
  const known = new Set(LEVELS.map(l => l.n));
  for (const t of TRACKS) {
    for (const lv of Object.keys(t.levels).map(Number)) {
      // Cisco/Linux มี 6 ระดับ ส่วน LEVELS นิยามไว้ 5 — ระดับที่เกินต้องเป็นระดับสุดท้ายเท่านั้น
      if (!known.has(lv)) assert.equal(lv, Math.max(...Object.keys(t.levels).map(Number)),
        `${t.id} มีระดับ ${lv} ที่ไม่มีนิยามและไม่ใช่ระดับสุดท้าย`);
    }
  }
});

test('ข้อสอบมีมากพอให้สุ่มแล้วไม่ซ้ำเดิมทุกครั้ง', () => {
  const thin = [];
  for (const t of TRACKS) {
    for (const [lv, d] of Object.entries(t.levels)) {
      if ((d.quiz || []).length < 8) thin.push(`${t.id} L${lv}: ${(d.quiz || []).length} ข้อ`);
    }
  }
  assert.deepEqual(thin, [], 'ระดับที่มีข้อสอบน้อยกว่า 8 ข้อจะออกซ้ำเดิมทุกครั้ง');
});

// ---- โลโก้ · ตัวจูล่ง · ไอคอนของหัวข้อ ----
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

test('ทุกหัวข้อมีทั้งไอคอน SVG และ emoji สำรองสำหรับ dropdown', () => {
  for (const t of TRACKS) {
    assert.match(t.icon, /^<svg /, `${t.id}: icon ต้องเป็น SVG`);
    assert.match(t.icon, /class="ic"/, `${t.id}: SVG ต้องมีคลาส .ic ไม่งั้นขนาดจะไม่ตามที่วาง`);
    assert.ok(t.emoji && t.emoji.length <= 4, `${t.id}: ต้องมี emoji สำรอง (ใช้ใน <option>)`);
  }
});

test('ไฟล์รูปที่หน้าเว็บอ้างถึง มีอยู่จริงทุกไฟล์', () => {
  const files = ['index.html', 'sw.js', 'manifest.webmanifest', 'css/style.css',
    ...readdirSync(join(ROOT, 'js')).filter(f => f.endsWith('.js')).map(f => join('js', f)),
    join('js', 'julong.js')];
  const missing = [];
  for (const f of files) {
    const src = readFileSync(join(ROOT, f), 'utf8');
    for (const m of src.matchAll(/["'(](?:\.\/)?((?:assets\/)?[\w-]+\.(?:png|jpg|svg|webp))["')]/g)) {
      if (!existsSync(join(ROOT, m[1]))) missing.push(`${f} → ${m[1]}`);
    }
  }
  assert.deepEqual(missing, []);
});

/**
 * README โฆษณาตัวเลขเนื้อหาไว้ในตาราง "ภาพรวมเนื้อหา"
 * ถ้าเพิ่มข้อสอบหรือ Lab แล้วลืมแก้ README ตัวเลขจะเพี้ยนเงียบ ๆ จนไม่มีใครรู้
 * — เคยเพี้ยนมาแล้วจริง (เขียน 1,017 ข้อ ทั้งที่มี 1,025)
 * เทสต์นี้อ่านเลขจาก README มาเทียบกับของจริง แล้วบอกเลยว่าควรเป็นเท่าไร
 */
test('ตัวเลขในตาราง "ภาพรวมเนื้อหา" ของ README ตรงกับเนื้อหาจริง', () => {
  const md = readFileSync(join(ROOT, 'README.md'), 'utf8');
  const s = contentStats();
  const num = (label, re) => {
    const m = md.match(re);
    assert.ok(m, `หาบรรทัด "${label}" ใน README ไม่เจอ — ถ้าแก้หัวตารางแล้ว ต้องแก้ regex ในเทสต์นี้ด้วย`);
    return Number(m[1].replace(/,/g, ''));
  };
  const checks = [
    ['หัวข้อ', /\| Learning Path \(หัวข้อ\) \| \*\*([\d,]+)\*\*/, s.tracks],
    ['ข้อสอบ', /\| ข้อสอบ \| \*\*([\d,]+) ข้อ\*\*/, s.quiz],
    ['จำนวนชุดข้อสอบ', /\| ข้อสอบ \| \*\*[\d,]+ ข้อ\*\* \(([\d,]+) ชุด\)/, s.levels],
    ['Lab', /\| Lab ปกติ \| \*\*([\d,]+) ชุด/, s.labs],
    ['ขั้นตอนของ Lab', /\| Lab ปกติ \| \*\*[\d,]+ ชุด \/ ([\d,]+) ขั้นตอน/, s.labTasks],
    ['เหตุการณ์เอาชีวิตรอด', /\| Lab หมวดเอาชีวิตรอด \| \*\*([\d,]+) เหตุการณ์/, s.survival],
    ['ขั้นตอนเอาชีวิตรอด', /\| Lab หมวดเอาชีวิตรอด \| \*\*[\d,]+ เหตุการณ์ \/ ([\d,]+) ขั้นตอน/, s.survivalTasks],
  ];
  const wrong = checks
    .map(([label, re, real]) => ({ label, inReadme: num(label, re), real }))
    .filter(c => c.inReadme !== c.real);
  assert.deepEqual(wrong, [],
    'README ไม่ตรงกับเนื้อหาจริง — แก้ตัวเลขในตาราง "ภาพรวมเนื้อหา" ให้ตรงกับคอลัมน์ real');
});

/** จำนวน Lab ที่เป็นหน้าจอ GUI ก็โฆษณาไว้ใน README เหมือนกัน */
test('จำนวน Lab แบบหน้าจอ GUI ใน README ตรงกับของจริง', () => {
  const md = readFileSync(join(ROOT, 'README.md'), 'utf8');
  const m = md.match(/ในนั้นเป็น Lab หน้าจอ GUI ([\d,]+) ชุด/);
  assert.ok(m, 'หาจำนวน Lab GUI ใน README ไม่เจอ');
  const real = ALL_LABS.filter(l => l.device === 'windows-gui').length;
  assert.equal(Number(m[1].replace(/,/g, '')), real, `ของจริงมี Lab GUI ${real} ชุด`);
});
