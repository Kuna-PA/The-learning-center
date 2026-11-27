// ============================================================
//  Lab ทุกชุดต้อง "เล่นจนจบได้ด้วยคำใบ้ของตัวเอง"
//  นี่คือชุดทดสอบที่กันของพังตอนแก้ emulator — แก้ regex ผิดตัวเดียว
//  lab หลายสิบชุดจะพังเงียบ ๆ จนกว่าผู้เรียนจะไปเจอเอง
// ============================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { cliLabs, guiLabs, solveLab, hintCommands, viaCd } from './helpers/lab-runner.js';
import { createDevice } from '../js/devices/index.js';
import { tabComplete } from '../js/terminal.js';
import { said, times, hasLines, linesOf } from '../data/said.js';
import { runGuiScript } from './helpers/gui-runner.js';
import { GUI_SOLUTIONS } from './helpers/gui-solutions.js';

const labs = cliLabs();

test('มี Lab แบบ CLI ให้ทดสอบจริง', () => {
  assert.ok(labs.length > 100, `เจอแค่ ${labs.length} ชุด — น่าจะ import ไม่ครบ`);
});

for (const lab of labs) {
  test(`[${lab.track} L${lab.level}] ${lab.id} — ทำตามคำใบ้แล้วผ่านครบทุกข้อ`, () => {
    const r = solveLab(lab);
    assert.deepEqual(r.crashes, [], `emulator พังระหว่างเล่น lab นี้`);
    assert.deepEqual(
      r.failedTasks.map(i => `#${i + 1} ${lab.tasks[i].t.replace(/<[^>]+>/g, '')}`), [],
      'ทำตามคำใบ้ทุกข้อแล้วยังมี task ที่ไม่ผ่าน — คำใบ้กับ check ไม่ตรงกัน');
  });
}

// ---- พิมพ์ผิดต้องไม่ผ่าน ----
// ถ้าคำสั่งที่พิมพ์ผิดยังนับว่าผ่าน ผู้เรียนจะได้ใบประกาศโดยไม่เคยสั่งอะไรถูกเลย
test('คำสั่งที่พิมพ์ผิดต้องไม่ทำให้ task ผ่าน', () => {
  const broken = [];
  for (const lab of labs) {
    const typo = {
      ...lab,
      tasks: lab.tasks.map(t => ({
        ...t,
        hint: hintCommands(t.hint).map(c => 'zz' + c).join(' → '),
      })),
    };
    const r = solveLab(typo);
    const passed = r.done.filter(Boolean).length;
    // บาง task ผ่านตั้งแต่สถานะเริ่มต้น (เช่น "ตรวจสอบว่ายังไม่ได้ตั้งค่า") จึงเทียบกับ baseline
    const base = solveLab({ ...lab, tasks: lab.tasks.map(t => ({ ...t, hint: '' })) })
      .done.filter(Boolean).length;
    if (passed > base) broken.push(`${lab.id}: ผ่าน ${passed} ข้อทั้งที่พิมพ์ผิดหมด (ควรได้แค่ ${base})`);
  }
  assert.deepEqual(broken, []);
});

// ---- Lab แบบ GUI ----
const gui = guiLabs();

test('Lab GUI ทุกชุดมีโครงที่รันได้ และ check ไม่พังกับสถานะเริ่มต้น', () => {
  for (const lab of gui) {
    const r = runGuiScript(lab, []);
    assert.deepEqual(r.problems, [], `${lab.id}: check พังตั้งแต่ยังไม่ได้คลิกอะไร`);
  }
});

for (const [id, script] of Object.entries(GUI_SOLUTIONS)) {
  test(`[gui] ${id} — คลิกตามลำดับแล้วผ่านครบทุกข้อ`, () => {
    const lab = gui.find(l => l.id === id);
    assert.ok(lab, `ไม่มี lab id "${id}" แล้ว — ลบสคริปต์ทิ้งหรือแก้ id ใน gui-solutions.js`);
    const r = runGuiScript(lab, script);
    assert.deepEqual(r.problems, []);
    assert.deepEqual(r.failedTasks, [], 'คลิกครบตามสคริปต์แล้วยังมี task ไม่ผ่าน');
  });
}

test('รายงานว่า Lab GUI ชุดไหนยังไม่มีสคริปต์ทดสอบ', () => {
  const missing = gui.filter(l => !GUI_SOLUTIONS[l.id]).map(l => l.id);
  if (missing.length) console.log(`   ยังไม่มีสคริปต์: ${missing.join(', ')}`);
  assert.ok(true);
});

// ============================================================
//  ยืดหยุ่นพอกับวิธีพิมพ์ของคนจริง
//
//  ผู้เรียนรายงานเข้ามาว่า Lab "Ransomware กำลังแพร่" ทำ task ไม่ผ่าน
//  ทั้งที่ทำถูก — เขา `cd /tmp` แล้วพิมพ์ `cat README_RESTORE.txt`
//  แต่ตัวตรวจมองหา `cat /tmp/README_RESTORE.txt` แบบ path เต็มเท่านั้น
//
//  js/terminal.js จึงเก็บคำสั่งในรูปที่ขยาย path แล้วคู่กันไว้ที่ history.abs
//  และ said()/times() ใน data/said.js เทียบทั้งสองรูป
//  เทสต์นี้เล่น Lab ทุกชุด "แบบคนขี้เกียจพิมพ์" เพื่อยืนยันว่าผ่านเหมือนกัน
// ============================================================
for (const lab of labs) {
  test(`[${lab.track} L${lab.level}] ${lab.id} — cd เข้าไปก่อนแล้วพิมพ์ชื่อสั้น ก็ต้องผ่าน`, () => {
    const r = solveLab(lab, { relative: true });
    assert.deepEqual(r.crashes, [], 'emulator พังตอนรับ path สัมพัทธ์');
    assert.deepEqual(
      r.failedTasks.map(i => `#${i + 1} ${lab.tasks[i].t.replace(/<[^>]+>/g, '')}`), [],
      'ทำถูกทุกอย่างแต่พิมพ์เป็น path สัมพัทธ์แล้วไม่ผ่าน — ตัวตรวจเข้มเกินไป');
  });
}

test('viaCd ไม่แปลงกรณีที่คนจริงก็ไม่ทำแบบนั้น', () => {
  const dev = createDevice('linux', {});
  // ยัง cd เข้าไปในโฟลเดอร์ที่กำลังจะสร้างไม่ได้
  assert.deepEqual(viaCd(dev, 'sudo mkdir -p /srv/devops'), ['sudo mkdir -p /srv/devops']);
  // device node ไม่ใช่ไฟล์ที่ใครจะ cd เข้าไปหา
  assert.deepEqual(viaCd(dev, 'sudo pvcreate /dev/sdb'), ['sudo pvcreate /dev/sdb']);
  // โฟลเดอร์ที่ยังไม่มีอยู่จริง
  assert.deepEqual(viaCd(dev, 'cat /ไม่มีจริง/x.txt'), ['cat /ไม่มีจริง/x.txt']);
  // กรณีปกติต้องแปลงได้
  assert.deepEqual(viaCd(dev, 'cat /etc/os-release'), ['cd /etc', 'cat os-release']);
});

// ---- ปุ่ม Tab ต้องเติมชื่อไฟล์ได้ ----
// เคสที่ถูกรายงาน: กด Tab ที่ README_ ใน /tmp แล้วไม่เติมให้
test('Tab เติมชื่อไฟล์ในระบบไฟล์จำลองได้ (Linux)', () => {
  const dev = createDevice('linux-sec', {
    apply: st => {
      st.fs.children.tmp.children['README_RESTORE.txt'] =
        { t: 'f', mode: '644', owner: 'root', group: 'root', content: 'x' };
      st.fs.children.tmp.children['.hidden'] =
        { t: 'f', mode: '755', owner: 'root', group: 'root', content: 'y' };
    },
  });
  dev.exec('cd /tmp');
  assert.deepEqual(dev.completePath('README'), ['README_RESTORE.txt']);
  assert.deepEqual(dev.completePath('/tmp/README'), ['/tmp/README_RESTORE.txt']);
  assert.deepEqual(dev.completePath('.h'), ['.hidden'], 'พิมพ์จุดนำแล้วต้องเห็นไฟล์ซ่อน');
  assert.ok(!dev.completePath('').includes('.hidden'), 'ไม่พิมพ์จุดนำ ต้องไม่โผล่ไฟล์ซ่อน');
  assert.deepEqual(dev.completePath('/et'), ['/etc/'], 'โฟลเดอร์ต้องลงท้ายด้วย /');
});

test('Tab เติมชื่อไฟล์ในระบบไฟล์จำลองได้ (Windows)', () => {
  const dev = createDevice('windows', {});
  const root = 'C:\u005c';
  const hits = dev.completePath(root);
  assert.ok(hits.length > 0, 'ไม่เติมอะไรเลยที่รากไดรฟ์ C');
  assert.ok(hits.every(h => h.startsWith(root)), 'ต้องคืน path เต็มกลับมา');
});

test('absolutize ขยายเฉพาะสิ่งที่เป็น path จริง ๆ', () => {
  const dev = createDevice('linux', {});
  dev.exec('cd /etc');
  assert.equal(dev.absolutize('cat os-release'), 'cat /etc/os-release');
  assert.equal(dev.absolutize('ps aux'), 'ps aux', 'aux ไม่ใช่ไฟล์ ห้ามแปลง');
  assert.equal(dev.absolutize('systemctl status nginx'), 'systemctl status /etc/nginx',
    'บังเอิญมีโฟลเดอร์ /etc/nginx จึงขยาย — ยอมรับได้ เพราะ said() เทียบรูปที่พิมพ์จริงก่อนเสมอ');
  assert.equal(dev.absolutize('ping 8.8.8.8'), 'ping 8.8.8.8');
  assert.equal(dev.absolutize('cat /etc/os-release'), 'cat /etc/os-release', 'path เต็มอยู่แล้วต้องไม่เปลี่ยน');
});

test('said / times เทียบทั้งรูปที่พิมพ์และรูป path เต็ม', () => {
  const h = ['cd /tmp', 'cat README_RESTORE.txt'];
  h.abs = ['cd /tmp', 'cat /tmp/README_RESTORE.txt'];
  assert.equal(said(h, /cat\s+\/tmp\/README/i), true);
  assert.equal(said(h, /cat\s+README_RESTORE/i), true, 'รูปที่พิมพ์จริงต้องยังใช้ได้');
  assert.equal(said(h, /cat\s+\/etc\/passwd/i), false);
  // คำสั่งเดียวที่ตรงทั้งสองรูป ต้องนับเป็นหนึ่ง ไม่ใช่สอง
  assert.equal(times(h, /^cat\b/i), 1);
  assert.equal(times(['cat a', 'cat b'], /^cat\b/i), 2);
  assert.equal(said([], /x/), false, 'ประวัติว่างต้องไม่พัง');
});

// ---- พิมพ์คำสั่งย่อแบบคนทำงานจริง ----
// ไม่มีใครพิมพ์ `configure terminal` เต็ม ๆ หน้างาน — พิมพ์ `conf t` กันทั้งนั้น
// ตัวตรวจ task จึงต้องรับรูปย่อด้วย ไม่งั้นคนที่คล่องกว่ากลับทำไม่ผ่าน
const abbreviate = (hint) => String(hint)
  .replace(/\bconfigure terminal\b/gi, 'conf t')
  .replace(/\bshow\b/gi, 'sh')
  .replace(/\binterface\b/gi, 'int')
  .replace(/\bFastEthernet/g, 'fa')
  .replace(/\bGigabitEthernet/g, 'gi')
  .replace(/\bno shutdown\b/gi, 'no shut')
  .replace(/\bdescription\b/gi, 'desc');

test('Lab ของ Cisco ต้องผ่านแม้พิมพ์คำสั่งแบบย่อ', () => {
  const broken = [];
  for (const lab of labs.filter(l => l.device === 'cisco')) {
    const short = { ...lab, tasks: lab.tasks.map(t => ({ ...t, hint: abbreviate(t.hint) })) };
    const r = solveLab(short);
    if (!r.ok) broken.push(`${lab.id}: task ${r.failedTasks.map(i => i + 1).join(',')}`);
  }
  assert.deepEqual(broken, [], 'พิมพ์คำสั่งย่อแล้ว task ไม่ผ่าน — ตัวตรวจต้องรับทั้งรูปเต็มและรูปย่อ');
});

// ============================================================
//  ปุ่ม Tab ต้องเติมให้ถูกบริบท
//
//  เคยหลุดไปแล้วสองรอบเพราะตรรกะอยู่ใน event handler ล้วน ๆ ทดสอบไม่ได้
//  รอบแรก: Tab เติมได้แต่ชื่อคำสั่ง ไม่รู้จักชื่อไฟล์เลย
//  รอบสอง: พิมพ์ `cat` แล้วกด Tab ตอนอยู่ /tmp กลับได้ `cat /etc/`
//          เพราะไปหยิบ path จากตัวอย่าง `cat /etc/passwd` ในรายการคำสั่งมาเติม
//  ตอนนี้ตรรกะอยู่ใน tabComplete() ซึ่งเป็นฟังก์ชันบริสุทธิ์
// ============================================================
const tmpDev = () => {
  const d = createDevice('linux-sec', {
    apply: st => {
      st.fs.children.tmp.children['README_RESTORE.txt'] =
        { t: 'f', mode: '644', owner: 'root', group: 'root', content: 'x' };
      st.fs.children.tmp.children['.hidden'] =
        { t: 'f', mode: '755', owner: 'root', group: 'root', content: 'y' };
    },
  });
  d.exec('cd /tmp');
  return d;
};

test('Tab: พิมพ์ชื่อคำสั่งแล้วต้องได้ชื่อคำสั่ง ไม่ใช่ path จากตัวอย่างคำสั่งอื่น', () => {
  const d = tmpDev();
  assert.deepEqual(tabComplete('ca', d), { value: 'cat ' });
  assert.deepEqual(tabComplete('cat', d), { value: 'cat ' },
    'เคสที่ถูกรายงาน — ห้ามได้ "cat /etc/" ทั้งที่อยู่ /tmp');
  assert.deepEqual(tabComplete('p', d), { list: ['ping', 'ps', 'pwd'] },
    'เติมต่อไม่ได้แล้วต้องโชว์ตัวเลือก ไม่ใช่เดาเอาเอง');
});

test('Tab: พิมพ์อาร์กิวเมนต์แล้วต้องได้ชื่อไฟล์ในไดเรกทอรีปัจจุบัน', () => {
  const d = tmpDev();
  assert.deepEqual(tabComplete('cat ', d), { value: 'cat README_RESTORE.txt' });
  assert.deepEqual(tabComplete('cat R', d), { value: 'cat README_RESTORE.txt' });
  assert.deepEqual(tabComplete('ls ', d), { value: 'ls README_RESTORE.txt' });
  assert.deepEqual(tabComplete('cat x', d), {}, 'ไม่มีไฟล์ที่ตรง ต้องไม่เติมอะไรมั่ว ๆ');
  assert.deepEqual(tabComplete('cat /etc/os', d), { value: 'cat /etc/os-release' },
    'พิมพ์ path เต็มมาเองก็ยังต้องเติมได้');
  assert.deepEqual(tabComplete('', d), {}, 'ยังไม่พิมพ์อะไรต้องไม่พัง');
});

test('Tab: อุปกรณ์ที่ไม่มีระบบไฟล์ (Cisco) ยังเติมคำสั่งย่อได้เหมือนเดิม', () => {
  const c = createDevice('cisco', {});
  c.exec('enable');
  assert.deepEqual(tabComplete('sh', c), { value: 'show ' });
  assert.deepEqual(tabComplete('sho run', c), { value: 'show running-config' });
});

// ============================================================
//  task ที่สั่งให้ "ต่อท้าย" ต้องไม่ผ่านถ้าใช้ > เขียนทับ
//
//  ผู้เรียนรายงานว่าใน Lab ของ Linux ข้อที่สั่งให้ต่อท้ายบรรทัด
//  เขาพิมพ์ `>` เขียนทับแทน `>>` บรรทัดเดิมหายไปหมด แต่ task กลับขึ้นผ่าน
//  เพราะตัวตรวจมองหาแค่ข้อความใหม่ในไฟล์ ไม่ได้ดูว่าของเดิมยังอยู่ไหม
//  ซึ่งตรงข้ามกับสิ่งที่ debrief ของ Lab สอนไว้เองว่า > เขียนทับ · >> ต่อท้าย
// ============================================================
test('task ที่ใช้ >> ต่อท้าย ต้องไม่ผ่านเมื่อเปลี่ยนเป็น > เขียนทับ', () => {
  const broken = [];
  let checked = 0;
  for (const lab of labs) {
    lab.tasks.forEach((t, i) => {
      if (!String(t.hint).includes('>>')) return;
      checked++;
      if (solveLab(lab, { clobber: i }).done[i]) {
        broken.push(`${lab.id} task #${i + 1}: ${String(t.hint).replace(/<[^>]*>/g, '')}`);
      }
    });
  }
  assert.ok(checked >= 10, `เจอ task แบบต่อท้ายแค่ ${checked} ข้อ — น่าจะหา hint ไม่เจอ`);
  assert.deepEqual(broken, [],
    'เขียนทับด้วย > แล้ว task ยังผ่าน — ตัวตรวจต้องดูว่าบรรทัดเดิมยังอยู่ครบด้วย (ใช้ hasLines)');
});

test('hasLines เทียบทีละบรรทัด ไม่ใช่ค้นทั้งก้อน', () => {
  // สองบรรทัดจริง ๆ
  assert.equal(hasLines('mode = debug\nport = 8080\n', /^mode = debug$/, /^port = 8080$/), true);
  // ถูกเขียนทับจนเหลือบรรทัดเดียว
  assert.equal(hasLines('port = 8080\n', /^mode = debug$/, /^port = 8080$/), false);
  // อยู่บรรทัดเดียวกันไม่นับว่าต่อท้าย
  assert.equal(hasLines('mode = debug port = 8080\n', /^mode = debug$/, /^port = 8080$/), false);
  assert.equal(hasLines('', /x/), false, 'ไฟล์ว่างต้องไม่ผ่าน');
  assert.equal(hasLines(undefined, /x/), false, 'ไม่มีไฟล์ต้องไม่พัง');
  assert.deepEqual(linesOf('  a  \n\n b \n'), ['a', 'b'], 'ตัดช่องว่างและบรรทัดว่างทิ้ง');
});
