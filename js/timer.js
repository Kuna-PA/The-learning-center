// ============================================================
//  นาฬิกาจับเวลาของ Lab
//
//  Lab ปกติ   : นับขึ้น — ให้ผู้เรียนเห็นว่าตัวเองใช้เวลาไปเท่าไร และเทียบกับครั้งก่อนได้
//  เอาชีวิตรอด : นับถอยหลังจาก "เวลาเป้าหมาย" ของเหตุการณ์นั้น
//               เพราะของจริงมีแรงกดดันเรื่องเวลาเสมอ — ระบบล่มนานเท่าไรก็เสียหายเท่านั้น
//               หมดเวลาแล้วยังทำต่อได้ แต่จะขึ้นเวลาที่เกินมาให้เห็น
// ============================================================

/** '15 นาที' → 900 วินาที · รองรับ '90 วินาที' และ '1 ชม.' ด้วย */
export function parseDuration(text) {
  const s = String(text || '').trim();
  const num = parseFloat(s.replace(/[^\d.]/g, ''));
  if (!Number.isFinite(num) || num <= 0) return 0;
  if (/วินาที|วิ\b|sec/i.test(s)) return Math.round(num);
  if (/ชั่วโมง|ชม|hour|hr/i.test(s)) return Math.round(num * 3600);
  return Math.round(num * 60);          // ค่าเริ่มต้นคือ "นาที"
}

/** 754 → '12:34' · เกินชั่วโมงจะได้ '1:02:34' */
export function formatClock(totalSeconds) {
  const t = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/**
 * สถานะสีของนาฬิกานับถอยหลัง — ใช้เตือนก่อนหมดเวลาจริง
 * @param {number} left วินาทีที่เหลือ
 * @param {number} limit วินาทีทั้งหมด
 */
export function countdownState(left, limit) {
  if (left <= 0) return 'over';
  if (!limit) return 'normal';
  const ratio = left / limit;
  if (ratio <= 0.1 || left <= 30) return 'danger';
  if (ratio <= 0.25) return 'warn';
  return 'normal';
}

/**
 * สร้างนาฬิกาจับเวลา
 * @param {object} opts
 * @param {number} opts.limit   วินาทีที่ให้ (0 = นับขึ้นไม่มีกำหนด)
 * @param {Function} opts.onExpire เรียกครั้งเดียวตอนเวลาหมด
 */
export function createLabTimer({ limit = 0, onExpire = null } = {}) {
  const el = document.createElement('div');
  el.className = 'lab-timer' + (limit ? ' down' : '');

  const startedAt = Date.now();
  let stopped = false;
  let expired = false;
  let elapsed = 0;

  const face = document.createElement('span');
  face.className = 'lt-face';
  const label = document.createElement('span');
  label.className = 'lt-label';
  label.textContent = limit ? 'เวลาที่เหลือ' : 'เวลาที่ใช้';
  const value = document.createElement('b');
  value.className = 'lt-value';
  el.append(face, label, value);

  const paint = () => {
    if (!limit) {
      face.textContent = '⏱';
      value.textContent = formatClock(elapsed);
      return;
    }
    const left = limit - elapsed;
    const state = countdownState(left, limit);
    el.dataset.state = state;
    face.textContent = state === 'over' ? '💀' : '⏳';
    if (left > 0) {
      value.textContent = formatClock(left);
    } else {
      label.textContent = 'เกินเวลามาแล้ว';
      value.textContent = '+' + formatClock(-left);
    }
  };

  const tick = () => {
    if (stopped) return;
    elapsed = Math.floor((Date.now() - startedAt) / 1000);
    paint();
    if (limit && !expired && elapsed >= limit) {
      expired = true;
      if (onExpire) onExpire();
    }
  };

  paint();
  const id = setInterval(tick, 1000);

  return {
    el,
    get seconds() { return elapsed; },
    get expired() { return expired; },
    /** หยุดนับ แล้วเปลี่ยนเป็นป้ายสรุปเวลาที่ใช้ไป */
    stop({ finished = false } = {}) {
      if (stopped) return elapsed;
      stopped = true;
      clearInterval(id);
      elapsed = Math.floor((Date.now() - startedAt) / 1000);
      if (finished) {
        el.dataset.state = limit && elapsed > limit ? 'over' : 'done';
        face.textContent = limit && elapsed > limit ? '💀' : '✓';
        label.textContent = 'ใช้เวลาไป';
        value.textContent = formatClock(elapsed);
      }
      return elapsed;
    },
    destroy() { stopped = true; clearInterval(id); el.remove(); },
  };
}
