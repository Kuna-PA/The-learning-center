// ============================================================
//  Learning Path: Linux — Server Administration
//
//  เนื้อหาแบ่งเป็นไฟล์ย่อยใน ./linux/
//    legacy.js  เนื้อหาชุดเดิม (5 ระดับ) — ยังเป็นแกนของเกือบทุกระดับ
//    extra.js   เนื้อหาและ Lab ที่เขียนเพิ่ม (Installing, Authoring Text,
//               Devices/Kernel, สร้าง Storage ใหม่, Scripts, IaC)
//
//  จัดเป็น 6 ระดับตามลำดับที่ควรเรียน
//    L1 รู้จักและติดตั้ง · L2 ผู้ใช้และสิทธิ์ · L3 ซอฟต์แวร์/service/kernel
//    L4 storage และ container · L5 เครือข่ายและความปลอดภัย · L6 script และ IaC
// ============================================================
import legacy from './linux/legacy.js';
import extra from './linux/extra.js';

const old = legacy.levels;
const sec = (lv, re) => (old[lv].sections || []).filter(s => re.test(s.t));
const labsOf = (lv, ids) => (old[lv].labs || []).filter(l => ids.includes(l.id));
const part = (lv) => extra[lv] || { sections: [], quiz: [], labs: [] };

const build = (title, objectives, sections, quiz, labs) => ({ title, objectives, sections, quiz, labs });

export default {
  id: 'linux',
  name: 'Linux',
  icon: '🐧',
  device: 'linux',
  sub: 'Ubuntu / RHEL — Server Administration',
  desc: 'เส้นทางเรียน Linux สำหรับงานดูแลเซิร์ฟเวอร์ — ตั้งแต่ติดตั้งและโครงสร้างไฟล์, ผู้ใช้และสิทธิ์, แพ็กเกจ/service/kernel, storage และ container, เครือข่ายและความปลอดภัย ไปจนถึงการเขียนสคริปต์และทำ Infrastructure as Code',

  levels: {
    // ---------- 1: Introducing / Installing / File Management / Authoring Text ----------
    1: build(
      'รู้จัก Linux — ติดตั้ง จัดการไฟล์ และแก้ไฟล์ข้อความ',
      [
        'อธิบายโครงสร้างไดเรกทอรีมาตรฐานและบอกได้ว่าไฟล์อะไรอยู่ที่ไหน',
        'ใช้คำสั่งจัดการไฟล์และค้นหาข้อมูลได้คล่อง',
        'ตัดสินใจเรื่องพาร์ทิชัน LVM และ filesystem ตอนติดตั้งได้',
        'แก้ไฟล์ตั้งค่าด้วย echo, tee, sed และ vi ขั้นพื้นฐานได้',
      ],
      [...(old[1].sections || []), ...part(1).sections],
      [...(old[1].quiz || []), ...part(1).quiz],
      [...labsOf(1, ['lin-l1-basic']), ...part(1).labs],
    ),

    // ---------- 2: Users, Groups, Permissions ----------
    2: build(
      'ผู้ใช้ กลุ่ม และสิทธิ์',
      [
        'อ่านและตั้งสิทธิ์ไฟล์ทั้งแบบตัวเลขและตัวอักษรได้',
        'สร้างและจัดการผู้ใช้/กลุ่ม พร้อมเข้าใจไฟล์ /etc/passwd และ /etc/group',
        'ใช้ sudo อย่างถูกวิธีและเข้าใจว่าทำไมไม่ควรใช้ root ตรง ๆ',
        'ตั้งโฟลเดอร์ที่ใช้ร่วมกันทั้งทีมด้วย group และ setgid',
      ],
      sec(2, /สิทธิ์|ผู้ใช้/),
      old[2].quiz || [],
      labsOf(2, ['lin-l2-users']),
    ),

    // ---------- 3: Software, Services, Devices/Processes/Memory/Kernel ----------
    3: build(
      'แพ็กเกจ, Service และการจัดการทรัพยากรระบบ',
      [
        'ติดตั้ง อัปเดต และถอนแพ็กเกจด้วย apt/dnf ได้',
        'จัดการ service ด้วย systemd: start, enable, status, journalctl',
        'ไล่หาว่าทรัพยากรไหนเป็นคอขวด (CPU / RAM / disk)',
        'ปรับค่า kernel ด้วย sysctl ทั้งแบบชั่วคราวและถาวร',
      ],
      [...sec(2, /แพ็กเกจ|systemd/), ...sec(4, /ประสิทธิภาพ/), ...part(3).sections],
      part(3).quiz,
      [...labsOf(4, ['lin-l4-ops'])],
    ),

    // ---------- 4: Storage and Containers ----------
    4: build(
      'Storage และ Containers',
      [
        'อ่านโครงสร้างดิสก์ พาร์ทิชัน และจุด mount ได้',
        'สร้างและขยายพื้นที่ด้วย LVM โดยไม่ต้องหยุดระบบ',
        'ใช้ container รันบริการและเข้าใจความต่างจากการติดตั้งลงเครื่องตรง ๆ',
      ],
      [...sec(4, /Storage|Containers/)],
      old[4].quiz || [],
      part(4).labs,
    ),

    // ---------- 5: Network Settings, Network Security, Linux Security ----------
    5: build(
      'เครือข่าย ไฟร์วอลล์ และความปลอดภัยของระบบ',
      [
        'ตั้งค่าและตรวจสอบเครือข่ายด้วย ip, ss และ nmcli ได้',
        'กำหนดกฎ firewall ให้เปิดเฉพาะที่จำเป็น',
        'ทำ SSH hardening และใช้ key แทนรหัสผ่าน',
        'อ่าน log หาร่องรอยการบุกรุก และวาง baseline ความปลอดภัย',
      ],
      [...(old[3].sections || []), ...sec(5, /Security/)],
      [...(old[3].quiz || []), ...(old[5].quiz || [])],
      [...labsOf(3, ['lin-l3-net']), ...labsOf(5, ['lin-l5-harden'])],
    ),

    // ---------- 6: Simple Scripts and Infrastructure as Code ----------
    6: build(
      'Scripts และ Infrastructure as Code',
      [
        'เขียน shell script ที่ทำงานซ้ำได้และตั้งให้รันอัตโนมัติด้วย cron',
        'อธิบายความต่างระหว่างสคริปต์กับ Infrastructure as Code',
        'เขียนและรัน Ansible playbook พร้อมอ่าน PLAY RECAP เป็น',
        'บอกได้ว่า playbook แบบไหนเรียกว่า idempotent',
      ],
      [...part(6).sections, ...sec(5, /Automation|Observability/)],
      part(6).quiz,
      part(6).labs,
    ),
  },
};
