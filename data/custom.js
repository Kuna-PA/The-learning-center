// ============================================================
//  เนื้อหาที่ผู้ดูแลระบบเพิ่มเองจากหน้าเว็บ
//
//  เนื้อหาหลักของเว็บเป็นไฟล์ .js ที่ commit ลง repo — แก้ได้เฉพาะคนที่เขียนโค้ดเป็น
//  ไฟล์นี้เปิดทางให้ผู้ดูแลเพิ่ม "บทเรียน / ข้อสอบ / Lab" ได้เองโดยไม่ต้องแตะโค้ด
//  แล้วเอาไป merge ทับโครงเดิมตอนเปิดเว็บ
//
//  ข้อจำกัดที่ตั้งใจให้เป็นแบบนี้:
//    - เงื่อนไขตรวจ Lab เป็น "กติกา" ที่เลือกจากรายการ ไม่ใช่โค้ด JS ที่พิมพ์เอง
//      เพราะเนื้อหานี้ถูกส่งไปรันในเบราว์เซอร์ของผู้เรียนทุกคน
//      ถ้าให้พิมพ์ JS ได้ = ใครยึดบัญชี admin ได้ ก็รันโค้ดในเครื่องผู้เรียนได้ทันที
//    - HTML ของบทเรียนถูกกรองแท็กอันตรายออกก่อนเสมอ
// ============================================================

export const CUSTOM_VERSION = 1;

export const blankCustom = () => ({
  version: CUSTOM_VERSION,
  updatedAt: 0,
  sections: [],
  quiz: [],
  labs: [],
});

// ---------------- รูปภาพ ----------------
// รูปเก็บเป็น data URI ฝังไปกับเนื้อหาเลย ไม่ต้องมีที่เก็บไฟล์แยก
// จึงทำงานได้ทั้งบนเซิร์ฟเวอร์และบน static hosting และยังเห็นรูปตอนออฟไลน์
export const MAX_IMAGE_BYTES = 900 * 1024;      // ต่อรูป (หลังย่อแล้ว)
export const MAX_CONTENT_BYTES = 4 * 1024 * 1024;  // ทั้งก้อน — เผื่อ localStorage ที่มีโควตา ~5MB

/** ที่มาของรูปที่ยอมให้ใช้: ฝังมากับเนื้อหา · ไฟล์ใน repo · หรือ https ภายนอก */
export const isSafeImageSrc = (src) => {
  const v = String(src || '').trim();
  return /^data:image\/(png|jpeg|jpg|gif|webp|svg\+xml);base64,/i.test(v)
    || /^https:\/\//i.test(v)
    || /^(\.\/|\/)?assets\//i.test(v);
};

export const imageBytes = (src) => {
  const v = String(src || '');
  const i = v.indexOf('base64,');
  return i < 0 ? v.length : Math.round((v.length - i - 7) * 3 / 4);
};

/** แทนที่ [[รูป 1]] / [[img1]] ในเนื้อหาด้วยรูปที่แนบมา — รูปที่ไม่ได้ถูกอ้างถึงจะต่อท้ายให้ */
export function embedImages(html, imgs = []) {
  const list = (imgs || []).filter(isSafeImageSrc);
  if (!list.length) return html;
  const used = new Set();
  const tag = (src, i) => `<figure class="lesson-img"><img src="${src}" alt="ภาพประกอบที่ ${i + 1}" loading="lazy"></figure>`;
  const out = String(html || '').replace(/\[\[\s*(?:รูป|img|image)\s*(\d+)\s*\]\]/gi, (m, num) => {
    const i = Number(num) - 1;
    if (!list[i]) return '';
    used.add(i);
    return tag(list[i], i);
  });
  const rest = list.map((src, i) => (used.has(i) ? '' : tag(src, i))).join('');
  return out + rest;
}

// ---------------- ทำความสะอาด HTML ----------------
const BAD_TAGS = /<\s*\/?\s*(script|iframe|object|embed|link|meta|form|base|style)\b[^>]*>/gi;
const EVENT_ATTR = /\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;
const JS_URL = /(href|src|xlink:href)\s*=\s*("|')?\s*javascript:[^"'>\s]*("|')?/gi;

/** ตัดสิ่งที่รันสคริปต์ได้ออกจาก HTML ที่ผู้ดูแลพิมพ์เข้ามา */
export function sanitizeHtml(html) {
  return String(html || '')
    .replace(BAD_TAGS, '')
    .replace(EVENT_ATTR, '')
    .replace(JS_URL, '$1="#"')
    // <img> ใช้ได้ แต่ต้องเป็นรูปที่ฝังมา ไฟล์ใน repo หรือ https เท่านั้น
    .replace(/<img\b[^>]*>/gi, (tag) => {
      const src = (tag.match(/src\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i) || [])
        .slice(2).find(v => v !== undefined) || '';
      return isSafeImageSrc(src) ? tag : '';
    });
}

// ---------------- กติกาตรวจ Lab ----------------
export const RULE_KINDS = [
  { kind: 'ran', label: 'รันคำสั่งที่ตรงกับรูปแบบนี้', hint: 'เช่น systemctl start nginx' },
  { kind: 'ranCount', label: 'รันคำสั่งแบบนี้อย่างน้อย N ครั้ง', hint: 'เช่น df — แล้วตั้ง N = 2' },
  { kind: 'state', label: 'สถานะของอุปกรณ์เป็นค่านี้', hint: 'เช่น services.nginx.active = true' },
  { kind: 'file', label: 'ไฟล์นี้มีข้อความอยู่ข้างใน', hint: 'เช่น /etc/logrotate.d/app มีคำว่า rotate' },
];

const asRegExp = (pattern, fallbackLiteral = true) => {
  try { return new RegExp(pattern, 'i'); }
  catch { return fallbackLiteral ? new RegExp(String(pattern).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') : null; }
};

/** เดินตาม path แบบ a.b.c ลงไปในสถานะของอุปกรณ์ */
function dig(obj, path) {
  return String(path || '').split('.').filter(Boolean).reduce((cur, key) => {
    if (cur == null) return undefined;
    if (cur instanceof Set) return cur.has(key) ? key : undefined;
    if (Array.isArray(cur) && /^\d+$/.test(key)) return cur[+key];
    if (Array.isArray(cur)) return cur.find(x => x && (x.name === key || x.id === key || x.dev === key));
    return cur[key];
  }, obj);
}

const has = (value, needle) => {
  const want = String(needle).toLowerCase();
  if (value instanceof Set) return [...value].some(v => String(v).toLowerCase() === want);
  if (Array.isArray(value)) return value.some(v => String(typeof v === 'object' ? JSON.stringify(v) : v).toLowerCase().includes(want));
  if (value && typeof value === 'object') return JSON.stringify(value).toLowerCase().includes(want);
  return String(value ?? '').toLowerCase().includes(want);
};

/** อ่านไฟล์จาก virtual filesystem — รองรับทั้งโครงของ Linux และของ Windows */
function readFile(state, path) {
  const clean = String(path || '').replace(/\\/g, '/').replace(/^[a-z]:/i, '');
  const parts = clean.split('/').filter(Boolean);

  // Linux: { children: { etc: { children: {...} } } }
  let node = state.fs;
  if (node && node.children) {
    for (const seg of parts) {
      const next = node.children && node.children[seg];
      if (!next) { node = null; break; }
      node = next;
    }
    if (node && typeof node.content === 'string') return node.content;
  }
  // Windows: { 'C:\\': { d: true, c: { ... } } }
  const roots = state.fs && !state.fs.children ? Object.values(state.fs) : [];
  for (const root of roots) {
    let cur = root;
    for (const seg of parts) {
      const key = cur && cur.c && Object.keys(cur.c).find(k => k.toLowerCase() === seg.toLowerCase());
      if (!key) { cur = null; break; }
      cur = cur.c[key];
    }
    if (cur && typeof cur.content === 'string') return cur.content;
  }
  return null;
}

/**
 * แปลงกติกาที่ผู้ดูแลเลือกไว้ ให้เป็นฟังก์ชัน check(state, history) ที่ Lab ใช้จริง
 * ทุกกติกาในข้อเดียวกันต้องผ่านทั้งหมด
 */
export function compileCheck(rules) {
  const list = (Array.isArray(rules) ? rules : []).filter(r => r && r.kind);
  if (!list.length) return () => false;

  const checks = list.map((rule) => {
    switch (rule.kind) {
      case 'ran': {
        const re = asRegExp(rule.pattern);
        return (state, history) => history.some(c => re.test(String(c).trim()));
      }
      case 'ranCount': {
        const re = asRegExp(rule.pattern);
        const min = Math.max(1, Number(rule.min) || 2);
        return (state, history) => history.filter(c => re.test(String(c).trim())).length >= min;
      }
      case 'state': {
        const op = rule.op || 'eq';
        const want = rule.value;
        return (state) => {
          const got = dig(state, rule.path);
          if (op === 'exists') return got !== undefined && got !== null && got !== false;
          if (op === 'contains') return has(got, want);
          if (op === 'gt') return Number(got) > Number(want);
          if (op === 'lt') return Number(got) < Number(want);
          const a = typeof got === 'boolean' ? String(got) : String(got ?? '');
          const b = String(want ?? '');
          return op === 'ne' ? a.toLowerCase() !== b.toLowerCase() : a.toLowerCase() === b.toLowerCase();
        };
      }
      case 'file': {
        return (state) => {
          const content = readFile(state, rule.path);
          if (content === null) return false;
          return rule.contains ? content.toLowerCase().includes(String(rule.contains).toLowerCase()) : true;
        };
      }
      default:
        return () => false;
    }
  });

  return (state, history) => {
    try { return checks.every(fn => fn(state, history || [])); }
    catch { return false; }
  };
}

// ---------------- ตรวจความถูกต้องก่อนบันทึก ----------------
const isStr = v => typeof v === 'string' && v.trim() !== '';

/** @returns {string[]} รายการปัญหา — ว่าง = ใช้ได้ */
export function validateCustom(data, { tracks = [] } = {}) {
  const problems = [];
  const trackIds = new Set(tracks.map(t => t.id));
  const levelsOf = (id) => Object.keys((tracks.find(t => t.id === id) || { levels: {} }).levels).map(Number);
  const place = (item, what) => {
    if (!trackIds.has(item.track)) problems.push(`${what}: ไม่มีหัวข้อ "${item.track}"`);
    else if (!levelsOf(item.track).includes(+item.level)) problems.push(`${what}: หัวข้อ ${item.track} ไม่มีระดับ ${item.level}`);
  };

  if (!data || typeof data !== 'object') return ['รูปแบบข้อมูลไม่ถูกต้อง'];
  for (const key of ['sections', 'quiz', 'labs']) {
    if (!Array.isArray(data[key])) problems.push(`${key} ต้องเป็น array`);
  }
  if (problems.length) return problems;

  (data.sections || []).forEach((sec, i) => {
    const what = `บทเรียน #${i + 1}`;
    place(sec, what);
    if (!isStr(sec.t)) problems.push(`${what}: ต้องมีหัวข้อ`);
    if (!isStr(sec.h)) problems.push(`${what}: ต้องมีเนื้อหา`);
  });

  (data.quiz || []).forEach((q, i) => {
    const what = `ข้อสอบ #${i + 1}`;
    place(q, what);
    if (!isStr(q.q)) problems.push(`${what}: ต้องมีคำถาม`);
    if (!isStr(q.why)) problems.push(`${what}: ต้องมีคำอธิบายเฉลย`);
    if (q.type === 'cmd') {
      if (!Array.isArray(q.ans) || !q.ans.filter(isStr).length) problems.push(`${what}: ต้องมีคำตอบที่ยอมรับอย่างน้อย 1 แบบ`);
    } else if (q.type === 'mcq' || q.type === 'multi') {
      const opts = (q.opts || []).filter(isStr);
      if (opts.length < 2) problems.push(`${what}: ต้องมีตัวเลือกอย่างน้อย 2 ข้อ`);
      if (q.type === 'mcq') {
        if (!Number.isInteger(q.a) || q.a < 0 || q.a >= opts.length) problems.push(`${what}: ยังไม่ได้เลือกคำตอบที่ถูก`);
      } else if (!Array.isArray(q.a) || !q.a.length) problems.push(`${what}: ต้องเลือกคำตอบที่ถูกอย่างน้อย 1 ข้อ`);
    } else {
      problems.push(`${what}: ชนิดข้อสอบไม่ถูกต้อง`);
    }
  });

  (data.labs || []).forEach((lab, i) => {
    const what = `Lab #${i + 1}`;
    place(lab, what);
    if (!isStr(lab.title)) problems.push(`${what}: ต้องมีชื่อ Lab`);
    if (!isStr(lab.device)) problems.push(`${what}: ต้องเลือกอุปกรณ์`);
    if (!Array.isArray(lab.tasks) || !lab.tasks.length) problems.push(`${what}: ต้องมีอย่างน้อย 1 ขั้นตอน`);
    (lab.tasks || []).forEach((task, j) => {
      const w2 = `${what} ขั้นที่ ${j + 1}`;
      if (!isStr(task.t)) problems.push(`${w2}: ต้องมีคำอธิบายสิ่งที่ต้องทำ`);
      if (!isStr(task.hint)) problems.push(`${w2}: ต้องมีคำใบ้`);
      const rules = (task.rules || []).filter(r => r && r.kind);
      if (!rules.length) problems.push(`${w2}: ต้องมีกติกาตรวจอย่างน้อย 1 ข้อ`);
      rules.forEach(r => {
        if ((r.kind === 'ran' || r.kind === 'ranCount') && !isStr(r.pattern)) problems.push(`${w2}: กติกา "${r.kind}" ต้องระบุรูปแบบคำสั่ง`);
        if (r.kind === 'state' && !isStr(r.path)) problems.push(`${w2}: กติกา "state" ต้องระบุ path`);
        if (r.kind === 'file' && !isStr(r.path)) problems.push(`${w2}: กติกา "file" ต้องระบุไฟล์`);
      });
    });
  });

  const ids = [...(data.labs || []).map(l => l.id), ...(data.sections || []).map(s => s.id), ...(data.quiz || []).map(q => q.id)];
  if (new Set(ids).size !== ids.length) problems.push('มี id ซ้ำกันในเนื้อหาที่เพิ่มเอง');

  // ---- รูปภาพ ----
  const checkImg = (src, what) => {
    if (!src) return;
    if (!isSafeImageSrc(src)) { problems.push(`${what}: ที่มาของรูปไม่ถูกต้อง (ต้องเป็นรูปที่อัปโหลด ไฟล์ใน assets/ หรือลิงก์ https)`); return; }
    if (imageBytes(src) > MAX_IMAGE_BYTES) problems.push(`${what}: รูปใหญ่เกิน ${Math.round(MAX_IMAGE_BYTES / 1024)} KB`);
  };
  (data.sections || []).forEach((sec, i) => (sec.imgs || []).forEach((src, j) => checkImg(src, `บทเรียน #${i + 1} รูปที่ ${j + 1}`)));
  (data.quiz || []).forEach((q, i) => checkImg(q.img, `ข้อสอบ #${i + 1} รูปประกอบ`));
  (data.labs || []).forEach((l, i) => checkImg(l.img, `Lab #${i + 1} รูปประกอบ`));

  const size = JSON.stringify(data).length;
  if (size > MAX_CONTENT_BYTES) {
    problems.push(`เนื้อหาทั้งหมดรวมกัน ${Math.round(size / 1024 / 1024 * 10) / 10} MB เกินเพดาน ${MAX_CONTENT_BYTES / 1024 / 1024} MB — ลองลดขนาดรูปหรือลบของที่ไม่ใช้แล้ว`);
  }

  return problems;
}

// ---------------- รวมเข้ากับเนื้อหาเดิม ----------------
/**
 * ใส่เนื้อหาที่ผู้ดูแลเพิ่มเข้าไปในโครง TRACKS เดิม (แก้ที่ตัว object เลย)
 * ทุกชิ้นจะติดธง custom: true ไว้ เพื่อให้หน้าเว็บบอกได้ว่าอันไหนเพิ่มเอง
 */
export function mergeCustom(tracks, data) {
  const c = { ...blankCustom(), ...(data || {}) };
  const at = (trackId, level) => {
    const t = tracks.find(x => x.id === trackId);
    return t && t.levels[level] ? t.levels[level] : null;
  };

  c.sections.forEach((sec) => {
    const lv = at(sec.track, sec.level);
    if (!lv) return;
    lv.sections = [...(lv.sections || []), {
      t: sec.t,
      h: sanitizeHtml(embedImages(sec.h, sec.imgs)),
      custom: true, customId: sec.id,
    }];
  });

  c.quiz.forEach((q) => {
    const lv = at(q.track, q.level);
    if (!lv) return;
    const item = { type: q.type, q: q.q, why: q.why, custom: true, customId: q.id };
    if (isSafeImageSrc(q.img)) item.img = q.img;
    if (q.type === 'cmd') item.ans = (q.ans || []).filter(a => String(a).trim());
    else { item.opts = q.opts; item.a = q.a; }
    lv.quiz = [...(lv.quiz || []), item];
  });

  c.labs.forEach((lab) => {
    const lv = at(lab.track, lab.level);
    if (!lv) return;
    lv.labs = [...(lv.labs || []), {
      id: lab.id,
      title: lab.title,
      brief: lab.brief || '',
      img: isSafeImageSrc(lab.img) ? lab.img : '',
      device: lab.device,
      custom: true,
      init: lab.init || {},
      tasks: (lab.tasks || []).map(t => ({
        t: sanitizeHtml(t.t),
        hint: t.hint,
        check: compileCheck(t.rules),
        rules: t.rules,
      })),
      debrief: lab.debrief ? sanitizeHtml(lab.debrief) : '',
    }];
  });

  return tracks;
}
