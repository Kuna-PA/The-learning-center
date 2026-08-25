import { createCisco } from './cisco.js';
import { createMikrotik } from './mikrotik.js';
import { createLinux } from './linux.js';
import { createWindows } from './windows.js';

export const DEVICE_LABELS = {
  cisco: 'Cisco IOS — Catalyst Switch',
  mikrotik: 'MikroTik RouterOS — Router',
  'mikrotik-sw': 'MikroTik RouterOS — Switch (CRS)',
  linux: 'Linux — Ubuntu Server 22.04',
  'linux-sec': 'Linux — Security Workstation',
  windows: 'Windows Server 2022 — PowerShell',
  'windows-gui': 'Windows Server 2022 — หน้าจอ GUI',
};

/**
 * รูปของอุปกรณ์แต่ละแบบ — ใช้ในหัวหน้า Lab เพื่อให้เห็นว่ากำลังจะจับอะไรอยู่
 * ไฟล์ถูกตัดออกมาจากแผ่นรวมไอคอนด้วย scripts/split-device-icons.mjs
 */
export const DEVICE_ICONS = {
  cisco: 'assets/devices/switch.png',
  mikrotik: 'assets/devices/router.png',
  'mikrotik-sw': 'assets/devices/switch.png',
  linux: 'assets/devices/server.png',
  'linux-sec': 'assets/devices/server.png',
  windows: 'assets/devices/server.png',
  'windows-gui': 'assets/devices/computer.png',
};

// ชื่อสั้นสำหรับใช้ในตัวกรอง — ต้องแยกกันได้ทุกตัว
export const DEVICE_SHORT = {
  cisco: 'Cisco',
  mikrotik: 'MikroTik Router',
  'mikrotik-sw': 'MikroTik Switch',
  linux: 'Linux',
  'linux-sec': 'Linux Security',
  windows: 'Windows (PowerShell)',
  'windows-gui': 'Windows (GUI)',
};

export function createDevice(kind, init = {}) {
  switch (kind) {
    case 'cisco': return createCisco(init);
    case 'mikrotik': return createMikrotik({ ...init, role: 'router' });
    case 'mikrotik-sw': return createMikrotik({ ...init, role: 'switch', ports: init.ports ?? 8, identity: init.identity || 'MikroTik-SW' });
    case 'linux': return createLinux(init);
    case 'linux-sec': return createLinux({ hostname: 'sec-ws', user: 'analyst', ...init });
    case 'windows': case 'windows-gui': return createWindows(init);
    default: return createLinux(init);
  }
}
