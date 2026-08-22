// ============================================================
//  ตัวเรียก REST API ของเซิร์ฟเวอร์
//  cookie เซสชันเป็น httpOnly — เบราว์เซอร์ส่งให้เอง สคริปต์อ่านไม่ได้
// ============================================================
export class ApiError extends Error {
  constructor(msg, status) { super(msg); this.status = status; }
}

async function call(method, path, body) {
  const res = await fetch(path, {
    method,
    credentials: 'same-origin',
    headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let data = null;
  try { data = await res.json(); } catch { /* บางเส้นทางไม่ส่ง body */ }
  if (!res.ok) throw new ApiError((data && data.error) || `ผิดพลาด ${res.status}`, res.status);
  return data;
}

export const api = {
  get: (p) => call('GET', p),
  post: (p, b = {}) => call('POST', p, b),
  put: (p, b = {}) => call('PUT', p, b),
  patch: (p, b = {}) => call('PATCH', p, b),
  del: (p) => call('DELETE', p),
};

/** เซิร์ฟเวอร์ตอบอยู่ไหม — ใช้ตัดสินว่าจะทำงานแบบออนไลน์หรือออฟไลน์ */
export async function serverAlive() {
  try {
    const r = await fetch('/api/health', { credentials: 'same-origin' });
    return r.ok;
  } catch { return false; }
}
