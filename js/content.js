// ============================================================
//  โหลด/บันทึกเนื้อหาที่ผู้ดูแลเพิ่มเอง
//
//  โหมดเซิร์ฟเวอร์ : เก็บที่ /api/content — ทุกคนที่ล็อกอินเห็นเหมือนกัน
//  โหมดออฟไลน์    : เก็บใน localStorage ของเบราว์เซอร์นั้น (static hosting ไม่มีที่เก็บกลาง)
//                   จึงมีปุ่ม export/import ไฟล์ไว้ย้ายเนื้อหาข้ามเครื่อง
// ============================================================
import { api } from './api.js';
import { TRACKS, rebuildAllLabs } from '../data/tracks/index.js';
import { blankCustom, mergeCustom, validateCustom } from '../data/custom.js';

const KEY = 'sysengLC.content.v1';

let current = blankCustom();
let applied = false;

export const customContent = {
  get all() { return current; },
  get count() { return current.sections.length + current.quiz.length + current.labs.length; },
  get updatedAt() { return current.updatedAt; },
};

const readLocal = () => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...blankCustom(), ...JSON.parse(raw) } : blankCustom();
  } catch { return blankCustom(); }
};
const writeLocal = (data) => {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* โควตาเต็มก็ยังใช้ต่อได้ */ }
};

/**
 * โหลดเนื้อหาเพิ่มเติมแล้ว merge เข้ากับ TRACKS
 * เรียกครั้งเดียวตอนเปิดเว็บ ก่อนเรนเดอร์หน้าแรก
 */
export async function loadCustomContent() {
  let data = null;
  try {
    const r = await api.get('/api/content');
    data = r && r.data;
  } catch {
    data = null;      // ไม่มีเซิร์ฟเวอร์ หรือยังไม่ได้ล็อกอิน — ค่อยไปอ่านของในเครื่อง
  }
  if (!data) data = readLocal();

  current = { ...blankCustom(), ...(data || {}) };
  if (!applied && customContent.count) {
    mergeCustom(TRACKS, current);
    rebuildAllLabs();
    applied = true;
  }
  return current;
}

/**
 * บันทึกเนื้อหาชุดใหม่ — ตรวจความถูกต้องก่อนเสมอ
 * หน้าเว็บจะรีโหลดหนึ่งครั้งหลังบันทึก เพราะ TRACKS ถูก merge ไปแล้วตอนเปิดหน้า
 * การ merge ซ้ำโดยไม่รีโหลดจะทำให้เนื้อหาซ้อนกันสองชุด
 */
export async function saveCustomContent(next, { local = false } = {}) {
  const data = { ...blankCustom(), ...next, updatedAt: Date.now() };
  const problems = validateCustom(data, { tracks: TRACKS });
  if (problems.length) return { ok: false, problems };

  if (local) {
    writeLocal(data);
    current = data;
    return { ok: true, mode: 'local' };
  }
  try {
    await api.put('/api/content', { data });
    current = data;
    return { ok: true, mode: 'server' };
  } catch (e) {
    // เซิร์ฟเวอร์ไม่ตอบ (เช่นเปิดจาก static hosting) — เก็บลงเครื่องแทนเพื่อไม่ให้งานหาย
    writeLocal(data);
    current = data;
    return { ok: true, mode: 'local', note: e.message };
  }
}

/** ล้างเนื้อหาที่เพิ่มเองทั้งหมด */
export const clearCustomContent = (opts) => saveCustomContent(blankCustom(), opts);
