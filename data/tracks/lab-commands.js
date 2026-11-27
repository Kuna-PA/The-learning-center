// ============================================================
//  สรุปคำสั่งท้ายบท — ปิดช่องว่างระหว่าง "บทเรียน" กับ "Lab"
//
//  ปัญหาที่ไฟล์นี้แก้: บทเรียนหลายบทสอน **หลักการ** ได้ดี แต่ไม่เคยบอก
//  **คำสั่งจริงที่ต้องพิมพ์** พอผู้เรียนเข้าไปทำ Lab จึงไปต่อไม่ได้
//  ตัวอย่างจริงที่ถูกรายงานเข้ามา: Network ระดับ 3 สอนเรื่อง subnet และ routing
//  ครบถ้วน แต่ไม่มีที่ไหนในบทเรียนบอกว่าบน Windows ต้องใช้ netsh ตั้ง IP
//
//  ทุกแถวในไฟล์นี้ตรงกับคำสั่งที่ Lab ของระดับนั้น "บังคับให้พิมพ์จริง"
//  และมี test/content.test.js คอยตรวจว่าไม่มีคำสั่งไหนใน Lab ที่บทเรียนไม่เคยพูดถึง
//  เพิ่ม Lab ใหม่ที่ใช้คำสั่งตระกูลใหม่เมื่อไร เทสต์จะแดงทันทีจนกว่าจะมาเติมตรงนี้
//
//  โครงของแต่ละระดับ: { note?, groups: [{ dev, note?, rows: [[คำสั่ง, คำอธิบาย]] }] }
// ============================================================

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** หัวข้อของ section ที่แทรกเข้าไป — ใช้ชื่อเดียวกันทุกระดับเพื่อให้ผู้เรียนหาเจอทันที */
export const LAB_CMD_TITLE = 'สรุปคำสั่ง — ที่ต้องพิมพ์จริงใน Lab ระดับนี้';

const INTRO = 'บทเรียนข้างบนอธิบายว่า<b>ทำไม</b> ตารางนี้คือ<b>พิมพ์อะไร</b> — '
  + 'ทุกคำสั่งในนี้มีใช้จริงใน Lab ของระดับนี้ ถ้าติดตรงไหนระหว่างทำ Lab ให้ย้อนกลับมาดูที่นี่';

/** แปลงข้อมูลหนึ่งระดับให้เป็น HTML ของ section */
export function renderLabCommands(level) {
  const groups = level.groups.map(g => `
<p><b>${g.dev}</b>${g.note ? ` — ${g.note}` : ''}</p>
<table class="tbl cmd-tbl">
<tr><th style="width:46%">คำสั่ง</th><th>ใช้ทำอะไร</th></tr>
${g.rows.map(([cmd, why]) => `<tr><td><code>${esc(cmd)}</code></td><td>${why}</td></tr>`).join('\n')}
</table>`).join('\n');
  return `<p>${INTRO}</p>\n${groups}${level.note ? `\n<div class="note">${level.note}</div>` : ''}`;
}

// ============================================================
//  NETWORK — หัวข้อนี้เป็นทฤษฎีกลางที่ไม่ผูกยี่ห้อ แต่ Lab ลงเครื่องจริงถึง 4 ค่าย
//  ตารางจึงเรียงเทียบให้เห็นว่าเรื่องเดียวกันแต่ละค่ายพิมพ์ต่างกันอย่างไร
// ============================================================
const network = {
  1: {
    note: 'บน Linux คำสั่งที่ <b>เปลี่ยนค่า</b> ต้องมี <code>sudo</code> นำหน้าเสมอ '
      + 'ส่วนคำสั่งที่แค่ <b>ดู</b> ไม่ต้อง · บน Windows ให้เปิด Command Prompt แบบ Run as administrator',
    groups: [
      {
        dev: 'Windows — Command Prompt',
        note: 'ชุดแรกที่ต้องดูเป็นก่อนจะไปโทษเซิร์ฟเวอร์หรือผู้ให้บริการ',
        rows: [
          ['hostname', 'ชื่อเครื่องตัวเอง — ข้อแรกที่ต้องรู้ก่อนแจ้งปัญหาให้ใครฟัง'],
          ['ipconfig', 'IP, subnet mask และ gateway แบบย่อ'],
          ['ipconfig /all', 'ค่าเครือข่ายทั้งหมดรวม <b>MAC address</b> และ DNS ที่ใช้อยู่ — ตัวหลักที่ใช้ไล่ปัญหา'],
          ['getmac', 'เฉพาะ MAC address ของทุกการ์ด เวลาต้องเอาไปลงทะเบียนกับสวิตช์'],
          ['netsh interface show interface', 'รายชื่อการ์ดและสถานะ Enabled/Disabled, Connected/Disconnected — ใช้ยืนยันชั้น Physical'],
        ],
      },
      {
        dev: 'Linux — Ubuntu Server',
        rows: [
          ['ip link', 'รายการการ์ดและสถานะ UP/DOWN'],
          ['ip addr', 'IP ที่ผูกอยู่กับแต่ละการ์ด'],
          ['ethtool ens33', 'ความเร็ว, duplex และ auto-negotiation จริงของพอร์ต — ตัวชี้ขาดว่าสายหรือพอร์ตมีปัญหา'],
          ['ip -s link show ens33', 'ตัวนับ error / drop สะสมของการ์ด ถ้าตัวเลขวิ่งขึ้นเรื่อย ๆ คือสายหรือพอร์ตเสีย'],
          ['sudo ip link set ens33 mtu 9000', 'ตั้ง MTU เป็น jumbo frame — ตัวอย่างคำสั่งที่เปลี่ยนค่า จึงต้องมี <code>sudo</code>'],
        ],
      },
    ],
  },

  2: {
    note: 'บน Cisco IOS มี <b>สามโหมด</b> ที่ต้องแยกให้ออก: <code>Switch&gt;</code> user EXEC (ดูได้นิดหน่อย) → '
      + '<code>Switch#</code> privileged EXEC (ดูได้ทุกอย่าง) → <code>Switch(config)#</code> global config (แก้ไขได้) '
      + 'พิมพ์คำสั่งผิดโหมดคือสาเหตุที่คนเพิ่งเริ่มติดบ่อยที่สุด',
    groups: [
      {
        dev: 'Cisco IOS — เข้าโหมดและตั้งค่าพอร์ต',
        rows: [
          ['enable', 'จาก <code>&gt;</code> เข้าสู่ privileged EXEC <code>#</code> — ต้องทำก่อนเสมอ'],
          ['configure terminal', 'จาก <code>#</code> เข้าสู่ global config <code>(config)#</code> · ย่อได้เป็น <code>conf t</code>'],
          ['interface FastEthernet0/1', 'เลือกพอร์ตที่จะแก้ · ย่อได้เป็น <code>int fa0/1</code>'],
          ['description PC-Office', 'ใส่ป้ายกำกับพอร์ตว่าต่ออะไรอยู่ — ช่วยคนที่มาดูแลต่อจากเรา'],
          ['switchport mode access', 'ตั้งพอร์ตเป็น access (ต่อเครื่องผู้ใช้) ไม่ใช่ trunk'],
          ['spanning-tree portfast', 'ให้พอร์ตขึ้นใช้งานทันทีโดยไม่ต้องรอ STP 30 วินาที — ใช้กับพอร์ตผู้ใช้เท่านั้น'],
          ['spanning-tree bpduguard enable', 'ปิดพอร์ตทันทีถ้ามีใครเอาสวิตช์มาต่อ — คู่หูของ PortFast เสมอ'],
          ['end', 'ออกจาก config กลับไปที่ <code>#</code>'],
          ['shutdown', 'ปิดพอร์ตนี้ลง — ใช้กับพอร์ตที่ยังไม่ได้ใช้งาน ไม่ควรเปิดทิ้งไว้ให้ใครมาเสียบ'],
          ['no shutdown', 'เปิดพอร์ตกลับมา · <b>เติม <code>no</code> หน้าคำสั่งไหนคือยกเลิกคำสั่งนั้น</b> เป็นกฎทั่วไปของ IOS'],
          ['write memory', 'บันทึก config ลง NVRAM · ไม่พิมพ์ = ไฟดับแล้วหายหมด'],
        ],
      },
      {
        dev: 'Windows / Linux — ไล่ปัญหาตามลำดับ OSI',
        rows: [
          ['nslookup example.com', 'Windows: ถาม DNS ว่าชื่อนี้แปลงเป็น IP อะไร'],
          ['ipconfig /flushdns', 'Windows: ล้าง DNS cache ในเครื่อง เผื่อจำคำตอบเก่าที่ผิดไว้'],
          ['dig example.com', 'Linux: ตัวเทียบเท่า nslookup แต่บอกรายละเอียดมากกว่า'],
          ['traceroute 8.8.8.8', 'Linux: ไล่ดูว่าตายหรือหน่วงที่ hop ไหน (Windows ใช้ <code>tracert</code>)'],
        ],
      },
    ],
  },

  3: {
    note: 'สังเกตว่าทั้งสองค่ายต้องการ <b>สามอย่างเดียวกัน</b> เสมอ: IP, subnet mask (หรือ prefix) และ gateway '
      + 'ต่างกันแค่รูปแบบที่พิมพ์ — Windows เขียน mask เต็ม ๆ ว่า <code>255.255.255.192</code> '
      + 'ส่วน Linux เขียนเป็น prefix <code>/26</code> ซึ่งคือตัวเดียวกัน',
    groups: [
      {
        dev: 'Windows — ตั้งค่า IPv4 ด้วย netsh',
        note: 'ชื่อการ์ดในเครื่องหมายคำพูดต้องตรงกับที่เห็นจาก <code>netsh interface show interface</code>',
        rows: [
          ['netsh interface ip set address "Ethernet0" static 192.168.10.65 255.255.255.192 192.168.10.1',
            'ตั้ง IP แบบ static — เรียงเป็น <b>IP → mask → gateway</b> เสมอ'],
          ['netsh interface ip set address "Ethernet0" dhcp', 'เปลี่ยนกลับไปรับ IP จาก DHCP'],
          ['netsh interface ip set dns "Ethernet0" static 192.168.10.1', 'ตั้ง DNS server ของเครื่อง'],
          ['route add 10.20.0.0 mask 255.255.0.0 192.168.10.254',
            'เพิ่ม static route ไปวงอื่นผ่าน next hop ที่ระบุ (เติม <code>-p</code> ท้ายคำสั่งถ้าอยากให้อยู่ถาวรหลังรีบูต)'],
          ['route print', 'ดูตารางเส้นทางทั้งหมด รวม default route'],
        ],
      },
      {
        dev: 'Windows — ตั้งค่า IPv6 ด้วย netsh',
        rows: [
          ['netsh interface ipv6 show address', 'ดู address IPv6 ทั้งหมด — <code>fe80::</code> คือ link-local ที่มีมาเองเสมอ'],
          ['netsh interface ipv6 add address "Ethernet0" 2001:db8::10/64', 'เพิ่ม global address ให้การ์ด (LAN ใช้ /64 เป็นมาตรฐาน)'],
          ['netsh interface ipv6 show route', 'ตารางเส้นทางฝั่ง IPv6 ซึ่งแยกจากของ IPv4 คนละชุด'],
          ['ping ::1', 'ทดสอบ loopback ของ IPv6 — เทียบเท่า <code>ping 127.0.0.1</code>'],
          ['nslookup -type=AAAA example.com', 'ถาม DNS หา AAAA record คือเรคคอร์ดที่ชี้ไปยัง IPv6'],
        ],
      },
      {
        dev: 'Linux — ตั้งค่า IPv4 / IPv6 ด้วย ip',
        note: 'คำสั่งชุดนี้มีผล<b>จนกว่าจะรีบูต</b> ถ้าต้องการถาวรให้ไปแก้ที่ netplan หรือ NetworkManager',
        rows: [
          ['sudo ip addr add 192.168.10.65/26 dev ens33', 'ใส่ IP พร้อม prefix ให้การ์ด — <code>/26</code> คือ mask 255.255.255.192'],
          ['sudo ip link set ens33 up', 'เปิดใช้งานการ์ด ให้แน่ใจว่าลิงก์ขึ้น'],
          ['sudo ip route add default via 192.168.10.1', 'ตั้ง default gateway'],
          ['sudo ip route add 10.20.0.0/16 via 192.168.10.254', 'เพิ่ม static route ไปวงอื่น'],
          ['sudo ip addr add 2001:db8::10/64 dev ens33', 'เพิ่ม global address IPv6 — ใช้คำสั่งเดียวกับ IPv4'],
          ['ping6 -c 2 ::1', 'ทดสอบ loopback IPv6 บน Linux'],
        ],
      },
    ],
  },

  4: {
    groups: [
      {
        dev: 'Cisco IOS — สร้าง VLAN และ Trunk',
        rows: [
          ['vlan 10', 'สร้าง VLAN หมายเลข 10 (พิมพ์ในโหมด <code>(config)#</code>)'],
          ['name OFFICE', 'ตั้งชื่อ VLAN ที่เพิ่งสร้าง'],
          ['switchport access vlan 10', 'ย้ายพอร์ตเข้า VLAN 10'],
          ['switchport mode trunk', 'ตั้งพอร์ตเป็น trunk เพื่อส่งหลาย VLAN ข้ามสวิตช์'],
          ['show vlan brief', 'ตรวจว่าพอร์ตไหนอยู่ VLAN ไหน'],
        ],
      },
      {
        dev: 'Windows / Linux — ตรวจพอร์ตและบริการ',
        rows: [
          ['netstat -ano', 'Windows: พอร์ตที่เปิดอยู่พร้อม <b>PID</b> ของโปรเซสเจ้าของ'],
          ['tasklist', 'Windows: แปลง PID ที่ได้จาก netstat ให้เป็นชื่อโปรแกรม'],
          ['Test-NetConnection example.com -Port 443', 'Windows: ทดสอบว่าต่อไปพอร์ตปลายทางได้จริงไหม (ตัวแทน telnet ที่ถูกถอดออกแล้ว)'],
          ['curl -I https://example.com', 'Linux: ขอเฉพาะ HTTP header กลับมา ใช้ยืนยันว่าเว็บปลายทางตอบปกติ'],
        ],
      },
    ],
  },

  5: {
    groups: [
      {
        dev: 'Cisco IOS — Hardening ก่อนขึ้นใช้งานจริง',
        rows: [
          ['hostname SW-FLOOR3', 'ตั้งชื่ออุปกรณ์ให้ตรงกับผังเครือข่าย'],
          ['enable secret Str0ngPass!', 'ตั้งรหัสเข้า privileged mode แบบ<b>เข้ารหัสจริง</b> — ห้ามใช้ <code>enable password</code> ซึ่งเก็บเป็นข้อความเปล่า'],
          ['banner motd #Authorized access only#', 'ข้อความเตือนก่อนล็อกอิน — หลายองค์กรบังคับไว้เพื่อใช้อ้างอิงทางกฎหมาย'],
          ['service password-encryption', 'เข้ารหัสรหัสผ่านที่เหลือใน config ไม่ให้อ่านออกตรง ๆ'],
        ],
      },
      {
        dev: 'MikroTik RouterOS — เฝ้าระวังและเก็บสถิติ',
        note: 'RouterOS เป็นเมนูเป็นชั้น ๆ ขึ้นต้นด้วย <code>/</code> เสมอ และพารามิเตอร์เขียนแบบ <code>ชื่อ=ค่า</code>',
        rows: [
          ['/system identity set name=SW-FLOOR3', 'ตั้งชื่ออุปกรณ์'],
          ['/system ntp client set enabled=yes servers=203.159.68.1', 'ซิงก์เวลา — ถ้าเวลาไม่ตรง log จากหลายเครื่องจะเรียงลำดับไม่ได้'],
          ['/system logging action add name=remote-log target=remote remote=10.10.99.60', 'ส่ง log ออกไปเก็บที่ syslog server ภายนอก'],
          ['/snmp set enabled=yes contact="NOC" location="Floor3-Rack1"', 'เปิด SNMP ให้ระบบ monitor ดึงค่าไปได้'],
          ['/snmp community add name=monitor addresses=10.10.99.0/24', 'จำกัดว่าใครถาม SNMP ได้บ้าง — ไม่จำกัดคือเปิดช่องให้สำรวจระบบฟรี'],
          ['/tool graphing interface add interface=ether1', 'เก็บกราฟปริมาณ traffic ย้อนหลังของพอร์ต'],
          ['/tool netwatch add host=8.8.8.8 interval=30s', 'เฝ้าปลายทาง รู้ทันทีที่ลิงก์ล่มโดยไม่ต้องรอผู้ใช้โทรมา'],
          ['/interface monitor-traffic ether1', 'ดูปริมาณ traffic บนพอร์ตแบบสด ๆ'],
          ['/tool torch interface=ether1', 'ดูว่า <b>ใคร</b> กำลังกินแบนด์วิดท์อยู่ตอนนี้'],
          ['/log print', 'อ่าน log ในเครื่อง'],
        ],
      },
    ],
  },

  6: {
    groups: [
      {
        dev: 'MikroTik RouterOS — เครือข่ายไร้สาย',
        note: 'ลำดับที่ถูกต้องคือ <b>สำรวจช่องสัญญาณก่อน</b> แล้วค่อยตั้ง AP ไม่ใช่เปิดแล้วค่อยมาแก้ทีหลัง',
        rows: [
          ['/interface wireless print', 'รายการการ์ดไร้สายที่มีในเครื่อง'],
          ['/interface wireless scan wlan1', 'สำรวจว่ารอบตัวมี AP ใดใช้ช่องไหนอยู่'],
          ['/interface wireless snooper', 'ภาพรวมว่าช่องไหนแน่นที่สุด ณ ตอนนี้'],
          ['/interface wireless security-profiles add name=office-wifi mode=dynamic-keys authentication-types=wpa2-psk wpa2-pre-shared-key=Str0ngWiFiPass',
            'สร้างโปรไฟล์ความปลอดภัยแบบ WPA2-PSK ไว้ก่อน แล้วค่อยเอาไปผูกกับการ์ด'],
          ['/interface wireless set 0 mode=ap-bridge band=2ghz-b/g/n ssid=OFFICE-F3 disabled=no', 'ตั้งการ์ดให้เป็น AP พร้อมชื่อ SSID และเปิดใช้งาน'],
          ['/interface wireless set 0 frequency=2412', 'ล็อกความถี่ตามผลสำรวจ (2412 = ช่อง 1)'],
          ['/interface wireless set 0 security-profile=office-wifi', 'ผูกโปรไฟล์ความปลอดภัยเข้ากับการ์ด'],
          ['/interface wireless set 0 default-forward=no', 'client isolation — ปิดไม่ให้เครื่องลูกคุยกันเอง'],
          ['/interface wireless registration-table print', 'ดูว่ามีเครื่องใดเกาะอยู่ สัญญาณและความเร็วเท่าไหร่'],
        ],
      },
      {
        dev: 'MikroTik RouterOS — ลิงก์ WAN',
        rows: [
          ['/system identity set name=RTR-BRANCH', 'ตั้งชื่อเราเตอร์สาขา'],
          ['/tool netwatch add host=1.1.1.1 interval=30s', 'เฝ้าปลายทางเพื่อรู้ทันทีที่เส้นหลักล่ม'],
          ['/tool traceroute 1.1.1.1', 'ไล่ดูว่า traffic ออกไปทางลิงก์ไหนจริง ๆ'],
        ],
      },
    ],
  },
};

// ============================================================
//  CISCO CCNA — บทเรียนลงลึกเรื่องแนวคิด แต่ขาดคำสั่งเข้าโหมดซึ่งเป็นด่านแรกสุด
// ============================================================
const ciscoSwitch = {
  1: {
    note: 'ดู prompt ให้เป็นนิสัย: <code>Switch&gt;</code> = user EXEC · <code>Switch#</code> = privileged EXEC · '
      + '<code>Switch(config)#</code> = global config · <code>Switch(config-if)#</code> = กำลังแก้พอร์ตอยู่',
    groups: [
      {
        dev: 'Cisco IOS — การเข้าโหมดและบันทึก',
        rows: [
          ['enable', 'จาก <code>&gt;</code> ขึ้นเป็น <code>#</code> — ถ้าพิมพ์ show อะไรแล้วไม่ขึ้น มักเพราะยังไม่ได้ enable'],
          ['configure terminal', 'เข้า global config · ย่อได้เป็น <code>conf t</code>'],
          ['hostname SW-FL3', 'ตั้งชื่ออุปกรณ์ — prompt จะเปลี่ยนตามทันที'],
          ['interface fa0/1', 'เลือกพอร์ตที่จะแก้ · prompt เปลี่ยนเป็น <code>(config-if)#</code>'],
          ['description Uplink-to-Core', 'ใส่ป้ายกำกับพอร์ตว่าต่ออะไรอยู่'],
          ['shutdown', 'ปิดพอร์ต — พอร์ตที่ไม่ได้ใช้ควรปิดไว้'],
          ['no shutdown', 'เปิดพอร์ตกลับมา · <b>เติม <code>no</code> หน้าคำสั่งไหนคือยกเลิกคำสั่งนั้น</b> เป็นกฎทั่วไปของ IOS'],
          ['exit', 'ถอยออกหนึ่งชั้น'],
          ['end', 'กระโดดกลับไปที่ <code>#</code> จากชั้นไหนก็ได้ · เท่ากับกด <kbd>Ctrl</kbd>+<kbd>Z</kbd>'],
          ['write memory', 'บันทึก running-config ลง NVRAM · เทียบเท่า <code>copy running-config startup-config</code>'],
          ['ping 192.168.1.1', 'ทดสอบจากตัวสวิตช์เอง — ต้องได้ <code>!!!!!</code> ไม่ใช่ <code>.....</code>'],
        ],
      },
    ],
  },

  2: {
    groups: [
      {
        dev: 'Cisco IOS — PoE สำหรับกล้องและโทรศัพท์',
        rows: [
          ['power inline auto', 'จ่ายไฟให้อุปกรณ์ที่ต่อพอร์ตนี้ตามที่มันร้องขอ (ตั้งในโหมด <code>(config-if)#</code>)'],
          ['power inline never', 'ปิด PoE ที่พอร์ตนั้น ใช้กับพอร์ตที่ไม่ควรจ่ายไฟ'],
          ['show power inline', 'ดูว่าพอร์ตไหนจ่ายไฟอยู่กี่วัตต์ และงบไฟทั้งเครื่องเหลือเท่าไร'],
        ],
      },
    ],
  },

  4: {
    groups: [
      {
        dev: 'Cisco IOS — ดักจับ traffic และกันการใช้งานผิดปกติ',
        rows: [
          ['monitor session 1 source interface fa0/1', 'เลือกพอร์ตต้นทางที่จะก๊อป traffic (SPAN)'],
          ['monitor session 1 destination interface fa0/24', 'ส่งสำเนา traffic ออกพอร์ตที่ต่อ IDS หรือเครื่องดักจับ'],
          ['storm-control broadcast level 1.00', 'จำกัด broadcast ไม่ให้เกิน 1% ของแบนด์วิดท์พอร์ต กัน broadcast storm'],
          ['aaa new-model', 'เปิดระบบ AAA เพื่อยืนยันตัวตนกับเซิร์ฟเวอร์กลาง (RADIUS/TACACS+)'],
          ['dot1x system-auth-control', 'เปิด 802.1X ทั้งเครื่อง — บังคับให้ยืนยันตัวตนก่อนใช้พอร์ตได้'],
          ['ip domain-name corp.local', 'ตั้งชื่อโดเมน — ต้องมีก่อนจึงจะสร้างกุญแจ SSH ได้'],
          ['crypto key generate rsa', 'สร้างกุญแจ RSA สำหรับ SSH · ขอขนาด 2048 บิตขึ้นไปเสมอ'],
        ],
      },
    ],
  },

  5: {
    groups: [
      {
        dev: 'Cisco IOS — บัญชีผู้ใช้และข้อความเตือน',
        rows: [
          ['username netadmin privilege 15 secret N0cAdm1n',
            'สร้างบัญชีสิทธิ์สูงสุด (15) พร้อมรหัสแบบเข้ารหัส — ใช้ <code>secret</code> ไม่ใช่ <code>password</code>'],
          ['service password-encryption', 'เข้ารหัสรหัสผ่านอื่น ๆ ใน config ไม่ให้อ่านออกเวลา show'],
          ['banner motd #Authorized access only#', 'ข้อความเตือนก่อนล็อกอิน · อักขระแรกหลัง motd คือตัวปิดข้อความ จะใช้ตัวอื่นแทน <code>#</code> ก็ได้'],
          ['line vty 0 4', 'เข้าไปตั้งค่าช่องทางเข้าระยะไกลทั้ง 5 ช่อง (0 ถึง 4)'],
          ['login local', 'บังคับให้ล็อกอินด้วยบัญชีที่สร้างด้วย <code>username</code> ไม่ใช่รหัสรวมของทั้งเครื่อง'],
          ['transport input ssh', 'รับเฉพาะ SSH · ไม่รับ telnet ซึ่งส่งรหัสผ่านเป็นข้อความเปล่า'],
        ],
      },
    ],
  },
};

// ============================================================
//  MIKROTIK
// ============================================================
const mikrotikRouter = {
  3: {
    groups: [
      {
        dev: 'MikroTik RouterOS — จำกัดแบนด์วิดท์',
        rows: [
          ['/queue simple add name=guest target=192.168.40.0/24 max-limit=5M/20M',
            'จำกัดความเร็ววง guest · <code>max-limit</code> เขียนเป็น <b>อัปโหลด/ดาวน์โหลด</b> เสมอ'],
          ['/queue simple print', 'ดูรายการคิวที่ตั้งไว้และปริมาณที่วิ่งอยู่จริง'],
        ],
      },
    ],
  },
};

const mikrotikSwitch = {
  1: {
    groups: [
      {
        dev: 'MikroTik RouterOS — บัญชีผู้ใช้และการเก็บ config',
        rows: [
          ['/user print', 'ดูรายชื่อผู้ใช้และกลุ่มสิทธิ์ที่มีในเครื่อง'],
          ['/user add name=noc group=full', 'สร้างบัญชีให้ทีมดูแล · กลุ่ม <code>full</code> คือสิทธิ์สูงสุด'],
          ['/export', 'ดึง config ทั้งเครื่องออกมาเป็นข้อความ — ใช้เก็บเป็นหลักฐานก่อนแก้ และใช้เทียบหลังแก้'],
        ],
      },
    ],
  },

  5: {
    groups: [
      {
        dev: 'MikroTik RouterOS — เปิดให้ระบบ monitor ดึงค่า',
        rows: [
          ['/snmp set enabled=yes', 'เปิด SNMP'],
          ['/snmp set location=BKK-HQ-FL2', 'ระบุตำแหน่งติดตั้ง ให้ระบบ monitor แสดงได้ว่าอุปกรณ์อยู่ที่ไหน'],
          ['/snmp community add name=swmonitor addresses=10.10.10.0/24', 'จำกัดว่าวงไหนถาม SNMP ได้ — ไม่จำกัดคือเปิดให้สำรวจระบบฟรี'],
        ],
      },
    ],
  },
};

// ============================================================
//  WINDOWS SERVER — PowerShell ใช้รูป Verb-Noun เสมอ (Get- ดู · New- สร้าง · Set- แก้)
// ============================================================
const windowsServer = {
  1: {
    note: 'PowerShell ตั้งชื่อคำสั่งเป็น <b>Verb-Noun</b> เสมอ: <code>Get-</code> คือดู · <code>New-</code> คือสร้าง · '
      + '<code>Set-</code> คือแก้ · <code>Remove-</code> คือลบ · เดาชื่อไม่ออกให้ใช้ <code>Get-Command *firewall*</code>',
    groups: [
      {
        dev: 'Windows Server — สำรวจเครื่องก่อนเริ่มงาน',
        rows: [
          ['Get-ComputerInfo', 'ข้อมูลเครื่องทั้งก้อน — รุ่น OS, CPU, RAM (ตัวเทียบเท่าเดิมคือ <code>systeminfo</code>)'],
          ['Get-Volume', 'รายการ volume พร้อมพื้นที่คงเหลือ'],
          ['Get-EventLog -LogName Security', 'อ่าน event log ฝั่ง Security — ใช้ดูการล็อกอินสำเร็จ/ล้มเหลว'],
          ['Get-SmbShare', 'share ที่เครื่องนี้เปิดให้คนอื่นเข้าถึงอยู่'],
        ],
      },
      {
        dev: 'Windows Server — สร้างของและเปิดพอร์ต',
        rows: [
          ['New-Item -Path C:\\inetpub\\wwwroot\\app -ItemType Directory', 'สร้างโฟลเดอร์ · <code>-ItemType File</code> คือสร้างไฟล์'],
          ['New-NetFirewallRule -DisplayName "Allow-HTTP" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 80',
            'เปิดพอร์ตขาเข้าผ่าน Windows Firewall — ติดตั้ง role แล้วไม่ได้แปลว่าพอร์ตเปิดเอง'],
        ],
      },
    ],
  },

  2: {
    groups: [
      {
        dev: 'Windows Server — ตรวจงาน DNS ที่เพิ่งตั้ง',
        rows: [
          ['Get-DnsServerResourceRecord -ZoneName lab.local', 'ดู record ทั้งหมดใน zone — ใช้ยืนยันว่า A / CNAME ที่เพิ่งเพิ่มเข้าไปแล้วจริง'],
        ],
      },
    ],
  },

  3: {
    groups: [
      {
        dev: 'Windows Server — ตรวจ Group Policy',
        rows: [
          ['Get-GPLink', 'ดูว่า GPO ถูก link ไว้ที่ OU ไหนบ้าง · สร้าง GPO แล้วไม่ link เท่ากับไม่มีผลกับใครเลย'],
        ],
      },
    ],
  },

  4: {
    groups: [
      {
        dev: 'Windows Server — ตรวจสถานะระบบ',
        rows: [
          ['Get-Disk', 'ดิสก์ทางกายภาพและสถานะ (ใช้คู่กับ <code>Get-Volume</code>)'],
          ['Get-NetFirewallProfile', 'สถานะ firewall ของทั้งสามโปรไฟล์ Domain / Private / Public'],
          ['Get-NetFirewallRule', 'รายการ rule ทั้งหมด — ใช้ตรวจว่า rule ที่เพิ่งสร้างมีจริง'],
          ['Get-SmbServerConfiguration', 'ค่าปัจจุบันของบริการ SMB เช่นยังเปิด SMBv1 อยู่หรือไม่'],
          ['Get-VMSwitch', 'รายการ virtual switch ของ Hyper-V'],
        ],
      },
      {
        dev: 'Windows Server — สร้างบัญชีบริการและงานตามเวลา',
        rows: [
          ['New-LocalUser -Name svc-backup', 'สร้างบัญชีเฉพาะงานในเครื่อง · เติม <code>-Description "..."</code> เพื่อบอกว่าใช้ทำอะไร'],
          ['New-ScheduledTask -TaskName DailySecurityCheck', 'สร้างงานตามเวลา เช่นสั่งตรวจความปลอดภัยทุกวัน'],
          ['New-NetFirewallRule -DisplayName "Block-Legacy-SMB" -Direction Inbound -Action Block -Protocol TCP -LocalPort 445',
            '<code>-Action Block</code> คือปิดกั้น ตรงข้ามกับ <code>Allow</code>'],
        ],
      },
    ],
  },

  5: {
    groups: [
      {
        dev: 'Active Directory — Site และ Recycle Bin',
        rows: [
          ['Get-ADReplicationSubnet -Filter *', 'subnet ที่ประกาศไว้ใน AD Site — เครื่องลูกใช้ตารางนี้เลือกว่าจะคุยกับ DC ตัวไหน'],
          ['Get-ADOptionalFeature -Filter *', 'ดูว่า AD Recycle Bin เปิดแล้วหรือยัง · เปิดแล้ว<b>ปิดกลับไม่ได้</b>'],
        ],
      },
    ],
  },
};

// ============================================================
//  LINUX
// ============================================================
const linux = {
  1: {
    note: '<code>-p</code> ใน <code>mkdir -p</code> แปลว่า "สร้างโฟลเดอร์แม่ให้ด้วยถ้ายังไม่มี" และ'
      + '<b>ไม่ฟ้องถ้ามีอยู่แล้ว</b> — จึงปลอดภัยกว่าเวลาเขียนสคริปต์',
    groups: [
      {
        dev: 'Linux — รู้จักเครื่องที่เพิ่งได้มา',
        rows: [
          ['uname -a', 'kernel และสถาปัตยกรรม'],
          ['hostnamectl', 'ชื่อเครื่อง, distribution และรุ่น kernel ในคำสั่งเดียว'],
          ['uptime', 'เปิดมานานเท่าไรและ load average — ตัวเลขสามชุดคือค่าเฉลี่ย 1, 5, 15 นาที'],
          ['timedatectl', 'โซนเวลาและสถานะการซิงก์เวลา (NTP)'],
          ['systemctl list-units --type=service', 'service ที่ระบบรู้จักและสถานะของแต่ละตัว'],
        ],
      },
      {
        dev: 'Linux — จัดการไฟล์และข้อความ',
        rows: [
          ['mkdir reports', 'สร้างโฟลเดอร์ในตำแหน่งปัจจุบัน'],
          ['mkdir -p /home/student/work/2026/08', 'สร้างทั้งสายในคำสั่งเดียว แม้โฟลเดอร์แม่ยังไม่มี'],
          ['touch check.txt', 'สร้างไฟล์เปล่า (ถ้ามีอยู่แล้วจะแค่อัปเดตเวลาแก้ไขล่าสุด)'],
          ['mv /home/student/scripts /home/student/work/', 'ย้ายหรือเปลี่ยนชื่อ — คำสั่งเดียวทำทั้งสองอย่าง'],
          ['cut -d: -f1 /etc/passwd', 'ตัดเอาเฉพาะคอลัมน์ที่ต้องการ · <code>-d:</code> คือคั่นด้วย <code>:</code> · <code>-f1</code> คือเอาคอลัมน์แรก'],
        ],
      },
    ],
  },

  2: {
    groups: [
      {
        dev: 'Linux — ผู้ใช้และกลุ่ม',
        rows: [
          ['sudo groupadd devops', 'สร้างกลุ่มใหม่ · ให้สิทธิ์ผ่าน<b>กลุ่ม</b> เสมอ อย่าไล่ให้ทีละคน'],
          ['sudo useradd -m -s /bin/bash dev1', 'สร้างผู้ใช้ · <code>-m</code> สร้าง home ให้ด้วย · <code>-s</code> เลือก shell'],
          ['sudo usermod -aG devops dev1', 'เพิ่มผู้ใช้เข้ากลุ่ม · <b>ลืม <code>-a</code> เมื่อไร กลุ่มเดิมทั้งหมดหายทันที</b>'],
          ['id dev1', 'ตรวจว่าผู้ใช้อยู่กลุ่มไหนบ้างจริง ๆ'],
        ],
      },
    ],
  },

  3: {
    groups: [
      {
        dev: 'Linux — ทดสอบบริการและตั้งงานตามเวลา',
        rows: [
          ['curl -I http://localhost', 'ขอเฉพาะ HTTP header — ใช้ยืนยันว่าเว็บเซิร์ฟเวอร์ตอบจริง โดยไม่ต้องโหลดทั้งหน้า'],
          ['crontab -l', 'ดู cron job ของผู้ใช้ปัจจุบัน · <code>crontab -e</code> คือแก้ไข'],
        ],
      },
    ],
  },

  4: {
    note: 'LVM ซ้อนกันสามชั้นเสมอ: <b>PV</b> (ดิสก์จริง) → <b>VG</b> (เอา PV มารวมเป็นกองกลาง) → '
      + '<b>LV</b> (แบ่งจากกองกลางไปใช้งาน) · คำสั่งลงท้ายด้วย <code>s</code> คือ "ดู" ลงท้ายด้วย '
      + '<code>create</code> คือ "สร้าง" ของชั้นนั้น',
    groups: [
      {
        dev: 'Linux — LVM',
        rows: [
          ['sudo pvs', 'ดู physical volume — ดิสก์ที่ยกให้ LVM ใช้แล้ว'],
          ['sudo vgs', 'ดู volume group และพื้นที่ว่างที่ยังแบ่งได้'],
          ['sudo lvs', 'ดู logical volume ที่แบ่งออกมาใช้งานแล้ว'],
          ['sudo vgcreate vgdata /dev/sdb', 'สร้าง volume group จากดิสก์ที่ระบุ'],
          ['sudo lvcreate -n lvapp -L 10G vgdata', 'แบ่ง logical volume ขนาด 10G ออกจาก vgdata · <code>-n</code> คือชื่อ'],
          ['sudo mkfs.ext4 /dev/vgdata/lvapp', 'ฟอร์แมตเป็น ext4 — แบ่งแล้วยังใช้ไม่ได้จนกว่าจะมี filesystem'],
        ],
      },
    ],
  },
};

// ============================================================
//  CYBER SECURITY
// ============================================================
const cyberSecurity = {
  1: {
    note: 'คำสั่งชุดนี้คือ "ตรวจร่างกาย" เครื่องที่สงสัยว่าถูกบุกรุก — '
      + 'ทำตามลำดับและ<b>เก็บผลไว้เป็นไฟล์</b> ก่อนจะแตะอะไรในเครื่อง',
    groups: [
      {
        dev: 'Linux — สำรวจร่องรอยบนเครื่องที่สงสัย',
        rows: [
          ['crontab -l', 'cron job ของผู้ใช้ — ที่ซ่อนตัวยอดนิยมของ backdoor ที่อยากกลับมาทุกชั่วโมง'],
          ['find / -perm -4000 -type f', 'ไล่หาไฟล์ SUID ทั้งระบบ — ไฟล์ที่รันด้วยสิทธิ์เจ้าของ จึงเป็นช่องยกระดับสิทธิ์ยอดนิยม'],
          ['journalctl -u ssh --since today', 'log ของ service ที่ระบุ ย้อนหลังตามช่วงเวลา'],
          ['aide --check', 'เทียบไฟล์ระบบกับลายนิ้วมือที่เก็บไว้ บอกได้ว่าไฟล์ไหนถูกแก้'],
          ['rkhunter --check', 'สแกนหา rootkit ที่รู้จัก'],
        ],
      },
    ],
  },

  2: {
    note: 'เลขสิทธิ์อ่านทีละหลัก: <b>เจ้าของ / กลุ่ม / คนอื่น</b> โดย 4=อ่าน 2=เขียน 1=รัน · '
      + '<code>700</code> = เจ้าของทำได้ทุกอย่าง คนอื่นแตะไม่ได้เลย · <code>600</code> = เจ้าของอ่านเขียนได้ คนอื่นไม่ได้',
    groups: [
      {
        dev: 'Linux — กุญแจ SSH และสิทธิ์ไฟล์',
        rows: [
          ['ssh-keygen -t ed25519', 'สร้างคู่กุญแจสำหรับล็อกอินแทนรหัสผ่าน · ed25519 สั้นและแข็งแรงกว่า RSA'],
          ['chmod 700 /home/analyst/.ssh', 'โฟลเดอร์ .ssh ต้องเป็น 700 ไม่งั้น SSH จะปฏิเสธไม่ยอมใช้กุญแจ'],
          ['chmod 600 /home/analyst/.ssh/id_ed25519', 'private key ต้องเป็น 600 — ใครอ่านได้คือเข้าเครื่องได้'],
          ['lsblk', 'โครงสร้างดิสก์และพาร์ทิชัน · ชนิด <code>crypt</code> คือถูกเข้ารหัสอยู่'],
          ['curl -I https://example.com', 'ดู HTTP header ที่เว็บตอบกลับ ใช้ตรวจว่าบังคับ HTTPS และตั้ง security header ครบไหม'],
          ['sudo chown analyst:secops /home/analyst/customers.csv', 'เปลี่ยนเจ้าของ:กลุ่มของไฟล์ — ต้องตั้งให้ถูกก่อน แล้ว <code>chmod</code> จึงมีความหมาย'],
        ],
      },
      {
        dev: 'Linux — จัดที่เก็บหลักฐาน',
        rows: [
          ['mkdir -p /home/analyst/ir', 'สร้างโฟลเดอร์เก็บหลักฐาน · <code>-p</code> ไม่ฟ้องแม้โฟลเดอร์มีอยู่แล้ว'],
        ],
      },
      {
        dev: 'Linux — บันทึกพฤติกรรมและปรับค่า kernel',
        rows: [
          ['sudo auditctl -l', 'ดูกฎ audit ที่ใช้อยู่'],
          ['sudo auditctl -w /etc/passwd -p wa -k identity',
            'เฝ้าไฟล์สำคัญ · <code>-w</code> ไฟล์ที่เฝ้า · <code>-p wa</code> ดักตอนเขียนและแก้ attribute · <code>-k</code> คำค้นไว้ใช้ตอนไล่ log'],
          ['sudo sysctl net.ipv4.tcp_syncookies=1', 'ปรับค่า kernel ทันที (หายเมื่อรีบูต — ถ้าต้องการถาวรต้องเขียนลง <code>/etc/sysctl.d/</code>)'],
        ],
      },
    ],
  },

  3: {
    groups: [
      {
        dev: 'Linux — ดูของจริงที่วิ่งอยู่บนสาย',
        rows: [
          ['sudo tcpdump -i ens33 -c 20',
            'ดักดู packet จริง · <code>-i</code> การ์ดที่ดัก · <code>-c 20</code> หยุดเมื่อครบ 20 packet '
            + '— ไม่ใส่ <code>-c</code> มันจะวิ่งไม่หยุด'],
        ],
      },
    ],
  },

  5: {
    groups: [
      {
        dev: 'Linux — เขียนค่า hardening ลงไฟล์',
        note: '<code>&gt;</code> คือ<b>เขียนทับ</b>ทั้งไฟล์ ส่วน <code>&gt;&gt;</code> คือ<b>ต่อท้าย</b> — '
          + 'ใช้ผิดตัวเดียวค่าที่ตั้งไว้ก่อนหน้าหายหมด',
        rows: [
          ['echo "net.ipv4.tcp_syncookies = 1" > /etc/sysctl.d/99-hardening.conf', 'สร้างไฟล์ใหม่พร้อมบรรทัดแรก'],
          ['echo "kernel.randomize_va_space = 2" >> /etc/sysctl.d/99-hardening.conf', 'ต่อบรรทัดถัดไปเข้าไฟล์เดิม (ค่านี้คือเปิด ASLR เต็มรูปแบบ)'],
          ['timedatectl', 'ยืนยันว่าเวลาเครื่องซิงก์อยู่ — log ที่เวลาเพี้ยนใช้สืบสวนไม่ได้'],
          ['sudo hostnamectl set-hostname sec-baseline', 'ตั้งชื่อเครื่องให้สื่อหน้าที่ — ชื่อนี้จะติดไปกับทุกบรรทัดของ log ที่ส่งออกไป'],
          ['lsblk', 'ดูโครงสร้างดิสก์, RAID และ LVM ที่ใช้อยู่'],
        ],
      },
      {
        dev: 'Container และ Automation',
        rows: [
          ['docker ps', 'container ที่กำลังรันอยู่'],
          ['docker images', 'image ที่มีในเครื่องพร้อมเวอร์ชัน — ใช้ตรวจว่ายังใช้ image เก่าที่มีช่องโหว่อยู่ไหม'],
          ['ansible-playbook --check site.yml', '<b>dry-run</b> — บอกว่าจะเปลี่ยนอะไรบ้างโดยยังไม่เปลี่ยนจริง ให้รันตัวนี้ก่อนเสมอ'],
          ['ansible-playbook site.yml', 'รันจริง แล้วอ่านบรรทัด <code>PLAY RECAP</code> ว่า changed กี่รายการ failed กี่รายการ'],
        ],
      },
    ],
  },
};

/** คำสั่งท้ายบท แยกตามหัวข้อและระดับ */
export const LAB_COMMANDS = {
  network,
  'cisco-switch': ciscoSwitch,
  'mikrotik-router': mikrotikRouter,
  'mikrotik-switch': mikrotikSwitch,
  'windows-server': windowsServer,
  linux,
  'cyber-security': cyberSecurity,
};

/**
 * แทรก section สรุปคำสั่งต่อท้ายบทเรียนของแต่ละระดับ
 * แก้ใน object เดิม เพราะที่อื่น import TRACKS ไปถือไว้แล้ว
 */
export function mergeLabCommands(tracks) {
  for (const t of tracks) {
    const byLevel = LAB_COMMANDS[t.id];
    if (!byLevel) continue;
    for (const [lv, data] of Object.entries(byLevel)) {
      const level = t.levels[lv];
      if (!level) continue;
      if (level.sections.some(s => s.t === LAB_CMD_TITLE)) continue;   // กันแทรกซ้ำตอน hot reload
      level.sections.push({ t: LAB_CMD_TITLE, h: renderLabCommands(data) });
    }
  }
  return tracks;
}
