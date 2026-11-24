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

// แถบแนวนอนของแต่ละส่วนในภาพต้นฉบับ ใช้ตอนตัด .COM และจัดกึ่งกลางใหม่
const WORD_Y = [715, 814];   // ASD-ACADEMY.COM
const MONO_Y = [110, 678];   // ตัว A

const DARK = [11, 14, 20];              // --bg ของธีม

/**
 * ตัด ".COM" ออกจากตัวหนังสือ ให้ตรงกับชื่อที่ใช้เป็นข้อความในเว็บ (ASD ACADEMY)
 *
 * ตัดด้วยพิกัดไม่ได้ตรง ๆ เพราะแขนขวาของตัว Y กับจุด "." อยู่ในคอลัมน์เดียวกัน
 * แต่คนละความสูง — วัดแล้วแขน Y อยู่ y 720-751 ส่วนจุดอยู่ y 795-814
 * จึงลบเป็นสองส่วน: "COM" ตัดทั้งคอลัมน์ตั้งแต่ x 1186 (หลังช่องว่าง)
 * ส่วนจุดตัดเฉพาะครึ่งล่างของคอลัมน์ 1166-1185
 *
 * ลบแล้วตัวหนังสือจะเยื้องไปทางซ้าย จึงเลื่อนกลับมาให้กึ่งกลางตรงกับตัว A ด้านบน
 * (คำนวณจากขอบจริงที่วัดได้ ไม่ได้ฮาร์ดโค้ดระยะไว้)
 */
function dropDotCom(img) {
  const white = (x, y) => {
    const i = at(img, x, y);
    img.data[i] = 255; img.data[i + 1] = 255; img.data[i + 2] = 255;
  };
  const isInk = (x, y) => {
    const i = at(img, x, y);
    const r = img.data[i], g = img.data[i + 1], b = img.data[i + 2];
    return Math.max(r, g, b) - Math.min(r, g, b) > 12 || 0.299 * r + 0.587 * g + 0.114 * b < 244;
  };

  for (let y = WORD_Y[0]; y <= WORD_Y[1]; y++) {
    for (let x = 1186; x < img.w; x++) white(x, y);
    if (y >= 790) for (let x = 1166; x <= 1185; x++) white(x, y);
  }

  const bbox = (ya, yb) => {
    let a = img.w, b = -1;
    for (let y = ya; y <= yb; y++) for (let x = 0; x < img.w; x++) {
      if (!isInk(x, y)) continue;
      if (x < a) a = x; if (x > b) b = x;
    }
    return [a, b];
  };
  const [wa, wb] = bbox(...WORD_Y);
  const [ma, mb] = bbox(...MONO_Y);
  const shift = Math.round((ma + mb) / 2 - (wa + wb) / 2);

  const band = crop(img, 0, WORD_Y[0], img.w, WORD_Y[1] - WORD_Y[0] + 1);
  for (let y = WORD_Y[0]; y <= WORD_Y[1]; y++) for (let x = 0; x < img.w; x++) white(x, y);
  for (let y = 0; y < band.h; y++) {
    for (let x = 0; x < band.w; x++) {
      const nx = x + shift;
      if (nx < 0 || nx >= img.w) continue;
      const s = at(band, x, y), d = at(img, nx, y + WORD_Y[0]);
      img.data[d] = band.data[s]; img.data[d + 1] = band.data[s + 1]; img.data[d + 2] = band.data[s + 2];
    }
  }
  console.log(`ตัด .COM ออก แล้วเลื่อนตัวหนังสือไปขวา ${shift} px ให้กึ่งกลางตรงกับตัว A`);
  return img;
}

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

// อ่านต้นฉบับครั้งเดียวแล้วตัด .COM ก่อน จากนั้นค่อยครอบเอาแต่ละส่วนออกมา
const logo = dropDotCom(readBmp(SRC));
console.log(`ต้นฉบับ ${logo.w} x ${logo.h}`);

const prep = (box) => trim(liftForDark(cutWhite(crop(logo, ...box))), 4);

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
