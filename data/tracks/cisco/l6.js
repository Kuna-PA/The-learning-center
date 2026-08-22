// ============================================================
//  CCNA Domain 6 — Automation and Programmability
//  ทำไมงาน network ถึงกำลังย้ายจาก "พิมพ์ทีละเครื่อง" ไปเป็น "สั่งด้วยโค้ด"
// ============================================================
const said = (h, re) => h.some(c => re.test(String(c).trim()));

export default {
  title: 'Automation — จากพิมพ์ทีละเครื่องสู่การสั่งด้วยโค้ด',
  objectives: [
    'อธิบายได้ว่า network automation แก้ปัญหาอะไรที่การพิมพ์มือแก้ไม่ได้',
    'อ่านและเขียนโครงสร้าง JSON ที่ใช้กับ REST API ได้',
    'แยกได้ว่า REST API, NETCONF, RESTCONF ต่างกันตรงไหน',
    'อธิบายแนวคิด SDN และบทบาทของ controller อย่าง Cisco DNA Center',
    'ออกแบบ config ให้เป็นแม่แบบที่ทำซ้ำได้ทุกเครื่อง',
  ],
  sections: [
    {
      t: 'ทำไมต้อง Automation',
      h: `
<p>สมมติต้องเพิ่ม VLAN ใหม่ให้สวิตช์ 40 ตัว ถ้าทำมือคือ SSH เข้า 40 ครั้ง พิมพ์ชุดเดิม 40 รอบ
สิ่งที่จะเกิดขึ้นแน่นอนคือ <b>มีอย่างน้อยหนึ่งเครื่องที่พิมพ์ไม่เหมือนเพื่อน</b> — และเครื่องนั้นแหละที่จะกลายเป็นปัญหาในอีกหกเดือน</p>
<table class="tbl">
<tr><th>ปัญหาของการทำมือ</th><th>Automation ช่วยยังไง</th></tr>
<tr><td>Config drift — แต่ละเครื่องไม่เหมือนกันโดยไม่มีใครรู้</td><td>สั่งจากแม่แบบเดียว ทุกเครื่องเหมือนกันเป๊ะ</td></tr>
<tr><td>ไม่มีบันทึกว่าใครแก้อะไรตอนไหน</td><td>config อยู่ใน Git มีประวัติครบ</td></tr>
<tr><td>ทำซ้ำ 40 ครั้งเสี่ยงพิมพ์ผิด</td><td>เขียนครั้งเดียว รันกี่เครื่องก็ได้</td></tr>
<tr><td>คนที่รู้วิธีลาออกแล้วความรู้หายไปด้วย</td><td>ขั้นตอนอยู่ในโค้ดที่คนอื่นอ่านต่อได้</td></tr>
</table>
<div class="note"><b>เริ่มจากจุดที่เจ็บที่สุดก่อน</b> — ไม่ต้องเขียนโปรแกรมทั้งระบบตั้งแต่วันแรก
เริ่มจาก "ดึง config ของทุกเครื่องมาเก็บอัตโนมัติทุกคืน" ก็ได้ประโยชน์ทันทีและความเสี่ยงต่ำ</div>`,
    },
    {
      t: 'JSON และ REST API',
      h: `
<p>อุปกรณ์สมัยใหม่คุยกันด้วย API ที่ส่งข้อมูลเป็น <b>JSON</b> — โครงสร้างที่ทั้งคนและเครื่องอ่านได้</p>
<pre><code>{
  "hostname": "SW-ACCESS-01",
  "vlans": [
    { "id": 10, "name": "SALES" },
    { "id": 20, "name": "IT" }
  ],
  "management": {
    "ip": "192.168.1.10",
    "gateway": "192.168.1.1"
  },
  "snmp_enabled": true
}</code></pre>
<p>กฎที่ต้องจำ: ใช้ <code>{}</code> สำหรับ object (คู่ key–value), <code>[]</code> สำหรับ list,
key ต้องอยู่ในเครื่องหมายคำพูดคู่เสมอ, ค่ามีได้เป็น string / number / true–false / null / object / list
และ <b>ห้ามมีลูกน้ำหลังตัวสุดท้าย</b></p>
<p><b>REST API</b> ใช้ HTTP method สื่อความหมายว่าจะทำอะไร</p>
<table class="tbl">
<tr><th>Method</th><th>ความหมาย</th><th>ตัวอย่าง</th></tr>
<tr><td>GET</td><td>อ่าน</td><td>ขอรายการ VLAN ทั้งหมด</td></tr>
<tr><td>POST</td><td>สร้างใหม่</td><td>เพิ่ม VLAN 30</td></tr>
<tr><td>PUT / PATCH</td><td>แก้ (ทั้งก้อน / บางส่วน)</td><td>เปลี่ยนชื่อ VLAN 30</td></tr>
<tr><td>DELETE</td><td>ลบ</td><td>ลบ VLAN 30</td></tr>
</table>
<table class="tbl">
<tr><th>รหัสตอบกลับ</th><th>แปลว่า</th></tr>
<tr><td>200 / 201</td><td>สำเร็จ / สร้างแล้ว</td></tr>
<tr><td>401 / 403</td><td>ไม่ได้ยืนยันตัวตน / ยืนยันแล้วแต่ไม่มีสิทธิ์</td></tr>
<tr><td>404</td><td>ไม่พบสิ่งที่ขอ</td></tr>
<tr><td>500</td><td>ฝั่งเซิร์ฟเวอร์พัง</td></tr>
</table>`,
    },
    {
      t: 'NETCONF, RESTCONF, SDN และ DNA Center',
      h: `
<table class="tbl">
<tr><th></th><th>NETCONF</th><th>RESTCONF</th><th>REST API ทั่วไป</th></tr>
<tr><td>ขนส่ง</td><td>SSH (พอร์ต 830)</td><td>HTTPS</td><td>HTTPS</td></tr>
<tr><td>รูปแบบข้อมูล</td><td>XML</td><td>JSON หรือ XML</td><td>JSON</td></tr>
<tr><td>โครงสร้าง</td><td>ใช้ YANG model</td><td>ใช้ YANG model</td><td>ผู้ผลิตกำหนดเอง</td></tr>
<tr><td>จุดเด่น</td><td>มี candidate config, rollback ได้</td><td>เรียกง่ายกว่า NETCONF</td><td>ใช้กับ controller/cloud</td></tr>
</table>
<p><b>YANG</b> คือภาษาที่ใช้บรรยายว่า "อุปกรณ์นี้มีค่าอะไรตั้งได้บ้าง ชนิดอะไร" —
เป็นตัวกลางให้เครื่องมือคุยกับอุปกรณ์ต่างยี่ห้อด้วยโครงสร้างเดียวกัน</p>
<p><b>SDN — แยกสมองออกจากแขนขา</b></p>
<ul>
  <li><b>Control plane</b> = สมอง ตัดสินใจว่าเส้นทางไหนดี (เดิมอยู่ในอุปกรณ์ทุกตัว)</li>
  <li><b>Data plane</b> = แขนขา ส่ง packet ตามที่ถูกสั่ง</li>
  <li>SDN ยก control plane ไปไว้ที่ <b>controller</b> ส่วนกลาง แล้วสั่งอุปกรณ์ทั้งหมดจากที่เดียว</li>
</ul>
<p>ทิศทางการเรียก API สองด้านของ controller:</p>
<table class="tbl">
<tr><th>ทิศ</th><th>คุยกับใคร</th><th>ตัวอย่าง</th></tr>
<tr><td><b>Northbound</b></td><td>ขึ้นไปหาแอป/สคริปต์ของเรา</td><td>REST API ของ DNA Center</td></tr>
<tr><td><b>Southbound</b></td><td>ลงไปหาอุปกรณ์</td><td>NETCONF, RESTCONF, OpenFlow</td></tr>
</table>
<p><b>Cisco DNA Center</b> คือ controller สำหรับ campus network — ทำ inventory อัตโนมัติ,
สร้าง config จาก template, ตรวจ compliance ว่าเครื่องไหนหลุดมาตรฐาน และดูสุขภาพเครือข่ายรวมในที่เดียว</p>
<div class="note warn"><b>Automation ไม่ได้แทนความเข้าใจพื้นฐาน</b> — สคริปต์ที่สั่งผิดจะสั่งผิดพร้อมกัน 40 เครื่องในสามวินาที
คนที่เขียน automation ได้ดีคือคนที่รู้ว่าคำสั่งแต่ละบรรทัดทำอะไร ไม่ใช่คนที่ copy โค้ดมาแล้วกด run</div>`,
    },
  ],
  quiz: [
    { type: 'mcq', q: 'ปัญหา "config drift" หมายถึงอะไร?', opts: ['อุปกรณ์เก็บ config ไม่ได้', 'แต่ละเครื่องมี config ไม่เหมือนกันโดยไม่มีใครรู้ว่าต่างตรงไหน', 'config หายเมื่อรีบูต', 'IP ชนกัน'], a: 1, why: 'เกิดจากการแก้มือทีละเครื่องสะสมมานาน — automation แก้ได้เพราะทุกเครื่องถูกสร้างจากแม่แบบเดียว' },
    { type: 'mcq', q: 'ต้องการ<b>อ่าน</b>รายการ VLAN จากอุปกรณ์ผ่าน REST API ควรใช้ HTTP method ใด?', opts: ['GET', 'POST', 'PUT', 'DELETE'], a: 0, why: 'GET ใช้อ่านข้อมูลโดยไม่เปลี่ยนแปลงอะไร ส่วน POST/PUT/DELETE ใช้สร้าง/แก้/ลบ' },
    { type: 'mcq', q: 'เรียก API แล้วได้รหัส 401 กลับมา แปลว่าอะไร?', opts: ['ไม่พบ resource ที่ขอ', 'ยังไม่ได้ยืนยันตัวตน หรือ token ไม่ถูกต้อง', 'เซิร์ฟเวอร์พัง', 'สำเร็จแล้ว'], a: 1, why: '401 Unauthorized = ปัญหาการยืนยันตัวตน ส่วน 403 คือยืนยันแล้วแต่ไม่มีสิทธิ์ และ 404 คือหาไม่เจอ' },
    { type: 'mcq', q: 'NETCONF ต่างจาก RESTCONF อย่างชัดเจนที่สุดในข้อใด?', opts: ['NETCONF ใช้ SSH และ XML ส่วน RESTCONF ใช้ HTTPS และรองรับ JSON', 'NETCONF ใช้ได้กับ Cisco เท่านั้น', 'RESTCONF ไม่ใช้ YANG model', 'NETCONF ไม่ต้องยืนยันตัวตน'], a: 0, why: 'ทั้งคู่อิง YANG เหมือนกัน แต่ NETCONF วิ่งบน SSH/XML ส่วน RESTCONF วิ่งบน HTTPS และรองรับ JSON' },
    { type: 'mcq', q: 'ใน SDN คำว่า Northbound API หมายถึงอะไร?', opts: ['API ที่ controller ใช้สั่งอุปกรณ์', 'API ที่แอปพลิเคชันหรือสคริปต์ใช้เรียก controller', 'โปรโตคอล routing แบบใหม่', 'ช่องต่อสายไฟเบอร์'], a: 1, why: 'Northbound คือทิศขึ้นไปหาแอป ส่วน Southbound คือทิศลงไปหาอุปกรณ์ (NETCONF/OpenFlow)' },
    { type: 'multi', q: 'ข้อใดเป็นโครงสร้าง JSON ที่ถูกต้อง (เลือกทุกข้อที่ถูก)', opts: ['{"id": 10, "name": "SALES"}', '{id: 10, name: SALES}', '["vlan10", "vlan20"]', '{"enabled": true, "vlans": [10, 20]}'], a: [0, 2, 3], why: 'JSON บังคับให้ key และ string อยู่ในเครื่องหมายคำพูดคู่ ตัวเลือกที่สองจึงผิด' },
    { type: 'cmd', q: 'พิมพ์คำสั่งดึง config ปัจจุบันทั้งก้อน เพื่อเอาไปเก็บเป็นไฟล์อ้างอิงใน Git', ans: ['show running-config', 'sh run', 'show run', 'sh running-config'], why: 'show running-config คือแหล่งความจริงของเครื่อง ณ ตอนนั้น — งาน automation ขั้นแรกสุดคือดึงอันนี้มาเก็บอัตโนมัติ' },
  ],
  labs: [
    {
      id: 'c6-template',
      title: 'Lab 6A — สร้าง Config แม่แบบที่ทำซ้ำได้ทุกเครื่อง',
      brief: 'ก่อนจะเขียนสคริปต์สั่ง 40 เครื่อง ต้องรู้ก่อนว่า "แม่แบบ" ที่ดีหน้าตาเป็นอย่างไร — ตั้งค่าสวิตช์ access หนึ่งตัวให้ครบตามมาตรฐานองค์กร แล้วดึง config ออกมาเป็นต้นแบบ',
      device: 'cisco',
      init: { apply: st => { st.hostname = 'Switch'; } },
      tasks: [
        { t: 'เข้า global config mode', hint: 'enable → configure terminal', check: s => s.mode.startsWith('config') || s.mode === 'priv' },
        { t: 'ตั้งชื่อเครื่องตามมาตรฐาน <code>SW-ACC-0301</code> (ชนิด-ชั้น-ลำดับ)', hint: 'hostname SW-ACC-0301', check: s => s.hostname === 'SW-ACC-0301' },
        { t: 'ตั้ง <code>ip domain-name corp.local</code>', hint: 'ip domain-name corp.local', check: s => s.domainName === 'corp.local' },
        { t: 'ปิด <code>ip domain-lookup</code> เพื่อไม่ให้พิมพ์ผิดแล้วค้างรอ DNS', hint: 'no ip domain-lookup', check: s => s.domainLookup === false },
        { t: 'ตั้งเซิร์ฟเวอร์เวลา <code>ntp server 192.168.1.10</code> ให้ log ตรงกันทุกเครื่อง', hint: 'ntp server 192.168.1.10', check: s => (s.ntpServers || []).some(x => /192\.168\.1\.10/.test(String(x))) },
        { t: 'ส่ง log ออกไปเก็บที่ <code>logging host 192.168.1.50</code>', hint: 'logging host 192.168.1.50', check: s => (s.loggingHosts || []).includes('192.168.1.50') },
        { t: 'ตั้ง SNMP community แบบอ่านอย่างเดียวชื่อ <code>NOC-RO</code>', hint: 'snmp-server community NOC-RO ro', check: s => (s.snmp || []).some(x => /NOC-RO/i.test(x.name || String(x))) },
        { t: 'สร้าง VLAN 10 ชื่อ <code>USERS</code> ตามมาตรฐาน', hint: 'vlan 10 → name USERS', check: s => s.vlans[10] && /users/i.test(s.vlans[10].name) },
        { t: 'ดึง config ทั้งก้อนออกมาด้วย <code>show running-config</code> เพื่อใช้เป็นต้นแบบ', hint: 'do show running-config', check: (s, h) => said(h, /^(do\s+)?sh(ow)?\s+run/i) },
        { t: 'บันทึก config ลง NVRAM', hint: 'end → write memory', check: s => !!s.savedConfig },
      ],
      debrief: `<b>แม่แบบที่ดีเริ่มจากการตั้งชื่อที่มีระบบ</b> — <code>SW-ACC-0301</code> บอกได้ทันทีว่าเป็นสวิตช์ access ชั้น 3 ตัวที่ 1
เวลามี 200 เครื่อง ชื่อที่มีระบบคือสิ่งเดียวที่ทำให้ยังทำงานต่อได้<br>
        <b>ทุกบรรทัดในแม่แบบต้องตอบได้ว่าทำไม</b> — NTP มีไว้ให้ log เรียงถูก, Syslog มีไว้ให้สืบย้อนได้,
        SNMP แบบ ro มีไว้ให้ดูได้แต่แก้ไม่ได้<br>
        <b>ขั้นถัดไปในโลกจริง:</b> เอา <code>show running-config</code> นี้ไปเก็บใน Git ทุกคืน
        แล้ว diff กับของเมื่อวาน — เท่านี้ก็จับ config drift ได้โดยยังไม่ต้องเขียนโปรแกรมอะไรเลย`,
    },
    {
      id: 'c6-verify',
      title: 'Lab 6B — ตรวจ Compliance ก่อนส่งมอบ',
      brief: 'ทีม audit ขอหลักฐานว่าสวิตช์ตัวนี้ตรงตามมาตรฐานความปลอดภัยขององค์กร — ให้เก็บข้อมูลจากเครื่องให้ครบทุกหัวข้อที่ต้องรายงาน เหมือนที่สคริปต์ตรวจ compliance จะทำแทนเราในอนาคต',
      device: 'cisco',
      init: {
        apply: st => {
          st.hostname = 'SW-ACC-0301';
          st.vlans[10] = { id: 10, name: 'USERS' };
          st.ntpServers = ['192.168.1.10'];
        },
      },
      tasks: [
        { t: 'เข้าสู่ privileged EXEC mode', hint: 'enable', check: s => s.mode !== 'user' },
        { t: 'เก็บรุ่น IOS และ uptime', hint: 'show version', check: (s, h) => said(h, /^(do\s+)?sh(ow)?\s+ver/i) },
        { t: 'เก็บ config ปัจจุบันทั้งก้อน', hint: 'show running-config', check: (s, h) => said(h, /^(do\s+)?sh(ow)?\s+run/i) },
        { t: 'ตรวจว่ามี config เซฟใน NVRAM แล้วหรือยัง', hint: 'show startup-config', check: (s, h) => said(h, /^(do\s+)?sh(ow)?\s+star/i) },
        { t: 'เก็บรายการ VLAN', hint: 'show vlan brief', check: (s, h) => said(h, /^(do\s+)?sh(ow)?\s+vlan/i) },
        { t: 'เก็บสถานะพอร์ตทั้งหมด', hint: 'show interfaces status', check: (s, h) => said(h, /^(do\s+)?sh(ow)?\s+int\w*\s+st/i) },
        { t: 'ตั้งรหัส enable ให้แข็งแรงด้วย <code>enable secret</code> (audit ตรวจข้อนี้แน่นอน)', hint: 'configure terminal → enable secret Str0ng-P@ss', check: s => !!s.enableSecret },
        { t: 'สร้างผู้ใช้สำหรับ SSH <code>netadmin</code> ระดับสิทธิ์ 15', hint: 'username netadmin privilege 15 secret Str0ng-P@ss', check: s => !!s.users.netadmin },
        { t: 'ตั้ง banner เตือนก่อนล็อกอิน (ข้อบังคับทางกฎหมายของหลายองค์กร)', hint: 'banner motd #Authorized access only#', check: s => !!s.banner },
        { t: 'บันทึกผลทั้งหมดลง NVRAM', hint: 'end → write memory', check: s => !!s.savedConfig },
      ],
      debrief: `<b>Compliance คือการเทียบของจริงกับมาตรฐานที่เขียนไว้</b> — งานนี้ทำมือได้ตอนมี 5 เครื่อง แต่พอ 200 เครื่องต้องให้สคริปต์ทำ<br>
        <b>สิ่งที่สคริปต์ตรวจจริงในองค์กร:</b> มี enable secret ไหม · ปิด telnet แล้วหรือยัง · NTP ชี้ถูกเซิร์ฟเวอร์ไหม ·
        SNMP ยังใช้ community ว่า public อยู่หรือเปล่า · มี banner ตามกฎหมายไหม<br>
        <b>ทุกอย่างที่ทำในแล็บนี้อ่านได้จาก <code>show running-config</code> เพียงคำสั่งเดียว</b> —
        นั่นคือเหตุผลที่ automation ขั้นแรกสุดคือ "ดึง running-config มาเก็บ แล้วเทียบกับมาตรฐาน"`,
    },
  ],
};
