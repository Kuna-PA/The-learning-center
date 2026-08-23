// ============================================================
//  หมวด "เอาชีวิตรอด" — จำลองเหตุการณ์ฉุกเฉินที่เกิดขึ้นจริงหน้างาน
//  ไม่มีคู่มือให้ทำตามทีละขั้น มีแต่อาการ เวลา และความกดดัน
// ============================================================
const node = (s, p) => {
  const parts = String(p).split('/').filter(Boolean);
  let n = s.fs;
  for (const x of parts) {
    if (!n || n.t !== 'd' || !n.children[x]) return null;
    n = n.children[x];
  }
  return n;
};
const said = (h, re) => h.some(c => re.test(c.trim()));
const T = (s, p) => s.tables[p] || [];
const has = (s, p, fn) => T(s, p).some(fn);
const F = n => 'FastEthernet0/' + n;
const G = n => 'GigabitEthernet0/' + n;
const ran = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

import { SURVIVAL_LABS_2 } from './survival2.js';

const BASE_LABS = [
  // ---------------------------------------------------------
  {
    id: 'sv-web-down',
    difficulty: 'easy',
    title: 'ตี 3 — เว็บบริษัทล่ม',
    icon: '🌙',
    severity: 'critical',
    time: '15 นาที',
    caller: 'หัวหน้าฝ่ายขาย',
    story: 'โทรศัพท์ดังตอนตี 3 หัวหน้าฝ่ายขายบอกว่า "เว็บเข้าไม่ได้เลย ลูกค้าโทรมาบ่นแล้ว 5 ราย" คุณยังงัวเงีย เปิดโน้ตบุ๊กแล้ว SSH เข้าเซิร์ฟเวอร์ได้ ทุกอย่างดูเหมือนปกติ ยกเว้นเว็บที่ไม่ตอบ',
    impact: 'ลูกค้าสั่งซื้อไม่ได้ — สูญเสียรายได้ทุกนาที',
    device: 'linux',
    init: {
      apply: st => {
        st.services.nginx.active = false;
        st.services.nginx.enabled = false;
      },
    },
    tasks: [
      { t: 'ตรวจว่าเว็บตอบสนองจริงไหมจากในเครื่องเอง', hint: 'curl -I http://localhost', check: (s, h) => said(h, /^curl/i) },
      { t: 'ตรวจสถานะของ service <code>nginx</code>', hint: 'systemctl status nginx', check: (s, h) => said(h, /systemctl\s+status\s+nginx/i) },
      { t: 'ดู log ของ nginx เพื่อหาสาเหตุ', hint: 'journalctl -u nginx', check: (s, h) => said(h, /journalctl\s+-u\s+nginx/i) },
      { t: 'ตรวจว่าพื้นที่ดิสก์เต็มหรือไม่ (สาเหตุยอดฮิต)', hint: 'df -h', check: (s, h) => said(h, /^(sudo\s+)?df/i) },
      { t: 'ตรวจว่าพอร์ต 80 มีใครฟังอยู่ไหม', hint: 'ss -tulpn', check: (s, h) => said(h, /^(sudo\s+)?(ss|netstat)/i) },
      { t: 'กู้บริการ: เริ่ม nginx', hint: 'sudo systemctl start nginx', check: s => s.services.nginx.active },
      { t: 'ทดสอบว่าเว็บกลับมาแล้ว', hint: 'curl -I http://localhost', check: (s, h) => h.filter(c => /^curl/i.test(c.trim())).length >= 2 },
      { t: 'ป้องกันไม่ให้เกิดซ้ำหลังรีบูต: ตั้ง nginx ให้เริ่มอัตโนมัติ', hint: 'sudo systemctl enable nginx', check: s => s.services.nginx.enabled },
      { t: 'บันทึกสิ่งที่พบลง <code>/home/student/incident.txt</code> เพื่อรายงานตอนเช้า', hint: 'echo "nginx หยุดทำงานและไม่ได้ตั้ง enable" > /home/student/incident.txt', check: s => (node(s, '/home/student/incident.txt')?.content || '').length > 5 },
    ],
    debrief: 'สาเหตุที่แท้จริงคือ service ไม่ได้ถูกตั้ง <code>enable</code> ไว้ ทำให้หลังรีบูตเครื่องมันไม่ขึ้นมาเอง — เป็นเคสที่พบบ่อยที่สุดของ "ระบบล่มหลังรีบูตกลางดึก" บทเรียน: ทุกครั้งที่ติดตั้ง service ใหม่ ให้ใช้ <code>systemctl enable --now</code> เสมอ และควรมี monitoring ที่แจ้งเตือนก่อนลูกค้าโทรมา',
  },

  // ---------------------------------------------------------
  {
    id: 'sv-ransomware',
    difficulty: 'hard',
    title: 'Ransomware กำลังแพร่',
    icon: '🦠',
    severity: 'critical',
    time: '10 นาที',
    caller: 'ทีม Helpdesk',
    story: 'Helpdesk แจ้งว่ามีผู้ใช้ 3 คนเปิดไฟล์ไม่ได้ ไฟล์เปลี่ยนนามสกุลเป็น .locked และมีไฟล์ README เรียกค่าไถ่โผล่ขึ้นมา ตอนนี้เซิร์ฟเวอร์ไฟล์กำลังมี process แปลกทำงานอยู่ ทุกวินาทีที่ผ่านไปคือไฟล์ที่ถูกเข้ารหัสเพิ่ม',
    impact: 'ข้อมูลทั้งองค์กรเสี่ยงถูกเข้ารหัส และอาจมีข้อมูลรั่วไหลออกไปด้วย',
    device: 'linux-sec',
    init: {
      apply: st => {
        st.fs.children.tmp.children['README_RESTORE.txt'] = { t: 'f', mode: '644', owner: 'root', group: 'root', content: 'YOUR FILES HAVE BEEN ENCRYPTED\nContact: recover@darkmail.onion\n' };
        st.fs.children.tmp.children['.hidden'] = { t: 'f', mode: '755', owner: 'root', group: 'root', content: '#!/bin/bash\nfor f in $(find /var/www -type f); do openssl enc -aes-256-cbc -in $f -out $f.locked; done\n' };
      },
    },
    tasks: [
      { t: 'ยืนยันเหตุ: ดูไฟล์เรียกค่าไถ่ที่พบใน <code>/tmp</code>', hint: 'cat /tmp/README_RESTORE.txt', check: (s, h) => said(h, /cat\s+\/tmp\/README/i) },
      { t: 'ดูไฟล์ทั้งหมดใน /tmp รวมไฟล์ซ่อน', hint: 'ls -la /tmp', check: (s, h) => said(h, /ls\s+-l?a/i) },
      { t: 'ตรวจ process ที่กำลังทำงานอยู่', hint: 'ps aux', check: (s, h) => said(h, /^(sudo\s+)?ps\s/i) },
      { t: 'ตรวจการเชื่อมต่อขาออก (อาจกำลังส่งข้อมูลออกไป)', hint: 'ss -tulpn', check: (s, h) => said(h, /^(sudo\s+)?(ss|netstat)/i) },
      { t: '<b>Containment</b> — ตัดการเชื่อมต่อขาเข้าทันทีด้วย firewall', hint: 'sudo ufw default deny incoming → sudo ufw enable', check: s => s.ufw.active },
      { t: 'เก็บหลักฐานก่อนกู้: สร้าง <code>/mnt/evidence</code>', hint: 'sudo mkdir -p /mnt/evidence', check: s => !!node(s, '/mnt/evidence') },
      { t: 'ทำ hash ของสคริปต์ต้องสงสัยไว้เป็น IOC', hint: 'sha256sum /tmp/.hidden', check: (s, h) => said(h, /sha256sum/i) },
      { t: 'บันทึก process list เป็นหลักฐาน', hint: 'ps aux > /mnt/evidence/process.txt', check: s => (node(s, '/mnt/evidence/process.txt')?.content || '').length > 5 },
      { t: 'บันทึกการเชื่อมต่อเครือข่ายเป็นหลักฐาน', hint: 'ss -tulpn > /mnt/evidence/network.txt', check: s => (node(s, '/mnt/evidence/network.txt')?.content || '').length > 5 },
      { t: 'ดูเนื้อหาสคริปต์เพื่อรู้ว่ามันทำอะไร', hint: 'cat /tmp/.hidden', check: (s, h) => said(h, /cat\s+\/tmp\/\.hidden/i) },
      { t: 'ตรวจว่ามี persistence ทิ้งไว้ใน cron หรือไม่', hint: 'crontab -l', check: (s, h) => said(h, /crontab\s+-l/i) },
      { t: 'เปิด <code>auditd</code> เพื่อเก็บหลักฐานต่อจากนี้', hint: 'sudo systemctl start auditd → sudo systemctl enable auditd', check: s => s.services.auditd.active },
    ],
    debrief: 'ลำดับที่ถูกต้องคือ <b>ตัดเครือข่าย → เก็บหลักฐาน → หา patient zero → กู้จาก backup ที่แยกออฟไลน์</b> — ห้ามปิดเครื่องทันทีเพราะหลักฐานใน RAM (รวมถึงคีย์เข้ารหัสที่บางครั้งกู้ได้) จะหายไป และห้ามต่อ backup เข้ากับเครือข่ายที่ยังติดอยู่ ที่สำคัญ: อย่ากู้ระบบก่อนปิดช่องทางที่ผู้โจมตีใช้เข้ามา ไม่งั้นจะโดนซ้ำภายในไม่กี่วัน',
  },

  // ---------------------------------------------------------
  {
    id: 'sv-floor-down',
    difficulty: 'medium',
    title: 'ทั้งชั้น 3 ใช้เน็ตไม่ได้',
    icon: '🏢',
    severity: 'high',
    time: '20 นาที',
    caller: 'ผู้จัดการสำนักงาน',
    story: 'เช้าวันจันทร์ พนักงานชั้น 3 ทั้งชั้นใช้อินเทอร์เน็ตไม่ได้ ชั้นอื่นปกติดี เมื่อคืนมีทีมช่างมาเดินสายเพิ่ม คุณ SSH เข้าสวิตช์ชั้น 3 ได้ตามปกติ',
    impact: 'พนักงาน 40 คนทำงานไม่ได้',
    device: 'cisco',
    init: {
      apply: st => {
        st.vlans[10] = { id: 10, name: 'OFFICE' };
        st.vlans[20] = { id: 20, name: 'SERVER' };
        // ช่างเผลอย้ายพอร์ตผู้ใช้ไป VLAN 1 และปิด uplink
        ran(1, 8).forEach(i => { st.ifaces[F(i)].swMode = 'access'; st.ifaces[F(i)].accessVlan = 1; st.ifaces[F(i)].link = true; });
        const up = st.ifaces['GigabitEthernet0/1'];
        up.swMode = 'trunk'; up.encap = 'dot1q'; up.allowed = '1'; up.shutdown = true;
      },
    },
    tasks: [
      { t: 'เข้าสู่ privileged mode', hint: 'enable', check: s => s.mode !== 'user' },
      { t: 'ดูสถานะพอร์ตทั้งหมด — หา uplink ที่ผิดปกติ', hint: 'show interfaces status', check: (s, h) => said(h, /^(do\s+)?sh(ow)?\s+int\w*\s+st/i) },
      { t: 'ตรวจว่า trunk ยอมให้ VLAN ใดผ่านบ้าง', hint: 'show interfaces trunk', check: (s, h) => said(h, /^(do\s+)?sh(ow)?\s+int\w*\s+tr/i) },
      { t: 'ดูว่าพอร์ตผู้ใช้อยู่ VLAN อะไร', hint: 'show vlan brief', check: (s, h) => said(h, /^(do\s+)?sh(ow)?\s+vlan/i) },
      { t: 'เปิด uplink Gi0/1 ที่ถูกปิดไว้', hint: 'configure terminal → interface gi0/1 → no shutdown', check: s => s.ifaces[G(1)].shutdown === false },
      { t: 'แก้ allowed vlan ของ trunk ให้มี VLAN 10 และ 20', hint: 'switchport trunk allowed vlan 10,20', check: s => { const a = s.ifaces[G(1)].allowed || ''; return /\b10\b/.test(a) && /\b20\b/.test(a); } },
      { t: 'ย้ายพอร์ตผู้ใช้ Fa0/1-8 กลับไป VLAN 10', hint: 'exit → interface range fa0/1 - 8 → switchport access vlan 10', check: s => ran(1, 8).every(i => s.ifaces[F(i)].accessVlan === 10) },
      { t: 'ตรวจผลอีกครั้งว่า trunk ถูกต้องแล้ว', hint: 'do show interfaces trunk', check: (s, h) => h.filter(c => /sh(ow)?\s+int\w*\s+tr/i.test(c)).length >= 2 },
      { t: 'บันทึก config ไม่ให้หายถ้าไฟดับ', hint: 'end → write memory', check: s => !!s.savedConfig },
    ],
    debrief: 'สองปัญหาซ้อนกัน: ช่างปิด uplink ไว้และ trunk ยอมให้ผ่านแค่ VLAN 1 ส่วนพอร์ตผู้ใช้ก็ถูกย้ายไป VLAN 1 <b>ลำดับการไล่ที่ถูกคือจากล่างขึ้นบน</b> — L1 (พอร์ตขึ้นไหม) → L2 (VLAN/trunk ถูกไหม) → L3 (IP/gateway) การเริ่มจาก <code>show interfaces status</code> และ <code>show interfaces trunk</code> ทำให้เจอทั้งสองปัญหาภายในไม่กี่นาที บทเรียน: ทุกครั้งที่มีคนมาทำงานกับตู้ ต้องมี change record และตรวจสอบก่อนเลิกงาน',
  },

  // ---------------------------------------------------------
  {
    id: 'sv-wan-down',
    difficulty: 'medium',
    title: 'สาขาหลุด — เน็ตเส้นหลักตาย',
    icon: '🔌',
    severity: 'high',
    time: '15 นาที',
    caller: 'ผู้จัดการสาขา',
    story: 'สาขาเชียงใหม่โทรมาว่าใช้อินเทอร์เน็ตไม่ได้เลยตั้งแต่ 30 นาทีที่แล้ว คุณยังเข้า router สาขาได้ผ่านลิงก์สำรอง ISP แจ้งว่าเส้นหลักมีปัญหาที่ชุมสาย ยังไม่มีกำหนดแก้',
    impact: 'สาขาทั้งสาขาออกอินเทอร์เน็ตและเข้าระบบส่วนกลางไม่ได้',
    device: 'mikrotik',
    init: {
      apply: st => {
        st.tables['ip address'].push(
          { _id: '*80', address: '192.168.88.1/24', network: '192.168.88.0', interface: 'ether2', disabled: false });
        st.tables['ip route'].push(
          { _id: '*81', 'dst-address': '0.0.0.0/0', gateway: '203.0.113.1', distance: '1', disabled: false });
        st.tables['ip firewall nat'].push(
          { _id: '*82', chain: 'srcnat', action: 'masquerade', 'out-interface': 'ether1', disabled: false });
      },
    },
    tasks: [
      { t: 'ตรวจสถานะ interface ทั้งหมดว่าเส้นไหนยัง up', hint: '/interface print', check: (s, h) => said(h, /\/?interface\s+print/i) },
      { t: 'ดู routing table ปัจจุบัน', hint: '/ip route print', check: (s, h) => said(h, /ip\s+route\s+print/i) },
      { t: 'ทดสอบว่า gateway เส้นหลักตอบสนองไหม', hint: '/ping 203.0.113.1', check: (s, h) => said(h, /ping\s+203\.0\.113\.1/i) },
      { t: 'เพิ่มเส้นทางสำรองผ่าน <code>198.51.100.1</code> distance 2', hint: '/ip route add dst-address=0.0.0.0/0 gateway=198.51.100.1 distance=2', check: s => has(s, 'ip route', r => r.gateway === '198.51.100.1' && String(r.distance) === '2') },
      { t: 'เพิ่ม NAT masquerade ออกทาง <code>ether2</code> (WAN สำรอง)', hint: '/ip firewall nat add chain=srcnat out-interface=ether2 action=masquerade', check: s => has(s, 'ip firewall nat', r => r.action === 'masquerade' && r['out-interface'] === 'ether2') },
      { t: 'ปิด route เส้นหลักที่ใช้ไม่ได้ชั่วคราว', hint: '/ip route disable [find gateway=203.0.113.1]', check: s => has(s, 'ip route', r => r.gateway === '203.0.113.1' && (r.disabled === true || r.disabled === 'yes')) },
      { t: 'ทดสอบว่าออกอินเทอร์เน็ตได้แล้ว', hint: '/ping 8.8.8.8', check: (s, h) => said(h, /ping\s+8\.8\.8\.8/i) },
      { t: 'ตั้ง netwatch เฝ้า gateway เส้นหลักเพื่อรู้ทันทีที่กลับมา', hint: '/tool netwatch add host=203.0.113.1', check: s => has(s, 'tool netwatch', r => r.host === '203.0.113.1') },
      { t: 'ป้องกันระยะยาว: เพิ่ม <code>check-gateway=ping</code> ให้ route สำรอง', hint: '/ip route set [find gateway=198.51.100.1] check-gateway=ping', check: s => has(s, 'ip route', r => r.gateway === '198.51.100.1' && /ping/.test(r['check-gateway'] || '')) },
      { t: 'บันทึก config ออกมาเก็บไว้', hint: '/export', check: (s, h) => said(h, /^\/?export/i) },
    ],
    debrief: 'เหตุการณ์นี้เกิดขึ้นบ่อยและป้องกันได้ล่วงหน้า — ถ้าตั้ง dual WAN พร้อม <code>check-gateway=ping</code> ไว้ตั้งแต่แรก ระบบจะสลับเองภายในไม่กี่วินาทีโดยไม่มีใครต้องตื่นมาแก้ บทเรียน: ทุกสาขาที่ธุรกิจหยุดไม่ได้ควรมี WAN สำรองที่ทดสอบแล้วว่าสลับได้จริง ไม่ใช่แค่ "มีสายเสียบไว้"',
  },

  // ---------------------------------------------------------
  {
    id: 'sv-ad-down',
    difficulty: 'hard',
    title: 'ล็อกอินไม่ได้ทั้งบริษัท',
    icon: '🔑',
    severity: 'critical',
    time: '20 นาที',
    caller: 'ทุกคน',
    story: 'เช้าวันจันทร์ 8:30 น. โทรศัพท์ดังไม่หยุด พนักงานล็อกอินเข้าเครื่องไม่ได้ ระบบขึ้นว่า "ไม่พบ domain controller" คุณเข้าเครื่อง DC ได้ทาง console และเครื่องยังทำงานอยู่',
    impact: 'พนักงานทั้งบริษัทเข้าระบบไม่ได้ — ธุรกิจหยุดทั้งหมด',
    device: 'windows',
    init: {
      apply: st => {
        st.hostname = 'SRV-DC01';
        st.domain = 'corp.local';
        st.isDC = true;
        st.features.add('AD-Domain-Services');
        st.features.add('DNS');
        st.dnsZones.push({ name: 'corp.local', type: 'Primary', dynamic: 'Secure' });
        st.adGroups['Domain Admins'] = ['Administrator'];
        st.adGroups['Domain Users'] = ['Administrator', 'somchai', 'nipa'];
        st.adUsers['somchai'] = { name: 'Somchai P', sam: 'somchai', enabled: true, upn: 'somchai@corp.local', path: 'CN=Users,DC=corp,DC=local', groups: ['Domain Users'] };
        st.adUsers['nipa'] = { name: 'Nipa S', sam: 'nipa', enabled: true, upn: 'nipa@corp.local', path: 'CN=Users,DC=corp,DC=local', groups: ['Domain Users'] };
        // ต้นเหตุ: มีคนแก้ DNS ของ DC ให้ชี้ออกไปข้างนอก
        st.nics.Ethernet0.dns = ['8.8.8.8'];
        st.services.Dnscache.status = 'Stopped';
      },
    },
    tasks: [
      { t: 'ตรวจข้อมูลเครื่องว่ายังเป็น DC ของโดเมนอยู่หรือไม่', hint: 'Get-ADDomain', check: (s, h) => said(h, /get-addomain/i) },
      { t: 'ตรวจการตั้งค่าเครือข่ายของ DC', hint: 'Get-NetIPConfiguration', check: (s, h) => said(h, /get-netipconfiguration|ipconfig/i) },
      { t: 'ตรวจสถานะ service ที่เกี่ยวกับ DNS', hint: 'Get-Service -Name Dnscache', check: (s, h) => said(h, /get-service/i) },
      { t: 'ตรวจว่า DNS zone ของโดเมนยังอยู่ครบ', hint: 'Get-DnsServerZone', check: (s, h) => said(h, /get-dnsserverzone/i) },
      { t: '<b>แก้ต้นเหตุ:</b> ตั้ง DNS ของ DC ให้ชี้กลับมาที่ตัวเอง <code>192.168.10.5</code>', hint: 'Set-DnsClientServerAddress -InterfaceAlias Ethernet0 -ServerAddresses 192.168.10.5', check: s => s.nics.Ethernet0.dns[0] === '192.168.10.5' },
      { t: 'เริ่ม service <code>Dnscache</code> ที่หยุดอยู่', hint: 'Start-Service -Name Dnscache', check: s => s.services.Dnscache.status === 'Running' },
      { t: 'ล้าง DNS cache ที่อาจค้างค่าเก่า', hint: 'ipconfig /flushdns', check: (s, h) => said(h, /flushdns/i) },
      { t: 'ทดสอบว่าแปลงชื่อโดเมนได้แล้ว', hint: 'nslookup corp.local', check: (s, h) => said(h, /nslookup/i) },
      { t: 'ตรวจว่า AD ตอบสนองปกติ — ดูรายชื่อผู้ใช้', hint: 'Get-ADUser -Filter *', check: (s, h) => said(h, /get-aduser/i) },
      { t: 'บังคับให้ policy อัปเดตเพื่อยืนยันว่าใช้งานได้', hint: 'gpupdate /force', check: (s, h) => said(h, /gpupdate/i) },
      { t: 'ตรวจ event log เพื่อหาว่าใครแก้ค่าเมื่อไร', hint: 'Get-EventLog -LogName Security', check: (s, h) => said(h, /get-eventlog|get-winevent/i) },
    ],
    debrief: 'สาเหตุคือมีคนแก้ DNS ของ DC ให้ชี้ไป 8.8.8.8 (อาจตั้งใจดีเพราะ "เน็ตช้า") ซึ่งทำให้ DC หา SRV record ของตัวเองไม่เจอ และ client ก็หา DC ไม่เจอตามไปด้วย <b>กฎเหล็ก: DC ต้องชี้ DNS มาที่ตัวเองหรือ DC ตัวอื่นในโดเมนเสมอ ห้ามชี้ public DNS เป็นตัวแรกเด็ดขาด</b> ถ้าต้องการแปลงชื่อภายนอก ให้ตั้ง forwarder ที่ DNS server แทน บทเรียนเชิงระบบ: ต้องมี change control และ monitoring ที่เฝ้าค่าคอนฟิกสำคัญ',
  },

  // ---------------------------------------------------------
  {
    id: 'sv-disk-full',
    difficulty: 'easy',
    title: 'ดิสก์เต็ม ระบบเขียนไฟล์ไม่ได้',
    icon: '💾',
    severity: 'high',
    time: '15 นาที',
    caller: 'ระบบ Monitoring',
    story: 'ระบบแจ้งเตือนว่า /mnt/app เหลือพื้นที่ 2% แอปพลิเคชันเริ่มเขียนไฟล์ไม่ได้และ error พุ่ง ทีมเพิ่งเพิ่มดิสก์ก้อนใหม่ /dev/sdb เข้าเครื่องแล้วแต่ยังไม่ได้ใช้',
    impact: 'แอปพลิเคชันเขียนข้อมูลไม่ได้ ถ้าปล่อยไว้ระบบจะหยุดทำงาน',
    device: 'linux',
    init: {
      apply: st => {
        // /mnt/app เหลือ 2% ตามที่ monitoring แจ้ง — ส่วน inode ยังเหลือเยอะ
        // (df -i จึงเป็นตัวตัดออกว่าไม่ใช่เคส inode หมด)
        const app = st.filesystems.find(f => f.mp === '/mnt/app');
        app.used = 30013440; app.avail = 628736; app.iused = 402117;
        st.dirSizes['/mnt/app'] = '29G';
        st.dirSizes['/mnt/app/uploads'] = '24G';
        st.dirSizes['/var/log'] = '2.1G';
      },
    },
    tasks: [
      { t: 'ตรวจพื้นที่ดิสก์ทั้งหมด', hint: 'df -h', check: (s, h) => said(h, /^(sudo\s+)?df/i) },
      { t: 'ตรวจว่า inode หมดด้วยหรือไม่ (ดิสก์ว่างแต่เขียนไม่ได้)', hint: 'df -i', check: (s, h) => said(h, /df\s+-i/i) },
      { t: 'หาว่าโฟลเดอร์ไหนกินพื้นที่มากที่สุด', hint: 'du -sh /var/log', check: (s, h) => said(h, /^(sudo\s+)?du/i) },
      { t: 'ดูโครงสร้างดิสก์เพื่อยืนยันว่ามี <code>/dev/sdb</code> จริง', hint: 'lsblk', check: (s, h) => said(h, /^(sudo\s+)?lsblk/i) },
      { t: 'ตรวจสถานะ volume group ปัจจุบัน', hint: 'sudo vgs', check: (s, h) => said(h, /^(sudo\s+)?vgs/i) },
      { t: 'เตรียมดิสก์ใหม่ให้เป็น physical volume', hint: 'sudo pvcreate /dev/sdb', check: s => s.lvm.pvs.includes('/dev/sdb') },
      { t: 'เพิ่มดิสก์ใหม่เข้า volume group <code>vg_data</code>', hint: 'sudo vgextend vg_data /dev/sdb', check: s => s.lvm.vgs.vg_data.pvs.includes('/dev/sdb') },
      { t: 'ขยาย logical volume ให้ใช้พื้นที่ว่างทั้งหมด', hint: 'sudo lvextend -l +100%FREE /dev/vg_data/lv_app', check: s => s.lvm.lvs.lv_app.pendingResize === true },
      { t: '<b>อย่าลืมขั้นนี้</b> — ขยาย filesystem ให้เห็นพื้นที่ใหม่', hint: 'sudo resize2fs /dev/vg_data/lv_app', check: s => s.lvm.lvs.lv_app.pendingResize === false && s.filesystems.find(f => f.mp === '/mnt/app').size > 31457280 },
      { t: 'ยืนยันว่าพื้นที่เพิ่มขึ้นจริง', hint: 'df -h', check: (s, h) => h.filter(c => /^(sudo\s+)?df\s+-h/i.test(c.trim())).length >= 2 },
      { t: 'ป้องกันระยะยาว: ตรวจว่ามี log rotate อยู่ไหม', hint: 'ls -la /etc/logrotate.d', check: (s, h) => said(h, /logrotate/i) },
    ],
    debrief: 'ขั้นที่คนลืมบ่อยที่สุดคือ <code>resize2fs</code> — <code>lvextend</code> ขยายแค่ "ภาชนะ" แต่ filesystem ข้างในยังเท่าเดิม ทำให้ <code>df -h</code> แสดงขนาดเท่าเดิมและคนเข้าใจผิดว่าคำสั่งไม่ทำงาน อีกจุดที่ควรจำ: ถ้า <code>df -h</code> บอกว่ายังว่างแต่เขียนไฟล์ไม่ได้ ให้ตรวจ <code>df -i</code> เพราะอาจเป็น inode หมดจากไฟล์เล็กจำนวนมหาศาล',
  },

  // ---------------------------------------------------------
  {
    id: 'sv-loop',
    difficulty: 'medium',
    title: 'เน็ตวนลูป ทั้งวงล่ม',
    icon: '🔁',
    severity: 'critical',
    time: '10 นาที',
    caller: 'ทีม NOC',
    story: 'กราฟ traffic พุ่งชนเพดานทุกพอร์ตพร้อมกัน CPU ของสวิตช์ 100% ผู้ใช้ทั้งตึกใช้งานไม่ได้ NOC สงสัยว่ามีคนเสียบสายวนกลับเข้าสวิตช์ตัวเดียวกัน คุณยังพอเข้าเครื่องได้แต่ช้ามาก',
    impact: 'เครือข่ายทั้งอาคารใช้งานไม่ได้',
    device: 'mikrotik-sw',
    init: {
      apply: st => {
        st.tables['interface bridge'].push({ _id: '*90', name: 'bridge1', 'protocol-mode': 'none', 'vlan-filtering': 'no', disabled: false });
        ['ether1', 'ether2', 'ether3', 'ether4', 'ether5'].forEach((i, k) =>
          st.tables['interface bridge port'].push({ _id: '*9' + k, bridge: 'bridge1', interface: i, pvid: '1', disabled: false }));
      },
    },
    tasks: [
      { t: 'ตรวจสถานะเครื่องว่า CPU สูงจริงไหม', hint: '/system resource print', check: (s, h) => said(h, /system\s+resource\s+print/i) },
      { t: 'ดูรายการพอร์ตใน bridge', hint: '/interface bridge port print', check: (s, h) => said(h, /bridge\s+port\s+print/i) },
      { t: 'ตรวจการตั้งค่า bridge — ดูว่า STP เปิดอยู่ไหม', hint: '/interface bridge print', check: (s, h) => said(h, /interface\s+bridge\s+print/i) },
      { t: '<b>แก้ทันที:</b> เปิด RSTP ที่ bridge เพื่อตัดวง', hint: '/interface bridge set [find name=bridge1] protocol-mode=rstp', check: s => has(s, 'interface bridge', r => r.name === 'bridge1' && r['protocol-mode'] === 'rstp') },
      { t: 'ตั้ง priority ให้สวิตช์ตัวนี้เป็น root ที่ชัดเจน', hint: '/interface bridge set [find name=bridge1] priority=0x1000', check: s => has(s, 'interface bridge', r => r.name === 'bridge1' && String(r.priority).toLowerCase() === '0x1000') },
      { t: 'ปิดพอร์ตต้องสงสัย <code>ether5</code> ชั่วคราวเพื่อหยุด storm', hint: '/interface bridge port disable [find interface=ether5]', check: s => has(s, 'interface bridge port', r => r.interface === 'ether5' && (r.disabled === true || r.disabled === 'yes')) },
      { t: 'ตั้ง <code>edge=yes</code> ที่พอร์ตผู้ใช้ <code>ether4</code>', hint: '/interface bridge port set [find interface=ether4] edge=yes', check: s => has(s, 'interface bridge port', r => r.interface === 'ether4' && r.edge === 'yes') },
      { t: 'เปิด <code>bpdu-guard</code> ที่ <code>ether4</code> กันคนเอา switch มาเสียบ', hint: '/interface bridge port set [find interface=ether4] bpdu-guard=yes', check: s => has(s, 'interface bridge port', r => r.interface === 'ether4' && r['bpdu-guard'] === 'yes') },
      { t: 'ตรวจสถานะพอร์ตอีกครั้งว่านิ่งแล้ว', hint: '/interface bridge port print detail', check: (s, h) => h.filter(c => /bridge\s+port\s+print/i.test(c)).length >= 2 },
      { t: 'บันทึก config', hint: '/export', check: (s, h) => said(h, /^\/?export/i) },
    ],
    debrief: 'สาเหตุคือ bridge ถูกตั้ง <code>protocol-mode=none</code> (ปิด STP) ซึ่งบางคนทำเพราะคิดว่า "จะได้เร็วขึ้น" พอมีคนเสียบสายวน จึงไม่มีอะไรตัดวงเลย <b>Ethernet frame ไม่มี TTL</b> broadcast จึงวนไม่รู้จบจนล่มทั้งวง บทเรียน: อย่าปิด STP เด็ดขาด และพอร์ตผู้ใช้ทุกพอร์ตควรตั้ง <code>edge=yes</code> + <code>bpdu-guard=yes</code> เพื่อให้ระบบตัดพอร์ตเองก่อนที่จะลามทั้งวง',
  },

  // ---------------------------------------------------------
  {
    id: 'sv-rogue-account',
    difficulty: 'hard',
    title: 'พบบัญชีแปลกปลอมใน AD',
    icon: '🕵️',
    severity: 'critical',
    time: '20 นาที',
    caller: 'ทีม Security',
    story: 'ทีม security แจ้งว่าพบบัญชีชื่อ <code>svc_helper</code> ใน Domain Admins ซึ่งไม่มีใครในทีมสร้าง และเพิ่งถูกสร้างเมื่อคืนตอนตี 2 มีการล็อกอินจาก IP ต่างประเทศ',
    impact: 'ผู้โจมตีอาจมีสิทธิ์ระดับสูงสุดในโดเมนอยู่ในมือแล้ว',
    device: 'windows',
    init: {
      apply: st => {
        st.hostname = 'SRV-DC01';
        st.domain = 'corp.local';
        st.isDC = true;
        st.features.add('AD-Domain-Services');
        st.features.add('DNS');
        st.adGroups['Domain Admins'] = ['Administrator', 'svc_helper'];
        st.adGroups['Domain Users'] = ['Administrator', 'svc_helper'];
        st.adUsers['svc_helper'] = { name: 'Service Helper', sam: 'svc_helper', enabled: true, upn: 'svc_helper@corp.local', path: 'CN=Users,DC=corp,DC=local', groups: ['Domain Users', 'Domain Admins'] };
      },
    },
    tasks: [
      { t: 'ยืนยันว่าบัญชีนี้มีอยู่จริง', hint: 'Get-ADUser -Identity svc_helper', check: (s, h) => said(h, /get-aduser/i) },
      { t: 'ดูสมาชิกทั้งหมดของกลุ่ม <code>Domain Admins</code>', hint: 'Get-ADGroupMember -Identity "Domain Admins"', check: (s, h) => said(h, /get-adgroupmember/i) },
      { t: '<b>Containment:</b> ปิดบัญชีต้องสงสัยทันที', hint: 'Set-ADUser -Identity svc_helper -Enabled $false', check: s => s.adUsers['svc_helper'] && s.adUsers['svc_helper'].enabled === false },
      { t: 'ตรวจ event log ฝั่ง Security เพื่อหาร่องรอยการสร้างบัญชี', hint: 'Get-EventLog -LogName Security', check: (s, h) => said(h, /get-eventlog|get-winevent/i) },
      { t: 'ตรวจรายชื่อผู้ใช้ทั้งหมดว่ามีบัญชีแปลกอื่นอีกไหม', hint: 'Get-ADUser -Filter *', check: (s, h) => h.filter(c => /get-aduser/i.test(c)).length >= 2 },
      { t: 'ตรวจ local user บนเครื่อง DC ด้วย', hint: 'Get-LocalUser', check: (s, h) => said(h, /get-localuser/i) },
      { t: 'ตรวจ scheduled task ที่อาจถูกวางไว้เป็น persistence', hint: 'Get-ScheduledTask', check: (s, h) => said(h, /get-scheduledtask/i) },
      { t: 'ตรวจ firewall rule ว่ามีใครเปิดช่องทางไว้ไหม', hint: 'Get-NetFirewallRule', check: (s, h) => said(h, /get-netfirewallrule/i) },
      { t: 'เปิด AD Recycle Bin เพื่อให้กู้ object ได้หากถูกลบระหว่างสอบสวน', hint: 'Enable-ADOptionalFeature -Identity "Recycle Bin Feature" -Scope ForestOrConfigurationSet -Target corp.local', check: s => s.recycleBin === true },
      { t: 'สร้างกลุ่ม <code>Tier0-Admins</code> เตรียมจัดโครงสร้างสิทธิ์ใหม่', hint: 'New-ADGroup -Name Tier0-Admins -GroupScope Global', check: s => Object.keys(s.adGroups).some(g => g.toLowerCase() === 'tier0-admins') },
      { t: 'ตรวจสอบข้อมูล forest เพื่อทำรายงาน', hint: 'Get-ADForest', check: (s, h) => said(h, /get-adforest/i) },
    ],
    debrief: 'บัญชีที่ถูกเพิ่มเข้า Domain Admins ตอนตี 2 คือ <b>Persistence</b> ตาม MITRE ATT&CK ผู้โจมตีมักสร้างบัญชีชื่อคล้าย service account เพื่อให้ดูกลมกลืน สิ่งที่ต้องทำต่อจากนี้: รีเซ็ตรหัสผ่านบัญชีที่มีสิทธิ์สูงทั้งหมด, รีเซ็ตรหัส <code>krbtgt</code> สองครั้งเพื่อตัด golden ticket, หาว่าเข้ามาทางไหน และตรวจว่ามี persistence อื่นอีกไหม <b>อย่าเพิ่งลบบัญชีทิ้ง</b> — ปิดการใช้งานไว้ก่อนเพื่อเก็บเป็นหลักฐาน',
  },

  // ---------------------------------------------------------
  {
    id: 'sv-core-fail',
    difficulty: 'insane',
    title: 'Core Switch ดับ ต้องสลับตัวสำรอง',
    icon: '⚡',
    severity: 'critical',
    time: '15 นาที',
    caller: 'ทีม NOC',
    story: 'Distribution switch ตัวหลักดับกะทันหัน (power supply เสีย) ตัวสำรองอยู่ในตู้เดียวกันแต่ยังไม่ได้ตั้งค่าให้รับช่วง คุณต้องทำให้ตัวสำรองรับงานแทนภายใน 15 นาที ก่อนที่ผู้บริหารจะเข้าประชุมออนไลน์',
    impact: 'ผู้ใช้ทั้งอาคารออกอินเทอร์เน็ตและเข้าเซิร์ฟเวอร์ไม่ได้',
    device: 'cisco',
    tasks: [
      { t: 'เข้า global config mode', hint: 'enable → configure terminal', check: s => s.mode.startsWith('config') || s.mode === 'priv' },
      { t: 'ตั้งชื่อเครื่องให้ชัดว่าเป็นตัวที่รับงานอยู่', hint: 'hostname DSW-CORE-STANDBY', check: s => /STANDBY/i.test(s.hostname) },
      { t: 'เปิดความสามารถ routing บนสวิตช์', hint: 'ip routing', check: s => s.ipRouting === true },
      { t: 'ตั้งโหมด spanning tree เป็น <code>rapid-pvst</code>', hint: 'spanning-tree mode rapid-pvst', check: s => s.stpMode === 'rapid-pvst' },
      { t: 'สร้าง VLAN 10 และ 20', hint: 'vlan 10 → exit → vlan 20 → exit', check: s => s.vlans[10] && s.vlans[20] },
      { t: 'บังคับให้เป็น STP root ของ VLAN 10,20', hint: 'spanning-tree vlan 10,20 priority 4096', check: s => s.stpPriority[10] === 4096 && s.stpPriority[20] === 4096 },
      { t: 'ตั้ง SVI VLAN 10 = <code>192.168.10.3/24</code> และเปิดใช้งาน', hint: 'interface vlan 10 → ip address 192.168.10.3 255.255.255.0 → no shutdown', check: s => s.svis[10] && s.svis[10].ip === '192.168.10.3' && !s.svis[10].shutdown },
      { t: 'ตั้ง HSRP virtual IP <code>192.168.10.1</code> (gateway เดิมของผู้ใช้) ที่ group 10', hint: 'standby version 2 → standby 10 ip 192.168.10.1', check: s => s.svis[10]?.standby?.[10]?.ip === '192.168.10.1' },
      { t: 'ตั้ง priority 110 และเปิด preempt', hint: 'standby 10 priority 110 → standby 10 preempt', check: s => s.svis[10]?.standby?.[10]?.priority === 110 && s.svis[10]?.standby?.[10]?.preempt === true },
      { t: 'ตั้ง SVI VLAN 20 = <code>192.168.20.3/24</code> และเปิดใช้งาน', hint: 'exit → interface vlan 20 → ip address 192.168.20.3 255.255.255.0 → no shutdown', check: s => s.svis[20] && s.svis[20].ip === '192.168.20.3' && !s.svis[20].shutdown },
      { t: 'เพิ่ม default route ออก WAN ที่ <code>10.0.0.1</code>', hint: 'exit → ip route 0.0.0.0 0.0.0.0 10.0.0.1', check: s => s.routes.some(r => r.net === '0.0.0.0' && r.nh === '10.0.0.1') },
      { t: 'ตรวจสถานะ HSRP', hint: 'do show standby brief', check: (s, h) => said(h, /sh(ow)?\s+standby/i) },
      { t: 'บันทึก config ทันที', hint: 'end → write memory', check: s => !!s.savedConfig },
    ],
    debrief: 'สถานการณ์นี้เจ็บปวดเพราะ "มีตัวสำรองแต่ไม่ได้เตรียมไว้" — ถ้าตั้ง HSRP + STP root ให้ตรงกันไว้ล่วงหน้า ตัวสำรองจะรับช่วงเองภายในไม่กี่วินาทีโดยไม่มีใครรู้ตัว <b>บทเรียน: อุปกรณ์สำรองที่ไม่ได้ config ไว้ ไม่ถือว่าเป็น redundancy</b> และควรซ้อมถอดปลั๊กตัวหลักในช่วง maintenance window อย่างน้อยปีละครั้ง เพื่อพิสูจน์ว่าระบบสำรองทำงานได้จริง',
  },

  // ---------------------------------------------------------
  {
    id: 'sv-phishing',
    difficulty: 'medium',
    title: 'พนักงานกรอกรหัสให้ Phishing ไปแล้ว',
    icon: '🎣',
    severity: 'high',
    time: '15 นาที',
    caller: 'พนักงานบัญชี',
    story: 'พนักงานบัญชีโทรมาด้วยเสียงสั่นว่า "เมื่อกี้กดลิงก์ในอีเมลแล้วกรอกรหัสไป พอกด login แล้วมันเด้งไปหน้าว่าง หนูว่ามันแปลก ๆ" อีเมลนั้นอ้างว่ามาจากฝ่าย IT ให้ยืนยันรหัสผ่านภายใน 24 ชั่วโมง',
    impact: 'บัญชีผู้ใช้ถูกยึด อาจถูกใช้เข้าถึงระบบการเงินและอีเมลขององค์กร',
    device: 'windows',
    init: {
      apply: st => {
        st.hostname = 'SRV-DC01';
        st.domain = 'corp.local';
        st.isDC = true;
        st.features.add('AD-Domain-Services');
        st.adGroups['Domain Users'] = ['Administrator', 'nipa'];
        st.adGroups['Finance'] = ['nipa'];
        st.adUsers['nipa'] = { name: 'Nipa S', sam: 'nipa', enabled: true, upn: 'nipa@corp.local', path: 'CN=Users,DC=corp,DC=local', groups: ['Domain Users', 'Finance'] };
      },
    },
    tasks: [
      { t: 'ตรวจว่าบัญชีที่แจ้งมามีอยู่จริงและสถานะเป็นอย่างไร', hint: 'Get-ADUser -Identity nipa', check: (s, h) => said(h, /get-aduser/i) },
      { t: '<b>Containment:</b> ปิดบัญชีทันทีเพื่อตัดการเข้าถึงของผู้โจมตี', hint: 'Set-ADUser -Identity nipa -Enabled $false', check: s => s.adUsers.nipa && s.adUsers.nipa.enabled === false },
      { t: 'ตรวจว่าบัญชีนี้อยู่ในกลุ่มใดบ้าง (ประเมินความเสียหาย)', hint: 'Get-ADGroupMember -Identity Finance', check: (s, h) => said(h, /get-adgroupmember/i) },
      { t: 'ตรวจ event log หาการล็อกอินที่ผิดปกติ', hint: 'Get-EventLog -LogName Security', check: (s, h) => said(h, /get-eventlog|get-winevent/i) },
      { t: 'ตรวจว่ามีบัญชีอื่นถูกสร้างเพิ่มหรือไม่', hint: 'Get-ADUser -Filter *', check: (s, h) => h.filter(c => /get-aduser/i.test(c)).length >= 2 },
      { t: 'ตรวจ scheduled task ที่อาจถูกวางไว้', hint: 'Get-ScheduledTask', check: (s, h) => said(h, /get-scheduledtask/i) },
      { t: 'สร้างกลุ่ม <code>MFA-Required</code> เตรียมบังคับ MFA กับกลุ่มเสี่ยง', hint: 'New-ADGroup -Name MFA-Required -GroupScope Global', check: s => Object.keys(s.adGroups).some(g => g.toLowerCase() === 'mfa-required') },
      { t: 'เพิ่ม <code>nipa</code> เข้ากลุ่ม <code>MFA-Required</code>', hint: 'Add-ADGroupMember -Identity MFA-Required -Members nipa', check: s => { const g = Object.keys(s.adGroups).find(x => x.toLowerCase() === 'mfa-required'); return g && s.adGroups[g].includes('nipa'); } },
      { t: 'เปิดบัญชีคืนหลังรีเซ็ตรหัสผ่านและยืนยันตัวตนแล้ว', hint: 'Enable-ADAccount -Identity nipa', check: s => s.adUsers.nipa && s.adUsers.nipa.enabled === true },
      { t: 'สร้าง GPO ชื่อ <code>Phishing-Awareness</code> สำหรับบังคับนโยบายเพิ่มเติม', hint: 'New-GPO -Name "Phishing-Awareness"', check: s => s.gpos.includes('Phishing-Awareness') },
      { t: 'บังคับดึง policy ใหม่', hint: 'gpupdate /force', check: (s, h) => said(h, /gpupdate/i) },
    ],
    debrief: 'สิ่งที่ทำถูกที่สุดในเคสนี้คือ <b>พนักงานกล้าโทรมาแจ้งเอง</b> — องค์กรที่ลงโทษคนที่พลาดจะทำให้ครั้งต่อไปไม่มีใครกล้าบอก และกว่าจะรู้ก็สายเกินไป ลำดับการรับมือ: ปิดบัญชี → ประเมินว่าบัญชีนั้นเข้าถึงอะไรได้บ้าง → ตรวจว่าผู้โจมตีทำอะไรไปแล้ว → รีเซ็ตรหัสและเปิดคืนพร้อม MFA → แจ้งเตือนทั้งองค์กรว่ามี phishing แบบนี้ระบาด <b>MFA คือมาตรการเดียวที่ทำให้รหัสผ่านที่รั่วไปไม่มีค่า</b>',
  },
];

export const SURVIVAL_LABS = [...BASE_LABS, ...SURVIVAL_LABS_2];

export const difficultyLabel = {
  easy:   { th: 'ง่าย',      cls: 'easy',   xp: 40 },
  medium: { th: 'ปานกลาง',  cls: 'medium', xp: 70 },
  hard:   { th: 'ยาก',       cls: 'hard',   xp: 110 },
  insane: { th: 'โหด',       cls: 'insane', xp: 160 },
};

export const severityLabel = {
  critical: { th: 'วิกฤต', color: '#f87171', icon: '🔴' },
  high: { th: 'สูง', color: '#fb923c', icon: '🟠' },
  medium: { th: 'ปานกลาง', color: '#fbbf24', icon: '🟡' },
};
