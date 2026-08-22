// Lab เพิ่มเติมของ MikroTik Router — 2 lab ต่อระดับ
const T = (s, p) => s.tables[p] || [];
const has = (s, p, fn) => T(s, p).some(fn);
const said = (h, re) => h.some(c => re.test(c.trim()));

export default {
  // ================= LEVEL 1 =================
  1: [
    {
      id: 'mr1-survey',
      title: 'Lab 1B — สำรวจอุปกรณ์ที่รับช่วงต่อมา',
      brief: 'คุณรับดูแล router ต่อจากคนเก่าที่ลาออกไปโดยไม่มีเอกสารเลย งานแรกคือสำรวจว่าเครื่องนี้เป็นรุ่นอะไร ตั้งค่าอะไรไว้บ้าง แล้วเก็บ config ไว้เป็นหลักฐาน',
      device: 'mikrotik',
      tasks: [
        { t: 'ดูรุ่นเครื่องและเวอร์ชัน RouterOS', hint: '/system resource print', check: (s, h) => said(h, /system\s+resource\s+print/i) },
        { t: 'ดูรายการ interface ทั้งหมด', hint: '/interface print', check: (s, h) => said(h, /\/?interface\s+print/i) },
        { t: 'ดูรายการ IP address ที่ตั้งไว้', hint: '/ip address print', check: (s, h) => said(h, /ip\s+address\s+print/i) },
        { t: 'ดู routing table', hint: '/ip route print', check: (s, h) => said(h, /ip\s+route\s+print/i) },
        { t: 'ดูว่ามี service อะไรเปิดอยู่บ้าง', hint: '/ip service print', check: (s, h) => said(h, /ip\s+service\s+print/i) },
        { t: 'ดูรายชื่อผู้ใช้ที่เข้าเครื่องได้', hint: '/user print', check: (s, h) => said(h, /\/?user\s+print/i) },
        { t: 'ดึง config ทั้งหมดออกมาเก็บไว้', hint: '/export', check: (s, h) => said(h, /^\/?export/i) },
        { t: 'ตั้งชื่อเครื่องเป็น <code>RTR-LEGACY</code> ให้ตรงกับเอกสารใหม่', hint: '/system identity set name=RTR-LEGACY', check: s => s.settings['system identity'].name === 'RTR-LEGACY' },
      ],
    },
    {
      id: 'mr1-multinet',
      title: 'Lab 1C — วางแผน IP หลายวงบน Router เดียว',
      brief: 'สำนักงานใหม่ต้องแยกเป็น 3 วง: Office, Server และ Management โดยแต่ละวงใช้ interface แยกกัน',
      device: 'mikrotik',
      tasks: [
        { t: 'ตั้งชื่อเครื่องเป็น <code>RTR-NEWOFFICE</code>', hint: '/system identity set name=RTR-NEWOFFICE', check: s => s.settings['system identity'].name === 'RTR-NEWOFFICE' },
        { t: 'ใส่ IP <code>10.10.10.1/24</code> (Office) ที่ <code>ether2</code>', hint: '/ip address add address=10.10.10.1/24 interface=ether2', check: s => has(s, 'ip address', r => r.address === '10.10.10.1/24' && r.interface === 'ether2') },
        { t: 'ใส่ IP <code>10.10.20.1/24</code> (Server) ที่ <code>ether3</code>', hint: '/ip address add address=10.10.20.1/24 interface=ether3', check: s => has(s, 'ip address', r => r.address === '10.10.20.1/24' && r.interface === 'ether3') },
        { t: 'ใส่ IP <code>10.10.99.1/24</code> (Mgmt) ที่ <code>ether4</code>', hint: '/ip address add address=10.10.99.1/24 interface=ether4', check: s => has(s, 'ip address', r => r.address === '10.10.99.1/24' && r.interface === 'ether4') },
        { t: 'สร้าง interface list ชื่อ <code>LAN</code>', hint: '/interface list add name=LAN', check: s => has(s, 'interface list', r => r.name === 'LAN') },
        { t: 'เพิ่ม <code>ether2</code> และ <code>ether3</code> เข้า list <code>LAN</code>', hint: '/interface list member add list=LAN interface=ether2 → /interface list member add list=LAN interface=ether3', check: s => ['ether2', 'ether3'].every(i => has(s, 'interface list member', r => r.list === 'LAN' && r.interface === i)) },
        { t: 'ตรวจสอบผลด้วย <code>/ip address print</code>', hint: '/ip address print', check: (s, h) => said(h, /ip\s+address\s+print/i) },
      ],
    },
  ],

  // ================= LEVEL 2 =================
  2: [
    {
      id: 'mr2-portfwd',
      title: 'Lab 2B — เปิดเว็บเซิร์ฟเวอร์ออกสู่อินเทอร์เน็ต',
      brief: 'บริษัทมีเว็บเซิร์ฟเวอร์ภายในที่ 192.168.88.10 ต้องการให้ลูกค้าจากภายนอกเข้าถึงได้ทั้ง HTTP และ HTTPS และให้เครื่องใน LAN เรียก public IP ของตัวเองได้ด้วย (hairpin NAT)',
      device: 'mikrotik',
      tasks: [
        { t: 'ใส่ IP <code>192.168.88.1/24</code> ที่ <code>ether2</code>', hint: '/ip address add address=192.168.88.1/24 interface=ether2', check: s => has(s, 'ip address', r => r.address === '192.168.88.1/24') },
        { t: 'ตั้ง <code>ether1</code> เป็น DHCP client (WAN)', hint: '/ip dhcp-client add interface=ether1 disabled=no', check: s => has(s, 'ip dhcp-client', r => r.interface === 'ether1' && !r.disabled) },
        { t: 'สร้าง NAT masquerade ออกทาง <code>ether1</code>', hint: '/ip firewall nat add chain=srcnat out-interface=ether1 action=masquerade', check: s => has(s, 'ip firewall nat', r => r.chain === 'srcnat' && r.action === 'masquerade' && r['out-interface'] === 'ether1') },
        {
          t: 'Port forward พอร์ต 80 ไปที่ <code>192.168.88.10</code>', hint: '/ip firewall nat add chain=dstnat in-interface=ether1 protocol=tcp dst-port=80 action=dst-nat to-addresses=192.168.88.10',
          check: s => has(s, 'ip firewall nat', r => r.chain === 'dstnat' && r.action === 'dst-nat' && String(r['dst-port']) === '80' && r['to-addresses'] === '192.168.88.10')
        },
        {
          t: 'Port forward พอร์ต 443 ไปที่ <code>192.168.88.10</code>', hint: '/ip firewall nat add chain=dstnat in-interface=ether1 protocol=tcp dst-port=443 action=dst-nat to-addresses=192.168.88.10',
          check: s => has(s, 'ip firewall nat', r => r.chain === 'dstnat' && String(r['dst-port']) === '443' && r['to-addresses'] === '192.168.88.10')
        },
        {
          t: 'เพิ่มกฎ hairpin NAT: srcnat จาก LAN ไปหา 192.168.88.10 ให้ masquerade', hint: '/ip firewall nat add chain=srcnat src-address=192.168.88.0/24 dst-address=192.168.88.10 action=masquerade',
          check: s => has(s, 'ip firewall nat', r => r.chain === 'srcnat' && r.action === 'masquerade' && r['dst-address'] === '192.168.88.10')
        },
        { t: 'ตรวจสอบกฎ NAT ทั้งหมด', hint: '/ip firewall nat print', check: (s, h) => said(h, /firewall\s+nat\s+print/i) },
      ],
    },
    {
      id: 'mr2-dhcp',
      title: 'Lab 2C — DHCP พร้อมจอง IP ให้อุปกรณ์สำคัญ',
      brief: 'เครื่องพิมพ์และกล้องต้องได้ IP เดิมทุกครั้ง แต่ผู้ใช้ทั่วไปให้แจกอัตโนมัติ — ตั้ง DHCP server ให้ครบและจอง IP แบบ static lease',
      device: 'mikrotik',
      tasks: [
        { t: 'ใส่ IP <code>192.168.88.1/24</code> ที่ <code>ether2</code>', hint: '/ip address add address=192.168.88.1/24 interface=ether2', check: s => has(s, 'ip address', r => r.address === '192.168.88.1/24') },
        { t: 'สร้าง pool <code>dhcp_lan</code> ช่วง <code>192.168.88.100-192.168.88.200</code>', hint: '/ip pool add name=dhcp_lan ranges=192.168.88.100-192.168.88.200', check: s => has(s, 'ip pool', r => r.name === 'dhcp_lan') },
        { t: 'สร้าง DHCP server <code>dhcp1</code> บน <code>ether2</code> ใช้ pool ข้างต้น', hint: '/ip dhcp-server add name=dhcp1 interface=ether2 address-pool=dhcp_lan', check: s => has(s, 'ip dhcp-server', r => r.name === 'dhcp1' && r['address-pool'] === 'dhcp_lan') },
        { t: 'ตั้ง lease-time เป็น <code>1d</code>', hint: '/ip dhcp-server set [find name=dhcp1] lease-time=1d', check: s => has(s, 'ip dhcp-server', r => r.name === 'dhcp1' && String(r['lease-time']) === '1d') },
        { t: 'สร้าง dhcp-server network พร้อม gateway และ DNS', hint: '/ip dhcp-server network add address=192.168.88.0/24 gateway=192.168.88.1 dns-server=192.168.88.1', check: s => has(s, 'ip dhcp-server network', r => r.address === '192.168.88.0/24' && r.gateway === '192.168.88.1') },
        {
          t: 'จอง IP <code>192.168.88.50</code> ให้เครื่องพิมพ์ MAC <code>00:0C:29:11:22:33</code>', hint: '/ip dhcp-server lease add address=192.168.88.50 mac-address=00:0C:29:11:22:33 server=dhcp1',
          check: s => has(s, 'ip dhcp-server lease', r => r.address === '192.168.88.50' && /00:0C:29:11:22:33/i.test(r['mac-address'] || ''))
        },
        {
          t: 'จอง IP <code>192.168.88.51</code> ให้กล้อง MAC <code>00:0C:29:44:55:66</code>', hint: '/ip dhcp-server lease add address=192.168.88.51 mac-address=00:0C:29:44:55:66 server=dhcp1',
          check: s => has(s, 'ip dhcp-server lease', r => r.address === '192.168.88.51')
        },
        { t: 'ตั้ง DNS ของ router เป็น <code>1.1.1.1</code> และเปิด allow-remote-requests', hint: '/ip dns set servers=1.1.1.1 allow-remote-requests=yes', check: s => s.settings['ip dns'].servers.includes('1.1.1.1') && s.settings['ip dns']['allow-remote-requests'] === 'yes' },
      ],
    },
  ],

  // ================= LEVEL 3 =================
  3: [
    {
      id: 'mr3-fwfull',
      title: 'Lab 3B — Firewall ครบชุด input + forward',
      brief: 'router ตัวนี้มี public IP ตรง ต้องวางกฎ firewall ให้ครบทั้ง chain input (ป้องกันตัว router) และ forward (ป้องกันเครื่องใน LAN) พร้อมระบบแบน IP ที่สแกนพอร์ตอัตโนมัติ',
      device: 'mikrotik',
      tasks: [
        { t: 'สร้าง interface list <code>WAN</code> และเพิ่ม <code>ether1</code>', hint: '/interface list add name=WAN → /interface list member add list=WAN interface=ether1', check: s => has(s, 'interface list', r => r.name === 'WAN') && has(s, 'interface list member', r => r.list === 'WAN' && r.interface === 'ether1') },
        { t: 'สร้าง interface list <code>LAN</code> และเพิ่ม <code>ether2</code>', hint: '/interface list add name=LAN → /interface list member add list=LAN interface=ether2', check: s => has(s, 'interface list', r => r.name === 'LAN') && has(s, 'interface list member', r => r.list === 'LAN' && r.interface === 'ether2') },
        { t: 'input: accept <code>established,related</code>', hint: '/ip firewall filter add chain=input connection-state=established,related action=accept', check: s => has(s, 'ip firewall filter', r => r.chain === 'input' && r.action === 'accept' && /established/.test(r['connection-state'] || '')) },
        { t: 'input: drop <code>invalid</code>', hint: '/ip firewall filter add chain=input connection-state=invalid action=drop', check: s => has(s, 'ip firewall filter', r => r.chain === 'input' && r.action === 'drop' && /invalid/.test(r['connection-state'] || '')) },
        { t: 'input: accept จาก interface-list <code>LAN</code>', hint: '/ip firewall filter add chain=input in-interface-list=LAN action=accept', check: s => has(s, 'ip firewall filter', r => r.chain === 'input' && r.action === 'accept' && r['in-interface-list'] === 'LAN') },
        {
          t: 'input: ตรวจจับ port scan แล้วใส่ IP ลง address-list <code>blocked</code>', hint: '/ip firewall filter add chain=input protocol=tcp dst-port=22,23,8291 action=add-src-to-address-list address-list=blocked address-list-timeout=1d',
          check: s => has(s, 'ip firewall filter', r => r.action === 'add-src-to-address-list' && r['address-list'] === 'blocked')
        },
        { t: 'input: drop ทุกอย่างที่เหลือ', hint: '/ip firewall filter add chain=input action=drop', check: s => has(s, 'ip firewall filter', r => r.chain === 'input' && r.action === 'drop' && !r['connection-state']) },
        { t: 'forward: accept <code>established,related</code>', hint: '/ip firewall filter add chain=forward connection-state=established,related action=accept', check: s => has(s, 'ip firewall filter', r => r.chain === 'forward' && r.action === 'accept' && /established/.test(r['connection-state'] || '')) },
        { t: 'forward: drop <code>invalid</code>', hint: '/ip firewall filter add chain=forward connection-state=invalid action=drop', check: s => has(s, 'ip firewall filter', r => r.chain === 'forward' && r.action === 'drop' && /invalid/.test(r['connection-state'] || '')) },
        {
          t: 'raw: drop traffic จาก address-list <code>blocked</code> ตั้งแต่ต้นทาง', hint: '/ip firewall raw add chain=prerouting src-address-list=blocked action=drop',
          check: s => has(s, 'ip firewall raw', r => r.action === 'drop' && r['src-address-list'] === 'blocked')
        },
        { t: 'ตรวจสอบกฎทั้งหมด', hint: '/ip firewall filter print', check: (s, h) => said(h, /firewall\s+filter\s+print/i) },
      ],
    },
    {
      id: 'mr3-guest',
      title: 'Lab 3C — แยกวง Guest ไม่ให้แตะ LAN',
      brief: 'ร้านกาแฟชั้นล่างขอ Wi-Fi ให้ลูกค้า ต้องแยกวงออกมาให้ออกเน็ตได้อย่างเดียว ห้ามเข้าถึงวงออฟฟิศและห้ามเข้าหน้าจัดการ router',
      device: 'mikrotik',
      tasks: [
        { t: 'สร้าง bridge <code>bridge1</code>', hint: '/interface bridge add name=bridge1', check: s => has(s, 'interface bridge', r => r.name === 'bridge1') },
        { t: 'สร้าง VLAN interface <code>vlan40</code> vlan-id 40 บน <code>bridge1</code>', hint: '/interface vlan add name=vlan40 vlan-id=40 interface=bridge1', check: s => has(s, 'interface vlan', r => r.name === 'vlan40' && String(r['vlan-id']) === '40') },
        { t: 'ใส่ IP <code>192.168.40.1/24</code> ให้ <code>vlan40</code>', hint: '/ip address add address=192.168.40.1/24 interface=vlan40', check: s => has(s, 'ip address', r => r.address === '192.168.40.1/24' && r.interface === 'vlan40') },
        { t: 'สร้าง pool <code>guest_pool</code> ช่วง <code>192.168.40.100-192.168.40.200</code>', hint: '/ip pool add name=guest_pool ranges=192.168.40.100-192.168.40.200', check: s => has(s, 'ip pool', r => r.name === 'guest_pool' && /192.168.40.100/.test(r.ranges || '')) },
        { t: 'สร้าง DHCP server <code>dhcp-guest</code> บน <code>vlan40</code>', hint: '/ip dhcp-server add name=dhcp-guest interface=vlan40 address-pool=guest_pool', check: s => has(s, 'ip dhcp-server', r => r.name === 'dhcp-guest' && r.interface === 'vlan40') },
        { t: 'สร้าง dhcp-server network ของวง guest', hint: '/ip dhcp-server network add address=192.168.40.0/24 gateway=192.168.40.1 dns-server=1.1.1.1', check: s => has(s, 'ip dhcp-server network', r => r.address === '192.168.40.0/24') },
        {
          t: 'สร้าง address-list <code>lan_nets</code> สำหรับ <code>192.168.88.0/24</code>', hint: '/ip firewall address-list add list=lan_nets address=192.168.88.0/24',
          check: s => has(s, 'ip firewall address-list', r => r.list === 'lan_nets' && r.address === '192.168.88.0/24')
        },
        {
          t: 'forward: drop traffic จาก guest ไปยัง <code>lan_nets</code>', hint: '/ip firewall filter add chain=forward in-interface=vlan40 dst-address-list=lan_nets action=drop',
          check: s => has(s, 'ip firewall filter', r => r.chain === 'forward' && r.action === 'drop' && r['in-interface'] === 'vlan40')
        },
        {
          t: 'input: drop ไม่ให้ guest เข้าหน้าจัดการ router', hint: '/ip firewall filter add chain=input in-interface=vlan40 protocol=tcp dst-port=22,8291,80 action=drop',
          check: s => has(s, 'ip firewall filter', r => r.chain === 'input' && r.action === 'drop' && r['in-interface'] === 'vlan40')
        },
        { t: 'จำกัดแบนด์วิดท์วง guest ไว้ที่ <code>5M/20M</code>', hint: '/queue simple add name=guest target=192.168.40.0/24 max-limit=5M/20M', check: s => has(s, 'queue simple', r => r.target === '192.168.40.0/24' && r['max-limit'] === '5M/20M') },
      ],
    },
  ],

  // ================= LEVEL 4 =================
  4: [
    {
      id: 'mr4-wireguard',
      title: 'Lab 4B — WireGuard เชื่อมสาขา',
      brief: 'สาขาเชียงใหม่ต้องเข้าถึงเซิร์ฟเวอร์ที่สำนักงานใหญ่ ทีมเลือกใช้ WireGuard เพราะเร็วและตั้งง่าย คุณตั้งค่าฝั่งสำนักงานใหญ่',
      device: 'mikrotik',
      tasks: [
        { t: 'สร้าง interface WireGuard ชื่อ <code>wg0</code> listen-port <code>13231</code>', hint: '/interface wireguard add name=wg0 listen-port=13231', check: s => has(s, 'interface wireguard', r => r.name === 'wg0' && String(r['listen-port']) === '13231') },
        { t: 'ใส่ IP <code>10.99.0.1/24</code> ให้ <code>wg0</code>', hint: '/ip address add address=10.99.0.1/24 interface=wg0', check: s => has(s, 'ip address', r => r.address === '10.99.0.1/24' && r.interface === 'wg0') },
        { t: 'ดู public key ของเราเพื่อส่งให้ฝั่งสาขา', hint: '/interface wireguard print', check: (s, h) => said(h, /interface\s+wireguard\s+print/i) },
        {
          t: 'เพิ่ม peer ของสาขา (public-key ใดก็ได้) allowed-address <code>10.99.0.2/32,192.168.20.0/24</code>',
          hint: '/interface wireguard peers add interface=wg0 public-key="CnXbranchKey123=" allowed-address=10.99.0.2/32,192.168.20.0/24',
          check: s => has(s, 'interface wireguard peers', r => r.interface === 'wg0' && /192\.168\.20\.0\/24/.test(r['allowed-address'] || ''))
        },
        {
          t: 'เพิ่ม route ไปยัง subnet สาขา <code>192.168.20.0/24</code> ผ่าน <code>10.99.0.2</code>', hint: '/ip route add dst-address=192.168.20.0/24 gateway=10.99.0.2',
          check: s => has(s, 'ip route', r => r['dst-address'] === '192.168.20.0/24' && r.gateway === '10.99.0.2')
        },
        {
          t: 'เปิด firewall input ให้ UDP 13231 เข้าได้', hint: '/ip firewall filter add chain=input protocol=udp dst-port=13231 action=accept',
          check: s => has(s, 'ip firewall filter', r => r.chain === 'input' && r.action === 'accept' && String(r['dst-port']) === '13231')
        },
        {
          t: 'อนุญาต forward ระหว่าง LAN กับ VPN', hint: '/ip firewall filter add chain=forward in-interface=wg0 action=accept',
          check: s => has(s, 'ip firewall filter', r => r.chain === 'forward' && r.action === 'accept' && r['in-interface'] === 'wg0')
        },
        { t: 'ตรวจสอบรายการ peer', hint: '/interface wireguard peers print', check: (s, h) => said(h, /wireguard\s+peers\s+print/i) },
      ],
    },
    {
      id: 'mr4-ospf',
      title: 'Lab 4C — OSPF ระหว่างสาขา',
      brief: 'องค์กรมี 4 สาขาและเส้นทางเริ่มเยอะจนจัดการ static route ไม่ไหว ทีมตัดสินใจใช้ OSPF area 0 ทั้งหมด',
      device: 'mikrotik',
      tasks: [
        { t: 'ใส่ IP <code>10.0.0.1/30</code> ที่ <code>ether1</code> (ลิงก์ระหว่างสาขา)', hint: '/ip address add address=10.0.0.1/30 interface=ether1', check: s => has(s, 'ip address', r => r.address === '10.0.0.1/30') },
        { t: 'ใส่ IP <code>172.16.10.1/24</code> ที่ <code>ether2</code> (วง LAN)', hint: '/ip address add address=172.16.10.1/24 interface=ether2', check: s => has(s, 'ip address', r => r.address === '172.16.10.1/24') },
        { t: 'สร้าง OSPF instance ชื่อ <code>default</code> router-id <code>10.0.0.1</code>', hint: '/routing ospf instance add name=default router-id=10.0.0.1', check: s => has(s, 'routing ospf instance', r => r.name === 'default' && r['router-id'] === '10.0.0.1') },
        { t: 'สร้าง OSPF area ชื่อ <code>backbone</code> area-id <code>0.0.0.0</code>', hint: '/routing ospf area add name=backbone area-id=0.0.0.0 instance=default', check: s => has(s, 'routing ospf area', r => r.name === 'backbone' && r['area-id'] === '0.0.0.0') },
        { t: 'เพิ่ม interface-template สำหรับ <code>ether1</code> เข้า area backbone', hint: '/routing ospf interface-template add interfaces=ether1 area=backbone', check: s => has(s, 'routing ospf interface-template', r => r.interfaces === 'ether1' && r.area === 'backbone') },
        { t: 'เพิ่ม interface-template สำหรับ <code>ether2</code> เข้า area backbone', hint: '/routing ospf interface-template add interfaces=ether2 area=backbone', check: s => has(s, 'routing ospf interface-template', r => r.interfaces === 'ether2' && r.area === 'backbone') },
        {
          t: 'อนุญาต OSPF (protocol 89) ใน firewall input', hint: '/ip firewall filter add chain=input protocol=ospf action=accept',
          check: s => has(s, 'ip firewall filter', r => r.chain === 'input' && r.action === 'accept' && /ospf/i.test(r.protocol || ''))
        },
        { t: 'ตรวจสอบ area ที่ประกาศไว้', hint: '/routing ospf area print', check: (s, h) => said(h, /ospf\s+area\s+print/i) },
        { t: 'ดึง config ออกมาตรวจทาน', hint: '/export', check: (s, h) => said(h, /^\/?export/i) },
      ],
    },
  ],

  // ================= LEVEL 5 =================
  5: [
    {
      id: 'mr5-ha',
      title: 'Lab 5B — VRRP และ Dual WAN Failover',
      brief: 'สาขาสำคัญต้องไม่ล่ม ทีมวางแผนใช้ router 2 ตัวแชร์ gateway เดียวกันด้วย VRRP และมีเน็ต 2 เส้น คุณตั้งค่าตัวหลัก',
      device: 'mikrotik',
      tasks: [
        { t: 'สร้าง bridge <code>bridge1</code>', hint: '/interface bridge add name=bridge1', check: s => has(s, 'interface bridge', r => r.name === 'bridge1') },
        { t: 'สร้าง VRRP interface ชื่อ <code>vrrp-lan</code> บน <code>bridge1</code> vrid <code>10</code> priority <code>200</code>', hint: '/interface vrrp add name=vrrp-lan interface=bridge1 vrid=10 priority=200', check: s => has(s, 'interface vrrp', r => r.name === 'vrrp-lan' && String(r.vrid) === '10' && String(r.priority) === '200') },
        { t: 'ใส่ virtual IP <code>192.168.88.1/24</code> ที่ <code>vrrp-lan</code>', hint: '/ip address add address=192.168.88.1/24 interface=vrrp-lan', check: s => has(s, 'ip address', r => r.address === '192.168.88.1/24' && r.interface === 'vrrp-lan') },
        { t: 'ใส่ IP จริงของเครื่องนี้ <code>192.168.88.2/24</code> ที่ <code>bridge1</code>', hint: '/ip address add address=192.168.88.2/24 interface=bridge1', check: s => has(s, 'ip address', r => r.address === '192.168.88.2/24' && r.interface === 'bridge1') },
        { t: 'default route หลักผ่าน <code>203.0.113.1</code> distance 1 พร้อม check-gateway', hint: '/ip route add dst-address=0.0.0.0/0 gateway=203.0.113.1 distance=1 check-gateway=ping', check: s => has(s, 'ip route', r => r.gateway === '203.0.113.1' && String(r.distance) === '1' && /ping/.test(r['check-gateway'] || '')) },
        { t: 'default route สำรองผ่าน <code>198.51.100.1</code> distance 2 พร้อม check-gateway', hint: '/ip route add dst-address=0.0.0.0/0 gateway=198.51.100.1 distance=2 check-gateway=ping', check: s => has(s, 'ip route', r => r.gateway === '198.51.100.1' && String(r.distance) === '2' && /ping/.test(r['check-gateway'] || '')) },
        { t: 'NAT masquerade ออก <code>ether1</code>', hint: '/ip firewall nat add chain=srcnat out-interface=ether1 action=masquerade', check: s => has(s, 'ip firewall nat', r => r.action === 'masquerade' && r['out-interface'] === 'ether1') },
        { t: 'NAT masquerade ออก <code>ether2</code> (WAN สำรอง)', hint: '/ip firewall nat add chain=srcnat out-interface=ether2 action=masquerade', check: s => has(s, 'ip firewall nat', r => r.action === 'masquerade' && r['out-interface'] === 'ether2') },
        { t: 'ตั้ง netwatch เฝ้า <code>1.1.1.1</code>', hint: '/tool netwatch add host=1.1.1.1', check: s => has(s, 'tool netwatch', r => r.host === '1.1.1.1') },
        { t: 'ตรวจสอบ VRRP ที่สร้างไว้', hint: '/interface vrrp print', check: (s, h) => said(h, /interface\s+vrrp\s+print/i) },
      ],
    },
    {
      id: 'mr5-monitor',
      title: 'Lab 5C — ต่อ Router เข้าระบบ Monitoring',
      brief: 'NOC ขอให้ทุก router ส่ง log และ metric เข้าระบบกลาง พร้อมมี script ตรวจสุขภาพอัตโนมัติ และตั้งเวลาให้ตรงเพื่อให้ log correlate กันได้',
      device: 'mikrotik',
      tasks: [
        { t: 'ตั้งชื่อเครื่องเป็น <code>RTR-BKK-01</code>', hint: '/system identity set name=RTR-BKK-01', check: s => s.settings['system identity'].name === 'RTR-BKK-01' },
        { t: 'เปิด SNMP', hint: '/snmp set enabled=yes', check: s => s.settings['snmp'].enabled === 'yes' },
        { t: 'สร้าง SNMP community <code>N0cM0nitor</code> จำกัดที่ <code>10.10.10.0/24</code>', hint: '/snmp community add name=N0cM0nitor addresses=10.10.10.0/24', check: s => has(s, 'snmp community', r => r.name === 'N0cM0nitor' && r.addresses === '10.10.10.0/24') },
        { t: 'สร้าง logging action <code>remote-log</code> ส่งไปที่ <code>10.10.10.60</code>', hint: '/system logging action add name=remote-log target=remote remote=10.10.10.60', check: s => has(s, 'system logging action', r => r.name === 'remote-log' && r.remote === '10.10.10.60') },
        { t: 'ส่ง log topic <code>info</code> ไปยัง action <code>remote-log</code>', hint: '/system logging add topics=info action=remote-log', check: s => has(s, 'system logging', r => r.action === 'remote-log') },
        { t: 'ตั้ง NTP client ให้ sync กับ <code>203.159.72.1</code>', hint: '/system ntp client set enabled=yes servers=203.159.72.1', check: s => s.settings['system ntp client'].enabled === 'yes' && s.settings['system ntp client'].servers.includes('203.159.72.1') },
        { t: 'ตั้ง time zone เป็น <code>Asia/Bangkok</code>', hint: '/system clock set time-zone-name=Asia/Bangkok', check: s => s.settings['system clock']['time-zone-name'] === 'Asia/Bangkok' },
        { t: 'สร้าง script ชื่อ <code>health-check</code>', hint: '/system script add name=health-check source=":log info \\"ok\\""', check: s => has(s, 'system script', r => r.name === 'health-check') },
        { t: 'ตั้ง scheduler <code>health-5m</code> รันทุก <code>5m</code>', hint: '/system scheduler add name=health-5m interval=5m on-event=health-check', check: s => has(s, 'system scheduler', r => r.name === 'health-5m' && String(r.interval) === '5m') },
        { t: 'จำกัด neighbor discovery ให้ทำงานเฉพาะ interface-list <code>LAN</code>', hint: '/interface list add name=LAN → /ip neighbor discovery-settings set discover-interface-list=LAN', check: s => s.settings['ip neighbor discovery-settings']['discover-interface-list'] === 'LAN' },
        { t: 'ตรวจสอบ config ทั้งหมด', hint: '/export', check: (s, h) => said(h, /^\/?export/i) },
      ],
    },
  ],
};
