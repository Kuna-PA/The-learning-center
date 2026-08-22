// ============================================================
//  CCNA Domain 3 — IP Connectivity
//  Router ทำงานยังไง · static vs dynamic · OSPF · show ip route
// ============================================================
const said = (h, re) => h.some(c => re.test(String(c).trim()));

export default {
  title: 'IP Connectivity — Routing และ OSPF',
  objectives: [
    'อ่าน routing table เป็น และบอกได้ว่าอุปกรณ์จะเลือกเส้นทางไหน',
    'ตั้ง static route และ default route ได้',
    'อธิบายข้อดี/ข้อเสียของ static กับ dynamic routing',
    'ตั้งค่า OSPF single-area และตรวจ neighbor ได้',
  ],
  sections: [
    {
      t: 'Router ตัดสินใจอย่างไร — อ่าน routing table ให้เป็น',
      h: `
<p>เมื่อ packet มาถึง router มันถามคำถามเดียว: <b>"destination IP นี้ตรงกับเส้นทางไหนในตารางบ้าง"</b>
แล้วเลือกตามกฎสองข้อนี้ตามลำดับ</p>
<ol>
  <li><b>Longest prefix match</b> — เส้นทางที่เจาะจงกว่าชนะเสมอ
      ถ้ามีทั้ง <code>10.0.0.0/8</code> และ <code>10.1.1.0/24</code> packet ที่ไป 10.1.1.5 จะใช้ /24</li>
  <li>ถ้า prefix เท่ากัน ดู <b>Administrative Distance (AD)</b> — เลขน้อยน่าเชื่อถือกว่า</li>
</ol>
<table class="tbl">
<tr><th>ที่มาของเส้นทาง</th><th>AD</th><th>ตัวอักษรใน show ip route</th></tr>
<tr><td>Connected (ต่อตรง)</td><td>0</td><td>C</td></tr>
<tr><td>Static</td><td>1</td><td>S</td></tr>
<tr><td>OSPF</td><td>110</td><td>O</td></tr>
<tr><td>RIP</td><td>120</td><td>R</td></tr>
</table>
<p>ตัวอย่าง output ที่ต้องอ่านออก:</p>
<pre><code>Gateway of last resort is 203.0.113.1 to network 0.0.0.0

S*   0.0.0.0/0 [1/0] via 203.0.113.1
C    192.168.10.0/24 is directly connected, Vlan10
L    192.168.10.1/32 is directly connected, Vlan10
O    192.168.20.0/24 [110/2] via 10.0.0.2, 00:04:12, Vlan99</code></pre>
<ul>
  <li><code>S*</code> = static default route (ดาวคือ gateway of last resort)</li>
  <li><code>[1/0]</code> = [AD / metric]</li>
  <li><code>C</code> คือวงที่ต่อตรง ส่วน <code>L</code> คือ IP ของตัวอุปกรณ์เอง (/32)</li>
</ul>
<div class="note"><b>Default gateway ในมุมของเครื่องผู้ใช้</b> ก็คือ default route นี่แหละ —
"ถ้าไม่รู้จะส่งไปไหน ส่งมาที่ฉัน" ถ้าเครื่องตั้ง gateway ผิด จะคุยกันในวงเดียวกันได้ แต่ออกนอกวงไม่ได้เลย</div>`,
    },
    {
      t: 'Static Route กับ Default Route',
      h: `
<p>เขียนเส้นทางด้วยมือ เหมาะกับเครือข่ายเล็กหรือเส้นทางที่ไม่มีวันเปลี่ยน</p>
<pre><code>ip route &lt;ปลายทาง&gt; &lt;subnet mask&gt; &lt;next-hop&gt;

ip route 192.168.20.0 255.255.255.0 10.0.0.2     ! ไปวง 20 ให้ส่งต่อที่ 10.0.0.2
ip route 0.0.0.0 0.0.0.0 203.0.113.1             ! default route — ที่เหลือทั้งหมดออกทางนี้</code></pre>
<table class="tbl">
<tr><th></th><th>Static</th><th>Dynamic (OSPF)</th></tr>
<tr><td>ตั้งค่า</td><td>ง่ายในวงเล็ก แต่ยิ่งโตยิ่งบานปลาย</td><td>ตั้งครั้งเดียว เพิ่มวงใหม่ router รู้เอง</td></tr>
<tr><td>ทรัพยากร</td><td>ไม่กิน CPU/RAM</td><td>กินบ้าง ต้องคุยกันตลอด</td></tr>
<tr><td>เส้นทางล่ม</td><td><b>ไม่รู้เรื่อง</b> ยังส่งเข้ารูดำ</td><td>คำนวณเส้นทางสำรองให้อัตโนมัติ</td></tr>
<tr><td>เหมาะกับ</td><td>default route ออกอินเทอร์เน็ต, วงปลายทางเดียว</td><td>องค์กรที่มีหลายวง/หลายสาขา</td></tr>
</table>
<div class="note warn"><b>กับดักที่เจอบ่อย:</b> ตั้ง static route ครบแล้วแต่ยัง ping ไม่ถึง —
อย่าลืมว่าเส้นทาง<b>ขากลับ</b>ต้องมีด้วย ปลายทางต้องรู้ทางกลับมาหาเราเหมือนกัน</div>`,
    },
    {
      t: 'OSPF — ให้ router คุยกันเอง',
      h: `
<p>OSPF เป็น <b>link-state protocol</b> — ทุกตัวส่งข้อมูลลิงก์ของตัวเองให้เพื่อนบ้าน
จนทุกตัวมีแผนที่เครือข่ายเหมือนกัน แล้วต่างคนต่างคำนวณเส้นทางที่สั้นที่สุด (SPF)</p>
<p><b>ขั้นตอนตั้งค่า single-area:</b></p>
<pre><code>router ospf 1                                   ! process id ใช้เฉพาะในเครื่องนี้ ไม่ต้องตรงกับเพื่อน
 router-id 1.1.1.1                              ! ตั้งเองให้ชัด ดีกว่าปล่อยให้เลือกจาก IP สูงสุด
 network 192.168.10.0 0.0.0.255 area 0          ! ประกาศวงที่จะเข้าร่วม (ใช้ wildcard mask)
 network 10.0.0.0 0.0.0.3 area 0
 passive-interface Vlan10                       ! วงผู้ใช้ ไม่ต้องส่ง hello ออกไป</code></pre>
<p><b>Wildcard mask คือส่วนกลับของ subnet mask</b> — บิตที่เป็น 0 คือ "ต้องตรง"</p>
<table class="tbl">
<tr><th>Subnet mask</th><th>Wildcard</th></tr>
<tr><td>255.255.255.0 (/24)</td><td>0.0.0.255</td></tr>
<tr><td>255.255.255.192 (/26)</td><td>0.0.0.63</td></tr>
<tr><td>255.255.255.252 (/30)</td><td>0.0.0.3</td></tr>
</table>
<p><b>สิ่งที่ต้องตรงกันสองฝั่ง ไม่งั้น neighbor ไม่ขึ้น:</b> area เดียวกัน · subnet เดียวกัน ·
hello/dead timer ตรงกัน · การยืนยันตัวตน (ถ้าตั้ง) ตรงกัน · MTU ตรงกัน</p>
<p><b>คำสั่งตรวจ:</b></p>
<table class="tbl">
<tr><th>คำสั่ง</th><th>ดูอะไร</th></tr>
<tr><td><code>show ip ospf neighbor</code></td><td>คุยกับใครได้บ้าง สถานะควรเป็น FULL</td></tr>
<tr><td><code>show ip ospf interface</code></td><td>interface ไหนเข้าร่วม OSPF อยู่ area ไหน</td></tr>
<tr><td><code>show ip protocols</code></td><td>สรุปว่ากำลังประกาศวงอะไรอยู่</td></tr>
<tr><td><code>show ip route</code></td><td>เส้นทางที่เรียนรู้มา ขึ้นตัว <code>O</code></td></tr>
</table>
<div class="note"><b>passive-interface สำคัญกว่าที่คิด:</b> วงที่มีแต่เครื่องผู้ใช้ไม่ควรส่ง OSPF hello ออกไป
เพราะเปลืองแบนด์วิดท์และเปิดช่องให้คนแปลกปลอมเข้ามาเป็น neighbor — แต่วงนั้นยังถูกประกาศให้เพื่อนรู้ตามปกติ</div>`,
    },
  ],
  quiz: [
    { type: 'mcq', q: 'Routing table มีทั้ง 10.0.0.0/8 และ 10.1.1.0/24 — packet ที่ไป 10.1.1.50 จะใช้เส้นทางไหน?', opts: ['10.0.0.0/8 เพราะมาก่อน', '10.1.1.0/24 เพราะ prefix ยาวกว่า', 'สุ่มเลือก', 'ทิ้ง packet เพราะซ้ำซ้อน'], a: 1, why: 'กฎ longest prefix match — เส้นทางที่เจาะจงกว่าชนะเสมอ ไม่เกี่ยวกับลำดับหรือ AD' },
    { type: 'mcq', q: 'ในบรรทัด <code>S* 0.0.0.0/0 [1/0] via 203.0.113.1</code> เลข 1 หมายถึงอะไร?', opts: ['Metric', 'Administrative Distance', 'จำนวน hop', 'Process ID'], a: 1, why: 'รูปแบบคือ [AD/metric] — static route มี AD = 1 ส่วน metric เป็น 0' },
    { type: 'mcq', q: 'ตั้ง static route ไปวงปลายทางครบแล้วแต่ยัง ping ไม่ถึง สาเหตุที่พบบ่อยที่สุดคืออะไร?', opts: ['ต้องรีบูต router', 'ปลายทางไม่มีเส้นทางขากลับ', 'static route ใช้กับ IPv4 ไม่ได้', 'ต้องเปิด OSPF ก่อน'], a: 1, why: 'การสื่อสารต้องไปกลับได้ทั้งสองทาง ถ้าปลายทางไม่รู้ทางกลับ ICMP reply ก็ส่งกลับไม่ได้' },
    { type: 'mcq', q: 'ต้องการประกาศวง 172.16.8.0/22 เข้า OSPF ต้องใช้ wildcard mask อะไร?', opts: ['0.0.0.255', '0.0.3.255', '0.0.255.255', '255.255.252.0'], a: 1, why: '/22 = 255.255.252.0 กลับด้านได้ 0.0.3.255' },
    { type: 'mcq', q: 'OSPF neighbor ไม่ขึ้นเลย ข้อใด<b>ไม่ใช่</b>สาเหตุ?', opts: ['อยู่คนละ area', 'IP อยู่คนละ subnet', 'process id (router ospf N) ไม่ตรงกัน', 'MTU ไม่ตรงกัน'], a: 2, why: 'process id เป็นเลขที่ใช้เฉพาะภายในเครื่องนั้น ไม่จำเป็นต้องตรงกันสองฝั่ง' },
    { type: 'cmd', q: 'พิมพ์คำสั่งตั้ง default route ให้ traffic ที่ไม่รู้ปลายทางออกไปที่ 203.0.113.1', ans: ['ip route 0.0.0.0 0.0.0.0 203.0.113.1'], why: 'ip route 0.0.0.0 0.0.0.0 <next-hop> คือ default route — จะขึ้นเป็น gateway of last resort' },
    { type: 'cmd', q: 'พิมพ์คำสั่งดูว่า OSPF จับคู่กับเพื่อนบ้านได้แล้วหรือยัง', ans: ['show ip ospf neighbor', 'sh ip ospf neighbor', 'sh ip ospf nei', 'show ip ospf nei'], why: 'show ip ospf neighbor — สถานะที่ปกติคือ FULL ถ้าค้างที่ INIT หรือ 2WAY แปลว่าคุยได้ทางเดียวหรือติดเงื่อนไข' },
  ],
  labs: [
    {
      id: 'c3-static',
      title: 'Lab 3A — Inter-VLAN Routing และ Default Route',
      brief: 'สองแผนกอยู่คนละ VLAN และคุยกันไม่ได้ ทั้งที่เสียบสวิตช์ตัวเดียวกัน — ให้เปิดการ route ในสวิตช์แล้วชี้ทางออกอินเทอร์เน็ตให้ถูก',
      device: 'cisco',
      init: { apply: st => { st.hostname = 'SW-L3'; } },
      tasks: [
        { t: 'เข้า global config mode', hint: 'enable → configure terminal', check: s => s.mode.startsWith('config') || s.mode === 'priv' },
        { t: 'เปิดความสามารถ routing ของสวิตช์', hint: 'ip routing', check: s => s.ipRouting === true },
        { t: 'สร้าง VLAN 10 และ VLAN 20', hint: 'vlan 10 → exit → vlan 20', check: s => !!s.vlans[10] && !!s.vlans[20] },
        { t: 'ตั้ง SVI VLAN 10 = <code>10.10.10.1/24</code> และเปิดใช้งาน', hint: 'interface vlan 10 → ip address 10.10.10.1 255.255.255.0 → no shutdown', check: s => s.svis[10] && s.svis[10].ip === '10.10.10.1' && s.svis[10].shutdown === false },
        { t: 'ตั้ง SVI VLAN 20 = <code>10.10.20.1/24</code> และเปิดใช้งาน', hint: 'interface vlan 20 → ip address 10.10.20.1 255.255.255.0 → no shutdown', check: s => s.svis[20] && s.svis[20].ip === '10.10.20.1' && s.svis[20].shutdown === false },
        { t: 'เพิ่ม <b>default route</b> ออกอินเทอร์เน็ตที่ <code>10.10.99.254</code>', hint: 'ip route 0.0.0.0 0.0.0.0 10.10.99.254', check: s => s.routes.some(r => r.net === '0.0.0.0' && r.nh === '10.10.99.254') },
        { t: 'เพิ่ม static route ไปวงสาขา <code>172.16.5.0/24</code> ผ่าน <code>10.10.99.2</code>', hint: 'ip route 172.16.5.0 255.255.255.0 10.10.99.2', check: s => s.routes.some(r => r.net === '172.16.5.0' && r.nh === '10.10.99.2') },
        { t: 'ตรวจตารางเส้นทางด้วย <code>show ip route</code>', hint: 'do show ip route', check: (s, h) => said(h, /^(do\s+)?sh(ow)?\s+ip\s+ro/i) },
        { t: 'บันทึก config', hint: 'end → write memory', check: s => !!s.savedConfig },
      ],
      debrief: `<b>สวิตช์ L2 ธรรมดา route ไม่ได้</b> ต้องสั่ง <code>ip routing</code> ก่อน — ลืมข้อนี้คือสาเหตุอันดับหนึ่งที่ SVI ตั้งครบแล้วแต่ข้าม VLAN ไม่ได้<br>
        <b>SVI คือ gateway ของ VLAN นั้น</b> เครื่องผู้ใช้ใน VLAN 10 ต้องตั้ง gateway เป็น 10.10.10.1<br>
        <b>Default route ควรมีเส้นเดียว</b> — ถ้ามีหลายเส้นชี้คนละทางโดยไม่ตั้งใจ traffic จะกระเด็นไปผิดทางแบบหาสาเหตุยาก`,
    },
    {
      id: 'c3-ospf',
      title: 'Lab 3B — เปิด OSPF ให้เครือข่ายเรียนรู้เส้นทางเอง',
      brief: 'เครือข่ายโตขึ้นจนเขียน static route ไม่ไหว ทุกครั้งที่เพิ่มวงต้องไปแก้ทุกเครื่อง — ถึงเวลาย้ายไป OSPF ให้ทุกตัวคุยกันเองและคำนวณเส้นทางสำรองอัตโนมัติ',
      device: 'cisco',
      init: {
        apply: st => {
          st.hostname = 'SW-DIST01';
          st.ipRouting = true;
          st.vlans[10] = { id: 10, name: 'USERS' };
          st.vlans[99] = { id: 99, name: 'CORE-LINK' };
          st.svis[10] = { ip: '192.168.10.1', mask: '255.255.255.0', shutdown: false, desc: '', helpers: [] };
          st.svis[99] = { ip: '10.0.0.1', mask: '255.255.255.252', shutdown: false, desc: '', helpers: [] };
        },
      },
      tasks: [
        { t: 'เข้า global config mode', hint: 'enable → configure terminal', check: s => s.mode.startsWith('config') || s.mode === 'priv' },
        { t: 'เปิด OSPF process <code>1</code>', hint: 'router ospf 1', check: s => !!s.ospf && s.ospf.pid === 1 },
        { t: 'ตั้ง <b>router-id</b> เป็น <code>1.1.1.1</code> ให้ชัดเจน ไม่ปล่อยให้ระบบเลือกเอง', hint: 'router-id 1.1.1.1', check: s => s.ospf && s.ospf.routerId === '1.1.1.1' },
        {
          t: 'ประกาศวงผู้ใช้ <code>192.168.10.0/24</code> เข้า area 0 (wildcard <code>0.0.0.255</code>)',
          hint: 'network 192.168.10.0 0.0.0.255 area 0',
          check: s => s.ospf && s.ospf.networks.some(n => n.net === '192.168.10.0' && n.wc === '0.0.0.255' && String(n.area) === '0'),
        },
        {
          t: 'ประกาศลิงก์ไป core <code>10.0.0.0/30</code> เข้า area 0 (wildcard <code>0.0.0.3</code>)',
          hint: 'network 10.0.0.0 0.0.0.3 area 0',
          check: s => s.ospf && s.ospf.networks.some(n => n.net === '10.0.0.0' && n.wc === '0.0.0.3' && String(n.area) === '0'),
        },
        {
          t: 'ตั้ง <code>Vlan10</code> เป็น <b>passive-interface</b> — วงผู้ใช้ไม่ต้องส่ง hello ออกไป',
          hint: 'passive-interface Vlan10',
          check: s => s.ospf && s.ospf.passive.some(x => /vlan\s*10/i.test(x)),
        },
        { t: 'ออกจากโหมด router แล้วตรวจ neighbor ด้วย <code>show ip ospf neighbor</code>', hint: 'exit → do show ip ospf neighbor', check: (s, h) => said(h, /^(do\s+)?sh(ow)?\s+ip\s+ospf\s+nei/i) },
        { t: 'ตรวจว่า interface ไหนเข้าร่วม OSPF แล้ว', hint: 'show ip ospf interface', check: (s, h) => said(h, /^(do\s+)?sh(ow)?\s+ip\s+ospf\s+int/i) },
        { t: 'ดูสรุปด้วย <code>show ip protocols</code>', hint: 'show ip protocols', check: (s, h) => said(h, /^(do\s+)?sh(ow)?\s+ip\s+prot/i) },
        { t: 'บันทึก config', hint: 'end → write memory', check: s => !!s.savedConfig },
      ],
      debrief: `<b>network + wildcard ไม่ได้แปลว่า "ประกาศวงนี้"</b> แต่แปลว่า "interface ที่ IP ตรงเงื่อนไขนี้ ให้เข้าร่วม OSPF" — ผลลัพธ์ที่ได้คือวงของ interface นั้นถูกประกาศออกไป<br>
        <b>router-id ควรตั้งเอง</b> ถ้าปล่อยว่าง OSPF จะเลือกจาก IP ที่สูงที่สุด ซึ่งเปลี่ยนได้เมื่อมีการแก้ IP ทำให้ neighbor รีเซ็ตแบบไม่มีสาเหตุ<br>
        <b>เจอ neighbor ค้างที่ INIT</b> = เราได้ยินเขา แต่เขาไม่ได้ยินเรา ให้ไปดูฝั่งตรงข้ามว่า network ครอบคลุม interface นั้นหรือยัง`,
    },
  ],
};
