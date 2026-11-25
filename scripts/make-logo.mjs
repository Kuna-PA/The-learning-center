// ============================================================
//  สร้าง asset ของโลโก้ ASD ACADEMY จากไฟล์ต้นฉบับ
//    node scripts/make-logo.mjs <ไฟล์ asd-logo.bmp>
//
//  ต้นฉบับเป็นโลโก้วางซ้อนสามชั้น: ตัว A ที่มีลายวงจรอยู่บน · คำว่า ASD ตรงกลาง
//  · คำว่า ACADEMY ล่างสุด โทนสีกรมท่ากับเขียวเทอร์ควอยซ์ และมีเส้นวงจรสีขาว
//
//  ต่างจากโลโก้ชุดก่อน ๆ ตรงที่ไฟล์นี้ **มีช่อง alpha มาแล้วจริง ๆ**
//  (ตรวจแล้วพื้นหลังโปร่งใสสนิท) จึงไม่ต้องตัดพื้นหลังเองเลย
//  และสำคัญกว่านั้นคือ **ห้ามตัดด้วยความอิ่มสีเด็ดขาด** เพราะเส้นวงจรในโลโก้นี้
//  เป็นสีขาวซึ่งไร้สี ถ้าใช้วิธีเดิมเส้นวงจรจะหายไปทั้งหมด
//
//  เหลืองานเดียวคือ **ยกความสว่างของสีกรมท่าให้อ่านออกบนธีมมืด**
//  สีเข้มสุดในโลโก้คือ rgb(0,0,39) ซึ่งบนพื้น #0b0e14 ได้ contrast 1.00:1
//  คือมองไม่เห็นเลย · หลังปรับได้เฉลี่ย 6.24:1
//  ใช้วิธีขยับค่า L ใน HSL ไม่ใช่ผสมสีขาว เพราะการผสมขาวจะทำให้สีกลายเป็นเทา
//  และข้ามพิกเซลที่ไร้สี (s < 0.08) ไว้ เส้นวงจรสีขาวจึงยังขาวเหมือนเดิม
//
//  แปลง .png เป็น .bmp ก่อนด้วย (Windows PowerShell) — ช่อง alpha ติดไปด้วย:
//    Add-Type -AssemblyName System.Drawing
//    $i=[System.Drawing.Image]::FromFile('assets\src\asd-logo.png')
//    $b=New-Object System.Drawing.Bitmap($i.Width,$i.Height,'Format32bppArgb')
//    $g=[System.Drawing.Graphics]::FromImage($b); $g.DrawImage($i,0,0,$i.Width,$i.Height); $g.Dispose()
//    $b.Save('asd-logo.bmp','Bmp')
//
//  ไฟล์ผลลัพธ์ commit ลง repo แล้ว — ปกติไม่ต้องรันซ้ำ ยกเว้นตอนเปลี่ยนโลโก้
// ============================================================
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readBmp, writePng, crop, resize, trim, fitSquare, createImage, at } from './lib/img.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = process.argv[2];
if (!SRC) {
  console.error('ใช้: node scripts/make-logo.mjs <ไฟล์ asd-logo.bmp>');
  process.exit(1);
}
const out = (name) => join(ROOT, name);

// ---------- ตำแหน่งที่ครอบไว้ในภาพต้นฉบับ (1137 x 1383) ----------
// วัดจากช่อง alpha จริง: ทั้งโลโก้อยู่ x 88–1024 · y 69–1282
// มีช่องว่างแนวนอนที่ y 796–881 แยกตัว A ออกจากคำว่า ASD
// และที่ y 1136–1182 แยก ASD ออกจาก ACADEMY
// ตัว A เองกินพื้นที่ x 108–998 · y 69–795
const LOGO_FULL = [78, 59, 956, 1233];
const LOGO_MARK = [98, 59, 910, 747];

const DARK = [11, 14, 20];              // --bg ของธีม

// ---------- แปลงสีไป-กลับ HSL ----------
function toHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  const l = (mx + mn) / 2;
  if (!d) return [0, 0, l];
  const s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  let h;
  if (mx === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (mx === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h, s, l];
}
function toRgb(h, s, l) {
  if (!s) { const v = l * 255; return [v, v, v]; }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  const f = (t) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255];
}

/**
 * ยกความสว่างของพิกเซลเข้มโดยคงเฉดสีและความอิ่มสีไว้
 * ข้ามพิกเซลไร้สี (เส้นวงจรสีขาว) และพิกเซลที่สว่างพออยู่แล้ว
 * keep = เหลือไล่เฉดเดิมไว้เท่าไร · 0 คือตัดเรียบเท่ากันหมด
 */
function liftForDark(img, { floor = 0.52, keep = 0.3, satBoost = 1.1 } = {}) {
  for (let i = 0; i < img.data.length; i += 4) {
    if (img.data[i + 3] < 10) continue;
    const [h, s, l] = toHsl(img.data[i], img.data[i + 1], img.data[i + 2]);
    if (l >= floor || s < 0.08) continue;
    const [r, g, b] = toRgb(h, Math.min(1, s * satBoost), floor - (floor - l) * keep);
    img.data[i] = r; img.data[i + 1] = g; img.data[i + 2] = b;
  }
  return img;
}

/** วางภาพลงบนสี่เหลี่ยมมุมมนสีเข้ม — ไอคอนแอปต้องดูดีทั้งบนพื้นสว่างและมืด */
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

const wide = (img, w) => resize(img, w, Math.round(w * img.h / img.w));
const prep = (box) => trim(liftForDark(crop(readBmp(SRC), ...box)), 4);

const logo = readBmp(SRC);
console.log(`ต้นฉบับ ${logo.w} x ${logo.h} (มีช่อง alpha มาแล้ว ไม่ต้องตัดพื้นหลัง)`);

// โลโก้ตัวนี้เป็นแนวตั้ง จึงคิดขนาดจากความสูงที่จะแสดงจริงเป็นหลัก
const full = prep(LOGO_FULL);
writePng(out('assets/logo-full.png'), wide(full, 440));

const mark = prep(LOGO_MARK);
writePng(out('assets/logo-mark.png'), wide(mark, 240));

writePng(out('icon-192.png'), onDarkTile(mark, 192, 18));
writePng(out('icon-512.png'), onDarkTile(mark, 512, 48));
writePng(out('assets/favicon.png'), onDarkTile(mark, 64, 5));

console.log('เขียนไฟล์แล้ว:');
console.log(`  assets/logo-full.png   ${full.w} x ${full.h} (ย่อเหลือกว้าง 440)`);
console.log(`  assets/logo-mark.png   ${mark.w} x ${mark.h} (ย่อเหลือกว้าง 240)`);
console.log('  icon-192.png · icon-512.png · assets/favicon.png');
