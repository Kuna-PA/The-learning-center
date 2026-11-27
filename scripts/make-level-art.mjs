// ============================================================
//  ตัดภาพประจำระดับ 6 ภาพออกจากไฟล์ต้นฉบับแผ่นเดียว
//    node scripts/make-level-art.mjs <ไฟล์ level-art.bmp>
//
//  ต้นฉบับเป็นภาพตาราง 3 คอลัมน์ 2 แถว ขนาด 1536 x 1024 (ช่องละ 512 x 512)
//  แต่ละช่องมี "ภาพประกอบ" อยู่ครึ่งบน และ "ป้ายชื่อระดับ" อยู่ครึ่งล่าง
//  เราเอาเฉพาะภาพประกอบ เพราะการ์ดบทเรียนพิมพ์ชื่อระดับไว้ให้อยู่แล้ว
//  และตัวหนังสือในป้ายจะเล็กจนอ่านไม่ออกเมื่อย่อลงเหลือราว 100px
//
//  ป้ายชื่อของแถวบนเริ่มที่ y≈350 ส่วนแถวล่างเริ่มที่ y≈335 (วัดจากไฟล์จริง)
//  จึงตัดคนละค่ากัน แล้วค่อยให้ trim() หาขอบเนื้อภาพจริงอีกที
//
//  พื้นหลังดำสนิทถูกลบด้วยการเทสีจากขอบเข้ามา ภาพจึงลอยอยู่บนพื้นการ์ดได้
//  โดยที่สีกรมท่าเข้ม ๆ ข้างในไม่หายไปด้วย (ห่างจากดำสนิทเกิน tolerance)
//
//  แปลง .webp เป็น .bmp ก่อน (Windows PowerShell — ใช้ตัวถอดรหัสของ Windows เอง):
//    Add-Type -AssemblyName PresentationCore
//    $s=[System.IO.File]::OpenRead('assets\src\level-art.webp')
//    $f=[System.Windows.Media.Imaging.BitmapDecoder]::Create($s,'None','OnLoad').Frames[0]
//    $c=New-Object System.Windows.Media.Imaging.FormatConvertedBitmap($f,[System.Windows.Media.PixelFormats]::Bgra32,$null,0)
//    $e=New-Object System.Windows.Media.Imaging.BmpBitmapEncoder
//    $e.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($c))
//    $o=[System.IO.File]::Create('level-art.bmp'); $e.Save($o); $o.Close(); $s.Close()
//
//  ไฟล์ผลลัพธ์ commit ลง repo แล้ว ปกติไม่ต้องรันซ้ำ ยกเว้นตอนเปลี่ยนภาพ
// ============================================================
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';
import { readBmp, writePng, crop, resize, trim, removeBackground, featherEdges } from './lib/img.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = process.argv[2];
if (!SRC) {
  console.error('ใช้: node scripts/make-level-art.mjs <ไฟล์ level-art.bmp>');
  process.exit(1);
}

const COLS = 3, ROWS = 2;
/**
 * ความสูงของ "ภาพประกอบ" ในแต่ละช่อง ก่อนจะถึงป้ายชื่อระดับ (เรียงช่อง 1-6)
 * วัดจากไฟล์จริงทีละช่อง เพราะป้ายของแต่ละช่องไม่ได้เริ่มที่ความสูงเดียวกัน
 * และช่อง 3 กับ 6 มีกรอบทองของป้ายยื่นขึ้นมาก่อนตัวป้าย จึงต้องตัดสูงกว่าเพื่อน
 */
const ART_H = [346, 350, 338, 330, 334, 272];
const OUT_W = 380;               // กว้างพอให้คมบนจอความละเอียดสูง

const src = readBmp(SRC);
console.log(`ต้นฉบับ ${src.w} x ${src.h}`);
const TW = Math.round(src.w / COLS), TH = Math.round(src.h / ROWS);
if (TW !== 512 || TH !== 512) {
  console.warn(`เตือน: ช่องละ ${TW} x ${TH} ไม่ใช่ 512 x 512 — ค่า ART_H อาจต้องปรับตาม`);
}
if (ART_H.length !== COLS * ROWS) throw new Error('ART_H ต้องมีค่าครบทุกช่อง');

const dir = join(ROOT, 'assets', 'levels');
mkdirSync(dir, { recursive: true });

for (let r = 0; r < ROWS; r++) {
  for (let c = 0; c < COLS; c++) {
    const n = r * COLS + c + 1;
    let img = crop(src, c * TW, r * TH, TW, ART_H[n - 1]);
    removeBackground(img, [[0, 0, 0]], 26);
    featherEdges(img, [[0, 0, 0]], 40);
    img = trim(img, 2);
    img = resize(img, OUT_W, Math.round(OUT_W * img.h / img.w));
    const out = join(dir, `lv${n}.png`);
    writePng(out, img);
    console.log(`  assets/levels/lv${n}.png   ${img.w} x ${img.h}`);
  }
}
console.log('เสร็จแล้ว');
