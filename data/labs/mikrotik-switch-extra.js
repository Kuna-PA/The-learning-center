// Lab เพิ่มเติมของ MikroTik Switch (CRS/CSS) — 2 lab ต่อระดับ
const T = (s, p) => s.tables[p] || [];
const has = (s, p, fn) => T(s, p).some(fn);
const said = (h, re) => h.some(c => re.test(c.trim()));
const vlanRow = (s, id) => T(s, 'interface bridge vlan').find(r => String(r['vlan-ids']).split(',').includes(String(id)));

export default {
  // ================= LEVEL 1 =================
  1: [
    {
      id: 'ms1-inspect',
      title: 'Lab 1B — ตรวจสอบพอร์ตและ SFP ก่อนใช้งาน',
      brief: 'สวิตช์ CRS ถูกส่งมาพร้อม SFP module มือสอง ก่อนติดตั้งจริงต้องตรวจว่าพอร์ตไหน link ขึ้น และค่าแสงของ SFP อยู่ในเกณฑ์หรือไม่',
      device: 'mikrotik-sw',
      tasks: [
        { t: 'ดูรายการ interface ทั้งหมดพร้อม flag', hint: '/interface print', check: (s, h) => said(h, /\/?interface\s+print/i) },
        { t: 'ดูรายละเอียดพอร์ต ethernet', hint: '/interface ethernet print', check: (s, h) => said(h, /interface\s+ethernet\s+print/i) },
        { t: 'ดูข้อมูลเครื่อง (รุ่น/CPU/RAM)', hint: '/system resource print', check: (s, h) => said(h, /system\s+resource\s+print/i) },
        { t: 'ตั้งชื่ออุปกรณ์เป็น <code>SW-EDGE-01</code>', hint: '/system identity set name=SW-EDGE-01', check: s => s.settings['system identity'].name === 'SW-EDGE-01' },
        { t: 'สร้าง user <code>noc</code> group <code>full</code> สำหรับทีมดูแล', hint: '/user add name=noc group=full', check: s => has(s, 'user', r => r.name === 'noc') },
        { t: 'ดูรายการ service ที่เปิดอยู่', hint: '/ip service print', check: (s, h) => said(h, /ip\s+service\s+print/i) },
        { t: 'ดึง config ออกมาเก็บเป็นหลักฐาน', hint: '/export', check: (s, h) => said(h, /^\/?export/i) },
      ],
    },
    {
      id: 'ms1-bridge',
      title: 'Lab 1C — รวมพอร์ตทั้งหมดเป็นสวิตช์เดียว',
      brief: 'CRS ที่แกะกล่องมาใหม่ ทุกพอร์ตยังแยกกันอยู่ ต้องรวมพอร์ต ether2-ether6 เข้าเป็น bridge เดียวและตั้ง IP สำหรับจัดการ',
      device: 'mikrotik-sw',
      tasks: [
        { t: 'ตั้งชื่ออุปกรณ์เป็น <code>SW-ACC-01</code>', hint: '/system identity set name=SW-ACC-01', check: s => s.settings['system identity'].name === 'SW-ACC-01' },
        { t: 'สร้าง bridge <code>bridge1</code>', hint: '/interface bridge add name=bridge1', check: s => has(s, 'interface bridge', r => r.name === 'bridge1') },
        {
          t: 'เพิ่ม <code>ether2</code> ถึง <code>ether6</code> เข้า bridge1',
          hint: '/interface bridge port add bridge=bridge1 interface=ether2 → /interface bridge port add bridge=bridge1 interface=ether3 → /interface bridge port add bridge=bridge1 interface=ether4 → /interface bridge port add bridge=bridge1 interface=ether5 → /interface bridge port add bridge=bridge1 interface=ether6',
          check: s => ['ether2', 'ether3', 'ether4', 'ether5', 'ether6'].every(i => has(s, 'interface bridge port', r => r.bridge === 'bridge1' && r.interface === i))
        },
        { t: 'ใส่ IP <code>10.10.99.11/24</code> ที่ <code>bridge1</code>', hint: '/ip address add address=10.10.99.11/24 interface=bridge1', check: s => has(s, 'ip address', r => r.address === '10.10.99.11/24' && r.interface === 'bridge1') },
        { t: 'เพิ่ม default route ไป <code>10.10.99.1</code>', hint: '/ip route add dst-address=0.0.0.0/0 gateway=10.10.99.1', check: s => has(s, 'ip route', r => r['dst-address'] === '0.0.0.0/0' && r.gateway === '10.10.99.1') },
        { t: 'ตั้ง DNS เป็น <code>10.10.99.1</code>', hint: '/ip dns set servers=10.10.99.1', check: s => s.settings['ip dns'].servers.includes('10.10.99.1') },
        { t: 'ตรวจสอบสถานะ bridge port (ดูคอลัมน์ HW ด้วย)', hint: '/interface bridge port print', check: (s, h) => said(h, /bridge\s+port\s+print/i) },
      ],
    },
  ],

  // ================= LEVEL 2 =================
  2: [
    {
      id: 'ms2-root',
      title: 'Lab 2B — บังคับให้ Core เป็น Root Bridge',
      brief: 'เครือข่ายมีสวิตช์ 5 ตัวต่อกันเป็นวง ตอนนี้ root bridge ถูกเลือกเองตาม MAC ทำให้ traffic วิ่งอ้อม ต้องบังคับให้สวิตช์ตัวนี้ (core) เป็น root',
      device: 'mikrotik-sw',
      tasks: [
        { t: 'สร้าง bridge <code>bridge1</code>', hint: '/interface bridge add name=bridge1', check: s => has(s, 'interface bridge', r => r.name === 'bridge1') },
        { t: 'ตั้ง protocol-mode เป็น <code>rstp</code>', hint: '/interface bridge set [find name=bridge1] protocol-mode=rstp', check: s => has(s, 'interface bridge', r => r.name === 'bridge1' && r['protocol-mode'] === 'rstp') },
        { t: 'ตั้ง priority เป็น <code>0x1000</code> เพื่อบังคับเป็น root', hint: '/interface bridge set [find name=bridge1] priority=0x1000', check: s => has(s, 'interface bridge', r => r.name === 'bridge1' && String(r.priority).toLowerCase() === '0x1000') },
        {
          t: 'เพิ่ม <code>ether1</code> และ <code>ether2</code> เข้า bridge (ลิงก์ไปสวิตช์ตัวอื่น)',
          hint: '/interface bridge port add bridge=bridge1 interface=ether1 → /interface bridge port add bridge=bridge1 interface=ether2',
          check: s => ['ether1', 'ether2'].every(i => has(s, 'interface bridge port', r => r.bridge === 'bridge1' && r.interface === i))
        },
        {
          t: 'เพิ่ม <code>ether5</code> เข้า bridge สำหรับพอร์ตผู้ใช้', hint: '/interface bridge port add bridge=bridge1 interface=ether5',
          check: s => has(s, 'interface bridge port', r => r.interface === 'ether5')
        },
        {
          t: 'ตั้ง <code>ether5</code> เป็น edge port', hint: '/interface bridge port set [find interface=ether5] edge=yes',
          check: s => has(s, 'interface bridge port', r => r.interface === 'ether5' && r.edge === 'yes')
        },
        {
          t: 'เปิด <code>bpdu-guard</code> ที่ <code>ether5</code>', hint: '/interface bridge port set [find interface=ether5] bpdu-guard=yes',
          check: s => has(s, 'interface bridge port', r => r.interface === 'ether5' && r['bpdu-guard'] === 'yes')
        },
        { t: 'ตรวจสอบรายละเอียด bridge port', hint: '/interface bridge port print detail', check: (s, h) => said(h, /bridge\s+port\s+print/i) },
      ],
    },
    {
      id: 'ms2-access',
      title: 'Lab 2C — จัดพอร์ต Access ตามผังห้อง',
      brief: 'ทีมช่างเดินสายเสร็จแล้วส่งผังมาให้: ether2-3 = ห้องบัญชี (VLAN 10), ether4-5 = ห้องขาย (VLAN 20), ether6 = เครื่องพิมพ์ (VLAN 30)',
      device: 'mikrotik-sw',
      tasks: [
        { t: 'สร้าง bridge <code>bridge1</code>', hint: '/interface bridge add name=bridge1', check: s => has(s, 'interface bridge', r => r.name === 'bridge1') },
        {
          t: 'เพิ่ม <code>ether2</code> pvid 10 และ <code>ether3</code> pvid 10',
          hint: '/interface bridge port add bridge=bridge1 interface=ether2 pvid=10 → /interface bridge port add bridge=bridge1 interface=ether3 pvid=10',
          check: s => ['ether2', 'ether3'].every(i => has(s, 'interface bridge port', r => r.interface === i && String(r.pvid) === '10'))
        },
        {
          t: 'เพิ่ม <code>ether4</code> pvid 20 และ <code>ether5</code> pvid 20',
          hint: '/interface bridge port add bridge=bridge1 interface=ether4 pvid=20 → /interface bridge port add bridge=bridge1 interface=ether5 pvid=20',
          check: s => ['ether4', 'ether5'].every(i => has(s, 'interface bridge port', r => r.interface === i && String(r.pvid) === '20'))
        },
        {
          t: 'เพิ่ม <code>ether6</code> pvid 30 (เครื่องพิมพ์)', hint: '/interface bridge port add bridge=bridge1 interface=ether6 pvid=30',
          check: s => has(s, 'interface bridge port', r => r.interface === 'ether6' && String(r.pvid) === '30')
        },
        {
          t: 'เพิ่ม <code>ether1</code> เป็น trunk ไป core (pvid 999)', hint: '/interface bridge port add bridge=bridge1 interface=ether1 pvid=999',
          check: s => has(s, 'interface bridge port', r => r.interface === 'ether1' && String(r.pvid) === '999')
        },
        {
          t: 'บังคับให้พอร์ตผู้ใช้รับเฉพาะ frame ที่ไม่มี tag (<code>ether2</code>)',
          hint: '/interface bridge port set [find interface=ether2] frame-types=admit-only-untagged-and-priority-tagged',
          check: s => has(s, 'interface bridge port', r => r.interface === 'ether2' && /untagged/.test(r['frame-types'] || ''))
        },
        { t: 'ตรวจสอบ pvid ของทุกพอร์ต', hint: '/interface bridge port print', check: (s, h) => said(h, /bridge\s+port\s+print/i) },
      ],
    },
  ],

  // ================= LEVEL 3 =================
  3: [
    {
      id: 'ms3-4vlan',
      title: 'Lab 3B — VLAN 4 วง เชื่อม Trunk ไปสวิตช์ Cisco',
      brief: 'สวิตช์ตัวนี้ต่อกับ Cisco Catalyst ที่ core ซึ่งตั้ง native vlan 999 ไว้ ต้องประกาศ VLAN ทั้ง 4 วงให้ตรงกันทั้งสองฝั่ง',
      device: 'mikrotik-sw',
      tasks: [
        { t: 'สร้าง bridge <code>bridge1</code> (ยังไม่เปิด vlan-filtering)', hint: '/interface bridge add name=bridge1', check: s => has(s, 'interface bridge', r => r.name === 'bridge1') },
        {
          t: 'เพิ่มพอร์ต: <code>ether1</code> trunk pvid 999, <code>ether2</code> pvid 10, <code>ether3</code> pvid 20, <code>ether4</code> pvid 50',
          hint: '/interface bridge port add bridge=bridge1 interface=ether1 pvid=999 → /interface bridge port add bridge=bridge1 interface=ether2 pvid=10 → /interface bridge port add bridge=bridge1 interface=ether3 pvid=20 → /interface bridge port add bridge=bridge1 interface=ether4 pvid=50',
          check: s => [['ether1', '999'], ['ether2', '10'], ['ether3', '20'], ['ether4', '50']]
            .every(([i, v]) => has(s, 'interface bridge port', r => r.interface === i && String(r.pvid) === v))
        },
        {
          t: 'ประกาศ VLAN 10 (Office): tagged <code>ether1</code> untagged <code>ether2</code>',
          hint: '/interface bridge vlan add bridge=bridge1 vlan-ids=10 tagged=ether1 untagged=ether2',
          check: s => { const r = vlanRow(s, 10); return r && /ether1/.test(r.tagged || '') && /ether2/.test(r.untagged || ''); }
        },
        {
          t: 'ประกาศ VLAN 20 (Sales): tagged <code>ether1</code> untagged <code>ether3</code>',
          hint: '/interface bridge vlan add bridge=bridge1 vlan-ids=20 tagged=ether1 untagged=ether3',
          check: s => { const r = vlanRow(s, 20); return r && /ether3/.test(r.untagged || ''); }
        },
        {
          t: 'ประกาศ VLAN 50 (CCTV): tagged <code>ether1</code> untagged <code>ether4</code>',
          hint: '/interface bridge vlan add bridge=bridge1 vlan-ids=50 tagged=ether1 untagged=ether4',
          check: s => { const r = vlanRow(s, 50); return r && /ether4/.test(r.untagged || ''); }
        },
        {
          t: 'ประกาศ VLAN 99 (Mgmt): tagged <code>ether1,bridge1</code>',
          hint: '/interface bridge vlan add bridge=bridge1 vlan-ids=99 tagged=ether1,bridge1',
          check: s => { const r = vlanRow(s, 99); return r && /bridge1/.test(r.tagged || '') && /ether1/.test(r.tagged || ''); }
        },
        { t: 'สร้าง VLAN interface <code>mgmt</code> vlan-id 99 บน bridge1', hint: '/interface vlan add name=mgmt vlan-id=99 interface=bridge1', check: s => has(s, 'interface vlan', r => r.name === 'mgmt' && String(r['vlan-id']) === '99') },
        { t: 'ใส่ IP <code>10.10.99.13/24</code> ที่ <code>mgmt</code>', hint: '/ip address add address=10.10.99.13/24 interface=mgmt', check: s => has(s, 'ip address', r => r.address === '10.10.99.13/24' && r.interface === 'mgmt') },
        { t: 'เปิด vlan-filtering เป็นขั้นตอนสุดท้าย', hint: '/interface bridge set [find name=bridge1] vlan-filtering=yes', check: s => has(s, 'interface bridge', r => r.name === 'bridge1' && r['vlan-filtering'] === 'yes') },
        { t: 'ตรวจสอบตาราง VLAN', hint: '/interface bridge vlan print', check: (s, h) => said(h, /bridge\s+vlan\s+print/i) },
      ],
    },
    {
      id: 'ms3-fix',
      title: 'Lab 3C — แก้เคส "VLAN 20 ไม่ผ่าน trunk"',
      brief: 'หลังเปิด vlan-filtering ผู้ใช้ VLAN 10 ใช้งานได้ปกติ แต่ VLAN 20 ใช้ไม่ได้เลย ให้ไล่ดูตาราง VLAN แล้วแก้ให้ถูก',
      device: 'mikrotik-sw',
      init: {
        apply: st => {
          st.tables['interface bridge'].push({ _id: '*90', name: 'bridge1', 'protocol-mode': 'rstp', 'vlan-filtering': 'yes', disabled: false });
          st.tables['interface bridge port'].push(
            { _id: '*91', bridge: 'bridge1', interface: 'ether1', pvid: '999', disabled: false },
            { _id: '*92', bridge: 'bridge1', interface: 'ether2', pvid: '10', disabled: false },
            { _id: '*93', bridge: 'bridge1', interface: 'ether3', pvid: '20', disabled: false });
          st.tables['interface bridge vlan'].push(
            { _id: '*94', bridge: 'bridge1', 'vlan-ids': '10', tagged: 'ether1', untagged: 'ether2', disabled: false });
        },
      },
      tasks: [
        { t: 'ดูตาราง VLAN ปัจจุบันเพื่อหาสาเหตุ', hint: '/interface bridge vlan print', check: (s, h) => said(h, /bridge\s+vlan\s+print/i) },
        { t: 'ดู pvid ของแต่ละพอร์ตว่าตั้งถูกไหม', hint: '/interface bridge port print', check: (s, h) => said(h, /bridge\s+port\s+print/i) },
        {
          t: 'เพิ่มการประกาศ VLAN 20 ที่หายไป: tagged <code>ether1</code> untagged <code>ether3</code>',
          hint: '/interface bridge vlan add bridge=bridge1 vlan-ids=20 tagged=ether1 untagged=ether3',
          check: s => { const r = vlanRow(s, 20); return r && /ether1/.test(r.tagged || '') && /ether3/.test(r.untagged || ''); }
        },
        {
          t: 'ประกาศ VLAN 99 สำหรับ management: tagged <code>ether1,bridge1</code>',
          hint: '/interface bridge vlan add bridge=bridge1 vlan-ids=99 tagged=ether1,bridge1',
          check: s => { const r = vlanRow(s, 99); return r && /bridge1/.test(r.tagged || ''); }
        },
        {
          t: 'เปิด <code>ingress-filtering</code> ที่ <code>ether3</code> เพื่อความปลอดภัย',
          hint: '/interface bridge port set [find interface=ether3] ingress-filtering=yes',
          check: s => has(s, 'interface bridge port', r => r.interface === 'ether3' && r['ingress-filtering'] === 'yes')
        },
        { t: 'ตรวจสอบตาราง VLAN อีกครั้งว่าครบแล้ว', hint: '/interface bridge vlan print', check: (s, h) => h.filter(c => /bridge\s+vlan\s+print/i.test(c)).length >= 2 },
        { t: 'ดึง config ออกมาตรวจทาน', hint: '/export', check: (s, h) => said(h, /^\/?export/i) },
      ],
    },
  ],

  // ================= LEVEL 4 =================
  4: [
    {
      id: 'ms4-mirror',
      title: 'Lab 4B — Bonding ไป Core และ Mirror Port',
      brief: 'อัปลิงก์ต้องเพิ่มเป็น 2 เส้นด้วย LACP และทีม security ขอ mirror traffic ของพอร์ตเซิร์ฟเวอร์ไปเข้าเครื่องวิเคราะห์',
      device: 'mikrotik-sw',
      tasks: [
        { t: 'สร้าง bonding <code>bond1</code> จาก <code>ether7,ether8</code> mode <code>802.3ad</code>', hint: '/interface bonding add name=bond1 slaves=ether7,ether8 mode=802.3ad', check: s => has(s, 'interface bonding', r => r.name === 'bond1' && r.mode === '802.3ad') },
        { t: 'ตั้ง <code>lacp-rate=1sec</code> ที่ bond1', hint: '/interface bonding set [find name=bond1] lacp-rate=1sec', check: s => has(s, 'interface bonding', r => r.name === 'bond1' && r['lacp-rate'] === '1sec') },
        { t: 'ตั้ง <code>transmit-hash-policy=layer-2-and-3</code>', hint: '/interface bonding set [find name=bond1] transmit-hash-policy=layer-2-and-3', check: s => has(s, 'interface bonding', r => r.name === 'bond1' && /layer-2-and-3/.test(r['transmit-hash-policy'] || '')) },
        { t: 'สร้าง bridge <code>bridge1</code>', hint: '/interface bridge add name=bridge1', check: s => has(s, 'interface bridge', r => r.name === 'bridge1') },
        { t: 'เพิ่ม <code>bond1</code> เข้า bridge1', hint: '/interface bridge port add bridge=bridge1 interface=bond1', check: s => has(s, 'interface bridge port', r => r.interface === 'bond1') },
        { t: 'เพิ่ม <code>ether2</code> (พอร์ตเซิร์ฟเวอร์) เข้า bridge1', hint: '/interface bridge port add bridge=bridge1 interface=ether2', check: s => has(s, 'interface bridge port', r => r.interface === 'ether2') },
        {
          t: 'ตั้ง mirror: source <code>ether2</code> ไปออกที่ <code>ether6</code>',
          hint: '/interface ethernet switch set switch1 mirror-source=ether2 mirror-target=ether6',
          check: s => s.settings['interface ethernet switch']['mirror-source'] === 'ether2' && s.settings['interface ethernet switch']['mirror-target'] === 'ether6'
        },
        { t: 'ตรวจสอบสถานะ bonding', hint: '/interface bonding print', check: (s, h) => said(h, /interface\s+bonding\s+print/i) },
      ],
    },
    {
      id: 'ms4-hotel',
      title: 'Lab 4C — สวิตช์หอพัก: แยกทุกห้องออกจากกัน',
      brief: 'หอพัก 6 ห้องต่อสวิตช์ตัวเดียว ทุกห้องต้องออกเน็ตได้แต่ห้ามคุยกันเอง เพื่อกันการโจมตีระหว่างผู้เช่า',
      device: 'mikrotik-sw',
      tasks: [
        { t: 'สร้าง bridge <code>bridge1</code>', hint: '/interface bridge add name=bridge1', check: s => has(s, 'interface bridge', r => r.name === 'bridge1') },
        { t: 'เพิ่ม <code>ether1</code> เป็น uplink (ไม่ตั้ง horizon)', hint: '/interface bridge port add bridge=bridge1 interface=ether1', check: s => has(s, 'interface bridge port', r => r.interface === 'ether1') },
        {
          t: 'เพิ่มพอร์ตห้องพัก <code>ether2</code> ถึง <code>ether7</code> เข้า bridge1',
          hint: '/interface bridge port add bridge=bridge1 interface=ether2 → /interface bridge port add bridge=bridge1 interface=ether3 → /interface bridge port add bridge=bridge1 interface=ether4 → /interface bridge port add bridge=bridge1 interface=ether5 → /interface bridge port add bridge=bridge1 interface=ether6 → /interface bridge port add bridge=bridge1 interface=ether7',
          check: s => ['ether2', 'ether3', 'ether4', 'ether5', 'ether6', 'ether7'].every(i => has(s, 'interface bridge port', r => r.interface === i))
        },
        {
          t: 'ตั้ง <code>horizon=1</code> ให้ <code>ether2</code> และ <code>ether3</code>',
          hint: '/interface bridge port set [find interface=ether2] horizon=1 → /interface bridge port set [find interface=ether3] horizon=1',
          check: s => ['ether2', 'ether3'].every(i => has(s, 'interface bridge port', r => r.interface === i && String(r.horizon) === '1'))
        },
        {
          t: 'ตั้ง <code>horizon=1</code> ให้ <code>ether4</code> และ <code>ether5</code>',
          hint: '/interface bridge port set [find interface=ether4] horizon=1 → /interface bridge port set [find interface=ether5] horizon=1',
          check: s => ['ether4', 'ether5'].every(i => has(s, 'interface bridge port', r => r.interface === i && String(r.horizon) === '1'))
        },
        {
          t: 'ตั้ง <code>horizon=1</code> ให้ <code>ether6</code> และ <code>ether7</code>',
          hint: '/interface bridge port set [find interface=ether6] horizon=1 → /interface bridge port set [find interface=ether7] horizon=1',
          check: s => ['ether6', 'ether7'].every(i => has(s, 'interface bridge port', r => r.interface === i && String(r.horizon) === '1'))
        },
        {
          t: 'เปิด <code>bpdu-guard</code> ที่ <code>ether2</code> กันผู้เช่าเอา switch มาเสียบ',
          hint: '/interface bridge port set [find interface=ether2] bpdu-guard=yes',
          check: s => has(s, 'interface bridge port', r => r.interface === 'ether2' && r['bpdu-guard'] === 'yes')
        },
        { t: 'ตรวจสอบผลด้วย print', hint: '/interface bridge port print', check: (s, h) => said(h, /bridge\s+port\s+print/i) },
      ],
    },
  ],

  // ================= LEVEL 5 =================
  5: [
    {
      id: 'ms5-harden',
      title: 'Lab 5B — Hardening สวิตช์ตามมาตรฐานองค์กร',
      brief: 'ผลการตรวจสอบความปลอดภัยพบว่าสวิตช์เปิด service ที่ไม่ปลอดภัยและเข้าถึงได้จากทุกวง ต้องปิดให้หมดและจำกัดการเข้าถึงเฉพาะวง management',
      device: 'mikrotik-sw',
      tasks: [
        { t: 'ตั้งชื่ออุปกรณ์เป็น <code>SW-CORE-SEC</code>', hint: '/system identity set name=SW-CORE-SEC', check: s => s.settings['system identity'].name === 'SW-CORE-SEC' },
        { t: 'สร้าง user <code>swadmin</code> group <code>full</code>', hint: '/user add name=swadmin group=full', check: s => has(s, 'user', r => r.name === 'swadmin') },
        { t: 'ปิด service <code>telnet</code>', hint: '/ip service set [find name=telnet] disabled=yes', check: s => has(s, 'ip service', r => r.name === 'telnet' && (r.disabled === true || r.disabled === 'yes')) },
        { t: 'ปิด service <code>ftp</code>', hint: '/ip service set [find name=ftp] disabled=yes', check: s => has(s, 'ip service', r => r.name === 'ftp' && (r.disabled === true || r.disabled === 'yes')) },
        { t: 'ปิด service <code>api</code>', hint: '/ip service set [find name=api] disabled=yes', check: s => has(s, 'ip service', r => r.name === 'api' && (r.disabled === true || r.disabled === 'yes')) },
        { t: 'จำกัด <code>winbox</code> ให้เข้าได้เฉพาะ <code>10.10.99.0/24</code>', hint: '/ip service set [find name=winbox] address=10.10.99.0/24', check: s => has(s, 'ip service', r => r.name === 'winbox' && String(r.address).includes('10.10.99.0/24')) },
        { t: 'สร้าง interface list <code>MGMT</code>', hint: '/interface list add name=MGMT', check: s => has(s, 'interface list', r => r.name === 'MGMT') },
        { t: 'จำกัด MAC-server ให้ทำงานเฉพาะ list <code>MGMT</code>', hint: '/tool mac-server set allowed-interface-list=MGMT', check: s => s.settings['tool mac-server']['allowed-interface-list'] === 'MGMT' },
        { t: 'จำกัด MAC-WinBox ให้ทำงานเฉพาะ list <code>MGMT</code>', hint: '/tool mac-server mac-winbox set allowed-interface-list=MGMT', check: s => s.settings['tool mac-server mac-winbox']['allowed-interface-list'] === 'MGMT' },
        { t: 'จำกัด neighbor discovery เฉพาะ list <code>MGMT</code>', hint: '/ip neighbor discovery-settings set discover-interface-list=MGMT', check: s => s.settings['ip neighbor discovery-settings']['discover-interface-list'] === 'MGMT' },
        { t: 'ตั้งข้อความเตือนตอน login', hint: '/system note set show-at-login=yes note="Authorized personnel only"', check: s => s.settings['system note']['show-at-login'] === 'yes' && s.settings['system note'].note.length > 3 },
      ],
    },
    {
      id: 'ms5-monitor',
      title: 'Lab 5C — ต่อสวิตช์เข้าระบบเฝ้าระวัง',
      brief: 'สวิตช์ทุกตัวต้องส่ง log และ metric เข้าระบบกลาง มี netwatch เฝ้า gateway และมี backup อัตโนมัติทุกวัน',
      device: 'mikrotik-sw',
      tasks: [
        { t: 'เปิด SNMP', hint: '/snmp set enabled=yes', check: s => s.settings['snmp'].enabled === 'yes' },
        { t: 'ตั้ง SNMP location เป็น <code>BKK-HQ-FL2</code>', hint: '/snmp set location=BKK-HQ-FL2', check: s => s.settings['snmp'].location === 'BKK-HQ-FL2' },
        { t: 'สร้าง SNMP community <code>swmonitor</code> จำกัดที่ <code>10.10.10.0/24</code>', hint: '/snmp community add name=swmonitor addresses=10.10.10.0/24', check: s => has(s, 'snmp community', r => r.name === 'swmonitor' && r.addresses === '10.10.10.0/24') },
        { t: 'สร้าง logging action <code>syslog-central</code> ส่งไปที่ <code>10.10.10.60</code>', hint: '/system logging action add name=syslog-central target=remote remote=10.10.10.60', check: s => has(s, 'system logging action', r => r.name === 'syslog-central' && r.remote === '10.10.10.60') },
        { t: 'ส่ง log topic <code>warning</code> ไปยัง action นั้น', hint: '/system logging add topics=warning action=syslog-central', check: s => has(s, 'system logging', r => r.action === 'syslog-central') },
        { t: 'ตั้ง NTP client sync กับ <code>203.159.72.1</code>', hint: '/system ntp client set enabled=yes servers=203.159.72.1', check: s => s.settings['system ntp client'].enabled === 'yes' },
        { t: 'ตั้ง time zone เป็น <code>Asia/Bangkok</code>', hint: '/system clock set time-zone-name=Asia/Bangkok', check: s => s.settings['system clock']['time-zone-name'] === 'Asia/Bangkok' },
        { t: 'ตั้ง netwatch เฝ้า gateway <code>10.10.99.1</code>', hint: '/tool netwatch add host=10.10.99.1', check: s => has(s, 'tool netwatch', r => r.host === '10.10.99.1') },
        { t: 'สร้าง scheduler <code>nightly-export</code> ทุก <code>1d</code>', hint: '/system scheduler add name=nightly-export interval=1d on-event="/export file=nightly"', check: s => has(s, 'system scheduler', r => r.name === 'nightly-export' && String(r.interval) === '1d') },
        { t: 'ตรวจสอบ config ทั้งหมด', hint: '/export', check: (s, h) => said(h, /^\/?export/i) },
      ],
    },
  ],
};
