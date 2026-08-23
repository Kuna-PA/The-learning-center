// ============================================================
//  เปิดเซิร์ฟเวอร์จริงขึ้นมาทดสอบ — ฐานข้อมูลแยกใน temp ทุกครั้ง
//  ทดสอบกับของจริงดีกว่า mock เพราะสิ่งที่อยากกันคือ "ยิง API ตรงแล้วข้ามด่านได้ไหม"
// ============================================================
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const sleep = ms => new Promise(r => setTimeout(r, ms));

export async function startServer(env = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'lc-test-'));
  const port = 20000 + Math.floor(Math.random() * 20000);
  const adminPass = 'admin-test-1234';
  const proc = spawn(process.execPath, ['server.js'], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(port), LC_DATA_DIR: dir, LC_ADMIN_PASSWORD: adminPass, ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let log = '';
  proc.stdout.on('data', d => { log += d; });
  proc.stderr.on('data', d => { log += d; });

  const base = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 100; i++) {
    if (proc.exitCode !== null) throw new Error('เซิร์ฟเวอร์ดับตอนเปิด:\n' + log);
    try { if ((await fetch(base + '/api/health')).ok) break; } catch { /* ยังไม่ขึ้น */ }
    await sleep(50);
  }

  return {
    base, adminPass, proc, dir,
    get log() { return log; },
    async stop() {
      proc.kill();
      await new Promise(r => proc.on('exit', r));
      try { rmSync(dir, { recursive: true, force: true }); } catch { /* windows ยังจับไฟล์อยู่ก็ช่างมัน */ }
    },
  };
}

/** ตัวเรียก API ที่จำคุกกี้ให้เหมือนเบราว์เซอร์ */
export function client(base) {
  let cookie = '';
  return {
    get cookie() { return cookie; },
    clear() { cookie = ''; },
    async req(method, path, body) {
      const res = await fetch(base + path, {
        method,
        headers: {
          ...(cookie ? { cookie } : {}),
          ...(body === undefined ? {} : { 'content-type': 'application/json' }),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        redirect: 'manual',
      });
      const set = res.headers.getSetCookie?.() || [];
      for (const c of set) cookie = c.split(';')[0];
      let data = null;
      try { data = await res.clone().json(); } catch { data = await res.text(); }
      return { status: res.status, data, headers: res.headers, setCookie: set };
    },

  };
}
