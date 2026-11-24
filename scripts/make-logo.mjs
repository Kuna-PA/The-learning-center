// ============================================================
//  สร้าง asset ของโลโก้ ASD-ACADEMY.COM จากไฟล์ต้นฉบับ
//    node scripts/make-logo.mjs <ไฟล์ asd-logo.bmp>
//
//  ต้นฉบับเป็นโลโก้วางซ้อน: ตัว A พร้อมหมวกบัณฑิตและหนังสืออยู่บน
//  ตัวหนังสือ ASD-ACADEMY.COM และบรรทัดรองอยู่ล่าง ทั้งหมดเป็นโทนน้ำเงินบนพื้นขาว
//
//  สคริปต์นี้ทำสองอย่าง
//    1. ลบพื้นขาวออกให้หมดทั้งภาพ — ใช้ "ความอิ่มสี" (chroma) เป็นค่า alpha
//       ตรวจแล้วพื้นขาวมีความอิ่มสีสูงสุดแค่ 2 ส่วนงานโลโก้เป็นน้ำเงินล้วน
//       (ในกรอบเนื้อหามีพิกเซลที่มีสี 270,155 จุด เทาแค่ 2,519 จุด) จึงแยกกันได้หมดจด
//       วิธีนี้ยังลบช่องว่างที่ถูกตัวอักษรล้อมปิดไว้ (ใจกลาง A · D · O) ได้ด้วย
//       ซึ่งการเทสีจากขอบเข้ามาทำไม่ได้
//    2. ยกความสว่างของน้ำเงินเข้มเพื่อให้อ่านออกบนธีมมืด
//       สีเข้มสุดในโลโก้คือ rgb(0,1,54) ซึ่งบนพื้น #0b0e14 ได้ contrast 1.00:1
//       คือมองไม่เห็นเลย · หลังปรับได้เฉลี่ย 6.98:1
//       ใช้วิธีขยับค่า L ใน HSL ไม่ใช่ผสมสีขาว เพราะการผสมขาวจะทำให้น้ำเงินกลายเป็นเทา
//
//  แปลง .png/.jpg เป็น .bmp ก่อนด้วย (Windows PowerShell):
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

// ---------- ตำแหน่งที่ครอบไว้ในภาพต้นฉบับ (1536 x 1024) ----------
// วัดจากการไล่หาขอบเนื้อหาจริง: ทั้งโลโก้อยู่ x 90–1445 · y 110–880
// มีช่องว่างแนวนอนที่ y 679–714 แยกตัว A ออกจากตัวหนังสือ และที่ y 815–849 แยกบรรทัดรอง
// ตัว A เองกินพื้นที่ x 360–1166 · y 110–678
const LOGO_FULL = [80, 100, 1376, 790];
const LOGO_MARK = [350, 100, 826, 588];

const DARK = [11, 14, 20];              // --bg ของธีม

/** ลบพื้นขาวทั้งภาพโดยใช้ความอิ่มสีเป็น alpha · unmultiply คืนความเข้มให้พิกเซลขอบ */
function cutWhite(img, { lo = 10, hi = 46 } = {}) {
  for (let i = 0; i < img.data.length; i += 4) {
    const r = img.data[i], g = img.data[i + 1], b = img.data[i + 2];
    const chroma = Math.max(r, g, b) - Math.min(r, g, b);
    const a = Math.max(0, Math.min(1, (chroma - lo) / (hi - lo)));
    img.data[i + 3] = Math.round(a * 255);
    if (a > 0.02) {
      for (let k = 0; k < 3; k++) {
        img.data[i + k] = Math.max(0, Math.min(255, (img.data[i + k] - 255 * (1 - a)) / a));
      }
    }
  }
  return img;
}

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
 * keep = เหลือไล่เฉดเดิมไว้เท่าไร · ไม่แตะพิกเซลสีเทา/ขาว
 */
function liftForDark(img, { floor = 0.64, keep = 0.3, satBoost = 1.15 } = {}) {
  for (let i = 0; i < img.data.length; i += 4) {
    if (!img.data[i + 3]) continue;
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
const prep = (box) => trim(liftForDark(cutWhite(crop(readBmp(SRC), ...box))), 4);

const logo = readBmp(SRC);
console.log(`ต้นฉบับ ${logo.w} x ${logo.h}`);

const full = prep(LOGO_FULL);
writePng(out('assets/logo-full.png'), wide(full, 820));

const mark = prep(LOGO_MARK);
writePng(out('assets/logo-mark.png'), wide(mark, 240));

writePng(out('icon-192.png'), onDarkTile(mark, 192, 20));
writePng(out('icon-512.png'), onDarkTile(mark, 512, 54));
writePng(out('assets/favicon.png'), onDarkTile(mark, 64, 5));

console.log('เขียนไฟล์แล้ว:');
console.log(`  assets/logo-full.png   ${full.w} x ${full.h} (ย่อเหลือกว้าง 820)`);
console.log(`  assets/logo-mark.png   ${mark.w} x ${mark.h} (ย่อเหลือกว้าง 240)`);
console.log('  icon-192.png · icon-512.png · assets/favicon.png');
