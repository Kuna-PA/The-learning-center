// ============================================================
//  CCNA Domain 1 — Network Fundamentals
//  พื้นฐานที่ต้องแน่นก่อนไปแตะอุปกรณ์จริง: ข้อมูลเดินทางยังไง
// ============================================================
const said = (h, re) => h.some(c => re.test(String(c).trim()));

export default {
  title: 'พื้นฐานเครือข่าย — ข้อมูลเดินทางอย่างไร',
  objectives: [
    'อธิบาย OSI 7 ชั้นและจับคู่กับ TCP/IP ได้ว่าอะไรอยู่ชั้นไหน',
    'บอกความต่างของ TCP กับ UDP และเลือกใช้ให้ถูกงาน',
    'อ่าน IP address / subnet mask / prefix ได้ และคำนวณ subnet เบื้องต้น',
    'แยกหน้าที่ของ Switch, Router, Access Point ได้',
    'ใช้คำสั่งตรวจเครือข่ายพื้นฐาน (ipconfig, ping, tracert, show ip) เป็น',
  ],
  sections: [
    {
      t: 'OSI 7 ชั้น กับ TCP/IP — ใช้เพื่ออะไรจริง ๆ',
      h: `
<p>OSI Model ไม่ได้มีไว้ท่องสอบ แต่มีไว้ <b>ไล่ปัญหาเป็นชั้น ๆ</b> เวลาเน็ตล่ม คำถามแรกของช่างที่มีประสบการณ์คือ "พังชั้นไหน"</p>
<table class="tbl">
<tr><th>ชั้น</th><th>ชื่อ</th><th>หน่วยข้อมูล</th><th>ตัวอย่างจริง</th><th>อุปกรณ์</th></tr>
<tr><td>7</td><td>Application</td><td rowspan="3">Data</td><td>HTTP, DNS, SSH</td><td rowspan="3">เครื่องปลายทาง</td></tr>
<tr><td>6</td><td>Presentation</td><td>TLS, การเข้ารหัส, JPEG</td></tr>
<tr><td>5</td><td>Session</td><td>การเปิด/ปิดเซสชัน</td></tr>
<tr><td>4</td><td>Transport</td><td>Segment</td><td>TCP, UDP, port number</td><td>Firewall (L4)</td></tr>
<tr><td>3</td><td>Network</td><td>Packet</td><td>IP, ICMP, routing</td><td><b>Router</b>, L3 Switch</td></tr>
<tr><td>2</td><td>Data Link</td><td>Frame</td><td>Ethernet, MAC, VLAN</td><td><b>Switch</b></td></tr>
<tr><td>1</td><td>Physical</td><td>Bit</td><td>สายทองแดง, ไฟเบอร์, คลื่นวิทยุ</td><td>สาย, Hub, ตัวแปลงสัญญาณ</td></tr>
</table>
<p><b>TCP/IP Model</b> คือรุ่นย่อที่ใช้จริงในโลกอินเทอร์เน็ต — ยุบ 7 ชั้นเหลือ 4:</p>
<table class="tbl">
<tr><th>TCP/IP</th><th>ตรงกับ OSI ชั้น</th></tr>
<tr><td>Application</td><td>5 + 6 + 7</td></tr>
<tr><td>Transport</td><td>4</td></tr>
<tr><td>Internet</td><td>3</td></tr>
<tr><td>Network Access (Link)</td><td>1 + 2</td></tr>
</table>
<div class="note"><b>วิธีใช้จริง:</b> ผู้ใช้แจ้ง "เข้าเว็บไม่ได้" ให้ไล่จากล่างขึ้นบน —
ไฟพอร์ตติดไหม (L1) → <code>show interfaces status</code> ขึ้น connected ไหม (L2) →
<code>ping</code> gateway ได้ไหม (L3) → <code>ping 8.8.8.8</code> ได้แต่ <code>ping google.com</code> ไม่ได้ = ปัญหา DNS (L7)</div>`,
    },
    {
      t: 'TCP กับ UDP ต่างกันตรงไหน และเลือกใช้ยังไง',
      h: `
<p>ทั้งคู่อยู่ชั้น 4 และใช้ <b>port number</b> เหมือนกัน ต่างกันที่ "รับประกันของถึงไหม"</p>
<table class="tbl">
<tr><th></th><th>TCP</th><th>UDP</th></tr>
<tr><td>จับมือก่อนส่ง</td><td>มี (3-way handshake: SYN → SYN-ACK → ACK)</td><td>ไม่มี ยิงเลย</td></tr>
<tr><td>ของหาย</td><td>ส่งซ้ำให้เอง</td><td>หายก็หายเลย</td></tr>
<tr><td>ลำดับข้อมูล</td><td>เรียงให้ถูก</td><td>ไม่เรียง</td></tr>
<tr><td>ความเร็ว / overhead</td><td>ช้ากว่า header 20 byte</td><td>เร็วกว่า header 8 byte</td></tr>
<tr><td>เหมาะกับ</td><td>เว็บ (80/443), SSH (22), อีเมล, โอนไฟล์</td><td>DNS (53), DHCP (67/68), VoIP, วิดีโอสด, SNMP (161)</td></tr>
</table>
<p><b>พอร์ตที่ต้องจำให้ได้</b> — ข้อสอบชอบถาม และใช้ตอนเขียน ACL จริง:</p>
<table class="tbl">
<tr><th>พอร์ต</th><th>บริการ</th><th>TCP/UDP</th></tr>
<tr><td>22</td><td>SSH</td><td>TCP</td></tr>
<tr><td>23</td><td>Telnet (ไม่เข้ารหัส — ห้ามใช้)</td><td>TCP</td></tr>
<tr><td>53</td><td>DNS</td><td>UDP (query) / TCP (zone transfer)</td></tr>
<tr><td>67, 68</td><td>DHCP server / client</td><td>UDP</td></tr>
<tr><td>80, 443</td><td>HTTP / HTTPS</td><td>TCP</td></tr>
<tr><td>123</td><td>NTP</td><td>UDP</td></tr>
<tr><td>161, 162</td><td>SNMP / SNMP trap</td><td>UDP</td></tr>
<tr><td>514</td><td>Syslog</td><td>UDP</td></tr>
</table>
<div class="note warn"><b>เหตุผลที่ VoIP ใช้ UDP:</b> เสียงที่มาช้าไม่มีประโยชน์ ส่งซ้ำไปก็สายไปแล้ว
ยอมให้ขาดหายนิดหน่อยดีกว่ารอ — ต่างจากโอนไฟล์ที่ขาดไป 1 byte แปลว่าไฟล์เสีย</div>`,
    },
    {
      t: 'IP Address และ Subnetting',
      h: `
<p>IPv4 คือเลข 32 บิต เขียนเป็น 4 ท่อน (octet) แต่ละท่อน 0–255 มาคู่กับ <b>subnet mask</b> ที่บอกว่า
"ส่วนไหนคือเลขวง ส่วนไหนคือเลขเครื่อง"</p>
<table class="tbl">
<tr><th>Prefix</th><th>Subnet mask</th><th>จำนวน host ใช้ได้</th><th>ใช้ตอนไหน</th></tr>
<tr><td>/24</td><td>255.255.255.0</td><td>254</td><td>วง LAN ทั่วไปของออฟฟิศ</td></tr>
<tr><td>/25</td><td>255.255.255.128</td><td>126</td><td>ซอยวง /24 ออกเป็นสอง</td></tr>
<tr><td>/26</td><td>255.255.255.192</td><td>62</td><td>แผนกเล็ก, วง CCTV</td></tr>
<tr><td>/30</td><td>255.255.255.252</td><td>2</td><td>ลิงก์ระหว่าง router สองตัว</td></tr>
<tr><td>/32</td><td>255.255.255.255</td><td>1</td><td>ระบุเครื่องเดียว (ใน ACL / route)</td></tr>
</table>
<p><b>สูตรที่ใช้ได้จริง:</b> host = 2<sup>(32−prefix)</sup> − 2 (หัก network address กับ broadcast address)</p>
<p><b>ตัวอย่าง:</b> 192.168.10.0/26 ซอยได้ 4 วง วงละ 62 เครื่อง</p>
<table class="tbl">
<tr><th>วง</th><th>Network</th><th>ช่วงที่ใช้ได้</th><th>Broadcast</th></tr>
<tr><td>1</td><td>192.168.10.0</td><td>.1 – .62</td><td>192.168.10.63</td></tr>
<tr><td>2</td><td>192.168.10.64</td><td>.65 – .126</td><td>192.168.10.127</td></tr>
<tr><td>3</td><td>192.168.10.128</td><td>.129 – .190</td><td>192.168.10.191</td></tr>
<tr><td>4</td><td>192.168.10.192</td><td>.193 – .254</td><td>192.168.10.255</td></tr>
</table>
<p><b>วง private</b> ที่ใช้ภายในองค์กร (ออกเน็ตต้องผ่าน NAT): <code>10.0.0.0/8</code> ·
<code>172.16.0.0/12</code> · <code>192.168.0.0/16</code> ·
ส่วน <code>169.254.x.x</code> คือ APIPA แปลว่า <b>ขอ IP จาก DHCP ไม่ได้</b></p>
<p><b>IPv6</b> ยาว 128 บิต เขียนเป็นเลขฐาน 16 คั่นด้วย <code>:</code> ย่อศูนย์ติดกันด้วย <code>::</code> ได้ครั้งเดียว —
เช่น <code>2001:0db8:0000:0000:0000:0000:0000:0001</code> → <code>2001:db8::1</code> ·
ไม่มี broadcast (ใช้ multicast แทน) และไม่ต้องใช้ NAT เพราะเลขพอ</p>
<div class="note"><b>โจทย์หน้างานที่เจอบ่อย:</b> เครื่องได้ IP 169.254.x.x = หา DHCP ไม่เจอ
ให้ไปดูว่าพอร์ตอยู่ VLAN ถูกไหม และ DHCP relay (ip helper-address) ตั้งไว้หรือยัง</div>`,
    },
    {
      t: 'อุปกรณ์และรูปแบบการเชื่อมต่อ',
      h: `
<table class="tbl">
<tr><th>อุปกรณ์</th><th>ทำงานชั้น</th><th>หน้าที่</th><th>แยก broadcast domain?</th></tr>
<tr><td>Hub</td><td>1</td><td>ทวนสัญญาณออกทุกพอร์ต (เลิกใช้แล้ว)</td><td>ไม่</td></tr>
<tr><td><b>Switch</b></td><td>2</td><td>ส่ง frame ตาม MAC address table</td><td>ไม่ (ต้องใช้ VLAN)</td></tr>
<tr><td><b>Router</b></td><td>3</td><td>ส่ง packet ข้ามวง ตาม routing table</td><td>ใช่ ทุก interface</td></tr>
<tr><td>L3 Switch</td><td>2+3</td><td>สวิตช์ที่ route ระหว่าง VLAN ได้</td><td>ใช่ ทุก SVI</td></tr>
<tr><td>Access Point</td><td>1+2</td><td>แปลง Wi-Fi ↔ สาย ต่อเข้าพอร์ต access หรือ trunk</td><td>ไม่</td></tr>
<tr><td>Firewall</td><td>3–7</td><td>กรอง traffic ตามนโยบาย</td><td>ใช่</td></tr>
</table>
<p><b>Topology</b> — รูปแบบการวางสาย ที่เจอในองค์กรจริงคือ Star และ Hierarchical</p>
<ul>
  <li><b>Star</b> — ทุกเครื่องต่อเข้าสวิตช์กลาง เสียหายจุดเดียวไม่ล้มทั้งวง แต่สวิตช์กลางล่ม = ล่มหมด</li>
  <li><b>Mesh</b> — ต่อถึงกันหลายเส้น ทนทานสูง แต่แพงและสายเยอะ ใช้ระหว่าง core/สาขา</li>
  <li><b>Hierarchical 3 ชั้น</b> — Access (พอร์ตผู้ใช้) → Distribution (รวม VLAN, route) → Core (ส่งต่อความเร็วสูง)
      เป็นมาตรฐานที่ Cisco แนะนำสำหรับ Campus LAN</li>
</ul>
<p><b>LAN vs WAN</b> — LAN คือวงในอาคารที่เราเป็นเจ้าของสายเอง ความเร็วสูง latency ต่ำ ·
WAN คือการเชื่อมข้ามที่ตั้ง ต้องเช่าวงจรจากผู้ให้บริการ (leased line, MPLS, SD-WAN, อินเทอร์เน็ต + VPN)</p>`,
    },
    {
      t: 'คำสั่งตรวจเครือข่ายที่ต้องใช้เป็น',
      h: `
<p><b>ฝั่งเครื่องผู้ใช้ (Windows):</b></p>
<table class="tbl">
<tr><th>คำสั่ง</th><th>บอกอะไร</th></tr>
<tr><td><code>ipconfig /all</code></td><td>IP, mask, gateway, DNS, MAC — จุดเริ่มต้นของทุกเคส</td></tr>
<tr><td><code>ping &lt;ip&gt;</code></td><td>ปลายทางตอบไหม (ICMP) — เทสต์ทีละขั้น: ตัวเอง → gateway → DNS → อินเทอร์เน็ต</td></tr>
<tr><td><code>tracert &lt;host&gt;</code></td><td>ผ่าน router กี่ hop และไปตายที่ hop ไหน</td></tr>
<tr><td><code>nslookup &lt;host&gt;</code></td><td>DNS แปลชื่อเป็น IP ได้ไหม</td></tr>
<tr><td><code>arp -a</code></td><td>IP ↔ MAC ที่เครื่องจำไว้ — ใช้จับเคส IP ชนกัน</td></tr>
</table>
<p><b>ฝั่งสวิตช์ (IOS):</b></p>
<table class="tbl">
<tr><th>คำสั่ง</th><th>บอกอะไร</th></tr>
<tr><td><code>show ip interface brief</code></td><td>ทุก interface มี IP อะไร สถานะ up/down</td></tr>
<tr><td><code>show interfaces status</code></td><td>พอร์ตไหน connected / notconnect / disabled อยู่ VLAN ไหน</td></tr>
<tr><td><code>show mac address-table</code></td><td>สวิตช์เรียนรู้ MAC อะไรไว้ที่พอร์ตไหน</td></tr>
<tr><td><code>show ip route</code></td><td>เส้นทางที่รู้จัก — ว่าง = ไม่รู้จะส่งไปไหน</td></tr>
<tr><td><code>show version</code></td><td>รุ่น IOS, uptime, serial — ใช้ตอนรับมอบงาน</td></tr>
</table>
<div class="note"><b>ลำดับไล่ปัญหาที่ไม่มีวันผิด:</b>
<code>ping 127.0.0.1</code> (การ์ดตัวเองดีไหม) →
<code>ping IP ตัวเอง</code> →
<code>ping gateway</code> (L2/L3 ในวงดีไหม) →
<code>ping 8.8.8.8</code> (ออกเน็ตได้ไหม) →
<code>ping google.com</code> (DNS ดีไหม) — จุดที่เริ่มพังคือชั้นที่มีปัญหา</div>`,
    },
  ],
  quiz: [
    { type: 'mcq', q: 'Router ทำงานที่ OSI ชั้นไหน และใช้อะไรตัดสินใจส่งข้อมูล?', opts: ['ชั้น 2 ใช้ MAC address', 'ชั้น 3 ใช้ IP address', 'ชั้น 4 ใช้ port number', 'ชั้น 1 ใช้แรงดันไฟ'], a: 1, why: 'Router อยู่ชั้น 3 (Network) ใช้ destination IP เทียบกับ routing table ส่วน switch อยู่ชั้น 2 ใช้ MAC' },
    { type: 'mcq', q: 'ผู้ใช้ ping 8.8.8.8 ได้ แต่ ping google.com ไม่ได้ ปัญหาน่าจะอยู่ที่ไหน?', opts: ['สาย LAN ขาด', 'Default gateway ผิด', 'DNS', 'Switch พอร์ตเสีย'], a: 2, why: 'ออกอินเทอร์เน็ตด้วย IP ได้ แปลว่า L1–L3 ปกติหมด ที่พังคือการแปลงชื่อเป็น IP = DNS' },
    { type: 'mcq', q: 'ข้อใดคือเหตุผลที่ DNS query ใช้ UDP เป็นหลัก?', opts: ['เพราะต้องการความน่าเชื่อถือสูง', 'เพราะ query สั้นและต้องการความเร็ว ถ้าไม่ตอบก็ถามใหม่ได้', 'เพราะ UDP เข้ารหัสข้อมูล', 'เพราะ TCP ใช้กับ DNS ไม่ได้'], a: 1, why: 'DNS query เล็กและตอบเร็ว การจับมือแบบ TCP ทำให้ช้าโดยไม่จำเป็น — แต่ zone transfer ที่ข้อมูลใหญ่ยังใช้ TCP' },
    { type: 'mcq', q: 'เครือข่าย 192.168.20.0/26 มี host ใช้งานได้กี่เครื่อง และ broadcast address ของวงแรกคืออะไร?', opts: ['64 เครื่อง · 192.168.20.64', '62 เครื่อง · 192.168.20.63', '30 เครื่อง · 192.168.20.31', '126 เครื่อง · 192.168.20.127'], a: 1, why: '/26 เหลือ host bit 6 บิต = 2⁶ − 2 = 62 เครื่อง วงแรกคือ .0–.63 โดย .63 เป็น broadcast' },
    { type: 'mcq', q: 'เครื่องผู้ใช้ได้ IP 169.254.15.22 หมายความว่าอย่างไร?', opts: ['ได้ IP จาก DHCP ปกติ', 'ผู้ดูแลตั้ง static ไว้', 'ขอ IP จาก DHCP ไม่ได้ เครื่องจึงตั้ง APIPA เอง', 'เครื่องติดไวรัส'], a: 2, why: '169.254.x.x คือ APIPA — Windows ตั้งเองเมื่อหา DHCP server ไม่เจอ ให้ไปตรวจ VLAN ของพอร์ตและ DHCP relay' },
    { type: 'multi', q: 'ข้อใดเป็นวง IP แบบ private ที่ใช้ภายในองค์กรได้ (เลือกทุกข้อที่ถูก)', opts: ['10.20.30.0/24', '172.16.5.0/24', '8.8.8.0/24', '192.168.100.0/24'], a: [0, 1, 3], why: 'private คือ 10.0.0.0/8, 172.16.0.0/12 และ 192.168.0.0/16 ส่วน 8.8.8.0/24 เป็น public ของ Google' },
    { type: 'cmd', q: 'พิมพ์คำสั่งบนสวิตช์เพื่อดูว่าทุก interface มี IP อะไรและสถานะ up/down', ans: ['show ip interface brief', 'sh ip int brief', 'sh ip int br', 'show ip int brief'], why: 'show ip interface brief ให้ภาพรวม IP + สถานะทุก interface ในหน้าจอเดียว' },
  ],
  labs: [
    {
      id: 'c1-explore',
      title: 'Lab 1A — ไล่เส้นทางข้อมูลจากพอร์ตถึงปลายทาง',
      brief: 'ก่อนแตะการตั้งค่าใด ๆ ให้ทำความรู้จักเครื่องก่อน: เครื่องนี้รุ่นอะไร พอร์ตไหนมีคนใช้ สวิตช์เรียนรู้ MAC อะไรไว้บ้าง และข้อมูลออกไปข้างนอกทางไหน — ทั้งหมดนี้คือการอ่านเครือข่ายทีละชั้นตาม OSI',
      device: 'cisco',
      tasks: [
        { t: 'เข้าสู่ privileged EXEC mode', hint: 'enable', check: s => s.mode !== 'user' },
        { t: '<b>ชั้น 1–2:</b> ดูว่าพอร์ตไหน connected บ้าง', hint: 'show interfaces status', check: (s, h) => said(h, /^(do\s+)?sh(ow)?\s+int\w*\s+st/i) },
        { t: '<b>ชั้น 2:</b> ดูว่าสวิตช์เรียนรู้ MAC address ของใครไว้ที่พอร์ตไหน', hint: 'show mac address-table', check: (s, h) => said(h, /^(do\s+)?sh(ow)?\s+mac/i) },
        { t: '<b>ชั้น 3:</b> ดู IP ของทุก interface', hint: 'show ip interface brief', check: (s, h) => said(h, /^(do\s+)?sh(ow)?\s+ip\s+int/i) },
        { t: '<b>ชั้น 3:</b> ดูตารางเส้นทางว่าสวิตช์รู้จักวงไหนบ้าง', hint: 'show ip route', check: (s, h) => said(h, /^(do\s+)?sh(ow)?\s+ip\s+ro/i) },
        { t: 'ตั้ง hostname เป็น <code>SW-LAB-01</code> เพื่อไม่ให้สับสนกับเครื่องอื่น', hint: 'configure terminal → hostname SW-LAB-01', check: s => s.hostname === 'SW-LAB-01' },
        { t: 'ตั้ง IP ให้ VLAN 1 เป็น <code>192.168.1.10/24</code> <b>แล้วเปิดใช้งานด้วย <code>no shutdown</code></b>', hint: 'interface vlan 1 → ip address 192.168.1.10 255.255.255.0 → no shutdown', check: s => s.svis[1] && s.svis[1].ip === '192.168.1.10' && s.svis[1].shutdown === false },
        { t: 'ตั้ง default gateway เป็น <code>192.168.1.1</code>', hint: 'ip default-gateway 192.168.1.1', check: s => s.defaultGw === '192.168.1.1' },
        { t: 'ทดสอบว่าถึง gateway ด้วย <code>ping 192.168.1.1</code> — ต้องได้ <code>!!!!!</code> ไม่ใช่ <code>.....</code>', hint: 'end → ping 192.168.1.1', check: s => !!s.lastPing && s.lastPing.target === '192.168.1.1' && s.lastPing.ok },
        { t: 'บันทึก config', hint: 'write memory', check: s => !!s.savedConfig },
      ],
      debrief: `<b>ลำดับที่ใช้ได้ทุกเคส:</b> ดูชั้นล่างก่อนเสมอ — พอร์ต connected ไหม → MAC เรียนรู้หรือยัง → มี IP ไหม → มีเส้นทางไหม<br>
        <b>SVI ที่มี IP แต่ยังไม่ <code>no shutdown</code> จะ ping ไม่ผ่าน</b> — ของจริง VLAN 1 ขึ้นมาเป็น
        administratively down เสมอ เป็นกับดักที่ทำให้เสียเวลาไล่หาสาเหตุกันบ่อยมาก<br>
        <b>SVI ของ VLAN 1 ไม่ได้ทำให้สวิตช์ route ได้</b> — มันมีไว้ให้ remote เข้ามาจัดการเครื่องเท่านั้น
        สวิตช์ L2 ที่มี IP ก็ยังเป็นอุปกรณ์ชั้น 2 อยู่ดี<br>
        <b>สวิตช์ L2 ต้องมี default gateway</b> ถึงจะตอบกลับเครื่องที่อยู่คนละวงได้ — ไม่งั้น ping จากวงอื่นเข้ามาจะเงียบ`,
    },
    {
      id: 'c1-subnet',
      title: 'Lab 1B — วางแผน Subnet ให้สามแผนกแล้วตั้งค่าจริง',
      brief: 'บริษัทได้วง 192.168.50.0/24 มาหนึ่งวง ต้องซอยให้สามแผนกใช้แยกกัน แล้วตั้ง SVI ตามแผนที่วางไว้ — โจทย์คลาสสิกที่เจอทั้งในข้อสอบและวันแรกของงานจริง',
      device: 'cisco',
      init: { apply: st => { st.hostname = 'SW-HQ'; } },
      tasks: [
        { t: 'เข้า global config mode', hint: 'enable → configure terminal', check: s => s.mode.startsWith('config') || s.mode === 'priv' },
        { t: 'เปิด <code>ip routing</code> เพื่อให้สวิตช์ route ข้าม VLAN ได้', hint: 'ip routing', check: s => s.ipRouting === true },
        { t: 'สร้าง VLAN 10 ชื่อ <code>SALES</code>', hint: 'vlan 10 → name SALES', check: s => s.vlans[10] && /sales/i.test(s.vlans[10].name) },
        { t: 'สร้าง VLAN 20 ชื่อ <code>IT</code>', hint: 'vlan 20 → name IT', check: s => s.vlans[20] && /^it$/i.test(s.vlans[20].name) },
        { t: 'สร้าง VLAN 30 ชื่อ <code>CCTV</code>', hint: 'vlan 30 → name CCTV', check: s => s.vlans[30] && /cctv/i.test(s.vlans[30].name) },
        {
          t: 'ตั้ง SVI ของ VLAN 10 = <code>192.168.50.1</code> mask <code>255.255.255.192</code> (วงแรกของ /26)',
          hint: 'interface vlan 10 → ip address 192.168.50.1 255.255.255.192 → no shutdown',
          check: s => s.svis[10] && s.svis[10].ip === '192.168.50.1' && s.svis[10].mask === '255.255.255.192',
        },
        {
          t: 'ตั้ง SVI ของ VLAN 20 = <code>192.168.50.65/26</code> (วงที่สอง)',
          hint: 'ip address 192.168.50.65 255.255.255.192',
          check: s => s.svis[20] && s.svis[20].ip === '192.168.50.65' && s.svis[20].mask === '255.255.255.192',
        },
        {
          t: 'ตั้ง SVI ของ VLAN 30 = <code>192.168.50.129/26</code> (วงที่สาม)',
          hint: 'ip address 192.168.50.129 255.255.255.192',
          check: s => s.svis[30] && s.svis[30].ip === '192.168.50.129' && s.svis[30].mask === '255.255.255.192',
        },
        { t: 'เปิด SVI ทั้งสามวงให้ใช้งานได้ (ไม่มีตัวไหน shutdown)', hint: 'no shutdown ที่ทุก interface vlan', check: s => [10, 20, 30].every(v => s.svis[v] && s.svis[v].shutdown === false) },
        { t: 'ตรวจผลด้วย <code>show ip interface brief</code>', hint: 'do show ip interface brief', check: (s, h) => said(h, /^(do\s+)?sh(ow)?\s+ip\s+int/i) },
        { t: 'ตรวจว่า <code>show ip route</code> ขึ้นวงทั้งสามเป็น connected', hint: 'do show ip route', check: (s, h) => said(h, /^(do\s+)?sh(ow)?\s+ip\s+ro/i) },
        { t: 'บันทึก config', hint: 'end → write memory', check: s => !!s.savedConfig },
      ],
      debrief: `<b>/26 ซอย /24 ได้ 4 วง วงละ 62 host</b> — เลขวงคือ .0 / .64 / .128 / .192 และนิยมให้ gateway เป็นเลขแรกของวง (.1, .65, .129)<br>
        <b>SVI จะขึ้น up ก็ต่อเมื่อมี access port ของ VLAN นั้นที่ connected อยู่จริง</b> — ในแล็บอาจเห็น down ได้ ไม่ได้แปลว่าตั้งผิด<br>
        <b>อย่าให้วงใหญ่เกินจำเป็น</b> — วงเดียว /24 ทั้งบริษัทแปลว่า broadcast กระจายทั้ง 254 เครื่อง แยก VLAN ตามแผนกช่วยทั้งเรื่องประสิทธิภาพและความปลอดภัย`,
    },
  ],
};
