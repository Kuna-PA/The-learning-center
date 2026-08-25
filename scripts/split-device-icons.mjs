// ============================================================
//  ตัดแผ่นรวมไอคอนอุปกรณ์เครือข่าย ออกเป็นไฟล์รายตัว
//    node scripts/split-device-icons.mjs <โฟลเดอร์ที่มี devices15.bmp>
//
//  ต้นฉบับเป็นแผ่นเดียว มีไอคอนเรียงเป็นตาราง 5 คอลัมน์ 3 แถว และมีป้ายชื่อใต้ไอคอน
//  สคริปต์นี้ตัดเฉพาะตัวการ์ดไอคอน ไม่เอาป้ายชื่อ (หน้าเว็บมีคำอธิบายของตัวเองอยู่แล้ว)
//  แล้วทำมุมโค้งให้โปร่งใส จะได้วางบนพื้นสีเข้มของธีมโดยไม่มีขอบสี่เหลี่ยมสีอ่อนโผล่
//
//  ตำแหน่งตารางวัดจากแผ่นต้นฉบับใบนี้โดยตรง (2816 x 1536) —
//  ไม่ได้ใช้วิธีตรวจจับอัตโนมัติ เพราะการ์ดมีสีใกล้เคียงพื้นหลังมากจนแยกขอบไม่ได้
//  และมีเงาฟุ้งรอบการ์ดที่ทำให้ขอบเขตเพี้ยน — ถ้าเปลี่ยนแผ่นต้นฉบับต้องวัดใหม่
//
//  ผลลัพธ์ commit ลง repo แล้ว ปกติไม่ต้องรันซ้ำ
// ============================================================
import { mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readBmp, writePng, crop, resize, at } from './lib/img.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = process.argv[2];
if (!SRC) {
  console.error('ใช้: node scripts/split-device-icons.mjs <โฟลเดอร์ที่มี devices15.bmp>');
  process.exit(1);
}

// ---- ตำแหน่งการ์ดในแผ่นต้นฉบับ ----
const COL_X = [218, 721, 1225, 1728, 2232];
const ROW_Y = [113, 580, 1049];
const SIDE = 373;
const OUT_SIZE = 176;   // ใหญ่สุดที่เอาไปแสดงคือ 54px — 176 คือ 3x กว่า ๆ พอดี ไม่เปลืองเน็ต

/**
 * ชื่อไฟล์เรียงตามตำแหน่งในแผ่น (ซ้าย→ขวา บน→ล่าง)
 * หมายเหตุ: สองช่องท้ายสุดของแผ่นติดป้ายสลับกัน (15 มาก่อน 14)
 * และป้าย "15. NATGNAL" อ่านไม่ออกว่าตั้งใจให้เป็นอะไร — รูปเป็นกล่องแปลงสัญญาณ
 * เหมือนช่อง 14 จึงตั้งชื่อไฟล์ตามสิ่งที่รูปสื่อไว้ก่อน
 */
const GRID = [
  'server', 'switch', 'hub', 'router', 'l3-switch',
  'firewall', 'computer', 'notebook', 'access-point', 'wlc',
  'load-balancer', 'proxy', 'ids-ips', 'transceiver', 'media-converter',
];

/** ทำมุมโค้งให้โปร่งใส — ไอคอนจะได้ลอยอยู่บนพื้นสีอะไรก็ได้ */
function roundCorners(img, radiusRatio = 0.19) {
  const r = Math.min(img.w, img.h) * radiusRatio;
  for (let y = 0; y < img.h; y++) {
    for (let x = 0; x < img.w; x++) {
      const cx = Math.min(Math.max(x, r), img.w - r);
      const cy = Math.min(Math.max(y, r), img.h - r);
      const d = Math.hypot(x - cx, y - cy) - r;
      if (d <= 0) continue;
      const i = at(img, x, y);
      img.data[i + 3] = d >= 1 ? 0 : Math.round(255 * (1 - d));
    }
  }
  return img;
}

const sheet = readBmp(join(SRC, 'devices15.bmp'));
console.log(`แผ่นต้นฉบับ ${sheet.w}x${sheet.h}`);
mkdirSync(join(ROOT, 'assets', 'devices'), { recursive: true });

GRID.forEach((name, i) => {
  const col = i % COL_X.length;
  const row = Math.floor(i / COL_X.length);
  const square = crop(sheet, COL_X[col], ROW_Y[row], SIDE, SIDE);
  const icon = roundCorners(resize(square, OUT_SIZE, OUT_SIZE));
  writePng(join(ROOT, 'assets', 'devices', `${name}.png`), icon);
  console.log(`  ${name}.png ← (${COL_X[col]},${ROW_Y[row]}) ${SIDE}x${SIDE}`);
});
console.log(`เขียนไอคอน ${GRID.length} ไฟล์ลง assets/devices/`);
