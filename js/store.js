// ============================================================
//  ความคืบหน้าของผู้เรียน
//  แหล่งความจริงอยู่ที่เซิร์ฟเวอร์ (ตาราง progress) — เรียนจากเครื่องไหนก็ต่อได้
//  localStorage เหลือหน้าที่เป็นแคชสำรอง เผื่อเน็ตหลุดระหว่างทำ Lab
//
//  ตัวอ่านทั้งหมดยัง synchronous เหมือนเดิม (store.xp, store.labOf ...)
//  ส่วนการเขียนจะทยอยส่งขึ้นเซิร์ฟเวอร์แบบหน่วงรวบ ไม่ยิงทุกคีย์
// ============================================================
import { api } from './api.js';
import { auth } from './auth.js';
import { localAuth } from './local-mode.js';

/** โหมดออฟไลน์ = ไม่มีเซิร์ฟเวอร์ให้ซิงก์ เก็บแค่ในเบราว์เซอร์ */
const offline = () => auth.isLocal;

const BASE = 'sysengLC.v1';
let KEY = BASE;              // แคชในเครื่อง แยกตามผู้ใช้
let username = null;
let syncTimer = null;
let lastError = null;

const blank = () => ({
  version: 1,
  xp: 0,
  read: {},    // "track:level" -> true
  quiz: {},    // "track:level" -> {best, attempts, passed, at}
  labs: {},    // "track:labId" -> {done, tasks:[bool], at}
  unlockAll: false,
  createdAt: Date.now(),
});

let data = blank();

// ---------- แคชในเครื่อง ----------
function readCache() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...blank(), ...JSON.parse(raw) } : null;
  } catch { return null; }
}
function writeCache() {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* โควตาเต็มก็ช่างมัน */ }
}

// ---------- ส่งขึ้นเซิร์ฟเวอร์ ----------
function scheduleSync() {
  if (!username) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(flush, 800);
}

export async function flush() {
  if (!username) return { ok: false };
  if (offline()) return { ok: true };      // แคชในเครื่องคือปลายทางอยู่แล้ว
  clearTimeout(syncTimer);
  try {
    await api.put('/api/progress', { data });
    lastError = null;
    return { ok: true };
  } catch (e) {
    lastError = e.message;
    return { ok: false, msg: e.message };
  }
}

/** เผื่อผู้ใช้ปิดแท็บก่อนตัวหน่วงจะทำงาน */
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (!username || !syncTimer || offline()) return;
    try {
      navigator.sendBeacon?.('/api/progress',
        new Blob([JSON.stringify({ data })], { type: 'application/json' }));
    } catch { /* ไม่ได้ก็ไม่เป็นไร ยังมีแคชในเครื่อง */ }
  });
}

/**
 * เปลี่ยนผู้ใช้ปัจจุบันแล้วโหลดความคืบหน้าจากเซิร์ฟเวอร์
 * ถ้าเซิร์ฟเวอร์ยังไม่มีข้อมูลแต่เครื่องนี้มีแคชเก่าอยู่ จะยกขึ้นไปให้ครั้งเดียว
 */
export async function setStoreUser(name) {
  username = name || null;
  KEY = name ? `${BASE}:${name}` : BASE;

  if (!username) {
    data = blank();
    window.dispatchEvent(new CustomEvent('progress-changed'));
    return data;
  }

  const cached = readCache();
  if (offline()) {
    data = cached || blank();
    window.dispatchEvent(new CustomEvent('progress-changed'));
    return data;
  }

  let fromServer = null;
  try {
    const r = await api.get('/api/progress');
    fromServer = r.data;
  } catch { /* เน็ตสะดุด — ใช้แคชไปก่อนแล้วค่อยซิงก์ */ }

  if (fromServer) {
    data = { ...blank(), ...fromServer };
    writeCache();
  } else if (cached) {
    // ย้ายของเดิมที่เคยเก็บไว้ในเบราว์เซอร์ขึ้นเซิร์ฟเวอร์ให้อัตโนมัติ
    data = cached;
    await flush();
  } else {
    data = blank();
  }

  window.dispatchEvent(new CustomEvent('progress-changed'));
  return data;
}

function save() {
  writeCache();
  scheduleSync();
  window.dispatchEvent(new CustomEvent('progress-changed'));
}

export const store = {
  get all() { return data; },
  get xp() { return data.xp; },
  get syncError() { return lastError; },

  addXp(n) { data.xp += n; save(); },

  markRead(track, level) {
    const k = `${track}:${level}`;
    if (!data.read[k]) { data.read[k] = true; data.xp += 10; save(); return 10; }
    return 0;
  },
  isRead(track, level) { return !!data.read[`${track}:${level}`]; },

  /**
   * บันทึกผลสอบ
   * result = { asked:[qid], wrong:[qid] } — ใช้เลือกข้อสอบครั้งถัดไป
   * ข้อที่เคยตอบผิดจะถูกหยิบมาถามซ้ำก่อน จนกว่าจะตอบถูก
   */
  recordQuiz(track, level, pct, passed, result = null) {
    const k = `${track}:${level}`;
    const cur = data.quiz[k] || { best: 0, attempts: 0, passed: false };
    let gained = 0;
    if (pct > cur.best) gained += Math.round((pct - cur.best) / 2);
    if (passed && !cur.passed) gained += 50;

    // miss = จำนวนครั้งที่ตอบผิดและยังไม่ได้แก้ตัว · ตอบถูกแล้วจะลดลงทีละ 1
    const miss = { ...(cur.miss || {}) };
    if (result) {
      const wrong = new Set(result.wrong || []);
      (result.asked || []).forEach(qid => {
        if (wrong.has(qid)) miss[qid] = (miss[qid] || 0) + 1;
        else if (miss[qid]) { miss[qid] -= 1; if (miss[qid] <= 0) delete miss[qid]; }
      });
    }

    data.quiz[k] = {
      best: Math.max(cur.best, pct),
      attempts: cur.attempts + 1,
      passed: cur.passed || passed,
      at: Date.now(),
      miss,
      lastAsked: result ? (result.asked || []) : (cur.lastAsked || []),
    };
    data.xp += gained;
    save();
    return gained;
  },
  quizOf(track, level) { return data.quiz[`${track}:${level}`] || null; },

  /**
   * บันทึกความคืบหน้าของ Lab
   * history = คำสั่งที่รันสำเร็จไปแล้ว เก็บไว้เพื่อกลับมาทำต่อได้โดยไม่ต้องเริ่มใหม่
   */
  recordLab(track, labId, tasksDone, total, history = null) {
    const k = `${track}:${labId}`;
    const cur = data.labs[k] || { done: false, best: 0 };
    const done = tasksDone >= total && total > 0;
    let gained = 0;
    if (done && !cur.done) gained += 80;
    else if (tasksDone > (cur.best || 0)) gained += (tasksDone - (cur.best || 0)) * 5;
    data.labs[k] = {
      done: cur.done || done,
      best: Math.max(cur.best || 0, tasksDone),
      total, at: Date.now(),
      // เก็บไม่เกิน 300 คำสั่ง กัน localStorage บวม
      history: history ? history.slice(-300) : (cur.history || []),
    };
    data.xp += gained;
    save();
    return gained;
  },
  labOf(track, labId) { return data.labs[`${track}:${labId}`] || null; },
  /** ล้างเฉพาะความคืบหน้าที่บันทึกไว้ของ Lab นั้น (คงสถิติ done/best ไว้) */
  clearLabProgress(track, labId) {
    const k = `${track}:${labId}`;
    if (data.labs[k]) { data.labs[k].history = []; save(); }
  },

  setUnlockAll(v) { data.unlockAll = !!v; save(); },

  reset() { data = blank(); save(); },

  export() { return JSON.stringify(data, null, 2); },
  import(json) {
    try { data = { ...blank(), ...JSON.parse(json) }; save(); return true; }
    catch { return false; }
  },
};

// ---------- ใช้ในหน้าผู้ดูแลระบบ ----------
export async function progressOf(user) {
  if (offline()) return localAuth.progressOf(user);
  try {
    const r = await api.get(`/api/admin/progress/${encodeURIComponent(user)}`);
    return r.data;
  } catch { return null; }
}

export async function clearProgressOf(user) {
  if (offline()) {
    localAuth.clearProgressOf(user);
    if (user === username) { data = blank(); writeCache(); window.dispatchEvent(new CustomEvent('progress-changed')); }
    return true;
  }
  try {
    await api.del(`/api/admin/progress/${encodeURIComponent(user)}`);
    if (user === username) { data = blank(); writeCache(); window.dispatchEvent(new CustomEvent('progress-changed')); }
    return true;
  } catch { return false; }
}

// ---------- ระดับ / XP ----------
// เกณฑ์ RANK — คิดจาก XP ทั้งเว็บที่หาได้จริง (~13,200)
// เทียบเป็นสัดส่วน: 7% / 20% / 40% / 67%
// ตั้งให้ "เรียนจบหัวข้อเดียว" ยังไม่พอขึ้น Advanced Beginner
export const XP_TIERS = [0, 900, 2600, 5300, 8800];

export function tierOf(xp) {
  let t = 1;
  XP_TIERS.forEach((v, i) => { if (xp >= v) t = i + 1; });
  return t;
}
export function tierProgress(xp) {
  const t = tierOf(xp);
  const lo = XP_TIERS[t - 1];
  const hi = XP_TIERS[t] ?? lo + 1000;
  return { t, lo, hi, pct: Math.min(100, Math.round(((xp - lo) / (hi - lo)) * 100)) };
}
