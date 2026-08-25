// ============================================================
//  นาฬิกาจับเวลาของ Lab
//  ส่วนที่คิดเลขแยกเป็นฟังก์ชันบริสุทธิ์ จะได้ทดสอบได้โดยไม่ต้องมีหน้าจอ
//  และเวลาเป้าหมายของทุกเหตุการณ์ในหมวดเอาชีวิตรอดต้องแปลงเป็นวินาทีได้จริง
// ============================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDuration, formatClock, countdownState } from '../js/timer.js';
import { SURVIVAL_LABS } from '../data/labs/survival.js';

test('อ่านเวลาเป้าหมายเป็นวินาทีได้', () => {
  assert.equal(parseDuration('15 นาที'), 900);
  assert.equal(parseDuration('10 นาที'), 600);
  assert.equal(parseDuration('90 วินาที'), 90);
  assert.equal(parseDuration('1 ชั่วโมง'), 3600);
  assert.equal(parseDuration('2 ชม.'), 7200);
  assert.equal(parseDuration(''), 0, 'ไม่มีเวลาก็ต้องได้ 0 แล้วไปนับขึ้นแทน');
  assert.equal(parseDuration('ไม่ระบุ'), 0);
});

test('ทุกเหตุการณ์ในหมวดเอาชีวิตรอดต้องมีเวลาเป้าหมายที่ใช้นับถอยหลังได้', () => {
  const bad = SURVIVAL_LABS
    .filter(l => parseDuration(l.time) < 60)
    .map(l => `${l.id}: "${l.time}"`);
  assert.deepEqual(bad, [], 'เหตุการณ์เหล่านี้แปลงเวลาไม่ได้ นาฬิกาจะนับถอยหลังไม่ขึ้น');
});

test('แสดงเวลาเป็นนาที:วินาที และมีชั่วโมงเมื่อยาวพอ', () => {
  assert.equal(formatClock(0), '0:00');
  assert.equal(formatClock(9), '0:09');
  assert.equal(formatClock(754), '12:34');
  assert.equal(formatClock(3600), '1:00:00');
  assert.equal(formatClock(3725), '1:02:05');
  assert.equal(formatClock(-5), '0:00', 'ค่าติดลบต้องไม่หลุดออกมา');
});

test('สีของนาฬิกาเตือนก่อนหมดเวลาจริง', () => {
  const limit = 900;
  assert.equal(countdownState(900, limit), 'normal');
  assert.equal(countdownState(300, limit), 'normal');
  assert.equal(countdownState(200, limit), 'warn', 'เหลือไม่ถึง 25% ต้องเริ่มเตือน');
  assert.equal(countdownState(80, limit), 'danger', 'เหลือไม่ถึง 10% ต้องเป็นสีแดง');
  assert.equal(countdownState(20, limit), 'danger');
  assert.equal(countdownState(0, limit), 'over');
  assert.equal(countdownState(-30, limit), 'over');
});

test('Lab สั้น ๆ ก็ยังเตือนตอนใกล้หมดเวลา', () => {
  // 3 นาที: 10% = 18 วินาที ซึ่งสั้นเกินกว่าจะทันตั้งตัว จึงมีเพดาน 30 วินาทีคุมอีกชั้น
  assert.equal(countdownState(25, 180), 'danger');
  assert.equal(countdownState(40, 180), 'warn');
});
