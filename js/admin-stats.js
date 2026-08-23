// ============================================================
//  สรุปความคืบหน้าของผู้เรียน — ใช้กับหน้าแดชบอร์ดของผู้ดูแลระบบ
//
//  แยกออกมาเป็นฟังก์ชันบริสุทธิ์ (รับ progress เข้า คืนตัวเลขออก) ด้วยเหตุผลสองข้อ
//    1. หน้าเรียนของผู้เรียนเองอ่านจาก store ของคนที่ล็อกอินอยู่ แต่แดชบอร์ดต้องคิดของ "คนอื่น"
//    2. ตัวเลขพวกนี้ต้องทดสอบได้ ไม่งั้นแดชบอร์ดจะรายงานผิดโดยไม่มีใครรู้
//
//  สูตรคิดเปอร์เซ็นต์ต้องตรงกับที่ผู้เรียนเห็นในหน้าของตัวเอง (js/app.js)
//  ไม่งั้นผู้ดูแลกับผู้เรียนจะเห็นตัวเลขคนละอย่างของเรื่องเดียวกัน
// ============================================================

const blank = { xp: 0, read: {}, quiz: {}, labs: {} };
const P = (p) => (p && typeof p === 'object' ? { ...blank, ...p } : blank);

export const isRead = (p, track, level) => !!P(p).read[`${track}:${level}`];
export const quizOf = (p, track, level) => P(p).quiz[`${track}:${level}`] || null;
export const labOf = (p, track, labId) => P(p).labs[`${track}:${labId}`] || null;

/** สถานะของระดับหนึ่งสำหรับผู้เรียนคนหนึ่ง */
export function levelStatus(p, track, level) {
  const labs = (track.levels[level] || {}).labs || [];
  const q = quizOf(p, track.id, level);
  return {
    read: isRead(p, track.id, level),
    quiz: q,
    passed: !!(q && q.passed),
    best: q ? q.best : 0,
    attempts: q ? q.attempts : 0,
    labsDone: labs.filter(l => (labOf(p, track.id, l.id) || {}).done).length,
    labsTotal: labs.length,
  };
}

/** เปอร์เซ็นต์ของระดับ — อ่าน 30 · สอบผ่าน 40 · Lab 30 (ระดับที่ไม่มี Lab คิด 40/60) */
export function levelPct(p, track, level) {
  const s = levelStatus(p, track, level);
  if (!s.labsTotal) return (s.read ? 40 : 0) + (s.passed ? 60 : 0);
  let pct = 0;
  if (s.read) pct += 30;
  if (s.passed) pct += 40;
  pct += Math.round((s.labsDone / s.labsTotal) * 30);
  return Math.min(100, pct);
}

export function trackPct(p, track) {
  const levels = Object.keys(track.levels);
  if (!levels.length) return 0;
  return Math.round(levels.reduce((a, l) => a + levelPct(p, track, +l), 0) / levels.length);
}

/** หัวข้อนี้ถือว่าจบเมื่อสอบผ่านครบทุกระดับ และทำ Lab ครบทุกชุด */
export function trackCertified(p, track) {
  const levels = Object.keys(track.levels).map(Number);
  return levels.length > 0 && levels.every(l => {
    const s = levelStatus(p, track, l);
    return s.passed && s.labsDone === s.labsTotal;
  });
}

/**
 * สรุปของผู้เรียนหนึ่งคน
 * @param {object} progress ก้อนความคืบหน้า
 * @param {object} content  { tracks, allLabs, survivalLabs }
 */
export function summarise(progress, { tracks, allLabs, survivalLabs }) {
  const p = P(progress);
  const perTrack = tracks.map(t => ({
    id: t.id,
    name: t.name,
    emoji: t.emoji,
    pct: trackPct(p, t),
    certified: trackCertified(p, t),
    levels: Object.keys(t.levels).map(Number).sort((a, b) => a - b).map(n => ({
      n, ...levelStatus(p, t, n), pct: levelPct(p, t, n),
    })),
  }));

  const quizPassed = perTrack.reduce((a, t) => a + t.levels.filter(l => l.passed).length, 0);
  const quizTotal = tracks.reduce((a, t) => a + Object.keys(t.levels).length, 0);
  const labsDone = allLabs.filter(l => (labOf(p, l.track, l.id) || {}).done).length;
  const survivalDone = survivalLabs.filter(l => (labOf(p, 'survival', l.id) || {}).done).length;

  return {
    xp: p.xp || 0,
    pct: perTrack.length ? Math.round(perTrack.reduce((a, t) => a + t.pct, 0) / perTrack.length) : 0,
    quizPassed,
    quizTotal,
    labsDone,
    labsTotal: allLabs.length,
    survivalDone,
    survivalTotal: survivalLabs.length,
    certs: perTrack.filter(t => t.certified).length,
    masterCert: perTrack.length > 0 && perTrack.every(t => t.certified),
    started: quizPassed > 0 || labsDone > 0 || Object.keys(p.read).length > 0,
    perTrack,
  };
}

const DAY = 24 * 3600 * 1000;

/**
 * สรุปภาพรวมของทั้งศูนย์เรียนรู้
 * @param {Array} users  [{username, display, role, lastLogin, progress}]
 */
export function overview(users, content, now = Date.now()) {
  const rows = users.map(u => ({ user: u, stats: summarise(u.progress, content) }));
  const learners = rows.filter(r => r.user.role !== 'admin');
  const base = learners.length ? learners : rows;      // ถ้ามีแต่ admin ก็คิดจากทั้งหมดไปก่อน

  const avg = (fn) => (base.length ? Math.round(base.reduce((a, r) => a + fn(r), 0) / base.length) : 0);
  const perTrack = content.tracks.map((t, i) => ({
    id: t.id,
    name: t.name,
    emoji: t.emoji,
    avgPct: base.length ? Math.round(base.reduce((a, r) => a + r.stats.perTrack[i].pct, 0) / base.length) : 0,
    finished: base.filter(r => r.stats.perTrack[i].certified).length,
    // ระดับที่คนไปถึงมากที่สุด = ระดับสูงสุดที่มีคนสอบผ่าน
    deepestLevel: Math.max(0, ...base.map(r =>
      Math.max(0, ...r.stats.perTrack[i].levels.filter(l => l.passed).map(l => l.n)))),
  }));

  return {
    users: rows.length,
    learners: learners.length,
    active7: rows.filter(r => r.user.lastLogin && now - r.user.lastLogin < 7 * DAY).length,
    active30: rows.filter(r => r.user.lastLogin && now - r.user.lastLogin < 30 * DAY).length,
    neverStarted: base.filter(r => !r.stats.started).length,
    xpTotal: rows.reduce((a, r) => a + r.stats.xp, 0),
    labsDone: rows.reduce((a, r) => a + r.stats.labsDone + r.stats.survivalDone, 0),
    quizPassed: rows.reduce((a, r) => a + r.stats.quizPassed, 0),
    certs: rows.reduce((a, r) => a + r.stats.certs, 0),
    masters: rows.filter(r => r.stats.masterCert).length,
    avgPct: avg(r => r.stats.pct),
    perTrack,
    rows: rows.sort((a, b) => b.stats.pct - a.stats.pct || b.stats.xp - a.stats.xp),
  };
}

/** ตารางผู้เรียนในรูปแบบ CSV — เปิดต่อใน Excel ได้เลย */
export function toCsv(rows, content) {
  const head = ['username', 'display', 'role', 'last_login', 'overall_pct', 'xp',
    'quiz_passed', 'quiz_total', 'labs_done', 'labs_total', 'survival_done', 'certificates',
    ...content.tracks.map(t => `pct_${t.id}`)];
  const esc = (v) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const lines = rows.map(({ user, stats }) => [
    user.username, user.display || '', user.role,
    user.lastLogin ? new Date(user.lastLogin).toISOString().slice(0, 10) : '',
    stats.pct, stats.xp, stats.quizPassed, stats.quizTotal,
    stats.labsDone, stats.labsTotal, stats.survivalDone, stats.certs,
    ...stats.perTrack.map(t => t.pct),
  ].map(esc).join(','));
  return [head.join(','), ...lines].join('\n');
}
