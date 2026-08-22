// ============================================================
//  Lab แบบหน้าจอ GUI ของ Windows Server
//  ทำงานบน state ก้อนเดียวกับฝั่ง PowerShell — ตรวจผลจากสถานะจริง
//  history จะเก็บ action เป็นข้อความ เช่น "gui:service-start:Spooler"
// ============================================================
const said = (h, re) => h.some(c => re.test(String(c).trim()));
const grp = (s, n) => Object.keys(s.adGroups).find(x => x.toLowerCase() === n.toLowerCase());
const inGrp = (s, g, m) => { const k = grp(s, g); return !!k && s.adGroups[k].includes(m); };
const folder = (s, path) => {
  const parts = String(path).replace(/\\$/, '').split('\\');
  let n = s.fs['C:\\'];
  for (const p of parts.slice(1)) {
    if (!n || !n.d) return null;
    const k = Object.keys(n.c).find(x => x.toLowerCase() === p.toLowerCase());
    if (!k) return null;
    n = n.c[k];
  }
  return n;
};

// ---- ตัวช่วยสำหรับ lab ชุด AD / DNS / GPO / DHCP ----------------------------

/** เครื่องที่เป็น Domain Controller อยู่แล้ว — ใช้เป็นจุดตั้งต้นของ lab ที่ไม่ได้สอนการ promote */
const asDC = (domain = 'corp.local', extra) => st => {
  ['AD-Domain-Services', 'DNS', 'RSAT-AD-PowerShell'].forEach(f => st.features.add(f));
  st.domain = domain;
  st.isDC = true;
  st.dnsZones.push({ name: domain, type: 'Primary', dynamic: 'Secure' });
  st.dnsRecords.push({ name: 'srv-dc01', zone: domain, type: 'A', data: st.nics.Ethernet0.ip });
  st.adGroups['Domain Admins'] = ['Administrator'];
  st.adGroups['Domain Users'] = ['Administrator'];
  if (extra) extra(st);
};

/** ผู้ใช้ AD หนึ่งคนแบบสำเร็จรูป (ใช้ตอนอยากให้ lab มีข้อมูลตั้งต้น) */
const seedUser = (st, sam, name, ou) => {
  st.adUsers[sam] = {
    name, sam, enabled: true, upn: `${sam}@${st.domain}`,
    path: ou ? `OU=${ou},${String(st.domain).split('.').map(x => 'DC=' + x).join(',')}`
      : `CN=Users,DC=${String(st.domain).split('.').join(',DC=')}`,
    groups: ['Domain Users'],
  };
  st.adGroups['Domain Users'].push(sam);
};

const zone = (s, n) => (s.dnsZones || []).some(z => String(z.name).toLowerCase() === n.toLowerCase());
const rec = (s, fn) => (s.dnsRecords || []).some(fn);
const fwdr = (s, ip) => (s.dnsForwarders || []).includes(ip);
const gset = (s, g, k) => ((s.gpoSettings || {})[g] || {})[k];
const glink = (s, g, re) => (s.gpLinks || []).some(l => l.gpo === g && re.test(l.target));
const genf = (s, g, re) => (s.gpLinks || []).some(l => l.gpo === g && re.test(l.target) && l.enforced === 'Yes');
const scope = (s, n) => (s.dhcpScopes || []).find(x => String(x.name).toLowerCase() === n.toLowerCase());
const task = (s, n) => (s.scheduledTasks || []).find(t => String(t.name).toLowerCase() === n.toLowerCase());
const ouAt = (s, sam, ou) => new RegExp(`^OU=${ou}\\b`, 'i').test(String((s.adUsers[sam] || {}).path || ''));

export default {
  // ================= LEVEL 1 =================
  1: [
    {
      id: 'wg1-netconfig',
      title: 'Lab 1D — ตั้งค่า IP ผ่านหน้าจอ Windows (GUI)',
      brief: 'เซิร์ฟเวอร์ใหม่ยังไม่ได้ตั้ง IP ให้ตั้งค่าผ่านหน้าจอจริงแบบที่ทำหน้างาน: Network Connections → Properties → Internet Protocol Version 4 (TCP/IPv4) แล้วตรวจผลด้วย Command Prompt',
      device: 'windows-gui',
      init: { hostname: 'WIN-SRV01', openApps: ['ncpa.cpl'] },
      tasks: [
        { t: 'เปิด <b>Network Connections</b> (ดับเบิลคลิกไอคอนบนเดสก์ท็อป)', hint: 'ดับเบิลคลิกไอคอน Network Connections', check: (s, h) => said(h, /gui:open:ncpa\.cpl/) },
        { t: 'กด <b>Properties</b> ของการ์ด <code>Ethernet0</code>', hint: 'กดปุ่ม Properties ที่การ์ด Ethernet0', check: (s, h) => said(h, /gui:nic-props:Ethernet0/) },
        {
          t: 'เลือก <b>Use the following IP address</b> แล้วตั้ง IP <code>192.168.10.10</code> mask <code>255.255.255.0</code> gateway <code>192.168.10.1</code> → กด OK',
          hint: 'ติ๊ก Use the following IP address แล้วกรอก IP/Subnet/Gateway แล้วกด OK',
          check: s => s.nics.Ethernet0.ip === '192.168.10.10' && !s.nics.Ethernet0.dhcp && s.nics.Ethernet0.gw === '192.168.10.1',
        },
        {
          t: 'ตั้ง <b>Preferred DNS server</b> เป็น <code>192.168.10.10</code> (ชี้ที่ตัวเอง)',
          hint: 'ในหน้าเดียวกัน ติ๊ก Use the following DNS server addresses แล้วใส่ 192.168.10.10 → OK',
          check: s => s.nics.Ethernet0.dns[0] === '192.168.10.10',
        },
        { t: 'เปิด <b>Command Prompt</b> จากเดสก์ท็อปหรือปุ่ม Start', hint: 'ดับเบิลคลิกไอคอน Command Prompt', check: (s, h) => said(h, /gui:open:cmd/) },
        { t: 'ตรวจผลด้วย <code>ipconfig /all</code> ใน Command Prompt', hint: 'พิมพ์ ipconfig /all แล้วกด Run', check: (s, h) => said(h, /^ipconfig\s*\/all/i) },
        { t: 'ทดสอบว่าถึง gateway ด้วย <code>ping 192.168.10.1</code>', hint: 'พิมพ์ ping 192.168.10.1', check: (s, h) => said(h, /^ping\s+192\.168\.10\.1/i) },
      ],
    },
    {
      id: 'wg1-services',
      title: 'Lab 1E — จัดการ Service และ Process ผ่าน GUI',
      brief: 'ผู้ใช้แจ้งว่าสั่งพิมพ์ไม่ได้ และมีโปรแกรมค้างกิน CPU — ให้แก้ผ่านหน้าจอ Services และ Task Manager เหมือนที่ทำหน้าเครื่องจริง',
      device: 'windows-gui',
      init: {
        openApps: ['services.msc'],
        apply: st => {
          st.services.Spooler.status = 'Stopped';
          st.services.Spooler.start = 'Disabled';
          st.processes.push({ pid: 6612, name: 'runaway.exe', mem: 812400, user: 'Administrator', cpu: 78.4 });
        },
      },
      tasks: [
        { t: 'เปิด <b>Services</b> จากเดสก์ท็อป', hint: 'ดับเบิลคลิกไอคอน Services', check: (s, h) => said(h, /gui:open:services\.msc/) },
        { t: 'เปลี่ยน <b>Startup Type</b> ของ <code>Spooler</code> เป็น <code>Automatic</code>', hint: 'ที่แถว Spooler เลือก Automatic ในช่อง Startup Type', check: s => s.services.Spooler.start === 'Automatic' },
        { t: 'กด <b>Start</b> ที่ service <code>Spooler</code>', hint: 'กดปุ่ม Start ที่แถว Spooler', check: s => s.services.Spooler.status === 'Running' },
        { t: 'เปิด <b>Task Manager</b>', hint: 'ดับเบิลคลิกไอคอน Task Manager', check: (s, h) => said(h, /gui:open:taskmgr/) },
        { t: 'กด <b>End task</b> ปิด process <code>runaway.exe</code> ที่กิน CPU', hint: 'ที่แถว runaway.exe กด End task', check: s => !s.processes.some(p => p.name === 'runaway.exe') },
        { t: 'เปิด <b>Event Viewer</b> เพื่อตรวจว่ามี event ผิดปกติไหม', hint: 'ดับเบิลคลิกไอคอน Event Viewer', check: (s, h) => said(h, /gui:open:eventvwr/) },
        { t: 'ยืนยันด้วย Command Prompt ว่า Spooler ทำงานแล้ว (<code>sc query Spooler</code>)', hint: 'เปิด Command Prompt แล้วพิมพ์ sc query Spooler', check: (s, h) => said(h, /^sc\s+query\s+spooler/i) },
      ],
    },
  ],

  // ================= LEVEL 2 =================
  2: [
    {
      id: 'wg2-promote',
      title: 'Lab 2D — ติดตั้ง AD และสร้างโดเมนผ่าน Server Manager (GUI)',
      brief: 'สร้างโดเมนใหม่ทั้งหมดผ่านหน้าจอจริง: Server Manager → Add Roles and Features → Promote to domain controller แล้วสร้าง OU และผู้ใช้ใน ADUC',
      device: 'windows-gui',
      init: { hostname: 'SRV-DC01', openApps: ['servermanager'] },
      tasks: [
        { t: 'เปิด <b>Server Manager</b>', hint: 'ดับเบิลคลิกไอคอน Server Manager', check: (s, h) => said(h, /gui:open:servermanager/) },
        { t: 'กด <b>Add roles and features</b>', hint: 'กดปุ่ม Add roles and features ใน Dashboard', check: (s, h) => said(h, /gui:sm:addroles/) },
        { t: 'ติ๊กเลือก <code>AD-Domain-Services</code> แล้วกด <b>Install</b>', hint: 'ติ๊ก AD-Domain-Services แล้วกด Install', check: s => s.features.has('AD-Domain-Services') },
        { t: 'กลับหน้า Dashboard แล้วกด <b>Promote this server to a domain controller</b>', hint: 'กด Back แล้วกด Promote this server to a domain controller', check: (s, h) => said(h, /gui:sm:promote/) },
        { t: 'ใส่ชื่อโดเมน <code>corp.local</code> แล้วกด <b>Promote</b>', hint: 'กรอก corp.local ในช่อง Root domain name แล้วกด Promote to Domain Controller', check: s => s.domain === 'corp.local' && s.isDC },
        { t: 'เปิด <b>Active Directory Users and Computers</b>', hint: 'ดับเบิลคลิกไอคอน ADUC', check: (s, h) => said(h, /gui:open:dsa\.msc/) },
        { t: 'สร้าง OU ชื่อ <code>IT</code>', hint: 'ในช่อง New Organizational Unit ใส่ IT แล้วกด Create OU', check: s => s.adOUs.some(o => String(o).toLowerCase() === 'it') },
        { t: 'สร้าง OU ชื่อ <code>Sales</code>', hint: 'ใส่ Sales แล้วกด Create OU', check: s => s.adOUs.some(o => String(o).toLowerCase() === 'sales') },
        { t: 'สร้างผู้ใช้ logon name <code>somchai</code>', hint: 'กรอก Full name และ User logon name = somchai แล้วกด Create user', check: s => !!s.adUsers.somchai },
        { t: 'สร้างกลุ่ม <code>IT-Admins</code>', hint: 'กรอก IT-Admins แล้วกด Create group', check: s => !!grp(s, 'IT-Admins') },
        { t: 'เพิ่ม <code>somchai</code> เข้ากลุ่ม <code>IT-Admins</code>', hint: 'เลือกกลุ่มและผู้ใช้จาก dropdown แล้วกด Add to group', check: s => inGrp(s, 'IT-Admins', 'somchai') },
      ],
    },
    {
      id: 'wg2-share',
      title: 'Lab 2E — สร้างโฟลเดอร์แชร์ผ่าน File Explorer (GUI)',
      brief: 'แผนกบัญชีขอพื้นที่เก็บไฟล์ร่วมกัน ให้สร้างโฟลเดอร์และแชร์ผ่านหน้าจอ Explorer → Properties → Sharing เหมือนที่ทำจริง แล้วเปิดพอร์ต firewall',
      device: 'windows-gui',
      init: { openApps: ['explorer'] },
      tasks: [
        { t: 'เปิด <b>File Explorer</b>', hint: 'ดับเบิลคลิกไอคอน File Explorer', check: (s, h) => said(h, /gui:open:explorer/) },
        { t: 'สร้างโฟลเดอร์ <code>Shares</code> ที่ <code>C:\\</code>', hint: 'พิมพ์ Shares ในช่อง New folder name แล้วกด New folder', check: s => !!folder(s, 'C:\\Shares') },
        { t: 'เข้าไปในโฟลเดอร์ <code>Shares</code> (กด Open)', hint: 'กดปุ่ม Open ที่โฟลเดอร์ Shares', check: (s, h) => said(h, /gui:newfolder:C:\\\\Shares/i) || !!folder(s, 'C:\\Shares') },
        { t: 'สร้างโฟลเดอร์ย่อย <code>Finance</code> ข้างใน', hint: 'เมื่ออยู่ใน C:\\Shares พิมพ์ Finance แล้วกด New folder', check: s => !!folder(s, 'C:\\Shares\\Finance') },
        { t: 'เปิด <b>Properties</b> ของโฟลเดอร์ <code>Finance</code>', hint: 'กดปุ่ม Properties ที่โฟลเดอร์ Finance', check: (s, h) => said(h, /gui:props:.*Finance/i) },
        { t: 'ที่แท็บ <b>Sharing</b> แชร์ในชื่อ <code>Finance</code>', hint: 'ใส่ชื่อ share = Finance แล้วกด Share', check: s => !!s.shares.Finance },
        { t: 'ที่แท็บ <b>Security</b> ให้สิทธิ์ <code>Modify</code> แก่ <code>CORP\\Finance-RW</code>', hint: 'กดแท็บ Security ใส่ CORP\\Finance-RW เลือก Modify แล้วกด Apply', check: (s, h) => said(h, /gui:ntfs:.*Modify/i) },
        { t: 'เปิด <b>Windows Defender Firewall</b> แล้วสร้าง rule ชื่อ <code>Allow-SMB</code> พอร์ต <code>445</code>', hint: 'เปิด wf.msc กรอกชื่อและพอร์ต แล้วกด Finish', check: s => s.fwRules.some(r => /Allow-SMB/i.test(r.name) && String(r.port) === '445') },
        { t: 'ยืนยันด้วย Command Prompt: <code>net share</code>', hint: 'เปิด Command Prompt พิมพ์ net share', check: (s, h) => said(h, /^net\s+share/i) },
      ],
    },
    {
      id: 'wg2-domain-build',
      title: 'Lab 2F — สร้างโดเมนใหม่ตั้งแต่ศูนย์ (Forest แรกขององค์กร)',
      brief: 'บริษัทเพิ่งซื้อเซิร์ฟเวอร์ตัวแรก ยังเป็น workgroup อยู่ ให้เตรียมเครื่องแล้วยกระดับเป็น Domain Controller ของ corp.local ให้ครบทุกขั้นแบบที่ทำหน้างานจริง',
      device: 'windows-gui',
      init: {
        hostname: 'WIN-2022-TMP',
        openApps: ['sysdm.cpl'],
        apply: st => {
          st.nics.Ethernet0.dhcp = true;
          st.nics.Ethernet0.ip = '192.168.10.240';
          st.nics.Ethernet0.dns = [];
        },
      },
      tasks: [
        { t: 'เปิด <b>System Properties</b> แล้วเปลี่ยนชื่อเครื่องเป็น <code>SRV-DC01</code>', hint: 'แก้ช่อง Computer name เป็น SRV-DC01 แล้วกด OK', check: s => s.hostname === 'SRV-DC01' },
        {
          t: 'ตั้ง IP แบบ static <code>192.168.10.10</code> / <code>255.255.255.0</code> / gateway <code>192.168.10.1</code> (DC ห้ามใช้ DHCP)',
          hint: 'Network Connections → Properties → Use the following IP address',
          check: s => s.nics.Ethernet0.ip === '192.168.10.10' && !s.nics.Ethernet0.dhcp && s.nics.Ethernet0.gw === '192.168.10.1',
        },
        { t: 'ชี้ <b>Preferred DNS server</b> มาที่ตัวเอง <code>192.168.10.10</code>', hint: 'ในหน้าเดียวกัน ใส่ Preferred DNS server = 192.168.10.10', check: s => s.nics.Ethernet0.dns[0] === '192.168.10.10' },
        { t: 'เปิด <b>Server Manager</b> → <b>Add roles and features</b>', hint: 'กดปุ่ม Add roles and features ใน Dashboard', check: (s, h) => said(h, /gui:sm:addroles/) },
        { t: 'ติดตั้ง role <code>AD-Domain-Services</code>', hint: 'ติ๊ก AD-Domain-Services แล้วกด Install', check: s => s.features.has('AD-Domain-Services') },
        { t: 'กด <b>Promote this server to a domain controller</b> แล้วสร้าง forest ใหม่ชื่อ <code>corp.local</code>', hint: 'Back → Promote this server → กรอก corp.local + DSRM password → Promote', check: s => s.domain === 'corp.local' && s.isDC },
        { t: 'ตรวจว่า role <code>DNS</code> ถูกติดตั้งมาพร้อมกับ AD โดยอัตโนมัติ (เปิด Server Manager ดู Roles)', hint: 'การ promote เป็น DC จะติดตั้ง DNS ให้เอง — เปิด Server Manager ดูการ์ด Roles', check: (s, h) => s.features.has('DNS') && said(h, /gui:open:servermanager/) },
        { t: 'เปิด <b>Command Prompt</b> แล้วยืนยันโดเมนด้วย <code>Get-ADDomain</code>', hint: 'พิมพ์ Get-ADDomain', check: (s, h) => said(h, /^get-addomain/i) },
        { t: 'ตรวจว่าเป็นสมาชิกโดเมนแล้วด้วย <code>whoami</code>', hint: 'พิมพ์ whoami — ควรได้ corp\\administrator', check: (s, h) => said(h, /^whoami/i) },
      ],
      debrief: `<b>ลำดับที่ห้ามสลับ:</b> ตั้งชื่อเครื่อง → ตั้ง IP นิ่ง → ค่อย promote เป็น DC<br>
        ถ้า promote ไปแล้วค่อยเปลี่ยนชื่อหรือ IP จะยุ่งกว่าเดิมมาก เพราะชื่อและ IP ถูกเขียนลง AD/DNS ไปแล้ว<br>
        <b>DC ต้องชี้ DNS มาที่ตัวเอง</b> เพราะ AD ใช้ DNS หา Domain Controller — ถ้าชี้ไป 8.8.8.8 เครื่องลูกจะเข้าโดเมนไม่ได้`,
    },
    {
      id: 'wg2-dns',
      title: 'Lab 2G — ตั้งค่า DNS Server ผ่าน DNS Manager (GUI)',
      brief: 'โดเมนสร้างเสร็จแล้ว แต่ยังไม่มีเรคอร์ดของเซิร์ฟเวอร์งาน และ reverse lookup ยังใช้ไม่ได้ — ให้จัดการทั้งหมดผ่านหน้าจอ DNS Manager',
      device: 'windows-gui',
      init: {
        hostname: 'SRV-DC01', ip: '192.168.10.10', dns: ['192.168.10.10'],
        openApps: ['dnsmgmt.msc'],
        apply: asDC(),
      },
      tasks: [
        { t: 'เปิด <b>DNS Manager</b> จากเดสก์ท็อป', hint: 'ดับเบิลคลิกไอคอน DNS Manager', check: (s, h) => said(h, /gui:open:dnsmgmt\.msc/) },
        { t: 'เปิดโซน <code>corp.local</code> (กดปุ่ม Open ที่ Forward Lookup Zones)', hint: 'กด Open ที่โซน corp.local', check: (s, h) => said(h, /gui:dns-openzone:corp\.local/i) },
        {
          t: 'เพิ่ม <b>A record</b> ชื่อ <code>srv-app01</code> ชี้ไป <code>192.168.10.20</code>',
          hint: 'ในช่อง Name ใส่ srv-app01 เลือก type A ช่อง Data ใส่ 192.168.10.20 แล้วกด Add record',
          check: s => rec(s, r => r.type === 'A' && String(r.name).toLowerCase() === 'srv-app01' && r.data === '192.168.10.20'),
        },
        {
          t: 'เพิ่ม <b>A record</b> ชื่อ <code>srv-file01</code> ชี้ไป <code>192.168.10.30</code>',
          hint: 'ทำแบบเดียวกับข้อที่แล้ว',
          check: s => rec(s, r => r.type === 'A' && String(r.name).toLowerCase() === 'srv-file01' && r.data === '192.168.10.30'),
        },
        {
          t: 'เพิ่ม <b>CNAME</b> ชื่อ <code>www</code> ชี้ไป <code>srv-app01.corp.local</code>',
          hint: 'เลือก type CNAME ช่อง Data ใส่ srv-app01.corp.local',
          check: s => rec(s, r => r.type === 'CNAME' && String(r.name).toLowerCase() === 'www' && /srv-app01/i.test(r.data)),
        },
        {
          t: 'กลับหน้ารายการโซน แล้วสร้าง <b>Reverse Lookup Zone</b> ของเน็ตเวิร์ก <code>192.168.10</code>',
          hint: 'กด Back → เลือก Reverse Lookup Zone → ใส่ Network ID = 192.168.10 → Create zone',
          check: s => zone(s, '10.168.192.in-addr.arpa'),
        },
        {
          t: 'เปิด reverse zone แล้วเพิ่ม <b>PTR</b> ของเลขท้าย <code>20</code> ชี้ไป <code>srv-app01.corp.local</code>',
          hint: 'Open ที่ 10.168.192.in-addr.arpa → Host IP = 20 → Data = srv-app01.corp.local',
          check: s => rec(s, r => r.type === 'PTR' && String(r.name) === '20' && /srv-app01/i.test(r.data)),
        },
        {
          t: 'ตั้ง <b>Forwarder</b> ไปที่ <code>8.8.8.8</code> เพื่อให้คิวรีอินเทอร์เน็ตวิ่งออกได้',
          hint: 'กลับหน้ารายการโซน → ช่อง Forwarder IP ใส่ 8.8.8.8 → Add forwarder',
          check: s => fwdr(s, '8.8.8.8'),
        },
        { t: 'ยืนยันรายการโซนด้วย <code>Get-DnsServerZone</code> ใน Command Prompt', hint: 'เปิด Command Prompt พิมพ์ Get-DnsServerZone', check: (s, h) => said(h, /^get-dnsserverzone/i) },
        { t: 'ทดสอบการ resolve ด้วย <code>nslookup srv-app01.corp.local</code>', hint: 'พิมพ์ nslookup srv-app01.corp.local', check: (s, h) => said(h, /^nslookup\s+srv-app01/i) },
      ],
      debrief: `<b>A</b> = ชื่อ → IP · <b>CNAME</b> = ชื่อเล่นชี้ไปชื่อจริง (อย่าชี้ CNAME ไป IP ตรง ๆ) · <b>PTR</b> = IP → ชื่อ อยู่ใน reverse zone เท่านั้น<br>
        Reverse zone ของ 192.168.10.0/24 ต้องชื่อ <code>10.168.192.in-addr.arpa</code> — กลับลำดับ octet เสมอ<br>
        <b>Forwarder</b> คือ "ถ้าฉันไม่รู้ ให้ไปถามใคร" ถ้าไม่ตั้ง DNS จะไปไล่ถาม root hints เอง ซึ่งช้ากว่าและบางองค์กรบล็อกไว้`,
    },
    {
      id: 'wg2-adusers',
      title: 'Lab 2H — จัดโครงสร้าง OU และจัดการผู้ใช้ใน Active Directory (GUI)',
      brief: 'HR ส่งรายชื่อพนักงานเข้าใหม่ 2 คน พร้อมแจ้งว่ามีคนลาออก 1 คน และมีคนลืมรหัสผ่าน — จัดการทั้งหมดใน Active Directory Users and Computers',
      device: 'windows-gui',
      init: {
        hostname: 'SRV-DC01', ip: '192.168.10.10', dns: ['192.168.10.10'],
        openApps: ['dsa.msc'],
        apply: asDC('corp.local', st => {
          st.adOUs.push('Sales');
          seedUser(st, 'wichai', 'Wichai P', 'Sales');
        }),
      },
      tasks: [
        { t: 'เปิด <b>Active Directory Users and Computers</b>', hint: 'ดับเบิลคลิกไอคอน ADUC', check: (s, h) => said(h, /gui:open:dsa\.msc/) },
        { t: 'สร้าง OU ชื่อ <code>IT</code>', hint: 'ช่อง New Organizational Unit ใส่ IT แล้วกด Create OU', check: s => s.adOUs.some(o => String(o).toLowerCase() === 'it') },
        { t: 'สร้าง OU ชื่อ <code>Finance</code>', hint: 'ทำแบบเดียวกัน ใส่ Finance', check: s => s.adOUs.some(o => String(o).toLowerCase() === 'finance') },
        { t: 'สร้างผู้ใช้ <code>napat</code> (ชื่อเต็ม Napat S) — พนักงานใหม่แผนก IT', hint: 'Full name = Napat S, User logon name = napat', check: s => !!s.adUsers.napat },
        { t: 'สร้างผู้ใช้ <code>pimchan</code> (ชื่อเต็ม Pimchan K) — พนักงานใหม่แผนกบัญชี', hint: 'Full name = Pimchan K, User logon name = pimchan', check: s => !!s.adUsers.pimchan },
        { t: 'ย้าย <code>napat</code> เข้า OU <code>IT</code>', hint: 'ที่หัวข้อ "ย้าย OU / รีเซ็ตรหัสผ่าน" เลือก napat + IT แล้วกด Move to OU', check: s => ouAt(s, 'napat', 'IT') },
        { t: 'ย้าย <code>pimchan</code> เข้า OU <code>Finance</code>', hint: 'เลือก pimchan + Finance แล้วกด Move to OU', check: s => ouAt(s, 'pimchan', 'Finance') },
        { t: 'สร้างกลุ่ม <code>Finance-RW</code> สำหรับให้สิทธิ์โฟลเดอร์บัญชี', hint: 'ช่อง Group name ใส่ Finance-RW แล้วกด Create group', check: s => !!grp(s, 'Finance-RW') },
        { t: 'เพิ่ม <code>pimchan</code> เข้ากลุ่ม <code>Finance-RW</code>', hint: 'เลือกกลุ่มและผู้ใช้จาก dropdown แล้วกด Add to group', check: s => inGrp(s, 'Finance-RW', 'pimchan') },
        { t: '<code>wichai</code> ลืมรหัสผ่าน — กด <b>Reset password</b> ให้เขา', hint: 'เลือก wichai แล้วกด Reset password', check: s => !!(s.adUsers.wichai || {}).mustChange },
        { t: 'มีคนแจ้งว่า <code>wichai</code> ยังไม่กลับมาทำงาน ให้ <b>Disable</b> บัญชีไว้ก่อน', hint: 'เลือก wichai ในช่องกลุ่ม แล้วกด Disable selected user', check: s => (s.adUsers.wichai || {}).enabled === false },
        { t: 'ยืนยันรายชื่อผู้ใช้ด้วย <code>Get-ADUser -Filter *</code>', hint: 'เปิด Command Prompt พิมพ์ Get-ADUser -Filter *', check: (s, h) => said(h, /^get-aduser/i) },
      ],
      debrief: `<b>อย่าลบบัญชีคนลาออกทันที</b> — ให้ disable ไว้ก่อน เพราะ SID ของบัญชีผูกกับสิทธิ์ไฟล์และเมล ลบแล้วสร้างชื่อเดิมใหม่จะได้ SID คนละตัว สิทธิ์เดิมหายหมด<br>
        <b>OU มีไว้เพื่อสองอย่าง:</b> ใช้ link GPO และใช้ delegate สิทธิ์ให้ทีมย่อยดูแลเฉพาะ OU ของตัวเอง<br>
        <b>ให้สิทธิ์ผ่านกลุ่มเสมอ</b> ไม่ใช่รายคน — คนย้ายแผนกทีเดียวจบที่การเปลี่ยนกลุ่ม`,
    },
    {
      id: 'wg2-dhcp',
      title: 'Lab 2I — แจก IP อัตโนมัติด้วย DHCP (GUI)',
      brief: 'ออฟฟิศใหม่มีเครื่อง 60 เครื่อง จะมาตั้ง IP ทีละเครื่องไม่ไหว — ให้ติดตั้งและตั้งค่า DHCP ผ่านหน้าจอ พร้อมจอง IP ให้ปริ้นเตอร์',
      device: 'windows-gui',
      init: {
        hostname: 'SRV-DC01', ip: '192.168.10.10', dns: ['192.168.10.10'],
        openApps: ['servermanager'],
        apply: asDC(),
      },
      tasks: [
        { t: 'เปิด <b>Server Manager</b> → <b>Add roles and features</b> แล้วติดตั้ง role <code>DHCP</code>', hint: 'ติ๊ก DHCP แล้วกด Install', check: s => s.features.has('DHCP') },
        { t: 'เปิด <b>DHCP</b> จากเดสก์ท็อป', hint: 'ดับเบิลคลิกไอคอน DHCP', check: (s, h) => said(h, /gui:open:dhcpmgmt\.msc/) },
        { t: 'กด <b>Authorize this server</b> เพื่อ authorize DHCP ใน Active Directory', hint: 'กดปุ่ม Authorize this server', check: s => s.dhcpAuthorized === true },
        {
          t: 'สร้าง scope ชื่อ <code>Office-LAN</code> ช่วง <code>192.168.10.100</code> ถึง <code>192.168.10.200</code>',
          hint: 'กรอก Scope name / Start IP / End IP แล้วกด Create scope',
          check: s => { const sc = scope(s, 'Office-LAN'); return !!sc && sc.start === '192.168.10.100' && sc.end === '192.168.10.200'; },
        },
        {
          t: 'ตั้ง <b>Scope Option 003 Router</b> เป็น <code>192.168.10.1</code>',
          hint: 'ที่หัวข้อ Scope Options เลือก Office-LAN ใส่ 003 Router = 192.168.10.1 แล้วกด Apply options',
          check: s => (scope(s, 'Office-LAN') || {}).router === '192.168.10.1',
        },
        {
          t: 'ตั้ง <b>Scope Option 006 DNS Servers</b> เป็น <code>192.168.10.10</code> (ชี้มาที่ DC)',
          hint: 'ในหัวข้อเดียวกัน ใส่ 006 DNS Servers = 192.168.10.10 แล้วกด Apply options',
          check: s => (scope(s, 'Office-LAN') || {}).dns === '192.168.10.10',
        },
        {
          t: 'จอง IP <code>192.168.10.150</code> ให้ปริ้นเตอร์ MAC <code>00-0c-29-5b-11-a2</code>',
          hint: 'กรอก IP / MAC / Description แล้วกด Add reservation',
          check: s => (s.dhcpReservations || []).some(r => r.ip === '192.168.10.150' && /00-0c-29-5b-11-a2/i.test(r.mac)),
        },
        { t: 'ยืนยัน scope ด้วย <code>Get-DhcpServerv4Scope</code>', hint: 'เปิด Command Prompt พิมพ์ Get-DhcpServerv4Scope', check: (s, h) => said(h, /^get-dhcpserverv4scope/i) },
        { t: 'ยืนยันสถานะ authorize ด้วย <code>Get-DhcpServerInDC</code>', hint: 'พิมพ์ Get-DhcpServerInDC', check: (s, h) => said(h, /^get-dhcpserverindc/i) },
      ],
      debrief: `<b>Authorize สำคัญมาก</b> — ในโดเมน DHCP ที่ไม่ได้ authorize จะไม่ยอมแจก IP เลย เป็นกลไกกัน "rogue DHCP" ที่ใครก็ตั้งขึ้นมาป่วนเน็ตเวิร์ก<br>
        <b>อย่าให้ scope กินทั้ง subnet</b> — เว้นช่วงล่าง (.1–.99) ไว้ให้เซิร์ฟเวอร์ สวิตช์ และอุปกรณ์ที่ต้องใช้ IP นิ่ง<br>
        <b>Option 006 ต้องชี้ที่ DC</b> ไม่ใช่ 8.8.8.8 ไม่งั้นเครื่องลูกจะหา Domain Controller ไม่เจอและล็อกอินโดเมนไม่ได้`,
    },
  ],

  // ================= LEVEL 3 =================
  3: [
    {
      id: 'wg3-helpdesk',
      title: 'Lab 3D — งาน Helpdesk ประจำวันบนหน้าจอ Windows (GUI)',
      brief: 'เช้านี้มี 4 งานเข้ามาพร้อมกัน: พนักงานใหม่ต้องการบัญชี, มีคนขอสิทธิ์ remote desktop, เครื่องพิมพ์ค้าง และต้องเปลี่ยนชื่อเครื่องให้ตรงมาตรฐาน',
      device: 'windows-gui',
      init: {
        hostname: 'WIN-SRV01',
        openApps: ['lusrmgr.msc'],
        apply: st => { st.services.Spooler.status = 'Stopped'; },
      },
      tasks: [
        { t: 'เปิด <b>Local Users and Groups</b>', hint: 'ดับเบิลคลิกไอคอน Local Users and Groups', check: (s, h) => said(h, /gui:open:lusrmgr\.msc/) },
        { t: 'สร้าง local user ชื่อ <code>intern01</code>', hint: 'พิมพ์ intern01 ในช่อง User name แล้วกด Create', check: s => !!s.localUsers.intern01 },
        { t: 'ไปแท็บ <b>Groups</b> แล้วเพิ่ม <code>intern01</code> เข้ากลุ่ม <code>Remote Desktop Users</code>', hint: 'กดแท็บ Groups เลือกกลุ่มและผู้ใช้ แล้วกด Add', check: s => (s.localGroups['Remote Desktop Users'] || []).includes('intern01') },
        { t: 'เปิด <b>Services</b> แล้วกด <b>Restart</b> ที่ <code>Spooler</code> (เครื่องพิมพ์ค้าง)', hint: 'เปิด Services แล้วกด Restart ที่แถว Spooler', check: s => s.services.Spooler.status === 'Running' },
        { t: 'เปิด service <code>TermService</code> เพื่อให้ remote desktop ใช้ได้', hint: 'กด Start ที่แถว TermService', check: s => s.services.TermService.status === 'Running' },
        { t: 'ตั้ง Startup Type ของ <code>TermService</code> เป็น <code>Automatic</code>', hint: 'เลือก Automatic ในช่อง Startup Type ของ TermService', check: s => s.services.TermService.start === 'Automatic' },
        { t: 'เปิด <b>System Properties</b> แล้วเปลี่ยนชื่อเครื่องเป็น <code>SRV-APP01</code>', hint: 'เปิด System Properties แก้ Computer name แล้วกด OK', check: s => s.hostname === 'SRV-APP01' },
        { t: 'เปิด <b>Event Viewer</b> ตรวจ Security log ว่ามีการล็อกอินล้มเหลวไหม', hint: 'ดับเบิลคลิกไอคอน Event Viewer', check: (s, h) => said(h, /gui:open:eventvwr/) },
      ],
    },
    {
      id: 'wg3-troubleshoot',
      title: 'Lab 3E — เครื่องต่อเน็ตไม่ได้ (แก้ผ่าน GUI + cmd)',
      brief: 'ผู้ใช้แจ้งว่าเครื่องเข้าเน็ตไม่ได้เลย ไปถึงหน้าเครื่องพบว่า IP เป็น 169.254.x.x และการ์ดถูกปิดอยู่ — ให้ไล่หาสาเหตุและแก้ให้จบ',
      device: 'windows-gui',
      init: {
        hostname: 'PC-USER22',
        openApps: ['cmd'],
        apply: st => {
          st.nics.Ethernet0.status = 'Down';
          st.nics.Ethernet0.dhcp = true;
          st.nics.Ethernet0.ip = '169.254.88.12';
          st.nics.Ethernet0.gw = '';
          st.nics.Ethernet0.dns = [];
        },
      },
      tasks: [
        { t: 'เปิด <b>Command Prompt</b> แล้วดูสถานะเครือข่ายด้วย <code>ipconfig /all</code>', hint: 'พิมพ์ ipconfig /all', check: (s, h) => said(h, /^ipconfig\s*\/all/i) },
        { t: 'เปิด <b>Network Connections</b> เพื่อดูสถานะการ์ด', hint: 'ดับเบิลคลิกไอคอน Network Connections', check: (s, h) => said(h, /gui:open:ncpa\.cpl/) },
        { t: 'กด <b>Enable</b> เปิดการ์ด <code>Ethernet0</code> ที่ถูกปิดอยู่', hint: 'กดปุ่ม Enable ที่การ์ด Ethernet0', check: s => s.nics.Ethernet0.status === 'Up' },
        {
          t: 'ตั้ง IP แบบ static: <code>192.168.10.55</code> / <code>255.255.255.0</code> / gateway <code>192.168.10.1</code>',
          hint: 'Properties → Use the following IP address → กรอกค่า → OK',
          check: s => s.nics.Ethernet0.ip === '192.168.10.55' && !s.nics.Ethernet0.dhcp && s.nics.Ethernet0.gw === '192.168.10.1',
        },
        { t: 'ตั้ง DNS เป็น <code>192.168.10.5</code>', hint: 'ในหน้าเดียวกัน ใส่ Preferred DNS server = 192.168.10.5', check: s => s.nics.Ethernet0.dns[0] === '192.168.10.5' },
        { t: 'ล้าง DNS cache ด้วย <code>ipconfig /flushdns</code>', hint: 'ที่ Command Prompt พิมพ์ ipconfig /flushdns', check: (s, h) => said(h, /ipconfig\s*\/flushdns/i) },
        { t: 'ทดสอบ gateway: <code>ping 192.168.10.1</code>', hint: 'พิมพ์ ping 192.168.10.1', check: (s, h) => said(h, /^ping\s+192\.168\.10\.1/i) },
        { t: 'ทดสอบออกอินเทอร์เน็ต: <code>ping 8.8.8.8</code>', hint: 'พิมพ์ ping 8.8.8.8', check: (s, h) => said(h, /^ping\s+8\.8\.8\.8/i) },
        { t: 'ตรวจเส้นทางด้วย <code>route print</code>', hint: 'พิมพ์ route print', check: (s, h) => said(h, /^route\s+print/i) },
        { t: 'ตรวจ ARP ว่ามี IP ชนกันไหม: <code>arp -a</code>', hint: 'พิมพ์ arp -a', check: (s, h) => said(h, /^arp\s+-a/i) },
      ],
    },
    {
      id: 'wg3-gpo',
      title: 'Lab 3F — สร้างและ link Group Policy ผ่าน GPMC (GUI)',
      brief: 'ฝ่ายบริหารขอให้เครื่องของแผนก IT ล็อกหน้าจออัตโนมัติและ map ไดรฟ์งานให้เอง — ทำผ่าน Group Policy Management ไม่ต้องเดินไปตั้งทีละเครื่อง',
      device: 'windows-gui',
      init: {
        hostname: 'SRV-DC01', ip: '192.168.10.10', dns: ['192.168.10.10'],
        openApps: ['gpmc.msc'],
        apply: asDC('corp.local', st => {
          st.adOUs.push('IT', 'Sales', 'Finance');
          seedUser(st, 'napat', 'Napat S', 'IT');
        }),
      },
      tasks: [
        { t: 'เปิด <b>Group Policy Management</b> จากเดสก์ท็อป', hint: 'ดับเบิลคลิกไอคอน Group Policy Management', check: (s, h) => said(h, /gui:open:gpmc\.msc/) },
        { t: 'สร้าง GPO ใหม่ชื่อ <code>IT-Workstation-Policy</code>', hint: 'ช่อง ชื่อ GPO ใส่ IT-Workstation-Policy แล้วกด Create GPO', check: s => s.gpos.includes('IT-Workstation-Policy') },
        { t: 'กด <b>Edit</b> เข้าไปแก้ GPO ที่เพิ่งสร้าง', hint: 'กดปุ่ม Edit ที่แถว IT-Workstation-Policy', check: (s, h) => said(h, /gui:gpo-edit:IT-Workstation-Policy/) },
        {
          t: 'ตั้ง <b>ล็อกหน้าจอเมื่อไม่ใช้งาน</b> เป็น <code>10</code> นาที',
          hint: 'เลือก 10 ในช่อง "ล็อกหน้าจอเมื่อไม่ใช้งาน (นาที)"',
          check: s => gset(s, 'IT-Workstation-Policy', 'ScreenSaverTimeout') === '10',
        },
        {
          t: 'ตั้ง <b>Map network drive</b> เป็น <code>S:</code> ชี้ไป <code>\\\\SRV-DC01\\Shared</code>',
          hint: 'เลือกตัวเลือก S: \\\\SRV-DC01\\Shared ในช่อง Map network drive',
          check: s => /^S:/i.test(String(gset(s, 'IT-Workstation-Policy', 'MappedDrive') || '')),
        },
        {
          t: 'กลับหน้าหลัก แล้ว <b>Link</b> GPO นี้เข้ากับ OU <code>IT</code>',
          hint: 'กด Back → เลือก IT-Workstation-Policy + OU=IT,DC=corp,DC=local → กด Link',
          check: s => glink(s, 'IT-Workstation-Policy', /^OU=IT,/i),
        },
        {
          t: 'ตั้ง link นี้เป็น <b>Enforced</b> เพื่อไม่ให้ policy ระดับล่างมาทับ',
          hint: 'ที่ตาราง Links กดปุ่ม Enforced',
          check: s => genf(s, 'IT-Workstation-Policy', /^OU=IT,/i),
        },
        { t: 'กด <b>Run gpupdate /force</b> เพื่อสั่งให้นโยบายมีผลทันที', hint: 'กดปุ่ม Run gpupdate /force ท้ายหน้า', check: (s, h) => said(h, /gui:gpupdate/) },
        { t: 'ยืนยันรายการ GPO ด้วย <code>Get-GPO -All</code> ใน Command Prompt', hint: 'เปิด Command Prompt พิมพ์ Get-GPO -All', check: (s, h) => said(h, /^get-gpo/i) },
        { t: 'ตรวจว่า link ถูกต้องด้วย <code>Get-GPLink</code>', hint: 'พิมพ์ Get-GPLink', check: (s, h) => said(h, /^get-gplink/i) },
        { t: 'ดูผลรวมนโยบายที่ตกกับเครื่องด้วย <code>gpresult /r</code>', hint: 'พิมพ์ gpresult /r', check: (s, h) => said(h, /^gpresult/i) },
      ],
      debrief: `<b>GPO ไม่มีผลจนกว่าจะ link</b> — สร้างแล้วลอยอยู่เฉย ๆ ไม่ทำอะไรเลย ต้อง link เข้ากับ Site / Domain / OU ก่อน<br>
        <b>ลำดับการทับกัน (LSDOU):</b> Local → Site → Domain → OU ตัวหลังทับตัวหน้า ยกเว้น link ที่ตั้ง <b>Enforced</b> ซึ่งจะทับกลับลงมาและห้าม OU ล่างปฏิเสธ<br>
        <b>ผู้ใช้ต้องอยู่ใน OU ที่ link ไว้</b>ถึงจะโดน — ถ้าลืมย้ายผู้ใช้เข้า OU นโยบายจะไม่ตกใส่เขาเลย`,
    },
    {
      id: 'wg3-gpo-security',
      title: 'Lab 3G — บังคับนโยบายรหัสผ่านและความปลอดภัยทั้งโดเมน (GUI)',
      brief: 'ผลตรวจ audit บอกว่ารหัสผ่านองค์กรสั้นเกินไป ไม่มีการล็อกบัญชี และแผนกบัญชีเสียบ USB ได้อิสระ — ให้ปิดช่องโหว่ทั้งหมดด้วย Group Policy',
      device: 'windows-gui',
      init: {
        hostname: 'SRV-DC01', ip: '192.168.10.10', dns: ['192.168.10.10'],
        openApps: ['gpmc.msc'],
        apply: asDC('corp.local', st => {
          st.adOUs.push('IT', 'Finance');
          seedUser(st, 'pimchan', 'Pimchan K', 'Finance');
        }),
      },
      tasks: [
        { t: 'เปิด <b>Group Policy Management</b> แล้วกด <b>Edit</b> ที่ <code>Default Domain Policy</code>', hint: 'กดปุ่ม Edit ที่แถว Default Domain Policy', check: (s, h) => said(h, /gui:gpo-edit:Default Domain Policy/) },
        { t: 'ตั้ง <b>ความยาวรหัสผ่านขั้นต่ำ</b> เป็น <code>14</code> ตัวอักษร', hint: 'เลือก 14 ในช่องความยาวรหัสผ่านขั้นต่ำ', check: s => gset(s, 'Default Domain Policy', 'MinPasswordLength') === '14' },
        { t: 'เปิด <b>บังคับรหัสผ่านซับซ้อน</b> (Enabled)', hint: 'เลือก Enabled ในช่องบังคับรหัสผ่านซับซ้อน', check: s => gset(s, 'Default Domain Policy', 'PasswordComplexity') === 'Enabled' },
        { t: 'ตั้ง <b>อายุรหัสผ่านสูงสุด</b> เป็น <code>90</code> วัน', hint: 'เลือก 90 ในช่องอายุรหัสผ่านสูงสุด', check: s => gset(s, 'Default Domain Policy', 'MaxPasswordAge') === '90' },
        { t: 'ตั้ง <b>ล็อกบัญชีเมื่อใส่รหัสผิด</b> <code>5</code> ครั้ง', hint: 'เลือก 5 ในช่องล็อกบัญชีเมื่อใส่รหัสผิด', check: s => gset(s, 'Default Domain Policy', 'LockoutThreshold') === '5' },
        { t: 'เปิด <b>Audit logon</b> แบบ <code>Success and Failure</code> เพื่อให้ Event Viewer เก็บหลักฐาน', hint: 'เลือก Success and Failure ในช่อง Audit logon', check: s => gset(s, 'Default Domain Policy', 'AuditLogon') === 'Success and Failure' },
        {
          t: 'กลับหน้าหลัก ตรวจว่า <code>Default Domain Policy</code> ถูก link กับโดเมน <code>corp.local</code> อยู่แล้วหรือยัง — ถ้ายัง ให้ link',
          hint: 'ที่หัวข้อ Link an Existing GPO เลือก Default Domain Policy + corp.local แล้วกด Link',
          check: s => glink(s, 'Default Domain Policy', /^corp\.local$/i),
        },
        { t: 'สร้าง GPO แยกชื่อ <code>Finance-USB-Block</code>', hint: 'ช่อง ชื่อ GPO ใส่ Finance-USB-Block แล้วกด Create GPO', check: s => s.gpos.includes('Finance-USB-Block') },
        { t: 'ใน GPO นั้น ตั้ง <b>ห้ามใช้ USB storage</b> เป็น <code>Enabled</code>', hint: 'กด Edit ที่ Finance-USB-Block แล้วเลือก Enabled ในช่องห้ามใช้ USB storage', check: s => gset(s, 'Finance-USB-Block', 'DisableUSBStorage') === 'Enabled' },
        { t: 'Link <code>Finance-USB-Block</code> เข้ากับ OU <code>Finance</code> เท่านั้น', hint: 'เลือก Finance-USB-Block + OU=Finance,DC=corp,DC=local แล้วกด Link', check: s => glink(s, 'Finance-USB-Block', /^OU=Finance,/i) },
        { t: 'กด <b>Run gpupdate /force</b>', hint: 'กดปุ่ม Run gpupdate /force', check: (s, h) => said(h, /gui:gpupdate/) },
        { t: 'เปิด <b>Event Viewer</b> ตรวจว่ามี Audit Failure (Event ID 4625) ค้างอยู่ไหม', hint: 'ดับเบิลคลิกไอคอน Event Viewer', check: (s, h) => said(h, /gui:open:eventvwr/) },
      ],
      debrief: `<b>นโยบายรหัสผ่านของโดเมนต้อง link ที่ระดับ Domain</b> — ถ้าไป link ที่ OU จะไม่มีผลกับ domain account เลย เพราะ AD อ่าน password policy จาก GPO ที่ผูกกับโดเมนเท่านั้น (ถ้าอยากแยกรายกลุ่มต้องใช้ Fine-Grained Password Policy)<br>
        <b>แยก GPO ตามวัตถุประสงค์</b> อย่ายัดทุกอย่างลง Default Domain Policy — เวลาถอนหรือหาสาเหตุจะแยกไม่ออก<br>
        <b>Lockout threshold ต่ำเกินไปก็เป็นปัญหา</b> — ตั้ง 3 ครั้งแล้วเจอ mapped drive ค้าง credential เก่า พนักงานจะโดนล็อกทั้งวัน ค่ามาตรฐานคือ 5–10 ครั้ง`,
    },
  ],

  // ================= LEVEL 4 =================
  4: [
    {
      id: 'wg4-hardening',
      title: 'Lab 4D — Hardening ผ่านหน้าจอ GUI',
      brief: 'ทำตาม security baseline บนหน้าจอจริง: ปิด service ที่ไม่ใช้ ตั้ง firewall rule สร้างบัญชีบริการ และตรวจ event log',
      device: 'windows-gui',
      init: { hostname: 'SRV-PROD01', openApps: ['servermanager'] },
      tasks: [
        { t: 'เปิด <b>Services</b> แล้วตั้ง Startup Type ของ <code>TermService</code> เป็น <code>Disabled</code>', hint: 'เปิด Services เลือก Disabled ที่ TermService', check: s => s.services.TermService.start === 'Disabled' },
        { t: 'กด <b>Stop</b> ที่ <code>TermService</code>', hint: 'กดปุ่ม Stop ที่แถว TermService', check: s => s.services.TermService.status === 'Stopped' },
        { t: 'เปิด <b>Windows Defender Firewall</b>', hint: 'ดับเบิลคลิกไอคอน Windows Defender Firewall', check: (s, h) => said(h, /gui:open:wf\.msc/) },
        { t: 'สร้าง inbound rule <code>Block-Telnet</code> พอร์ต <code>23</code> แบบ <b>Block</b>', hint: 'กรอกชื่อ Block-Telnet พอร์ต 23 เลือก Block แล้วกด Finish', check: s => s.fwRules.some(r => /Block-Telnet/i.test(r.name) && r.action === 'Block') },
        { t: 'สร้าง inbound rule <code>Allow-HTTPS</code> พอร์ต <code>443</code> แบบ <b>Allow</b>', hint: 'กรอกชื่อ Allow-HTTPS พอร์ต 443 เลือก Allow แล้วกด Finish', check: s => s.fwRules.some(r => /Allow-HTTPS/i.test(r.name) && r.action === 'Allow' && String(r.port) === '443') },
        { t: 'เปิด <b>Local Users and Groups</b> แล้วสร้างบัญชีบริการ <code>svc-monitor</code>', hint: 'สร้าง user ชื่อ svc-monitor', check: s => !!s.localUsers['svc-monitor'] },
        { t: 'เปิด <b>Event Viewer</b> ตรวจ Security log', hint: 'ดับเบิลคลิกไอคอน Event Viewer', check: (s, h) => said(h, /gui:open:eventvwr/) },
        { t: 'ยืนยันด้วย cmd: <code>netstat -ano</code> ดูว่ามีพอร์ตอะไรเปิดอยู่', hint: 'เปิด Command Prompt พิมพ์ netstat -ano', check: (s, h) => said(h, /^netstat\s+-ano/i) },
        { t: 'ตรวจรายการ scheduled task ด้วย <code>schtasks /query</code>', hint: 'พิมพ์ schtasks /query', check: (s, h) => said(h, /^schtasks\s*\/query/i) },
      ],
    },
  ],

  // ================= LEVEL 5 =================
  5: [
    {
      id: 'wg5-greenfield',
      title: 'Lab 5D — วางระบบ AD ให้บริษัทใหม่ทั้งบริษัท (GUI)',
      brief: 'บริษัทเปิดสาขาใหม่ มีเซิร์ฟเวอร์เปล่าหนึ่งตัวและเวลา 1 วัน — ให้วางทั้งโดเมน DNS DHCP โครงสร้าง OU นโยบาย และงาน backup ให้จบในเครื่องเดียว',
      device: 'windows-gui',
      init: {
        hostname: 'WIN-2022-NEW',
        openApps: ['servermanager'],
        apply: st => { st.nics.Ethernet0.dhcp = true; st.nics.Ethernet0.ip = '192.168.20.199'; st.nics.Ethernet0.dns = []; },
      },
      tasks: [
        { t: 'เปลี่ยนชื่อเครื่องเป็น <code>SRV-BKK01</code> ผ่าน System Properties', hint: 'เปิด System Properties แก้ Computer name แล้วกด OK', check: s => s.hostname === 'SRV-BKK01' },
        {
          t: 'ตั้ง IP static <code>192.168.20.10</code> gateway <code>192.168.20.1</code> และ DNS ชี้ตัวเอง <code>192.168.20.10</code>',
          hint: 'Network Connections → Properties → กรอก IP / Gateway / Preferred DNS',
          check: s => s.nics.Ethernet0.ip === '192.168.20.10' && s.nics.Ethernet0.gw === '192.168.20.1' && s.nics.Ethernet0.dns[0] === '192.168.20.10',
        },
        { t: 'ติดตั้ง role <code>AD-Domain-Services</code> และ <code>DHCP</code> ใน Server Manager', hint: 'Add roles and features → ติ๊กทั้งสองตัว → Install', check: s => s.features.has('AD-Domain-Services') && s.features.has('DHCP') },
        { t: 'Promote เครื่องนี้เป็น DC ของโดเมนใหม่ <code>bkk.local</code>', hint: 'Promote this server to a domain controller → Root domain name = bkk.local', check: s => s.domain === 'bkk.local' && s.isDC },
        { t: 'สร้าง OU <code>HQ-IT</code>, <code>HQ-Sales</code> และ <code>Servers</code> ใน ADUC', hint: 'สร้างทีละอันในช่อง New Organizational Unit', check: s => ['hq-it', 'hq-sales', 'servers'].every(o => s.adOUs.some(x => String(x).toLowerCase() === o)) },
        { t: 'สร้างกลุ่มผู้ดูแลสาขา <code>BKK-Helpdesk</code> และผู้ใช้ <code>anan</code> แล้วเพิ่มเข้ากลุ่ม', hint: 'สร้าง user anan → สร้าง group BKK-Helpdesk → Add to group', check: s => !!s.adUsers.anan && inGrp(s, 'BKK-Helpdesk', 'anan') },
        { t: 'ย้าย <code>anan</code> เข้า OU <code>HQ-IT</code>', hint: 'ที่หัวข้อย้าย OU เลือก anan + HQ-IT แล้วกด Move to OU', check: s => ouAt(s, 'anan', 'HQ-IT') },
        {
          t: 'ใน DNS Manager เพิ่ม <b>A record</b> <code>srv-bkk01</code> → <code>192.168.20.10</code> และตั้ง forwarder <code>1.1.1.1</code>',
          hint: 'เปิดโซน bkk.local เพิ่ม A record แล้วกลับมาใส่ Forwarder IP',
          check: s => rec(s, r => r.type === 'A' && String(r.name).toLowerCase() === 'srv-bkk01' && r.data === '192.168.20.10') && fwdr(s, '1.1.1.1'),
        },
        { t: 'สร้าง <b>Reverse Lookup Zone</b> ของ <code>192.168.20</code>', hint: 'New Zone Wizard → Reverse Lookup Zone → Network ID = 192.168.20', check: s => zone(s, '20.168.192.in-addr.arpa') },
        {
          t: 'ใน DHCP: <b>Authorize</b> เซิร์ฟเวอร์ แล้วสร้าง scope <code>BKK-Office</code> ช่วง <code>192.168.20.100</code>–<code>192.168.20.220</code>',
          hint: 'Authorize this server → กรอก Scope name / Start / End → Create scope',
          check: s => s.dhcpAuthorized && !!scope(s, 'BKK-Office'),
        },
        {
          t: 'ตั้ง scope option <code>003 Router = 192.168.20.1</code> และ <code>006 DNS = 192.168.20.10</code>',
          hint: 'หัวข้อ Scope Options เลือก BKK-Office แล้วกรอกทั้งสองช่อง → Apply options',
          check: s => { const sc = scope(s, 'BKK-Office') || {}; return sc.router === '192.168.20.1' && sc.dns === '192.168.20.10'; },
        },
        {
          t: 'สร้าง GPO <code>BKK-Baseline</code> ตั้งรหัสผ่านขั้นต่ำ <code>12</code> และเปิด <b>Audit logon</b> แล้ว link เข้ากับโดเมน',
          hint: 'GPMC → Create GPO → Edit ตั้งค่า → Back → Link กับ bkk.local',
          check: s => gset(s, 'BKK-Baseline', 'MinPasswordLength') === '12'
            && !!gset(s, 'BKK-Baseline', 'AuditLogon')
            && glink(s, 'BKK-Baseline', /^bkk\.local$/i),
        },
        {
          t: 'สร้าง GPO <code>Servers-Hardening</code> ตั้ง <b>ห้ามเข้า Control Panel</b> = Enabled แล้ว link เข้า OU <code>Servers</code> แบบ <b>Enforced</b>',
          hint: 'สร้าง GPO → Edit → เลือก Enabled → Link กับ OU=Servers → กด Enforced',
          check: s => gset(s, 'Servers-Hardening', 'DisableControlPanel') === 'Enabled' && genf(s, 'Servers-Hardening', /^OU=Servers,/i),
        },
        { t: 'กด <b>Run gpupdate /force</b> ให้นโยบายมีผล', hint: 'ปุ่มท้ายหน้า Group Policy Management', check: (s, h) => said(h, /gui:gpupdate/) },
        {
          t: 'ใน File Explorer สร้างโฟลเดอร์ <code>C:\\Shares</code> แล้วแชร์ในชื่อ <code>Shares</code>',
          hint: 'New folder → Properties → แท็บ Sharing → Share',
          check: s => !!folder(s, 'C:\\Shares') && !!s.shares.Shares,
        },
        {
          t: 'ใน <b>Task Scheduler</b> สร้างงาน <code>Nightly-Backup</code> แบบ <code>Daily</code>',
          hint: 'เปิด Task Scheduler → กรอก Name = Nightly-Backup เลือก Daily → Create',
          check: s => { const t = task(s, 'Nightly-Backup'); return !!t && t.trigger === 'Daily'; },
        },
        { t: 'กด <b>Run</b> ทดสอบงาน backup ว่ารันได้จริง', hint: 'กดปุ่ม Run ที่แถว Nightly-Backup', check: (s, h) => said(h, /gui:task-run:Nightly-Backup/) },
        { t: 'ปิดท้ายด้วยการตรวจทั้งระบบ: <code>Get-ADDomain</code>', hint: 'เปิด Command Prompt พิมพ์ Get-ADDomain', check: (s, h) => said(h, /^get-addomain/i) },
        { t: 'ตรวจ scope ที่แจกอยู่: <code>Get-DhcpServerv4Scope</code>', hint: 'พิมพ์ Get-DhcpServerv4Scope', check: (s, h) => said(h, /^get-dhcpserverv4scope/i) },
        { t: 'ตรวจนโยบายที่ตกกับเครื่อง: <code>gpresult /r</code>', hint: 'พิมพ์ gpresult /r', check: (s, h) => said(h, /^gpresult/i) },
      ],
      debrief: `<b>ลำดับการวางระบบสาขาใหม่:</b> ชื่อเครื่อง → IP นิ่ง → roles → promote → DNS → DHCP → OU → GPO → งานประจำ<br>
        แต่ละขั้นเป็นฐานของขั้นถัดไป ข้ามแล้วต้องกลับมาแก้ทีหลังเสมอ<br>
        <b>DC ตัวเดียวคือจุดตายเดี่ยว</b> — ของจริงต้องมี DC ตัวที่สองเสมอ ถ้าตัวเดียวล่ม ทั้งสาขาล็อกอินไม่ได้ทันที<br>
        <b>ทุกอย่างที่ทำผ่าน GUI วันนี้ ทำซ้ำได้ด้วย PowerShell</b> — สาขาที่ 3, 4, 5 ควรเป็นสคริปต์ ไม่ใช่การคลิกซ้ำ`,
    },
  ],
};
