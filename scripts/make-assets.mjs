// ============================================================
//  เตรียม asset ของเว็บจากไฟล์ภาพต้นฉบับ
//    node scripts/make-assets.mjs <โฟลเดอร์ที่มี logo.bmp และ julong.bmp>
//
//  ต้นฉบับเป็น .jpg ที่มีพื้นหลังติดมาด้วย (โลโก้อยู่บนกระดาษ · ตัวละครอยู่บนลายตารางหมากรุก)
//  สคริปต์นี้ลบพื้นหลังออกให้เป็น PNG โปร่งใส ย่อขนาด แล้วเขียนลง assets/
//
//  แปลง .jpg เป็น .bmp ก่อนด้วย (Windows PowerShell):
//    Add-Type -AssemblyName System.Drawing
//    $i=[System.Drawing.Image]::FromFile('Logo.jpg')
//    $b=New-Object System.Drawing.Bitmap($i.Width,$i.Height,'Format32bppArgb')
//    $g=[System.Drawing.Graphics]::FromImage($b); $g.DrawImage($i,0,0,$i.Width,$i.Height); $g.Dispose()
//    $b.Save('logo.bmp','Bmp')
//
//  ไฟล์ผลลัพธ์ commit ลง repo แล้ว — ปกติไม่ต้องรันสคริปต์นี้ซ้ำ
//  ยกเว้นตอนเปลี่ยนรูปต้นฉบับ
// ============================================================
import { mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  readBmp, writePng, crop, resize, trim, fitSquare, createImage, at,
  removeBackground, featherEdges, killFlatBackground,
} from './lib/img.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = process.argv[2];
if (!SRC) {
  console.error('ใช้: node scripts/make-assets.mjs <โฟลเดอร์ที่มี logo.bmp และ julong.bmp>');
  process.exit(1);
}
mkdirSync(join(ROOT, 'assets'), { recursive: true });
const out = (name) => join(ROOT, name);

// ---------- ตำแหน่งที่ครอบไว้ในภาพต้นฉบับ (2816 x 1536) ----------
const LOGO_MARK = [1040, 225, 770, 740];      // เฉพาะสัญลักษณ์หนังสือ+ลูกศร
const LOGO_FULL = [380, 225, 2060, 980];      // สัญลักษณ์ + ตัวหนังสือ + เส้นใต้
const LOGO_WORDMARK_ROWS = [770, 900];        // แถวของคำว่า THE LEARNING CENTER (นับจากขอบบนของ LOGO_FULL)
const JULONG_BUST = [1200, 70, 620, 720];     // หัวถึงไหล่ — ไม่มีเอฟเฟกต์เรืองแสงมากวน
const JULONG_FULL = [780, 40, 1420, 1460];    // เต็มตัว

const DARK = [11, 14, 20];                    // --bg ของธีม

/**
 * โลโก้อยู่บนกระดาษสีเทาอ่อนที่มีทั้งพื้นผิวและเงา — จะไล่ด้วยความสว่างอย่างเดียวไม่ได้
 * แต่กระดาษเป็นสี "ไร้สี" (r≈g≈b) ส่วนโลโก้เป็นน้ำเงิน–เขียวจัด จึงใช้ความอิ่มสีเป็น alpha แทน
 */
function keyOutPaper(img, { lo = 10, hi = 45, paper = [242, 242, 242] } = {}) {
  for (let i = 0; i < img.data.length; i += 4) {
    const r = img.data[i], g = img.data[i + 1], b = img.data[i + 2];
    const chroma = Math.max(r, g, b) - Math.min(r, g, b);
    const alpha = Math.max(0, Math.min(1, (chroma - lo) / (hi - lo)));
    img.data[i + 3] = Math.round(alpha * 255);
    if (alpha > 0.02) {
      // ขอบตัวอักษรผสมกับสีกระดาษมา ต้องถอดสีกระดาษออกให้สีกลับมาเข้มเท่าเดิม
      for (let k = 0; k < 3; k++) {
        img.data[i + k] = Math.max(0, Math.min(255,
          (img.data[i + k] - paper[k] * (1 - alpha)) / alpha));
      }
    }
  }
  return img;
}

/** วางภาพลงบนสี่เหลี่ยมมุมมนสีเข้ม — ใช้ทำไอคอนแอปที่ต้องดูดีทั้งบนพื้นสว่างและมืด */
function onDarkTile(img, size, margin) {
  const tile = createImage(size, size);
  const radius = size * 0.22;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const cx = Math.min(Math.max(x, radius), size - radius);
      const cy = Math.min(Math.max(y, radius), size - radius);
      const outside = Math.hypot(x - cx, y - cy) - radius;
      const a = outside > 1 ? 0 : outside > 0 ? 1 - outside : 1;
      const d = at(tile, x, y);
      tile.data[d] = DARK[0]; tile.data[d + 1] = DARK[1]; tile.data[d + 2] = DARK[2];
      tile.data[d + 3] = Math.round(a * 255);
    }
  }
  const fg = fitSquare(img, size, margin);
  for (let i = 0; i < tile.data.length; i += 4) {
    const a = fg.data[i + 3] / 255;
    if (!a) continue;
    for (let k = 0; k < 3; k++) tile.data[i + k] = fg.data[i + k] * a + tile.data[i + k] * (1 - a);
    tile.data[i + 3] = Math.max(tile.data[i + 3], fg.data[i + 3]);
  }
  return tile;
}

/**
 * ตัวหนังสือในโลโก้เป็นน้ำเงินเข้มเพราะออกแบบมาสำหรับพื้นขาว
 * พอวางบนธีมมืดของเว็บจะอ่านแทบไม่ออก จึงเปลี่ยนเฉพาะแถวของตัวหนังสือให้เป็นสีสว่าง
 * (สัญลักษณ์กับเส้นใต้ยังเป็นสีเดิม เพราะสว่างพออยู่แล้ว)
 */
function lightenWordmark(img, [from, to], tint = [232, 237, 247]) {
  for (let y = from; y <= to && y < img.h; y++) {
    for (let x = 0; x < img.w; x++) {
      const i = at(img, x, y);
      if (!img.data[i + 3]) continue;
      img.data[i] = tint[0]; img.data[i + 1] = tint[1]; img.data[i + 2] = tint[2];
    }
  }
  return img;
}

// ---------- โลโก้ ----------
const logo = readBmp(join(SRC, 'logo.bmp'));

const mark = trim(keyOutPaper(crop(logo, ...LOGO_MARK)), 4);
// ขนาดที่เขียนออกมาเผื่อจอ 3x ของที่ใหญ่สุดที่เอาไปแสดง (54px) แล้ว — ใหญ่กว่านี้คือเปลืองเปล่า
writePng(out('assets/logo-mark.png'), resize(mark, 160, Math.round(160 * mark.h / mark.w)));

const full = trim(lightenWordmark(keyOutPaper(crop(logo, ...LOGO_FULL)), LOGO_WORDMARK_ROWS), 6);
writePng(out('assets/logo-full.png'), resize(full, 600, Math.round(600 * full.h / full.w)));

// ไอคอนแอป (PWA) — สัญลักษณ์บนพื้นเข้มของธีม
writePng(out('icon-192.png'), onDarkTile(mark, 192, 26));
writePng(out('icon-512.png'), onDarkTile(mark, 512, 70));
writePng(out('assets/favicon.png'), onDarkTile(mark, 64, 7));

// ---------- จูล่ง ----------
// พื้นหลังเป็นลายตารางหมากรุกสองสี ต้องเทสีจากขอบเข้ามา ไม่ใช่เทียบสีทั้งภาพ
// ไม่งั้นผ้าคลุมสีขาวของตัวละครจะหายไปด้วย
const CHECKER = [[227, 227, 227], [183, 183, 183]];
const julong = readBmp(join(SRC, 'julong.bmp'));

const cut = (box) => {
  const img = crop(julong, ...box);
  removeBackground(img, CHECKER, 26);
  killFlatBackground(img, CHECKER);
  featherEdges(img, CHECKER, 40);
  return trim(img, 2);
};

const bust = cut(JULONG_BUST);
writePng(out('assets/julong.png'), fitSquare(bust, 128, 1));

const body = cut(JULONG_FULL);
writePng(out('assets/julong-full.png'), resize(body, 340, Math.round(340 * body.h / body.w)));

console.log('เขียน asset เรียบร้อย:');
console.log('  assets/logo-mark.png · assets/logo-full.png · assets/favicon.png');
console.log('  icon-192.png · icon-512.png');
console.log('  assets/julong.png · assets/julong-full.png');
