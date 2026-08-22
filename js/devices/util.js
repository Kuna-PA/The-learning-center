// ---- helpers ที่ device emulator ทุกตัวใช้ร่วมกัน ----

export const words = s => s.trim().split(/\s+/).filter(Boolean);

export const pad = (s, n) => String(s ?? '').padEnd(n);
export const lpad = (s, n) => String(s ?? '').padStart(n);

export const E = s => ({ s, c: 'err' });      // error line
export const OK = s => ({ s, c: 'okc' });     // success line
export const D = s => ({ s, c: 'dimc' });     // dim line
export const H = s => ({ s, c: 'hl' });       // highlight

export function isIp(v) {
  if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(v)) return false;
  return v.split('.').every(o => +o >= 0 && +o <= 255);
}

export function maskToPrefix(mask) {
  if (!isIp(mask)) return null;
  const bits = mask.split('.').map(o => (+o).toString(2).padStart(8, '0')).join('');
  if (!/^1*0*$/.test(bits)) return null;
  return bits.replace(/0+$/, '').length;
}

export function prefixToMask(p) {
  p = +p;
  const bits = '1'.repeat(p).padEnd(32, '0');
  return [0, 8, 16, 24].map(i => parseInt(bits.slice(i, i + 8), 2)).join('.');
}

export function netOf(ip, prefix) {
  const o = ip.split('.').map(Number);
  const m = prefixToMask(prefix).split('.').map(Number);
  return o.map((v, i) => v & m[i]).join('.');
}

export function sameSubnet(a, b, prefix) {
  return netOf(a, prefix) === netOf(b, prefix);
}

// จับคู่คำสั่งแบบย่อได้ (abbreviation) แบบ Cisco:  "conf t" -> "configure terminal"
export function abbrev(input, full) {
  if (!input) return false;
  return full.toLowerCase().startsWith(input.toLowerCase());
}

// เทียบ token list กับ pattern list โดยยอมให้ย่อคำได้
export function match(tokens, ...pattern) {
  if (tokens.length < pattern.length) return false;
  return pattern.every((p, i) => abbrev(tokens[i], p));
}

export function eq(tokens, ...pattern) {
  if (tokens.length !== pattern.length) return false;
  return pattern.every((p, i) => abbrev(tokens[i], p));
}

// normalize คำสั่งสำหรับตรวจข้อสอบชนิดพิมพ์คำสั่ง
export function normCmd(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[​]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*=\s*/g, '=')
    .trim();
}
