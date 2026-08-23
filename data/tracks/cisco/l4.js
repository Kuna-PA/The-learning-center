// ============================================================
//  CCNA Domain 4 — IP Services
//  DHCP · NAT · NTP · DNS · SNMP/Syslog · FHRP
// ============================================================
const said = (h, re) => h.some(c => re.test(String(c).trim()));

export default {
  title: 'IP Services — DHCP, NAT, DNS และการเฝ้าระวัง',
  objectives: [
    'ตั้ง DHCP server บนอุปกรณ์ Cisco และเข้าใจ DORA',
    'อธิบายและตั้งค่า NAT/PAT ให้วงภายในออกอินเทอร์เน็ตได้',
    'ตั้ง NTP, DNS, SNMP และ Syslog ให้ระบบตรวจสอบย้อนหลังได้',
    'อธิบายหน้าที่ของ FHRP (HSRP/VRRP/GLBP) และตั้ง HSRP ได้',
  ],
  sections: [
    {
      t: 'DHCP — แจก IP อัตโนมัติ',
      h: `
<p>เครื่องใหม่ที่ยังไม่มี IP จะคุยกับ DHCP server ด้วย 4 ขั้นตอนที่เรียกว่า <b>DORA</b></p>
<table class="tbl">
<tr><th>ขั้น</th><th>ใคร → ใคร</th><th>เกิดอะไร</th></tr>
<tr><td><b>D</b>iscover</td><td>Client → broadcast</td><td>"มี DHCP server อยู่ไหม"</td></tr>
<tr><td><b>O</b>ffer</td><td>Server → Client</td><td>"เอา 192.168.10.50 ไหม"</td></tr>
<tr><td><b>R</b>equest</td><td>Client → broadcast</td><td>"ขอตัวนั้นครับ" (บอกให้ server อื่นรู้ว่าไม่เอา)</td></tr>
<tr><td><b>A</b>ck</td><td>Server → Client</td><td>"จองให้แล้ว พร้อม gateway/DNS/lease"</td></tr>
</table>
<pre><code>ip dhcp excluded-address 192.168.10.1 192.168.10.20    ! กันช่วงของเซิร์ฟเวอร์ไว้ก่อนเสมอ
ip dhcp pool OFFICE
 network 192.168.10.0 255.255.255.0
 default-router 192.168.10.1
 dns-server 192.168.10.5 8.8.8.8
 domain-name corp.local
 lease 7</code></pre>
<p><b>DHCP Relay</b> — Discover เป็น broadcast จึงข้าม router ไม่ได้
ถ้า server อยู่คนละวง ต้องสั่งที่ SVI ของวงผู้ใช้ว่า <code>ip helper-address &lt;ip ของ server&gt;</code>
เพื่อให้ router แปลง broadcast เป็น unicast ส่งข้ามไปให้</p>
<div class="note warn"><b>ลืม excluded-address = ปัญหาที่หาสาเหตุยากมาก</b> —
DHCP จะแจก .1 ให้เครื่องผู้ใช้ ชนกับ gateway แล้วทั้งวงล่มเป็นช่วง ๆ</div>`,
    },
    {
      t: 'NAT และ PAT — เอา IP ภายในออกสู่โลกภายนอก',
      h: `
<p>วง private (10.x / 172.16–31.x / 192.168.x) ออกอินเทอร์เน็ตตรง ๆ ไม่ได้ ต้องแปลงเป็น public IP ก่อน</p>
<table class="tbl">
<tr><th>แบบ</th><th>ทำอะไร</th><th>ใช้ตอนไหน</th></tr>
<tr><td>Static NAT</td><td>1 ภายใน ↔ 1 ภายนอก ตายตัว</td><td>เซิร์ฟเวอร์ที่ต้องให้คนนอกเข้าถึง</td></tr>
<tr><td>Dynamic NAT</td><td>จับคู่จาก pool ตามคิว</td><td>มี public หลายเลขแต่ไม่พอทุกเครื่อง</td></tr>
<tr><td><b>PAT (overload)</b></td><td>หลายร้อยเครื่องใช้ public เลขเดียว แยกด้วย port</td><td><b>ที่ใช้จริงเกือบ 100% ขององค์กร</b></td></tr>
</table>
<pre><code>! ระบุว่าฝั่งไหนคือ inside / outside
interface Vlan10
 ip nat inside
interface GigabitEthernet0/1
 ip nat outside

! PAT — ทุกเครื่องในวงออกผ่าน IP ของพอร์ต outside
access-list 1 permit 192.168.10.0 0.0.0.255
ip nat inside source list 1 interface GigabitEthernet0/1 overload

! Static NAT — เปิดเว็บเซิร์ฟเวอร์ให้คนนอกเข้า
ip nat inside source static 192.168.10.80 203.0.113.80</code></pre>
<p>ตรวจผลด้วย <code>show ip nat translations</code> และ <code>show ip nat statistics</code></p>
<div class="note"><b>คำว่า inside/outside สลับกันคือพังทันที</b> — จำง่าย ๆ ว่า inside คือฝั่งที่ IP เป็น private
ถ้าลืมสั่ง <code>ip nat inside</code> ที่ SVI ผู้ใช้ NAT จะไม่ทำงานเลยทั้งที่ config อื่นถูกหมด</div>`,
    },
    {
      t: 'NTP, DNS, Syslog, SNMP และ FHRP',
      h: `
<p><b>NTP — เวลาที่ตรงกันคือรากฐานของการสืบสวน</b> ถ้านาฬิกาแต่ละเครื่องเพี้ยน log จะเรียงลำดับเหตุการณ์ไม่ได้เลย
และใบรับรอง TLS กับ Kerberos จะพังตามไปด้วย</p>
<pre><code>ntp server 203.0.113.10
clock timezone ICT 7
show ntp status</code></pre>
<p><b>DNS</b> — ให้อุปกรณ์แปลงชื่อเป็น IP ได้</p>
<pre><code>ip name-server 192.168.10.5 8.8.8.8
ip domain-name corp.local
no ip domain-lookup      ! บนอุปกรณ์แล็บ ปิดไว้จะดีกว่า เวลาพิมพ์ผิดจะได้ไม่ค้างรอ DNS</code></pre>
<p><b>Syslog + SNMP — รู้ก่อนที่ผู้ใช้จะโทรมา</b></p>
<pre><code>logging host 192.168.10.50        ! ส่ง log ออกไปเก็บนอกเครื่อง
logging trap informational
snmp-server community RO-ONLY ro  ! อ่านอย่างเดียว ห้ามใช้ชื่อ public
snmp-server host 192.168.10.50 version 2c RO-ONLY</code></pre>
<table class="tbl">
<tr><th>Severity</th><th>ระดับ</th><th>ความหมาย</th></tr>
<tr><td>0–2</td><td>Emergency / Alert / Critical</td><td>ต้องลุกมาแก้กลางดึก</td></tr>
<tr><td>3–4</td><td>Error / Warning</td><td>พอร์ต down, ตั้งค่าผิด</td></tr>
<tr><td>5–7</td><td>Notice / Informational / Debug</td><td>เหตุการณ์ทั่วไป, debug (อย่าเปิดค้างบน production)</td></tr>
</table>
<p><b>FHRP — ไม่ให้ gateway เป็นจุดตายเดี่ยว</b> router สองตัวใช้ IP เสมือนร่วมกัน
เครื่องผู้ใช้ชี้ gateway ไปที่ IP เสมือนนั้น ตัวไหนล่มอีกตัวรับช่วงทันทีโดยผู้ใช้ไม่รู้ตัว</p>
<table class="tbl">
<tr><th>โปรโตคอล</th><th>ของใคร</th><th>จุดเด่น</th></tr>
<tr><td>HSRP</td><td>Cisco</td><td>Active/Standby หนึ่งตัวทำงาน</td></tr>
<tr><td>VRRP</td><td>มาตรฐานเปิด</td><td>ใช้ข้ามยี่ห้อได้</td></tr>
<tr><td>GLBP</td><td>Cisco</td><td>แบ่งโหลดหลายตัวพร้อมกัน</td></tr>
</table>
<pre><code>interface Vlan10
 standby 10 ip 192.168.10.254      ! IP เสมือนที่ผู้ใช้ตั้งเป็น gateway
 standby 10 priority 110           ! เลขสูงกว่าได้เป็น Active
 standby 10 preempt                ! กลับมาแล้วขอเป็น Active คืน</code></pre>`,
    },
  ],
  quiz: [
    { type: 'mcq', q: 'ลำดับของ DHCP ที่ถูกต้องคือข้อใด?', opts: ['Request → Offer → Discover → Ack', 'Discover → Offer → Request → Ack', 'Offer → Discover → Ack → Request', 'Discover → Request → Offer → Ack'], a: 1, why: 'DORA — Discover, Offer, Request, Ack โดย Discover และ Request เป็น broadcast' },
    { type: 'mcq', q: 'DHCP server อยู่คนละวงกับผู้ใช้ ต้องตั้งอะไรที่ SVI ของวงผู้ใช้?', opts: ['ip dhcp pool', 'ip helper-address', 'ip nat inside', 'passive-interface'], a: 1, why: 'ip helper-address แปลง DHCP broadcast เป็น unicast ส่งข้าม router ไปหา server' },
    { type: 'mcq', q: 'องค์กรมี public IP เลขเดียวแต่มีเครื่อง 200 เครื่องต้องออกเน็ต ควรใช้อะไร?', opts: ['Static NAT', 'Dynamic NAT', 'PAT (NAT overload)', 'ไม่ต้องใช้ NAT'], a: 2, why: 'PAT ใช้ public เลขเดียวแล้วแยกแต่ละ session ด้วยหมายเลขพอร์ต จึงรองรับหลายร้อยเครื่องได้' },
    { type: 'mcq', q: 'ทำไม NTP ถึงสำคัญกับงานความปลอดภัย?', opts: ['ทำให้เครือข่ายเร็วขึ้น', 'ทำให้ log ของทุกเครื่องเรียงลำดับเหตุการณ์ตรงกันได้', 'ช่วยประหยัด IP', 'บังคับให้ผู้ใช้เปลี่ยนรหัสผ่าน'], a: 1, why: 'ถ้าเวลาไม่ตรงกัน การไล่ลำดับเหตุการณ์ข้ามเครื่องทำไม่ได้เลย และ Kerberos/TLS ก็ต้องใช้เวลาที่ตรงกัน' },
    { type: 'mcq', q: 'FHRP อย่าง HSRP แก้ปัญหาอะไร?', opts: ['IP ไม่พอใช้', 'Default gateway เป็นจุดตายเดี่ยว', 'Broadcast storm', 'รหัสผ่านอ่อนแอ'], a: 1, why: 'HSRP ให้ router สองตัวใช้ IP เสมือนร่วมกัน ตัวหลักล่มตัวสำรองรับช่วงต่อทันที ผู้ใช้ไม่ต้องเปลี่ยน gateway' },
    { type: 'multi', q: 'ข้อใดควรทำเมื่อตั้ง SNMP บน production (เลือกทุกข้อที่ถูก)', opts: ['ใช้ community string ว่า public', 'ตั้ง community เป็นแบบอ่านอย่างเดียว (ro)', 'ส่ง trap ไปที่เครื่อง monitoring', 'เปิด debug ค้างไว้ตลอด'], a: [1, 2], why: 'community ชื่อ public คือค่าเริ่มต้นที่ทุกคนเดาได้ และ debug ที่เปิดค้างจะกิน CPU จนอุปกรณ์รวน' },
    { type: 'cmd', q: 'พิมพ์คำสั่งกันไม่ให้ DHCP แจกช่วง 192.168.10.1 ถึง 192.168.10.20', ans: ['ip dhcp excluded-address 192.168.10.1 192.168.10.20'], why: 'สั่งใน global config ก่อนสร้าง pool — กันเลขของ gateway และเซิร์ฟเวอร์ไม่ให้ถูกแจกซ้ำ' },
  ],
  labs: [
    {
      id: 'c4-dhcp',
      title: 'Lab 4A — ตั้ง DHCP Server ให้ออฟฟิศทั้งชั้น',
      brief: 'ออฟฟิศชั้น 3 ย้ายเข้าใหม่ 60 เครื่อง จะเดินตั้ง IP ทีละเครื่องไม่ไหว — ตั้ง DHCP บนสวิตช์ L3 พร้อมกันเลขของเซิร์ฟเวอร์ไว้ให้เรียบร้อย',
      device: 'cisco',
      init: {
        apply: st => {
          st.hostname = 'SW-L3-F3';
          st.ipRouting = true;
          st.vlans[10] = { id: 10, name: 'OFFICE' };
          st.svis[10] = { ip: '192.168.10.1', mask: '255.255.255.0', shutdown: false, desc: '', helpers: [] };
        },
      },
      tasks: [
        { t: 'เข้า global config mode', hint: 'enable → configure terminal', check: s => s.mode.startsWith('config') || s.mode === 'priv' },
        {
          t: 'กันช่วง <code>192.168.10.1</code> ถึง <code>192.168.10.20</code> ไม่ให้ถูกแจก',
          hint: 'ip dhcp excluded-address 192.168.10.1 192.168.10.20',
          check: s => (s.dhcpExcluded || []).some(e => e.from === '192.168.10.1' && e.to === '192.168.10.20'),
        },
        { t: 'สร้าง DHCP pool ชื่อ <code>OFFICE</code>', hint: 'ip dhcp pool OFFICE', check: s => !!(s.dhcpPools || {}).OFFICE },
        { t: 'กำหนดวงที่จะแจกเป็น <code>192.168.10.0 255.255.255.0</code>', hint: 'network 192.168.10.0 255.255.255.0', check: s => ((s.dhcpPools || {}).OFFICE || {}).network === '192.168.10.0' },
        { t: 'ตั้ง <b>default-router</b> เป็น <code>192.168.10.1</code>', hint: 'default-router 192.168.10.1', check: s => ((s.dhcpPools || {}).OFFICE || {}).router === '192.168.10.1' },
        { t: 'ตั้ง <b>dns-server</b> เป็น <code>192.168.10.5</code>', hint: 'dns-server 192.168.10.5', check: s => /192\.168\.10\.5/.test(((s.dhcpPools || {}).OFFICE || {}).dns || '') },
        { t: 'ตั้ง <b>domain-name</b> เป็น <code>corp.local</code>', hint: 'domain-name corp.local', check: s => ((s.dhcpPools || {}).OFFICE || {}).domain === 'corp.local' },
        { t: 'ตั้งให้อุปกรณ์รู้จัก DNS ด้วย <code>ip name-server 192.168.10.5</code>', hint: 'exit → ip name-server 192.168.10.5', check: s => (s.nameServers || []).includes('192.168.10.5') },
        { t: 'ตรวจผลด้วย <code>show ip dhcp pool</code>', hint: 'do show ip dhcp pool', check: (s, h) => said(h, /^(do\s+)?sh(ow)?\s+ip\s+dh/i) },
        { t: 'บันทึก config', hint: 'end → write memory', check: s => !!s.savedConfig },
      ],
      debrief: `<b>excluded-address ต้องสั่งก่อนเสมอ</b> และต้องกันให้ครอบคลุมทั้ง gateway, เซิร์ฟเวอร์, ปริ้นเตอร์ และอุปกรณ์เครือข่าย<br>
        <b>default-router ผิด = ผู้ใช้ได้ IP แต่ออกเน็ตไม่ได้</b> ซึ่งดูเผิน ๆ เหมือนเน็ตล่ม ทั้งที่ DHCP ทำงานปกติ<br>
        <b>lease สั้นเกินไปทำให้ server ทำงานหนัก</b> ยาวเกินไปทำให้ IP ค้างกับเครื่องที่เลิกใช้แล้ว — ออฟฟิศทั่วไป 7 วันกำลังดี วง guest ควรสั้นกว่านั้นมาก`,
    },
    {
      id: 'c4-nat',
      title: 'Lab 4B — ต่อ NAT ให้ทั้งออฟฟิศออกอินเทอร์เน็ตได้',
      brief: 'ISP ให้ public IP มาเลขเดียว แต่ต้องให้ทั้งออฟฟิศออกเน็ตได้ และเปิดเว็บเซิร์ฟเวอร์ภายในให้ลูกค้าเข้าถึงจากข้างนอกด้วย',
      device: 'cisco',
      init: {
        apply: st => {
          st.hostname = 'SW-EDGE';
          st.ipRouting = true;
          st.vlans[10] = { id: 10, name: 'OFFICE' };
          st.svis[10] = { ip: '192.168.10.1', mask: '255.255.255.0', shutdown: false, desc: '', helpers: [] };
        },
      },
      tasks: [
        { t: 'เข้า global config mode', hint: 'enable → configure terminal', check: s => s.mode.startsWith('config') || s.mode === 'priv' },
        {
          t: 'สร้าง <code>access-list 1</code> ให้ครอบคลุมวงภายใน <code>192.168.10.0/24</code>',
          hint: 'access-list 1 permit 192.168.10.0 0.0.0.255',
          check: s => ((s.acls || {})['1'] || { rules: [] }).rules.some(r => r.action === 'permit' && r.src && r.src.addr === '192.168.10.0'),
        },
        { t: 'ตั้ง <code>Vlan10</code> เป็นฝั่ง <b>inside</b>', hint: 'interface vlan 10 → ip nat inside', check: s => (s.natInside || []).length > 0 },
        { t: 'ตั้ง <code>GigabitEthernet0/1</code> เป็นฝั่ง <b>outside</b>', hint: 'interface gi0/1 → ip nat outside', check: s => (s.natOutside || []).some(x => /Gi0\/1/i.test(x)) },
        {
          t: 'เปิด <b>PAT</b> ให้ทั้งวงออกผ่านพอร์ต outside',
          hint: 'exit → ip nat inside source list 1 interface GigabitEthernet0/1 overload',
          check: s => (s.natRules || []).some(r => r.kind === 'overload' && r.list === '1'),
        },
        {
          t: 'เปิดเว็บเซิร์ฟเวอร์ภายใน <code>192.168.10.80</code> ออกสู่ public <code>203.0.113.80</code> ด้วย <b>static NAT</b>',
          hint: 'ip nat inside source static 192.168.10.80 203.0.113.80',
          check: s => (s.natRules || []).some(r => r.kind === 'static' && r.local === '192.168.10.80' && r.global === '203.0.113.80'),
        },
        { t: 'เพิ่ม default route ออกอินเทอร์เน็ตที่ <code>203.0.113.1</code>', hint: 'ip route 0.0.0.0 0.0.0.0 203.0.113.1', check: s => s.routes.some(r => r.net === '0.0.0.0' && r.nh === '203.0.113.1') },
        { t: 'ตรวจผลด้วย <code>show ip nat statistics</code>', hint: 'do show ip nat statistics', check: (s, h) => said(h, /^(do\s+)?sh(ow)?\s+ip\s+nat\s+stat/i) },
        { t: 'ดูตารางแปลงที่อยู่ด้วย <code>show ip nat translations</code>', hint: 'do show ip nat translations', check: (s, h) => said(h, /^(do\s+)?sh(ow)?\s+ip\s+nat\s+tr/i) },
        { t: 'บันทึก config', hint: 'end → write memory', check: s => !!s.savedConfig },
      ],
      debrief: `<b>NAT ต้องมีครบสามอย่าง</b> — ระบุ inside, ระบุ outside และกฎการแปลง ขาดข้อใดข้อหนึ่งก็ไม่ทำงาน และ IOS จะไม่เตือนอะไรเลย<br>
        <b>ACL ใน NAT ไม่ได้แปลว่าบล็อก</b> — มันคือรายการ "ใครได้รับสิทธิ์ถูกแปลง" คนละความหมายกับ ACL ที่ใช้กรอง traffic<br>
        <b>Static NAT เปิดประตูเข้าจากอินเทอร์เน็ต</b> ต้องคู่กับ ACL ขาเข้าเสมอ ไม่งั้นเท่ากับเปิดเซิร์ฟเวอร์ให้ทั้งโลกสแกน`,
    },
  ],
};
