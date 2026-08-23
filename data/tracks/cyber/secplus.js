// ============================================================
//  Cyber Security — เนื้อหาและ Lab ตามหลักสูตร CompTIA Security+ (21 บทเรียน)
//  แยกตามระดับปลายทาง แล้วให้ ../cyber-security.js เอาไปต่อท้ายของเดิม
//
//    L1  Lesson 1, 2, 4        บทบาท/การควบคุม · ภัยคุกคาม · social engineering + malware
//    L2  Lesson 5–8, 12, 13    cryptography · PKI · authentication · IAM · host · mobile
//    L3  Lesson 3, 10, 14      security assessment · appliance/SIEM · application security
//    L4  Lesson 17, 18, 19     incident response · digital forensics · risk management
//    L5  Lesson 9, 11, 15, 16, 20, 21  network design · protocols · cloud · privacy ·
//                              resilience · physical security
// ============================================================
const said = (h, re) => h.some(c => re.test(String(c).trim()));

// ---- ตัวช่วยจัดฉากให้ Lab: สร้างผู้ใช้ / ไฟล์ / service ที่โจทย์อ้างถึง ----
// ถ้าไม่จัดฉากไว้ คำสั่งจะ error แล้ว terminal จะไม่นับว่าทำ task นั้นแล้ว
const addUser = (st, name, extra = {}) => {
  st.users[name] = {
    uid: 1100 + Object.keys(st.users).length, home: `/home/${name}`,
    shell: '/bin/bash', groups: [name], ...extra,
  };
};
/** วางไฟล์ตาม path เต็ม สร้างโฟลเดอร์ระหว่างทางให้ด้วย */
const addFile = (st, path, content, mode = '644', owner = 'root') => {
  const parts = path.split('/').filter(Boolean);
  const name = parts.pop();
  let n = st.fs;
  for (const p of parts) {
    n.children[p] ||= { t: 'd', mode: '755', owner: 'root', group: 'root', children: {} };
    n = n.children[p];
  }
  n.children[name] = { t: 'f', mode, owner, group: owner, content };
};
const startSvc = (st, name, desc = '') => {
  st.services[name] = { active: true, enabled: true, desc: desc || name, pid: 900 + Object.keys(st.services).length };
};

export default {
  // ================================================================
  //  ระดับ 1 — Lesson 1, 2, 4
  // ================================================================
  1: {
    sections: [
      {
        t: 'Lesson 1 — บทบาทด้านความปลอดภัยและประเภทของ Security Control',
        h: `
<p>ก่อนจะลงมือทำอะไร ต้องรู้ก่อนว่าใครรับผิดชอบอะไร ในองค์กรขนาดกลางขึ้นไปงานความปลอดภัยแยกกันชัดเจน</p>
<table class="tbl">
<tr><th>บทบาท</th><th>รับผิดชอบอะไร</th></tr>
<tr><td><b>CISO / ผู้บริหารด้านความปลอดภัย</b></td><td>กำหนดนโยบาย งบประมาณ และรับผิดชอบความเสี่ยงในภาพรวมต่อผู้บริหารสูงสุด</td></tr>
<tr><td><b>SOC Analyst (Tier 1/2/3)</b></td><td>Tier 1 คัดกรองแจ้งเตือน · Tier 2 สืบสวนเชิงลึก · Tier 3 ล่าภัยคุกคามและปรับจูนระบบตรวจจับ</td></tr>
<tr><td><b>Incident Responder</b></td><td>เข้าจัดการเมื่อเกิดเหตุจริง — ควบคุม กำจัด และกู้คืน</td></tr>
<tr><td><b>Security Engineer</b></td><td>ออกแบบและติดตั้งระบบป้องกัน — firewall, EDR, SIEM, IAM</td></tr>
<tr><td><b>DevSecOps</b></td><td>ฝังการตรวจสอบความปลอดภัยเข้าไปในกระบวนการพัฒนาและ CI/CD</td></tr>
<tr><td><b>ผู้ดูแลระบบ (คุณ)</b></td><td>ในองค์กรไทยส่วนใหญ่ คนเดียวกันนี้ทำหลายบทบาทพร้อมกัน — จึงต้องรู้ให้ครบทุกด้าน</td></tr>
</table>
<p><b>Security Control แบ่งได้สองมิติ</b> — ข้อสอบและงานจริงถามทั้งสองมิตินี้เสมอ</p>
<p><b>มิติที่ 1: แบ่งตาม "ใครหรืออะไรเป็นคนบังคับใช้"</b></p>
<table class="tbl">
<tr><th>ประเภท</th><th>คืออะไร</th><th>ตัวอย่าง</th></tr>
<tr><td><b>Technical</b></td><td>ระบบบังคับใช้เอง</td><td>firewall, การเข้ารหัส, MFA, ACL</td></tr>
<tr><td><b>Managerial</b></td><td>การบริหารและวางแผน</td><td>นโยบายความปลอดภัย, การประเมินความเสี่ยง, การตรวจสอบผู้ขาย</td></tr>
<tr><td><b>Operational</b></td><td>คนเป็นคนทำตามขั้นตอน</td><td>การอบรมพนักงาน, ยาม, ขั้นตอน onboarding</td></tr>
<tr><td><b>Physical</b></td><td>กายภาพจับต้องได้</td><td>รั้ว, กุญแจ, กล้องวงจรปิด, ประตูควบคุมการเข้าออก</td></tr>
</table>
<p><b>มิติที่ 2: แบ่งตาม "ทำหน้าที่อะไร"</b></p>
<table class="tbl">
<tr><th>ประเภท</th><th>หน้าที่</th><th>ตัวอย่าง</th></tr>
<tr><td><b>Preventive</b></td><td>กันไม่ให้เกิด</td><td>firewall, ACL, การเข้ารหัส, ประตูล็อก</td></tr>
<tr><td><b>Detective</b></td><td>รู้ว่าเกิดขึ้นแล้ว</td><td>log, IDS, SIEM, กล้องวงจรปิด</td></tr>
<tr><td><b>Corrective</b></td><td>แก้ไขหลังเกิดเหตุ</td><td>การกู้คืนจาก backup, patch, quarantine ไฟล์</td></tr>
<tr><td><b>Deterrent</b></td><td>ทำให้ไม่กล้าทำ</td><td>ป้ายเตือน, ไฟส่องสว่าง, การประกาศบทลงโทษ</td></tr>
<tr><td><b>Compensating</b></td><td>ทดแทนเมื่อทำของจริงไม่ได้</td><td>เครื่องเก่าที่ patch ไม่ได้ ก็แยกวงและเฝ้าดูเป็นพิเศษแทน</td></tr>
<tr><td><b>Directive</b></td><td>สั่งให้ทำ</td><td>นโยบาย, ระเบียบปฏิบัติ, ป้ายบอกวิธี</td></tr>
</table>
<div class="note"><b>กรอบมาตรฐานที่ควรรู้จัก</b><br>
<b>NIST CSF</b> — 5 ฟังก์ชัน: Identify, Protect, Detect, Respond, Recover (ใช้อธิบายภาพรวมกับผู้บริหารได้ดีที่สุด) ·
<b>ISO/IEC 27001</b> ระบบบริหารความปลอดภัยที่ขอใบรับรองได้ ·
<b>CIS Controls</b> รายการสิ่งที่ควรทำเรียงตามลำดับความคุ้มค่า — เหมาะกับทีมเล็กที่อยากรู้ว่าเริ่มตรงไหนก่อน ·
<b>PCI DSS</b> บังคับสำหรับระบบที่แตะข้อมูลบัตร ·
<b>PDPA</b> กฎหมายคุ้มครองข้อมูลส่วนบุคคลของไทย ซึ่งบังคับใช้กับเกือบทุกองค์กรที่เก็บข้อมูลลูกค้า</div>`,
      },
      {
        t: 'Lesson 2 — Threat Actors และ Threat Intelligence',
        h: `
<p>การรู้ว่า "ใครน่าจะมาโจมตีเรา" เปลี่ยนวิธีป้องกันทั้งหมด เพราะแต่ละกลุ่มมีทรัพยากรและเป้าหมายต่างกันมาก</p>
<table class="tbl">
<tr><th>Threat actor</th><th>ทรัพยากร</th><th>แรงจูงใจ</th><th>ป้องกันอย่างไร</th></tr>
<tr><td><b>Script kiddie</b></td><td>ต่ำ — ใช้เครื่องมือสำเร็จรูป</td><td>อยากลอง อยากอวด</td><td>patch ให้ทัน ปิดพอร์ตที่ไม่ใช้ ก็กันได้เกือบหมด</td></tr>
<tr><td><b>Hacktivist</b></td><td>ปานกลาง</td><td>อุดมการณ์ การเมือง</td><td>ป้องกันเว็บและ DDoS เตรียมแผนสื่อสาร</td></tr>
<tr><td><b>Organized crime</b></td><td>สูง มีเงินทุน</td><td><b>เงิน</b> — ransomware, ขโมยข้อมูลไปขาย</td><td>backup แบบ offline, MFA, EDR, ซ้อมกู้ระบบ</td></tr>
<tr><td><b>APT / Nation-state</b></td><td>สูงมาก อดทนนานเป็นปี</td><td>จารกรรม ก่อกวนโครงสร้างพื้นฐาน</td><td>ตรวจจับพฤติกรรม แบ่งวงย่อย ล่าภัยคุกคามเชิงรุก</td></tr>
<tr><td><b>Insider threat</b></td><td>รู้ระบบดีที่สุด <b>อยู่ข้างในแล้ว</b></td><td>แค้น เงิน หรือ<b>ความประมาท</b></td><td>least privilege, แยกหน้าที่, เฝ้าดู log ของบัญชีสิทธิ์สูง</td></tr>
<tr><td><b>Shadow IT</b></td><td>—</td><td>อยากทำงานให้เร็ว จึงเอาระบบนอกมาใช้เอง</td><td>ไม่ใช่คนร้าย แต่สร้างช่องโหว่จริง — แก้ด้วยการหาทางออกที่ใช้ง่ายให้เขา</td></tr>
</table>
<p><b>Attack vectors — ทางที่เขาเข้ามา</b></p>
<table class="tbl">
<tr><th>ช่องทาง</th><th>ตัวอย่างจริง</th></tr>
<tr><td><b>Email</b></td><td>ช่องทางอันดับหนึ่งเสมอ — phishing แนบไฟล์หรือลิงก์ปลอม</td></tr>
<tr><td><b>Remote / Wireless</b></td><td>RDP หรือ VPN ที่เปิดออกเน็ตโดยไม่มี MFA · rogue AP</td></tr>
<tr><td><b>Supply chain</b></td><td>ผู้ขายหรือซอฟต์แวร์ที่เราไว้ใจถูกเจาะ แล้วส่งของที่ฝังโค้ดร้ายมาให้</td></tr>
<tr><td><b>Removable media</b></td><td>USB ที่เก็บได้ในลานจอดรถ</td></tr>
<tr><td><b>Direct access</b></td><td>เดินเข้ามาเสียบสายในห้อง server ที่ไม่ได้ล็อก</td></tr>
<tr><td><b>Cloud</b></td><td>ตั้งค่า bucket เป็น public โดยไม่ตั้งใจ · API key หลุดใน git</td></tr>
</table>
<p><b>Threat Intelligence — ข้อมูลภัยคุกคามมาจากไหน</b></p>
<table class="tbl">
<tr><th>แหล่ง</th><th>ลักษณะ</th></tr>
<tr><td><b>OSINT</b></td><td>เปิดเผยและฟรี — บล็อกผู้ผลิต, CVE/NVD, MITRE ATT&amp;CK</td></tr>
<tr><td><b>Closed / Proprietary</b></td><td>ฟีดที่ต้องจ่ายเงิน ทันเหตุการณ์กว่าและมีบริบทมากกว่า</td></tr>
<tr><td><b>ISAC</b></td><td>ศูนย์แลกเปลี่ยนข้อมูลเฉพาะอุตสาหกรรม เช่น การเงิน สาธารณสุข</td></tr>
<tr><td><b>Dark web</b></td><td>ดูว่าข้อมูลองค์กรเราถูกเอาไปขายหรือยัง</td></tr>
</table>
<div class="note"><b>คำที่ต้องแยกให้ออก</b><br>
<b>IoC (Indicator of Compromise)</b> = ร่องรอยที่บอกว่า "โดนแล้ว" เช่น IP, hash ของไฟล์, ชื่อโดเมน C2 — เป็นข้อมูล<b>เชิงรับ</b> ใช้ตามหาย้อนหลัง<br>
<b>TTP (Tactics, Techniques, Procedures)</b> = วิธีทำงานของผู้โจมตี — เป็นข้อมูล<b>เชิงรุก</b> ที่ใช้ทำนายและวางกับดักดักไว้ล่วงหน้า<br>
<b>STIX / TAXII</b> = รูปแบบมาตรฐานและช่องทางที่ใช้แลกเปลี่ยนข้อมูลเหล่านี้ระหว่างองค์กรแบบอัตโนมัติ</div>`,
      },
      {
        t: 'Lesson 4 — Social Engineering และ Malware',
        h: `
<p>เทคนิคทุกอย่างของ social engineering ตั้งอยู่บนหลักจิตวิทยาไม่กี่ข้อ รู้หลักแล้วจะจับสังเกตได้เร็วขึ้นมาก</p>
<table class="tbl">
<tr><th>หลักที่เขาใช้</th><th>หน้าตาในชีวิตจริง</th></tr>
<tr><td><b>Authority</b></td><td>"ผมโทรจากฝ่ายไอที" หรืออ้างชื่อผู้บริหาร</td></tr>
<tr><td><b>Urgency</b> / <b>Scarcity</b></td><td>"ต้องทำภายใน 10 นาที ไม่งั้นบัญชีถูกระงับ"</td></tr>
<tr><td><b>Intimidation</b></td><td>ขู่ว่าจะมีความผิด จะโดนไล่ออก</td></tr>
<tr><td><b>Consensus</b></td><td>"แผนกอื่นเขาทำกันหมดแล้ว"</td></tr>
<tr><td><b>Familiarity</b> / <b>Trust</b></td><td>คุยเล่นให้สนิทก่อนแล้วค่อยขอ</td></tr>
</table>
<table class="tbl">
<tr><th>เทคนิค</th><th>คำอธิบาย</th></tr>
<tr><td><b>Phishing</b></td><td>เมลหว่านทั่วไป · <b>Spear phishing</b> เจาะจงคน · <b>Whaling</b> เจาะจงผู้บริหาร</td></tr>
<tr><td><b>Vishing / Smishing</b></td><td>ทางโทรศัพท์ / ทาง SMS — พบมากที่สุดในไทยตอนนี้</td></tr>
<tr><td><b>BEC</b></td><td>ปลอมเป็นผู้บริหารหรือคู่ค้า สั่งโอนเงินหรือเปลี่ยนเลขบัญชี — สร้างความเสียหายสูงสุดต่อเคส</td></tr>
<tr><td><b>Pharming</b></td><td>เปลี่ยนปลายทาง DNS ให้เข้าเว็บปลอมทั้งที่พิมพ์ชื่อถูก</td></tr>
<tr><td><b>Watering hole</b></td><td>เจาะเว็บที่กลุ่มเป้าหมายเข้าประจำ แล้วรอให้เหยื่อมาเอง</td></tr>
<tr><td><b>Typosquatting</b></td><td>จดโดเมนที่พิมพ์ผิดนิดเดียว เช่น <code>examp1e.com</code></td></tr>
<tr><td><b>Tailgating</b> / <b>Shoulder surfing</b> / <b>Dumpster diving</b></td><td>เดินตามเข้าประตู · แอบดูจอ · ค้นถังขยะหาเอกสาร</td></tr>
</table>
<p><b>ประเภทของ Malware — แยกตามวิธีแพร่และสิ่งที่มันทำ</b></p>
<table class="tbl">
<tr><th>ชนิด</th><th>ลักษณะเด่น</th></tr>
<tr><td><b>Virus</b></td><td>ต้องมีคนเปิดไฟล์ถึงจะทำงานและแพร่ต่อ</td></tr>
<tr><td><b>Worm</b></td><td><b>แพร่เองได้</b>ผ่านเครือข่ายโดยไม่ต้องมีคนทำอะไร</td></tr>
<tr><td><b>Trojan / RAT</b></td><td>ปลอมเป็นโปรแกรมดี — RAT เปิดทางให้ควบคุมเครื่องจากระยะไกล</td></tr>
<tr><td><b>Ransomware</b></td><td>เข้ารหัสไฟล์เรียกค่าไถ่ · รุ่นใหม่<b>ขโมยข้อมูลออกไปก่อน</b>แล้วขู่เปิดเผย (double extortion)</td></tr>
<tr><td><b>Spyware / Keylogger</b></td><td>แอบเก็บข้อมูลและสิ่งที่พิมพ์</td></tr>
<tr><td><b>Rootkit / Bootkit</b></td><td>ซ่อนตัวในระดับ kernel หรือ boot — <b>เครื่องมือปกติมองไม่เห็น</b> ต้องล้างเครื่องลงใหม่</td></tr>
<tr><td><b>Logic bomb</b></td><td>รอเงื่อนไข เช่น วันที่หนึ่ง หรือชื่อพนักงานหายจากระบบ แล้วค่อยทำงาน</td></tr>
<tr><td><b>Fileless</b></td><td>ทำงานในหน่วยความจำผ่าน PowerShell/WMI ไม่เขียนไฟล์ลงดิสก์ — antivirus แบบสแกนไฟล์จับไม่ได้</td></tr>
<tr><td><b>Cryptominer</b></td><td>ขุดเหรียญด้วย CPU ของเรา — อาการคือเครื่องร้อนและช้าตลอดเวลา</td></tr>
</table>
<div class="note warn"><b>สัญญาณที่ควรสงสัยบนเครื่อง Linux</b><br>
มี process กิน CPU สูงตลอดโดยอธิบายไม่ได้ · มี cron job หรือ systemd timer ที่ไม่มีใครสร้าง ·
มีบัญชีผู้ใช้ใหม่ใน <code>/etc/passwd</code> · มีการเชื่อมต่อขาออกไป IP แปลกเป็นจังหวะสม่ำเสมอ (<b>beaconing</b>) ·
ไฟล์ SUID เพิ่มขึ้นมาโดยไม่มีที่มา · log ถูกลบหรือขาดช่วง<br>
หลักการจำง่าย ๆ: <b>สิ่งที่น่าสงสัยคือสิ่งที่อธิบายไม่ได้</b> ไม่ใช่สิ่งที่ดูแปลก</div>`,
      },
    ],

    quiz: [
      { type: 'mcq', q: 'กล้องวงจรปิดจัดเป็น security control ประเภทใดตามหน้าที่', opts: ['Preventive อย่างเดียว', 'Detective เป็นหลัก และเป็น Deterrent ด้วย', 'Corrective', 'Compensating'], a: 1, why: 'กล้องไม่ได้ห้ามใครเข้ามา (ไม่ใช่ preventive) แต่บันทึกไว้ให้รู้ว่าเกิดอะไรขึ้น (detective) และการที่คนเห็นว่ามีกล้องก็ทำให้ไม่กล้าทำ (deterrent)' },
      { type: 'mcq', q: 'เครื่องเก่าที่ patch ไม่ได้แล้ว จึงแยกวงและเฝ้าดูเป็นพิเศษแทน — นี่คือ control ประเภทใด', opts: ['Preventive', 'Compensating', 'Directive', 'Detective'], a: 1, why: 'Compensating control คือมาตรการทดแทนเมื่อทำมาตรการที่ควรทำจริง ๆ ไม่ได้ — เป็นคำตอบที่เจอบ่อยในงานจริงกับระบบ OT, SCADA และกล้องวงจรปิดรุ่นเก่า' },
      { type: 'mcq', q: 'การอบรมพนักงานเรื่อง phishing จัดเป็น control ประเภทใดตามผู้บังคับใช้', opts: ['Technical', 'Operational', 'Physical', 'Managerial'], a: 1, why: 'Operational control คือมาตรการที่ "คน" เป็นผู้ปฏิบัติ ต่างจาก technical ที่ระบบบังคับใช้เอง และ managerial ที่เป็นการวางแผน/นโยบาย' },
      { type: 'mcq', q: 'Threat actor ประเภทใดที่อันตรายเพราะ "อยู่ข้างในและรู้ระบบดีที่สุด"', opts: ['Script kiddie', 'Hacktivist', 'Insider threat', 'Nation-state'], a: 2, why: 'Insider ไม่ต้องเจาะเข้ามาเพราะมีสิทธิ์อยู่แล้ว และจำนวนมากไม่ได้เจตนาร้ายแต่เกิดจากความประมาท — ป้องกันด้วย least privilege, แยกหน้าที่ และเฝ้าดู log ของบัญชีสิทธิ์สูง' },
      { type: 'mcq', q: 'IoC ต่างจาก TTP อย่างไร', opts: ['เหมือนกัน', 'IoC คือร่องรอยที่ใช้ตามหาย้อนหลัง ส่วน TTP คือวิธีทำงานของผู้โจมตีที่ใช้ทำนายล่วงหน้าได้', 'IoC ใช้กับ malware ส่วน TTP ใช้กับ phishing', 'TTP เป็นรูปแบบไฟล์'], a: 1, why: 'IoC (IP, hash, โดเมน) เปลี่ยนได้ง่ายมาก ผู้โจมตีแค่เปลี่ยนเซิร์ฟเวอร์ก็หมดค่า แต่ TTP เปลี่ยนยากกว่าจึงมีค่าในการป้องกันเชิงรุกมากกว่า' },
      { type: 'mcq', q: 'ความต่างหลักระหว่าง virus กับ worm คือข้อใด', opts: ['virus ทำลายไฟล์ worm ไม่ทำลาย', 'worm แพร่กระจายเองได้โดยไม่ต้องมีคนเปิดไฟล์', 'virus ใช้กับ Windows worm ใช้กับ Linux', 'ไม่ต่างกัน'], a: 1, why: 'worm ใช้ช่องโหว่บนเครือข่ายแพร่ตัวเองได้อัตโนมัติ จึงกระจายเร็วกว่ามาก ส่วน virus ต้องอาศัยการกระทำของผู้ใช้เป็นตัวจุดชนวน' },
      { type: 'mcq', q: 'มัลแวร์ที่ทำงานในหน่วยความจำผ่าน PowerShell โดยไม่เขียนไฟล์ลงดิสก์เรียกว่าอะไร', opts: ['Rootkit', 'Fileless malware', 'Logic bomb', 'Worm'], a: 1, why: 'Fileless malware ไม่มีไฟล์ให้สแกน antivirus แบบดั้งเดิมจึงจับไม่ได้ ต้องอาศัย EDR ที่ดูพฤติกรรมของ process แทน' },
      { type: 'cmd', q: 'พิมพ์คำสั่งค้นหาไฟล์ SUID ทั้งระบบ (ช่องทางยกระดับสิทธิ์ที่ผู้โจมตีชอบใช้)', ans: ['find / -perm -4000 -type f', 'sudo find / -perm -4000 -type f', 'find / -perm -4000'], why: 'ไฟล์ SUID รันด้วยสิทธิ์เจ้าของไฟล์ (มักเป็น root) การมีไฟล์ SUID เพิ่มขึ้นมาโดยไม่มีที่มาคือสัญญาณของ backdoor ที่ชัดเจนมาก' },
      { type: 'mcq', q: 'BEC (Business Email Compromise) คืออะไร', opts: ['ไวรัสที่แพร่ทางเมล', 'การปลอมเป็นผู้บริหารหรือคู่ค้าเพื่อสั่งโอนเงินหรือเปลี่ยนเลขบัญชี', 'การส่งสแปมจำนวนมาก', 'การเจาะเซิร์ฟเวอร์เมล'], a: 1, why: 'BEC มักไม่มีมัลแวร์เลย ใช้แค่การหลอกด้วยข้อความ จึงผ่าน antivirus ได้หมด — ป้องกันด้วยกระบวนการยืนยันทางช่องทางที่สอง ก่อนโอนเงินหรือเปลี่ยนเลขบัญชีทุกครั้ง' },
      { type: 'multi', q: 'ข้อใดเป็นสัญญาณที่ควรสงสัยว่าเครื่องถูกฝัง malware (เลือกทุกข้อที่ถูก)', opts: ['มี cron job ที่ไม่มีใครรู้จัก', 'มีการเชื่อมต่อขาออกไป IP แปลกเป็นจังหวะสม่ำเสมอ', 'CPU สูงตอนรัน backup ตามตารางทุกคืน', 'มีผู้ใช้ใหม่ใน /etc/passwd ที่ไม่มีใครสร้าง'], a: [0, 1, 3], why: 'การเชื่อมต่อออกเป็นจังหวะคือ beaconing ไปหา C2 ส่วน CPU สูงตอนรัน backup ตามกำหนดเป็นพฤติกรรมที่อธิบายได้ — หลักคือสงสัยสิ่งที่อธิบายไม่ได้' },
    ],

    labs: [{
      id: 'cy-sp-l1',
      title: 'Security+ Lab 1 — คัดกรองเครื่องต้องสงสัยหาร่องรอยการบุกรุก',
      brief: 'ผู้ใช้แจ้งว่าเครื่องเซิร์ฟเวอร์ตัวหนึ่งช้าผิดปกติมาสองวัน คุณต้องไล่หาร่องรอยตามลำดับที่ผู้โจมตีมักทิ้งไว้ — บัญชีที่เพิ่มมา กลไกฝังตัว การเชื่อมต่อขาออก และช่องยกระดับสิทธิ์',
      device: 'linux-sec',
      tasks: [
        { t: 'ดูว่าเราทำงานด้วยสิทธิ์อะไรอยู่', hint: 'id', check: (s, h) => said(h, /^(sudo\s+)?id\s*$/i) },
        { t: 'ดูรายชื่อผู้ใช้ทั้งหมด หาบัญชีที่ไม่ควรมี', hint: 'cat /etc/passwd', check: (s, h) => said(h, /passwd/i) },
        { t: 'ดูประวัติการล็อกอินที่สำเร็จ', hint: 'last', check: (s, h) => said(h, /^last\s*$/i) },
        { t: 'ดู process ที่กำลังทำงานอยู่ หาตัวที่กิน CPU ผิดปกติ', hint: 'ps aux', check: (s, h) => said(h, /^ps\s/i) },
        { t: 'ดูพอร์ตที่เปิดฟังอยู่และ process ที่เป็นเจ้าของ', hint: 'ss -tulpn', check: (s, h) => said(h, /ss\s+-\w*t\w*u\w*|ss\s+-tulpn/i) },
        { t: 'ตรวจ cron job ว่ามีอะไรถูกตั้งไว้ให้รันอัตโนมัติ', hint: 'crontab -l', check: (s, h) => said(h, /crontab\s+-l/i) },
        { t: 'ค้นหาไฟล์ SUID ทั้งระบบ — ช่องยกระดับสิทธิ์ยอดนิยม', hint: 'find / -perm -4000 -type f', check: (s, h) => said(h, /find.*-perm.*4000/i) },
        { t: 'ตรวจสอบความสมบูรณ์ของไฟล์ระบบด้วย AIDE', hint: 'aide --check', check: (s, h) => said(h, /aide/i) },
        { t: 'สแกนหา rootkit', hint: 'rkhunter --check', check: (s, h) => said(h, /rkhunter/i) },
        { t: 'ดู log ของ service ssh ย้อนหลังวันนี้', hint: 'journalctl -u ssh --since today', check: (s, h) => said(h, /journalctl.*ssh/i) },
      ],
    }],
  },

  // ================================================================
  //  ระดับ 2 — Lesson 5, 6, 7, 8, 12, 13
  // ================================================================
  2: {
    sections: [
      {
        t: 'Lesson 5 — Cryptographic Concepts',
        h: `
<p>การเข้ารหัสมีสองตระกูลใหญ่ และเกือบทุกระบบจริงใช้<b>ทั้งสองอย่างร่วมกัน</b></p>
<table class="tbl">
<tr><th></th><th>Symmetric</th><th>Asymmetric</th></tr>
<tr><td>กุญแจ</td><td>ดอกเดียว ใช้ทั้งเข้าและถอด</td><td>คู่กุญแจ — public / private</td></tr>
<tr><td>ความเร็ว</td><td><b>เร็วมาก</b></td><td>ช้ากว่าหลายเท่า</td></tr>
<tr><td>ปัญหาหลัก</td><td><b>จะส่งกุญแจให้กันอย่างไรอย่างปลอดภัย</b></td><td>ช้าเกินกว่าจะเข้ารหัสข้อมูลก้อนใหญ่</td></tr>
<tr><td>ตัวอย่าง</td><td>AES-256, ChaCha20</td><td>RSA, ECC (ECDSA/ECDH)</td></tr>
<tr><td>ใช้ทำอะไร</td><td>เข้ารหัสข้อมูลจริง ๆ</td><td>แลกกุญแจ และลงลายเซ็นดิจิทัล</td></tr>
</table>
<div class="note"><b>TLS ทำงานอย่างไร — คำตอบที่รวบทุกอย่างไว้</b><br>
ใช้ <b>asymmetric</b> ตอนเริ่มต้นเพื่อยืนยันตัวตนและตกลงกุญแจลับร่วมกัน (ECDHE)
แล้วสลับไปใช้ <b>symmetric</b> (AES-GCM) สำหรับข้อมูลจริงทั้งหมด — ได้ทั้งความปลอดภัยและความเร็ว<br>
<b>Perfect Forward Secrecy</b> คือการสร้างกุญแจใหม่ทุก session ทำให้ต่อให้ private key ของเซิร์ฟเวอร์หลุดในอนาคต
ก็ถอดรหัสการสนทนาที่ดักเก็บไว้ในอดีตไม่ได้</div>
<p><b>Hashing — ทางเดียว ย้อนกลับไม่ได้</b></p>
<table class="tbl">
<tr><th>อัลกอริทึม</th><th>สถานะ</th></tr>
<tr><td>MD5, SHA-1</td><td><b>แตกแล้ว</b> — สร้าง collision ได้ ห้ามใช้กับงานความปลอดภัย</td></tr>
<tr><td>SHA-256 / SHA-3</td><td>ใช้ได้ — มาตรฐานปัจจุบันสำหรับตรวจความสมบูรณ์และลายเซ็น</td></tr>
<tr><td>bcrypt / scrypt / Argon2 / PBKDF2</td><td><b>สำหรับรหัสผ่านโดยเฉพาะ</b> — ออกแบบให้ช้าโดยตั้งใจ เพื่อให้เดาทีละล้านครั้งไม่คุ้ม</td></tr>
<tr><td>HMAC</td><td>hash + กุญแจลับ — ยืนยันทั้งความสมบูรณ์<b>และ</b>ตัวตนผู้ส่ง</td></tr>
</table>
<p><b>Modes of operation</b> — อัลกอริทึมเดียวกันแต่โหมดต่างกันให้ผลลัพธ์ด้านความปลอดภัยต่างกันมาก</p>
<table class="tbl">
<tr><th>โหมด</th><th>ลักษณะ</th></tr>
<tr><td><b>ECB</b></td><td><b>ห้ามใช้</b> — ข้อมูลเหมือนกันให้ผลเหมือนกัน ทำให้เห็นรูปแบบของข้อมูลต้นฉบับ</td></tr>
<tr><td><b>CBC</b></td><td>ต่อบล็อกกันไปเรื่อย ต้องมี IV สุ่ม — ปลอดภัยขึ้นแต่ไม่มีการตรวจความสมบูรณ์ในตัว</td></tr>
<tr><td><b>CTR</b></td><td>แปลง block cipher เป็น stream ทำขนานได้ เร็ว</td></tr>
<tr><td><b>GCM</b> (AEAD)</td><td><b>ตัวเลือกที่ควรใช้</b> — เข้ารหัส<b>และ</b>ตรวจว่าข้อมูลถูกแก้ไขหรือไม่ในขั้นตอนเดียว</td></tr>
</table>
<pre class="code"><span style="color:#5b6b8c"># คำนวณ hash เพื่อยืนยันว่าไฟล์ไม่ถูกแก้</span>
sha256sum /etc/passwd
openssl sha256 /etc/passwd

<span style="color:#5b6b8c"># สร้างค่าสุ่มที่ใช้เป็นกุญแจหรือ salt ได้</span>
openssl rand -hex 32</pre>
<div class="note warn"><b>จุดอ่อนที่ต้องระวัง</b> — <b>entropy ต่ำ</b> ทำให้กุญแจเดาได้ (อุปกรณ์ IoT ที่สร้างกุญแจตอนบูตครั้งแรกมีปัญหานี้บ่อย) ·
<b>downgrade attack</b> หลอกให้คุยด้วยโปรโตคอลเก่าที่อ่อนกว่า ·
<b>key length</b> สั้นเกินไป · <b>อุปกรณ์ประมวลผลต่ำ</b> อย่างเซ็นเซอร์อาจรับ RSA ไม่ไหว ต้องใช้ ECC ที่กุญแจสั้นกว่าแต่แข็งเท่ากัน</div>`,
      },
      {
        t: 'Lesson 6 — Public Key Infrastructure (PKI)',
        h: `
<p>PKI คือระบบที่ตอบคำถามว่า "public key นี้เป็นของคนที่อ้างจริงหรือเปล่า" โดยมี <b>CA (Certificate Authority)</b> เป็นคนกลางที่ทุกฝ่ายไว้ใจ</p>
<table class="tbl">
<tr><th>ชั้น</th><th>หน้าที่</th></tr>
<tr><td><b>Root CA</b></td><td>ต้นทางความไว้วางใจ — ควรเก็บ <b>offline</b> ตัดขาดจากเครือข่ายจริง ๆ</td></tr>
<tr><td><b>Intermediate CA</b></td><td>ตัวที่ออกใบรับรองจริงในแต่ละวัน ถ้าถูกเจาะก็เพิกถอนเฉพาะชั้นนี้ได้โดยไม่ล้ม root</td></tr>
<tr><td><b>RA</b></td><td>ผู้ตรวจสอบตัวตนก่อนออกใบรับรอง</td></tr>
</table>
<p><b>ขั้นตอนขอใบรับรอง</b> — สร้างคู่กุญแจ → สร้าง <b>CSR</b> (มี public key + ข้อมูลองค์กร) → ส่งให้ CA → CA ตรวจแล้วเซ็นกลับมาเป็น certificate
<br><b>private key ไม่เคยออกจากเครื่องเรา</b> ตลอดกระบวนการ — ถ้ามีใครขอ private key ให้สงสัยไว้ก่อน</p>
<table class="tbl">
<tr><th>ชนิดใบรับรอง</th><th>ใช้ตอนไหน</th></tr>
<tr><td><b>DV / OV / EV</b></td><td>ตรวจแค่ว่าคุมโดเมนจริง / ตรวจถึงตัวองค์กร / ตรวจเข้มที่สุด</td></tr>
<tr><td><b>Wildcard</b> (<code>*.example.com</code>)</td><td>ครอบทุก subdomain — สะดวกแต่ถ้าหลุดก็หลุดทั้งหมด</td></tr>
<tr><td><b>SAN</b></td><td>ใบเดียวครอบหลายชื่อที่ระบุไว้ — ปลอดภัยกว่า wildcard</td></tr>
<tr><td><b>Code signing</b></td><td>เซ็นโปรแกรมเพื่อยืนยันว่าใครสร้างและไม่ถูกแก้ระหว่างทาง</td></tr>
<tr><td><b>Machine / User</b></td><td>ยืนยันตัวตนเครื่องหรือคนแทนรหัสผ่าน เช่นใน 802.1X</td></tr>
</table>
<p><b>การเพิกถอน</b> — เมื่อ private key หลุดหรือเลิกใช้</p>
<table class="tbl">
<tr><th>กลไก</th><th>ทำงานอย่างไร</th><th>ข้อจำกัด</th></tr>
<tr><td><b>CRL</b></td><td>รายชื่อใบที่ถูกเพิกถอน ดาวน์โหลดมาทั้งก้อน</td><td>ไฟล์ใหญ่และอัปเดตช้า</td></tr>
<tr><td><b>OCSP</b></td><td>ถาม CA ทีละใบแบบเรียลไทม์</td><td>ช้าและเปิดเผยว่าผู้ใช้เข้าเว็บไหน</td></tr>
<tr><td><b>OCSP Stapling</b></td><td><b>เซิร์ฟเวอร์</b>ถาม CA มาล่วงหน้าแล้วแนบคำตอบมาให้เลย</td><td>ทางเลือกที่ดีที่สุดในปัจจุบัน</td></tr>
</table>
<pre class="code"><span style="color:#5b6b8c"># ดูรายละเอียดใบรับรอง — ออกให้ใคร ใครเซ็น หมดอายุเมื่อไหร่</span>
openssl x509 -in /etc/ssl/cert.pem -noout -text

<span style="color:#5b6b8c"># ตรวจใบรับรองของเว็บปลายทางจริง ๆ</span>
openssl s_client -connect example.com:443</pre>
<div class="note warn"><b>Key escrow กับ HSM</b> — key escrow คือการฝากสำเนากุญแจไว้กับบุคคลที่สาม เผื่อกู้ข้อมูลได้เมื่อจำเป็น
แต่ก็แปลว่ามีอีกคนที่ถอดรหัสข้อมูลเราได้ · <b>HSM</b> คืออุปกรณ์ฮาร์ดแวร์ที่เก็บกุญแจโดยที่กุญแจ<b>ไม่มีวันออกมาจากตัวมัน</b>
เป็นมาตรฐานสำหรับ root CA และระบบที่ต้องผ่าน PCI DSS</div>`,
      },
      {
        t: 'Lesson 7 — Authentication Controls',
        h: `
<p><b>AAA</b> — Authentication (คุณเป็นใคร) → Authorization (ทำอะไรได้) → Accounting (บันทึกว่าทำอะไรไป) เรียงลำดับนี้เสมอ</p>
<table class="tbl">
<tr><th>ปัจจัย</th><th>คืออะไร</th><th>ตัวอย่าง</th></tr>
<tr><td><b>Something you know</b></td><td>สิ่งที่รู้</td><td>รหัสผ่าน, PIN, คำถามกู้คืน</td></tr>
<tr><td><b>Something you have</b></td><td>สิ่งที่มี</td><td>โทรศัพท์, security key, smart card</td></tr>
<tr><td><b>Something you are</b></td><td>สิ่งที่เป็น</td><td>ลายนิ้วมือ, ใบหน้า, ม่านตา</td></tr>
<tr><td><i>Somewhere you are</i></td><td>ที่อยู่</td><td>IP, GPS, geofencing</td></tr>
<tr><td><i>Something you do</i></td><td>พฤติกรรม</td><td>จังหวะการพิมพ์, ลายเซ็น</td></tr>
</table>
<div class="note"><b>MFA ที่แท้จริงต้องมาจาก "คนละปัจจัย"</b> — รหัสผ่าน + คำถามกู้คืน ยังเป็น <b>ปัจจัยเดียว</b> (สิ่งที่รู้ทั้งคู่) ไม่ใช่ MFA<br>
ระดับความแข็งแรงของปัจจัยที่สอง: <b>SMS OTP</b> (อ่อนสุด — ถูก SIM swap ได้) &lt;
<b>TOTP ในแอป</b> &lt; <b>push notification ที่มี number matching</b> &lt; <b>FIDO2 / security key</b> (แข็งสุด — กัน phishing ได้จริงเพราะผูกกับโดเมน)</div>
<p><b>Knowledge-based — เก็บรหัสผ่านอย่างไรให้ถูก</b></p>
<pre class="code"><span style="color:#5b6b8c"># รหัสผ่านที่แฮชแล้วเก็บใน /etc/shadow ไม่ใช่ /etc/passwd</span>
sudo cat /etc/shadow
<span style="color:#5b6b8c"># รูปแบบ:  user:$6$salt$hash:lastchange:min:max:warn:...</span>
<span style="color:#5b6b8c">#          $6$ = SHA-512, $y$ = yescrypt, $2b$ = bcrypt</span>

<span style="color:#5b6b8c"># ตรวจอายุรหัสผ่านของผู้ใช้</span>
chage -l analyst</pre>
<p><b>เทคโนโลยียืนยันตัวตน</b></p>
<table class="tbl">
<tr><th>ระบบ</th><th>ใช้ที่ไหน</th></tr>
<tr><td><b>Kerberos</b></td><td>Active Directory — ใช้ ticket แทนการส่งรหัสผ่านไปมา ทำ SSO ได้</td></tr>
<tr><td><b>RADIUS / TACACS+</b></td><td>ยืนยันตัวตนสำหรับอุปกรณ์เครือข่ายและ 802.1X — TACACS+ เข้ารหัสทั้งแพ็กเก็ตและแยก AAA ออกจากกันได้</td></tr>
<tr><td><b>SAML</b></td><td>SSO ระหว่างองค์กรกับ SaaS — ใช้ XML</td></tr>
<tr><td><b>OAuth 2.0 / OIDC</b></td><td>OAuth = <b>มอบสิทธิ์</b> (authorization) · OIDC = ชั้นยืนยันตัวตนที่ต่อยอดบน OAuth</td></tr>
<tr><td><b>802.1X</b></td><td>ยืนยันตัวตนก่อนได้รับอนุญาตให้ใช้พอร์ตเครือข่าย — ทั้งสายและไร้สาย</td></tr>
</table>
<p><b>Biometrics</b> — ค่าที่ต้องอ่านเป็น</p>
<table class="tbl">
<tr><th>ค่า</th><th>ความหมาย</th><th>ผลถ้าสูง</th></tr>
<tr><td><b>FAR</b> (False Acceptance)</td><td>ยอมรับคนผิด</td><td><b>อันตรายที่สุด</b> — คนแปลกหน้าเข้าได้</td></tr>
<tr><td><b>FRR</b> (False Rejection)</td><td>ปฏิเสธคนถูก</td><td>น่ารำคาญ ผู้ใช้เลิกใช้</td></tr>
<tr><td><b>CER</b> (Crossover Error Rate)</td><td>จุดที่ FAR = FRR</td><td><b>ยิ่งต่ำยิ่งดี</b> — ใช้เปรียบเทียบระบบต่างยี่ห้อ</td></tr>
</table>`,
      },
      {
        t: 'Lesson 8 — Identity and Account Management',
        h: `
<table class="tbl">
<tr><th>ประเภทบัญชี</th><th>ควรตั้งค่าอย่างไร</th></tr>
<tr><td><b>User</b></td><td>หนึ่งคนหนึ่งบัญชี ให้สิทธิ์ผ่านกลุ่ม ไม่ให้รายคน</td></tr>
<tr><td><b>Privileged / Admin</b></td><td>แยกจากบัญชีใช้งานประจำวัน ใช้เฉพาะตอนต้องใช้ และเฝ้าดู log ทุกครั้ง</td></tr>
<tr><td><b>Service account</b></td><td><b>ห้ามล็อกอินแบบ interactive</b> (<code>/usr/sbin/nologin</code>) รหัสผ่านยาวสุ่ม และหมุนเวียนตามรอบ</td></tr>
<tr><td><b>Shared account</b></td><td><b>หลีกเลี่ยงให้ได้มากที่สุด</b> — เพราะสืบไม่ได้ว่าใครทำ ทำลาย accountability ทั้งระบบ</td></tr>
<tr><td><b>Guest</b></td><td>ปิดไว้ ถ้าไม่ได้ใช้จริง ๆ</td></tr>
</table>
<pre class="code"><span style="color:#5b6b8c"># บังคับให้เปลี่ยนรหัสทุก 90 วัน เตือนล่วงหน้า 7 วัน</span>
sudo chage -M 90 -W 7 somchai

<span style="color:#5b6b8c"># ล็อกบัญชีทันทีเมื่อพนักงานลาออก (ยังไม่ลบ เพราะอาจต้องใช้สืบสวน)</span>
sudo usermod -L somchai
sudo chage -E 0 somchai

<span style="color:#5b6b8c"># service account ต้องล็อกอินไม่ได้</span>
sudo usermod -s /usr/sbin/nologin backup-svc</pre>
<p><b>Authorization models</b></p>
<table class="tbl">
<tr><th>โมเดล</th><th>ใครเป็นคนกำหนดสิทธิ์</th><th>ใช้ที่ไหน</th></tr>
<tr><td><b>DAC</b></td><td>เจ้าของไฟล์กำหนดเอง</td><td>สิทธิ์ไฟล์ Linux/Windows ทั่วไป</td></tr>
<tr><td><b>MAC</b></td><td>ระบบกำหนดตามระดับชั้นความลับ เจ้าของแก้ไม่ได้</td><td>SELinux, AppArmor, ระบบทหาร</td></tr>
<tr><td><b>RBAC</b></td><td>ตามบทบาทหน้าที่</td><td><b>ที่ใช้กันมากที่สุดในองค์กร</b> — ให้สิทธิ์กับกลุ่ม ไม่ใช่รายคน</td></tr>
<tr><td><b>ABAC</b></td><td>ตามคุณลักษณะหลายอย่างรวมกัน (แผนก + เวลา + สถานที่ + อุปกรณ์)</td><td>Zero Trust, cloud IAM</td></tr>
</table>
<div class="note"><b>หลักการที่ต้องใช้ควบคู่กันเสมอ</b><br>
<b>Least Privilege</b> ให้เท่าที่จำเป็น · <b>Separation of Duties</b> คนขอกับคนอนุมัติต้องคนละคน ·
<b>Job Rotation</b> และ <b>Mandatory Vacation</b> — บังคับให้หยุดยาวเพื่อให้คนอื่นมาทำแทน เป็นวิธีคลาสสิกที่ทำให้การทุจริตระยะยาวถูกเปิดโปง ·
<b>Onboarding / Offboarding</b> ต้องมี checklist ที่ตรวจสอบได้ — บัญชีของคนที่ลาออกแล้วแต่ยังใช้งานได้ คือช่องโหว่ที่พบบ่อยที่สุดในการตรวจสอบ</div>`,
      },
      {
        t: 'Lesson 12 — Host Security และระบบฝังตัว',
        h: `
<p><b>Secure firmware — ความไว้วางใจต้องเริ่มตั้งแต่ก่อน OS ทำงาน</b></p>
<table class="tbl">
<tr><th>กลไก</th><th>ทำอะไร</th></tr>
<tr><td><b>UEFI Secure Boot</b></td><td>ยอมให้บูตเฉพาะโค้ดที่มีลายเซ็นที่เชื่อถือได้ — กัน bootkit</td></tr>
<tr><td><b>Measured boot</b></td><td>วัดค่า hash ของทุกขั้นตอนการบูตเก็บไว้ใน TPM</td></tr>
<tr><td><b>TPM</b></td><td>ชิปเก็บกุญแจและค่าวัด — เป็นฐานของ BitLocker และ LUKS ที่ปลดล็อกอัตโนมัติ</td></tr>
<tr><td><b>Attestation</b></td><td>ให้เครื่องพิสูจน์ต่อระบบส่วนกลางว่าตัวเองยังอยู่ในสภาพที่เชื่อถือได้</td></tr>
</table>
<p><b>Endpoint security — ชั้นป้องกันบนเครื่อง</b></p>
<table class="tbl">
<tr><th>มาตรการ</th><th>รายละเอียด</th></tr>
<tr><td><b>EDR</b></td><td>ดู<b>พฤติกรรม</b>ไม่ใช่แค่ลายเซ็นไฟล์ จับ fileless และ ransomware ได้ พร้อมย้อนดูเส้นทางการโจมตี</td></tr>
<tr><td><b>HIDS / HIPS</b></td><td>ตรวจจับ / ขัดขวางบนเครื่อง เช่น AIDE ที่ตรวจว่าไฟล์ระบบถูกแก้</td></tr>
<tr><td><b>Host firewall</b></td><td>ปิดพอร์ตที่ไม่ใช้บนเครื่องเอง ไม่พึ่ง firewall ขอบเครือข่ายอย่างเดียว</td></tr>
<tr><td><b>Application allowlisting</b></td><td>อนุญาตเฉพาะโปรแกรมที่อยู่ในรายการ — ได้ผลสูงมากแต่ดูแลยาก เหมาะกับเครื่องที่ทำงานเฉพาะทาง</td></tr>
<tr><td><b>Full disk encryption</b></td><td>LUKS / BitLocker — ป้องกัน<b>ตอนเครื่องถูกขโมย</b> ไม่ได้ป้องกันตอนเครื่องเปิดอยู่</td></tr>
<tr><td><b>Hardening baseline</b></td><td>ตั้งค่าตามมาตรฐาน เช่น CIS Benchmark แล้วตรวจซ้ำเป็นรอบ</td></tr>
</table>
<pre class="code"><span style="color:#5b6b8c"># ตรวจสถานะ MAC ของระบบ</span>
getenforce

<span style="color:#5b6b8c"># ตรวจ baseline ทั้งเครื่องแล้วได้คะแนนพร้อมข้อเสนอแนะ</span>
sudo lynis audit system

<span style="color:#5b6b8c"># ดูว่า host firewall เปิดอะไรไว้บ้าง</span>
sudo ufw status verbose</pre>
<div class="note warn"><b>Embedded / OT / IoT — ข้อจำกัดที่เปลี่ยนวิธีป้องกันทั้งหมด</b><br>
กล้องวงจรปิด, เครื่องอ่านบัตร, PLC, SCADA และอุปกรณ์ในสายการผลิต มักมีปัญหาร่วมกันคือ
<b>patch ไม่ได้</b> (ผู้ผลิตเลิกซัพพอร์ตแล้ว) · <b>รหัสผ่านโรงงานที่เปลี่ยนไม่ได้</b> · <b>ใช้โปรโตคอลที่ไม่มีการเข้ารหัส</b> · <b>ห้ามหยุดทำงาน</b><br>
เมื่อ patch ไม่ได้ ทางแก้คือ <b>compensating control</b>: แยกวง (network segmentation) ให้อยู่ VLAN ของตัวเอง ·
ห้ามออกอินเทอร์เน็ตโดยตรง · จำกัดว่าใครคุยกับมันได้บ้าง · และเฝ้าดู traffic ของมันเป็นพิเศษ</div>`,
      },
      {
        t: 'Lesson 13 — Secure Mobile Solutions',
        h: `
<table class="tbl">
<tr><th>รูปแบบ</th><th>ใครเป็นเจ้าของเครื่อง</th><th>ข้อดี / ข้อเสีย</th></tr>
<tr><td><b>BYOD</b></td><td>พนักงาน</td><td>ประหยัดที่สุด แต่<b>ควบคุมยากที่สุด</b> และมีประเด็นความเป็นส่วนตัว</td></tr>
<tr><td><b>COPE</b></td><td>องค์กร แต่ให้ใช้ส่วนตัวได้</td><td>สมดุลที่สุด — ควบคุมได้และพนักงานยอมรับ</td></tr>
<tr><td><b>CYOD</b></td><td>องค์กร เลือกจากรายการที่กำหนด</td><td>จำกัดรุ่นให้ดูแลง่าย</td></tr>
<tr><td><b>COBO</b></td><td>องค์กร ใช้งานเฉพาะกิจ</td><td>คุมเข้มสุด เช่น เครื่องสแกนในคลังสินค้า</td></tr>
</table>
<table class="tbl">
<tr><th>เครื่องมือ</th><th>ควบคุมอะไร</th></tr>
<tr><td><b>MDM</b></td><td>ทั้งเครื่อง — บังคับล็อกหน้าจอ เข้ารหัส และ <b>remote wipe</b></td></tr>
<tr><td><b>MAM</b></td><td>เฉพาะแอปขององค์กร — เหมาะกับ BYOD เพราะไม่ไปยุ่งกับข้อมูลส่วนตัว</td></tr>
<tr><td><b>Containerization</b></td><td>แยกพื้นที่งานออกจากพื้นที่ส่วนตัวบนเครื่องเดียวกัน ลบได้เฉพาะฝั่งงาน</td></tr>
<tr><td><b>UEM</b></td><td>รวมการจัดการทุกอุปกรณ์ทั้งมือถือและคอมพิวเตอร์ไว้ที่เดียว</td></tr>
</table>
<table class="tbl">
<tr><th>ความเสี่ยง</th><th>รายละเอียด</th></tr>
<tr><td><b>Jailbreak / Root</b></td><td>ปลดการป้องกันของ OS ออก — MDM ต้องตรวจจับและบล็อกไม่ให้เข้าระบบองค์กร</td></tr>
<tr><td><b>Sideloading</b></td><td>ติดตั้งแอปนอกสโตร์ ซึ่งไม่ผ่านการตรวจสอบใด ๆ</td></tr>
<tr><td><b>Wi-Fi สาธารณะ / Evil twin</b></td><td>AP ปลอมที่ตั้งชื่อเหมือนของจริง — บังคับใช้ VPN เสมอเมื่ออยู่นอกออฟฟิศ</td></tr>
<tr><td><b>Bluetooth / NFC</b></td><td>bluejacking, bluesnarfing และการอ่านบัตรระยะใกล้ — ปิดเมื่อไม่ใช้</td></tr>
<tr><td><b>USB tethering / OTG</b></td><td>ใช้มือถือเป็นทางออกเน็ตเลี่ยง firewall ขององค์กร</td></tr>
</table>
<div class="note"><b>สิ่งที่ควรบังคับเป็นอย่างน้อย</b> — ล็อกหน้าจอด้วย PIN/biometric · เข้ารหัสอุปกรณ์ · remote wipe ได้ ·
ห้ามเครื่องที่ root/jailbreak เข้าระบบ · แยก container สำหรับข้อมูลงาน · และมี<b>นโยบายที่พนักงานเซ็นรับทราบ</b>ว่าองค์กรลบข้อมูลฝั่งงานได้เมื่อลาออก</div>`,
      },
    ],

    quiz: [
      { type: 'mcq', q: 'ทำไม TLS จึงใช้ทั้ง asymmetric และ symmetric', opts: ['เพื่อความเข้ากันได้กับเบราว์เซอร์เก่า', 'ใช้ asymmetric ตกลงกุญแจตอนเริ่ม แล้วใช้ symmetric ที่เร็วกว่ากับข้อมูลจริง', 'เพราะ symmetric ไม่ปลอดภัยพอ', 'เป็นข้อบังคับของกฎหมาย'], a: 1, why: 'asymmetric แก้ปัญหาการส่งกุญแจและยืนยันตัวตนได้ แต่ช้าเกินกว่าจะเข้ารหัสข้อมูลทั้งหมด จึงใช้แค่ตอน handshake แล้วสลับไป AES ซึ่งเร็วกว่าหลายเท่า' },
      { type: 'mcq', q: 'โหมดการเข้ารหัสใดที่ไม่ควรใช้เพราะเผยรูปแบบของข้อมูลต้นฉบับ', opts: ['CBC', 'GCM', 'ECB', 'CTR'], a: 2, why: 'ECB เข้ารหัสแต่ละบล็อกแยกกันด้วยกุญแจเดียว ข้อมูลที่เหมือนกันจึงให้ผลลัพธ์เหมือนกัน ทำให้ยังมองเห็นโครงร่างของข้อมูลเดิมได้' },
      { type: 'mcq', q: 'ควรใช้อะไรเก็บรหัสผ่านผู้ใช้ในฐานข้อมูล', opts: ['SHA-256 เปล่า ๆ', 'MD5 พร้อม salt', 'bcrypt, Argon2 หรือ PBKDF2', 'AES-256'], a: 2, why: 'SHA-256 เร็วเกินไปจึงเดาด้วย GPU ได้เป็นพันล้านครั้งต่อวินาที ส่วน bcrypt/Argon2 ออกแบบให้ช้าโดยตั้งใจและปรับความยากได้ — และ AES ผิดตั้งแต่แนวคิดเพราะรหัสผ่านต้องแฮช ไม่ใช่เข้ารหัส' },
      { type: 'mcq', q: 'Perfect Forward Secrecy ให้ประโยชน์อะไร', opts: ['เข้ารหัสเร็วขึ้น', 'ถ้า private key ของเซิร์ฟเวอร์หลุดในอนาคต ก็ถอดรหัสการสนทนาเก่าที่ดักไว้ไม่ได้', 'ไม่ต้องใช้ certificate', 'ป้องกัน DDoS'], a: 1, why: 'PFS สร้างกุญแจใหม่ทุก session ด้วย ephemeral key exchange (ECDHE) กุญแจของแต่ละ session จึงไม่ผูกกับ private key ของเซิร์ฟเวอร์' },
      { type: 'cmd', q: 'พิมพ์คำสั่ง openssl เพื่อดูรายละเอียดใบรับรองในไฟล์ <code>/etc/ssl/cert.pem</code>', ans: ['openssl x509 -in /etc/ssl/cert.pem -noout -text', 'openssl x509 -text -noout -in /etc/ssl/cert.pem'], why: 'ใช้ตรวจว่าใบรับรองออกให้ใคร ใครเป็นคนเซ็น หมดอายุเมื่อไหร่ และมี SAN ครอบชื่อไหนบ้าง — เป็นขั้นแรกเสมอเมื่อเจอปัญหา TLS' },
      { type: 'mcq', q: 'OCSP Stapling ดีกว่า OCSP ธรรมดาอย่างไร', opts: ['เข้ารหัสแรงกว่า', 'เซิร์ฟเวอร์ถาม CA ล่วงหน้าแล้วแนบคำตอบมาให้ ลูกค้าจึงไม่ต้องติดต่อ CA เอง เร็วกว่าและเป็นส่วนตัวกว่า', 'ไม่ต้องมี CA', 'ใช้กับ code signing เท่านั้น'], a: 1, why: 'OCSP แบบเดิมทำให้ CA รู้ว่าผู้ใช้แต่ละคนเข้าเว็บอะไรบ้าง และเพิ่ม latency ทุกครั้งที่เชื่อมต่อ — stapling แก้ทั้งสองปัญหา' },
      { type: 'mcq', q: 'รหัสผ่าน + คำถามกู้คืนบัญชี นับเป็น MFA หรือไม่', opts: ['เป็น เพราะมีสองขั้นตอน', 'ไม่เป็น เพราะทั้งคู่เป็นปัจจัยเดียวกันคือ "สิ่งที่รู้"', 'เป็น ถ้าคำถามยากพอ', 'ขึ้นกับระบบ'], a: 1, why: 'MFA ต้องมาจากคนละประเภทปัจจัย — สิ่งที่รู้ / สิ่งที่มี / สิ่งที่เป็น การถามสองอย่างที่ผู้ใช้ "รู้" ยังเป็น single factor อยู่ดี' },
      { type: 'mcq', q: 'ปัจจัยที่สองแบบใดกัน phishing ได้ดีที่สุด', opts: ['SMS OTP', 'TOTP ในแอป', 'FIDO2 / security key', 'คำถามลับ'], a: 2, why: 'FIDO2 ผูกการยืนยันกับโดเมนจริง ถ้าเว็บปลอมขอ มันจะไม่ตอบให้เลย ส่วน OTP ทุกแบบผู้ใช้ยังกรอกใส่เว็บปลอมได้ และ SMS ยังเสี่ยง SIM swap เพิ่มอีก' },
      { type: 'mcq', q: 'ค่าใดของระบบ biometric ที่อันตรายที่สุดเมื่อสูงเกินไป', opts: ['FRR', 'FAR', 'CER', 'MTBF'], a: 1, why: 'FAR สูง = ระบบยอมรับคนผิด ซึ่งคือความล้มเหลวด้านความปลอดภัยโดยตรง ส่วน FRR สูงเป็นแค่ความไม่สะดวก (แม้จะทำให้คนหาทางเลี่ยงระบบก็ตาม)' },
      { type: 'cmd', q: 'พิมพ์คำสั่งดูวันหมดอายุและอายุรหัสผ่านของผู้ใช้ <code>analyst</code>', ans: ['chage -l analyst', 'sudo chage -l analyst'], why: 'chage -l แสดงวันเปลี่ยนรหัสล่าสุด วันหมดอายุรหัส และวันหมดอายุบัญชี — ใช้ตรวจว่านโยบายอายุรหัสผ่านถูกบังคับใช้จริงไหม' },
      { type: 'mcq', q: 'Service account ควรตั้งค่าอย่างไร', opts: ['ให้ล็อกอินได้ปกติเพื่อความสะดวกในการแก้ปัญหา', 'ตั้ง shell เป็น nologin ห้ามล็อกอินแบบ interactive', 'ใช้บัญชีร่วมกับผู้ดูแลระบบ', 'ให้เป็น root เพื่อไม่ให้ติดปัญหาสิทธิ์'], a: 1, why: 'service account มีไว้ให้โปรแกรมใช้ ไม่ใช่คน ถ้าล็อกอินไม่ได้ ผู้โจมตีที่ได้รหัสไปก็ใช้เปิด shell ไม่ได้ และควรให้สิทธิ์เท่าที่โปรแกรมนั้นต้องใช้จริงเท่านั้น' },
      { type: 'mcq', q: 'RBAC ต่างจาก ABAC อย่างไร', opts: ['เหมือนกัน', 'RBAC ให้สิทธิ์ตามบทบาท ส่วน ABAC ตัดสินจากคุณลักษณะหลายอย่างรวมกัน เช่น แผนก เวลา สถานที่ อุปกรณ์', 'RBAC ใช้กับ Linux ABAC ใช้กับ Windows', 'ABAC เก่ากว่า'], a: 1, why: 'RBAC ดูแลง่ายและใช้กันแพร่หลายที่สุด ส่วน ABAC ยืดหยุ่นกว่ามากและเป็นฐานของแนวคิด Zero Trust ที่ตัดสินใจใหม่ทุกครั้งตามบริบท' },
      { type: 'mcq', q: 'Full disk encryption ป้องกันอะไรได้', opts: ['ป้องกันมัลแวร์ขณะเครื่องทำงาน', 'ป้องกันข้อมูลรั่วเมื่อเครื่องหรือดิสก์ถูกขโมย', 'ป้องกันการโจมตีผ่านเครือข่าย', 'ป้องกันผู้ดูแลระบบอ่านไฟล์'], a: 1, why: 'FDE ป้องกัน "data at rest" เท่านั้น เมื่อเครื่องบูตและปลดล็อกแล้ว ข้อมูลถูกถอดรหัสให้ระบบใช้งานตามปกติ มัลแวร์ที่รันอยู่จึงอ่านได้ทั้งหมด' },
      { type: 'multi', q: 'กล้องวงจรปิดรุ่นเก่าที่ผู้ผลิตเลิกออก patch แล้ว ควรใช้มาตรการใด (เลือกทุกข้อที่ถูก)', opts: ['แยกไว้ใน VLAN ของตัวเอง', 'ห้ามให้ออกอินเทอร์เน็ตโดยตรง', 'จำกัดว่าเครื่องไหนคุยกับมันได้บ้าง', 'ต่อไว้ในวงเดียวกับเครื่องพนักงานเพื่อความสะดวก'], a: [0, 1, 2], why: 'เมื่อ patch ไม่ได้ ต้องใช้ compensating control ที่ลดพื้นที่การโจมตีแทน — การเอาไปไว้วงเดียวกับเครื่องผู้ใช้ทำให้อุปกรณ์ที่อ่อนแอที่สุดกลายเป็นทางเข้าสู่ทุกอย่าง' },
    ],

    labs: [
      {
        id: 'cy-sp-l2-crypto',
        title: 'Security+ Lab 2A — ตรวจสอบความสมบูรณ์ กุญแจ และใบรับรอง',
        brief: 'คุณได้รับไฟล์ติดตั้งจากคู่ค้าและต้องยืนยันว่าไม่ถูกแก้ไขระหว่างทาง พร้อมกันนั้นต้องตรวจใบรับรองของเว็บภายในที่ผู้ใช้แจ้งว่าเบราว์เซอร์ขึ้นเตือน',
        device: 'linux-sec',
        tasks: [
          { t: 'คำนวณ SHA-256 ของไฟล์เพื่อเทียบกับค่าที่ผู้ผลิตประกาศ', hint: 'sha256sum /etc/passwd', check: (s, h) => said(h, /sha256sum/i) },
          { t: 'คำนวณ hash เดียวกันด้วย openssl เพื่อยืนยันซ้ำ', hint: 'openssl sha256 /etc/passwd', check: (s, h) => said(h, /openssl\s+sha256/i) },
          { t: 'สร้างค่าสุ่ม 32 ไบต์ไว้ใช้เป็น salt หรือกุญแจ', hint: 'openssl rand -hex 32', check: (s, h) => said(h, /openssl\s+rand/i) },
          { t: 'ดูรายละเอียดใบรับรอง — ออกให้ใคร ใครเซ็น หมดอายุเมื่อไหร่', hint: 'openssl x509 -in /etc/ssl/cert.pem -noout -text', check: (s, h) => said(h, /openssl\s+x509/i) },
          { t: 'ตรวจใบรับรองที่เว็บปลายทางส่งมาจริง', hint: 'openssl s_client -connect example.com:443', check: (s, h) => said(h, /openssl\s+s_client|s_client/i) },
          { t: 'ตรวจว่ารหัสผ่านในระบบถูกแฮชด้วยอัลกอริทึมอะไร', hint: 'sudo cat /etc/shadow', check: (s, h) => said(h, /shadow/i) },
          { t: 'ตรวจสิทธิ์ของไฟล์ <code>/etc/shadow</code> ว่าไม่ถูกเปิดกว้าง', hint: 'stat /etc/shadow', check: (s, h) => said(h, /stat\s+\/etc\/shadow/i) },
          { t: 'ตรวจว่าเว็บปลายทางบังคับ HTTPS จริงหรือไม่', hint: 'curl -I https://example.com', check: (s, h) => said(h, /curl\s+-I/i) },
        ],
      },
      {
        id: 'cy-sp-l2-iam',
        title: 'Security+ Lab 2B — จัดระเบียบบัญชีผู้ใช้และ hardening เครื่อง',
        brief: 'ผลการตรวจสอบภายในพบว่าบัญชีพนักงานที่ลาออกยังใช้งานได้ รหัสผ่านไม่เคยหมดอายุ และ service account ล็อกอินเข้าเครื่องได้ คุณต้องแก้ทั้งหมดแล้ววัดผลด้วย baseline',
        device: 'linux-sec',
        init: { apply: st => { addUser(st, 'somchai'); addUser(st, 'backup-svc', { shell: '/bin/bash' }); } },
        tasks: [
          { t: 'ดูรายชื่อผู้ใช้ทั้งหมดในระบบ', hint: 'cat /etc/passwd', check: (s, h) => said(h, /^(sudo\s+)?cat\s+\/etc\/passwd/i) },
          { t: 'ตรวจอายุรหัสผ่านของผู้ใช้ <code>analyst</code>', hint: 'chage -l analyst', check: (s, h) => said(h, /chage\s+-l/i) },
          { t: 'บังคับให้รหัสผ่านหมดอายุทุก 90 วัน เตือนล่วงหน้า 7 วัน', hint: 'sudo chage -M 90 -W 7 analyst', check: (s, h) => said(h, /chage.*-M\s*90/i) },
          { t: 'ล็อกบัญชีของพนักงานที่ลาออก (ยังไม่ลบ เผื่อต้องสืบสวน)', hint: 'sudo usermod -L somchai', check: (s, h) => said(h, /usermod\s+-L|passwd\s+-l/i) },
          { t: 'ตั้ง service account ให้ล็อกอินแบบ interactive ไม่ได้', hint: 'sudo usermod -s /usr/sbin/nologin backup-svc', check: (s, h) => said(h, /nologin/i) },
          { t: 'ดูว่าเครื่องเปิดพอร์ตอะไรฟังอยู่บ้าง', hint: 'ss -tulpn', check: (s, h) => said(h, /ss\s+-\w+/i) },
          { t: 'ตรวจสถานะ host firewall', hint: 'sudo ufw status verbose', check: (s, h) => said(h, /ufw\s+status|firewall-cmd/i) },
          { t: 'ตรวจสถานะ Mandatory Access Control ของระบบ', hint: 'getenforce', check: (s, h) => said(h, /getenforce/i) },
          { t: 'รันตรวจ baseline ทั้งเครื่องเพื่อวัดผล', hint: 'sudo lynis audit system', check: (s, h) => said(h, /lynis/i) },
        ],
      },
      {
        id: 'cy-sp-l2-pki',
        title: 'Security+ Lab 2C — สร้างและตรวจสอบใบรับรอง (Lesson 6)',
        brief: 'เว็บภายในองค์กรใบรับรองกำลังจะหมดอายุ คุณต้องสร้างคู่กุญแจและ CSR ชุดใหม่เพื่อส่งให้ CA พร้อมตรวจสอบใบเดิมว่าปัญหาที่ผู้ใช้เจออยู่เกิดจากอะไร',
        device: 'linux-sec',
        tasks: [
          { t: 'สร้าง private key ขนาด 2048 บิต', hint: 'openssl genrsa -out server.key 2048', check: (s, h) => said(h, /openssl\s+genrsa/i) },
          { t: 'ตรวจสิทธิ์ของ private key ต้องไม่ให้คนอื่นอ่านได้', hint: 'chmod 600 server.key', check: (s, h) => said(h, /chmod\s+(600|0600).*key/i) },
          { t: 'สร้าง CSR เพื่อส่งให้ CA เซ็น (private key ไม่ออกจากเครื่อง)', hint: 'openssl req -new -key server.key -out server.csr', check: (s, h) => said(h, /openssl\s+req\s+-new/i) },
          { t: 'ตรวจเนื้อหาใน CSR ว่าชื่อองค์กรและ CN ถูกต้อง', hint: 'openssl req -in server.csr -noout -text', check: (s, h) => said(h, /openssl\s+req\s+-in|req.*-text/i) },
          { t: 'ดูวันหมดอายุของใบรับรองที่ใช้อยู่', hint: 'openssl x509 -in /etc/ssl/cert.pem -noout -dates', check: (s, h) => said(h, /x509.*-dates|-dates/i) },
          { t: 'ดูรายละเอียดใบรับรองทั้งหมด — ผู้ออก, SAN, การใช้งานกุญแจ', hint: 'openssl x509 -in /etc/ssl/cert.pem -noout -text', check: (s, h) => said(h, /openssl\s+x509.*-text/i) },
          { t: 'ตรวจว่าใบรับรองเชื่อมโยงกลับถึง CA ที่เชื่อถือได้หรือไม่', hint: 'openssl verify /etc/ssl/cert.pem', check: (s, h) => said(h, /openssl\s+verify/i) },
          { t: 'ตรวจใบรับรองที่เว็บปลายทางส่งมาจริงตอน handshake', hint: 'openssl s_client -connect example.com:443', check: (s, h) => said(h, /s_client/i) },
        ],
      },
      {
        id: 'cy-sp-l2-host',
        title: 'Security+ Lab 2D — Hardening เครื่องปลายทางและวางเส้นฐานเฝ้าระวัง (Lesson 12)',
        brief: 'เซิร์ฟเวอร์ตัวใหม่กำลังจะขึ้นระบบ ก่อนส่งมอบต้องปิดสิ่งที่ไม่จำเป็น เปิดกลไกตรวจจับการเปลี่ยนแปลง และเก็บ baseline ไว้เทียบภายหลัง',
        device: 'linux-sec',
        init: { apply: st => { startSvc(st, 'telnet', 'Telnet Server (ของเก่าที่ควรปิด)'); } },
        tasks: [
          { t: 'ตรวจว่ามีแพ็กเกจใดค้างอัปเดตอยู่บ้าง', hint: 'apt list --upgradable', check: (s, h) => said(h, /apt\s+list|apt\s+update|dnf\s+check-update/i) },
          { t: 'ดูว่ามี service อะไรทำงานอยู่บ้าง', hint: 'systemctl list-units --type=service', check: (s, h) => said(h, /systemctl\s+list-units/i) },
          { t: 'ปิด service ที่ไม่ได้ใช้งาน', hint: 'sudo systemctl disable telnet', check: (s, h) => said(h, /systemctl\s+disable/i) },
          { t: 'ตรวจสถานะ Mandatory Access Control', hint: 'getenforce', check: (s, h) => said(h, /getenforce/i) },
          { t: 'ตั้งค่า kernel ให้กัน SYN flood', hint: 'sudo sysctl net.ipv4.tcp_syncookies=1', check: (s, h) => said(h, /sysctl.*syncookies/i) },
          { t: 'เปิดกฎ audit เฝ้าดูการแก้ไขไฟล์ผู้ใช้', hint: 'sudo auditctl -w /etc/passwd -p wa -k identity', check: (s, h) => said(h, /auditctl\s+-w/i) },
          { t: 'ตรวจว่ากฎ audit ถูกโหลดแล้ว', hint: 'sudo auditctl -l', check: (s, h) => said(h, /auditctl\s+-l/i) },
          { t: 'สร้างเส้นฐานความสมบูรณ์ของไฟล์ระบบด้วย AIDE', hint: 'sudo aide --init', check: (s, h) => said(h, /aide\s+--init|aide/i) },
          { t: 'ตรวจว่าดิสก์ถูกเข้ารหัสหรือไม่', hint: 'lsblk', check: (s, h) => said(h, /lsblk|blkid/i) },
          { t: 'วัดผลการ hardening ด้วย baseline scan', hint: 'sudo lynis audit system', check: (s, h) => said(h, /lynis/i) },
        ],
      },
    ],
  },

  // ================================================================
  //  ระดับ 3 — Lesson 3, 10, 14
  // ================================================================
  3: {
    sections: [
      {
        t: 'Lesson 3 — Security Assessments และ Penetration Testing',
        h: `
<p>สามคำนี้คนใช้ปนกันบ่อยมาก แต่ต่างกันทั้งขอบเขต ราคา และผลลัพธ์ที่ได้</p>
<table class="tbl">
<tr><th></th><th>Vulnerability Scan</th><th>Penetration Test</th><th>Audit</th></tr>
<tr><td>ทำอะไร</td><td>หาช่องโหว่ที่รู้จักแล้ว ด้วยเครื่องมืออัตโนมัติ</td><td><b>เจาะจริง</b>เพื่อพิสูจน์ว่าใช้ประโยชน์ได้จริงไหม</td><td>ตรวจว่าทำตามนโยบาย/มาตรฐานหรือไม่</td></tr>
<tr><td>ความถี่</td><td>ทุกสัปดาห์/เดือน</td><td>ปีละครั้งหรือเมื่อระบบเปลี่ยนใหญ่</td><td>ตามรอบการตรวจสอบ</td></tr>
<tr><td>ความเสี่ยงต่อระบบ</td><td>ต่ำ (ถ้าเลือกโหมด non-intrusive)</td><td>มี — อาจทำระบบล่ม ต้องมีหนังสืออนุญาต</td><td>ไม่มี</td></tr>
</table>
<p><b>Network reconnaissance — เครื่องมือที่ใช้สำรวจ</b></p>
<pre class="code"><span style="color:#5b6b8c"># ดูว่ามีเครื่องอะไรอยู่ในวงบ้าง (host discovery ไม่สแกนพอร์ต)</span>
nmap -sn 10.10.10.0/24

<span style="color:#5b6b8c"># สแกนพอร์ตพร้อมเดาเวอร์ชันของ service ที่รันอยู่</span>
nmap -sV 10.10.10.5

<span style="color:#5b6b8c"># ดูว่าเครื่องเราเองเปิดอะไรฟังอยู่ — ทำก่อนเสมอ ก่อนจะไปสแกนคนอื่น</span>
ss -tulpn

<span style="color:#5b6b8c"># สำรวจข้อมูลโดเมนแบบ passive</span>
dig example.com any</pre>
<p><b>ประเภทช่องโหว่ที่ต้องรู้จัก</b></p>
<table class="tbl">
<tr><th>ประเภท</th><th>คำอธิบาย</th></tr>
<tr><td><b>Zero-day</b></td><td>ยังไม่มี patch — ป้องกันด้วยการลดพื้นที่โจมตีและตรวจจับพฤติกรรม</td></tr>
<tr><td><b>Misconfiguration</b></td><td>ต้นเหตุอันดับหนึ่งของเหตุการณ์จริง — รหัสผ่าน default, permission เปิดกว้าง, bucket public</td></tr>
<tr><td><b>Legacy / EOL</b></td><td>ระบบที่หมดอายุการซัพพอร์ต ไม่มี patch ให้อีกแล้ว</td></tr>
<tr><td><b>Weak encryption</b></td><td>ใช้ TLS 1.0, SSLv3, MD5 หรือกุญแจสั้นเกินไป</td></tr>
<tr><td><b>Supply chain</b></td><td>ไลบรารีหรือผู้ขายที่เราไว้ใจมีช่องโหว่ — จึงต้องมี SBOM ว่าเราใช้อะไรอยู่บ้าง</td></tr>
</table>
<div class="note"><b>อ่านผลสแกนให้เป็น</b><br>
<b>False positive</b> = แจ้งว่ามีช่องโหว่แต่จริง ๆ ไม่มี — เสียเวลาไล่ตาม<br>
<b>False negative</b> = <b>อันตรายกว่ามาก</b> เพราะมีช่องโหว่จริงแต่เครื่องมือไม่เจอ ทำให้เราคิดว่าปลอดภัย<br>
<b>CVSS</b> ให้คะแนน 0–10 แต่<b>อย่าเรียงแก้ตามคะแนนอย่างเดียว</b> — ช่องโหว่คะแนน 7 บนเซิร์ฟเวอร์ที่เปิดออกเน็ต
สำคัญกว่าคะแนน 9 บนเครื่องที่อยู่ในวงปิดและไม่มีข้อมูลสำคัญ ต้องดู<b>บริบท</b>ประกอบเสมอ</div>
<p><b>Penetration testing — รูปแบบและขั้นตอน</b></p>
<table class="tbl">
<tr><th>รูปแบบ</th><th>ผู้ทดสอบรู้อะไรบ้าง</th></tr>
<tr><td><b>Black box</b></td><td>ไม่รู้อะไรเลย — จำลองผู้โจมตีจากภายนอกจริง แต่ใช้เวลานาน</td></tr>
<tr><td><b>White box</b></td><td>รู้ทุกอย่าง มี source code และแผนผัง — ครอบคลุมที่สุดต่อเวลาที่ใช้</td></tr>
<tr><td><b>Gray box</b></td><td>รู้บางส่วน เช่น มีบัญชีผู้ใช้ธรรมดา — จำลอง insider หรือบัญชีที่ถูกยึด</td></tr>
</table>
<p>ขั้นตอน: <b>Reconnaissance</b> (passive → active) → <b>Scanning / Enumeration</b> → <b>Exploitation</b> →
<b>Privilege escalation</b> → <b>Lateral movement / Pivoting</b> → <b>Persistence</b> → <b>Cleanup &amp; Report</b></p>
<div class="note warn"><b>ต้องมีก่อนเริ่มเสมอ</b> — <b>Rules of Engagement</b> ที่ระบุขอบเขต IP, ช่วงเวลา, สิ่งที่ห้ามทำ (เช่น ห้าม DoS)
และ <b>หนังสืออนุญาตเป็นลายลักษณ์อักษรจากเจ้าของระบบ</b> การสแกนหรือเจาะโดยไม่ได้รับอนุญาตเป็นความผิดตาม พ.ร.บ.คอมพิวเตอร์
ไม่ว่าเจตนาจะดีแค่ไหนก็ตาม</div>`,
      },
      {
        t: 'Lesson 10 — Network Security Appliances และ SIEM',
        h: `
<table class="tbl">
<tr><th>อุปกรณ์</th><th>ทำงานที่ชั้นไหน</th><th>เห็นอะไร</th></tr>
<tr><td><b>Packet filter firewall</b></td><td>L3/L4</td><td>IP, พอร์ต, protocol เท่านั้น</td></tr>
<tr><td><b>Stateful firewall</b></td><td>L3/L4 + จำ session</td><td>รู้ว่าแพ็กเก็ตนี้เป็นส่วนหนึ่งของการสนทนาที่อนุญาตไว้แล้วหรือไม่</td></tr>
<tr><td><b>NGFW</b></td><td>ถึง L7</td><td>รู้ว่าเป็นแอปอะไร ใครเป็นผู้ใช้ และตรวจเนื้อหาได้</td></tr>
<tr><td><b>Proxy (forward)</b></td><td>L7</td><td>คุมและบันทึกว่าผู้ใช้ในองค์กรออกไปเว็บไหน</td></tr>
<tr><td><b>Reverse proxy / WAF</b></td><td>L7</td><td>ป้องกันเว็บของเราจากภายนอก — กัน SQLi, XSS</td></tr>
<tr><td><b>IDS</b></td><td>ตรวจจับ</td><td><b>เห็นแล้วแจ้ง</b> วางแบบ out-of-band ไม่ขวางทาง</td></tr>
<tr><td><b>IPS</b></td><td>ขัดขวาง</td><td><b>บล็อกได้</b> วางแบบ inline — แต่ถ้า false positive จะตัด traffic ที่ถูกต้องทิ้ง</td></tr>
</table>
<div class="note"><b>Signature-based กับ Anomaly-based</b><br>
<b>Signature</b> จับของที่รู้จักแล้วได้แม่นและ false positive ต่ำ แต่จับของใหม่ไม่ได้เลย<br>
<b>Anomaly / Behavior</b> จับของใหม่ได้ แต่ต้องเรียนรู้ baseline ก่อนและมี false positive สูงกว่า<br>
ระบบจริงต้องใช้ทั้งคู่ควบคู่กัน</div>
<p><b>SIEM — รวมทุก log มาไว้ที่เดียวแล้วหาความสัมพันธ์</b></p>
<table class="tbl">
<tr><th>ขั้นตอน</th><th>รายละเอียด</th></tr>
<tr><td><b>Collection</b></td><td>ดึง log จาก firewall, เซิร์ฟเวอร์, EDR, แอป — ผ่าน syslog หรือ agent</td></tr>
<tr><td><b>Normalization</b></td><td>แปลงรูปแบบที่ต่างกันให้เป็นโครงเดียวกันเพื่อค้นหาข้ามระบบได้</td></tr>
<tr><td><b>Correlation</b></td><td><b>หัวใจของ SIEM</b> — เชื่อมเหตุการณ์หลายระบบเข้าด้วยกัน เช่น "ล็อกอินล้มเหลว 50 ครั้ง แล้วสำเร็จ แล้วมีการเชื่อมต่อออกไปต่างประเทศ"</td></tr>
<tr><td><b>Alerting</b></td><td>แจ้งเตือนตามกฎที่ตั้งไว้</td></tr>
<tr><td><b>Retention</b></td><td>เก็บย้อนหลังตามกฎหมายและความจำเป็นในการสืบสวน</td></tr>
</table>
<pre class="code"><span style="color:#5b6b8c"># แหล่งข้อมูลที่ SIEM ดึงไปจากเครื่อง Linux</span>
journalctl -u ssh --since today
sudo ausearch -m USER_LOGIN
sudo auditctl -l                <span style="color:#5b6b8c"># ดูว่าเฝ้าอะไรอยู่บ้าง</span>
sudo fail2ban-client status     <span style="color:#5b6b8c"># ใครถูกแบนไปแล้วบ้าง</span></pre>
<div class="note warn"><b>สิ่งที่ทำให้ SIEM ล้มเหลวในทางปฏิบัติ</b><br>
<b>Alert fatigue</b> — ตั้งกฎกว้างเกินไปจนมีแจ้งเตือนวันละพัน สุดท้ายทีมกดปิดหมดและพลาดของจริง<br>
<b>เวลาไม่ตรงกัน</b> — ถ้าเครื่องต่าง ๆ ไม่ sync NTP การเรียงลำดับเหตุการณ์จะผิดทั้งหมด ทำให้สืบไม่ได้ว่าอะไรเกิดก่อน<br>
<b>log ที่ไม่ได้ส่งออกนอกเครื่อง</b> — ผู้โจมตีที่ได้ root จะลบ log ก่อนเป็นอันดับแรก การส่ง log ออกไป syslog server แบบ write-once จึงจำเป็น</div>`,
      },
      {
        t: 'Lesson 14 — Secure Application Concepts',
        h: `
<p><b>สัญญาณของการโจมตีระดับแอปพลิเคชัน</b></p>
<table class="tbl">
<tr><th>การโจมตี</th><th>ลักษณะ</th><th>ป้องกันอย่างไร</th></tr>
<tr><td><b>SQL Injection</b></td><td>ใส่คำสั่ง SQL เข้าไปในช่องกรอกข้อมูล</td><td><b>Parameterized query</b> เท่านั้น — การกรองอักขระเองไม่เคยพอ</td></tr>
<tr><td><b>XSS</b></td><td>ฝังสคริปต์ให้รันในเบราว์เซอร์ของเหยื่อ (stored / reflected / DOM)</td><td>เข้ารหัส output ตามบริบท + CSP</td></tr>
<tr><td><b>CSRF</b></td><td>หลอกให้เบราว์เซอร์ของเหยื่อส่งคำสั่งที่เขาไม่ได้ตั้งใจ</td><td>anti-CSRF token, SameSite cookie</td></tr>
<tr><td><b>Buffer overflow</b></td><td>เขียนข้อมูลเกินพื้นที่ที่จอง จนควบคุมการทำงานได้</td><td>ภาษาที่ปลอดภัยกว่า, ASLR, DEP, stack canary</td></tr>
<tr><td><b>Race condition (TOCTOU)</b></td><td>สภาพเปลี่ยนระหว่าง "ตรวจสอบ" กับ "ใช้งาน"</td><td>ล็อกทรัพยากร ทำเป็น atomic operation</td></tr>
<tr><td><b>Replay attack</b></td><td>ดักข้อความที่ถูกต้องแล้วส่งซ้ำ</td><td>nonce, timestamp, session token ที่ใช้ครั้งเดียว</td></tr>
<tr><td><b>Privilege escalation</b></td><td>ยกระดับจากผู้ใช้ธรรมดาเป็น admin</td><td>patch, least privilege, ตรวจไฟล์ SUID</td></tr>
<tr><td><b>Directory traversal</b></td><td><code>../../etc/passwd</code> เพื่ออ่านไฟล์นอกขอบเขต</td><td>ตรวจสอบและ normalize path ฝั่งเซิร์ฟเวอร์</td></tr>
</table>
<p><b>Secure coding practices</b></p>
<ul>
  <li><b>Input validation ที่ฝั่งเซิร์ฟเวอร์เสมอ</b> — การตรวจฝั่งเบราว์เซอร์เป็นแค่ UX ผู้โจมตีข้ามได้ทันที</li>
  <li><b>Allowlist ดีกว่า blocklist</b> — ระบุสิ่งที่ยอมรับ ไม่ใช่ไล่ห้ามทีละอย่าง</li>
  <li><b>Output encoding ตามบริบท</b> — HTML, JavaScript, SQL, URL ต้องเข้ารหัสคนละแบบ</li>
  <li><b>Error handling</b> — ข้อความ error ต้องไม่เปิดเผยโครงสร้างฐานข้อมูลหรือ stack trace ให้ผู้ใช้</li>
  <li><b>ห้ามฝัง secret ในโค้ด</b> — ใช้ secret manager หรือ environment variable และสแกน repo หา key ที่หลุด</li>
  <li><b>Code signing</b> และตรวจสอบ dependency ด้วย SBOM</li>
</ul>
<p><b>Secure script environments และ Deployment</b></p>
<table class="tbl">
<tr><th>เรื่อง</th><th>แนวทาง</th></tr>
<tr><td>PowerShell / Bash</td><td>เปิด logging ของสคริปต์, บังคับ execution policy และลงลายเซ็นสคริปต์ที่ใช้ในองค์กร</td></tr>
<tr><td>Macro ใน Office</td><td>ปิดโดยค่าเริ่มต้น — เป็นช่องทางแพร่มัลแวร์อันดับต้น ๆ</td></tr>
<tr><td><b>แยกสภาพแวดล้อม</b></td><td>Development → Test → Staging → Production โดยข้อมูลจริง<b>ห้าม</b>อยู่ในสภาพแวดล้อมทดสอบ</td></tr>
<tr><td>Change management</td><td>ทุกการเปลี่ยนแปลงต้องมีคนอนุมัติ มีแผนย้อนกลับ และบันทึกไว้</td></tr>
<tr><td>CI/CD security</td><td>สแกนโค้ด (SAST), สแกนแอปที่รันอยู่ (DAST), สแกน dependency และ container image ทุกครั้งที่ build</td></tr>
</table>
<div class="note"><b>ทำไมเรื่องนี้เกี่ยวกับผู้ดูแลระบบ</b> — แม้ไม่ได้เขียนโค้ดเอง คุณคือคนที่ต้อง
วาง WAF ไว้หน้าแอป · แยก environment ให้ถูก · จำกัดสิทธิ์ของบัญชีที่แอปใช้ต่อฐานข้อมูล ·
และเป็นคนแรกที่เห็น log ผิดปกติเมื่อมีคนพยายามยิง SQLi เข้ามา</div>`,
      },
    ],

    quiz: [
      { type: 'mcq', q: 'Vulnerability scan ต่างจาก penetration test อย่างไร', opts: ['เหมือนกัน แค่เรียกต่างกัน', 'scan หาช่องโหว่ที่รู้จักด้วยเครื่องมืออัตโนมัติ ส่วน pentest เจาะจริงเพื่อพิสูจน์ว่าใช้ประโยชน์ได้', 'scan แพงกว่า', 'pentest ทำได้โดยไม่ต้องขออนุญาต'], a: 1, why: 'scan บอกว่า "อาจมีช่องโหว่" แต่ pentest พิสูจน์ว่า "เจาะได้จริงและเข้าถึงอะไรได้บ้าง" — และ pentest ต้องมีหนังสืออนุญาตเป็นลายลักษณ์อักษรเสมอ' },
      { type: 'mcq', q: 'False negative อันตรายกว่า false positive เพราะอะไร', opts: ['เพราะเสียเวลามากกว่า', 'เพราะมีช่องโหว่จริงแต่เครื่องมือไม่เจอ ทำให้เราคิดว่าปลอดภัยทั้งที่ไม่ปลอดภัย', 'เพราะทำให้ระบบล่ม', 'ไม่จริง false positive อันตรายกว่า'], a: 1, why: 'false positive แค่เสียเวลาไล่ตรวจ แต่ false negative สร้างความมั่นใจจอมปลอม ซึ่งเป็นสาเหตุที่ไม่ควรพึ่งเครื่องมือเดียว' },
      { type: 'cmd', q: 'พิมพ์คำสั่ง nmap สำรวจว่ามีเครื่องใดออนไลน์ในวง <code>10.10.10.0/24</code> (ไม่สแกนพอร์ต)', ans: ['nmap -sn 10.10.10.0/24', 'sudo nmap -sn 10.10.10.0/24'], why: '-sn คือ host discovery อย่างเดียว ไม่ยิงพอร์ต จึงเบาและรบกวนระบบน้อยที่สุด — เป็นขั้นแรกของการสำรวจเสมอ' },
      { type: 'mcq', q: 'CVSS 9.8 บนเครื่องในวงปิดที่ไม่มีข้อมูลสำคัญ กับ CVSS 7.5 บนเว็บเซิร์ฟเวอร์ที่เปิดออกอินเทอร์เน็ต ควรแก้อันไหนก่อน', opts: ['อันที่ CVSS สูงกว่าเสมอ', 'อันที่เปิดออกอินเทอร์เน็ต เพราะบริบทและโอกาสถูกโจมตีจริงสำคัญกว่าคะแนนดิบ', 'แก้พร้อมกัน', 'ไม่ต้องแก้ทั้งคู่'], a: 1, why: 'CVSS เป็นคะแนนความรุนแรงทางเทคนิค ไม่ได้คิดบริบทของคุณ การจัดลำดับที่ถูกต้องต้องรวม exposure, ความสำคัญของข้อมูล และการมี exploit ในธรรมชาติเข้าไปด้วย' },
      { type: 'mcq', q: 'IDS ต่างจาก IPS อย่างไร', opts: ['IDS บล็อกได้ IPS แค่แจ้งเตือน', 'IDS แจ้งเตือนอย่างเดียววางแบบ out-of-band ส่วน IPS วางแบบ inline และบล็อกได้', 'IDS ใช้กับ host IPS ใช้กับ network', 'เหมือนกัน'], a: 1, why: 'IPS ที่บล็อกได้ก็มีความเสี่ยงว่าถ้า false positive จะตัด traffic ที่ถูกต้องทิ้ง จึงมักเริ่มจากโหมดแจ้งเตือนก่อนแล้วค่อยเปิดโหมดบล็อกทีละกฎ' },
      { type: 'mcq', q: 'หน้าที่ที่สำคัญที่สุดของ SIEM คือข้อใด', opts: ['เก็บ log ให้มากที่สุด', 'Correlation — เชื่อมเหตุการณ์จากหลายระบบเข้าด้วยกันจนเห็นภาพการโจมตี', 'แทนที่ firewall', 'สำรองข้อมูล'], a: 1, why: 'log เดี่ยว ๆ จากแต่ละระบบมักดูไม่มีอะไร แต่เมื่อเชื่อมกันจะเห็นเรื่องราว เช่น brute force สำเร็จ แล้วสร้างบัญชีใหม่ แล้วส่งข้อมูลออกนอก' },
      { type: 'mcq', q: 'ทำไมการ sync เวลา (NTP) จึงสำคัญมากต่อ SIEM และการสืบสวน', opts: ['เพื่อให้ log ไฟล์เล็กลง', 'เพราะถ้าเวลาไม่ตรงกัน การเรียงลำดับเหตุการณ์ข้ามระบบจะผิด ทำให้สืบไม่ได้ว่าอะไรเกิดก่อนหลัง', 'เพื่อประหยัดแบนด์วิดท์', 'ไม่สำคัญ'], a: 1, why: 'การสืบสวนคือการสร้าง timeline ถ้านาฬิกาของเซิร์ฟเวอร์กับ firewall ต่างกัน 10 นาที ลำดับเหตุการณ์จะกลับหัวกลับหางและหลักฐานอาจใช้ในชั้นศาลไม่ได้' },
      { type: 'cmd', q: 'พิมพ์คำสั่งดูว่ามี IP ใดถูก fail2ban แบนอยู่บ้าง', ans: ['fail2ban-client status', 'sudo fail2ban-client status'], why: 'fail2ban อ่าน log แล้วแบน IP ที่พยายามเดารหัสผ่านอัตโนมัติ — เป็น detective control ที่ทำหน้าที่ corrective ไปในตัว' },
      { type: 'mcq', q: 'วิธีป้องกัน SQL Injection ที่ถูกต้องที่สุดคือข้อใด', opts: ['กรองอักขระพิเศษออกเอง', 'ใช้ parameterized query / prepared statement', 'ซ่อนข้อความ error', 'เปลี่ยนพอร์ตฐานข้อมูล'], a: 1, why: 'parameterized query แยก "คำสั่ง" ออกจาก "ข้อมูล" อย่างสิ้นเชิง ทำให้ input ไม่มีทางกลายเป็นคำสั่งได้ ส่วนการกรองอักขระเองมีช่องหลุดเสมอ' },
      { type: 'mcq', q: 'ทำไมการตรวจสอบข้อมูลฝั่งเบราว์เซอร์อย่างเดียวจึงไม่พอ', opts: ['เพราะช้า', 'เพราะผู้โจมตีข้ามฝั่งเบราว์เซอร์ได้ทันทีด้วยการยิง request ตรงไปที่เซิร์ฟเวอร์', 'เพราะเบราว์เซอร์เก่าไม่รองรับ', 'เพราะเปลืองแบนด์วิดท์'], a: 1, why: 'การตรวจฝั่ง client เป็นแค่ประสบการณ์ผู้ใช้ ผู้โจมตีใช้ curl หรือ proxy ยิงตรงได้ — การตรวจสอบที่นับว่าเป็นความปลอดภัยต้องอยู่ฝั่งเซิร์ฟเวอร์เสมอ' },
      { type: 'multi', q: 'ข้อใดควรทำก่อนเริ่ม penetration test (เลือกทุกข้อที่ถูก)', opts: ['ได้หนังสืออนุญาตเป็นลายลักษณ์อักษรจากเจ้าของระบบ', 'กำหนด Rules of Engagement ระบุขอบเขตและช่วงเวลา', 'ระบุสิ่งที่ห้ามทำ เช่น การทำ DoS', 'เริ่มสแกนทันทีเพื่อไม่ให้เสียเวลา'], a: [0, 1, 2], why: 'การสแกนหรือเจาะระบบโดยไม่ได้รับอนุญาตเป็นความผิดตาม พ.ร.บ.คอมพิวเตอร์ ไม่ว่าเจตนาจะดีเพียงใด และ ROE ยังปกป้องผู้ทดสอบเองหากระบบเกิดล่ม' },
    ],

    labs: [{
      id: 'cy-sp-l3',
      title: 'Security+ Lab 3 — ประเมินความปลอดภัยและคัดกรองแจ้งเตือน',
      brief: 'ก่อนขึ้นระบบใหม่ หัวหน้าขอให้คุณประเมินความปลอดภัยของวงเซิร์ฟเวอร์ พร้อมตรวจแหล่ง log ที่จะส่งเข้า SIEM ว่าครบและอ่านออกจริง',
      device: 'linux-sec',
      init: { apply: st => { st.services.auditd.active = true; st.services.fail2ban.active = true; st.fail2ban.active = true; } },
      tasks: [
        { t: 'ตรวจก่อนว่าเครื่องเราเองเปิดพอร์ตอะไรไว้บ้าง', hint: 'ss -tulpn', check: (s, h) => said(h, /ss\s+-\w+/i) },
        { t: 'สำรวจว่ามีเครื่องใดออนไลน์ในวง <code>10.10.10.0/24</code>', hint: 'nmap -sn 10.10.10.0/24', check: (s, h) => said(h, /nmap.*-sn/i) },
        { t: 'สแกนพอร์ตและเวอร์ชัน service ของเครื่องเป้าหมาย', hint: 'nmap -sV 10.10.10.5', check: (s, h) => said(h, /nmap.*-sV/i) },
        { t: 'ตรวจว่าเว็บปลายทางใช้ TLS เวอร์ชันและ cipher อะไร', hint: 'openssl s_client -connect example.com:443', check: (s, h) => said(h, /s_client/i) },
        { t: 'ดู log การล็อกอินของ ssh วันนี้', hint: 'journalctl -u ssh --since today', check: (s, h) => said(h, /journalctl/i) },
        { t: 'ค้นหาเหตุการณ์ล็อกอินจากระบบ audit', hint: 'sudo ausearch -m USER_LOGIN', check: (s, h) => said(h, /ausearch/i) },
        { t: 'ดูว่าระบบ audit เฝ้าอะไรอยู่บ้าง', hint: 'sudo auditctl -l', check: (s, h) => said(h, /auditctl/i) },
        { t: 'ตรวจว่ามี IP ใดถูกแบนจากการเดารหัสผ่าน', hint: 'sudo fail2ban-client status', check: (s, h) => said(h, /fail2ban/i) },
        { t: 'ดักดู traffic เพื่อยืนยันว่ามีการเชื่อมต่อขาออกผิดปกติจริงหรือไม่', hint: 'sudo tcpdump -i ens33 -c 20', check: (s, h) => said(h, /tcpdump/i) },
      ],
    },
    {
      id: 'cy-sp-l3-appsec',
      title: 'Security+ Lab 3B — ไล่ร่องรอยการโจมตีระดับแอปพลิเคชัน (Lesson 14)',
      brief: 'WAF แจ้งเตือนว่ามีการยิงคำสั่งแปลก ๆ เข้าเว็บภายใน คุณต้องยืนยันจาก log ของเว็บเซิร์ฟเวอร์ว่าเป็นการโจมตีจริงไหม เป็นชนิดใด และตรวจว่าแอปตั้งค่าไว้ปลอดภัยพอหรือยัง',
      device: 'linux-sec',
      tasks: [
        { t: 'ค้นหาร่องรอย SQL Injection ใน log ของเว็บ', hint: 'grep -i "union select" /var/log/nginx/access.log', check: (s, h) => said(h, /grep.*union\s+select|grep.*union/i) },
        { t: 'ค้นหาร่องรอย XSS ที่ถูกยิงเข้ามา', hint: 'grep -i "<script" /var/log/nginx/access.log', check: (s, h) => said(h, /grep.*script/i) },
        { t: 'ค้นหาความพยายามอ่านไฟล์นอกขอบเขต (directory traversal)', hint: 'grep -F "../" /var/log/nginx/access.log', check: (s, h) => said(h, /grep.*\.\.\/|\.\.%2f/i) },
        { t: 'นับว่าแต่ละ IP ยิงเข้ามากี่ครั้ง เพื่อหาตัวหลัก', hint: 'awk "{print $1}" /var/log/nginx/access.log | sort | uniq -c | sort -rn', check: (s, h) => said(h, /uniq\s+-c|sort.*uniq/i) },
        { t: 'ตรวจ HTTP security header ที่เว็บส่งกลับมา', hint: 'curl -I https://example.com', check: (s, h) => said(h, /curl\s+-I/i) },
        { t: 'ตรวจว่าเว็บยังเปิด HTTP ธรรมดาให้เข้าได้อยู่ไหม', hint: 'curl -I http://example.com', check: (s, h) => said(h, /curl\s+-I\s+http:/i) },
        { t: 'ตรวจว่ามี secret หรือรหัสผ่านฝังอยู่ในไฟล์ตั้งค่าไหม', hint: 'grep -ri password /etc', check: (s, h) => said(h, /grep\s+-\w*r\w*i?\s+.*password|grep.*password/i) },
        { t: 'ตรวจสิทธิ์ของไฟล์ในเว็บรูทว่าไม่เปิดกว้างเกินไป', hint: 'ls -l /var/www', check: (s, h) => said(h, /ls\s+-l.*www|stat.*www/i) },
        { t: 'ตรวจว่าบัญชีที่เว็บใช้รันไม่ใช่ root', hint: 'ps aux', check: (s, h) => said(h, /^ps\s+aux/i) },
        { t: 'บล็อก IP ต้นทางที่ยิงเข้ามาชั่วคราว', hint: 'sudo ufw deny from 203.0.113.66', check: (s, h) => said(h, /ufw\s+deny|iptables.*DROP|fail2ban-client\s+set/i) },
      ],
    }],
  },

  // ================================================================
  //  ระดับ 4 — Lesson 17, 18, 19
  // ================================================================
  4: {
    sections: [
      {
        t: 'Lesson 17 — Incident Response Procedures',
        h: `
<p>เมื่อเกิดเหตุจริง สิ่งที่แยกทีมที่รอดกับทีมที่พังคือ <b>มีขั้นตอนเขียนไว้ล่วงหน้าหรือไม่</b>
เพราะกลางดึกตอนตกใจ ไม่มีใครคิดเป็นระบบได้</p>
<table class="tbl">
<tr><th>ขั้น</th><th>ทำอะไร</th><th>สิ่งที่คนพลาดบ่อย</th></tr>
<tr><td><b>1. Preparation</b></td><td>เขียนแผน ตั้งทีม ซ้อม เตรียมเครื่องมือและช่องทางสื่อสารสำรอง</td><td>ไม่เคยซ้อมเลย — แผนที่ไม่เคยซ้อมคือกระดาษเปล่า</td></tr>
<tr><td><b>2. Identification</b></td><td>ยืนยันว่าเป็นเหตุการณ์จริง ประเมินขอบเขตและความรุนแรง</td><td>ด่วนสรุปว่าเป็น false alarm</td></tr>
<tr><td><b>3. Containment</b></td><td>หยุดการลุกลาม — ระยะสั้น (ตัดวง) และระยะยาว (ย้ายไประบบสะอาด)</td><td><b>ปิดเครื่องทันที</b> ทำให้หลักฐานในหน่วยความจำหายหมด</td></tr>
<tr><td><b>4. Eradication</b></td><td>กำจัดต้นเหตุ — ลบมัลแวร์ ปิดช่องโหว่ รีเซ็ตบัญชีที่ถูกยึด</td><td>ลบมัลแวร์แต่ไม่ปิดช่องที่เขาเข้ามา จึงโดนซ้ำ</td></tr>
<tr><td><b>5. Recovery</b></td><td>กู้ระบบกลับมาใช้งาน เฝ้าดูใกล้ชิดว่าไม่กลับมาอีก</td><td>รีบเปิดระบบก่อนมั่นใจว่าสะอาดจริง</td></tr>
<tr><td><b>6. Lessons Learned</b></td><td>ทบทวนภายใน 2 สัปดาห์ แก้กระบวนการ ไม่ใช่หาคนผิด</td><td>ข้ามขั้นนี้ไปเลย จึงเจอปัญหาเดิมซ้ำ</td></tr>
</table>
<div class="note warn"><b>ลำดับความสำคัญตอนเกิดเหตุ</b> — ความปลอดภัยของคนมาก่อนเสมอ จากนั้นคือ
<b>หยุดการลุกลาม</b> → <b>รักษาหลักฐาน</b> → <b>กู้บริการ</b><br>
ถ้าต้องเลือกระหว่างเก็บหลักฐานกับหยุดความเสียหายที่กำลังลุกลาม ให้หยุดความเสียหายก่อน
แต่ต้อง<b>บันทึกไว้ว่าทำอะไรไปบ้างในเวลาใด</b> เพื่อให้อธิบายได้ภายหลัง</div>
<p><b>Mitigation controls ที่ใช้ตอน containment</b></p>
<ul>
  <li><b>Isolation / Segmentation</b> — ตัดเครื่องออกจากวง แต่<b>อย่าปิดเครื่อง</b> ถ้ายังต้องเก็บหน่วยความจำ</li>
  <li><b>Firewall / DNS sinkhole</b> — บล็อกการติดต่อไปยัง C2</li>
  <li><b>ปิดบัญชีที่ถูกยึด</b> และเพิกถอน session/token ที่ยังใช้ได้อยู่</li>
  <li><b>Application allowlisting</b> ชั่วคราวเพื่อหยุดการรันของแปลกปลอม</li>
</ul>
<p><b>แหล่งข้อมูลที่ใช้ตอนสืบสวนบน Linux</b></p>
<pre class="code">journalctl --since "2026-08-20 08:00" --until "2026-08-20 12:00"
last            <span style="color:#5b6b8c"># ใครล็อกอินสำเร็จ</span>
w               <span style="color:#5b6b8c"># ใครอยู่ในเครื่องตอนนี้และทำอะไรอยู่</span>
ps aux          <span style="color:#5b6b8c"># process ที่กำลังทำงาน</span>
ss -tunp        <span style="color:#5b6b8c"># การเชื่อมต่อที่เปิดอยู่ ณ ขณะนั้น</span></pre>`,
      },
      {
        t: 'Lesson 18 — Digital Forensics',
        h: `
<p>Forensics ต่างจาก incident response ตรงที่ผลลัพธ์อาจต้องใช้<b>ในชั้นศาลหรือกระบวนการทางวินัย</b>
วิธีเก็บจึงสำคัญพอ ๆ กับสิ่งที่เก็บได้</p>
<p><b>Chain of Custody — ห่วงโซ่การครอบครองหลักฐาน</b></p>
<table class="tbl">
<tr><th>ต้องบันทึกทุกครั้ง</th><th>รายละเอียด</th></tr>
<tr><td>ใคร</td><td>ชื่อผู้เก็บและผู้รับมอบทุกทอด</td></tr>
<tr><td>อะไร</td><td>อุปกรณ์อะไร หมายเลขเครื่อง</td></tr>
<tr><td>เมื่อไหร่</td><td>วันเวลาที่แม่นยำ (พร้อม timezone)</td></tr>
<tr><td>ที่ไหน</td><td>สถานที่เก็บและที่จัดเก็บต่อ</td></tr>
<tr><td>ทำอะไรกับมัน</td><td>ทุกการกระทำ พร้อมค่า hash ก่อนและหลัง</td></tr>
</table>
<div class="note warn"><b>ถ้า chain of custody ขาดตอนเดียว หลักฐานทั้งชิ้นอาจใช้ไม่ได้</b> — เพราะพิสูจน์ไม่ได้ว่าไม่ถูกแก้ไขระหว่างทาง</div>
<p><b>Order of Volatility — เก็บของที่หายง่ายที่สุดก่อน</b></p>
<table class="tbl">
<tr><th>ลำดับ</th><th>แหล่งข้อมูล</th><th>หายเมื่อไหร่</th></tr>
<tr><td>1</td><td>CPU cache, register</td><td>ทันที</td></tr>
<tr><td>2</td><td><b>RAM</b> — process, กุญแจเข้ารหัส, มัลแวร์ fileless</td><td><b>หายทันทีที่ปิดเครื่อง</b></td></tr>
<tr><td>3</td><td>สถานะเครือข่าย, session ที่เปิดอยู่</td><td>หายเมื่อตัดการเชื่อมต่อ</td></tr>
<tr><td>4</td><td>Process ที่ทำงานอยู่</td><td>หายเมื่อ process จบ</td></tr>
<tr><td>5</td><td>ดิสก์, log</td><td>อยู่ได้นาน</td></tr>
<tr><td>6</td><td>Backup, สื่อบันทึกภายนอก</td><td>อยู่นานที่สุด</td></tr>
</table>
<p><b>ขั้นตอนเก็บหลักฐานที่ถูกต้อง</b></p>
<pre class="code"><span style="color:#5b6b8c"># 1) เก็บสถานะที่ระเหยง่ายก่อน — อย่าเพิ่งปิดเครื่อง</span>
ps aux
ss -tunp
w

<span style="color:#5b6b8c"># 2) ทำสำเนา แล้วคำนวณ hash ทันที เพื่อพิสูจน์ว่าไม่ถูกแก้</span>
sudo tar -czf /tmp/evidence-20260823.tar.gz /var/log
sha256sum /tmp/evidence-20260823.tar.gz

<span style="color:#5b6b8c"># 3) วิเคราะห์จาก "สำเนา" เท่านั้น ห้ามแตะต้นฉบับ</span>
strings /tmp/sample.bin
stat /tmp/sample.bin        <span style="color:#5b6b8c"># ดู timestamp: atime / mtime / ctime</span></pre>
<div class="note"><b>ศัพท์ที่ต้องรู้</b> — <b>Legal hold</b> คำสั่งให้หยุดลบข้อมูลที่เกี่ยวข้องกับคดี ·
<b>Write blocker</b> อุปกรณ์ที่ทำให้อ่านดิสก์ได้แต่เขียนไม่ได้ ·
<b>Data acquisition</b> ทำสำเนาแบบ bit-by-bit ไม่ใช่ copy ไฟล์ธรรมดา ·
<b>E-discovery</b> กระบวนการค้นหาหลักฐานดิจิทัลตามคำสั่งทางกฎหมาย ·
<b>Timeline analysis</b> เรียงเหตุการณ์จาก timestamp เพื่อสร้างเรื่องราวว่าอะไรเกิดก่อนหลัง</div>`,
      },
      {
        t: 'Lesson 19 — Risk Management และ Business Impact Analysis',
        h: `
<p>ความปลอดภัยไม่มีคำว่า "ปลอดภัย 100%" มีแต่ <b>ความเสี่ยงที่ยอมรับได้</b> การจัดการความเสี่ยงจึงเป็นภาษาที่ใช้คุยกับผู้บริหาร</p>
<p><b>Risk = Threat × Vulnerability × Impact</b></p>
<table class="tbl">
<tr><th>ทางเลือกจัดการความเสี่ยง</th><th>หมายถึง</th><th>ตัวอย่าง</th></tr>
<tr><td><b>Mitigate</b></td><td>ลดความเสี่ยงลง</td><td>ติดตั้ง patch, เพิ่ม MFA, แยกวง</td></tr>
<tr><td><b>Transfer</b></td><td>โอนไปให้คนอื่นรับ</td><td>ซื้อประกันไซเบอร์, ใช้บริการ cloud ที่รับผิดชอบส่วนนั้น</td></tr>
<tr><td><b>Avoid</b></td><td>เลิกทำกิจกรรมนั้น</td><td>ปิดบริการที่เสี่ยงและไม่คุ้มค่าที่จะเก็บไว้</td></tr>
<tr><td><b>Accept</b></td><td>ยอมรับไว้อย่างเป็นทางการ</td><td>ต้องมี<b>ผู้มีอำนาจเซ็นรับ</b>และทบทวนเป็นรอบ ไม่ใช่เงียบไว้เฉย ๆ</td></tr>
</table>
<p><b>การประเมินความเสี่ยงสองแบบ</b></p>
<table class="tbl">
<tr><th></th><th>Qualitative</th><th>Quantitative</th></tr>
<tr><td>วิธี</td><td>ให้ระดับ สูง/กลาง/ต่ำ ลงตาราง heat map</td><td>คำนวณเป็นตัวเงิน</td></tr>
<tr><td>ข้อดี</td><td>เร็ว ทำได้ทันที ใช้สื่อสารง่าย</td><td>เอาไปเทียบกับงบประมาณได้ตรง ๆ</td></tr>
<tr><td>ข้อเสีย</td><td>อัตวิสัย เถียงกันได้</td><td>ต้องมีข้อมูลสถิติที่มักไม่มีจริง</td></tr>
</table>
<div class="note"><b>สูตรเชิงปริมาณที่ออกสอบบ่อย</b><br>
<b>SLE</b> (Single Loss Expectancy) = มูลค่าทรัพย์สิน × Exposure Factor<br>
<b>ALE</b> (Annualized Loss Expectancy) = SLE × <b>ARO</b> (จำนวนครั้งที่คาดว่าจะเกิดต่อปี)<br>
<i>ตัวอย่าง</i>: เซิร์ฟเวอร์มูลค่า 1,000,000 บาท ถ้าเกิดเหตุจะเสียหาย 50% (EF = 0.5) → SLE = 500,000 บาท
คาดว่าเกิดทุก 4 ปี (ARO = 0.25) → <b>ALE = 125,000 บาทต่อปี</b><br>
แปลว่ามาตรการที่ราคาต่ำกว่า 125,000 บาทต่อปีถือว่าคุ้มค่า — นี่คือวิธีขออนุมัติงบให้ผ่าน</div>
<p><b>Business Impact Analysis — ตัวเลขที่ต้องตกลงกับฝ่ายธุรกิจ ไม่ใช่ฝ่ายไอทีคิดเอง</b></p>
<table class="tbl">
<tr><th>ค่า</th><th>ความหมาย</th><th>ตอบคำถามว่า</th></tr>
<tr><td><b>RTO</b> (Recovery Time Objective)</td><td>เวลาสูงสุดที่ระบบหยุดได้</td><td>"ต้องกลับมาภายในกี่ชั่วโมง"</td></tr>
<tr><td><b>RPO</b> (Recovery Point Objective)</td><td>ข้อมูลที่ยอมให้หายได้</td><td>"ยอมเสียข้อมูลย้อนหลังได้กี่ชั่วโมง" → <b>กำหนดความถี่ของ backup</b></td></tr>
<tr><td><b>MTTR</b></td><td>เวลาเฉลี่ยที่ใช้ซ่อม</td><td>"ปกติเราซ่อมเสร็จในเวลาเท่าไหร่"</td></tr>
<tr><td><b>MTBF</b></td><td>เวลาเฉลี่ยระหว่างการเสีย</td><td>"อุปกรณ์นี้เสียบ่อยแค่ไหน"</td></tr>
</table>
<div class="note warn"><b>RPO เป็นตัวกำหนดความถี่ backup โดยตรง</b> — ถ้าธุรกิจบอกว่า RPO = 1 ชั่วโมง
แต่คุณ backup วันละครั้ง แปลว่าคุณไม่มีทางทำตามข้อตกลงได้เลย ต้องกลับไปคุยกันใหม่ว่าจะเพิ่มความถี่ (เพิ่มต้นทุน)
หรือธุรกิจจะยอมรับ RPO ที่ยาวขึ้น — การเงียบไว้แล้วหวังว่าจะไม่เกิดคือความเสี่ยงที่ไม่มีใครรับรู้</div>`,
      },
    ],

    quiz: [
      { type: 'mcq', q: 'ลำดับขั้นตอนของ Incident Response ที่ถูกต้องคือข้อใด', opts: ['Identification → Preparation → Containment → Recovery', 'Preparation → Identification → Containment → Eradication → Recovery → Lessons Learned', 'Containment → Identification → Recovery → Preparation', 'Preparation → Containment → Identification → Recovery'], a: 1, why: 'Preparation ต้องมาก่อนเสมอเพราะทำล่วงหน้าก่อนเกิดเหตุ และ Lessons Learned ปิดท้ายเพื่อป้อนกลับไปปรับปรุง Preparation รอบถัดไป' },
      { type: 'mcq', q: 'ทำไมจึงไม่ควรปิดเครื่องทันทีเมื่อสงสัยว่าถูกบุกรุก', opts: ['เพราะเครื่องจะเสีย', 'เพราะหลักฐานใน RAM เช่น process, กุญแจเข้ารหัส และมัลแวร์ fileless จะหายทันที', 'เพราะต้องรอหัวหน้าอนุมัติ', 'ปิดได้ ไม่มีปัญหา'], a: 1, why: 'ตาม order of volatility ข้อมูลใน RAM ระเหยเร็วเป็นอันดับต้น ๆ วิธีที่ถูกคือตัดออกจากเครือข่าย (isolate) แต่ยังเปิดเครื่องไว้เพื่อเก็บหน่วยความจำก่อน' },
      { type: 'mcq', q: 'ตาม Order of Volatility ควรเก็บหลักฐานจากที่ใดก่อน', opts: ['ไฟล์ log บนดิสก์', 'ข้อมูลใน RAM และการเชื่อมต่อเครือข่ายที่เปิดอยู่', 'ไฟล์ backup', 'ภาพถ่ายหน้าจอ'], a: 1, why: 'เก็บของที่หายง่ายที่สุดก่อน — RAM หายทันทีที่ปิดเครื่อง ส่วน log บนดิสก์และ backup อยู่ได้นานกว่ามาก' },
      { type: 'mcq', q: 'Chain of Custody สำคัญอย่างไร', opts: ['ทำให้เก็บหลักฐานได้เร็วขึ้น', 'พิสูจน์ได้ว่าหลักฐานไม่ถูกแก้ไขตั้งแต่เก็บจนถึงชั้นศาล — ถ้าขาดตอนเดียวอาจใช้ไม่ได้', 'ช่วยลดขนาดไฟล์หลักฐาน', 'เป็นแค่เอกสารประกอบ ไม่จำเป็น'], a: 1, why: 'ต้องบันทึกว่าใครถือครองหลักฐานเมื่อไหร่และทำอะไรกับมันบ้าง พร้อมค่า hash ก่อนและหลัง เพื่อยืนยันความสมบูรณ์ตลอดสาย' },
      { type: 'cmd', q: 'พิมพ์คำสั่งคำนวณ hash ของไฟล์หลักฐานเพื่อยืนยันความสมบูรณ์', ans: ['sha256sum /tmp/evidence-20260823.tar.gz', 'sha256sum'], why: 'ต้องคำนวณ hash ทันทีที่ทำสำเนาเสร็จ แล้วบันทึกไว้ในเอกสาร chain of custody จากนั้นวิเคราะห์จากสำเนาเท่านั้น ไม่แตะต้นฉบับ' },
      { type: 'mcq', q: 'ทางเลือกจัดการความเสี่ยงแบบ "Transfer" หมายถึงอะไร', opts: ['ลดความเสี่ยงด้วยมาตรการทางเทคนิค', 'โอนความเสี่ยงไปให้ผู้อื่นรับ เช่น ซื้อประกันไซเบอร์', 'เลิกทำกิจกรรมนั้น', 'ยอมรับความเสี่ยงไว้'], a: 1, why: 'Transfer ไม่ได้ทำให้เหตุการณ์ไม่เกิด แต่ย้ายภาระทางการเงินไปให้อีกฝ่าย — และไม่เคยโอนความรับผิดชอบต่อชื่อเสียงและลูกค้าไปได้' },
      { type: 'mcq', q: 'เซิร์ฟเวอร์มูลค่า 1,000,000 บาท EF = 0.5 และ ARO = 0.25 ค่า ALE เท่ากับเท่าไหร่', opts: ['125,000 บาท', '250,000 บาท', '500,000 บาท', '1,000,000 บาท'], a: 0, why: 'SLE = 1,000,000 × 0.5 = 500,000 · ALE = SLE × ARO = 500,000 × 0.25 = 125,000 บาทต่อปี — มาตรการที่ถูกกว่านี้ต่อปีถือว่าคุ้มค่าที่จะลงทุน' },
      { type: 'mcq', q: 'RPO กำหนดอะไรโดยตรง', opts: ['ความเร็วในการกู้ระบบ', 'ความถี่ของการทำ backup', 'จำนวนเซิร์ฟเวอร์สำรอง', 'งบประมาณด้านความปลอดภัย'], a: 1, why: 'RPO คือปริมาณข้อมูลที่ยอมให้หายได้ ถ้า RPO = 1 ชั่วโมง ก็ต้อง backup หรือทำ replication อย่างน้อยทุกชั่วโมง — ส่วน RTO คือเวลาที่ยอมให้ระบบหยุด' },
      { type: 'mcq', q: 'ขั้นตอน Lessons Learned ควรมุ่งเน้นเรื่องใด', opts: ['หาว่าใครเป็นคนผิดเพื่อลงโทษ', 'แก้ไขกระบวนการและช่องว่างของระบบ ไม่ใช่หาคนผิด', 'เขียนรายงานส่งผู้บริหารอย่างเดียว', 'ข้ามได้ถ้าแก้ปัญหาจบแล้ว'], a: 1, why: 'วัฒนธรรมโทษคนทำให้ครั้งต่อไปไม่มีใครกล้ารายงานเหตุตั้งแต่เนิ่น ๆ ซึ่งอันตรายกว่าตัวเหตุการณ์เอง — ควรทบทวนภายใน 2 สัปดาห์ขณะที่ยังจำรายละเอียดได้' },
      { type: 'multi', q: 'ข้อใดเป็นมาตรการ containment ที่เหมาะสม (เลือกทุกข้อที่ถูก)', opts: ['ตัดเครื่องออกจากเครือข่ายแต่ยังเปิดเครื่องไว้', 'บล็อกการติดต่อไปยัง C2 ที่ firewall', 'ปิดบัญชีที่ถูกยึดและเพิกถอน session ที่ยังใช้ได้', 'ฟอร์แมตเครื่องทันทีเพื่อความรวดเร็ว'], a: [0, 1, 2], why: 'การฟอร์แมตทันทีทำลายหลักฐานทั้งหมด ทำให้ไม่มีวันรู้ว่าเขาเข้ามาทางไหน ผลคือปิดช่องโหว่ไม่ได้และจะโดนซ้ำด้วยวิธีเดิม' },
    ],

    labs: [{
      id: 'cy-sp-l4',
      title: 'Security+ Lab 4 — รับมือเหตุการณ์และเก็บหลักฐานให้ใช้ได้จริง',
      brief: 'SIEM แจ้งเตือนว่าเซิร์ฟเวอร์ตัวหนึ่งมีการเชื่อมต่อออกไปยัง IP ต่างประเทศเป็นจังหวะสม่ำเสมอ คุณต้องเก็บหลักฐานตามลำดับความระเหยให้ถูกต้อง ก่อนจะ containment โดยไม่ทำลายหลักฐาน',
      device: 'linux-sec',
      init: { apply: st => { addUser(st, 'somchai'); addFile(st, '/tmp/sample.bin', 'ELF payload\nhttp://c2-server.example.net/beacon\n203.0.113.66\n'); st.services.auditd.active = true; } },
      tasks: [
        { t: 'เก็บสถานะ process ที่กำลังทำงาน (ระเหยง่าย เก็บก่อน)', hint: 'ps aux', check: (s, h) => said(h, /^ps\s+aux/i) },
        { t: 'เก็บรายการเชื่อมต่อเครือข่ายที่เปิดอยู่ ณ ขณะนั้น', hint: 'ss -tunp', check: (s, h) => said(h, /ss\s+-\w+/i) },
        { t: 'ดูว่าใครกำลังล็อกอินอยู่ในเครื่องและทำอะไร', hint: 'w', check: (s, h) => said(h, /^w\s*$/i) },
        { t: 'ดูประวัติการล็อกอินย้อนหลัง', hint: 'last', check: (s, h) => said(h, /^last\s*$/i) },
        { t: 'ดึง log ในช่วงเวลาที่เกิดเหตุเพื่อทำ timeline', hint: 'journalctl --since "2026-08-20 08:00" --until "2026-08-20 12:00"', check: (s, h) => said(h, /journalctl.*--since/i) },
        { t: 'ดักดู traffic ยืนยันปลายทางที่เครื่องติดต่อออกไป', hint: 'sudo tcpdump -i ens33 -c 20', check: (s, h) => said(h, /tcpdump/i) },
        { t: 'ทำสำเนา log ทั้งหมดเป็นไฟล์หลักฐาน', hint: 'sudo tar -czf /tmp/evidence-20260823.tar.gz /var/log', check: (s, h) => said(h, /tar\s+.*-c.*\/var\/log|tar\s+-czf/i) },
        { t: 'คำนวณ hash ของไฟล์หลักฐานทันทีเพื่อยืนยันความสมบูรณ์', hint: 'sha256sum /tmp/evidence-20260823.tar.gz', check: (s, h) => said(h, /sha256sum.*evidence|sha256sum/i) },
        { t: 'ตรวจ timestamp ของไฟล์ต้องสงสัย (atime / mtime / ctime)', hint: 'stat /tmp/sample.bin', check: (s, h) => said(h, /^stat\s/i) },
        { t: 'ดูข้อความที่อ่านได้ในไฟล์ต้องสงสัย เพื่อหา IoC เช่นโดเมนหรือ IP', hint: 'strings /tmp/sample.bin', check: (s, h) => said(h, /^strings\s/i) },
        { t: 'ปิดบัญชีที่สงสัยว่าถูกยึด (containment โดยไม่ปิดเครื่อง)', hint: 'sudo usermod -L somchai', check: (s, h) => said(h, /usermod\s+-L|passwd\s+-l/i) },
      ],
    }],
  },

  // ================================================================
  //  ระดับ 5 — Lesson 9, 11, 15, 16, 20, 21
  // ================================================================
  5: {
    sections: [
      {
        t: 'Lesson 9 — Implement Secure Network Designs',
        h: `
<p>การออกแบบที่ดีทำให้ความผิดพลาดหนึ่งจุด<b>ไม่ลาม</b>ไปทั้งองค์กร หลักที่ใช้ได้กับทุกขนาดคือ <b>Defense in Depth</b> — หลายชั้น หลายประเภท</p>
<table class="tbl">
<tr><th>แนวคิด</th><th>รายละเอียด</th></tr>
<tr><td><b>Segmentation</b></td><td>แบ่งวงตามหน้าที่และระดับความเชื่อถือ — server, ผู้ใช้, guest, กล้อง/IoT, management ต้องแยกกัน</td></tr>
<tr><td><b>DMZ / Screened subnet</b></td><td>วางระบบที่ต้องให้คนนอกเข้าถึงไว้ในวงกลาง ไม่ให้มันคุยตรงกับวงภายใน</td></tr>
<tr><td><b>Zero Trust</b></td><td>ไม่เชื่อใครเพียงเพราะอยู่ในวงภายใน — ตรวจสอบตัวตนและสิทธิ์ทุกครั้งตามบริบท</td></tr>
<tr><td><b>East-West vs North-South</b></td><td>traffic ระหว่างเซิร์ฟเวอร์ด้วยกัน (east-west) มักไม่ถูกตรวจเลย จึงเป็นเส้นทางที่ผู้โจมตีใช้เดินต่อภายใน</td></tr>
<tr><td><b>Air gap</b></td><td>ตัดขาดทางกายภาพ — ใช้กับระบบที่สำคัญสูงสุด แต่ต้องระวังเรื่อง USB</td></tr>
</table>
<p><b>Secure switching และ routing</b></p>
<table class="tbl">
<tr><th>มาตรการ</th><th>ป้องกันอะไร</th></tr>
<tr><td><b>Port security</b> / <b>802.1X</b></td><td>จำกัด MAC ต่อพอร์ต / บังคับยืนยันตัวตนก่อนใช้พอร์ต — กันคนเดินมาเสียบสาย</td></tr>
<tr><td><b>DHCP snooping</b></td><td>กัน DHCP server ปลอมที่จะแจก gateway ปลอมให้ทุกคน</td></tr>
<tr><td><b>Dynamic ARP Inspection</b></td><td>กัน ARP spoofing ซึ่งเป็นฐานของการดักฟังแบบ man-in-the-middle</td></tr>
<tr><td><b>BPDU Guard / Root Guard</b></td><td>กันคนเอา switch มาต่อเองแล้วทำให้ topology เปลี่ยน</td></tr>
<tr><td><b>ปิดพอร์ตที่ไม่ใช้</b> และย้าย native VLAN</td><td>กัน VLAN hopping และการเสียบใช้งานโดยไม่ได้รับอนุญาต</td></tr>
<tr><td><b>Route authentication</b></td><td>ใส่รหัสให้ routing protocol เพื่อกัน route ปลอม</td></tr>
</table>
<p><b>Secure wireless infrastructure</b> — WPA3-SAE ดีกว่า WPA2-PSK เพราะกันการดักจับ handshake ไปเดารหัสภายหลัง ·
องค์กรควรใช้ <b>WPA2/3-Enterprise + 802.1X</b> ให้ทุกคนล็อกอินด้วยบัญชีตัวเอง ·
แยก SSID ของ guest ออกไปคนละ VLAN และเปิด <b>client isolation</b> ·
ปิด WPS · ระวัง <b>rogue AP</b> และ <b>evil twin</b> ด้วยการสแกนหา AP แปลกปลอมเป็นรอบ</p>
<p><b>Load balancer</b> — นอกจากกระจายโหลดแล้วยังเป็นมาตรการด้าน availability และเป็นจุดวาง TLS termination กับ WAF</p>
<table class="tbl">
<tr><th>โหมด/ค่า</th><th>ความหมาย</th></tr>
<tr><td>Active/Active</td><td>ทุกตัวรับงานพร้อมกัน — ใช้ทรัพยากรคุ้มที่สุด</td></tr>
<tr><td>Active/Passive</td><td>ตัวสำรองรออยู่เฉย ๆ จนกว่าตัวหลักล่ม — ง่ายกว่าและคาดเดาได้กว่า</td></tr>
<tr><td>Session persistence</td><td>ส่งผู้ใช้เดิมกลับไปเครื่องเดิม (sticky session) จำเป็นกับแอปที่เก็บ state ไว้ในเครื่อง</td></tr>
<tr><td>Health check</td><td>ตรวจว่าเครื่องหลังบ้านยังตอบไหว — ถ้าไม่มี ก็ยังส่งผู้ใช้ไปหาเครื่องที่ตายแล้ว</td></tr>
</table>`,
      },
      {
        t: 'Lesson 11 — Implement Secure Network Protocols',
        h: `
<p>หลักง่าย ๆ ข้อเดียว: <b>ทุกโปรโตคอลรุ่นเก่าที่ไม่เข้ารหัส มีรุ่นใหม่ที่เข้ารหัสแล้วเสมอ</b> — งานคือไล่เปลี่ยนให้ครบ</p>
<table class="tbl">
<tr><th>งาน</th><th>อย่าใช้</th><th>ใช้แทน</th></tr>
<tr><td>จัดการอุปกรณ์</td><td>Telnet (23)</td><td><b>SSH</b> (22)</td></tr>
<tr><td>โอนไฟล์</td><td>FTP (21)</td><td><b>SFTP</b> / <b>FTPS</b></td></tr>
<tr><td>เว็บ</td><td>HTTP (80)</td><td><b>HTTPS</b> (443) + HSTS</td></tr>
<tr><td>อีเมล</td><td>POP3/IMAP/SMTP เปล่า</td><td><b>POP3S (995) · IMAPS (993) · SMTPS/STARTTLS (587)</b></td></tr>
<tr><td>ไดเรกทอรี</td><td>LDAP (389)</td><td><b>LDAPS</b> (636)</td></tr>
<tr><td>เฝ้าระวัง</td><td>SNMPv1/v2c (community เป็นข้อความเปล่า)</td><td><b>SNMPv3</b> (มี auth + encryption)</td></tr>
<tr><td>เทียบเวลา</td><td>NTP ธรรมดา</td><td><b>NTS</b> หรืออย่างน้อยจำกัดแหล่งที่เชื่อถือ</td></tr>
<tr><td>DNS</td><td>DNS เปล่า</td><td><b>DNSSEC</b> (ยืนยันว่าคำตอบไม่ถูกปลอม) · <b>DoT/DoH</b> (เข้ารหัสคำถาม)</td></tr>
<tr><td>เข้าจากภายนอก</td><td>RDP เปิดตรงออกเน็ต · PPTP</td><td><b>VPN + MFA</b> แล้วค่อยต่อ RDP ข้างใน</td></tr>
</table>
<div class="note"><b>DNSSEC ไม่ได้เข้ารหัส</b> — มันยืนยันว่าคำตอบมาจากเจ้าของโดเมนจริงและไม่ถูกแก้ (integrity + authenticity)
ส่วนการ<b>เข้ารหัส</b>คำถามคือหน้าที่ของ DoT/DoH — เป็นคนละเรื่องที่คนสับสนกันบ่อยมาก</div>
<p><b>Remote access — เปรียบเทียบ VPN</b></p>
<table class="tbl">
<tr><th>แบบ</th><th>ลักษณะ</th></tr>
<tr><td><b>Full tunnel</b></td><td>ทุก traffic วิ่งผ่านองค์กร — ตรวจสอบได้หมด แต่กินแบนด์วิดท์และช้ากว่า</td></tr>
<tr><td><b>Split tunnel</b></td><td>เฉพาะ traffic ที่ไปหาองค์กรเท่านั้นที่เข้า tunnel — เร็วกว่า แต่<b>เครื่องผู้ใช้ต่อเน็ตตรงพร้อมกัน</b> จึงเสี่ยงกว่า</td></tr>
<tr><td><b>IPSec</b></td><td>มาตรฐานสำหรับเชื่อมสาขาต่อสาขา (site-to-site)</td></tr>
<tr><td><b>SSL/TLS VPN</b></td><td>ผ่าน firewall ที่อื่นได้ง่าย เหมาะกับผู้ใช้ที่เดินทาง</td></tr>
<tr><td><b>Out-of-band management</b></td><td>ช่องทางจัดการแยกจากเครือข่ายหลัก — ใช้ตอนระบบหลักล่ม ต้องคุมเข้มเป็นพิเศษ</td></tr>
</table>
<pre class="code"><span style="color:#5b6b8c"># ตรวจว่าเครื่องยังเปิดโปรโตคอลที่ไม่ปลอดภัยอยู่หรือไม่</span>
ss -tulpn

<span style="color:#5b6b8c"># ตรวจว่าเว็บบังคับ HTTPS และมี HSTS ไหม</span>
curl -I https://example.com

<span style="color:#5b6b8c"># ตรวจว่า DNS ตอบอะไรและมีการยืนยันหรือไม่</span>
dig example.com</pre>`,
      },
      {
        t: 'Lesson 15 — Implement Secure Cloud Solutions',
        h: `
<p><b>Shared Responsibility Model</b> — เรื่องที่ทำให้ข้อมูลรั่วมากที่สุดบนคลาวด์ คือการเข้าใจผิดว่า "ผู้ให้บริการดูแลให้หมดแล้ว"</p>
<table class="tbl">
<tr><th>โมเดล</th><th>ผู้ให้บริการดูแล</th><th><b>คุณดูแล</b></th></tr>
<tr><td><b>IaaS</b></td><td>ฮาร์ดแวร์, เครือข่าย, hypervisor</td><td><b>OS, patch, แอป, ข้อมูล, การตั้งค่า, สิทธิ์</b></td></tr>
<tr><td><b>PaaS</b></td><td>เพิ่ม OS และ runtime</td><td><b>แอป, ข้อมูล, สิทธิ์</b></td></tr>
<tr><td><b>SaaS</b></td><td>เกือบทั้งหมด</td><td><b>ข้อมูล, บัญชีผู้ใช้และสิทธิ์ — ยังเป็นของคุณเสมอ</b></td></tr>
</table>
<div class="note warn"><b>ไม่ว่าโมเดลไหน "ข้อมูลและสิทธิ์" เป็นความรับผิดชอบของคุณเสมอ</b> — เหตุข้อมูลรั่วบนคลาวด์ส่วนใหญ่
ไม่ได้เกิดจากผู้ให้บริการถูกเจาะ แต่เกิดจาก <b>storage ที่ตั้งเป็น public</b>, <b>access key หลุดใน git</b>
และ <b>สิทธิ์ IAM ที่กว้างเกินจำเป็น</b></div>
<table class="tbl">
<tr><th>มาตรการบนคลาวด์</th><th>รายละเอียด</th></tr>
<tr><td><b>CASB</b></td><td>ตัวกลางที่มองเห็นและบังคับนโยบายกับบริการคลาวด์ที่พนักงานใช้ รวมถึง shadow IT</td></tr>
<tr><td><b>Security groups / NACL</b></td><td>firewall ระดับคลาวด์ — ต้องตั้งแบบ deny by default</td></tr>
<tr><td><b>IAM roles + least privilege</b></td><td>ใช้ role ชั่วคราวแทน access key ถาวร และเปิด MFA กับบัญชี root เสมอ</td></tr>
<tr><td><b>KMS / CMK</b></td><td>จัดการกุญแจเข้ารหัสเอง เพื่อควบคุมว่าใครถอดรหัสข้อมูลได้</td></tr>
<tr><td><b>Cloud audit log</b></td><td>เปิดไว้เสมอและส่งไปเก็บที่บัญชีแยก เพื่อไม่ให้ผู้บุกรุกลบร่องรอยได้</td></tr>
</table>
<p><b>Virtualization</b> — ความเสี่ยงเฉพาะทางคือ <b>VM escape</b> (หลุดจาก VM ไปคุม hypervisor),
<b>VM sprawl</b> (VM ที่ไม่มีใครดูแลและไม่ถูก patch) และ <b>ปัญหาการแยกทรัพยากร</b> เมื่อใช้เครื่องร่วมกับคนอื่น</p>
<p><b>Infrastructure as Code</b> — เขียนโครงสร้างพื้นฐานเป็นไฟล์ที่เก็บใน git</p>
<ul>
  <li>ได้ <b>ความสม่ำเสมอ</b> — ทุกเซิร์ฟเวอร์ตั้งค่าเหมือนกันเป๊ะ ไม่มี "เครื่องพิเศษ" ที่ไม่มีใครกล้าแตะ</li>
  <li>ได้ <b>ประวัติการเปลี่ยนแปลง</b> ที่ตรวจสอบและย้อนกลับได้</li>
  <li>ทำ <b>immutable infrastructure</b> ได้ — เวลาต้องแก้ก็สร้างใหม่ทับ แทนที่จะเข้าไปแก้ทีละเครื่อง</li>
  <li><b>ความเสี่ยงใหม่</b>: ถ้ามี secret ฝังในไฟล์ IaC มันจะไปอยู่ใน git ตลอดกาล — ต้องสแกน repo เป็นรอบ</li>
</ul>`,
      },
      {
        t: 'Lesson 16 — Data Privacy และการคุ้มครองข้อมูล',
        h: `
<p>ทุกมาตรการเริ่มจากคำถามเดียว: <b>เรามีข้อมูลอะไรอยู่บ้าง และมันสำคัญแค่ไหน</b> — ถ้าตอบไม่ได้ ก็ปกป้องไม่ถูกจุด</p>
<table class="tbl">
<tr><th>ระดับชั้นข้อมูล</th><th>ตัวอย่าง</th></tr>
<tr><td><b>Public</b></td><td>ข้อมูลที่เผยแพร่ได้</td></tr>
<tr><td><b>Internal</b></td><td>ใช้ภายในองค์กร</td></tr>
<tr><td><b>Confidential</b></td><td>ข้อมูลลูกค้า สัญญา ข้อมูลการเงิน</td></tr>
<tr><td><b>Restricted / Critical</b></td><td>ข้อมูลสุขภาพ ข้อมูลบัตร ความลับทางการค้า</td></tr>
</table>
<table class="tbl">
<tr><th>ศัพท์</th><th>ความหมาย</th></tr>
<tr><td><b>PII</b></td><td>ข้อมูลที่ระบุตัวบุคคลได้ — ชื่อ เลขบัตรประชาชน เบอร์โทร</td></tr>
<tr><td><b>PHI</b></td><td>ข้อมูลสุขภาพ</td></tr>
<tr><td><b>Data owner</b></td><td>ผู้รับผิดชอบทางธุรกิจ ตัดสินใจว่าใครเข้าถึงได้</td></tr>
<tr><td><b>Data custodian</b></td><td><b>ผู้ดูแลระบบ (คุณ)</b> — ปฏิบัติตามที่ owner กำหนด</td></tr>
<tr><td><b>Data processor</b></td><td>ผู้ประมวลผลข้อมูลตามคำสั่งของ controller เช่นผู้ให้บริการภายนอก</td></tr>
<tr><td><b>DPO</b></td><td>เจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล — PDPA กำหนดให้บางองค์กรต้องมี</td></tr>
</table>
<p><b>เทคนิคลดความเสี่ยงของข้อมูล</b></p>
<table class="tbl">
<tr><th>เทคนิค</th><th>ทำอะไร</th><th>ย้อนกลับได้ไหม</th></tr>
<tr><td><b>Encryption</b></td><td>เข้ารหัสด้วยกุญแจ</td><td>ได้ ถ้ามีกุญแจ</td></tr>
<tr><td><b>Tokenization</b></td><td>แทนค่าจริงด้วย token ที่ไม่มีความหมาย เก็บ mapping ไว้แยก</td><td>ได้ ผ่านระบบ token</td></tr>
<tr><td><b>Masking</b></td><td>ซ่อนบางส่วน เช่น <code>xxxx-xxxx-xxxx-1234</code></td><td>ไม่ได้ (ในมุมผู้ใช้)</td></tr>
<tr><td><b>Anonymization</b></td><td>ตัดสิ่งที่ระบุตัวตนออกอย่างถาวร</td><td><b>ไม่ได้</b></td></tr>
<tr><td><b>Pseudonymization</b></td><td>แทนตัวระบุด้วยรหัส แต่ยังมีคีย์เชื่อมกลับเก็บแยกไว้</td><td>ได้ ถ้ามีคีย์</td></tr>
</table>
<div class="note"><b>DLP (Data Loss Prevention)</b> ตรวจจับและหยุดข้อมูลสำคัญไม่ให้ออกจากองค์กร —
ทั้งทางอีเมล, USB, การอัปโหลดขึ้นคลาวด์ · ทำงานได้ก็ต่อเมื่อมีการ<b>จัดชั้นข้อมูลไว้ก่อน</b>เท่านั้น<br>
<b>PDPA</b> กำหนดว่าต้องแจ้งเหตุข้อมูลรั่วต่อสำนักงานคณะกรรมการฯ ภายใน <b>72 ชั่วโมง</b> นับแต่ทราบเหตุ
— ตัวเลขนี้ควรอยู่ในแผน incident response ของคุณตั้งแต่วันนี้</div>`,
      },
      {
        t: 'Lesson 20 — Cybersecurity Resilience',
        h: `
<p>Resilience คือความสามารถที่จะ<b>ทำงานต่อได้แม้บางส่วนพัง</b> — ไม่ใช่การทำให้ไม่มีอะไรพังเลย ซึ่งเป็นไปไม่ได้</p>
<table class="tbl">
<tr><th>ระดับ</th><th>วิธีสร้างความซ้ำซ้อน</th></tr>
<tr><td>ดิสก์</td><td>RAID — <b>RAID 1</b> มิเรอร์ · <b>RAID 5</b> parity หนึ่งชุด · <b>RAID 6</b> ทนเสียสองลูก · <b>RAID 10</b> เร็วและทนที่สุด</td></tr>
<tr><td>ไฟฟ้า</td><td>UPS สำหรับช่วงสั้น · เครื่องปั่นไฟสำหรับช่วงยาว · dual power supply</td></tr>
<tr><td>เครือข่าย</td><td>NIC teaming · ลิงก์จากสองผู้ให้บริการ · อุปกรณ์สำรอง</td></tr>
<tr><td>ระบบ</td><td>Cluster, load balancer, replication ข้ามศูนย์ข้อมูล</td></tr>
<tr><td>สถานที่</td><td><b>Hot site</b> พร้อมใช้ทันที · <b>Warm site</b> มีอุปกรณ์แต่ต้องกู้ข้อมูล · <b>Cold site</b> มีแค่พื้นที่</td></tr>
</table>
<div class="note warn"><b>RAID ไม่ใช่ backup</b> — RAID ป้องกันดิสก์เสีย แต่ถ้าไฟล์ถูกลบ ถูกเข้ารหัสด้วย ransomware
หรือถูกแก้ผิด มันจะซิงก์ความเสียหายนั้นไปทุกลูกทันที</div>
<p><b>กลยุทธ์ Backup</b></p>
<table class="tbl">
<tr><th>แบบ</th><th>สำรองอะไร</th><th>กู้คืนอย่างไร</th></tr>
<tr><td><b>Full</b></td><td>ทั้งหมด</td><td>ใช้ชุดเดียว เร็วที่สุด แต่กินพื้นที่และเวลา backup มากสุด</td></tr>
<tr><td><b>Incremental</b></td><td>เฉพาะที่เปลี่ยนตั้งแต่ backup <b>ครั้งล่าสุด</b></td><td>ต้องใช้ full + incremental <b>ทุกชุด</b> ตามลำดับ — backup เร็ว กู้ช้า</td></tr>
<tr><td><b>Differential</b></td><td>ที่เปลี่ยนตั้งแต่ <b>full ครั้งล่าสุด</b></td><td>ใช้ full + differential ชุดล่าสุดชุดเดียว — สมดุลที่สุด</td></tr>
<tr><td><b>Snapshot</b></td><td>ภาพ ณ เวลาหนึ่ง</td><td>กู้เร็วมาก แต่มักอยู่บน storage เดียวกัน จึงไม่ใช่ backup ที่แท้จริง</td></tr>
</table>
<div class="note"><b>กฎ 3-2-1 ที่ยังใช้ได้เสมอ</b> — เก็บ <b>3</b> สำเนา บน <b>2</b> ชนิดสื่อที่ต่างกัน โดยมี <b>1</b> ชุดอยู่นอกสถานที่<br>
ยุค ransomware ควรเพิ่มอีกข้อ: อย่างน้อยหนึ่งชุดต้อง <b>offline หรือ immutable</b> (เขียนทับไม่ได้)
เพราะ ransomware สมัยใหม่ตามไปเข้ารหัส backup ที่ต่อออนไลน์อยู่ด้วยเสมอ<br>
และที่สำคัญที่สุด — <b>backup ที่ไม่เคยทดสอบกู้คืน ไม่นับว่ามี backup</b> ต้องซ้อมกู้จริงตามรอบและจับเวลาเทียบกับ RTO</div>
<p><b>แนวคิดเสริมความทนทานอื่น ๆ</b> — <b>Diversity</b> ไม่พึ่งผู้ผลิตหรือเทคโนโลยีเดียว ·
<b>Non-persistence</b> คืนค่ากลับสู่สถานะที่รู้ว่าดีได้ (snapshot revert, live boot) ·
<b>High availability</b> วัดเป็น % ของเวลาที่ใช้งานได้ — 99.9% คือหยุดได้ราว 8.7 ชั่วโมงต่อปี ส่วน 99.99% เหลือแค่ราว 52 นาที</p>`,
      },
      {
        t: 'Lesson 21 — Physical Security',
        h: `
<p>มาตรการทางเทคนิคทั้งหมดหมดความหมายทันที ถ้าใครก็ตามเดินเข้าไปถึงตัวเครื่องได้
— คนที่เข้าถึงเครื่องได้ทางกายภาพ มีวิธียึดเครื่องนั้นได้เสมอ</p>
<table class="tbl">
<tr><th>ชั้น</th><th>มาตรการ</th></tr>
<tr><td><b>รอบนอก</b></td><td>รั้ว, bollard กันรถพุ่งชน, ไฟส่องสว่าง, ป้ายเตือน (deterrent)</td></tr>
<tr><td><b>ทางเข้า</b></td><td>ยาม, <b>mantrap / access control vestibule</b> ที่เปิดได้ทีละบานเพื่อกัน tailgating, เครื่องอ่านบัตร, สมุดลงชื่อ</td></tr>
<tr><td><b>ภายในอาคาร</b></td><td>กล้องวงจรปิด, เซ็นเซอร์ตรวจจับความเคลื่อนไหว, การแบ่งพื้นที่ตามสิทธิ์</td></tr>
<tr><td><b>ห้อง Server</b></td><td>ล็อกแยกต่างหาก, <b>ล็อกตู้แร็ค</b>, บันทึกการเข้าออก, ระบบดับเพลิงแบบไม่ใช้น้ำ, ควบคุมอุณหภูมิและความชื้น</td></tr>
<tr><td><b>ตัวเครื่อง</b></td><td>cable lock, ปิดพอร์ต USB, ตั้งรหัส BIOS/UEFI, ปิดการบูตจากสื่อภายนอก, full disk encryption</td></tr>
</table>
<table class="tbl">
<tr><th>เรื่องที่มักถูกลืม</th><th>รายละเอียด</th></tr>
<tr><td><b>การทำลายสื่อบันทึก</b></td><td>ลบไฟล์ไม่พอ — ต้อง <b>degauss</b> (สนามแม่เหล็ก, ใช้ไม่ได้กับ SSD), <b>shred</b> ทางกายภาพ หรือ <b>crypto-erase</b> ทำลายกุญแจ พร้อมใบรับรองการทำลาย</td></tr>
<tr><td><b>เอกสารกระดาษ</b></td><td>เครื่องทำลายเอกสารแบบ cross-cut และนโยบายโต๊ะสะอาด (clean desk)</td></tr>
<tr><td><b>USB ที่เก็บได้</b></td><td>ห้ามเสียบ — เป็นช่องทางที่ใช้ได้ผลมาโดยตลอด</td></tr>
<tr><td><b>ระบบ HVAC และไฟฟ้า</b></td><td>เป็นส่วนหนึ่งของความปลอดภัยเพราะกระทบ availability โดยตรง</td></tr>
<tr><td><b>กล้องวงจรปิดเอง</b></td><td>เป็นอุปกรณ์ที่ต้องปกป้องด้วย — เปลี่ยนรหัสโรงงาน แยกวง และจำกัดการเข้าถึง NVR</td></tr>
</table>
<div class="note"><b>Physical control กับ Logical control ต้องสอดคล้องกัน</b> — พนักงานที่ลาออกต้องถูกปิดทั้ง
<b>บัญชีในระบบ</b> และ <b>บัตรเข้าอาคาร</b> ในวันเดียวกัน<br>
checklist offboarding ที่ครอบคลุมทั้งสองด้าน คือหนึ่งใน control ที่ได้ผลสูงที่สุดและแทบไม่มีต้นทุน</div>`,
      },
    ],

    quiz: [
      { type: 'mcq', q: 'ทำไมการแบ่งวง (segmentation) จึงสำคัญ', opts: ['ทำให้เน็ตเร็วขึ้นอย่างเดียว', 'จำกัดไม่ให้ผู้บุกรุกที่เข้าถึงเครื่องหนึ่งเดินต่อไปยังระบบอื่นได้ง่าย', 'ประหยัด IP address', 'ทำให้ตั้งค่าง่ายขึ้น'], a: 1, why: 'segmentation จำกัดการเคลื่อนที่ด้านข้าง (lateral movement) — เมื่อเครื่องหนึ่งถูกยึด ความเสียหายจะถูกกักไว้ในวงเดียว ไม่ลามทั้งองค์กร' },
      { type: 'mcq', q: 'DHCP snooping ป้องกันอะไร', opts: ['ARP spoofing', 'DHCP server ปลอมที่แจก gateway ปลอมให้ผู้ใช้', 'DDoS', 'การเดารหัสผ่าน'], a: 1, why: 'ผู้โจมตีที่ตั้ง DHCP server ปลอมสามารถกำหนดตัวเองเป็น gateway และ DNS ของทุกคนในวง ทำให้ดักฟังได้ทั้งหมด — DHCP snooping ยอมรับเฉพาะ server บนพอร์ตที่ระบุว่าเชื่อถือได้' },
      { type: 'mcq', q: 'DNSSEC ทำหน้าที่อะไร', opts: ['เข้ารหัสคำถาม DNS ไม่ให้ใครดักอ่าน', 'ยืนยันว่าคำตอบ DNS มาจากเจ้าของโดเมนจริงและไม่ถูกแก้ระหว่างทาง', 'บล็อกเว็บอันตราย', 'เร่งความเร็ว DNS'], a: 1, why: 'DNSSEC ให้ integrity และ authenticity แต่ไม่ได้เข้ารหัส — การเข้ารหัสคำถามเป็นหน้าที่ของ DoT/DoH ซึ่งเป็นคนละกลไกกัน' },
      { type: 'mcq', q: 'Split tunnel VPN เสี่ยงกว่า full tunnel อย่างไร', opts: ['ช้ากว่า', 'เครื่องผู้ใช้ต่อกับอินเทอร์เน็ตโดยตรงพร้อมกับต่อ VPN จึงอาจเป็นสะพานให้ภัยคุกคามเข้าองค์กร', 'เข้ารหัสอ่อนกว่า', 'ไม่รองรับ MFA'], a: 1, why: 'ใน split tunnel องค์กรมองไม่เห็น traffic ที่ผู้ใช้ออกเน็ตตรง ถ้าเครื่องติดมัลแวร์ระหว่างนั้น มันก็มีเส้นทางเข้าองค์กรผ่าน tunnel ที่เปิดอยู่' },
      { type: 'mcq', q: 'บนคลาวด์แบบ IaaS ใครรับผิดชอบการ patch ระบบปฏิบัติการ', opts: ['ผู้ให้บริการคลาวด์', 'ลูกค้า (เรา)', 'แบ่งกันคนละครึ่ง', 'ไม่ต้อง patch'], a: 1, why: 'IaaS ผู้ให้บริการดูแลถึงระดับ hypervisor เท่านั้น ทุกอย่างตั้งแต่ OS ขึ้นมาเป็นของเรา — ความเข้าใจผิดตรงนี้คือสาเหตุของ VM ที่ไม่เคยถูก patch เลย' },
      { type: 'mcq', q: 'สาเหตุที่พบบ่อยที่สุดของข้อมูลรั่วบนคลาวด์คือข้อใด', opts: ['ผู้ให้บริการถูกเจาะ', 'การตั้งค่าผิด เช่น storage เป็น public หรือ access key หลุดใน git', 'การเข้ารหัสอ่อนเกินไป', 'ฮาร์ดแวร์เสียหาย'], a: 1, why: 'ผู้ให้บริการรายใหญ่มีความปลอดภัยระดับสูงมาก ช่องโหว่จึงมักอยู่ฝั่งลูกค้า — การตั้งค่าผิดและสิทธิ์ที่กว้างเกินจำเป็น' },
      { type: 'mcq', q: 'Anonymization ต่างจาก Pseudonymization อย่างไร', opts: ['เหมือนกัน', 'anonymization ย้อนกลับไม่ได้อย่างถาวร ส่วน pseudonymization ยังมีคีย์เชื่อมกลับที่เก็บแยกไว้', 'anonymization ใช้กับข้อมูลสุขภาพเท่านั้น', 'pseudonymization ปลอดภัยกว่าเสมอ'], a: 1, why: 'ข้อมูลที่ pseudonymized ยังถือเป็นข้อมูลส่วนบุคคลตามกฎหมายเพราะเชื่อมกลับได้ ส่วนข้อมูลที่ anonymized จริงจะหลุดพ้นจากขอบเขต PDPA' },
      { type: 'mcq', q: 'ตาม PDPA ต้องแจ้งเหตุข้อมูลส่วนบุคคลรั่วไหลภายในกี่ชั่วโมง', opts: ['24 ชั่วโมง', '48 ชั่วโมง', '72 ชั่วโมง', '7 วัน'], a: 2, why: '72 ชั่วโมงนับแต่ทราบเหตุ — ตัวเลขนี้ควรถูกเขียนไว้ในแผน incident response พร้อมระบุว่าใครเป็นผู้แจ้งและแจ้งอย่างไร' },
      { type: 'mcq', q: 'ทำไม RAID จึงไม่ใช่ backup', opts: ['เพราะช้ากว่า', 'เพราะเมื่อไฟล์ถูกลบหรือถูก ransomware เข้ารหัส ความเสียหายจะถูกซิงก์ไปทุกลูกทันที', 'เพราะราคาแพง', 'RAID เป็น backup ได้'], a: 1, why: 'RAID แก้ปัญหา "ดิสก์เสีย" อย่างเดียว ไม่ได้แก้ปัญหาการลบผิด แก้ผิด หรือถูกเข้ารหัส ซึ่งเป็นสาเหตุการสูญเสียข้อมูลที่พบบ่อยกว่ามาก' },
      { type: 'mcq', q: 'Differential backup ต่างจาก Incremental อย่างไร', opts: ['เหมือนกัน', 'differential สำรองทุกอย่างที่เปลี่ยนตั้งแต่ full ครั้งล่าสุด จึงกู้คืนด้วย full + differential ชุดล่าสุดชุดเดียว', 'differential เร็วกว่าตอน backup', 'incremental กู้คืนง่ายกว่า'], a: 1, why: 'incremental backup เร็วแต่กู้ช้าเพราะต้องเรียง full + incremental ทุกชุด ส่วน differential ใช้พื้นที่มากกว่าแต่กู้ด้วยสองชุดเสมอ' },
      { type: 'mcq', q: 'กฎ 3-2-1 หมายถึงอะไร', opts: ['สำรอง 3 ครั้งต่อวัน 2 เดือน 1 ปี', '3 สำเนา บน 2 ชนิดสื่อ โดย 1 ชุดอยู่นอกสถานที่', '3 เซิร์ฟเวอร์ 2 ศูนย์ข้อมูล 1 คลาวด์', '3 ผู้ดูแล 2 กะ 1 หัวหน้า'], a: 1, why: 'และในยุค ransomware ควรเพิ่มว่าอย่างน้อยหนึ่งชุดต้อง offline หรือ immutable เพราะ ransomware ตามไปเข้ารหัส backup ที่ต่อออนไลน์อยู่ด้วย' },
      { type: 'mcq', q: 'Access control vestibule (mantrap) ป้องกันอะไรโดยเฉพาะ', opts: ['ไฟไหม้', 'Tailgating — การเดินตามคนอื่นเข้าประตูโดยไม่รูดบัตร', 'การโจรกรรมข้อมูล', 'ไฟฟ้าดับ'], a: 1, why: 'ประตูสองบานที่เปิดได้ทีละบานบังคับให้คนผ่านทีละคน ทำให้ tailgating ทำไม่ได้ — ซึ่งเป็นวิธีเข้าอาคารที่ใช้ได้ผลที่สุดวิธีหนึ่ง' },
      { type: 'multi', q: 'ข้อใดควรอยู่ใน checklist ตอนพนักงานลาออก (เลือกทุกข้อที่ถูก)', opts: ['ปิดบัญชีในระบบทั้งหมด', 'เพิกถอนบัตรเข้าอาคาร', 'เรียกคืนอุปกรณ์และเพิกถอน session/token ที่ยังใช้ได้', 'เก็บบัญชีไว้ใช้ต่อสำหรับพนักงานคนใหม่'], a: [0, 1, 2], why: 'การใช้บัญชีต่อทำให้สืบไม่ได้ว่าใครทำอะไร และ physical control ต้องปิดพร้อมกับ logical control ในวันเดียวกัน ไม่งั้นก็ยังเดินเข้ามาได้' },
    ],

    labs: [
      {
        id: 'cy-sp-l5-net',
        title: 'Security+ Lab 5A — ตรวจการออกแบบเครือข่ายและโปรโตคอลที่ใช้จริง',
        brief: 'ก่อนการตรวจสอบประจำปี คุณต้องพิสูจน์ว่าเซิร์ฟเวอร์ไม่มีโปรโตคอลที่ไม่เข้ารหัสเปิดอยู่ ไฟร์วอลล์บนเครื่องทำงาน และการเชื่อมต่อขาออกใช้ช่องทางที่ปลอดภัย',
        device: 'linux-sec',
        tasks: [
          { t: 'ดูพอร์ตทั้งหมดที่เปิดฟังอยู่ พร้อม process เจ้าของ', hint: 'ss -tulpn', check: (s, h) => said(h, /ss\s+-\w+/i) },
          { t: 'ตรวจสถานะ host firewall และกฎที่ใช้อยู่', hint: 'sudo ufw status verbose', check: (s, h) => said(h, /ufw\s+status|iptables\s+-L|firewall-cmd/i) },
          { t: 'ตรวจการตั้งค่าเครือข่ายและเส้นทางของเครื่อง', hint: 'ip addr', check: (s, h) => said(h, /^ip\s+(addr|a)\b/i) },
          { t: 'ตรวจว่าเว็บปลายทางบังคับ HTTPS จริง', hint: 'curl -I https://example.com', check: (s, h) => said(h, /curl\s+-I/i) },
          { t: 'ตรวจ TLS เวอร์ชันและ cipher ที่เซิร์ฟเวอร์ยอมรับ', hint: 'openssl s_client -connect example.com:443', check: (s, h) => said(h, /s_client/i) },
          { t: 'ตรวจว่า DNS ตอบกลับถูกต้อง', hint: 'dig example.com', check: (s, h) => said(h, /^dig\s/i) },
          { t: 'สแกนตัวเองเพื่อยืนยันมุมมองจากภายนอกว่าเปิดอะไรบ้าง', hint: 'nmap -sV 127.0.0.1', check: (s, h) => said(h, /nmap/i) },
          { t: 'ตรวจว่าเวลาเครื่อง sync อยู่ (จำเป็นต่อการเรียง log)', hint: 'timedatectl', check: (s, h) => said(h, /timedatectl|^date\s*$/i) },
        ],
      },
      {
        id: 'cy-sp-l5-res',
        title: 'Security+ Lab 5B — ความทนทานของระบบ backup และการกู้คืน',
        brief: 'ฝ่ายธุรกิจกำหนด RPO ไว้ที่ 4 ชั่วโมงและ RTO 8 ชั่วโมง คุณต้องตรวจว่าระบบสำรองข้อมูลที่มีอยู่ทำได้จริงตามนั้น พร้อมยืนยันว่าไฟล์สำรองไม่เสียหายและกู้คืนได้',
        device: 'linux-sec',
        tasks: [
          { t: 'ดูพื้นที่ดิสก์ว่าเหลือพอสำหรับ backup หรือไม่', hint: 'df -h', check: (s, h) => said(h, /^df\s/i) },
          { t: 'ดูโครงสร้างดิสก์และ RAID/LVM ที่ใช้อยู่', hint: 'lsblk', check: (s, h) => said(h, /lsblk|pvs|vgs/i) },
          { t: 'สร้างไฟล์สำรองของ log ทั้งหมด', hint: 'sudo tar -czf /tmp/backup-20260823.tar.gz /var/log', check: (s, h) => said(h, /tar\s+-czf|tar\s+.*-c/i) },
          { t: 'คำนวณ hash ของไฟล์สำรองไว้ตรวจสอบภายหลัง', hint: 'sha256sum /tmp/backup-20260823.tar.gz', check: (s, h) => said(h, /sha256sum/i) },
          { t: 'ตรวจสอบว่าไฟล์สำรองถูกสร้างจริงและมีขนาดสมเหตุสมผล', hint: 'ls -lh /tmp', check: (s, h) => said(h, /ls\s+-l/i) },
          { t: 'ตรวจสถานะ service ที่ทำหน้าที่สำรองข้อมูล', hint: 'systemctl status cron', check: (s, h) => said(h, /systemctl\s+status/i) },
          { t: 'ตรวจว่ามีงานสำรองตั้งเวลาไว้ถี่พอสำหรับ RPO 4 ชั่วโมงหรือไม่', hint: 'crontab -l', check: (s, h) => said(h, /crontab\s+-l/i) },
          { t: 'ตรวจ log ว่างานสำรองรอบล่าสุดสำเร็จหรือล้มเหลว', hint: 'journalctl -u cron --since today', check: (s, h) => said(h, /journalctl/i) },
          { t: 'รันตรวจ baseline ความปลอดภัยรวมของเครื่องปิดท้าย', hint: 'sudo lynis audit system', check: (s, h) => said(h, /lynis/i) },
        ],
      },
      {
        id: 'cy-sp-l5-design',
        title: 'Security+ Lab 5C — วางไฟร์วอลล์แบบ deny by default และแบ่งวง (Lesson 9)',
        brief: 'เซิร์ฟเวอร์ตัวนี้เปิดพอร์ตไว้กว้างเกินจำเป็นเพราะตอนติดตั้งเปิดทิ้งไว้หมด คุณต้องเปลี่ยนเป็นนโยบายปฏิเสธก่อนแล้วค่อยเปิดเท่าที่จำเป็น พร้อมยืนยันผลจากมุมมองภายนอก',
        device: 'linux-sec',
        tasks: [
          { t: 'สำรวจก่อนว่าตอนนี้เปิดพอร์ตอะไรไว้บ้าง', hint: 'ss -tulpn', check: (s, h) => said(h, /ss\s+-\w+/i) },
          { t: 'ดูกฎไฟร์วอลล์ที่ใช้อยู่ปัจจุบัน', hint: 'sudo ufw status verbose', check: (s, h) => said(h, /ufw\s+status|iptables\s+-L/i) },
          { t: 'ตั้งนโยบายปฏิเสธขาเข้าทั้งหมดเป็นค่าเริ่มต้น', hint: 'sudo ufw default deny incoming', check: (s, h) => said(h, /ufw\s+default\s+deny/i) },
          { t: 'อนุญาต SSH เฉพาะจากวง management <code>10.10.99.0/24</code>', hint: 'sudo ufw allow from 10.10.99.0/24 to any port 22', check: (s, h) => said(h, /ufw\s+allow\s+from\s+10\.10\.99|ufw\s+allow.*22/i) },
          { t: 'อนุญาต HTTPS ให้เข้าถึงได้จากทุกที่', hint: 'sudo ufw allow 443/tcp', check: (s, h) => said(h, /ufw\s+allow\s+443/i) },
          { t: 'เปิดใช้งานไฟร์วอลล์', hint: 'sudo ufw enable', check: (s, h) => said(h, /ufw\s+enable/i) },
          { t: 'ตรวจกฎที่ได้ทั้งหมดอีกครั้ง', hint: 'sudo ufw status numbered', check: (s, h) => said(h, /ufw\s+status\s+numbered/i) },
          { t: 'ปิดการส่งต่อแพ็กเก็ต ไม่ให้เครื่องนี้กลายเป็นสะพานข้ามวง', hint: 'sudo sysctl net.ipv4.ip_forward=0', check: (s, h) => said(h, /sysctl.*ip_forward/i) },
          { t: 'ตรวจการตั้งค่าเครือข่ายว่าอยู่ในวงที่ควรอยู่', hint: 'ip addr', check: (s, h) => said(h, /^ip\s+(addr|a)\b|nmcli/i) },
          { t: 'สแกนตัวเองเพื่อยืนยันว่าจากภายนอกเห็นเฉพาะพอร์ตที่ตั้งใจเปิด', hint: 'nmap -sV 127.0.0.1', check: (s, h) => said(h, /nmap/i) },
        ],
      },
      {
        id: 'cy-sp-l5-cloud',
        title: 'Security+ Lab 5D — ความปลอดภัยของ Container และ Infrastructure as Code (Lesson 15)',
        brief: 'ทีมพัฒนาเริ่มย้ายงานไปรันบน container และเขียนโครงสร้างพื้นฐานเป็นโค้ด คุณต้องตรวจว่า container ที่รันอยู่ไม่ได้ใช้สิทธิ์เกินจำเป็น และ playbook ไม่มี secret ฝังอยู่',
        device: 'linux-sec',
        init: { apply: st => { addFile(st, '/home/analyst/site.yml', '- hosts: all\n  tasks:\n    - name: install nginx\n      apt: name=nginx state=present\n'); st.services.auditd.active = true; } },
        tasks: [
          { t: 'ดูว่ามี container อะไรรันอยู่บ้าง', hint: 'docker ps', check: (s, h) => said(h, /docker\s+ps/i) },
          { t: 'ดูรายการ image ที่มีในเครื่องและเวอร์ชัน', hint: 'docker images', check: (s, h) => said(h, /docker\s+images/i) },
          { t: 'ตรวจว่า process ใน container รันด้วยสิทธิ์อะไร', hint: 'ps aux', check: (s, h) => said(h, /^ps\s+aux/i) },
          { t: 'ตรวจว่า container เปิดพอร์ตอะไรออกมาที่ host บ้าง', hint: 'ss -tulpn', check: (s, h) => said(h, /ss\s+-\w+/i) },
          { t: 'ค้นหา secret หรือรหัสผ่านที่อาจฝังอยู่ในไฟล์ตั้งค่า', hint: 'grep -ri password /etc', check: (s, h) => said(h, /grep.*password/i) },
          { t: 'ลองรัน playbook แบบ dry-run ก่อน เพื่อดูว่าจะเปลี่ยนอะไรบ้าง', hint: 'ansible-playbook --check site.yml', check: (s, h) => said(h, /ansible-playbook.*--check/i) },
          { t: 'รัน playbook จริงแล้วอ่าน PLAY RECAP', hint: 'ansible-playbook site.yml', check: (s, h) => said(h, /ansible-playbook(?!\s+--check)/i) },
          { t: 'รันซ้ำอีกครั้งเพื่อพิสูจน์ว่า playbook เป็น idempotent (changed ต้องเป็น 0)', hint: 'ansible-playbook site.yml', check: (s, h) => h.filter(c => /ansible-playbook(?!\s+--check)/i.test(String(c))).length >= 2 },
          { t: 'ตรวจว่า audit log ของเครื่องยังเก็บการเปลี่ยนแปลงไว้ครบ', hint: 'sudo ausearch -m USER_LOGIN', check: (s, h) => said(h, /ausearch|journalctl/i) },
        ],
      },
      {
        id: 'cy-sp-l5-data',
        title: 'Security+ Lab 5E — ค้นหาและปกป้องข้อมูลส่วนบุคคล (Lesson 16)',
        brief: 'ฝ่ายกฎหมายขอให้ตรวจตาม PDPA ว่าในเซิร์ฟเวอร์มีข้อมูลส่วนบุคคลเก็บอยู่ตรงไหนบ้าง ใครเข้าถึงได้ และมีการเข้ารหัสหรือยัง',
        device: 'linux-sec',
        init: { apply: st => { addFile(st, '/home/analyst/customers.csv', 'name,citizen_id,phone\nsomchai,1234567890123,0812345678\n', '666', 'analyst'); st.groups.secops = 1200; } },
        tasks: [
          { t: 'ค้นหาไฟล์ที่น่าจะมีข้อมูลส่วนบุคคลอยู่', hint: 'find /home -name "*.csv"', check: (s, h) => said(h, /find\s+\/\w+.*-name/i) },
          { t: 'ตรวจสิทธิ์ของไฟล์ที่พบว่าเปิดกว้างเกินไปหรือไม่', hint: 'stat /etc/shadow', check: (s, h) => said(h, /^stat\s/i) },
          { t: 'ค้นหาไฟล์ที่ทุกคนในเครื่องอ่านได้ ซึ่งไม่ควรเป็นแบบนั้น', hint: 'find /home -perm -o+r -type f', check: (s, h) => said(h, /find.*-perm/i) },
          { t: 'จำกัดสิทธิ์ไฟล์ให้เหลือเฉพาะเจ้าของและกลุ่ม', hint: 'sudo chmod 640 /home/analyst/customers.csv', check: (s, h) => said(h, /chmod\s+(640|0640|600|0600)/i) },
          { t: 'ตรวจว่าเจ้าของไฟล์และกลุ่มถูกต้องตามผู้รับผิดชอบข้อมูล', hint: 'sudo chown analyst:secops /home/analyst/customers.csv', check: (s, h) => said(h, /chown/i) },
          { t: 'เข้ารหัสไฟล์ที่มีข้อมูลส่วนบุคคลก่อนเก็บ (data at rest)', hint: 'openssl enc -aes-256-cbc -in /etc/passwd -out /tmp/data.enc', check: (s, h) => said(h, /openssl\s+enc/i) },
          { t: 'คำนวณ hash ของไฟล์ที่เข้ารหัสไว้ตรวจความสมบูรณ์ภายหลัง', hint: 'sha256sum /tmp/data.enc', check: (s, h) => said(h, /sha256sum/i) },
          { t: 'ตรวจว่าดิสก์ที่เก็บข้อมูลมีการเข้ารหัสระดับดิสก์หรือไม่', hint: 'lsblk', check: (s, h) => said(h, /lsblk|blkid/i) },
          { t: 'ตรวจว่าใครเข้าถึงเครื่องนี้ได้บ้าง เพื่อประเมินขอบเขตการเข้าถึงข้อมูล', hint: 'cat /etc/passwd', check: (s, h) => said(h, /^(sudo\s+)?cat\s+\/etc\/passwd/i) },
          { t: 'เปิด audit เฝ้าดูการเข้าถึงไฟล์ข้อมูลส่วนบุคคล', hint: 'sudo auditctl -w /home/analyst/customers.csv -p r -k pdpa', check: (s, h) => said(h, /auditctl\s+-w/i) },
        ],
      },
    ],
  },
};
