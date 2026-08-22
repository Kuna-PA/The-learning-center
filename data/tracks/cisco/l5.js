// ============================================================
//  CCNA Domain 5 — Security Fundamentals (ส่วนที่เพิ่มจากของเดิม)
//  ACL · CIA · ภัยคุกคาม · VPN/Firewall เบื้องต้น
//  หมายเหตุ: หัวข้อ password/SSH/AAA/port-security ใช้ของเดิมจาก legacy.js
// ============================================================
const said = (h, re) => h.some(c => re.test(String(c).trim()));

export default {
  title: 'Security Fundamentals — ปกป้องเครือข่ายจากผู้ไม่หวังดี',
  objectives: [
    'อธิบายหลัก CIA และยกตัวอย่างภัยที่กระทบแต่ละด้านได้',
    'แยกแยะภัยคุกคามที่พบบ่อย เช่น phishing, malware, MITM',
    'เขียนและใช้งาน ACL ทั้งแบบ standard และ extended ได้',
    'อธิบายบทบาทของ firewall และ VPN ในภาพรวมความปลอดภัย',
  ],
  sections: [
    {
      t: 'หลัก CIA และภัยคุกคามที่เจอจริง',
      h: `
<p>ทุกมาตรการความปลอดภัยที่เราตั้ง สุดท้ายไปตกที่สามเสาหลักนี้เสมอ</p>
<table class="tbl">
<tr><th>เสา</th><th>หมายถึง</th><th>ตัวอย่างที่ทำให้เสีย</th><th>มาตรการ</th></tr>
<tr><td><b>C</b>onfidentiality</td><td>คนที่ไม่มีสิทธิ์ต้องไม่เห็นข้อมูล</td><td>ดักจับรหัสผ่าน Telnet ที่ส่งเป็น plain text</td><td>เข้ารหัส (SSH, TLS, VPN), ACL</td></tr>
<tr><td><b>I</b>ntegrity</td><td>ข้อมูลต้องไม่ถูกแก้ระหว่างทาง</td><td>MITM แก้ปลายทางการโอนเงิน</td><td>hash, ลายเซ็นดิจิทัล, DAI</td></tr>
<tr><td><b>A</b>vailability</td><td>ระบบต้องใช้ได้เมื่อต้องการ</td><td>DoS, สายขาด, สวิตช์ core ล่ม</td><td>redundancy, FHRP, สำรองข้อมูล</td></tr>
</table>
<table class="tbl">
<tr><th>ภัยคุกคาม</th><th>ทำงานยังไง</th><th>สัญญาณเตือน</th></tr>
<tr><td><b>Phishing</b></td><td>หลอกให้กรอกรหัสผ่านในหน้าเว็บปลอม</td><td>อีเมลเร่งรัด ลิงก์ที่โดเมนเพี้ยนไปตัวเดียว</td></tr>
<tr><td><b>Malware / Ransomware</b></td><td>โปรแกรมมุ่งร้าย เข้ารหัสไฟล์เรียกค่าไถ่</td><td>ไฟล์นามสกุลแปลก ๆ โผล่ทั้งไดรฟ์</td></tr>
<tr><td><b>MITM</b></td><td>แทรกกลางการสื่อสาร มักผ่าน ARP spoofing</td><td>MAC ของ gateway เปลี่ยนไป — กันด้วย DAI</td></tr>
<tr><td><b>Rogue DHCP</b></td><td>แจก gateway ปลอมให้เหยื่อ</td><td>ผู้ใช้ได้ gateway แปลก — กันด้วย DHCP snooping</td></tr>
<tr><td><b>MAC flooding</b></td><td>ยัด MAC ปลอมจน table เต็ม สวิตช์กลายเป็น hub</td><td>traffic ถูก flood ทุกพอร์ต — กันด้วย port security</td></tr>
<tr><td><b>Brute force</b></td><td>เดารหัสผ่านซ้ำ ๆ</td><td>ล็อกอินล้มเหลวรัว ๆ ใน log</td></tr>
</table>
<div class="note"><b>Defence in depth</b> — อย่าพึ่งชั้นเดียว ป้อมที่ดีมีทั้งกำแพง คูน้ำ และยาม
บนสวิตช์ก็คือ port security + DHCP snooping + DAI + ACL + รหัสผ่านที่แข็งแรง ทำงานร่วมกัน</div>`,
    },
    {
      t: 'ACL — กรองว่าใครผ่านได้ ใครผ่านไม่ได้',
      h: `
<p>ACL คือรายการกฎที่อุปกรณ์ไล่อ่าน <b>จากบนลงล่าง</b> เจอข้อที่ตรงเมื่อไหร่หยุดทันที
และท้ายรายการมี <b>deny any ที่มองไม่เห็น</b> อยู่เสมอ</p>
<table class="tbl">
<tr><th></th><th>Standard ACL</th><th>Extended ACL</th></tr>
<tr><td>เลขที่ใช้</td><td>1–99</td><td>100–199</td></tr>
<tr><td>กรองจาก</td><td>ต้นทางอย่างเดียว</td><td>ต้นทาง + ปลายทาง + โปรโตคอล + พอร์ต</td></tr>
<tr><td>ควรวางที่</td><td>ใกล้<b>ปลายทาง</b></td><td>ใกล้<b>ต้นทาง</b></td></tr>
</table>
<pre><code>! Standard — ให้เฉพาะวง IT เข้ามาจัดการอุปกรณ์
ip access-list standard MGMT-ONLY
 permit 192.168.20.0 0.0.0.255
 deny   any

! Extended — ให้เข้าเว็บเซิร์ฟเวอร์ได้เฉพาะพอร์ต 80
access-list 110 permit tcp any host 192.168.10.80 eq 80
access-list 110 deny   ip  any any

! นำไปใช้ที่ interface
interface Vlan10
 ip access-group MGMT-ONLY in</code></pre>
<p><b>ทิศทาง in / out มองจากมุมของอุปกรณ์</b> — <code>in</code> คือ traffic ที่วิ่งเข้ามาหา interface นั้น
ส่วน <code>out</code> คือที่กำลังจะออกไปจาก interface นั้น</p>
<p>ตรวจผลด้วย <code>show access-lists</code> — จะเห็นทุกกฎพร้อมลำดับ</p>
<div class="note warn"><b>สองกับดักที่ทำให้คนล็อกตัวเองออกจากอุปกรณ์:</b><br>
1. <b>ลำดับผิด</b> — วาง <code>deny</code> กว้าง ๆ ไว้บน <code>permit</code> ที่เจาะจง กฎล่างจะไม่มีวันถูกอ่าน<br>
2. <b>ลืม implicit deny</b> — เขียนแค่ permit วงเดียว แปลว่าที่เหลือทั้งโลกถูกบล็อกหมด รวมถึงตัวเราเองด้วย</div>`,
    },
    {
      t: 'Firewall และ VPN เบื้องต้น',
      h: `
<p><b>ACL กับ Firewall ต่างกันตรงไหน</b> — ACL ดูทีละ packet แบบไม่จำอะไร (stateless)
ส่วน firewall จำสถานะของการเชื่อมต่อได้ (stateful) รู้ว่า packet นี้เป็นการตอบกลับของ session ที่เราเปิดออกไปเอง จึงอนุญาตให้กลับเข้ามาได้อัตโนมัติ</p>
<table class="tbl">
<tr><th>ชนิด</th><th>ดูอะไร</th><th>ตัวอย่าง</th></tr>
<tr><td>Packet filter (ACL)</td><td>IP / port ทีละ packet</td><td>ACL บน router</td></tr>
<tr><td>Stateful firewall</td><td>จำ session ทั้งชุด</td><td>Cisco ASA, Firepower</td></tr>
<tr><td>Next-gen firewall</td><td>รู้จักแอปและผู้ใช้ ตรวจไวรัสได้</td><td>NGFW ที่ใช้ในองค์กร</td></tr>
</table>
<p><b>VPN — สร้างอุโมงค์เข้ารหัสบนเส้นทางที่ไม่ปลอดภัย</b></p>
<table class="tbl">
<tr><th>แบบ</th><th>ใช้ตอนไหน</th></tr>
<tr><td><b>Site-to-site</b> (IPsec)</td><td>เชื่อมสำนักงานสองแห่งผ่านอินเทอร์เน็ตให้เหมือนอยู่วงเดียวกัน</td></tr>
<tr><td><b>Remote access</b> (SSL/AnyConnect)</td><td>พนักงานทำงานจากบ้านเข้ามาใช้ระบบภายใน</td></tr>
</table>
<p>IPsec ให้ครบทั้งสามเสา: เข้ารหัส (C), ตรวจว่าข้อมูลไม่ถูกแก้ (I) และยืนยันตัวตนของปลายทาง</p>
<div class="note"><b>ข้อควรจำสำหรับงานจริง:</b> VPN ปกป้องข้อมูล<b>ระหว่างทาง</b>เท่านั้น —
ถ้าเครื่องพนักงานติดมัลแวร์อยู่แล้ว VPN จะกลายเป็นทางด่วนพามัลแวร์เข้าองค์กรแทน
จึงต้องคู่กับการตรวจสุขภาพเครื่องก่อนอนุญาตให้เชื่อมต่อเสมอ</div>`,
    },
  ],
  quiz: [
    { type: 'mcq', q: 'การดักอ่านรหัสผ่านที่ส่งผ่าน Telnet กระทบหลัก CIA ข้อใดโดยตรงที่สุด?', opts: ['Confidentiality', 'Integrity', 'Availability', 'ไม่กระทบข้อใดเลย'], a: 0, why: 'Telnet ส่งข้อมูลเป็น plain text ใครดักกลางทางก็อ่านได้ = เสียความลับ จึงต้องใช้ SSH แทนเสมอ' },
    { type: 'mcq', q: 'ACL มีกฎ <code>permit 192.168.20.0 0.0.0.255</code> เพียงข้อเดียว แล้ว traffic จากวงอื่นจะเป็นอย่างไร?', opts: ['ผ่านได้ทั้งหมด', 'ถูกบล็อกทั้งหมดเพราะมี implicit deny any ท้ายรายการ', 'ต้องรอ 30 วินาที', 'ACL ใช้ไม่ได้เพราะมีกฎเดียว'], a: 1, why: 'ทุก ACL มี deny any ซ่อนอยู่ท้ายรายการเสมอ — เขียน permit อะไรไว้ ที่เหลือถูกปฏิเสธหมด' },
    { type: 'mcq', q: 'Extended ACL ควรวางใกล้จุดใด และเพราะอะไร?', opts: ['ใกล้ปลายทาง เพื่อความยืดหยุ่น', 'ใกล้ต้นทาง เพื่อตัด traffic ที่ไม่ต้องการตั้งแต่ต้น ไม่เปลืองแบนด์วิดท์', 'ตรงกลางเส้นทาง', 'วางที่ไหนก็ได้ ไม่ต่างกัน'], a: 1, why: 'Extended ระบุได้ละเอียดจึงตัดที่ต้นทางได้อย่างแม่นยำ ส่วน standard ระบุได้แค่ต้นทางจึงต้องวางใกล้ปลายทางไม่ให้บล็อกเกินจำเป็น' },
    { type: 'mcq', q: 'ผู้ใช้ได้ IP และ gateway จากเครื่องแปลกปลอมที่ใครก็ไม่รู้เอามาเสียบ ควรใช้มาตรการใด?', opts: ['Port security', 'DHCP snooping', 'NTP', 'HSRP'], a: 1, why: 'DHCP snooping กำหนดว่าพอร์ตไหนเชื่อถือได้ (มี DHCP จริง) พอร์ตผู้ใช้ที่ส่ง DHCP offer จะถูกตัดทันที' },
    { type: 'mcq', q: 'ข้อใดอธิบายความต่างระหว่าง ACL กับ stateful firewall ได้ถูกต้อง?', opts: ['ACL เร็วกว่าเพราะเข้ารหัสข้อมูล', 'ACL ดูทีละ packet ส่วน firewall จำสถานะของ session ได้', 'firewall ทำงานที่ชั้น 2 เท่านั้น', 'ทั้งสองอย่างเหมือนกันทุกประการ'], a: 1, why: 'stateful firewall จำได้ว่า session ไหนเราเป็นคนเปิดออกไป จึงยอมให้ traffic ตอบกลับเข้ามาโดยไม่ต้องเขียนกฎเพิ่ม' },
    { type: 'multi', q: 'ข้อใดคือมาตรการที่ควรทำบนสวิตช์ production (เลือกทุกข้อที่ถูก)', opts: ['ใช้ SSH แทน Telnet', 'ตั้ง enable secret แทน enable password', 'เปิดพอร์ตที่ไม่ใช้ทิ้งไว้', 'ปิดพอร์ตที่ไม่ได้ใช้และใส่ description ทุกพอร์ต'], a: [0, 1, 3], why: 'พอร์ตว่างที่เปิดทิ้งไว้คือช่องให้ใครก็ได้เดินมาเสียบ — ต้อง shutdown ไว้จนกว่าจะมีคนขอใช้' },
    { type: 'cmd', q: 'พิมพ์คำสั่งดูรายการ ACL ทั้งหมดพร้อมกฎในเครื่อง', ans: ['show access-lists', 'sh access-lists', 'show ip access-lists', 'sh ip access-lists'], why: 'show access-lists แสดงทุก ACL พร้อมลำดับกฎ — ใช้ตรวจว่าลำดับถูกต้องก่อนนำไปใช้จริง' },
  ],
  labs: [
    {
      id: 'c5-acl',
      title: 'Lab 5A — จำกัดสิทธิ์เข้าถึงด้วย ACL',
      brief: 'ฝ่ายความปลอดภัยสั่งว่า อุปกรณ์เครือข่ายต้องให้เฉพาะวง IT เข้ามาจัดการได้ และเว็บเซิร์ฟเวอร์ภายในต้องเปิดเฉพาะพอร์ต 80 กับ 443 เท่านั้น — เขียน ACL ให้ครบทั้งสองข้อ',
      device: 'cisco',
      init: {
        apply: st => {
          st.hostname = 'SW-SEC';
          st.ipRouting = true;
          st.vlans[10] = { id: 10, name: 'USERS' };
          st.vlans[20] = { id: 20, name: 'IT' };
          st.svis[10] = { ip: '192.168.10.1', mask: '255.255.255.0', shutdown: false, desc: '', helpers: [] };
          st.svis[20] = { ip: '192.168.20.1', mask: '255.255.255.0', shutdown: false, desc: '', helpers: [] };
        },
      },
      tasks: [
        { t: 'เข้า global config mode', hint: 'enable → configure terminal', check: s => s.mode.startsWith('config') || s.mode === 'priv' },
        { t: 'สร้าง <b>standard ACL</b> ชื่อ <code>MGMT-ONLY</code>', hint: 'ip access-list standard MGMT-ONLY', check: s => !!(s.acls || {})['MGMT-ONLY'] },
        {
          t: 'อนุญาตเฉพาะวง IT <code>192.168.20.0 0.0.0.255</code>',
          hint: 'permit 192.168.20.0 0.0.0.255',
          check: s => (((s.acls || {})['MGMT-ONLY'] || {}).rules || []).some(r => r.action === 'permit' && r.src && r.src.addr === '192.168.20.0'),
        },
        {
          t: 'ปฏิเสธที่เหลือให้ชัดเจนด้วย <code>deny any</code> (เขียนไว้ให้คนอ่านเข้าใจ แม้จะมี implicit deny อยู่แล้ว)',
          hint: 'deny any',
          check: s => (((s.acls || {})['MGMT-ONLY'] || {}).rules || []).some(r => r.action === 'deny'),
        },
        {
          t: 'สร้าง <b>extended ACL เลข 110</b> ให้เข้าเว็บเซิร์ฟเวอร์ <code>192.168.10.80</code> ได้ที่พอร์ต <code>80</code>',
          hint: 'exit → access-list 110 permit tcp any host 192.168.10.80 eq 80',
          check: s => (((s.acls || {})['110'] || {}).rules || []).some(r => r.action === 'permit' && r.proto === 'tcp' && String(r.port) === '80'),
        },
        {
          t: 'เพิ่มกฎให้เข้าพอร์ต <code>443</code> ได้ด้วย',
          hint: 'access-list 110 permit tcp any host 192.168.10.80 eq 443',
          check: s => (((s.acls || {})['110'] || {}).rules || []).some(r => r.action === 'permit' && String(r.port) === '443'),
        },
        {
          t: 'นำ <code>MGMT-ONLY</code> ไปใช้ที่ <code>Vlan20</code> ทิศทาง <code>in</code>',
          hint: 'interface vlan 20 → ip access-group MGMT-ONLY in',
          check: s => !!(s.svis[20] || {}).aclIn && s.svis[20].aclIn === 'MGMT-ONLY',
        },
        { t: 'ตรวจผลด้วย <code>show access-lists</code>', hint: 'do show access-lists', check: (s, h) => said(h, /^(do\s+)?sh(ow)?\s+(ip\s+)?acc/i) },
        { t: 'ตั้ง <code>enable secret</code> ให้แข็งแรง (ข้อบังคับของ baseline)', hint: 'enable secret Str0ng-P@ss', check: s => !!s.enableSecret },
        { t: 'บันทึก config', hint: 'end → write memory', check: s => !!s.savedConfig },
      ],
      debrief: `<b>ลำดับคือทุกอย่างของ ACL</b> — อ่านจากบนลงล่าง เจอข้อที่ตรงแล้วหยุด
ถ้าเอา <code>deny any</code> ไว้บนสุด กฎที่เหลือจะไม่มีวันทำงาน<br>
        <b>implicit deny มีอยู่เสมอ</b> — ACL ที่มีแต่ permit วงเดียว แปลว่าบล็อกทั้งโลกที่เหลือ
รวมถึงตัวเราที่กำลัง SSH อยู่ ถ้าเผลอใช้กับ interface ที่เราเข้ามา<br>
        <b>เขียน deny ให้เห็นชัด ๆ ดีกว่าปล่อยให้ซ่อน</b> — คนที่มาอ่าน config ต่อจากเราจะเข้าใจเจตนาทันที
และบางรุ่นยังนับ hit ให้ด้วยว่ามีอะไรโดนบล็อกไปบ้าง`,
    },
  ],
};
