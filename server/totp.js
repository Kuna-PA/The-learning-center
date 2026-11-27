// ============================================================
//  TOTP (RFC 6238) — รหัส 6 หลักที่เปลี่ยนทุก 30 วินาที
//
//  เขียนเองเพราะโปรเจกต์นี้ไม่มี dependency เลย และ node:crypto มี HMAC-SHA1
//  ให้อยู่แล้ว เหลือแค่ base32 กับการตัดเลขตามสเปก ซึ่งสั้นมาก
//
//  ใช้ได้กับแอป authenticator ทุกตัวที่รองรับ TOTP มาตรฐาน
//  (Google Authenticator, Microsoft Authenticator, Authy, 2FAS, FreeOTP ...)
//
//  ตั้งใจไม่ทำ QR code เองเพราะต้องเขียน Reed-Solomon กับ masking ทั้งชุด
//  หน้าเว็บจึงแสดง "กุญแจ" เป็นข้อความให้พิมพ์เข้าแอปแทน ซึ่งทุกแอปรองรับ
//  และเหมาะกับเครือข่ายปิดที่โหลดรูป QR จากข้างนอกไม่ได้อยู่แล้ว
// ============================================================
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/** แปลง buffer เป็น base32 ตาม RFC 4648 (ไม่ใส่ = ต่อท้าย เพราะแอป authenticator ไม่ต้องการ) */
export function base32Encode(buf) {
  let bits = 0, value = 0, out = '';
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) { out += B32[(value >>> (bits - 5)) & 31]; bits -= 5; }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}

/** แปลง base32 กลับเป็น buffer — ข้ามช่องว่างและ = ที่ผู้ใช้อาจก๊อปมาด้วย */
export function base32Decode(str) {
  let bits = 0, value = 0;
  const out = [];
  for (const ch of String(str).toUpperCase().replace(/[\s=]/g, '')) {
    const i = B32.indexOf(ch);
    if (i < 0) throw new Error('กุญแจไม่ใช่ base32 ที่ถูกต้อง');
    value = (value << 5) | i;
    bits += 5;
    if (bits >= 8) { out.push((value >>> (bits - 8)) & 255); bits -= 8; }
  }
  return Buffer.from(out);
}

/** กุญแจใหม่ — 20 ไบต์ = 160 บิต ตามที่ RFC 4226 แนะนำสำหรับ SHA-1 */
export const newSecret = () => base32Encode(randomBytes(20));

/** HOTP (RFC 4226) — ฐานของ TOTP */
export function hotp(secret, counter, digits = 6) {
  const key = typeof secret === 'string' ? base32Decode(secret) : secret;
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const mac = createHmac('sha1', key).update(buf).digest();
  const off = mac[mac.length - 1] & 0x0f;                       // dynamic truncation
  const bin = ((mac[off] & 0x7f) << 24) | (mac[off + 1] << 16) | (mac[off + 2] << 8) | mac[off + 3];
  return String(bin % 10 ** digits).padStart(digits, '0');
}

/** รหัสของช่วงเวลานี้ */
export const totp = (secret, { t = Date.now(), step = 30, digits = 6 } = {}) =>
  hotp(secret, Math.floor(t / 1000 / step), digits);

/**
 * ตรวจรหัสที่ผู้ใช้พิมพ์มา
 * ยอมให้คลาดเคลื่อนได้ ±1 ช่วง (รวม 90 วินาที) เผื่อนาฬิกาเครื่องกับมือถือไม่ตรงกัน
 * เทียบแบบ constant-time เพื่อไม่ให้เดารหัสจากเวลาที่ใช้ตอบ
 */
export function verifyTotp(secret, code, { t = Date.now(), step = 30, digits = 6, window = 1 } = {}) {
  const given = String(code || '').replace(/\s/g, '');
  if (!new RegExp(`^\\d{${digits}}$`).test(given)) return false;
  const now = Math.floor(t / 1000 / step);
  const a = Buffer.from(given);
  let ok = false;
  for (let i = -window; i <= window; i++) {
    const b = Buffer.from(hotp(secret, now + i, digits));
    // ไม่ break ทันทีที่เจอ เพื่อให้ใช้เวลาเท่ากันทุกครั้งไม่ว่ารหัสจะถูกหรือผิด
    if (a.length === b.length && timingSafeEqual(a, b)) ok = true;
  }
  return ok;
}

/**
 * URI มาตรฐานสำหรับใส่ในแอป authenticator
 * แอปส่วนใหญ่รับได้ทั้งจาก QR และจากการพิมพ์กุญแจเองพร้อมชื่อบัญชี
 */
export function otpauthUri({ user, secret, issuer = 'ASD ACADEMY' }) {
  const label = encodeURIComponent(`${issuer}:${user}`);
  const p = new URLSearchParams({ secret, issuer, algorithm: 'SHA1', digits: '6', period: '30' });
  return `otpauth://totp/${label}?${p}`;
}

/** แบ่งกุญแจเป็นกลุ่มละ 4 ตัว — พิมพ์เข้าแอปเองได้โดยไม่ตาลาย */
export const prettySecret = (secret) => String(secret).replace(/(.{4})/g, '$1 ').trim();
