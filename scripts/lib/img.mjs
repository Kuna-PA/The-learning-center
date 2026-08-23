// ============================================================
//  เครื่องมือรูปภาพเล็ก ๆ ที่ใช้เตรียม asset ของเว็บ
//  อ่าน BMP (ที่แปลงมาจากไฟล์ต้นฉบับ) → แก้ไขระดับพิกเซล → เขียน PNG
//  เขียนเองทั้งหมดด้วย node:zlib เพื่อคงกติกาของโปรเจกต์ที่ว่า "ไม่มี dependency"
// ============================================================
import { deflateSync } from 'node:zlib';
import { readFileSync, writeFileSync } from 'node:fs';

// ---------- รูปภาพในหน่วยความจำ: RGBA ต่อเนื่องกันไป ----------
export const createImage = (w, h) => ({ w, h, data: new Uint8ClampedArray(w * h * 4) });
export const at = (img, x, y) => (y * img.w + x) * 4;
export const inside = (img, x, y) => x >= 0 && y >= 0 && x < img.w && y < img.h;

/** อ่าน BMP 24/32 บิตแบบไม่บีบอัด (รูปแบบที่ .NET เซฟให้) */
export function readBmp(file) {
  const b = readFileSync(file);
  if (b[0] !== 0x42 || b[1] !== 0x4d) throw new Error('ไม่ใช่ไฟล์ BMP');
  const dataOffset = b.readUInt32LE(10);
  const headerSize = b.readUInt32LE(14);
  const w = b.readInt32LE(18);
  const rawH = b.readInt32LE(22);
  const bpp = b.readUInt16LE(28);
  const compression = b.readUInt32LE(30);
  if (headerSize < 40 || compression > 3) throw new Error('รองรับเฉพาะ BMP แบบไม่บีบอัด');
  if (bpp !== 24 && bpp !== 32) throw new Error('รองรับเฉพาะ 24/32 บิต');

  const h = Math.abs(rawH);
  const bottomUp = rawH > 0;              // BMP ปกติเรียงแถวจากล่างขึ้นบน
  const bytes = bpp / 8;
  const stride = Math.ceil((w * bytes) / 4) * 4;
  const img = createImage(w, h);

  for (let y = 0; y < h; y++) {
    const src = dataOffset + (bottomUp ? h - 1 - y : y) * stride;
    for (let x = 0; x < w; x++) {
      const s = src + x * bytes;
      const d = at(img, x, y);
      img.data[d] = b[s + 2];             // BMP เก็บเป็น BGR(A)
      img.data[d + 1] = b[s + 1];
      img.data[d + 2] = b[s];
      img.data[d + 3] = bytes === 4 ? b[s + 3] : 255;
    }
  }
  // ไฟล์ที่ .NET เซฟบางครั้งมี alpha เป็น 0 ทั้งภาพ — ถือว่าทึบทั้งหมด
  if (bytes === 4 && !img.data.some((v, i) => i % 4 === 3 && v !== 0)) {
    for (let i = 3; i < img.data.length; i += 4) img.data[i] = 255;
  }
  return img;
}

// ---------- เขียน PNG ----------
const crcTable = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
const crc32 = (buf) => {
  let c = -1;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
};
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

const paeth = (a, b, c) => {
  const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
};

/**
 * เขียน PNG แบบ RGBA 8 บิต
 * เลือก filter ของแต่ละบรรทัดด้วยเกณฑ์ผลรวมค่าสัมบูรณ์ (heuristic มาตรฐานของ libpng)
 * รูปวาดที่มีพื้นที่สีเรียบ ๆ จะเล็กลงราวครึ่งหนึ่งเมื่อเทียบกับการไม่ใช้ filter เลย
 */
export function writePng(file, img) {
  const bpp = 4;
  const rowLen = img.w * bpp;
  const raw = Buffer.alloc((rowLen + 1) * img.h);
  const prev = Buffer.alloc(rowLen);
  const line = Buffer.alloc(rowLen);
  const cand = [0, 1, 2, 3, 4].map(() => Buffer.alloc(rowLen));

  for (let y = 0; y < img.h; y++) {
    for (let x = 0; x < rowLen; x++) line[x] = img.data[y * rowLen + x];

    let best = 0, bestScore = Infinity;
    for (let f = 0; f <= 4; f++) {
      const buf = cand[f];
      let score = 0;
      for (let x = 0; x < rowLen; x++) {
        const a = x >= bpp ? line[x - bpp] : 0;
        const b = prev[x];
        const c = x >= bpp ? prev[x - bpp] : 0;
        const v = f === 0 ? line[x]
          : f === 1 ? line[x] - a
            : f === 2 ? line[x] - b
              : f === 3 ? line[x] - ((a + b) >> 1)
                : line[x] - paeth(a, b, c);
        buf[x] = v & 0xff;
        score += buf[x] < 128 ? buf[x] : 256 - buf[x];
      }
      if (score < bestScore) { bestScore = score; best = f; }
    }

    const off = y * (rowLen + 1);
    raw[off] = best;
    cand[best].copy(raw, off + 1);
    line.copy(prev);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(img.w, 0);
  ihdr.writeUInt32BE(img.h, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 6;   // RGBA
  writeFileSync(file, Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]));
  return file;
}

// ---------- การแปลงภาพ ----------
export function crop(img, x0, y0, w, h) {
  const out = createImage(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const s = at(img, x0 + x, y0 + y), d = at(out, x, y);
      if (!inside(img, x0 + x, y0 + y)) { out.data[d + 3] = 0; continue; }
      out.data[d] = img.data[s]; out.data[d + 1] = img.data[s + 1];
      out.data[d + 2] = img.data[s + 2]; out.data[d + 3] = img.data[s + 3];
    }
  }
  return out;
}

/** ย่อภาพแบบเฉลี่ยพื้นที่ (box filter) — คมกว่าการสุ่มจุดเดียวมากเวลาย่อจากภาพใหญ่ */
export function resize(img, w, h) {
  const out = createImage(w, h);
  const sx = img.w / w, sy = img.h / h;
  for (let y = 0; y < h; y++) {
    const y0 = Math.floor(y * sy), y1 = Math.max(y0 + 1, Math.floor((y + 1) * sy));
    for (let x = 0; x < w; x++) {
      const x0 = Math.floor(x * sx), x1 = Math.max(x0 + 1, Math.floor((x + 1) * sx));
      let r = 0, g = 0, b = 0, a = 0, n = 0;
      for (let yy = y0; yy < y1; yy++) {
        for (let xx = x0; xx < x1; xx++) {
          const s = at(img, xx, yy);
          const al = img.data[s + 3] / 255;
          r += img.data[s] * al; g += img.data[s + 1] * al; b += img.data[s + 2] * al;
          a += img.data[s + 3]; n++;
        }
      }
      const d = at(out, x, y);
      const aw = a / 255;                  // ถ่วงน้ำหนักสีด้วย alpha ไม่ให้ขอบเป็นสีดำจาง ๆ
      out.data[d] = aw ? r / aw : 0;
      out.data[d + 1] = aw ? g / aw : 0;
      out.data[d + 2] = aw ? b / aw : 0;
      out.data[d + 3] = a / n;
    }
  }
  return out;
}

/** ตัดขอบที่โปร่งใสออกให้หมด แล้วคืนภาพที่พอดีกับตัววัตถุ */
export function trim(img, pad = 0) {
  let minX = img.w, minY = img.h, maxX = -1, maxY = -1;
  for (let y = 0; y < img.h; y++) {
    for (let x = 0; x < img.w; x++) {
      if (img.data[at(img, x, y) + 3] > 8) {
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return img;
  minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad);
  maxX = Math.min(img.w - 1, maxX + pad); maxY = Math.min(img.h - 1, maxY + pad);
  return crop(img, minX, minY, maxX - minX + 1, maxY - minY + 1);
}

/** วางภาพลงบนผืนสี่เหลี่ยมจัตุรัส โดยคงสัดส่วนเดิม */
export function fitSquare(img, size, margin = 0) {
  const box = size - margin * 2;
  const scale = Math.min(box / img.w, box / img.h);
  const w = Math.max(1, Math.round(img.w * scale));
  const h = Math.max(1, Math.round(img.h * scale));
  const small = resize(img, w, h);
  const out = createImage(size, size);
  const ox = Math.round((size - w) / 2), oy = Math.round((size - h) / 2);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const s = at(small, x, y), d = at(out, ox + x, oy + y);
      out.data[d] = small.data[s]; out.data[d + 1] = small.data[s + 1];
      out.data[d + 2] = small.data[s + 2]; out.data[d + 3] = small.data[s + 3];
    }
  }
  return out;
}

export const dist = (img, i, [r, g, b]) =>
  Math.max(Math.abs(img.data[i] - r), Math.abs(img.data[i + 1] - g), Math.abs(img.data[i + 2] - b));

/**
 * ลบพื้นหลังด้วยการเท sี (flood fill) จากขอบภาพเข้ามา
 * ใช้กับภาพที่พื้นหลังเป็นลายตารางหมากรุกซึ่งไล่สีไม่ได้ด้วยการเทียบสีเฉย ๆ
 * ไล่จากขอบเท่านั้น สีขาวที่อยู่ "ข้างใน" เส้นขอบของตัวละครจึงไม่ถูกลบไปด้วย
 */
export function removeBackground(img, colors, tolerance = 20) {
  const seen = new Uint8Array(img.w * img.h);
  const stack = [];
  const push = (x, y) => {
    if (!inside(img, x, y) || seen[y * img.w + x]) return;
    const i = at(img, x, y);
    if (!colors.some(c => dist(img, i, c) <= tolerance)) return;
    seen[y * img.w + x] = 1;
    stack.push(x, y);
  };
  for (let x = 0; x < img.w; x++) { push(x, 0); push(x, img.h - 1); }
  for (let y = 0; y < img.h; y++) { push(0, y); push(img.w - 1, y); }

  while (stack.length) {
    const y = stack.pop(), x = stack.pop();
    img.data[at(img, x, y) + 3] = 0;
    push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
  }
  return img;
}

/** ไล่สีขอบให้นุ่มขึ้นหนึ่งชั้น — กันขอบหยักหลังลบพื้นหลัง */
export function featherEdges(img, colors, tolerance = 46) {
  const src = img.data.slice();
  const alphaAt = (x, y) => (inside(img, x, y) ? src[at(img, x, y) + 3] : 0);
  for (let y = 0; y < img.h; y++) {
    for (let x = 0; x < img.w; x++) {
      const i = at(img, x, y);
      if (src[i + 3] === 0) continue;
      const touchesHole = alphaAt(x + 1, y) === 0 || alphaAt(x - 1, y) === 0
        || alphaAt(x, y + 1) === 0 || alphaAt(x, y - 1) === 0;
      if (!touchesHole) continue;
      const near = Math.min(...colors.map(c => dist(img, i, c)));
      if (near < tolerance) img.data[i + 3] = Math.round(255 * (near / tolerance));
    }
  }
  return img;
}

/**
 * ทำให้พื้นหลังสีอ่อน (เช่นกระดาษ) โปร่งใส โดยใช้ความสว่างเป็น alpha
 * เหมาะกับโลโก้สีเข้มบนพื้นอ่อน — ขอบที่ไล่สีจะยังเนียนอยู่
 */
export function keyOutLight(img, { white = 236, black = 96 } = {}) {
  for (let i = 0; i < img.data.length; i += 4) {
    const lum = 0.299 * img.data[i] + 0.587 * img.data[i + 1] + 0.114 * img.data[i + 2];
    const a = 1 - (lum - black) / (white - black);
    const alpha = Math.max(0, Math.min(1, a));
    img.data[i + 3] = Math.round(alpha * 255);
    if (alpha > 0) {
      // คืนความอิ่มสีที่หายไปจากการผสมกับพื้นขาว: unmultiply จากสูตร composite over white
      for (let k = 0; k < 3; k++) {
        img.data[i + k] = Math.max(0, Math.min(255, (img.data[i + k] - 255 * (1 - alpha)) / alpha));
      }
    }
  }
  return img;
}

/**
 * เก็บกวาดเศษพื้นหลังที่การเทสีเข้าไม่ถึง (เช่นช่องตารางที่ถูกล้อมด้วยผ้าคลุม)
 * ลายตารางเป็นสีเทาล้วนสนิท (chroma = 0) ส่วนงานวาดมีสีอมอยู่เสมอ จึงแยกกันได้ด้วยความอิ่มสี
 */
export function killFlatBackground(img, colors, { lumTol = 8, chromaMax = 4 } = {}) {
  const lumOf = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;
  const targets = colors.map(c => lumOf(...c));
  for (let i = 0; i < img.data.length; i += 4) {
    if (img.data[i + 3] === 0) continue;
    const r = img.data[i], g = img.data[i + 1], b = img.data[i + 2];
    if (Math.max(r, g, b) - Math.min(r, g, b) > chromaMax) continue;
    const lum = lumOf(r, g, b);
    if (targets.some(t => Math.abs(lum - t) <= lumTol)) img.data[i + 3] = 0;
  }
  return img;
}
