// ============================================================
//  หัวข้อ Network — Lab เวอร์ชัน Linux (ของเสริม)
//
//  เดิม Lab หลักของหัวข้อนี้เป็น Linux ทั้งหมด แต่ Network เป็นหัวข้อแรกของเว็บ
//  ส่วน Linux อยู่ลำดับที่ 6 — ผู้อบรมจึงเจอ command line ของ Linux ตั้งแต่ Lab แรก
//  ทั้งที่ยังไม่ได้เรียน Lab หลักจึงย้ายไปเป็น Windows (GUI + cmd) ซึ่งทุกคนคุ้นอยู่แล้ว
//
//  ไฟล์นี้เก็บของเดิมไว้เป็น "ตัวเสริม" สำหรับคนที่ผ่าน Linux มาแล้วหรืออยากลองของยาก
//  เนื้อหาเหมือนเดิมทุกอย่าง เปลี่ยนแค่ชื่อให้รู้ว่าเป็นทางเลือก
// ============================================================
const said = (h, re) => h.some(c => re.test(String(c).trim()));
const ifc = (s, n) => (s.ifaces || {})[n] || {};

export default {
  1: [{
    id: 'net-l1-phy',
    title: 'Lab 1X (เสริม · Linux) — สำรวจชั้น Physical และ Data Link',
    brief: 'เวอร์ชัน Linux ของ Lab 1 — ทำได้เลยถ้าเคยใช้ command line ของ Linux มาก่อน ถ้ายังไม่เคย แนะนำให้ทำ Lab 1A และ 1B ก่อน',
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

  2: [{
    id: 'net-l2-tshoot',
    title: 'Lab 2X (เสริม · Linux) — ไล่ปัญหา "เน็ตใช้ไม่ได้" ตามลำดับ OSI',
    brief: 'เวอร์ชัน Linux ของ Lab 2B — ขั้นตอนการไล่ปัญหาเหมือนกันทุกอย่าง ต่างแค่ชื่อคำสั่ง',
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
  }],

  3: [
    {
      id: 'net-l3-subnet',
      title: 'Lab 3X (เสริม · Linux) — แบ่ง Subnet ให้สามแผนกแล้วตั้งเส้นทาง',
      brief: 'เวอร์ชัน Linux ของ Lab 3A — การคิดเลข subnet เหมือนกันทุกประการ ต่างแค่คำสั่งที่ใช้ตั้งค่า',
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
      title: 'Lab 3Y (เสริม · Linux) — ทำความรู้จัก IPv6 บนเครื่องจริง',
      brief: 'เวอร์ชัน Linux ของ Lab 3B — แนวคิด link-local, global และ neighbor table เหมือนกันกับฝั่ง Windows',
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

  4: [{
    id: 'net-l4-services',
    title: 'Lab 4X (เสริม · Linux) — ตรวจพอร์ตและบริการชื่อโดเมน',
    brief: 'เวอร์ชัน Linux ของ Lab 4B — เพิ่มการสแกนวงด้วย nmap ซึ่งฝั่ง Windows ไม่มีมาให้ในตัว',
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
  }],
};
