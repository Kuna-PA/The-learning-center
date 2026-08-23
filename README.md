# IT / SysEng Learning Center

เว็บแอปฝึกและทดสอบความรู้สำหรับ **IT Support / System Engineer / Network Engineer / Security**
ธีมและรูปแบบการใช้งานได้แรงบันดาลใจจาก TryHackMe — มี Learning Path, Room, ระดับความยาก,
XP/Rank, Lab ที่มี **command prompt จำลอง** และใบประกาศนียบัตรเมื่อเรียนจบ

---

## วิธีรัน

ไม่ต้องติดตั้งอะไรเลย (ไม่มี dependency, ไม่ต้อง build) ต้องใช้ **Node 22.5 ขึ้นไป**
เพราะใช้ `node:sqlite` ที่ติดมากับ Node เอง

```bash
npm start
```

แล้วเปิด <http://localhost:5173>

**ล็อกอินครั้งแรก:** เซิร์ฟเวอร์จะสร้างบัญชี `admin` ให้อัตโนมัติ พร้อม**สุ่มรหัสผ่านให้**
แล้วพิมพ์ออกมาที่ console **ครั้งเดียว** — เซิร์ฟเวอร์จะไม่ให้ทำอะไรเลยจนกว่าจะตั้งรหัสใหม่

ตั้งรหัสเองได้ด้วยตัวแปรแวดล้อม (ต้องยาว 8 ตัวขึ้นไป ไม่งั้นจะสุ่มให้แทน):

```bash
LC_ADMIN_PASSWORD='รหัสที่ต้องการ' npm start
```

| ตัวแปร | ค่าเริ่มต้น | ใช้ทำอะไร |
|---|---|---|
| `PORT` | 5173 | พอร์ตที่เปิดฟัง |
| `LC_DATA_DIR` | `./data-db` | ที่เก็บไฟล์ฐานข้อมูล |
| `LC_ADMIN_PASSWORD` | สุ่มให้ | รหัสของ admin ตอนสร้างครั้งแรกเท่านั้น · สั้นกว่า 8 ตัวจะถูกมองข้ามแล้วสุ่มให้ |
| `LC_OPEN_REGISTER` | `1` | เปิดให้คนนอกกดสมัครเองได้ · ตั้ง `0` เมื่อเอาขึ้นอินเทอร์เน็ต แล้วให้ admin เป็นคนสร้างบัญชี |
| `LC_SECURE_COOKIE` | ตรวจเอง | `1` = บังคับติด `Secure` ที่คุกกี้ (ใช้เมื่อ proxy ไม่ส่ง `X-Forwarded-Proto`) · `0` = ปิด |
| `LC_TRUST_PROXY` | `0` | `1` = เชื่อ `X-Forwarded-For` ตอนนับการเดารหัส — เปิดเฉพาะเมื่อมี reverse proxy จริง |

> ต้องรันผ่าน server เพราะเว็บใช้ ES Modules — เปิด `index.html` ด้วย `file://` จะไม่ทำงาน

**ก่อน commit ทุกครั้ง:**

```bash
npm test
```

รันชุดทดสอบทั้งหมด (~200 เคส ใช้เวลาไม่ถึง 3 วินาที) — รายละเอียดอยู่หัวข้อ [ชุดทดสอบ](#-ชุดทดสอบ)

---

## ภาพรวมเนื้อหา

| | จำนวน |
|---|---|
| Learning Path (หัวข้อ) | **7** |
| ระดับต่อหัวข้อ | **5** (Novice → Expert) · **Cisco CCNA** และ **Linux** มี **6** ระดับ |
| ข้อสอบ | **1,017 ข้อ** (38 ชุด) |
| Lab ปกติ | **143 ชุด / 1,360 ขั้นตอน** (ในนั้นเป็น Lab หน้าจอ GUI 14 ชุด) |
| Lab หมวดเอาชีวิตรอด | **29 เหตุการณ์ / 303 ขั้นตอน** (4 ระดับความยาก) |
| อุปกรณ์จำลอง | **7 แบบ** (รวมหน้าจอ GUI ของ Windows) |

> ตัวเลขในตารางนี้ดึงของจริงมาตรวจได้ด้วย `npm run validate` — ถ้าเนื้อหาเปลี่ยนแล้วลืมแก้ README จะเห็นทันที

### 7 Learning Paths

| หัวข้อ | ครอบคลุม |
|---|---|
| 🌐 **Network** | พื้นฐานเครือข่ายที่ไม่ผูกกับยี่ห้อ ตามหลักสูตร CompTIA Network+ (N10-008) |
| 🔀 **Cisco CCNA** | จัดตามขอบเขต **CCNA 200-301 ครบ 6 domain** — Network Fundamentals → Network Access → IP Connectivity → IP Services → Security Fundamentals → Automation |
| 📡 **MikroTik Router** | เมนู RouterOS → WAN/NAT/DHCP/DNS → Firewall/Bridge/VLAN → Routing/QoS/WireGuard/OSPF → VRRP, BGP, hardening, scripting |
| 🧩 **MikroTik Switch** | CRS/CSS & switch chip → Bridge/RSTP → VLAN filtering → Bonding/Port isolation/HW offload → ออกแบบ L2 และ operations |
| 🪟 **Windows Server** | PowerShell & Roles → AD/DNS/DHCP → GPO/File Server/Backup → Hyper-V/Cluster/Security → AD design, Tiered admin, DR |
| 🐧 **Linux** | ติดตั้ง/โครงสร้างไฟล์/แก้ไฟล์ข้อความ → ผู้ใช้/กลุ่ม/สิทธิ์ → แพ็กเกจ/service/kernel → storage และ container → เครือข่าย/firewall/security → script และ Infrastructure as Code |
| 🛡️ **Cyber Security** | CIA Triad/ภัยคุกคาม → Hardening/Attack Surface → ตรวจจับการบุกรุก/MITRE ATT&CK → Incident Response/Forensics → Zero Trust, SOC/SIEM, ISO 27001/PDPA |

### 5 ระดับความรู้ (Dreyfus)

| ระดับ | ชื่อ | ความยาก |
|---|---|---|
| 1 | Novice — ทำตามขั้นตอนได้ | EASY |
| 2 | Advanced Beginner — จับ pattern จากงานจริง | EASY |
| 3 | Competent — วางแผนและแก้ปัญหาเองได้ | MEDIUM |
| 4 | Proficient — เห็นภาพรวม จับผิดปกติได้เร็ว | HARD |
| 5 | Expert — ออกแบบระบบและวางมาตรฐาน | INSANE |

การปลดล็อกระดับถัดไปต้องครบ **สองอย่าง** ของระดับก่อนหน้า:

1. ทำแบบทดสอบได้ **70% ขึ้นไป**
2. ทำ **Lab ของระดับนั้นให้ครบทุกชุด**

สอบผ่านอย่างเดียวแต่ไม่เคยลงมือทำ ยังข้ามระดับไม่ได้ — หน้าระดับที่ล็อกจะบอกว่าเหลืออะไรบ้าง เช่น "ทำ Lab ระดับ 1 ให้ครบ (เหลือ 2/3 ชุด)"
(ข้ามได้ด้วย "ปลดล็อกทุกระดับ" ที่หน้าความคืบหน้า — แต่ใบประกาศยังต้องผ่านของจริง)

**บัญชี admin เข้าได้ทุกระดับทุกเมนูอยู่แล้ว** ไม่ต้องติ๊กอะไร — คนดูแลเนื้อหาต้องตรวจ Lab ได้ทุกระดับโดยไม่ต้องไล่สอบก่อน

สำหรับ user ทั่วไป ระดับที่ยังล็อกอยู่ยัง **เปิดเข้าไปดูรายการ Lab ได้** (กดเข้าทำไม่ได้) —
หน้า Learning Path กับหน้า "Lab ทั้งหมด" จึงแสดง Lab ชุดเดียวกันเสมอ

---

## 🔥 หมวด "เอาชีวิตรอด" — 29 เหตุการณ์

เหตุการณ์ฉุกเฉินที่เกิดขึ้นจริงหน้างาน — **ไม่มีคู่มือทีละขั้น มีแต่อาการ ความกดดัน และเวลา**
แต่ละเหตุการณ์มี **ระดับความยาก · ระดับความรุนแรง · ผู้แจ้ง · เวลาเป้าหมาย · ผลกระทบ**
และมี **debrief สรุปบทเรียน** ให้อ่านเมื่อแก้ได้สำเร็จ

หน้ารายการกรองได้ 3 แกน: ความยาก / ระบบ / สถานะ และจัดกลุ่มตามความยาก

### 🟢 ง่าย (7)

| เหตุการณ์ | ระบบ | สิ่งที่ได้ฝึก |
|---|---|---|
| 🌙 ตี 3 — เว็บบริษัทล่ม | Linux | service ที่ไม่ได้ `enable` |
| 💾 ดิสก์เต็ม เขียนไฟล์ไม่ได้ | Linux | LVM extend + `resize2fs` |
| 📜 Log กินดิสก์จนเขียนไฟล์ไม่ได้ | Linux | logrotate, `df -i` |
| 🖨️ เครื่องพิมพ์ทั้งออฟฟิศพิมพ์ไม่ออก | Windows GUI | Print Spooler + Startup Type |
| 🐢 เว็บเดียวเข้าไม่ได้ เว็บอื่นปกติ | Windows | DNS cache, `/displaydns`, `/flushdns` |
| 📶 โน้ตบุ๊กเข้า Wi-Fi ไม่ได้หลังเปลี่ยนรหัส | Windows | `netsh wlan delete profile` |
| 🗑️ ผู้ใช้ลบโฟลเดอร์สำคัญบน File Server | Windows GUI | Shadow Copies, สิทธิ์ NTFS |

### 🟡 ปานกลาง (11)

| เหตุการณ์ | ระบบ | สิ่งที่ได้ฝึก |
|---|---|---|
| 🏢 ทั้งชั้น 3 ใช้เน็ตไม่ได้ | Cisco | ไล่ปัญหา L1→L2→L3, trunk/VLAN |
| 🔌 สาขาหลุด — เน็ตเส้นหลักตาย | MikroTik | dual WAN failover, `check-gateway` |
| 🔁 เน็ตวนลูป ทั้งวงล่ม | MikroTik Switch | broadcast storm, RSTP, bpdu-guard |
| 🎣 พนักงานกรอกรหัสให้ phishing | Windows | account compromise response |
| ⚔️ IP ชนกัน — เข้าได้บ้างไม่ได้บ้าง | Windows | `arp -a`, `getmac`, DHCP reservation |
| 🎟️ DHCP หมด pool — คนมาใหม่ไม่ได้ IP | MikroTik | ขนาด pool, lease-time |
| 🔐 Certificate หมดอายุ เว็บขึ้นเตือนสีแดง | Linux | `openssl x509`, เวลาเครื่อง, ACME |
| 🔥 เซิร์ฟเวอร์ CPU 100% ทั้งวัน | Linux | แยก I/O wait vs crypto miner |
| 🔒 บัญชีผู้บริหารถูกล็อกซ้ำทุก 15 นาที | Windows GUI | Event 4740, หาต้นตอที่จำรหัสเก่า |
| 📧 อีเมลส่งออกไม่ได้ — ติด Blacklist | Linux Security | หาต้นตอสแปม, SPF/DKIM/DMARC |
| 💿 Backup ล้มเหลว 3 สัปดาห์ ไม่มีใครรู้ | Linux | alert ที่ส่งไปหาคนที่ลาออกแล้ว |

### 🟠 ยาก (7)

| เหตุการณ์ | ระบบ | สิ่งที่ได้ฝึก |
|---|---|---|
| 🦠 Ransomware กำลังแพร่ | Linux Security | containment, เก็บหลักฐาน, IOC |
| 🔑 ล็อกอินไม่ได้ทั้งบริษัท | Windows | DC ที่ DNS ชี้ผิด |
| 🕵️ พบบัญชีแปลกปลอมใน AD | Windows | persistence, krbtgt reset |
| 🌏 พนักงาน WFH เข้า VPN ไม่ได้ทั้งบริษัท | MikroTik | config หายหลังอัปเกรด firmware |
| 🌊 Traffic ผิดปกติถล่มเข้ามา | MikroTik | DNS amplification, `chain=raw` |
| 💀 เซิร์ฟเวอร์บูตไม่ขึ้นหลัง Windows Update | Windows | Safe Mode, ไล่ไดรเวอร์/service |
| 🧱 Switch Stack ตัวหลักดับกลางวัน | Cisco | config ที่ไม่ได้ `write memory` |

### 🔴 โหด (4)

| เหตุการณ์ | ระบบ | สิ่งที่ได้ฝึก |
|---|---|---|
| ⚡ Core Switch ดับ ต้องสลับตัวสำรอง | Cisco | HSRP + STP root ที่ไม่ได้เตรียมไว้ |
| 🕸️ ผู้โจมตีเคลื่อนที่อยู่ในเครือข่ายแล้ว | Linux Security | lateral movement, ตัดพร้อมกันทีเดียว |
| ⚡ ไฟดับทั้งห้อง Server — UPS เหลือ 20 นาที | Linux | ลำดับ graceful shutdown |
| 🌪️ สองเหตุพร้อมกัน — เน็ตล่มและ AD ล่ม | Windows GUI | อย่าสมมติว่ามีปัญหาเดียว |


---

## 🔀 หัวข้อ Cisco — จัดตามขอบเขต CCNA 200-301

หัวข้อนี้แบ่งเป็น **6 ระดับ ตรงกับ 6 domain ของข้อสอบแบบ 1:1** (หัวข้ออื่นยังเป็น 5 ระดับตามโมเดล Dreyfus)

| ระดับ | Domain | เนื้อหา | Lab |
|---|---|---|---|
| 1 | Network Fundamentals | OSI/TCP-IP, TCP vs UDP, IP & Subnetting, อุปกรณ์, Topology, คำสั่งตรวจเครือข่าย | 4 |
| 2 | Network Access | การทำงานของ switch, VLAN, Trunk 802.1Q, STP, EtherChannel, Wireless (AP/SSID/WPA2) | 6 |
| 3 | IP Connectivity | อ่าน routing table, AD, static & default route, OSPF single-area | 3 |
| 4 | IP Services | DHCP (DORA + relay), NAT/PAT, NTP, DNS, SNMP/Syslog, FHRP (HSRP) | 5 |
| 5 | Security Fundamentals | CIA, ภัยคุกคาม, ACL standard/extended, Port Security, DHCP Snooping, Firewall/VPN, Hardening | 4 |
| 6 | Automation | ทำไมต้อง automation, JSON & REST API, NETCONF/RESTCONF, SDN, DNA Center, config เป็นแม่แบบ | 2 |

**โครงไฟล์** — แยกเนื้อหาเป็นไฟล์ย่อยเพื่อให้แก้ทีละ domain ได้

```
data/tracks/cisco-switch.js    ตัวประกอบ 6 ระดับเข้าด้วยกัน
data/tracks/cisco/
  legacy.js   เนื้อหาชุดเดิม (สวิตช์ L2 เชิงลึก) — เป็นแกนของ domain 2 และ 5
  l1.js l3.js l4.js l5.js l6.js   เนื้อหาที่เขียนเพิ่มให้ครบตาม blueprint
```

Lab เดิมทุกชุดถูกคง **id เดิม** ไว้ทั้งหมด เพียงย้ายไปอยู่ domain ที่ตรงเนื้อหา — ความคืบหน้าของผู้เรียนจึงไม่หาย


---

## 🐧 หัวข้อ Linux — 6 ระดับตามลำดับที่ควรเรียน

| ระดับ | เนื้อหา | Lab |
|---|---|---|
| 1 | Introducing Linux · Installing Linux · File Management · **Authoring Text Files** | 5 |
| 2 | Administering Users and Groups · Configuring Permissions | 2 |
| 3 | Managing Software · Managing Services · **Devices, Processes, Memory, Kernel** | 3 |
| 4 | Administering Storage (สร้าง PV/VG/LV เองได้) · Managing Containers | 3 |
| 5 | Configuring Network Settings · Network Security · Managing Linux Security | 4 |
| 6 | **Implementing Simple Scripts** · **Using Infrastructure as Code** | 3 |

```
data/tracks/linux.js         ตัวประกอบ 6 ระดับเข้าด้วยกัน
data/tracks/linux/
  legacy.js   เนื้อหาชุดเดิม (5 ระดับ) — ยังเป็นแกนของเกือบทุกระดับ
  extra.js    เนื้อหาและ Lab ที่เขียนเพิ่ม
```

**คำสั่งที่เพิ่มเข้า emulator เพื่อรองรับหัวข้อใหม่:** `sed` (s///, -i, Np/Nd) · `tee` ·
รันสคริปต์จริงด้วย `bash x.sh` / `./x.sh` (เช็คสิทธิ์ execute เหมือนของจริง) ·
`ansible` / `ansible-playbook` ที่อ่าน YAML จริงแล้วรายงาน PLAY RECAP ตามจำนวน task ·
`vgcreate` / `lvcreate` / `mkfs.ext4|xfs`

---

## 🖱️ Lab แบบหน้าจอ GUI ของ Windows

นอกจาก PowerShell แล้ว หัวข้อ Windows Server ยังมี **Lab ที่เป็นหน้าจอ GUI จำลอง** —
เดสก์ท็อป Windows Server ที่มีไอคอน แถบงาน ปุ่ม Start และหน้าต่างที่ลาก ย่อ ปิดได้จริง

**โปรแกรมที่จำลองไว้ 15 ตัว:**

| โปรแกรม | ทำอะไรได้ |
|---|---|
| Network Connections (`ncpa.cpl`) | ตั้ง IP/Subnet/Gateway/DNS ผ่านหน้าต่าง TCP/IPv4 Properties · Enable/Disable การ์ด |
| Services (`services.msc`) | Start / Stop / Restart · เปลี่ยน Startup Type |
| Task Manager | ดู process พร้อม CPU/RAM · End task |
| Local Users and Groups | สร้าง user · เพิ่มสมาชิกเข้ากลุ่ม |
| Active Directory Users and Computers | สร้าง OU / user / group · เพิ่มสมาชิก · ย้ายผู้ใช้เข้า OU · รีเซ็ตรหัสผ่าน · Enable/Disable บัญชี |
| Server Manager | Add Roles and Features wizard · Promote to Domain Controller |
| DNS Manager (`dnsmgmt.msc`) | สร้าง Forward / Reverse zone · เพิ่ม–ลบ A / CNAME / MX / TXT / PTR · ตั้ง Forwarder |
| Group Policy Management (`gpmc.msc`) | สร้าง GPO · แก้ 9 นโยบาย (รหัสผ่าน, lockout, ล็อกหน้าจอ, USB, audit, drive map) · Link กับ Domain/OU · Enforced · gpupdate |
| DHCP (`dhcpmgmt.msc`) | Authorize ใน AD · สร้าง scope · Scope option 003/006 · Reservation |
| Task Scheduler (`taskschd.msc`) | สร้างงานตามเวลา · Run / Enable / Disable |
| File Explorer | สร้างโฟลเดอร์ · Properties → แท็บ Sharing / Security |
| Firewall with Advanced Security | สร้าง inbound rule (Allow/Block + พอร์ต) |
| Event Viewer | ดู Security log พร้อมคำอธิบาย Event ID |
| System Properties | เปลี่ยนชื่อเครื่อง · เข้าโดเมน |
| Command Prompt | พิมพ์คำสั่ง cmd ได้ในหน้าต่างเดียวกัน |

**Lab GUI ในหัวข้อ Windows Server (14 ชุด):**

| ระดับ | Lab | ครอบคลุม |
|---|---|---|
| 1 | ตั้งค่า IP ผ่านหน้าจอ | TCP/IPv4 Properties, ตรวจผลด้วย `ipconfig` |
| 1 | จัดการ Service และ Process | Services, Startup Type, Task Manager |
| 2 | ติดตั้ง AD และสร้างโดเมน | Add Roles → Promote → สร้าง OU/user/group |
| 2 | สร้างโฟลเดอร์แชร์ | Explorer → Sharing / Security → firewall rule |
| 2 | **สร้างโดเมนใหม่ตั้งแต่ศูนย์** | ชื่อเครื่อง → IP นิ่ง → AD DS → forest แรก → ชี้ DNS มาที่ตัวเอง |
| 2 | **ตั้งค่า DNS Server** | Forward/Reverse zone, A / CNAME / PTR, Forwarder, `nslookup` |
| 2 | **จัดโครงสร้าง OU และผู้ใช้** | OU, ผู้ใช้ใหม่, กลุ่ม, ย้าย OU, reset password, disable คนลาออก |
| 2 | **แจก IP ด้วย DHCP** | ติดตั้ง role, Authorize, scope, option 003/006, reservation |
| 3 | งาน Helpdesk ประจำวัน | Local users, Remote Desktop, Spooler, เปลี่ยนชื่อเครื่อง |
| 3 | เครื่องต่อเน็ตไม่ได้ | ไล่จาก APIPA → การ์ดถูก disable → ตั้ง IP/DNS ใหม่ |
| 3 | **สร้างและ link Group Policy** | สร้าง GPO, ตั้งค่า, link เข้า OU, Enforced, `gpresult` |
| 3 | **นโยบายรหัสผ่านทั้งโดเมน** | Default Domain Policy, lockout, audit logon, GPO แยกบล็อก USB |
| 4 | Hardening ผ่าน GUI | ปิด service, firewall rule, service account, event log |
| 5 | **วางระบบ AD ทั้งบริษัท** | 20 ขั้นตอน: ตั้งเครื่อง → โดเมน → DNS → DHCP → OU → GPO → งาน backup |

**จุดสำคัญของการออกแบบ:** GUI ใช้ **state ก้อนเดียวกับฝั่ง PowerShell** —
คลิก Start service ใน Services แล้วพิมพ์ `sc query` ใน Command Prompt จะเห็นผลตรงกัน
และ `check()` ของ Lab ก็ตรวจจากสถานะเดียวกันไม่ว่าผู้เรียนจะทำผ่าน GUI หรือ CLI

---

## Command Prompt จำลอง

ไม่ใช่การเทียบข้อความ แต่ **จำลองสถานะจริงของอุปกรณ์** — สั่ง `vlan 10` แล้ว `show vlan brief` เห็นผลจริง

| อุปกรณ์ | จำลองอะไร |
|---|---|
| **Cisco IOS** | โหมด user/priv/config/config-if/config-vlan/config-line/**config-router/config-acl/config-dhcp**, VLAN, trunk, SVI, STP, EtherChannel, port-security, DHCP snooping, DAI, SPAN, HSRP, storm-control, 802.1X, VTP, **OSPF, ACL (standard/extended), NAT/PAT, DHCP server, DNS**, `show running-config` ที่สร้างจาก state จริง |
| **MikroTik RouterOS** | เมนู hierarchy, `print/add/set/remove/enable/disable`, `[find ...]`, ค่าที่มีเครื่องหมายคำพูด, flags, bridge VLAN filtering, bonding, WireGuard, VRRP, OSPF/BGP, IPsec, SNMP, logging, `/export` |
| **MikroTik Switch (CRS)** | เหมือน RouterOS + switch chip, mirror port, horizon, hardware offload |
| **Linux** | virtual filesystem, systemd, `ip`, ufw, LVM, `sysctl`, `docker`, pipe/redirect, `sort/uniq/cut/awk` · **`df` / `du` / `lsblk` / `pvs` คิดจากสถานะจริงของเครื่อง** — `df -i` รายงาน inode แยกจาก `df -h` และพื้นที่จะเพิ่มก็ต่อเมื่อ `resize2fs` แล้วเท่านั้น |
| **Linux Security Workstation** | ทุกอย่างของ Linux + `nmap`, `tcpdump`, `lynis`, `rkhunter`, `aide`, `auditctl`, `ausearch`, `openssl`, `last/lastb`, `sha256sum`, `fail2ban-client` |
| **Windows Server (PowerShell)** | PowerShell cmdlets, AD + Sites/Subnets/Recycle Bin, DNS record, DHCP scope/option/reservation, GPO, Hyper-V, SMB share, firewall rule |
| **Windows — คำสั่ง cmd** | `ipconfig` (/all /release /renew /flushdns /displaydns /registerdns), `ping`, `tracert`, `pathping`, `netstat -ano`, `nslookup`, `route` (print/add/delete), `arp`, `getmac`, `nbtstat`, `netsh` (interface ip / wlan / advfirewall / winsock), `tasklist`, `taskkill`, `sc`, `schtasks`, `reg`, `systeminfo`, `chkdsk`, `sfc`, `wmic`, `driverquery`, `powercfg`, `dir`, `icacls`, `findstr`, `net`, `gpupdate`, `gpresult` |
| **Windows — หน้าจอ GUI** | เดสก์ท็อปจำลองพร้อม 15 โปรแกรม (ดูหัวข้อด้านบน) — ใช้ state ร่วมกับฝั่ง PowerShell |

**คีย์ลัด:** `↑`/`↓` ประวัติคำสั่ง · `Tab` เติมคำสั่ง · `Ctrl+L` ล้างจอ · `?` ดูคำสั่งที่รองรับ

**`Tab` ทำงานเหมือนของจริง:** เติมให้ไกลที่สุดเท่าที่ทุกตัวเลือกยังตรงกัน ถ้าเติมต่อไม่ได้แล้วจึงแสดงรายการที่เหลือ

| พิมพ์ | กด `Tab` แล้วได้ |
|---|---|
| `sh` | `show ` |
| `show int` | `show interfaces ` |
| `show interfaces s` | `show interfaces status` |
| `sho run` | `show running-config` (ย่อทีละคำก็จับได้) |
| `sh` ใน config-if | `shutdown` (ตัวเลือกแยกตามโหมด) |


### การตรวจ Lab

Lab ตรวจจาก **สถานะของอุปกรณ์หลังรันคำสั่ง** ไม่ใช่ข้อความที่พิมพ์ — พิมพ์ย่อ (`conf t`) หรือเต็มก็ผ่านเหมือนกัน

**คำสั่งที่พิมพ์ผิดจะไม่ถูกนับว่าทำแล้ว** — ระบบจะบันทึกเฉพาะคำสั่งที่รันสำเร็จจริง
(แต่ปุ่มลูกศรขึ้น/ลงยังเรียกคำสั่งที่พิมพ์ผิดกลับมาแก้ได้ตามปกติ)

**ทำครบทุกข้อแล้วจะมีปุ่มท้าย Lab ขึ้นในแผงด้านข้าง:**

| ปุ่ม | ไปไหน |
|---|---|
| **Next →** | Lab ถัดไปในหัวข้อเดียวกัน (ข้ามระดับที่คนนั้นยังปลดล็อกไม่ได้ · หมวดเอาชีวิตรอดไปเหตุการณ์ถัดไป) — ซ่อนเมื่อเป็น Lab สุดท้าย |
| **↩ Return** | กลับหน้าบทเรียนของระดับที่ Lab นี้สังกัดอยู่ (หรือหน้าหมวดเอาชีวิตรอด) |
| **🏠 Home** | หน้าหลัก |


---

## 🧪 ชุดทดสอบ

```bash
npm test              # ทั้งหมด (~200 เคส ไม่ถึง 3 วินาที)
npm run validate      # ตรวจเฉพาะเนื้อหา — ใช้ตอนเพิ่มบทเรียน/ข้อสอบ/Lab
npm run test:watch    # รันซ้ำอัตโนมัติระหว่างแก้โค้ด
```

ใช้ `node --test` ที่ติดมากับ Node เอง — ไม่มี dependency เพิ่ม และมี GitHub Actions รันให้ทุก push

| ไฟล์ | กันอะไร |
|---|---|
| `test/labs.test.js` | **Lab ทุกชุดต้องเล่นจนจบได้ด้วยคำใบ้ของตัวเอง** — CLI 154 ชุด / 1,483 ขั้นตอน เล่นอัตโนมัติ, GUI 18 ชุด / 180 ขั้นตอน เล่นจากสคริปต์การคลิก |
| | **คำสั่งที่พิมพ์ผิดต้องไม่ทำให้ task ผ่าน** — ทดสอบซ้ำทุก lab โดยทำให้ทุกคำสั่งผิดหมด แล้วต้องไม่มี task ไหนผ่านเพิ่ม |
| `test/content.test.js` | โครงเนื้อหา: lab id ซ้ำ · task ไม่มีคำใบ้ · เฉลยข้อสอบอยู่นอกช่วงตัวเลือก · ข้อสอบซ้ำในระดับเดียวกัน · ระดับข้ามเลข |
| `test/api.test.js` | **สิ่งที่หน้าจอกันให้ไม่ได้** — เปิดเซิร์ฟเวอร์จริงบนฐานข้อมูล temp แล้วยิง API ตรง: สิทธิ์ admin, การบังคับเปลี่ยนรหัส, กันเดารหัส, header ความปลอดภัย, ไฟล์ที่ห้ามเสิร์ฟ |

**Lab แบบ CLI ทดสอบเองได้อัตโนมัติ** เพราะคำใบ้ของแต่ละ task คือคำสั่งจริง —
ชุดทดสอบเอาคำใบ้มารันใน emulator ตัวเดียวกับที่ผู้เรียนใช้ แล้วเช็คว่า `check()` ผ่านครบทุกข้อ
คำใบ้ที่พาไปไม่ถึงปลายทางจึงกลายเป็นเทสต์แดงทันที ไม่ต้องรอผู้เรียนมาแจ้ง

**Lab แบบ GUI** คำใบ้เป็นภาษาคน ("กดปุ่ม Start ที่แถว Spooler") จึงเขียนลำดับการคลิกไว้ที่
`test/helpers/gui-solutions.js` — ทดสอบแบบ headless ได้เพราะ state mutation ทั้งหมดแยกอยู่ใน
`GUI_ACTIONS` ซึ่งเป็นฟังก์ชันบริสุทธิ์ที่หน้าจอจริงกับชุดทดสอบเรียกตัวเดียวกัน

```js
// test/helpers/gui-solutions.js — เพิ่ม lab GUI ใหม่ก็เพิ่ม key ตาม id
'wg1-services': [
  ['open', { app: 'services.msc' }],
  ['service-startup', { svc: 'Spooler', value: 'Automatic' }],
  ['service-start', { svc: 'Spooler' }],
  ['$cmd', 'sc query Spooler'],        // พิมพ์ใน Command Prompt
],
```

lab GUI ที่ยังไม่มีสคริปต์จะถูกรายงานชื่อออกมาตอนรันเทสต์ ไม่เงียบหาย

---

## 🏅 ใบประกาศนียบัตร

* **ใบรายหัวข้อ** — ได้เมื่อผ่านแบบทดสอบครบทั้ง 5 ระดับ **และ** ทำ Lab ครบทุกชุดของหัวข้อนั้น
* **Master Certificate** — ได้เมื่อจบครบทั้ง 6 หัวข้อ

ใบประกาศมีชื่อผู้เรียน คะแนนเฉลี่ย จำนวน Lab วันที่ และรหัสอ้างอิง — กด **พิมพ์ / บันทึกเป็น PDF** ได้

---

## 🚀 Deploy

แอปทำงานได้ **สองโหมด** และเลือกเองอัตโนมัติจากว่ามีเซิร์ฟเวอร์ตอบที่ `/api/health` หรือไม่

| | โหมดเซิร์ฟเวอร์ | โหมดออฟไลน์ |
|---|---|---|
| เกิดเมื่อ | รัน `npm start` แล้วเปิดผ่านเซิร์ฟเวอร์นั้น | เปิดจาก static hosting (Vercel, Netlify, GitHub Pages) |
| บัญชีผู้ใช้ | ฐานข้อมูล SQLite · scrypt · คุกกี้ httpOnly | localStorage ของเบราว์เซอร์เครื่องนั้น |
| ความคืบหน้า | ตามตัวข้ามเครื่อง | อยู่กับเบราว์เซอร์เครื่องเดียว |
| ผู้ดูแลเห็นผู้เรียน | ทุกคน | เฉพาะบัญชีในเครื่องนั้น |
| เหมาะกับ | ใช้จริงในองค์กร / ห้องเรียน | ลองเล่น เรียนคนเดียว แจกลิงก์ให้ดู |

ทั้งสองโหมดเปิดใช้งานตอนเน็ตหลุดได้เหมือนกัน เพราะตัวหน้าเว็บถูกแคชด้วย service worker
(ดู [ใช้งานตอนเน็ตหลุด](#-ใช้งานตอนเน็ตหลุด-pwa)) — ต่างกันแค่ว่า *ข้อมูล* ไปอยู่ที่ไหน

### Vercel / static hosting

Vercel รัน `http.createServer(...).listen()` แบบค้างพอร์ตไม่ได้ และ `node:sqlite` ต้องเขียนไฟล์ถาวร
ซึ่ง serverless ไม่มีให้ — repo นี้จึงตั้งค่าให้ Vercel เสิร์ฟเป็น **static site อย่างเดียว**
ผ่าน `vercel.json` และ `.vercelignore` (ตัด `server/`, `server.js` ออกไม่ให้ถูก build เป็นฟังก์ชัน)

ผลคือเว็บใช้งานได้ครบทุก Lab ทุกบทเรียน แต่ทำงานใน**โหมดออฟไลน์** — หน้าเข้าสู่ระบบจะบอกไว้ชัดเจน

> ถ้า deploy แล้วยังขึ้น error ให้เข้า Vercel → Project Settings → Build & Development Settings
> แล้วตั้ง **Framework Preset = Other**, **Build Command = ว่าง**, **Output Directory = `.`**
> เพราะค่าที่ตั้งไว้ในหน้า dashboard จะทับ `vercel.json`

### 📴 ใช้งานตอนเน็ตหลุด (PWA)

เว็บลงทะเบียน **service worker** ไว้ — เข้าเว็บครั้งแรกเมื่อไร ครั้งต่อ ๆ ไป
**เปิดได้แม้ไม่มีเน็ต** และ **ติดตั้งลงเครื่องเป็นแอปได้** (Chrome/Edge → ปุ่ม Install)

| | ทำงานอย่างไร |
|---|---|
| กลยุทธ์แคช | ลองเน็ตก่อนเสมอ แล้วค่อยตกไปใช้แคช — กันผู้เรียนได้ไฟล์ JS เก่าปนใหม่จนพังแบบหาสาเหตุยาก |
| `/api/` | ไม่แคชเลย บัญชีและความคืบหน้าต้องเป็นของสดจากเซิร์ฟเวอร์เสมอ |
| เปิดหน้าใหม่ตอนออฟไลน์ | คืนตัวแอปจากแคชแล้วให้ router ฝั่งหน้าเว็บจัดการต่อ |
| มีเวอร์ชันใหม่ | เด้ง toast บอก แล้วอัปเดตให้ตอนรีเฟรชครั้งถัดไป (ไม่ตัดกลาง Lab) |

> ต้องเปิดผ่าน `http://localhost` หรือ HTTPS เท่านั้น — เบราว์เซอร์ไม่ให้ลงทะเบียน
> service worker บน `file://` และบน HTTP ของโดเมนอื่น
>
> แก้ไฟล์ใน `sw.js` แล้วอย่าลืมเปลี่ยน `VERSION` เพื่อล้างแคชเก่าของผู้ใช้

### ที่ที่รัน backend ได้จริง

ต้องเป็นที่ที่รัน process ค้างไว้ได้และมีดิสก์ถาวร เช่น VM/VPS, Render, Railway, Fly.io หรือ Docker

```bash
git clone https://github.com/Kuna-PA/The-learning-center.git
cd The-learning-center
LC_ADMIN_PASSWORD='รหัสที่ต้องการ' PORT=8080 npm start
```

ให้ reverse proxy (nginx / Caddy) ครอบด้วย HTTPS แล้วชี้มาที่พอร์ตนั้น
สำรองข้อมูลคือคัดลอกไฟล์ `data-db/learning-center.db` ไฟล์เดียว

---

## 👤 ระบบผู้ใช้และสิทธิ์

| บทบาท | ทำอะไรได้ |
|---|---|
| **user** | เรียน ทำแบบทดสอบ ทำ Lab ดูความคืบหน้าและใบประกาศของตัวเอง |
| **admin** | ทุกอย่างของ user + **เข้าทุกระดับทุก Lab ได้โดยไม่ติดด่านแบบทดสอบ** · [แดชบอร์ดภาพรวมผู้เรียน](#-หน้าของผู้ดูแลระบบ) · [เพิ่มบทเรียน/ข้อสอบ/Lab เองจากหน้าเว็บ](#เพิ่มเนื้อหาจากหน้าเว็บ-ไม่ต้องแตะโค้ด) · เพิ่ม/ลบผู้ใช้ · สลับบทบาท · รีเซ็ตรหัสผ่าน · ล้างความคืบหน้า |

บัญชีและความคืบหน้าเก็บที่ **เซิร์ฟเวอร์** — เข้าเรียนจากเครื่องไหนหรือเบราว์เซอร์ไหนก็ต่อจากที่ค้างไว้ได้

| เรื่อง | ทำอย่างไร |
|---|---|
| รหัสผ่าน | แฮชด้วย **scrypt** พร้อม salt รายคน · เทียบแบบ constant-time · ไม่เคยเก็บรหัสจริง · ขั้นต่ำ 8 ตัว |
| เซสชัน | token สุ่ม 32 ไบต์ ใน cookie แบบ **httpOnly + SameSite=Lax** สคริปต์ในหน้าเว็บอ่านไม่ได้ · ติด **Secure** ให้เองเมื่ออยู่หลัง HTTPS |
| กันเดารหัส | ผิดเกิน 8 ครั้งต่อชื่อผู้ใช้ ล็อก 5 นาที · **ผิดเกิน 30 ครั้งต่อ IP ล็อก 10 นาที** (กันยิงหว่านสลับชื่อไปเรื่อย ๆ) · ข้อความตอบเหมือนกันทั้งกรณีไม่มีบัญชีและรหัสผิด |
| รหัสที่ผู้ดูแลตั้งให้ | บัญชีที่ admin **สร้าง** หรือ **รีเซ็ตรหัสให้** จะถูกบังคับเปลี่ยนรหัสก่อน — และบังคับที่**เซิร์ฟเวอร์** (ทุกเส้นทางตอบ 403 `must_change`) ไม่ใช่แค่ที่หน้าจอ |
| เปลี่ยนรหัสตัวเอง | ต้องใส่รหัสเดิมเสมอ — คนที่ยืมเครื่องที่ล็อกอินค้างไว้จึงยึดบัญชีไม่ได้ |
| header ของหน้าเว็บ | `Content-Security-Policy` (สคริปต์เฉพาะของตัวเอง · ไม่มี inline script · ไม่มี eval) · `X-Frame-Options: DENY` · `nosniff` · `Referrer-Policy` · `HSTS` เมื่อเป็น HTTPS |
| รับสมัครเอง | ปิดได้ด้วย `LC_OPEN_REGISTER=0` — หน้าล็อกอินจะซ่อนแท็บ "สมัครใหม่" ให้เอง |
| ความคืบหน้า | บันทึกขึ้นเซิร์ฟเวอร์แบบหน่วงรวบ (800ms) · ปิดแท็บกลางคันยังส่งทันด้วย `sendBeacon` |
| ออฟไลน์ | localStorage เป็นแคชสำรอง เน็ตหลุดระหว่างทำ Lab ก็ยังทำต่อได้ แล้วค่อยซิงก์ทีหลัง |
| ย้ายของเก่า | ผู้ที่เคยมีความคืบหน้าใน localStorage จะถูกยกขึ้นเซิร์ฟเวอร์ให้อัตโนมัติตอนล็อกอินครั้งแรก |

**ไฟล์ฐานข้อมูล** อยู่ที่ `data-db/learning-center.db` (SQLite) — ถูก `.gitignore` ไว้แล้ว
สำรองข้อมูลก็แค่คัดลอกไฟล์นี้

### REST API

| เส้นทาง | สิทธิ์ | ทำอะไร |
|---|---|---|
| `GET /api/health` | ทุกคน | สถานะเซิร์ฟเวอร์ + จำนวนบัญชี |
| `POST /api/auth/register` · `login` · `logout` | ทุกคน | สมัคร / เข้า / ออก |
| `GET /api/auth/me` | ทุกคน | บัญชีของเซสชันปัจจุบัน |
| `POST /api/auth/password` · `display` | ผู้ใช้ | เปลี่ยนรหัสผ่าน / ชื่อที่แสดงของตัวเอง |
| `GET PUT POST DELETE /api/progress` | ผู้ใช้ | ความคืบหน้าของตัวเอง |
| `GET /api/content` | ผู้ใช้ | เนื้อหาที่ผู้ดูแลเพิ่มเอง (บทเรียน/ข้อสอบ/Lab) |
| `PUT /api/content` | admin | บันทึกเนื้อหาที่เพิ่มเองทั้งชุด |
| `GET POST /api/admin/users` | admin | ดูรายชื่อทั้งหมด / สร้างบัญชี |
| `PATCH DELETE /api/admin/user/<u>` | admin | เปลี่ยนบทบาท ระงับ รีเซ็ตรหัส ลบ |
| `GET DELETE /api/admin/progress/<u>` | admin | ดู / ล้างความคืบหน้าของผู้เรียน |

โค้ดฝั่งเซิร์ฟเวอร์และไฟล์ฐานข้อมูลถูกกันไม่ให้เสิร์ฟออกไปทาง HTTP (ตอบ 403)

---

## โครงสร้างโปรเจกต์

```
index.html            หน้าเดียว โหลด ES modules
server.js             เสิร์ฟไฟล์ + mount API + security header
sw.js                 service worker — ทำให้เปิดเว็บได้ตอนเน็ตหลุด
manifest.webmanifest  ข้อมูลแอปสำหรับติดตั้งลงเครื่อง (PWA)
icon-192.png icon-512.png   ไอคอนแอป
assets/               รูปที่ใช้ในหน้าเว็บ (โลโก้ · จูล่ง) — สร้างด้วย scripts/make-assets.mjs
server/
  db.js               schema และ query ทั้งหมด (node:sqlite)
  auth.js             scrypt, เซสชัน, cookie, กันเดารหัส
  api.js              REST endpoints
css/style.css         ธีมทั้งหมด (แบบ TryHackMe)
js/
  app.js              router + ทุกหน้า (login, dashboard, room, quiz, lab, survival, cert, admin)
  api.js              ตัวเรียก REST API
  auth.js             ผู้ใช้/บทบาท/session (แคชฝั่งเบราว์เซอร์)
  store.js            ความคืบหน้า/XP — sync กับเซิร์ฟเวอร์ + แคชออฟไลน์
  admin-stats.js      คิดตัวเลขให้แดชบอร์ดผู้ดูแล (ฟังก์ชันบริสุทธิ์ ทดสอบได้)
  content.js          โหลด/บันทึกเนื้อหาที่ผู้ดูแลเพิ่มเอง
  pwa.js              ลงทะเบียน service worker
  terminal.js         คอมโพเนนต์ command prompt
  gui/
    windows-gui.js    เดสก์ท็อป Windows จำลอง + GUI_ACTIONS (ทดสอบได้โดยไม่ต้องมี DOM)
  devices/
    cisco.js  mikrotik.js  linux.js  windows.js  util.js  index.js
data/
  levels.js           นิยาม 5 ระดับ
  custom.js           โครงเนื้อหาที่ผู้ดูแลเพิ่มเอง + ตัวแปลงกติกาตรวจ Lab เป็นฟังก์ชัน
  tracks/             บทเรียน + ข้อสอบ + lab หลัก
    cisco-switch.js  mikrotik-router.js  mikrotik-switch.js
    windows-server.js  linux.js  cyber-security.js  index.js
  labs/               lab เพิ่มเติม + หมวดเอาชีวิตรอด
    cisco-extra.js  mikrotik-router-extra.js  mikrotik-switch-extra.js
    windows-extra.js  windows-gui.js  linux-extra.js
    survival.js  survival2.js  index.js
test/                 ชุดทดสอบ (node --test)
  labs.test.js  content.test.js  api.test.js  emulator.test.js  admin.test.js
  helpers/
    lab-runner.js       เล่น Lab แบบ CLI ให้จบด้วยคำใบ้ของมันเอง
    gui-runner.js       เล่น Lab แบบ GUI ผ่าน GUI_ACTIONS
    gui-solutions.js    ลำดับการคลิกของ Lab GUI แต่ละชุด
    validate-content.js ตัวตรวจโครงเนื้อหา
    server.js           เปิดเซิร์ฟเวอร์จริงบนฐานข้อมูล temp
scripts/
  validate-content.mjs  npm run validate
  make-assets.mjs       ตัดพื้นหลังรูปต้นฉบับเป็น asset ของเว็บ
  lib/img.mjs           อ่าน BMP / เขียน PNG / ลบพื้นหลัง (เขียนเอง ไม่มี dependency)
.github/workflows/ci.yml   รันเทสต์ทุก push / PR
```

---

## 🛠️ หน้าของผู้ดูแลระบบ

เมนู **ผู้ดูแลระบบ** มีสามหน้า สลับกันได้ด้วยแท็บด้านบน

### ภาพรวมผู้เรียน — `#/admin`

ตอบคำถามว่า "ทีมเรียนไปถึงไหนแล้ว ใครยังไม่เริ่ม และหัวข้อไหนคนไปไม่ถึง"

| ส่วน | บอกอะไร |
|---|---|
| การ์ดสรุป | จำนวนบัญชี · คนที่เข้าใช้ใน 7 วัน · ความคืบหน้าเฉลี่ย · Lab ที่ทำสำเร็จรวม · ใบประกาศที่ออกไปแล้ว |
| เตือนคนที่ยังไม่เริ่ม | นับคนที่ยังไม่อ่าน ไม่สอบ ไม่ทำ Lab เลยสักอย่าง |
| ความคืบหน้ารายหัวข้อ | เปอร์เซ็นต์เฉลี่ยของทั้งทีม · จำนวนคนที่เรียนจบ · **ระดับสูงสุดที่มีคนสอบผ่าน** |
| ตารางผู้เรียน | เรียงตามความคืบหน้า — %, XP, แบบทดสอบ, Lab, เอาชีวิตรอด, ใบประกาศ, เข้าล่าสุด |
| ⬇ CSV | โหลดตารางทั้งหมดไปเปิดต่อใน Excel (มี BOM แล้ว ภาษาไทยไม่เพี้ยน) |

กด **ดูรายละเอียด** ที่ผู้เรียนคนไหนก็ได้ เพื่อดูรายหัวข้อ × รายระดับว่า
อ่านบทเรียนหรือยัง · สอบผ่านไหม คะแนนดีที่สุดเท่าไร สอบไปกี่ครั้ง · ทำ Lab ไปกี่ชุดจากทั้งหมด

> เปอร์เซ็นต์ใช้สูตรเดียวกับที่ผู้เรียนเห็นในหน้าของตัวเอง (อ่าน 30 · สอบผ่าน 40 · Lab 30)
> โค้ดส่วนคิดเลขอยู่ที่ [`js/admin-stats.js`](js/admin-stats.js) แยกออกมาเป็นฟังก์ชันบริสุทธิ์เพื่อให้ทดสอบได้

### เพิ่มเนื้อหาจากหน้าเว็บ ไม่ต้องแตะโค้ด — `#/admin/content`

เพิ่มได้ 3 อย่าง โดยเลือกว่าจะให้ไปอยู่หัวข้อไหน ระดับไหน

| เพิ่มอะไร | กรอกอะไร |
|---|---|
| **บทเรียน** | หัวข้อย่อย + เนื้อหา (ใส่ HTML ได้ เช่น `<p> <ul> <code>`) |
| **ข้อสอบ** | เลือกตอบข้อเดียว / หลายข้อ / พิมพ์คำสั่ง + คำอธิบายเฉลย |
| **Lab** | ชื่อ · สถานการณ์ · อุปกรณ์จำลอง · ขั้นตอนทีละข้อ (สิ่งที่ต้องทำ + คำใบ้ + กติกาตรวจ) |

**กติกาตรวจของ Lab** เลือกจากรายการ ไม่ต้องเขียนโค้ด

| กติกา | ใช้เมื่อ | ตัวอย่าง |
|---|---|---|
| รันคำสั่งที่ตรงกับรูปแบบนี้ | อยากให้ผ่านเมื่อพิมพ์คำสั่งบางอย่างสำเร็จ | `systemctl start nginx` |
| รันคำสั่งแบบนี้อย่างน้อย N ครั้ง | เช่นให้ตรวจซ้ำก่อน–หลังแก้ | `^df` · N = 2 |
| สถานะของอุปกรณ์เป็นค่านี้ | ตรวจ**ผลลัพธ์จริง** ไม่ใช่แค่ข้อความที่พิมพ์ | `services.nginx.active` = `true` |
| ไฟล์นี้มีข้อความอยู่ข้างใน | ให้ผู้เรียนแก้ไฟล์ config | `/etc/logrotate.d/app` มีคำว่า `rotate` |

> **ทำไมไม่ให้พิมพ์ JS เอง** — เนื้อหานี้ถูกส่งไปรันในเบราว์เซอร์ของผู้เรียนทุกคน
> ถ้าเปิดให้พิมพ์โค้ดได้ ใครยึดบัญชี admin ได้ก็รันโค้ดในเครื่องผู้เรียนได้ทันที
> ด้วยเหตุผลเดียวกัน HTML ของบทเรียนจะถูกตัด `<script>`, `on...=` และ `javascript:` ออกก่อนเสมอ

**ที่เก็บเนื้อหา** ขึ้นกับว่ารันแบบไหน

| | เก็บที่ไหน | ใครเห็น |
|---|---|---|
| โหมดเซิร์ฟเวอร์ (`npm start`) | ตาราง `content` ในฐานข้อมูล | ผู้เรียนทุกคน |
| โหมดออฟไลน์ (Vercel / static) | localStorage ของเบราว์เซอร์นั้น | เฉพาะเครื่องนั้น |

บนโหมดออฟไลน์จึงมีปุ่ม **ดาวน์โหลด/นำเข้าไฟล์เนื้อหา** ไว้ย้ายข้ามเครื่อง
หรือส่งไฟล์ให้คนที่ดูแล repo เอาไปใส่เป็นเนื้อหาถาวรก็ได้

เนื้อหาที่เพิ่มเองจะขึ้นป้าย **เพิ่มโดยผู้ดูแล** ในหน้าบทเรียน และลบออกได้จากตารางท้ายหน้าจัดการเนื้อหา

### จัดการผู้ใช้ — `#/admin/users`

เพิ่ม/ลบบัญชี · สลับบทบาท · รีเซ็ตรหัสผ่าน (เจ้าตัวต้องตั้งรหัสใหม่เองก่อนใช้งาน) · ล้างความคืบหน้า

---

## 🎨 โลโก้ · ตัวจูล่ง · ไอคอน

| ที่ | ใช้ไฟล์ | อยู่ตรงไหน |
|---|---|---|
| โลโก้ (เฉพาะสัญลักษณ์) | `assets/logo-mark.png` | แถบข้างซ้าย · การ์ดบนหน้าหลัก |
| โลโก้เต็ม (มีตัวหนังสือ) | `assets/logo-full.png` | หน้าเข้าสู่ระบบ |
| ไอคอนแอป | `icon-192.png` · `icon-512.png` · `assets/favicon.png` | แท็บเบราว์เซอร์ · ตอนติดตั้งเป็นแอป |
| จูล่ง (ครึ่งตัว) | `assets/julong.png` | ปุ่มลอยมุมขวาล่าง · หัวแผงสนทนา |
| จูล่ง (เต็มตัว) | `assets/julong-full.png` | ป๊อปอัพแสดงความยินดีตอนทำ Lab จบ |

รูปต้นฉบับเป็น `.jpg` ที่มีพื้นหลังติดมาด้วย (โลโก้อยู่บนกระดาษ · ตัวละครอยู่บนลายตารางหมากรุก)
จึงมีสคริปต์ตัดพื้นหลังให้เป็น PNG โปร่งใส — **ไฟล์ผลลัพธ์อยู่ใน repo แล้ว ปกติไม่ต้องรันซ้ำ**

```bash
# แปลงต้นฉบับเป็น .bmp ก่อน (PowerShell) แล้วค่อยสั่ง
node scripts/make-assets.mjs <โฟลเดอร์ที่มี logo.bmp และ julong.bmp>
```

วิธีตัดพื้นหลังต่างกันตามลักษณะของภาพ — โลโก้ใช้ **ความอิ่มสี** เป็น alpha (กระดาษเป็นสีเทาไร้สี
แต่โลโก้เป็นน้ำเงิน–เขียวจัด) ส่วนตัวละครใช้ **เทสีจากขอบเข้ามา** เพราะถ้าไล่ด้วยสีทั้งภาพ
ผ้าคลุมสีขาวของตัวละครจะหายไปพร้อมพื้นหลัง

### ไอคอนของ Learning Path

emoji ไม่มีรูปที่ตรงกับหัวข้อสายเน็ตเวิร์ก (ไม่มีสวิตช์ ไม่มีชิปสวิตช์ ไม่มีเราเตอร์)
ของเดิมจึงต้องยืมรูปอื่นมาใช้อย่าง 🔀 กับ 🧩 ซึ่งไม่สื่อความ — ตอนนี้วาดเป็น SVG เองที่
[`data/tracks/icons.js`](data/tracks/icons.js)

| หัวข้อ | รูป |
|---|---|
| Network | ลูกโลกพร้อมจุดเชื่อม |
| Cisco CCNA | สวิตช์ในแร็คพร้อมพอร์ต + ลูกศรสวนทาง (การสลับส่งเฟรม) |
| MikroTik Router | เราเตอร์พร้อมเสาอากาศและคลื่นสัญญาณ |
| MikroTik Switch | ชิปสวิตช์พร้อมขา |
| Windows Server | ตู้เซิร์ฟเวอร์ที่ยูนิตบนเป็นบานหน้าต่างสี่ช่อง |
| Linux | เพนกวิน |
| Cyber Security | โล่พร้อมกุญแจ |

ไอคอนใช้ `viewBox` 24×24 และคลาส `.ic` ที่กำหนดขนาดเป็น `1em` จึงยืด–หดตาม `font-size`
ของที่ที่เอาไปวางเหมือน emoji เดิมทุกประการ ส่วน `<option>` ใน dropdown แสดง HTML ไม่ได้
จึงยังใช้ `TRACK_EMOJI` เป็นตัวสำรอง — เพิ่มหัวข้อใหม่ต้องใส่ทั้งสองอย่าง

---

## การเพิ่มเนื้อหา

### เพิ่มบทเรียน/ข้อสอบ/lab ในหัวข้อเดิม — `data/tracks/<track>.js`

```js
levels: {
  1: {
    title: 'ชื่อบท',
    objectives: ['...'],
    sections: [{ t: 'หัวข้อ', h: `<p>HTML ของเนื้อหา</p>` }],
    quiz: [
      { type: 'mcq',   q: 'คำถาม', opts: ['a','b'], a: 1, why: 'คำอธิบาย' },
      { type: 'multi', q: 'คำถาม', opts: ['a','b','c'], a: [0,2], why: '...' },
      { type: 'cmd',   q: 'พิมพ์คำสั่ง...', ans: ['conf t','configure terminal'], why: '...' },
    ],
    labs: [{
      id: 'unique-id', title: 'ชื่อ Lab', brief: 'สถานการณ์',
      device: 'cisco',   // cisco | mikrotik | mikrotik-sw | linux | linux-sec | windows | windows-gui
      init: { apply: st => { /* ตั้งสถานะเริ่มต้นของอุปกรณ์ */ } },
      tasks: [
        { t: 'สิ่งที่ต้องทำ', hint: 'คำสั่ง → คำสั่งถัดไป',
          check: (state, history) => state.hostname === 'SW1' },
      ],
    }],
  },
}
```

`check(state, history)` — `state` คือสถานะอุปกรณ์, `history` คือคำสั่งที่**รันสำเร็จ**แล้ว

### เพิ่มเฉพาะ Lab — `data/labs/<track>-extra.js`

export เป็น `{ ระดับ: [lab, ...] }` ระบบจะ merge ให้อัตโนมัติผ่าน `mergeExtraLabs()`

### เพิ่มเหตุการณ์เอาชีวิตรอด — `data/labs/survival.js`

เพิ่ม object ใน `SURVIVAL_LABS` โดยมี `severity`, `time`, `caller`, `story`, `impact`, `tasks`, `debrief`

### เพิ่ม Learning Path ใหม่

สร้างไฟล์ใน `data/tracks/` แล้ว import ใน `data/tracks/index.js`

---

## XP และ Rank

อ่านบทเรียน **+10** · ผ่านแบบทดสอบ **+50** · ทำ Lab ครบ **+80** · แต่ละ task ที่ผ่าน **+5**

Rank เลื่อนตาม XP รวมทั้งเว็บ — เกณฑ์ตั้งจาก XP ที่หาได้จริงทั้งหมด **~13,200 XP** (124 Lab + 30 แบบทดสอบ + 30 บทเรียน)

| Rank | ต้องมี | คิดเป็นสัดส่วนของเนื้อหาทั้งหมด |
|---|---|---|
| 🌱 Novice | 0 | — |
| 🧭 Advanced Beginner | 900 | ~7% |
| ⚙️ Competent | 2,600 | ~20% |
| 🎯 Proficient | 5,300 | ~40% |
| 👑 Expert | 8,800 | ~67% |

เรียนจบระดับ 1 ของหัวข้อเดียวแบบเต็ม ≈ 350 XP — ยังเป็น Novice อยู่ ต้องเรียนหลายหัวข้อจึงจะขยับ Rank

---

## 📄 สัญญาอนุญาต

[MIT](LICENSE) — นำไปใช้ แก้ไข และเผยแพร่ต่อได้ ขอแค่คงประกาศลิขสิทธิ์ไว้

(ถ้าต้องการเงื่อนไขอื่น เช่น ห้ามใช้เชิงพาณิชย์ ให้แก้ไฟล์ `LICENSE` และ `package.json` ตามที่ต้องการ)
