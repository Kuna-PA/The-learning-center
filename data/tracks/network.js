// ============================================================
//  Learning Path: Network — CompTIA Network+ (N10-008)
//
//  จัดบทเรียนทั้ง 20 บทลงเป็น 6 ระดับตามลำดับที่ควรเรียน
//    L1 OSI และสายสัญญาณ · L2 สวิตช์และการไล่ปัญหา · L3 IP และ routing
//    L4 โครงสร้าง, transport และ services · L5 ความพร้อมใช้และความปลอดภัย
//    L6 ไร้สาย, WAN, องค์กร, DR และ cloud
//
//  ข้อสอบในไฟล์นี้เขียนขึ้นใหม่ทั้งหมดให้ตรงกับหัวข้อสอบ N10-008
//  ไม่ได้คัดลอกมาจากคลังข้อสอบของเว็บไหน
//
//  หัวข้อนี้ไม่ผูกกับยี่ห้อ Lab จึงยืม emulator ของหัวข้ออื่นมาใช้ตามความเหมาะสม
//    Linux    — IP, subnet, DNS และการไล่ปัญหา
//    Cisco    — สวิตช์, STP, VLAN และ port security
//    MikroTik — monitoring, WAN สำรอง และไร้สาย
// ============================================================
const said = (h, re) => h.some(c => re.test(String(c).trim()));
const T = (s, p) => s.tables[p] || [];                 // MikroTik
const has = (s, p, fn) => T(s, p).some(fn);
const ifc = (s, n) => (s.ifaces || {})[n] || {};       // Cisco / Linux

export default {
  id: 'network',
  name: 'Network',
  icon: '🌐',
  device: 'linux',
  sub: 'CompTIA Network+ N10-008',
  desc: 'พื้นฐานเครือข่ายแบบไม่ผูกกับยี่ห้อ — OSI, สายสัญญาณ, สวิตช์, IP/subnet, routing, VLAN, DNS/DHCP, ไร้สาย, WAN, ความปลอดภัย และการไล่ปัญหาอย่างเป็นระบบ',

  levels: {
    // =========================================================
    1: {
      title: 'OSI Model และสายสัญญาณ',
      objectives: [
        'ใช้ OSI ทั้ง 7 ชั้นเป็นเครื่องมือไล่ปัญหา ไม่ใช่แค่ท่องจำ',
        'อ่านชื่อมาตรฐาน Ethernet แล้วบอกความเร็ว สื่อ และระยะได้',
        'เลือกสายทองแดงและไฟเบอร์ให้เหมาะกับงานและระยะทาง',
        'ติดตั้งและทดสอบสายด้วยเครื่องมือที่ถูกต้อง',
      ],
      sections: [
        {
          t: 'Lesson 1 — OSI Model: เจ็ดชั้นที่เอาไว้ไล่ปัญหา',
          h: `
<p>OSI ไม่ได้มีไว้ท่องสอบอย่างเดียว — ประโยชน์จริงคือมัน<b>บอกว่าควรตรวจอะไรก่อนหลัง</b>
เมื่อมีคนบอกว่า "เน็ตใช้ไม่ได้" คุณจะได้ไม่เดาสุ่ม</p>
<table class="tbl">
<tr><th>ชั้น</th><th>ชื่อ</th><th>หน่วยข้อมูล</th><th>อุปกรณ์ / โปรโตคอล</th><th>ถ้าพังจะมีอาการ</th></tr>
<tr><td><b>7</b></td><td>Application</td><td rowspan="3">Data</td><td>HTTP, DNS, SMTP, FTP</td><td>เข้าเว็บนี้ไม่ได้ แต่เว็บอื่นได้</td></tr>
<tr><td><b>6</b></td><td>Presentation</td><td>TLS, JPEG, ASCII</td><td>ใบรับรองผิดพลาด อ่านไฟล์ไม่ออก</td></tr>
<tr><td><b>5</b></td><td>Session</td><td>NetBIOS, RPC, SIP</td><td>ต่อได้แต่หลุดเป็นระยะ</td></tr>
<tr><td><b>4</b></td><td>Transport</td><td>Segment</td><td>TCP, UDP · firewall กรองพอร์ต</td><td>ping ได้แต่พอร์ตนั้นเข้าไม่ได้</td></tr>
<tr><td><b>3</b></td><td>Network</td><td>Packet</td><td><b>Router</b>, IP, ICMP, IPSec</td><td>ออกนอกวงไม่ได้ · ping ข้ามวงไม่ผ่าน</td></tr>
<tr><td><b>2</b></td><td>Data Link</td><td>Frame</td><td><b>Switch</b>, MAC, VLAN, STP, ARP</td><td>อยู่วงเดียวกันแต่คุยกันไม่ได้</td></tr>
<tr><td><b>1</b></td><td>Physical</td><td>Bit</td><td>สาย, หัวต่อ, hub, transceiver</td><td><b>ไฟที่พอร์ตไม่ติด</b></td></tr>
</table>
<div class="note"><b>วิธีจำที่ใช้ได้จริง</b> — จำจาก<b>ล่างขึ้นบน</b>: <i>Please Do Not Throw Sausage Pizza Away</i>
(Physical, Data Link, Network, Transport, Session, Presentation, Application)<br>
เวลาไล่ปัญหาก็ไล่จากล่างขึ้นบนเหมือนกัน — <b>เช็คสายก่อนเสมอ</b> เพราะปัญหาส่วนใหญ่จบที่ชั้น 1 กับ 2</div>
<p><b>OSI เทียบกับ TCP/IP model</b> — งานจริงใช้ TCP/IP แต่คนคุยกันด้วยเลขชั้นของ OSI</p>
<table class="tbl">
<tr><th>TCP/IP (4 ชั้น)</th><th>ตรงกับ OSI ชั้นไหน</th></tr>
<tr><td>Application</td><td>5, 6, 7</td></tr>
<tr><td>Transport</td><td>4</td></tr>
<tr><td>Internet</td><td>3</td></tr>
<tr><td>Link / Network Access</td><td>1, 2</td></tr>
</table>
<div class="note warn"><b>Encapsulation</b> — ข้อมูลเดินจากชั้น 7 ลงชั้น 1 โดยแต่ละชั้น<b>ห่อหัวข้อมูลของตัวเองเพิ่ม</b>
ฝั่งรับก็แกะกลับขึ้นไปทีละชั้น เข้าใจตรงนี้แล้วจะเข้าใจว่าทำไม MTU ที่เล็กลงกลางทางจึงทำให้แพ็กเก็ตใหญ่หลุดหาย</div>`,
        },
        {
          t: 'Lesson 1 — ตั้งค่าเครือข่าย SOHO',
          h: `
<p>SOHO (Small Office / Home Office) คือเครือข่ายที่เล็กที่สุดที่ยังต้องมีครบทุกส่วน
และเป็นแบบฝึกหัดที่ดีที่สุดเพราะเห็นทุกชิ้นพร้อมกัน</p>
<table class="tbl">
<tr><th>ส่วนประกอบ</th><th>หน้าที่</th></tr>
<tr><td><b>Modem / ONT</b></td><td>แปลงสัญญาณจากผู้ให้บริการให้เป็น Ethernet</td></tr>
<tr><td><b>Router</b></td><td>แยกวงในกับวงนอก ทำ NAT และเป็น default gateway</td></tr>
<tr><td><b>Switch</b></td><td>กระจายพอร์ตให้อุปกรณ์ในวงเดียวกัน</td></tr>
<tr><td><b>Access Point</b></td><td>ต่อขยายเป็นไร้สาย</td></tr>
<tr><td><b>DHCP + DNS</b></td><td>มักรวมอยู่ในตัว router ตัวเดียวกัน</td></tr>
</table>
<p><b>ลำดับการตั้งค่าที่ควรทำ</b></p>
<ol>
  <li><b>เปลี่ยนรหัสผ่านผู้ดูแลจากค่าโรงงานทันที</b> — ข้อแรกเสมอ</li>
  <li>ตั้งค่า WAN ให้ตรงกับที่ผู้ให้บริการกำหนด (DHCP / PPPoE / static)</li>
  <li>กำหนดวง LAN และช่วง DHCP — เว้นเลขล่าง ๆ ไว้ให้อุปกรณ์ที่ต้องใช้ IP คงที่</li>
  <li>ตั้ง SSID และ WPA2/WPA3 — ห้ามเปิดโล่ง ห้ามใช้ WEP</li>
  <li>อัปเดต firmware แล้ว<b>ปิดการจัดการจากฝั่ง WAN</b></li>
  <li>จองเบอร์ (DHCP reservation) ให้เครื่องพิมพ์ กล้อง และ NAS</li>
</ol>
<div class="note"><b>ช่วง IP ส่วนตัวตาม RFC 1918</b> — ใช้ได้เฉพาะภายใน ออกอินเทอร์เน็ตตรง ๆ ไม่ได้ ต้องผ่าน NAT<br>
<code>10.0.0.0/8</code> · <code>172.16.0.0/12</code> · <code>192.168.0.0/16</code><br>
เลี่ยง <code>192.168.0.0/24</code> และ <code>192.168.1.0/24</code> ในงานที่ต้องต่อ VPN
เพราะมันซ้ำกับวงที่บ้านของพนักงานบ่อยมาก แล้ว route จะชนกัน</div>`,
        },
        {
          t: 'Lesson 2 — มาตรฐาน Ethernet',
          h: `
<p>ชื่อมาตรฐานอ่านได้เป็นระบบ: <b>ความเร็ว</b> + <b>BASE</b> (baseband) + <b>ชนิดสื่อ</b></p>
<table class="tbl">
<tr><th>มาตรฐาน</th><th>ความเร็ว</th><th>สื่อ</th><th>ระยะสูงสุด</th></tr>
<tr><td>10BASE-T</td><td>10 Mbps</td><td>Cat3 ขึ้นไป</td><td>100 ม.</td></tr>
<tr><td>100BASE-TX</td><td>100 Mbps</td><td>Cat5 ขึ้นไป</td><td>100 ม.</td></tr>
<tr><td><b>1000BASE-T</b></td><td>1 Gbps</td><td>Cat5e ขึ้นไป (ใช้ครบ 4 คู่)</td><td>100 ม.</td></tr>
<tr><td><b>10GBASE-T</b></td><td>10 Gbps</td><td>Cat6 (55 ม.) · <b>Cat6a</b></td><td>100 ม. เมื่อใช้ Cat6a</td></tr>
<tr><td>1000BASE-SX</td><td>1 Gbps</td><td>ไฟเบอร์ multimode</td><td>~550 ม.</td></tr>
<tr><td>1000BASE-LX</td><td>1 Gbps</td><td>ไฟเบอร์ singlemode</td><td>~5 กม.</td></tr>
<tr><td>10GBASE-LR</td><td>10 Gbps</td><td>ไฟเบอร์ singlemode</td><td>~10 กม.</td></tr>
</table>
<p><b>Duplex และ Autonegotiation</b></p>
<table class="tbl">
<tr><th>โหมด</th><th>ความหมาย</th></tr>
<tr><td><b>Half duplex</b></td><td>ส่งกับรับสลับกัน ทำพร้อมกันไม่ได้ — มี collision (ยุค hub)</td></tr>
<tr><td><b>Full duplex</b></td><td>ส่งและรับพร้อมกัน ไม่มี collision — มาตรฐานของ switch ทุกวันนี้</td></tr>
<tr><td><b>Autonegotiation</b></td><td>สองฝั่งตกลงความเร็วและ duplex กันเอง — <b>ควรเปิดทั้งสองฝั่ง หรือปิดทั้งสองฝั่ง</b></td></tr>
</table>
<div class="note warn"><b>Duplex mismatch</b> — ฝั่งหนึ่งตั้งตายเป็น full อีกฝั่งเปิด auto (จึงถอยไปเป็น half)
ผลคือ <b>ลิงก์ขึ้นปกติ ping ผ่าน แต่พอโอนไฟล์ใหญ่จะช้าอย่างน่าเกลียดและมี error เพียบ</b>
อาการนี้คลาสสิกมากและหายากถ้าไม่รู้จัก — ดูที่ค่า late collision และ CRC error ที่พอร์ต</div>
<p><b>PoE — จ่ายไฟไปกับสาย LAN</b></p>
<table class="tbl">
<tr><th>มาตรฐาน</th><th>ชื่อเรียก</th><th>กำลังไฟที่อุปกรณ์ได้รับ</th><th>ใช้กับ</th></tr>
<tr><td>802.3af</td><td>PoE</td><td>~12.95 W</td><td>โทรศัพท์ IP, AP รุ่นเล็ก</td></tr>
<tr><td>802.3at</td><td>PoE+</td><td>~25.5 W</td><td>AP รุ่นใหม่, กล้อง PTZ</td></tr>
<tr><td>802.3bt</td><td>PoE++ / 4PPoE</td><td>~51–71 W</td><td>จอ, กล้องที่มีฮีตเตอร์, อุปกรณ์กินไฟสูง</td></tr>
</table>
<div class="note"><b>สิ่งที่คนลืมเรื่อง PoE</b> — สวิตช์มี <b>power budget</b> รวมจำกัด เช่น 24 พอร์ตแต่จ่ายได้รวม 370W
ไม่ได้แปลว่าทุกพอร์ตจ่ายเต็มพร้อมกันได้ ต้องคำนวณก่อนติดตั้งกล้องทั้งชั้น</div>`,
        },
        {
          t: 'Lesson 2 — สายทองแดง',
          h: `
<table class="tbl">
<tr><th>ประเภท</th><th>รองรับ</th><th>ระยะ</th><th>ใช้ตอนไหน</th></tr>
<tr><td><b>Cat5e</b></td><td>1 Gbps</td><td>100 ม.</td><td>งานทั่วไปที่ยังไม่ต้องการ 10G</td></tr>
<tr><td><b>Cat6</b></td><td>1 Gbps · 10 Gbps ที่ 55 ม.</td><td>100 ม. (10G ได้ 55 ม.)</td><td>เดินใหม่ในอาคารทั่วไป</td></tr>
<tr><td><b>Cat6a</b></td><td>10 Gbps เต็มระยะ</td><td>100 ม.</td><td><b>มาตรฐานที่ควรเดินใหม่วันนี้</b></td></tr>
<tr><td>Cat7 / Cat8</td><td>10–40 Gbps</td><td>Cat8 ได้ 30 ม.</td><td>ในศูนย์ข้อมูล เชื่อมแร็คต่อแร็ค</td></tr>
</table>
<p><b>UTP กับ STP</b> — UTP ไม่มีชีลด์ ถูกและติดตั้งง่าย · STP มีชีลด์กัน EMI
ใช้ในโรงงานหรือที่ที่มีมอเตอร์และสายไฟแรงสูงใกล้ ๆ <b>แต่ต้องต่อกราวด์ให้ถูก</b> ไม่งั้นชีลด์จะกลายเป็นเสาอากาศเสียเอง</p>
<p><b>มาตรฐานการเข้าหัว T568A / T568B</b></p>
<table class="tbl">
<tr><th>แบบสาย</th><th>เข้าหัวอย่างไร</th><th>ใช้ตอนไหน</th></tr>
<tr><td><b>Straight-through</b></td><td>สองปลายเหมือนกัน (B–B หรือ A–A)</td><td>ต่ออุปกรณ์ต่างชนิด เช่น PC → Switch</td></tr>
<tr><td><b>Crossover</b></td><td>ปลายหนึ่ง A อีกปลาย B</td><td>ต่ออุปกรณ์ชนิดเดียวกัน เช่น Switch → Switch (รุ่นเก่า)</td></tr>
<tr><td><b>Rollover</b> (console)</td><td>สลับกลับด้านทั้งเส้น</td><td>ต่อเข้าพอร์ต console ของอุปกรณ์เครือข่าย</td></tr>
</table>
<div class="note"><b>Auto MDI-X</b> ทำให้สวิตช์สลับขาส่ง/รับให้เองอัตโนมัติ อุปกรณ์สมัยใหม่จึงใช้สาย straight ต่อกันได้หมด
— แต่ข้อสอบยังถามเรื่อง crossover อยู่ และของเก่าหน้างานก็ยังเจอ</div>
<table class="tbl">
<tr><th>หัวต่อ / อุปกรณ์</th><th>ใช้กับ</th></tr>
<tr><td><b>RJ45</b></td><td>Ethernet (8 ขา)</td></tr>
<tr><td><b>RJ11</b></td><td>โทรศัพท์ / DSL (4–6 ขา)</td></tr>
<tr><td><b>F-type</b> / <b>BNC</b></td><td>สาย coax — เคเบิลโมเด็ม / กล้องวงจรปิดระบบเก่า</td></tr>
<tr><td><b>Patch panel</b> + <b>Punchdown block</b> (66/110)</td><td>จุดรวมสายในตู้แร็ค ทำให้ย้ายพอร์ตได้โดยไม่ต้องเข้าหัวใหม่</td></tr>
</table>`,
        },
        {
          t: 'Lesson 2 — สายไฟเบอร์ออปติก',
          h: `
<table class="tbl">
<tr><th></th><th>Single-mode (SMF)</th><th>Multi-mode (MMF)</th></tr>
<tr><td>แกนกลาง</td><td>เล็กมาก (~9 µm)</td><td>ใหญ่กว่า (50 / 62.5 µm)</td></tr>
<tr><td>แหล่งกำเนิดแสง</td><td>เลเซอร์</td><td>LED / VCSEL</td></tr>
<tr><td>ระยะ</td><td><b>หลายสิบกิโลเมตร</b></td><td>หลักร้อยเมตร</td></tr>
<tr><td>ราคาสาย / อุปกรณ์</td><td>สายถูกกว่า แต่ transceiver แพงกว่า</td><td>สายแพงกว่า แต่ transceiver ถูกกว่า</td></tr>
<tr><td>สีปลอกสายที่พบบ่อย</td><td>เหลือง</td><td>ส้ม (OM1/OM2) · <b>ฟ้าน้ำทะเล</b> (OM3/OM4) · เขียว (OM5)</td></tr>
<tr><td>ใช้ตอนไหน</td><td>เชื่อมอาคาร เชื่อมสาขา ระยะไกล</td><td>ในอาคารเดียวกัน ระหว่างชั้น ในศูนย์ข้อมูล</td></tr>
</table>
<table class="tbl">
<tr><th>หัวต่อ</th><th>ลักษณะ</th></tr>
<tr><td><b>LC</b></td><td>เล็ก มาเป็นคู่ — พบมากที่สุดในอุปกรณ์สมัยใหม่</td></tr>
<tr><td><b>SC</b></td><td>สี่เหลี่ยม เสียบแล้วคลิก</td></tr>
<tr><td><b>ST</b></td><td>กลม บิดล็อก — ของเก่า</td></tr>
<tr><td><b>MPO / MTP</b></td><td>รวมหลายเส้นในหัวเดียว ใช้กับ 40G/100G</td></tr>
</table>
<p><b>Transceiver</b> — ตัวแปลงไฟฟ้าเป็นแสงที่ถอดเปลี่ยนได้ ทำให้สวิตช์ตัวเดียวใช้ได้ทั้งทองแดงและไฟเบอร์</p>
<table class="tbl">
<tr><th>ชนิด</th><th>รองรับ</th></tr>
<tr><td>GBIC</td><td>1 Gbps (รุ่นเก่า ตัวใหญ่)</td></tr>
<tr><td><b>SFP</b></td><td>1 Gbps</td></tr>
<tr><td><b>SFP+</b></td><td>10 Gbps</td></tr>
<tr><td>QSFP / QSFP+</td><td>40 Gbps ขึ้นไป</td></tr>
</table>
<div class="note warn"><b>สามเรื่องที่ทำให้ลิงก์ไฟเบอร์ไม่ขึ้น</b><br>
1. <b>TX/RX ไม่สลับ</b> — ขาส่งของฝั่งหนึ่งต้องเข้าขารับของอีกฝั่ง สลับคู่สายก็จบ<br>
2. <b>ชนิดไม่ตรงกัน</b> — เอา SMF ต่อกับ MMF หรือ transceiver คนละ wavelength<br>
3. <b>หัวสกปรก</b> — ฝุ่นแค่จุดเดียวบนหน้าสัมผัสก็ทำให้ค่าลดทอนพุ่ง ต้องทำความสะอาดก่อนเสียบเสมอ</div>`,
        },
        {
          t: 'Lesson 2 — ติดตั้งและทดสอบสาย',
          h: `
<p><b>โครงสร้างการเดินสายในอาคาร (structured cabling)</b></p>
<table class="tbl">
<tr><th>ส่วน</th><th>คืออะไร</th></tr>
<tr><td><b>MDF</b></td><td>ห้องสื่อสารหลักของอาคาร — ที่ที่สายจากผู้ให้บริการเข้ามา</td></tr>
<tr><td><b>IDF</b></td><td>ตู้ประจำชั้นหรือประจำโซน ที่กระจายไปยังจุดใช้งาน</td></tr>
<tr><td><b>Backbone</b> (vertical)</td><td>สายระหว่าง MDF กับ IDF — มักเป็นไฟเบอร์</td></tr>
<tr><td><b>Horizontal</b></td><td>จาก IDF ไปถึงเต้ารับที่โต๊ะทำงาน — <b>ไม่เกิน 90 ม.</b> บวก patch cord สองข้างรวมไม่เกิน 100 ม.</td></tr>
<tr><td><b>Demarcation point</b></td><td>จุดแบ่งความรับผิดชอบระหว่างเรากับผู้ให้บริการ — สำคัญมากตอนแจ้งปัญหา</td></tr>
</table>
<table class="tbl">
<tr><th>เครื่องมือ</th><th>ใช้ทำอะไร</th></tr>
<tr><td><b>Crimper</b></td><td>เข้าหัว RJ45</td></tr>
<tr><td><b>Punchdown tool</b></td><td>ยัดสายเข้า patch panel หรือเต้ารับ</td></tr>
<tr><td><b>Cable tester</b></td><td>ตรวจว่าต่อครบทุกเส้นและเรียงถูก</td></tr>
<tr><td><b>Cable certifier</b></td><td>วัดว่าผ่านสเปกของ Cat นั้นจริงไหม — ใช้ตอนส่งมอบงาน</td></tr>
<tr><td><b>Tone generator + probe</b></td><td>หาว่าสายเส้นนี้ไปโผล่พอร์ตไหนในตู้</td></tr>
<tr><td><b>TDR</b> / <b>OTDR</b></td><td>บอกว่าสายขาดที่ระยะกี่เมตร (ทองแดง / ไฟเบอร์)</td></tr>
<tr><td><b>Light meter / OPM</b></td><td>วัดกำลังแสงว่าตกเกินงบหรือไม่</td></tr>
<tr><td><b>Loopback adapter</b></td><td>ทดสอบว่าพอร์ตของอุปกรณ์เองยังดีอยู่</td></tr>
</table>
<div class="note"><b>ข้อควรระวังตอนเดินสาย</b><br>
<b>Bend radius</b> — หักงอเกินกำหนดทำให้ไฟเบอร์สูญเสียแสงและทองแดงเสียคุณสมบัติ ·
<b>ห้ามเดินขนานชิดสายไฟฟ้า</b> เพราะ EMI ·
<b>Plenum-rated</b> ต้องใช้ในช่องลมแอร์เหนือฝ้า เพราะปลอกไม่ลามไฟและไม่ปล่อยควันพิษ ·
<b>ติดป้ายทั้งสองปลาย</b> ทุกเส้น — ประหยัดเวลาในอนาคตมากกว่าที่คิด</div>`,
        },
      ],
      quiz: [
        { type: 'mcq', q: 'Switch ทำงานที่ OSI ชั้นใดเป็นหลัก', opts: ['ชั้น 1 Physical', 'ชั้น 2 Data Link', 'ชั้น 3 Network', 'ชั้น 4 Transport'], a: 1, why: 'สวิตช์ตัดสินใจส่งต่อโดยดู MAC address ซึ่งอยู่ในเฟรมของชั้น 2 — ส่วน router ดู IP จึงเป็นชั้น 3 และ hub เป็นชั้น 1 เพราะแค่ทวนสัญญาณต่อโดยไม่ดูอะไรเลย' },
        { type: 'mcq', q: 'หน่วยข้อมูล (PDU) ของชั้น Network เรียกว่าอะไร', opts: ['Frame', 'Packet', 'Segment', 'Bit'], a: 1, why: 'ไล่จากล่างขึ้นบน: Bit (L1) → Frame (L2) → Packet (L3) → Segment (L4) — ข้อสอบชอบถามสลับกันระหว่าง frame กับ packet' },
        { type: 'mcq', q: 'ผู้ใช้ ping IP ปลายทางได้ แต่เปิดหน้าเว็บของเครื่องนั้นไม่ได้ ควรสงสัยชั้นใดก่อน', opts: ['ชั้น 1 สายสัญญาณ', 'ชั้น 2 สวิตช์', 'ชั้น 4 ขึ้นไป เช่น firewall กรองพอร์ต หรือ service ไม่ทำงาน', 'ชั้น 3 routing'], a: 2, why: 'ping ผ่านแปลว่าชั้น 1–3 ทำงานดีอยู่แล้ว ปัญหาจึงอยู่สูงกว่านั้น — พอร์ตถูกบล็อกที่ชั้น 4 หรือ service ที่ชั้น 7 ไม่ได้รัน' },
        { type: 'mcq', q: 'สาย Cat6 รองรับ 10 Gbps ได้ที่ระยะเท่าใด', opts: ['100 เมตรเต็ม', '55 เมตร', '30 เมตร', 'ไม่รองรับ 10 Gbps'], a: 1, why: 'Cat6 ทำ 10G ได้แค่ 55 เมตร ถ้าต้องการ 10G เต็ม 100 เมตรต้องใช้ Cat6a — เป็นเหตุผลหลักที่งานเดินสายใหม่ควรใช้ Cat6a ไปเลย' },
        { type: 'mcq', q: 'ลิงก์ขึ้นปกติและ ping ผ่าน แต่โอนไฟล์ใหญ่ช้ามากและมี error เยอะ สาเหตุที่น่าสงสัยที่สุดคือ', opts: ['สายขาด', 'Duplex mismatch', 'IP ซ้ำกัน', 'DNS ผิด'], a: 1, why: 'duplex mismatch (ฝั่งหนึ่ง full อีกฝั่ง half) ทำให้ลิงก์ขึ้นและ traffic น้อย ๆ ผ่านได้ แต่พอมีข้อมูลสองทางพร้อมกันจะชนกันตลอด สังเกตจาก late collision และ CRC error ที่พอร์ต' },
        { type: 'mcq', q: 'มาตรฐาน PoE ใดที่จ่ายไฟให้อุปกรณ์ได้ประมาณ 25.5 วัตต์', opts: ['802.3af (PoE)', '802.3at (PoE+)', '802.3bt (PoE++)', '802.11ac'], a: 1, why: '802.3af ราว 12.95W · 802.3at ราว 25.5W · 802.3bt ได้ถึง 51–71W — และอย่าลืมว่าสวิตช์มี power budget รวมจำกัด ไม่ใช่ทุกพอร์ตจ่ายเต็มพร้อมกันได้' },
        { type: 'mcq', q: 'ต้องการเชื่อมสองอาคารที่ห่างกัน 3 กิโลเมตร ควรใช้อะไร', opts: ['Cat6a', 'ไฟเบอร์ multimode', 'ไฟเบอร์ single-mode', 'สาย coax'], a: 2, why: 'ทองแดงจำกัดที่ 100 เมตร · multimode ได้หลักร้อยเมตร · single-mode เท่านั้นที่ไปได้หลายกิโลเมตร' },
        { type: 'mcq', q: 'ต่อไฟเบอร์แล้วลิงก์ไม่ขึ้นทั้งที่อุปกรณ์ทั้งสองฝั่งปกติ ควรตรวจอะไรก่อน', opts: ['เปลี่ยนสวิตช์ใหม่', 'สลับคู่สาย TX/RX และทำความสะอาดหัวต่อ', 'เปลี่ยน IP', 'รีสตาร์ท router'], a: 1, why: 'ขาส่งของฝั่งหนึ่งต้องเข้าขารับของอีกฝั่ง สลับคู่สายเป็นเรื่องแรกที่ต้องลอง และหัวต่อสกปรกก็เป็นสาเหตุอันดับต้น ๆ ที่ทำให้แสงตกจนลิงก์ไม่ขึ้น' },
        { type: 'mcq', q: 'เครื่องมือใดบอกได้ว่าสายทองแดงขาดที่ระยะกี่เมตรจากจุดที่วัด', opts: ['Tone generator', 'TDR', 'Loopback adapter', 'Crimper'], a: 1, why: 'TDR ยิงสัญญาณไปแล้ววัดเวลาที่สะท้อนกลับจึงคำนวณระยะได้ — ฝั่งไฟเบอร์ใช้ OTDR ส่วน tone generator ใช้หาว่าสายเส้นไหนไปโผล่พอร์ตไหน' },
        { type: 'mcq', q: 'ระยะ horizontal cabling จาก IDF ถึงเต้ารับที่โต๊ะกำหนดไว้ไม่เกินเท่าใด', opts: ['55 เมตร', '90 เมตร (รวม patch cord แล้วไม่เกิน 100 เมตร)', '100 เมตรจากตู้ถึงโต๊ะ', '150 เมตร'], a: 1, why: 'มาตรฐานกำหนดสายในผนัง 90 เมตร เผื่อ patch cord ที่ปลายทั้งสองข้างอีกรวม 10 เมตร รวมทั้งช่วงไม่เกิน 100 เมตร' },
        { type: 'mcq', q: 'ช่วง IP ใดต่อไปนี้ไม่ใช่ช่วง private ตาม RFC 1918', opts: ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16', '169.254.0.0/16'], a: 3, why: '169.254.0.0/16 คือ APIPA ซึ่งเครื่องตั้งให้ตัวเองเมื่อ<b>หา DHCP server ไม่เจอ</b> — เห็น IP ขึ้นต้น 169.254 เมื่อไหร่แปลว่า DHCP มีปัญหา' },
        { type: 'cmd', q: 'พิมพ์คำสั่งบน Linux เพื่อดู IP address ของทุก interface', ans: ['ip addr', 'ip a', 'ip address', 'ifconfig', 'ip addr show'], why: 'ip addr เป็นคำสั่งมาตรฐานปัจจุบัน ส่วน ifconfig เป็นของเก่าที่หลาย distro ไม่ติดตั้งมาให้แล้ว — บน Windows ใช้ ipconfig' },
        { type: 'multi', q: 'ข้อใดคือสิ่งที่ควรทำเมื่อติดตั้ง router SOHO ตัวใหม่ (เลือกทุกข้อที่ถูก)', opts: ['เปลี่ยนรหัสผ่านผู้ดูแลจากค่าโรงงาน', 'ปิดการจัดการจากฝั่ง WAN', 'ตั้ง WPA2/WPA3 ให้ไวไฟ', 'เปิด WEP ไว้เพื่อรองรับอุปกรณ์เก่า'], a: [0, 1, 2], why: 'WEP ถูกเจาะได้ในเวลาไม่กี่นาทีและไม่ควรใช้ในทุกกรณี ถ้ามีอุปกรณ์เก่าที่รองรับแค่ WEP ให้แยกวงและจำกัดสิทธิ์แทน' },
        { type: 'multi', q: 'ข้อใดคือเหตุผลที่ต้องใช้สายแบบ plenum-rated (เลือกทุกข้อที่ถูก)', opts: ['เดินในช่องลมแอร์เหนือฝ้า', 'ปลอกไม่ลามไฟ', 'ไม่ปล่อยควันพิษเมื่อถูกความร้อน', 'ส่งข้อมูลได้เร็วกว่าสายปกติ'], a: [0, 1, 2], why: 'plenum เป็นเรื่องความปลอดภัยจากอัคคีภัยล้วน ๆ ไม่เกี่ยวกับความเร็วในการส่งข้อมูล — แต่เป็นข้อบังคับตามกฎหมายอาคารในหลายพื้นที่' },
      ],
      labs: [{
        id: 'net-l1-phy',
        title: 'Lab 1 — สำรวจชั้น Physical และ Data Link ของเครื่อง',
        brief: 'ผู้ใช้แจ้งว่าเครื่องช้าเวลาโอนไฟล์ใหญ่ ก่อนจะไปโทษเซิร์ฟเวอร์ ให้ตรวจชั้นล่างสุดก่อนตามหลัก OSI — ลิงก์ขึ้นที่ความเร็วเท่าไหร่ duplex ตรงไหม และมี error สะสมหรือเปล่า',
        device: 'linux',
        tasks: [
          { t: 'ดูรายการ interface ทั้งหมดและสถานะลิงก์', hint: 'ip link', check: (s, h) => said(h, /^ip\s+(-\w+\s+)?link/i) },
          { t: 'ดู IP และ prefix ที่ตั้งอยู่ตอนนี้', hint: 'ip addr', check: (s, h) => said(h, /^ip\s+(addr|a)\b/i) },
          { t: 'ตรวจ speed, duplex และ autonegotiation ของ <code>ens33</code>', hint: 'ethtool ens33', check: (s, h) => said(h, /^ethtool/i) },
          { t: 'ดูสถิติ error และ drop ที่สะสมบน <code>ens33</code>', hint: 'ip -s link show ens33', check: (s, h) => said(h, /ip\s+-s\s+link/i) },
          { t: 'ดูตาราง ARP ว่า IP ไหนคู่กับ MAC ไหนในวงนี้', hint: 'ip neigh', check: (s, h) => said(h, /ip\s+neigh|arp\s+-a/i) },
          { t: 'ตั้ง MTU ของ <code>ens33</code> เป็น 9000 เพื่อรองรับ jumbo frame', hint: 'sudo ip link set ens33 mtu 9000', check: (s, h) => said(h, /ip\s+link\s+set.*mtu\s*9000/i) },
          { t: 'ทดสอบว่า TCP/IP stack ของเครื่องเองยังดีอยู่', hint: 'ping -c 2 127.0.0.1', check: (s, h) => said(h, /ping.*127\.0\.0\.1/i) },
          { t: 'ดูตารางเส้นทางเพื่อยืนยันว่ามี default gateway', hint: 'ip route', check: (s, h) => said(h, /^ip\s+(route|r)\b/i) },
        ],
      }],
    },

    // =========================================================
    2: {
      title: 'สวิตช์ Ethernet และการไล่ปัญหาอย่างเป็นระบบ',
      objectives: [
        'บอกได้ว่าอุปกรณ์แต่ละชนิดทำหน้าที่อะไรและอยู่ชั้นไหน',
        'อ่านค่าและสถานะของ network interface เป็น',
        'เข้าใจการทำงานของ MAC table, STP และ port aggregation',
        'ไล่ปัญหาตามขั้นตอนมาตรฐานแทนการเดาสุ่ม',
      ],
      sections: [
        {
          t: 'Lesson 3 — อุปกรณ์เครือข่ายและหน้าที่ของแต่ละชนิด',
          h: `
<table class="tbl">
<tr><th>อุปกรณ์</th><th>ชั้น</th><th>หน้าที่</th></tr>
<tr><td><b>Hub</b></td><td>1</td><td>ทวนสัญญาณออกทุกพอร์ต — ทุกเครื่องอยู่ collision domain เดียวกัน ปัจจุบันเลิกใช้แล้ว</td></tr>
<tr><td><b>Switch</b></td><td>2</td><td>เรียนรู้ MAC แล้วส่งเฉพาะพอร์ตปลายทาง — <b>แต่ละพอร์ตเป็น collision domain ของตัวเอง</b></td></tr>
<tr><td><b>Router</b></td><td>3</td><td>เชื่อมคนละวงเข้าด้วยกัน — <b>แบ่ง broadcast domain</b></td></tr>
<tr><td><b>Layer 3 switch</b></td><td>2+3</td><td>สวิตช์ที่ route ระหว่าง VLAN ได้ด้วยฮาร์ดแวร์ เร็วกว่า router ทั่วไปมาก</td></tr>
<tr><td><b>Firewall</b></td><td>3–7</td><td>กรอง traffic ตามกฎ — NGFW ดูถึงระดับแอปและผู้ใช้ได้</td></tr>
<tr><td><b>Access Point</b></td><td>2</td><td>ต่อขยายวงเป็นไร้สาย</td></tr>
<tr><td><b>WLC</b></td><td>2</td><td>ตัวควบคุม AP หลายตัวจากที่เดียว — จัดการช่อง กำลังส่ง และ roaming</td></tr>
<tr><td><b>Load balancer</b></td><td>4 / 7</td><td>กระจายโหลดไปหลายเซิร์ฟเวอร์ พร้อม health check</td></tr>
<tr><td><b>Proxy</b></td><td>7</td><td>ตัวกลางที่ควบคุมและบันทึกการเข้าถึงเว็บ</td></tr>
<tr><td><b>IDS / IPS</b></td><td>3–7</td><td>ตรวจจับ / ขัดขวางการโจมตี</td></tr>
<tr><td><b>Media converter</b></td><td>1</td><td>แปลงทองแดง ↔ ไฟเบอร์</td></tr>
</table>
<div class="note"><b>สองคำที่ต้องแยกให้ขาด</b><br>
<b>Collision domain</b> — ขอบเขตที่สัญญาณชนกันได้ · สวิตช์แบ่งให้ทีละพอร์ต<br>
<b>Broadcast domain</b> — ขอบเขตที่ broadcast ไปถึง · <b>สวิตช์ไม่แบ่ง</b> ต้องใช้ router หรือ VLAN เท่านั้น<br>
คำถามคลาสสิก: สวิตช์ 24 พอร์ตหนึ่งตัว = 24 collision domain แต่ <b>1 broadcast domain</b></div>`,
        },
        {
          t: 'Lesson 3 — Network Interfaces',
          h: `
<p><b>MAC address</b> — 48 บิต เขียนเป็นเลขฐาน 16 หกกลุ่ม เช่น <code>48:8F:5A:11:00:01</code></p>
<ul>
  <li>สามไบต์แรก = <b>OUI</b> บอกผู้ผลิต · สามไบต์หลัง = หมายเลขเครื่อง</li>
  <li><b>ไม่ซ้ำกันทั้งโลก</b> (ในทางทฤษฎี) และใช้ได้เฉพาะภายในวงเดียวกัน ข้ามวงไม่ได้</li>
  <li><code>FF:FF:FF:FF:FF:FF</code> = broadcast ทั้งวง</li>
</ul>
<table class="tbl">
<tr><th>ค่าที่ต้องอ่านเป็น</th><th>ความหมาย</th></tr>
<tr><td><b>Speed / Duplex</b></td><td>ตกลงกันได้ที่เท่าไหร่ — ต่ำกว่าที่ควรเป็นแปลว่าสายหรือ transceiver มีปัญหา</td></tr>
<tr><td><b>MTU</b></td><td>ขนาดสูงสุดของ payload — Ethernet มาตรฐานคือ <b>1500 ไบต์</b></td></tr>
<tr><td><b>Jumbo frame</b></td><td>MTU ~9000 ใช้ใน SAN/NAS เพื่อลดจำนวนเฟรม — <b>ต้องตั้งให้ตรงกันทุกอุปกรณ์ตลอดเส้นทาง</b></td></tr>
<tr><td><b>CRC error</b></td><td>เฟรมเสียหาย — เกือบทุกครั้งคือปัญหาสายหรือ EMI</td></tr>
<tr><td><b>Late collision</b></td><td>สัญญาณคลาสสิกของ duplex mismatch</td></tr>
<tr><td><b>Runt / Giant</b></td><td>เฟรมเล็กหรือใหญ่เกินมาตรฐาน</td></tr>
</table>
<pre class="code"><span style="color:#5b6b8c"># ดูสถานะและสถิติของ interface บน Linux</span>
ip addr
ip -s link show ens33        <span style="color:#5b6b8c"># ดู error / drop สะสม</span>
ethtool ens33                <span style="color:#5b6b8c"># ดู speed / duplex / autoneg</span></pre>
<div class="note warn"><b>MTU ไม่ตรงกันทำให้เกิดอาการแปลก ๆ</b> — เปิดเว็บทั่วไปได้ แต่บางเว็บหรือบางไฟล์ค้าง
เพราะแพ็กเก็ตใหญ่ถูกทิ้งกลางทางโดยไม่มีใครแจ้ง (path MTU discovery ถูกบล็อกเพราะปิด ICMP)
เจอบ่อยมากกับลิงก์ VPN และ PPPoE ที่ MTU เหลือน้อยกว่า 1500</div>`,
        },
        {
          t: 'Lesson 3 — ฟีเจอร์ของสวิตช์ที่ต้องรู้',
          h: `
<p><b>สวิตช์เรียนรู้อย่างไร</b> — เมื่อได้รับเฟรม มันจะจำว่า MAC ต้นทางอยู่พอร์ตไหน แล้วเก็บลง <b>MAC address table</b></p>
<ol>
  <li>ปลายทางอยู่ในตาราง → ส่งออกเฉพาะพอร์ตนั้น (<b>forward</b>)</li>
  <li>ไม่รู้จักปลายทาง → ส่งออกทุกพอร์ตยกเว้นพอร์ตที่รับมา (<b>flood</b>)</li>
  <li>ปลายทางอยู่พอร์ตเดียวกับต้นทาง → ทิ้ง (<b>filter</b>)</li>
</ol>
<p><b>Spanning Tree Protocol (STP / 802.1D, RSTP / 802.1w)</b></p>
<p>ถ้าต่อสวิตช์เป็นวงกลม เฟรม broadcast จะวนไม่รู้จบจนเครือข่ายล่มภายในไม่กี่วินาที
(<b>broadcast storm</b>) STP แก้ด้วยการ<b>ปิดเส้นทางที่ซ้ำซ้อนไว้ก่อน</b> แล้วเปิดใช้เมื่อเส้นหลักล่ม</p>
<table class="tbl">
<tr><th>คำศัพท์</th><th>ความหมาย</th></tr>
<tr><td><b>Root bridge</b></td><td>สวิตช์ศูนย์กลางที่ทุกตัวคำนวณเส้นทางไปหา — ตัวที่ bridge priority ต่ำสุดชนะ</td></tr>
<tr><td><b>Root port</b></td><td>พอร์ตที่ใกล้ root bridge ที่สุดของสวิตช์ตัวนั้น</td></tr>
<tr><td><b>Designated port</b></td><td>พอร์ตที่รับผิดชอบส่ง traffic ของ segment นั้น</td></tr>
<tr><td><b>Blocking port</b></td><td>พอร์ตที่ถูกปิดไว้เพื่อตัด loop</td></tr>
<tr><td><b>BPDU Guard</b></td><td>ปิดพอร์ตทันทีถ้ามีใครเอาสวิตช์มาต่อที่พอร์ตของผู้ใช้</td></tr>
<tr><td><b>PortFast / Edge port</b></td><td>ให้พอร์ตของเครื่องผู้ใช้ขึ้นทันทีโดยไม่ต้องรอ STP คำนวณ</td></tr>
</table>
<table class="tbl">
<tr><th>ฟีเจอร์อื่น</th><th>ใช้ทำอะไร</th></tr>
<tr><td><b>Port aggregation</b> (LACP / 802.3ad)</td><td>รวมหลายสายเป็นลิงก์เดียว ได้ทั้งแบนด์วิดท์และความซ้ำซ้อน</td></tr>
<tr><td><b>Port mirroring</b> (SPAN)</td><td>ก๊อป traffic ของพอร์ตหนึ่งไปอีกพอร์ตเพื่อดักวิเคราะห์</td></tr>
<tr><td><b>Port security</b></td><td>จำกัดจำนวนหรือระบุ MAC ที่ใช้พอร์ตนั้นได้</td></tr>
<tr><td><b>Flow control</b> (802.3x)</td><td>ส่งสัญญาณหยุดชั่วคราวเมื่อบัฟเฟอร์เต็ม</td></tr>
<tr><td><b>Jumbo frame</b></td><td>เปิดเมื่อใช้ storage network</td></tr>
</table>`,
        },
        {
          t: 'Lesson 4 — วิธีไล่ปัญหาแบบมีระบบ',
          h: `
<p>ขั้นตอนมาตรฐานของ CompTIA — ข้อสอบถามลำดับนี้บ่อยมาก และงานจริงก็ช่วยไม่ให้หลงทาง</p>
<table class="tbl">
<tr><th>ขั้น</th><th>ทำอะไร</th><th>สิ่งที่คนพลาด</th></tr>
<tr><td><b>1. ระบุปัญหา</b></td><td>ถามผู้ใช้ เก็บอาการ ดูว่ามีอะไรเปลี่ยนไปบ้าง</td><td>ไม่ถามว่า "เมื่อวานยังใช้ได้ไหม"</td></tr>
<tr><td><b>2. ตั้งทฤษฎีสาเหตุ</b></td><td>คิดสาเหตุที่เป็นไปได้ เริ่มจากที่ง่ายและพบบ่อยที่สุด</td><td>เดาสาเหตุที่ซับซ้อนก่อน ทั้งที่สายหลุด</td></tr>
<tr><td><b>3. ทดสอบทฤษฎี</b></td><td>พิสูจน์ว่าใช่หรือไม่ ถ้าไม่ใช่ให้กลับไปขั้น 2</td><td>แก้เลยโดยไม่พิสูจน์</td></tr>
<tr><td><b>4. วางแผนแก้</b></td><td>ประเมินผลกระทบ เผื่อแผนย้อนกลับ</td><td>แก้ตอนกลางวันโดยไม่แจ้งใคร</td></tr>
<tr><td><b>5. ลงมือแก้</b></td><td>ทำตามแผน</td><td>แก้หลายอย่างพร้อมกันจนไม่รู้ว่าอันไหนได้ผล</td></tr>
<tr><td><b>6. ตรวจสอบว่าใช้งานได้จริง</b></td><td>ให้ผู้ใช้ยืนยัน และวางมาตรการกันเกิดซ้ำ</td><td>ปิดงานโดยไม่ถามผู้ใช้</td></tr>
<tr><td><b>7. บันทึกไว้</b></td><td>จดอาการ สาเหตุ และวิธีแก้</td><td>ข้ามขั้นนี้ แล้วเจอปัญหาเดิมอีกหกเดือนถัดมา</td></tr>
</table>
<div class="note"><b>เทคนิคที่ใช้ได้ทุกครั้ง</b> — <b>ไล่จากล่างขึ้นบนตาม OSI</b> เช็คสายและไฟที่พอร์ตก่อน แล้วค่อยขึ้นไป IP, พอร์ต และแอป<br>
และถามคำถามที่แคบขอบเขตให้เร็วที่สุด: <b>เกิดกับคนเดียวหรือทั้งแผนก · เครื่องเดียวหรือทุกเครื่อง ·
ทุกเว็บหรือเว็บเดียว · เพิ่งเกิดหรือเป็นมานาน · มีอะไรเปลี่ยนไปก่อนหน้านี้</b></div>`,
        },
        {
          t: 'Lesson 4 — ปัญหาสายสัญญาณที่เจอบ่อย',
          h: `
<table class="tbl">
<tr><th>อาการ / ปัญหา</th><th>สาเหตุ</th><th>ตรวจอย่างไร</th></tr>
<tr><td><b>Attenuation</b></td><td>สัญญาณอ่อนลงเพราะสายยาวเกิน</td><td>วัดความยาว เช็คว่าเกิน 100 ม. หรือไม่</td></tr>
<tr><td><b>Crosstalk / NEXT</b></td><td>สัญญาณรบกวนข้ามคู่สาย มักเกิดจากคลายเกลียวยาวเกินตอนเข้าหัว</td><td>Cable certifier · เข้าหัวใหม่ให้คลายเกลียวน้อยที่สุด</td></tr>
<tr><td><b>EMI</b></td><td>เดินสายใกล้สายไฟ มอเตอร์ หลอดไฟ</td><td>ย้ายเส้นทาง หรือเปลี่ยนเป็น STP / ไฟเบอร์</td></tr>
<tr><td><b>Open / Short</b></td><td>สายขาด หรือเส้นทองแดงแตะกัน</td><td>Cable tester บอกได้ทันที</td></tr>
<tr><td><b>Wrong pinout</b></td><td>เรียงสีไม่ตรงมาตรฐานสองปลาย</td><td>Cable tester · เข้าหัวใหม่ตาม T568B ทั้งสองด้าน</td></tr>
<tr><td><b>Split pair</b></td><td>ต่อครบทุกเส้นแต่<b>จับคู่ผิดคู่</b> — tester ธรรมดาบอกว่าผ่าน</td><td>ต้องใช้ certifier · อาการคือช้าและ error เยอะ</td></tr>
<tr><td><b>TX/RX reversed</b></td><td>ขาส่งกับขารับสลับกัน (พบบ่อยกับไฟเบอร์)</td><td>สลับคู่สายที่ปลายหนึ่ง</td></tr>
<tr><td><b>Duplex / speed mismatch</b></td><td>สองฝั่งตั้งค่าไม่ตรงกัน</td><td>ดู error counter · ตั้งให้ตรงกันทั้งสองฝั่ง</td></tr>
<tr><td><b>Bad port / bad SFP</b></td><td>พอร์ตหรือ transceiver เสีย</td><td>ย้ายไปพอร์ตอื่น สลับ SFP เพื่อแยกตัวแปร</td></tr>
<tr><td><b>Dirty / damaged fiber</b></td><td>ฝุ่นบนหน้าสัมผัส หรือสายหักงอ</td><td>ทำความสะอาด · วัดด้วย light meter · หา break ด้วย OTDR</td></tr>
</table>
<div class="note"><b>อ่านไฟที่พอร์ตให้เป็น</b> — <b>ไม่ติดเลย</b> = ปัญหาชั้น 1 ล้วน ๆ (สาย พอร์ต หรือไฟ) ·
<b>ติดแต่ไม่กะพริบ</b> = ลิงก์ขึ้นแต่ไม่มี traffic · <b>สีบอกความเร็ว</b> ในหลายรุ่น —
เห็นไฟบอก 100 Mbps ทั้งที่ควรได้ 1 Gbps แปลว่ามีคู่สายบางคู่ขาด เพราะ gigabit ต้องใช้ครบทั้ง 4 คู่</div>`,
        },
      ],
      quiz: [
        { type: 'mcq', q: 'สวิตช์ 24 พอร์ตหนึ่งตัวมีกี่ broadcast domain (ยังไม่ได้แบ่ง VLAN)', opts: ['24', '12', '1', '0'], a: 2, why: 'สวิตช์แบ่ง collision domain ให้ทีละพอร์ต (จึงมี 24 collision domain) แต่ไม่แบ่ง broadcast domain — ต้องใช้ router หรือ VLAN เท่านั้นจึงจะแบ่งได้' },
        { type: 'mcq', q: 'สวิตช์ทำอย่างไรเมื่อได้รับเฟรมที่ปลายทางยังไม่มีใน MAC address table', opts: ['ทิ้งเฟรมนั้น', 'ส่งกลับไปที่ต้นทาง', 'ส่งออกทุกพอร์ตยกเว้นพอร์ตที่รับมา (flood)', 'ส่งไปที่ router'], a: 2, why: 'เรียกว่า unknown unicast flooding — เมื่อปลายทางตอบกลับมา สวิตช์จะเรียนรู้และครั้งต่อไปจะส่งเฉพาะพอร์ตนั้น' },
        { type: 'mcq', q: 'STP มีไว้เพื่ออะไร', opts: ['เพิ่มความเร็วของลิงก์', 'ป้องกัน loop และ broadcast storm ในเครือข่ายที่มีเส้นทางซ้ำซ้อน', 'เข้ารหัสข้อมูลระหว่างสวิตช์', 'แบ่ง VLAN'], a: 1, why: 'เมื่อต่อสวิตช์เป็นวง เฟรม broadcast จะวนไม่รู้จบจนเครือข่ายล่ม STP จึงปิดเส้นทางซ้ำซ้อนไว้ก่อนแล้วเปิดใช้เมื่อเส้นหลักล่ม' },
        { type: 'mcq', q: 'สวิตช์ตัวใดจะได้เป็น root bridge', opts: ['ตัวที่มีพอร์ตมากที่สุด', 'ตัวที่ bridge priority ต่ำที่สุด (ถ้าเท่ากันดูที่ MAC ต่ำสุด)', 'ตัวที่เปิดก่อน', 'ตัวที่ต่อกับ router'], a: 1, why: 'ค่าเริ่มต้นของ priority มักเท่ากันหมด ทำให้สวิตช์เก่าที่สุด (MAC ต่ำสุด) กลายเป็น root โดยบังเอิญ — งานจริงจึงควรกำหนด priority ให้ตัวที่ต้องการเอง' },
        { type: 'mcq', q: 'ต้องการรวมสาย 4 เส้นระหว่างสวิตช์สองตัวให้เป็นลิงก์เดียว ใช้เทคโนโลยีใด', opts: ['Port mirroring', 'LACP / port aggregation', 'Port security', 'STP'], a: 1, why: 'LACP (802.3ad) รวมหลายลิงก์เป็นหนึ่ง ได้ทั้งแบนด์วิดท์รวมและความซ้ำซ้อน — และ STP จะมองเห็นเป็นลิงก์เดียวจึงไม่ปิดเส้นใดเส้นหนึ่งทิ้ง' },
        { type: 'mcq', q: 'ต้องการดักดู traffic ของพอร์ตหนึ่งเพื่อวิเคราะห์ ควรใช้ฟีเจอร์ใด', opts: ['Port security', 'Port mirroring (SPAN)', 'Flow control', 'PortFast'], a: 1, why: 'port mirroring ก๊อปสำเนา traffic ของพอร์ตต้นทางไปยังพอร์ตที่เราต่อเครื่องวิเคราะห์ไว้ โดยไม่รบกวนการใช้งานจริง' },
        { type: 'mcq', q: 'ลำดับขั้นตอนการไล่ปัญหาที่ถูกต้องคือข้อใด', opts: ['ระบุปัญหา → ลงมือแก้ → ตั้งทฤษฎี → บันทึก', 'ระบุปัญหา → ตั้งทฤษฎี → ทดสอบทฤษฎี → วางแผน → ลงมือแก้ → ตรวจสอบ → บันทึก', 'ตั้งทฤษฎี → ระบุปัญหา → แก้ → บันทึก', 'ลงมือแก้ → ตรวจสอบ → บันทึก'], a: 1, why: 'จุดสำคัญคือต้อง "ทดสอบทฤษฎี" ก่อนลงมือแก้ และต้อง "บันทึก" ปิดท้ายเสมอ — สองขั้นนี้คือขั้นที่คนข้ามบ่อยที่สุด' },
        { type: 'mcq', q: 'เครื่องได้ IP ขึ้นต้นด้วย 169.254 แปลว่าอะไร', opts: ['ได้ IP จาก DHCP ปกติ', 'หา DHCP server ไม่เจอ จึงตั้ง APIPA ให้ตัวเอง', 'IP ซ้ำในวง', 'DNS ผิด'], a: 1, why: 'APIPA เป็นสัญญาณชัดเจนว่าปัญหาอยู่ที่ DHCP — ให้ไล่ดูสาย, VLAN ที่พอร์ต, DHCP scope ว่า IP หมดหรือยัง และ DHCP relay ถ้าอยู่คนละวง' },
        { type: 'mcq', q: 'สายที่ต่อครบทุกเส้นแต่จับคู่ผิดคู่ ทำให้ cable tester ธรรมดาบอกว่าผ่าน เรียกปัญหานี้ว่าอะไร', opts: ['Open', 'Short', 'Split pair', 'Crosstalk'], a: 2, why: 'split pair ต่อครบและถูกขาแต่ไม่ได้ใช้คู่เกลียวที่ควรคู่กัน ทำให้เกิดสัญญาณรบกวนสูง อาการคือใช้ได้แต่ช้าและ error เยอะ — ต้องใช้ certifier จึงจะจับได้' },
        { type: 'mcq', q: 'พอร์ต gigabit แต่ลิงก์ขึ้นแค่ 100 Mbps ควรสงสัยอะไรก่อน', opts: ['สวิตช์เสีย', 'มีคู่สายบางคู่ขาด เพราะ 1000BASE-T ต้องใช้ครบทั้ง 4 คู่', 'IP ผิด', 'VLAN ผิด'], a: 1, why: '100BASE-TX ใช้แค่ 2 คู่ ส่วน 1000BASE-T ต้องใช้ครบ 4 คู่ — สายที่เข้าหัวไม่ครบหรือมีเส้นขาดจึงยังใช้ได้ที่ 100 Mbps ทำให้เข้าใจผิดว่าสายดี' },
        { type: 'mcq', q: 'อาการ "เปิดเว็บทั่วไปได้ แต่บางเว็บค้าง" บนลิงก์ VPN มักเกิดจากอะไร', opts: ['DNS ผิด', 'MTU ไม่เหมาะสม ทำให้แพ็กเก็ตใหญ่ถูกทิ้งกลางทาง', 'สายขาด', 'IP ซ้ำ'], a: 1, why: 'VPN และ PPPoE ห่อหัวข้อมูลเพิ่มทำให้ MTU ที่ใช้ได้จริงเหลือน้อยกว่า 1500 ถ้า path MTU discovery ถูกบล็อก (ปิด ICMP) แพ็กเก็ตใหญ่จะหายเงียบ ๆ' },
        { type: 'cmd', q: 'พิมพ์คำสั่งบน Linux เพื่อดูสถิติ error ของ interface <code>ens33</code>', ans: ['ip -s link show ens33', 'ip -s link', 'ethtool ens33', 'ip -s link show'], why: 'ตัวเลข error, drop และ collision ที่สะสมอยู่บอกได้ว่าปัญหาเป็นเรื่องสาย (CRC error) หรือ duplex mismatch (late collision)' },
        { type: 'multi', q: 'ข้อใดคือสัญญาณของปัญหาชั้น Physical (เลือกทุกข้อที่ถูก)', opts: ['ไฟที่พอร์ตไม่ติดเลย', 'CRC error เพิ่มขึ้นเรื่อย ๆ', 'ลิงก์ขึ้นที่ความเร็วต่ำกว่าที่ควรเป็น', 'เข้าเว็บ A ไม่ได้แต่เว็บ B ได้'], a: [0, 1, 2], why: 'สามข้อแรกคืออาการของสาย หัวต่อ หรือ transceiver ส่วนข้อสุดท้ายเป็นปัญหาที่ชั้นสูงกว่า เช่น DNS หรือ firewall' },
        { type: 'multi', q: 'ข้อใดคือหน้าที่ของ BPDU Guard และ PortFast (เลือกทุกข้อที่ถูก)', opts: ['PortFast ให้พอร์ตของเครื่องผู้ใช้ขึ้นทันทีโดยไม่รอ STP', 'BPDU Guard ปิดพอร์ตทันทีถ้ามีใครเอาสวิตช์มาต่อ', 'ทั้งคู่ใช้เข้ารหัสข้อมูล', 'มักเปิดใช้คู่กันที่พอร์ตของผู้ใช้'], a: [0, 1, 3], why: 'PortFast ทำให้ผู้ใช้ไม่ต้องรอ 30 วินาทีตอนเสียบสาย ส่วน BPDU Guard ป้องกันไม่ให้พอร์ตนั้นถูกใช้ต่อสวิตช์เถื่อนจนทำ topology พัง — จึงต้องเปิดคู่กันเสมอ' },
      ],
      labs: [
        {
          id: 'net-l2-switch',
          title: 'Lab 2A — ตรวจสวิตช์และตั้งพอร์ตผู้ใช้ให้ถูกต้อง',
          brief: 'คุณรับดูแลสวิตช์ประจำชั้นต่อจากคนเก่า งานแรกคือสำรวจว่าพอร์ตไหนใช้อยู่บ้าง สวิตช์ตัวไหนเป็น root bridge แล้วตั้งค่าพอร์ตของผู้ใช้ให้เปิดเร็วและกันคนเอาสวิตช์มาต่อเอง',
          device: 'cisco',
          tasks: [
            { t: 'เข้าสู่ privileged EXEC mode', hint: 'enable', check: s => s.mode !== 'user' },
            { t: 'ดูสถานะพอร์ตทั้งหมดว่าพอร์ตไหน connected', hint: 'show interfaces status', check: (s, h) => said(h, /sh(ow)?\s+int\w*\s+st/i) },
            { t: 'ดูตาราง MAC ที่สวิตช์เรียนรู้ไว้', hint: 'show mac address-table', check: (s, h) => said(h, /sh(ow)?\s+mac/i) },
            { t: 'ดูสถานะ STP ว่าใครเป็น root bridge และพอร์ตไหนถูก block', hint: 'show spanning-tree', check: (s, h) => said(h, /sh(ow)?\s+span/i) },
            { t: 'เข้าโหมด config แล้วเลือกพอร์ต <code>FastEthernet0/1</code>', hint: 'configure terminal → interface FastEthernet0/1', check: s => s.ctx && /FastEthernet0\/1/i.test(JSON.stringify(s.ctx)) },
            { t: 'ใส่ description ให้พอร์ตเป็น <code>PC-Office</code>', hint: 'description PC-Office', check: s => /PC-Office/i.test(ifc(s, 'FastEthernet0/1').desc || '') },
            { t: 'ตั้งพอร์ตเป็น access mode', hint: 'switchport mode access', check: s => ifc(s, 'FastEthernet0/1').swMode === 'access' },
            { t: 'เปิด PortFast ให้พอร์ตขึ้นทันทีโดยไม่ต้องรอ STP', hint: 'spanning-tree portfast', check: s => ifc(s, 'FastEthernet0/1').portfast === true },
            { t: 'เปิด BPDU Guard กันคนเอาสวิตช์มาต่อที่พอร์ตนี้', hint: 'spanning-tree bpduguard enable', check: s => ifc(s, 'FastEthernet0/1').bpduguard === true },
            { t: 'ปิดพอร์ต <code>FastEthernet0/9</code> ที่ไม่ได้ใช้งาน', hint: 'interface FastEthernet0/9 → shutdown', check: s => ifc(s, 'FastEthernet0/9').shutdown === true },
            { t: 'ตรวจ config ที่ได้ทั้งหมด', hint: 'do show running-config', check: (s, h) => said(h, /sh(ow)?\s+run/i) },
          ],
        },
        {
          id: 'net-l2-tshoot',
          title: 'Lab 2B — ไล่ปัญหา "เน็ตใช้ไม่ได้" ตามลำดับ OSI',
          brief: 'ผู้ใช้โทรมาบอกสั้น ๆ ว่า "เน็ตใช้ไม่ได้" คุณต้องไล่จากชั้นล่างขึ้นบนทีละขั้นเพื่อระบุว่าปัญหาอยู่ตรงไหนจริง ๆ แทนการเดาสุ่ม',
          device: 'linux',
          tasks: [
            { t: 'ขั้น 1 — ทดสอบ TCP/IP stack ของเครื่องเอง', hint: 'ping -c 2 127.0.0.1', check: (s, h) => said(h, /ping.*127\.0\.0\.1/i) },
            { t: 'ขั้น 2 — ตรวจว่าการ์ดได้ IP และลิงก์ขึ้นจริง', hint: 'ip addr', check: (s, h) => said(h, /^ip\s+(addr|a)\b/i) },
            { t: 'ขั้น 3 — ตรวจว่ามี default gateway ตั้งไว้', hint: 'ip route', check: (s, h) => said(h, /^ip\s+(route|r)\b/i) },
            { t: 'ขั้น 4 — ทดสอบว่าออกจากวงตัวเองได้ไหม', hint: 'ping -c 2 192.168.10.1', check: (s, h) => said(h, /ping.*192\.168\.10\.1/i) },
            { t: 'ขั้น 5 — ทดสอบว่าออกอินเทอร์เน็ตได้ไหม (ใช้ IP ไม่ใช่ชื่อ)', hint: 'ping -c 2 8.8.8.8', check: (s, h) => said(h, /ping.*8\.8\.8\.8/i) },
            { t: 'ขั้น 6 — ตรวจว่า DNS ตั้งไว้เป็นอะไร', hint: 'cat /etc/resolv.conf', check: (s, h) => said(h, /resolv\.conf/i) },
            { t: 'ขั้น 7 — ทดสอบว่าแปลงชื่อเป็น IP ได้ไหม', hint: 'dig example.com', check: (s, h) => said(h, /^(dig|nslookup|host)\s/i) },
            { t: 'ขั้น 8 — ถ้าออกได้แต่ช้า ให้ดูว่าตายหรือหน่วงที่ hop ไหน', hint: 'traceroute 8.8.8.8', check: (s, h) => said(h, /^(traceroute|tracepath|mtr)\s/i) },
            { t: 'ขั้น 9 — ตรวจ error สะสมที่ interface เผื่อเป็นปัญหาสาย', hint: 'ip -s link show ens33', check: (s, h) => said(h, /ip\s+-s\s+link/i) },
          ],
        },
      ],
    },

    // =========================================================
    3: {
      title: 'IPv4, IPv6 และ Routing',
      objectives: [
        'แบ่ง subnet และคำนวณช่วง IP ที่ใช้ได้จริงโดยไม่ต้องเปิดตาราง',
        'ใช้เครื่องมือตรวจ IP ไล่ปัญหาได้ทีละชั้นอย่างมีลำดับ',
        'อ่านและย่อ IPv6 address พร้อมบอกชนิดของแต่ละช่วง',
        'อธิบายหลักการ routing และเลือกใช้ static กับ dynamic ให้เหมาะกับงาน',
      ],
      sections: [
        {
          t: 'Lesson 5 — IPv4 Addressing และการแบ่ง Subnet',
          h: `
<p>IPv4 คือเลข 32 บิต แบ่งเป็น 4 ไบต์ ส่วนหน้าคือ <b>network</b> ส่วนหลังคือ <b>host</b>
เส้นแบ่งอยู่ตรงไหนบอกด้วย <b>subnet mask</b></p>
<table class="tbl">
<tr><th>Class</th><th>ช่วงไบต์แรก</th><th>Mask เดิม</th><th>หมายเหตุ</th></tr>
<tr><td>A</td><td>1–126</td><td>/8</td><td>127 สงวนไว้เป็น loopback</td></tr>
<tr><td>B</td><td>128–191</td><td>/16</td><td>—</td></tr>
<tr><td>C</td><td>192–223</td><td>/24</td><td>—</td></tr>
<tr><td>D</td><td>224–239</td><td>—</td><td><b>Multicast</b></td></tr>
<tr><td>E</td><td>240–255</td><td>—</td><td>สงวนไว้ทดลอง</td></tr>
</table>
<div class="note"><b>ปัจจุบันใช้ CIDR ไม่ใช่ class</b> — แต่ข้อสอบยังถามเรื่อง class อยู่
CIDR ทำให้กำหนดขนาดวงได้อิสระ เช่น <code>/26</code> หรือ <code>/30</code> ไม่ต้องผูกกับ /8, /16, /24</div>
<p><b>สูตรที่ต้องจำแค่สองบรรทัด</b></p>
<table class="tbl">
<tr><th>ต้องการ</th><th>สูตร</th></tr>
<tr><td>จำนวน host ที่ใช้ได้</td><td><b>2<sup>(32−prefix)</sup> − 2</b> (ลบ network กับ broadcast)</td></tr>
<tr><td>จำนวน subnet ที่แบ่งได้</td><td>2<sup>(จำนวนบิตที่ยืมมา)</sup></td></tr>
</table>
<table class="tbl">
<tr><th>Prefix</th><th>Subnet mask</th><th>ขนาดบล็อก</th><th>Host ที่ใช้ได้</th></tr>
<tr><td>/24</td><td>255.255.255.0</td><td>256</td><td>254</td></tr>
<tr><td>/25</td><td>255.255.255.128</td><td>128</td><td>126</td></tr>
<tr><td>/26</td><td>255.255.255.192</td><td>64</td><td>62</td></tr>
<tr><td>/27</td><td>255.255.255.224</td><td>32</td><td>30</td></tr>
<tr><td>/28</td><td>255.255.255.240</td><td>16</td><td>14</td></tr>
<tr><td>/30</td><td>255.255.255.252</td><td>4</td><td><b>2</b> — ใช้เชื่อม router ต่อ router</td></tr>
<tr><td>/31</td><td>255.255.255.254</td><td>2</td><td>2 (กรณีพิเศษสำหรับลิงก์ point-to-point)</td></tr>
<tr><td>/32</td><td>255.255.255.255</td><td>1</td><td>1 — ใช้ระบุเครื่องเดียว</td></tr>
</table>
<div class="note"><b>วิธีคิดเร็วโดยไม่ต้องแปลงเลขฐานสอง</b><br>
<code>192.168.10.100/26</code> → ขนาดบล็อก = 256 − 192 = <b>64</b><br>
ขอบเขตจึงเป็น 0, 64, 128, 192 → เลข 100 ตกอยู่ในบล็อก <b>64</b><br>
network = <b>192.168.10.64</b> · broadcast = <b>192.168.10.127</b> · host ที่ใช้ได้ = <b>.65 ถึง .126</b></div>
<p><b>IPv4 Forwarding</b> — เครื่องตัดสินใจอย่างไรว่าจะส่งตรงหรือส่งผ่าน gateway</p>
<ol>
  <li>เอา IP ปลายทาง AND กับ subnet mask ของตัวเอง</li>
  <li>ได้ network เดียวกับตัวเอง → <b>ส่งตรง</b> (หา MAC ด้วย ARP)</li>
  <li>คนละ network → <b>ส่งให้ default gateway</b></li>
</ol>
<div class="note warn"><b>เหตุผลที่ subnet mask ผิดแล้วอาการประหลาด</b> — เครื่องจะเข้าใจผิดว่าปลายทางอยู่วงเดียวกัน
แล้วพยายาม ARP หาโดยตรงแทนที่จะส่งให้ gateway ผลคือ<b>คุยกับบางเครื่องได้ บางเครื่องไม่ได้</b> ทั้งที่ IP ดูถูกต้อง</div>`,
        },
        {
          t: 'Lesson 6 — เครื่องมือตรวจสอบและไล่ปัญหา IP',
          h: `
<table class="tbl">
<tr><th>เครื่องมือ</th><th>ตอบคำถามว่า</th><th>Linux / Windows</th></tr>
<tr><td><b>ipconfig / ip addr</b></td><td>เครื่องเราได้ IP อะไร mask เท่าไหร่ gateway ใคร</td><td><code>ip addr</code> / <code>ipconfig /all</code></td></tr>
<tr><td><b>ping</b></td><td>ถึงปลายทางไหม ใช้เวลาเท่าไหร่</td><td><code>ping</code> ทั้งคู่</td></tr>
<tr><td><b>traceroute / tracert</b></td><td>ไปตายที่ hop ไหน</td><td><code>traceroute</code> / <code>tracert</code></td></tr>
<tr><td><b>arp</b></td><td>ในวงนี้ IP ไหนคู่กับ MAC ไหน</td><td><code>ip neigh</code> / <code>arp -a</code></td></tr>
<tr><td><b>nslookup / dig</b></td><td>DNS ตอบว่าอะไร</td><td><code>dig</code> / <code>nslookup</code></td></tr>
<tr><td><b>netstat / ss</b></td><td>เครื่องเราเปิดพอร์ตอะไร ต่อกับใครอยู่</td><td><code>ss -tulpn</code> / <code>netstat -ano</code></td></tr>
<tr><td><b>route</b></td><td>ตารางเส้นทางของเครื่อง</td><td><code>ip route</code> / <code>route print</code></td></tr>
<tr><td><b>tcpdump / Wireshark</b></td><td>จริง ๆ แล้วมีอะไรวิ่งอยู่บนสาย</td><td>ตัวตัดสินขั้นสุดท้าย</td></tr>
</table>
<div class="note"><b>ลำดับ ping ที่ใช้แยกปัญหาได้เร็วที่สุด</b><br>
1. <code>ping 127.0.0.1</code> — TCP/IP stack ของเครื่องเองยังดีไหม<br>
2. <code>ping</code> IP ตัวเอง — การ์ดเครือข่ายทำงานไหม<br>
3. <code>ping</code> gateway — ออกจากวงตัวเองได้ไหม (ถ้าไม่ได้ ปัญหาอยู่ในวง: สาย, VLAN, mask)<br>
4. <code>ping 8.8.8.8</code> — ออกอินเทอร์เน็ตได้ไหม (ถ้าได้แต่ข้อ 5 ไม่ได้ = <b>ปัญหา DNS ชัดเจน</b>)<br>
5. <code>ping google.com</code> — ชื่อแปลงเป็น IP ได้ไหม</div>
<p><b>ปัญหา IP ที่พบบ่อยและอาการ</b></p>
<table class="tbl">
<tr><th>ปัญหา</th><th>อาการ</th></tr>
<tr><td><b>IP ซ้ำกัน</b></td><td>เน็ตติด ๆ ดับ ๆ สลับกันสองเครื่อง · ระบบเตือน address conflict</td></tr>
<tr><td><b>Subnet mask ผิด</b></td><td>คุยกับบางเครื่องได้ บางเครื่องไม่ได้</td></tr>
<tr><td><b>Gateway ผิด/ไม่มี</b></td><td>ในวงคุยกันได้หมด แต่ออกนอกวงไม่ได้เลย</td></tr>
<tr><td><b>DNS ผิด</b></td><td>ping IP ได้ แต่ ping ชื่อไม่ได้</td></tr>
<tr><td><b>APIPA (169.254.x.x)</b></td><td>หา DHCP ไม่เจอ</td></tr>
<tr><td><b>VLAN ผิดที่พอร์ต</b></td><td>ได้ IP ผิดวง หรือไม่ได้ IP เลย</td></tr>
</table>`,
        },
        {
          t: 'Lesson 6 — IPv6 Addressing',
          h: `
<p>IPv6 คือเลข <b>128 บิต</b> เขียนเป็นเลขฐาน 16 แปดกลุ่ม คั่นด้วย <code>:</code></p>
<pre class="code">2001:0db8:0000:0000:0000:ff00:0042:8329
<span style="color:#5b6b8c"># ย่อได้สองแบบ</span>
2001:db8:0:0:0:ff00:42:8329      <span style="color:#5b6b8c"># 1) ตัดศูนย์นำหน้าของแต่ละกลุ่ม</span>
2001:db8::ff00:42:8329            <span style="color:#5b6b8c"># 2) ยุบกลุ่มศูนย์ติดกันเป็น :: (ใช้ได้ครั้งเดียวต่อหนึ่ง address)</span></pre>
<table class="tbl">
<tr><th>ช่วง</th><th>ชนิด</th><th>เทียบกับ IPv4</th></tr>
<tr><td><code>2000::/3</code></td><td><b>Global unicast</b></td><td>IP จริงที่ route บนอินเทอร์เน็ตได้</td></tr>
<tr><td><code>fe80::/10</code></td><td><b>Link-local</b></td><td>คล้าย APIPA — <b>ทุก interface มีเสมอ</b> ใช้คุยกันในวงเดียวกัน</td></tr>
<tr><td><code>fc00::/7</code></td><td>Unique local (ULA)</td><td>คล้าย RFC 1918</td></tr>
<tr><td><code>ff00::/8</code></td><td>Multicast</td><td>เหมือน class D</td></tr>
<tr><td><code>::1</code></td><td>Loopback</td><td>127.0.0.1</td></tr>
</table>
<table class="tbl">
<tr><th>สิ่งที่ IPv6 เปลี่ยนไป</th><th>รายละเอียด</th></tr>
<tr><td><b>ไม่มี broadcast</b></td><td>ใช้ multicast แทนทั้งหมด</td></tr>
<tr><td><b>ไม่มี ARP</b></td><td>ใช้ <b>NDP</b> (Neighbor Discovery Protocol) ผ่าน ICMPv6</td></tr>
<tr><td><b>SLAAC</b></td><td>เครื่องตั้ง IP ให้ตัวเองจาก prefix ที่ router ประกาศมา โดยไม่ต้องมี DHCP</td></tr>
<tr><td><b>ไม่ต้องใช้ NAT</b></td><td>มี address พอสำหรับทุกอุปกรณ์ — ความปลอดภัยต้องพึ่ง firewall ไม่ใช่ NAT</td></tr>
<tr><td>prefix มาตรฐาน</td><td><b>/64</b> สำหรับหนึ่งวง LAN เสมอ</td></tr>
</table>
<div class="note"><b>วิธีอยู่ร่วมกันของ IPv4 กับ IPv6</b> —
<b>Dual stack</b> รันทั้งสองพร้อมกัน (วิธีที่นิยมและแนะนำที่สุด) ·
<b>Tunneling</b> ห่อ IPv6 ไว้ใน IPv4 เพื่อข้ามเครือข่ายที่ยังไม่รองรับ ·
<b>NAT64 / DNS64</b> ให้เครื่อง IPv6 คุยกับปลายทางที่ยังเป็น IPv4 ได้</div>`,
        },
        {
          t: 'Lesson 7 — Routing: หลักการและ Static Routing',
          h: `
<p>Router ตัดสินใจจาก <b>routing table</b> โดยใช้กฎเดียว: <b>Longest Prefix Match</b> — เส้นทางที่เจาะจงกว่าชนะเสมอ</p>
<pre class="code">ip route
<span style="color:#5b6b8c">default via 192.168.1.1 dev ens33          ← 0.0.0.0/0 ที่ไหนก็ตามที่เหลือ</span>
<span style="color:#5b6b8c">10.20.0.0/16 via 192.168.1.254 dev ens33   ← เส้นทางเจาะจง</span>
<span style="color:#5b6b8c">192.168.1.0/24 dev ens33 proto kernel      ← connected เกิดเองจากการมี IP</span></pre>
<table class="tbl">
<tr><th>ที่มาของเส้นทาง</th><th>เกิดขึ้นอย่างไร</th></tr>
<tr><td><b>Connected</b></td><td>เกิดเองทันทีที่ใส่ IP ให้ interface</td></tr>
<tr><td><b>Static</b></td><td>เราพิมพ์เอง — คุมได้แน่นอน แต่ไม่ปรับตัวเมื่อเส้นทางล่ม</td></tr>
<tr><td><b>Default route</b></td><td><code>0.0.0.0/0</code> — "ไม่รู้จะไปไหน ส่งทางนี้"</td></tr>
<tr><td><b>Dynamic</b></td><td>routing protocol คุยกันเองแล้วสร้างให้</td></tr>
</table>
<table class="tbl">
<tr><th>ค่าที่ใช้ตัดสิน</th><th>ความหมาย</th></tr>
<tr><td><b>Administrative Distance</b></td><td>ความน่าเชื่อถือของ<b>แหล่งที่มา</b> — ยิ่งน้อยยิ่งชนะ (connected 0 · static 1 · OSPF 110 · RIP 120)</td></tr>
<tr><td><b>Metric</b></td><td>ใช้เลือกภายในโปรโตคอลเดียวกัน — RIP นับ hop · OSPF ใช้ cost จากแบนด์วิดท์</td></tr>
</table>
<div class="note warn"><b>ปัญหา static route ที่พบบ่อยที่สุด</b> — ใส่ gateway เป็น IP ที่ router ไปไม่ถึงโดยตรง
เส้นทางนั้นจะไม่ถูกใช้งานเลย · และอย่าลืมว่า<b>เส้นทางต้องมีทั้งไปและกลับ</b>
ปลายทางที่ไม่มี route กลับมาหาเรา จะทำให้ ping ไม่ตอบทั้งที่ขาไปถึงแล้ว</div>`,
        },
        {
          t: 'Lesson 7 — Dynamic Routing และการไล่ปัญหา Router',
          h: `
<table class="tbl">
<tr><th>โปรโตคอล</th><th>ประเภท</th><th>ใช้ที่ไหน</th><th>จุดเด่น / ข้อจำกัด</th></tr>
<tr><td><b>RIP</b></td><td>Distance vector</td><td>วงเล็กมาก</td><td>ง่าย แต่จำกัด 15 hop และปรับตัวช้า</td></tr>
<tr><td><b>OSPF</b></td><td><b>Link state</b></td><td>ภายในองค์กร (IGP)</td><td>ปรับตัวเร็ว รองรับวงใหญ่ แบ่ง area ได้ · <b>เปิดมาตรฐาน ใช้ได้ทุกยี่ห้อ</b></td></tr>
<tr><td><b>EIGRP</b></td><td>Hybrid</td><td>ภายในองค์กร</td><td>ปรับตัวเร็วมาก — เดิมเป็นของ Cisco</td></tr>
<tr><td><b>BGP</b></td><td>Path vector</td><td><b>ระหว่างองค์กร (EGP)</b></td><td>โปรโตคอลที่ยึดอินเทอร์เน็ตไว้ทั้งใบ · ช้าแต่คุม policy ได้ละเอียด</td></tr>
</table>
<table class="tbl">
<tr><th></th><th>Static</th><th>Dynamic</th></tr>
<tr><td>ปรับตัวเมื่อเส้นทางล่ม</td><td>ไม่ได้</td><td>ได้เอง</td></tr>
<tr><td>ภาระ CPU / แบนด์วิดท์</td><td>ไม่มี</td><td>มี</td></tr>
<tr><td>เหมาะกับ</td><td>วงเล็ก, ทางออกทางเดียว, ลิงก์ที่ต้องคุมเอง</td><td>วงใหญ่, มีหลายเส้นทาง, ต้องการ failover อัตโนมัติ</td></tr>
</table>
<p><b>แนวคิดที่เกี่ยวข้อง</b></p>
<ul>
  <li><b>NAT / PAT</b> — แปลง IP ภายในให้เป็น IP จริงตอนออกเน็ต · PAT ใช้หมายเลขพอร์ตแยกว่าเป็นของเครื่องไหน จึงใช้ IP จริงเบอร์เดียวได้ทั้งออฟฟิศ</li>
  <li><b>FHRP</b> (VRRP / HSRP) — router สองตัวแชร์ IP gateway เสมือนเดียวกัน ตัวหนึ่งล่มอีกตัวรับช่วงทันทีโดยเครื่องลูกไม่รู้ตัว</li>
  <li><b>Route redistribution</b> — เอาเส้นทางจากโปรโตคอลหนึ่งไปประกาศในอีกโปรโตคอล</li>
</ul>
<div class="note"><b>ไล่ปัญหา router ตามลำดับนี้</b><br>
1. interface ขึ้นไหม (<code>ip link</code>) → 2. IP และ mask ถูกไหม → 3. มี route ไปปลายทางไหม (<code>ip route</code>) →
4. <b>ปลายทางมี route กลับมาไหม</b> → 5. ระหว่างทางมี firewall/ACL บล็อกหรือเปล่า → 6. <code>traceroute</code> ดูว่าตายที่ hop ไหน</div>`,
        },
      ],
      quiz: [
        { type: 'mcq', q: 'เครือข่าย <code>192.168.10.0/26</code> มี host ที่ใช้งานได้กี่เบอร์', opts: ['64', '62', '30', '126'], a: 1, why: '2^(32−26) = 64 เบอร์ในบล็อก แล้วหักเบอร์ network กับ broadcast ออก เหลือใช้จริง 62 — สูตรคือ 2^(32−prefix) − 2 เสมอ' },
        { type: 'mcq', q: 'IP <code>192.168.10.100/26</code> อยู่ใน subnet ใด', opts: ['192.168.10.0', '192.168.10.64', '192.168.10.96', '192.168.10.128'], a: 1, why: 'ขนาดบล็อกของ /26 คือ 256−192 = 64 ขอบเขตจึงเป็น 0, 64, 128, 192 — เลข 100 ตกในบล็อก 64 (ใช้ได้ .65 ถึง .126 และ broadcast คือ .127)' },
        { type: 'mcq', q: 'ต้องการเชื่อม router สองตัวแบบ point-to-point ควรใช้ prefix ใดจึงประหยัด IP ที่สุด', opts: ['/24', '/29', '/30', '/32'], a: 2, why: '/30 ให้ host ใช้ได้ 2 เบอร์พอดีสำหรับสองฝั่ง — /29 เหลือทิ้ง 4 เบอร์ ส่วน /32 ใช้ระบุเครื่องเดียวจึงไม่พอสำหรับลิงก์สองฝั่ง' },
        { type: 'mcq', q: 'ผู้ใช้ ping IP ปลายทางได้แต่ ping ชื่อโดเมนไม่ได้ ปัญหาอยู่ที่ใด', opts: ['สายสัญญาณ', 'Default gateway', 'DNS', 'Subnet mask'], a: 2, why: 'ping IP ผ่านแปลว่าเส้นทางชั้น 1–3 ดีอยู่แล้ว สิ่งที่เหลือคือขั้นตอนแปลงชื่อเป็น IP ซึ่งเป็นหน้าที่ของ DNS ล้วน ๆ' },
        { type: 'mcq', q: 'เครื่องคุยกันได้ในวงเดียวกันหมด แต่ออกอินเทอร์เน็ตไม่ได้เลย ควรตรวจอะไรก่อน', opts: ['สาย LAN', 'Default gateway', 'MAC address', 'STP'], a: 1, why: 'คุยในวงได้แปลว่าชั้น 1 และ 2 ปกติ แต่การออกนอกวงต้องอาศัย default gateway — ตรวจว่าตั้งไว้ถูกและ ping ถึงหรือไม่' },
        { type: 'mcq', q: 'ย่อ <code>2001:0db8:0000:0000:0000:ff00:0042:8329</code> ให้สั้นที่สุดได้เป็นข้อใด', opts: ['2001:db8::ff00:42:8329', '2001:db8:0:0:0:ff00:42:8329', '2001::db8::ff00:42:8329', '2001:0db8::ff00:0042:8329'], a: 0, why: 'ตัดศูนย์นำหน้าของแต่ละกลุ่มได้ และยุบกลุ่มศูนย์ที่ติดกันด้วย :: ได้ — แต่ใช้ :: ได้เพียงครั้งเดียวต่อหนึ่ง address ไม่งั้นจะตีความกลับไม่ได้' },
        { type: 'mcq', q: 'IPv6 ช่วง <code>fe80::/10</code> คืออะไร', opts: ['Global unicast ที่ route บนอินเทอร์เน็ตได้', 'Link-local — ใช้ได้เฉพาะในวงเดียวกัน และทุก interface มีเสมอ', 'Multicast', 'Loopback'], a: 1, why: 'link-local เทียบได้กับ APIPA ของ IPv4 แต่ต่างกันตรงที่ IPv6 สร้างให้ทุก interface เสมอแม้จะมี global address อยู่แล้ว และ NDP ก็ทำงานผ่านช่วงนี้' },
        { type: 'mcq', q: 'IPv6 ใช้อะไรแทน ARP', opts: ['DHCP', 'NDP ผ่าน ICMPv6', 'DNS', 'RARP'], a: 1, why: 'IPv6 ไม่มี broadcast จึงไม่มี ARP — ใช้ Neighbor Discovery Protocol ที่ทำงานบน ICMPv6 และใช้ multicast แทน ซึ่งรบกวนเครื่องอื่นน้อยกว่ามาก' },
        { type: 'mcq', q: 'มีทั้ง static route และ OSPF ชี้ไปปลายทางเดียวกัน router จะเลือกเส้นใด', opts: ['OSPF เพราะเป็น dynamic', 'Static เพราะ administrative distance ต่ำกว่า', 'เลือกสุ่ม', 'ใช้ทั้งสองพร้อมกัน'], a: 1, why: 'AD ของ static คือ 1 ส่วน OSPF คือ 110 — ยิ่งน้อยยิ่งน่าเชื่อถือกว่า จึงชนะ (metric ใช้เปรียบเทียบเฉพาะภายในโปรโตคอลเดียวกันเท่านั้น)' },
        { type: 'mcq', q: 'โปรโตคอลใดใช้เชื่อมเส้นทางระหว่างองค์กรบนอินเทอร์เน็ต', opts: ['RIP', 'OSPF', 'EIGRP', 'BGP'], a: 3, why: 'BGP เป็น EGP ตัวเดียวที่ใช้จริงบนอินเทอร์เน็ต ส่วน RIP, OSPF และ EIGRP เป็น IGP ที่ใช้ภายในองค์กร' },
        { type: 'mcq', q: 'ต้องการให้ gateway ยังใช้งานได้แม้ router ตัวหลักล่ม ควรใช้อะไร', opts: ['STP', 'FHRP เช่น VRRP หรือ HSRP', 'NAT', 'DHCP relay'], a: 1, why: 'FHRP ให้ router สองตัวแชร์ IP เสมือนเดียวกัน เครื่องลูกชี้ไปที่ IP นั้นตลอด เมื่อตัวหลักล่มตัวสำรองรับช่วงทันทีโดยไม่ต้องเปลี่ยนค่าที่เครื่องลูกเลย' },
        { type: 'cmd', q: 'พิมพ์คำสั่งบน Linux เพื่อดูตารางเส้นทางของเครื่อง', ans: ['ip route', 'ip r', 'ip route show', 'route -n', 'netstat -rn'], why: 'ต้องดูว่ามี default route ไหมและปลายทางที่ต้องการมีเส้นทางหรือเปล่า — บน Windows ใช้ route print' },
        { type: 'cmd', q: 'พิมพ์คำสั่งบน Linux เพื่อไล่ดูว่าเส้นทางไป <code>8.8.8.8</code> ตายที่ hop ไหน', ans: ['traceroute 8.8.8.8', 'tracepath 8.8.8.8', 'mtr 8.8.8.8'], why: 'traceroute แสดงทีละ hop ทำให้บอกได้ว่าปัญหาอยู่ในเครือข่ายเราหรือที่ผู้ให้บริการ — บน Windows ใช้ tracert' },
        { type: 'multi', q: 'ข้อใดคืออาการของ subnet mask ที่ตั้งผิด (เลือกทุกข้อที่ถูก)', opts: ['คุยกับบางเครื่องในวงได้ บางเครื่องไม่ได้', 'เครื่องพยายาม ARP หาปลายทางที่จริง ๆ อยู่คนละวง', 'ping loopback ไม่ผ่าน', 'อาจออกอินเทอร์เน็ตไม่ได้เพราะคิดว่า gateway อยู่คนละวง'], a: [0, 1, 3], why: 'ping 127.0.0.1 ไม่ผ่านเป็นปัญหาที่ TCP/IP stack ของเครื่องเอง ไม่เกี่ยวกับ mask — ส่วนอีกสามข้อเกิดจากเครื่องคำนวณขอบเขตวงผิด' },
      ],
      labs: [
        {
          id: 'net-l3-subnet',
          title: 'Lab 3A — แบ่ง Subnet ให้สามแผนกแล้วตั้งเส้นทาง',
          brief: 'ออฟฟิศได้วง <code>192.168.10.0/24</code> มาก้อนเดียว ต้องแบ่งเป็นสามแผนกด้วย /26 แล้วตั้ง IP ให้เครื่องนี้อยู่ในแผนกที่สอง พร้อมวางเส้นทางไปวงสาขา',
          device: 'linux',
          tasks: [
            { t: 'ดู IP ปัจจุบันของเครื่องก่อนแก้อะไร', hint: 'ip addr', check: (s, h) => said(h, /^ip\s+(addr|a)\b/i) },
            { t: 'ใส่ IP <code>192.168.10.65/26</code> ให้ <code>ens33</code> (แผนกที่สอง เริ่มที่ .64)', hint: 'sudo ip addr add 192.168.10.65/26 dev ens33', check: s => ifc(s, 'ens33').ip === '192.168.10.65' && +ifc(s, 'ens33').prefix === 26 },
            { t: 'ยืนยันว่า IP และ prefix ถูกตั้งจริง', hint: 'ip addr show ens33', check: (s, h) => said(h, /^(sudo\s+)?ip\s+(addr|a)\s+show\s+ens33/i) },
            { t: 'เปิดใช้งาน interface ให้แน่ใจว่าลิงก์ขึ้น', hint: 'sudo ip link set ens33 up', check: (s, h) => said(h, /ip\s+link\s+set\s+ens33\s+up/i) },
            { t: 'เพิ่มเส้นทางไปวงสาขา <code>10.20.0.0/16</code> ผ่าน <code>192.168.10.254</code>', hint: 'sudo ip route add 10.20.0.0/16 via 192.168.10.254', check: (s, h) => said(h, /ip\s+route\s+add\s+10\.20\.0\.0\/16\s+via\s+192\.168\.10\.254/i) },
            { t: 'เพิ่ม default route ผ่าน <code>192.168.10.1</code>', hint: 'sudo ip route add default via 192.168.10.1', check: (s, h) => said(h, /ip\s+route\s+add\s+default\s+via/i) },
            { t: 'ตรวจตารางเส้นทางที่ได้', hint: 'ip route', check: (s, h) => said(h, /^ip\s+(route|r)\s*$/i) },
            { t: 'ทดสอบว่าถึง gateway', hint: 'ping -c 2 192.168.10.1', check: (s, h) => said(h, /ping.*192\.168\.10\.1/i) },
            { t: 'ไล่ดูเส้นทางออกอินเทอร์เน็ต', hint: 'traceroute 8.8.8.8', check: (s, h) => said(h, /^(traceroute|tracepath|mtr)\s/i) },
          ],
        },
        {
          id: 'net-l3-ipv6',
          title: 'Lab 3B — ทำความรู้จัก IPv6 บนเครื่องจริง',
          brief: 'องค์กรกำลังจะเปิดใช้ IPv6 แบบ dual stack คุณต้องสำรวจว่าเครื่องมี address IPv6 อะไรอยู่แล้วบ้าง เพิ่ม global address และตรวจว่าทำงานได้',
          device: 'linux',
          tasks: [
            { t: 'ดู IPv6 address ทั้งหมดของเครื่อง', hint: 'ip -6 addr', check: (s, h) => said(h, /ip\s+-6\s+(addr|a)\b/i) },
            { t: 'สังเกตว่ามี link-local ขึ้นต้นด้วย <code>fe80::</code> อยู่แล้วทุก interface', hint: 'ip -6 addr show ens33', check: (s, h) => said(h, /ip\s+-6\s+(addr|a).*ens33/i) },
            { t: 'ทดสอบ loopback ของ IPv6', hint: 'ping6 -c 2 ::1', check: (s, h) => said(h, /ping6?.*::1/i) },
            { t: 'เพิ่ม global address <code>2001:db8::10/64</code> ให้ <code>ens33</code>', hint: 'sudo ip addr add 2001:db8::10/64 dev ens33', check: s => (ifc(s, 'ens33').ip6 || []).some(x => x.ip === '2001:db8::10' && +x.prefix === 64) },
            { t: 'ดูตารางเส้นทาง IPv6', hint: 'ip -6 route', check: (s, h) => said(h, /ip\s+-6\s+(route|r)\b/i) },
            { t: 'ถาม DNS หา AAAA record ของโดเมน', hint: 'dig AAAA example.com', check: (s, h) => said(h, /dig.*aaaa|aaaa.*example/i) },
            { t: 'ดูตาราง neighbor (สิ่งที่ IPv6 ใช้แทน ARP)', hint: 'ip -6 neigh', check: (s, h) => said(h, /ip\s+(-6\s+)?neigh/i) },
          ],
        },
      ],
    },

    // =========================================================
    4: {
      title: 'โครงสร้างเครือข่าย, Transport และ Network Services',
      objectives: [
        'แยกประเภทเครือข่ายตามขนาดและบอกโครงสร้างแบบเป็นชั้นได้',
        'ออกแบบ VLAN และอธิบาย trunk, native VLAN และ inter-VLAN routing',
        'เปรียบเทียบ TCP กับ UDP และจำพอร์ตสำคัญได้',
        'อธิบายการทำงานของ DHCP และ DNS พร้อมไล่ปัญหาที่พบบ่อย',
      ],
      sections: [
        {
          t: 'Lesson 8 — ประเภทของเครือข่ายและโครงสร้างแบบเป็นชั้น',
          h: `
<table class="tbl">
<tr><th>ชนิด</th><th>ขอบเขต</th><th>ตัวอย่าง</th></tr>
<tr><td><b>PAN</b></td><td>รอบตัวคน</td><td>Bluetooth, NFC</td></tr>
<tr><td><b>LAN</b></td><td>อาคารเดียว</td><td>ออฟฟิศ, บ้าน</td></tr>
<tr><td><b>WLAN</b></td><td>LAN แบบไร้สาย</td><td>Wi-Fi</td></tr>
<tr><td><b>CAN</b></td><td>กลุ่มอาคารในพื้นที่เดียวกัน</td><td>มหาวิทยาลัย, นิคมอุตสาหกรรม</td></tr>
<tr><td><b>MAN</b></td><td>ทั้งเมือง</td><td>เครือข่ายเทศบาล</td></tr>
<tr><td><b>WAN</b></td><td>ข้ามเมืองหรือข้ามประเทศ</td><td>อินเทอร์เน็ต, MPLS เชื่อมสาขา</td></tr>
<tr><td><b>SAN</b></td><td>เครือข่ายเฉพาะสำหรับ storage</td><td>Fibre Channel, iSCSI</td></tr>
</table>
<table class="tbl">
<tr><th>Topology</th><th>ลักษณะ</th><th>ข้อสังเกต</th></tr>
<tr><td><b>Star</b></td><td>ทุกเครื่องต่อเข้าอุปกรณ์กลาง</td><td><b>ที่ใช้จริงเกือบทั้งหมดในปัจจุบัน</b> — จุดอ่อนคืออุปกรณ์กลาง</td></tr>
<tr><td>Mesh</td><td>ทุกจุดต่อถึงกัน</td><td>ทนทานที่สุด แต่แพงและซับซ้อน · full vs partial mesh</td></tr>
<tr><td>Bus / Ring</td><td>ต่อเรียงกัน / ต่อเป็นวง</td><td>ของเก่า — ยังพบในระบบอุตสาหกรรมบางแบบ</td></tr>
<tr><td>Hybrid</td><td>ผสมกัน</td><td>องค์กรจริงส่วนใหญ่เป็นแบบนี้</td></tr>
</table>
<p><b>Tiered switching architecture — โครงสร้างแบบสามชั้น</b></p>
<table class="tbl">
<tr><th>ชั้น</th><th>หน้าที่</th></tr>
<tr><td><b>Access</b></td><td>ที่ที่ผู้ใช้เสียบสาย — PoE, port security, VLAN assignment</td></tr>
<tr><td><b>Distribution</b></td><td>รวม access หลายตัว ทำ inter-VLAN routing และบังคับ policy</td></tr>
<tr><td><b>Core</b></td><td>แกนกลางที่เน้นความเร็วอย่างเดียว — <b>ไม่ควรมีอะไรมาถ่วง</b></td></tr>
</table>
<div class="note"><b>ในศูนย์ข้อมูลสมัยใหม่นิยม Spine-Leaf แทน</b> เพราะ traffic ส่วนใหญ่วิ่ง<b>ระหว่างเซิร์ฟเวอร์ด้วยกัน</b> (east-west)
ไม่ใช่เข้าออกจากภายนอก — ทุก leaf ต่อกับทุก spine ทำให้ทุกเส้นทางมีจำนวน hop เท่ากันและคาดเดาได้</div>`,
        },
        {
          t: 'Lesson 8 — Virtual LANs (VLAN)',
          h: `
<p><b>VLAN แบ่ง broadcast domain ด้วยซอฟต์แวร์</b> — สวิตช์ตัวเดียวทำตัวเหมือนเป็นหลายตัวแยกกัน
เครื่องที่อยู่คนละ VLAN จะคุยกันไม่ได้เลยจนกว่าจะมี router มาเชื่อม</p>
<table class="tbl">
<tr><th>ได้อะไร</th><th>รายละเอียด</th></tr>
<tr><td><b>ความปลอดภัย</b></td><td>แยกกล้องวงจรปิด, เครื่องผู้ใช้, เซิร์ฟเวอร์ และ guest ออกจากกัน</td></tr>
<tr><td><b>ลด broadcast</b></td><td>วงเล็กลง broadcast น้อยลง ประสิทธิภาพดีขึ้น</td></tr>
<tr><td><b>ยืดหยุ่น</b></td><td>ย้ายคนข้ามแผนกโดยไม่ต้องเดินสายใหม่</td></tr>
</table>
<table class="tbl">
<tr><th>ชนิดพอร์ต</th><th>ใช้ตอนไหน</th></tr>
<tr><td><b>Access port</b></td><td>ต่อเครื่องปลายทาง — อยู่ได้ VLAN เดียว ส่งเฟรมออกไปแบบ<b>ไม่มีแท็ก</b></td></tr>
<tr><td><b>Trunk port</b></td><td>เชื่อมสวิตช์ต่อสวิตช์ หรือต่อ router/AP — ส่งได้<b>หลาย VLAN</b> โดยติดแท็ก <b>802.1Q</b></td></tr>
</table>
<div class="note warn"><b>Native VLAN</b> คือ VLAN ที่ส่งผ่าน trunk แบบ<b>ไม่ติดแท็ก</b>
ค่าเริ่มต้นคือ VLAN 1 ซึ่งเป็นความเสี่ยงด้านความปลอดภัย (VLAN hopping)
งานจริงควร<b>เปลี่ยน native VLAN เป็นเลขที่ไม่ได้ใช้งานจริง</b> และ<b>ห้ามใช้ VLAN 1 กับผู้ใช้</b><br>
ถ้า native VLAN ที่สองฝั่งของ trunk ไม่ตรงกัน traffic จะรั่วข้าม VLAN โดยไม่ตั้งใจ</div>
<p><b>Inter-VLAN routing</b> — ทำได้สองแบบ</p>
<table class="tbl">
<tr><th>วิธี</th><th>ลักษณะ</th></tr>
<tr><td><b>Router-on-a-stick</b></td><td>สายเส้นเดียวไป router แล้วแบ่ง sub-interface ตาม VLAN — ถูก แต่แบนด์วิดท์รวมจำกัดที่สายเส้นนั้น</td></tr>
<tr><td><b>Layer 3 switch (SVI)</b></td><td>สวิตช์ route เองด้วยฮาร์ดแวร์ — <b>เร็วกว่ามาก</b> และเป็นวิธีมาตรฐานในองค์กร</td></tr>
</table>
<p><b>Voice VLAN</b> — พอร์ตเดียวรับทั้งโทรศัพท์ IP (VLAN เสียง มีแท็ก) และคอมพิวเตอร์ที่เสียบต่อหลังโทรศัพท์ (VLAN ข้อมูล ไม่มีแท็ก)</p>`,
        },
        {
          t: 'Lesson 9 — Transport Layer และพอร์ตที่ต้องจำ',
          h: `
<table class="tbl">
<tr><th></th><th>TCP</th><th>UDP</th></tr>
<tr><td>การเชื่อมต่อ</td><td>สร้าง session ก่อน (<b>three-way handshake</b>: SYN → SYN/ACK → ACK)</td><td>ยิงเลย ไม่ถามใคร</td></tr>
<tr><td>ความน่าเชื่อถือ</td><td>ตรวจสอบและส่งซ้ำถ้าหาย เรียงลำดับให้</td><td>ไม่รับประกัน หายก็หายเลย</td></tr>
<tr><td>ความเร็ว / overhead</td><td>ช้ากว่า หัวข้อมูลใหญ่กว่า</td><td>เร็วกว่า เบากว่า</td></tr>
<tr><td>เหมาะกับ</td><td>เว็บ, อีเมล, โอนไฟล์ — ข้อมูลต้องครบ</td><td>เสียง, วิดีโอสด, DNS, DHCP — ช้าดีกว่าสะดุด</td></tr>
</table>
<table class="tbl">
<tr><th>พอร์ต</th><th>บริการ</th><th>พอร์ต</th><th>บริการ</th></tr>
<tr><td>20 / 21</td><td>FTP (data / control)</td><td>110</td><td>POP3</td></tr>
<tr><td><b>22</b></td><td><b>SSH / SFTP / SCP</b></td><td>123</td><td>NTP (UDP)</td></tr>
<tr><td>23</td><td>Telnet</td><td>143</td><td>IMAP</td></tr>
<tr><td>25</td><td>SMTP</td><td>161 / 162</td><td>SNMP / SNMP trap (UDP)</td></tr>
<tr><td><b>53</b></td><td><b>DNS</b> (UDP และ TCP)</td><td>389</td><td>LDAP</td></tr>
<tr><td>67 / 68</td><td>DHCP (UDP)</td><td><b>443</b></td><td><b>HTTPS</b></td></tr>
<tr><td>69</td><td>TFTP (UDP)</td><td>445</td><td>SMB</td></tr>
<tr><td><b>80</b></td><td><b>HTTP</b></td><td>514</td><td>Syslog (UDP)</td></tr>
<tr><td>88</td><td>Kerberos</td><td>636</td><td>LDAPS</td></tr>
<tr><td>3306 / 1433</td><td>MySQL / MS SQL</td><td><b>3389</b></td><td><b>RDP</b></td></tr>
</table>
<div class="note"><b>DNS ใช้ทั้ง UDP และ TCP</b> — ปกติใช้ UDP 53 เพราะเร็ว แต่จะสลับไปใช้ TCP 53
เมื่อคำตอบใหญ่เกิน 512 ไบต์ หรือตอนทำ <b>zone transfer</b> ระหว่าง DNS server — เป็นข้อที่ออกสอบบ่อย</div>
<pre class="code"><span style="color:#5b6b8c"># ดูว่าเครื่องเราเปิดพอร์ตอะไรอยู่และใครเป็นเจ้าของ</span>
ss -tulpn

<span style="color:#5b6b8c"># สแกนดูว่าเครื่องปลายทางเปิดพอร์ตอะไร (ต้องได้รับอนุญาตก่อนเสมอ)</span>
nmap -sV 10.10.10.5</pre>
<div class="note warn"><b>การสแกนพอร์ตเครื่องที่ไม่ใช่ของเราโดยไม่ได้รับอนุญาต เป็นความผิดตาม พ.ร.บ.คอมพิวเตอร์</b>
ในงานจริงต้องมีหนังสืออนุญาตจากเจ้าของระบบก่อนเสมอ ไม่ว่าเจตนาจะดีแค่ไหน</div>`,
        },
        {
          t: 'Lesson 10 — DHCP และบริการแจก IP',
          h: `
<p>DHCP ทำงานด้วยสี่ข้อความ จำว่า <b>DORA</b></p>
<table class="tbl">
<tr><th>ขั้น</th><th>ใครส่ง</th><th>เกิดอะไรขึ้น</th></tr>
<tr><td><b>D</b>iscover</td><td>client (broadcast)</td><td>"มีใครแจก IP บ้าง"</td></tr>
<tr><td><b>O</b>ffer</td><td>server</td><td>เสนอ IP พร้อม mask, gateway, DNS, lease time</td></tr>
<tr><td><b>R</b>equest</td><td>client (broadcast)</td><td>"ขอตัวนั้น" — บอก server อื่นด้วยว่าไม่เอาของเขา</td></tr>
<tr><td><b>A</b>ck</td><td>server</td><td>ยืนยัน client เริ่มใช้ได้</td></tr>
</table>
<table class="tbl">
<tr><th>คำศัพท์</th><th>ความหมาย</th></tr>
<tr><td><b>Scope</b></td><td>ช่วง IP ที่ server แจกได้</td></tr>
<tr><td><b>Exclusion</b></td><td>เบอร์ที่กันไว้ไม่ให้แจก (เช่นเบอร์ของเซิร์ฟเวอร์)</td></tr>
<tr><td><b>Reservation</b></td><td>ผูก MAC กับ IP ให้ได้เบอร์เดิมทุกครั้ง</td></tr>
<tr><td><b>Lease time</b></td><td>อายุการยืม — ออฟฟิศใช้ 1 วัน · guest wifi ใช้ 1–2 ชั่วโมง</td></tr>
<tr><td><b>DHCP relay / IP helper</b></td><td><b>จำเป็นเมื่อ client อยู่คนละวงกับ server</b> เพราะ broadcast ข้าม router ไม่ได้</td></tr>
</table>
<div class="note warn"><b>Rogue DHCP server</b> — ใครเอา router บ้านมาเสียบในออฟฟิศ มันจะเริ่มแจก IP และ gateway ผิด ๆ ทันที
ผู้ใช้บางส่วนจะเน็ตใช้ไม่ได้แบบสุ่ม ป้องกันด้วย <b>DHCP snooping</b> ที่สวิตช์ ซึ่งยอมรับ DHCP offer เฉพาะจากพอร์ตที่ระบุว่าเชื่อถือได้</div>`,
        },
        {
          t: 'Lesson 10 — DNS และการแปลงชื่อ',
          h: `
<p>ลำดับการหาคำตอบเมื่อเครื่องต้องแปลงชื่อเป็น IP</p>
<ol>
  <li>แคชในเครื่อง → 2. ไฟล์ <code>hosts</code> → 3. ถาม DNS server ที่ตั้งไว้ →
  4. ถ้าไม่รู้ ก็ไล่ถามตั้งแต่ root → TLD → authoritative server ของโดเมนนั้น</li>
</ol>
<table class="tbl">
<tr><th>Record</th><th>เก็บอะไร</th></tr>
<tr><td><b>A</b> / <b>AAAA</b></td><td>ชื่อ → IPv4 / IPv6</td></tr>
<tr><td><b>CNAME</b></td><td>ชื่อเล่นที่ชี้ไปอีกชื่อหนึ่ง</td></tr>
<tr><td><b>MX</b></td><td>เซิร์ฟเวอร์อีเมลของโดเมน</td></tr>
<tr><td><b>NS</b></td><td>DNS server ที่รับผิดชอบโดเมนนี้</td></tr>
<tr><td><b>PTR</b></td><td>IP → ชื่อ (reverse lookup) ใช้ตรวจสอบเมลเป็นหลัก</td></tr>
<tr><td><b>TXT</b></td><td>ข้อความอิสระ — ใช้ทำ SPF, DKIM, DMARC และยืนยันความเป็นเจ้าของโดเมน</td></tr>
<tr><td><b>SOA</b></td><td>ข้อมูลหลักของ zone เช่น serial และค่า refresh</td></tr>
<tr><td><b>SRV</b></td><td>บอกว่าบริการหนึ่งอยู่ที่โฮสต์และพอร์ตใด — Active Directory ใช้หนัก</td></tr>
</table>
<table class="tbl">
<tr><th>ชนิด server</th><th>หน้าที่</th></tr>
<tr><td><b>Recursive resolver</b></td><td>ตัวที่ไล่ถามแทนเราจนได้คำตอบ</td></tr>
<tr><td><b>Authoritative</b></td><td>เจ้าของข้อมูลตัวจริงของโดเมนนั้น</td></tr>
<tr><td><b>Forwarder</b></td><td>ส่งต่อคำถามที่ตอบเองไม่ได้ไปให้ตัวอื่น</td></tr>
</table>
<pre class="code"><span style="color:#5b6b8c"># ถาม DNS ตรง ๆ ว่าตอบว่าอะไร</span>
dig example.com
dig example.com MX
dig @8.8.8.8 example.com     <span style="color:#5b6b8c"># บังคับถาม server ตัวนั้นเพื่อเทียบผล</span></pre>
<div class="note"><b>TTL คือดาบสองคม</b> — ตั้งสูงช่วยลดภาระ server แต่ตอนย้ายเซิร์ฟเวอร์จะต้องรอนานกว่าทุกคนจะเห็นค่าใหม่
<b>ก่อนย้ายระบบควรลด TTL ลงล่วงหน้าอย่างน้อยหนึ่งรอบ TTL เดิม</b> แล้วค่อยย้าย</div>`,
        },
        {
          t: 'Lesson 11 — บริการและแอปพลิเคชันบนเครือข่าย',
          h: `
<table class="tbl">
<tr><th>บริการ</th><th>โปรโตคอล / พอร์ต</th><th>สิ่งที่ต้องรู้</th></tr>
<tr><td><b>Web</b></td><td>HTTP 80 · HTTPS 443</td><td>ควรบังคับ HTTPS ทั้งหมดและเปิด HSTS</td></tr>
<tr><td><b>File sharing</b></td><td>SMB 445 (Windows) · NFS 2049 (Unix) · FTP 21 · <b>SFTP 22</b></td><td>เลี่ยง FTP เพราะส่งรหัสผ่านเป็นข้อความเปล่า</td></tr>
<tr><td><b>Print</b></td><td>IPP 631 · LPD 515 · raw 9100</td><td>เครื่องพิมพ์ควรมี IP คงที่ด้วย DHCP reservation</td></tr>
<tr><td><b>Database</b></td><td>MySQL 3306 · MS SQL 1433 · PostgreSQL 5432</td><td><b>ห้ามเปิดออกอินเทอร์เน็ตเด็ดขาด</b> — ให้เข้าผ่าน VPN หรือ app server เท่านั้น</td></tr>
</table>
<p><b>อีเมล</b></p>
<table class="tbl">
<tr><th>โปรโตคอล</th><th>หน้าที่</th><th>พอร์ตที่ปลอดภัย</th></tr>
<tr><td><b>SMTP</b></td><td><b>ส่ง</b>เมล</td><td>587 (STARTTLS) · 465 (SMTPS)</td></tr>
<tr><td><b>POP3</b></td><td>ดึงเมลลงเครื่องแล้วมักลบจาก server</td><td>995</td></tr>
<tr><td><b>IMAP</b></td><td>ซิงก์กับ server — <b>เหมาะกับคนใช้หลายอุปกรณ์</b></td><td>993</td></tr>
</table>
<div class="note"><b>สามระเบียนที่ทำให้เมลองค์กรไม่ตกถังขยะ</b> — ตั้งไว้ใน DNS ทั้งหมด<br>
<b>SPF</b> ประกาศว่าเซิร์ฟเวอร์ไหนส่งเมลแทนโดเมนเราได้ · <b>DKIM</b> ลงลายเซ็นดิจิทัลให้เมลทุกฉบับ ·
<b>DMARC</b> บอกปลายทางว่าถ้าตรวจไม่ผ่านให้ทำอย่างไร และส่งรายงานกลับมาให้เรา</div>
<p><b>เสียงและวิดีโอ (VoIP)</b></p>
<table class="tbl">
<tr><th>โปรโตคอล</th><th>หน้าที่</th></tr>
<tr><td><b>SIP</b> (5060 / 5061)</td><td>เริ่มและจบการโทร — เป็นแค่ตัวควบคุม</td></tr>
<tr><td><b>RTP</b></td><td><b>เสียงจริง</b> วิ่งบน UDP</td></tr>
</table>
<div class="note warn"><b>ทำไม VoIP ถึงต้องมี QoS</b> — เสียงทนต่อการสูญหายได้บ้าง แต่<b>ทนต่อ jitter และ delay ไม่ได้เลย</b><br>
<b>Latency</b> ควรต่ำกว่า 150 ms · <b>Jitter</b> ต่ำกว่า 30 ms · <b>Packet loss</b> ต่ำกว่า 1%<br>
วิธีมาตรฐานคือแยก Voice VLAN แล้วให้ค่า DSCP EF (46) เพื่อให้เสียงได้คิวก่อนเสมอ</div>`,
        },
      ],
      quiz: [
        { type: 'mcq', q: 'VLAN ให้ประโยชน์ข้อใดเป็นหลัก', opts: ['เพิ่มความเร็วของสาย', 'แบ่ง broadcast domain ด้วยซอฟต์แวร์โดยไม่ต้องเดินสายใหม่', 'เข้ารหัสข้อมูล', 'แจก IP อัตโนมัติ'], a: 1, why: 'สวิตช์ธรรมดาไม่แบ่ง broadcast domain แต่ VLAN ทำให้สวิตช์ตัวเดียวทำตัวเหมือนหลายตัวแยกกัน ได้ทั้งความปลอดภัยและลด broadcast โดยไม่ต้องซื้อสวิตช์เพิ่ม' },
        { type: 'mcq', q: 'พอร์ตที่ส่งได้หลาย VLAN พร้อมกันโดยติดแท็ก 802.1Q เรียกว่าอะไร', opts: ['Access port', 'Trunk port', 'Console port', 'Mirror port'], a: 1, why: 'access port อยู่ได้ VLAN เดียวและส่งออกแบบไม่มีแท็ก ส่วน trunk ใช้เชื่อมสวิตช์ต่อสวิตช์หรือต่อ router/AP ที่ต้องรับหลาย VLAN' },
        { type: 'mcq', q: 'ทำไมจึงควรเปลี่ยน native VLAN จากค่าเริ่มต้น', opts: ['เพื่อให้เร็วขึ้น', 'เพราะ traffic ของ native VLAN ไม่ติดแท็ก จึงเป็นช่องทางทำ VLAN hopping', 'เพื่อประหยัด IP', 'เพื่อให้ STP ทำงาน'], a: 1, why: 'native VLAN ส่งผ่าน trunk แบบไม่มีแท็ก ผู้โจมตีจึงอาจแทรกเฟรมเข้าไปข้าม VLAN ได้ — ควรเปลี่ยนเป็นเลขที่ไม่ได้ใช้จริงและห้ามใช้ VLAN 1 กับผู้ใช้' },
        { type: 'mcq', q: 'วิธีใดทำ inter-VLAN routing ได้เร็วที่สุด', opts: ['Router-on-a-stick', 'Layer 3 switch ที่ route ด้วยฮาร์ดแวร์', 'Hub', 'DHCP relay'], a: 1, why: 'router-on-a-stick ใช้สายเส้นเดียวจึงมีคอขวดที่ลิงก์นั้น ส่วน L3 switch route ด้วย ASIC ในตัวได้ที่ระดับความเร็วสาย' },
        { type: 'mcq', q: 'TCP three-way handshake เรียงลำดับอย่างไร', opts: ['SYN → ACK → SYN/ACK', 'SYN → SYN/ACK → ACK', 'ACK → SYN → SYN/ACK', 'SYN → FIN → ACK'], a: 1, why: 'ฝั่งเริ่มส่ง SYN ฝั่งรับตอบ SYN/ACK แล้วฝั่งเริ่มยืนยันด้วย ACK — UDP ไม่มีขั้นตอนนี้เลยจึงเร็วกว่าแต่ไม่รับประกันอะไร' },
        { type: 'mcq', q: 'บริการใดเหมาะกับ UDP มากกว่า TCP', opts: ['การโอนไฟล์ขนาดใหญ่', 'เว็บไซต์', 'เสียงและวิดีโอสด', 'อีเมล'], a: 2, why: 'เสียงสดที่แพ็กเก็ตหายไปเล็กน้อยยังฟังรู้เรื่อง แต่ถ้ารอส่งซ้ำจะสะดุดจนคุยไม่ได้ — ช้าแย่กว่าหายในงานแบบเรียลไทม์' },
        { type: 'mcq', q: 'DNS ใช้พอร์ตใดและโปรโตคอลอะไร', opts: ['53 UDP อย่างเดียว', '53 TCP อย่างเดียว', '53 ทั้ง UDP และ TCP', '54 UDP'], a: 2, why: 'ปกติใช้ UDP 53 เพราะเร็ว แต่สลับไป TCP 53 เมื่อคำตอบใหญ่เกิน 512 ไบต์หรือตอนทำ zone transfer ระหว่าง DNS server' },
        { type: 'mcq', q: 'พอร์ต 3389 คือบริการใด', opts: ['SSH', 'RDP', 'SMB', 'LDAP'], a: 1, why: 'RDP ใช้ 3389 และเป็นพอร์ตที่ถูกโจมตีมากที่สุดพอร์ตหนึ่ง — ห้ามเปิดออกอินเทอร์เน็ตตรง ๆ ให้เข้าผ่าน VPN พร้อม MFA แทน' },
        { type: 'mcq', q: 'Client อยู่คนละวงกับ DHCP server ต้องมีอะไรจึงจะได้ IP', opts: ['DHCP snooping', 'DHCP relay หรือ IP helper ที่ router', 'NAT', 'Proxy ARP'], a: 1, why: 'DHCP Discover เป็น broadcast ซึ่ง router ไม่ส่งต่อ จึงต้องมี relay คอยรับแล้วส่งต่อแบบ unicast ไปยัง server ที่อยู่คนละวง' },
        { type: 'mcq', q: 'DNS record ชนิดใดใช้ระบุเซิร์ฟเวอร์อีเมลของโดเมน', opts: ['A', 'CNAME', 'MX', 'PTR'], a: 2, why: 'MX บอกว่าเมลของโดเมนนี้ต้องส่งไปที่ไหน พร้อมค่าลำดับความสำคัญ ส่วน PTR ใช้ทำ reverse lookup ซึ่งระบบเมลปลายทางมักตรวจเพื่อกันสแปม' },
        { type: 'mcq', q: 'ก่อนย้ายเว็บเซิร์ฟเวอร์ไปที่ IP ใหม่ ควรทำอะไรกับ DNS ล่วงหน้า', opts: ['เพิ่ม TTL ให้สูงขึ้น', 'ลด TTL ลงล่วงหน้าอย่างน้อยหนึ่งรอบ TTL เดิม', 'ลบ record เดิมทิ้งก่อน', 'ไม่ต้องทำอะไร'], a: 1, why: 'TTL สูงแปลว่าแคชทั่วโลกจะจำค่าเก่าไว้นาน การลด TTL ล่วงหน้าทำให้ตอนย้ายจริงทุกคนเห็นค่าใหม่ภายในไม่กี่นาที' },
        { type: 'mcq', q: 'ค่ามาตรฐานที่ยอมรับได้สำหรับ latency ของ VoIP คือเท่าใด', opts: ['ต่ำกว่า 150 ms', 'ต่ำกว่า 500 ms', 'ต่ำกว่า 1 วินาที', 'ไม่มีข้อกำหนด'], a: 0, why: 'เกิน 150 ms คนจะเริ่มพูดชนกัน · jitter ควรต่ำกว่า 30 ms และ packet loss ต่ำกว่า 1% — แก้ด้วยการแยก Voice VLAN และให้ DSCP EF' },
        { type: 'cmd', q: 'พิมพ์คำสั่งบน Linux เพื่อถาม MX record ของโดเมน <code>example.com</code>', ans: ['dig example.com MX', 'dig MX example.com', 'nslookup -type=mx example.com', 'host -t mx example.com'], why: 'ใช้ตรวจว่าเมลของโดเมนถูกส่งไปที่เซิร์ฟเวอร์ที่ถูกต้อง — เป็นขั้นแรกเสมอเมื่อมีปัญหาส่งเมลเข้าไม่ได้' },
        { type: 'multi', q: 'ข้อใดคือระเบียน DNS ที่ช่วยให้อีเมลองค์กรไม่ถูกมองเป็นสแปม (เลือกทุกข้อที่ถูก)', opts: ['SPF', 'DKIM', 'DMARC', 'CNAME'], a: [0, 1, 2], why: 'SPF บอกว่าใครส่งแทนเราได้ · DKIM ลงลายเซ็นให้เมล · DMARC บอกปลายทางว่าให้ทำอย่างไรเมื่อตรวจไม่ผ่าน — ส่วน CNAME เป็นแค่ชื่อเล่นชี้ไปอีกชื่อ' },
      ],
      labs: [
        {
          id: 'net-l4-vlan',
          title: 'Lab 4A — แบ่ง VLAN ให้ออฟฟิศและตั้ง Trunk',
          brief: 'ออฟฟิศต้องแยกวงพนักงาน วงโทรศัพท์ และวงกล้องวงจรปิดออกจากกัน คุณต้องสร้าง VLAN ตั้งพอร์ตผู้ใช้ แล้วตั้ง trunk ไปสวิตช์ตัวถัดไปโดยเปลี่ยน native VLAN ให้ปลอดภัย',
          device: 'cisco',
          tasks: [
            { t: 'เข้าสู่ privileged EXEC mode', hint: 'enable', check: s => s.mode !== 'user' },
            { t: 'สร้าง VLAN 10 ชื่อ <code>OFFICE</code>', hint: 'configure terminal → vlan 10 → name OFFICE', check: s => s.vlans[10] && /OFFICE/i.test(s.vlans[10].name) },
            { t: 'สร้าง VLAN 20 ชื่อ <code>VOICE</code>', hint: 'vlan 20 → name VOICE', check: s => s.vlans[20] && /VOICE/i.test(s.vlans[20].name) },
            { t: 'สร้าง VLAN 30 ชื่อ <code>CCTV</code>', hint: 'vlan 30 → name CCTV', check: s => s.vlans[30] && /CCTV/i.test(s.vlans[30].name) },
            { t: 'สร้าง VLAN 99 ชื่อ <code>NATIVE-UNUSED</code> ไว้ใช้เป็น native VLAN', hint: 'vlan 99 → name NATIVE-UNUSED', check: s => !!s.vlans[99] },
            { t: 'ตั้ง <code>FastEthernet0/1</code> เป็น access อยู่ VLAN 10', hint: 'interface FastEthernet0/1 → switchport mode access → switchport access vlan 10', check: s => ifc(s, 'FastEthernet0/1').swMode === 'access' && +ifc(s, 'FastEthernet0/1').accessVlan === 10 },
            { t: 'ตั้ง <code>FastEthernet0/2</code> ให้อยู่ VLAN 30 สำหรับกล้อง', hint: 'interface FastEthernet0/2 → switchport mode access → switchport access vlan 30', check: s => +ifc(s, 'FastEthernet0/2').accessVlan === 30 },
            { t: 'ตั้ง <code>GigabitEthernet0/1</code> เป็น trunk', hint: 'interface GigabitEthernet0/1 → switchport mode trunk', check: s => ifc(s, 'GigabitEthernet0/1').swMode === 'trunk' },
            { t: 'เปลี่ยน native VLAN ของ trunk เป็น <code>99</code> เพื่อกัน VLAN hopping', hint: 'switchport trunk native vlan 99', check: s => +ifc(s, 'GigabitEthernet0/1').nativeVlan === 99 },
            { t: 'อนุญาตเฉพาะ VLAN 10, 20, 30 ผ่าน trunk', hint: 'switchport trunk allowed vlan 10,20,30', check: s => /10.*20.*30/.test(String(ifc(s, 'GigabitEthernet0/1').allowed || '')) },
            { t: 'ตรวจผลด้วย show vlan brief', hint: 'do show vlan brief', check: (s, h) => said(h, /sh(ow)?\s+vlan/i) },
          ],
        },
        {
          id: 'net-l4-services',
          title: 'Lab 4B — ตรวจพอร์ตและบริการชื่อโดเมน',
          brief: 'ก่อนส่งมอบเซิร์ฟเวอร์ ต้องรู้ว่ามันเปิดพอร์ตอะไรไว้บ้าง และตรวจว่าระบบ DNS ขององค์กรตอบถูกต้องทั้ง A record และ MX record',
          device: 'linux',
          tasks: [
            { t: 'ดูพอร์ตที่เครื่องเราเปิดฟังอยู่พร้อม process เจ้าของ', hint: 'ss -tulpn', check: (s, h) => said(h, /^(sudo\s+)?(ss|netstat)\s+-\w+/i) },
            { t: 'ดูว่ามีการเชื่อมต่อ TCP ใดค้างอยู่บ้าง', hint: 'ss -tan', check: (s, h) => h.filter(c => /^(sudo\s+)?(ss|netstat)\s/i.test(String(c))).length >= 2 },
            { t: 'สำรวจว่ามีเครื่องใดออนไลน์ในวง <code>192.168.10.0/24</code>', hint: 'nmap -sn 192.168.10.0/24', check: (s, h) => said(h, /nmap.*-sn/i) },
            { t: 'สแกนพอร์ตและเวอร์ชันบริการของเครื่องเป้าหมาย', hint: 'nmap -sV 192.168.10.20', check: (s, h) => said(h, /nmap.*-sV/i) },
            { t: 'ตรวจว่า DNS ที่เครื่องใช้อยู่คือตัวไหน', hint: 'cat /etc/resolv.conf', check: (s, h) => said(h, /resolv\.conf/i) },
            { t: 'ถาม A record ของโดเมน', hint: 'dig example.com', check: (s, h) => said(h, /^(dig|nslookup|host)\s+example\.com\s*$/i) },
            { t: 'ถาม MX record เพื่อดูว่าเมลไปที่ไหน', hint: 'dig example.com MX', check: (s, h) => said(h, /dig.*mx|nslookup.*mx|host\s+-t\s+mx/i) },
            { t: 'ถาม DNS ตัวอื่นเทียบผลว่าตรงกันไหม', hint: 'dig @8.8.8.8 example.com', check: (s, h) => said(h, /dig\s+@/i) },
            { t: 'ตรวจว่าเว็บปลายทางตอบ HTTPS ปกติ', hint: 'curl -I https://example.com', check: (s, h) => said(h, /curl\s+-I/i) },
          ],
        },
      ],
    },

    // =========================================================
    5: {
      title: 'ความพร้อมใช้งานและความปลอดภัยของเครือข่าย',
      objectives: [
        'วางระบบเฝ้าระวังและอ่านค่าประสิทธิภาพให้รู้ปัญหาก่อนผู้ใช้โทรมา',
        'อธิบายแนวคิดความปลอดภัยพื้นฐานและวิธียืนยันตัวตนแต่ละแบบ',
        'เลือกอุปกรณ์ความปลอดภัยให้เหมาะกับสิ่งที่ต้องการป้องกัน',
        'จำแนกรูปแบบการโจมตีและวางมาตรการ hardening ที่ได้ผล',
      ],
      sections: [
        {
          t: 'Lesson 12 — Network Management และการเฝ้าระวัง',
          h: `
<table class="tbl">
<tr><th>เครื่องมือ</th><th>ทำอะไร</th><th>พอร์ต</th></tr>
<tr><td><b>SNMP</b></td><td>ดึงค่าสถานะจากอุปกรณ์ (poll) และรับ trap เมื่อมีเหตุ</td><td>161 / 162</td></tr>
<tr><td><b>Syslog</b></td><td>ส่ง log ออกไปเก็บรวมศูนย์</td><td>514</td></tr>
<tr><td><b>NetFlow / sFlow</b></td><td>บอกว่า <b>ใครคุยกับใคร ปริมาณเท่าไหร่</b> — ไม่ใช่เนื้อหา</td><td>—</td></tr>
<tr><td><b>NTP</b></td><td>เทียบเวลาให้ตรงกันทุกเครื่อง</td><td>123</td></tr>
<tr><td><b>Port mirroring</b> + Wireshark</td><td>ดูแพ็กเก็ตจริงเมื่อวิธีอื่นตอบไม่ได้</td><td>—</td></tr>
</table>
<div class="note warn"><b>SNMP เวอร์ชันสำคัญมาก</b> — v1 และ v2c ส่ง community string เป็น<b>ข้อความเปล่า</b>
ใครดักสายก็อ่านได้ · <b>v3</b> มีทั้งการยืนยันตัวตนและการเข้ารหัส<br>
ถ้ายังต้องใช้ v2c ให้เปลี่ยน community จาก <code>public</code> และจำกัดว่าเฉพาะ IP ของระบบ monitoring เท่านั้นที่ถามได้</div>
<p><b>Event management</b> — จัดการแจ้งเตือนให้ใช้งานได้จริง</p>
<table class="tbl">
<tr><th>ระดับ Syslog</th><th>ความหมาย</th></tr>
<tr><td>0 Emergency – 2 Critical</td><td>ระบบใช้งานไม่ได้ ต้องปลุกคนกลางดึก</td></tr>
<tr><td>3 Error – 4 Warning</td><td>มีปัญหาแต่ยังทำงานได้ ดูในเวลางาน</td></tr>
<tr><td>5 Notice – 7 Debug</td><td>ข้อมูลทั่วไป · <b>debug กินทรัพยากรมาก เปิดเท่าที่จำเป็นแล้วปิดทันที</b></td></tr>
</table>
<div class="note"><b>Alert fatigue คือศัตรูตัวจริง</b> — ตั้งเกณฑ์กว้างเกินไปจนมีแจ้งเตือนวันละร้อย
สุดท้ายทีมจะเมินหมดแล้วพลาดของจริง · ตั้งเกณฑ์จาก <b>baseline</b> ที่วัดมาจริง ไม่ใช่เดาเอา</div>
<p><b>Performance metrics ที่ต้องเฝ้า</b></p>
<table class="tbl">
<tr><th>ค่า</th><th>บอกอะไร</th></tr>
<tr><td><b>Bandwidth / Utilization</b></td><td>ใช้ไปกี่ % ของที่มี — เกิน 70% ต่อเนื่องควรเริ่มวางแผนขยาย</td></tr>
<tr><td><b>Latency</b></td><td>หน่วงเท่าไหร่ — กระทบเสียงและ VDI มากที่สุด</td></tr>
<tr><td><b>Jitter</b></td><td>ความไม่สม่ำเสมอของ latency</td></tr>
<tr><td><b>Packet loss</b></td><td>หายกี่ % — TCP จะช้าลงอย่างมากแม้ loss แค่ 1–2%</td></tr>
<tr><td><b>CPU / Memory</b> ของอุปกรณ์</td><td>router ที่ CPU 100% จะ drop แพ็กเก็ตแม้แบนด์วิดท์ยังเหลือ</td></tr>
</table>`,
        },
        {
          t: 'Lesson 13 — แนวคิดความปลอดภัยและการยืนยันตัวตน',
          h: `
<p><b>CIA Triad</b> — ทุกมาตรการต้องตอบได้ว่าปกป้องด้านไหน</p>
<table class="tbl">
<tr><th>หลัก</th><th>หมายถึง</th><th>ตัวอย่างมาตรการ</th></tr>
<tr><td><b>Confidentiality</b></td><td>ความลับ</td><td>การเข้ารหัส, ACL, VPN</td></tr>
<tr><td><b>Integrity</b></td><td>ความถูกต้อง ไม่ถูกแก้</td><td>hash, digital signature</td></tr>
<tr><td><b>Availability</b></td><td>พร้อมใช้เมื่อต้องการ</td><td>ความซ้ำซ้อน, backup, ป้องกัน DDoS</td></tr>
</table>
<table class="tbl">
<tr><th>แนวคิด</th><th>ความหมาย</th></tr>
<tr><td><b>Least privilege</b></td><td>ให้สิทธิ์เท่าที่จำเป็น</td></tr>
<tr><td><b>Defense in depth</b></td><td>หลายชั้น ไม่พึ่งมาตรการเดียว</td></tr>
<tr><td><b>Zero Trust</b></td><td>ไม่เชื่อใครเพียงเพราะอยู่ในวงภายใน ตรวจสอบทุกครั้ง</td></tr>
<tr><td><b>Separation of duties</b></td><td>คนขอกับคนอนุมัติต้องคนละคน</td></tr>
<tr><td><b>Risk</b></td><td>Threat × Vulnerability × Impact</td></tr>
</table>
<p><b>AAA และวิธียืนยันตัวตน</b></p>
<table class="tbl">
<tr><th>ระบบ</th><th>ใช้ที่ไหน</th><th>จุดเด่น</th></tr>
<tr><td><b>RADIUS</b></td><td>Wi-Fi, VPN, 802.1X</td><td>UDP · เข้ารหัสเฉพาะรหัสผ่าน · เปิดมาตรฐาน ใช้ได้ทุกยี่ห้อ</td></tr>
<tr><td><b>TACACS+</b></td><td>จัดการอุปกรณ์เครือข่าย</td><td>TCP · <b>เข้ารหัสทั้งแพ็กเก็ต</b> · แยก authentication กับ authorization ได้</td></tr>
<tr><td><b>Kerberos</b></td><td>Active Directory</td><td>ใช้ ticket ทำ SSO — ไม่ส่งรหัสผ่านไปมา</td></tr>
<tr><td><b>LDAP / LDAPS</b></td><td>ไดเรกทอรีผู้ใช้</td><td>389 / <b>636</b> — ควรใช้ LDAPS เสมอ</td></tr>
<tr><td><b>SAML / OAuth</b></td><td>SSO กับบริการคลาวด์</td><td>SAML ยืนยันตัวตน · OAuth มอบสิทธิ์</td></tr>
<tr><td><b>802.1X</b></td><td>พอร์ตทั้งสายและไร้สาย</td><td>ต้องผ่านการยืนยันตัวตนก่อนจึงจะใช้เครือข่ายได้</td></tr>
</table>
<div class="note"><b>MFA ต้องมาจากคนละประเภทปัจจัย</b> — สิ่งที่รู้ (รหัสผ่าน) · สิ่งที่มี (โทรศัพท์, security key) · สิ่งที่เป็น (ลายนิ้วมือ)<br>
รหัสผ่าน + คำถามลับ ยังนับเป็น<b>ปัจจัยเดียว</b> · ความแข็งแรงเรียงจากน้อยไปมาก:
SMS OTP &lt; TOTP ในแอป &lt; push แบบ number matching &lt; <b>FIDO2 / security key</b></div>`,
        },
        {
          t: 'Lesson 14 — อุปกรณ์ความปลอดภัยและการไล่ปัญหา',
          h: `
<table class="tbl">
<tr><th>อุปกรณ์</th><th>ป้องกันอะไร</th><th>วางตรงไหน</th></tr>
<tr><td><b>Stateful firewall</b></td><td>คุมว่าใครคุยกับใครได้ที่ชั้น 3–4</td><td>ขอบเขตระหว่างวง</td></tr>
<tr><td><b>NGFW</b></td><td>เพิ่มการมองเห็นระดับแอปและผู้ใช้</td><td>ขอบเครือข่าย</td></tr>
<tr><td><b>IDS</b></td><td>ตรวจจับแล้วแจ้ง — <b>out-of-band</b></td><td>ต่อกับ port mirror</td></tr>
<tr><td><b>IPS</b></td><td>ตรวจจับแล้ว<b>บล็อกได้</b> — inline</td><td>คร่อมเส้นทาง traffic</td></tr>
<tr><td><b>WAF</b></td><td>ป้องกันเว็บจาก SQLi และ XSS</td><td>หน้าเว็บเซิร์ฟเวอร์</td></tr>
<tr><td><b>Proxy</b></td><td>คุมและบันทึกการออกเน็ตของผู้ใช้</td><td>ระหว่างผู้ใช้กับอินเทอร์เน็ต</td></tr>
<tr><td><b>NAC</b></td><td>ตรวจสภาพเครื่องก่อนให้เข้าเครือข่าย</td><td>จุดเข้าใช้งาน</td></tr>
<tr><td><b>VPN concentrator</b></td><td>รับการเชื่อมต่อจากภายนอก</td><td>ขอบเครือข่าย</td></tr>
<tr><td><b>DMZ / screened subnet</b></td><td>วางระบบที่คนนอกต้องเข้าถึง ไม่ให้คุยตรงกับวงภายใน</td><td>ระหว่าง firewall สองชั้น</td></tr>
</table>
<div class="note"><b>DMZ คือคำตอบของคำถามที่พบบ่อยที่สุด</b> — "มีเว็บเซิร์ฟเวอร์ที่คนนอกต้องเข้าถึง ควรวางไว้ที่ไหน"
คำตอบคือ DMZ ไม่ใช่วง LAN และไม่ใช่นอก firewall — เพื่อว่าถ้าเว็บถูกเจาะ ผู้โจมตีก็ยังเข้าถึงวงภายในไม่ได้</div>
<p><b>ไล่ปัญหาที่เกิดจากมาตรการความปลอดภัยเอง</b> — หลายครั้ง "เน็ตพัง" คือ firewall ทำงานถูกต้องแต่ตั้งกฎผิด</p>
<table class="tbl">
<tr><th>อาการ</th><th>สงสัยอะไร</th></tr>
<tr><td>ping ได้แต่ใช้บริการไม่ได้</td><td>พอร์ตถูกบล็อกที่ firewall หรือ ACL</td></tr>
<tr><td>ใช้ได้จากในออฟฟิศ แต่จาก VPN ไม่ได้</td><td>กฎไม่ครอบคลุมวงของ VPN หรือไม่มี route กลับ</td></tr>
<tr><td>เบราว์เซอร์เตือนใบรับรอง</td><td>ใบหมดอายุ · ชื่อไม่ตรง · ไม่มี intermediate · <b>นาฬิกาเครื่องผิด</b></td></tr>
<tr><td>ใช้ได้เป็นบางครั้ง</td><td>มีหลายเส้นทางแต่กฎไม่เหมือนกัน หรือ load balancer ส่งไปเครื่องที่ตั้งค่าไม่ตรงกัน</td></tr>
<tr><td>ทั้งแผนกใช้ไม่ได้พร้อมกัน</td><td>ตรวจว่ามีใครเพิ่งเปลี่ยนกฎ — <b>ถามก่อนเสมอว่ามีอะไรเปลี่ยนไป</b></td></tr>
</table>`,
        },
        {
          t: 'Lesson 19 — รูปแบบการโจมตีและ Network Hardening',
          h: `
<table class="tbl">
<tr><th>การโจมตี</th><th>ทำอย่างไร</th><th>ป้องกันอย่างไร</th></tr>
<tr><td><b>ARP spoofing</b></td><td>ปลอมว่าตัวเองคือ gateway เพื่อดักฟัง</td><td><b>Dynamic ARP Inspection</b> + DHCP snooping</td></tr>
<tr><td><b>Rogue DHCP</b></td><td>แจก gateway ปลอมให้ทั้งวง</td><td><b>DHCP snooping</b></td></tr>
<tr><td><b>MAC flooding</b></td><td>ยิง MAC ปลอมจน MAC table เต็ม สวิตช์เลย flood ทุกอย่าง</td><td><b>Port security</b></td></tr>
<tr><td><b>VLAN hopping</b></td><td>แทรกแท็กเพื่อข้าม VLAN</td><td>เปลี่ยน native VLAN · ปิด DTP · ปิดพอร์ตที่ไม่ใช้</td></tr>
<tr><td><b>DNS poisoning</b></td><td>ยัดคำตอบปลอมให้ resolver</td><td>DNSSEC · จำกัดว่าใครถามได้</td></tr>
<tr><td><b>On-path (MITM)</b></td><td>แทรกตัวกลางระหว่างสองฝ่าย</td><td>เข้ารหัสทุกอย่าง · ตรวจใบรับรอง</td></tr>
<tr><td><b>DoS / DDoS</b></td><td>ถล่มจนล่ม</td><td>rate limiting · บริการกรอง upstream · <b>ปิด service ที่เป็น amplifier</b></td></tr>
<tr><td><b>Evil twin</b></td><td>ตั้ง AP ปลอมชื่อเหมือนของจริง</td><td>802.1X · สแกนหา rogue AP · บังคับ VPN นอกออฟฟิศ</td></tr>
<tr><td><b>Deauthentication</b></td><td>ยิงให้เครื่องหลุดจาก AP</td><td><b>802.11w</b> (Protected Management Frames)</td></tr>
<tr><td><b>Social engineering</b></td><td>หลอกคน ไม่ต้องเจาะระบบ</td><td>อบรม · กระบวนการยืนยันสองช่องทาง</td></tr>
</table>
<p><b>Hardening ที่ต้องทำเป็นมาตรฐาน</b></p>
<table class="tbl">
<tr><th>ระดับ</th><th>สิ่งที่ต้องทำ</th></tr>
<tr><td><b>อุปกรณ์</b></td><td>เปลี่ยนรหัสจากค่าโรงงาน · อัปเดต firmware · ปิด Telnet/HTTP ใช้ SSH/HTTPS · ปิดบริการที่ไม่ใช้ · จำกัด IP ที่จัดการได้</td></tr>
<tr><td><b>พอร์ต</b></td><td><b>ปิดพอร์ตที่ไม่ใช้ทั้งหมด</b> · port security · 802.1X · BPDU Guard</td></tr>
<tr><td><b>เครือข่าย</b></td><td>แบ่ง VLAN ตามหน้าที่ · แยกวง management ออกมาต่างหาก · deny by default ที่ firewall</td></tr>
<tr><td><b>ไร้สาย</b></td><td>WPA2/WPA3 · ปิด WPS · แยก guest แล้วเปิด client isolation</td></tr>
<tr><td><b>กระบวนการ</b></td><td>สำรอง config · จัดการการเปลี่ยนแปลง · ทบทวนสิทธิ์เป็นรอบ · เก็บ log นอกเครื่อง</td></tr>
</table>
<div class="note warn"><b>สามอย่างที่ให้ผลสูงสุดต่อความพยายามที่ลงไป</b> — <b>เปลี่ยนรหัสผ่านค่าโรงงาน</b> ·
<b>ปิดพอร์ตและบริการที่ไม่ได้ใช้</b> · <b>แยกวงอุปกรณ์ที่ patch ไม่ได้</b> (กล้อง เครื่องพิมพ์ IoT)
สามข้อนี้ไม่ต้องซื้ออะไรเพิ่มเลยแต่ปิดช่องทางโจมตีที่ใช้จริงได้เกือบทั้งหมด</div>`,
        },
      ],
      quiz: [
        { type: 'mcq', q: 'SNMP เวอร์ชันใดที่มีทั้งการยืนยันตัวตนและการเข้ารหัส', opts: ['v1', 'v2c', 'v3', 'ทุกเวอร์ชัน'], a: 2, why: 'v1 และ v2c ส่ง community string เป็นข้อความเปล่า ใครดักสายก็อ่านได้ — ถ้าจำเป็นต้องใช้ v2c ต้องเปลี่ยนจาก public และจำกัด IP ที่ถามได้' },
        { type: 'mcq', q: 'ต้องการรู้ว่า "ใครคุยกับใครและปริมาณเท่าไหร่" ควรใช้เครื่องมือใด', opts: ['Syslog', 'NetFlow', 'NTP', 'ping'], a: 1, why: 'NetFlow เก็บสถิติของ flow (ต้นทาง ปลายทาง พอร์ต ปริมาณ) โดยไม่เก็บเนื้อหา — ใช้หาว่าใครกินแบนด์วิดท์และเห็นรูปแบบผิดปกติได้ดี' },
        { type: 'mcq', q: 'ทำไม NTP จึงสำคัญต่อการวิเคราะห์ log', opts: ['ทำให้ log เล็กลง', 'ถ้าเวลาไม่ตรงกัน การเรียงลำดับเหตุการณ์ข้ามอุปกรณ์จะผิดทั้งหมด', 'ทำให้เครือข่ายเร็วขึ้น', 'ป้องกันการโจมตี'], a: 1, why: 'การสืบสวนคือการสร้าง timeline ถ้านาฬิกาของ firewall กับเซิร์ฟเวอร์ต่างกัน 10 นาที ลำดับเหตุการณ์จะกลับหัวและสรุปผิด' },
        { type: 'mcq', q: 'ค่า utilization ของลิงก์ที่เกินเท่าใดต่อเนื่อง ควรเริ่มวางแผนขยาย', opts: ['30%', '50%', '70%', 'รอจนเต็ม 100%'], a: 2, why: 'traffic มีลักษณะเป็นช่วงพุ่ง (burst) การใช้เฉลี่ยเกิน 70% แปลว่าช่วงพีคชนเพดานแล้วและผู้ใช้เริ่มรู้สึกได้ — รอถึง 100% คือรอให้ระบบล่ม' },
        { type: 'mcq', q: 'IDS ต่างจาก IPS อย่างไร', opts: ['IDS บล็อกได้ IPS แค่แจ้งเตือน', 'IDS แจ้งเตือนอย่างเดียววางแบบ out-of-band ส่วน IPS วางแบบ inline และบล็อกได้', 'IDS ใช้กับเว็บ IPS ใช้กับอีเมล', 'เหมือนกันทุกอย่าง'], a: 1, why: 'IPS ที่บล็อกได้มีความเสี่ยงว่าถ้า false positive จะตัด traffic ที่ถูกต้อง จึงมักเริ่มจากโหมดแจ้งเตือนก่อนแล้วค่อยเปิดบล็อกทีละกฎ' },
        { type: 'mcq', q: 'เว็บเซิร์ฟเวอร์ที่คนภายนอกต้องเข้าถึงได้ ควรวางไว้ที่ใด', opts: ['ในวง LAN เดียวกับเครื่องพนักงาน', 'ใน DMZ', 'นอก firewall โดยไม่มีการป้องกัน', 'ในวง management'], a: 1, why: 'DMZ ทำให้เครื่องที่เปิดสู่ภายนอกถูกแยกออกมา ถ้าถูกเจาะผู้โจมตีก็ยังต้องผ่าน firewall อีกชั้นจึงจะเข้าถึงวงภายในได้' },
        { type: 'mcq', q: 'TACACS+ ต่างจาก RADIUS อย่างไร', opts: ['TACACS+ ใช้ UDP ส่วน RADIUS ใช้ TCP', 'TACACS+ ใช้ TCP เข้ารหัสทั้งแพ็กเก็ต และแยก authentication กับ authorization ได้', 'RADIUS ปลอดภัยกว่า', 'ทั้งคู่เหมือนกัน'], a: 1, why: 'RADIUS ใช้ UDP และเข้ารหัสเฉพาะช่องรหัสผ่าน จึงเหมาะกับ 802.1X และ VPN ส่วน TACACS+ นิยมใช้กับการจัดการอุปกรณ์เพราะคุมได้ละเอียดกว่า' },
        { type: 'mcq', q: 'การโจมตีที่ยิง MAC ปลอมจนตารางของสวิตช์เต็ม แล้วสวิตช์กลายเป็น hub เรียกว่าอะไร', opts: ['ARP spoofing', 'MAC flooding', 'VLAN hopping', 'DNS poisoning'], a: 1, why: 'เมื่อ MAC table เต็ม สวิตช์จะ flood ทุกเฟรมออกทุกพอร์ต ทำให้ผู้โจมตีดักอ่านได้ทั้งหมด — ป้องกันด้วย port security ที่จำกัดจำนวน MAC ต่อพอร์ต' },
        { type: 'mcq', q: 'มาตรการใดป้องกัน rogue DHCP server ได้ตรงที่สุด', opts: ['Port mirroring', 'DHCP snooping', 'STP', 'NAT'], a: 1, why: 'DHCP snooping ยอมรับ DHCP offer เฉพาะจากพอร์ตที่ระบุว่าเชื่อถือได้ พอร์ตของผู้ใช้ที่มีใครเอา router บ้านมาเสียบจะถูกตัดทันที' },
        { type: 'mcq', q: 'มาตรฐานใดป้องกันการโจมตีแบบ deauthentication บน Wi-Fi', opts: ['802.11n', '802.11w (Protected Management Frames)', '802.1Q', '802.3af'], a: 1, why: 'เฟรมจัดการของ Wi-Fi เดิมไม่มีการป้องกัน ใครก็ปลอมส่ง deauth ให้เครื่องหลุดได้ — 802.11w ลงลายเซ็นให้เฟรมเหล่านี้ และเป็นข้อบังคับใน WPA3' },
        { type: 'mcq', q: 'เบราว์เซอร์เตือนใบรับรองไม่ถูกต้องทั้งที่ใบยังไม่หมดอายุ ควรตรวจอะไรเพิ่ม', opts: ['ความเร็วเน็ต', 'ชื่อในใบตรงกับที่เรียกไหม, มี intermediate ครบไหม และนาฬิกาของเครื่องตรงไหม', 'ขนาดของสาย', 'จำนวนผู้ใช้'], a: 1, why: 'นาฬิกาเครื่องที่ผิดไปหลายวันทำให้ใบที่ยังใช้ได้ถูกมองว่าหมดอายุหรือยังไม่เริ่มใช้ — เป็นสาเหตุที่เจอบ่อยและแก้ง่ายที่สุด' },
        { type: 'cmd', q: 'พิมพ์คำสั่งบน Linux เพื่อดูพอร์ตที่เปิดฟังอยู่พร้อม process เจ้าของ', ans: ['ss -tulpn', 'sudo ss -tulpn', 'netstat -tulpn', 'ss -tuln'], why: 'ขั้นแรกของการ hardening คือรู้ว่าเครื่องเปิดอะไรไว้บ้าง — ทุกพอร์ตที่เปิดโดยไม่ได้ใช้คือช่องทางที่ไม่จำเป็น' },
        { type: 'multi', q: 'ข้อใดคือมาตรการ hardening ที่ควรทำกับสวิตช์ทุกตัว (เลือกทุกข้อที่ถูก)', opts: ['เปลี่ยนรหัสผ่านจากค่าโรงงาน', 'ปิดพอร์ตที่ไม่ได้ใช้งาน', 'ปิด Telnet แล้วใช้ SSH แทน', 'เปิดทุกพอร์ตไว้เพื่อความสะดวกในอนาคต'], a: [0, 1, 2], why: 'พอร์ตที่เปิดทิ้งไว้คือจุดที่ใครก็เดินมาเสียบแล้วเข้าเครือข่ายได้ทันที — ถ้าอยากสะดวกให้เปิดตอนที่ต้องใช้จริง ไม่ใช่เปิดทิ้งไว้ล่วงหน้า' },
        { type: 'multi', q: 'ข้อใดช่วยป้องกันการดักฟังแบบ on-path ในวง LAN (เลือกทุกข้อที่ถูก)', opts: ['Dynamic ARP Inspection', 'DHCP snooping', 'เข้ารหัสการสื่อสารด้วย TLS', 'ใช้ hub แทนสวิตช์'], a: [0, 1, 2], why: 'hub ส่งข้อมูลออกทุกพอร์ตอยู่แล้ว จึงทำให้ดักฟังง่ายขึ้นไม่ใช่ยากขึ้น — ส่วน DAI กับ DHCP snooping ตัดฐานของการปลอมตัวเป็น gateway' },
      ],
      labs: [
        {
          id: 'net-l5-monitor',
          title: 'Lab 5A — วางระบบเฝ้าระวังให้รู้ปัญหาก่อนผู้ใช้โทรมา',
          brief: 'หลังส่งมอบระบบ คุณต้องทำให้อุปกรณ์ส่งข้อมูลเข้าระบบ monitoring ส่วนกลางได้ — เปิด SNMP อย่างปลอดภัย ส่ง log ออกนอกเครื่อง เก็บกราฟ และตั้งเฝ้าลิงก์ขาออก',
          device: 'mikrotik',
          tasks: [
            { t: 'ตั้งชื่ออุปกรณ์เป็น <code>SW-FLOOR3</code> ให้ตรงกับผังเครือข่าย', hint: '/system identity set name=SW-FLOOR3', check: s => s.settings['system identity'].name === 'SW-FLOOR3' },
            { t: 'ตั้งเวลาให้ตรงกัน — จำเป็นต่อการเรียงลำดับ log', hint: '/system ntp client set enabled=yes servers=203.159.68.1', check: s => s.settings['system ntp client'].enabled === 'yes' },
            { t: 'เปิด SNMP พร้อมระบุ contact และ location', hint: '/snmp set enabled=yes contact="NOC" location="Floor3-Rack1"', check: s => s.settings.snmp.enabled === 'yes' },
            { t: 'สร้าง community <code>monitor</code> จำกัดเฉพาะวง <code>10.10.99.0/24</code>', hint: '/snmp community add name=monitor addresses=10.10.99.0/24', check: s => has(s, 'snmp community', r => r.name === 'monitor' && r.addresses === '10.10.99.0/24') },
            { t: 'ส่ง log ออกไปเก็บที่ syslog server <code>10.10.99.60</code>', hint: '/system logging action add name=remote-log target=remote remote=10.10.99.60', check: s => has(s, 'system logging action', r => r.target === 'remote' && r.remote === '10.10.99.60') },
            { t: 'เปิดเก็บกราฟปริมาณ traffic ของ <code>ether1</code>', hint: '/tool graphing interface add interface=ether1', check: s => has(s, 'tool graphing interface', r => r.interface === 'ether1') },
            { t: 'ตั้ง Netwatch เฝ้าลิงก์ขาออกที่ <code>8.8.8.8</code>', hint: '/tool netwatch add host=8.8.8.8 interval=30s', check: s => has(s, 'tool netwatch', r => r.host === '8.8.8.8') },
            { t: 'ดูปริมาณ traffic บน <code>ether1</code> แบบสด', hint: '/interface monitor-traffic ether1', check: (s, h) => said(h, /monitor-traffic/i) },
            { t: 'ดูว่าใครกำลังกินแบนด์วิดท์อยู่ตอนนี้', hint: '/tool torch interface=ether1', check: (s, h) => said(h, /tool\s+torch/i) },
            { t: 'อ่าน log ของเครื่องดูว่ามีอะไรผิดปกติ', hint: '/log print', check: (s, h) => said(h, /^\/?log\s+print/i) },
          ],
        },
        {
          id: 'net-l5-harden',
          title: 'Lab 5B — Hardening สวิตช์ก่อนขึ้นใช้งานจริง',
          brief: 'สวิตช์ตัวใหม่มาจากโรงงานพร้อมค่าเริ่มต้นที่เปิดกว้างทั้งหมด ก่อนเอาขึ้นระบบจริงต้องตั้งรหัสให้ถูกวิธี ปิดช่องทางที่ไม่ปลอดภัย จำกัด MAC ต่อพอร์ต และปิดพอร์ตที่ไม่ได้ใช้',
          device: 'cisco',
          tasks: [
            { t: 'เข้าสู่ privileged EXEC mode', hint: 'enable', check: s => s.mode !== 'user' },
            { t: 'ตั้งชื่ออุปกรณ์เป็น <code>SW-FLOOR3</code>', hint: 'configure terminal → hostname SW-FLOOR3', check: s => /SW-FLOOR3/i.test(s.hostname) },
            { t: 'ตั้ง enable secret (เข้ารหัสจริง ไม่ใช่ enable password)', hint: 'enable secret Str0ngPass!', check: s => !!s.enableSecret },
            { t: 'เปิดการเข้ารหัสรหัสผ่านที่เหลือใน config', hint: 'service password-encryption', check: s => s.pwEncrypt === true },
            { t: 'บังคับให้เข้าทาง vty ได้เฉพาะ SSH (ปิด Telnet)', hint: 'line vty 0 15 → transport input ssh', check: s => Object.values(s.lines || {}).some(l => /ssh/i.test(String(l.transport || ''))) },
            { t: 'เปิด port security ที่ <code>FastEthernet0/1</code>', hint: 'interface FastEthernet0/1 → switchport mode access → switchport port-security', check: s => !!ifc(s, 'FastEthernet0/1').psec },
            { t: 'จำกัดให้พอร์ตนั้นเรียนรู้ MAC ได้ไม่เกิน 2 ตัว', hint: 'switchport port-security maximum 2', check: s => +(ifc(s, 'FastEthernet0/1').psec || {}).max === 2 },
            { t: 'ปิดพอร์ต <code>FastEthernet0/10</code> ที่ยังไม่ได้ใช้', hint: 'interface FastEthernet0/10 → shutdown', check: s => ifc(s, 'FastEthernet0/10').shutdown === true },
            { t: 'ปิดพอร์ต <code>FastEthernet0/11</code> ที่ยังไม่ได้ใช้', hint: 'interface FastEthernet0/11 → shutdown', check: s => ifc(s, 'FastEthernet0/11').shutdown === true },
            { t: 'ใส่ banner เตือนผู้ที่พยายามเข้าระบบ', hint: 'banner motd #Authorized access only#', check: s => !!s.banner },
            { t: 'บันทึก config ลง NVRAM', hint: 'end → write memory', check: s => !!s.savedConfig },
          ],
        },
      ],
    },

    // =========================================================
    6: {
      title: 'ไร้สาย, WAN, องค์กร, DR และ Cloud',
      objectives: [
        'ออกแบบและไล่ปัญหาเครือข่ายไร้สายได้ทั้งสัญญาณและความปลอดภัย',
        'เปรียบเทียบลิงก์ WAN และวิธีเข้าถึงระยะไกลแต่ละแบบ',
        'อธิบายเอกสาร นโยบาย และมาตรการความปลอดภัยเชิงกายภาพขององค์กร',
        'แยกแนวคิด DR กับ HA และอ่านค่า RTO/RPO เป็น',
      ],
      sections: [
        {
          t: 'Lesson 15 — มาตรฐานและการติดตั้งเครือข่ายไร้สาย',
          h: `
<table class="tbl">
<tr><th>มาตรฐาน</th><th>ชื่อการตลาด</th><th>ย่าน</th><th>ความเร็วสูงสุด (ทฤษฎี)</th></tr>
<tr><td>802.11a</td><td>—</td><td>5 GHz</td><td>54 Mbps</td></tr>
<tr><td>802.11b</td><td>—</td><td>2.4 GHz</td><td>11 Mbps</td></tr>
<tr><td>802.11g</td><td>—</td><td>2.4 GHz</td><td>54 Mbps</td></tr>
<tr><td>802.11n</td><td>Wi-Fi 4</td><td>2.4 และ 5 GHz</td><td>600 Mbps</td></tr>
<tr><td>802.11ac</td><td>Wi-Fi 5</td><td><b>5 GHz เท่านั้น</b></td><td>~6.9 Gbps</td></tr>
<tr><td>802.11ax</td><td>Wi-Fi 6 / 6E</td><td>2.4, 5 และ <b>6 GHz</b> (6E)</td><td>~9.6 Gbps</td></tr>
</table>
<table class="tbl">
<tr><th></th><th>2.4 GHz</th><th>5 GHz</th></tr>
<tr><td>ระยะ / ทะลุกำแพง</td><td>ไกลกว่า ทะลุดีกว่า</td><td>ใกล้กว่า ทะลุแย่กว่า</td></tr>
<tr><td>ช่องที่ไม่ทับกัน</td><td><b>1, 6, 11 เท่านั้น</b></td><td>มีให้เลือกมาก</td></tr>
<tr><td>สัญญาณรบกวน</td><td>เยอะมาก (ไมโครเวฟ บลูทูธ กล้อง)</td><td>น้อยกว่ามาก</td></tr>
</table>
<p><b>สิ่งที่ต้องทำตอนติดตั้ง</b></p>
<ul>
  <li><b>Site survey</b> ก่อนเสมอ — วัดสัญญาณจริงและดูว่ารอบตัวใช้ช่องไหนอยู่</li>
  <li>วาง AP ให้พื้นที่ทับซ้อนกัน <b>ราว 15–20%</b> เพื่อให้ roaming ราบรื่น</li>
  <li>สลับช่อง 1 / 6 / 11 ไม่ให้ AP ที่อยู่ติดกันใช้ช่องเดียวกัน</li>
  <li><b>อย่าเร่งกำลังส่งจนสุด</b> — เครื่องลูกจะเห็นสัญญาณเต็มแต่ส่งกลับไม่ถึง</li>
  <li>ใช้ WLC เมื่อมี AP หลายตัว เพื่อจัดการช่อง กำลังส่ง และ roaming จากที่เดียว</li>
</ul>
<p><b>ไล่ปัญหาไร้สาย</b></p>
<table class="tbl">
<tr><th>อาการ</th><th>สาเหตุที่น่าสงสัย</th></tr>
<tr><td>สัญญาณเต็มแต่เน็ตช้า</td><td>ช่องความถี่แน่น หรือมีคนใช้ร่วมเยอะ — <b>ไม่ใช่ปัญหาระยะทาง</b></td></tr>
<tr><td>หลุดเป็นระยะตอนเดิน</td><td>พื้นที่ทับซ้อนน้อยเกินไป หรือ roaming ไม่ราบรื่น</td></tr>
<tr><td>ต่อได้แต่ไม่ได้ IP</td><td>DHCP หรือ VLAN ที่ผูกกับ SSID ผิด</td></tr>
<tr><td>เชื่อมต่อไม่ได้เลย</td><td>รหัสผิด · MAC ไม่อยู่ใน allow list · ความถี่ไม่รองรับ</td></tr>
<tr><td>ช้าเฉพาะบางจุด</td><td>สัญญาณสะท้อน (multipath) · วัสดุอาคาร · แหล่งรบกวน</td></tr>
</table>
<div class="note"><b>ความปลอดภัยไร้สาย</b> — <b>WPA3-SAE</b> ดีที่สุด เพราะกันการดักจับ handshake ไปเดารหัสภายหลัง ·
<b>WPA2-PSK</b> ยังใช้ได้กับงานทั่วไป · <b>WEP และ WPS แบบ PIN ห้ามใช้</b><br>
องค์กรควรใช้ <b>WPA2/3-Enterprise + 802.1X</b> ให้ทุกคนล็อกอินด้วยบัญชีตัวเอง เวลาพนักงานลาออกจะได้ปิดทีละคนได้
ไม่ต้องเปลี่ยนรหัสทั้งบริษัท</div>`,
        },
        {
          t: 'Lesson 16 — WAN และการเข้าถึงระยะไกล',
          h: `
<table class="tbl">
<tr><th>เทคโนโลยี</th><th>ลักษณะ</th><th>เหมาะกับ</th></tr>
<tr><td><b>Fiber / FTTH</b></td><td>เร็วสุด หน่วงต่ำสุด</td><td>สำนักงานหลัก</td></tr>
<tr><td><b>DSL</b></td><td>ผ่านสายโทรศัพท์ ขาขึ้นช้ากว่าขาลงมาก</td><td>สาขาเล็กในพื้นที่ที่ไฟเบอร์ไม่ถึง</td></tr>
<tr><td><b>Cable</b></td><td>ใช้สาย coax และ<b>แชร์แบนด์วิดท์กับเพื่อนบ้าน</b></td><td>สาขาเล็ก</td></tr>
<tr><td><b>Cellular</b> (4G/5G)</td><td>ติดตั้งเร็ว ไปได้ทุกที่</td><td><b>ลิงก์สำรอง</b> · หน้างานชั่วคราว</td></tr>
<tr><td><b>Satellite</b></td><td>ครอบคลุมทุกที่ แต่<b>หน่วงสูง</b></td><td>พื้นที่ห่างไกล</td></tr>
<tr><td><b>Leased line</b></td><td>วงจรเช่าเฉพาะ รับประกันความเร็ว</td><td>งานที่ต้องมี SLA แน่นอน</td></tr>
<tr><td><b>MPLS</b></td><td>เครือข่ายของผู้ให้บริการที่รับประกันคุณภาพและทำ QoS ได้</td><td>เชื่อมหลายสาขา</td></tr>
<tr><td><b>SD-WAN</b></td><td>ใช้ลิงก์ราคาถูกหลายเส้นแล้วเลือกเส้นทางอัตโนมัติตามคุณภาพ</td><td>ทางเลือกที่มาแทน MPLS</td></tr>
</table>
<table class="tbl">
<tr><th>วิธีเข้าถึงระยะไกล</th><th>ลักษณะ</th></tr>
<tr><td><b>Client-to-site VPN</b></td><td>พนักงานต่อเข้าองค์กรจากที่บ้าน — <b>ต้องบังคับ MFA</b></td></tr>
<tr><td><b>Site-to-site VPN</b></td><td>เชื่อมสาขาต่อสาขาถาวร มักใช้ IPSec</td></tr>
<tr><td><b>Full vs Split tunnel</b></td><td>full ส่งทุกอย่างผ่านองค์กร ตรวจสอบได้หมดแต่ช้ากว่า · split เร็วกว่าแต่เสี่ยงกว่า</td></tr>
<tr><td><b>SSH</b></td><td>จัดการเซิร์ฟเวอร์ผ่าน CLI</td></tr>
<tr><td><b>RDP / VNC</b></td><td>เข้าใช้หน้าจอเครื่อง — <b>ห้ามเปิดออกอินเทอร์เน็ตตรง ๆ</b></td></tr>
<tr><td><b>Out-of-band management</b></td><td>ช่องทางแยก เช่น console server หรือ 4G — ใช้ตอนเครือข่ายหลักล่ม</td></tr>
</table>
<div class="note warn"><b>RDP เปิดออกเน็ตตรง ๆ คือสาเหตุอันดับต้น ๆ ของ ransomware ในองค์กรขนาดกลาง</b>
บอตสแกนหาพอร์ต 3389 ตลอดเวลา ทางที่ถูกคือให้เข้าผ่าน VPN ที่มี MFA ก่อน แล้วค่อย RDP ภายใน</div>`,
        },
        {
          t: 'Lesson 17 — เอกสาร นโยบาย และความปลอดภัยเชิงกายภาพ',
          h: `
<table class="tbl">
<tr><th>เอกสาร</th><th>มีไว้ทำไม</th></tr>
<tr><td><b>Physical / Logical diagram</b></td><td>ผังการเดินสายจริง / ผังการไหลของข้อมูลและ IP</td></tr>
<tr><td><b>Rack diagram</b></td><td>อะไรอยู่ U ไหน ใช้ไฟเท่าไหร่</td></tr>
<tr><td><b>IP Address Management (IPAM)</b></td><td>วงไหนใช้ทำอะไร ใครถือ IP อะไร</td></tr>
<tr><td><b>Baseline</b></td><td>ค่าปกติของระบบ — ไม่มี baseline ก็บอกไม่ได้ว่าอะไรผิดปกติ</td></tr>
<tr><td><b>SLA</b></td><td>ข้อตกลงระดับบริการกับผู้ให้บริการหรือผู้ใช้</td></tr>
<tr><td><b>MOU / NDA / AUP</b></td><td>บันทึกความเข้าใจ / ข้อตกลงไม่เปิดเผย / นโยบายการใช้งานที่ยอมรับได้</td></tr>
<tr><td><b>Change management</b></td><td>ทุกการเปลี่ยนแปลงต้องมีคนอนุมัติ มีแผนย้อนกลับ และบันทึกไว้</td></tr>
<tr><td><b>Onboarding / Offboarding</b></td><td>checklist เปิดและปิดสิทธิ์ — บัญชีคนลาออกที่ยังใช้ได้คือช่องโหว่ที่พบบ่อยที่สุด</td></tr>
</table>
<table class="tbl">
<tr><th>มาตรการทางกายภาพ</th><th>ป้องกันอะไร</th></tr>
<tr><td>รั้ว, bollard, ไฟส่องสว่าง, ป้ายเตือน</td><td>ยับยั้งตั้งแต่รอบนอก (deterrent)</td></tr>
<tr><td><b>Access control vestibule (mantrap)</b></td><td><b>Tailgating</b> — เปิดได้ทีละบานบังคับให้ผ่านทีละคน</td></tr>
<tr><td>เครื่องอ่านบัตร, biometric, สมุดลงชื่อ</td><td>ควบคุมและบันทึกว่าใครเข้าออก</td></tr>
<tr><td>กล้องวงจรปิด</td><td>Detective + deterrent</td></tr>
<tr><td>ล็อกตู้แร็ค, ปิดพอร์ต USB, ตั้งรหัส BIOS</td><td>ป้องกันที่ระดับตัวเครื่อง</td></tr>
<tr><td>ระบบดับเพลิงแบบไม่ใช้น้ำ, HVAC, UPS</td><td>ปกป้อง availability ของห้อง server</td></tr>
</table>
<p><b>IoT และอุปกรณ์ฝังตัว</b> — กล้องวงจรปิด เครื่องอ่านบัตร เซ็นเซอร์ ระบบ HVAC และ ICS/SCADA
มักมีปัญหาร่วมกันคือ <b>patch ไม่ได้</b> · <b>รหัสโรงงานเปลี่ยนไม่ได้</b> · <b>ใช้โปรโตคอลที่ไม่เข้ารหัส</b> · <b>ห้ามหยุดทำงาน</b></p>
<div class="note warn"><b>เมื่อ patch ไม่ได้ ต้องใช้มาตรการทดแทน</b> — แยกไว้ VLAN ของตัวเอง ·
ห้ามออกอินเทอร์เน็ตโดยตรง · จำกัดว่าเครื่องไหนคุยกับมันได้ · เฝ้าดู traffic เป็นพิเศษ<br>
กล้องวงจรปิดที่ต่อรวมอยู่ในวงเดียวกับเครื่องพนักงาน คือกรณีคลาสสิกที่อุปกรณ์อ่อนแอที่สุดกลายเป็นทางเข้าสู่ทุกอย่าง</div>`,
        },
        {
          t: 'Lesson 18 — Disaster Recovery และ High Availability',
          h: `
<table class="tbl">
<tr><th></th><th>High Availability</th><th>Disaster Recovery</th></tr>
<tr><td>รับมือกับ</td><td>ชิ้นส่วนเดี่ยวเสีย</td><td>เหตุใหญ่ที่ทำให้ทั้งไซต์ใช้ไม่ได้</td></tr>
<tr><td>เวลาที่ใช้กลับมา</td><td>วินาที — อัตโนมัติ</td><td>ชั่วโมงถึงวัน — มีขั้นตอนที่ต้องทำ</td></tr>
<tr><td>ตัวอย่าง</td><td>คลัสเตอร์, VRRP, NIC teaming, RAID</td><td>ย้ายไป DR site แล้วกู้จาก backup</td></tr>
</table>
<table class="tbl">
<tr><th>ค่า</th><th>ความหมาย</th><th>ตอบคำถามว่า</th></tr>
<tr><td><b>RTO</b></td><td>เวลาสูงสุดที่ระบบหยุดได้</td><td>"ต้องกลับมาภายในกี่ชั่วโมง"</td></tr>
<tr><td><b>RPO</b></td><td>ข้อมูลที่ยอมให้หายได้</td><td>"ยอมเสียข้อมูลย้อนหลังกี่ชั่วโมง" → <b>กำหนดความถี่ backup</b></td></tr>
<tr><td><b>MTTR</b></td><td>เวลาเฉลี่ยที่ใช้ซ่อม</td><td>"ปกติซ่อมเสร็จในเวลาเท่าไหร่"</td></tr>
<tr><td><b>MTBF</b></td><td>เวลาเฉลี่ยระหว่างการเสีย</td><td>"อุปกรณ์นี้เสียบ่อยแค่ไหน"</td></tr>
</table>
<table class="tbl">
<tr><th>ไซต์สำรอง</th><th>พร้อมแค่ไหน</th><th>ค่าใช้จ่าย</th></tr>
<tr><td><b>Hot site</b></td><td>พร้อมใช้ทันที ข้อมูลซิงก์ตลอด</td><td>แพงที่สุด</td></tr>
<tr><td><b>Warm site</b></td><td>มีอุปกรณ์แล้ว แต่ต้องกู้ข้อมูลก่อน</td><td>ปานกลาง</td></tr>
<tr><td><b>Cold site</b></td><td>มีแค่พื้นที่กับไฟ</td><td>ถูกที่สุด แต่ใช้เวลานานสุด</td></tr>
</table>
<div class="note"><b>ความซ้ำซ้อนต้องมีทุกชั้น จึงจะไม่มีจุดตายเดียว (single point of failure)</b><br>
ไฟฟ้า: UPS + เครื่องปั่นไฟ + power supply สองชุด · เครือข่าย: NIC teaming, ลิงก์จากสอง ISP, อุปกรณ์สำรอง ·
ดิสก์: RAID · ระบบ: cluster + load balancer<br>
<b>แต่ RAID ไม่ใช่ backup</b> — ไฟล์ที่ถูกลบหรือถูก ransomware เข้ารหัสจะถูกซิงก์ไปทุกลูกทันที</div>
<div class="note warn"><b>backup ที่ไม่เคยทดสอบกู้คืน ไม่นับว่ามี backup</b> — ต้องซ้อมกู้จริงตามรอบและ<b>จับเวลาเทียบกับ RTO</b>
ที่ตกลงกับฝ่ายธุรกิจไว้ · และในยุค ransomware ต้องมีอย่างน้อยหนึ่งชุดที่ <b>offline หรือเขียนทับไม่ได้</b></div>`,
        },
        {
          t: 'Lesson 20 — Cloud และสถาปัตยกรรมศูนย์ข้อมูล',
          h: `
<table class="tbl">
<tr><th>โมเดล</th><th>ผู้ให้บริการดูแล</th><th><b>เราดูแล</b></th><th>ตัวอย่าง</th></tr>
<tr><td><b>IaaS</b></td><td>ฮาร์ดแวร์ เครือข่าย hypervisor</td><td><b>OS, patch, แอป, ข้อมูล, สิทธิ์</b></td><td>เช่า VM</td></tr>
<tr><td><b>PaaS</b></td><td>เพิ่ม OS และ runtime</td><td><b>แอป, ข้อมูล, สิทธิ์</b></td><td>บริการฐานข้อมูลสำเร็จรูป</td></tr>
<tr><td><b>SaaS</b></td><td>เกือบทั้งหมด</td><td><b>ข้อมูลและบัญชีผู้ใช้ — ยังเป็นของเราเสมอ</b></td><td>อีเมลบนคลาวด์</td></tr>
</table>
<table class="tbl">
<tr><th>รูปแบบการใช้งาน</th><th>ลักษณะ</th></tr>
<tr><td><b>Public</b></td><td>ใช้ทรัพยากรร่วมกับคนอื่น — ยืดหยุ่นและถูกที่สุด</td></tr>
<tr><td><b>Private</b></td><td>ใช้คนเดียว — คุมได้เต็มที่ ตอบโจทย์ข้อกำหนดที่เข้มงวด</td></tr>
<tr><td><b>Hybrid</b></td><td>ผสมกัน — รูปแบบที่องค์กรส่วนใหญ่ใช้จริง</td></tr>
<tr><td><b>Community</b></td><td>กลุ่มองค์กรที่มีข้อกำหนดเหมือนกันใช้ร่วมกัน</td></tr>
</table>
<div class="note warn"><b>ไม่ว่าโมเดลไหน ข้อมูลและสิทธิ์เป็นความรับผิดชอบของเราเสมอ</b> —
เหตุข้อมูลรั่วบนคลาวด์ส่วนใหญ่ไม่ได้เกิดจากผู้ให้บริการถูกเจาะ แต่เกิดจาก
<b>storage ที่ตั้งเป็น public</b> · <b>access key หลุดใน git</b> · <b>สิทธิ์ที่กว้างเกินจำเป็น</b></div>
<p><b>Virtualization และ Storage</b></p>
<table class="tbl">
<tr><th>คำศัพท์</th><th>ความหมาย</th></tr>
<tr><td><b>Hypervisor</b></td><td>Type 1 รันบนฮาร์ดแวร์ตรง (ใช้ในศูนย์ข้อมูล) · Type 2 รันบน OS อีกที (ใช้ทดลอง)</td></tr>
<tr><td><b>vSwitch</b></td><td>สวิตช์เสมือนที่เชื่อม VM เข้าด้วยกันภายในโฮสต์</td></tr>
<tr><td><b>SAN</b></td><td>เครือข่ายเฉพาะสำหรับ storage — ให้บริการแบบ <b>block</b> เหมือนต่อดิสก์ตรง</td></tr>
<tr><td><b>NAS</b></td><td>แชร์ไฟล์ผ่านเครือข่ายปกติ — ให้บริการแบบ <b>file</b> (SMB / NFS)</td></tr>
<tr><td><b>Fibre Channel / FCoE</b></td><td>โปรโตคอลของ SAN ที่มีเครือข่ายแยกของตัวเอง</td></tr>
<tr><td><b>iSCSI</b></td><td>ทำ SAN บนเครือข่าย Ethernet ปกติ — ถูกกว่า ควรแยก VLAN และเปิด jumbo frame</td></tr>
</table>
<p><b>สถาปัตยกรรมในศูนย์ข้อมูล</b></p>
<table class="tbl">
<tr><th>แบบ</th><th>ลักษณะ</th></tr>
<tr><td><b>Three-tier</b></td><td>Core – Distribution – Access · เหมาะกับ traffic ที่วิ่งเข้าออกจากภายนอกเป็นหลัก</td></tr>
<tr><td><b>Spine-Leaf</b></td><td>ทุก leaf ต่อกับทุก spine — ทุกเส้นทางมี hop เท่ากัน เหมาะกับ traffic <b>east-west</b> ระหว่างเซิร์ฟเวอร์</td></tr>
<tr><td><b>Top-of-Rack</b></td><td>วางสวิตช์ไว้บนสุดของแต่ละแร็ค ลดการเดินสายข้ามแร็ค</td></tr>
<tr><td><b>Hot / Cold aisle</b></td><td>จัดแถวแร็คให้ลมเย็นเข้าด้านหน้าและลมร้อนออกด้านหลังทางเดียวกัน — ลดค่าไฟและยืดอายุอุปกรณ์</td></tr>
</table>`,
        },
      ],
      quiz: [
        { type: 'mcq', q: '802.11ac ทำงานในย่านความถี่ใด', opts: ['2.4 GHz เท่านั้น', '5 GHz เท่านั้น', 'ทั้ง 2.4 และ 5 GHz', '6 GHz เท่านั้น'], a: 1, why: '802.11ac ออกแบบมาสำหรับ 5 GHz เท่านั้น อุปกรณ์ที่โฆษณาว่า AC dual-band จริง ๆ ใช้ 802.11n ในย่าน 2.4 GHz — ส่วน 6 GHz เริ่มมีใน Wi-Fi 6E' },
        { type: 'mcq', q: 'ในย่าน 2.4 GHz ช่องใดที่ไม่ทับซ้อนกัน', opts: ['1, 4, 8', '1, 6, 11', '2, 6, 10', 'ทุกช่องไม่ทับกัน'], a: 1, why: 'ช่องกว้าง 20 MHz แต่ห่างกันแค่ 5 MHz จึงทับกัน เหลือแค่ 1, 6, 11 ที่แยกกันสนิท — วาง AP หลายตัวต้องสลับสามช่องนี้' },
        { type: 'mcq', q: 'ผู้ใช้บอกว่าสัญญาณ Wi-Fi เต็มขีดแต่เน็ตช้ามาก ควรสงสัยอะไรก่อน', opts: ['อยู่ไกล AP เกินไป', 'ช่องความถี่แน่นหรือมีคนใช้ร่วมเยอะ', 'สาย LAN ขาด', 'IP ซ้ำ'], a: 1, why: 'สัญญาณเต็มแปลว่าระยะทางไม่ใช่ปัญหา — ไร้สายเป็นสื่อร่วม ทุกคนในช่องเดียวกันต้องผลัดกันส่ง ให้สแกนหาช่องที่ว่างกว่าแล้วย้าย' },
        { type: 'mcq', q: 'ทำไมไม่ควรเร่งกำลังส่งของ AP จนสุด', opts: ['เปลืองไฟ', 'เครื่องลูกจะเห็นสัญญาณเต็มแต่ส่งกลับไม่ถึง ทำให้ใช้งานไม่ได้', 'AP จะร้อนเกินไป', 'ผิดกฎหมายเสมอ'], a: 1, why: 'ลิงก์ไร้สายต้องส่งได้ทั้งสองทาง การเร่งฝั่ง AP อย่างเดียวทำให้เกิดอาการสัญญาณเต็มแต่เน็ตใช้ไม่ได้ — ทางแก้ที่ถูกคือเพิ่มจำนวน AP' },
        { type: 'mcq', q: 'องค์กรที่ต้องการปิดสิทธิ์ Wi-Fi ของพนักงานที่ลาออกทีละคนโดยไม่ต้องเปลี่ยนรหัสทั้งบริษัท ควรใช้อะไร', opts: ['WPA2-PSK', 'WPA2/3-Enterprise + 802.1X', 'WEP', 'ซ่อน SSID'], a: 1, why: 'PSK ใช้รหัสร่วมกันทั้งองค์กร พอมีคนลาออกก็ต้องเปลี่ยนทุกเครื่อง — Enterprise ให้แต่ละคนล็อกอินด้วยบัญชีตัวเอง จึงปิดทีละคนได้' },
        { type: 'mcq', q: 'ลิงก์ WAN แบบใดเหมาะที่สุดสำหรับใช้เป็นเส้นสำรองที่ติดตั้งได้เร็ว', opts: ['Leased line', 'MPLS', 'Cellular 4G/5G', 'Satellite'], a: 2, why: 'cellular ติดตั้งได้ในไม่กี่นาทีโดยไม่ต้องรอเดินสาย จึงเหมาะเป็นลิงก์สำรองและงานหน้างานชั่วคราว ส่วน leased line กับ MPLS ใช้เวลาติดตั้งเป็นสัปดาห์' },
        { type: 'mcq', q: 'ทำไม RDP จึงไม่ควรเปิดออกอินเทอร์เน็ตโดยตรง', opts: ['เพราะกินแบนด์วิดท์มาก', 'เพราะบอตสแกนหาพอร์ต 3389 ตลอดเวลาและเป็นทางเข้าอันดับต้น ๆ ของ ransomware', 'เพราะใช้กับ Windows ไม่ได้', 'เพราะไม่มีการเข้ารหัส'], a: 1, why: 'ทางที่ถูกคือให้เข้าผ่าน VPN ที่บังคับ MFA ก่อน แล้วค่อย RDP ภายใน — การเปลี่ยนพอร์ตอย่างเดียวไม่ช่วย เพราะบอตสแกนทุกพอร์ตอยู่แล้ว' },
        { type: 'mcq', q: 'Split tunnel VPN มีความเสี่ยงอย่างไรเมื่อเทียบกับ full tunnel', opts: ['ช้ากว่า', 'เครื่องผู้ใช้ต่ออินเทอร์เน็ตตรงพร้อมกับต่อ VPN จึงอาจเป็นสะพานให้ภัยคุกคามเข้าองค์กร', 'เข้ารหัสอ่อนกว่า', 'ใช้ MFA ไม่ได้'], a: 1, why: 'องค์กรมองไม่เห็น traffic ที่ผู้ใช้ออกเน็ตตรง ถ้าเครื่องติดมัลแวร์ระหว่างนั้น มันก็มีเส้นทางเข้าองค์กรผ่าน tunnel ที่เปิดอยู่' },
        { type: 'mcq', q: 'Access control vestibule (mantrap) ป้องกันอะไรโดยเฉพาะ', opts: ['ไฟไหม้', 'Tailgating — การเดินตามคนอื่นเข้าประตูโดยไม่รูดบัตร', 'ไฟฟ้าดับ', 'การดักฟังเครือข่าย'], a: 1, why: 'ประตูสองบานที่เปิดได้ทีละบานบังคับให้คนผ่านทีละคน ทำให้ tailgating ทำไม่ได้ ซึ่งเป็นวิธีเข้าอาคารที่ได้ผลที่สุดวิธีหนึ่ง' },
        { type: 'mcq', q: 'RPO กำหนดอะไรโดยตรง', opts: ['ความเร็วในการกู้ระบบ', 'ความถี่ของการทำ backup', 'จำนวนไซต์สำรอง', 'ค่า MTBF ของอุปกรณ์'], a: 1, why: 'RPO คือปริมาณข้อมูลที่ยอมให้หายได้ ถ้า RPO = 1 ชั่วโมง ต้อง backup หรือ replicate อย่างน้อยทุกชั่วโมง — ส่วน RTO คือเวลาที่ยอมให้ระบบหยุด' },
        { type: 'mcq', q: 'ไซต์สำรองแบบใดที่พร้อมใช้งานทันทีและข้อมูลซิงก์ตลอดเวลา', opts: ['Cold site', 'Warm site', 'Hot site', 'Mobile site'], a: 2, why: 'hot site แพงที่สุดแต่ RTO สั้นที่สุด · warm site มีอุปกรณ์แล้วแต่ต้องกู้ข้อมูลก่อน · cold site มีแค่พื้นที่กับไฟจึงถูกที่สุดแต่ช้าที่สุด' },
        { type: 'mcq', q: 'บนคลาวด์แบบ IaaS ใครรับผิดชอบการ patch ระบบปฏิบัติการ', opts: ['ผู้ให้บริการคลาวด์', 'ลูกค้า (เรา)', 'แบ่งกันคนละครึ่ง', 'ไม่ต้อง patch'], a: 1, why: 'IaaS ผู้ให้บริการดูแลถึงระดับ hypervisor เท่านั้น ทุกอย่างตั้งแต่ OS ขึ้นมาเป็นของเรา — ความเข้าใจผิดตรงนี้ทำให้เกิด VM ที่ไม่เคยถูก patch เลย' },
        { type: 'mcq', q: 'SAN ต่างจาก NAS อย่างไร', opts: ['เหมือนกัน', 'SAN ให้บริการแบบ block เหมือนต่อดิสก์ตรง ส่วน NAS แชร์ไฟล์ผ่านเครือข่ายปกติ', 'NAS เร็วกว่าเสมอ', 'SAN ใช้กับ Windows เท่านั้น'], a: 1, why: 'SAN ให้ block device ที่เซิร์ฟเวอร์เอาไปฟอร์แมตเองได้ ส่วน NAS แชร์เป็นไฟล์ผ่าน SMB/NFS — และ iSCSI คือการทำ SAN บน Ethernet ปกติ' },
        { type: 'mcq', q: 'สถาปัตยกรรม Spine-Leaf เหมาะกับ traffic แบบใด', opts: ['North-south ที่วิ่งเข้าออกจากภายนอก', 'East-west ระหว่างเซิร์ฟเวอร์ด้วยกันในศูนย์ข้อมูล', 'Traffic ของผู้ใช้ตามสำนักงานสาขา', 'Traffic ไร้สาย'], a: 1, why: 'ในศูนย์ข้อมูลสมัยใหม่ traffic ส่วนใหญ่วิ่งระหว่างเซิร์ฟเวอร์ Spine-Leaf ทำให้ทุกเส้นทางมีจำนวน hop เท่ากันและคาดเดา latency ได้' },
        { type: 'multi', q: 'ข้อใดคือมาตรการที่ควรใช้กับกล้องวงจรปิดรุ่นเก่าที่ผู้ผลิตเลิกออก patch แล้ว (เลือกทุกข้อที่ถูก)', opts: ['แยกไว้ใน VLAN ของตัวเอง', 'ห้ามให้ออกอินเทอร์เน็ตโดยตรง', 'จำกัดว่าเครื่องไหนคุยกับมันได้', 'ต่อรวมในวงเดียวกับเครื่องพนักงานเพื่อความสะดวก'], a: [0, 1, 2], why: 'เมื่อ patch ไม่ได้ต้องใช้มาตรการทดแทนที่ลดพื้นที่โจมตี — การเอาไปไว้วงเดียวกับผู้ใช้ทำให้อุปกรณ์ที่อ่อนแอที่สุดกลายเป็นทางเข้าสู่ทุกอย่าง' },
      ],
      labs: [
        {
          id: 'net-l6-wifi',
          title: 'Lab 6A — สำรวจคลื่นแล้วติดตั้ง Wi-Fi ให้ออฟฟิศ',
          brief: 'ออฟฟิศชั้น 3 ร้องเรียนว่าไวไฟช้าทั้งที่สัญญาณเต็ม คุณต้องสำรวจว่ารอบตัวใช้ช่องไหนกันอยู่ เลือกช่องที่ว่างที่สุด ตั้งความปลอดภัยให้ถูก แล้วตรวจคุณภาพลิงก์ของเครื่องที่เกาะอยู่',
          device: 'mikrotik',
          init: { wlan: true },
          tasks: [
            { t: 'ดูรายการการ์ดไร้สายที่มีในเครื่อง', hint: '/interface wireless print', check: (s, h) => said(h, /interface\s+wireless\s+print/i) },
            { t: 'สำรวจว่ารอบตัวมี AP ใดใช้ช่องไหนอยู่บ้าง', hint: '/interface wireless scan wlan1', check: (s, h) => said(h, /wireless\s+scan/i) },
            { t: 'ดูภาพรวมว่าช่องไหนแน่นที่สุด', hint: '/interface wireless snooper', check: (s, h) => said(h, /snooper/i) },
            { t: 'สร้าง security profile ชื่อ <code>office-wifi</code> แบบ WPA2-PSK', hint: '/interface wireless security-profiles add name=office-wifi mode=dynamic-keys authentication-types=wpa2-psk wpa2-pre-shared-key=Str0ngWiFiPass', check: s => has(s, 'interface wireless security-profiles', r => r.name === 'office-wifi' && /wpa2-psk/i.test(r['authentication-types'] || '')) },
            { t: 'ตั้ง <code>wlan1</code> เป็น AP ชื่อ SSID <code>OFFICE-F3</code> และเปิดใช้งาน', hint: '/interface wireless set 0 mode=ap-bridge band=2ghz-b/g/n ssid=OFFICE-F3 disabled=no', check: s => has(s, 'interface wireless', r => r.name === 'wlan1' && r.ssid === 'OFFICE-F3' && r.mode === 'ap-bridge' && r.disabled !== true) },
            { t: 'ล็อกความถี่ไว้ที่ช่อง 1 (<code>2412</code>) ตามผลสำรวจ', hint: '/interface wireless set 0 frequency=2412', check: s => has(s, 'interface wireless', r => r.name === 'wlan1' && String(r.frequency) === '2412') },
            { t: 'ผูก security profile เข้ากับ <code>wlan1</code>', hint: '/interface wireless set 0 security-profile=office-wifi', check: s => has(s, 'interface wireless', r => r.name === 'wlan1' && r['security-profile'] === 'office-wifi') },
            { t: 'ปิดไม่ให้เครื่องลูกคุยกันเอง (client isolation)', hint: '/interface wireless set 0 default-forward=no', check: s => has(s, 'interface wireless', r => r.name === 'wlan1' && r['default-forward'] === 'no') },
            { t: 'ตรวจว่ามีเครื่องใดเกาะอยู่ สัญญาณและความเร็วเท่าไหร่', hint: '/interface wireless registration-table print', check: (s, h) => said(h, /registration-table\s+print/i) },
          ],
        },
        {
          id: 'net-l6-wan',
          title: 'Lab 6B — วาง WAN สำรองให้สลับเองเมื่อเส้นหลักล่ม',
          brief: 'สาขามีเน็ตเส้นหลักเป็นไฟเบอร์และเส้นสำรองเป็น 4G ที่คิดเงินตามปริมาณ คุณต้องทำให้ระบบใช้เส้นหลักตลอด แล้วสลับไปเส้นสำรองอัตโนมัติเมื่อเส้นหลักล่ม และสลับกลับเองเมื่อกลับมา',
          device: 'mikrotik',
          tasks: [
            { t: 'ตั้งชื่ออุปกรณ์เป็น <code>RTR-BRANCH</code>', hint: '/system identity set name=RTR-BRANCH', check: s => s.settings['system identity'].name === 'RTR-BRANCH' },
            { t: 'ใส่ IP ฝั่ง WAN หลัก <code>203.0.113.25/29</code> ที่ <code>ether1</code>', hint: '/ip address add address=203.0.113.25/29 interface=ether1', check: s => has(s, 'ip address', r => r.address === '203.0.113.25/29' && r.interface === 'ether1') },
            { t: 'ใส่ IP ฝั่ง WAN สำรอง <code>192.168.8.2/24</code> ที่ <code>ether2</code>', hint: '/ip address add address=192.168.8.2/24 interface=ether2', check: s => has(s, 'ip address', r => r.address === '192.168.8.2/24' && r.interface === 'ether2') },
            { t: 'ใส่ IP ฝั่ง LAN <code>10.30.0.1/24</code> ที่ <code>ether3</code>', hint: '/ip address add address=10.30.0.1/24 interface=ether3', check: s => has(s, 'ip address', r => r.address === '10.30.0.1/24' && r.interface === 'ether3') },
            { t: 'เพิ่ม default route เส้นหลักผ่าน <code>203.0.113.1</code> พร้อม <code>check-gateway=ping</code>', hint: '/ip route add dst-address=0.0.0.0/0 gateway=203.0.113.1 distance=1 check-gateway=ping', check: s => has(s, 'ip route', r => r['dst-address'] === '0.0.0.0/0' && r.gateway === '203.0.113.1' && /ping/i.test(String(r['check-gateway'] || ''))) },
            { t: 'เพิ่ม default route เส้นสำรองที่ <code>distance=10</code> ผ่าน <code>192.168.8.1</code>', hint: '/ip route add dst-address=0.0.0.0/0 gateway=192.168.8.1 distance=10', check: s => has(s, 'ip route', r => r['dst-address'] === '0.0.0.0/0' && r.gateway === '192.168.8.1' && String(r.distance) === '10') },
            { t: 'ทำ NAT ให้ออกได้ทั้งสองเส้น', hint: '/ip firewall nat add chain=srcnat out-interface=ether1 action=masquerade', check: s => has(s, 'ip firewall nat', r => r.chain === 'srcnat' && r.action === 'masquerade') },
            { t: 'ตั้ง Netwatch เฝ้าปลายทางเพื่อรู้ทันทีที่เส้นหลักล่ม', hint: '/tool netwatch add host=1.1.1.1 interval=30s', check: s => has(s, 'tool netwatch', r => r.host === '1.1.1.1') },
            { t: 'ตรวจตารางเส้นทางว่าเส้นไหนกำลัง active (มี flag A)', hint: '/ip route print', check: (s, h) => said(h, /ip\s+route\s+print/i) },
            { t: 'ไล่ดูเส้นทางออกจริงว่าออกทางไหน', hint: '/tool traceroute 1.1.1.1', check: (s, h) => said(h, /traceroute/i) },
          ],
        },
      ],
    },
  },
};
