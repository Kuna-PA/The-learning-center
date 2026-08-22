// Lab เพิ่มเติมของ Cisco Switch — 2 lab ต่อระดับ
const F = n => 'FastEthernet0/' + n;
const G = n => 'GigabitEthernet0/' + n;
const ran = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const said = (h, re) => h.some(c => re.test(c.trim()));

const BY_OLD_LEVEL = {
  // ================= LEVEL 1 =================
  1: [
    {
      id: 'c1-health',
      title: 'Lab 1B — ตรวจสุขภาพสวิตช์ก่อนรับมอบงาน',
      brief: 'ผู้รับเหมาเพิ่งติดตั้งสวิตช์เสร็จและส่งมอบให้คุณ ก่อนเซ็นรับต้องเก็บข้อมูลพื้นฐานของเครื่องและตรวจว่าพอร์ตไหนใช้งานอยู่บ้าง',
      device: 'cisco',
      tasks: [
        { t: 'เข้าสู่ privileged EXEC mode', hint: 'enable', check: s => s.mode !== 'user' },
        { t: 'ดูรุ่น IOS และ uptime ของเครื่อง', hint: 'show version', check: (s, h) => said(h, /^sh(ow)?\s+ver/i) },
        { t: 'ดูสถานะพอร์ตทั้งหมดว่าพอร์ตไหน connected', hint: 'show interfaces status', check: (s, h) => said(h, /^(do\s+)?sh(ow)?\s+int\w*\s+st/i) },
        { t: 'ดูตาราง MAC address ที่สวิตช์เรียนรู้ไว้', hint: 'show mac address-table', check: (s, h) => said(h, /^(do\s+)?sh(ow)?\s+mac/i) },
        { t: 'ดูรายชื่อ VLAN ที่มีอยู่', hint: 'show vlan brief', check: (s, h) => said(h, /^(do\s+)?sh(ow)?\s+vlan/i) },
        { t: 'ดู config ที่กำลังทำงานอยู่', hint: 'show running-config', check: (s, h) => said(h, /^(do\s+)?sh(ow)?\s+run/i) },
        { t: 'ตรวจว่ามี config เซฟไว้ใน NVRAM หรือยัง', hint: 'show startup-config', check: (s, h) => said(h, /^(do\s+)?sh(ow)?\s+star/i) },
      ],
    },
    {
      id: 'c1-ports',
      title: 'Lab 1C — จัดระเบียบพอร์ตและกู้พอร์ตที่ถูกปิด',
      brief: 'ผู้ใช้แจ้งว่าพอร์ตที่โต๊ะใช้ไม่ได้ ตรวจแล้วพบว่าถูกสั่ง shutdown ไว้ นอกจากเปิดคืนแล้วให้ใส่ description ทุกพอร์ตที่ใช้งานเพื่อให้ทีมอื่นดูออก',
      device: 'cisco',
      init: { apply: st => { st.ifaces['FastEthernet0/5'].shutdown = true; st.ifaces['FastEthernet0/5'].link = true; } },
      tasks: [
        { t: 'เข้า global config mode', hint: 'enable → configure terminal', check: s => s.mode.startsWith('config') || s.mode === 'priv' },
        { t: 'ตั้ง hostname เป็น <code>SW-OFFICE-2F</code>', hint: 'hostname SW-OFFICE-2F', check: s => s.hostname === 'SW-OFFICE-2F' },
        { t: 'เปิดพอร์ต Fa0/5 ที่ถูกปิดอยู่กลับมาใช้งาน', hint: 'interface fa0/5 → no shutdown', check: s => s.ifaces[F(5)].shutdown === false },
        { t: 'ใส่ description <code>Desk-201</code> ที่ Fa0/5', hint: 'description Desk-201', check: s => s.ifaces[F(5)].desc === 'Desk-201' },
        { t: 'ใส่ description <code>Uplink-Core</code> ที่ Gi0/1', hint: 'interface gi0/1 → description Uplink-Core', check: s => s.ifaces[G(1)].desc === 'Uplink-Core' },
        { t: 'ล็อกความเร็ว Gi0/1 เป็น <code>1000</code> และ duplex <code>full</code>', hint: 'speed 1000 → duplex full', check: s => s.ifaces[G(1)].speed === '1000' && s.ifaces[G(1)].duplex === 'full' },
        { t: 'ปิดพอร์ตที่ยังไม่ได้ใช้ Fa0/20 ถึง Fa0/24', hint: 'interface range fa0/20 - 24 → shutdown', check: s => ran(20, 24).every(i => s.ifaces[F(i)].shutdown) },
        { t: 'บันทึก config', hint: 'end → write memory', check: s => !!s.savedConfig },
      ],
    },
  ],

  // ================= LEVEL 2 =================
  2: [
    {
      id: 'c2-cctv',
      title: 'Lab 2B — เพิ่มวง CCTV และ VoIP',
      brief: 'บริษัทกำลังติดกล้อง IP 8 ตัวและโทรศัพท์ IP ต้องแยก VLAN ออกจากวงออฟฟิศ และให้ทั้งสอง VLAN วิ่งผ่าน uplink เดิมได้',
      device: 'cisco',
      tasks: [
        { t: 'เข้า global config mode', hint: 'enable → configure terminal', check: s => s.mode.startsWith('config') || s.mode === 'priv' },
        { t: 'สร้าง VLAN 50 ชื่อ <code>CCTV</code>', hint: 'vlan 50 → name CCTV', check: s => s.vlans[50] && s.vlans[50].name.toUpperCase() === 'CCTV' },
        { t: 'สร้าง VLAN 60 ชื่อ <code>VOICE</code>', hint: 'exit → vlan 60 → name VOICE', check: s => s.vlans[60] && s.vlans[60].name.toUpperCase() === 'VOICE' },
        {
          t: 'ตั้ง Fa0/9 ถึง Fa0/16 เป็น access VLAN 50 สำหรับกล้อง', hint: 'exit → interface range fa0/9 - 16 → switchport mode access → switchport access vlan 50',
          check: s => ran(9, 16).every(i => s.ifaces[F(i)].swMode === 'access' && s.ifaces[F(i)].accessVlan === 50)
        },
        {
          t: 'เปิด PoE แบบ auto ให้พอร์ตกล้อง Fa0/9-16', hint: 'power inline auto',
          check: s => ran(9, 16).every(i => s.ifaces[F(i)].poe === 'auto')
        },
        {
          t: 'ตั้ง Fa0/17 ถึง Fa0/20 เป็น access VLAN 10 พร้อม voice vlan 60', hint: 'interface range fa0/17 - 20 → switchport mode access → switchport access vlan 10 → switchport voice vlan 60',
          check: s => ran(17, 20).every(i => s.ifaces[F(i)].accessVlan === 10 && s.ifaces[F(i)].voiceVlan === 60)
        },
        {
          t: 'เปิด portfast ที่พอร์ตกล้องและโทรศัพท์ Fa0/9-20', hint: 'interface range fa0/9 - 20 → spanning-tree portfast',
          check: s => ran(9, 20).every(i => s.ifaces[F(i)].portfast)
        },
        {
          t: 'ให้ trunk Gi0/1 ยอมให้ VLAN 10,50,60 ผ่าน', hint: 'interface gi0/1 → switchport mode trunk → switchport trunk allowed vlan 10,50,60',
          check: s => { const a = s.ifaces[G(1)].allowed || ''; return s.ifaces[G(1)].swMode === 'trunk' && /50/.test(a) && /60/.test(a) && /10/.test(a); }
        },
      ],
    },
    {
      id: 'c2-trunkfix',
      title: 'Lab 2C — แก้เคส "VLAN ข้ามสวิตช์ไม่ได้"',
      brief: 'ผู้ใช้ VLAN 20 ที่ชั้น 3 คุยกับเซิร์ฟเวอร์ชั้น 1 ไม่ได้ แต่ VLAN 10 ปกติ สวิตช์ตัวนี้ถูกตั้ง trunk ไว้ผิด — ให้ไล่หาและแก้ให้ถูกต้อง',
      device: 'cisco',
      init: {
        apply: st => {
          st.vlans[10] = { id: 10, name: 'OFFICE' };
          st.vlans[20] = { id: 20, name: 'SERVER' };
          const p = st.ifaces['GigabitEthernet0/1'];
          p.swMode = 'trunk'; p.encap = 'dot1q'; p.allowed = '1,10'; p.nativeVlan = 1;
        },
      },
      tasks: [
        { t: 'ดูสถานะ trunk ปัจจุบันเพื่อหาสาเหตุ', hint: 'enable → show interfaces trunk', check: (s, h) => said(h, /^(do\s+)?sh(ow)?\s+int\w*\s+tr/i) },
        { t: 'ตรวจสอบว่ามี VLAN 20 อยู่บนสวิตช์จริง', hint: 'show vlan brief', check: (s, h) => said(h, /^(do\s+)?sh(ow)?\s+vlan/i) },
        {
          t: 'แก้ allowed vlan ของ Gi0/1 ให้มี VLAN 10 และ 20', hint: 'configure terminal → interface gi0/1 → switchport trunk allowed vlan 10,20',
          check: s => { const a = s.ifaces[G(1)].allowed || ''; return /\b10\b/.test(a) && /\b20\b/.test(a); }
        },
        { t: 'เปลี่ยน native vlan ของ trunk เป็น <code>999</code> ตามมาตรฐานองค์กร', hint: 'switchport trunk native vlan 999', check: s => s.ifaces[G(1)].nativeVlan === 999 },
        { t: 'สร้าง VLAN 999 ชื่อ <code>NATIVE-UNUSED</code>', hint: 'exit → vlan 999 → name NATIVE-UNUSED', check: s => s.vlans[999] && /NATIVE/i.test(s.vlans[999].name) },
        { t: 'ปิดการต่อรอง DTP ที่ trunk (nonegotiate)', hint: 'exit → interface gi0/1 → switchport nonegotiate', check: s => s.ifaces[G(1)].nonegotiate === true },
        { t: 'ตรวจผลอีกครั้งด้วย show interfaces trunk', hint: 'do show interfaces trunk', check: (s, h) => h.filter(c => /sh(ow)?\s+int\w*\s+tr/i.test(c)).length >= 2 },
        { t: 'บันทึก config', hint: 'end → write memory', check: s => !!s.savedConfig },
      ],
    },
  ],

  // ================= LEVEL 3 =================
  3: [
    {
      id: 'c3-po-trunk',
      title: 'Lab 3B — EtherChannel ไป Core พร้อม Trunk',
      brief: 'อัปลิงก์เส้นเดียวเริ่มเต็ม ทีมตัดสินใจเพิ่มเป็น 2 เส้นแล้วรวมเป็น EtherChannel — ต้องตั้งให้ทั้งกลุ่มเป็น trunk และจำกัด VLAN ที่ผ่าน',
      device: 'cisco',
      tasks: [
        { t: 'เข้า global config mode', hint: 'enable → configure terminal', check: s => s.mode.startsWith('config') || s.mode === 'priv' },
        { t: 'สร้าง VLAN 10, 20 และ 99', hint: 'vlan 10 → exit → vlan 20 → exit → vlan 99', check: s => s.vlans[10] && s.vlans[20] && s.vlans[99] },
        {
          t: 'รวม Gi0/1 และ Gi0/2 เข้า channel-group 1 ด้วย LACP (mode active)', hint: 'exit → interface range gi0/1 - 2 → channel-group 1 mode active',
          check: s => [G(1), G(2)].every(n => s.ifaces[n].channel && s.ifaces[n].channel.group === 1 && s.ifaces[n].channel.mode === 'active')
        },
        { t: 'ตั้ง Port-channel1 เป็น trunk', hint: 'exit → interface port-channel 1 → switchport mode trunk', check: s => s.ifaces['Port-channel1'] && s.ifaces['Port-channel1'].swMode === 'trunk' },
        {
          t: 'จำกัด allowed vlan ของ Port-channel1 เป็น 10,20,99', hint: 'switchport trunk allowed vlan 10,20,99',
          check: s => { const a = (s.ifaces['Port-channel1'] || {}).allowed || ''; return /10/.test(a) && /20/.test(a) && /99/.test(a); }
        },
        { t: 'ตั้ง native vlan ของ Port-channel1 เป็น 999', hint: 'switchport trunk native vlan 999', check: s => s.ifaces['Port-channel1'] && s.ifaces['Port-channel1'].nativeVlan === 999 },
        { t: 'ตรวจสอบสถานะ EtherChannel', hint: 'do show etherchannel summary', check: (s, h) => said(h, /sh(ow)?\s+ether/i) },
        { t: 'บันทึก config', hint: 'end → write memory', check: s => !!s.savedConfig },
      ],
    },
    {
      id: 'c3-psec',
      title: 'Lab 3C — ล็อกพอร์ตผู้ใช้ด้วย Port Security',
      brief: 'มีคนแอบเอา switch มาเสียบพ่วงใต้โต๊ะทำให้เกิดปัญหาหลายครั้ง ทีมตัดสินใจบังคับ port-security ทั้งชั้น พร้อมตั้ง auto-recovery ไม่ให้ helpdesk ต้องเดินไปกดทุกครั้ง',
      device: 'cisco',
      tasks: [
        { t: 'เข้า global config mode', hint: 'enable → configure terminal', check: s => s.mode.startsWith('config') || s.mode === 'priv' },
        {
          t: 'ตั้ง Fa0/1 ถึง Fa0/16 เป็น access port ของ VLAN 10', hint: 'interface range fa0/1 - 16 → switchport mode access → switchport access vlan 10',
          check: s => ran(1, 16).every(i => s.ifaces[F(i)].swMode === 'access' && s.ifaces[F(i)].accessVlan === 10)
        },
        {
          t: 'เปิด port-security ที่ Fa0/1-16', hint: 'switchport port-security',
          check: s => ran(1, 16).every(i => !!s.ifaces[F(i)].psec)
        },
        {
          t: 'จำกัด MAC ได้สูงสุด 2 ตัวต่อพอร์ต (เผื่อ IP Phone)', hint: 'switchport port-security maximum 2',
          check: s => ran(1, 16).every(i => s.ifaces[F(i)].psec?.max === 2)
        },
        {
          t: 'ตั้ง violation เป็น <code>restrict</code>', hint: 'switchport port-security violation restrict',
          check: s => ran(1, 16).every(i => s.ifaces[F(i)].psec?.violation === 'restrict')
        },
        {
          t: 'เปิดการเรียนรู้ MAC แบบ sticky', hint: 'switchport port-security mac-address sticky',
          check: s => ran(1, 16).every(i => s.ifaces[F(i)].psec?.sticky)
        },
        {
          t: 'เปิด portfast และ bpduguard ที่พอร์ตเดียวกัน', hint: 'spanning-tree portfast → spanning-tree bpduguard enable',
          check: s => ran(1, 16).every(i => s.ifaces[F(i)].portfast && s.ifaces[F(i)].bpduguard)
        },
        { t: 'ตั้ง errdisable recovery สำหรับสาเหตุ <code>bpduguard</code>', hint: 'exit → errdisable recovery cause bpduguard', check: s => s.errdisableRecovery.causes.includes('bpduguard') },
        { t: 'ตั้ง errdisable recovery interval เป็น <code>60</code> วินาที', hint: 'errdisable recovery interval 60', check: s => s.errdisableRecovery.interval === 60 },
        { t: 'ตรวจสอบผลด้วย show port-security', hint: 'do show port-security', check: (s, h) => said(h, /sh(ow)?\s+port-sec/i) },
      ],
    },
  ],

  // ================= LEVEL 4 =================
  4: [
    {
      id: 'c4-snoop',
      title: 'Lab 4B — ปิดช่อง Rogue DHCP ด้วย DHCP Snooping + DAI',
      brief: 'สัปดาห์ที่แล้วมีคนเอา router บ้านมาเสียบ ทำให้คนทั้งชั้นได้ IP ผิดและใช้เน็ตไม่ได้ 2 ชั่วโมง ทีมสั่งให้เปิด DHCP Snooping และ Dynamic ARP Inspection ทุกสวิตช์ชั้น access',
      device: 'cisco',
      tasks: [
        { t: 'เข้า global config mode', hint: 'enable → configure terminal', check: s => s.mode.startsWith('config') || s.mode === 'priv' },
        { t: 'สร้าง VLAN 10 และ VLAN 20', hint: 'vlan 10 → exit → vlan 20 → exit', check: s => s.vlans[10] && s.vlans[20] },
        { t: 'เปิด DHCP snooping ทั้งเครื่อง', hint: 'ip dhcp snooping', check: s => s.dhcpSnoop.enabled },
        { t: 'เปิด DHCP snooping เฉพาะ VLAN <code>10,20</code>', hint: 'ip dhcp snooping vlan 10,20', check: s => /10/.test(s.dhcpSnoop.vlans) && /20/.test(s.dhcpSnoop.vlans) },
        { t: 'ปิดการแทรก option 82 (จำเป็นเมื่อ DHCP อยู่ข้าม L3)', hint: 'no ip dhcp snooping information option', check: s => s.dhcpSnoop.optionInsert === false },
        { t: 'ตั้ง Gi0/1 (uplink ไป DHCP server จริง) เป็น trusted', hint: 'interface gi0/1 → ip dhcp snooping trust', check: s => s.ifaces[G(1)].snoopTrust === true },
        {
          t: 'จำกัด rate ของ DHCP ที่พอร์ตผู้ใช้ Fa0/1-16 เป็น 10 pps', hint: 'exit → interface range fa0/1 - 16 → ip dhcp snooping limit rate 10',
          check: s => ran(1, 16).every(i => s.ifaces[F(i)].snoopRate === 10)
        },
        { t: 'เปิด ARP inspection บน VLAN <code>10,20</code>', hint: 'exit → ip arp inspection vlan 10,20', check: s => /10/.test(s.arpInspect.vlans) && /20/.test(s.arpInspect.vlans) },
        { t: 'ตั้ง Gi0/1 เป็น trusted สำหรับ ARP inspection ด้วย', hint: 'interface gi0/1 → ip arp inspection trust', check: s => s.ifaces[G(1)].arpTrust === true },
        { t: 'ตรวจผลด้วย show ip dhcp snooping', hint: 'do show ip dhcp snooping', check: (s, h) => said(h, /sh(ow)?\s+ip\s+dhcp\s+sn/i) },
      ],
    },
    {
      id: 'c4-span',
      title: 'Lab 4C — SPAN จับ Traffic และส่ง DHCP ข้าม VLAN',
      brief: 'ทีม security ขอ mirror traffic ของเซิร์ฟเวอร์ตัวหนึ่งไปเข้า IDS และวง VLAN ใหม่ต้องรับ IP จาก DHCP server ที่อยู่คนละ subnet',
      device: 'cisco',
      tasks: [
        { t: 'เข้า global config mode', hint: 'enable → configure terminal', check: s => s.mode.startsWith('config') || s.mode === 'priv' },
        { t: 'เปิด routing บนสวิตช์', hint: 'ip routing', check: s => s.ipRouting },
        { t: 'สร้าง VLAN 30 ชื่อ <code>STAFF</code>', hint: 'vlan 30 → name STAFF', check: s => s.vlans[30] && /STAFF/i.test(s.vlans[30].name) },
        {
          t: 'ตั้ง SVI VLAN 30 = <code>192.168.30.1/24</code> และเปิดใช้งาน', hint: 'exit → interface vlan 30 → ip address 192.168.30.1 255.255.255.0 → no shutdown',
          check: s => s.svis[30] && s.svis[30].ip === '192.168.30.1' && !s.svis[30].shutdown
        },
        {
          t: 'ตั้ง <code>ip helper-address 10.10.10.5</code> ที่ SVI VLAN 30 เพื่อส่ง DHCP ข้าม subnet', hint: 'ip helper-address 10.10.10.5',
          check: s => s.svis[30] && s.svis[30].helpers.includes('10.10.10.5')
        },
        { t: 'สร้าง SPAN session 1 โดย source คือ Fa0/5 (both)', hint: 'exit → monitor session 1 source interface fa0/5 both', check: s => s.spanSessions[1] && s.spanSessions[1].src.includes('Fa0/5') },
        { t: 'ตั้ง destination ของ session 1 เป็น Fa0/24 (พอร์ตที่ต่อ IDS)', hint: 'monitor session 1 destination interface fa0/24', check: s => s.spanSessions[1] && s.spanSessions[1].dst.includes('Fa0/24') },
        { t: 'ตรวจสอบ SPAN session', hint: 'do show monitor', check: (s, h) => said(h, /sh(ow)?\s+monitor/i) },
        { t: 'บันทึก config', hint: 'end → write memory', check: s => !!s.savedConfig },
      ],
    },
  ],

  // ================= LEVEL 5 =================
  5: [
    {
      id: 'c5-hsrp',
      title: 'Lab 5B — HSRP บน Distribution Switch',
      brief: 'องค์กรเพิ่ม distribution switch ตัวที่สองเพื่อทำ redundancy คุณดูแลตัวที่ 1 ซึ่งต้องเป็น active ทั้ง HSRP และ STP root และต้องสละบทบาทเมื่อ uplink ไป core ล่ม',
      device: 'cisco',
      tasks: [
        { t: 'เข้า global config mode', hint: 'enable → configure terminal', check: s => s.mode.startsWith('config') || s.mode === 'priv' },
        { t: 'เปิด routing และตั้งโหมด spanning tree เป็น rapid-pvst', hint: 'ip routing → spanning-tree mode rapid-pvst', check: s => s.ipRouting && s.stpMode === 'rapid-pvst' },
        { t: 'สร้าง VLAN 10 และ 20', hint: 'vlan 10 → exit → vlan 20 → exit', check: s => s.vlans[10] && s.vlans[20] },
        { t: 'บังคับให้เป็น STP root ของ VLAN 10,20 ด้วย priority <code>4096</code>', hint: 'spanning-tree vlan 10,20 priority 4096', check: s => s.stpPriority[10] === 4096 && s.stpPriority[20] === 4096 },
        {
          t: 'ตั้ง SVI VLAN 10 = <code>192.168.10.2/24</code> และเปิดใช้งาน', hint: 'interface vlan 10 → ip address 192.168.10.2 255.255.255.0 → no shutdown',
          check: s => s.svis[10] && s.svis[10].ip === '192.168.10.2' && !s.svis[10].shutdown
        },
        { t: 'ใช้ HSRP version 2 ที่ SVI VLAN 10', hint: 'standby version 2', check: s => s.svis[10] && s.svis[10].standbyVersion === 2 },
        { t: 'ตั้ง virtual IP ของ group 10 เป็น <code>192.168.10.1</code>', hint: 'standby 10 ip 192.168.10.1', check: s => s.svis[10] && s.svis[10].standby[10] && s.svis[10].standby[10].ip === '192.168.10.1' },
        { t: 'ตั้ง priority ของ group 10 เป็น <code>110</code>', hint: 'standby 10 priority 110', check: s => s.svis[10] && s.svis[10].standby?.[10]?.priority === 110 },
        { t: 'เปิด <code>preempt</code> เพื่อให้ยึด active คืนเมื่อกลับมา', hint: 'standby 10 preempt', check: s => s.svis[10] && s.svis[10].standby?.[10]?.preempt === true },
        { t: 'ผูก HSRP กับสถานะ uplink: track Gi0/2 decrement 20', hint: 'standby 10 track gi0/2 decrement 20', check: s => s.svis[10] && /gi0\/2/i.test(s.svis[10].standby?.[10]?.track || '') },
        { t: 'ตรวจสอบด้วย show standby brief', hint: 'do show standby brief', check: (s, h) => said(h, /sh(ow)?\s+standby/i) },
      ],
    },
    {
      id: 'c5-monitor',
      title: 'Lab 5C — Monitoring, NTP และ 802.1X',
      brief: 'ก่อนสวิตช์ขึ้น production ต้องต่อเข้าระบบ monitoring ขององค์กร ตั้งเวลาให้ตรงเพื่อให้ log อ่านได้ และเปิด 802.1X ที่พอร์ตผู้ใช้',
      device: 'cisco',
      tasks: [
        { t: 'เข้า global config mode', hint: 'enable → configure terminal', check: s => s.mode.startsWith('config') || s.mode === 'priv' },
        { t: 'ส่ง syslog ไปที่ <code>10.10.10.60</code>', hint: 'logging host 10.10.10.60', check: s => s.loggingHosts.includes('10.10.10.60') },
        { t: 'ตั้ง SNMP community <code>N0cM0nitor</code> แบบอ่านอย่างเดียว (RO)', hint: 'snmp-server community N0cM0nitor RO', check: s => s.snmp.some(x => x.name === 'N0cM0nitor' && x.mode === 'RO') },
        { t: 'ตั้ง NTP server เป็น <code>203.159.72.1</code>', hint: 'ntp server 203.159.72.1', check: s => s.ntpServers.includes('203.159.72.1') },
        { t: 'ตั้งโดเมนเป็น <code>corp.local</code> และสร้าง RSA key สำหรับ SSH', hint: 'ip domain-name corp.local → crypto key generate rsa', check: s => s.domainName === 'corp.local' && s.rsaKey },
        { t: 'บังคับ SSH version 2', hint: 'ip ssh version 2', check: s => String(s.sshVersion) === '2' },
        { t: 'เปิด <code>aaa new-model</code>', hint: 'aaa new-model', check: s => s.aaa === true },
        { t: 'เปิด <code>dot1x system-auth-control</code>', hint: 'dot1x system-auth-control', check: s => s.dot1x === true },
        {
          t: 'เปิด 802.1X ที่พอร์ตผู้ใช้ Fa0/1-16', hint: 'interface range fa0/1 - 16 → switchport mode access → dot1x pae authenticator',
          check: s => ran(1, 16).every(i => s.ifaces[F(i)].dot1x)
        },
        {
          t: 'ตั้ง storm-control broadcast level 1.00 ที่พอร์ตผู้ใช้', hint: 'storm-control broadcast level 1.00',
          check: s => ran(1, 16).every(i => s.ifaces[F(i)].stormControl && s.ifaces[F(i)].stormControl.broadcast)
        },
        {
          t: 'ตั้ง <code>spanning-tree guard root</code> ที่ Gi0/1 (พอร์ตที่หันลง access)', hint: 'exit → interface gi0/1 → spanning-tree guard root',
          check: s => s.ifaces[G(1)].guard === 'root'
        },
        { t: 'บันทึก config', hint: 'end → write memory', check: s => !!s.savedConfig },
      ],
    },
  ],
};

// ============================================================
//  จัดระดับใหม่ให้ตรงกับ 6 domain ของ CCNA 200-301
//  (เนื้อหา lab ไม่เปลี่ยน คง id เดิมไว้ทั้งหมดเพื่อไม่ให้ความคืบหน้าของผู้เรียนหาย)
// ============================================================
const DOMAIN_OF = {
  'c1-health': 1,      // อ่านสถานะเครื่องด้วยคำสั่ง show — Network Fundamentals
  'c1-ports': 2,       // จัดการพอร์ต access — Network Access
  'c2-cctv': 2,
  'c2-trunkfix': 2,
  'c3-po-trunk': 2,    // EtherChannel + trunk — Network Access
  'c3-psec': 5,        // Port Security — Security Fundamentals
  'c4-snoop': 5,       // DHCP Snooping + DAI — Security Fundamentals
  'c4-span': 4,        // SPAN + DHCP relay — IP Services
  'c5-hsrp': 4,        // FHRP — IP Services
  'c5-monitor': 4,     // NTP / SNMP / Syslog — IP Services
};

const byDomain = {};
Object.values(BY_OLD_LEVEL).flat().forEach((lab) => {
  const lv = DOMAIN_OF[lab.id] || 1;
  (byDomain[lv] ||= []).push(lab);
});

export default byDomain;
