// ============================================================
//  คลังข้อสอบเพิ่ม — MikroTik Router (RouterOS 7 / MTCNA)
// ============================================================
export default {
  1: [
    { type: 'mcq', q: 'RouterOS เก็บ config ไว้ที่ใดเมื่อสั่ง <code>/export</code>', opts: ['ในหน่วยความจำอย่างเดียว', 'แสดงเป็นข้อความบนหน้าจอ หรือเขียนลงไฟล์ .rsc ถ้าระบุ file=', 'ในไฟล์ binary', 'ส่งไป cloud'], a: 1, why: 'ไฟล์ .rsc อ่านและแก้ไขได้ ย้ายข้ามเครื่องได้ ต่างจาก backup ที่เป็น binary กู้ได้เฉพาะเครื่องเดิม' },
    { type: 'cmd', q: 'พิมพ์คำสั่งดูรายการแพ็กเกจที่ติดตั้งอยู่', ans: ['/system package print', 'system package print'], why: 'ตรวจก่อนอัปเกรดว่าเครื่องลง bundle หรือแยก extra packages และแต่ละตัวเป็นเวอร์ชันอะไร' },
    { type: 'mcq', q: 'License level ใดที่ RouterBOARD ส่วนใหญ่มาพร้อมกับเครื่อง', opts: ['Level 1', 'Level 3', 'Level 4 ขึ้นไป', 'Level 0'], a: 2, why: 'จึงทำ AP ได้และรองรับ PPPoE ได้หลายร้อย session — เรื่อง license มีผลจริงเฉพาะตอนลง RouterOS บน x86 หรือ CHR' },
    { type: 'mcq', q: 'CHR คืออะไร', opts: ['ชื่อรุ่นสวิตช์', 'RouterOS ที่ลงบน VM — Cloud Hosted Router', 'โปรโตคอลเข้ารหัส', 'ชิปเร่งความเร็ว'], a: 1, why: 'มี free tier ที่จำกัดความเร็วไว้ราว 1 Mbps ต่อ interface ซึ่งพอสำหรับทดลองและทำ lab' },
    { type: 'mcq', q: 'ตั้งค่าพอร์ต console ของ RouterBOARD ที่ค่าใด', opts: ['9600 8N1', '38400 8N1', '115200 8N1', '57600 7E1'], a: 2, why: 'เป็นทางเดียวที่เข้าได้เมื่อ config พังจนเน็ตหลุดหมดและ MAC-WinBox ก็ใช้ไม่ได้' },
    { type: 'mcq', q: 'หลังอัปเกรด RouterOS แล้ว ต้องทำอะไรต่อ', opts: ['ไม่ต้องทำอะไร', 'อัปเกรด RouterBOOT ด้วย /system routerboard upgrade แล้ว reboot อีกครั้ง', 'รีเซ็ต config', 'ลง Netinstall'], a: 1, why: 'RouterBOOT เป็น firmware ระดับ bootloader ที่แยกจาก RouterOS — ไม่อัปเกรดตามจะทำให้ PoE, USB และการบูตทำงานไม่ครบ' },
    { type: 'multi', q: 'ข้อใดคือความต่างระหว่าง backup กับ export (เลือกทุกข้อที่ถูก)', opts: ['backup เป็น binary ส่วน export เป็นข้อความ', 'backup เก็บรหัสผ่านผู้ใช้ด้วย', 'export ย้ายข้ามรุ่นเครื่องได้', 'export กู้ทั้งเครื่องได้เร็วกว่า'], a: [0, 1, 2], why: 'backup กู้เครื่องเดิมกลับสภาพเดิมได้เร็วกว่า แต่ย้ายข้ามรุ่นไม่ได้ — จึงควรเก็บทั้งสองแบบเสมอ' },
    { type: 'mcq', q: 'Safe Mode ใน WinBox กดด้วยปุ่มใด', opts: ['Ctrl+S', 'Ctrl+X', 'Ctrl+Z', 'F5'], a: 1, why: 'ถ้าหลุดการเชื่อมต่อระหว่างแก้ config ระบบจะย้อนกลับให้อัตโนมัติ — ควรเปิดทุกครั้งที่แก้ค่าที่อาจตัดขาดตัวเอง' },
  ],

  2: [
    { type: 'mcq', q: 'DHCP client ที่ status เป็น <code>searching</code> หมายถึงอะไร', opts: ['ได้ IP แล้ว', 'ยังหา DHCP server ไม่เจอ', 'ถูก disable', 'IP ซ้ำ'], a: 1, why: 'ให้ไปตรวจสาย, VLAN ที่พอร์ต และว่าฝั่ง ISP หรือ server ทำงานอยู่จริงไหม' },
    { type: 'mcq', q: 'ARP mode <code>proxy-arp</code> ใช้ตอนไหน', opts: ['วงที่ต้องการความปลอดภัยสูงสุด', 'เมื่อต้องการให้ router ตอบ ARP แทนเครื่องที่อยู่คนละ interface เช่นกับ PPPoE หรือ VPN client', 'เมื่อ IP ซ้ำ', 'เมื่อไม่มี DHCP'], a: 1, why: 'ทำให้เครื่องที่อยู่คนละ interface คุยกันได้เหมือนอยู่วงเดียวกัน ส่วน local-proxy-arp ตอบแทนเครื่องใน interface เดียวกัน' },
    { type: 'cmd', q: 'พิมพ์คำสั่งดูรายการ lease ของ DHCP server', ans: ['/ip dhcp-server lease print', 'ip dhcp-server lease print'], why: 'ดูว่าใครถือ IP อะไรอยู่ และ lease ไหนเป็น dynamic (มี flag D) หรือ static' },
    { type: 'mcq', q: 'ค่า <code>block-access=yes</code> ใน DHCP lease ทำอะไร', opts: ['จองเบอร์ให้เครื่องนั้น', 'กันไม่ให้ MAC นั้นได้รับ IP จาก server เลย', 'เพิ่มความเร็ว', 'ลบ lease ทิ้ง'], a: 1, why: 'ใช้กันเครื่องแปลกหน้าที่ไม่ต้องการให้เข้าวง โดยไม่ต้องไปแก้ที่ firewall' },
    { type: 'mcq', q: 'สามชิ้นที่ต้องมีครบเพื่อให้ DHCP server ทำงานคืออะไร', opts: ['pool, server, network', 'pool, client, route', 'server, firewall, NAT', 'address, gateway, DNS'], a: 0, why: 'ขาด network จะทำให้ client ได้ IP แต่ไม่ได้ gateway และ DNS — เป็นอาการที่พบบ่อยที่สุด' },
    { type: 'mcq', q: 'สูตรกันคนแอบเสียบสายเข้ามาใช้เน็ตในองค์กรคือข้อใด', opts: ['ตั้งรหัส WiFi ให้ยาว', 'ใส่ static ARP ให้ทุกเครื่องแล้วตั้ง interface เป็น arp=reply-only', 'ปิด DHCP', 'ใช้ IP แบบสุ่ม'], a: 1, why: 'เครื่องที่ไม่ได้ลงทะเบียน MAC ไว้จะใช้เน็ตไม่ได้แม้ตั้ง IP เอง — แลกกับภาระในการดูแลตาราง' },
    { type: 'multi', q: 'ข้อใดคือพารามิเตอร์ของ DHCP client ที่ควรพิจารณา (เลือกทุกข้อที่ถูก)', opts: ['add-default-route', 'use-peer-dns', 'use-peer-ntp', 'vlan-filtering'], a: [0, 1, 2], why: 'vlan-filtering เป็นค่าของ bridge ไม่เกี่ยวกับ DHCP client' },
  ],

  3: [
    { type: 'mcq', q: 'FastTrack ทำให้อะไรไม่ทำงาน', opts: ['DNS', 'Simple Queue และ mangle เพราะแพ็กเก็ตข้ามไป', 'DHCP', 'routing'], a: 1, why: 'เป็นสาเหตุอันดับหนึ่งที่ "ตั้ง queue แล้วไม่ทำงาน" — ต้องเลี่ยงหรือยกเว้นกลุ่มที่ต้องคุมความเร็ว' },
    { type: 'mcq', q: 'connection-state <code>invalid</code> ควรทำอย่างไร', opts: ['accept', 'drop ทิ้งเสมอ', 'log อย่างเดียว', 'ปล่อยผ่าน'], a: 1, why: 'แพ็กเก็ตที่ไม่เข้าพวกกับ session ใดเลยไม่มีเหตุผลที่จะให้ผ่าน — เป็นกฎมาตรฐานที่ควรมีทุกเครื่อง' },
    { type: 'mcq', q: 'chain <code>input</code> ปกป้องอะไร', opts: ['เครื่องลูกค้าหลัง router', 'ตัว router เอง', 'อินเทอร์เน็ต', 'สวิตช์'], a: 1, why: 'input = เข้าหา router · forward = ผ่าน router ไปหาเครื่องอื่น · output = ออกจาก router เอง' },
    { type: 'cmd', q: 'พิมพ์คำสั่งดูรายการ address-list ทั้งหมด', ans: ['/ip firewall address-list print', 'ip firewall address-list print'], why: 'ใช้ตรวจว่ามี IP ไหนถูกเพิ่มเข้ารายชื่อดำอัตโนมัติบ้าง และ timeout เหลือเท่าไหร่' },
    { type: 'mcq', q: 'action <code>redirect</code> ต่างจาก <code>dst-nat</code> อย่างไร', opts: ['เหมือนกัน', 'redirect ส่งไปที่ตัว router เอง ส่วน dst-nat ส่งไปเครื่องอื่นที่ระบุ', 'redirect ใช้กับ UDP เท่านั้น', 'dst-nat ใช้กับ chain srcnat'], a: 1, why: 'redirect ใช้บังคับให้ traffic เข้า service บน router เช่น transparent proxy หรือบังคับ DNS' },
    { type: 'mcq', q: 'Bridge ต่างจากการ route ระหว่าง interface อย่างไร', opts: ['bridge เร็วกว่าเสมอ', 'bridge รวมพอร์ตเป็นวงเดียวกัน ส่วน routing แยกแต่ละขาเป็นคนละวง', 'routing ใช้ MAC', 'ไม่ต่างกัน'], a: 1, why: 'bridge ทำให้ broadcast ถึงกันทั้งหมด ส่วน routing แบ่ง broadcast domain ออกจากกัน' },
    { type: 'multi', q: 'ข้อใดคือลำดับกฎ firewall ที่ถูกต้องสำหรับ chain input (เลือกทุกข้อที่ถูก)', opts: ['accept established,related มาก่อน', 'drop invalid', 'drop ที่เหลือจาก WAN ไว้ล่างสุด', 'drop ทุกอย่างไว้บนสุด'], a: [0, 1, 2], why: 'กฎ drop ที่วางบนสุดจะทำให้กฎ accept ข้างล่างไม่มีความหมายเลย' },
  ],

  4: [
    { type: 'mcq', q: 'Flag <code>DAC</code> ใน <code>/ip route print</code> บอกอะไร', opts: ['route ที่เราพิมพ์เอง', 'route ที่ระบบสร้างเองจากการใส่ IP ให้ interface และกำลังใช้งานอยู่', 'route ที่ถูกปิด', 'route สำรอง'], a: 1, why: 'D = dynamic, A = active, C = connect — เกิดขึ้นทันทีที่ใส่ IP และลบด้วยมือไม่ได้' },
    { type: 'mcq', q: 'ค่า <code>check-gateway=ping</code> ทำอะไร', opts: ['เพิ่มความเร็ว', 'ให้ router คอยตรวจว่า gateway ยังตอบอยู่ไหม ถ้าตายจะตัดไปเส้นสำรอง', 'เข้ารหัสข้อมูล', 'บันทึก log'], a: 1, why: 'ถ้าไม่ตั้ง route จะยัง active อยู่แม้ปลายทางตายไปแล้ว ทำให้ failover ไม่เกิดขึ้น' },
    { type: 'mcq', q: 'PCQ ขา upload ควรตั้ง pcq-classifier เป็นอะไร', opts: ['dst-address', 'src-address', 'src-port', 'interface'], a: 1, why: 'ขาขึ้นคือ traffic ที่ออกจากเครื่องผู้ใช้ ตัวที่บอกว่าเป็นของใครจึงเป็นต้นทาง — สลับกับขาลงที่ใช้ dst-address' },
    { type: 'mcq', q: '<code>limit-at</code> ใน Simple Queue หมายถึงอะไร', opts: ['เพดานสูงสุด', 'ความเร็วที่รับประกันว่าจะได้แน่แม้ตอนเน็ตแน่น', 'ความเร็วต่ำสุดที่ยอมรับได้', 'เวลาที่จำกัด'], a: 1, why: 'max-limit คือเพดานที่ห้ามเกิน ส่วน limit-at คือขั้นต่ำที่การันตี — ใช้คู่กันเพื่อรับประกันคุณภาพให้ลูกค้าสำคัญ' },
    { type: 'cmd', q: 'พิมพ์คำสั่งดูว่ามี PPP client ใดออนไลน์อยู่', ans: ['/ppp active print', 'ppp active print'], why: '/ppp secret คือรายชื่อบัญชีทั้งหมด ส่วน /ppp active คือใครกำลังต่ออยู่จริงและได้ IP อะไร' },
    { type: 'mcq', q: 'PPPoE service-name มีไว้ทำไม', opts: ['ตั้งชื่อเครื่อง', 'ให้ client เลือกได้ว่าจะต่อกับ server ตัวไหนเมื่อมีหลายเจ้าในวงเดียวกัน', 'เข้ารหัสข้อมูล', 'จำกัดความเร็ว'], a: 1, why: 'ถ้าเว้นว่าง client จะต่อกับตัวไหนก็ได้ที่ตอบมาก่อน ซึ่งอาจไม่ใช่ตัวที่ตั้งใจ' },
    { type: 'mcq', q: 'SSTP ใช้พอร์ตใด', opts: ['1723', '443', '500', '1701'], a: 1, why: 'วิ่งบน TCP 443 จึงดูเหมือน HTTPS และผ่าน firewall ของที่อื่นได้เกือบทุกที่ ต่างจาก PPTP ที่ต้องใช้ GRE' },
    { type: 'multi', q: 'ข้อใดคือส่วนประกอบของระบบ PPP บน RouterOS (เลือกทุกข้อที่ถูก)', opts: ['/ppp profile', '/ppp secret', '/ip pool', '/ip firewall filter'], a: [0, 1, 2], why: 'profile กำหนดค่าร่วม · secret คือบัญชีรายคน · pool คือช่วง IP ที่จะแจก' },
  ],

  5: [
    { type: 'mcq', q: 'โหมด <code>ap-bridge</code> ต่างจาก <code>bridge</code> ของ wireless อย่างไร', opts: ['เหมือนกัน', 'ap-bridge รับ client ได้หลายตัว ส่วน bridge รับได้ตัวเดียวสำหรับลิงก์ point-to-point', 'bridge เร็วกว่า', 'ap-bridge ใช้กับ 5 GHz เท่านั้น'], a: 1, why: 'ap-bridge ต้องใช้ license level 4 ขึ้นไป — ส่วน level 3 ทำได้แค่ station' },
    { type: 'mcq', q: 'access-list ใช้ที่ฝั่งใดของลิงก์ไร้สาย', opts: ['ฝั่ง station', 'ฝั่ง AP — คุมว่าใครเข้ามาหาเราได้', 'ทั้งสองฝั่ง', 'ไม่ใช้เลย'], a: 1, why: 'จำง่าย ๆ ว่า access = ใครเข้ามาหาเรา (AP) · connect = เราไปหาใคร (station)' },
    { type: 'mcq', q: '<code>default-forward=no</code> ทำอะไร', opts: ['ปิด AP', 'ห้ามเครื่องลูกคุยกันเอง (client isolation)', 'ปิด DHCP', 'ลดกำลังส่ง'], a: 1, why: 'ควรตั้งกับ guest wifi เสมอ เพื่อไม่ให้เครื่องแขกโจมตีกันเองผ่านวงเดียวกัน' },
    { type: 'mcq', q: 'ค่า <code>tx-ccq</code> ใน registration table บอกอะไร', opts: ['จำนวน client', 'คุณภาพของลิงก์เป็นเปอร์เซ็นต์ — ต่ำกว่า 70% ควรไปหาว่ามีอะไรกวน', 'กำลังส่ง', 'ความถี่ที่ใช้'], a: 1, why: 'ดูคู่กับ signal-strength — สัญญาณดีแต่ CCQ ต่ำแปลว่ามีสัญญาณรบกวนหรือช่องแน่น' },
    { type: 'cmd', q: 'พิมพ์คำสั่งดูว่าใครกำลังกินแบนด์วิดท์บน <code>ether1</code>', ans: ['/tool torch interface=ether1', 'tool torch interface=ether1'], why: 'เครื่องมือที่ใช้บ่อยที่สุดเมื่อมีคนโทรมาบอกว่าเน็ตช้า — เห็น src/dst และปริมาณแบบเรียลไทม์' },
    { type: 'mcq', q: 'Netwatch ทำอะไรได้มากกว่าการ ping ธรรมดา', opts: ['ping ได้เร็วกว่า', 'รัน script อัตโนมัติเมื่อสถานะเปลี่ยนจาก up เป็น down หรือกลับกัน', 'วาดกราฟ', 'สแกนพอร์ต'], a: 1, why: 'down-script และ up-script ทำให้ทำ failover หรือส่งแจ้งเตือนได้โดยไม่ต้องใช้ routing protocol' },
    { type: 'mcq', q: 'ไฟล์ใดที่ต้องแนบเมื่อติดต่อ support ของ MikroTik', opts: ['ไฟล์ backup', 'supout.rif', 'ไฟล์ .rsc', 'ภาพหน้าจอ'], a: 1, why: 'รวม config, log, สถานะและ resource ไว้ในไฟล์เดียว — ถ้ามี autosupout.rif ที่สร้างตอนเครื่องแครชต้องส่งไปด้วย' },
    { type: 'multi', q: 'ข้อใดควรแนบไปกับคำถามเมื่อขอความช่วยเหลือเรื่องเครือข่าย (เลือกทุกข้อที่ถูก)', opts: ['ผังเครือข่ายพร้อม IP', 'สิ่งที่คาดหวังกับสิ่งที่เกิดขึ้นจริง', 'สิ่งที่เปลี่ยนไปก่อนหน้านั้น', 'รุ่นของจอคอมพิวเตอร์'], a: [0, 1, 2], why: 'สามข้อแรกทำให้คนช่วยเข้าใจบริบทได้ทันที ส่วนข้อสุดท้ายไม่เกี่ยวกับปัญหาเครือข่าย' },
  ],
};
