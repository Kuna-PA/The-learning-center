const T = (s, p) => s.tables[p] || [];
const hasVlan = (s, id) => T(s, 'interface bridge vlan').some(r => String(r['vlan-ids']).split(',').includes(String(id)));

export default {
  id: 'mikrotik-switch',
  name: 'MikroTik Switch',
  icon: '🧩',
  device: 'mikrotik-sw',
  sub: 'CRS / CSS — RouterOS &amp; SwOS',
  desc: 'สวิตช์ตระกูล CRS/CSS: bridge, VLAN filtering, hardware offload, RSTP, bonding, port isolation และการเชื่อมกับสวิตช์ยี่ห้ออื่น',

  levels: {
    // =========================================================
    1: {
      title: 'รู้จักสวิตช์ MikroTik และการเข้าถึง',
      objectives: [
        'แยกความต่างระหว่าง CSS / CRS / RouterOS / SwOS ได้',
        'เข้าใจบทบาทของ switch chip และผลต่อประสิทธิภาพ',
        'ตั้ง IP management และเข้าถึงอุปกรณ์ได้',
        'อ่านสถานะพอร์ตและ SFP module เป็น',
      ],
      sections: [
        {
          t: 'CSS vs CRS และ SwOS vs RouterOS',
          h: `
<table class="tbl">
<tr><th></th><th>CSS (Cloud Smart Switch)</th><th>CRS (Cloud Router Switch)</th></tr>
<tr><td>ระบบปฏิบัติการ</td><td>SwOS (บางรุ่นมี RouterOS ด้วย)</td><td>RouterOS (สลับไป SwOS ได้ในบางรุ่น)</td></tr>
<tr><td>ความสามารถ</td><td>สวิตช์ L2 เป็นหลัก</td><td>สวิตช์ + ทำ routing / firewall ได้</td></tr>
<tr><td>เหมาะกับ</td><td>งาน L2 ล้วน ราคาประหยัด</td><td>งานที่ต้องการ L3 หรือฟีเจอร์ RouterOS</td></tr>
</table>
<table class="tbl">
<tr><th></th><th>SwOS</th><th>RouterOS</th></tr>
<tr><td>หน้าตา</td><td>เว็บอย่างเดียว เรียบง่าย</td><td>WinBox / CLI / API เต็มรูปแบบ</td></tr>
<tr><td>ตั้ง VLAN</td><td>ตารางเดียวจบ ตรงไปตรงมา</td><td>bridge vlan filtering ยืดหยุ่นกว่ามาก</td></tr>
<tr><td>เหมาะกับ</td><td>สวิตช์ปลายทางที่ตั้งครั้งเดียวจบ</td><td>งานที่ต้องการ automation, routing, firewall</td></tr>
</table>
<div class="note"><b>สลับ OS:</b> รุ่นที่มีทั้งสอง OS สลับได้จาก RouterOS ด้วย <code>/system routerboard settings set boot-os=swos</code> (และกลับด้วย <code>boot-os=router-os</code>) — ต้องรีบูตและ config จะไม่ย้ายตามไปด้วย</div>`,
        },
        {
          t: 'Switch Chip และ Hardware Offload',
          h: `
<p>นี่คือเรื่องที่ทำให้คนเข้าใจผิดมากที่สุดเกี่ยวกับสวิตช์ MikroTik</p>
<p>อุปกรณ์มี <b>switch chip</b> ที่สลับ frame ได้ที่ wire-speed โดยไม่แตะ CPU เลย แต่ถ้าตั้งค่าผิดวิธี traffic จะถูกโยนขึ้นมาให้ <b>CPU</b> ประมวลผล ซึ่งช้ากว่าหลายสิบเท่า</p>
<pre class="code">/interface bridge port print
<span style="color:#5b6b8c"># คอลัมน์ HW ต้องเป็น yes จึงจะทำงานที่ switch chip</span>

/interface ethernet switch print
/interface ethernet switch port print</pre>
<table class="tbl">
<tr><th>สิ่งที่ทำ</th><th>Offload ได้ไหม</th></tr>
<tr><td>Bridge ธรรมดา + VLAN filtering</td><td>✔ ได้ (บนชิปที่รองรับ)</td></tr>
<tr><td>Bonding / LACP</td><td>✔ บางชิป</td></tr>
<tr><td>Bridge ที่มี firewall filter ทำงานอยู่</td><td>✘ ตกลง CPU</td></tr>
<tr><td>ผสม interface ต่างชิปใน bridge เดียว</td><td>✘ ตกลง CPU</td></tr>
<tr><td>Bridge ที่เปิด <code>use-ip-firewall=yes</code></td><td>✘ ตกลง CPU</td></tr>
</table>
<div class="note warn"><b>อาการที่เจอในงานจริง:</b> ซื้อ CRS มาแล้วโอนไฟล์ได้แค่ 300 Mbps ทั้งที่เป็นพอร์ตกิกะบิต → ตรวจ <code>/interface bridge port print</code> พบ HW=no แปลว่า traffic วิ่งผ่าน CPU ต้องหาสาเหตุว่าอะไรทำให้ offload หลุด</div>`,
        },
        {
          t: 'IP Management และการดูสถานะ',
          h: `
<p>สวิตช์ต้องมี IP เพื่อให้เข้าไปจัดการได้ วิธีมาตรฐานคือใส่ IP ไว้ที่ <b>bridge interface</b> (เทียบได้กับ SVI ของ Cisco)</p>
<pre class="code">/interface bridge add name=bridge1
/interface bridge port add bridge=bridge1 interface=ether1
/interface bridge port add bridge=bridge1 interface=ether2
/ip address add address=192.168.99.20/24 interface=bridge1
/ip route add dst-address=0.0.0.0/0 gateway=192.168.99.1
/system identity set name=SW-CORE-01</pre>
<pre class="code"><span style="color:#5b6b8c"># ดูสถานะพอร์ตและความเร็วที่เจรจาได้จริง</span>
/interface ethernet print
/interface ethernet monitor ether1 once

<span style="color:#5b6b8c"># ดู SFP module (สำคัญมากเวลาไล่ปัญหาไฟเบอร์)</span>
/interface ethernet monitor sfp-sfpplus1 once</pre>
<table class="tbl">
<tr><th>ค่าที่ต้องดูใน SFP</th><th>ความหมาย</th></tr>
<tr><td><code>sfp-rx-power</code></td><td>ความแรงสัญญาณที่รับได้ (dBm) ถ้าต่ำกว่า -20 มักมีปัญหาที่สายหรือหัวสกปรก</td></tr>
<tr><td><code>sfp-tx-power</code></td><td>ความแรงที่ส่งออก</td></tr>
<tr><td><code>sfp-temperature</code></td><td>อุณหภูมิ module — สูงผิดปกติแปลว่าระบายความร้อนไม่ดี</td></tr>
<tr><td><code>sfp-vendor-name</code></td><td>ยี่ห้อ module ใช้ตรวจว่าเป็นของแท้/เข้ากันได้</td></tr>
</table>`,
        },
      ],
      quiz: [
        { type: 'mcq', q: 'CRS ต่างจาก CSS อย่างไร', opts: ['CRS มีพอร์ตมากกว่าเสมอ', 'CRS รัน RouterOS จึงทำ routing และ firewall ได้ ส่วน CSS เน้นงาน L2 บน SwOS', 'CSS แพงกว่า', 'CRS ไม่มี switch chip'], a: 1, why: 'CRS = Cloud Router Switch ทำได้ทั้ง switch และ router ส่วน CSS = Cloud Smart Switch เน้น L2 ราคาประหยัดกว่า' },
        { type: 'mcq', q: 'คอลัมน์ <code>HW</code> ใน <code>/interface bridge port print</code> บอกอะไร', opts: ['พอร์ตนี้เป็นฮาร์ดแวร์จริงหรือ virtual', 'traffic ของพอร์ตนี้ถูก offload ลง switch chip หรือไม่', 'ความเร็วฮาร์ดแวร์สูงสุด', 'มี PoE หรือไม่'], a: 1, why: 'HW=yes คือทำงานที่ switch chip ด้วย wire-speed ถ้าเป็น no แปลว่า traffic วิ่งผ่าน CPU ซึ่งช้ากว่ามาก' },
        { type: 'multi', q: 'ข้อใดทำให้ hardware offload หลุด (traffic ตกลงมาที่ CPU) เลือกทุกข้อที่ถูก', opts: ['เปิด use-ip-firewall=yes ที่ bridge', 'รวม interface จากคนละ switch chip ไว้ใน bridge เดียว', 'ตั้งชื่อ bridge ยาวเกินไป', 'มี bridge firewall filter ทำงานอยู่'], a: [0, 1, 3], why: 'ชื่อ bridge ไม่มีผลต่อ offload — สิ่งที่มีผลคือฟีเจอร์ที่บังคับให้ CPU ต้องเห็นทุก packet' },
        { type: 'cmd', q: 'พิมพ์คำสั่งดูสถานะ SFP ของพอร์ต <code>sfp-sfpplus1</code> แบบครั้งเดียว', ans: ['/interface ethernet monitor sfp-sfpplus1 once', 'interface ethernet monitor sfp-sfpplus1 once'], why: 'จะเห็น rx-power, tx-power, temperature และยี่ห้อ module ซึ่งเป็นข้อมูลหลักในการไล่ปัญหาไฟเบอร์' },
        { type: 'mcq', q: 'ควรใส่ IP management ของสวิตช์ไว้ที่ interface ใด', opts: ['ที่ ether1 โดยตรง', 'ที่ bridge interface', 'ที่ทุกพอร์ตพร้อมกัน', 'ไม่ต้องใส่ IP เลย'], a: 1, why: 'ถ้าใส่ที่พอร์ตกายภาพที่เป็นสมาชิก bridge อยู่ IP จะใช้งานไม่ได้ตามที่คาด — ต้องใส่ที่ bridge (เทียบได้กับ SVI ของ Cisco)' },
        { type: 'mcq', q: 'ค่า <code>sfp-rx-power</code> ที่ -28 dBm บ่งบอกอะไร', opts: ['ปกติดี', 'สัญญาณอ่อนเกินไป มักเกิดจากสายยาวเกิน หัวสกปรก หรือ module ไม่เข้ากัน', 'สัญญาณแรงเกินไป', 'module เป็นของปลอม'], a: 1, why: 'rx-power ที่ต่ำมากทำให้เกิด CRC error และลิงก์ flap ควรทำความสะอาดหัวไฟเบอร์และตรวจระยะทาง/ชนิด module ก่อน' },
      ],
      labs: [{
        id: 'ms-l1-mgmt',
        title: 'Lab 1 — ตั้งค่าเริ่มต้นสวิตช์ CRS',
        brief: 'CRS ตัวใหม่มาถึง ต้องตั้งชื่อ สร้าง bridge รวมพอร์ต และตั้ง IP management ให้เข้าถึงจากระยะไกลได้',
        device: 'mikrotik-sw',
        tasks: [
          { t: 'ตั้งชื่ออุปกรณ์เป็น <code>SW-CORE-01</code>', hint: '/system identity set name=SW-CORE-01', check: s => s.settings['system identity'].name === 'SW-CORE-01' },
          { t: 'สร้าง bridge ชื่อ <code>bridge1</code>', hint: '/interface bridge add name=bridge1', check: s => T(s, 'interface bridge').some(r => r.name === 'bridge1') },
          { t: 'เพิ่ม <code>ether2</code>, <code>ether3</code>, <code>ether4</code> เข้า <code>bridge1</code>', hint: '/interface bridge port add bridge=bridge1 interface=ether2 → /interface bridge port add bridge=bridge1 interface=ether3 → /interface bridge port add bridge=bridge1 interface=ether4', check: s => ['ether2', 'ether3', 'ether4'].every(i => T(s, 'interface bridge port').some(r => r.bridge === 'bridge1' && r.interface === i)) },
          { t: 'ใส่ IP management <code>192.168.99.20/24</code> ที่ <code>bridge1</code>', hint: '/ip address add address=192.168.99.20/24 interface=bridge1', check: s => T(s, 'ip address').some(r => r.address === '192.168.99.20/24' && r.interface === 'bridge1') },
          { t: 'เพิ่ม default route ไป <code>192.168.99.1</code>', hint: '/ip route add dst-address=0.0.0.0/0 gateway=192.168.99.1', check: s => T(s, 'ip route').some(r => r['dst-address'] === '0.0.0.0/0' && r.gateway === '192.168.99.1') },
          { t: 'ตรวจสอบสถานะ bridge port', hint: '/interface bridge port print', check: (s, h) => h.some(c => /bridge\s+port\s+print/i.test(c)) },
        ],
      }],
    },

    // =========================================================
    2: {
      title: 'Bridge, RSTP และ Management VLAN',
      objectives: [
        'สร้าง bridge และเข้าใจ bridge port parameter ที่สำคัญ',
        'เปิดและปรับแต่ง RSTP ให้ทำงานตามที่ออกแบบ',
        'แยก management VLAN ออกจาก VLAN ผู้ใช้',
        'ตรวจสอบ MAC table และ loop',
      ],
      sections: [
        {
          t: 'Bridge Port Parameters ที่ต้องรู้',
          h: `
<table class="tbl">
<tr><th>พารามิเตอร์</th><th>ความหมาย</th><th>ใช้เมื่อ</th></tr>
<tr><td><code>pvid</code></td><td>VLAN ของ frame ที่เข้ามาแบบไม่มี tag</td><td>กำหนด access port</td></tr>
<tr><td><code>frame-types</code></td><td>ยอมรับ frame แบบใด (tagged / untagged / ทั้งคู่)</td><td>บังคับ access หรือ trunk แบบเข้มงวด</td></tr>
<tr><td><code>ingress-filtering</code></td><td>ทิ้ง frame ของ VLAN ที่พอร์ตนี้ไม่ได้เป็นสมาชิก</td><td>ควรเปิด (yes) เสมอเพื่อความปลอดภัย</td></tr>
<tr><td><code>horizon</code></td><td>พอร์ตที่มีเลข horizon เดียวกันจะไม่ส่งหากันเอง</td><td>ทำ port isolation</td></tr>
<tr><td><code>edge</code></td><td>บอกว่าเป็นพอร์ตปลายทาง (เหมือน PortFast)</td><td>พอร์ตที่ต่อ PC</td></tr>
<tr><td><code>bpdu-guard</code></td><td>ปิดพอร์ตถ้าได้รับ BPDU</td><td>พอร์ตผู้ใช้ ป้องกัน rogue switch</td></tr>
</table>
<pre class="code">/interface bridge port
set [find interface=ether5] pvid=10 frame-types=admit-only-untagged-and-priority-tagged
set [find interface=ether5] edge=yes bpdu-guard=yes</pre>`,
        },
        {
          t: 'RSTP บน RouterOS',
          h: `
<pre class="code"><span style="color:#5b6b8c"># protocol-mode: none | stp | rstp | mstp  — ค่าปริยายของ RouterOS 7 คือ rstp</span>
/interface bridge set bridge1 protocol-mode=rstp priority=0x1000

/interface bridge monitor bridge1 once
<span style="color:#5b6b8c">  root-bridge: yes           ← เครื่องนี้เป็น root หรือไม่</span>
<span style="color:#5b6b8c">  root-bridge-id: 0x1000....</span>

/interface bridge port print detail
<span style="color:#5b6b8c">  role=designated-port / root-port / alternate-port</span>
<span style="color:#5b6b8c">  learning=yes forwarding=yes</span></pre>
<div class="note"><b>priority เขียนเป็นเลขฐานสิบหก</b> เช่น <code>0x1000</code> = 4096, <code>0x8000</code> = 32768 (ค่าปริยาย) ตัวที่ค่าน้อยสุดได้เป็น root — ควรบังคับให้ core switch เป็น root เสมอ อย่าปล่อยให้เลือกกันเองตาม MAC</div>
<table class="tbl">
<tr><th>Port role</th><th>ความหมาย</th></tr>
<tr><td><code>root-port</code></td><td>เส้นทางไป root ที่ดีที่สุดของสวิตช์ตัวนี้</td></tr>
<tr><td><code>designated-port</code></td><td>พอร์ตที่รับผิดชอบส่งต่อใน segment นั้น</td></tr>
<tr><td><code>alternate-port</code></td><td>เส้นทางสำรอง — ถูกบล็อกไว้ พร้อมขึ้นแทนทันทีถ้า root port ล่ม</td></tr>
<tr><td><code>disabled-port</code></td><td>ลิงก์ไม่ทำงาน</td></tr>
</table>
<div class="note warn">อย่าปิด STP (<code>protocol-mode=none</code>) เพื่อ "ให้เร็วขึ้น" — วันที่มีคนเสียบสายวนเป็นวง คุณจะเสียทั้งวงแทนที่จะเสียแค่พอร์ตเดียว</div>`,
        },
        {
          t: 'แยก Management VLAN',
          h: `
<p>ปล่อย IP management ไว้ VLAN 1 ร่วมกับผู้ใช้ = ใครก็ตามในวงเดียวกันเข้าถึงหน้าจัดการสวิตช์ได้ ควรแยกออกมาเสมอ</p>
<pre class="code">/interface bridge add name=bridge1 vlan-filtering=no
/interface bridge port add bridge=bridge1 interface=ether2 pvid=10
/interface bridge port add bridge=bridge1 interface=ether10          <span style="color:#5b6b8c"># trunk ไป core</span>

<span style="color:#5b6b8c"># ประกาศ VLAN บน bridge</span>
/interface bridge vlan add bridge=bridge1 vlan-ids=10 tagged=bridge1,ether10 untagged=ether2
/interface bridge vlan add bridge=bridge1 vlan-ids=99 tagged=bridge1,ether10

<span style="color:#5b6b8c"># สร้าง VLAN interface สำหรับ management แล้วใส่ IP ที่นั่น</span>
/interface vlan add name=mgmt-vlan vlan-id=99 interface=bridge1
/ip address add address=192.168.99.20/24 interface=mgmt-vlan

<span style="color:#5b6b8c"># เปิด filtering เป็นขั้นตอนสุดท้าย</span>
/interface bridge set bridge1 vlan-filtering=yes</pre>
<div class="note"><b>ทำไม bridge1 ต้องอยู่ในรายการ <code>tagged</code>?</b><br>
เพราะตัว bridge เองก็เป็น "พอร์ต" หนึ่งในมุมมองของ VLAN table — ถ้าไม่ใส่ bridge1 ไว้ใน tagged ของ VLAN 99 ตัว interface <code>mgmt-vlan</code> จะไม่ได้รับ traffic ของ VLAN 99 เลย และคุณจะเข้าเครื่องไม่ได้หลังเปิด filtering</div>`,
        },
      ],
      quiz: [
        { type: 'mcq', q: '<code>pvid</code> ของ bridge port หมายถึงอะไร', opts: ['Priority ของพอร์ต', 'VLAN ที่จะใส่ให้ frame ที่เข้ามาแบบไม่มี tag', 'จำนวน VLAN สูงสุด', 'รหัสประจำพอร์ต'], a: 1, why: 'pvid (Port VLAN ID) เทียบได้กับ switchport access vlan ของ Cisco — frame ที่ไม่มี tag เข้ามาจะถูกจัดให้อยู่ VLAN นี้' },
        { type: 'mcq', q: 'ค่า <code>ingress-filtering=yes</code> ทำอะไร', opts: ['กรอง MAC address ที่ไม่รู้จัก', 'ทิ้ง frame ของ VLAN ที่พอร์ตนี้ไม่ได้เป็นสมาชิก', 'จำกัดความเร็วขาเข้า', 'เปิด firewall'], a: 1, why: 'เป็นการบังคับใช้ VLAN membership อย่างเข้มงวด ควรเปิดเสมอเพื่อป้องกัน VLAN hopping' },
        { type: 'mcq', q: 'บน RouterOS ค่า bridge priority <code>0x1000</code> เท่ากับเลขฐานสิบเท่าใด', opts: ['1000', '4096', '32768', '8192'], a: 1, why: '0x1000 = 4096 ซึ่งต่ำกว่าค่าปริยาย 0x8000 (32768) จึงชนะการเลือก root bridge' },
        { type: 'mcq', q: 'Port role <code>alternate-port</code> ใน RSTP หมายถึงอะไร', opts: ['พอร์ตที่เสีย', 'เส้นทางสำรองที่ถูกบล็อกไว้ พร้อมขึ้นแทนทันทีเมื่อ root port ล่ม', 'พอร์ตที่ต่อ PC', 'พอร์ตที่รับ traffic ทุก VLAN'], a: 1, why: 'RSTP มี alternate port ที่เตรียมพร้อมไว้แล้ว จึง converge ได้ในไม่กี่วินาที ต่างจาก STP เดิมที่ต้องรอ timer' },
        { type: 'mcq', q: 'ทำไมต้องใส่ <code>bridge1</code> ในรายการ tagged ของ management VLAN', opts: ['เพื่อความสวยงามของ config', 'เพราะตัว bridge เองเป็นพอร์ตหนึ่งใน VLAN table หากไม่ใส่ VLAN interface จะไม่ได้รับ traffic', 'เพื่อให้ offload ทำงาน', 'ไม่จำเป็นต้องใส่'], a: 1, why: 'นี่คือสาเหตุที่คนหลุดจากสวิตช์บ่อยที่สุดหลังเปิด vlan-filtering — ลืมใส่ bridge เองเข้าไปใน tagged list ของ management VLAN' },
        { type: 'multi', q: 'พารามิเตอร์ใดควรตั้งที่พอร์ตซึ่งต่อกับ PC ผู้ใช้ (เลือกทุกข้อที่ถูก)', opts: ['edge=yes', 'bpdu-guard=yes', 'frame-types=admit-only-untagged-and-priority-tagged', 'protocol-mode=none'], a: [0, 1, 2], why: 'protocol-mode ตั้งที่ bridge ไม่ใช่ที่พอร์ต และการปิด STP ทั้ง bridge เป็นสิ่งที่ไม่ควรทำ' },
      ],
      labs: [{
        id: 'ms-l2-rstp',
        title: 'Lab 2 — Bridge + RSTP + Management VLAN',
        brief: 'ตั้งให้สวิตช์เป็น root bridge, ป้องกันพอร์ตผู้ใช้ และย้าย IP management ไปอยู่ VLAN 99',
        device: 'mikrotik-sw',
        tasks: [
          { t: 'สร้าง bridge ชื่อ <code>bridge1</code>', hint: '/interface bridge add name=bridge1', check: s => T(s, 'interface bridge').some(r => r.name === 'bridge1') },
          { t: 'ตั้ง bridge1 เป็น protocol-mode <code>rstp</code>', hint: '/interface bridge set [find name=bridge1] protocol-mode=rstp', check: s => T(s, 'interface bridge').some(r => r.name === 'bridge1' && r['protocol-mode'] === 'rstp') },
          { t: 'เพิ่ม <code>ether2</code> เข้า bridge1 พร้อมตั้ง <code>pvid=10</code>', hint: '/interface bridge port add bridge=bridge1 interface=ether2 pvid=10', check: s => T(s, 'interface bridge port').some(r => r.bridge === 'bridge1' && r.interface === 'ether2' && String(r.pvid) === '10') },
          { t: 'เพิ่ม <code>ether1</code> เข้า bridge1 (ใช้เป็น trunk ไป core)', hint: '/interface bridge port add bridge=bridge1 interface=ether1', check: s => T(s, 'interface bridge port').some(r => r.bridge === 'bridge1' && r.interface === 'ether1') },
          { t: 'ประกาศ VLAN 10: tagged <code>bridge1,ether1</code> untagged <code>ether2</code>', hint: '/interface bridge vlan add bridge=bridge1 vlan-ids=10 tagged=bridge1,ether1 untagged=ether2', check: s => T(s, 'interface bridge vlan').some(r => String(r['vlan-ids']) === '10' && /bridge1/.test(r.tagged || '') && /ether2/.test(r.untagged || '')) },
          { t: 'ประกาศ VLAN 99 (management): tagged <code>bridge1,ether1</code>', hint: '/interface bridge vlan add bridge=bridge1 vlan-ids=99 tagged=bridge1,ether1', check: s => T(s, 'interface bridge vlan').some(r => String(r['vlan-ids']) === '99' && /bridge1/.test(r.tagged || '')) },
          { t: 'สร้าง VLAN interface ชื่อ <code>mgmt-vlan</code> vlan-id 99 บน bridge1', hint: '/interface vlan add name=mgmt-vlan vlan-id=99 interface=bridge1', check: s => T(s, 'interface vlan').some(r => r.name === 'mgmt-vlan' && String(r['vlan-id']) === '99' && r.interface === 'bridge1') },
          { t: 'ใส่ IP <code>192.168.99.20/24</code> ที่ <code>mgmt-vlan</code>', hint: '/ip address add address=192.168.99.20/24 interface=mgmt-vlan', check: s => T(s, 'ip address').some(r => r.address === '192.168.99.20/24' && r.interface === 'mgmt-vlan') },
          { t: 'เปิด <code>vlan-filtering=yes</code> ที่ bridge1 (ขั้นตอนสุดท้าย)', hint: '/interface bridge set [find name=bridge1] vlan-filtering=yes', check: s => T(s, 'interface bridge').some(r => r.name === 'bridge1' && r['vlan-filtering'] === 'yes') },
        ],
      }],
    },

    // =========================================================
    3: {
      title: 'VLAN Filtering เต็มรูปแบบ และเชื่อมกับยี่ห้ออื่น',
      objectives: [
        'ออกแบบตาราง tagged/untagged ให้ถูกต้องทุกพอร์ต',
        'ตั้ง trunk เชื่อมกับ Cisco / HP ได้อย่างถูกต้อง',
        'จัดการ native VLAN และ hybrid port',
        'ไล่ปัญหา VLAN ที่ข้ามสวิตช์ไม่ได้',
      ],
      sections: [
        {
          t: 'ตาราง VLAN ที่ถูกต้อง',
          h: `
<p>ทุก VLAN ต้องประกาศว่าพอร์ตใดเป็น <b>tagged</b> (trunk) และพอร์ตใดเป็น <b>untagged</b> (access) แล้วพอร์ต access ต้องมี <code>pvid</code> ตรงกับ VLAN นั้นด้วย</p>
<table class="tbl">
<tr><th>พอร์ต</th><th>บทบาท</th><th>ตั้ง pvid</th><th>อยู่ในรายการ</th></tr>
<tr><td>ether1</td><td>Trunk ไป core</td><td>1 (หรือ native)</td><td>tagged ของทุก VLAN ที่ต้องผ่าน</td></tr>
<tr><td>ether2</td><td>Access VLAN 10</td><td>10</td><td>untagged ของ VLAN 10</td></tr>
<tr><td>ether3</td><td>Access VLAN 20</td><td>20</td><td>untagged ของ VLAN 20</td></tr>
<tr><td>bridge1</td><td>ตัว bridge เอง</td><td>—</td><td>tagged ของ VLAN ที่มี VLAN interface อยู่</td></tr>
</table>
<pre class="code">/interface bridge port
add bridge=bridge1 interface=ether1
add bridge=bridge1 interface=ether2 pvid=10 frame-types=admit-only-untagged-and-priority-tagged
add bridge=bridge1 interface=ether3 pvid=20 frame-types=admit-only-untagged-and-priority-tagged

/interface bridge vlan
add bridge=bridge1 vlan-ids=10 tagged=ether1 untagged=ether2
add bridge=bridge1 vlan-ids=20 tagged=ether1 untagged=ether3
add bridge=bridge1 vlan-ids=99 tagged=ether1,bridge1

/interface bridge set bridge1 vlan-filtering=yes ingress-filtering=yes</pre>`,
        },
        {
          t: 'เชื่อม trunk กับ Cisco / ยี่ห้ออื่น',
          h: `
<p>คำศัพท์ต่างกันแต่ความหมายเดียวกัน — ตารางนี้ช่วยแปลงระหว่างยี่ห้อ</p>
<table class="tbl">
<tr><th>ความหมาย</th><th>MikroTik</th><th>Cisco</th><th>HP/Aruba</th></tr>
<tr><td>พอร์ต trunk</td><td>อยู่ใน <code>tagged=</code></td><td><code>switchport mode trunk</code></td><td><code>tagged</code></td></tr>
<tr><td>พอร์ต access</td><td><code>pvid=N</code> + <code>untagged=</code></td><td><code>switchport access vlan N</code></td><td><code>untagged</code></td></tr>
<tr><td>Native VLAN</td><td><code>pvid</code> ของพอร์ต trunk</td><td><code>switchport trunk native vlan N</code></td><td>untagged บนพอร์ต trunk</td></tr>
<tr><td>จำกัด VLAN บน trunk</td><td>ประกาศเฉพาะ VLAN ที่ต้องการ</td><td><code>switchport trunk allowed vlan</code></td><td>tagged เฉพาะที่ต้องการ</td></tr>
</table>
<div class="note warn"><b>ข้อผิดพลาดที่พบบ่อยที่สุดตอนเชื่อม MikroTik ↔ Cisco</b><br>
Cisco ตั้ง <code>native vlan 1</code> (ค่าปริยาย) แต่ฝั่ง MikroTik ตั้ง <code>pvid=99</code> บนพอร์ต trunk → traffic untagged จะไปโผล่ผิด VLAN<br>
ทางแก้ที่แนะนำ: ตั้งฝั่ง Cisco เป็น <code>switchport trunk native vlan 999</code> (VLAN ที่ไม่ได้ใช้) และฝั่ง MikroTik ตั้ง <code>pvid=999</code> ให้ตรงกัน แล้ว tag ทุก VLAN ที่ใช้งานจริง</div>`,
        },
        {
          t: 'ไล่ปัญหา VLAN ข้ามสวิตช์ไม่ได้',
          h: `
<pre class="code"><span style="color:#5b6b8c"># 1) VLAN นี้ประกาศไว้จริงไหม พอร์ตอยู่ในรายการถูกต้องไหม</span>
/interface bridge vlan print

<span style="color:#5b6b8c"># 2) พอร์ตตั้ง pvid และ frame-types ถูกไหม</span>
/interface bridge port print detail

<span style="color:#5b6b8c"># 3) สวิตช์เห็น MAC ของปลายทางไหม อยู่ VLAN อะไร</span>
/interface bridge host print where vlan-id=10

<span style="color:#5b6b8c"># 4) STP บล็อกพอร์ตนั้นอยู่หรือเปล่า</span>
/interface bridge port print detail where role=alternate-port

<span style="color:#5b6b8c"># 5) ดู traffic จริงระดับ packet</span>
/tool sniffer quick interface=ether1 vlan=10</pre>
<table class="tbl">
<tr><th>อาการ</th><th>สาเหตุที่พบบ่อย</th></tr>
<tr><td>VLAN เดียวไม่ผ่าน VLAN อื่นผ่านหมด</td><td>ลืมประกาศ VLAN นั้นในรายการ tagged ของพอร์ต trunk</td></tr>
<tr><td>เปิด vlan-filtering แล้วหลุดจากเครื่อง</td><td>ลืมใส่ bridge เองใน tagged ของ management VLAN</td></tr>
<tr><td>ทุกอย่างช้าผิดปกติ</td><td>hardware offload หลุด — ตรวจ HW=no</td></tr>
<tr><td>traffic untagged ไปโผล่ผิด VLAN</td><td>pvid ของ trunk สองฝั่งไม่ตรงกัน (native VLAN mismatch)</td></tr>
<tr><td>ลิงก์ขึ้น ๆ ดับ ๆ</td><td>สาย/SFP มีปัญหา หรือเกิด loop ที่ STP ยังไม่ตัดสินใจ</td></tr>
</table>`,
        },
      ],
      quiz: [
        { type: 'mcq', q: 'พอร์ต access ของ VLAN 20 ต้องตั้งอะไรบ้าง', opts: ['ใส่ใน tagged ของ VLAN 20 อย่างเดียว', 'ตั้ง pvid=20 และใส่ใน untagged ของ VLAN 20', 'ตั้ง pvid=1 และใส่ใน tagged', 'ไม่ต้องตั้งอะไร'], a: 1, why: 'pvid บอกว่า frame ที่ไม่มี tag เข้ามาจะอยู่ VLAN ใด ส่วน untagged list บอกว่าขาออกจะถอด tag ออกก่อนส่ง — ต้องมีทั้งคู่' },
        { type: 'mcq', q: 'MikroTik trunk ตั้ง pvid=99 แต่ Cisco ฝั่งตรงข้ามใช้ native vlan 1 จะเกิดอะไรขึ้น', opts: ['ลิงก์จะดับ', 'traffic untagged จะถูกจัดเข้า VLAN ผิดฝั่ง เกิดการรั่วข้าม VLAN', 'VLAN ทั้งหมดจะใช้งานไม่ได้', 'ไม่มีผลอะไร'], a: 1, why: 'Native VLAN mismatch — frame untagged ของฝั่งหนึ่งไปโผล่ใน VLAN อีกฝั่ง เป็นทั้งปัญหาการใช้งานและช่องโหว่ความปลอดภัย' },
        { type: 'cmd', q: 'พิมพ์คำสั่งดูตาราง VLAN ของ bridge ทั้งหมด', ans: ['/interface bridge vlan print', 'interface bridge vlan print'], why: 'เป็นคำสั่งแรกที่ควรดูเมื่อ VLAN ข้ามสวิตช์ไม่ได้ — ตรวจว่าพอร์ตอยู่ใน tagged/untagged ถูกต้องหรือไม่' },
        { type: 'mcq', q: 'อาการ "เปิด vlan-filtering แล้วเข้าเครื่องไม่ได้" มักเกิดจากอะไร', opts: ['ลืมรีบูต', 'ลืมใส่ bridge เองในรายการ tagged ของ management VLAN', 'IP address ผิด', 'RSTP บล็อกพอร์ต'], a: 1, why: 'ตัว bridge เป็นพอร์ตหนึ่งใน VLAN table — ถ้าไม่อยู่ใน tagged ของ VLAN ที่มี VLAN interface อยู่ traffic จะไปไม่ถึง' },
        { type: 'multi', q: 'คำสั่งใดช่วยไล่ปัญหา VLAN ที่ข้ามสวิตช์ไม่ได้ (เลือกทุกข้อที่เกี่ยวข้อง)', opts: ['/interface bridge vlan print', '/interface bridge port print detail', '/interface bridge host print', '/system resource print'], a: [0, 1, 2], why: 'system resource print บอกแค่ CPU/RAM/uptime ไม่ช่วยเรื่อง VLAN โดยตรง (แต่ช่วยได้ถ้าสงสัยว่า offload หลุดจน CPU เต็ม)' },
        { type: 'mcq', q: 'บนพอร์ตที่ต่อ PC ควรตั้ง <code>frame-types</code> เป็นอะไร', opts: ['admit-all', 'admit-only-vlan-tagged', 'admit-only-untagged-and-priority-tagged', 'ไม่ต้องตั้ง'], a: 2, why: 'บังคับให้รับเฉพาะ frame ที่ไม่มี tag ป้องกันไม่ให้ผู้ใช้ส่ง frame ที่ tag VLAN อื่นเข้ามาเอง (VLAN hopping)' },
      ],
      labs: [{
        id: 'ms-l3-vlan',
        title: 'Lab 3 — VLAN Filtering เต็มรูปแบบ 3 VLAN',
        brief: 'สวิตช์ชั้น 2 ต้องรองรับ VLAN 10 (Office), 20 (Guest), 99 (Mgmt) โดย ether1 เป็น trunk ไป core และตั้ง native เป็น VLAN 999',
        device: 'mikrotik-sw',
        tasks: [
          { t: 'สร้าง bridge <code>bridge1</code>', hint: '/interface bridge add name=bridge1', check: s => T(s, 'interface bridge').some(r => r.name === 'bridge1') },
          { t: 'เพิ่ม <code>ether1</code> เป็น trunk พร้อม <code>pvid=999</code>', hint: '/interface bridge port add bridge=bridge1 interface=ether1 pvid=999', check: s => T(s, 'interface bridge port').some(r => r.interface === 'ether1' && String(r.pvid) === '999') },
          { t: 'เพิ่ม <code>ether2</code> เป็น access VLAN 10 (<code>pvid=10</code>)', hint: '/interface bridge port add bridge=bridge1 interface=ether2 pvid=10', check: s => T(s, 'interface bridge port').some(r => r.interface === 'ether2' && String(r.pvid) === '10') },
          { t: 'เพิ่ม <code>ether3</code> เป็น access VLAN 20 (<code>pvid=20</code>)', hint: '/interface bridge port add bridge=bridge1 interface=ether3 pvid=20', check: s => T(s, 'interface bridge port').some(r => r.interface === 'ether3' && String(r.pvid) === '20') },
          { t: 'ประกาศ VLAN 10: tagged <code>ether1</code>, untagged <code>ether2</code>', hint: '/interface bridge vlan add bridge=bridge1 vlan-ids=10 tagged=ether1 untagged=ether2', check: s => T(s, 'interface bridge vlan').some(r => String(r['vlan-ids']) === '10' && /ether1/.test(r.tagged || '') && /ether2/.test(r.untagged || '')) },
          { t: 'ประกาศ VLAN 20: tagged <code>ether1</code>, untagged <code>ether3</code>', hint: '/interface bridge vlan add bridge=bridge1 vlan-ids=20 tagged=ether1 untagged=ether3', check: s => T(s, 'interface bridge vlan').some(r => String(r['vlan-ids']) === '20' && /ether1/.test(r.tagged || '') && /ether3/.test(r.untagged || '')) },
          { t: 'ประกาศ VLAN 99: tagged <code>ether1,bridge1</code>', hint: '/interface bridge vlan add bridge=bridge1 vlan-ids=99 tagged=ether1,bridge1', check: s => T(s, 'interface bridge vlan').some(r => String(r['vlan-ids']) === '99' && /ether1/.test(r.tagged || '') && /bridge1/.test(r.tagged || '')) },
          { t: 'สร้าง VLAN interface <code>mgmt</code> vlan-id 99 บน bridge1 และใส่ IP <code>192.168.99.21/24</code>', hint: '/interface vlan add name=mgmt vlan-id=99 interface=bridge1 → /ip address add address=192.168.99.21/24 interface=mgmt', check: s => T(s, 'interface vlan').some(r => r.name === 'mgmt' && String(r['vlan-id']) === '99') && T(s, 'ip address').some(r => r.address === '192.168.99.21/24' && r.interface === 'mgmt') },
          { t: 'เปิด vlan-filtering ที่ bridge1', hint: '/interface bridge set [find name=bridge1] vlan-filtering=yes', check: s => T(s, 'interface bridge').some(r => r.name === 'bridge1' && r['vlan-filtering'] === 'yes') },
        ],
      }],
    },

    // =========================================================
    4: {
      title: 'Bonding, Port Isolation และ Hardware Offload',
      objectives: [
        'รวมลิงก์ด้วย bonding (LACP) และเลือก mode ให้เหมาะกับงาน',
        'ทำ port isolation ด้วย bridge horizon',
        'ควบคุม storm และป้องกัน loop',
        'ตรวจสอบและรักษา hardware offload ไม่ให้หลุด',
      ],
      sections: [
        {
          t: 'Bonding / LACP',
          h: `
<pre class="code">/interface bonding add name=bond1 slaves=ether7,ether8 mode=802.3ad \\
    lacp-rate=1sec transmit-hash-policy=layer-2-and-3

/interface bridge port add bridge=bridge1 interface=bond1
/interface bonding monitor bond1 once</pre>
<table class="tbl">
<tr><th>Mode</th><th>ต้องการฝั่งตรงข้ามรองรับ</th><th>เหมาะกับ</th></tr>
<tr><td><code>802.3ad</code> (LACP)</td><td>✔ ต้องตั้ง LACP ทั้งสองฝั่ง</td><td>เชื่อมกับ switch ที่จัดการได้ — แนะนำ</td></tr>
<tr><td><code>balance-xor</code></td><td>ต้องเป็น static LAG</td><td>เมื่อฝั่งตรงข้ามไม่รองรับ LACP</td></tr>
<tr><td><code>active-backup</code></td><td>✘ ไม่ต้อง</td><td>ต้องการแค่ redundancy ไม่ต้องการแบนด์วิดท์เพิ่ม</td></tr>
<tr><td><code>balance-rr</code></td><td>✘</td><td>ให้แบนด์วิดท์รวมสูงสุด แต่ทำให้ packet มาไม่เรียง — ระวังใช้</td></tr>
</table>
<div class="note"><b><code>transmit-hash-policy</code> สำคัญกว่าที่คิด</b><br>
LACP ไม่ได้แบ่ง packet ทีละใบ แต่แบ่งตาม <b>flow</b> ถ้าใช้ <code>layer-2</code> แล้วมี traffic ระหว่างเครื่องคู่เดียวเยอะ ๆ จะวิ่งอยู่เส้นเดียวตลอด — ใช้ <code>layer-2-and-3</code> หรือ <code>layer-3-and-4</code> เพื่อกระจายดีขึ้น</div>`,
        },
        {
          t: 'Port Isolation ด้วย Bridge Horizon',
          h: `
<p>งานหอพัก/โรงแรม/ร้านกาแฟ: ต้องการให้ทุกห้องออกเน็ตได้ แต่ห้ามคุยกันเอง (ป้องกันการโจมตีระหว่างผู้ใช้)</p>
<pre class="code"><span style="color:#5b6b8c"># พอร์ตที่มี horizon เดียวกันจะไม่ส่ง traffic หากันเอง</span>
/interface bridge port set [find interface=ether2] horizon=1
/interface bridge port set [find interface=ether3] horizon=1
/interface bridge port set [find interface=ether4] horizon=1
<span style="color:#5b6b8c"># uplink ไม่ต้องตั้ง horizon (ปล่อยว่าง) จึงคุยกับทุกพอร์ตได้</span></pre>
<table class="tbl">
<tr><th>ต้องการ</th><th>ตั้ง horizon อย่างไร</th></tr>
<tr><td>ทุกห้องแยกจากกัน แต่ออกเน็ตได้</td><td>ทุกพอร์ตผู้ใช้ horizon เดียวกัน, uplink ไม่ตั้ง</td></tr>
<tr><td>แบ่งเป็นกลุ่ม กลุ่มเดียวกันคุยกันได้</td><td>ให้แต่ละกลุ่มมีเลข horizon ต่างกัน</td></tr>
<tr><td>ไม่แยก</td><td>ไม่ตั้ง horizon เลย</td></tr>
</table>
<p><b>Storm control และ loop protection</b></p>
<pre class="code"><span style="color:#5b6b8c"># จำกัด broadcast/multicast/unknown-unicast ที่พอร์ตผู้ใช้</span>
/interface ethernet switch port
set ether2 broadcast-flood=no unknown-unicast-flood=no unknown-multicast-flood=no

<span style="color:#5b6b8c"># ตรวจจับ loop บนพอร์ตนั้นเอง — ปิดพอร์ตอัตโนมัติเมื่อเจอ</span>
/interface ethernet set ether2 loop-protect=on loop-protect-send-interval=5s

<span style="color:#5b6b8c"># กัน rogue switch</span>
/interface bridge port set [find interface=ether2] bpdu-guard=yes edge=yes</pre>`,
        },
        {
          t: 'รักษา Hardware Offload',
          h: `
<pre class="code">/interface bridge port print
<span style="color:#5b6b8c"># ต้องเห็น HW=yes ทุกพอร์ตที่ควร offload</span>

/interface ethernet switch print
/system resource print          <span style="color:#5b6b8c"># cpu-load ไม่ควรพุ่งเมื่อมี traffic เยอะ</span>
/tool profile duration=5        <span style="color:#5b6b8c"># ดูว่า CPU หมดไปกับอะไร</span></pre>
<table class="tbl">
<tr><th>ตัวการที่ทำให้ offload หลุด</th><th>ทางแก้</th></tr>
<tr><td><code>use-ip-firewall=yes</code> ที่ bridge</td><td>ปิด ถ้าไม่จำเป็นต้อง filter traffic ที่ผ่าน bridge</td></tr>
<tr><td>รวม interface ต่าง switch chip ใน bridge เดียว</td><td>ตรวจ <code>/interface ethernet switch print</code> ว่าพอร์ตอยู่ชิปเดียวกันไหม</td></tr>
<tr><td>ใช้ VLAN interface บน bridge ที่ยังไม่เปิด vlan-filtering</td><td>เปิด vlan-filtering แล้วใช้ bridge VLAN table แทน</td></tr>
<tr><td>Bonding บางโหมดบนชิปที่ไม่รองรับ</td><td>ใช้ 802.3ad หรือย้ายไปพอร์ตที่ชิปรองรับ</td></tr>
</table>
<div class="note"><b>วิธีคิดง่าย ๆ:</b> switch chip ทำได้เฉพาะงาน L2 ตรงไปตรงมา ทันทีที่คุณขอให้ router "ดู" หรือ "ตัดสินใจ" อะไรกับ packet นั้น มันต้องขึ้นมาที่ CPU — ยิ่งฟีเจอร์เยอะ ยิ่งเสี่ยงหลุด offload</div>
<p><b>Port mirroring</b> สำหรับจับ traffic ไปวิเคราะห์:</p>
<pre class="code">/interface ethernet switch set switch1 mirror-source=ether2 mirror-target=ether10</pre>`,
        },
      ],
      quiz: [
        { type: 'mcq', q: 'Bonding mode ใดที่ต้องตั้ง LACP ทั้งสองฝั่งจึงจะทำงาน', opts: ['balance-rr', '802.3ad', 'active-backup', 'broadcast'], a: 1, why: '802.3ad คือ LACP มาตรฐาน ต้องเจรจากับฝั่งตรงข้าม ส่วน active-backup ทำฝั่งเดียวได้เพราะเป็นแค่การสลับใช้ลิงก์' },
        { type: 'mcq', q: '<code>transmit-hash-policy</code> มีผลอย่างไรกับ LACP', opts: ['กำหนดความเร็วสูงสุด', 'กำหนดว่าจะกระจาย flow ลงแต่ละลิงก์ด้วยข้อมูลระดับใด (L2 / L3 / L4)', 'เข้ารหัส traffic', 'กำหนดจำนวนลิงก์สูงสุด'], a: 1, why: 'LACP กระจายตาม flow ไม่ใช่ทีละ packet — ถ้า hash แคบเกินไป traffic ระหว่างเครื่องคู่เดียวจะวิ่งอยู่เส้นเดียวตลอด' },
        { type: 'mcq', q: 'ต้องการให้พอร์ตผู้ใช้ทุกพอร์ตออกเน็ตได้แต่คุยกันเองไม่ได้ ควรใช้อะไร', opts: ['ตั้ง VLAN แยกทุกพอร์ต', 'ตั้ง bridge horizon เลขเดียวกันที่พอร์ตผู้ใช้ทั้งหมด และไม่ตั้งที่ uplink', 'ปิด STP', 'ตั้ง pvid=0'], a: 1, why: 'พอร์ตที่มี horizon เดียวกันจะไม่ forward หากันเอง แต่ยังคุยกับพอร์ตที่ไม่มี horizon (uplink) ได้ — ประหยัดกว่าการแยก VLAN ทีละพอร์ต' },
        { type: 'multi', q: 'อะไรทำให้ hardware offload หลุด (เลือกทุกข้อที่ถูก)', opts: ['เปิด use-ip-firewall=yes ที่ bridge', 'รวม interface จากคนละ switch chip ใน bridge เดียวกัน', 'ตั้ง identity เป็นชื่อยาว', 'มี bridge firewall filter ทำงาน'], a: [0, 1, 3], why: 'ทุกอย่างที่บังคับให้ CPU ต้องเห็น packet จะทำให้ offload หลุด ส่วนชื่ออุปกรณ์ไม่เกี่ยว' },
        { type: 'cmd', q: 'พิมพ์คำสั่งดูสถานะ bridge port เพื่อตรวจว่า HW offload ทำงานอยู่หรือไม่', ans: ['/interface bridge port print', 'interface bridge port print'], why: 'ดูคอลัมน์ HW — ต้องเป็น yes ถ้าเป็น no แปลว่า traffic ขึ้นมาที่ CPU และประสิทธิภาพจะตกอย่างมาก' },
        { type: 'mcq', q: '<code>loop-protect=on</code> ที่ /interface ethernet ทำอะไร', opts: ['เปิด STP', 'ส่ง packet ตรวจสอบ ถ้าพบว่าวนกลับมาที่ตัวเองจะปิดพอร์ตนั้นอัตโนมัติ', 'ป้องกัน broadcast storm', 'จำกัดความเร็ว'], a: 1, why: 'เป็นกลไกเสริมจาก STP โดยเฉพาะกับพอร์ตปลายทางที่ผู้ใช้อาจเสียบสายวนเอง (เช่น เสียบสายสองหัวเข้า switch ตัวเดียวกัน)' },
      ],
      labs: [{
        id: 'ms-l4-bond',
        title: 'Lab 4 — Bonding และ Port Isolation',
        brief: 'อัปลิงก์ไป core ต้องรวม 2 พอร์ตด้วย LACP และพอร์ตห้องพักต้องแยกกันไม่ให้คุยกันเอง',
        device: 'mikrotik-sw',
        tasks: [
          { t: 'สร้าง bonding ชื่อ <code>bond1</code> จาก <code>ether7,ether8</code>', hint: '/interface bonding add name=bond1 slaves=ether7,ether8 mode=802.3ad', check: s => T(s, 'interface bonding').some(r => r.name === 'bond1' && /ether7/.test(r.slaves || '') && /ether8/.test(r.slaves || '')) },
          { t: 'ตั้ง bond1 ให้ใช้ mode <code>802.3ad</code>', hint: '/interface bonding set [find name=bond1] mode=802.3ad', check: s => T(s, 'interface bonding').some(r => r.name === 'bond1' && r.mode === '802.3ad') },
          { t: 'สร้าง bridge <code>bridge1</code>', hint: '/interface bridge add name=bridge1', check: s => T(s, 'interface bridge').some(r => r.name === 'bridge1') },
          { t: 'เพิ่ม <code>bond1</code> เข้า bridge1 เป็น uplink', hint: '/interface bridge port add bridge=bridge1 interface=bond1', check: s => T(s, 'interface bridge port').some(r => r.bridge === 'bridge1' && r.interface === 'bond1') },
          { t: 'เพิ่ม <code>ether2</code> เข้า bridge1', hint: '/interface bridge port add bridge=bridge1 interface=ether2', check: s => T(s, 'interface bridge port').some(r => r.interface === 'ether2' && r.bridge === 'bridge1') },
          { t: 'เพิ่ม <code>ether3</code> เข้า bridge1', hint: '/interface bridge port add bridge=bridge1 interface=ether3', check: s => T(s, 'interface bridge port').some(r => r.interface === 'ether3' && r.bridge === 'bridge1') },
          { t: 'ตั้ง <code>horizon=1</code> ให้ <code>ether2</code>', hint: '/interface bridge port set [find interface=ether2] horizon=1', check: s => T(s, 'interface bridge port').some(r => r.interface === 'ether2' && String(r.horizon) === '1') },
          { t: 'ตั้ง <code>horizon=1</code> ให้ <code>ether3</code>', hint: '/interface bridge port set [find interface=ether3] horizon=1', check: s => T(s, 'interface bridge port').some(r => r.interface === 'ether3' && String(r.horizon) === '1') },
          { t: 'ตรวจสอบผลด้วย <code>/interface bridge port print</code>', hint: '/interface bridge port print', check: (s, h) => h.some(c => /bridge\s+port\s+print/i.test(c)) },
        ],
      }],
    },

    // =========================================================
    5: {
      title: 'ออกแบบเครือข่าย L2 และ Operations',
      objectives: [
        'ออกแบบ topology L2 ที่ converge เร็วและ debug ง่าย',
        'วางแผน VLAN, MTU และ QoS ในระดับองค์กร',
        'เลือกรุ่นอุปกรณ์ให้ตรงกับ throughput ที่ต้องการ',
        'วางระบบ monitoring และ change management',
      ],
      sections: [
        {
          t: 'ออกแบบ Topology และเลือกรุ่น',
          h: `
<table class="tbl">
<tr><th>Topology</th><th>ข้อดี</th><th>ข้อเสีย</th></tr>
<tr><td>Star (จาก core ตัวเดียว)</td><td>เข้าใจง่าย ไม่มี loop</td><td>core ล่ม = ล่มหมด</td></tr>
<tr><td>Dual-star (core 2 ตัว)</td><td>redundant ดีที่สุด</td><td>ต้องจัดการ STP/MLAG ให้ดี</td></tr>
<tr><td>Ring</td><td>ประหยัดสาย เหมาะกับกล้อง CCTV ตามแนวยาว</td><td>ต้องพึ่ง RSTP ตัดวง — converge ช้ากว่า</td></tr>
<tr><td>Chain (ต่อกันเป็นแถว)</td><td>ประหยัดที่สุด</td><td>ตัวกลางล่ม = ตัวปลายหลุดหมด อย่าใช้ในงานสำคัญ</td></tr>
</table>
<p><b>เลือกรุ่นจากตัวเลขที่ต้องดูจริง ๆ:</b></p>
<table class="tbl">
<tr><th>ตัวเลข</th><th>ความหมาย</th></tr>
<tr><td>Switching capacity (Gbps)</td><td>ความสามารถรวมของ switch chip</td></tr>
<tr><td>Forwarding rate (Mpps)</td><td>จำนวน packet ต่อวินาที — สำคัญกับ traffic ที่ packet เล็ก</td></tr>
<tr><td>CPU / RAM</td><td>สำคัญเมื่อทำ routing, firewall หรืองานที่ offload ไม่ได้</td></tr>
<tr><td>จำนวน SFP+ / QSFP</td><td>เผื่อ uplink ในอนาคต</td></tr>
<tr><td>PoE budget (W)</td><td>รวมกำลังไฟที่จ่ายได้ทั้งเครื่อง ไม่ใช่ต่อพอร์ต</td></tr>
</table>
<div class="note warn"><b>คิด PoE ให้ครบ:</b> AP Wi-Fi 6 กินราว 15–25W, กล้อง PTZ กินได้ถึง 30W+ — สวิตช์ 24 พอร์ตที่มี PoE budget 250W จ่ายกล้อง 30W ได้แค่ 8 ตัวเท่านั้น</div>`,
        },
        {
          t: 'VLAN Plan, MTU และ QoS',
          h: `
<p><b>วางแผน VLAN ให้เป็นระบบตั้งแต่แรก</b> — เปลี่ยนทีหลังเจ็บปวดมาก</p>
<table class="tbl">
<tr><th>VLAN</th><th>ใช้ทำอะไร</th><th>Subnet ตัวอย่าง</th></tr>
<tr><td>10</td><td>Office / Data</td><td>10.10.10.0/24</td></tr>
<tr><td>20</td><td>VoIP</td><td>10.10.20.0/24</td></tr>
<tr><td>30</td><td>Wi-Fi พนักงาน</td><td>10.10.30.0/24</td></tr>
<tr><td>40</td><td>Guest (แยกออกจากทุกอย่าง)</td><td>10.10.40.0/24</td></tr>
<tr><td>50</td><td>CCTV / IoT</td><td>10.10.50.0/24</td></tr>
<tr><td>99</td><td>Management</td><td>10.10.99.0/24</td></tr>
<tr><td>999</td><td>Native/Blackhole (ไม่ใช้งานจริง)</td><td>—</td></tr>
</table>
<p><b>MTU และ Jumbo Frame</b> — จุดที่พลาดกันบ่อยเมื่อทำ storage หรือ VLAN ซ้อน</p>
<pre class="code"><span style="color:#5b6b8c"># L2MTU ต้องใหญ่พอสำหรับ payload + VLAN tag</span>
/interface ethernet set ether1 l2mtu=9000 mtu=9000
/interface bridge set bridge1 l2mtu=9000
/interface print detail                 <span style="color:#5b6b8c"># ตรวจ actual-mtu ที่ใช้จริง</span></pre>
<div class="note"><b>กฎ MTU:</b> ทุกอุปกรณ์ในเส้นทางเดียวกันต้องตั้ง MTU เท่ากัน ถ้าตัวใดตัวหนึ่งเล็กกว่า packet จะถูก fragment หรือถูกทิ้ง อาการที่เจอคือ "ping ได้แต่โอนไฟล์ใหญ่ค้าง"</div>
<pre class="code"><span style="color:#5b6b8c"># QoS: ให้ VoIP มาก่อนเสมอ (จัดที่ switch chip ได้เร็วกว่า queue ทาง CPU)</span>
/interface ethernet switch rule
add ports=ether2 new-dst-ports=ether1 dscp=46 switch=switch1 new-priority=7</pre>`,
        },
        {
          t: 'Operations และ Change Management',
          h: `
<pre class="code"><span style="color:#5b6b8c"># --- ก่อนแก้ config ทุกครั้ง ---</span>
/export file=before-change-2026-08-21
/system backup save name=before-change-2026-08-21

<span style="color:#5b6b8c"># --- ตาข่ายกันตัวเองหลุด: reboot อัตโนมัติถ้าไม่ยกเลิกใน 10 นาที ---</span>
/system scheduler add name=rollback start-time=00:00:00 interval=10m \\
    on-event="/system reboot"
<span style="color:#5b6b8c"># ถ้ายังเข้าเครื่องได้หลังแก้เสร็จ ให้ลบ scheduler ทิ้ง</span>
/system scheduler remove [find name=rollback]</pre>
<table class="tbl">
<tr><th>สิ่งที่ต้อง monitor</th><th>เครื่องมือ</th><th>เตือนเมื่อ</th></tr>
<tr><td>สถานะพอร์ต / bandwidth</td><td>SNMP + Zabbix/LibreNMS</td><td>พอร์ตดับ, ใช้เกิน 80% ต่อเนื่อง</td></tr>
<tr><td>CPU load</td><td>SNMP</td><td>เกิน 60% (มักแปลว่า offload หลุด)</td></tr>
<tr><td>CRC / error counter</td><td><code>/interface ethernet print stats</code></td><td>เพิ่มขึ้นเรื่อย ๆ = สาย/SFP มีปัญหา</td></tr>
<tr><td>SFP rx-power</td><td>SNMP / monitor</td><td>ต่ำกว่าเกณฑ์ของ module</td></tr>
<tr><td>STP topology change</td><td>syslog</td><td>เกิดบ่อยผิดปกติ = ลิงก์ไม่นิ่ง</td></tr>
</table>
<div class="note"><b>เอกสารที่ทีมต้องมี:</b> ผังพอร์ต (พอร์ตไหนไปห้องไหน), VLAN plan, IP plan, รหัสผ่านใน password manager, ไฟล์ export ล่าสุดใน Git — เมื่อคนที่ตั้งค่าลาออก เอกสารพวกนี้คือสิ่งเดียวที่เหลือ</div>`,
        },
      ],
      quiz: [
        { type: 'mcq', q: 'Topology แบบ ring ต้องพึ่งอะไรเพื่อไม่ให้เกิด loop', opts: ['NAT', 'RSTP / MSTP', 'DHCP', 'LACP'], a: 1, why: 'Ring มีเส้นทางวนอยู่แล้วโดยธรรมชาติ ต้องมี STP ตัดวงหนึ่งจุด แล้วจะเปิดคืนอัตโนมัติเมื่อเส้นทางหลักขาด' },
        { type: 'mcq', q: 'สวิตช์ 24 พอร์ต PoE budget 250W จ่ายกล้อง PTZ ที่กิน 30W ได้กี่ตัว', opts: ['24 ตัว', 'ประมาณ 8 ตัว', '12 ตัว', 'ไม่จำกัด'], a: 1, why: '250 ÷ 30 ≈ 8 ตัว — PoE budget คือกำลังไฟรวมทั้งเครื่อง ไม่ใช่ต่อพอร์ต ต้องคำนวณก่อนซื้อเสมอ' },
        { type: 'mcq', q: 'อาการ "ping ได้แต่โอนไฟล์ใหญ่ค้าง" มักเกิดจากอะไร', opts: ['DNS ผิด', 'MTU ไม่ตรงกันในเส้นทาง', 'VLAN ผิด', 'DHCP หมด pool'], a: 1, why: 'ping ใช้ packet เล็กจึงผ่านได้ แต่ packet ใหญ่ที่ตั้ง DF bit จะถูกทิ้งเมื่อเจอ MTU ที่เล็กกว่าในเส้นทาง' },
        { type: 'mcq', q: 'ค่า CPU load ของสวิตช์พุ่งสูงเมื่อมี traffic เยอะ บ่งบอกอะไรมากที่สุด', opts: ['ต้องเพิ่ม RAM', 'hardware offload หลุด traffic กำลังวิ่งผ่าน CPU', 'สายแลนไม่ดี', 'ต้องรีบูต'], a: 1, why: 'ถ้า offload ทำงานปกติ CPU จะแทบไม่ขยับแม้ traffic เต็มพอร์ต — CPU พุ่งคือสัญญาณแรกว่ามีบางอย่างดึง packet ขึ้นมา' },
        { type: 'multi', q: 'ควรทำอะไรก่อนแก้ config สวิตช์จากระยะไกล (เลือกทุกข้อที่ถูก)', opts: ['export และ backup config ปัจจุบัน', 'ตั้ง scheduler reboot ไว้เป็นตาข่ายกันหลุด', 'ลบ config เก่าทิ้งให้หมดก่อน', 'จดขั้นตอนย้อนกลับ (rollback plan)'], a: [0, 1, 3], why: 'การลบ config ก่อนคือวิธีทำให้ตัวเองหลุดจากเครื่องแบบกู้ไม่ได้ — ต้องมีทางถอยเสมอ' },
        { type: 'mcq', q: 'CRC error counter ที่เพิ่มขึ้นเรื่อย ๆ ที่พอร์ตหนึ่ง บอกอะไร', opts: ['มี traffic เยอะเป็นเรื่องปกติ', 'ปัญหาชั้นกายภาพ — สาย หัว หรือ SFP มีปัญหา', 'VLAN ตั้งผิด', 'STP กำลังทำงาน'], a: 1, why: 'CRC error หมายถึง frame ที่มาถึงเสียหาย เกือบทั้งหมดเป็นปัญหา Layer 1 — เปลี่ยนสาย/ทำความสะอาดหัวไฟเบอร์เป็นอย่างแรก' },
        { type: 'mcq', q: 'ทำไมจึงควรมี VLAN "blackhole" เช่น VLAN 999 ที่ไม่ใช้งานจริง', opts: ['เพื่อสำรองไว้ใช้อนาคต', 'ใช้เป็น native VLAN บน trunk และเป็นที่พักของพอร์ตที่ยังไม่ใช้งาน เพื่อไม่ให้ traffic หลุดไป VLAN จริง', 'เพื่อให้ STP ทำงานเร็วขึ้น', 'ไม่มีประโยชน์'], a: 1, why: 'พอร์ตว่างที่ยังอยู่ VLAN 1 คือช่องโหว่ — ย้ายไป VLAN ที่ไม่มีทางออกไหนเลยจะปลอดภัยกว่า' },
      ],
      labs: [{
        id: 'ms-l5-ops',
        title: 'Lab 5 — เตรียมสวิตช์เข้าสู่ Production',
        brief: 'ทำ VLAN plan ตามมาตรฐานองค์กร ย้ายพอร์ตว่างไป blackhole VLAN และเตรียมงานดูแลระบบ',
        device: 'mikrotik-sw',
        tasks: [
          { t: 'ตั้งชื่ออุปกรณ์เป็น <code>SW-FL2-01</code>', hint: '/system identity set name=SW-FL2-01', check: s => s.settings['system identity'].name === 'SW-FL2-01' },
          { t: 'สร้าง bridge <code>bridge1</code>', hint: '/interface bridge add name=bridge1', check: s => T(s, 'interface bridge').some(r => r.name === 'bridge1') },
          { t: 'เพิ่ม <code>ether1</code> เป็น trunk พร้อม <code>pvid=999</code>', hint: '/interface bridge port add bridge=bridge1 interface=ether1 pvid=999', check: s => T(s, 'interface bridge port').some(r => r.interface === 'ether1' && String(r.pvid) === '999') },
          { t: 'เพิ่ม <code>ether8</code> (พอร์ตว่าง) เข้า bridge1 ด้วย <code>pvid=999</code>', hint: '/interface bridge port add bridge=bridge1 interface=ether8 pvid=999', check: s => T(s, 'interface bridge port').some(r => r.interface === 'ether8' && String(r.pvid) === '999') },
          { t: 'ประกาศ VLAN 10 (Office) tagged <code>ether1</code>', hint: '/interface bridge vlan add bridge=bridge1 vlan-ids=10 tagged=ether1', check: s => hasVlan(s, 10) },
          { t: 'ประกาศ VLAN 50 (CCTV) tagged <code>ether1</code>', hint: '/interface bridge vlan add bridge=bridge1 vlan-ids=50 tagged=ether1', check: s => hasVlan(s, 50) },
          { t: 'ประกาศ VLAN 99 (Mgmt) tagged <code>ether1,bridge1</code>', hint: '/interface bridge vlan add bridge=bridge1 vlan-ids=99 tagged=ether1,bridge1', check: s => T(s, 'interface bridge vlan').some(r => String(r['vlan-ids']) === '99' && /bridge1/.test(r.tagged || '')) },
          { t: 'สร้าง VLAN interface <code>mgmt</code> vlan-id 99 และใส่ IP <code>10.10.99.12/24</code>', hint: '/interface vlan add name=mgmt vlan-id=99 interface=bridge1 → /ip address add address=10.10.99.12/24 interface=mgmt', check: s => T(s, 'interface vlan').some(r => r.name === 'mgmt') && T(s, 'ip address').some(r => r.address === '10.10.99.12/24' && r.interface === 'mgmt') },
          { t: 'ตั้ง netwatch เฝ้าดู gateway <code>10.10.99.1</code>', hint: '/tool netwatch add host=10.10.99.1', check: s => T(s, 'tool netwatch').some(r => r.host === '10.10.99.1') },
          { t: 'สร้าง scheduler <code>daily-backup</code> interval <code>1d</code>', hint: '/system scheduler add name=daily-backup interval=1d on-event="/export file=daily"', check: s => T(s, 'system scheduler').some(r => r.name === 'daily-backup' && String(r.interval) === '1d') },
        ],
      }],
    },
  },
};
