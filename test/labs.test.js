// ============================================================
//  Lab ทุกชุดต้อง "เล่นจนจบได้ด้วยคำใบ้ของตัวเอง"
//  นี่คือชุดทดสอบที่กันของพังตอนแก้ emulator — แก้ regex ผิดตัวเดียว
//  lab หลายสิบชุดจะพังเงียบ ๆ จนกว่าผู้เรียนจะไปเจอเอง
// ============================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { cliLabs, guiLabs, solveLab, hintCommands } from './helpers/lab-runner.js';
import { runGuiScript } from './helpers/gui-runner.js';
import { GUI_SOLUTIONS } from './helpers/gui-solutions.js';

const labs = cliLabs();

test('มี Lab แบบ CLI ให้ทดสอบจริง', () => {
  assert.ok(labs.length > 100, `เจอแค่ ${labs.length} ชุด — น่าจะ import ไม่ครบ`);
});

for (const lab of labs) {
  test(`[${lab.track} L${lab.level}] ${lab.id} — ทำตามคำใบ้แล้วผ่านครบทุกข้อ`, () => {
    const r = solveLab(lab);
    assert.deepEqual(r.crashes, [], `emulator พังระหว่างเล่น lab นี้`);
    assert.deepEqual(
      r.failedTasks.map(i => `#${i + 1} ${lab.tasks[i].t.replace(/<[^>]+>/g, '')}`), [],
      'ทำตามคำใบ้ทุกข้อแล้วยังมี task ที่ไม่ผ่าน — คำใบ้กับ check ไม่ตรงกัน');
  });
}

// ---- พิมพ์ผิดต้องไม่ผ่าน ----
// ถ้าคำสั่งที่พิมพ์ผิดยังนับว่าผ่าน ผู้เรียนจะได้ใบประกาศโดยไม่เคยสั่งอะไรถูกเลย
test('คำสั่งที่พิมพ์ผิดต้องไม่ทำให้ task ผ่าน', () => {
  const broken = [];
  for (const lab of labs) {
    const typo = {
      ...lab,
      tasks: lab.tasks.map(t => ({
        ...t,
        hint: hintCommands(t.hint).map(c => 'zz' + c).join(' → '),
      })),
    };
    const r = solveLab(typo);
    const passed = r.done.filter(Boolean).length;
    // บาง task ผ่านตั้งแต่สถานะเริ่มต้น (เช่น "ตรวจสอบว่ายังไม่ได้ตั้งค่า") จึงเทียบกับ baseline
    const base = solveLab({ ...lab, tasks: lab.tasks.map(t => ({ ...t, hint: '' })) })
      .done.filter(Boolean).length;
    if (passed > base) broken.push(`${lab.id}: ผ่าน ${passed} ข้อทั้งที่พิมพ์ผิดหมด (ควรได้แค่ ${base})`);
  }
  assert.deepEqual(broken, []);
});

// ---- Lab แบบ GUI ----
const gui = guiLabs();

test('Lab GUI ทุกชุดมีโครงที่รันได้ และ check ไม่พังกับสถานะเริ่มต้น', () => {
  for (const lab of gui) {
    const r = runGuiScript(lab, []);
    assert.deepEqual(r.problems, [], `${lab.id}: check พังตั้งแต่ยังไม่ได้คลิกอะไร`);
  }
});

for (const [id, script] of Object.entries(GUI_SOLUTIONS)) {
  test(`[gui] ${id} — คลิกตามลำดับแล้วผ่านครบทุกข้อ`, () => {
    const lab = gui.find(l => l.id === id);
    assert.ok(lab, `ไม่มี lab id "${id}" แล้ว — ลบสคริปต์ทิ้งหรือแก้ id ใน gui-solutions.js`);
    const r = runGuiScript(lab, script);
    assert.deepEqual(r.problems, []);
    assert.deepEqual(r.failedTasks, [], 'คลิกครบตามสคริปต์แล้วยังมี task ไม่ผ่าน');
  });
}

test('รายงานว่า Lab GUI ชุดไหนยังไม่มีสคริปต์ทดสอบ', () => {
  const missing = gui.filter(l => !GUI_SOLUTIONS[l.id]).map(l => l.id);
  if (missing.length) console.log(`   ยังไม่มีสคริปต์: ${missing.join(', ')}`);
  assert.ok(true);
});
