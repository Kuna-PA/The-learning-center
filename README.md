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

**ล็อกอินครั้งแรก:** เซิร์ฟเวอร์จะสร้างบัญชี `admin` ให้อัตโนมัติ แล้วพิมพ์รหัสผ่านออกมาที่ console
→ เปลี่ยนรหัสผ่านทันทีที่หน้า "บัญชีของฉัน"

ตั้งรหัสเองได้ด้วยตัวแปรแวดล้อม:

```bash
LC_ADMIN_PASSWORD='รหัสที่ต้องการ' npm start
```

| ตัวแปร | ค่าเริ่มต้น | ใช้ทำอะไร |
|---|---|---|
| `PORT` | 5173 | พอร์ตที่เปิดฟัง |
| `LC_DATA_DIR` | `./data-db` | ที่เก็บไฟล์ฐานข้อมูล |
| `LC_ADMIN_PASSWORD` | `admin1234` | รหัสของ admin ตอนสร้างครั้งแรกเท่านั้น |

> ต้องรันผ่าน server เพราะเว็บใช้ ES Modules — เปิด `index.html` ด้วย `file://` จะไม่ทำงาน

---

## ภาพรวมเนื้อหา

| | จำนวน |
|---|---|
| Learning Path (หัวข้อ) | **6** |
| ระดับต่อหัวข้อ | **5** (Novice → Expert) · **Cisco CCNA** และ **Linux** มี **6** ระดับ |
| ข้อสอบ | **273 ข้อ** (32 ชุด) |
| Lab ปกติ | **109 ชุด / 1,044 ขั้นตอน** (ในนั้นเป็น Lab หน้าจอ GUI 14 ชุด) |
| Lab หมวดเอาชีวิตรอด | **29 เหตุการณ์ / 303 ขั้นตอน** (4 ระดับความยาก) |
| อุปกรณ์จำลอง | **7 แบบ** (รวมหน้าจอ GUI ของ Windows) |

### 6 Learning Paths

| หัวข้อ | ครอบคลุม |
|---|---|
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
| **Linux** | virtual filesystem, systemd, `ip`, ufw, LVM, `sysctl`, `docker`, pipe/redirect, `sort/uniq/cut/awk` |
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


ผลการทดสอบอัตโนมัติล่าสุด:

```
Lab แบบ CLI  : 759/759 tasks ผ่านเมื่อพิมพ์คำสั่งถูก
Lab แบบ GUI  : 179/180 tasks ผ่านเมื่อคลิกตามขั้นตอน
ข้อสอบ       : 227 ข้อ ไม่พบข้อผิดพลาด

fuzz พิมพ์ผิด/ถูก (81 lab · 759 task)
  พิมพ์ผิดแต่ผ่าน   : 15  (ทั้งหมดเป็นคำสั่งที่ต่างจากคำใบ้แต่บรรลุเป้าหมายจริง)
  พิมพ์ถูกแต่ไม่ผ่าน : 0
  ผ่านแล้วหลุด       : 0
  emulator crash     : 0
```

> Lab GUI ทดสอบแบบ headless ได้เพราะแยก state mutation ออกมาเป็น `GUI_ACTIONS`
> ซึ่งเป็นฟังก์ชันบริสุทธิ์ที่หน้าจอจริงกับชุดทดสอบเรียกใช้ตัวเดียวกัน

---

## 🏅 ใบประกาศนียบัตร

* **ใบรายหัวข้อ** — ได้เมื่อผ่านแบบทดสอบครบทั้ง 5 ระดับ **และ** ทำ Lab ครบทุกชุดของหัวข้อนั้น
* **Master Certificate** — ได้เมื่อจบครบทั้ง 6 หัวข้อ

ใบประกาศมีชื่อผู้เรียน คะแนนเฉลี่ย จำนวน Lab วันที่ และรหัสอ้างอิง — กด **พิมพ์ / บันทึกเป็น PDF** ได้

---

## 👤 ระบบผู้ใช้และสิทธิ์

| บทบาท | ทำอะไรได้ |
|---|---|
| **user** | เรียน ทำแบบทดสอบ ทำ Lab ดูความคืบหน้าและใบประกาศของตัวเอง |
| **admin** | ทุกอย่างของ user + **เข้าทุกระดับทุก Lab ได้โดยไม่ติดด่านแบบทดสอบ** · เพิ่ม/ลบผู้ใช้ · สลับบทบาท · รีเซ็ตรหัสผ่าน · ล้างความคืบหน้า · ดูความคืบหน้าของทุกคน |

บัญชีและความคืบหน้าเก็บที่ **เซิร์ฟเวอร์** — เข้าเรียนจากเครื่องไหนหรือเบราว์เซอร์ไหนก็ต่อจากที่ค้างไว้ได้

| เรื่อง | ทำอย่างไร |
|---|---|
| รหัสผ่าน | แฮชด้วย **scrypt** พร้อม salt รายคน · เทียบแบบ constant-time · ไม่เคยเก็บรหัสจริง |
| เซสชัน | token สุ่ม 32 ไบต์ ใน cookie แบบ **httpOnly + SameSite=Lax** สคริปต์ในหน้าเว็บอ่านไม่ได้ |
| กันเดารหัส | ใส่ผิดเกิน 8 ครั้งต่อชื่อผู้ใช้ ล็อก 5 นาที · ข้อความตอบเหมือนกันทั้งกรณีไม่มีบัญชีและรหัสผิด |
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
| `GET POST /api/admin/users` | admin | ดูรายชื่อทั้งหมด / สร้างบัญชี |
| `PATCH DELETE /api/admin/user/<u>` | admin | เปลี่ยนบทบาท ระงับ รีเซ็ตรหัส ลบ |
| `GET DELETE /api/admin/progress/<u>` | admin | ดู / ล้างความคืบหน้าของผู้เรียน |

โค้ดฝั่งเซิร์ฟเวอร์และไฟล์ฐานข้อมูลถูกกันไม่ให้เสิร์ฟออกไปทาง HTTP (ตอบ 403)

---

## โครงสร้างโปรเจกต์

```
index.html            หน้าเดียว โหลด ES modules
server.js             เสิร์ฟไฟล์ + mount API
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
  terminal.js         คอมโพเนนต์ command prompt
  gui/
    windows-gui.js    เดสก์ท็อป Windows จำลอง + GUI_ACTIONS (ทดสอบได้โดยไม่ต้องมี DOM)
  devices/
    cisco.js  mikrotik.js  linux.js  windows.js  util.js  index.js
data/
  levels.js           นิยาม 5 ระดับ
  tracks/             บทเรียน + ข้อสอบ + lab หลัก
    cisco-switch.js  mikrotik-router.js  mikrotik-switch.js
    windows-server.js  linux.js  cyber-security.js  index.js
  labs/               lab เพิ่มเติม + หมวดเอาชีวิตรอด
    cisco-extra.js  mikrotik-router-extra.js  mikrotik-switch-extra.js
    windows-extra.js  windows-gui.js  linux-extra.js
    survival.js  survival2.js  index.js
```

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
