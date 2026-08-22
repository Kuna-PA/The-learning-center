// ============================================================
//  Learning Path: Cisco — จัดตามขอบเขต CCNA 200-301 ทั้ง 6 domain
//
//  เนื้อหาแบ่งเป็นไฟล์ย่อยใน ./cisco/ เพื่อให้แก้ทีละหัวข้อได้
//    legacy.js  เนื้อหาชุดเดิม (สวิตช์ L2 เชิงลึก) — ยังเป็นแกนของ domain 2 และ 5
//    l1 / l3 / l4 / l5 / l6  เนื้อหาที่เขียนเพิ่มให้ครบตาม blueprint
//
//  การจับคู่ระดับ ↔ domain เป็นแบบ 1:1
//    L1 Network Fundamentals · L2 Network Access · L3 IP Connectivity
//    L4 IP Services · L5 Security Fundamentals · L6 Automation
// ============================================================
import legacy from './cisco/legacy.js';
import l1 from './cisco/l1.js';
import l3 from './cisco/l3.js';
import l4 from './cisco/l4.js';
import l5 from './cisco/l5.js';
import l6 from './cisco/l6.js';

const old = legacy.levels;
const labsOf = (lv, ids) => (old[lv].labs || []).filter(l => ids.includes(l.id));

/** รวมหลายระดับของเนื้อหาเดิมเข้าด้วยกัน โดยคง lab id เดิมไว้ทั้งหมด */
const merge = (title, objectives, parts, extra = {}) => ({
  title,
  objectives,
  sections: [...parts.flatMap(p => p.sections || []), ...(extra.sections || [])],
  quiz: [...parts.flatMap(p => p.quiz || []), ...(extra.quiz || [])],
  labs: [...parts.flatMap(p => p.labs || []), ...(extra.labs || [])],
});

export default {
  id: 'cisco-switch',
  name: 'Cisco CCNA',
  icon: '🔀',
  device: 'cisco',
  sub: 'CCNA 200-301 · Catalyst / IOS CLI',
  desc: 'เส้นทางเรียน Cisco ตามขอบเขต CCNA 200-301 ครบทั้ง 6 domain — จากพื้นฐานเครือข่ายและ OSI, การต่อ LAN ด้วย VLAN/STP, การ route ด้วย static และ OSPF, บริการอย่าง DHCP/NAT/DNS, ความปลอดภัยและ ACL ไปจนถึงการทำ automation',

  levels: {
    // ---------- Domain 1: Network Fundamentals ----------
    1: {
      ...l1,
      labs: [...labsOf(1, ['l1-basic']), ...l1.labs],
    },

    // ---------- Domain 2: Network Access ----------
    // แกนหลักมาจากเนื้อหาเดิมเรื่อง VLAN/Trunk (เดิม L2) และ STP/EtherChannel (เดิม L3)
    2: merge(
      'Network Access — สวิตช์, VLAN, Trunk, STP และ Wireless',
      [
        'อธิบายการทำงานของ switch: learning, forwarding, flooding',
        'สร้าง VLAN, ตั้ง access port และ trunk 802.1Q ได้',
        'อธิบายหน้าที่ของ STP และบังคับ root bridge ได้',
        'รวมลิงก์ด้วย EtherChannel ให้ได้ทั้งความเร็วและความทนทาน',
        'อธิบายองค์ประกอบพื้นฐานของ Wireless LAN (AP, SSID, WPA2)',
      ],
      [
        { sections: old[1].sections, quiz: old[1].quiz, labs: labsOf(1, ['c1-health', 'c1-ports']) },
        { sections: old[2].sections, quiz: old[2].quiz, labs: old[2].labs },
        { sections: old[3].sections, quiz: old[3].quiz, labs: labsOf(3, ['l3-stp-po', 'c3-po-trunk']) },
      ],
      {
        sections: [{
          t: 'Wireless LAN เบื้องต้น',
          h: `
<p>Access Point ทำหน้าที่แปลงระหว่างคลื่นวิทยุกับสาย — ในมุมของสวิตช์ AP ก็คืออุปกรณ์ที่เสียบพอร์ตหนึ่งพอร์ต
ถ้า AP กระจายหลาย SSID ที่แยก VLAN กัน พอร์ตนั้นต้องเป็น <b>trunk</b></p>
<table class="tbl">
<tr><th>คำศัพท์</th><th>ความหมาย</th></tr>
<tr><td><b>SSID</b></td><td>ชื่อเครือข่ายที่ผู้ใช้เห็น — มักผูกกับ VLAN หนึ่งวง เช่น SSID "CORP" → VLAN 10, "GUEST" → VLAN 99</td></tr>
<tr><td><b>Channel</b></td><td>ช่องสัญญาณ — 2.4GHz ควรใช้เฉพาะ 1, 6, 11 ที่ไม่ทับกัน ส่วน 5GHz มีช่องให้เลือกเยอะกว่ามาก</td></tr>
<tr><td><b>Autonomous AP</b></td><td>AP ที่ตั้งค่าเองทีละตัว เหมาะกับที่เล็ก ๆ</td></tr>
<tr><td><b>Lightweight AP + WLC</b></td><td>AP ถูกควบคุมจาก Wireless LAN Controller ส่วนกลาง — มาตรฐานขององค์กรใหญ่</td></tr>
</table>
<table class="tbl">
<tr><th>การเข้ารหัส</th><th>สถานะ</th></tr>
<tr><td>WEP</td><td>แตกได้ในไม่กี่นาที — ห้ามใช้</td></tr>
<tr><td>WPA2-PSK</td><td>ใช้รหัสร่วมกัน เหมาะกับบ้านและวง guest</td></tr>
<tr><td>WPA2-Enterprise (802.1X)</td><td>ผู้ใช้ล็อกอินด้วยบัญชีตัวเอง เพิกถอนรายคนได้ — มาตรฐานองค์กร</td></tr>
<tr><td>WPA3</td><td>รุ่นใหม่ที่สุด ทนการเดารหัสแบบออฟไลน์ได้ดีกว่า</td></tr>
</table>
<div class="note"><b>เคสที่เจอบ่อย:</b> ผู้ใช้ Wi-Fi ได้ IP ผิดวง — เกือบทุกครั้งเกิดจากพอร์ตที่เสียบ AP
ถูกตั้งเป็น access port หรือ native VLAN ของ trunk ไม่ตรงกับที่ AP คาดไว้</div>`,
        }],
        quiz: [
          { type: 'mcq', q: 'AP ที่กระจาย 3 SSID แยก VLAN กัน ควรเสียบเข้าพอร์ตสวิตช์แบบใด?', opts: ['Access port', 'Trunk port', 'Routed port', 'พอร์ตที่ shutdown ไว้'], a: 1, why: 'หลาย VLAN วิ่งบนสายเส้นเดียวต้องใช้ trunk ที่ติด tag 802.1Q — access port ส่งได้ VLAN เดียว' },
          { type: 'mcq', q: 'ย่าน 2.4GHz ควรใช้ช่องสัญญาณใดเพื่อไม่ให้ทับซ้อนกัน?', opts: ['1, 2, 3', '1, 6, 11', '2, 4, 8', 'ช่องไหนก็ได้'], a: 1, why: '2.4GHz มีเพียง 1, 6, 11 ที่ไม่ทับกัน — วาง AP ข้างกันด้วยช่องเดียวกันจะกวนกันเองจนช้า' },
        ],
      },
    ),

    // ---------- Domain 3: IP Connectivity ----------
    // เนื้อหาใหม่เรื่อง routing/OSPF + lab เดิมเรื่อง Inter-VLAN Routing
    3: {
      ...l3,
      labs: [...l3.labs, ...labsOf(4, ['l4-l3switch'])],
    },

    // ---------- Domain 4: IP Services ----------
    // เนื้อหาใหม่ + lab เดิมเรื่อง HSRP และ Monitoring/NTP ที่เข้ากับ domain นี้พอดี
    4: {
      ...l4,
      labs: [...l4.labs, ...labsOf(5, ['c5-hsrp', 'c5-monitor']), ...labsOf(4, ['c4-span'])],
    },

    // ---------- Domain 5: Security Fundamentals ----------
    // เนื้อหาใหม่เรื่อง CIA/ACL/VPN + ของเดิมเรื่อง hardening และ lab ความปลอดภัย
    5: merge(
      l5.title,
      l5.objectives,
      [{ sections: l5.sections, quiz: l5.quiz, labs: l5.labs }],
      {
        sections: old[5].sections,
        quiz: old[5].quiz,
        labs: [
          ...labsOf(3, ['c3-psec']),
          ...labsOf(4, ['c4-snoop']),
          ...labsOf(5, ['l5-hardening']),
        ],
      },
    ),

    // ---------- Domain 6: Automation and Programmability ----------
    6: l6,
  },
};
