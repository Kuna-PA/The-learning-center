// Lab เพิ่มเติมของ Linux — 2 lab ต่อระดับ
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

const BY_OLD_LEVEL = {
  // ================= LEVEL 1 =================
  1: [
    {
      id: 'lin1-survey',
      title: 'Lab 1B — สำรวจเซิร์ฟเวอร์ที่เพิ่งได้รับมอบ',
      brief: 'คุณได้รับสิทธิ์เข้าเซิร์ฟเวอร์ตัวใหม่ ก่อนเริ่มงานต้องรู้ก่อนว่าเป็น distro อะไร ดิสก์เหลือเท่าไร มี service อะไรทำงานอยู่ และ IP คืออะไร',
      device: 'linux',
      tasks: [
        { t: 'ดูว่าเป็น distro อะไร เวอร์ชันไหน', hint: 'cat /etc/os-release', check: (s, h) => said(h, /cat\s+\/etc\/os-release/i) },
        { t: 'ดู kernel และสถาปัตยกรรม', hint: 'uname -a', check: (s, h) => said(h, /^uname/i) },
        { t: 'ดูชื่อเครื่องและรายละเอียดระบบ', hint: 'hostnamectl', check: (s, h) => said(h, /^hostnamectl/i) },
        { t: 'ดูพื้นที่ดิสก์', hint: 'df -h', check: (s, h) => said(h, /^(sudo\s+)?df/i) },
        { t: 'ดูหน่วยความจำที่เหลือ', hint: 'free -h', check: (s, h) => said(h, /^(sudo\s+)?free/i) },
        { t: 'ดู uptime และ load average', hint: 'uptime', check: (s, h) => said(h, /^uptime/i) },
        { t: 'ดู IP address ของทุก interface', hint: 'ip a', check: (s, h) => said(h, /^\s*ip\s+a/i) },
        { t: 'ดูรายการ service ที่ระบบรู้จัก', hint: 'systemctl list-units', check: (s, h) => said(h, /systemctl\s+list-units/i) },
        { t: 'ดูเวลาและ timezone ของเครื่อง', hint: 'timedatectl', check: (s, h) => said(h, /^timedatectl/i) },
      ],
    },
    {
      id: 'lin1-files',
      title: 'Lab 1C — จัดระเบียบไฟล์และสำรองข้อมูล',
      brief: 'โฟลเดอร์งานของทีมรกมาก ให้จัดโครงสร้างใหม่ ย้ายไฟล์ที่มีอยู่ไปเก็บให้เป็นที่ และทำสำเนาไว้',
      device: 'linux',
      tasks: [
        { t: 'ไปที่ home directory ของตัวเอง', hint: 'cd ~', check: (s, h) => said(h, /^cd(\s+~|\s*$)/i) },
        { t: 'สร้างโครงสร้าง <code>/home/student/work/2026/08</code> ในคำสั่งเดียว', hint: 'mkdir -p /home/student/work/2026/08', check: s => !!node(s, '/home/student/work/2026/08') },
        { t: 'คัดลอก <code>notes.txt</code> ไปไว้ที่ <code>work/2026/08/</code>', hint: 'cp /home/student/notes.txt /home/student/work/2026/08/', check: s => !!node(s, '/home/student/work/2026/08/notes.txt') },
        { t: 'สร้างไฟล์ <code>/home/student/work/README.txt</code> พร้อมข้อความ', hint: 'echo "งานของทีม ปี 2026" > /home/student/work/README.txt', check: s => { const f = node(s, '/home/student/work/README.txt'); return f && f.content.trim().length > 0; } },
        { t: 'เพิ่มข้อความอีกบรรทัดต่อท้าย README.txt', hint: 'echo "ติดต่อ: noc@company.co.th" >> /home/student/work/README.txt', check: s => { const f = node(s, '/home/student/work/README.txt'); return f && f.content.trim().split('\n').length >= 2; } },
        { t: 'ย้ายโฟลเดอร์ <code>scripts</code> ไปไว้ใต้ <code>work</code>', hint: 'mv /home/student/scripts /home/student/work/', check: s => !!node(s, '/home/student/work/scripts') && !node(s, '/home/student/scripts') },
        { t: 'ดูรายชื่อไฟล์ใน work แบบละเอียด', hint: 'ls -la /home/student/work', check: (s, h) => said(h, /ls\s+-l?a?l?a?.*work/i) },
        { t: 'ค้นหาไฟล์ทั้งหมดที่ลงท้ายด้วย <code>.sh</code> ใน home', hint: 'find /home/student -name "*.sh"', check: (s, h) => said(h, /find\s+.*-name/i) },
      ],
    },
  ],

  // ================= LEVEL 2 =================
  2: [
    {
      id: 'lin2-team',
      title: 'Lab 2B — สร้างทีมและโฟลเดอร์ที่ใช้ร่วมกัน',
      brief: 'ทีม devops มีสมาชิกใหม่ 3 คน ต้องสร้างบัญชี จัดกลุ่ม และทำโฟลเดอร์ที่ทุกคนในทีมเขียนได้แต่คนนอกอ่านไม่ได้',
      device: 'linux',
      tasks: [
        { t: 'สร้างกลุ่ม <code>devops</code>', hint: 'sudo groupadd devops', check: s => s.groups.devops !== undefined },
        { t: 'สร้างผู้ใช้ <code>dev1</code> พร้อม home และ shell bash', hint: 'sudo useradd -m -s /bin/bash dev1', check: s => !!s.users.dev1 && !!node(s, '/home/dev1') },
        { t: 'สร้างผู้ใช้ <code>dev2</code>', hint: 'sudo useradd -m -s /bin/bash dev2', check: s => !!s.users.dev2 },
        { t: 'สร้างผู้ใช้ <code>dev3</code>', hint: 'sudo useradd -m -s /bin/bash dev3', check: s => !!s.users.dev3 },
        { t: 'เพิ่ม <code>dev1</code> เข้ากลุ่ม <code>devops</code>', hint: 'sudo usermod -aG devops dev1', check: s => s.users.dev1 && s.users.dev1.groups.includes('devops') },
        { t: 'เพิ่ม <code>dev2</code> เข้ากลุ่ม <code>devops</code>', hint: 'sudo usermod -aG devops dev2', check: s => s.users.dev2 && s.users.dev2.groups.includes('devops') },
        { t: 'สร้างโฟลเดอร์ <code>/srv/devops</code>', hint: 'sudo mkdir -p /srv/devops', check: s => !!node(s, '/srv/devops') },
        { t: 'เปลี่ยนเจ้าของเป็น <code>root:devops</code>', hint: 'sudo chown root:devops /srv/devops', check: s => { const n = node(s, '/srv/devops'); return n && n.group === 'devops'; } },
        { t: 'ตั้งสิทธิ์เป็น <code>770</code> (คนนอกเข้าไม่ได้เลย)', hint: 'sudo chmod 770 /srv/devops', check: s => { const n = node(s, '/srv/devops'); return n && n.mode === '770'; } },
        { t: 'ตรวจสอบผลด้วย <code>ls -l /srv</code>', hint: 'ls -l /srv', check: (s, h) => said(h, /ls\s+-l.*\/srv/i) },
        { t: 'ตรวจสอบกลุ่มของ <code>dev1</code>', hint: 'id dev1', check: (s, h) => said(h, /^(sudo\s+)?id\s+dev1/i) },
      ],
    },
    {
      id: 'lin2-service',
      title: 'Lab 2C — จัดการ Service และงานตามเวลา',
      brief: 'เว็บเซิร์ฟเวอร์ตัวใหม่ต้องเปิดใช้งานและตั้งให้ทำงานอัตโนมัติหลังรีบูต พร้อมเตรียมสคริปต์สำรองข้อมูลให้พร้อมรันทุกคืน',
      device: 'linux',
      tasks: [
        { t: 'ตรวจสอบสถานะ <code>nginx</code> ก่อน (ควรเป็น inactive)', hint: 'systemctl status nginx', check: (s, h) => said(h, /systemctl\s+status\s+nginx/i) },
        { t: 'เริ่มการทำงานของ <code>nginx</code>', hint: 'sudo systemctl start nginx', check: s => s.services.nginx.active },
        { t: 'ตั้งให้ <code>nginx</code> เริ่มอัตโนมัติตอนบูต', hint: 'sudo systemctl enable nginx', check: s => s.services.nginx.enabled },
        { t: 'ทดสอบเว็บด้วย <code>curl</code>', hint: 'curl -I http://localhost', check: (s, h) => said(h, /^curl/i) },
        { t: 'ดู log ของ nginx ผ่าน journald', hint: 'journalctl -u nginx', check: (s, h) => said(h, /journalctl\s+-u\s+nginx/i) },
        { t: 'ตรวจสอบว่า <code>cron</code> ทำงานอยู่', hint: 'systemctl is-active cron', check: (s, h) => said(h, /systemctl\s+is-active/i) },
        { t: 'สร้างโฟลเดอร์ <code>/backup/www</code>', hint: 'sudo mkdir -p /backup/www', check: s => !!node(s, '/backup/www') },
        { t: 'ให้สิทธิ์รันแก่สคริปต์ <code>/home/student/scripts/backup.sh</code>', hint: 'chmod +x /home/student/scripts/backup.sh', check: s => { const f = node(s, '/home/student/scripts/backup.sh'); return f && /[1357]/.test(f.mode[0]); } },
        { t: 'ดูรายการ cron job ปัจจุบัน', hint: 'crontab -l', check: (s, h) => said(h, /crontab\s+-l/i) },
        { t: 'ตรวจสอบว่ามีพอร์ตใดเปิดฟังอยู่', hint: 'ss -tulpn', check: (s, h) => said(h, /^(sudo\s+)?(ss|netstat)/i) },
      ],
    },
  ],

  // ================= LEVEL 3 =================
  3: [
    {
      id: 'lin3-ssh',
      title: 'Lab 3B — SSH Key และการปิดรหัสผ่าน',
      brief: 'นโยบายใหม่ห้ามล็อกอิน SSH ด้วยรหัสผ่าน ทุกคนต้องใช้ key — เตรียม key ให้เรียบร้อยและตั้งสิทธิ์โฟลเดอร์ .ssh ให้ถูกต้อง',
      device: 'linux',
      tasks: [
        { t: 'สร้าง SSH key แบบ <code>ed25519</code>', hint: 'ssh-keygen -t ed25519', check: s => !!node(s, '/home/student/.ssh/id_ed25519') },
        { t: 'ตรวจสอบว่ามีไฟล์ key ทั้ง private และ public', hint: 'ls -la /home/student/.ssh', check: s => !!node(s, '/home/student/.ssh/id_ed25519.pub') },
        { t: 'ตั้งสิทธิ์โฟลเดอร์ <code>~/.ssh</code> เป็น <code>700</code>', hint: 'chmod 700 /home/student/.ssh', check: s => { const n = node(s, '/home/student/.ssh'); return n && n.mode === '700'; } },
        { t: 'ตั้งสิทธิ์ private key เป็น <code>600</code>', hint: 'chmod 600 /home/student/.ssh/id_ed25519', check: s => { const n = node(s, '/home/student/.ssh/id_ed25519'); return n && n.mode === '600'; } },
        { t: 'ดูเนื้อหา public key (ที่จะเอาไปใส่ที่เซิร์ฟเวอร์ปลายทาง)', hint: 'cat /home/student/.ssh/id_ed25519.pub', check: (s, h) => said(h, /cat\s+.*id_ed25519\.pub/i) },
        { t: 'ดูการตั้งค่าปัจจุบันของ sshd', hint: 'cat /etc/ssh/sshd_config', check: (s, h) => said(h, /cat\s+\/etc\/ssh\/sshd_config/i) },
        { t: 'เขียนไฟล์ override <code>/etc/ssh/sshd_config.d/hardening.conf</code> ปิด root login', hint: 'sudo mkdir -p /etc/ssh/sshd_config.d → echo "PermitRootLogin no" > /etc/ssh/sshd_config.d/hardening.conf', check: s => { const f = node(s, '/etc/ssh/sshd_config.d/hardening.conf'); return f && /PermitRootLogin/i.test(f.content); } },
        { t: 'อนุญาต SSH ใน firewall ก่อนเปิดใช้งาน', hint: 'sudo ufw allow 22/tcp', check: s => s.ufw.rules.some(r => /22/.test(r.to)) },
        { t: 'เปิด firewall', hint: 'sudo ufw enable', check: s => s.ufw.active },
        { t: 'รีสตาร์ท sshd เพื่อให้ config มีผล', hint: 'sudo systemctl restart sshd', check: (s, h) => said(h, /systemctl\s+restart\s+ssh/i) },
      ],
    },
    {
      id: 'lin3-logs',
      title: 'Lab 3C — วิเคราะห์ Log หาผู้บุกรุก',
      brief: 'ระบบเฝ้าระวังแจ้งว่ามีการพยายามล็อกอินผิดจำนวนมาก ให้ไล่ดู log หา IP ต้นทาง แล้วทำรายงานส่งหัวหน้า',
      device: 'linux',
      tasks: [
        { t: 'ดู log การยืนยันตัวตนทั้งหมด', hint: 'cat /var/log/auth.log', check: (s, h) => said(h, /cat\s+\/var\/log\/auth\.log/i) },
        { t: 'กรองเฉพาะบรรทัดที่ล็อกอินล้มเหลว', hint: 'grep "Failed password" /var/log/auth.log', check: (s, h) => said(h, /grep.*failed.*auth\.log/i) },
        { t: 'นับจำนวนครั้งที่ล้มเหลวด้วย pipe', hint: 'grep "Failed password" /var/log/auth.log | wc -l', check: (s, h) => said(h, /grep.*\|\s*wc/i) },
        { t: 'ดึงเฉพาะบรรทัดที่สำเร็จ (Accepted) ออกมาดู', hint: 'grep Accepted /var/log/auth.log', check: (s, h) => said(h, /grep\s+.*accepted/i) },
        { t: 'ใช้ pipe หลายชั้น: กรอง → เรียง → นับซ้ำ', hint: 'grep "Failed password" /var/log/auth.log | sort | uniq -c', check: (s, h) => said(h, /\|\s*sort\s*\|\s*uniq/i) },
        { t: 'ดึงรายชื่อผู้ใช้ทั้งหมดในระบบด้วย cut', hint: 'cat /etc/passwd | cut -d: -f1', check: (s, h) => said(h, /cut\s+-d/i) },
        { t: 'สร้างโฟลเดอร์รายงาน <code>/home/student/reports</code>', hint: 'mkdir -p /home/student/reports', check: s => !!node(s, '/home/student/reports') },
        { t: 'บันทึกผลการกรองลงไฟล์ <code>/home/student/reports/failed.txt</code>', hint: 'grep "Failed password" /var/log/auth.log > /home/student/reports/failed.txt', check: s => { const f = node(s, '/home/student/reports/failed.txt'); return f && f.content.trim().length > 0; } },
        { t: 'ดู log ระดับ error ของระบบตั้งแต่บูตครั้งนี้', hint: 'journalctl -p err', check: (s, h) => said(h, /journalctl\s+-p/i) },
        { t: 'ตรวจสอบว่ามีใครล็อกอินอยู่และ process อะไรทำงาน', hint: 'ps aux', check: (s, h) => said(h, /^(sudo\s+)?ps\s/i) },
      ],
    },
  ],

  // ================= LEVEL 4 =================
  4: [
    {
      id: 'lin4-lvm',
      title: 'Lab 4B — ขยายพื้นที่ด้วย LVM โดยไม่ต้องหยุดระบบ',
      brief: 'พาร์ทิชัน /mnt/app ใกล้เต็ม ทีมเพิ่มดิสก์ใหม่ /dev/sdb เข้ามาแล้ว ให้ขยาย logical volume โดยระบบยังทำงานได้ตามปกติ',
      device: 'linux',
      tasks: [
        { t: 'ดูโครงสร้างดิสก์ปัจจุบัน', hint: 'lsblk', check: (s, h) => said(h, /^(sudo\s+)?lsblk/i) },
        { t: 'ดูพื้นที่ที่ใช้ไป', hint: 'df -h', check: (s, h) => said(h, /^(sudo\s+)?df/i) },
        { t: 'ดู UUID ของดิสก์ที่มี', hint: 'sudo blkid', check: (s, h) => said(h, /blkid/i) },
        { t: 'ดูสถานะ volume group ปัจจุบัน', hint: 'sudo vgs', check: (s, h) => said(h, /^(sudo\s+)?vgs/i) },
        { t: 'เตรียมดิสก์ใหม่ <code>/dev/sdb</code> ให้เป็น physical volume', hint: 'sudo pvcreate /dev/sdb', check: s => s.lvm.pvs.includes('/dev/sdb') },
        { t: 'เพิ่ม <code>/dev/sdb</code> เข้า volume group <code>vg_data</code>', hint: 'sudo vgextend vg_data /dev/sdb', check: s => s.lvm.vgs.vg_data.pvs.includes('/dev/sdb') },
        { t: 'ขยาย logical volume <code>lv_app</code> ให้ใช้พื้นที่ว่างทั้งหมด', hint: 'sudo lvextend -l +100%FREE /dev/vg_data/lv_app', check: s => s.lvm.lvs.lv_app.size === '60G' },
        { t: 'ขยาย filesystem ให้เห็นพื้นที่ใหม่ (ขั้นตอนที่คนลืมบ่อยที่สุด)', hint: 'sudo resize2fs /dev/vg_data/lv_app', check: s => s.lvm.lvs.lv_app.pendingResize === false },
        { t: 'ตรวจสอบผลด้วย <code>lvs</code>', hint: 'sudo lvs', check: (s, h) => said(h, /^(sudo\s+)?lvs/i) },
        { t: 'สร้างจุด mount <code>/mnt/data</code> และ mount <code>/dev/sdb</code>', hint: 'sudo mkdir -p /mnt/data → sudo mount /dev/sdb /mnt/data', check: s => s.mounts.some(m => m.mp === '/mnt/data') },
        { t: 'ตรวจสอบรายการ mount ทั้งหมด', hint: 'mount', check: (s, h) => said(h, /^(sudo\s+)?mount\s*$/i) },
      ],
    },
    {
      id: 'lin4-docker',
      title: 'Lab 4C — Deploy บริการด้วย Container',
      brief: 'ทีมพัฒนาส่ง image มาให้ deploy บนเซิร์ฟเวอร์ทดสอบ ต้องรัน container ผูก volume และเปิด firewall ให้เข้าถึงได้',
      device: 'linux',
      tasks: [
        { t: 'ดูรายการ image ที่มีบนเครื่อง', hint: 'docker images', check: (s, h) => said(h, /docker\s+images/i) },
        { t: 'ดูว่ามี container ทำงานอยู่หรือไม่', hint: 'docker ps -a', check: (s, h) => said(h, /docker\s+ps/i) },
        { t: 'สร้างโฟลเดอร์เก็บข้อมูลเว็บ <code>/srv/www</code>', hint: 'sudo mkdir -p /srv/www', check: s => !!node(s, '/srv/www') },
        { t: 'สร้างไฟล์ <code>/srv/www/index.html</code>', hint: 'echo "<h1>Hello from container</h1>" > /srv/www/index.html', check: s => { const f = node(s, '/srv/www/index.html'); return f && f.content.length > 5; } },
        { t: 'รัน container ชื่อ <code>web</code> จาก image <code>nginx:1.25-alpine</code> ผูกพอร์ต 80', hint: 'docker run -d --name web -p 80:80 nginx:1.25-alpine', check: s => s.containers.some(c => c.name === 'web' && c.state === 'Up') },
        { t: 'รัน container ชื่อ <code>db</code> จาก image <code>postgres:16-alpine</code>', hint: 'docker run -d --name db postgres:16-alpine', check: s => s.containers.some(c => c.name === 'db') },
        { t: 'ตรวจสอบว่า container ทั้งสองทำงานอยู่', hint: 'docker ps', check: (s, h) => h.filter(c => /docker\s+ps/i.test(c)).length >= 2 },
        { t: 'ดู resource ที่แต่ละ container ใช้', hint: 'docker stats', check: (s, h) => said(h, /docker\s+stats/i) },
        { t: 'ดู log ของ container <code>web</code>', hint: 'docker logs web', check: (s, h) => said(h, /docker\s+logs/i) },
        { t: 'เปิด firewall พอร์ต 80', hint: 'sudo ufw allow 80/tcp', check: s => s.ufw.rules.some(r => /80/.test(r.to)) },
        { t: 'หยุด container <code>db</code> ที่ยังไม่ต้องใช้', hint: 'docker stop db', check: s => s.containers.some(c => c.name === 'db' && c.state === 'Exited') },
      ],
    },
  ],

  // ================= LEVEL 5 =================
  5: [
    {
      id: 'lin5-kernel',
      title: 'Lab 5B — Kernel Hardening และ Brute-force Protection',
      brief: 'เซิร์ฟเวอร์กำลังจะมี public IP ต้องปรับ kernel parameter ตาม CIS Benchmark และติดตั้งระบบแบน IP ที่พยายามเดารหัสผ่าน',
      device: 'linux',
      tasks: [
        { t: 'ดูค่า sysctl ปัจจุบันทั้งหมด', hint: 'sysctl -a', check: (s, h) => said(h, /sysctl\s+-a/i) },
        { t: 'สร้างโฟลเดอร์ <code>/etc/sysctl.d</code>', hint: 'sudo mkdir -p /etc/sysctl.d', check: s => !!node(s, '/etc/sysctl.d') },
        { t: 'เขียนค่า <code>net.ipv4.tcp_syncookies = 1</code> ลงไฟล์ <code>99-hardening.conf</code>', hint: 'echo "net.ipv4.tcp_syncookies = 1" > /etc/sysctl.d/99-hardening.conf', check: s => { const f = node(s, '/etc/sysctl.d/99-hardening.conf'); return f && /tcp_syncookies/.test(f.content); } },
        { t: 'เพิ่มค่า <code>net.ipv4.ip_forward = 0</code> ต่อท้ายไฟล์เดิม', hint: 'echo "net.ipv4.ip_forward = 0" >> /etc/sysctl.d/99-hardening.conf', check: s => { const f = node(s, '/etc/sysctl.d/99-hardening.conf'); return f && /ip_forward/.test(f.content); } },
        { t: 'โหลดค่า sysctl ใหม่ทั้งระบบ', hint: 'sudo sysctl --system', check: (s, h) => said(h, /sysctl\s+--system/i) },
        { t: 'ตั้งค่าชั่วคราว <code>kernel.randomize_va_space=2</code> (ASLR)', hint: 'sudo sysctl -w kernel.randomize_va_space=2', check: s => s.sysctl['kernel.randomize_va_space'] === '2' },
        { t: 'ติดตั้ง <code>fail2ban</code>', hint: 'sudo apt install fail2ban', check: (s, h) => said(h, /apt\s+(install|-y\s+install).*fail2ban/i) },
        { t: 'ค้นหาไฟล์ SUID ที่อาจเป็นช่องโหว่', hint: 'sudo find / -perm -4000 -type f', check: (s, h) => said(h, /find\s+\/\s+-perm/i) },
        { t: 'ตรวจสอบสถานะ SELinux/AppArmor', hint: 'getenforce', check: (s, h) => said(h, /getenforce/i) },
        { t: 'ตั้ง default policy ของ ufw เป็น deny incoming', hint: 'sudo ufw default deny incoming', check: (s, h) => said(h, /ufw\s+default\s+deny/i) },
        { t: 'อนุญาต SSH แล้วเปิด firewall', hint: 'sudo ufw allow 22/tcp → sudo ufw enable', check: s => s.ufw.active && s.ufw.rules.some(r => /22/.test(r.to)) },
      ],
    },
    {
      id: 'lin5-ops',
      title: 'Lab 5C — Observability และงานอัตโนมัติ',
      brief: 'ก่อนส่งมอบเซิร์ฟเวอร์เข้าสู่การดูแลของทีม NOC ต้องตั้งเวลาให้ตรง เตรียมสคริปต์ health check และทำเอกสารสรุปสถานะระบบ',
      device: 'linux',
      tasks: [
        { t: 'ตั้ง hostname เป็น <code>prod-app01</code>', hint: 'sudo hostnamectl set-hostname prod-app01', check: s => s.hostname === 'prod-app01' },
        { t: 'ตรวจสอบเวลาและ NTP sync', hint: 'timedatectl', check: (s, h) => said(h, /^timedatectl\s*$/i) },
        { t: 'ตั้ง timezone เป็น <code>Asia/Bangkok</code>', hint: 'sudo timedatectl set-timezone Asia/Bangkok', check: s => s.timezone === 'Asia/Bangkok' },
        { t: 'สร้างโฟลเดอร์สคริปต์ <code>/opt/ops/scripts</code>', hint: 'sudo mkdir -p /opt/ops/scripts', check: s => !!node(s, '/opt/ops/scripts') },
        { t: 'สร้างสคริปต์ <code>/opt/ops/scripts/health.sh</code>', hint: 'echo "#!/bin/bash" > /opt/ops/scripts/health.sh', check: s => { const f = node(s, '/opt/ops/scripts/health.sh'); return f && f.content.length > 3; } },
        { t: 'เพิ่มคำสั่งเก็บ disk usage ต่อท้ายสคริปต์', hint: 'echo "df -h >> /var/log/health.log" >> /opt/ops/scripts/health.sh', check: s => { const f = node(s, '/opt/ops/scripts/health.sh'); return f && f.content.trim().split('\n').length >= 2; } },
        { t: 'ให้สิทธิ์รันแก่สคริปต์ (<code>750</code>)', hint: 'sudo chmod 750 /opt/ops/scripts/health.sh', check: s => { const f = node(s, '/opt/ops/scripts/health.sh'); return f && f.mode === '750'; } },
        { t: 'ดู cron job ที่มีอยู่', hint: 'crontab -l', check: (s, h) => said(h, /crontab\s+-l/i) },
        { t: 'เก็บรายงานสถานะดิสก์ลง <code>/opt/ops/report.txt</code>', hint: 'df -h > /opt/ops/report.txt', check: s => { const f = node(s, '/opt/ops/report.txt'); return f && f.content.length > 10; } },
        { t: 'เพิ่มข้อมูลหน่วยความจำต่อท้ายรายงาน', hint: 'free -h >> /opt/ops/report.txt', check: s => { const f = node(s, '/opt/ops/report.txt'); return f && /Mem:/.test(f.content); } },
        { t: 'ตรวจสอบว่า service สำคัญยังทำงาน', hint: 'systemctl is-active sshd', check: (s, h) => said(h, /systemctl\s+is-active/i) },
        { t: 'ตรวจสอบการเชื่อมต่อ DNS ด้วย dig', hint: 'dig example.com', check: (s, h) => said(h, /^dig\s/i) },
      ],
    },
  ],
};

// ============================================================
//  จัดระดับใหม่ให้ตรงกับลำดับการเรียน 6 ระดับ
//  (เนื้อหา lab ไม่เปลี่ยน คง id เดิมไว้ทั้งหมด — ความคืบหน้าของผู้เรียนไม่หาย)
// ============================================================
const LEVEL_OF = {
  'lin1-survey': 1,     // สำรวจระบบ + คำสั่งพื้นฐาน
  'lin1-files': 1,      // จัดการไฟล์
  'lin2-team': 2,       // ผู้ใช้ กลุ่ม สิทธิ์
  'lin2-service': 3,    // systemd + งานตามเวลา
  'lin5-kernel': 3,     // sysctl / kernel tuning
  'lin4-lvm': 4,        // LVM
  'lin4-docker': 4,     // containers
  'lin3-ssh': 5,        // SSH hardening
  'lin3-logs': 5,       // อ่าน log หาผู้บุกรุก
  'lin5-ops': 6,        // automation + observability
};

const byLevel = {};
Object.values(BY_OLD_LEVEL).flat().forEach((lab) => {
  const lv = LEVEL_OF[lab.id] || 1;
  (byLevel[lv] ||= []).push(lab);
});

export default byLevel;
