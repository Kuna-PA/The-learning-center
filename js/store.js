// ---------- ความคืบหน้าของผู้เรียน (เก็บใน localStorage) ----------
const BASE = 'sysengLC.v1';
let KEY = BASE;               // ถูกเปลี่ยนเป็น per-user เมื่อล็อกอิน
export function setStoreUser(username) {
  KEY = username ? BASE + ':' + username : BASE;
  data = load();
  window.dispatchEvent(new CustomEvent('progress-changed'));
}
export function progressOf(username) {
  try { return JSON.parse(localStorage.getItem(BASE + ':' + username) || 'null'); } catch { return null; }
}
export function clearProgressOf(username) {
  try { localStorage.removeItem(BASE + ':' + username); } catch {}
}

const blank = () => ({
  version: 1,
  xp: 0,
  read: {},    // "track:level" -> true
  quiz: {},    // "track:level" -> {best, attempts, passed, at}
  labs: {},    // "track:labId" -> {done, tasks:[bool], at}
  unlockAll: false,
  createdAt: Date.now(),
});

let data = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return blank();
    const d = JSON.parse(raw);
    return { ...blank(), ...d };
  } catch { return blank(); }
}

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { }
  window.dispatchEvent(new CustomEvent('progress-changed'));
}

export const store = {
  get all() { return data; },
  get xp() { return data.xp; },

  addXp(n) { data.xp += n; save(); },

  markRead(track, level) {
    const k = `${track}:${level}`;
    if (!data.read[k]) { data.read[k] = true; data.xp += 10; save(); return 10; }
    return 0;
  },
  isRead(track, level) { return !!data.read[`${track}:${level}`]; },

  recordQuiz(track, level, pct, passed) {
    const k = `${track}:${level}`;
    const cur = data.quiz[k] || { best: 0, attempts: 0, passed: false };
    let gained = 0;
    if (pct > cur.best) gained += Math.round((pct - cur.best) / 2);
    if (passed && !cur.passed) gained += 50;
    data.quiz[k] = {
      best: Math.max(cur.best, pct),
      attempts: cur.attempts + 1,
      passed: cur.passed || passed,
      at: Date.now(),
    };
    data.xp += gained;
    save();
    return gained;
  },
  quizOf(track, level) { return data.quiz[`${track}:${level}`] || null; },

  recordLab(track, labId, tasksDone, total) {
    const k = `${track}:${labId}`;
    const cur = data.labs[k] || { done: false, best: 0 };
    const done = tasksDone >= total && total > 0;
    let gained = 0;
    if (done && !cur.done) gained += 80;
    else if (tasksDone > (cur.best || 0)) gained += (tasksDone - (cur.best || 0)) * 5;
    data.labs[k] = { done: cur.done || done, best: Math.max(cur.best || 0, tasksDone), total, at: Date.now() };
    data.xp += gained;
    save();
    return gained;
  },
  labOf(track, labId) { return data.labs[`${track}:${labId}`] || null; },

  setUnlockAll(v) { data.unlockAll = !!v; save(); },

  reset() { data = blank(); save(); },

  export() { return JSON.stringify(data, null, 2); },
  import(json) {
    try { data = { ...blank(), ...JSON.parse(json) }; save(); return true; }
    catch { return false; }
  },
};

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
