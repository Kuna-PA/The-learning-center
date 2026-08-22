export default {
  id: 'cisco-switch',
  name: 'Cisco Switch',
  icon: '🔀',
  device: 'cisco',
  sub: 'Catalyst / IOS CLI',
  desc: 'สวิตช์ Layer 2/3 ของ Cisco — โหมด CLI, VLAN, Trunk, STP, EtherChannel, Inter-VLAN Routing ไปจนถึงการออกแบบ Campus LAN',

  levels: {
    // =========================================================
    1: {
      title: 'รู้จัก Switch และ IOS CLI',
      objectives: [
        'อธิบายหน้าที่ของ switch และความต่างจาก hub / router ได้',
        'เข้าใจ MAC address table และการ forward frame',
        'เข้า-ออกโหมดต่าง ๆ ของ IOS CLI ได้ถูกต้อง',
        'ตั้ง hostname, ดูสถานะพอร์ต และเซฟ config เป็น',
      ],
      sections: [
        {
          t: 'Switch ทำงานอย่างไร',
          h: `
<p><b>Switch</b> ทำงานที่ <b>Layer 2 (Data Link)</b> ของ OSI Model โดยใช้ <b>MAC address</b> ในการตัดสินใจส่ง frame ต่างจาก hub ที่ส่งกระจายทุกพอร์ต และต่างจาก router ที่ใช้ IP address</p>
<p>ขั้นตอนการทำงาน 3 อย่างที่ต้องจำให้ขึ้นใจ:</p>
<ul>
  <li><b>Learning</b> — เมื่อ frame เข้ามา switch จำ <i>source MAC</i> คู่กับพอร์ตที่เข้ามา ลงใน MAC address table</li>
  <li><b>Forwarding</b> — ถ้ารู้ว่า <i>destination MAC</i> อยู่พอร์ตไหน ก็ส่งออกพอร์ตนั้นพอร์ตเดียว (unicast)</li>
  <li><b>Flooding</b> — ถ้ายังไม่รู้ (unknown unicast) หรือเป็น broadcast/multicast จะส่งออกทุกพอร์ตใน VLAN เดียวกัน ยกเว้นพอร์ตต้นทาง</li>
</ul>
<table class="tbl">
<tr><th>อุปกรณ์</th><th>ทำงานที่ Layer</th><th>ใช้อะไรตัดสินใจ</th><th>Collision Domain</th><th>Broadcast Domain</th></tr>
<tr><td>Hub</td><td>1</td><td>ไม่ตัดสินใจ (ทวนสัญญาณ)</td><td>1 domain รวมกัน</td><td>1 domain</td></tr>
<tr><td>Switch</td><td>2</td><td>MAC address</td><td>แยกทุกพอร์ต</td><td>1 domain ต่อ VLAN</td></tr>
<tr><td>Router</td><td>3</td><td>IP address</td><td>แยกทุกพอร์ต</td><td>แยกทุก interface</td></tr>
</table>
<div class="note"><b>จำไว้:</b> switch <b>แยก collision domain</b> แต่ <b>ไม่แยก broadcast domain</b> — การจะแยก broadcast domain ต้องใช้ VLAN (เรียนระดับ 2) หรือ router</div>`,
        },
        {
          t: 'โหมดของ IOS CLI',
          h: `
<p>IOS แบ่งการทำงานเป็นโหมด แต่ละโหมดใช้คำสั่งได้ต่างกัน สังเกตจาก prompt ท้ายบรรทัด</p>
<table class="tbl">
<tr><th>โหมด</th><th>Prompt</th><th>เข้าอย่างไร</th><th>ทำอะไรได้</th></tr>
<tr><td>User EXEC</td><td><code>Switch&gt;</code></td><td>ล็อกอินเข้ามา</td><td>ดูข้อมูลพื้นฐาน, ping</td></tr>
<tr><td>Privileged EXEC</td><td><code>Switch#</code></td><td><code>enable</code></td><td>show ทุกอย่าง, เซฟ config, reload</td></tr>
<tr><td>Global Config</td><td><code>Switch(config)#</code></td><td><code>configure terminal</code></td><td>แก้ค่าทั้งเครื่อง</td></tr>
<tr><td>Interface Config</td><td><code>Switch(config-if)#</code></td><td><code>interface fa0/1</code></td><td>แก้ค่าเฉพาะพอร์ต</td></tr>
<tr><td>VLAN Config</td><td><code>Switch(config-vlan)#</code></td><td><code>vlan 10</code></td><td>ตั้งชื่อ VLAN</td></tr>
</table>
<pre class="code">Switch&gt; enable
Switch# configure terminal
Switch(config)# hostname SW1
SW1(config)# interface FastEthernet0/1
SW1(config-if)# description Link-to-PC1
SW1(config-if)# exit          <span style="color:#5b6b8c">! ถอยขึ้น 1 ระดับ</span>
SW1(config)# end             <span style="color:#5b6b8c">! กลับไป privileged ทันที (= Ctrl+Z)</span>
SW1#</pre>
<div class="note"><b>เทคนิคที่ใช้ทุกวัน</b><br>
• พิมพ์ย่อได้ เช่น <code>conf t</code> = <code>configure terminal</code>, <code>int fa0/1</code> = <code>interface FastEthernet0/1</code><br>
• กด <code>?</code> เพื่อดูคำสั่งที่ใช้ได้ตรงตำแหน่งนั้น<br>
• ใช้ <code>do show ...</code> เพื่อสั่ง show จากใน config mode โดยไม่ต้องออกมา</div>`,
        },
        {
          t: 'คำสั่ง show ที่ต้องใช้ทุกวัน + การเซฟ config',
          h: `
<table class="tbl">
<tr><th>คำสั่ง</th><th>ดูอะไร</th></tr>
<tr><td><code>show running-config</code></td><td>config ที่กำลังทำงานอยู่ใน RAM</td></tr>
<tr><td><code>show startup-config</code></td><td>config ที่เซฟไว้ใน NVRAM (ใช้ตอน boot)</td></tr>
<tr><td><code>show interfaces status</code></td><td>สถานะทุกพอร์ต: connected / notconnect / disabled + VLAN + speed</td></tr>
<tr><td><code>show ip interface brief</code></td><td>สรุป IP และ up/down ของทุก interface</td></tr>
<tr><td><code>show mac address-table</code></td><td>ตาราง MAC ที่เรียนรู้ไว้</td></tr>
<tr><td><code>show version</code></td><td>รุ่น IOS, uptime, serial, จำนวนพอร์ต</td></tr>
</table>
<p><b>สำคัญมาก:</b> config ที่แก้ในโหมด config อยู่ใน RAM เท่านั้น ถ้าไฟดับจะหายหมด ต้องเซฟ:</p>
<pre class="code">SW1# write memory
<span style="color:#5b6b8c">! หรือแบบเต็ม (ความหมายเดียวกัน)</span>
SW1# copy running-config startup-config</pre>
<div class="note warn"><b>สถานะพอร์ตที่ต้องแยกให้ออก</b><br>
<code>connected</code> = มีสายและปลายทาง up<br>
<code>notconnect</code> = ไม่มีสาย / ปลายทางดับ / สายเสีย<br>
<code>disabled</code> = ถูกสั่ง <code>shutdown</code> โดยแอดมิน<br>
<code>err-disabled</code> = ระบบปิดเองเพราะตรวจเจอปัญหา (เช่น port-security violation)</div>`,
        },
      ],
      quiz: [
        { type: 'mcq', q: 'Switch ใช้อะไรในการตัดสินใจส่ง frame ออกพอร์ตไหน?', opts: ['IP address ปลายทาง', 'MAC address ปลายทาง', 'Port number ของ TCP', 'ชื่อ hostname ของปลายทาง'], a: 1, why: 'Switch ทำงาน Layer 2 จึงใช้ destination MAC address เทียบกับ MAC address table ส่วน IP address เป็นงานของ router (Layer 3)' },
        { type: 'mcq', q: 'เมื่อ switch ได้รับ frame ที่ปลายทางเป็น MAC ที่ยังไม่มีในตาราง จะทำอย่างไร?', opts: ['ทิ้ง frame ทันที', 'ส่งกลับไปที่ต้นทาง', 'Flood ออกทุกพอร์ตใน VLAN เดียวกัน ยกเว้นพอร์ตต้นทาง', 'ส่งให้ router จัดการ'], a: 2, why: 'เรียกว่า unknown unicast flooding — switch จะกระจายออกทุกพอร์ตใน broadcast domain เดียวกัน แล้วเรียนรู้จาก reply ที่กลับมา' },
        { type: 'mcq', q: 'ข้อใดถูกต้องเกี่ยวกับ collision domain และ broadcast domain ของ switch?', opts: ['แยกทั้ง collision และ broadcast domain ทุกพอร์ต', 'แยก collision domain ทุกพอร์ต แต่ broadcast domain เดียวกันทั้งเครื่อง (ถ้าไม่มี VLAN)', 'ไม่แยกทั้งคู่', 'แยก broadcast domain แต่ไม่แยก collision domain'], a: 1, why: 'ทุกพอร์ตของ switch เป็น collision domain ของตัวเอง แต่ broadcast ยังกระจายทั้งเครื่อง จนกว่าจะแบ่งด้วย VLAN' },
        { type: 'cmd', q: 'พิมพ์คำสั่งเพื่อเข้าสู่ Global Configuration Mode จาก privileged mode', ans: ['configure terminal', 'conf t', 'config t', 'config terminal', 'conf term'], why: 'configure terminal (ย่อได้ conf t) — prompt จะเปลี่ยนเป็น Switch(config)#' },
        { type: 'cmd', q: 'พิมพ์คำสั่งเพื่อบันทึก config จาก RAM ลง NVRAM (เขียนได้ทั้งแบบสั้นและแบบเต็ม)', ans: ['write memory', 'wr', 'write', 'wr mem', 'copy running-config startup-config', 'copy run start'], why: 'write memory หรือ copy running-config startup-config — ถ้าไม่เซฟ config จะหายเมื่อ reboot' },
        { type: 'mcq', q: 'พอร์ตแสดงสถานะ <code>disabled</code> ใน show interfaces status หมายถึงอะไร?', opts: ['สายขาด', 'ปลายทางปิดเครื่อง', 'ถูกสั่ง shutdown โดยแอดมิน', 'ความเร็วไม่ตรงกัน'], a: 2, why: 'disabled = administratively down คือมีคำสั่ง shutdown อยู่ที่พอร์ต แก้โดยเข้า interface แล้วสั่ง no shutdown' },
        { type: 'multi', q: 'ข้อใดคือคำสั่งที่ใช้ดูข้อมูลได้ (เลือกทุกข้อที่ถูก)', opts: ['show running-config', 'show interfaces status', 'hostname SW1', 'show mac address-table'], a: [0, 1, 3], why: 'hostname เป็นคำสั่ง configuration ไม่ใช่คำสั่ง show — ต้องอยู่ใน global config mode' },
      ],
      labs: [{
        id: 'l1-basic',
        title: 'Lab 1 — ตั้งค่าพื้นฐาน Switch ใหม่แกะกล่อง',
        brief: 'สวิตช์ตัวใหม่เพิ่งถูกนำมาติดตั้งที่ชั้น 3 คุณได้รับมอบหมายให้ตั้งค่าเบื้องต้นและตรวจสอบสถานะพอร์ต',
        device: 'cisco',
        tasks: [
          { t: 'เข้าสู่ privileged EXEC mode', hint: 'enable', check: s => s.mode !== 'user' },
          { t: 'ตั้ง hostname เป็น <code>SW-FL3</code>', hint: 'configure terminal → hostname SW-FL3', check: s => s.hostname === 'SW-FL3' },
          { t: 'ใส่ description ที่พอร์ต Fa0/1 ว่า <code>Uplink-to-Core</code>', hint: 'interface fa0/1 → description Uplink-to-Core', check: s => s.ifaces['FastEthernet0/1'].desc === 'Uplink-to-Core' },
          { t: 'ปิดพอร์ต Fa0/24 ที่ยังไม่ได้ใช้งาน (shutdown)', hint: 'interface fa0/24 → shutdown', check: s => s.ifaces['FastEthernet0/24'].shutdown === true },
          { t: 'เรียกดูสถานะพอร์ตทั้งหมด', hint: 'do show interfaces status', check: (s, h) => h.some(c => /^(do\s+)?sh(ow)?\s+int\w*\s+st/i.test(c.trim())) },
          { t: 'บันทึก config ลง NVRAM', hint: 'end → write memory', check: s => !!s.savedConfig },
        ],
      }],
    },

    // =========================================================
    2: {
      title: 'VLAN, Access Port และ Trunk 802.1Q',
      objectives: [
        'อธิบายเหตุผลที่ต้องแบ่ง VLAN และผลต่อ broadcast domain',
        'สร้าง VLAN และกำหนด access port ให้ถูก VLAN',
        'ตั้งค่า trunk 802.1Q พร้อมเข้าใจ native VLAN และ allowed VLAN',
        'ตั้ง management IP ด้วย SVI และ default-gateway',
      ],
      sections: [
        {
          t: 'VLAN คืออะไร และทำไมต้องใช้',
          h: `
<p><b>VLAN (Virtual LAN)</b> คือการแบ่ง switch หนึ่งตัวออกเป็นหลาย broadcast domain แบบ logical เครื่องที่อยู่คนละ VLAN จะคุยกันตรง ๆ ไม่ได้ ต้องผ่าน router หรือ Layer 3 switch</p>
<ul>
  <li><b>ลด broadcast</b> — broadcast วิ่งอยู่แค่ใน VLAN ของตัวเอง</li>
  <li><b>ความปลอดภัย</b> — แยกวง Server / Office / Guest / CCTV ออกจากกัน</li>
  <li><b>จัดการง่าย</b> — ย้ายคนข้ามชั้นได้โดยไม่ต้องเปลี่ยน IP scheme</li>
</ul>
<table class="tbl">
<tr><th>ช่วง VLAN ID</th><th>ชื่อเรียก</th><th>หมายเหตุ</th></tr>
<tr><td>1</td><td>Default VLAN</td><td>ทุกพอร์ตอยู่ VLAN 1 ตั้งแต่แรก ลบไม่ได้ — ไม่ควรใช้งานจริงเพื่อความปลอดภัย</td></tr>
<tr><td>2–1001</td><td>Normal Range</td><td>ใช้งานทั่วไป เก็บใน vlan.dat</td></tr>
<tr><td>1002–1005</td><td>สงวนไว้</td><td>FDDI / Token Ring (ตกยุคแล้ว) ลบไม่ได้</td></tr>
<tr><td>1006–4094</td><td>Extended Range</td><td>ต้องอยู่โหมด VTP transparent (บนอุปกรณ์เก่า)</td></tr>
</table>
<pre class="code">SW1(config)# vlan 10
SW1(config-vlan)# name SALES
SW1(config-vlan)# exit
SW1(config)# vlan 20
SW1(config-vlan)# name IT
SW1(config-vlan)# exit
SW1# show vlan brief</pre>`,
        },
        {
          t: 'Access Port vs Trunk Port',
          h: `
<p><b>Access port</b> = พอร์ตที่ต่อกับอุปกรณ์ปลายทาง (PC, printer, กล้อง, AP) รับ-ส่ง frame ของ <b>VLAN เดียว</b> และไม่มี tag</p>
<p><b>Trunk port</b> = พอร์ตที่ต่อระหว่าง switch กับ switch (หรือ switch กับ router/firewall) ส่งได้ <b>หลาย VLAN</b> โดยใส่ <b>802.1Q tag</b> ขนาด 4 ไบต์ลงในแต่ละ frame</p>
<pre class="code"><span style="color:#5b6b8c">! --- Access port ---</span>
SW1(config)# interface range fa0/1 - 8
SW1(config-if-range)# switchport mode access
SW1(config-if-range)# switchport access vlan 10
SW1(config-if-range)# spanning-tree portfast

<span style="color:#5b6b8c">! --- Trunk port ---</span>
SW1(config)# interface gi0/1
SW1(config-if)# switchport trunk encapsulation dot1q   <span style="color:#5b6b8c">! บางรุ่นเท่านั้น</span>
SW1(config-if)# switchport mode trunk
SW1(config-if)# switchport trunk native vlan 999
SW1(config-if)# switchport trunk allowed vlan 10,20,30</pre>
<div class="note warn"><b>Native VLAN — จุดพลาดยอดฮิต</b><br>
Frame ของ native VLAN จะวิ่งบน trunk <b>โดยไม่มี tag</b> ถ้าสองฝั่งตั้ง native VLAN ไม่ตรงกัน traffic จะรั่วข้าม VLAN (VLAN hopping) และ CDP จะแจ้ง <i>Native VLAN mismatch</i><br>
แนวปฏิบัติที่ดี: ตั้ง native VLAN เป็น VLAN ที่ไม่ได้ใช้งานจริง (เช่น 999) และตั้งให้ตรงกันทั้งสองฝั่ง</div>
<div class="note"><b>allowed vlan</b> — ถ้าไม่ระบุ trunk จะยอมให้ทุก VLAN ผ่าน (1–4094) การจำกัดเฉพาะ VLAN ที่ใช้จริงช่วยลด broadcast และเพิ่มความปลอดภัย</div>`,
        },
        {
          t: 'Management IP ด้วย SVI',
          h: `
<p>สวิตช์ Layer 2 ไม่มี IP ที่พอร์ตกายภาพ แต่ตั้ง IP ไว้ที่ <b>SVI (Switch Virtual Interface)</b> เพื่อให้ remote เข้ามาจัดการได้</p>
<pre class="code">SW1(config)# vlan 99
SW1(config-vlan)# name MGMT
SW1(config-vlan)# exit
SW1(config)# interface vlan 99
SW1(config-if)# ip address 192.168.99.10 255.255.255.0
SW1(config-if)# no shutdown
SW1(config-if)# exit
SW1(config)# ip default-gateway 192.168.99.1</pre>
<div class="note"><b>ทำไมต้องมี ip default-gateway?</b><br>
สวิตช์ L2 ไม่ได้ทำ routing เอง ถ้าต้องการให้ผู้ดูแลจาก subnet อื่น SSH เข้ามาได้ ต้องบอกว่าจะส่ง packet ขาออกไปที่ไหน — ถ้าเป็น L3 switch ที่เปิด <code>ip routing</code> จะใช้ <code>ip route</code> แทน</div>
<p>ตรวจผลด้วย <code>show ip interface brief</code> — SVI จะ up ก็ต่อเมื่อมีพอร์ต access ของ VLAN นั้น (หรือ trunk ที่ยอมให้ VLAN นั้นผ่าน) อยู่ในสถานะ up อย่างน้อยหนึ่งพอร์ต</p>`,
        },
      ],
      quiz: [
        { type: 'mcq', q: 'ผลของการแบ่ง VLAN บน switch คืออะไร?', opts: ['เพิ่มความเร็วของพอร์ต', 'แยก broadcast domain ออกจากกัน', 'ลดจำนวน collision domain', 'ทำให้ MAC table ใหญ่ขึ้น'], a: 1, why: 'แต่ละ VLAN = 1 broadcast domain การข้าม VLAN ต้องผ่านอุปกรณ์ Layer 3' },
        { type: 'cmd', q: 'พิมพ์คำสั่ง (ในโหมด interface) เพื่อกำหนดให้พอร์ตนี้เป็น access port ของ VLAN 30', ans: ['switchport access vlan 30', 'sw access vlan 30', 'switchport access vlan30'], why: 'ควรสั่ง switchport mode access ก่อนด้วย เพื่อไม่ให้พอร์ตต่อรองเป็น trunk เอง (DTP)' },
        { type: 'mcq', q: 'Trunk port ใช้มาตรฐานใดในการ tag VLAN บนอุปกรณ์ยุคปัจจุบัน?', opts: ['ISL', '802.1Q (dot1q)', '802.3af', '802.1X'], a: 1, why: '802.1Q เป็นมาตรฐานเปิด แทรก tag 4 ไบต์ใน Ethernet frame ส่วน ISL เป็นของ Cisco ที่เลิกใช้แล้ว' },
        { type: 'mcq', q: 'Frame ที่อยู่ใน native VLAN เมื่อวิ่งผ่าน trunk จะเป็นอย่างไร?', opts: ['ถูก tag เหมือน VLAN อื่น', 'ไม่ถูก tag (untagged)', 'ถูกทิ้ง', 'ถูกส่งซ้ำสองครั้ง'], a: 1, why: 'native VLAN วิ่งแบบ untagged จึงต้องตั้งให้ตรงกันทั้งสองฝั่ง มิฉะนั้นจะเกิด VLAN leaking' },
        { type: 'mcq', q: 'ตั้ง IP ให้ switch Layer 2 เพื่อ remote management ต้องตั้งที่ไหน?', opts: ['ที่พอร์ต FastEthernet0/1 โดยตรง', 'ที่ interface VLAN (SVI)', 'ที่ console port', 'ตั้งไม่ได้ ต้องใช้ console อย่างเดียว'], a: 1, why: 'สวิตช์ L2 ตั้ง IP ที่ SVI เช่น interface vlan 99 แล้วต้องมี ip default-gateway เพื่อคุยข้าม subnet' },
        { type: 'cmd', q: 'พิมพ์คำสั่งดูรายชื่อ VLAN ทั้งหมดแบบย่อ พร้อมพอร์ตที่อยู่ในแต่ละ VLAN', ans: ['show vlan brief', 'sh vlan brief', 'show vlan'], why: 'show vlan brief แสดง ID, ชื่อ, สถานะ และพอร์ต access ของแต่ละ VLAN (พอร์ต trunk จะไม่ขึ้นในตารางนี้)' },
        { type: 'multi', q: 'ข้อใดคือแนวปฏิบัติที่ดีของการตั้ง trunk (เลือกทุกข้อที่ถูก)', opts: ['ตั้ง native VLAN ให้ตรงกันทั้งสองฝั่ง', 'ปล่อยให้ allowed vlan เป็น 1-4094 เสมอ', 'จำกัด allowed vlan เฉพาะ VLAN ที่ใช้จริง', 'ตั้งเป็น switchport mode trunk แทนการปล่อยให้ DTP ต่อรองเอง'], a: [0, 2, 3], why: 'การจำกัด allowed VLAN ลด broadcast และลดความเสี่ยง ส่วนการตั้ง mode trunk ตรง ๆ ป้องกันการโดน DTP attack' },
        { type: 'mcq', q: 'พอร์ต Fa0/5 อยู่ VLAN 10 และ Fa0/6 อยู่ VLAN 20 บน switch ตัวเดียวกัน PC สองเครื่องที่ต่ออยู่จะ ping กันได้หรือไม่?', opts: ['ได้ เพราะอยู่ switch เดียวกัน', 'ไม่ได้ ต้องมีอุปกรณ์ Layer 3 ทำ inter-VLAN routing', 'ได้ ถ้าตั้ง IP เป็น subnet เดียวกัน', 'ได้ ถ้าเปิด portfast'], a: 1, why: 'คนละ VLAN = คนละ broadcast domain แม้จะตั้ง IP subnet เดียวกันก็คุยกันไม่ได้ ต้องผ่าน router-on-a-stick หรือ SVI บน L3 switch' },
      ],
      labs: [{
        id: 'l2-vlan',
        title: 'Lab 2 — แบ่ง VLAN และเชื่อม Trunk',
        brief: 'ออฟฟิศชั้น 3 ต้องการแยกวง Sales (VLAN 10) ออกจาก IT (VLAN 20) และมีวง MGMT (VLAN 99) สำหรับ remote เข้าสวิตช์ พอร์ต Gi0/1 เป็น uplink ไป core switch',
        device: 'cisco',
        tasks: [
          { t: 'สร้าง VLAN 10 ชื่อ <code>SALES</code>', hint: 'enable → configure terminal → vlan 10 → name SALES', check: s => s.vlans[10] && s.vlans[10].name.toUpperCase() === 'SALES' },
          { t: 'สร้าง VLAN 20 ชื่อ <code>IT</code>', hint: 'vlan 20 → name IT', check: s => s.vlans[20] && s.vlans[20].name.toUpperCase() === 'IT' },
          { t: 'สร้าง VLAN 99 ชื่อ <code>MGMT</code>', hint: 'vlan 99 → name MGMT', check: s => s.vlans[99] && s.vlans[99].name.toUpperCase() === 'MGMT' },
          {
            t: 'ตั้ง Fa0/1 ถึง Fa0/4 เป็น access port ของ VLAN 10', hint: 'interface range fa0/1 - 4 → switchport mode access → switchport access vlan 10',
            check: s => [1, 2, 3, 4].every(i => { const p = s.ifaces['FastEthernet0/' + i]; return p.swMode === 'access' && p.accessVlan === 10; })
          },
          {
            t: 'ตั้ง Fa0/5 ถึง Fa0/8 เป็น access port ของ VLAN 20', hint: 'interface range fa0/5 - 8 → switchport mode access → switchport access vlan 20',
            check: s => [5, 6, 7, 8].every(i => { const p = s.ifaces['FastEthernet0/' + i]; return p.swMode === 'access' && p.accessVlan === 20; })
          },
          {
            t: 'ตั้ง Gi0/1 เป็น trunk, native vlan 999, allowed vlan 10,20,99', hint: 'interface gi0/1 → switchport mode trunk → switchport trunk native vlan 999 → switchport trunk allowed vlan 10,20,99',
            check: s => { const p = s.ifaces['GigabitEthernet0/1']; return p.swMode === 'trunk' && p.nativeVlan === 999 && /10/.test(p.allowed || '') && /20/.test(p.allowed || '') && /99/.test(p.allowed || ''); }
          },
          {
            t: 'ตั้ง IP ให้ SVI VLAN 99 เป็น <code>192.168.99.10/24</code> และเปิดใช้งาน', hint: 'interface vlan 99 → ip address 192.168.99.10 255.255.255.0 → no shutdown',
            check: s => s.svis[99] && s.svis[99].ip === '192.168.99.10' && s.svis[99].mask === '255.255.255.0' && !s.svis[99].shutdown
          },
          { t: 'ตั้ง default gateway เป็น <code>192.168.99.1</code>', hint: 'ip default-gateway 192.168.99.1', check: s => s.defaultGw === '192.168.99.1' },
        ],
      }],
    },

    // =========================================================
    3: {
      title: 'Spanning Tree, EtherChannel และ Port Security',
      objectives: [
        'อธิบายปัญหา Layer 2 loop และวิธีที่ STP ป้องกัน',
        'คำนวณ/บังคับ root bridge และอ่าน port role ได้',
        'ตั้ง PortFast + BPDU Guard อย่างถูกที่',
        'รวมลิงก์ด้วย EtherChannel (LACP) และป้องกันพอร์ตด้วย Port Security',
      ],
      sections: [
        {
          t: 'Spanning Tree Protocol (STP)',
          h: `
<p>ถ้าเดินสายเป็นวงระหว่าง switch โดยไม่มี STP จะเกิด <b>broadcast storm</b> — frame วนไม่รู้จบจน CPU และลิงก์ตัน ระบบล่มทั้งวง (Layer 2 ไม่มี TTL เหมือน IP)</p>
<p>STP แก้โดยเลือก <b>Root Bridge</b> แล้วบล็อกพอร์ตส่วนเกินให้เหลือเส้นทางเดียว</p>
<p><b>ขั้นตอนการเลือก:</b></p>
<ul>
  <li><b>Root Bridge</b> = ตัวที่มี Bridge ID ต่ำสุด (Bridge ID = Priority + MAC) ค่า priority ปริยาย 32768 ต้องปรับเป็นทวีคูณของ 4096</li>
  <li><b>Root Port</b> — พอร์ตของ non-root แต่ละตัวที่มี path cost ไป root ต่ำสุด (มี 1 พอร์ตต่อ switch)</li>
  <li><b>Designated Port</b> — พอร์ตที่ทำหน้าที่ส่งต่อในแต่ละ segment</li>
  <li><b>Blocking / Alternate Port</b> — พอร์ตที่เหลือ ถูกปิด logical เพื่อตัด loop</li>
</ul>
<table class="tbl">
<tr><th>ชนิด</th><th>มาตรฐาน</th><th>เวลา converge</th><th>หมายเหตุ</th></tr>
<tr><td>STP</td><td>802.1D</td><td>30–50 วินาที</td><td>ช้าเกินสำหรับงานปัจจุบัน</td></tr>
<tr><td>PVST+</td><td>Cisco</td><td>30–50 วินาที</td><td>1 instance ต่อ VLAN</td></tr>
<tr><td>Rapid PVST+</td><td>802.1w + Cisco</td><td>&lt; 6 วินาที</td><td><b>แนะนำ</b> ใช้เป็นค่ามาตรฐาน</td></tr>
<tr><td>MST</td><td>802.1s</td><td>เร็ว</td><td>รวมหลาย VLAN ไว้ใน instance เดียว เหมาะกับ VLAN เยอะมาก</td></tr>
</table>
<pre class="code">SW1(config)# spanning-tree mode rapid-pvst
SW1(config)# spanning-tree vlan 10,20 priority 4096   <span style="color:#5b6b8c">! บังคับให้เป็น root</span>
SW1# show spanning-tree vlan 10</pre>`,
        },
        {
          t: 'PortFast, BPDU Guard และ Port Security',
          h: `
<p><b>PortFast</b> — ให้พอร์ตข้ามสถานะ listening/learning ขึ้น forwarding ทันที ใช้กับ <b>access port ที่ต่อ end device เท่านั้น</b> (PC, กล้อง, printer) ห้ามใช้กับพอร์ตที่ต่อ switch</p>
<p><b>BPDU Guard</b> — ถ้าพอร์ตที่เปิด PortFast ได้รับ BPDU (แปลว่ามีคนเอา switch มาเสียบ) จะสั่ง err-disable ทันที เป็นการป้องกัน loop และ rogue switch</p>
<pre class="code">SW1(config)# interface range fa0/1 - 20
SW1(config-if-range)# switchport mode access
SW1(config-if-range)# spanning-tree portfast
SW1(config-if-range)# spanning-tree bpduguard enable</pre>
<p><b>Port Security</b> — จำกัดจำนวน/ระบุ MAC ที่อนุญาตให้ใช้พอร์ต ป้องกันคนแอบเอา hub หรือ AP มาเสียบ</p>
<table class="tbl">
<tr><th>Violation mode</th><th>ทิ้ง traffic</th><th>ส่ง syslog/SNMP</th><th>ปิดพอร์ต</th></tr>
<tr><td><code>protect</code></td><td>✔</td><td>✘</td><td>✘</td></tr>
<tr><td><code>restrict</code></td><td>✔</td><td>✔</td><td>✘</td></tr>
<tr><td><code>shutdown</code> (ค่าปริยาย)</td><td>✔</td><td>✔</td><td>✔ err-disabled</td></tr>
</table>
<pre class="code">SW1(config-if)# switchport mode access
SW1(config-if)# switchport port-security
SW1(config-if)# switchport port-security maximum 2
SW1(config-if)# switchport port-security violation restrict
SW1(config-if)# switchport port-security mac-address sticky</pre>
<div class="note warn">Port Security ตั้งได้เฉพาะ <b>access port</b> หรือ trunk แบบ static เท่านั้น ถ้าพอร์ตยังเป็น dynamic (DTP) จะถูกปฏิเสธด้วยข้อความ <i>Command rejected: ... is not an access port</i></div>`,
        },
        {
          t: 'EtherChannel — รวมลิงก์',
          h: `
<p>รวมพอร์ตกายภาพหลายเส้นให้เป็นลิงก์ logical เส้นเดียว เพิ่มแบนด์วิดท์และมี redundancy โดย STP มองเห็นเป็นลิงก์เดียวจึงไม่บล็อก</p>
<table class="tbl">
<tr><th>Protocol</th><th>โหมด</th><th>คำอธิบาย</th></tr>
<tr><td rowspan="2">LACP (802.3ad) — มาตรฐาน</td><td><code>active</code></td><td>ส่งคำขอเจรจา</td></tr>
<tr><td><code>passive</code></td><td>รอฝั่งตรงข้ามขอมา</td></tr>
<tr><td rowspan="2">PAgP (Cisco)</td><td><code>desirable</code></td><td>ส่งคำขอเจรจา</td></tr>
<tr><td><code>auto</code></td><td>รอฝั่งตรงข้าม</td></tr>
<tr><td>Static</td><td><code>on</code></td><td>ไม่เจรจา ต้องตั้ง on ทั้งสองฝั่ง เสี่ยง loop ถ้าตั้งผิด</td></tr>
</table>
<div class="note"><b>คู่ที่จับกันติด:</b> active+active, active+passive, desirable+desirable, desirable+auto, on+on<br>
<b>คู่ที่ไม่ติด:</b> passive+passive, auto+auto (ไม่มีใครเริ่มเจรจา), และห้ามผสม LACP กับ PAgP</div>
<pre class="code">SW1(config)# interface range gi0/1 - 2
SW1(config-if-range)# channel-group 1 mode active
SW1(config-if-range)# exit
SW1(config)# interface port-channel 1
SW1(config-if)# switchport mode trunk
SW1# show etherchannel summary</pre>
<div class="note warn">ทุกพอร์ตในกลุ่มต้องมี <b>speed / duplex / mode (access หรือ trunk) / allowed VLAN</b> เหมือนกันทั้งหมด ไม่งั้นพอร์ตจะไม่เข้ากลุ่ม (suspended)</div>`,
        },
      ],
      quiz: [
        { type: 'mcq', q: 'อะไรจะเกิดขึ้นถ้ามี Layer 2 loop โดยไม่มี STP?', opts: ['Packet ถูกทิ้งเมื่อ TTL หมด', 'เกิด broadcast storm และ MAC table ไม่นิ่ง จน network ล่ม', 'Switch จะปิดพอร์ตเองอัตโนมัติ', 'ความเร็วลดลงเล็กน้อยเท่านั้น'], a: 1, why: 'Ethernet frame ไม่มี TTL จึงวนไม่รู้จบ ทำให้เกิด broadcast storm + MAC flapping + duplicate frame' },
        { type: 'mcq', q: 'Root Bridge ถูกเลือกจากอะไร?', opts: ['พอร์ตเยอะที่สุด', 'Bridge ID (priority + MAC) ที่ต่ำที่สุด', 'IP address ต่ำสุด', 'อุปกรณ์ที่บูตขึ้นก่อน'], a: 1, why: 'เทียบ priority ก่อน ถ้าเท่ากันจึงเทียบ MAC address ที่ต่ำกว่าชนะ — priority ปริยาย 32768 และต้องปรับเป็นทวีคูณของ 4096' },
        { type: 'cmd', q: 'พิมพ์คำสั่ง global config เพื่อเปลี่ยนโหมด spanning tree เป็น Rapid PVST+', ans: ['spanning-tree mode rapid-pvst', 'spanning tree mode rapid-pvst', 'spanning-tree mode rapid pvst'], why: 'Rapid PVST+ (802.1w) converge ต่ำกว่า 6 วินาที เทียบกับ PVST+ เดิมที่ 30-50 วินาที' },
        { type: 'mcq', q: 'ควรเปิด PortFast ที่พอร์ตแบบใด?', opts: ['พอร์ต trunk ที่ต่อ switch ตัวอื่น', 'access port ที่ต่อ PC หรือ end device', 'ทุกพอร์ตเพื่อความเร็ว', 'พอร์ตที่ต่อ router เท่านั้น'], a: 1, why: 'PortFast บนพอร์ตที่ต่อ switch จะข้ามการตรวจ loop ทำให้เกิด temporary loop ได้ — ควรคู่กับ BPDU Guard เสมอ' },
        { type: 'mcq', q: 'Port Security แบบ violation mode ใดที่ทิ้ง traffic + แจ้ง log แต่ไม่ปิดพอร์ต?', opts: ['protect', 'restrict', 'shutdown', 'err-disable'], a: 1, why: 'protect = ทิ้งเงียบ ๆ, restrict = ทิ้ง + log/SNMP counter, shutdown (ค่าปริยาย) = err-disable ปิดพอร์ตเลย' },
        { type: 'mcq', q: 'คู่โหมด EtherChannel ใดที่ <b>จับกันไม่ติด</b>?', opts: ['active + passive', 'active + active', 'passive + passive', 'desirable + auto'], a: 2, why: 'passive รอฝ่ายตรงข้ามเริ่มเจรจา ถ้าทั้งคู่ passive จะไม่มีใครเริ่ม เช่นเดียวกับ auto + auto' },
        { type: 'cmd', q: 'พิมพ์คำสั่งในโหมด interface เพื่อเพิ่มพอร์ตเข้า EtherChannel กลุ่ม 1 ด้วย LACP แบบเริ่มเจรจาเอง', ans: ['channel-group 1 mode active'], why: 'mode active = LACP ที่ส่ง LACP packet ออกไปเจรจา หากใช้ mode on จะเป็น static ไม่มีการตรวจสอบ' },
        { type: 'multi', q: 'ข้อกำหนดที่พอร์ตทุกเส้นใน EtherChannel ต้องเหมือนกัน (เลือกทุกข้อที่ถูก)', opts: ['Speed และ Duplex', 'Switchport mode (access/trunk)', 'ยี่ห้อสายแลน', 'Allowed VLAN list บน trunk'], a: [0, 1, 3], why: 'ถ้าค่าไม่ตรงกัน พอร์ตจะเข้าสถานะ suspended และไม่ถูกรวมเข้า port-channel' },
      ],
      labs: [{
        id: 'l3-stp-po',
        title: 'Lab 3 — บังคับ Root Bridge, ป้องกันพอร์ต และรวมลิงก์',
        brief: 'สวิตช์ตัวนี้จะทำหน้าที่เป็น distribution switch ต้องเป็น root bridge ของ VLAN 10 และ 20, ป้องกันพอร์ตผู้ใช้ และรวม Gi0/1-2 เป็น EtherChannel ไป core',
        device: 'cisco',
        tasks: [
          { t: 'เปลี่ยนโหมด spanning tree เป็น <code>rapid-pvst</code>', hint: 'enable → configure terminal → spanning-tree mode rapid-pvst', check: s => s.stpMode === 'rapid-pvst' },
          { t: 'สร้าง VLAN 10 และ VLAN 20', hint: 'vlan 10 → exit → vlan 20', check: s => !!s.vlans[10] && !!s.vlans[20] },
          { t: 'ตั้ง priority ของ VLAN 10 และ 20 เป็น <code>4096</code> เพื่อบังคับเป็น root', hint: 'spanning-tree vlan 10,20 priority 4096', check: s => s.stpPriority[10] === 4096 && s.stpPriority[20] === 4096 },
          {
            t: 'ที่พอร์ต Fa0/1-4: ตั้งเป็น access, เปิด <code>portfast</code> และ <code>bpduguard</code>', hint: 'interface range fa0/1 - 4 → switchport mode access → spanning-tree portfast → spanning-tree bpduguard enable',
            check: s => [1, 2, 3, 4].every(i => { const p = s.ifaces['FastEthernet0/' + i]; return p.swMode === 'access' && p.portfast && p.bpduguard; })
          },
          {
            t: 'ที่พอร์ต Fa0/1: เปิด port-security, maximum 2, violation restrict, sticky', hint: 'interface fa0/1 → switchport port-security → switchport port-security maximum 2 → switchport port-security violation restrict → switchport port-security mac-address sticky',
            check: s => { const p = s.ifaces['FastEthernet0/1'].psec; return p && p.max === 2 && p.violation === 'restrict' && p.sticky; }
          },
          {
            t: 'รวม Gi0/1 และ Gi0/2 เข้า channel-group 1 ด้วย LACP mode active', hint: 'interface range gi0/1 - 2 → channel-group 1 mode active',
            check: s => ['GigabitEthernet0/1', 'GigabitEthernet0/2'].every(n => s.ifaces[n].channel && s.ifaces[n].channel.group === 1 && s.ifaces[n].channel.mode === 'active')
          },
          { t: 'ตั้ง Port-channel1 ให้เป็น trunk', hint: 'interface port-channel 1 → switchport mode trunk', check: s => s.ifaces['Port-channel1'] && s.ifaces['Port-channel1'].swMode === 'trunk' },
        ],
      }],
    },

    // =========================================================
    4: {
      title: 'Inter-VLAN Routing, DHCP Snooping และการไล่ปัญหา',
      objectives: [
        'เลือกและตั้งค่า inter-VLAN routing ได้ทั้งแบบ router-on-a-stick และ L3 switch',
        'ป้องกัน DHCP rogue ด้วย DHCP Snooping และ DAI',
        'ใช้ SPAN จับ traffic เพื่อวิเคราะห์',
        'ไล่ปัญหาแบบเป็นระบบด้วย show command ที่ถูกตัว',
      ],
      sections: [
        {
          t: 'Inter-VLAN Routing 3 แบบ',
          h: `
<table class="tbl">
<tr><th>วิธี</th><th>เหมาะกับ</th><th>ข้อจำกัด</th></tr>
<tr><td>Legacy (1 พอร์ต 1 VLAN)</td><td>ห้องแล็บ / VLAN น้อยมาก</td><td>เปลืองพอร์ตทั้งฝั่ง router และ switch</td></tr>
<tr><td>Router-on-a-Stick (sub-interface)</td><td>สาขาเล็ก, VLAN ไม่เกิน ~10</td><td>ทุก traffic ข้าม VLAN วิ่งผ่านลิงก์เดียว เป็นคอขวด</td></tr>
<tr><td>Layer 3 Switch (SVI + ip routing)</td><td>Campus / องค์กร</td><td>ต้องใช้สวิตช์ที่รองรับ L3 (routing ทำใน ASIC จึงเร็วมาก)</td></tr>
</table>
<p><b>แบบ Router-on-a-Stick</b> (ฝั่ง router):</p>
<pre class="code">R1(config)# interface gi0/0
R1(config-if)# no shutdown
R1(config)# interface gi0/0.10
R1(config-subif)# encapsulation dot1Q 10
R1(config-subif)# ip address 192.168.10.1 255.255.255.0
R1(config)# interface gi0/0.20
R1(config-subif)# encapsulation dot1Q 20
R1(config-subif)# ip address 192.168.20.1 255.255.255.0</pre>
<p><b>แบบ Layer 3 Switch</b> — เร็วกว่าและใช้จริงในองค์กร:</p>
<pre class="code">SW-L3(config)# ip routing                  <span style="color:#5b6b8c">! สำคัญ ถ้าลืมจะไม่ route</span>
SW-L3(config)# interface vlan 10
SW-L3(config-if)# ip address 192.168.10.1 255.255.255.0
SW-L3(config-if)# no shutdown
SW-L3(config)# interface vlan 20
SW-L3(config-if)# ip address 192.168.20.1 255.255.255.0
SW-L3(config-if)# no shutdown
SW-L3(config)# interface gi0/24
SW-L3(config-if)# no switchport            <span style="color:#5b6b8c">! ทำเป็น routed port ไป WAN</span>
SW-L3(config-if)# ip address 10.0.0.2 255.255.255.252</pre>
<div class="note warn"><b>ลืมบ่อยที่สุด:</b> ตั้ง SVI ครบแล้วแต่ ping ข้าม VLAN ไม่ได้ — เพราะยังไม่ได้สั่ง <code>ip routing</code></div>`,
        },
        {
          t: 'DHCP Snooping และ Dynamic ARP Inspection',
          h: `
<p><b>ปัญหา:</b> ใครก็ได้เอา router บ้านมาเสียบในออฟฟิศ แล้วแจก IP ผิด ๆ ทำให้คนทั้งชั้นใช้เน็ตไม่ได้ (rogue DHCP server) หรือทำ man-in-the-middle ด้วย ARP spoofing</p>
<p><b>DHCP Snooping</b> แบ่งพอร์ตเป็น</p>
<ul>
  <li><b>Trusted</b> — พอร์ตที่ต่อไป DHCP server จริง หรือ uplink ไป core (ยอมให้ DHCP OFFER/ACK ผ่าน)</li>
  <li><b>Untrusted</b> — พอร์ตผู้ใช้ (ค่าปริยาย) ถ้ามี DHCP OFFER/ACK ออกมาจากพอร์ตนี้จะถูกทิ้งทันที</li>
</ul>
<pre class="code">SW1(config)# ip dhcp snooping
SW1(config)# ip dhcp snooping vlan 10,20
SW1(config)# no ip dhcp snooping information option   <span style="color:#5b6b8c">! มักต้องปิดถ้า DHCP อยู่ข้าม L3</span>
SW1(config)# interface gi0/1
SW1(config-if)# ip dhcp snooping trust
SW1(config)# interface range fa0/1 - 20
SW1(config-if-range)# ip dhcp snooping limit rate 10

<span style="color:#5b6b8c">! DAI ใช้ binding table ที่ snooping สร้างไว้ ป้องกัน ARP spoofing</span>
SW1(config)# ip arp inspection vlan 10,20
SW1(config)# interface gi0/1
SW1(config-if)# ip arp inspection trust</pre>`,
        },
        {
          t: 'SPAN และวิธีไล่ปัญหาอย่างเป็นระบบ',
          h: `
<p><b>SPAN (Port Mirroring)</b> — คัดลอก traffic ไปยังพอร์ตที่ต่อ Wireshark/IDS</p>
<pre class="code">SW1(config)# monitor session 1 source interface fa0/5 both
SW1(config)# monitor session 1 destination interface fa0/24
SW1# show monitor session 1</pre>
<p><b>ลำดับการไล่ปัญหา (bottom-up) ที่ใช้ได้จริง:</b></p>
<table class="tbl">
<tr><th>ชั้น</th><th>ตรวจอะไร</th><th>คำสั่ง</th></tr>
<tr><td>L1 กายภาพ</td><td>สายเสียบ? ไฟพอร์ตติด? err-disabled?</td><td><code>show interfaces status</code></td></tr>
<tr><td>L2 สวิตชิ่ง</td><td>VLAN ถูกไหม? trunk ผ่าน VLAN นั้นไหม? STP บล็อกอยู่?</td><td><code>show vlan brief</code>, <code>show interfaces trunk</code>, <code>show spanning-tree</code></td></tr>
<tr><td>L2 MAC</td><td>สวิตช์เห็น MAC ปลายทางไหม</td><td><code>show mac address-table</code></td></tr>
<tr><td>L3 IP</td><td>SVI up? IP/mask ถูก? มี route?</td><td><code>show ip interface brief</code>, <code>show ip route</code></td></tr>
<tr><td>L3 ปลายทาง</td><td>ARP resolve ได้ไหม</td><td><code>show ip arp</code>, <code>ping</code></td></tr>
</table>
<div class="note"><b>เคสคลาสสิก:</b> PC ย้ายชั้นแล้วใช้เน็ตไม่ได้ ตรวจ <code>show interfaces status</code> เห็น connected แต่ VLAN เป็น 1 — เพราะพอร์ตใหม่ยังไม่ได้ตั้ง <code>switchport access vlan</code></div>`,
        },
      ],
      quiz: [
        { type: 'mcq', q: 'ตั้ง SVI ครบทุก VLAN บน L3 switch แล้ว แต่ ping ข้าม VLAN ไม่ได้ สาเหตุที่พบบ่อยที่สุดคือ?', opts: ['ลืมสั่ง no shutdown', 'ลืมสั่ง ip routing', 'ลืมสร้าง trunk', 'subnet mask ผิด'], a: 1, why: 'L3 switch จะทำ routing ระหว่าง SVI ก็ต่อเมื่อเปิด ip routing (บางรุ่นปิดไว้เป็นค่าปริยาย)' },
        { type: 'cmd', q: 'พิมพ์คำสั่งเปิดความสามารถ routing บน Layer 3 switch', ans: ['ip routing'], why: 'ip routing เป็น global config ที่เปิดตาราง routing ให้ SVI คุยข้ามกันได้' },
        { type: 'mcq', q: 'ข้อจำกัดสำคัญของ Router-on-a-Stick คืออะไร?', opts: ['ตั้งค่ายากกว่า L3 switch มาก', 'ทุก traffic ข้าม VLAN วิ่งผ่านลิงก์เดียว จึงเป็นคอขวด', 'ไม่รองรับ 802.1Q', 'ใช้ได้แค่ 2 VLAN'], a: 1, why: 'traffic ขาเข้า+ขาออกทุก VLAN ใช้ physical link เส้นเดียวร่วมกัน แบนด์วิดท์จึงถูกแชร์และหน่วงกว่า L3 switch ที่ route ใน ASIC' },
        { type: 'mcq', q: 'ในระบบ DHCP Snooping พอร์ตใดควรตั้งเป็น trusted?', opts: ['พอร์ตที่ต่อ PC ผู้ใช้', 'พอร์ต uplink ที่ไปยัง DHCP server จริง', 'ทุกพอร์ต access', 'พอร์ตที่ shutdown อยู่'], a: 1, why: 'trusted เฉพาะทางที่ DHCP server จริงอยู่ พอร์ตผู้ใช้ต้องเป็น untrusted เพื่อบล็อก rogue DHCP OFFER/ACK' },
        { type: 'mcq', q: 'Dynamic ARP Inspection (DAI) ใช้ข้อมูลจากที่ใดในการตรวจสอบ ARP?', opts: ['MAC address table', 'DHCP snooping binding table', 'CDP neighbor table', 'Routing table'], a: 1, why: 'DAI ตรวจ ARP packet เทียบกับ binding table (MAC-IP-port-VLAN) ที่ DHCP snooping สร้างไว้ จึงต้องเปิด snooping ก่อนเสมอ' },
        { type: 'cmd', q: 'พิมพ์คำสั่งดูว่าพอร์ต trunk แต่ละเส้นยอมให้ VLAN ใดผ่าน และ native VLAN คืออะไร', ans: ['show interfaces trunk', 'show interface trunk', 'sh int trunk'], why: 'show interfaces trunk แสดง mode, encapsulation, status, native vlan และ vlans allowed — เป็นคำสั่งแรกที่ควรดูเมื่อ VLAN ข้าม switch ไม่ได้' },
        { type: 'mcq', q: 'ผู้ใช้ย้ายโต๊ะแล้วเน็ตใช้ไม่ได้ <code>show interfaces status</code> ขึ้น connected แต่ Vlan = 1 ควรทำอะไร?', opts: ['เปลี่ยนสายแลน', 'reboot switch', 'ตั้ง switchport access vlan ให้ตรงกับ VLAN ที่ผู้ใช้ควรอยู่', 'เปิด portfast'], a: 2, why: 'พอร์ตขึ้นปกติ (L1/L2 ผ่าน) แต่ยังอยู่ VLAN 1 ซึ่งเป็นค่าปริยาย ต้องกำหนด access vlan ใหม่ให้ถูกต้อง' },
        { type: 'multi', q: 'คำสั่งใดใช้ในการไล่ปัญหา "PC ping gateway ไม่ได้" (เลือกทุกข้อที่เกี่ยวข้อง)', opts: ['show interfaces status', 'show vlan brief', 'show ip interface brief', 'show version'], a: [0, 1, 2], why: 'show version บอกแค่รุ่น IOS/uptime ไม่ช่วยไล่ปัญหา connectivity' },
      ],
      labs: [{
        id: 'l4-l3switch',
        title: 'Lab 4 — เปลี่ยนสวิตช์ให้ทำ Inter-VLAN Routing',
        brief: 'ยกเลิก router-on-a-stick เดิม แล้วให้ distribution switch ทำ routing เอง: VLAN 10 = 192.168.10.0/24, VLAN 20 = 192.168.20.0/24 และมี routed port ไป WAN',
        device: 'cisco',
        tasks: [
          { t: 'เปิดความสามารถ routing บนสวิตช์', hint: 'enable → configure terminal → ip routing', check: s => s.ipRouting === true },
          { t: 'สร้าง VLAN 10 และ VLAN 20', hint: 'vlan 10 → exit → vlan 20 → exit', check: s => !!s.vlans[10] && !!s.vlans[20] },
          { t: 'ตั้ง SVI VLAN 10 = <code>192.168.10.1/24</code> และเปิดใช้งาน', hint: 'interface vlan 10 → ip address 192.168.10.1 255.255.255.0 → no shutdown', check: s => s.svis[10] && s.svis[10].ip === '192.168.10.1' && !s.svis[10].shutdown },
          { t: 'ตั้ง SVI VLAN 20 = <code>192.168.20.1/24</code> และเปิดใช้งาน', hint: 'interface vlan 20 → ip address 192.168.20.1 255.255.255.0 → no shutdown', check: s => s.svis[20] && s.svis[20].ip === '192.168.20.1' && !s.svis[20].shutdown },
          {
            t: 'เปลี่ยน Gi0/2 เป็น routed port และตั้ง IP <code>10.0.0.2/30</code>', hint: 'interface gi0/2 → no switchport → ip address 10.0.0.2 255.255.255.252',
            check: s => { const p = s.ifaces['GigabitEthernet0/2']; return p.routed && p.ip === '10.0.0.2' && p.mask === '255.255.255.252'; }
          },
          { t: 'เพิ่ม default route ออก WAN ไปที่ <code>10.0.0.1</code>', hint: 'ip route 0.0.0.0 0.0.0.0 10.0.0.1', check: s => s.routes.some(r => r.net === '0.0.0.0' && r.nh === '10.0.0.1') },
          { t: 'ตรวจสอบตาราง routing', hint: 'do show ip route', check: (s, h) => h.some(c => /show\s+ip\s+route/i.test(c)) },
          { t: 'บันทึก config', hint: 'end → write memory', check: s => !!s.savedConfig },
        ],
      }],
    },

    // =========================================================
    5: {
      title: 'ออกแบบ Campus LAN, HA และ Automation',
      objectives: [
        'ออกแบบโครงข่ายแบบ hierarchical / collapsed core ได้',
        'วาง first-hop redundancy (HSRP/VRRP) ให้สอดคล้องกับ STP root',
        'ป้องกัน Layer 2 ระดับ enterprise: Root Guard, Loop Guard, Storm Control, 802.1X',
        'ทำ monitoring และ automation เบื้องต้น (SNMP, NetFlow, EEM, Ansible)',
      ],
      sections: [
        {
          t: 'สถาปัตยกรรม Campus LAN',
          h: `
<table class="tbl">
<tr><th>ชั้น</th><th>หน้าที่</th><th>ควรทำ</th></tr>
<tr><td><b>Access</b></td><td>ต่อ end device, PoE, 802.1X</td><td>PortFast, BPDU Guard, Port Security, Storm Control, Voice VLAN</td></tr>
<tr><td><b>Distribution</b></td><td>รวม access, ทำ routing, policy, QoS</td><td>SVI + HSRP, STP root, route summarization, ACL</td></tr>
<tr><td><b>Core</b></td><td>ส่งต่อความเร็วสูงอย่างเดียว</td><td>L3 ล้วน, ไม่ใส่ policy หนัก, redundancy เต็มรูปแบบ</td></tr>
</table>
<div class="note"><b>Collapsed Core</b> — องค์กรขนาดกลางมักรวม distribution+core เป็นชั้นเดียว (2-tier) ประหยัดกว่าและ latency ต่ำกว่า ใช้เมื่อมี access switch ไม่เกิน ~50 ตัว</div>
<p><b>กฎเหล็กในการออกแบบ:</b></p>
<ul>
  <li>STP root ต้องอยู่ที่ distribution ตัวเดียวกับ HSRP active — ไม่งั้น traffic จะวิ่งข้าม inter-switch link โดยไม่จำเป็น</li>
  <li>ใช้ L3 routed link ระหว่าง distribution กับ core แทน trunk เพื่อจำกัด STP domain ให้เล็ก</li>
  <li>ออกแบบให้ VLAN ไม่ข้าม distribution block (no VLAN spanning) จะ converge เร็วและ debug ง่าย</li>
</ul>`,
        },
        {
          t: 'First-Hop Redundancy และ StackWise',
          h: `
<p><b>HSRP / VRRP / GLBP</b> ทำให้ client มี default gateway เป็น <b>virtual IP</b> ที่ไม่ตายแม้ switch ตัวหนึ่งดับ</p>
<table class="tbl">
<tr><th></th><th>HSRP</th><th>VRRP</th><th>GLBP</th></tr>
<tr><td>มาตรฐาน</td><td>Cisco</td><td>เปิด (RFC 5798)</td><td>Cisco</td></tr>
<tr><td>บทบาท</td><td>Active / Standby</td><td>Master / Backup</td><td>AVG / AVF (โหลดบาลานซ์จริง)</td></tr>
<tr><td>Priority ปริยาย</td><td>100 (สูงชนะ)</td><td>100</td><td>100</td></tr>
</table>
<pre class="code">DSW1(config)# interface vlan 10
DSW1(config-if)# ip address 192.168.10.2 255.255.255.0
DSW1(config-if)# standby version 2
DSW1(config-if)# standby 10 ip 192.168.10.1          <span style="color:#5b6b8c">! virtual IP = gateway ของ client</span>
DSW1(config-if)# standby 10 priority 110
DSW1(config-if)# standby 10 preempt
DSW1(config-if)# standby 10 track gi0/24 decrement 20</pre>
<div class="note warn"><b>ห้ามลืม <code>preempt</code></b> — ถ้าไม่ใส่ ตัวที่ priority สูงกว่ากลับมาแล้วจะไม่ยึด active คืน ทำให้ traffic วิ่งไม่ตรงกับ STP root ที่ออกแบบไว้</div>
<p><b>StackWise / VSS / vPC</b> — รวมสวิตช์หลายตัวให้ control plane เดียว: จัดการที่เดียว, ทำ EtherChannel ข้ามตัวได้ (MEC) จึงไม่ต้องพึ่ง STP blocking และไม่ต้องใช้ FHRP ในบางดีไซน์</p>`,
        },
        {
          t: 'ป้องกัน Layer 2 ระดับองค์กร + Automation',
          h: `
<table class="tbl">
<tr><th>ฟีเจอร์</th><th>ป้องกันอะไร</th><th>ตั้งที่ไหน</th></tr>
<tr><td><code>spanning-tree guard root</code></td><td>สวิตช์ล่างพยายามเป็น root</td><td>พอร์ต distribution ที่หันลง access</td></tr>
<tr><td><code>spanning-tree guard loop</code></td><td>ลิงก์ที่ BPDU หายไป (unidirectional) แล้วพอร์ตเปลี่ยนเป็น forwarding</td><td>พอร์ต non-designated</td></tr>
<tr><td><code>udld aggressive</code></td><td>ไฟเบอร์ส่งได้ทางเดียว</td><td>ลิงก์ไฟเบอร์ทุกเส้น</td></tr>
<tr><td><code>storm-control broadcast level 1.00</code></td><td>broadcast/multicast storm</td><td>พอร์ต access</td></tr>
<tr><td><code>dot1x</code> (802.1X)</td><td>อุปกรณ์แปลกปลอมเสียบสาย</td><td>พอร์ต access ทั้งหมด</td></tr>
</table>
<pre class="code"><span style="color:#5b6b8c">! 802.1X พื้นฐาน</span>
SW(config)# aaa new-model
SW(config)# aaa authentication dot1x default group radius
SW(config)# radius server ISE
SW(config-radius-server)# address ipv4 10.10.10.50 auth-port 1812 acct-port 1813
SW(config-radius-server)# key S3cr3tKey
SW(config)# dot1x system-auth-control
SW(config)# interface range fa0/1 - 20
SW(config-if-range)# authentication port-control auto
SW(config-if-range)# dot1x pae authenticator</pre>
<p><b>Monitoring &amp; Automation ที่ควรมี:</b></p>
<ul>
  <li><b>SNMPv3</b> — เก็บ interface counters เข้า Zabbix/LibreNMS (อย่าใช้ v2c community public บน production)</li>
  <li><b>Syslog</b> — ส่ง log ออกไปเก็บรวมศูนย์ <code>logging host 10.10.10.60</code></li>
  <li><b>NetFlow / sFlow</b> — วิเคราะห์ว่าใครใช้แบนด์วิดท์อะไร</li>
  <li><b>EEM</b> — สคริปต์บนตัวสวิตช์ เช่น auto-recover พอร์ต err-disabled</li>
  <li><b>Ansible / NETCONF</b> — push config หลายร้อยตัวพร้อมกัน มี version control ผ่าน Git</li>
</ul>
<pre class="code"><span style="color:#5b6b8c">! ตัวอย่าง EEM: แจ้งเตือนเมื่อพอร์ตขึ้น err-disabled</span>
SW(config)# event manager applet ERRDISABLE-ALERT
SW(config-applet)# event syslog pattern "err-disable"
SW(config-applet)# action 1.0 syslog msg "ALERT: พบพอร์ต err-disabled กรุณาตรวจสอบ"
SW(config-applet)# action 2.0 cli command "show interfaces status err-disabled"</pre>`,
        },
      ],
      quiz: [
        { type: 'mcq', q: 'ในดีไซน์ที่มี HSRP และ STP ควรวางอย่างไรจึงจะได้ traffic path ที่ดีที่สุด?', opts: ['ให้ HSRP active กับ STP root อยู่คนละตัวเพื่อกระจายโหลด', 'ให้ HSRP active และ STP root อยู่ที่ switch ตัวเดียวกัน', 'ปิด STP เมื่อใช้ HSRP', 'ไม่เกี่ยวข้องกัน ตั้งอย่างไรก็ได้'], a: 1, why: 'ถ้าอยู่คนละตัว traffic ที่ถูก forward ตาม STP จะต้องวิ่งข้าม inter-switch link ไปหา HSRP active ทำให้เสียแบนด์วิดท์และเพิ่ม latency' },
        { type: 'mcq', q: 'ถ้าไม่ใส่ <code>standby 10 preempt</code> จะเกิดอะไรขึ้น?', opts: ['HSRP ใช้งานไม่ได้เลย', 'ตัวที่ priority สูงกว่าเมื่อกลับมาออนไลน์จะไม่ยึดบทบาท active คืน', 'virtual IP จะเปลี่ยนไปเรื่อย ๆ', 'ทั้งสองตัวจะเป็น active พร้อมกัน'], a: 1, why: 'preempt คือสิทธิ์ในการแย่งบทบาทคืนเมื่อ priority สูงกว่า ถ้าไม่ใส่ topology จริงจะไม่ตรงกับที่ออกแบบ' },
        { type: 'mcq', q: '<code>spanning-tree guard root</code> ควรตั้งที่พอร์ตใด?', opts: ['พอร์ตที่ต่อ PC', 'พอร์ตของ distribution ที่หันลงไปยัง access switch', 'พอร์ต uplink ไป core', 'ทุกพอร์ตในระบบ'], a: 1, why: 'Root Guard ป้องกันไม่ให้สวิตช์ที่อยู่ "ต่ำกว่า" ในดีไซน์ประกาศตัวเป็น root ถ้าได้รับ superior BPDU จะสั่ง root-inconsistent ปิดพอร์ตชั่วคราว' },
        { type: 'mcq', q: 'UDLD (Unidirectional Link Detection) แก้ปัญหาอะไร?', opts: ['สายทองแดงยาวเกินมาตรฐาน', 'ลิงก์ไฟเบอร์ที่ส่งข้อมูลได้ทางเดียว ทำให้ STP เข้าใจผิดและเกิด loop', 'IP ซ้ำในเครือข่าย', 'DHCP rogue server'], a: 1, why: 'เมื่อ fiber ขาดทางเดียว ฝั่งหนึ่งไม่ได้รับ BPDU จึงเปลี่ยนพอร์ตเป็น forwarding เกิด loop — UDLD ตรวจจับและ err-disable พอร์ตนั้น' },
        { type: 'multi', q: 'ฟีเจอร์ใดที่ควรเปิดบน access port ที่ต่อผู้ใช้งานทั่วไป (เลือกทุกข้อที่ถูก)', opts: ['spanning-tree portfast', 'spanning-tree bpduguard enable', 'spanning-tree guard root', 'storm-control broadcast level 1.00'], a: [0, 1, 3], why: 'Root Guard ใช้บนพอร์ตที่หันไปหา switch ตัวอื่น ไม่ใช่พอร์ตผู้ใช้ (พอร์ตผู้ใช้ใช้ BPDU Guard แทน)' },
        { type: 'mcq', q: 'ข้อดีหลักของการทำ StackWise / VSS เทียบกับสวิตช์แยกตัวคืออะไร?', opts: ['ประหยัดค่าไฟ', 'จัดการเป็น logical device เดียว และทำ EtherChannel ข้ามตัวได้ จึงไม่ต้องพึ่ง STP blocking', 'ทำให้ VLAN ได้มากกว่า 4094', 'ไม่ต้องใช้สาย uplink'], a: 1, why: 'Multi-chassis EtherChannel ทำให้ทุกลิงก์ forward พร้อมกัน (ไม่มีพอร์ตถูกบล็อก) และ converge เร็วกว่า STP มาก' },
        { type: 'mcq', q: 'ในเครือข่าย production ควรใช้ SNMP เวอร์ชันใด?', opts: ['v1 เพราะเบาที่สุด', 'v2c เพราะรองรับกว้าง', 'v3 เพราะมี authentication และ encryption', 'ไม่ควรใช้ SNMP เลย'], a: 2, why: 'v1/v2c ส่ง community string เป็น plaintext ใครดักจับได้ก็อ่าน/แก้ค่าอุปกรณ์ได้ ส่วน v3 มี authPriv' },
        { type: 'cmd', q: 'พิมพ์คำสั่ง global config เพื่อส่ง syslog ไปยัง server 10.10.10.60', ans: ['logging host 10.10.10.60', 'logging 10.10.10.60'], why: 'logging host (หรือ logging เฉย ๆ ในรุ่นเก่า) ส่ง log ออกไปเก็บรวมศูนย์ เพื่อให้ยังมี log ให้ดูแม้อุปกรณ์จะ reboot' },
      ],
      labs: [{
        id: 'l5-hardening',
        title: 'Lab 5 — Hardening สวิตช์ก่อนขึ้น Production',
        brief: 'สวิตช์กำลังจะขึ้น production คุณต้องทำ hardening ตาม security baseline ขององค์กรก่อนส่งมอบ',
        device: 'cisco',
        tasks: [
          { t: 'ตั้ง hostname เป็น <code>DSW-CORE-01</code>', hint: 'enable → configure terminal → hostname DSW-CORE-01', check: s => s.hostname === 'DSW-CORE-01' },
          { t: 'ตั้ง <code>enable secret</code> เป็น <code>Str0ngP@ss</code>', hint: 'enable secret Str0ngP@ss', check: s => s.enableSecret === 'Str0ngP@ss' },
          { t: 'สร้าง user <code>netadmin</code> privilege 15 ด้วย secret <code>N0cAdm1n</code>', hint: 'username netadmin privilege 15 secret N0cAdm1n', check: s => s.users.netadmin && s.users.netadmin.priv === '15' && s.users.netadmin.secret },
          { t: 'เปิด <code>service password-encryption</code>', hint: 'service password-encryption', check: s => s.pwEncrypt === true },
          { t: 'ที่ line vty: บังคับ <code>login local</code> และ <code>transport input ssh</code>', hint: 'line vty 0 4 → login local → transport input ssh', check: s => { const l = s.lines['vty 0 4']; return l && l.login && l.loginLocal && /ssh/.test(l.transport || ''); } },
          { t: 'ปิด <code>ip domain-lookup</code> (กัน DNS lookup เวลาพิมพ์ผิด)', hint: 'no ip domain-lookup', check: s => s.domainLookup === false },
          { t: 'ตั้ง banner motd เตือนผู้เข้าใช้งาน (ข้อความอะไรก็ได้)', hint: 'banner motd #Authorized access only#', check: s => !!s.banner && s.banner.length > 3 },
          { t: 'ปิดพอร์ตที่ยังไม่ใช้ Fa0/9 ถึง Fa0/24 ทั้งหมด', hint: 'interface range fa0/9 - 24 → shutdown', check: s => Array.from({ length: 16 }, (_, i) => i + 9).every(i => s.ifaces['FastEthernet0/' + i].shutdown) },
          { t: 'บันทึก config ลง NVRAM', hint: 'end → write memory', check: s => !!s.savedConfig },
        ],
      }],
    },
  },
};
