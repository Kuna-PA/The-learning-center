// ============================================================
//  Linux — เนื้อหาและ Lab ที่เขียนเพิ่มให้ครบตามหลักสูตร
//  แยกตามระดับปลายทาง แล้วให้ ../linux.js เอาไปประกอบกับ legacy.js
// ============================================================
const said = (h, re) => h.some(c => re.test(String(c).trim()));
/** เดิน path ใน virtual filesystem ของ emulator (โครงเดียวกับ node() ใน linux.js) */
const hasFile = (s, path) => {
  let n = s.fs;
  for (const seg of String(path).split('/').filter(Boolean)) {
    if (!n || n.t !== 'd' || !n.children[seg]) return null;
    n = n.children[seg];
  }
  return n;
};

export default {
  // ================= ระดับ 1: Installing Linux + Authoring Text Files =================
  1: {
    sections: [
      {
        t: 'Installing Linux — สิ่งที่ต้องตัดสินใจตอนติดตั้ง',
        h: `
<p>การกดปุ่ม Next รัว ๆ ตอนติดตั้งคือที่มาของปัญหาที่จะตามหลอกหลอนไปอีกสามปี
มีสี่เรื่องที่ต้องคิดให้จบ<b>ก่อน</b>กด Install</p>
<table class="tbl">
<tr><th>เรื่อง</th><th>ทางเลือก</th><th>เลือกยังไง</th></tr>
<tr><td><b>Distribution</b></td><td>Ubuntu LTS / RHEL / Rocky / Debian</td><td>ดูว่าองค์กรมีสัญญาซัพพอร์ตอะไร และทีมถนัดตระกูลไหน (apt vs dnf)</td></tr>
<tr><td><b>แบ่งพาร์ทิชัน</b></td><td>ทั้งก้อนเดียว / แยก /var /home</td><td>เซิร์ฟเวอร์ควรแยก <code>/var</code> ออกมา ไม่งั้น log บวมจนดิสก์เต็มแล้วระบบล่มทั้งเครื่อง</td></tr>
<tr><td><b>LVM</b></td><td>เปิด / ไม่เปิด</td><td><b>เปิดไว้เสมอ</b> — วันที่พื้นที่ไม่พอจะขยายได้โดยไม่ต้องติดตั้งใหม่</td></tr>
<tr><td><b>Filesystem</b></td><td>ext4 / XFS</td><td>ext4 ปลอดภัยและย่อขนาดได้ · XFS เร็วกว่ากับไฟล์ใหญ่ แต่ย่อไม่ได้</td></tr>
</table>
<p><b>เลย์เอาต์ที่ใช้ได้กับเซิร์ฟเวอร์ส่วนใหญ่</b></p>
<table class="tbl">
<tr><th>จุด mount</th><th>ขนาด</th><th>เหตุผล</th></tr>
<tr><td>/boot</td><td>1 GB (นอก LVM)</td><td>bootloader อ่าน LVM ไม่ได้ในบางกรณี</td></tr>
<tr><td>/</td><td>30–50 GB</td><td>ระบบและแอป</td></tr>
<tr><td>/var</td><td>20 GB ขึ้นไป</td><td>log และ container image อยู่ที่นี่ โตเร็วที่สุด</td></tr>
<tr><td>swap</td><td>เท่า RAM (ไม่เกิน 8–16 GB)</td><td>กันระบบตายตอน RAM หมด</td></tr>
</table>
<p><b>สิ่งแรกที่ต้องทำหลังติดตั้งเสร็จ</b> — เรียงตามนี้ทุกครั้ง</p>
<ol>
  <li>ตั้ง hostname ให้ตรงมาตรฐาน · ตั้งโซนเวลาและ NTP</li>
  <li><code>apt update &amp;&amp; apt upgrade</code> ปิดช่องโหว่ที่ค้างมาตั้งแต่วันที่ทำ ISO</li>
  <li>สร้างผู้ใช้ของตัวเอง ใส่กลุ่ม sudo แล้ว<b>ปิด root login ทาง SSH</b></li>
  <li>ใส่ SSH key แล้วปิดการล็อกอินด้วยรหัสผ่าน</li>
  <li>เปิด firewall ให้เหลือเฉพาะพอร์ตที่ต้องใช้</li>
</ol>
<div class="note warn"><b>ยืนยันเสมอว่าติดตั้งได้อย่างที่ตั้งใจ</b> — <code>lsblk</code> ดูว่าพาร์ทิชันออกมาตามแผนไหม,
<code>df -h</code> ดูพื้นที่จริง, <code>free -h</code> ดูว่า swap ติดมาหรือเปล่า ก่อนจะส่งเครื่องให้ทีมอื่นใช้</div>`,
      },
      {
        t: 'Authoring Text Files — งานของ sysadmin คือแก้ไฟล์ข้อความ',
        h: `
<p>เกือบทุกการตั้งค่าบน Linux คือ<b>ไฟล์ข้อความ</b> การแก้ไฟล์ให้เป็นจึงสำคัญพอ ๆ กับการรู้คำสั่ง</p>
<table class="tbl">
<tr><th>วิธี</th><th>ใช้ตอนไหน</th><th>ตัวอย่าง</th></tr>
<tr><td><code>echo &gt;</code></td><td>เขียนทับทั้งไฟล์ (สั้น ๆ)</td><td><code>echo "net.ipv4.ip_forward = 1" &gt; /etc/sysctl.d/99-fw.conf</code></td></tr>
<tr><td><code>echo &gt;&gt;</code></td><td>ต่อท้ายไฟล์เดิม</td><td><code>echo "PermitRootLogin no" &gt;&gt; /etc/ssh/sshd_config</code></td></tr>
<tr><td><code>tee</code></td><td>เขียนไฟล์ที่ต้องใช้ sudo พร้อมเห็นผลไปด้วย</td><td><code>echo "..." | sudo tee /etc/hosts</code></td></tr>
<tr><td><code>sed -i</code></td><td>แก้บางคำในไฟล์ใหญ่โดยไม่ต้องเปิด editor</td><td><code>sed -i "s/^#Port 22/Port 2222/" /etc/ssh/sshd_config</code></td></tr>
<tr><td><code>vi</code> / <code>nano</code></td><td>แก้ยาว ๆ ด้วยมือ</td><td>มีทุกเครื่องเสมอ ต้องใช้ vi เป็นอย่างน้อยขั้นพื้นฐาน</td></tr>
</table>
<p><b>vi ขั้นรอดชีวิต</b> — จำแค่นี้ก็ทำงานได้</p>
<table class="tbl">
<tr><th>กด</th><th>ได้อะไร</th></tr>
<tr><td><code>i</code></td><td>เข้าโหมดพิมพ์ (insert)</td></tr>
<tr><td><code>Esc</code></td><td>ออกจากโหมดพิมพ์</td></tr>
<tr><td><code>:w</code> / <code>:q</code> / <code>:wq</code></td><td>บันทึก / ออก / บันทึกแล้วออก</td></tr>
<tr><td><code>:q!</code></td><td>ออกโดยไม่บันทึก (เมื่อแก้พังแล้วอยากเริ่มใหม่)</td></tr>
<tr><td><code>/คำ</code></td><td>ค้นหา แล้วกด <code>n</code> เพื่อไปตัวถัดไป</td></tr>
</table>
<p><b>อ่านและกรองข้อความ</b> — เครื่องมือที่ใช้คู่กันตลอด</p>
<pre><code>grep -i "error" /var/log/syslog          # หาบรรทัดที่มีคำว่า error
grep -v "^#" /etc/ssh/sshd_config        # ตัดคอมเมนต์ออก เหลือแต่ค่าที่ใช้จริง
awk -F: '{print $1}' /etc/passwd         # เอาเฉพาะคอลัมน์แรก คั่นด้วย :
sort | uniq -c | sort -rn                # นับซ้ำแล้วเรียงจากมากไปน้อย</code></pre>
<div class="note"><b>สำรองก่อนแก้เสมอ</b> — <code>cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak</code>
ใช้เวลาสองวินาที แต่ช่วยชีวิตในวันที่แก้แล้ว SSH เข้าไม่ได้อีกเลย</div>`,
      },
    ],
    quiz: [
      { type: 'mcq', q: 'ทำไมเซิร์ฟเวอร์ควรแยกพาร์ทิชัน <code>/var</code> ออกจาก <code>/</code>?', opts: ['ทำให้บูตเร็วขึ้น', 'กันไม่ให้ log ที่โตขึ้นเรื่อย ๆ ทำให้ดิสก์ระบบเต็มจนล่มทั้งเครื่อง', 'ประหยัดพื้นที่', 'จำเป็นสำหรับ LVM'], a: 1, why: 'log และ container image อยู่ใน /var และโตเร็วที่สุด ถ้ารวมกับ / เมื่อเต็มระบบจะเขียนอะไรไม่ได้เลย' },
      { type: 'mcq', q: 'ควรเปิด LVM ตอนติดตั้งหรือไม่ เพราะอะไร?', opts: ['ไม่ควร เพราะทำให้ช้า', 'ควร เพราะขยายพื้นที่ทีหลังได้โดยไม่ต้องติดตั้งใหม่', 'ควรเฉพาะเครื่องเดสก์ท็อป', 'ไม่ต่างกัน'], a: 1, why: 'LVM ให้ขยาย volume ขณะระบบทำงานอยู่ได้ — ถ้าไม่เปิดไว้ตั้งแต่แรก วันที่พื้นที่ไม่พอต้องย้ายข้อมูลทั้งก้อน' },
      { type: 'cmd', q: 'พิมพ์คำสั่งแก้คำว่า <code>PermitRootLogin yes</code> เป็น <code>PermitRootLogin no</code> ในไฟล์ /etc/ssh/sshd_config โดยไม่ต้องเปิด editor', ans: ['sudo sed -i "s/PermitRootLogin yes/PermitRootLogin no/" /etc/ssh/sshd_config', 'sed -i "s/PermitRootLogin yes/PermitRootLogin no/" /etc/ssh/sshd_config'], why: 'sed -i แก้ในไฟล์เลย เหมาะกับงาน automation ที่ต้องทำซ้ำหลายเครื่อง' },
      { type: 'mcq', q: 'คำสั่ง <code>grep -v "^#" /etc/ssh/sshd_config</code> ให้ผลอะไร?', opts: ['แสดงเฉพาะบรรทัดที่เป็นคอมเมนต์', 'แสดงทุกบรรทัดที่ไม่ได้ขึ้นต้นด้วย #', 'ลบคอมเมนต์ออกจากไฟล์', 'นับจำนวนคอมเมนต์'], a: 1, why: '-v คือกลับเงื่อนไข และ ^# คือขึ้นต้นด้วย # — ได้เฉพาะค่าที่มีผลจริง โดยไฟล์ไม่ถูกแก้' },
      { type: 'mcq', q: 'อยู่ใน vi แล้วแก้ผิดจนอยากทิ้งทั้งหมด ควรกดอะไร?', opts: [':wq', ':q!', 'Ctrl+S', ':w'], a: 1, why: ':q! คือออกโดยไม่บันทึก ส่วน :wq คือบันทึกแล้วออก' },
    ],
    labs: [
      {
        id: 'lin1-install',
        title: 'Lab 1D — ตรวจรับเครื่องหลังติดตั้ง Linux เสร็จ',
        brief: 'ทีม infra ส่งเซิร์ฟเวอร์ที่เพิ่งติดตั้งเสร็จมาให้ ก่อนเซ็นรับต้องยืนยันว่าติดตั้งได้ตามสเปกที่ขอ แล้วทำงานตั้งค่าหลังติดตั้งชุดแรกให้ครบ',
        device: 'linux',
        tasks: [
          { t: 'ดูว่าเป็น distribution และ kernel รุ่นอะไร', hint: 'hostnamectl', check: (s, h) => said(h, /^(hostnamectl|uname\s+-a|cat\s+\/etc\/os-release)/) },
          { t: 'ตรวจโครงสร้างดิสก์และพาร์ทิชันว่าตรงตามที่ขอไหม', hint: 'lsblk', check: (s, h) => said(h, /^lsblk/) },
          { t: 'ตรวจพื้นที่ว่างของแต่ละจุด mount', hint: 'df -h', check: (s, h) => said(h, /^df(\s|$)/) },
          { t: 'ตรวจ RAM และ swap ว่าติดตั้งมาครบ', hint: 'free -h', check: (s, h) => said(h, /^free/) },
          { t: 'ตั้ง hostname ให้ตรงมาตรฐานเป็น <code>srv-app-01</code>', hint: 'sudo hostnamectl set-hostname srv-app-01', check: s => s.hostname === 'srv-app-01' },
          { t: 'ตรวจโซนเวลาและการซิงก์เวลา', hint: 'timedatectl', check: (s, h) => said(h, /^timedatectl/) },
          { t: 'อัปเดตรายการแพ็กเกจ', hint: 'sudo apt update', check: (s, h) => said(h, /^(sudo\s+)?(apt|apt-get|dnf|yum)\s+update/) },
          { t: 'ดูว่ามี service อะไรทำงานอยู่บ้างหลังติดตั้ง', hint: 'systemctl list-units --type=service', check: (s, h) => said(h, /^systemctl\s+list-units/) },
          { t: 'ตรวจว่าพอร์ตไหนเปิดฟังอยู่ (ควรมีน้อยที่สุด)', hint: 'ss -tulpn', check: (s, h) => said(h, /^(ss|netstat)\s/) },
        ],
        debrief: `<b>ตรวจรับก่อนใช้เสมอ</b> — เครื่องที่ติดตั้งผิดสเปกแล้วปล่อยขึ้น production จะกลายเป็นหนี้ทางเทคนิคที่แก้ยากขึ้นทุกวัน<br>
          <b>พอร์ตที่เปิดฟังคือพื้นที่ให้โจมตี</b> — เครื่องเพิ่งติดตั้งควรเปิดแค่ SSH ถ้าเห็นอะไรเกินมาต้องถามว่าใครเปิดและเปิดทำไม<br>
          <b><code>apt update</code> ไม่ใช่ <code>apt upgrade</code></b> — update คืออัปเดต "รายการ" ของที่มี ส่วน upgrade คือติดตั้งของใหม่จริง ๆ ต้องทำทั้งคู่`,
      },
      {
        id: 'lin1-text',
        title: 'Lab 1E — แก้ไฟล์ตั้งค่าโดยไม่ต้องเปิด editor',
        brief: 'ต้องแก้ไฟล์ตั้งค่าบนเครื่อง 20 ตัว การเปิด vi ทีละเครื่องไม่ไหว — ฝึกใช้ echo, tee, sed และ grep ให้คล่อง เพราะนี่คือชุดคำสั่งเดียวกับที่จะเอาไปใส่สคริปต์ในระดับ 6',
        device: 'linux',
        tasks: [
          { t: 'สร้างโฟลเดอร์ <code>/home/student/conf</code>', hint: 'mkdir -p /home/student/conf', check: s => !!hasFile(s, '/home/student/conf') },
          {
            t: 'สร้างไฟล์ <code>/home/student/conf/app.conf</code> ที่มีบรรทัด <code>mode = debug</code>',
            hint: 'echo "mode = debug" > /home/student/conf/app.conf',
            check: (s, h) => !!hasFile(s, '/home/student/conf/app.conf') && said(h, /mode\s*=\s*debug/),
          },
          {
            t: 'ต่อท้ายอีกบรรทัดว่า <code>port = 8080</code>',
            hint: 'echo "port = 8080" >> /home/student/conf/app.conf',
            check: s => /port\s*=\s*8080/.test(String((hasFile(s, '/home/student/conf/app.conf') || {}).content || '')),
          },
          { t: 'อ่านไฟล์ออกมาดูว่าครบสองบรรทัดแล้ว', hint: 'cat /home/student/conf/app.conf', check: (s, h) => said(h, /^cat\s+.*app\.conf/) },
          {
            t: 'สำรองไฟล์ก่อนแก้ เป็น <code>app.conf.bak</code>',
            hint: 'cp /home/student/conf/app.conf /home/student/conf/app.conf.bak',
            check: s => !!hasFile(s, '/home/student/conf/app.conf.bak'),
          },
          {
            t: 'ใช้ <code>sed -i</code> เปลี่ยน <code>debug</code> เป็น <code>production</code>',
            hint: 'sed -i "s/debug/production/" /home/student/conf/app.conf',
            check: s => /mode\s*=\s*production/.test(String((hasFile(s, '/home/student/conf/app.conf') || {}).content || '')),
          },
          { t: 'ยืนยันว่าไฟล์เปลี่ยนแล้วจริงด้วย <code>grep</code>', hint: 'grep production /home/student/conf/app.conf', check: (s, h) => said(h, /^grep\s+production/) },
          {
            t: 'ใช้ <code>tee</code> เขียนไฟล์ <code>/home/student/conf/hosts.txt</code> จากผลของคำสั่งอื่น',
            hint: 'echo "10.0.0.5 db01" | tee /home/student/conf/hosts.txt',
            check: s => !!hasFile(s, '/home/student/conf/hosts.txt'),
          },
          { t: 'ดูเฉพาะบรรทัดที่ไม่ใช่คอมเมนต์ของ <code>/etc/ssh/sshd_config</code>', hint: 'grep -v "^#" /etc/ssh/sshd_config', check: (s, h) => said(h, /^grep\s+-v/) },
          { t: 'ดึงชื่อผู้ใช้ทั้งหมดจาก <code>/etc/passwd</code> ด้วย <code>cut</code> หรือ <code>awk</code>', hint: "cut -d: -f1 /etc/passwd", check: (s, h) => said(h, /^(cut|awk).*passwd/) },
        ],
        debrief: `<b>สำรองก่อนแก้ — เสมอ</b> ไฟล์ <code>.bak</code> ที่ไม่เคยได้ใช้ ดีกว่าวันที่อยากใช้แล้วไม่มี<br>
          <b><code>&gt;</code> เขียนทับ ส่วน <code>&gt;&gt;</code> ต่อท้าย</b> — พิมพ์ผิดเครื่องหมายเดียว ไฟล์ตั้งค่าที่สะสมมาทั้งปีหายในพริบตา<br>
          <b><code>sudo echo "x" &gt; /etc/file</code> ใช้ไม่ได้</b> เพราะ redirect ทำงานในสิทธิ์ของ shell ไม่ใช่ของ sudo — ต้องใช้ <code>echo "x" | sudo tee /etc/file</code> แทน`,
      },
    ],
  },

  // ================= ระดับ 3: Devices, Processes, Memory, Kernel =================
  3: {
    sections: [
      {
        t: 'Devices, Processes, Memory และ Kernel',
        h: `
<p>เมื่อระบบช้าหรือแปลก คำถามคือ "ทรัพยากรไหนหมด" — CPU, RAM, ดิสก์ หรือ I/O</p>
<table class="tbl">
<tr><th>คำสั่ง</th><th>ดูอะไร</th><th>สัญญาณอันตราย</th></tr>
<tr><td><code>top</code> / <code>htop</code></td><td>process ที่กินทรัพยากรสูงสุด</td><td>load average สูงกว่าจำนวน CPU core นาน ๆ</td></tr>
<tr><td><code>ps aux --sort=-%mem</code></td><td>เรียง process ตาม RAM</td><td>process เดียวกิน RAM เกินครึ่งเครื่อง</td></tr>
<tr><td><code>free -h</code></td><td>RAM และ swap</td><td>swap ถูกใช้เยอะ = RAM ไม่พอ ระบบจะช้ามาก</td></tr>
<tr><td><code>df -h</code> / <code>du -sh *</code></td><td>พื้นที่ดิสก์ / ใครกินพื้นที่</td><td>เกิน 85% ควรเริ่มจัดการแล้ว</td></tr>
<tr><td><code>lsblk</code> / <code>blkid</code></td><td>ดิสก์ พาร์ทิชัน UUID</td><td>ดิสก์ใหม่ที่ยังไม่มี filesystem</td></tr>
<tr><td><code>journalctl -p err</code></td><td>ข้อความระดับ error ของทั้งระบบ</td><td>error ซ้ำ ๆ ทุกไม่กี่วินาที</td></tr>
</table>
<p><b>จัดการ process</b></p>
<pre><code>ps aux | grep nginx        # หา PID
kill 1234                  # ขอให้ปิดอย่างสุภาพ (SIGTERM)
kill -9 1234               # บังคับปิด (SIGKILL) — ใช้เมื่อจำเป็นจริง ๆ เท่านั้น</code></pre>
<p><b>Kernel parameter</b> — ปรับพฤติกรรมระดับแกนของระบบด้วย <code>sysctl</code></p>
<pre><code>sysctl net.ipv4.ip_forward              # อ่านค่าปัจจุบัน
sudo sysctl -w net.ipv4.ip_forward=1    # ตั้งชั่วคราว หายเมื่อรีบูต
echo "net.ipv4.ip_forward = 1" | sudo tee /etc/sysctl.d/99-router.conf   # ถาวร</code></pre>
<div class="note warn"><b><code>kill -9</code> ไม่ใช่คำตอบแรก</b> — มันตัดโปรเซสทิ้งทันทีโดยไม่ให้โอกาสปิดไฟล์หรือเขียนข้อมูลที่ค้างอยู่
ฐานข้อมูลที่โดน kill -9 อาจตื่นมาพร้อมข้อมูลเสีย ให้ลอง <code>kill</code> ธรรมดาหรือ <code>systemctl stop</code> ก่อนเสมอ</div>`,
      },
    ],
    quiz: [
      { type: 'mcq', q: '<code>free -h</code> แสดงว่า swap ถูกใช้ไปเกือบเต็ม บอกอะไร?', opts: ['ดิสก์ใกล้เต็ม', 'RAM ไม่พอ ระบบต้องสลับข้อมูลลงดิสก์ซึ่งช้ากว่ามาก', 'CPU ทำงานหนัก', 'มีไวรัส'], a: 1, why: 'swap คือการยืมดิสก์มาใช้แทน RAM — ใช้เยอะแปลว่า RAM ไม่พอ และดิสก์ช้ากว่า RAM หลายเท่า' },
      { type: 'mcq', q: 'ควรใช้ <code>kill -9</code> เมื่อใด?', opts: ['ทุกครั้งเพราะเร็วดี', 'เมื่อ kill ธรรมดาและ systemctl stop ไม่ได้ผลแล้วเท่านั้น', 'ตอนรีบูตเครื่อง', 'ตอนอัปเดตแพ็กเกจ'], a: 1, why: 'SIGKILL ตัดทันทีโดยไม่ให้โปรเซสเก็บของ — เสี่ยงข้อมูลเสีย ให้เป็นทางเลือกสุดท้ายเสมอ' },
      { type: 'mcq', q: 'ตั้งค่า sysctl ด้วย <code>sysctl -w</code> อย่างเดียวมีผลอย่างไร?', opts: ['ถาวรตลอดไป', 'มีผลจนกว่าจะรีบูต แล้วค่าจะกลับเป็นเดิม', 'ไม่มีผลเลย', 'มีผลเฉพาะ user ปัจจุบัน'], a: 1, why: 'ต้องเขียนลง /etc/sysctl.d/*.conf ด้วยจึงจะอยู่หลังรีบูต' },
      { type: 'cmd', q: 'พิมพ์คำสั่งดู process ทั้งหมดเรียงตามการใช้หน่วยความจำจากมากไปน้อย', ans: ['ps aux --sort=-%mem', 'ps aux --sort -%mem'], why: 'ps aux --sort=-%mem — เครื่องหมายลบคือเรียงจากมากไปน้อย' },
      { type: 'cmd', q: 'พิมพ์คำสั่งดูดิสก์และพาร์ทิชันทั้งหมดในรูปแบบต้นไม้', ans: ['lsblk'], why: 'lsblk แสดงดิสก์ พาร์ทิชัน และจุด mount ในหน้าเดียว — คำสั่งแรกเวลาจะจัดการ storage' },
    ],
    labs: [],
  },

  // ================= ระดับ 4: สร้าง Storage ใหม่ตั้งแต่ต้น =================
  4: {
    sections: [],
    quiz: [],
    labs: [
      {
        id: 'lin4-newlv',
        title: 'Lab 4D — เพิ่มดิสก์ใหม่และสร้าง Logical Volume ตั้งแต่ต้น',
        brief: 'ทีม virtualization เพิ่มดิสก์ก้อนใหม่ให้เครื่องแล้ว ให้เอามาทำเป็นพื้นที่สำหรับข้อมูลของแอป โดยใช้ LVM เพื่อให้ขยายได้ในอนาคต',
        device: 'linux',
        tasks: [
          { t: 'ดูว่ามีดิสก์อะไรบ้างและก้อนไหนยังว่าง', hint: 'lsblk', check: (s, h) => said(h, /^lsblk/) },
          { t: 'เตรียมดิสก์ให้ LVM ใช้ได้ด้วย <code>pvcreate /dev/sdb</code>', hint: 'sudo pvcreate /dev/sdb', check: (s, h) => said(h, /^(sudo\s+)?pvcreate/) },
          { t: 'ตรวจว่า physical volume ถูกสร้างแล้ว', hint: 'sudo pvs', check: (s, h) => said(h, /^(sudo\s+)?pvs/) },
          {
            t: 'สร้าง volume group ชื่อ <code>vgdata</code> จากดิสก์นั้น',
            hint: 'sudo vgcreate vgdata /dev/sdb',
            check: s => !!(s.vgs || {}).vgdata,
          },
          {
            t: 'สร้าง logical volume ชื่อ <code>lvapp</code> ขนาด <code>10G</code> ใน <code>vgdata</code>',
            hint: 'sudo lvcreate -n lvapp -L 10G vgdata',
            check: s => !!(s.lvs || {}).lvapp && (s.lvs.lvapp.vg === 'vgdata'),
          },
          {
            t: 'ฟอร์แมตเป็น <code>ext4</code>',
            hint: 'sudo mkfs.ext4 /dev/vgdata/lvapp',
            check: s => (s.formatted || []).some(f => /lvapp/.test(f.dev) && f.type === 'ext4'),
          },
          { t: 'สร้างจุด mount <code>/srv/appdata</code>', hint: 'sudo mkdir -p /srv/appdata', check: s => !!hasFile(s, '/srv/appdata') },
          { t: 'mount volume ใหม่เข้าที่จุดนั้น', hint: 'sudo mount /dev/vgdata/lvapp /srv/appdata', check: (s, h) => said(h, /^(sudo\s+)?mount\s+.*lvapp/) },
          { t: 'ยืนยันด้วย <code>df -h</code> ว่าพื้นที่ขึ้นมาแล้ว', hint: 'df -h', check: (s, h) => said(h, /^df/) },
          { t: 'ดูรายการ logical volume ทั้งหมด', hint: 'sudo lvs', check: (s, h) => said(h, /^(sudo\s+)?lvs/) },
        ],
        debrief: `<b>ลำดับของ LVM จำง่าย ๆ:</b> ดิสก์ → <code>pvcreate</code> → <code>vgcreate</code> → <code>lvcreate</code> → <code>mkfs</code> → <code>mount</code><br>
          <b>อย่าลืมใส่ใน <code>/etc/fstab</code></b> ไม่งั้นพอรีบูตแล้ว mount หายไป แอปจะเขียนลงโฟลเดอร์เปล่าบนดิสก์ระบบแทนโดยไม่มีใครรู้<br>
          <b>อย่าใช้พื้นที่ของ VG จนหมดตั้งแต่แรก</b> — เหลือไว้สักส่วนสำหรับ snapshot และการขยายฉุกเฉิน`,
      },
    ],
  },

  // ================= ระดับ 6: Scripts และ Infrastructure as Code =================
  6: {
    sections: [
      {
        t: 'Implementing Simple Scripts — ทำครั้งเดียวใช้ได้ตลอด',
        h: `
<p>งานอะไรที่ทำซ้ำเกินสามครั้ง ควรกลายเป็นสคริปต์ โครงของสคริปต์ที่ใช้ได้จริงมีแค่นี้</p>
<pre><code>#!/bin/bash
# backup.sh — สำรองโฟลเดอร์ตั้งค่าแล้วเก็บไว้ 7 วัน

SRC="/etc"
DEST="/backup"
DATE=$(date +%F)

mkdir -p "$DEST"
tar -czf "$DEST/etc-$DATE.tar.gz" "$SRC"
echo "backup done: $DEST/etc-$DATE.tar.gz"</code></pre>
<p><b>ขั้นตอนที่ขาดไม่ได้</b></p>
<ol>
  <li>บรรทัดแรกเป็น <code>#!/bin/bash</code> (shebang) บอกว่าใช้ตัวแปลอะไร</li>
  <li><code>chmod +x script.sh</code> ให้สิทธิ์รัน — ไม่งั้นได้ <code>Permission denied</code></li>
  <li>รันด้วย <code>./script.sh</code> หรือ <code>bash script.sh</code></li>
</ol>
<table class="tbl">
<tr><th>สิ่งที่ใช้บ่อย</th><th>เขียนยังไง</th></tr>
<tr><td>ตัวแปร</td><td><code>NAME="web01"</code> แล้วเรียกด้วย <code>$NAME</code></td></tr>
<tr><td>ผลของคำสั่ง</td><td><code>DATE=$(date +%F)</code></td></tr>
<tr><td>เงื่อนไข</td><td><code>if [ -f "$FILE" ]; then ... fi</code></td></tr>
<tr><td>วนซ้ำ</td><td><code>for h in web01 web02; do ssh $h uptime; done</code></td></tr>
<tr><td>ตรวจว่าคำสั่งก่อนหน้าสำเร็จ</td><td><code>if [ $? -ne 0 ]; then echo "failed"; exit 1; fi</code></td></tr>
</table>
<p><b>ตั้งให้ทำงานเอง</b> ด้วย cron</p>
<pre><code>crontab -e
0 2 * * * /home/student/scripts/backup.sh >> /var/log/backup.log 2>&1
#  │ │ │ │ └── วันในสัปดาห์ (0-6)
#  │ │ │ └──── เดือน
#  │ │ └────── วันที่
#  │ └──────── ชั่วโมง
#  └────────── นาที   → ตัวอย่างนี้คือทุกวันตอนตีสอง</code></pre>
<div class="note warn"><b>สคริปต์ที่ไม่มี log คือสคริปต์ที่คุณไม่รู้ว่ามันพังตั้งแต่เมื่อไหร่</b> —
ต่อท้ายด้วย <code>&gt;&gt; /var/log/xxx.log 2&gt;&amp;1</code> เสมอ เพื่อเก็บทั้งผลปกติและ error</div>`,
      },
      {
        t: 'Infrastructure as Code — อธิบายปลายทาง ไม่ใช่ขั้นตอน',
        h: `
<p>สคริปต์บอกว่า "ทำ 1 2 3" แต่ IaC บอกว่า "ผลลัพธ์ต้องเป็นแบบนี้" แล้วให้เครื่องมือไปจัดการเอง
ข้อดีคือรันซ้ำกี่รอบผลก็เหมือนเดิม เรียกว่า <b>idempotent</b></p>
<table class="tbl">
<tr><th></th><th>Shell script</th><th>Ansible (IaC)</th></tr>
<tr><td>บอกอะไร</td><td>ขั้นตอนทีละคำสั่ง</td><td>สถานะปลายทางที่ต้องการ</td></tr>
<tr><td>รันซ้ำ</td><td>อาจพังหรือทำซ้ำซ้อน</td><td>เห็นว่าตรงแล้วก็ข้าม (<code>ok</code>) ไม่ทำซ้ำ</td></tr>
<tr><td>หลายเครื่อง</td><td>ต้องวน ssh เอง</td><td>ระบุใน inventory แล้วสั่งทีเดียว</td></tr>
</table>
<p><b>Playbook หน้าตาแบบนี้</b> — เป็นไฟล์ YAML ที่คนอ่านรู้เรื่อง</p>
<pre><code>- hosts: webservers
  become: yes
  tasks:
    - name: install nginx
      apt:
        name: nginx
        state: present

    - name: start and enable nginx
      service:
        name: nginx
        state: started
        enabled: yes</code></pre>
<table class="tbl">
<tr><th>คำศัพท์</th><th>คือ</th></tr>
<tr><td><b>Inventory</b></td><td>รายชื่อเครื่องที่จะจัดการ แบ่งเป็นกลุ่มได้ เช่น <code>[webservers]</code></td></tr>
<tr><td><b>Play</b></td><td>ชุดงานที่จะทำกับกลุ่มเครื่องหนึ่ง</td></tr>
<tr><td><b>Task</b></td><td>งานหนึ่งอย่าง มี <code>name:</code> เสมอเพื่อให้อ่าน output รู้เรื่อง</td></tr>
<tr><td><b>Module</b></td><td>ตัวลงมือทำ เช่น <code>apt</code>, <code>service</code>, <code>copy</code>, <code>user</code></td></tr>
<tr><td><b>Idempotent</b></td><td>รันกี่ครั้งผลเหมือนเดิม — หัวใจของ IaC</td></tr>
</table>
<p><b>อ่าน PLAY RECAP ให้เป็น</b> — <code>changed=</code> คือจำนวนงานที่ระบบถูกแก้จริง
ถ้ารันรอบสองแล้วยัง <code>changed</code> อยู่ แปลว่า playbook นั้น<b>ยังไม่ idempotent</b> ต้องกลับไปแก้</p>
<div class="note"><b>ทำไม IaC ถึงสำคัญกว่าที่คิด:</b> เมื่อ config ทั้งหมดอยู่ในไฟล์ที่เก็บใน Git
คุณจะรู้ว่าใครแก้อะไรตอนไหน ย้อนกลับได้ และสร้างเครื่องใหม่ให้เหมือนเดิมเป๊ะได้ในไม่กี่นาที —
ต่างจากเครื่องที่ตั้งค่าด้วยมือซึ่งไม่มีใครสร้างซ้ำได้อีกเลย</div>`,
      },
    ],
    quiz: [
      { type: 'mcq', q: 'สร้างสคริปต์แล้วรัน <code>./backup.sh</code> ได้ <code>Permission denied</code> ต้องทำอะไร?', opts: ['รันด้วย sudo', 'chmod +x backup.sh', 'เปลี่ยนชื่อไฟล์', 'ติดตั้ง bash ใหม่'], a: 1, why: 'ไฟล์ต้องมีสิทธิ์ execute ก่อน — หรือเลี่ยงด้วยการรัน bash backup.sh ซึ่งไม่ต้องใช้สิทธิ์ x' },
      { type: 'mcq', q: 'บรรทัด <code>#!/bin/bash</code> มีไว้ทำอะไร?', opts: ['เป็นคอมเมนต์เฉย ๆ', 'บอกระบบว่าให้ใช้ตัวแปลภาษาอะไรรันไฟล์นี้', 'กำหนดสิทธิ์ไฟล์', 'ตั้งชื่อสคริปต์'], a: 1, why: 'เรียกว่า shebang — ระบบอ่านบรรทัดแรกเพื่อรู้ว่าจะส่งไฟล์ให้โปรแกรมไหนรัน' },
      { type: 'mcq', q: '<code>0 2 * * *</code> ใน crontab หมายถึงอะไร?', opts: ['ทุก 2 นาที', 'ทุกวันตอน 02:00 น.', 'วันที่ 2 ของทุกเดือน', 'ทุกวันอังคาร'], a: 1, why: 'เรียงเป็น นาที ชั่วโมง วันที่ เดือน วันในสัปดาห์ — 0 2 คือ นาที 0 ชั่วโมง 2 และ * คือทุกค่า' },
      { type: 'mcq', q: 'คำว่า idempotent ในบริบท IaC หมายถึงอะไร?', opts: ['รันได้เร็วมาก', 'รันซ้ำกี่ครั้งผลลัพธ์ก็เหมือนเดิม ไม่ทำซ้ำซ้อน', 'ใช้ได้กับ Linux เท่านั้น', 'ต้องรันด้วย root'], a: 1, why: 'Ansible จะตรวจก่อนว่าสถานะตรงตามที่ประกาศไว้แล้วหรือยัง ถ้าตรงแล้วจะรายงาน ok และไม่แตะอะไร' },
      { type: 'mcq', q: 'รัน playbook รอบสองแล้วยังขึ้น <code>changed=5</code> เท่าเดิม บอกอะไร?', opts: ['ปกติดี', 'playbook ยังไม่ idempotent ควรกลับไปแก้', 'เครื่องปลายทางล่ม', 'ต้องรันด้วย sudo'], a: 1, why: 'ถ้าสถานะตรงตามที่ประกาศแล้ว รอบสองควรเป็น ok ทั้งหมด — ที่ยัง changed แปลว่ามี task ที่สั่งทำซ้ำโดยไม่ตรวจก่อน' },
      { type: 'multi', q: 'ข้อใดควรมีในสคริปต์ที่จะให้ cron รันอัตโนมัติ (เลือกทุกข้อที่ถูก)', opts: ['shebang บรรทัดแรก', 'ใช้ path เต็มของไฟล์และคำสั่ง', 'เขียน log เก็บผลการรัน', 'ใส่รหัสผ่านไว้ในสคริปต์ตรง ๆ'], a: [0, 1, 2], why: 'cron ทำงานด้วย environment ที่จำกัดมาก จึงต้องใช้ path เต็ม และห้ามฝังรหัสผ่านในไฟล์ที่คนอื่นอ่านได้' },
      { type: 'cmd', q: 'พิมพ์คำสั่งรัน playbook ชื่อ site.yml', ans: ['ansible-playbook site.yml', 'ansible-playbook ./site.yml'], why: 'ansible-playbook <ไฟล์> — ผลจะสรุปท้ายด้วย PLAY RECAP บอกว่า ok/changed/failed กี่งาน' },
    ],
    labs: [
      {
        id: 'lin6-script',
        title: 'Lab 6A — เขียนสคริปต์สำรองข้อมูลและตั้งให้ทำงานเอง',
        brief: 'ทุกเช้าต้องสำรองโฟลเดอร์ตั้งค่าแล้วจดผลไว้ ทำมือทุกวันไม่ไหวและลืมบ่อย — เขียนเป็นสคริปต์แล้วให้ cron ทำแทน',
        device: 'linux',
        tasks: [
          { t: 'สร้างโฟลเดอร์ <code>/home/student/scripts</code>', hint: 'mkdir -p /home/student/scripts', check: s => !!hasFile(s, '/home/student/scripts') },
          {
            t: 'สร้างไฟล์ <code>backup.sh</code> โดยบรรทัดแรกเป็น shebang <code>#!/bin/bash</code>',
            hint: 'echo "#!/bin/bash" > /home/student/scripts/backup.sh',
            check: s => /^#!\/bin\/bash/.test(String((hasFile(s, '/home/student/scripts/backup.sh') || {}).content || '')),
          },
          {
            t: 'เพิ่มบรรทัดสร้างโฟลเดอร์ปลายทาง <code>mkdir -p /backup</code>',
            hint: 'echo "mkdir -p /backup" >> /home/student/scripts/backup.sh',
            check: s => /mkdir\s+-p\s+\/backup/.test(String((hasFile(s, '/home/student/scripts/backup.sh') || {}).content || '')),
          },
          {
            t: 'เพิ่มบรรทัดที่บีบอัด <code>/etc</code> เก็บไว้ที่ <code>/backup/etc.tar.gz</code>',
            hint: 'echo "tar -czf /backup/etc.tar.gz /etc" >> /home/student/scripts/backup.sh',
            check: s => /tar\s+-czf\s+\/backup\/etc\.tar\.gz/.test(String((hasFile(s, '/home/student/scripts/backup.sh') || {}).content || '')),
          },
          {
            t: 'เพิ่มบรรทัดสุดท้ายให้บอกว่าทำเสร็จแล้ว <code>echo backup done</code>',
            hint: 'echo "echo backup done" >> /home/student/scripts/backup.sh',
            check: s => /echo\s+backup\s+done/.test(String((hasFile(s, '/home/student/scripts/backup.sh') || {}).content || '')),
          },
          { t: 'ดูเนื้อไฟล์ทั้งหมดเพื่อตรวจก่อนรัน', hint: 'cat /home/student/scripts/backup.sh', check: (s, h) => said(h, /^cat\s+.*backup\.sh/) },
          {
            t: 'ให้สิทธิ์รันด้วย <code>chmod +x</code>',
            hint: 'chmod +x /home/student/scripts/backup.sh',
            check: s => (+String((hasFile(s, '/home/student/scripts/backup.sh') || {}).mode || '644')[0] & 1) === 1,
          },
          {
            t: 'รันสคริปต์จริง แล้วดูว่าทำงานครบทุกบรรทัด',
            hint: 'bash /home/student/scripts/backup.sh',
            check: s => (s.scriptRuns || []).some(x => /backup\.sh$/.test(x)),
          },
          { t: 'ยืนยันว่าไฟล์สำรองถูกสร้างขึ้นจริงที่ <code>/backup</code>', hint: 'ls -l /backup', check: (s, h) => said(h, /^ls\s+.*\/backup/) },
          { t: 'ดูตารางงานอัตโนมัติปัจจุบันด้วย <code>crontab -l</code>', hint: 'crontab -l', check: (s, h) => said(h, /^crontab\s+-l/) },
        ],
        debrief: `<b>ทดสอบด้วยมือก่อนเสมอ</b> — สคริปต์ที่ยังไม่เคยรันสำเร็จ ห้ามเอาไปใส่ cron เด็ดขาด
เพราะเวลามันพังตอนตีสอง จะไม่มีใครเห็น<br>
          <b>ใช้ path เต็มในสคริปต์ที่ cron รัน</b> — environment ของ cron แคบมาก คำสั่งที่พิมพ์ในเทอร์มินัลได้ อาจหาไม่เจอตอน cron รัน<br>
          <b>ขั้นถัดไปที่ควรทำ:</b> ใส่วันที่ในชื่อไฟล์ (<code>etc-$(date +%F).tar.gz</code>) และลบไฟล์ที่เก่ากว่า 7 วันทิ้ง
ไม่งั้นดิสก์จะเต็มด้วยไฟล์สำรองของตัวเอง`,
      },
      {
        id: 'lin6-iac',
        title: 'Lab 6B — จัดการเครื่องด้วย Ansible Playbook',
        brief: 'ต้องติดตั้งและเปิด nginx บนเครื่องหลายตัวให้เหมือนกันเป๊ะ และต้องรันซ้ำได้โดยไม่พัง — เขียน playbook แทนการไล่ ssh ทีละเครื่อง',
        device: 'linux',
        tasks: [
          { t: 'ตรวจว่ามี ansible ติดตั้งอยู่และเป็นเวอร์ชันอะไร', hint: 'ansible --version', check: (s, h) => said(h, /^ansible\s+--version/) },
          { t: 'สร้างโฟลเดอร์ <code>/home/student/iac</code>', hint: 'mkdir -p /home/student/iac', check: s => !!hasFile(s, '/home/student/iac') },
          {
            t: 'สร้าง inventory <code>hosts.ini</code> ที่มีกลุ่ม <code>[webservers]</code>',
            hint: 'echo "[webservers]" > /home/student/iac/hosts.ini',
            check: s => /\[webservers\]/.test(String((hasFile(s, '/home/student/iac/hosts.ini') || {}).content || '')),
          },
          {
            t: 'เพิ่มเครื่อง <code>web01</code> เข้าไปใน inventory',
            hint: 'echo "web01" >> /home/student/iac/hosts.ini',
            check: s => /web01/.test(String((hasFile(s, '/home/student/iac/hosts.ini') || {}).content || '')),
          },
          {
            t: 'เริ่ม playbook <code>site.yml</code> ด้วยบรรทัด <code>- hosts: webservers</code>',
            hint: 'echo "- hosts: webservers" > /home/student/iac/site.yml',
            check: s => /hosts:\s*webservers/.test(String((hasFile(s, '/home/student/iac/site.yml') || {}).content || '')),
          },
          {
            t: 'เพิ่มบรรทัด <code>  tasks:</code>',
            hint: 'echo "  tasks:" >> /home/student/iac/site.yml',
            check: s => /tasks:/.test(String((hasFile(s, '/home/student/iac/site.yml') || {}).content || '')),
          },
          {
            t: 'เพิ่ม task แรก <code>    - name: install nginx</code>',
            hint: 'echo "    - name: install nginx" >> /home/student/iac/site.yml',
            check: s => /-\s+name:\s*install nginx/.test(String((hasFile(s, '/home/student/iac/site.yml') || {}).content || '')),
          },
          {
            t: 'เพิ่ม task ที่สอง <code>    - name: start nginx</code>',
            hint: 'echo "    - name: start nginx" >> /home/student/iac/site.yml',
            check: s => /-\s+name:\s*start nginx/.test(String((hasFile(s, '/home/student/iac/site.yml') || {}).content || '')),
          },
          { t: 'ตรวจไฟล์ playbook ทั้งก้อนก่อนรัน', hint: 'cat /home/student/iac/site.yml', check: (s, h) => said(h, /^cat\s+.*site\.yml/) },
          {
            t: 'รัน playbook แล้วอ่าน <b>PLAY RECAP</b> ว่ามีกี่ task ที่ changed',
            hint: 'ansible-playbook /home/student/iac/site.yml',
            check: s => (s.ansiblePlays || []).some(p => p.tasks.length >= 2),
          },
          { t: 'ทดสอบการเชื่อมต่อไปทุกเครื่องด้วย module <code>ping</code>', hint: 'ansible all -m ping', check: s => (s.ansibleRuns || []).some(x => /-m ping/.test(x)) },
        ],
        debrief: `<b>ทุก task ต้องมี <code>name:</code></b> — ไม่ใช่แค่ความสวยงาม แต่เป็นสิ่งที่ทำให้อ่าน output รู้ว่าพังตรงไหน
เวลารันกับ 50 เครื่องแล้วมีตัวเดียวล้ม<br>
          <b>วัดว่า playbook ดีหรือยัง ให้ดูรอบสอง</b> — รันซ้ำแล้วควรได้ <code>changed=0</code> ทั้งหมด
นั่นแปลว่ามัน idempotent จริง<br>
          <b>Inventory คือแผนที่ของระบบ</b> — จัดกลุ่มให้ตรงกับหน้าที่จริง (webservers, dbservers)
แล้วสั่งงานทีละกลุ่มได้ ไม่ต้องจำว่าเครื่องไหนทำอะไร`,
      },
    ],
  },
};
