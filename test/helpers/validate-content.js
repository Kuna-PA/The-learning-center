// ============================================================
//  ตัวตรวจความถูกต้องของ "เนื้อหา" — บทเรียน ข้อสอบ Lab
//  ใช้ทั้งใน `npm test` และ `npm run validate`
//  หน้าที่ของมันคือจับของที่ผิดตั้งแต่ตอน commit ไม่ใช่ตอนผู้เรียนเจอ
// ============================================================
import { TRACKS } from '../../data/tracks/index.js';
import { SURVIVAL_LABS } from '../../data/labs/survival.js';
import { DEVICE_LABELS } from '../../js/devices/index.js';

const DIFFICULTIES = ['easy', 'medium', 'hard', 'insane'];
const QUIZ_TYPES = ['mcq', 'multi', 'cmd'];
const isStr = v => typeof v === 'string' && v.trim() !== '';
const isFn = v => typeof v === 'function';

/** ตรวจ lab หนึ่งชุด — ใช้ร่วมกันทั้ง lab ปกติและหมวดเอาชีวิตรอด */
function checkLab(lab, where, problems) {
  const at = m => problems.push(`${where} · ${m}`);
  if (!isStr(lab.id)) at('lab ไม่มี id');
  if (!isStr(lab.title)) at(`lab ${lab.id}: ไม่มี title`);
  if (!isStr(lab.brief) && !isStr(lab.story)) at(`lab ${lab.id}: ไม่มี brief/story`);
  if (!DEVICE_LABELS[lab.device]) at(`lab ${lab.id}: device "${lab.device}" ไม่มีใน DEVICE_LABELS`);
  if (!Array.isArray(lab.tasks) || !lab.tasks.length) { at(`lab ${lab.id}: ไม่มี tasks`); return; }
  lab.tasks.forEach((t, i) => {
    const n = `lab ${lab.id} task #${i + 1}`;
    if (!isStr(t.t)) at(`${n}: ไม่มีคำอธิบายสิ่งที่ต้องทำ`);
    if (!isStr(t.hint)) at(`${n}: ไม่มีคำใบ้ — ผู้เรียนที่ติดจะไม่มีทางไปต่อ`);
    if (!isFn(t.check)) at(`${n}: check ไม่ใช่ฟังก์ชัน`);
  });
}

/** ตรวจข้อสอบหนึ่งข้อ */
function checkQuestion(q, where, problems) {
  const at = m => problems.push(`${where} · ${m}`);
  if (!QUIZ_TYPES.includes(q.type)) return at(`type "${q.type}" ไม่รองรับ (ต้องเป็น ${QUIZ_TYPES.join(' / ')})`);
  if (!isStr(q.q)) return at('ไม่มีคำถาม');
  if (!isStr(q.why)) at('ไม่มีคำอธิบายเฉลย (why) — ตอบผิดแล้วไม่ได้เรียนรู้อะไร');

  if (q.type === 'cmd') {
    if (!Array.isArray(q.ans) || !q.ans.length || !q.ans.every(isStr)) at('ข้อพิมพ์คำสั่งต้องมี ans เป็น array ของข้อความ');
    return;
  }
  if (!Array.isArray(q.opts) || q.opts.length < 2) return at('ต้องมีตัวเลือกอย่างน้อย 2 ข้อ');
  if (!q.opts.every(isStr)) at('มีตัวเลือกที่ว่าง');
  if (new Set(q.opts.map(o => o.trim())).size !== q.opts.length) at('มีตัวเลือกซ้ำกัน');

  if (q.type === 'mcq') {
    if (!Number.isInteger(q.a) || q.a < 0 || q.a >= q.opts.length) at(`เฉลย a=${q.a} อยู่นอกช่วงตัวเลือก 0..${q.opts.length - 1}`);
  } else {
    if (!Array.isArray(q.a) || !q.a.length) return at('ข้อเลือกหลายคำตอบต้องมี a เป็น array');
    if (!q.a.every(i => Number.isInteger(i) && i >= 0 && i < q.opts.length)) at(`เฉลย [${q.a}] อยู่นอกช่วงตัวเลือก`);
    if (new Set(q.a).size !== q.a.length) at('เฉลยมีเลขซ้ำ');
    if (q.a.length === q.opts.length) at('เฉลยเลือกครบทุกตัวเลือก — ข้อนี้ไม่ได้วัดอะไร');
  }
}

/** @returns {string[]} รายการปัญหาที่เจอ — ว่าง = เนื้อหาผ่านหมด */
export function validateContent() {
  const problems = [];
  const labIds = new Map();      // id -> ที่แรกที่เจอ

  for (const t of TRACKS) {
    const where = `track ${t.id}`;
    if (!isStr(t.id) || !isStr(t.name) || !isStr(t.icon)) problems.push(`${where}: ขาด id/name/icon`);
    const levels = Object.keys(t.levels).map(Number).sort((a, b) => a - b);
    if (!levels.length) { problems.push(`${where}: ไม่มีระดับเลย`); continue; }
    levels.forEach((n, i) => {
      if (n !== i + 1) problems.push(`${where}: ระดับข้ามเลข (${levels.join(',')}) — การปลดล็อกจะพัง`);
    });

    for (const lv of levels) {
      const d = t.levels[lv];
      const w = `${where} L${lv}`;
      if (!isStr(d.title)) problems.push(`${w}: ไม่มีชื่อบท`);
      if (!Array.isArray(d.sections) || !d.sections.length) problems.push(`${w}: ไม่มีเนื้อหา (sections)`);
      else d.sections.forEach((s, i) => {
        if (!isStr(s.t) || !isStr(s.h)) problems.push(`${w} section #${i + 1}: ต้องมีทั้ง t และ h`);
      });

      if (!Array.isArray(d.quiz) || !d.quiz.length) problems.push(`${w}: ไม่มีข้อสอบ`);
      else {
        d.quiz.forEach((q, i) => checkQuestion(q, `${w} ข้อ #${i + 1}`, problems));
        const seen = new Set();
        d.quiz.forEach((q, i) => {
          const key = String(q.q || '').trim().toLowerCase();
          if (seen.has(key)) problems.push(`${w} ข้อ #${i + 1}: คำถามซ้ำกับข้ออื่นในระดับเดียวกัน`);
          seen.add(key);
        });
      }

      (d.labs || []).forEach(lab => {
        checkLab(lab, w, problems);
        const prev = labIds.get(lab.id);
        if (prev) problems.push(`${w}: lab id "${lab.id}" ซ้ำกับ ${prev} — ความคืบหน้าจะปนกัน`);
        else labIds.set(lab.id, w);
      });
    }
  }

  SURVIVAL_LABS.forEach(lab => {
    const w = 'เอาชีวิตรอด';
    checkLab(lab, w, problems);
    if (!DIFFICULTIES.includes(lab.difficulty)) problems.push(`${w} ${lab.id}: difficulty "${lab.difficulty}" ไม่รองรับ`);
    ['severity', 'time', 'caller', 'story', 'impact', 'debrief'].forEach(k => {
      if (!isStr(lab[k])) problems.push(`${w} ${lab.id}: ขาด ${k}`);
    });
    const prev = labIds.get(lab.id);
    if (prev) problems.push(`${w}: lab id "${lab.id}" ซ้ำกับ ${prev}`);
    else labIds.set(lab.id, w);
  });

  return problems;
}

/** ตัวเลขสรุปเนื้อหา — README อ้างตัวเลขพวกนี้ ต้องดึงของจริงมาเทียบได้ */
export function contentStats() {
  const labs = TRACKS.flatMap(t => Object.values(t.levels).flatMap(l => l.labs || []));
  return {
    tracks: TRACKS.length,
    levels: TRACKS.reduce((a, t) => a + Object.keys(t.levels).length, 0),
    quiz: TRACKS.reduce((a, t) => a + Object.values(t.levels).reduce((b, l) => b + (l.quiz || []).length, 0), 0),
    labs: labs.length,
    labTasks: labs.reduce((a, l) => a + l.tasks.length, 0),
    survival: SURVIVAL_LABS.length,
    survivalTasks: SURVIVAL_LABS.reduce((a, l) => a + l.tasks.length, 0),
  };
}
