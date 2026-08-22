const T = (s, p) => s.tables[p] || [];

export default {
  id: 'mikrotik-router',
  name: 'MikroTik Router',
  icon: '📡',
  device: 'mikrotik',
  sub: 'RouterOS 7 — RouterBOARD / CHR',
  desc: 'RouterOS ตั้งแต่โครงสร้างเมนู, IP/NAT/DHCP, Firewall, Routing, VPN ไปจนถึงการออกแบบ ISP/Enterprise และ scripting',

  levels: {
    // =========================================================
    1: {
      title: 'รู้จัก RouterOS และโครงสร้างคำสั่ง',
      objectives: [
        'เข้าใจว่า RouterOS ต่างจาก IOS อย่างไร และเข้าถึงได้กี่ทาง',
        'เดินเมนูแบบ hierarchy และอ่านผล print เป็น',
        'ตั้ง identity, ดู interface, ใส่ IP address',
        'เข้าใจ default configuration ที่ติดมากับเครื่อง',
      ],
      sections: [
        {
          t: 'ช่องทางเข้าถึงและโครงสร้างเมนู',
          h: `
<p>RouterOS เข้าถึงได้หลายทาง — เลือกใช้ให้เหมาะกับงาน</p>
<table class="tbl">
<tr><th>ช่องทาง</th><th>พอร์ต</th><th>เหมาะกับ</th></tr>
<tr><td><b>WinBox</b></td><td>8291</td><td>GUI ที่นิยมที่สุด ทำงานผ่าน MAC ได้แม้ยังไม่มี IP</td></tr>
<tr><td><b>WebFig</b></td><td>80 / 443</td><td>เบราว์เซอร์ ไม่ต้องลงโปรแกรม</td></tr>
<tr><td><b>SSH / Telnet</b></td><td>22 / 23</td><td>CLI, script, automation</td></tr>
<tr><td><b>API</b></td><td>8728 / 8729</td><td>เชื่อมกับระบบภายนอก เช่น billing</td></tr>
<tr><td><b>Serial console</b></td><td>—</td><td>กู้เครื่องเมื่อเข้าไม่ได้</td></tr>
</table>
<p>CLI ของ RouterOS เป็น <b>ลำดับชั้น (hierarchy)</b> เหมือนโครงสร้างโฟลเดอร์ ไม่ใช่โหมดแบบ Cisco</p>
<pre class="code">[admin@MikroTik] &gt; /ip address          <span style="color:#5b6b8c">← เดินเข้าเมนู</span>
[admin@MikroTik] /ip address&gt; print
[admin@MikroTik] /ip address&gt; ..        <span style="color:#5b6b8c">← ขึ้น 1 ชั้น</span>
[admin@MikroTik] /ip&gt; /                 <span style="color:#5b6b8c">← กลับ root</span>

<span style="color:#5b6b8c">! หรือสั่งจาก root ทีเดียวเลยก็ได้ (นิยมกว่า)</span>
[admin@MikroTik] &gt; /ip address print</pre>
<div class="note"><b>คำสั่งพื้นฐานที่ใช้ในทุกเมนู</b><br>
<code>print</code> ดูรายการ · <code>add</code> เพิ่ม · <code>set</code> แก้ · <code>remove</code> ลบ · <code>enable</code>/<code>disable</code> เปิด-ปิด · <code>export</code> ดึง config เป็นข้อความ<br>
ทุกอย่างเป็น <b>key=value</b> เช่น <code>address=192.168.88.1/24 interface=ether2</code></div>`,
        },
        {
          t: 'Interface และ IP Address',
          h: `
<pre class="code">/interface print
<span style="color:#5b6b8c"># Flags: D - dynamic, X - disabled, R - running, S - slave</span>
 #     NAME      TYPE     ACTUAL-MTU  MAC-ADDRESS
 0  R  ether1    ether    1500        48:8F:5A:11:00:01
 1  R  ether2    ether    1500        48:8F:5A:11:00:02

/ip address add address=192.168.88.1/24 interface=ether2
/ip address print</pre>
<p>สังเกตว่า RouterOS ใช้ <b>CIDR prefix</b> (<code>/24</code>) ไม่ใช่ subnet mask แบบ Cisco และ IP ผูกกับ interface โดยเป็น "รายการ" ที่เพิ่มได้หลายอันต่อ interface</p>
<table class="tbl">
<tr><th>Flag</th><th>ความหมาย</th></tr>
<tr><td><code>R</code></td><td>Running — ลิงก์ขึ้นจริง มีสายและปลายทางทำงาน</td></tr>
<tr><td><code>X</code></td><td>Disabled — ถูกสั่งปิดไว้</td></tr>
<tr><td><code>D</code></td><td>Dynamic — ระบบสร้างเอง แก้/ลบไม่ได้ (เช่น IP ที่ได้จาก DHCP client)</td></tr>
<tr><td><code>S</code></td><td>Slave — เป็นสมาชิกของ bridge หรือ bonding</td></tr>
<tr><td><code>I</code></td><td>Invalid — ตั้งค่าไว้แต่ใช้งานไม่ได้ (เช่น อ้าง interface ที่ถูกลบ)</td></tr>
</table>
<pre class="code"><span style="color:#5b6b8c"># ตั้งชื่อเครื่อง — ควรทำเป็นอย่างแรกเสมอ</span>
/system identity set name=RTR-HQ

<span style="color:#5b6b8c"># ดูข้อมูลเครื่องและ RouterOS version</span>
/system resource print

<span style="color:#5b6b8c"># ดึง config ทั้งหมดออกมาเป็นข้อความ (ใช้ทำ backup / ส่งให้เพื่อนดู)</span>
/export</pre>`,
        },
        {
          t: 'Default Configuration และการรีเซ็ต',
          h: `
<p>RouterBOARD ส่วนใหญ่มาพร้อม default config ที่ตั้งไว้ให้ใช้ได้ทันที ซึ่งควรรู้ว่ามีอะไรบ้าง</p>
<ul>
  <li><code>ether1</code> = WAN — เป็น DHCP client และมี masquerade ให้แล้ว</li>
  <li><code>ether2</code> ขึ้นไป = LAN — ถูกรวมอยู่ใน <code>bridge</code> เดียวกัน</li>
  <li>bridge มี IP <code>192.168.88.1/24</code> และเป็น DHCP server แจก <code>192.168.88.10-254</code></li>
  <li>มี firewall filter พื้นฐานป้องกันจากฝั่ง WAN</li>
  <li>user <code>admin</code> ไม่มีรหัสผ่าน (RouterOS 7 บังคับตั้งตอน login ครั้งแรก)</li>
</ul>
<pre class="code"><span style="color:#5b6b8c"># ลบ default config เพื่อเริ่มต้นใหม่ทั้งหมด</span>
/system reset-configuration no-defaults=yes skip-backup=yes

<span style="color:#5b6b8c"># สำรอง config 2 แบบ — ควรทำทั้งคู่</span>
/system backup save name=RTR-HQ-2026-08-21     <span style="color:#5b6b8c"># binary กู้ทั้งเครื่อง แต่ย้ายข้ามรุ่นไม่ได้</span>
/export file=RTR-HQ-2026-08-21                 <span style="color:#5b6b8c"># text อ่านได้ ย้ายข้ามเครื่องได้</span></pre>
<div class="note warn"><b>ก่อนแก้ config ที่เสี่ยงตัดขาดตัวเอง</b> ให้ใช้ <code>/system scheduler</code> ตั้ง reboot ล่วงหน้า หรือใช้ Safe Mode ใน WinBox (<b>Ctrl+X</b>) — ถ้าหลุดการเชื่อมต่อ RouterOS จะย้อน config กลับให้อัตโนมัติ</div>`,
        },
      ],
      quiz: [
        { type: 'mcq', q: 'WinBox เชื่อมต่อกับ RouterOS ผ่านพอร์ต TCP ใด', opts: ['22', '80', '8291', '8728'], a: 2, why: 'WinBox ใช้พอร์ต 8291 และเชื่อมผ่าน MAC address ได้แม้เครื่องยังไม่มี IP ซึ่งช่วยได้มากตอนตั้งค่าครั้งแรกหรือกู้เครื่อง' },
        { type: 'cmd', q: 'พิมพ์คำสั่งเปลี่ยนชื่ออุปกรณ์เป็น <code>RTR-HQ</code>', ans: ['/system identity set name=RTR-HQ', 'system identity set name=RTR-HQ', '/system identity set name="RTR-HQ"'], why: 'ทุกอย่างใน RouterOS เป็น key=value — ชื่อจะไปแสดงบน prompt และใน WinBox' },
        { type: 'cmd', q: 'พิมพ์คำสั่งเพิ่ม IP <code>192.168.88.1/24</code> ให้ interface <code>ether2</code>', ans: ['/ip address add address=192.168.88.1/24 interface=ether2', 'ip address add address=192.168.88.1/24 interface=ether2'], why: 'RouterOS ใช้ CIDR prefix ไม่ใช่ subnet mask และ IP เป็นรายการที่เพิ่มได้หลายอันต่อ interface' },
        { type: 'mcq', q: 'Flag <code>D</code> หน้ารายการใน print หมายถึงอะไร', opts: ['Disabled', 'Dynamic — ระบบสร้างเอง แก้ไม่ได้', 'Down', 'Default'], a: 1, why: 'D = dynamic เช่น IP ที่ได้จาก DHCP client หรือ route ที่มาจาก connected — ส่วน disabled ใช้ flag X' },
        { type: 'mcq', q: 'ในโครงสร้างเมนู RouterOS คำสั่ง <code>..</code> ทำอะไร', opts: ['กลับไป root', 'ขึ้นไปหนึ่งชั้น', 'ออกจากระบบ', 'ยกเลิกคำสั่งล่าสุด'], a: 1, why: '.. ขึ้นหนึ่งชั้นเหมือน cd .. ในระบบไฟล์ ส่วน / เดียวโดด ๆ คือกลับไป root' },
        { type: 'mcq', q: 'ในดีไซน์ default ของ RouterBOARD พอร์ตใดคือ WAN', opts: ['ether1', 'ether2', 'bridge', 'พอร์ตสุดท้าย'], a: 0, why: 'ether1 เป็น WAN ที่ตั้งเป็น DHCP client + masquerade ส่วน ether2 ขึ้นไปถูกรวมอยู่ใน bridge ของ LAN' },
        { type: 'multi', q: 'ข้อใดคือวิธีสำรอง config ของ RouterOS (เลือกทุกข้อที่ถูก)', opts: ['/system backup save', '/export file=...', '/system reset-configuration', '/ip address print'], a: [0, 1], why: 'backup = ไฟล์ binary กู้ทั้งเครื่องแต่ข้ามรุ่นไม่ได้ ส่วน export = text อ่านได้และย้ายข้ามเครื่องได้ ควรเก็บทั้งสองแบบ' },
      ],
      labs: [{
        id: 'mr-l1-basic',
        title: 'Lab 1 — ตั้งค่า Router ตัวใหม่',
        brief: 'RouterBOARD ตัวใหม่มาถึงสำนักงาน คุณต้องตั้งชื่อเครื่อง ใส่ IP ให้ฝั่ง LAN และตรวจสอบสถานะ interface',
        device: 'mikrotik',
        tasks: [
          { t: 'ดูรายการ interface ทั้งหมด', hint: '/interface print', check: (s, h) => h.some(c => /\/?interface\s+print/i.test(c)) },
          { t: 'เปลี่ยนชื่ออุปกรณ์เป็น <code>RTR-HQ</code>', hint: '/system identity set name=RTR-HQ', check: s => s.settings['system identity'].name === 'RTR-HQ' },
          { t: 'เพิ่ม IP <code>192.168.88.1/24</code> ให้ <code>ether2</code>', hint: '/ip address add address=192.168.88.1/24 interface=ether2', check: s => T(s, 'ip address').some(r => r.address === '192.168.88.1/24' && r.interface === 'ether2') },
          { t: 'เพิ่ม IP <code>10.10.10.1/24</code> ให้ <code>ether3</code>', hint: '/ip address add address=10.10.10.1/24 interface=ether3', check: s => T(s, 'ip address').some(r => r.address === '10.10.10.1/24' && r.interface === 'ether3') },
          { t: 'ตรวจสอบรายการ IP ที่ตั้งไว้', hint: '/ip address print', check: (s, h) => h.some(c => /ip\s+address\s+print/i.test(c)) },
          { t: 'ดึง config ทั้งหมดออกมาดูด้วย export', hint: '/export', check: (s, h) => h.some(c => /^\/?export/i.test(c.trim())) },
        ],
      }],
    },

    // =========================================================
    2: {
      title: 'WAN, NAT, DHCP และ DNS',
      objectives: [
        'ตั้งค่า WAN ทั้งแบบ DHCP client และ static',
        'เข้าใจ NAT (srcnat/masquerade) และเมื่อไหร่ต้องใช้ dst-nat',
        'ตั้ง DHCP server ครบชุด (pool + server + network)',
        'ตั้ง DNS และ default route ให้ออกอินเทอร์เน็ตได้',
      ],
      sections: [
        {
          t: 'WAN และ Default Route',
          h: `
<pre class="code"><span style="color:#5b6b8c"># แบบที่ 1 — รับ IP อัตโนมัติจาก ISP</span>
/ip dhcp-client add interface=ether1 disabled=no
/ip dhcp-client print          <span style="color:#5b6b8c"># status ต้องเป็น bound</span>

<span style="color:#5b6b8c"># แบบที่ 2 — ISP ให้ IP คงที่มา</span>
/ip address add address=203.0.113.25/29 interface=ether1
/ip route add dst-address=0.0.0.0/0 gateway=203.0.113.1
/ip dns set servers=8.8.8.8,1.1.1.1 allow-remote-requests=yes</pre>
<div class="note"><b><code>allow-remote-requests=yes</code></b> ทำให้ router เป็น DNS cache ให้เครื่องลูกใช้ ช่วยลด latency แต่ <b>ต้องมี firewall บล็อกพอร์ต 53 จากฝั่ง WAN</b> ไม่งั้นจะโดนใช้เป็น DNS amplification attack</div>
<p><code>dst-address=0.0.0.0/0</code> คือ default route — "ถ้าไม่รู้จะไปไหน ส่งไปทางนี้" ตรวจผลด้วย <code>/ip route print</code> โดย route ที่ใช้งานได้จริงจะมี flag <code>A</code> (active) และ <code>S</code> (static)</p>`,
        },
        {
          t: 'NAT — srcnat, masquerade และ dst-nat',
          h: `
<table class="tbl">
<tr><th>ชนิด</th><th>chain</th><th>action</th><th>ใช้เมื่อ</th></tr>
<tr><td>Masquerade</td><td>srcnat</td><td>masquerade</td><td>LAN ออกเน็ต และ IP WAN เปลี่ยนได้ (DHCP/PPPoE)</td></tr>
<tr><td>Source NAT</td><td>srcnat</td><td>src-nat + to-addresses</td><td>IP WAN คงที่ — เร็วกว่า masquerade เล็กน้อย</td></tr>
<tr><td>Port Forward</td><td>dstnat</td><td>dst-nat + to-addresses/to-ports</td><td>เปิดให้ภายนอกเข้าถึง server ข้างใน</td></tr>
<tr><td>Hairpin NAT</td><td>srcnat</td><td>masquerade</td><td>เครื่องใน LAN เรียก public IP ของตัวเอง</td></tr>
</table>
<pre class="code"><span style="color:#5b6b8c"># LAN ออกเน็ต (กฎที่ทุก router ต้องมี)</span>
/ip firewall nat add chain=srcnat out-interface=ether1 action=masquerade

<span style="color:#5b6b8c"># เปิดเว็บเซิร์ฟเวอร์ภายในออกสู่ภายนอก (พอร์ต 80 → 192.168.88.10)</span>
/ip firewall nat add chain=dstnat in-interface=ether1 protocol=tcp dst-port=80 \\
    action=dst-nat to-addresses=192.168.88.10 to-ports=80

/ip firewall nat print</pre>
<div class="note warn"><b>ข้อผิดพลาดที่พบบ่อย:</b> ใส่ <code>out-interface=ether1</code> ผิดเป็นชื่อ bridge หรือลืมใส่เลย ทำให้ traffic ภายใน LAN ถูก NAT ด้วย เกิดปัญหาแปลก ๆ ตามมา — ระบุ out-interface (หรือ out-interface-list=WAN) เสมอ</div>`,
        },
        {
          t: 'DHCP Server ครบ 3 ส่วน',
          h: `
<p>DHCP server ของ RouterOS ต้องมี 3 ส่วนถึงจะทำงาน — ขาดส่วนใดส่วนหนึ่งจะแจก IP ไม่ได้</p>
<pre class="code"><span style="color:#5b6b8c"># 1) Pool — ช่วง IP ที่จะแจก</span>
/ip pool add name=dhcp_lan ranges=192.168.88.100-192.168.88.200

<span style="color:#5b6b8c"># 2) Server — ผูก pool กับ interface</span>
/ip dhcp-server add name=dhcp1 interface=ether2 address-pool=dhcp_lan lease-time=1d disabled=no

<span style="color:#5b6b8c"># 3) Network — บอก gateway / DNS / netmask ที่จะส่งให้ client</span>
/ip dhcp-server network add address=192.168.88.0/24 gateway=192.168.88.1 dns-server=192.168.88.1

<span style="color:#5b6b8c"># จองไอพีให้เครื่องเฉพาะ (static lease)</span>
/ip dhcp-server lease add address=192.168.88.50 mac-address=00:0C:29:11:22:33 server=dhcp1</pre>
<div class="note"><b>ทางลัด:</b> <code>/ip dhcp-server setup</code> เป็น wizard ถาม-ตอบทีละขั้น สร้างครบทั้ง 3 ส่วนให้เลย เหมาะกับงานเร่ง แต่ควรเข้าใจว่าเบื้องหลังมันสร้างอะไรบ้าง</div>
<p>ตรวจสอบว่ามีใครได้ IP ไปบ้าง: <code>/ip dhcp-server lease print</code></p>`,
        },
      ],
      quiz: [
        { type: 'cmd', q: 'พิมพ์คำสั่งสร้าง NAT ให้ LAN ออกอินเทอร์เน็ตผ่าน <code>ether1</code> แบบ masquerade', ans: ['/ip firewall nat add chain=srcnat out-interface=ether1 action=masquerade', 'ip firewall nat add chain=srcnat out-interface=ether1 action=masquerade', '/ip firewall nat add chain=srcnat action=masquerade out-interface=ether1'], why: 'chain=srcnat ทำงานตอน packet กำลังจะออก และ masquerade จะใช้ IP ของ out-interface อัตโนมัติแม้ IP จะเปลี่ยน' },
        { type: 'mcq', q: 'ต้องการเปิดให้คนภายนอกเข้าถึงเว็บเซิร์ฟเวอร์ที่อยู่ใน LAN ต้องใช้ chain และ action ใด', opts: ['chain=srcnat action=masquerade', 'chain=dstnat action=dst-nat', 'chain=forward action=accept', 'chain=input action=accept'], a: 1, why: 'dstnat ทำงานก่อน routing decision เพื่อเปลี่ยน destination IP จาก public เป็น private ของ server ภายใน' },
        { type: 'mcq', q: 'DHCP server ของ RouterOS ต้องประกอบด้วยกี่ส่วน อะไรบ้าง', opts: ['1 ส่วน: dhcp-server', '2 ส่วน: pool + server', '3 ส่วน: pool + server + network', '4 ส่วน: pool + server + network + lease'], a: 2, why: 'pool (ช่วง IP), server (ผูกกับ interface), network (gateway/DNS/netmask) — ถ้าขาด network เครื่องลูกจะได้ IP แต่ออกเน็ตไม่ได้เพราะไม่มี gateway' },
        { type: 'cmd', q: 'พิมพ์คำสั่งเพิ่ม default route ออกทาง gateway <code>203.0.113.1</code>', ans: ['/ip route add dst-address=0.0.0.0/0 gateway=203.0.113.1', 'ip route add dst-address=0.0.0.0/0 gateway=203.0.113.1', '/ip route add gateway=203.0.113.1 dst-address=0.0.0.0/0'], why: 'dst-address=0.0.0.0/0 คือ "ทุกปลายทางที่ไม่รู้จัก" — route ที่ใช้งานได้จะมี flag A (active) และ S (static)' },
        { type: 'mcq', q: 'ตั้ง <code>allow-remote-requests=yes</code> ที่ /ip dns แล้วต้องระวังอะไร', opts: ['กิน RAM มาก', 'router อาจถูกใช้เป็น DNS amplification attack ถ้าไม่บล็อกพอร์ต 53 จาก WAN', 'ทำให้ DHCP ไม่ทำงาน', 'ต้องรีบูตทุกครั้ง'], a: 1, why: 'ต้องมี firewall filter บล็อก udp/tcp 53 ที่ chain=input จากฝั่ง WAN เสมอ' },
        { type: 'mcq', q: 'ความต่างระหว่าง masquerade กับ src-nat คืออะไร', opts: ['masquerade ใช้กับ IPv6 เท่านั้น', 'masquerade เลือก IP ของ out-interface อัตโนมัติ ส่วน src-nat ระบุ IP ตายตัว', 'src-nat ทำงานที่ chain dstnat', 'ไม่ต่างกันเลย'], a: 1, why: 'masquerade เหมาะกับ WAN ที่ IP เปลี่ยน (DHCP/PPPoE) แต่กิน CPU มากกว่าเล็กน้อยเพราะต้องเช็ก IP ทุกครั้ง' },
        { type: 'multi', q: 'สิ่งที่ต้องมีเพื่อให้เครื่องใน LAN ออกอินเทอร์เน็ตได้ (เลือกทุกข้อที่จำเป็น)', opts: ['default route ออก WAN', 'NAT masquerade ที่ chain srcnat', 'DNS server ที่ใช้งานได้', 'OSPF ระหว่าง router'], a: [0, 1, 2], why: 'OSPF เป็น dynamic routing protocol ที่ไม่จำเป็นสำหรับ router ตัวเดียวออกเน็ต' },
      ],
      labs: [{
        id: 'mr-l2-internet',
        title: 'Lab 2 — ทำให้สำนักงานออกอินเทอร์เน็ตได้',
        brief: 'ether1 ต่อกับ ISP (รับ IP อัตโนมัติ) ether2 เป็น LAN ต้องตั้งค่าให้เครื่องใน LAN ได้ IP อัตโนมัติและออกอินเทอร์เน็ตได้',
        device: 'mikrotik',
        tasks: [
          { t: 'ตั้ง <code>ether1</code> เป็น DHCP client (disabled=no)', hint: '/ip dhcp-client add interface=ether1 disabled=no', check: s => T(s, 'ip dhcp-client').some(r => r.interface === 'ether1' && !r.disabled) },
          { t: 'ใส่ IP <code>192.168.88.1/24</code> ให้ <code>ether2</code>', hint: '/ip address add address=192.168.88.1/24 interface=ether2', check: s => T(s, 'ip address').some(r => r.address === '192.168.88.1/24' && r.interface === 'ether2') },
          { t: 'สร้าง IP pool ชื่อ <code>dhcp_lan</code> ช่วง <code>192.168.88.100-192.168.88.200</code>', hint: '/ip pool add name=dhcp_lan ranges=192.168.88.100-192.168.88.200', check: s => T(s, 'ip pool').some(r => r.name === 'dhcp_lan' && r.ranges.replace(/\s/g, '') === '192.168.88.100-192.168.88.200') },
          { t: 'สร้าง DHCP server ชื่อ <code>dhcp1</code> บน <code>ether2</code> ใช้ pool <code>dhcp_lan</code>', hint: '/ip dhcp-server add name=dhcp1 interface=ether2 address-pool=dhcp_lan', check: s => T(s, 'ip dhcp-server').some(r => r.name === 'dhcp1' && r.interface === 'ether2' && r['address-pool'] === 'dhcp_lan') },
          { t: 'สร้าง dhcp-server network <code>192.168.88.0/24</code> gateway <code>192.168.88.1</code> dns <code>8.8.8.8</code>', hint: '/ip dhcp-server network add address=192.168.88.0/24 gateway=192.168.88.1 dns-server=8.8.8.8', check: s => T(s, 'ip dhcp-server network').some(r => r.address === '192.168.88.0/24' && r.gateway === '192.168.88.1' && (r['dns-server'] || '').includes('8.8.8.8')) },
          { t: 'สร้าง NAT masquerade ออกทาง <code>ether1</code>', hint: '/ip firewall nat add chain=srcnat out-interface=ether1 action=masquerade', check: s => T(s, 'ip firewall nat').some(r => r.chain === 'srcnat' && r.action === 'masquerade' && r['out-interface'] === 'ether1') },
          { t: 'ตั้ง DNS server เป็น <code>8.8.8.8</code> และเปิด allow-remote-requests', hint: '/ip dns set servers=8.8.8.8 allow-remote-requests=yes', check: s => s.settings['ip dns'].servers.includes('8.8.8.8') && s.settings['ip dns']['allow-remote-requests'] === 'yes' },
          { t: 'ทดสอบ ping ออกอินเทอร์เน็ต', hint: '/ping 8.8.8.8', check: (s, h) => h.some(c => /ping\s+8\.8\.8\.8/i.test(c)) },
        ],
      }],
    },

    // =========================================================
    3: {
      title: 'Firewall, Bridge และ VLAN',
      objectives: [
        'เข้าใจ chain input / forward / output และ connection state',
        'เขียน firewall filter ที่ปลอดภัยและมีลำดับถูกต้อง',
        'ใช้ address-list และ interface-list ให้ config อ่านง่าย',
        'สร้าง bridge และ VLAN บน RouterOS',
      ],
      sections: [
        {
          t: 'Firewall Chain และ Connection State',
          h: `
<table class="tbl">
<tr><th>Chain</th><th>ใช้กับ traffic ที่</th><th>ตัวอย่าง</th></tr>
<tr><td><code>input</code></td><td>ปลายทางคือตัว router เอง</td><td>SSH/WinBox เข้ามาที่ router, DNS query มาที่ router</td></tr>
<tr><td><code>forward</code></td><td>วิ่งผ่าน router ไปที่อื่น</td><td>PC ใน LAN ออกเน็ต, LAN คุยข้าม VLAN</td></tr>
<tr><td><code>output</code></td><td>router สร้างขึ้นเอง</td><td>router ping ออกไปข้างนอก</td></tr>
</table>
<p><b>Connection state</b> — หัวใจของ firewall ยุคใหม่ ทำให้เขียนกฎน้อยลงมากและเร็วขึ้นมาก</p>
<table class="tbl">
<tr><th>State</th><th>ความหมาย</th><th>ควรทำ</th></tr>
<tr><td><code>established</code></td><td>เป็นส่วนหนึ่งของ connection ที่อนุญาตไปแล้ว</td><td>accept ไว้บนสุด</td></tr>
<tr><td><code>related</code></td><td>เกี่ยวข้องกับ connection เดิม (เช่น FTP data, ICMP error)</td><td>accept</td></tr>
<tr><td><code>new</code></td><td>เริ่มการเชื่อมต่อใหม่</td><td>พิจารณาทีละกรณี</td></tr>
<tr><td><code>invalid</code></td><td>ไม่เข้าพวก ผิดปกติ</td><td>drop เสมอ</td></tr>
</table>
<pre class="code"><span style="color:#5b6b8c"># ชุดกฎมาตรฐานสำหรับ chain=input — ลำดับสำคัญมาก อ่านจากบนลงล่าง</span>
/ip firewall filter
add chain=input connection-state=established,related action=accept comment="allow established"
add chain=input connection-state=invalid action=drop comment="drop invalid"
add chain=input protocol=icmp action=accept comment="allow ping"
add chain=input in-interface=ether2 action=accept comment="allow from LAN"
add chain=input src-address-list=admin_ip protocol=tcp dst-port=22,8291 action=accept
add chain=input action=drop comment="drop everything else"</pre>
<div class="note warn"><b>ลำดับกฎคือทุกอย่าง</b> — RouterOS อ่านจากบนลงล่าง เจอกฎแรกที่ตรงแล้วหยุด ถ้าเอา <code>action=drop</code> ไว้บนสุด จะตัดตัวเองออกจากเครื่องทันที<br>
ใช้ <b>Safe Mode (Ctrl+X ใน WinBox)</b> ทุกครั้งเมื่อแก้ firewall จากระยะไกล</div>`,
        },
        {
          t: 'Address List และ Interface List',
          h: `
<p>แทนที่จะเขียนกฎซ้ำ ๆ ต่อ IP ให้จัดกลุ่มไว้แล้วอ้างถึงทีเดียว — config สั้นลงและแก้ที่เดียว</p>
<pre class="code"><span style="color:#5b6b8c"># จัดกลุ่ม IP</span>
/ip firewall address-list
add list=admin_ip address=192.168.88.10 comment="โน้ตบุ๊กแอดมิน"
add list=admin_ip address=192.168.88.0/24
add list=blocked address=45.9.148.0/24

<span style="color:#5b6b8c"># จัดกลุ่ม interface — ใช้บ่อยมากเมื่อมีหลาย WAN</span>
/interface list add name=WAN
/interface list add name=LAN
/interface list member add list=WAN interface=ether1
/interface list member add list=LAN interface=ether2

<span style="color:#5b6b8c"># แล้วเขียนกฎแบบนี้แทน</span>
/ip firewall nat add chain=srcnat out-interface-list=WAN action=masquerade
/ip firewall filter add chain=input in-interface-list=LAN action=accept</pre>
<div class="note"><b>ลูกเล่นที่ใช้จริง:</b> address-list ตั้ง <code>timeout</code> ได้ ใช้คู่กับกฎตรวจจับ port scan เพื่อแบน IP อัตโนมัติชั่วคราว เช่น <code>action=add-src-to-address-list address-list=blocked address-list-timeout=1d</code></div>`,
        },
        {
          t: 'Bridge และ VLAN บน RouterOS',
          h: `
<p><b>Bridge</b> = รวมหลาย interface ให้เป็น switch ตัวเดียวทาง software (บนรุ่นที่มี switch chip จะ offload ลงฮาร์ดแวร์ให้)</p>
<pre class="code">/interface bridge add name=bridge1
/interface bridge port add bridge=bridge1 interface=ether2
/interface bridge port add bridge=bridge1 interface=ether3
/ip address add address=192.168.88.1/24 interface=bridge1</pre>
<p><b>VLAN — 2 วิธีที่ต้องแยกให้ออก</b></p>
<p>1) <b>VLAN interface</b> — สร้าง sub-interface ต่อ VLAN แล้วให้ router ทำ routing (เทียบได้กับ router-on-a-stick)</p>
<pre class="code">/interface vlan add name=vlan10 vlan-id=10 interface=ether1
/interface vlan add name=vlan20 vlan-id=20 interface=ether1
/ip address add address=192.168.10.1/24 interface=vlan10
/ip address add address=192.168.20.1/24 interface=vlan20</pre>
<p>2) <b>Bridge VLAN Filtering</b> — ให้ bridge ทำหน้าที่เหมือน managed switch จริง ๆ กำหนด tagged/untagged ต่อพอร์ต</p>
<pre class="code">/interface bridge add name=bridge1 vlan-filtering=no
/interface bridge port add bridge=bridge1 interface=ether2 pvid=10
/interface bridge port add bridge=bridge1 interface=ether3 pvid=20
/interface bridge port add bridge=bridge1 interface=ether1
/interface bridge vlan add bridge=bridge1 vlan-ids=10 tagged=bridge1,ether1 untagged=ether2
/interface bridge vlan add bridge=bridge1 vlan-ids=20 tagged=bridge1,ether1 untagged=ether3
<span style="color:#5b6b8c"># เปิดทีหลังสุดเสมอ ไม่งั้นตัดขาดตัวเอง</span>
/interface bridge set bridge1 vlan-filtering=yes</pre>
<div class="note warn"><b>ลำดับที่ทำให้คนหลุดจากเครื่องบ่อยที่สุด:</b> เปิด <code>vlan-filtering=yes</code> ก่อนที่จะประกาศ VLAN ให้พอร์ตที่ตัวเองต่ออยู่ — ต้องตั้ง bridge vlan ให้ครบก่อน แล้วค่อยเปิด filtering เป็นขั้นสุดท้าย</div>`,
        },
      ],
      quiz: [
        { type: 'mcq', q: 'Traffic ที่ PC ใน LAN ส่งออกไปยังเว็บภายนอก จะถูกตรวจสอบด้วย chain ใด', opts: ['input', 'forward', 'output', 'prerouting'], a: 1, why: 'forward = traffic ที่วิ่งผ่าน router ไปที่อื่น ส่วน input คือ traffic ที่ปลายทางเป็นตัว router เอง' },
        { type: 'mcq', q: 'กฎแรกสุดของ chain=input ที่แนะนำให้ใส่คืออะไร', opts: ['drop ทุกอย่าง', 'accept connection-state=established,related', 'accept ทุกอย่างจาก WAN', 'drop icmp'], a: 1, why: 'ยอมให้ traffic ของ connection ที่อนุญาตไปแล้วผ่านก่อน จะช่วยให้กฎที่เหลือตรวจเฉพาะ packet ใหม่ ลดภาระ CPU มาก' },
        { type: 'mcq', q: 'connection-state ใดที่ควร drop เสมอ', opts: ['established', 'related', 'new', 'invalid'], a: 3, why: 'invalid คือ packet ที่ไม่เข้ากับ connection ใดเลย มักเกิดจากการโจมตีหรือ packet ที่มาถึงหลัง connection ปิดไปแล้ว' },
        { type: 'cmd', q: 'พิมพ์คำสั่งสร้าง bridge ชื่อ <code>bridge1</code>', ans: ['/interface bridge add name=bridge1', 'interface bridge add name=bridge1'], why: 'bridge รวมหลาย port ให้เป็น broadcast domain เดียว เหมือน switch ทาง software' },
        { type: 'cmd', q: 'พิมพ์คำสั่งเพิ่ม <code>ether3</code> เข้าเป็นสมาชิกของ <code>bridge1</code>', ans: ['/interface bridge port add bridge=bridge1 interface=ether3', 'interface bridge port add bridge=bridge1 interface=ether3', '/interface bridge port add interface=ether3 bridge=bridge1'], why: 'เมนู /interface bridge port คือที่ผูก interface เข้ากับ bridge — interface ที่เข้า bridge แล้วจะมี flag S (slave)' },
        { type: 'mcq', q: 'เมื่อใช้ Bridge VLAN Filtering ควรเปิด <code>vlan-filtering=yes</code> เมื่อใด', opts: ['ก่อนสร้าง bridge vlan เพื่อความปลอดภัย', 'หลังจากประกาศ tagged/untagged ครบทุก VLAN แล้ว', 'ตอนไหนก็ได้ ไม่มีผล', 'ต้องเปิดพร้อมกับสร้าง bridge'], a: 1, why: 'ถ้าเปิดก่อน พอร์ตที่คุณต่ออยู่จะยังไม่ถูกประกาศใน VLAN ใด traffic จะถูกทิ้งและคุณจะหลุดจากเครื่องทันที' },
        { type: 'mcq', q: 'ประโยชน์หลักของ address-list คืออะไร', opts: ['ทำให้ router เร็วขึ้น 10 เท่า', 'จัดกลุ่ม IP เพื่ออ้างถึงในกฎเดียว แก้ที่เดียวมีผลทุกกฎ และตั้ง timeout อัตโนมัติได้', 'ใช้แทน DHCP', 'บันทึก log ของ IP'], a: 1, why: 'ลดจำนวนกฎ ทำให้ config อ่านง่าย และใช้คู่กับ add-src-to-address-list เพื่อแบน IP อัตโนมัติได้' },
        { type: 'multi', q: 'ข้อใดควรทำเมื่อแก้ firewall จากระยะไกล (เลือกทุกข้อที่ถูก)', opts: ['เปิด Safe Mode ด้วย Ctrl+X ใน WinBox', 'ใส่กฎ drop all ไว้บนสุดก่อน', 'ตั้ง scheduler ให้ reboot อัตโนมัติเผื่อหลุด', 'ใส่กฎ accept สำหรับ IP ของตัวเองก่อนกฎ drop'], a: [0, 2, 3], why: 'การใส่ drop all ไว้บนสุดคือวิธีตัดขาดตัวเองที่เร็วที่สุด — กฎ drop ต้องอยู่ล่างสุดเสมอ' },
      ],
      labs: [{
        id: 'mr-l3-firewall',
        title: 'Lab 3 — วาง Firewall Baseline และ VLAN',
        brief: 'จัด firewall ให้ router ปลอดภัย: ปิดไม่ให้เข้าจาก WAN ยกเว้นสิ่งที่จำเป็น และแยกวง Guest ออกเป็น VLAN 20',
        device: 'mikrotik',
        tasks: [
          { t: 'สร้าง interface list ชื่อ <code>WAN</code>', hint: '/interface list add name=WAN', check: s => T(s, 'interface list').some(r => r.name === 'WAN') },
          { t: 'เพิ่ม <code>ether1</code> เป็นสมาชิกของ list <code>WAN</code>', hint: '/interface list member add list=WAN interface=ether1', check: s => T(s, 'interface list member').some(r => r.list === 'WAN' && r.interface === 'ether1') },
          { t: 'สร้าง address-list ชื่อ <code>admin_ip</code> สำหรับ <code>192.168.88.10</code>', hint: '/ip firewall address-list add list=admin_ip address=192.168.88.10', check: s => T(s, 'ip firewall address-list').some(r => r.list === 'admin_ip' && r.address === '192.168.88.10') },
          { t: 'เพิ่มกฎ input: accept <code>established,related</code>', hint: '/ip firewall filter add chain=input connection-state=established,related action=accept', check: s => T(s, 'ip firewall filter').some(r => r.chain === 'input' && r.action === 'accept' && /established/.test(r['connection-state'] || '')) },
          { t: 'เพิ่มกฎ input: drop <code>invalid</code>', hint: '/ip firewall filter add chain=input connection-state=invalid action=drop', check: s => T(s, 'ip firewall filter').some(r => r.chain === 'input' && r.action === 'drop' && /invalid/.test(r['connection-state'] || '')) },
          { t: 'เพิ่มกฎ input สุดท้าย: drop ทุกอย่างที่เหลือ', hint: '/ip firewall filter add chain=input action=drop', check: s => T(s, 'ip firewall filter').some(r => r.chain === 'input' && r.action === 'drop' && !r['connection-state']) },
          { t: 'สร้าง bridge ชื่อ <code>bridge1</code>', hint: '/interface bridge add name=bridge1', check: s => T(s, 'interface bridge').some(r => r.name === 'bridge1') },
          { t: 'สร้าง VLAN interface ชื่อ <code>vlan20</code> vlan-id 20 บน <code>bridge1</code>', hint: '/interface vlan add name=vlan20 vlan-id=20 interface=bridge1', check: s => T(s, 'interface vlan').some(r => r.name === 'vlan20' && String(r['vlan-id']) === '20' && r.interface === 'bridge1') },
          { t: 'ใส่ IP <code>192.168.20.1/24</code> ให้ <code>vlan20</code>', hint: '/ip address add address=192.168.20.1/24 interface=vlan20', check: s => T(s, 'ip address').some(r => r.address === '192.168.20.1/24' && r.interface === 'vlan20') },
        ],
      }],
    },

    // =========================================================
    4: {
      title: 'Routing, QoS, VPN และการดูแลระบบ',
      objectives: [
        'ตั้ง static route แบบมี failover และเข้าใจ OSPF พื้นฐาน',
        'จัดการแบนด์วิดท์ด้วย Simple Queue และ Queue Tree',
        'สร้าง VPN site-to-site และ remote access ได้',
        'ทำ backup / upgrade / monitoring อย่างปลอดภัย',
      ],
      sections: [
        {
          t: 'Routing และ Failover',
          h: `
<pre class="code"><span style="color:#5b6b8c"># Dual WAN แบบ failover — distance ต่ำกว่าถูกใช้ก่อน</span>
/ip route add dst-address=0.0.0.0/0 gateway=203.0.113.1 distance=1 check-gateway=ping
/ip route add dst-address=0.0.0.0/0 gateway=198.51.100.1 distance=2 check-gateway=ping

<span style="color:#5b6b8c"># Static route ไปยัง subnet ปลายทางเฉพาะ</span>
/ip route add dst-address=10.20.0.0/16 gateway=10.0.0.2</pre>
<div class="note"><b><code>check-gateway=ping</code></b> ทำให้ RouterOS ping gateway เป็นระยะ ถ้าไม่ตอบจะถอน route นั้นออกและสลับไปเส้นสำรองอัตโนมัติ — จำเป็นมากในดีไซน์ dual WAN เพราะ "ลิงก์ยัง up แต่เน็ตล่ม" เป็นกรณีที่พบบ่อยที่สุด</div>
<p><b>OSPF</b> ใช้เมื่อมี router หลายตัวและไม่อยากมานั่งเขียน static route ทีละเส้น</p>
<pre class="code">/routing ospf instance add name=default router-id=10.0.0.1
/routing ospf area add name=backbone area-id=0.0.0.0 instance=default
/routing ospf interface-template add interfaces=ether2 area=backbone
/routing ospf neighbor print</pre>
<table class="tbl">
<tr><th>เลือกใช้</th><th>เมื่อ</th></tr>
<tr><td>Static</td><td>router น้อย โครงสร้างนิ่ง ต้องการควบคุมเต็มที่</td></tr>
<tr><td>OSPF</td><td>ภายในองค์กร หลายสาขา ต้องการ converge อัตโนมัติ</td></tr>
<tr><td>BGP</td><td>เชื่อมกับ ISP หลายราย มี AS เป็นของตัวเอง หรือทำ ISP เอง</td></tr>
</table>`,
        },
        {
          t: 'QoS — Simple Queue และ Queue Tree',
          h: `
<pre class="code"><span style="color:#5b6b8c"># จำกัดแบนด์วิดท์ผู้ใช้รายเครื่อง (upload/download)</span>
/queue simple add name=guest-limit target=192.168.20.0/24 max-limit=10M/50M

<span style="color:#5b6b8c"># การันตีขั้นต่ำให้ห้องประชุม (limit-at) พร้อมเพดานสูงสุด (max-limit)</span>
/queue simple add name=meeting target=192.168.88.50/32 limit-at=20M/20M max-limit=100M/100M priority=1/1</pre>
<table class="tbl">
<tr><th>พารามิเตอร์</th><th>ความหมาย</th></tr>
<tr><td><code>max-limit</code></td><td>เพดานสูงสุด เขียนเป็น upload/download</td></tr>
<tr><td><code>limit-at</code></td><td>แบนด์วิดท์ที่การันตีให้เสมอแม้เน็ตเต็ม</td></tr>
<tr><td><code>priority</code></td><td>1 = สำคัญสุด, 8 = ต่ำสุด ใช้เมื่อแย่งแบนด์วิดท์กัน</td></tr>
<tr><td><code>queue=pcq-...</code></td><td>PCQ = แบ่งเท่า ๆ กันอัตโนมัติต่อผู้ใช้ เหมาะกับ hotspot/หอพัก</td></tr>
</table>
<div class="note"><b>Simple Queue vs Queue Tree</b><br>
Simple Queue — ตั้งง่าย เรียงตามลำดับ เหมาะกับการจำกัดรายเครื่อง/รายวง<br>
Queue Tree — ทำงานร่วมกับ mangle packet-mark ยืดหยุ่นกว่ามาก จัดลำดับตามชนิด traffic (VoIP ก่อน, ดาวน์โหลดทีหลัง) เหมาะกับงาน QoS จริงจัง</div>`,
        },
        {
          t: 'VPN และการดูแลระบบ',
          h: `
<p><b>WireGuard</b> (RouterOS 7) — เร็วที่สุด ตั้งง่ายที่สุด แนะนำสำหรับงานใหม่</p>
<pre class="code">/interface wireguard add name=wg0 listen-port=13231
/interface wireguard print                       <span style="color:#5b6b8c"># คัดลอก public-key ไปให้ฝั่งตรงข้าม</span>
/interface wireguard peers add interface=wg0 public-key="AbC..." \\
    allowed-address=10.99.0.2/32,192.168.20.0/24
/ip address add address=10.99.0.1/24 interface=wg0</pre>
<p><b>IPsec site-to-site</b> — ใช้เมื่อต้องเชื่อมกับอุปกรณ์ยี่ห้ออื่น (Fortinet, Cisco, Sophos)</p>
<table class="tbl">
<tr><th>VPN</th><th>ข้อดี</th><th>ข้อควรรู้</th></tr>
<tr><td>WireGuard</td><td>เร็ว เบา config สั้น</td><td>ต้องแลก public key ทั้งสองฝั่ง</td></tr>
<tr><td>IPsec</td><td>มาตรฐาน คุยข้ามยี่ห้อได้</td><td>config ยาว ต้องตรงกันทุกพารามิเตอร์</td></tr>
<tr><td>OVPN</td><td>ผ่าน firewall ได้ดี (TCP 443)</td><td>ช้ากว่า ใช้ CPU สูง</td></tr>
<tr><td>L2TP/IPsec</td><td>Windows/iOS ต่อได้โดยไม่ต้องลงแอป</td><td>ต้องเปิด UDP 500/1701/4500</td></tr>
</table>
<p><b>งานดูแลประจำที่ต้องทำ:</b></p>
<pre class="code"><span style="color:#5b6b8c"># สำรองอัตโนมัติทุกวันตี 2</span>
/system scheduler add name=daily-backup interval=1d start-time=02:00:00 \\
    on-event="/system backup save name=auto-backup"

<span style="color:#5b6b8c"># เฝ้าดูปลายทาง ถ้าล่มให้ทำอะไรบางอย่าง</span>
/tool netwatch add host=8.8.8.8 interval=30s \\
    down-script="/log warning \\"WAN down\\""

<span style="color:#5b6b8c"># อัปเกรด — ต้องทำทั้ง RouterOS และ RouterBOOT</span>
/system package update check-for-updates
/system package update install
/system routerboard upgrade</pre>
<div class="note warn"><b>ก่อนอัปเกรดทุกครั้ง:</b> backup + export, อ่าน changelog, และอย่าข้ามเวอร์ชันหลักหลายขั้น (เช่น 6.x → 7.x ต้องอ่าน migration guide เพราะเมนู routing เปลี่ยนโครงสร้าง)</div>`,
        },
      ],
      quiz: [
        { type: 'mcq', q: 'ใน dual WAN ที่ตั้ง distance=1 และ distance=2 route ใดถูกใช้งาน', opts: ['ทั้งสองพร้อมกันแบบ load balance', 'distance=1 ถูกใช้ก่อน ส่วน distance=2 เป็นสำรอง', 'distance=2 เพราะค่าสูงกว่า', 'สลับกันทุก 30 วินาที'], a: 1, why: 'distance คือ administrative distance ค่าต่ำกว่าถูกเลือกก่อน ถ้าอยากทำ load balance ต้องตั้ง distance เท่ากัน (ECMP)' },
        { type: 'mcq', q: '<code>check-gateway=ping</code> มีประโยชน์อย่างไร', opts: ['เพิ่มความเร็วของ route', 'ตรวจสอบว่า gateway ยังตอบสนอง ถ้าไม่ตอบจะถอน route และสลับไปเส้นสำรอง', 'บันทึก log การ ping', 'บล็อก ICMP'], a: 1, why: 'แก้ปัญหา "ลิงก์ยัง up แต่เน็ตล่ม" ซึ่ง static route ธรรมดาตรวจไม่เจอเพราะดูแค่ว่า interface ยัง up' },
        { type: 'mcq', q: 'ใน Simple Queue พารามิเตอร์ <code>limit-at</code> หมายถึงอะไร', opts: ['เพดานสูงสุดที่ใช้ได้', 'แบนด์วิดท์ขั้นต่ำที่การันตีให้แม้ตอนเน็ตเต็ม', 'จำนวน connection สูงสุด', 'เวลาที่จำกัดความเร็ว'], a: 1, why: 'limit-at = การันตีขั้นต่ำ, max-limit = เพดานสูงสุด — ใช้คู่กันเพื่อให้บริการสำคัญไม่ถูกแย่งแบนด์วิดท์' },
        { type: 'mcq', q: 'VPN ชนิดใดที่ RouterOS 7 รองรับและเร็วที่สุดสำหรับ site-to-site ระหว่าง MikroTik ด้วยกัน', opts: ['PPTP', 'WireGuard', 'L2TP ธรรมดา', 'GRE'], a: 1, why: 'WireGuard ใช้ crypto สมัยใหม่ โค้ดเล็ก overhead ต่ำ ส่วน PPTP ไม่ปลอดภัยแล้วและไม่ควรใช้งาน' },
        { type: 'cmd', q: 'พิมพ์คำสั่งเพิ่ม default route ที่มี distance=2 ผ่าน gateway <code>198.51.100.1</code>', ans: ['/ip route add dst-address=0.0.0.0/0 gateway=198.51.100.1 distance=2', 'ip route add dst-address=0.0.0.0/0 gateway=198.51.100.1 distance=2'], why: 'distance สูงกว่าจะถูกใช้ก็ต่อเมื่อเส้นที่ distance ต่ำกว่าใช้งานไม่ได้' },
        { type: 'multi', q: 'ก่อนอัปเกรด RouterOS ควรทำอะไรบ้าง (เลือกทุกข้อที่ถูก)', opts: ['สำรอง config ด้วย backup และ export', 'อ่าน changelog ของเวอร์ชันเป้าหมาย', 'อัปเกรด RouterBOOT ด้วยหลังอัปเกรด RouterOS', 'ลบ firewall ทั้งหมดก่อน'], a: [0, 1, 2], why: 'การลบ firewall ก่อนอัปเกรดคือการเปิดเครื่องให้โลกภายนอกโดยไม่จำเป็น ส่วน RouterBOOT (bootloader) ควรอัปตามให้ตรงเวอร์ชัน' },
        { type: 'mcq', q: 'ควรใช้ OSPF แทน static route เมื่อใด', opts: ['เมื่อมี router ตัวเดียว', 'เมื่อมี router หลายตัว/หลายสาขา และต้องการให้เส้นทางปรับตัวเองอัตโนมัติ', 'เมื่อต้องการความปลอดภัยสูงสุด', 'เมื่อเชื่อมกับ ISP หลายราย'], a: 1, why: 'OSPF เหมาะกับภายในองค์กรที่มีหลาย router ส่วนการเชื่อมกับ ISP หลายรายด้วย AS ของตัวเองเป็นงานของ BGP' },
      ],
      labs: [{
        id: 'mr-l4-ops',
        title: 'Lab 4 — Dual WAN, QoS และงานดูแลระบบ',
        brief: 'เพิ่มลิงก์สำรอง จำกัดแบนด์วิดท์วง Guest ตั้งเฝ้าระวังปลายทาง และตั้ง backup อัตโนมัติ',
        device: 'mikrotik',
        tasks: [
          { t: 'เพิ่ม default route หลัก gateway <code>203.0.113.1</code> distance 1', hint: '/ip route add dst-address=0.0.0.0/0 gateway=203.0.113.1 distance=1', check: s => T(s, 'ip route').some(r => r['dst-address'] === '0.0.0.0/0' && r.gateway === '203.0.113.1' && String(r.distance) === '1') },
          { t: 'เพิ่ม default route สำรอง gateway <code>198.51.100.1</code> distance 2', hint: '/ip route add dst-address=0.0.0.0/0 gateway=198.51.100.1 distance=2', check: s => T(s, 'ip route').some(r => r['dst-address'] === '0.0.0.0/0' && r.gateway === '198.51.100.1' && String(r.distance) === '2') },
          { t: 'เพิ่ม static route ไป <code>10.20.0.0/16</code> ผ่าน <code>10.0.0.2</code>', hint: '/ip route add dst-address=10.20.0.0/16 gateway=10.0.0.2', check: s => T(s, 'ip route').some(r => r['dst-address'] === '10.20.0.0/16' && r.gateway === '10.0.0.2') },
          { t: 'สร้าง simple queue ชื่อ <code>guest-limit</code> target <code>192.168.20.0/24</code> max-limit <code>10M/50M</code>', hint: '/queue simple add name=guest-limit target=192.168.20.0/24 max-limit=10M/50M', check: s => T(s, 'queue simple').some(r => r.name === 'guest-limit' && r.target === '192.168.20.0/24' && r['max-limit'] === '10M/50M') },
          { t: 'ตั้ง netwatch เฝ้าดู <code>8.8.8.8</code>', hint: '/tool netwatch add host=8.8.8.8', check: s => T(s, 'tool netwatch').some(r => r.host === '8.8.8.8') },
          { t: 'สร้าง scheduler ชื่อ <code>daily-backup</code> interval <code>1d</code>', hint: '/system scheduler add name=daily-backup interval=1d on-event="/system backup save name=auto"', check: s => T(s, 'system scheduler').some(r => r.name === 'daily-backup' && String(r.interval) === '1d') },
          { t: 'สร้าง user <code>noc</code> group <code>full</code>', hint: '/user add name=noc group=full', check: s => T(s, 'user').some(r => r.name === 'noc' && r.group === 'full') },
        ],
      }],
    },

    // =========================================================
    5: {
      title: 'ออกแบบระดับ ISP/Enterprise และ Automation',
      objectives: [
        'ออกแบบ high availability ด้วย VRRP และ dual-homing',
        'เข้าใจ BGP เบื้องต้นสำหรับงาน multi-homing',
        'ทำ hardening ระดับ production ให้ RouterOS',
        'เขียน script และวางระบบ monitoring/centralized management',
      ],
      sections: [
        {
          t: 'High Availability ด้วย VRRP',
          h: `
<p>ให้ router 2 ตัวแชร์ virtual IP เดียวกันเป็น gateway ของ LAN ถ้าตัวหลักดับ ตัวสำรองรับช่วงภายในไม่กี่วินาที</p>
<pre class="code"><span style="color:#5b6b8c"># --- Router A (Master) ---</span>
/interface vrrp add name=vrrp-lan interface=bridge1 vrid=10 priority=200 \\
    preemption-mode=yes interval=1s
/ip address add address=192.168.88.1/24 interface=vrrp-lan

<span style="color:#5b6b8c"># --- Router B (Backup) ---</span>
/interface vrrp add name=vrrp-lan interface=bridge1 vrid=10 priority=100 preemption-mode=yes
/ip address add address=192.168.88.1/24 interface=vrrp-lan</pre>
<div class="note"><b>สิ่งที่ต้องคิดต่อนอกจาก VRRP</b><br>
• <b>State sync</b> — connection tracking และ DHCP lease ไม่ sync กันเอง ต้องออกแบบว่า failover แล้ว session จะขาดหรือไม่<br>
• <b>ทำไมถึง failover</b> — ควรผูก VRRP กับสถานะ WAN ไม่ใช่แค่ดูว่า router ยังมีไฟ<br>
• <b>Split-brain</b> — ถ้าลิงก์ระหว่างสองตัวขาด ทั้งคู่จะคิดว่าตัวเองเป็น master ต้องมีเส้นทางตรวจสอบสำรอง</div>`,
        },
        {
          t: 'BGP และ Multi-homing',
          h: `
<p>ใช้เมื่อองค์กร/ISP มี <b>AS number</b> และ <b>IP block</b> ของตัวเอง แล้วต่อกับ ISP มากกว่าหนึ่งราย</p>
<pre class="code">/routing bgp connection
add name=to-ISP1 remote.address=203.0.113.1 remote.as=64500 \\
    local.role=ebgp as=65001 router-id=10.0.0.1 \\
    output.network=bgp-networks

/routing bgp connection print
/routing bgp session print       <span style="color:#5b6b8c"># state ต้องเป็น established</span>
/ip route print where bgp</pre>
<table class="tbl">
<tr><th>คุมทิศทาง</th><th>ใช้อะไร</th><th>ทำงานอย่างไร</th></tr>
<tr><td>ขาออก (เราเลือกทางออก)</td><td><code>local-pref</code></td><td>ค่าสูงชนะ ใช้ภายใน AS เดียวกัน</td></tr>
<tr><td>ขาเข้า (คนอื่นเลือกทางเข้าหาเรา)</td><td><code>AS-path prepend</code></td><td>ต่อ AS ตัวเองซ้ำหลายครั้ง ทำให้เส้นทางนั้นดู "ไกล" กว่า</td></tr>
<tr><td>ขาเข้าแบบละเอียด</td><td><code>MED</code> / community</td><td>ต้องตกลงกับ ISP ล่วงหน้า</td></tr>
</table>
<div class="note warn"><b>กฎเหล็กของ BGP:</b> ต้องกรอง prefix ทั้งขาเข้าและขาออกเสมอ การประกาศ prefix ผิดพลาดโดยไม่มี filter คือสาเหตุของเหตุการณ์ "BGP hijack" ที่ทำให้ traffic ของคนทั้งภูมิภาควิ่งผิดทาง</div>`,
        },
        {
          t: 'Hardening, Scripting และ Monitoring',
          h: `
<pre class="code"><span style="color:#5b6b8c"># --- Hardening baseline ที่ควรทำทุกเครื่อง ---</span>
/user set admin name=netadmin password="ยาวและซับซ้อน"
/ip service disable telnet,ftp,www,api
/ip service set ssh port=2222
/ip service set winbox address=192.168.88.0/24
/ip neighbor discovery-settings set discover-interface-list=LAN
/tool mac-server set allowed-interface-list=LAN
/tool mac-server mac-winbox set allowed-interface-list=LAN
/ip firewall service-port disable sip,ftp
/system note set show-at-login=yes note="Authorized personnel only"</pre>
<table class="tbl">
<tr><th>ต้องปิด/จำกัด</th><th>เหตุผล</th></tr>
<tr><td>Telnet, FTP, HTTP (www)</td><td>ส่งรหัสผ่านเป็น plaintext</td></tr>
<tr><td>MAC-Telnet / MAC-WinBox บน WAN</td><td>เข้าถึงได้โดยไม่ต้องมี IP ข้าม firewall ชั้น IP ทั้งหมด</td></tr>
<tr><td>Neighbor discovery (CDP/MNDP) บน WAN</td><td>เปิดเผยรุ่น/เวอร์ชันให้คนนอกเห็น</td></tr>
<tr><td>API บน public</td><td>เป้าหมาย brute force ยอดนิยม</td></tr>
</table>
<p><b>Scripting</b> — RouterOS มีภาษาสคริปต์ในตัว ใช้คู่กับ scheduler หรือ netwatch</p>
<pre class="code">/system script add name=wan-check source={
  :local gw "203.0.113.1";
  :if ([/ping $gw count=3] = 0) do={
    :log error "WAN gateway ไม่ตอบสนอง - สลับไปเส้นสำรอง";
    /ip route disable [find gateway=$gw];
  } else={
    /ip route enable [find gateway=$gw];
  }
}
/system scheduler add name=wan-monitor interval=1m on-event=wan-check</pre>
<p><b>Monitoring ที่ควรมี:</b> SNMP ส่งเข้า Zabbix/LibreNMS · syslog รวมศูนย์ (<code>/system logging action add target=remote remote=10.10.10.60</code>) · The Dude สำหรับ topology map · Netwatch สำหรับ probe แบบง่าย</p>`,
        },
      ],
      quiz: [
        { type: 'mcq', q: 'ใน VRRP router ตัวใดจะเป็น master', opts: ['ตัวที่บูตก่อน', 'ตัวที่มี priority สูงกว่า', 'ตัวที่มี IP ต่ำกว่า', 'สุ่มเลือก'], a: 1, why: 'priority สูงกว่าชนะ (ค่าปริยาย 100) และควรตั้ง preemption-mode=yes เพื่อให้ตัวหลักยึดบทบาทคืนเมื่อกลับมา' },
        { type: 'mcq', q: 'ปัญหา split-brain ใน VRRP คืออะไร', opts: ['router ทั้งสองตัวปิดพร้อมกัน', 'ลิงก์ระหว่าง router ขาด ทำให้ทั้งคู่คิดว่าตัวเองเป็น master', 'IP virtual ซ้ำกับเครื่องอื่น', 'priority ตั้งเท่ากัน'], a: 1, why: 'เมื่อทั้งคู่เป็น master พร้อมกันจะเกิด IP/MAC ซ้ำในวง ทำให้ traffic กระเด็นไปมา — ต้องมีเส้นทางตรวจสอบสถานะสำรอง' },
        { type: 'mcq', q: 'ต้องการให้ ISP รายที่สองเป็นเส้นทางขาเข้าสำรอง (คนอื่นควรเข้าหาเราทาง ISP1 ก่อน) ควรใช้เทคนิคใด', opts: ['เพิ่ม local-pref บน ISP2', 'ทำ AS-path prepend บนเส้นที่ประกาศออกทาง ISP2', 'ลด MTU', 'ปิด BGP บน ISP2'], a: 1, why: 'local-pref คุมได้เฉพาะขาออกภายใน AS ของเรา ส่วนขาเข้าต้องทำให้เส้นทางดูยาวขึ้นด้วยการ prepend AS ตัวเองซ้ำ' },
        { type: 'multi', q: 'ข้อใดควรทำใน hardening baseline ของ RouterOS (เลือกทุกข้อที่ถูก)', opts: ['ปิด telnet, ftp, www และ api ที่ไม่ใช้', 'จำกัด winbox ให้เข้าได้เฉพาะ subnet ของแอดมิน', 'จำกัด MAC-server ให้ทำงานเฉพาะ interface-list LAN', 'เปิด neighbor discovery ทุก interface เพื่อความสะดวก'], a: [0, 1, 2], why: 'Neighbor discovery (MNDP/CDP) บนฝั่ง WAN จะเปิดเผยรุ่นและเวอร์ชันของอุปกรณ์ให้ผู้โจมตีเห็น ควรจำกัดเฉพาะ LAN' },
        { type: 'mcq', q: 'ทำไม MAC-Telnet / MAC-WinBox ถึงอันตรายถ้าเปิดไว้บนฝั่ง WAN', opts: ['กินแบนด์วิดท์มาก', 'เข้าถึงอุปกรณ์ได้ที่ระดับ Layer 2 โดยข้าม firewall ชั้น IP ทั้งหมด', 'ทำให้ MAC address เปลี่ยน', 'ไม่รองรับ IPv6'], a: 1, why: 'MAC-server ทำงานที่ Layer 2 ทำให้ firewall filter ที่เขียนไว้ระดับ IP ไม่มีผล จึงต้องจำกัดด้วย allowed-interface-list เท่านั้น' },
        { type: 'mcq', q: 'ใน RouterOS ควรใช้อะไรเพื่อรันสคริปต์ทุก 1 นาที', opts: ['/system scheduler', '/system script เพียงอย่างเดียว', '/tool traffic-monitor', '/system watchdog'], a: 0, why: 'script เก็บโค้ดไว้เฉย ๆ ต้องมี scheduler (interval หรือ start-time) เป็นตัวเรียกใช้ หรือให้ netwatch เรียกเมื่อสถานะเปลี่ยน' },
        { type: 'multi', q: 'สิ่งที่ VRRP ไม่ได้ทำให้อัตโนมัติ และต้องออกแบบเพิ่ม (เลือกทุกข้อที่ถูก)', opts: ['Sync connection tracking ระหว่างสองตัว', 'Sync DHCP lease', 'เลือก master จาก priority', 'ตรวจสอบว่า WAN ยังใช้งานได้จริง'], a: [0, 1, 3], why: 'VRRP ดูแค่ว่า peer ยังส่ง advertisement อยู่ไหม ไม่ได้ดูสถานะ WAN และไม่ sync state ใด ๆ ให้' },
      ],
      labs: [{
        id: 'mr-l5-hardening',
        title: 'Lab 5 — Hardening RouterOS ก่อนขึ้น Production',
        brief: 'Router กำลังจะติดตั้งที่สาขาใหม่ที่มี public IP ต้องทำ hardening ตาม baseline ก่อนส่งมอบ',
        device: 'mikrotik',
        tasks: [
          { t: 'เปลี่ยนชื่ออุปกรณ์เป็น <code>RTR-BRANCH-01</code>', hint: '/system identity set name=RTR-BRANCH-01', check: s => s.settings['system identity'].name === 'RTR-BRANCH-01' },
          { t: 'สร้าง user ใหม่ <code>netadmin</code> group <code>full</code>', hint: '/user add name=netadmin group=full', check: s => T(s, 'user').some(r => r.name === 'netadmin' && r.group === 'full') },
          { t: 'ปิดบริการ telnet (ตั้ง disabled=yes ที่ ip service)', hint: '/ip service print แล้ว /ip service set [find name=telnet] disabled=yes', check: s => T(s, 'ip service').some(r => r.name === 'telnet' && (r.disabled === true || r.disabled === 'yes')) },
          { t: 'ปิดบริการ ftp', hint: '/ip service set [find name=ftp] disabled=yes', check: s => T(s, 'ip service').some(r => r.name === 'ftp' && (r.disabled === true || r.disabled === 'yes')) },
          { t: 'ปิดบริการ www (HTTP)', hint: '/ip service set [find name=www] disabled=yes', check: s => T(s, 'ip service').some(r => r.name === 'www' && (r.disabled === true || r.disabled === 'yes')) },
          { t: 'เปลี่ยนพอร์ต SSH เป็น <code>2222</code>', hint: '/ip service set [find name=ssh] port=2222', check: s => T(s, 'ip service').some(r => r.name === 'ssh' && String(r.port) === '2222') },
          { t: 'สร้าง address-list <code>mgmt</code> สำหรับ <code>192.168.88.0/24</code>', hint: '/ip firewall address-list add list=mgmt address=192.168.88.0/24', check: s => T(s, 'ip firewall address-list').some(r => r.list === 'mgmt' && r.address === '192.168.88.0/24') },
          { t: 'เพิ่มกฎ firewall input อนุญาต SSH/WinBox เฉพาะจาก address-list <code>mgmt</code>', hint: '/ip firewall filter add chain=input src-address-list=mgmt protocol=tcp dst-port=2222,8291 action=accept', check: s => T(s, 'ip firewall filter').some(r => r.chain === 'input' && r.action === 'accept' && r['src-address-list'] === 'mgmt') },
          { t: 'เพิ่มกฎ input drop ปิดท้าย', hint: '/ip firewall filter add chain=input action=drop', check: s => T(s, 'ip firewall filter').some(r => r.chain === 'input' && r.action === 'drop' && !r['connection-state'] && !r['src-address-list']) },
          { t: 'ตรวจสอบ config ทั้งหมดด้วย export', hint: '/export', check: (s, h) => h.some(c => /^\/?export/i.test(c.trim())) },
        ],
      }],
    },
  },
};
