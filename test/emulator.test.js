// ============================================================
//  ข้อตกลงของ emulator ที่ Lab พึ่งพา
//  เคสในนี้คือ "ผลลัพธ์ต้องสะท้อนสถานะจริงของเครื่อง" ไม่ใช่ข้อความตายตัว
//  ที่ผ่านมาบั๊กแบบนี้จับไม่ได้ เพราะ Lab ตรวจแค่ว่าพิมพ์คำสั่งแล้วหรือยัง
// ============================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { createDevice } from '../js/devices/index.js';
import { cliLabs } from './helpers/lab-runner.js';

const run = (dev, cmd) => (dev.exec(cmd) || [])
  .map(o => (typeof o === 'string' ? o : o.s)).join('\n');

test('df -h กับ df -i ต้องให้คนละผลลัพธ์', () => {
  const linux = createDevice('linux', {});
  const size = run(linux, 'df -h');
  const inode = run(linux, 'df -i');

  assert.notEqual(size, inode, 'df -i ให้ผลเหมือน df -h เป๊ะ ๆ — แปลว่าไม่ได้อ่าน flag');
  assert.match(size, /Size\s+Used\s+Avail\s+Use%/, 'df -h ต้องมีคอลัมน์ขนาด');
  assert.match(inode, /Inodes\s+IUsed\s+IFree\s+IUse%/, 'df -i ต้องรายงานจำนวน inode');
  assert.doesNotMatch(inode, /\bUse%\s+Mounted/, 'df -i ไม่ควรมีคอลัมน์ Use% ของพื้นที่');
});

test('df ไม่มี flag รายงานเป็นบล็อก 1K', () => {
  const linux = createDevice('linux', {});
  assert.match(run(linux, 'df'), /1K-blocks/);
});

test('df เจาะจง path ได้ และรายงาน filesystem ที่ครอบ path นั้น', () => {
  const linux = createDevice('linux', {});
  const out = run(linux, 'df -h /mnt/app');
  assert.match(out, /\/mnt\/app/);
  assert.equal(out.split('\n').length, 2, 'ต้องเหลือหัวตารางกับบรรทัดเดียว');
  assert.match(run(linux, 'df -h /ไม่มีอยู่จริง'), /No such file or directory/);
});

test('ขยาย logical volume แล้ว df ต้องยังไม่เปลี่ยน จนกว่าจะขยาย filesystem', () => {
  // นี่คือหัวใจของ lab "ดิสก์เต็ม" — ถ้า df โตตั้งแต่ lvextend บทเรียนจะหายไปทั้งข้อ
  const lab = cliLabs().find(l => l.id === 'sv-disk-full');
  const linux = createDevice('linux', lab.init || {});

  const before = run(linux, 'df -h /mnt/app');
  assert.match(before, /98%/, 'lab นี้ต้องเริ่มด้วยดิสก์ที่เกือบเต็มตามเรื่องที่เล่า');

  linux.exec('sudo pvcreate /dev/sdb');
  linux.exec('sudo vgextend vg_data /dev/sdb');
  linux.exec('sudo lvextend -l +100%FREE /dev/vg_data/lv_app');
  assert.equal(run(linux, 'df -h /mnt/app'), before, 'lvextend ขยายแค่ภาชนะ df ต้องยังเท่าเดิม');

  linux.exec('sudo resize2fs /dev/vg_data/lv_app');
  const after = run(linux, 'df -h /mnt/app');
  assert.notEqual(after, before, 'หลัง resize2fs พื้นที่ต้องเพิ่มขึ้นจริง');
  assert.match(after, /70G/);
});

test('lvextend ทั้งที่ volume group ไม่มีที่ว่าง ต้องไม่ผ่าน', () => {
  const linux = createDevice('linux', {});
  linux.exec('sudo lvextend -l +100%FREE /dev/vg_data/lv_app');   // ใช้ที่ว่าง 10G ที่มีอยู่
  const out = run(linux, 'sudo lvextend -L +20G /dev/vg_data/lv_app');
  assert.match(out, /Insufficient free space/);
});

test('lsblk เห็นดิสก์ที่เพิ่งเสียบเข้าเครื่อง และเห็น logical volume', () => {
  const linux = createDevice('linux', {});
  const out = run(linux, 'lsblk');
  assert.match(out, /^sdb\s/m, 'lab สั่งให้ยืนยันว่ามี /dev/sdb จริง จึงต้องเห็นใน lsblk');
  assert.match(out, /vg_data-lv_app/);
  assert.match(out, /\/mnt\/app/);
});

test('blkid ยังไม่แสดงดิสก์ใหม่จนกว่าจะ pvcreate', () => {
  const linux = createDevice('linux', {});
  assert.doesNotMatch(run(linux, 'sudo blkid'), /^\/dev\/sdb:/m);
  linux.exec('sudo pvcreate /dev/sdb');
  assert.match(run(linux, 'sudo blkid'), /^\/dev\/sdb:.*LVM2_member/m);
});

test('du รายงานขนาดตามที่ lab ตั้งไว้ ไม่ใช่ค่าเดียวตลอด', () => {
  const lab = cliLabs().find(l => l.id === 'sv-disk-full');
  const linux = createDevice('linux', lab.init || {});
  assert.match(run(linux, 'du -sh /mnt/app'), /29G/);
  assert.match(run(linux, 'du -sh /var/log'), /2\.1G/);
  assert.match(run(linux, 'du -sh /ไม่มีอยู่จริง'), /No such file or directory/);
});
