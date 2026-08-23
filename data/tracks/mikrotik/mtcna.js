// ============================================================
//  MikroTik Router — เนื้อหาและ Lab ตามหลักสูตร MTCNA
//  แยกตามระดับปลายทาง แล้วให้ ../mikrotik-router.js เอาไปต่อท้ายของเดิม
//
//    L1  Module 1  ทำความรู้จัก RouterOS, เข้าเครื่องครั้งแรก, CLI,
//                  ตั้งค่าเริ่มต้น, อัปเกรด, ผู้ใช้/service, backup, Netinstall
//    L2  Module 2  DHCP server/client และ ARP
//    L3  Module 3  Bridging   ·  Module 6  Firewall
//    L4  Module 4  Routing    ·  Module 7  QoS  ·  Module 8  Tunnels
//    L5  Module 5  Wireless   ·  Module 9  Misc (tools / monitoring / support)
// ============================================================
const T = (s, p) => s.tables[p] || [];
const has = (s, p, fn) => T(s, p).some(fn);
const said = (h, re) => h.some(c => re.test(String(c).trim()));
const svc = (s, name) => T(s, 'ip service').find(r => r.name === name);

export default {
  // ================================================================
  //  ระดับ 1 — MTCNA Module 1
  // ================================================================
  1: {
    sections: [
      {
        t: 'MTCNA Module 1 — RouterOS, RouterBOARD และ License',
        h: `
<p><b>RouterOS</b> คือระบบปฏิบัติการของ MikroTik ที่สร้างบนฐาน Linux แต่ถูกตัดและประกอบใหม่ให้ทำหน้าที่เป็นอุปกรณ์เครือข่ายโดยเฉพาะ
สิ่งสำคัญที่ต้องเข้าใจตั้งแต่แรกคือ <b>RouterOS ไม่ได้ผูกกับฮาร์ดแวร์ของ MikroTik</b> — ตัวเดียวกันนี้ลงได้หลายที่</p>
<table class="tbl">
<tr><th>ลงบนอะไรได้บ้าง</th><th>เรียกว่า</th><th>ใช้ตอนไหน</th></tr>
<tr><td>ฮาร์ดแวร์ MikroTik</td><td><b>RouterBOARD</b></td><td>งานหน้างานทั่วไป — มี license ในตัว ไม่ต้องซื้อเพิ่ม</td></tr>
<tr><td>เครื่อง x86 / PC</td><td>RouterOS x86</td><td>เอาเครื่องเก่ามาทำ router ต้องซื้อ license แยก</td></tr>
<tr><td>VM (VMware, Hyper-V, Proxmox)</td><td><b>CHR</b> — Cloud Hosted Router</td><td>lab, cloud, VPN concentrator — มี free tier จำกัดที่ 1Mbps</td></tr>
</table>
<p><b>RouterBOARD</b> คือชื่อเรียกฮาร์ดแวร์ของ MikroTik ทั้งตระกูล ชื่อรุ่นอ่านได้เป็นระบบ เช่น <code>RB760iGS</code> = hEX S</p>
<ul>
  <li><code>RB</code> = RouterBOARD · ตัวเลขตัวแรก = ซีรีส์ · ตัวอื่นบอกจำนวนพอร์ต</li>
  <li>ตัวอักษรท้ายบอกความสามารถ — <code>G</code> gigabit, <code>S</code> มี SFP, <code>i</code> มี PoE out, <code>2n/5ac</code> คือย่านความถี่ไร้สาย</li>
  <li>ทุกตัวมี <b>RouterBOOT</b> (firmware ระดับ bootloader) แยกจาก RouterOS — ต้องอัปเกรดทั้งคู่</li>
</ul>
<pre class="code"><span style="color:#5b6b8c"># เครื่องนี้เป็นรุ่นอะไร RouterOS เวอร์ชันไหน</span>
/system resource print

<span style="color:#5b6b8c"># license level ของเครื่องนี้</span>
/system license print</pre>
<p><b>License levels</b> — RouterBOARD มาพร้อม level 4 ขึ้นไปเสมอ เรื่องนี้จะมีผลเฉพาะตอนลง RouterOS บน x86 หรือ CHR</p>
<table class="tbl">
<tr><th>Level</th><th>ชื่อ</th><th>ข้อจำกัดที่สำคัญ</th></tr>
<tr><td>0</td><td>Demo</td><td>ใช้ได้ 24 ชั่วโมง แล้วต้องลงใหม่</td></tr>
<tr><td>1</td><td>Free</td><td>ฟีเจอร์จำกัดมาก ใช้ทดลองเท่านั้น</td></tr>
<tr><td>3</td><td>CPE</td><td>ไร้สายเป็น <b>station</b> ได้อย่างเดียว ทำ AP ไม่ได้</td></tr>
<tr><td>4</td><td>WISP</td><td>ทำ AP ได้ · PPPoE 200 session — ระดับที่ RouterBOARD ส่วนใหญ่ใช้</td></tr>
<tr><td>5</td><td>WISP AP</td><td>PPPoE 500 session</td></tr>
<tr><td>6</td><td>Controller</td><td>ไม่จำกัด</td></tr>
</table>
<div class="note"><b>หาคำตอบจากที่ไหน</b> — เรียงตามลำดับที่ควรลอง<br>
<code>help.mikrotik.com</code> เอกสารทางการ (เดิมคือ wiki.mikrotik.com) · <code>forum.mikrotik.com</code> เคสจริงจากคนใช้งาน ·
<b>MUM</b> (MikroTik User Meeting) งานสัมมนาที่มีสไลด์ย้อนหลังให้ดาวน์โหลด · ตัวแทนจำหน่ายในประเทศสำหรับงานที่ต้องมีคนรับผิดชอบ ·
<code>support@mikrotik.com</code> เมื่อสงสัยว่าเป็นบั๊กของ RouterOS เอง (ต้องแนบ supout.rif เสมอ)</div>`,
      },
      {
        t: 'เข้าเครื่องครั้งแรก — WinBox, MAC-WinBox, WebFig และ Quick Set',
        h: `
<p>เครื่องใหม่แกะกล่องยังไม่มี IP ที่คุณกำหนดเอง — คำถามแรกคือจะเข้าไปยังไง คำตอบที่ MikroTik ให้มาคือ <b>MAC-WinBox</b></p>
<table class="tbl">
<tr><th>วิธี</th><th>ต้องมี IP ก่อนไหม</th><th>เหมาะกับ</th></tr>
<tr><td><b>WinBox (IP)</b> พอร์ต 8291</td><td>ต้องมี</td><td>ใช้งานประจำวัน — เร็วและครบที่สุด</td></tr>
<tr><td><b>MAC-WinBox</b></td><td><b>ไม่ต้อง</b></td><td>เครื่องใหม่ / ตั้ง IP ผิดจนเข้าไม่ได้ — คุยกันที่ Layer 2 ตรง ๆ</td></tr>
<tr><td><b>WebFig</b> พอร์ต 80/443</td><td>ต้องมี</td><td>เครื่องที่ลง WinBox ไม่ได้ (Mac, มือถือ, เครื่องลูกค้า)</td></tr>
<tr><td><b>SSH / Telnet</b> 22 / 23</td><td>ต้องมี</td><td>CLI, สคริปต์, ทำงานผ่าน VPN</td></tr>
<tr><td><b>Serial console</b></td><td>ไม่ต้อง</td><td>เครื่องบูตไม่ขึ้น / แก้ config จนเน็ตหลุดหมด</td></tr>
</table>
<div class="note warn"><b>MAC-WinBox เป็นดาบสองคม</b> — มันข้ามทุก firewall rule เพราะทำงานที่ Layer 2 ใครก็ตามที่ต่อสายเข้ามาในวงเดียวกันจึงเห็นและลองเข้าได้
งานจริงต้องจำกัดให้เหลือเฉพาะฝั่ง LAN<br>
<code>/tool mac-server set allowed-interface-list=LAN</code><br>
<code>/tool mac-server mac-winbox set allowed-interface-list=LAN</code></div>
<p><b>Quick Set</b> คือหน้าตั้งค่าสำเร็จรูปใน WinBox/WebFig เลือกโหมด (Home AP, CPE, PTP Bridge, WISP AP) แล้วกรอกไม่กี่ช่องก็ใช้งานได้
เหมาะกับงานติดตั้งซ้ำ ๆ ที่หน้างาน แต่ต้องรู้ว่ามันไป <b>เขียนทับ</b> config เดิมในส่วนที่มันดูแล</p>
<p><b>Default configuration</b> ที่ติดมากับ RouterBOARD — ต้องรู้ก่อนแก้อะไร</p>
<ul>
  <li><code>ether1</code> = WAN เป็น DHCP client และมี masquerade ให้แล้ว</li>
  <li><code>ether2</code> ขึ้นไป = LAN ถูกรวมอยู่ใน <code>bridge</code> เดียวกัน</li>
  <li>bridge มี IP <code>192.168.88.1/24</code> และแจก DHCP ช่วง <code>.10–.254</code></li>
  <li>มี firewall filter พื้นฐานกันจากฝั่ง WAN และ user <code>admin</code> ที่ RouterOS 7 บังคับตั้งรหัสตอน login แรก</li>
</ul>`,
      },
      {
        t: 'CLI ของ RouterOS — ช่องทางและหลักการใช้งาน',
        h: `
<p>เข้า CLI ได้ 3 ทาง และทั้งสามทางเจอหน้าตาเดียวกันทุกประการ</p>
<table class="tbl">
<tr><th>ทาง</th><th>รายละเอียด</th></tr>
<tr><td><b>Null modem cable</b></td><td>สาย serial ไขว้ (RS-232) ต่อเข้าพอร์ต console ตั้งค่า <code>115200 8N1</code> ไม่มี flow control — เป็นทางเดียวที่ยังใช้ได้เมื่อ config พังจนเน็ตหลุด</td></tr>
<tr><td><b>SSH / Telnet</b></td><td>SSH พอร์ต 22 เข้ารหัส · Telnet พอร์ต 23 <b>ส่งรหัสผ่านเป็นข้อความเปล่า</b> — งานจริงให้ปิด telnet ทิ้ง</td></tr>
<tr><td><b>New Terminal</b></td><td>ปุ่มใน WinBox และ WebFig — ได้ CLI เต็มรูปแบบโดยไม่ต้องเปิดโปรแกรมอื่น เป็นวิธีที่สะดวกที่สุดตอนเรียน</td></tr>
</table>
<p><b>หลักการที่ทำให้พิมพ์เร็วขึ้นเป็นเท่าตัว</b></p>
<table class="tbl">
<tr><th>ปุ่ม</th><th>ทำอะไร</th></tr>
<tr><td><code>&lt;Tab&gt;</code></td><td>เติมคำที่เหลือให้ ถ้ามีคำตอบเดียว</td></tr>
<tr><td><code>&lt;Tab&gt;&lt;Tab&gt;</code></td><td>กดสองครั้ง = แสดงตัวเลือกทั้งหมดที่ขึ้นต้นแบบนั้น</td></tr>
<tr><td><code>?</code></td><td>อธิบายว่าตรงตำแหน่งนี้ใส่อะไรได้บ้าง (เมนูย่อย คำสั่ง และฟิลด์)</td></tr>
<tr><td><code>..</code> / <code>/</code></td><td>ขึ้นหนึ่งชั้น / กลับไป root</td></tr>
<tr><td><code>↑</code> <code>↓</code></td><td>เดินย้อนประวัติคำสั่ง — แก้แล้วกด Enter ซ้ำได้เลย</td></tr>
<tr><td><code>Ctrl+X</code></td><td><b>Safe Mode</b> — ถ้าหลุดการเชื่อมต่อ RouterOS จะย้อน config ที่ทำในโหมดนี้กลับให้เอง</td></tr>
</table>
<pre class="code"><span style="color:#5b6b8c"># ย่อคำสั่งได้ตราบใดที่ยังไม่กำกวม — สามบรรทัดนี้ให้ผลเหมือนกัน</span>
/interface print
/int print
/in pr

<span style="color:#5b6b8c"># ประวัติคำสั่งมีประโยชน์มากตอนไล่ปัญหา เพราะย้อนดูได้ว่าเราเพิ่งแก้อะไรไป</span>
<span style="color:#5b6b8c"># และเป็นเหตุผลที่ควรพิมพ์คำสั่งเต็ม ๆ ตอนทำงานจริง คนอื่นจะได้อ่านออก</span></pre>
<div class="note"><b>เคล็ดลับที่ใช้ได้ทุกวัน</b> — พิมพ์ <code>?</code> ตรงไหนก็ได้ที่ไม่แน่ใจ RouterOS จะบอกว่าตำแหน่งนั้นใส่อะไรต่อได้
ไม่ต้องจำทุกพารามิเตอร์ แค่จำโครงสร้างเมนูให้ได้ก็พอ</div>`,
      },
      {
        t: 'Initial configuration — ตั้งค่าให้ออกอินเทอร์เน็ตได้',
        h: `
<p>สามอย่างที่ต้องมีให้ครบ ไม่ว่าจะเป็นงานเล็กหรือใหญ่ — <b>ขาออก (WAN) · ขาเข้า (LAN) · NAT</b></p>
<pre class="code"><span style="color:#5b6b8c"># 1) WAN — รับ IP จาก ISP อัตโนมัติ</span>
/ip dhcp-client add interface=ether1 disabled=no
/ip dhcp-client print          <span style="color:#5b6b8c"># status ต้องเป็น bound ถึงจะใช้ได้</span>

<span style="color:#5b6b8c"># 2) LAN — ใส่ IP ให้ฝั่งใน แล้วตั้ง DNS</span>
/ip address add address=192.168.88.1/24 interface=ether2
/ip dns set servers=8.8.8.8,1.1.1.1 allow-remote-requests=yes

<span style="color:#5b6b8c"># 3) NAT — แปลง IP ในบ้านให้เป็น IP จริงตอนออกเน็ต</span>
/ip firewall nat add chain=srcnat out-interface=ether1 action=masquerade

<span style="color:#5b6b8c"># ตรวจว่าออกได้จริง</span>
/ping 8.8.8.8</pre>
<div class="note"><b>ถ้า ISP ให้ IP คงที่มา</b> ให้เปลี่ยนขั้นที่ 1 เป็นสองบรรทัดนี้แทน<br>
<code>/ip address add address=203.0.113.25/29 interface=ether1</code><br>
<code>/ip route add dst-address=0.0.0.0/0 gateway=203.0.113.1</code><br>
DHCP client จะใส่ default route ให้เองอัตโนมัติ แต่แบบ static คุณต้องใส่เอง — จุดนี้คือที่ที่คนพลาดบ่อยที่สุด</div>
<div class="note warn"><b>ลำดับสำคัญ</b> — ใส่ NAT ก่อนแล้วค่อยเสียบ WAN ได้ แต่ถ้าใส่ IP LAN ทับวงเดียวกับ WAN เมื่อไหร่ routing จะพังทันที
ตรวจด้วย <code>/ip address print</code> ทุกครั้งว่าไม่มีวงซ้ำกัน</div>`,
      },
      {
        t: 'อัปเกรด RouterOS และ RouterBOOT firmware',
        h: `
<p>RouterOS แจกเป็นไฟล์ <code>.npk</code> (MikroTik Package) มีสองแบบที่ต้องแยกให้ออก</p>
<table class="tbl">
<tr><th>แบบ</th><th>คืออะไร</th><th>ใช้เมื่อ</th></tr>
<tr><td><b>Bundle</b> (routeros-*.npk)</td><td>รวมทุกอย่างที่ใช้บ่อยไว้ก้อนเดียว</td><td>เกือบทุกกรณี — อัปเกรดง่ายที่สุด</td></tr>
<tr><td><b>Extra packages</b></td><td>แยกเป็นก้อนย่อย เช่น <code>wireless</code>, <code>ppp</code>, <code>security</code>, <code>advanced-tools</code>, <code>user-manager</code></td><td>เครื่องที่พื้นที่เก็บข้อมูลน้อย ลงเฉพาะที่ใช้ หรือเครื่องที่ต้องการฟีเจอร์นอก bundle</td></tr>
</table>
<pre class="code"><span style="color:#5b6b8c"># ดูว่ามี package อะไรอยู่บ้าง เวอร์ชันเท่าไหร่</span>
/system package print</pre>
<p><b>ช่องทางอัปเกรด — 3 ทาง</b></p>
<table class="tbl">
<tr><th>วิธี</th><th>ขั้นตอน</th><th>ข้อควรระวัง</th></tr>
<tr><td><b>อัตโนมัติ</b></td><td><code>/system package update check-for-updates</code> แล้ว <code>download</code> + reboot</td><td>เครื่องต้องออกเน็ตได้ — เลือก channel ให้ถูก (stable / long-term / testing)</td></tr>
<tr><td><b>ลากไฟล์เข้า Files</b></td><td>ดาวน์โหลด .npk เอง แล้วลากใส่หน้าต่าง Files ใน WinBox → reboot</td><td>ทางที่ใช้ได้เสมอแม้เครื่องไม่มีเน็ต</td></tr>
<tr><td><b>Netinstall</b></td><td>ลงใหม่ทั้งเครื่องผ่านสาย LAN</td><td>ล้าง config หมด — ใช้ตอนกู้เครื่องเท่านั้น</td></tr>
</table>
<pre class="code"><span style="color:#5b6b8c"># ตรวจว่ามีเวอร์ชันใหม่ไหม</span>
/system package update check-for-updates
/system package update download

<span style="color:#5b6b8c"># หลัง reboot เสร็จ ต้องอัปเกรด RouterBOOT ตามด้วยเสมอ</span>
/system routerboard print         <span style="color:#5b6b8c"># current-firmware ต่างจาก upgrade-firmware ไหม</span>
/system routerboard upgrade
/system reboot</pre>
<div class="note warn"><b>คนลืมขั้นตอนนี้บ่อยที่สุด</b> — อัปเกรด RouterOS แล้วไม่อัปเกรด RouterBOOT ต่อ
ผลคือฟีเจอร์บางอย่าง (โดยเฉพาะ PoE, USB และการบูต) ทำงานไม่ครบ ให้ทำเรียงกันเสมอ:
<b>RouterOS → reboot → routerboard upgrade → reboot</b></div>`,
      },
      {
        t: 'Router identity, ผู้ใช้ และ services ที่เปิดอยู่',
        h: `
<pre class="code"><span style="color:#5b6b8c"># ตั้งชื่อเครื่อง — ทำเป็นอย่างแรกเสมอ ชื่อจะไปอยู่บน prompt, WinBox และ log</span>
/system identity set name=RTR-HQ</pre>
<p><b>จัดการผู้ใช้</b> — RouterOS มี group มาให้สามแบบ และสร้างเพิ่มเองได้</p>
<table class="tbl">
<tr><th>Group</th><th>ทำอะไรได้</th></tr>
<tr><td><code>read</code></td><td>ดูอย่างเดียว แก้ไม่ได้ — เหมาะกับ NOC ที่ทำหน้าที่เฝ้าดู</td></tr>
<tr><td><code>write</code></td><td>แก้ config ได้ แต่จัดการ user ไม่ได้</td></tr>
<tr><td><code>full</code></td><td>ทำได้ทุกอย่างรวมถึงเพิ่ม/ลบผู้ใช้</td></tr>
</table>
<pre class="code">/user add name=noc group=read password=Str0ngPass!
/user add name=eng group=full password=An0therStr0ng!

<span style="color:#5b6b8c"># จำกัดว่าผู้ใช้นี้เข้าได้จากวงไหนเท่านั้น — ได้ผลดีมากและทำง่าย</span>
/user set [find name=noc] address=10.10.99.0/24

/user print</pre>
<p><b>ปิด service ที่ไม่ได้ใช้</b> — ทุก service ที่เปิดคือประตูอีกบาน</p>
<pre class="code">/ip service print

<span style="color:#5b6b8c"># ปิดตัวที่ส่งรหัสผ่านเป็นข้อความเปล่าและตัวที่ไม่ได้ใช้</span>
/ip service set [find name=telnet] disabled=yes
/ip service set [find name=ftp] disabled=yes
/ip service set [find name=api] disabled=yes

<span style="color:#5b6b8c"># ตัวที่ยังต้องใช้ ให้จำกัดว่าเข้าได้จากวงไหน</span>
/ip service set [find name=ssh] address=10.10.99.0/24
/ip service set [find name=winbox] address=10.10.99.0/24</pre>
<div class="note"><b>ทำไมต้องปิด</b> — telnet และ ftp ส่งรหัสผ่านแบบอ่านได้ ใครดักสายกลางทางก็ได้รหัสไปเลย
ส่วน api และ www ถ้าไม่ได้ใช้จริงก็ไม่มีเหตุผลให้เปิดทิ้งไว้</div>`,
      },
      {
        t: 'Backup, Export, Reset และ Netinstall',
        h: `
<p>สองคำนี้คนสับสนกันบ่อยที่สุด และมันทำงานคนละแบบสิ้นเชิง</p>
<table class="tbl">
<tr><th></th><th><code>/system backup save</code></th><th><code>/export</code></th></tr>
<tr><td>รูปแบบไฟล์</td><td>binary (.backup)</td><td>ข้อความ (.rsc)</td></tr>
<tr><td>อ่าน/แก้ด้วยมือ</td><td>ไม่ได้</td><td><b>ได้</b> — เปิดด้วย text editor ธรรมดา</td></tr>
<tr><td>เก็บอะไรบ้าง</td><td>ทั้งเครื่อง รวมรหัสผ่านผู้ใช้และ certificate</td><td>เฉพาะ config — ไม่มีรหัสผ่านผู้ใช้</td></tr>
<tr><td>ย้ายข้ามเครื่อง/ข้ามรุ่น</td><td><b>ไม่ได้</b></td><td>ได้</td></tr>
<tr><td>เหมาะกับ</td><td>กู้เครื่องเดิมกลับสภาพเดิมเป๊ะ ๆ</td><td>ย้าย config ไปเครื่องใหม่ · เก็บลง git · ส่งให้คนอื่นตรวจ</td></tr>
</table>
<pre class="code"><span style="color:#5b6b8c"># ควรทำทั้งสองแบบ ตั้งชื่อให้มีวันที่กำกับเสมอ</span>
/system backup save name=RTR-HQ-2026-08-23
/export file=RTR-HQ-2026-08-23
/file print                       <span style="color:#5b6b8c"># ดูว่าไฟล์ถูกสร้างจริง แล้วดึงออกไปเก็บที่อื่น</span>

<span style="color:#5b6b8c"># export เฉพาะบางส่วนก็ได้ — สะดวกตอนจะส่งให้คนอื่นดูเฉพาะเรื่องที่มีปัญหา</span>
/ip firewall export
/export compact                   <span style="color:#5b6b8c"># ตัดค่า default ออก เหลือเฉพาะที่เราแก้เอง</span></pre>
<p><b>แก้ไฟล์ export แล้วเอากลับเข้าเครื่อง</b> — เปิดไฟล์ .rsc ด้วย text editor แก้ IP/ชื่อให้ตรงกับเครื่องใหม่
(อย่าลืมแก้ <code>interface=</code> ให้ตรงกับพอร์ตที่มีจริงในรุ่นนั้น) แล้วสั่ง</p>
<pre class="code">/import file-name=RTR-HQ-2026-08-23.rsc</pre>
<p><b>รีเซ็ตเครื่อง</b></p>
<pre class="code"><span style="color:#5b6b8c"># รีเซ็ตแล้วเอา default config กลับมา</span>
/system reset-configuration

<span style="color:#5b6b8c"># รีเซ็ตแบบว่างเปล่าจริง ๆ ไม่เอา default อะไรเลย</span>
/system reset-configuration no-defaults=yes skip-backup=yes

<span style="color:#5b6b8c"># รีเซ็ต config แต่เก็บบัญชีผู้ใช้ไว้</span>
/system reset-configuration keep-users=yes</pre>
<div class="note warn"><b>Netinstall — ทางสุดท้ายเมื่อทุกอย่างล้มเหลว</b><br>
ใช้เมื่อ: ลืมรหัส admin · RouterOS พังจนบูตไม่ขึ้น · ต้องการล้างเครื่องให้สะอาดจริง ๆ ก่อนส่งต่อ<br>
วิธี: ต่อสาย LAN <b>ตรง</b>จาก PC เข้าพอร์ต ether1 → รัน Netinstall บน Windows → กดปุ่ม reset ค้างไว้ตอนจ่ายไฟ (หรือตั้ง boot-device เป็น etherboot)
→ เครื่องจะโผล่ในรายการ → เลือกไฟล์ .npk แล้วกด Install<br>
<b>ล้างทุกอย่างรวมถึง license ที่ซื้อเพิ่มบน x86</b> — เก็บ key ไว้ก่อนเสมอ</div>`,
      },
    ],

    quiz: [
      { type: 'mcq', q: 'RouterOS ต่างจาก RouterBOARD อย่างไร', opts: ['เหมือนกัน เป็นชื่อเรียกคนละยุค', 'RouterOS คือระบบปฏิบัติการ ส่วน RouterBOARD คือฮาร์ดแวร์', 'RouterOS ใช้กับ router ส่วน RouterBOARD ใช้กับ switch', 'RouterBOARD คือเวอร์ชันฟรีของ RouterOS'], a: 1, why: 'RouterOS เป็น OS ที่ลงได้ทั้งบน RouterBOARD, เครื่อง x86 และ VM (เรียกว่า CHR) ส่วน RouterBOARD คือชื่อตระกูลฮาร์ดแวร์ของ MikroTik ซึ่งมี license ติดมาให้ในตัว' },
      { type: 'mcq', q: 'เครื่องใหม่แกะกล่องที่ยังไม่มี IP จะเข้าไปตั้งค่าด้วยวิธีใด', opts: ['SSH ไปที่ 192.168.1.1', 'MAC-WinBox — คุยกันที่ Layer 2 โดยไม่ต้องมี IP', 'ต้องใช้สาย console อย่างเดียว', 'WebFig ผ่าน IP ที่โรงงานตั้งมา'], a: 1, why: 'MAC-WinBox เชื่อมด้วย MAC address ตรง ๆ ที่ Layer 2 จึงข้ามเรื่อง IP ไปได้ทั้งหมด — แต่ด้วยเหตุผลเดียวกันนี้ต้องจำกัดให้ใช้ได้เฉพาะฝั่ง LAN ในงานจริง' },
      { type: 'mcq', q: 'ตั้งค่าพอร์ต console (null modem) ของ RouterBOARD ที่ค่าใด', opts: ['9600 8N1', '38400 7E1', '115200 8N1', '57600 8N2'], a: 2, why: '115200 8N1 ไม่มี flow control เป็นค่ามาตรฐานของ RouterBOARD — จำไว้เพราะเป็นทางเดียวที่เข้าได้เมื่อ config พังจนเน็ตหลุดหมด' },
      { type: 'mcq', q: 'กด <code>&lt;Tab&gt;</code> สองครั้งใน CLI ได้ผลอะไร', opts: ['ยกเลิกคำสั่ง', 'แสดงตัวเลือกทั้งหมดที่ขึ้นต้นแบบนั้น', 'ทำซ้ำคำสั่งล่าสุด', 'เข้าสู่ Safe Mode'], a: 1, why: 'กดครั้งเดียว = เติมให้ถ้ามีคำตอบเดียว · กดสองครั้ง = โชว์ตัวเลือกทั้งหมด ส่วน Safe Mode คือ Ctrl+X' },
      { type: 'cmd', q: 'พิมพ์คำสั่งดูว่ามี package อะไรติดตั้งอยู่บ้าง', ans: ['/system package print', 'system package print'], why: 'ใช้ตรวจก่อนอัปเกรดว่าเครื่องนี้ลง bundle หรือแยก extra packages ไว้ และแต่ละตัวเป็นเวอร์ชันอะไร' },
      { type: 'cmd', q: 'พิมพ์คำสั่งสำรอง config เป็นไฟล์ข้อความชื่อ <code>RTR-HQ</code>', ans: ['/export file=RTR-HQ', 'export file=RTR-HQ'], why: 'export ได้ไฟล์ .rsc ที่เปิดอ่านและแก้ไขได้ ย้ายข้ามเครื่องได้ ต่างจาก /system backup save ที่เป็น binary กู้ได้เฉพาะเครื่องเดิม' },
      { type: 'mcq', q: 'ต้องการย้าย config จาก hEX ตัวเก่าไปลงตัวใหม่ที่เป็นคนละรุ่น ควรใช้อะไร', opts: ['/system backup save แล้ว load ที่เครื่องใหม่', '/export แล้วแก้ไฟล์ .rsc ให้ตรงกับพอร์ตของเครื่องใหม่ ก่อน import', 'Netinstall', 'Quick Set'], a: 1, why: 'ไฟล์ backup เป็น binary ที่ผูกกับรุ่นและเวอร์ชัน ย้ายข้ามรุ่นไม่ได้ — ต้องใช้ export แล้วแก้ชื่อ interface ให้ตรงกับพอร์ตที่มีจริงในรุ่นใหม่' },
      { type: 'mcq', q: 'หลังอัปเกรด RouterOS เสร็จและ reboot แล้ว ต้องทำอะไรต่อ', opts: ['ไม่ต้องทำอะไร จบแล้ว', 'อัปเกรด RouterBOOT ด้วย /system routerboard upgrade แล้ว reboot อีกครั้ง', 'รัน Netinstall', 'reset-configuration'], a: 1, why: 'RouterBOOT คือ firmware ระดับ bootloader ที่แยกจาก RouterOS ถ้าไม่อัปเกรดตาม ฟีเจอร์อย่าง PoE, USB และการบูตอาจทำงานไม่ครบ' },
      { type: 'mcq', q: 'License level ใดที่ทำ Access Point ไม่ได้ ใช้เป็น station ได้อย่างเดียว', opts: ['Level 3 (CPE)', 'Level 4 (WISP)', 'Level 5', 'Level 6'], a: 0, why: 'Level 3 ออกแบบมาสำหรับอุปกรณ์ปลายทางของลูกค้า จึงเป็น station ได้อย่างเดียว ต้อง Level 4 ขึ้นไปจึงทำ AP ได้' },
      { type: 'multi', q: 'ข้อใดคือสถานการณ์ที่ต้องใช้ Netinstall (เลือกทุกข้อที่ถูก)', opts: ['ลืมรหัสผ่าน admin และไม่มีทางเข้าเครื่องเลย', 'RouterOS เสียหายจนบูตไม่ขึ้น', 'อยากเพิ่ม IP ใหม่ให้ ether3', 'ต้องการล้างเครื่องให้สะอาดก่อนส่งต่อให้คนอื่น'], a: [0, 1, 3], why: 'Netinstall คือการลง RouterOS ใหม่ทั้งเครื่องผ่านสาย LAN ล้างทุกอย่างทิ้ง — งานตั้งค่าปกติอย่างการเพิ่ม IP ไม่มีเหตุผลใดที่ต้องใช้' },
      { type: 'multi', q: 'ควรปิด service ใดบ้างบน router ที่ต่ออินเทอร์เน็ตจริง (เลือกทุกข้อที่ถูก)', opts: ['telnet', 'ftp', 'ssh', 'api ที่ไม่ได้ใช้'], a: [0, 1, 3], why: 'telnet และ ftp ส่งรหัสผ่านเป็นข้อความเปล่า ส่วน api ถ้าไม่ได้เชื่อมกับระบบภายนอกก็ไม่ควรเปิด — ssh ยังต้องใช้ แต่ควรจำกัดด้วย address=' },
    ],

    labs: [
      {
        id: 'mtcna-m1a',
        title: 'MTCNA Module 1 Lab A — ตั้งค่าเครื่องใหม่ให้ออกอินเทอร์เน็ต',
        brief: 'RouterBOARD ตัวใหม่เพิ่งมาถึงสาขา คุณเข้าเครื่องผ่าน MAC-WinBox ได้แล้ว งานตอนนี้คือสำรวจเครื่อง ตั้งชื่อ แล้วทำให้ฝั่ง LAN ออกเน็ตได้ครบทั้งสามขา — WAN, LAN และ NAT',
        device: 'mikrotik',
        tasks: [
          { t: 'ดูว่าเครื่องนี้เป็นรุ่นอะไร RouterOS เวอร์ชันไหน', hint: '/system resource print', check: (s, h) => said(h, /system\s+resource\s+print/i) },
          { t: 'ดูว่ามี package อะไรติดตั้งอยู่บ้าง', hint: '/system package print', check: (s, h) => said(h, /system\s+package\s+print/i) },
          { t: 'ดู license level ของเครื่อง', hint: '/system license print', check: (s, h) => said(h, /system\s+license\s+print/i) },
          { t: 'ตั้งชื่อเครื่องเป็น <code>RTR-MTCNA</code>', hint: '/system identity set name=RTR-MTCNA', check: s => s.settings['system identity'].name === 'RTR-MTCNA' },
          { t: 'ตั้ง <code>ether1</code> เป็น WAN แบบ DHCP client', hint: '/ip dhcp-client add interface=ether1 disabled=no', check: s => has(s, 'ip dhcp-client', r => r.interface === 'ether1' && r.disabled !== true) },
          { t: 'ใส่ IP <code>192.168.88.1/24</code> ให้ฝั่ง LAN ที่ <code>ether2</code>', hint: '/ip address add address=192.168.88.1/24 interface=ether2', check: s => has(s, 'ip address', r => r.address === '192.168.88.1/24' && r.interface === 'ether2') },
          { t: 'ตั้ง DNS เป็น <code>8.8.8.8,1.1.1.1</code> และเปิด allow-remote-requests', hint: '/ip dns set servers=8.8.8.8,1.1.1.1 allow-remote-requests=yes', check: s => /8\.8\.8\.8/.test(s.settings['ip dns'].servers) && s.settings['ip dns']['allow-remote-requests'] === 'yes' },
          { t: 'ทำ NAT masquerade ออกทาง <code>ether1</code>', hint: '/ip firewall nat add chain=srcnat out-interface=ether1 action=masquerade', check: s => has(s, 'ip firewall nat', r => r.chain === 'srcnat' && r.action === 'masquerade' && r['out-interface'] === 'ether1') },
          { t: 'ทดสอบว่าออกอินเทอร์เน็ตได้จริง', hint: '/ping 8.8.8.8', check: (s, h) => said(h, /ping\s+8\.8\.8\.8/i) },
        ],
      },
      {
        id: 'mtcna-m1b',
        title: 'MTCNA Module 1 Lab B — อัปเกรด ปิดช่องทางที่ไม่ใช้ และสำรอง config',
        brief: 'เครื่องตั้งค่าเสร็จแล้วแต่ยังส่งมอบไม่ได้ ต้องตรวจเวอร์ชัน จัดการบัญชีผู้ใช้ ปิด service ที่เสี่ยง แล้วเก็บ config ทั้งสองแบบก่อนขึ้นระบบจริง',
        device: 'mikrotik',
        tasks: [
          { t: 'ตรวจว่ามี RouterOS เวอร์ชันใหม่หรือไม่', hint: '/system package update check-for-updates', check: (s, h) => said(h, /package\s+update\s+check-for-updates/i) },
          { t: 'ดูสถานะ RouterBOOT firmware ของเครื่อง', hint: '/system routerboard print', check: (s, h) => said(h, /system\s+routerboard\s+print/i) },
          { t: 'สร้างผู้ใช้ <code>noc</code> สิทธิ์ <code>read</code> ไว้ให้ทีมเฝ้าระวัง', hint: '/user add name=noc group=read password=Str0ngPass!', check: s => has(s, 'user', r => r.name === 'noc' && r.group === 'read') },
          { t: 'ดูรายการ service ที่เปิดอยู่', hint: '/ip service print', check: (s, h) => said(h, /ip\s+service\s+print/i) },
          { t: 'ปิด <code>telnet</code> เพราะส่งรหัสผ่านเป็นข้อความเปล่า', hint: '/ip service set [find name=telnet] disabled=yes', check: s => { const r = svc(s, 'telnet'); return !!r && (r.disabled === true || r.disabled === 'yes'); } },
          { t: 'ปิด <code>ftp</code> ด้วยเหตุผลเดียวกัน', hint: '/ip service set [find name=ftp] disabled=yes', check: s => { const r = svc(s, 'ftp'); return !!r && (r.disabled === true || r.disabled === 'yes'); } },
          { t: 'จำกัด MAC-WinBox ให้ใช้ได้เฉพาะฝั่ง LAN', hint: '/tool mac-server mac-winbox set allowed-interface-list=LAN', check: s => s.settings['tool mac-server mac-winbox']['allowed-interface-list'] === 'LAN' },
          { t: 'สำรองแบบ binary ชื่อ <code>RTR-MTCNA</code>', hint: '/system backup save name=RTR-MTCNA', check: s => has(s, 'file', f => f.name === 'RTR-MTCNA.backup') },
          { t: 'สำรองแบบข้อความชื่อ <code>RTR-MTCNA</code>', hint: '/export file=RTR-MTCNA', check: s => has(s, 'file', f => f.name === 'RTR-MTCNA.rsc') },
          { t: 'ตรวจว่าไฟล์ทั้งสองถูกสร้างจริง', hint: '/file print', check: (s, h) => said(h, /^\/?file\s+print/i) },
        ],
      },
    ],
  },

  // ================================================================
  //  ระดับ 2 — MTCNA Module 2: DHCP และ ARP
  // ================================================================
  2: {
    sections: [
      {
        t: 'MTCNA Module 2 — DHCP client',
        h: `
<p>DHCP ทำงานด้วยสี่ข้อความที่จำง่าย ๆ ว่า <b>DORA</b> — และการรู้ลำดับนี้ช่วยไล่ปัญหาได้มาก
เพราะเมื่อเครื่องลูกไม่ได้ IP คุณจะรู้ว่าควรไปดักดูที่ขั้นไหน</p>
<table class="tbl">
<tr><th>ขั้น</th><th>ใคร→ใคร</th><th>เกิดอะไรขึ้น</th></tr>
<tr><td><b>D</b>iscover</td><td>client → broadcast</td><td>"มีใครแจก IP บ้าง" ส่งแบบ broadcast เพราะยังไม่มี IP</td></tr>
<tr><td><b>O</b>ffer</td><td>server → client</td><td>"เอา 192.168.88.24 ไปไหม" เสนอ IP พร้อม gateway/DNS/lease-time</td></tr>
<tr><td><b>R</b>equest</td><td>client → broadcast</td><td>"ขอตัวนั้นนะ" — ส่ง broadcast เพื่อบอก server ตัวอื่นว่าไม่เอาของเขา</td></tr>
<tr><td><b>A</b>ck</td><td>server → client</td><td>"ยืนยัน" client จึงเริ่มใช้ IP ได้</td></tr>
</table>
<pre class="code"><span style="color:#5b6b8c"># ฝั่ง client — ใช้ตอนต่อ WAN เข้ากับ ISP</span>
/ip dhcp-client add interface=ether1 disabled=no
/ip dhcp-client print          <span style="color:#5b6b8c"># status ต้องเป็น bound</span>
/ip dhcp-client print detail</pre>
<table class="tbl">
<tr><th>พารามิเตอร์</th><th>ค่าเริ่มต้น</th><th>ควรตั้งเมื่อไหร่</th></tr>
<tr><td><code>add-default-route</code></td><td>yes</td><td>ตั้งเป็น no เมื่อมี WAN สองเส้นและคุณอยากคุม route เอง</td></tr>
<tr><td><code>use-peer-dns</code></td><td>yes</td><td>ตั้งเป็น no เมื่อองค์กรบังคับให้ใช้ DNS ของตัวเอง</td></tr>
<tr><td><code>use-peer-ntp</code></td><td>yes</td><td>ปิดเมื่อมี NTP server ภายใน</td></tr>
</table>
<div class="note"><b>status บอกอะไร</b> — <code>bound</code> ได้ IP แล้วใช้งานได้ · <code>searching</code> ยังหา server ไม่เจอ (เช็คสาย/VLAN ก่อน) ·
<code>stopped</code> ถูก disable ไว้ · IP ที่ได้จะมี flag <code>D</code> ใน <code>/ip address print</code> เพราะเป็น dynamic แก้หรือลบด้วยมือไม่ได้</div>`,
      },
      {
        t: 'DHCP server — ตั้งครบทั้งสามชิ้น',
        h: `
<p>DHCP server ของ RouterOS ประกอบด้วยสามส่วนที่ต้องมีให้ครบ ถ้าขาดชิ้นใดชิ้นหนึ่งเครื่องลูกจะได้ IP ไม่ครบหรือไม่ได้เลย</p>
<table class="tbl">
<tr><th>ชิ้นส่วน</th><th>หน้าที่</th><th>ขาดแล้วเป็นอย่างไร</th></tr>
<tr><td><code>/ip pool</code></td><td>ช่วง IP ที่จะแจก</td><td>ไม่มีอะไรให้แจก client ไม่ได้ IP</td></tr>
<tr><td><code>/ip dhcp-server</code></td><td>ผูก pool เข้ากับ interface</td><td>ไม่มีใครตอบ Discover</td></tr>
<tr><td><code>/ip dhcp-server network</code></td><td>บอก gateway / DNS / netmask ที่จะส่งไปให้</td><td><b>ได้ IP แต่ออกเน็ตไม่ได้</b> — อาการที่เจอบ่อยที่สุด</td></tr>
</table>
<pre class="code"><span style="color:#5b6b8c"># 0) ต้องมี IP บน interface นั้นก่อนเสมอ</span>
/ip address add address=192.168.88.1/24 interface=ether2

<span style="color:#5b6b8c"># 1) ช่วงที่จะแจก — เว้น .1 ไว้ให้ router และเว้นช่วงล่างไว้ให้เครื่องที่ตั้ง IP คงที่</span>
/ip pool add name=dhcp_pool ranges=192.168.88.10-192.168.88.254

<span style="color:#5b6b8c"># 2) ตัว server</span>
/ip dhcp-server add name=dhcp1 interface=ether2 address-pool=dhcp_pool lease-time=1d disabled=no

<span style="color:#5b6b8c"># 3) ข้อมูลที่จะส่งไปกับ IP</span>
/ip dhcp-server network add address=192.168.88.0/24 gateway=192.168.88.1 dns-server=192.168.88.1

<span style="color:#5b6b8c"># ตรวจผล</span>
/ip dhcp-server print
/ip dhcp-server lease print</pre>
<div class="note"><b>ทางลัดที่ใช้ได้จริง</b> — คำสั่ง <code>/ip dhcp-server setup</code> จะถามทีละคำถามแล้วสร้างครบทั้งสามชิ้นให้เอง
เหมาะกับงานหน้างานที่ต้องเร็ว แต่ควรเข้าใจสามชิ้นข้างบนก่อน ไม่งั้นเวลามีปัญหาจะไม่รู้ว่าไปดูตรงไหน</div>`,
      },
      {
        t: 'Leases management — จองเบอร์ให้เครื่องสำคัญ',
        h: `
<p>Lease คือ "ใบจอง" ที่บอกว่า IP ไหนถูกใครยืมไปและหมดอายุเมื่อไหร่ มีสองแบบ</p>
<table class="tbl">
<tr><th>แบบ</th><th>flag</th><th>พฤติกรรม</th></tr>
<tr><td><b>Dynamic</b></td><td><code>D</code></td><td>server สร้างเองตอนแจก หมดอายุแล้วหายไป — IP อาจเปลี่ยนได้</td></tr>
<tr><td><b>Static</b></td><td>—</td><td>เราผูก MAC กับ IP ไว้เอง เครื่องนั้นจะได้ IP เดิมทุกครั้ง</td></tr>
</table>
<pre class="code"><span style="color:#5b6b8c"># ดูว่าตอนนี้ใครถือ IP อะไรอยู่</span>
/ip dhcp-server lease print

<span style="color:#5b6b8c"># จองเบอร์ให้เครื่องพิมพ์/กล้อง/เซิร์ฟเวอร์ — ผูก MAC กับ IP</span>
/ip dhcp-server lease add address=192.168.88.50 mac-address=00:0C:29:11:22:33 server=dhcp1 comment="Printer-HQ"

<span style="color:#5b6b8c"># กันไม่ให้เครื่องแปลกหน้าได้ IP (block ทั้ง MAC)</span>
/ip dhcp-server lease add address=192.168.88.199 mac-address=AA:BB:CC:DD:EE:FF block-access=yes</pre>
<div class="note"><b>เทคนิคที่ใช้บ่อยใน WinBox</b> — คลิกขวาที่ lease แบบ dynamic แล้วเลือก <b>Make Static</b>
เท่ากับจองเบอร์ให้เครื่องที่กำลังใช้อยู่โดยไม่ต้องพิมพ์ MAC เอง ลดโอกาสพิมพ์ผิด<br>
<b>lease-time</b> สั้นเกินไป (เช่น 10 นาที) จะทำให้มี traffic ต่ออายุถี่มากในวงใหญ่ ·
ยาวเกินไปจะทำให้ IP ที่เลิกใช้แล้วค้างนานจน pool เต็ม — วงออฟฟิศทั่วไปใช้ <b>1 วัน</b> กำลังดี ส่วน guest wifi ใช้ 1–2 ชั่วโมง</div>`,
      },
      {
        t: 'ARP — Address Resolution Protocol และโหมดต่าง ๆ',
        h: `
<p>IP ใช้คุยกันข้ามวง แต่ตอนส่งจริงในวงเดียวกันต้องใช้ <b>MAC address</b> ARP คือตัวที่แปลง IP → MAC ให้</p>
<pre class="code"><span style="color:#5b6b8c"># ตารางที่ router จำไว้ว่า IP ไหนอยู่ที่ MAC ไหน บน interface อะไร</span>
/ip arp print

<span style="color:#5b6b8c"># ผูกแบบตายตัว — ใครปลอม IP มาก็คุยกับ router ไม่ได้</span>
/ip arp add address=192.168.88.50 mac-address=00:0C:29:11:22:33 interface=ether2</pre>
<p><b>ARP modes</b> — ตั้งได้ที่ระดับ interface ด้วย <code>/interface ethernet set [find name=ether2] arp=...</code></p>
<table class="tbl">
<tr><th>โหมด</th><th>พฤติกรรม</th><th>ใช้ตอนไหน</th></tr>
<tr><td><code>enabled</code></td><td>ค่าปกติ — เรียนรู้ ARP เองอัตโนมัติ</td><td>เกือบทุกกรณี</td></tr>
<tr><td><code>disabled</code></td><td>ไม่เรียนรู้และไม่ตอบเลย ต้องใส่ static ARP ทุกเครื่อง</td><td>วงที่ควบคุมเข้มมาก</td></tr>
<tr><td><code>reply-only</code></td><td>ตอบ ARP ได้ แต่<b>ไม่เรียนรู้ใหม่</b> — รู้จักเฉพาะที่เราใส่ static ไว้</td><td><b>คู่กับ static ARP</b> เพื่อกันคนแอบเสียบเครื่องเข้ามาใช้เน็ต</td></tr>
<tr><td><code>proxy-arp</code></td><td>router ตอบ ARP แทนเครื่องที่อยู่คนละ interface</td><td>วงที่ต้องให้เครื่องข้าม interface คุยกันเหมือนอยู่วงเดียวกัน เช่น PPPoE/VPN client</td></tr>
<tr><td><code>local-proxy-arp</code></td><td>ตอบแทนเครื่องที่อยู่ interface <b>เดียวกัน</b></td><td>บังคับให้ traffic ระหว่างเครื่องในวงเดียวกันวิ่งผ่าน router เพื่อทำ firewall</td></tr>
</table>
<div class="note warn"><b>สูตรกันคนแอบใช้เน็ตที่ใช้กันจริงในองค์กร</b><br>
1. จอง IP ให้ทุกเครื่องด้วย static lease หรือ static ARP<br>
2. ตั้ง interface นั้นเป็น <code>arp=reply-only</code><br>
ผลคือเครื่องที่ไม่ได้ลงทะเบียน MAC ไว้ ต่อสายเข้ามาก็ใช้เน็ตไม่ได้ แม้จะตั้ง IP เองก็ตาม<br>
<b>ข้อแลกเปลี่ยน</b> — ทุกเครื่องใหม่ต้องมาลงทะเบียนก่อน ต้องมีคนดูแลตารางนี้จริง ๆ ไม่งั้นจะกลายเป็นภาระ</div>`,
      },
    ],

    quiz: [
      { type: 'mcq', q: 'ลำดับข้อความของ DHCP คือข้อใด', opts: ['Discover → Request → Offer → Ack', 'Discover → Offer → Request → Ack', 'Request → Offer → Discover → Ack', 'Offer → Discover → Ack → Request'], a: 1, why: 'DORA — client ถาม (Discover), server เสนอ (Offer), client ขอตัวนั้น (Request), server ยืนยัน (Ack) จำลำดับนี้ไว้จะไล่ปัญหาได้ว่าค้างที่ขั้นไหน' },
      { type: 'mcq', q: 'เครื่องลูกได้ IP มาแล้วแต่ออกอินเทอร์เน็ตไม่ได้ ควรสงสัยจุดใดก่อน', opts: ['/ip pool ตั้งช่วงผิด', '/ip dhcp-server network ไม่ได้ตั้ง gateway หรือ dns-server', 'lease-time สั้นเกินไป', 'DHCP server ถูก disable'], a: 1, why: 'ถ้าได้ IP มาแล้วแปลว่า pool และ server ทำงานอยู่ ส่วนที่บอก gateway และ DNS ให้ client คือ /ip dhcp-server network — ขาดตรงนี้จะได้ IP แต่ไปไหนไม่ได้' },
      { type: 'cmd', q: 'พิมพ์คำสั่งสร้าง pool ชื่อ <code>dhcp_pool</code> ช่วง <code>192.168.88.10-192.168.88.254</code>', ans: ['/ip pool add name=dhcp_pool ranges=192.168.88.10-192.168.88.254', 'ip pool add name=dhcp_pool ranges=192.168.88.10-192.168.88.254'], why: 'pool คือชิ้นแรกของสามชิ้น ควรเว้น .1 ไว้ให้ router และเว้นช่วงล่างไว้ให้อุปกรณ์ที่ตั้ง IP คงที่' },
      { type: 'cmd', q: 'พิมพ์คำสั่งดูตาราง ARP ของ router', ans: ['/ip arp print', 'ip arp print'], why: 'ตาราง ARP บอกว่า IP ไหนผูกกับ MAC ไหนบน interface อะไร — เป็นที่แรกที่ควรดูเมื่อสงสัยว่ามี IP ซ้ำหรือมีเครื่องแปลกปลอมในวง' },
      { type: 'mcq', q: 'ARP mode <code>reply-only</code> ทำอะไร', opts: ['ปิด ARP ทั้งหมด', 'ตอบ ARP ได้แต่ไม่เรียนรู้รายการใหม่ — รู้จักเฉพาะที่ใส่ static ไว้', 'ตอบแทนเครื่องอื่นที่อยู่คนละ interface', 'บังคับให้ทุกเครื่องใช้ DHCP'], a: 1, why: 'reply-only ใช้คู่กับ static ARP เพื่อทำ whitelist ระดับ Layer 2 — เครื่องที่ไม่ได้ลงทะเบียน MAC ไว้จะใช้เน็ตไม่ได้แม้ตั้ง IP เอง' },
      { type: 'mcq', q: 'IP ที่ได้จาก DHCP client จะมี flag อะไรใน <code>/ip address print</code>', opts: ['X (disabled)', 'D (dynamic)', 'S (static)', 'I (invalid)'], a: 1, why: 'D = dynamic หมายถึงระบบสร้างให้เอง จึงแก้หรือลบด้วยมือไม่ได้ ถ้าอยากเปลี่ยนต้องไปแก้ที่ dhcp-client หรือเปลี่ยนเป็น static address แทน' },
      { type: 'mcq', q: 'ต้องการให้เครื่องพิมพ์ได้ IP เดิมทุกครั้ง ควรทำอย่างไร', opts: ['ตั้ง lease-time ให้ยาวมาก ๆ', 'สร้าง static lease ผูก MAC กับ IP', 'ลด pool ให้เหลือ IP เดียว', 'ปิด DHCP แล้วตั้ง IP ที่เครื่องพิมพ์'], a: 1, why: 'static lease ผูก MAC กับ IP ไว้ที่ router ทำให้จัดการรวมศูนย์ได้ — ส่วนการไปตั้ง IP ที่เครื่องเองก็ทำได้ แต่ต้องกันช่วงนั้นออกจาก pool ไม่งั้นจะชนกัน' },
      { type: 'multi', q: 'ต้องมีอะไรบ้างจึงจะ DHCP server ทำงานครบ (เลือกทุกข้อที่ถูก)', opts: ['/ip pool', '/ip dhcp-server', '/ip dhcp-server network', '/ip dhcp-client'], a: [0, 1, 2], why: 'สามชิ้นแรกคือฝั่ง server ส่วน dhcp-client เป็นฝั่งรับ IP ใช้ตอนต่อ WAN — คนละหน้าที่กัน' },
      { type: 'mcq', q: 'Proxy ARP ต่างจาก local-proxy-ARP อย่างไร', opts: ['เหมือนกัน', 'proxy-arp ตอบแทนเครื่องที่อยู่คนละ interface ส่วน local-proxy-arp ตอบแทนเครื่องที่อยู่ interface เดียวกัน', 'proxy-arp ใช้กับ IPv6 เท่านั้น', 'local-proxy-arp เร็วกว่า'], a: 1, why: 'proxy-arp ใช้บ่อยกับ PPPoE/VPN ที่ client อยู่คนละ interface แต่ต้องคุยกับวง LAN เหมือนอยู่ในวงเดียวกัน ส่วน local-proxy-arp บังคับให้ traffic ในวงเดียวกันวิ่งผ่าน router เพื่อให้ firewall เห็น' },
    ],

    labs: [{
      id: 'mtcna-m2',
      title: 'MTCNA Module 2 Lab — วาง DHCP ให้ออฟฟิศและล็อกเครื่องสำคัญ',
      brief: 'ออฟฟิศใหม่ต้องการให้เครื่องพนักงานรับ IP เอง แต่เครื่องพิมพ์ต้องได้เบอร์เดิมตลอด และหัวหน้าอยากให้กันคนนอกเสียบสายเข้ามาใช้เน็ตด้วย',
      device: 'mikrotik',
      tasks: [
        { t: 'ใส่ IP <code>192.168.88.1/24</code> ให้ <code>ether2</code> (ต้องมีก่อนถึงจะตั้ง DHCP ได้)', hint: '/ip address add address=192.168.88.1/24 interface=ether2', check: s => has(s, 'ip address', r => r.address === '192.168.88.1/24' && r.interface === 'ether2') },
        { t: 'สร้าง pool ชื่อ <code>dhcp_pool</code> ช่วง <code>192.168.88.10-192.168.88.254</code>', hint: '/ip pool add name=dhcp_pool ranges=192.168.88.10-192.168.88.254', check: s => has(s, 'ip pool', r => r.name === 'dhcp_pool' && /192\.168\.88\.10-192\.168\.88\.254/.test(r.ranges || '')) },
        { t: 'สร้าง DHCP server ชื่อ <code>dhcp1</code> บน <code>ether2</code> ใช้ pool ที่สร้างไว้', hint: '/ip dhcp-server add name=dhcp1 interface=ether2 address-pool=dhcp_pool disabled=no', check: s => has(s, 'ip dhcp-server', r => r.name === 'dhcp1' && r.interface === 'ether2' && r['address-pool'] === 'dhcp_pool') },
        { t: 'ตั้ง network ให้ส่ง gateway <code>192.168.88.1</code> และ dns <code>192.168.88.1</code>', hint: '/ip dhcp-server network add address=192.168.88.0/24 gateway=192.168.88.1 dns-server=192.168.88.1', check: s => has(s, 'ip dhcp-server network', r => r.address === '192.168.88.0/24' && r.gateway === '192.168.88.1' && /192\.168\.88\.1/.test(r['dns-server'] || '')) },
        { t: 'จองเบอร์ <code>192.168.88.50</code> ให้เครื่องพิมพ์ MAC <code>00:0C:29:11:22:33</code>', hint: '/ip dhcp-server lease add address=192.168.88.50 mac-address=00:0C:29:11:22:33 server=dhcp1', check: s => has(s, 'ip dhcp-server lease', r => r.address === '192.168.88.50' && String(r['mac-address']).toUpperCase() === '00:0C:29:11:22:33') },
        { t: 'ดูรายการ lease ทั้งหมด', hint: '/ip dhcp-server lease print', check: (s, h) => said(h, /dhcp-server\s+lease\s+print/i) },
        { t: 'ใส่ static ARP ให้เครื่องพิมพ์เครื่องเดียวกัน', hint: '/ip arp add address=192.168.88.50 mac-address=00:0C:29:11:22:33 interface=ether2', check: s => has(s, 'ip arp', r => r.address === '192.168.88.50' && r.interface === 'ether2') },
        { t: 'ตั้ง <code>ether2</code> เป็น <code>arp=reply-only</code> เพื่อรับเฉพาะเครื่องที่ลงทะเบียนไว้', hint: '/interface ethernet set [find name=ether2] arp=reply-only', check: s => T(s, 'interface').some(r => r.name === 'ether2' && r.arp === 'reply-only') },
        { t: 'ตรวจตาราง ARP ที่ได้', hint: '/ip arp print', check: (s, h) => said(h, /ip\s+arp\s+print/i) },
      ],
    }],
  },

  // ================================================================
  //  ระดับ 3 — MTCNA Module 3 (Bridging) + Module 6 (Firewall)
  // ================================================================
  3: {
    sections: [
      {
        t: 'MTCNA Module 3 — Bridging overview',
        h: `
<p><b>Bridge คือ switch ที่ทำด้วยซอฟต์แวร์</b> — มันรวมหลาย interface ให้กลายเป็นวงเดียวกัน (broadcast domain เดียวกัน)
เครื่องที่เสียบอยู่คนละพอร์ตจะคุยกันได้เหมือนเสียบ switch ตัวเดียวกัน</p>
<table class="tbl">
<tr><th>เรื่อง</th><th>Bridge (Layer 2)</th><th>Routing (Layer 3)</th></tr>
<tr><td>รวมพอร์ตเป็นวงเดียว</td><td>ใช่</td><td>ไม่ — แต่ละขาคนละวง</td></tr>
<tr><td>ใช้ IP กี่วง</td><td>วงเดียวทั้ง bridge</td><td>วงละ interface</td></tr>
<tr><td>Broadcast วิ่งถึงกัน</td><td>ถึง</td><td>ไม่ถึง</td></tr>
<tr><td>เหมาะกับ</td><td>รวมพอร์ต LAN ในออฟฟิศเดียว</td><td>แยกแผนก แยกวง แยก policy</td></tr>
</table>
<pre class="code"><span style="color:#5b6b8c"># 1) สร้าง bridge</span>
/interface bridge add name=bridge1 protocol-mode=rstp

<span style="color:#5b6b8c"># 2) ใส่พอร์ตเข้าไปเป็นสมาชิก</span>
/interface bridge port add bridge=bridge1 interface=ether2
/interface bridge port add bridge=bridge1 interface=ether3
/interface bridge port add bridge=bridge1 interface=ether4

<span style="color:#5b6b8c"># 3) IP ใส่ที่ "ตัว bridge" ไม่ใช่ที่พอร์ตย่อย</span>
/ip address add address=192.168.88.1/24 interface=bridge1

/interface bridge port print       <span style="color:#5b6b8c"># พอร์ตที่เป็นสมาชิกจะมี flag S (slave)</span></pre>
<table class="tbl">
<tr><th>ค่าที่ควรรู้</th><th>ความหมาย</th></tr>
<tr><td><code>protocol-mode</code></td><td><code>rstp</code> (ค่าที่ควรใช้) ป้องกัน loop · <code>none</code> ปิดการป้องกัน — ใช้เฉพาะเมื่อมั่นใจว่าไม่มี loop แน่นอน</td></tr>
<tr><td><code>pvid</code></td><td>VLAN ที่ traffic ไม่มีแท็กบนพอร์ตนี้จะถูกจัดเข้า — ใช้ตอนทำ VLAN บน bridge</td></tr>
<tr><td><code>hw</code> (hardware offload)</td><td>ให้ชิป switch ทำงานแทน CPU — เร็วกว่ามาก แต่บางฟีเจอร์จะปิดตัวเองอัตโนมัติ</td></tr>
</table>
<div class="note warn"><b>กับดักคลาสสิก</b> — ใส่ IP ไว้ที่ <code>ether2</code> แล้วค่อยเอา ether2 ไปเป็นสมาชิก bridge
พอเป็น slave แล้ว IP นั้นจะใช้ไม่ได้ทันทีและคุณจะหลุดจากเครื่อง<br>
<b>ลำดับที่ถูก</b>: สร้าง bridge → ใส่พอร์ต → ค่อยใส่ IP ที่ bridge (และเปิด Safe Mode ด้วย Ctrl+X ไว้ก่อน)</div>`,
      },
      {
        t: 'Bridge wireless networks — Station Bridge',
        h: `
<p>มาตรฐาน 802.11 ปกติใช้ที่อยู่แค่ 3 ช่อง (3-address frame) ซึ่ง<b>ไม่พอ</b>สำหรับการส่งต่อ traffic ของเครื่องอื่นที่อยู่หลัง station
ผลคือถ้าเอา wireless station ธรรมดาไปใส่ใน bridge เครื่องที่อยู่ข้างหลังมันจะคุยข้ามฝั่งไม่ได้</p>
<table class="tbl">
<tr><th>โหมดฝั่ง client</th><th>bridge ได้ไหม</th><th>ใช้กับใครได้</th></tr>
<tr><td><code>station</code></td><td>ไม่ได้</td><td>ทุกยี่ห้อ — แต่ต่อได้แค่ตัวมันเอง</td></tr>
<tr><td><b><code>station-bridge</code></b></td><td><b>ได้เต็มรูปแบบ</b></td><td><b>MikroTik ↔ MikroTik เท่านั้น</b></td></tr>
<tr><td><code>station-pseudobridge</code></td><td>ได้แบบจำกัด (ใช้ MAC translation)</td><td>ยี่ห้ออื่น — แต่มีปัญหากับหลาย MAC หลัง client</td></tr>
<tr><td><code>station-wds</code></td><td>ได้</td><td>อุปกรณ์ที่รองรับ WDS</td></tr>
</table>
<pre class="code"><span style="color:#5b6b8c"># ฝั่ง AP</span>
/interface wireless set [find name=wlan1] mode=ap-bridge ssid=PTP-LINK band=5ghz-a/n/ac disabled=no

<span style="color:#5b6b8c"># ฝั่ง client — ต้องเป็น station-bridge ถึงจะ bridge ข้ามฝั่งได้</span>
/interface wireless set [find name=wlan1] mode=station-bridge ssid=PTP-LINK disabled=no
/interface bridge port add bridge=bridge1 interface=wlan1</pre>
<div class="note"><b>จำง่าย ๆ</b> — ถ้าปลายทางทั้งสองฝั่งเป็น MikroTik ให้ใช้ <code>station-bridge</code> เสมอ เพราะเสถียรและไม่มีข้อจำกัดเรื่องจำนวน MAC
ถ้าฝั่งใดฝั่งหนึ่งเป็นยี่ห้ออื่นค่อยไปหา pseudobridge หรือเปลี่ยนไปใช้ routing แทนการ bridge</div>`,
      },
      {
        t: 'MTCNA Module 6 — Firewall principles และ connection tracking',
        h: `
<p>หัวใจของ firewall ใน RouterOS คือ <b>connection tracking</b> — router จำได้ว่า "การสนทนา" ไหนกำลังดำเนินอยู่
ทำให้เขียนกฎได้สั้นลงมาก เพราะอนุญาตขาไปแล้วขากลับจะผ่านเองอัตโนมัติ</p>
<table class="tbl">
<tr><th>Connection state</th><th>หมายถึง</th><th>ควรทำอย่างไร</th></tr>
<tr><td><code>new</code></td><td>แพ็กเก็ตแรกของการเชื่อมต่อใหม่</td><td>ตรงนี้แหละที่ต้องตัดสินใจว่าจะให้ผ่านไหม</td></tr>
<tr><td><code>established</code></td><td>อยู่ในการสนทนาที่อนุญาตไปแล้ว</td><td><b>accept</b> — วางไว้เป็นกฎแรกเสมอ</td></tr>
<tr><td><code>related</code></td><td>เกี่ยวเนื่องกับการสนทนาเดิม เช่น data channel ของ FTP</td><td><b>accept</b></td></tr>
<tr><td><code>invalid</code></td><td>ไม่เข้าพวกกับอะไรเลย</td><td><b>drop</b> ทิ้งเสมอ</td></tr>
<tr><td><code>untracked</code></td><td>ถูกสั่งข้าม conntrack ไว้ (จาก raw)</td><td>ใช้ตอนรับมือ DDoS</td></tr>
</table>
<p><b>Chains</b> — เลือกให้ถูกว่ากำลังปกป้องอะไร</p>
<table class="tbl">
<tr><th>Chain</th><th>traffic แบบไหน</th><th>ใช้ปกป้อง</th></tr>
<tr><td><code>input</code></td><td>วิ่งเข้าหา <b>ตัว router เอง</b></td><td>ตัว router — WinBox, SSH, DNS, API</td></tr>
<tr><td><code>forward</code></td><td>วิ่ง <b>ผ่าน</b> router จากวงหนึ่งไปอีกวง</td><td>เครื่องลูกค้า/พนักงานที่อยู่หลัง router</td></tr>
<tr><td><code>output</code></td><td>ออก <b>จาก</b> ตัว router เอง</td><td>ไม่ค่อยได้ใช้ — เช่นห้าม router เองไปต่อบางที่</td></tr>
</table>
<table class="tbl">
<tr><th>Action</th><th>ผล</th></tr>
<tr><td><code>accept</code></td><td>ให้ผ่าน แล้วหยุดตรวจกฎที่เหลือใน chain นั้น</td></tr>
<tr><td><code>drop</code></td><td>ทิ้งเงียบ ๆ ไม่ตอบอะไรกลับ — <b>ใช้กับฝั่ง WAN</b></td></tr>
<tr><td><code>reject</code></td><td>ทิ้งแต่ตอบกลับว่าไม่ให้ผ่าน — ใช้ฝั่ง LAN เพื่อให้ผู้ใช้ไม่ต้องรอ timeout</td></tr>
<tr><td><code>log</code></td><td>บันทึกแล้วไปกฎถัดไป — เปิดชั่วคราวตอนไล่ปัญหาเท่านั้น</td></tr>
<tr><td><code>jump</code> / <code>return</code></td><td>กระโดดเข้า chain ที่เราสร้างเอง แล้วกลับ — ใช้จัดกลุ่มกฎให้อ่านง่าย</td></tr>
</table>
<div class="note warn"><b>ลำดับกฎคือทุกอย่าง</b> — firewall อ่านจากบนลงล่างและหยุดที่กฎแรกที่ตรง
กฎ <code>drop</code> ที่วางไว้บนสุดจะทำให้กฎ accept ข้างล่างไม่มีความหมายเลย ตรวจลำดับด้วย <code>/ip firewall filter print</code> เสมอ</div>`,
      },
      {
        t: 'Firewall filter ลงมือจริง — ปกป้อง router และปกป้องผู้ใช้',
        h: `
<p><b>ชุดกฎ input พื้นฐานที่ควรมีทุกเครื่อง</b> — เรียงลำดับตามนี้</p>
<pre class="code"><span style="color:#5b6b8c"># 1) ของเดิมที่คุยกันอยู่แล้ว ให้ผ่านก่อนเพื่อลดภาระ CPU</span>
/ip firewall filter add chain=input action=accept connection-state=established,related comment="allow established"

<span style="color:#5b6b8c"># 2) ขยะทิ้งทันที</span>
/ip firewall filter add chain=input action=drop connection-state=invalid comment="drop invalid"

<span style="color:#5b6b8c"># 3) ping ให้ผ่าน จะได้ตรวจสอบระบบได้</span>
/ip firewall filter add chain=input action=accept protocol=icmp comment="allow ICMP"

<span style="color:#5b6b8c"># 4) ฝั่ง LAN เข้าหา router ได้</span>
/ip firewall filter add chain=input action=accept in-interface=ether2 comment="allow LAN"

<span style="color:#5b6b8c"># 5) ที่เหลือจากฝั่ง WAN ทิ้งหมด — กฎนี้ต้องอยู่ล่างสุดเสมอ</span>
/ip firewall filter add chain=input action=drop in-interface=ether1 comment="drop all from WAN"</pre>
<p><b>ปกป้องเครื่องของผู้ใช้ด้วย chain forward</b></p>
<pre class="code">/ip firewall filter add chain=forward action=accept connection-state=established,related
/ip firewall filter add chain=forward action=drop connection-state=invalid

<span style="color:#5b6b8c"># ห้ามคนนอกเริ่มการเชื่อมต่อเข้ามาหาเครื่องใน LAN (ยกเว้นที่ทำ dst-nat ไว้)</span>
/ip firewall filter add chain=forward action=drop connection-state=new in-interface=ether1 comment="block new from WAN"</pre>
<p><b>Address-list</b> — จัดกลุ่ม IP ไว้เรียกใช้ซ้ำ และสร้างรายชื่ออัตโนมัติได้ด้วย</p>
<pre class="code"><span style="color:#5b6b8c"># แบบคงที่</span>
/ip firewall address-list add list=admin-pc address=10.10.99.0/24
/ip firewall filter add chain=input action=accept src-address-list=admin-pc comment="allow admin"

<span style="color:#5b6b8c"># แบบอัตโนมัติ — ใครยิงพอร์ต 22 มาจาก WAN ให้เก็บ IP เข้ารายชื่อดำ 1 วัน</span>
/ip firewall filter add chain=input protocol=tcp dst-port=22 in-interface=ether1 \\
    action=add-src-to-address-list address-list=blacklist address-list-timeout=1d
/ip firewall filter add chain=input src-address-list=blacklist action=drop

/ip firewall address-list print</pre>`,
      },
      {
        t: 'NAT — Source NAT, Destination NAT และ FastTrack',
        h: `
<p><b>Source NAT</b> เปลี่ยน "ต้นทาง" ของแพ็กเก็ตตอนออกไปข้างนอก มีสองแบบให้เลือก</p>
<table class="tbl">
<tr><th></th><th><code>action=masquerade</code></th><th><code>action=src-nat</code></th></tr>
<tr><td>IP ที่ใช้</td><td>หยิบจาก interface ขาออกตอนนั้นเอง</td><td>ระบุเองด้วย <code>to-addresses=</code></td></tr>
<tr><td>เหมาะกับ</td><td>WAN ที่ IP เปลี่ยนได้ (DHCP, PPPoE)</td><td>WAN ที่ IP คงที่</td></tr>
<tr><td>ภาระ CPU</td><td>สูงกว่าเล็กน้อย (ต้องหา IP ทุกครั้ง)</td><td>ต่ำกว่า</td></tr>
<tr><td>ข้อควรระวัง</td><td>ถ้า WAN ล้ม conntrack จะถูกล้างทิ้ง</td><td>ต้องแก้กฎเองเมื่อ ISP เปลี่ยน IP</td></tr>
</table>
<pre class="code"><span style="color:#5b6b8c"># IP ไม่คงที่ — ใช้ masquerade</span>
/ip firewall nat add chain=srcnat out-interface=ether1 action=masquerade

<span style="color:#5b6b8c"># IP คงที่ — ใช้ src-nat จะเบากว่า</span>
/ip firewall nat add chain=srcnat out-interface=ether1 action=src-nat to-addresses=203.0.113.25</pre>
<p><b>Destination NAT</b> เปลี่ยน "ปลายทาง" ตอนคนนอกเข้ามาหาเรา — คือการทำ port forward</p>
<pre class="code"><span style="color:#5b6b8c"># เปิดเว็บเซิร์ฟเวอร์ภายในให้คนนอกเข้าถึง</span>
/ip firewall nat add chain=dstnat in-interface=ether1 protocol=tcp dst-port=80 \\
    action=dst-nat to-addresses=192.168.88.10 to-ports=80

<span style="color:#5b6b8c"># redirect = dst-nat มาที่ "ตัว router เอง" ใช้ทำ transparent proxy / บังคับ DNS</span>
/ip firewall nat add chain=dstnat protocol=udp dst-port=53 in-interface=ether2 \\
    action=redirect to-ports=53</pre>
<table class="tbl">
<tr><th></th><th><code>dst-nat</code></th><th><code>redirect</code></th></tr>
<tr><td>ส่งไปที่ไหน</td><td>IP เครื่องอื่นที่เราระบุ</td><td>ตัว router เอง</td></tr>
<tr><td>ใช้ทำอะไร</td><td>port forward เข้าเซิร์ฟเวอร์ภายใน</td><td>บังคับให้ traffic วิ่งเข้า service บน router เช่น web proxy หรือ DNS</td></tr>
</table>
<p><b>FastTrack</b> — ทางลัดที่ทำให้ throughput สูงขึ้นหลายเท่าโดยแทบไม่กิน CPU</p>
<pre class="code"><span style="color:#5b6b8c"># ต้องวางไว้ก่อนกฎ established,related ปกติ</span>
/ip firewall filter add chain=forward action=fasttrack-connection \\
    connection-state=established,related comment="fasttrack"
/ip firewall filter add chain=forward action=accept connection-state=established,related</pre>
<div class="note warn"><b>FastTrack แลกมาด้วยอะไร</b> — แพ็กเก็ตที่เข้า fasttrack จะ<b>ข้าม</b>ทั้ง firewall, mangle, queue และ conntrack ที่เหลือ
แปลว่า <b>Simple Queue และ QoS จะไม่มีผลกับ traffic นั้น</b> ถ้าคุณต้องจำกัดความเร็วผู้ใช้ ให้เลี่ยง fasttrack
หรือยกเว้นเฉพาะกลุ่มที่ต้องคุมความเร็วออกไปก่อน — นี่คือสาเหตุอันดับหนึ่งที่ "ตั้ง queue แล้วไม่ทำงาน"</div>`,
      },
    ],

    quiz: [
      { type: 'mcq', q: 'เมื่อเอา <code>ether2</code> ไปเป็นสมาชิกของ bridge แล้ว ควรใส่ IP ที่ไหน', opts: ['ที่ ether2 เหมือนเดิม', 'ที่ตัว bridge', 'ใส่ทั้งสองที่', 'ไม่ต้องใส่ IP เลย'], a: 1, why: 'พอร์ตที่เป็น slave ของ bridge จะไม่ทำงานที่ Layer 3 อีกต่อไป — IP ต้องอยู่ที่ตัว bridge ถ้าใส่ผิดที่จะหลุดจากเครื่องทันที' },
      { type: 'mcq', q: 'ต้องการ bridge ข้ามลิงก์ไร้สายระหว่าง MikroTik สองตัว ฝั่ง client ต้องใช้โหมดใด', opts: ['station', 'station-bridge', 'ap-bridge', 'station-pseudobridge'], a: 1, why: 'station ธรรมดา bridge ไม่ได้เพราะ 802.11 ใช้ 3-address frame — station-bridge เป็นส่วนขยายของ MikroTik ที่ทำได้เต็มรูปแบบ แต่ใช้ได้เฉพาะ MikroTik กับ MikroTik' },
      { type: 'cmd', q: 'พิมพ์คำสั่งเพิ่ม <code>ether2</code> เข้าเป็นสมาชิกของ <code>bridge1</code>', ans: ['/interface bridge port add bridge=bridge1 interface=ether2', 'interface bridge port add bridge=bridge1 interface=ether2'], why: 'ต้องสร้าง bridge ให้เสร็จก่อนแล้วค่อยเพิ่มพอร์ต — และหลังจากนี้ ether2 จะเป็น slave ใช้ตั้ง IP เองไม่ได้แล้ว' },
      { type: 'mcq', q: 'chain ใดใช้ปกป้องตัว router เอง', opts: ['forward', 'input', 'output', 'srcnat'], a: 1, why: 'input = traffic ที่วิ่งเข้าหา router เอง (WinBox, SSH, DNS) · forward = วิ่งผ่าน router ไปหาเครื่องอื่น · output = ออกจาก router เอง' },
      { type: 'mcq', q: 'กฎแรกของ chain input ที่ควรมีเสมอคือข้อใด', opts: ['drop ทุกอย่าง', 'accept connection-state=established,related', 'accept protocol=icmp', 'drop connection-state=new'], a: 1, why: 'อนุญาต traffic ที่อยู่ในการสนทนาเดิมก่อนเป็นอันดับแรก ทำให้กฎที่เหลือตรวจเฉพาะการเชื่อมต่อใหม่ ลดภาระ CPU ลงมาก' },
      { type: 'mcq', q: 'ต่างกันอย่างไรระหว่าง <code>drop</code> กับ <code>reject</code>', opts: ['เหมือนกัน', 'drop ทิ้งเงียบ ๆ ส่วน reject ตอบกลับไปว่าไม่ให้ผ่าน', 'drop ใช้กับ TCP ส่วน reject ใช้กับ UDP', 'reject เร็วกว่า'], a: 1, why: 'ฝั่ง WAN ควรใช้ drop เพราะไม่บอกใบ้ผู้โจมตีว่ามีอะไรอยู่ ส่วนฝั่ง LAN ใช้ reject จะเป็นมิตรกว่าเพราะผู้ใช้ได้คำตอบทันทีไม่ต้องรอ timeout' },
      { type: 'cmd', q: 'พิมพ์คำสั่งทำ NAT masquerade ออกทาง <code>ether1</code>', ans: ['/ip firewall nat add chain=srcnat out-interface=ether1 action=masquerade', 'ip firewall nat add chain=srcnat out-interface=ether1 action=masquerade', '/ip firewall nat add chain=srcnat action=masquerade out-interface=ether1'], why: 'masquerade หยิบ IP จาก interface ขาออกให้เองอัตโนมัติ จึงเหมาะกับ WAN ที่ IP เปลี่ยนได้อย่าง DHCP หรือ PPPoE' },
      { type: 'mcq', q: 'ISP ให้ IP คงที่ 203.0.113.25 มา ควรใช้ action ใดจึงจะเบา CPU ที่สุด', opts: ['masquerade', 'src-nat to-addresses=203.0.113.25', 'dst-nat', 'redirect'], a: 1, why: 'masquerade ต้องไปหา IP ของ interface ขาออกทุกครั้ง ส่วน src-nat รู้ IP อยู่แล้วจึงเบากว่า — แต่ต้องแก้กฎเองถ้า ISP เปลี่ยน IP' },
      { type: 'mcq', q: 'ต้องการเปิดเว็บเซิร์ฟเวอร์ภายใน 192.168.88.10 ให้คนนอกเข้าได้ ใช้อะไร', opts: ['srcnat + masquerade', 'dstnat + action=dst-nat', 'redirect', 'fasttrack'], a: 1, why: 'การเปิดให้คนนอกเข้ามาหาเครื่องข้างในคือ port forward = chain dstnat กับ action=dst-nat พร้อมระบุ to-addresses และ to-ports' },
      { type: 'mcq', q: '<code>action=redirect</code> ต่างจาก <code>dst-nat</code> อย่างไร', opts: ['เหมือนกัน', 'redirect ส่งไปที่ตัว router เอง ส่วน dst-nat ส่งไปเครื่องอื่นที่ระบุ', 'redirect ใช้กับ UDP เท่านั้น', 'dst-nat ใช้ได้เฉพาะ chain srcnat'], a: 1, why: 'redirect ใช้บังคับให้ traffic วิ่งเข้า service ที่รันบน router เอง เช่น transparent web proxy หรือบังคับให้ทุกคนใช้ DNS ของ router' },
      { type: 'mcq', q: 'ตั้ง Simple Queue จำกัดความเร็วแล้วไม่มีผลเลย สาเหตุที่น่าสงสัยที่สุดคือ', opts: ['ตั้ง max-limit ต่ำเกินไป', 'มีกฎ fasttrack-connection อยู่ ทำให้ traffic ข้าม queue ไป', 'ไม่ได้ reboot', 'ต้องใช้ PCQ เท่านั้น'], a: 1, why: 'FastTrack ทำให้แพ็กเก็ตข้าม mangle และ queue ทั้งหมด — ถ้าจะคุมความเร็ว ต้องเอา fasttrack ออกหรือยกเว้น traffic กลุ่มนั้นไว้ก่อน' },
      { type: 'multi', q: 'connection state ใดที่ควร accept ไว้ก่อนเป็นอันดับต้น ๆ (เลือกทุกข้อที่ถูก)', opts: ['established', 'related', 'invalid', 'new'], a: [0, 1], why: 'established และ related คือการสนทนาที่อนุญาตไปแล้ว · invalid ต้อง drop เสมอ · new คือจุดที่ต้องพิจารณาเป็นราย ๆ ว่าจะให้ผ่านหรือไม่' },
    ],

    labs: [
      {
        id: 'mtcna-m3',
        title: 'MTCNA Module 3 Lab — รวมพอร์ต LAN เป็น bridge เดียว',
        brief: 'ออฟฟิศเล็กมีเครื่องเสียบกระจายอยู่หลายพอร์ตของ router และต้องการให้ทุกเครื่องอยู่วงเดียวกันคุยกันได้ทั้งหมด โดยใช้ IP วงเดียว',
        device: 'mikrotik',
        tasks: [
          { t: 'สร้าง bridge ชื่อ <code>bridge1</code> โดยเปิด RSTP กัน loop', hint: '/interface bridge add name=bridge1 protocol-mode=rstp', check: s => has(s, 'interface bridge', r => r.name === 'bridge1' && r['protocol-mode'] === 'rstp') },
          { t: 'เพิ่ม <code>ether2</code> เข้า bridge', hint: '/interface bridge port add bridge=bridge1 interface=ether2', check: s => has(s, 'interface bridge port', r => r.bridge === 'bridge1' && r.interface === 'ether2') },
          { t: 'เพิ่ม <code>ether3</code> เข้า bridge', hint: '/interface bridge port add bridge=bridge1 interface=ether3', check: s => has(s, 'interface bridge port', r => r.bridge === 'bridge1' && r.interface === 'ether3') },
          { t: 'เพิ่ม <code>ether4</code> เข้า bridge', hint: '/interface bridge port add bridge=bridge1 interface=ether4', check: s => has(s, 'interface bridge port', r => r.bridge === 'bridge1' && r.interface === 'ether4') },
          { t: 'ตรวจว่าพอร์ตเข้าเป็นสมาชิกครบแล้ว', hint: '/interface bridge port print', check: (s, h) => said(h, /bridge\s+port\s+print/i) },
          { t: 'ใส่ IP <code>192.168.88.1/24</code> ที่ <b>ตัว bridge</b> ไม่ใช่ที่พอร์ตย่อย', hint: '/ip address add address=192.168.88.1/24 interface=bridge1', check: s => has(s, 'ip address', r => r.address === '192.168.88.1/24' && r.interface === 'bridge1') },
          { t: 'สร้าง pool <code>lan_pool</code> ช่วง <code>192.168.88.100-192.168.88.200</code>', hint: '/ip pool add name=lan_pool ranges=192.168.88.100-192.168.88.200', check: s => has(s, 'ip pool', r => r.name === 'lan_pool') },
          { t: 'ตั้ง DHCP server ชื่อ <code>dhcp-lan</code> บน <code>bridge1</code>', hint: '/ip dhcp-server add name=dhcp-lan interface=bridge1 address-pool=lan_pool disabled=no', check: s => has(s, 'ip dhcp-server', r => r.name === 'dhcp-lan' && r.interface === 'bridge1') },
          { t: 'ดูรายการ bridge ที่มี', hint: '/interface bridge print', check: (s, h) => said(h, /interface\s+bridge\s+print/i) },
        ],
      },
      {
        id: 'mtcna-m6',
        title: 'MTCNA Module 6 Lab — ปิด router ให้แน่นและเปิด port forward',
        brief: 'router ตัวนี้ต่ออินเทอร์เน็ตจริงและกำลังโดนสแกนพอร์ตทั้งวัน ต้องวางชุดกฎ firewall ให้ครบ ปกป้องทั้งตัว router และเครื่องข้างหลัง แล้วเปิดเว็บเซิร์ฟเวอร์ภายในให้คนนอกเข้าถึงได้อย่างปลอดภัย',
        device: 'mikrotik',
        tasks: [
          { t: 'อนุญาต connection ที่คุยกันอยู่แล้ว (chain input)', hint: '/ip firewall filter add chain=input action=accept connection-state=established,related', check: s => has(s, 'ip firewall filter', r => r.chain === 'input' && r.action === 'accept' && /established/.test(r['connection-state'] || '')) },
          { t: 'ทิ้งแพ็กเก็ต invalid ที่เข้าหา router', hint: '/ip firewall filter add chain=input action=drop connection-state=invalid', check: s => has(s, 'ip firewall filter', r => r.chain === 'input' && r.action === 'drop' && r['connection-state'] === 'invalid') },
          { t: 'อนุญาต ICMP เพื่อให้ ping ตรวจสอบระบบได้', hint: '/ip firewall filter add chain=input action=accept protocol=icmp', check: s => has(s, 'ip firewall filter', r => r.chain === 'input' && r.action === 'accept' && r.protocol === 'icmp') },
          { t: 'ทิ้งทุกอย่างที่เหลือซึ่งเข้ามาจาก <code>ether1</code> (WAN)', hint: '/ip firewall filter add chain=input action=drop in-interface=ether1', check: s => has(s, 'ip firewall filter', r => r.chain === 'input' && r.action === 'drop' && r['in-interface'] === 'ether1') },
          { t: 'สร้าง address-list <code>admin-pc</code> ให้วง <code>10.10.99.0/24</code>', hint: '/ip firewall address-list add list=admin-pc address=10.10.99.0/24', check: s => has(s, 'ip firewall address-list', r => r.list === 'admin-pc' && r.address === '10.10.99.0/24') },
          { t: 'ปกป้องเครื่องข้างหลัง — ห้ามคนนอกเริ่มการเชื่อมต่อใหม่เข้ามา (chain forward)', hint: '/ip firewall filter add chain=forward action=drop connection-state=new in-interface=ether1', check: s => has(s, 'ip firewall filter', r => r.chain === 'forward' && r.action === 'drop' && r['in-interface'] === 'ether1') },
          { t: 'ทำ NAT masquerade ออกทาง <code>ether1</code>', hint: '/ip firewall nat add chain=srcnat out-interface=ether1 action=masquerade', check: s => has(s, 'ip firewall nat', r => r.chain === 'srcnat' && r.action === 'masquerade') },
          { t: 'เปิด port forward พอร์ต 80 ไปที่เว็บเซิร์ฟเวอร์ <code>192.168.88.10</code>', hint: '/ip firewall nat add chain=dstnat in-interface=ether1 protocol=tcp dst-port=80 action=dst-nat to-addresses=192.168.88.10', check: s => has(s, 'ip firewall nat', r => r.chain === 'dstnat' && r.action === 'dst-nat' && r['to-addresses'] === '192.168.88.10' && String(r['dst-port']) === '80') },
          { t: 'เพิ่ม fasttrack เพื่อเพิ่ม throughput (chain forward)', hint: '/ip firewall filter add chain=forward action=fasttrack-connection connection-state=established,related', check: s => has(s, 'ip firewall filter', r => r.chain === 'forward' && r.action === 'fasttrack-connection') },
          { t: 'ตรวจลำดับกฎทั้งหมดว่าเรียงถูกต้อง', hint: '/ip firewall filter print', check: (s, h) => said(h, /firewall\s+filter\s+print/i) },
        ],
      },
    ],
  },

  // ================================================================
  //  ระดับ 4 — Module 4 (Routing) + Module 7 (QoS) + Module 8 (Tunnels)
  // ================================================================
  4: {
    sections: [
      {
        t: 'MTCNA Module 4 — Routing overview และ route flags',
        h: `
<p>Routing คือการตัดสินใจว่า "แพ็กเก็ตนี้ควรออกทางไหน" โดยดูจากปลายทาง (destination) เท่านั้น
กฎที่ต้องจำมีข้อเดียวคือ <b>Longest Prefix Match</b> — เส้นทางที่เจาะจงกว่าชนะเสมอ ไม่ว่าจะอยู่บรรทัดไหนก็ตาม</p>
<pre class="code">/ip route print
<span style="color:#5b6b8c">Flags: X - disabled, A - active, D - dynamic, C - connect, S - static, r - rip, o - ospf, b - bgp</span>
 #      DST-ADDRESS         GATEWAY            DISTANCE
 0 ADS  0.0.0.0/0           203.0.113.1               1
 1 ADC  192.168.88.0/24     bridge1                   0
 2  AS  10.20.0.0/16        192.168.88.254            1</pre>
<table class="tbl">
<tr><th>Flag</th><th>ความหมาย</th><th>มาจากไหน</th></tr>
<tr><td><b><code>A</code></b></td><td>Active — ใช้งานอยู่จริง</td><td>ถ้าไม่มี A แปลว่ามีอยู่แต่ไม่ถูกใช้ (gateway ไม่ถึง หรือมี route ที่ distance ดีกว่า)</td></tr>
<tr><td><code>D</code></td><td>Dynamic</td><td>ระบบสร้างเอง — จาก DHCP client, PPPoE, OSPF, connected</td></tr>
<tr><td><code>C</code></td><td>Connect</td><td>เกิดจากการที่เราใส่ IP ให้ interface นั้น</td></tr>
<tr><td><code>S</code></td><td>Static</td><td>เราพิมพ์เพิ่มเอง</td></tr>
<tr><td><code>X</code></td><td>Disabled</td><td>ถูกสั่งปิดไว้</td></tr>
</table>
<div class="note"><b>อ่าน flag ให้เป็นแล้วไล่ปัญหาได้ครึ่งทาง</b> — เจอ route ที่<b>ไม่มี A</b> แปลว่า RouterOS ไม่ยอมใช้เส้นนั้น
สาเหตุอันดับหนึ่งคือ <b>gateway ที่ระบุไม่ได้อยู่ในวงที่ router ต่ออยู่</b> จึงส่งไปไม่ถึง</div>`,
      },
      {
        t: 'Static routing — สร้าง route, default route และ route สำรอง',
        h: `
<pre class="code"><span style="color:#5b6b8c"># default route — "ไม่รู้จะไปไหน ให้ส่งไปทางนี้"</span>
/ip route add dst-address=0.0.0.0/0 gateway=203.0.113.1

<span style="color:#5b6b8c"># route เจาะจง — วง 10.20.0.0/16 อยู่หลัง router อีกตัว</span>
/ip route add dst-address=10.20.0.0/16 gateway=192.168.88.254

<span style="color:#5b6b8c"># route สำรอง — distance สูงกว่าจะถูกใช้เมื่อเส้นหลักล้ม</span>
/ip route add dst-address=0.0.0.0/0 gateway=192.168.100.1 distance=10

/ip route print</pre>
<table class="tbl">
<tr><th>ค่า</th><th>ความหมาย</th></tr>
<tr><td><code>dst-address</code></td><td>ปลายทางที่ route นี้ดูแล — <code>0.0.0.0/0</code> คือทุกที่ที่เหลือ</td></tr>
<tr><td><code>gateway</code></td><td>ส่งต่อให้ใคร — ต้องเป็น IP ที่ router <b>ต่อถึงได้โดยตรง</b></td></tr>
<tr><td><code>distance</code></td><td>ยิ่งน้อยยิ่งชนะ (ค่าเริ่มต้น 1) ใช้ทำเส้นหลัก/เส้นสำรอง</td></tr>
<tr><td><code>check-gateway</code></td><td><code>ping</code> หรือ <code>arp</code> — ให้ router คอยเช็คว่า gateway ยังอยู่ไหม ถ้าตายให้ตัดไปเส้นสำรองเอง</td></tr>
</table>
<p><b>Dynamic routes ที่เกิดขึ้นเอง</b> — ไม่ต้องสร้างและลบด้วยมือไม่ได้</p>
<ul>
  <li><b>Connected</b> (<code>DC</code>) เกิดทันทีที่ใส่ IP ให้ interface</li>
  <li><b>จาก DHCP client / PPPoE</b> (<code>DS</code>) ถ้าเปิด <code>add-default-route=yes</code></li>
  <li><b>จาก routing protocol</b> เช่น OSPF (<code>DAo</code>) — อยู่นอกขอบเขต MTCNA แต่ควรรู้ว่ามี</li>
</ul>
<div class="note warn"><b>ปัญหาที่เจอบ่อยที่สุดของ static route</b> — ใส่ gateway เป็น IP ที่อยู่คนละวงกับทุก interface ของ router
RouterOS จะรับคำสั่งไว้แต่ไม่ติดธง <code>A</code> ให้ ตรวจด้วย <code>/ip route print</code> ทุกครั้งว่าเส้นที่เพิ่งใส่มี A ขึ้นหรือไม่</div>`,
      },
      {
        t: 'MTCNA Module 7 — Simple Queue',
        h: `
<p>Simple Queue คือวิธีจำกัดความเร็วที่ง่ายที่สุดใน RouterOS — ระบุว่า "ใคร" แล้วบอกว่า "ได้เท่าไหร่"</p>
<pre class="code"><span style="color:#5b6b8c"># จำกัดเครื่องเดียว 10M ขึ้น / 10M ลง  (รูปแบบคือ upload/download)</span>
/queue simple add name=user-a target=192.168.88.24/32 max-limit=10M/10M

<span style="color:#5b6b8c"># จำกัดทั้งวง</span>
/queue simple add name=office target=192.168.88.0/24 max-limit=100M/100M

<span style="color:#5b6b8c"># จำกัดเฉพาะตอนไปปลายทางบางที่</span>
/queue simple add name=to-hq target=192.168.88.0/24 dst=10.20.0.0/16 max-limit=20M/20M

/queue simple print</pre>
<table class="tbl">
<tr><th>ค่า</th><th>หมายถึง</th></tr>
<tr><td><code>target</code></td><td>ใครถูกจำกัด — ระบุเป็น IP, วง หรือชื่อ interface</td></tr>
<tr><td><code>dst</code></td><td>จำกัดเฉพาะเมื่อไปหาปลายทางนี้ (เว้นว่าง = ทุกปลายทาง)</td></tr>
<tr><td><b><code>max-limit</code></b></td><td>เพดานสูงสุด — <b>ไม่มีทางได้เกินนี้</b></td></tr>
<tr><td><b><code>limit-at</code></b></td><td>ความเร็วที่<b>รับประกัน</b>ว่าจะได้แน่ ๆ แม้ตอนเน็ตแน่น</td></tr>
</table>
<p><b>Bursting</b> — ให้เร็วกว่าเพดานได้ชั่วครู่ ทำให้เปิดเว็บรู้สึกไวขึ้นมากโดยไม่เปลืองแบนด์วิดท์รวม</p>
<pre class="code">/queue simple add name=user-b target=192.168.88.25/32 \\
    max-limit=10M/10M burst-limit=20M/20M burst-threshold=8M/8M burst-time=8s/8s</pre>
<table class="tbl">
<tr><th>ค่า</th><th>อธิบายแบบเข้าใจง่าย</th></tr>
<tr><td><code>burst-limit</code></td><td>ความเร็วสูงสุดตอนพุ่ง</td></tr>
<tr><td><code>burst-threshold</code></td><td>ถ้าค่าเฉลี่ยยัง<b>ต่ำกว่า</b>นี้ ถึงจะมีสิทธิ์พุ่ง</td></tr>
<tr><td><code>burst-time</code></td><td>ช่วงเวลาที่ใช้คำนวณค่าเฉลี่ย (ไม่ใช่ระยะเวลาที่พุ่งได้)</td></tr>
</table>
<div class="note warn"><b>สองกับดักของ Simple Queue</b><br>
1. <b>ลำดับสำคัญ</b> — อ่านจากบนลงล่างและหยุดที่อันแรกที่ตรง คิวของ "ทั้งวง" ที่วางไว้บนสุดจะกลบคิวรายเครื่องที่อยู่ล่าง<br>
2. <b>FastTrack ทำให้ queue ไม่ทำงาน</b> — ถ้าตั้งแล้วไม่มีผล ให้ไปดูที่ <code>/ip firewall filter</code> ว่ามีกฎ fasttrack-connection อยู่หรือไม่</div>`,
      },
      {
        t: 'PCQ — คิวเดียวที่แบ่งให้ทุกคนเท่า ๆ กัน',
        h: `
<p>ปัญหาของ Simple Queue คือถ้ามีผู้ใช้ 200 คน ก็ต้องสร้าง 200 คิว <b>PCQ (Per Connection Queue)</b> แก้ปัญหานี้
ด้วยการสร้างคิวเดียวแล้วให้มันแตกคิวย่อยตาม IP ให้เองอัตโนมัติ</p>
<pre class="code"><span style="color:#5b6b8c"># 1) สร้าง queue type สองตัว — ขาลงแยกตาม dst-address ขาขึ้นแยกตาม src-address</span>
/queue type add name=pcq-download kind=pcq pcq-rate=2M pcq-limit=50 pcq-classifier=dst-address
/queue type add name=pcq-upload   kind=pcq pcq-rate=1M pcq-limit=50 pcq-classifier=src-address

<span style="color:#5b6b8c"># 2) คิวเดียวคุมทั้งวง โดยใช้ type ที่สร้างไว้</span>
/queue simple add name=all-users target=192.168.88.0/24 \\
    max-limit=100M/100M queue=pcq-upload/pcq-download

/queue type print</pre>
<table class="tbl">
<tr><th>ค่า</th><th>ความหมาย</th><th>ตั้งอย่างไร</th></tr>
<tr><td><b><code>pcq-classifier</code></b></td><td>ใช้อะไรแยกว่าเป็นคนละคน</td><td>ขา<b>ลง</b>ใช้ <code>dst-address</code> · ขา<b>ขึ้น</b>ใช้ <code>src-address</code> — สลับกันแล้วจะไม่ทำงาน</td></tr>
<tr><td><b><code>pcq-rate</code></b></td><td>เพดานต่อคน</td><td>ใส่ <code>0</code> = แบ่งเท่า ๆ กันตามจำนวนคนที่ใช้อยู่จริงในขณะนั้น</td></tr>
<tr><td><code>pcq-limit</code></td><td>จำนวนแพ็กเก็ตที่รอในคิวย่อยแต่ละอัน</td><td>50 คือค่าที่ใช้ได้ทั่วไป</td></tr>
<tr><td><code>pcq-total-limit</code></td><td>เพดานรวมของทุกคิวย่อย</td><td>เพิ่มเมื่อผู้ใช้เยอะมาก</td></tr>
</table>
<div class="note"><b>เลือกอย่างไร</b> — <code>pcq-rate=2M</code> เหมาะกับกรณีที่อยากการันตีว่าไม่มีใครเกิน 2M ·
<code>pcq-rate=0</code> เหมาะกับ guest wifi ที่อยากให้ "แบ่งกันเอง" คนใช้น้อยก็ได้เร็ว คนใช้เยอะก็ช้าลงพร้อมกันทุกคน อย่างยุติธรรม</div>`,
      },
      {
        t: 'MTCNA Module 8 — PPP, IP pool และ point-to-point addresses',
        h: `
<p>ตระกูล PPP (PPPoE, PPTP, SSTP, L2TP, OVPN) ใช้โครงสร้างเดียวกันทั้งหมด รู้สามชิ้นนี้แล้วใช้ได้ทุกตัว</p>
<table class="tbl">
<tr><th>ชิ้นส่วน</th><th>หน้าที่</th></tr>
<tr><td><code>/ppp profile</code></td><td>ชุดค่าที่ใช้ร่วมกัน — IP ฝั่ง router, ช่วง IP ที่จะแจก, DNS, การบีบอัด, การเข้ารหัส</td></tr>
<tr><td><code>/ppp secret</code></td><td>บัญชีผู้ใช้รายคน — username, password, service, profile ที่ใช้, IP ประจำตัว</td></tr>
<tr><td><code>/ppp active</code></td><td>ใครออนไลน์อยู่ตอนนี้บ้าง ต่อมานานเท่าไหร่ ได้ IP อะไร</td></tr>
</table>
<pre class="code"><span style="color:#5b6b8c"># IP pool — ช่วงที่จะแจกให้ client ที่ต่อเข้ามา</span>
/ip pool add name=ppp-pool ranges=10.20.0.10-10.20.0.200

<span style="color:#5b6b8c"># profile — local-address คือ IP ฝั่ง router, remote-address ชี้ไปที่ pool</span>
/ppp profile add name=office-ppp local-address=10.20.0.1 remote-address=ppp-pool dns-server=10.20.0.1

<span style="color:#5b6b8c"># บัญชีผู้ใช้</span>
/ppp secret add name=user01 password=Secret123 service=pppoe profile=office-ppp
/ppp secret add name=user02 password=Secret456 service=pppoe profile=office-ppp remote-address=10.20.0.55

/ppp secret print
/ppp active print</pre>
<p><b>Point-to-point addresses</b> — ลิงก์ PPP มีปลายทางแค่สองฝั่ง จึงไม่ต้องใช้ subnet เต็ม ๆ
RouterOS จะใส่ IP เป็น <code>/32</code> ให้แต่ละฝั่ง แล้วสร้าง route ตรงถึงกัน ผลคือ<b>ประหยัด IP ได้มาก</b>
เทียบกับการใช้ /30 ที่เสีย IP ไป 2 เบอร์ต่อหนึ่งลิงก์</p>
<pre class="code">/ip address print
<span style="color:#5b6b8c"># ADDRESS            NETWORK          INTERFACE</span>
<span style="color:#5b6b8c"># 10.20.0.1/32       10.20.0.55       &lt;pppoe-user02&gt;   ← ฝั่ง router</span></pre>`,
      },
      {
        t: 'PPPoE และ VPN สำหรับสาขา (PPTP / SSTP)',
        h: `
<p><b>PPPoE</b> คือการหุ้ม PPP ไว้ในเฟรม Ethernet ทำให้ ISP บังคับให้ลูกค้าล็อกอินก่อนใช้เน็ตได้
และคิดเงินตามบัญชีได้ — เป็นเหตุผลที่เน็ตบ้านเกือบทุกเจ้าใช้ PPPoE</p>
<pre class="code"><span style="color:#5b6b8c"># ฝั่ง client — ต่อกับ ISP</span>
/interface pppoe-client add name=pppoe-out1 interface=ether1 \\
    user=isp-user password=isp-pass add-default-route=yes use-peer-dns=yes disabled=no

<span style="color:#5b6b8c"># ฝั่ง server — เราเป็นคนแจกเน็ตเอง</span>
/interface pppoe-server server add interface=ether3 service-name=office \\
    default-profile=office-ppp authentication=pap,chap disabled=no</pre>
<div class="note"><b><code>service-name</code> มีไว้ทำไม</b> — ในวงเดียวกันอาจมี PPPoE server มากกว่าหนึ่งเจ้า
client จะเลือกต่อกับ server ที่ service-name ตรงกัน ถ้าเว้นว่างไว้ client จะต่อกับตัวไหนก็ได้ที่ตอบมาก่อน</div>
<p><b>VPN เชื่อมสาขา</b> — MTCNA แนะนำสองตัวที่ตั้งง่ายที่สุด</p>
<table class="tbl">
<tr><th></th><th>PPTP</th><th>SSTP</th></tr>
<tr><td>ใช้พอร์ต</td><td>TCP 1723 + GRE (protocol 47)</td><td><b>TCP 443</b></td></tr>
<tr><td>ผ่าน NAT / firewall องค์กร</td><td>มักมีปัญหา เพราะ GRE ไม่ใช่ TCP/UDP</td><td><b>ผ่านได้เกือบทุกที่</b> เพราะดูเหมือน HTTPS</td></tr>
<tr><td>ความปลอดภัย</td><td><b>ถือว่าแตกแล้ว</b> — MS-CHAPv2 ถูกถอดรหัสได้</td><td>ดี ใช้ TLS จริง (ควรใช้ certificate)</td></tr>
<tr><td>ควรใช้เมื่อ</td><td>อุปกรณ์เก่าที่ไม่มีทางเลือกอื่นเท่านั้น</td><td>งานทั่วไปที่ต้องผ่าน firewall ของคนอื่น</td></tr>
</table>
<pre class="code"><span style="color:#5b6b8c"># ฝั่ง server (PPTP — ตั้งง่ายแต่ไม่ปลอดภัย ใช้เฉพาะใน lab)</span>
/interface pptp-server server set enabled=yes default-profile=office-ppp

<span style="color:#5b6b8c"># ฝั่ง client SSTP — วิ่งบน TCP 443 จึงผ่าน firewall ของโรงแรม/ลูกค้าได้</span>
/interface sstp-client add name=sstp-out1 connect-to=203.0.113.9 \\
    user=branch01 password=Secret789 profile=office-ppp disabled=no</pre>
<div class="note warn"><b>Quick Set ก็ทำ VPN ให้ได้</b> — ในหน้า Quick Set มีช่อง <b>VPN Access</b> ติ๊กแล้วใส่รหัส
RouterOS จะสร้าง PPTP/SSTP server พร้อมบัญชีให้อัตโนมัติ สะดวกมากสำหรับงานเล็ก
แต่ควรรู้ว่ามันไปสร้างอะไรไว้บ้าง เพราะเวลามีปัญหาต้องมาแก้ที่ <code>/ppp</code> อยู่ดี</div>`,
      },
    ],

    quiz: [
      { type: 'mcq', q: 'Flag <code>A</code> ใน <code>/ip route print</code> หมายถึงอะไร', opts: ['Automatic', 'Active — route นี้ถูกใช้งานจริง', 'Address', 'Allowed'], a: 1, why: 'route ที่ไม่มี A แปลว่ามีอยู่ในตารางแต่ไม่ถูกใช้ สาเหตุที่พบบ่อยที่สุดคือ gateway ที่ระบุอยู่คนละวงกับทุก interface ของ router' },
      { type: 'cmd', q: 'พิมพ์คำสั่งเพิ่ม default route ผ่าน gateway <code>203.0.113.1</code>', ans: ['/ip route add dst-address=0.0.0.0/0 gateway=203.0.113.1', 'ip route add dst-address=0.0.0.0/0 gateway=203.0.113.1', '/ip route add gateway=203.0.113.1 dst-address=0.0.0.0/0'], why: '0.0.0.0/0 คือ "ทุกปลายทางที่เหลือ" — DHCP client จะใส่ให้อัตโนมัติ แต่ถ้าตั้ง IP แบบ static ต้องใส่เอง' },
      { type: 'mcq', q: 'route ปลายทาง <code>10.20.0.0/16</code> กับ <code>10.20.5.0/24</code> มีอยู่ทั้งคู่ แพ็กเก็ตไปหา 10.20.5.7 จะใช้เส้นไหน', opts: ['10.20.0.0/16 เพราะกว้างกว่า', '10.20.5.0/24 เพราะเจาะจงกว่า', 'เส้นที่อยู่บรรทัดบนกว่า', 'เส้นที่ distance ต่ำกว่า'], a: 1, why: 'Longest Prefix Match — prefix ที่ยาวกว่า (เจาะจงกว่า) ชนะเสมอ ไม่เกี่ยวกับลำดับบรรทัดหรือ distance เว้นแต่ปลายทางเท่ากันเป๊ะ' },
      { type: 'mcq', q: 'ต้องการทำ route สำรองที่ใช้เมื่อเส้นหลักล้ม ควรตั้งค่าใด', opts: ['distance ให้สูงกว่าเส้นหลัก', 'distance ให้ต่ำกว่าเส้นหลัก', 'ตั้ง dst-address ให้แคบกว่า', 'ใส่ comment ว่า backup'], a: 0, why: 'distance ยิ่งน้อยยิ่งชนะ เส้นสำรองจึงต้อง distance สูงกว่า และควรใส่ check-gateway=ping ที่เส้นหลักเพื่อให้ router รู้ว่าเส้นหลักตายแล้ว' },
      { type: 'mcq', q: 'ใน Simple Queue ค่า <code>limit-at</code> ต่างจาก <code>max-limit</code> อย่างไร', opts: ['เหมือนกัน', 'limit-at คือความเร็วที่รับประกันว่าจะได้แน่ ส่วน max-limit คือเพดานที่ห้ามเกิน', 'limit-at ใช้กับ upload อย่างเดียว', 'max-limit ใช้ได้เฉพาะกับ PCQ'], a: 1, why: 'ตอนเน็ตว่างจะได้ถึง max-limit ตอนเน็ตแน่นจะยังได้อย่างน้อย limit-at — จึงใช้การันตีความเร็วขั้นต่ำให้ลูกค้าหรือแผนกสำคัญได้' },
      { type: 'cmd', q: 'พิมพ์คำสั่งสร้าง Simple Queue ชื่อ <code>user-a</code> จำกัดเครื่อง <code>192.168.88.24/32</code> ที่ <code>10M/10M</code>', ans: ['/queue simple add name=user-a target=192.168.88.24/32 max-limit=10M/10M', 'queue simple add name=user-a target=192.168.88.24/32 max-limit=10M/10M'], why: 'รูปแบบ max-limit คือ upload/download เสมอ — ค่าแรกคือขาขึ้น ค่าหลังคือขาลง' },
      { type: 'mcq', q: 'PCQ ขา <b>download</b> ควรตั้ง <code>pcq-classifier</code> เป็นอะไร', opts: ['src-address', 'dst-address', 'src-port', 'interface'], a: 1, why: 'ขาลงคือ traffic ที่วิ่งเข้าหาเครื่องผู้ใช้ ตัวที่บอกว่าเป็นของใครจึงเป็น "ปลายทาง" (dst-address) ส่วนขาขึ้นใช้ src-address — สลับกันเมื่อไหร่คิวจะไม่แยกคน' },
      { type: 'mcq', q: 'ตั้ง <code>pcq-rate=0</code> หมายความว่าอย่างไร', opts: ['ปิดการจำกัดความเร็ว', 'แบ่งแบนด์วิดท์เท่า ๆ กันตามจำนวนคนที่ใช้อยู่จริงในขณะนั้น', 'ให้ความเร็วเป็นศูนย์', 'ใช้ค่าเริ่มต้น 1M'], a: 1, why: 'pcq-rate=0 คือโหมด "แบ่งกันเอง" — คนใช้น้อยก็ได้เร็ว คนใช้เยอะก็ช้าลงพร้อมกันทุกคนอย่างยุติธรรม เหมาะกับ guest wifi มาก' },
      { type: 'mcq', q: 'ใน <code>/ppp profile</code> ค่า <code>remote-address</code> ควรชี้ไปที่อะไร', opts: ['IP ของ router เอง', 'ชื่อ IP pool ที่จะแจกให้ client', 'IP ของ DNS server', 'ชื่อ interface'], a: 1, why: 'local-address คือ IP ฝั่ง router ส่วน remote-address ชี้ไปที่ pool เพื่อให้ client แต่ละคนได้ IP คนละเบอร์จากช่วงนั้น' },
      { type: 'cmd', q: 'พิมพ์คำสั่งดูว่ามี PPP client ใดออนไลน์อยู่บ้างตอนนี้', ans: ['/ppp active print', 'ppp active print'], why: '/ppp secret คือรายชื่อบัญชีทั้งหมด ส่วน /ppp active คือใครกำลังต่ออยู่จริง ได้ IP อะไร ต่อมานานแค่ไหน — ใช้ตอนตรวจว่าลูกค้าออนไลน์ไหม' },
      { type: 'mcq', q: 'ทำไม SSTP จึงผ่าน firewall ขององค์กรอื่นได้ง่ายกว่า PPTP', opts: ['เพราะเข้ารหัสแรงกว่า', 'เพราะวิ่งบน TCP 443 จึงดูเหมือน HTTPS ทั่วไป', 'เพราะใช้ UDP', 'เพราะไม่ต้องยืนยันตัวตน'], a: 1, why: 'PPTP ต้องใช้ GRE (protocol 47) ซึ่ง NAT และ firewall จำนวนมากไม่ส่งต่อให้ ส่วน SSTP เป็น TCP 443 ธรรมดาจึงผ่านได้เกือบทุกที่' },
      { type: 'multi', q: 'ข้อใดคือส่วนประกอบของระบบ PPP ใน RouterOS (เลือกทุกข้อที่ถูก)', opts: ['/ppp profile', '/ppp secret', '/ip pool', '/ip firewall filter'], a: [0, 1, 2], why: 'profile กำหนดค่าร่วม, secret คือบัญชีรายคน, pool คือช่วง IP ที่จะแจก — ส่วน firewall filter เป็นคนละเรื่อง แม้จะต้องเปิดพอร์ตให้ VPN ต่อเข้ามาได้ก็ตาม' },
    ],

    labs: [
      {
        id: 'mtcna-m4',
        title: 'MTCNA Module 4 Lab — Static routing เชื่อมสองสาขา',
        brief: 'สำนักงานใหญ่ต่ออินเทอร์เน็ตผ่าน ISP และมี router อีกตัวที่ 192.168.88.254 ซึ่งด้านหลังเป็นวงของสาขา 10.20.0.0/16 คุณต้องวางเส้นทางให้ครบทั้งขาออกเน็ตและขาไปสาขา พร้อมเส้นสำรอง',
        device: 'mikrotik',
        tasks: [
          { t: 'ใส่ IP <code>192.168.88.1/24</code> ที่ <code>ether2</code>', hint: '/ip address add address=192.168.88.1/24 interface=ether2', check: s => has(s, 'ip address', r => r.address === '192.168.88.1/24' && r.interface === 'ether2') },
          { t: 'ใส่ IP <code>203.0.113.25/29</code> ที่ <code>ether1</code> (WAN แบบ static)', hint: '/ip address add address=203.0.113.25/29 interface=ether1', check: s => has(s, 'ip address', r => r.address === '203.0.113.25/29' && r.interface === 'ether1') },
          { t: 'เพิ่ม default route ผ่าน <code>203.0.113.1</code>', hint: '/ip route add dst-address=0.0.0.0/0 gateway=203.0.113.1', check: s => has(s, 'ip route', r => r['dst-address'] === '0.0.0.0/0' && r.gateway === '203.0.113.1') },
          { t: 'เพิ่ม route ไปวงสาขา <code>10.20.0.0/16</code> ผ่าน <code>192.168.88.254</code>', hint: '/ip route add dst-address=10.20.0.0/16 gateway=192.168.88.254', check: s => has(s, 'ip route', r => r['dst-address'] === '10.20.0.0/16' && r.gateway === '192.168.88.254') },
          { t: 'เพิ่ม default route สำรองผ่าน <code>192.168.88.253</code> โดยตั้ง <code>distance=10</code>', hint: '/ip route add dst-address=0.0.0.0/0 gateway=192.168.88.253 distance=10', check: s => has(s, 'ip route', r => r['dst-address'] === '0.0.0.0/0' && r.gateway === '192.168.88.253' && String(r.distance) === '10') },
          { t: 'ดู routing table แล้วสังเกต flag ว่าเส้นไหนมี A', hint: '/ip route print', check: (s, h) => said(h, /ip\s+route\s+print/i) },
          { t: 'ตั้ง DNS ให้ router ใช้ <code>8.8.8.8</code>', hint: '/ip dns set servers=8.8.8.8', check: s => /8\.8\.8\.8/.test(s.settings['ip dns'].servers) },
          { t: 'ทดสอบว่าออกเน็ตได้', hint: '/ping 8.8.8.8', check: (s, h) => said(h, /ping\s+8\.8\.8\.8/i) },
        ],
      },
      {
        id: 'mtcna-m7',
        title: 'MTCNA Module 7 Lab — จำกัดความเร็วรายเครื่องและทั้งวงด้วย PCQ',
        brief: 'เน็ตออฟฟิศช้าตลอดบ่ายเพราะมีบางเครื่องดาวน์โหลดหนัก คุณต้องจำกัดเครื่องที่มีปัญหาเป็นรายตัว แล้ววางคิวรวมแบบ PCQ ให้ทุกคนที่เหลือได้ส่วนแบ่งเท่า ๆ กัน',
        device: 'mikrotik',
        tasks: [
          { t: 'ใส่ IP <code>192.168.88.1/24</code> ที่ <code>ether2</code>', hint: '/ip address add address=192.168.88.1/24 interface=ether2', check: s => has(s, 'ip address', r => r.address === '192.168.88.1/24' && r.interface === 'ether2') },
          { t: 'จำกัดเครื่อง <code>192.168.88.24/32</code> ชื่อคิว <code>user-heavy</code> ที่ <code>5M/5M</code>', hint: '/queue simple add name=user-heavy target=192.168.88.24/32 max-limit=5M/5M', check: s => has(s, 'queue simple', r => r.name === 'user-heavy' && r.target === '192.168.88.24/32' && /5M\/5M/i.test(r['max-limit'] || '')) },
          { t: 'เพิ่ม burst ให้เครื่องผู้บริหาร <code>192.168.88.25/32</code> คิวชื่อ <code>user-vip</code>', hint: '/queue simple add name=user-vip target=192.168.88.25/32 max-limit=10M/10M burst-limit=20M/20M burst-threshold=8M/8M burst-time=8s/8s', check: s => has(s, 'queue simple', r => r.name === 'user-vip' && !!r['burst-limit']) },
          { t: 'สร้าง queue type <code>pcq-download</code> แบบ pcq จำแนกด้วย <code>dst-address</code>', hint: '/queue type add name=pcq-download kind=pcq pcq-rate=2M pcq-classifier=dst-address', check: s => has(s, 'queue type', r => r.name === 'pcq-download' && r.kind === 'pcq' && r['pcq-classifier'] === 'dst-address') },
          { t: 'สร้าง queue type <code>pcq-upload</code> แบบ pcq จำแนกด้วย <code>src-address</code>', hint: '/queue type add name=pcq-upload kind=pcq pcq-rate=1M pcq-classifier=src-address', check: s => has(s, 'queue type', r => r.name === 'pcq-upload' && r.kind === 'pcq' && r['pcq-classifier'] === 'src-address') },
          { t: 'สร้างคิวรวม <code>all-users</code> คุมทั้งวง <code>192.168.88.0/24</code> ที่ <code>100M/100M</code> โดยใช้ queue ที่สร้างไว้', hint: '/queue simple add name=all-users target=192.168.88.0/24 max-limit=100M/100M queue=pcq-upload/pcq-download', check: s => has(s, 'queue simple', r => r.name === 'all-users' && r.target === '192.168.88.0/24' && /pcq/i.test(r.queue || '')) },
          { t: 'ตรวจรายการ queue type ที่สร้าง', hint: '/queue type print', check: (s, h) => said(h, /queue\s+type\s+print/i) },
          { t: 'ตรวจลำดับ Simple Queue — คิวรายเครื่องต้องอยู่<b>เหนือ</b>คิวรวม', hint: '/queue simple print', check: (s, h) => said(h, /queue\s+simple\s+print/i) },
        ],
      },
      {
        id: 'mtcna-m8',
        title: 'MTCNA Module 8 Lab — วาง PPPoE server และ VPN ให้สาขา',
        brief: 'คุณต้องทำให้ผู้ใช้ต้องล็อกอินก่อนใช้เน็ต โดยตั้ง PPPoE server พร้อมบัญชีผู้ใช้ แล้วเปิดช่องทาง VPN แบบ SSTP ให้สาขาต่อกลับเข้ามาที่สำนักงานใหญ่ได้',
        device: 'mikrotik',
        tasks: [
          { t: 'สร้าง IP pool ชื่อ <code>ppp-pool</code> ช่วง <code>10.20.0.10-10.20.0.200</code>', hint: '/ip pool add name=ppp-pool ranges=10.20.0.10-10.20.0.200', check: s => has(s, 'ip pool', r => r.name === 'ppp-pool' && /10\.20\.0\.10-10\.20\.0\.200/.test(r.ranges || '')) },
          { t: 'สร้าง PPP profile <code>office-ppp</code> local <code>10.20.0.1</code> remote ชี้ไปที่ pool', hint: '/ppp profile add name=office-ppp local-address=10.20.0.1 remote-address=ppp-pool dns-server=10.20.0.1', check: s => has(s, 'ppp profile', r => r.name === 'office-ppp' && r['local-address'] === '10.20.0.1' && r['remote-address'] === 'ppp-pool') },
          { t: 'สร้างบัญชี <code>user01</code> service <code>pppoe</code> ใช้ profile ที่สร้างไว้', hint: '/ppp secret add name=user01 password=Secret123 service=pppoe profile=office-ppp', check: s => has(s, 'ppp secret', r => r.name === 'user01' && r.service === 'pppoe' && r.profile === 'office-ppp') },
          { t: 'สร้างบัญชี <code>user02</code> ที่ได้ IP ประจำตัว <code>10.20.0.55</code>', hint: '/ppp secret add name=user02 password=Secret456 service=pppoe profile=office-ppp remote-address=10.20.0.55', check: s => has(s, 'ppp secret', r => r.name === 'user02' && r['remote-address'] === '10.20.0.55') },
          { t: 'เปิด PPPoE server บน <code>ether3</code> ด้วย service-name <code>office</code>', hint: '/interface pppoe-server server add interface=ether3 service-name=office default-profile=office-ppp disabled=no', check: s => has(s, 'interface pppoe-server server', r => r.interface === 'ether3' && r['service-name'] === 'office') },
          { t: 'สร้าง SSTP client <code>sstp-out1</code> ต่อไปที่ <code>203.0.113.9</code>', hint: '/interface sstp-client add name=sstp-out1 connect-to=203.0.113.9 user=branch01 password=Secret789 profile=office-ppp disabled=no', check: s => has(s, 'interface sstp-client', r => r.name === 'sstp-out1' && r['connect-to'] === '203.0.113.9') },
          { t: 'ดูรายชื่อบัญชี PPP ทั้งหมด', hint: '/ppp secret print', check: (s, h) => said(h, /ppp\s+secret\s+print/i) },
          { t: 'ดูว่าใครออนไลน์อยู่ตอนนี้', hint: '/ppp active print', check: (s, h) => said(h, /ppp\s+active\s+print/i) },
        ],
      },
    ],
  },

  // ================================================================
  //  ระดับ 5 — Module 5 (Wireless) + Module 9 (Misc)
  // ================================================================
  5: {
    sections: [
      {
        t: 'MTCNA Module 5 — แนวคิด 802.11 a/b/g/n/ac',
        h: `
<p>ไร้สายต่างจากสายตรงที่ว่ามันเป็น <b>สื่อร่วม (shared medium)</b> — ทุกคนในย่านความถี่เดียวกันต้องผลัดกันพูด
ยิ่งมีคนเยอะยิ่งช้าลงทุกคน ไม่ใช่แค่คนที่ใช้หนัก</p>
<table class="tbl">
<tr><th>มาตรฐาน</th><th>ย่าน</th><th>ความเร็วสูงสุด (ทฤษฎี)</th><th>หมายเหตุ</th></tr>
<tr><td>802.11b</td><td>2.4 GHz</td><td>11 Mbps</td><td>เก่ามาก — ถ้ามีเครื่องนี้ในวง จะดึงทั้งวงให้ช้าลง</td></tr>
<tr><td>802.11g</td><td>2.4 GHz</td><td>54 Mbps</td><td>—</td></tr>
<tr><td>802.11a</td><td>5 GHz</td><td>54 Mbps</td><td>ย่าน 5 GHz รุ่นแรก</td></tr>
<tr><td>802.11n</td><td>2.4 / 5 GHz</td><td>150 Mbps ต่อ chain</td><td>เริ่มมี MIMO และ channel 40 MHz</td></tr>
<tr><td>802.11ac</td><td><b>5 GHz เท่านั้น</b></td><td>433 Mbps ต่อ chain</td><td>channel กว้างได้ถึง 80/160 MHz</td></tr>
</table>
<p><b>ย่านความถี่และช่อง</b> — เรื่องที่ทำให้สัญญาณแรงแต่เน็ตช้ามีต้นเหตุอยู่ตรงนี้</p>
<table class="tbl">
<tr><th></th><th>2.4 GHz</th><th>5 GHz</th></tr>
<tr><td>ระยะทาง / ทะลุกำแพง</td><td>ไกลกว่า ทะลุดีกว่า</td><td>ใกล้กว่า ทะลุแย่กว่า</td></tr>
<tr><td>ช่องที่ไม่ทับกัน</td><td><b>เหลือแค่ 1, 6, 11</b></td><td>มีให้เลือกเยอะกว่ามาก</td></tr>
<tr><td>สัญญาณรบกวน</td><td>เยอะมาก (ไมโครเวฟ, บลูทูธ, กล้องวงจรปิด)</td><td>น้อยกว่ามาก</td></tr>
<tr><td>เหมาะกับ</td><td>พื้นที่กว้าง อุปกรณ์เก่า IoT</td><td>ความเร็วสูง พื้นที่คนหนาแน่น</td></tr>
</table>
<p><b>Chains, TX power และ RX sensitivity</b></p>
<ul>
  <li><b>Chain</b> = เสาส่ง/รับหนึ่งชุด — 2 chains (MIMO 2x2) ให้ความเร็วราวสองเท่าของ 1 chain</li>
  <li><b>TX power</b> เพิ่มแล้วสัญญาณไปไกลขึ้น แต่<b>ฝั่งเครื่องลูกส่งกลับมาไม่ถึง</b> ถ้ามันแรงไม่พอ — ดัง "ตะโกนใส่คนที่กระซิบ" ผลคือลิงก์ค้าง</li>
  <li><b>RX sensitivity</b> ยิ่งความเร็วสูง ยิ่งต้องการสัญญาณแรง — สัญญาณอ่อนจึงไม่ได้แปลว่าหลุด แต่แปลว่าจะถูกลดความเร็วลงมาเรื่อย ๆ</li>
  <li><b>Country regulation</b> ต้องตั้ง <code>country=thailand</code> เสมอ เพื่อให้ใช้ช่องและกำลังส่งตามกฎหมายในประเทศ</li>
</ul>
<div class="note warn"><b>ความเข้าใจผิดที่พบบ่อยที่สุด</b> — เร่ง TX power ให้สุดแล้วจะดีขึ้น
ความจริงคือลิงก์ไร้สายต้องส่งได้<b>ทั้งสองทาง</b> การเร่งฝั่ง AP อย่างเดียวทำให้เครื่องลูกเห็นสัญญาณเต็มขีดแต่ส่งกลับไม่ถึง
กลายเป็นสัญญาณเต็มแต่เน็ตใช้ไม่ได้ — ทางแก้ที่ถูกคือเพิ่มจำนวน AP ไม่ใช่เพิ่มกำลังส่ง</div>`,
      },
      {
        t: 'ตั้งลิงก์ไร้สายง่าย ๆ — AP และ Station',
        h: `
<table class="tbl">
<tr><th>mode</th><th>บทบาท</th><th>ใช้ตอนไหน</th></tr>
<tr><td><code>ap-bridge</code></td><td>เป็น AP รับ client ได้หลายตัว</td><td>กระจายสัญญาณให้ผู้ใช้ — ต้อง license level 4 ขึ้นไป</td></tr>
<tr><td><code>bridge</code></td><td>เป็น AP ที่รับได้ <b>ตัวเดียว</b></td><td>ลิงก์ point-to-point</td></tr>
<tr><td><code>station</code></td><td>เป็นเครื่องลูก</td><td>รับสัญญาณมาใช้เอง</td></tr>
<tr><td><code>station-bridge</code></td><td>เครื่องลูกที่ bridge ต่อไปได้</td><td>ต่อ MikroTik ↔ MikroTik แล้วส่งต่อทั้งวง</td></tr>
</table>
<pre class="code"><span style="color:#5b6b8c"># ฝั่ง AP</span>
/interface wireless set [find name=wlan1] mode=ap-bridge band=2ghz-b/g/n \\
    frequency=2412 ssid=OFFICE-WIFI country=thailand disabled=no

<span style="color:#5b6b8c"># ฝั่ง Station</span>
/interface wireless set [find name=wlan1] mode=station band=2ghz-b/g/n \\
    ssid=OFFICE-WIFI disabled=no

<span style="color:#5b6b8c"># สำรวจว่ารอบตัวมีใครใช้ช่องไหนอยู่ก่อนเลือกความถี่</span>
/interface wireless scan wlan1</pre>
<div class="note warn"><b><code>scan</code> จะตัดการเชื่อมต่อของ wlan1 ชั่วคราว</b> เพราะการ์ดต้องไล่ฟังทีละช่อง
ห้ามรันบน AP ที่มีผู้ใช้อยู่ในเวลางาน</div>`,
      },
      {
        t: 'Wireless security — Security Profile, Access List และ Connect List',
        h: `
<pre class="code"><span style="color:#5b6b8c"># สร้าง security profile แบบ WPA2-PSK แล้วผูกเข้ากับ wlan1</span>
/interface wireless security-profiles add name=office mode=dynamic-keys \\
    authentication-types=wpa2-psk wpa2-pre-shared-key=Str0ngWiFiPass

/interface wireless set [find name=wlan1] security-profile=office</pre>
<table class="tbl">
<tr><th>authentication-types</th><th>ควรใช้ไหม</th></tr>
<tr><td><code>wpa2-psk</code></td><td><b>ใช่</b> — ค่ามาตรฐานที่ควรใช้ในงานทั่วไป</td></tr>
<tr><td><code>wpa-psk</code></td><td>เฉพาะเมื่อมีอุปกรณ์เก่าที่รองรับแค่นี้ — และควรวางแผนเปลี่ยน</td></tr>
<tr><td><code>wpa2-eap</code></td><td>องค์กรที่มี RADIUS — ผู้ใช้ล็อกอินด้วยบัญชีของตัวเอง ไม่ใช้รหัสร่วม</td></tr>
<tr><td><code>mode=none</code></td><td>เปิดโล่ง — ใช้ได้เฉพาะ guest network ที่แยกวงและจำกัดสิทธิ์แล้วเท่านั้น</td></tr>
</table>
<p><b>Access List กับ Connect List — สองตารางที่คนสับสนกันมากที่สุด</b></p>
<table class="tbl">
<tr><th></th><th><code>access-list</code></th><th><code>connect-list</code></th></tr>
<tr><td>ใช้ที่ฝั่งไหน</td><td><b>AP</b></td><td><b>Station</b></td></tr>
<tr><td>ตอบคำถามว่า</td><td>"ใครเข้ามาหาเราได้บ้าง"</td><td>"เราจะไปเกาะกับใคร"</td></tr>
<tr><td>ใช้ทำอะไร</td><td>whitelist/blacklist ตาม MAC, จำกัดสัญญาณขั้นต่ำ, บังคับ security profile ราย client</td><td>เลือก AP ตาม SSID/MAC, จัดลำดับความชอบเมื่อมีหลาย AP</td></tr>
</table>
<pre class="code"><span style="color:#5b6b8c"># ฝั่ง AP — อนุญาตเฉพาะเครื่องนี้</span>
/interface wireless access-list add interface=wlan1 \\
    mac-address=A4:5E:60:C1:22:01 authentication=yes forwarding=yes comment="Notebook-01"

<span style="color:#5b6b8c"># ฝั่ง Station — ให้เกาะเฉพาะ SSID นี้เท่านั้น</span>
/interface wireless connect-list add interface=wlan1 ssid=OFFICE-WIFI security-profile=office</pre>
<table class="tbl">
<tr><th>ค่าบน interface</th><th>ผล</th></tr>
<tr><td><code>default-authenticate=yes</code></td><td>ใครที่ไม่มีในตาราง access-list ก็ยังต่อได้ (ค่าเริ่มต้น)</td></tr>
<tr><td><b><code>default-authenticate=no</code></b></td><td><b>ต่อได้เฉพาะ MAC ที่อยู่ใน access-list</b> — นี่คือวิธีทำ whitelist จริง ๆ</td></tr>
<tr><td><code>default-forward=yes</code></td><td>client คุยกันเองได้</td></tr>
<tr><td><b><code>default-forward=no</code></b></td><td><b>client คุยกันเองไม่ได้</b> — ควรตั้งค่านี้กับ guest wifi เสมอ</td></tr>
</table>
<div class="note warn"><b>WPS</b> (<code>wps-accept</code> / <code>wps-client</code>) ให้กดปุ่มแล้วต่อได้โดยไม่ต้องพิมพ์รหัส
สะดวกกับเครื่องพิมพ์และ IoT แต่ WPS แบบ PIN <b>ถูกเจาะได้ด้วยการเดาเลข</b>
งานองค์กรควรปิดไว้ และเปิดเฉพาะช่วงเวลาที่ต้องใช้จริง</div>`,
      },
      {
        t: 'Monitoring ฝั่งไร้สาย — Registration Table และ Snooper',
        h: `
<pre class="code"><span style="color:#5b6b8c"># ใครเกาะอยู่ตอนนี้ สัญญาณเท่าไหร่ ความเร็วเท่าไหร่</span>
/interface wireless registration-table print

<span style="color:#5b6b8c"># ภาพรวมทั้งย่าน — ช่องไหนแน่น ใครใช้อยู่</span>
/interface wireless snooper</pre>
<table class="tbl">
<tr><th>ค่าที่ต้องอ่านเป็น</th><th>ตีความอย่างไร</th></tr>
<tr><td><code>signal-strength</code></td><td>ดีกว่า <b>-65 dBm</b> ถือว่าดี · แย่กว่า <b>-75 dBm</b> เริ่มมีปัญหา (ตัวเลขติดลบน้อย = แรงกว่า)</td></tr>
<tr><td><code>tx-rate / rx-rate</code></td><td>ความเร็วที่ตกลงกันได้จริง ณ ตอนนั้น — ต่ำผิดปกติแปลว่าสัญญาณแย่หรือมีการรบกวน</td></tr>
<tr><td><code>tx-ccq</code></td><td>คุณภาพลิงก์เป็น % — ต่ำกว่า 70% ควรไปดูว่ามีอะไรกวน</td></tr>
<tr><td><code>uptime</code></td><td>ต่อมานานแค่ไหน — ถ้ารีเซ็ตบ่อย ๆ แปลว่าหลุดแล้วต่อใหม่ซ้ำ ๆ</td></tr>
</table>
<div class="note"><b>ไล่ปัญหา "สัญญาณเต็มแต่เน็ตช้า"</b> — ดู <code>signal-strength</code> แล้วดู <code>tx-rate</code> ควบคู่กัน
ถ้าสัญญาณดีแต่ rate ต่ำ แปลว่าปัญหาไม่ได้อยู่ที่ระยะทาง แต่อยู่ที่ <b>ช่องความถี่แน่น</b> ให้ใช้ snooper หาช่องที่ว่างกว่าแล้วย้าย</div>`,
      },
      {
        t: 'MTCNA Module 9 — RouterOS tools',
        h: `
<table class="tbl">
<tr><th>เครื่องมือ</th><th>ใช้ทำอะไร</th></tr>
<tr><td><b>E-mail</b></td><td>ให้ router ส่งเมลเองได้ — ใช้คู่กับ netwatch หรือ scheduler เพื่อแจ้งเตือน</td></tr>
<tr><td><b>Netwatch</b></td><td>เฝ้าดูว่า host หนึ่งยังตอบ ping ไหม แล้ว<b>สั่งงานอัตโนมัติ</b>เมื่อสถานะเปลี่ยน</td></tr>
<tr><td><b>Ping</b></td><td>ถึงหรือไม่ถึง และช้าแค่ไหน</td></tr>
<tr><td><b>Traceroute</b></td><td>ไปตายที่ hop ไหน — ตัวชี้ขาดว่าปัญหาอยู่ในบ้านเราหรือที่ ISP</td></tr>
<tr><td><b>Profiler</b></td><td>CPU ถูกใช้ไปกับอะไร — firewall, queue, ethernet หรือ management</td></tr>
</table>
<pre class="code"><span style="color:#5b6b8c"># ตั้งค่าเมลก่อน</span>
/tool e-mail set server=10.10.10.25 port=25 from=rtr-hq@example.co.th

<span style="color:#5b6b8c"># เฝ้าดูลิงก์ ISP — ถ้าล่มให้ส่งเมลแจ้งทันที</span>
/tool netwatch add host=8.8.8.8 interval=30s \\
    down-script="/tool e-mail send to=noc@example.co.th subject=\\"WAN DOWN\\" body=\\"ping 8.8.8.8 ไม่ตอบ\\"" \\
    up-script="/tool e-mail send to=noc@example.co.th subject=\\"WAN UP\\" body=\\"กลับมาแล้ว\\""

/tool netwatch print

<span style="color:#5b6b8c"># ไล่ดูว่าช้าที่ hop ไหน</span>
/tool traceroute 8.8.8.8

<span style="color:#5b6b8c"># CPU หมดไปกับอะไร</span>
/tool profile</pre>
<div class="note"><b>Netwatch คือ automation ที่ถูกที่สุดที่คุณจะได้</b> — นอกจากส่งเมลแล้ว
ยังสั่งให้สลับ route ไปเส้นสำรอง, disable/enable interface หรือรัน script อะไรก็ได้ตอนสถานะเปลี่ยน
ทำ failover ง่าย ๆ ได้โดยไม่ต้องใช้ routing protocol เลย</div>`,
      },
      {
        t: 'Monitoring — Torch, Graphs, SNMP และ The Dude',
        h: `
<table class="tbl">
<tr><th>เครื่องมือ</th><th>ตอบคำถามว่า</th><th>ช่วงเวลา</th></tr>
<tr><td><b>Interface traffic monitor</b></td><td>พอร์ตนี้วิ่งเท่าไหร่</td><td>ตอนนี้</td></tr>
<tr><td><b>Torch</b></td><td><b>ใคร</b>กำลังกินแบนด์วิดท์อยู่</td><td>ตอนนี้</td></tr>
<tr><td><b>Graphs</b></td><td>เมื่อวานตอนบ่ายสามเป็นอย่างไร</td><td>ย้อนหลัง</td></tr>
<tr><td><b>SNMP</b></td><td>ให้ระบบภายนอกดึงตัวเลขไปเก็บเอง</td><td>ต่อเนื่อง</td></tr>
<tr><td><b>The Dude</b></td><td>ทั้งเครือข่ายตอนนี้เป็นอย่างไร มีอะไรแดงบ้าง</td><td>ต่อเนื่อง + แจ้งเตือน</td></tr>
</table>
<pre class="code"><span style="color:#5b6b8c"># ดูปริมาณ traffic ของพอร์ตแบบสด</span>
/interface monitor-traffic ether1

<span style="color:#5b6b8c"># ใครกินแบนด์วิดท์ — เครื่องมือที่ใช้บ่อยที่สุดเวลามีคนโทรมาบอกว่าเน็ตช้า</span>
/tool torch interface=ether1

<span style="color:#5b6b8c"># เก็บกราฟย้อนหลัง แล้วดูผ่านเบราว์เซอร์ที่ http://&lt;router&gt;/graphs/</span>
/tool graphing interface add interface=ether1 allow-address=10.10.99.0/24

<span style="color:#5b6b8c"># เปิด SNMP ให้ระบบ monitoring ภายนอกดึงข้อมูล</span>
/snmp set enabled=yes contact="NOC" location="HQ-Rack1"
/snmp community add name=monitor addresses=10.10.99.0/24 security=none</pre>
<div class="note warn"><b>SNMP community เป็นเหมือนรหัสผ่าน</b> — อย่าใช้ <code>public</code> และต้องจำกัด <code>addresses=</code>
ให้เหลือเฉพาะ IP ของเครื่อง monitoring เท่านั้น ไม่งั้นใครก็ดึงข้อมูลระบบคุณไปได้<br>
<b>The Dude</b> เป็นซอฟต์แวร์ฟรีของ MikroTik ที่รันเป็นแพ็กเกจบน RouterOS ได้ — สแกนหาอุปกรณ์ วาดแผนผังให้เอง และส่งแจ้งเตือนเมื่อมีอะไรล่ม</div>`,
      },
      {
        t: 'ติดต่อ support ให้ได้คำตอบเร็ว',
        h: `
<p>เมื่อสงสัยว่าเป็นบั๊กของ RouterOS จริง ๆ การส่งเมลว่า "เน็ตช้า ช่วยด้วย" จะไม่ได้อะไรกลับมา
สิ่งที่ MikroTik ต้องการคือ <b>supout.rif</b></p>
<table class="tbl">
<tr><th>ไฟล์</th><th>คืออะไร</th></tr>
<tr><td><code>supout.rif</code></td><td>ภาพรวมของเครื่องทั้งหมด — config, log, สถานะ, resource ที่ MikroTik ใช้วิเคราะห์ สร้างจาก WinBox &gt; Make Supout.rif หรือ <code>/system sup-output</code></td></tr>
<tr><td><code>autosupout.rif</code></td><td>ไฟล์ที่ RouterOS สร้าง<b>เอง</b>ตอนเครื่องแครช — ถ้ามีไฟล์นี้อยู่ แปลว่าเคยมีปัญหาร้ายแรงเกิดขึ้น ต้องส่งไปด้วยเสมอ</td></tr>
<tr><td>Supout viewer</td><td>เว็บของ MikroTik ที่เปิดไฟล์ .rif ให้อ่านได้เอง — เปิดดูก่อนส่งจะช่วยให้เห็นปัญหาเองบ่อยครั้ง</td></tr>
</table>
<pre class="code"><span style="color:#5b6b8c"># เปิด debug log เฉพาะหัวข้อที่กำลังสงสัย แล้วปิดทันทีเมื่อเก็บข้อมูลพอ</span>
/system logging add topics=dhcp,debug action=memory
/log print

<span style="color:#5b6b8c"># ส่ง log ออกไปเก็บที่ syslog server จะได้ไม่หายตอน reboot</span>
/system logging action add name=remote-log target=remote remote=10.10.99.60
/system logging add topics=info,error,warning action=remote-log</pre>
<div class="note warn"><b>debug log กินทรัพยากรมาก</b> — บางหัวข้อเขียน log หลายพันบรรทัดต่อวินาที
เปิดเท่าที่ต้องใช้และปิดทันทีเมื่อเสร็จ ไม่งั้นเครื่องจะช้าลงจนกลายเป็นปัญหาใหม่</div>
<p><b>สิ่งที่ช่วยทั้งตัวคุณเองและคนที่มาช่วย</b></p>
<ul>
  <li><b>ใส่ comment ทุกกฎ</b> — <code>/ip firewall filter add ... comment="allow LAN to router"</code> ครึ่งปีให้หลังคุณจะขอบคุณตัวเอง</li>
  <li><b>ตั้งชื่อให้สื่อความหมาย</b> — <code>bridge-LAN</code>, <code>pool-guest</code> ดีกว่า <code>bridge1</code>, <code>pool1</code></li>
  <li><b>มีแผนผังเครือข่าย</b> ที่บอกว่าอะไรต่อกับอะไรด้วย IP อะไร — แนบไปกับคำถามทุกครั้ง</li>
  <li><b>เล่าให้ครบสามข้อ</b>: คาดหวังอะไร · เกิดอะไรขึ้นจริง · เปลี่ยนอะไรไปก่อนหน้านั้น</li>
</ul>`,
      },
    ],

    quiz: [
      { type: 'mcq', q: 'ในย่าน 2.4 GHz ช่องใดที่ไม่ทับซ้อนกัน', opts: ['1, 5, 9', '1, 6, 11', '2, 7, 12', 'ทุกช่องไม่ทับกัน'], a: 1, why: 'ช่องในย่าน 2.4 GHz กว้าง 20 MHz แต่ห่างกันแค่ 5 MHz จึงทับกัน เหลือเพียง 1, 6, 11 ที่แยกกันสนิท — วาง AP หลายตัวต้องสลับสามช่องนี้' },
      { type: 'mcq', q: '802.11ac ใช้ได้ในย่านใด', opts: ['2.4 GHz เท่านั้น', '5 GHz เท่านั้น', 'ทั้งสองย่าน', '6 GHz'], a: 1, why: '802.11ac ออกแบบมาสำหรับ 5 GHz เท่านั้น อุปกรณ์ที่โฆษณาว่า AC dual-band จริง ๆ แล้วใช้ 802.11n ในย่าน 2.4 GHz' },
      { type: 'mcq', q: 'เร่ง TX power ของ AP ให้สูงสุดแล้วเกิดอะไรขึ้น', opts: ['ลิงก์ดีขึ้นเสมอ', 'เครื่องลูกอาจเห็นสัญญาณเต็มแต่ส่งกลับไม่ถึง ทำให้ใช้งานไม่ได้', 'ความเร็วเพิ่มเป็นสองเท่า', 'ไม่มีผลอะไร'], a: 1, why: 'ลิงก์ไร้สายต้องส่งได้ทั้งสองทาง การเร่งฝั่งเดียวทำให้เกิดอาการ "สัญญาณเต็มแต่เน็ตใช้ไม่ได้" ทางแก้ที่ถูกคือเพิ่มจำนวน AP ไม่ใช่เพิ่มกำลังส่ง' },
      { type: 'mcq', q: '<code>access-list</code> กับ <code>connect-list</code> ต่างกันอย่างไร', opts: ['เหมือนกัน', 'access-list ใช้ฝั่ง AP คุมว่าใครเข้ามาได้ ส่วน connect-list ใช้ฝั่ง station คุมว่าจะไปเกาะกับใคร', 'access-list ใช้กับ 5 GHz อย่างเดียว', 'connect-list ใช้แทน security profile ได้'], a: 1, why: 'จำง่าย ๆ ว่า access = "ใครเข้ามาหาเรา" (AP) · connect = "เราไปหาใคร" (station)' },
      { type: 'mcq', q: 'ต้องการทำ whitelist ให้ต่อได้เฉพาะ MAC ที่ลงทะเบียนไว้ ต้องตั้งค่าใด', opts: ['default-authenticate=yes', 'default-authenticate=no', 'default-forward=no', 'mode=none'], a: 1, why: 'ใส่ MAC ใน access-list อย่างเดียวไม่พอ เพราะ default-authenticate=yes ยังปล่อยให้คนที่ไม่อยู่ในตารางต่อได้ ต้องตั้งเป็น no ด้วย' },
      { type: 'mcq', q: 'guest wifi ควรตั้ง <code>default-forward=no</code> เพราะอะไร', opts: ['เพื่อให้เร็วขึ้น', 'เพื่อไม่ให้ client คุยกันเองได้ ป้องกันเครื่องแขกโจมตีกันเอง', 'เพื่อประหยัด IP', 'เพื่อบังคับให้ใช้ 5 GHz'], a: 1, why: 'client isolation ทำให้เครื่องแขกคุยได้แค่กับ gateway ออกเน็ต ไม่เห็นกันเอง — เป็นค่าพื้นฐานที่ guest network ทุกที่ควรตั้ง' },
      { type: 'cmd', q: 'พิมพ์คำสั่งดูว่ามีเครื่องใดเกาะ AP อยู่บ้างตอนนี้', ans: ['/interface wireless registration-table print', 'interface wireless registration-table print'], why: 'registration-table บอก MAC, สัญญาณ, ความเร็วและเวลาที่ต่ออยู่ของทุก client ที่กำลังเกาะ — เป็นที่แรกที่ควรดูเมื่อมีคนบอกว่าไวไฟช้า' },
      { type: 'mcq', q: 'signal-strength ค่าใดถือว่าเริ่มมีปัญหา', opts: ['-45 dBm', '-60 dBm', '-78 dBm', 'ยิ่งติดลบมากยิ่งดี'], a: 2, why: 'ตัวเลขติดลบน้อย = สัญญาณแรงกว่า ดีกว่า -65 dBm ถือว่าดี ส่วนแย่กว่า -75 dBm จะเริ่มถูกลดความเร็วลงและหลุดบ่อย' },
      { type: 'cmd', q: 'พิมพ์คำสั่งดูว่าใครกำลังกินแบนด์วิดท์บน <code>ether1</code> อยู่ตอนนี้', ans: ['/tool torch interface=ether1', 'tool torch interface=ether1'], why: 'Torch แสดง traffic แบบเรียลไทม์แยกตาม src/dst — เครื่องมือที่ใช้บ่อยที่สุดเมื่อมีคนโทรมาบอกว่าเน็ตช้า' },
      { type: 'mcq', q: 'Netwatch ทำอะไรได้บ้าง', opts: ['ping อย่างเดียว', 'เฝ้าดู host แล้วรัน script อัตโนมัติเมื่อสถานะเปลี่ยนจาก up เป็น down หรือกลับกัน', 'วาดกราฟย้อนหลัง', 'สแกนหาอุปกรณ์ในวง'], a: 1, why: 'down-script และ up-script ทำให้ Netwatch เป็น automation ที่ง่ายที่สุดของ RouterOS — ส่งเมล สลับ route หรือ enable/disable interface ได้เอง' },
      { type: 'mcq', q: 'ไฟล์ใดที่ต้องแนบไปกับ support@mikrotik.com เสมอ', opts: ['ไฟล์ backup', 'supout.rif', 'ไฟล์ .rsc', 'ภาพหน้าจอ WinBox'], a: 1, why: 'supout.rif รวม config, log, สถานะและ resource ทั้งหมดไว้ในไฟล์เดียว ถ้ามี autosupout.rif (สร้างตอนเครื่องแครช) ต้องส่งไปด้วย' },
      { type: 'multi', q: 'ข้อใดควรทำเมื่อเปิด SNMP บน router ที่ต่อเน็ตจริง (เลือกทุกข้อที่ถูก)', opts: ['เปลี่ยน community ไม่ให้เป็น public', 'จำกัด addresses= ให้เฉพาะ IP ของเครื่อง monitoring', 'เปิดพอร์ต 161 ให้ทุกคนเข้าถึงได้', 'ปิด SNMP ถ้าไม่ได้ใช้'], a: [0, 1, 3], why: 'community เปรียบเหมือนรหัสผ่านที่ส่งแบบไม่เข้ารหัสใน SNMPv1/v2c จึงต้องจำกัดว่าใครถามได้ — การเปิดให้ทุกคนเข้าถึงเท่ากับแจกข้อมูลระบบทั้งหมดออกไป' },
    ],

    labs: [
      {
        id: 'mtcna-m5',
        title: 'MTCNA Module 5 Lab — ตั้ง Access Point พร้อมความปลอดภัย',
        brief: 'ออฟฟิศต้องการไวไฟใช้งาน คุณต้องสำรวจย่านความถี่ก่อนเลือกช่อง แล้วตั้ง AP พร้อม WPA2 จำกัดให้เฉพาะเครื่องที่ลงทะเบียนต่อได้ และตรวจดูว่าใครเกาะอยู่บ้าง',
        device: 'mikrotik',
        init: { wlan: true },
        tasks: [
          { t: 'ดูรายการ interface wireless ที่มีในเครื่อง', hint: '/interface wireless print', check: (s, h) => said(h, /interface\s+wireless\s+print/i) },
          { t: 'สำรวจว่ารอบตัวมีใครใช้ช่องไหนอยู่', hint: '/interface wireless scan wlan1', check: (s, h) => said(h, /wireless\s+scan/i) },
          { t: 'สร้าง security profile ชื่อ <code>office</code> แบบ WPA2-PSK', hint: '/interface wireless security-profiles add name=office mode=dynamic-keys authentication-types=wpa2-psk wpa2-pre-shared-key=Str0ngWiFiPass', check: s => has(s, 'interface wireless security-profiles', r => r.name === 'office' && /wpa2-psk/i.test(r['authentication-types'] || '')) },
          { t: 'ตั้ง <code>wlan1</code> เป็น AP ชื่อ SSID <code>OFFICE-WIFI</code> ย่าน 2.4 GHz และเปิดใช้งาน', hint: '/interface wireless set 0 mode=ap-bridge band=2ghz-b/g/n ssid=OFFICE-WIFI disabled=no', check: s => has(s, 'interface wireless', r => r.name === 'wlan1' && r.mode === 'ap-bridge' && r.ssid === 'OFFICE-WIFI' && r.disabled !== true) },
          { t: 'ผูก security profile <code>office</code> เข้ากับ <code>wlan1</code>', hint: '/interface wireless set 0 security-profile=office', check: s => has(s, 'interface wireless', r => r.name === 'wlan1' && r['security-profile'] === 'office') },
          { t: 'อนุญาตเครื่อง MAC <code>A4:5E:60:C1:22:01</code> ใน access-list', hint: '/interface wireless access-list add interface=wlan1 mac-address=A4:5E:60:C1:22:01 authentication=yes forwarding=yes', check: s => has(s, 'interface wireless access-list', r => String(r['mac-address']).toUpperCase() === 'A4:5E:60:C1:22:01') },
          { t: 'ปิด <code>default-authenticate</code> เพื่อให้ต่อได้เฉพาะที่อยู่ใน access-list', hint: '/interface wireless set 0 default-authenticate=no', check: s => has(s, 'interface wireless', r => r.name === 'wlan1' && r['default-authenticate'] === 'no') },
          { t: 'เอา <code>wlan1</code> เข้าเป็นสมาชิก bridge — สร้าง <code>bridge1</code> ก่อน', hint: '/interface bridge add name=bridge1', check: s => has(s, 'interface bridge', r => r.name === 'bridge1') },
          { t: 'เพิ่ม <code>wlan1</code> เข้า <code>bridge1</code>', hint: '/interface bridge port add bridge=bridge1 interface=wlan1', check: s => has(s, 'interface bridge port', r => r.bridge === 'bridge1' && r.interface === 'wlan1') },
          { t: 'ดูว่ามีเครื่องใดเกาะอยู่บ้าง', hint: '/interface wireless registration-table print', check: (s, h) => said(h, /registration-table\s+print/i) },
        ],
      },
      {
        id: 'mtcna-m9',
        title: 'MTCNA Module 9 Lab — เฝ้าระวังและเตรียมข้อมูลไว้ให้ support',
        brief: 'หลังส่งมอบระบบ คุณต้องวางระบบเฝ้าระวังให้รู้ก่อนลูกค้าโทรมา — เฝ้าลิงก์ ISP เก็บกราฟ เปิด SNMP ให้ระบบกลางดึงข้อมูล และส่ง log ออกไปเก็บนอกเครื่อง',
        device: 'mikrotik',
        tasks: [
          { t: 'ตั้งค่าเมลของ router ให้ใช้ server <code>10.10.10.25</code>', hint: '/tool e-mail set server=10.10.10.25 from=rtr-hq@example.co.th', check: s => s.settings['tool e-mail'].server === '10.10.10.25' },
          { t: 'ตั้ง Netwatch เฝ้าดู <code>8.8.8.8</code>', hint: '/tool netwatch add host=8.8.8.8 interval=30s', check: s => has(s, 'tool netwatch', r => r.host === '8.8.8.8') },
          { t: 'ดูว่า traffic บน <code>ether1</code> วิ่งเท่าไหร่ตอนนี้', hint: '/interface monitor-traffic ether1', check: (s, h) => said(h, /monitor-traffic/i) },
          { t: 'ดูว่าใครกำลังกินแบนด์วิดท์บน <code>ether1</code>', hint: '/tool torch interface=ether1', check: (s, h) => said(h, /tool\s+torch/i) },
          { t: 'ไล่ดูเส้นทางไปยัง <code>8.8.8.8</code> ว่าช้าที่ hop ไหน', hint: '/tool traceroute 8.8.8.8', check: (s, h) => said(h, /traceroute/i) },
          { t: 'ดูว่า CPU ถูกใช้ไปกับอะไร', hint: '/tool profile', check: (s, h) => said(h, /tool\s+profile/i) },
          { t: 'เปิดเก็บกราฟของ <code>ether1</code>', hint: '/tool graphing interface add interface=ether1 allow-address=10.10.99.0/24', check: s => has(s, 'tool graphing interface', r => r.interface === 'ether1') },
          { t: 'เปิด SNMP และตั้ง community <code>monitor</code> จำกัดวง <code>10.10.99.0/24</code>', hint: '/snmp set enabled=yes → /snmp community add name=monitor addresses=10.10.99.0/24', check: s => s.settings.snmp.enabled === 'yes' && has(s, 'snmp community', r => r.name === 'monitor' && r.addresses === '10.10.99.0/24') },
          { t: 'ส่ง log ออกไปเก็บที่ syslog server <code>10.10.99.60</code>', hint: '/system logging action add name=remote-log target=remote remote=10.10.99.60', check: s => has(s, 'system logging action', r => r.name === 'remote-log' && r.remote === '10.10.99.60') },
          { t: 'อ่าน log ของเครื่องดูว่ามีอะไรผิดปกติ', hint: '/log print', check: (s, h) => said(h, /^\/?log\s+print/i) },
        ],
      },
    ],
  },
};
