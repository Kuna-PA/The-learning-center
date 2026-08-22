// helper สำหรับตรวจ virtual filesystem ของ lab
const node = (s, p) => {
  const parts = String(p).split('/').filter(Boolean);
  let n = s.fs;
  for (const x of parts) {
    if (!n || n.t !== 'd' || !n.children[x]) return null;
    n = n.children[x];
  }
  return n;
};

export default {
  id: 'linux',
  name: 'Linux',
  icon: '🐧',
  device: 'linux',
  sub: 'Ubuntu / RHEL — Server Administration',
  desc: 'ตั้งแต่โครงสร้างไฟล์และ shell, สิทธิ์, systemd, เครือข่าย, firewall ไปจนถึง performance tuning, containers และ automation',

  levels: {
    // =========================================================
    1: {
      title: 'โครงสร้างระบบและคำสั่งพื้นฐาน',
      objectives: [
        'เข้าใจ Filesystem Hierarchy Standard ว่าไฟล์อะไรอยู่ที่ไหน',
        'เดินไปมาในระบบไฟล์และอ่านไฟล์ได้คล่อง',
        'แยกความต่างระหว่าง distro ตระกูล Debian กับ RHEL',
        'ใช้ pipe และ redirect เป็น',
      ],
      sections: [
        {
          t: 'Filesystem Hierarchy — ไฟล์อะไรอยู่ที่ไหน',
          h: `
<table class="tbl">
<tr><th>ตำแหน่ง</th><th>เก็บอะไร</th></tr>
<tr><td><code>/etc</code></td><td>ไฟล์ config ทั้งหมดของระบบ — ที่แรกที่ต้องมองเมื่อจะแก้ค่าอะไร</td></tr>
<tr><td><code>/var/log</code></td><td>log ทั้งหมด — ที่แรกที่ต้องมองเมื่อมีอะไรพัง</td></tr>
<tr><td><code>/home</code></td><td>ข้อมูลส่วนตัวของผู้ใช้แต่ละคน</td></tr>
<tr><td><code>/root</code></td><td>home ของ root (ไม่ได้อยู่ใน /home)</td></tr>
<tr><td><code>/usr/bin</code>, <code>/usr/sbin</code></td><td>โปรแกรมที่ติดตั้งมากับระบบ</td></tr>
<tr><td><code>/opt</code></td><td>ซอฟต์แวร์ของบุคคลที่สามที่ติดตั้งแยก</td></tr>
<tr><td><code>/tmp</code></td><td>ไฟล์ชั่วคราว ถูกล้างเมื่อรีบูต</td></tr>
<tr><td><code>/proc</code>, <code>/sys</code></td><td>ไฟล์เสมือนที่สะท้อนสถานะ kernel แบบ real-time</td></tr>
<tr><td><code>/mnt</code>, <code>/media</code></td><td>จุด mount ของ storage เพิ่มเติม</td></tr>
</table>
<table class="tbl">
<tr><th></th><th>ตระกูล Debian (Ubuntu, Debian)</th><th>ตระกูล RHEL (RHEL, Rocky, Alma)</th></tr>
<tr><td>Package manager</td><td><code>apt</code> (.deb)</td><td><code>dnf</code> / <code>yum</code> (.rpm)</td></tr>
<tr><td>ตั้งค่าเครือข่าย</td><td>netplan (/etc/netplan)</td><td>NetworkManager (nmcli)</td></tr>
<tr><td>Firewall</td><td><code>ufw</code></td><td><code>firewall-cmd</code></td></tr>
<tr><td>Security module</td><td>AppArmor</td><td>SELinux</td></tr>
<tr><td>นิยมใช้กับ</td><td>งานทั่วไป, cloud, container</td><td>องค์กรที่ต้องการ support และ certification</td></tr>
</table>`,
        },
        {
          t: 'คำสั่งที่ใช้ทุกวัน',
          h: `
<pre class="code">pwd                    <span style="color:#5b6b8c"># อยู่ที่ไหน</span>
ls -la /etc            <span style="color:#5b6b8c"># ดูไฟล์ทั้งหมดรวมไฟล์ซ่อน พร้อมรายละเอียด</span>
cd /var/log            <span style="color:#5b6b8c"># ย้ายไดเรกทอรี ( cd ~ = home, cd .. = ขึ้นชั้น, cd - = กลับที่เดิม )</span>
cat /etc/os-release    <span style="color:#5b6b8c"># ดูว่าเป็น distro อะไร เวอร์ชันไหน</span>
less /var/log/syslog   <span style="color:#5b6b8c"># อ่านไฟล์ยาว ๆ ( q เพื่อออก, / เพื่อค้นหา )</span>
head -n 20 file.txt    <span style="color:#5b6b8c"># 20 บรรทัดแรก</span>
tail -n 50 file.txt    <span style="color:#5b6b8c"># 50 บรรทัดสุดท้าย</span>
tail -f /var/log/syslog  <span style="color:#5b6b8c"># ตามดู log แบบ real-time — ใช้บ่อยที่สุดตอนไล่ปัญหา</span></pre>
<p><b>Pipe และ Redirect</b> — พลังที่แท้จริงของ shell คือการต่อคำสั่งเข้าด้วยกัน</p>
<table class="tbl">
<tr><th>สัญลักษณ์</th><th>ความหมาย</th><th>ตัวอย่าง</th></tr>
<tr><td><code>|</code></td><td>ส่งผลลัพธ์ไปเป็น input ของคำสั่งถัดไป</td><td><code>ps aux | grep nginx</code></td></tr>
<tr><td><code>&gt;</code></td><td>เขียนลงไฟล์ (ทับของเดิม)</td><td><code>ls -la &gt; files.txt</code></td></tr>
<tr><td><code>&gt;&gt;</code></td><td>ต่อท้ายไฟล์</td><td><code>echo "log" &gt;&gt; app.log</code></td></tr>
<tr><td><code>2&gt;</code></td><td>เปลี่ยนทางเฉพาะ error</td><td><code>cmd 2&gt; error.txt</code></td></tr>
<tr><td><code>&amp;&gt;</code></td><td>เปลี่ยนทางทั้ง output และ error</td><td><code>cmd &amp;&gt; all.txt</code></td></tr>
</table>
<pre class="code"><span style="color:#5b6b8c"># ตัวอย่างที่ใช้จริง: นับจำนวนครั้งที่ล็อกอินล้มเหลว</span>
grep "Failed password" /var/log/auth.log | wc -l

<span style="color:#5b6b8c"># หา IP ที่พยายามล็อกอินบ่อยที่สุด 5 อันดับแรก</span>
grep "Failed password" /var/log/auth.log | awk '{print $11}' | sort | uniq -c | sort -rn | head -5</pre>`,
        },
        {
          t: 'ขอความช่วยเหลือและค้นหา',
          h: `
<pre class="code">man ls                 <span style="color:#5b6b8c"># คู่มือฉบับเต็ม ( q เพื่อออก )</span>
ls --help              <span style="color:#5b6b8c"># สรุปสั้น ๆ</span>
which python3          <span style="color:#5b6b8c"># โปรแกรมนี้อยู่ที่ไหน</span>
type ll                <span style="color:#5b6b8c"># เป็นคำสั่งจริงหรือ alias</span>

<span style="color:#5b6b8c"># ค้นหาไฟล์</span>
find /etc -name "*.conf"              <span style="color:#5b6b8c"># หาตามชื่อ</span>
find /var/log -type f -size +100M     <span style="color:#5b6b8c"># หาไฟล์ log ที่ใหญ่เกิน 100MB</span>
find /home -type f -mtime -1          <span style="color:#5b6b8c"># หาไฟล์ที่แก้ไขใน 1 วันที่ผ่านมา</span>

<span style="color:#5b6b8c"># ค้นหาข้อความในไฟล์</span>
grep -r "192.168.10" /etc             <span style="color:#5b6b8c"># หาแบบ recursive ทุกไฟล์ย่อย</span>
grep -i "error" /var/log/syslog       <span style="color:#5b6b8c"># ไม่สนตัวพิมพ์เล็กใหญ่</span>
grep -v "debug" app.log               <span style="color:#5b6b8c"># แสดงบรรทัดที่ *ไม่* มีคำนี้</span>
grep -n "listen" /etc/nginx/nginx.conf  <span style="color:#5b6b8c"># แสดงเลขบรรทัดด้วย</span></pre>
<div class="note"><b>เคล็ดลับที่ทำให้ทำงานเร็วขึ้นทันที</b><br>
<b>Tab</b> เติมชื่อไฟล์/คำสั่งอัตโนมัติ (กด 2 ครั้งเพื่อดูตัวเลือก) · <b>Ctrl+R</b> ค้นหาคำสั่งเก่าที่เคยพิมพ์ · <b>Ctrl+C</b> ยกเลิกคำสั่งที่ค้าง · <b>Ctrl+L</b> ล้างหน้าจอ · <b>!!</b> รันคำสั่งล่าสุดซ้ำ (ใช้คู่กับ <code>sudo !!</code> เมื่อลืมใส่ sudo)</div>`,
        },
      ],
      quiz: [
        { type: 'mcq', q: 'ไฟล์ config ของระบบส่วนใหญ่เก็บอยู่ที่ไดเรกทอรีใด', opts: ['/var', '/etc', '/opt', '/usr'], a: 1, why: '/etc คือที่เก็บ config ทั้งหมดของระบบ — เป็นที่แรกที่ต้องดูเมื่อจะแก้ค่าอะไรก็ตาม' },
        { type: 'cmd', q: 'พิมพ์คำสั่งดูไฟล์ทั้งหมด (รวมไฟล์ซ่อน) พร้อมรายละเอียดในไดเรกทอรีปัจจุบัน', ans: ['ls -la', 'ls -al', 'ls -a -l', 'll -a'], why: '-l = แสดงรายละเอียด (สิทธิ์ เจ้าของ ขนาด เวลา), -a = แสดงไฟล์ที่ขึ้นต้นด้วยจุดด้วย' },
        { type: 'mcq', q: 'คำสั่งใดใช้ดู log แบบ real-time ขณะที่มีบรรทัดใหม่เข้ามา', opts: ['cat /var/log/syslog', 'tail -f /var/log/syslog', 'head /var/log/syslog', 'grep /var/log/syslog'], a: 1, why: 'tail -f (follow) จะค้างรอและแสดงบรรทัดใหม่ทันทีที่ถูกเขียนลงไฟล์ — เครื่องมือหลักในการไล่ปัญหา' },
        { type: 'cmd', q: 'พิมพ์คำสั่งค้นหาคำว่า <code>error</code> แบบไม่สนตัวพิมพ์เล็กใหญ่ ในไฟล์ <code>/var/log/syslog</code>', ans: ['grep -i error /var/log/syslog', 'grep -i "error" /var/log/syslog'], why: '-i = ignore case ส่วน -v จะกลับด้าน (แสดงบรรทัดที่ไม่มีคำนั้น) และ -r ค้นแบบ recursive ทั้งโฟลเดอร์' },
        { type: 'mcq', q: 'สัญลักษณ์ <code>&gt;&gt;</code> ต่างจาก <code>&gt;</code> อย่างไร', opts: ['ไม่ต่างกัน', '&gt;&gt; ต่อท้ายไฟล์เดิม ส่วน &gt; เขียนทับทั้งไฟล์', '&gt;&gt; เร็วกว่า', '&gt;&gt; ใช้กับ error เท่านั้น'], a: 1, why: 'พิมพ์ > ผิดเป็นไฟล์ที่มีข้อมูลอยู่ = ข้อมูลหายทันที ระวังให้มากเวลาเขียนสคริปต์' },
        { type: 'mcq', q: 'ตระกูล RHEL ใช้ package manager และ firewall ตัวใด', opts: ['apt และ ufw', 'dnf/yum และ firewall-cmd', 'pacman และ iptables', 'apk และ nftables'], a: 1, why: 'Debian/Ubuntu ใช้ apt + ufw + AppArmor ส่วน RHEL/Rocky ใช้ dnf + firewall-cmd + SELinux' },
        { type: 'multi', q: 'คำสั่งใดใช้ค้นหาไฟล์ (เลือกทุกข้อที่ถูก)', opts: ['find /etc -name "*.conf"', 'grep -r "text" /etc', 'which python3', 'pwd'], a: [0, 1, 2], why: 'pwd แค่บอกว่าเราอยู่ไดเรกทอรีไหน ไม่ได้ค้นหาอะไร' },
      ],
      labs: [{
        id: 'lin-l1-basic',
        title: 'Lab 1 — สำรวจระบบและจัดการไฟล์',
        brief: 'คุณเพิ่งได้รับสิทธิ์เข้าเซิร์ฟเวอร์ตัวใหม่ ลองสำรวจระบบและจัดการไฟล์เบื้องต้น',
        device: 'linux',
        tasks: [
          { t: 'ดูว่าตอนนี้อยู่ไดเรกทอรีใด', hint: 'pwd', check: (s, h) => h.some(c => /^pwd\s*$/i.test(c.trim())) },
          { t: 'ดูว่าเซิร์ฟเวอร์นี้เป็น distro อะไร', hint: 'cat /etc/os-release', check: (s, h) => h.some(c => /cat\s+\/etc\/os-release/i.test(c)) },
          { t: 'สร้างไดเรกทอรี <code>/home/student/reports</code>', hint: 'mkdir /home/student/reports (หรือ mkdir reports เมื่ออยู่ที่ home)', check: s => !!node(s, '/home/student/reports') },
          { t: 'สร้างไฟล์ <code>/home/student/reports/check.txt</code>', hint: 'touch /home/student/reports/check.txt', check: s => !!node(s, '/home/student/reports/check.txt') },
          { t: 'เขียนข้อความลงไฟล์ <code>check.txt</code> ด้วย echo และ redirect', hint: 'echo "system ok" > /home/student/reports/check.txt', check: s => { const f = node(s, '/home/student/reports/check.txt'); return f && f.content.trim().length > 0; } },
          { t: 'อ่านไฟล์ที่เพิ่งเขียน', hint: 'cat /home/student/reports/check.txt', check: (s, h) => h.some(c => /cat\s+.*check\.txt/i.test(c)) },
          { t: 'ค้นหาบรรทัดที่มีคำว่า <code>Failed</code> ใน <code>/var/log/auth.log</code>', hint: 'grep Failed /var/log/auth.log', check: (s, h) => h.some(c => /grep.*(failed).*auth\.log/i.test(c)) },
          { t: 'นับจำนวนบรรทัดของ <code>/var/log/syslog</code> ด้วย pipe', hint: 'cat /var/log/syslog | wc -l', check: (s, h) => h.some(c => /\|\s*wc/i.test(c)) },
        ],
      }],
    },

    // =========================================================
    2: {
      title: 'สิทธิ์ ผู้ใช้ แพ็กเกจ และ systemd',
      objectives: [
        'อ่านและตั้งสิทธิ์ไฟล์ทั้งแบบตัวเลขและสัญลักษณ์',
        'จัดการผู้ใช้ กลุ่ม และ sudo อย่างปลอดภัย',
        'ติดตั้ง/อัปเดตแพ็กเกจได้ทั้งสองตระกูล',
        'ควบคุม service ด้วย systemd และอ่าน journal',
      ],
      sections: [
        {
          t: 'สิทธิ์ไฟล์',
          h: `
<pre class="code">$ ls -l /home/student/scripts/backup.sh
-rwxr-xr--  1 student  student  142 Aug 21 09:41 backup.sh
 │└┬┘└┬┘└┬┘    └──┬──┘  └──┬──┘
 │ │  │  │        │        └── group
 │ │  │  │        └────────── owner
 │ │  │  └── others: r--  (อ่านอย่างเดียว)
 │ │  └───── group : r-x  (อ่าน + รัน)
 │ └──────── owner : rwx  (อ่าน + เขียน + รัน)
 └────────── ชนิด: - = ไฟล์, d = ไดเรกทอรี, l = symlink</pre>
<table class="tbl">
<tr><th>สิทธิ์</th><th>เลข</th><th>กับไฟล์</th><th>กับไดเรกทอรี</th></tr>
<tr><td><code>r</code> read</td><td>4</td><td>อ่านเนื้อหาได้</td><td>ดูรายชื่อไฟล์ได้ (ls)</td></tr>
<tr><td><code>w</code> write</td><td>2</td><td>แก้ไขได้</td><td>สร้าง/ลบไฟล์ข้างในได้</td></tr>
<tr><td><code>x</code> execute</td><td>1</td><td>รันได้</td><td>เข้าไปข้างในได้ (cd)</td></tr>
</table>
<pre class="code">chmod 750 script.sh        <span style="color:#5b6b8c"># owner=rwx(7) group=r-x(5) others=---(0)</span>
chmod +x script.sh         <span style="color:#5b6b8c"># เพิ่มสิทธิ์รันให้ทุกคน</span>
chmod g-w file.txt         <span style="color:#5b6b8c"># ถอนสิทธิ์เขียนของ group</span>
chmod -R 755 /var/www      <span style="color:#5b6b8c"># ทำทั้งโฟลเดอร์และไฟล์ข้างใน</span>
chown www-data:www-data /var/www/html -R</pre>
<table class="tbl">
<tr><th>เลขที่ใช้บ่อย</th><th>ความหมาย</th><th>ใช้กับ</th></tr>
<tr><td><code>644</code></td><td>owner แก้ได้ คนอื่นอ่านอย่างเดียว</td><td>ไฟล์ทั่วไป, ไฟล์เว็บ</td></tr>
<tr><td><code>755</code></td><td>owner ทำได้ทุกอย่าง คนอื่นอ่าน+รัน</td><td>ไดเรกทอรี, สคริปต์สาธารณะ</td></tr>
<tr><td><code>600</code></td><td>เฉพาะ owner เท่านั้น</td><td>ไฟล์รหัสผ่าน, private key</td></tr>
<tr><td><code>700</code></td><td>เฉพาะ owner ทำได้ทุกอย่าง</td><td>โฟลเดอร์ส่วนตัว, ~/.ssh</td></tr>
</table>
<div class="note warn"><b>ห้ามใช้ <code>chmod 777</code></b> — เป็นการเปิดให้ทุกคนบนเครื่องแก้ไฟล์ได้ ถ้าไฟล์นั้นถูกรันโดย service ก็เท่ากับเปิดทางให้ยกระดับสิทธิ์ ถ้าเจอปัญหาสิทธิ์ให้แก้ที่ owner/group ให้ถูกแทน</div>`,
        },
        {
          t: 'ผู้ใช้ กลุ่ม และ sudo',
          h: `
<pre class="code">useradd -m -s /bin/bash ops1     <span style="color:#5b6b8c"># -m สร้าง home, -s กำหนด shell</span>
passwd ops1
usermod -aG sudo ops1            <span style="color:#5b6b8c"># -aG = append ต้องมี a เสมอ!</span>
id ops1
groups ops1
userdel -r olduser               <span style="color:#5b6b8c"># -r ลบ home ด้วย</span></pre>
<div class="note warn"><b>อันตรายมาก:</b> <code>usermod -G sudo ops1</code> (ไม่มี <code>-a</code>) จะ <b>แทนที่</b> กลุ่มเดิมทั้งหมด ทำให้ผู้ใช้หลุดจากทุกกลุ่มที่เคยอยู่ — ต้องใช้ <code>-aG</code> เสมอ</div>
<table class="tbl">
<tr><th>ไฟล์</th><th>เก็บอะไร</th></tr>
<tr><td><code>/etc/passwd</code></td><td>รายชื่อผู้ใช้ uid, home, shell (อ่านได้ทุกคน)</td></tr>
<tr><td><code>/etc/shadow</code></td><td>รหัสผ่านที่ hash แล้ว (อ่านได้เฉพาะ root)</td></tr>
<tr><td><code>/etc/group</code></td><td>รายชื่อกลุ่มและสมาชิก</td></tr>
<tr><td><code>/etc/sudoers</code></td><td>ใครทำอะไรด้วย sudo ได้บ้าง — แก้ด้วย <code>visudo</code> เท่านั้น</td></tr>
</table>
<div class="note"><b>ทำไมต้องใช้ <code>visudo</code></b> — มันตรวจ syntax ก่อนบันทึก ถ้าแก้ /etc/sudoers ด้วย editor ธรรมดาแล้วพิมพ์ผิด <b>ทุกคนจะใช้ sudo ไม่ได้อีกเลย</b> รวมถึงตัวคุณเอง</div>
<pre class="code"><span style="color:#5b6b8c"># ให้สิทธิ์เฉพาะคำสั่ง แทนการให้ทุกอย่าง (ปลอดภัยกว่ามาก)</span>
<span style="color:#5b6b8c"># ในไฟล์ /etc/sudoers.d/backup-operator</span>
ops1 ALL=(root) NOPASSWD: /usr/bin/systemctl restart nginx, /usr/bin/tail -f /var/log/*</pre>`,
        },
        {
          t: 'แพ็กเกจและ systemd',
          h: `
<table class="tbl">
<tr><th>งาน</th><th>Ubuntu/Debian</th><th>RHEL/Rocky</th></tr>
<tr><td>อัปเดตรายการแพ็กเกจ</td><td><code>apt update</code></td><td><code>dnf check-update</code></td></tr>
<tr><td>อัปเกรดทั้งหมด</td><td><code>apt upgrade</code></td><td><code>dnf upgrade</code></td></tr>
<tr><td>ติดตั้ง</td><td><code>apt install nginx</code></td><td><code>dnf install nginx</code></td></tr>
<tr><td>ถอน</td><td><code>apt remove nginx</code></td><td><code>dnf remove nginx</code></td></tr>
<tr><td>ค้นหา</td><td><code>apt search</code></td><td><code>dnf search</code></td></tr>
<tr><td>ดูว่าไฟล์นี้มาจากแพ็กเกจไหน</td><td><code>dpkg -S /path</code></td><td><code>rpm -qf /path</code></td></tr>
</table>
<p><b>systemd</b> — ตัวจัดการ service ของ Linux ยุคปัจจุบัน</p>
<pre class="code">systemctl status nginx        <span style="color:#5b6b8c"># สถานะ + log ล่าสุด (คำสั่งที่ใช้บ่อยที่สุด)</span>
systemctl start nginx
systemctl stop nginx
systemctl restart nginx
systemctl reload nginx        <span style="color:#5b6b8c"># โหลด config ใหม่โดยไม่ตัด connection</span>
systemctl enable nginx        <span style="color:#5b6b8c"># ให้เริ่มอัตโนมัติตอนบูต</span>
systemctl disable nginx
systemctl is-active nginx     <span style="color:#5b6b8c"># ใช้ในสคริปต์</span>
systemctl list-units --type=service --state=running</pre>
<div class="note warn"><b>สับสนบ่อย:</b> <code>start</code> = ทำงานตอนนี้ (แต่หายเมื่อรีบูต) ส่วน <code>enable</code> = เริ่มอัตโนมัติตอนบูต (แต่ไม่ได้เริ่มตอนนี้)<br>
ต้องการทั้งคู่ใช้ <code>systemctl enable --now nginx</code></div>
<pre class="code"><span style="color:#5b6b8c"># อ่าน log ของ service</span>
journalctl -u nginx              <span style="color:#5b6b8c"># log ทั้งหมดของ service นี้</span>
journalctl -u nginx -f           <span style="color:#5b6b8c"># ตามดูแบบ real-time</span>
journalctl -u nginx --since "1 hour ago"
journalctl -p err -b             <span style="color:#5b6b8c"># เฉพาะ error ตั้งแต่บูตครั้งนี้</span>
journalctl --disk-usage</pre>`,
        },
      ],
      quiz: [
        { type: 'mcq', q: 'สิทธิ์ <code>-rwxr-xr--</code> หมายความว่าอย่างไร', opts: ['ทุกคนแก้ไขได้', 'owner: อ่าน/เขียน/รัน, group: อ่าน/รัน, others: อ่านอย่างเดียว', 'เฉพาะ root เข้าถึงได้', 'owner อ่านอย่างเดียว'], a: 1, why: 'เขียนเป็นตัวเลขคือ 754 (7=rwx, 5=r-x, 4=r--)' },
        { type: 'cmd', q: 'พิมพ์คำสั่งตั้งสิทธิ์ไฟล์ <code>script.sh</code> ให้เป็น owner ทำได้ทุกอย่าง group อ่าน+รัน others ไม่มีสิทธิ์', ans: ['chmod 750 script.sh'], why: '7 = rwx (owner), 5 = r-x (group), 0 = --- (others)' },
        { type: 'mcq', q: 'คำสั่ง <code>usermod -G sudo ops1</code> (ไม่มี -a) จะเกิดอะไรขึ้น', opts: ['เพิ่ม ops1 เข้ากลุ่ม sudo ตามปกติ', 'แทนที่กลุ่มทั้งหมดของ ops1 ด้วย sudo ทำให้หลุดจากกลุ่มเดิมทุกกลุ่ม', 'ไม่มีอะไรเกิดขึ้น', 'ลบกลุ่ม sudo'], a: 1, why: 'ต้องใช้ -aG (append) เสมอ — นี่คือความผิดพลาดที่ทำให้ผู้ใช้เข้าถึงทรัพยากรที่เคยใช้ได้ไม่ได้อีก' },
        { type: 'cmd', q: 'พิมพ์คำสั่งดูสถานะของ service <code>nginx</code>', ans: ['systemctl status nginx', 'systemctl status nginx.service'], why: 'แสดงทั้งสถานะ (active/inactive), enabled/disabled, PID และ log ล่าสุด — คำสั่งแรกที่ควรพิมพ์เสมอ' },
        { type: 'mcq', q: 'ต่างกันอย่างไรระหว่าง <code>systemctl start</code> กับ <code>systemctl enable</code>', opts: ['ไม่ต่างกัน', 'start = เริ่มตอนนี้, enable = ตั้งให้เริ่มอัตโนมัติตอนบูต', 'start ใช้กับ root เท่านั้น', 'enable เร็วกว่า'], a: 1, why: 'ใช้ systemctl enable --now เพื่อทำทั้งสองอย่างพร้อมกัน — ลืม enable คือสาเหตุที่ service หายหลังรีบูต' },
        { type: 'cmd', q: 'พิมพ์คำสั่งดู log ของ service <code>sshd</code> ผ่าน journald', ans: ['journalctl -u sshd', 'journalctl -u ssh', 'journalctl -u sshd.service'], why: 'journalctl -u <service> ดึงเฉพาะ log ของ unit นั้น เพิ่ม -f เพื่อตามดูแบบ real-time' },
        { type: 'mcq', q: 'ทำไมต้องแก้ไฟล์ <code>/etc/sudoers</code> ด้วย <code>visudo</code> เท่านั้น', opts: ['เพราะเร็วกว่า', 'เพราะ visudo ตรวจ syntax ก่อนบันทึก ถ้าพิมพ์ผิดจะไม่มีใครใช้ sudo ได้อีกเลย', 'เพราะเป็นข้อกำหนดของ POSIX', 'ไม่จำเป็น ใช้ nano ก็ได้'], a: 1, why: 'sudoers ที่ syntax ผิด = ล็อกตัวเองออกจากสิทธิ์ admin ทั้งเครื่อง กู้ได้ยากมากถ้าไม่มี console' },
        { type: 'multi', q: 'ข้อใดคือแนวปฏิบัติที่ดีเรื่องสิทธิ์ไฟล์ (เลือกทุกข้อที่ถูก)', opts: ['ใช้ 600 กับ private key', 'ใช้ 777 เมื่อเจอปัญหาสิทธิ์เพื่อความรวดเร็ว', 'ใช้ 755 กับไดเรกทอรีทั่วไป', 'แก้ owner/group ให้ถูกแทนการเปิดสิทธิ์กว้าง'], a: [0, 2, 3], why: '777 คือการเปิดให้ทุก process บนเครื่องแก้ไฟล์ได้ ซึ่งเป็นช่องทางยกระดับสิทธิ์ที่พบบ่อย' },
      ],
      labs: [{
        id: 'lin-l2-users',
        title: 'Lab 2 — ผู้ใช้ สิทธิ์ และ Service',
        brief: 'มีพนักงานใหม่เข้ามาในทีม ต้องสร้างบัญชี จัดสิทธิ์โฟลเดอร์งาน และเปิดเว็บเซิร์ฟเวอร์',
        device: 'linux',
        tasks: [
          { t: 'สร้างผู้ใช้ <code>ops1</code> พร้อม home directory และ shell เป็น bash', hint: 'sudo useradd -m -s /bin/bash ops1', check: s => !!s.users.ops1 && !!node(s, '/home/ops1') },
          { t: 'เพิ่ม <code>ops1</code> เข้ากลุ่ม <code>sudo</code>', hint: 'sudo usermod -aG sudo ops1', check: s => s.users.ops1 && s.users.ops1.groups.includes('sudo') },
          { t: 'ตรวจสอบ uid และกลุ่มของ <code>ops1</code>', hint: 'id ops1', check: (s, h) => h.some(c => /^\s*(sudo\s+)?id\b/i.test(c)) },
          { t: 'สร้างไดเรกทอรี <code>/opt/appdata</code>', hint: 'sudo mkdir /opt/appdata', check: s => !!node(s, '/opt/appdata') },
          { t: 'ตั้งสิทธิ์ <code>/opt/appdata</code> เป็น <code>750</code>', hint: 'sudo chmod 750 /opt/appdata', check: s => { const n = node(s, '/opt/appdata'); return n && n.mode === '750'; } },
          { t: 'เปลี่ยนเจ้าของ <code>/opt/appdata</code> เป็น <code>ops1</code>', hint: 'sudo chown ops1:ops1 /opt/appdata', check: s => { const n = node(s, '/opt/appdata'); return n && n.owner === 'ops1'; } },
          { t: 'เริ่มการทำงานของ service <code>nginx</code>', hint: 'sudo systemctl start nginx', check: s => s.services.nginx.active },
          { t: 'ตั้งให้ <code>nginx</code> เริ่มอัตโนมัติตอนบูต', hint: 'sudo systemctl enable nginx', check: s => s.services.nginx.enabled },
          { t: 'ตรวจสอบสถานะ <code>nginx</code>', hint: 'systemctl status nginx', check: (s, h) => h.some(c => /systemctl\s+status\s+nginx/i.test(c)) },
        ],
      }],
    },

    // =========================================================
    3: {
      title: 'เครือข่าย Firewall SSH และงานประจำ',
      objectives: [
        'ตั้งค่าและตรวจสอบเครือข่ายด้วย ip command',
        'จัดการ firewall ทั้ง ufw และ firewalld',
        'ทำ SSH hardening และใช้ key-based authentication',
        'ตั้งงานอัตโนมัติด้วย cron และจัดการ log',
      ],
      sections: [
        {
          t: 'เครือข่าย',
          h: `
<pre class="code">ip a                     <span style="color:#5b6b8c"># ดู IP ทุก interface (แทน ifconfig ที่เลิกใช้แล้ว)</span>
ip r                     <span style="color:#5b6b8c"># ดู routing table</span>
ip link set ens33 up
ip addr add 192.168.10.30/24 dev ens33    <span style="color:#5b6b8c"># ชั่วคราว หายเมื่อรีบูต</span>

ss -tulpn                <span style="color:#5b6b8c"># ดูว่ามี service อะไรเปิดพอร์ตอยู่บ้าง (แทน netstat)</span>
ping -c 4 8.8.8.8
traceroute 8.8.8.8
dig google.com           <span style="color:#5b6b8c"># ตรวจ DNS แบบละเอียด</span>
curl -I https://example.com   <span style="color:#5b6b8c"># ดูเฉพาะ HTTP header</span></pre>
<div class="note"><b>ตั้ง IP ถาวร</b> — คำสั่ง <code>ip addr add</code> หายเมื่อรีบูต ต้องแก้ที่ไฟล์ config</div>
<pre class="code"><span style="color:#5b6b8c"># Ubuntu: /etc/netplan/01-netcfg.yaml (ระวังการเว้นวรรค YAML)</span>
network:
  version: 2
  ethernets:
    ens33:
      dhcp4: false
      addresses: [192.168.10.20/24]
      routes:
        - to: default
          via: 192.168.10.1
      nameservers:
        addresses: [192.168.10.10, 8.8.8.8]

<span style="color:#5b6b8c"># แล้วสั่ง</span>
sudo netplan try      <span style="color:#5b6b8c"># ทดสอบ ถ้าไม่กด enter ยืนยันใน 120 วิ จะย้อนกลับให้ (กันหลุด)</span>
sudo netplan apply

<span style="color:#5b6b8c"># RHEL: ใช้ nmcli</span>
nmcli con mod ens33 ipv4.addresses 192.168.10.20/24 ipv4.gateway 192.168.10.1 \\
  ipv4.dns 8.8.8.8 ipv4.method manual
nmcli con up ens33</pre>`,
        },
        {
          t: 'Firewall และ SSH Hardening',
          h: `
<pre class="code"><span style="color:#5b6b8c"># --- Ubuntu: ufw ---</span>
sudo ufw allow 22/tcp
sudo ufw allow from 192.168.10.0/24 to any port 3306
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw enable
sudo ufw status verbose

<span style="color:#5b6b8c"># --- RHEL: firewalld ---</span>
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-port=8080/tcp
sudo firewall-cmd --reload
sudo firewall-cmd --list-all</pre>
<div class="note warn"><b>อนุญาต SSH ก่อนเปิด firewall เสมอ</b> — ถ้าเปิด ufw โดยยังไม่ allow 22 คุณจะหลุดจากเซิร์ฟเวอร์ทันทีและกลับเข้าไม่ได้ถ้าไม่มี console</div>
<p><b>SSH Hardening</b> — แก้ที่ <code>/etc/ssh/sshd_config</code></p>
<table class="tbl">
<tr><th>ตั้งค่า</th><th>เหตุผล</th></tr>
<tr><td><code>PermitRootLogin no</code></td><td>บังคับให้ล็อกอินด้วยบัญชีปกติแล้ว sudo — ได้ audit trail ว่าใครทำ</td></tr>
<tr><td><code>PasswordAuthentication no</code></td><td>ตัด brute force ทิ้งทั้งหมด (ต้องตั้ง key ให้เรียบร้อยก่อน!)</td></tr>
<tr><td><code>Port 2222</code></td><td>ลด noise จาก bot (ไม่ใช่ความปลอดภัยจริง แต่ log สะอาดขึ้นมาก)</td></tr>
<tr><td><code>AllowUsers ops1 admin</code></td><td>ระบุว่าใครเข้าได้บ้าง</td></tr>
<tr><td><code>MaxAuthTries 3</code></td><td>จำกัดจำนวนครั้งที่ลองต่อ connection</td></tr>
</table>
<pre class="code"><span style="color:#5b6b8c"># สร้าง key แล้วส่งไปเซิร์ฟเวอร์ (ทำจากเครื่องตัวเอง)</span>
ssh-keygen -t ed25519 -C "ops1@company"
ssh-copy-id ops1@192.168.10.20

<span style="color:#5b6b8c"># ทดสอบ config ก่อน restart เสมอ</span>
sudo sshd -t
sudo systemctl restart sshd</pre>
<div class="note"><b>เปิด session ที่สองค้างไว้เสมอ</b> ก่อน restart sshd — ถ้า config ผิดพลาด session เดิมยังใช้แก้ไขกลับได้</div>`,
        },
        {
          t: 'Cron และ Log',
          h: `
<pre class="code">crontab -e        <span style="color:#5b6b8c"># แก้ cron ของผู้ใช้ปัจจุบัน</span>
crontab -l        <span style="color:#5b6b8c"># ดูรายการ</span>
sudo crontab -e   <span style="color:#5b6b8c"># ของ root</span></pre>
<pre class="code"><span style="color:#5b6b8c"># รูปแบบ:  นาที ชั่วโมง วันที่ เดือน วันในสัปดาห์  คำสั่ง</span>
0 2 * * *      /home/student/scripts/backup.sh        <span style="color:#5b6b8c"># ทุกวันตี 2</span>
*/15 * * * *   /usr/local/bin/check-health.sh         <span style="color:#5b6b8c"># ทุก 15 นาที</span>
0 3 * * 0      /usr/bin/find /tmp -mtime +7 -delete   <span style="color:#5b6b8c"># ทุกวันอาทิตย์ตี 3</span>
@reboot        /home/student/scripts/startup.sh       <span style="color:#5b6b8c"># ตอนบูต</span></pre>
<div class="note warn"><b>สามเรื่องที่ทำให้ cron ไม่ทำงาน</b><br>
1) <b>PATH ต่างจากตอนพิมพ์เอง</b> — ใช้ absolute path เสมอ (<code>/usr/bin/find</code> ไม่ใช่ <code>find</code>)<br>
2) <b>สคริปต์ไม่มีสิทธิ์รัน</b> — ต้อง <code>chmod +x</code><br>
3) <b>ไม่รู้ว่าพัง</b> เพราะไม่ได้เก็บ output — ใส่ <code>&gt;&gt; /var/log/myjob.log 2&gt;&amp;1</code> ท้ายคำสั่งเสมอ</div>
<table class="tbl">
<tr><th>Log สำคัญ</th><th>เก็บอะไร</th></tr>
<tr><td><code>/var/log/syslog</code> (Ubuntu) / <code>/var/log/messages</code> (RHEL)</td><td>log รวมของระบบ</td></tr>
<tr><td><code>/var/log/auth.log</code> / <code>/var/log/secure</code></td><td>การล็อกอิน sudo ssh — ที่แรกที่ดูเมื่อสงสัยว่าถูกบุกรุก</td></tr>
<tr><td><code>/var/log/kern.log</code></td><td>ข้อความจาก kernel (ดิสก์เสีย, OOM killer)</td></tr>
<tr><td><code>journalctl</code></td><td>log ของ systemd ทั้งหมด</td></tr>
</table>
<div class="note"><b>logrotate</b> — ตั้งค่าที่ <code>/etc/logrotate.d/</code> เพื่อหมุนและบีบอัด log ไม่ให้ดิสก์เต็ม<br>
"ดิสก์เต็มเพราะ log" คือสาเหตุอันดับต้น ๆ ที่ทำให้เซิร์ฟเวอร์ล่มโดยไม่จำเป็น</div>`,
        },
      ],
      quiz: [
        { type: 'cmd', q: 'พิมพ์คำสั่งดู IP address ของทุก interface (คำสั่งยุคใหม่)', ans: ['ip a', 'ip addr', 'ip address', 'ip a s', 'ip addr show'], why: 'ip a มาแทน ifconfig ที่เลิกพัฒนาแล้ว — ใช้ ip r เพื่อดู routing table' },
        { type: 'cmd', q: 'พิมพ์คำสั่งดูว่ามี service ใดเปิดพอร์ตฟังอยู่บ้าง พร้อมชื่อ process', ans: ['ss -tulpn', 'ss -tulnp', 'ss -tuln', 'netstat -tulpn'], why: 't=tcp, u=udp, l=listening, p=process, n=ไม่แปลงเป็นชื่อ — เป็นคำสั่งแรกที่ใช้ตรวจว่า service เปิดพอร์ตจริงไหม' },
        { type: 'mcq', q: 'เปิด ufw โดยลืม allow พอร์ต 22 ก่อน จะเกิดอะไรขึ้น', opts: ['ufw จะเตือนและไม่ปิด SSH ให้', 'SSH session ปัจจุบันหลุดและกลับเข้าไม่ได้อีก', 'ไม่มีผลกับ SSH', 'ต้องรีบูตก่อนจึงมีผล'], a: 1, why: 'ต้อง sudo ufw allow 22/tcp ก่อน enable เสมอ — ถ้าไม่มี console อยู่ในมือ จะกู้เครื่องกลับไม่ได้เลย' },
        { type: 'mcq', q: 'ในไฟล์ sshd_config ตั้ง <code>PasswordAuthentication no</code> ควรทำอะไรก่อน', opts: ['รีบูตเครื่อง', 'ตั้ง SSH key ให้ใช้งานได้และทดสอบล็อกอินด้วย key ให้สำเร็จก่อน', 'ปิด firewall', 'เปลี่ยนพอร์ต SSH'], a: 1, why: 'ถ้าปิด password auth โดยที่ key ยังใช้ไม่ได้ = ล็อกตัวเองออกจากเครื่องอย่างถาวร' },
        { type: 'mcq', q: 'cron entry <code>*/15 * * * *</code> หมายถึงอะไร', opts: ['ทุกวันที่ 15', 'ทุก 15 นาที', 'เวลา 15:00 ทุกวัน', 'ทุก 15 ชั่วโมง'], a: 1, why: 'รูปแบบคือ นาที ชั่วโมง วันที่ เดือน วันในสัปดาห์ — */15 ในช่องนาทีคือทุก ๆ 15 นาที' },
        { type: 'multi', q: 'สาเหตุที่ cron job ไม่ทำงานทั้งที่รันเองได้ (เลือกทุกข้อที่ถูก)', opts: ['ใช้ relative path แทน absolute path', 'สคริปต์ไม่มีสิทธิ์ execute', 'cron ต้องรีบูตก่อนถึงจะอ่าน crontab ใหม่', 'ตัวแปร environment ต่างจาก shell ปกติ'], a: [0, 1, 3], why: 'cron อ่าน crontab ใหม่อัตโนมัติ ไม่ต้องรีบูต — ปัญหาเกือบทั้งหมดมาจาก PATH/environment และสิทธิ์' },
        { type: 'mcq', q: 'ไฟล์ log ใดที่ควรดูเป็นอันดับแรกเมื่อสงสัยว่ามีคนพยายามบุกรุกผ่าน SSH', opts: ['/var/log/syslog', '/var/log/auth.log', '/var/log/kern.log', '/var/log/dmesg'], a: 1, why: 'auth.log (Ubuntu) หรือ secure (RHEL) เก็บทุกการล็อกอิน sudo และ ssh รวมถึง Failed password' },
        { type: 'cmd', q: 'พิมพ์คำสั่ง ufw เพื่ออนุญาตพอร์ต 22/tcp', ans: ['ufw allow 22/tcp', 'sudo ufw allow 22/tcp', 'ufw allow 22'], why: 'ทำก่อน ufw enable เสมอ และตรวจผลด้วย ufw status verbose' },
      ],
      labs: [{
        id: 'lin-l3-net',
        title: 'Lab 3 — เครือข่ายและ Firewall',
        brief: 'เซิร์ฟเวอร์ web ตัวใหม่ต้องเปลี่ยน IP, เปิด firewall ให้ปลอดภัย และเปิดบริการเว็บ',
        device: 'linux',
        tasks: [
          { t: 'ดูการตั้งค่า IP ปัจจุบัน', hint: 'ip a', check: (s, h) => h.some(c => /^\s*ip\s+a/i.test(c)) },
          { t: 'ดู routing table', hint: 'ip r', check: (s, h) => h.some(c => /^\s*ip\s+r/i.test(c)) },
          { t: 'เพิ่ม IP <code>192.168.10.30/24</code> ให้ <code>ens33</code>', hint: 'sudo ip addr add 192.168.10.30/24 dev ens33', check: s => s.ifaces.ens33.ip === '192.168.10.30' },
          { t: 'เปลี่ยน hostname เป็น <code>web01</code>', hint: 'sudo hostnamectl set-hostname web01', check: s => s.hostname === 'web01' },
          { t: 'อนุญาตพอร์ต <code>22/tcp</code> ใน ufw (ทำก่อนเปิด firewall!)', hint: 'sudo ufw allow 22/tcp', check: s => s.ufw.rules.some(r => /22/.test(r.to) && r.action === 'allow') },
          { t: 'อนุญาตพอร์ต <code>80/tcp</code>', hint: 'sudo ufw allow 80/tcp', check: s => s.ufw.rules.some(r => /80/.test(r.to) && r.action === 'allow') },
          { t: 'เปิดใช้งาน ufw', hint: 'sudo ufw enable', check: s => s.ufw.active },
          { t: 'ตรวจสอบสถานะ firewall', hint: 'sudo ufw status', check: (s, h) => h.some(c => /ufw\s+status/i.test(c)) },
          { t: 'เริ่มและเปิดใช้งานอัตโนมัติของ <code>nginx</code>', hint: 'sudo systemctl enable nginx แล้ว sudo systemctl start nginx', check: s => s.services.nginx.active && s.services.nginx.enabled },
          { t: 'ตรวจสอบว่ามีพอร์ตใดเปิดฟังอยู่บ้าง', hint: 'ss -tulpn', check: (s, h) => h.some(c => /^\s*(sudo\s+)?(ss|netstat)/i.test(c)) },
        ],
      }],
    },

    // =========================================================
    4: {
      title: 'Storage, Performance และ Containers',
      objectives: [
        'จัดการดิสก์และ LVM ได้',
        'วิเคราะห์ปัญหาประสิทธิภาพอย่างเป็นระบบ',
        'เข้าใจ SELinux/AppArmor เบื้องต้น',
        'ใช้ container สำหรับ deploy service',
      ],
      sections: [
        {
          t: 'Storage และ LVM',
          h: `
<pre class="code">lsblk                        <span style="color:#5b6b8c"># ดูโครงสร้างดิสก์ทั้งหมด</span>
df -h                        <span style="color:#5b6b8c"># พื้นที่ที่ใช้/เหลือ</span>
df -i                        <span style="color:#5b6b8c"># inode — ดิสก์ว่างแต่เขียนไม่ได้ มักเป็นเพราะ inode หมด</span>
du -sh /var/log/*            <span style="color:#5b6b8c"># หาว่าโฟลเดอร์ไหนกินที่</span>
du -h /var | sort -rh | head -20</pre>
<p><b>LVM</b> — ทำให้ขยายพื้นที่ได้โดยไม่ต้องหยุดระบบ</p>
<pre class="code"><span style="color:#5b6b8c"># 1) เตรียมดิสก์ใหม่ให้เป็น physical volume</span>
sudo pvcreate /dev/sdb
<span style="color:#5b6b8c"># 2) เพิ่มเข้า volume group เดิม</span>
sudo vgextend vg_data /dev/sdb
<span style="color:#5b6b8c"># 3) ขยาย logical volume</span>
sudo lvextend -l +100%FREE /dev/vg_data/lv_app
<span style="color:#5b6b8c"># 4) ขยาย filesystem (สำคัญ! ขั้นตอนที่คนลืมบ่อยที่สุด)</span>
sudo resize2fs /dev/vg_data/lv_app      <span style="color:#5b6b8c"># ext4</span>
sudo xfs_growfs /mnt/app                <span style="color:#5b6b8c"># xfs</span></pre>
<pre class="code"><span style="color:#5b6b8c"># mount ถาวรใน /etc/fstab — ใช้ UUID ไม่ใช่ /dev/sdb1</span>
sudo blkid /dev/sdb1
<span style="color:#5b6b8c"># เพิ่มบรรทัดใน /etc/fstab</span>
UUID=xxxx-xxxx  /mnt/data  ext4  defaults  0 2
sudo mount -a       <span style="color:#5b6b8c"># ทดสอบก่อนรีบูตเสมอ! ถ้า fstab ผิดเครื่องจะบูตไม่ขึ้น</span></pre>
<div class="note warn"><b>ใช้ UUID เสมอใน fstab</b> — ชื่อ /dev/sdb อาจสลับกันเมื่อบูตใหม่หรือเพิ่มดิสก์ ทำให้ mount ผิดตัวหรือบูตไม่ขึ้น</div>`,
        },
        {
          t: 'วิเคราะห์ปัญหาประสิทธิภาพ',
          h: `
<p><b>ลำดับการตรวจที่ใช้ได้จริง — ไล่จาก 4 ทรัพยากรหลัก</b></p>
<table class="tbl">
<tr><th>ทรัพยากร</th><th>คำสั่ง</th><th>สัญญาณอันตราย</th></tr>
<tr><td>CPU</td><td><code>top</code>, <code>htop</code>, <code>uptime</code></td><td>load average สูงกว่าจำนวน core ต่อเนื่อง</td></tr>
<tr><td>Memory</td><td><code>free -h</code>, <code>vmstat 1</code></td><td>swap ถูกใช้เยอะและ si/so ขยับตลอด</td></tr>
<tr><td>Disk I/O</td><td><code>iostat -x 1</code>, <code>iotop</code></td><td>%util ใกล้ 100%, await สูง</td></tr>
<tr><td>Network</td><td><code>ss -s</code>, <code>iftop</code>, <code>nload</code></td><td>retransmit เยอะ, connection ค้างสถานะ</td></tr>
</table>
<pre class="code">uptime
<span style="color:#5b6b8c"># load average: 0.08, 0.12, 0.09   ← 1 นาที, 5 นาที, 15 นาที</span>
<span style="color:#5b6b8c"># เครื่อง 4 core: load 4.0 = ใช้เต็มพอดี, เกิน 8 = มีคิวรอเยอะแล้ว</span>

free -h
<span style="color:#5b6b8c"># ดูคอลัมน์ available ไม่ใช่ free — Linux ใช้ RAM ว่างทำ cache ซึ่งเป็นเรื่องปกติ</span>

ps aux --sort=-%mem | head -10     <span style="color:#5b6b8c"># 10 process ที่กิน RAM มากสุด</span>
ps aux --sort=-%cpu | head -10

dmesg -T | grep -i "out of memory"  <span style="color:#5b6b8c"># OOM killer ฆ่า process อะไรไปบ้าง</span></pre>
<div class="note"><b>อย่าตกใจที่ RAM "เต็ม"</b> — Linux ใช้ RAM ที่ว่างทำ page cache เพื่อความเร็ว ตัวเลขที่ต้องดูคือคอลัมน์ <b>available</b> ไม่ใช่ <b>free</b><br>
ตัวชี้วัดที่บอกว่า RAM ไม่พอจริงคือ <b>swap ถูกใช้หนักและมี swap in/out ตลอดเวลา</b> หรือมี OOM killer ใน dmesg</div>
<p><b>SELinux / AppArmor</b> — Mandatory Access Control ที่จำกัดว่า process แต่ละตัวแตะอะไรได้บ้าง</p>
<pre class="code">getenforce                          <span style="color:#5b6b8c"># Enforcing / Permissive / Disabled</span>
sudo ausearch -m avc -ts recent     <span style="color:#5b6b8c"># ดูว่า SELinux บล็อกอะไรไป</span>
sudo semanage port -a -t http_port_t -p tcp 8080   <span style="color:#5b6b8c"># อนุญาตให้เว็บใช้พอร์ต 8080</span>
sudo restorecon -Rv /var/www/html   <span style="color:#5b6b8c"># คืน context ให้ถูกต้อง</span></pre>
<div class="note warn"><b>อย่าปิด SELinux เพื่อแก้ปัญหา</b> — อาการ "service เริ่มได้แต่เข้าถึงไฟล์ไม่ได้" มักเป็นเรื่อง context ที่แก้ได้ด้วย <code>restorecon</code> การปิดทั้งระบบคือการทิ้งชั้นป้องกันที่ช่วยจำกัดความเสียหายเมื่อถูกเจาะ</div>`,
        },
        {
          t: 'Containers',
          h: `
<pre class="code">docker ps                       <span style="color:#5b6b8c"># container ที่กำลังทำงาน</span>
docker ps -a                    <span style="color:#5b6b8c"># รวมที่หยุดแล้ว</span>
docker images
docker logs -f myapp
docker exec -it myapp /bin/bash <span style="color:#5b6b8c"># เข้าไปข้างใน container</span>
docker stats                    <span style="color:#5b6b8c"># ดู resource ที่แต่ละตัวใช้</span>

docker run -d --name web -p 80:80 \\
  -v /var/www/html:/usr/share/nginx/html:ro \\
  --restart unless-stopped nginx:1.25-alpine</pre>
<table class="tbl">
<tr><th>แนวปฏิบัติ</th><th>เหตุผล</th></tr>
<tr><td>ระบุ tag เวอร์ชันชัดเจน ไม่ใช้ <code>latest</code></td><td>deploy ครั้งหน้าจะได้ image เดิม ไม่เจอ surprise</td></tr>
<tr><td>ใช้ volume สำหรับข้อมูลที่ต้องเก็บ</td><td>container ถูกลบเมื่อไรข้อมูลใน container หายหมด</td></tr>
<tr><td>ไม่รัน process เป็น root ใน container</td><td>ลดผลกระทบถ้า container ถูกเจาะ</td></tr>
<tr><td>ตั้ง resource limit (<code>--memory</code>, <code>--cpus</code>)</td><td>กัน container เดียวกิน resource ทั้งเครื่อง</td></tr>
<tr><td>ใช้ image ที่เล็ก (alpine/distroless)</td><td>พื้นผิวการโจมตีเล็กลง ดาวน์โหลดเร็วขึ้น</td></tr>
</table>
<pre class="code"><span style="color:#5b6b8c"># docker-compose.yml — จัดการหลาย service พร้อมกัน</span>
services:
  web:
    image: nginx:1.25-alpine
    ports: ["80:80"]
    volumes: ["./html:/usr/share/nginx/html:ro"]
    restart: unless-stopped
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_PASSWORD_FILE: /run/secrets/db_pass
    volumes: ["pgdata:/var/lib/postgresql/data"]
volumes:
  pgdata:</pre>`,
        },
      ],
      quiz: [
        { type: 'mcq', q: 'ขยาย logical volume ด้วย lvextend แล้ว df -h ยังแสดงขนาดเท่าเดิม เพราะอะไร', opts: ['ต้องรีบูตก่อน', 'ยังไม่ได้ขยาย filesystem ด้วย resize2fs หรือ xfs_growfs', 'lvextend ล้มเหลว', 'ต้องรอ 5 นาที'], a: 1, why: 'LVM ขยาย "ภาชนะ" แต่ filesystem ที่อยู่ข้างในยังเท่าเดิม ต้องขยายเป็นขั้นตอนที่สองเสมอ' },
        { type: 'mcq', q: 'ทำไมต้องใช้ UUID แทนชื่อ /dev/sdb1 ใน /etc/fstab', opts: ['เพราะสวยกว่า', 'เพราะชื่อ /dev/sdX อาจสลับกันเมื่อบูตใหม่หรือเพิ่มดิสก์ ทำให้ mount ผิดหรือบูตไม่ขึ้น', 'เพราะ UUID สั้นกว่า', 'ไม่จำเป็น'], a: 1, why: 'ลำดับการตรวจพบดิสก์ไม่รับประกัน — UUID ผูกกับ filesystem จริงจึงไม่เปลี่ยน' },
        { type: 'mcq', q: 'ค่าใดใน <code>free -h</code> ที่ควรดูเพื่อประเมินว่า RAM เหลือพอไหม', opts: ['free', 'used', 'available', 'shared'], a: 2, why: 'Linux ใช้ RAM ว่างทำ page cache ทำให้ free ดูน้อยเสมอ — available คือค่าที่บอกว่าแอปใหม่ยังขอ RAM ได้เท่าไร' },
        { type: 'mcq', q: 'เครื่อง 4 core มี load average 12.0 ต่อเนื่อง หมายความว่าอย่างไร', opts: ['ปกติดี', 'มีงานรออยู่ในคิวมากกว่าที่ CPU รับไหวราว 3 เท่า', 'CPU เสีย', 'RAM เต็ม'], a: 1, why: 'load average เทียบกับจำนวน core — 4 core ที่ load 4.0 คือใช้เต็มพอดี ที่ 12.0 คือมีคิวยาวมาก (อาจเกิดจาก I/O wait ก็ได้)' },
        { type: 'multi', q: 'แนวปฏิบัติที่ดีในการใช้ container (เลือกทุกข้อที่ถูก)', opts: ['ระบุ tag เวอร์ชันแทนการใช้ latest', 'ใช้ volume สำหรับข้อมูลที่ต้องคงอยู่', 'รัน process เป็น root เพื่อความสะดวก', 'ตั้ง resource limit'], a: [0, 1, 3], why: 'การรันเป็น root ใน container เพิ่มความเสี่ยงอย่างมากหากมีช่องโหว่ที่หลุดออกจาก container ได้' },
        { type: 'mcq', q: 'บนระบบ RHEL service เริ่มได้แต่เข้าถึงไฟล์ไม่ได้ ทั้งที่สิทธิ์ไฟล์ถูกต้อง ควรตรวจอะไร', opts: ['รีบูตเครื่อง', 'ตรวจ SELinux context ด้วย ausearch และแก้ด้วย restorecon', 'ปิด SELinux ถาวร', 'เปลี่ยนเป็น chmod 777'], a: 1, why: 'SELinux บล็อกตาม context ไม่ใช่ตาม permission ปกติ — restorecon คืน context ที่ถูกต้องให้ ส่วนการปิด SELinux คือการทิ้งชั้นป้องกันทั้งชั้น' },
        { type: 'cmd', q: 'พิมพ์คำสั่งดูโครงสร้างดิสก์และ partition ทั้งหมด', ans: ['lsblk', 'lsblk -f'], why: 'lsblk แสดง block device ทั้งหมดเป็นโครงสร้างต้นไม้ พร้อม mountpoint — ใช้คู่กับ df -h เพื่อดูพื้นที่ที่ใช้จริง' },
        { type: 'mcq', q: '<code>df -h</code> บอกว่ายังมีพื้นที่เหลือ แต่เขียนไฟล์ไม่ได้ สาเหตุที่เป็นไปได้มากที่สุดคือ', opts: ['ดิสก์เสีย', 'inode หมด — ตรวจด้วย df -i', 'filesystem read-only เพราะ RAM เต็ม', 'ต้องรีบูต'], a: 1, why: 'inode คือจำนวน "ช่อง" สำหรับไฟล์ ถ้ามีไฟล์เล็ก ๆ จำนวนมหาศาล inode จะหมดก่อนพื้นที่ — ตรวจด้วย df -i' },
      ],
      labs: [{
        id: 'lin-l4-ops',
        title: 'Lab 4 — ตรวจสุขภาพระบบและจัดพื้นที่',
        brief: 'เซิร์ฟเวอร์แจ้งเตือนว่าพื้นที่ใกล้เต็มและช้าผิดปกติ ให้ตรวจสอบตามลำดับและจัดการ',
        device: 'linux',
        tasks: [
          { t: 'ตรวจสอบพื้นที่ดิสก์', hint: 'df -h', check: (s, h) => h.some(c => /^\s*(sudo\s+)?df/i.test(c)) },
          { t: 'ตรวจสอบโครงสร้างดิสก์', hint: 'lsblk', check: (s, h) => h.some(c => /^\s*(sudo\s+)?lsblk/i.test(c)) },
          { t: 'ตรวจสอบหน่วยความจำ', hint: 'free -h', check: (s, h) => h.some(c => /^\s*(sudo\s+)?free/i.test(c)) },
          { t: 'ตรวจสอบ load average', hint: 'uptime', check: (s, h) => h.some(c => /^\s*uptime/i.test(c)) },
          { t: 'ดู process ที่กำลังทำงาน', hint: 'ps aux', check: (s, h) => h.some(c => /^\s*(sudo\s+)?ps\s/i.test(c)) },
          { t: 'หาว่าโฟลเดอร์ใดใน <code>/var/log</code> กินพื้นที่', hint: 'du -sh /var/log', check: (s, h) => h.some(c => /^\s*(sudo\s+)?du/i.test(c)) },
          { t: 'สร้างไดเรกทอรีสำรอง <code>/backup/www</code>', hint: 'sudo mkdir -p /backup/www', check: s => !!node(s, '/backup/www') },
          { t: 'คัดลอก <code>/var/www/html/index.html</code> ไปที่ <code>/backup/www</code>', hint: 'sudo cp /var/www/html/index.html /backup/www/', check: s => !!node(s, '/backup/www/index.html') },
          { t: 'ตรวจสอบ log ของ kernel/ระบบผ่าน journalctl', hint: 'journalctl -p err', check: (s, h) => h.some(c => /journalctl/i.test(c)) },
          { t: 'เขียนรายงานสรุปลง <code>/backup/www/report.txt</code>', hint: 'df -h > /backup/www/report.txt', check: s => { const f = node(s, '/backup/www/report.txt'); return f && f.content.length > 0; } },
        ],
      }],
    },

    // =========================================================
    5: {
      title: 'Hardening, Automation และ Observability',
      objectives: [
        'ทำ security hardening ตามมาตรฐาน CIS Benchmark',
        'ทำ automation ด้วย Ansible และ Infrastructure as Code',
        'วางระบบ monitoring และ centralized logging',
        'ออกแบบ HA และ disaster recovery',
      ],
      sections: [
        {
          t: 'Security Hardening',
          h: `
<table class="tbl">
<tr><th>ด้าน</th><th>สิ่งที่ต้องทำ</th></tr>
<tr><td>บัญชีผู้ใช้</td><td>ปิด root login, บังคับ SSH key, ตั้ง password policy, ลบบัญชีที่ไม่ใช้</td></tr>
<tr><td>เครือข่าย</td><td>firewall default deny, ปิดพอร์ตที่ไม่ใช้, ใช้ fail2ban กัน brute force</td></tr>
<tr><td>ระบบไฟล์</td><td>mount /tmp ด้วย <code>noexec,nosuid,nodev</code>, ตรวจไฟล์ SUID ที่ผิดปกติ</td></tr>
<tr><td>Kernel</td><td>ตั้งค่า sysctl ป้องกัน IP spoofing, ปิด IP forwarding ถ้าไม่ใช่ router</td></tr>
<tr><td>Audit</td><td>เปิด auditd, ส่ง log ออกไปเก็บนอกเครื่อง</td></tr>
<tr><td>Patch</td><td>เปิด unattended-upgrades สำหรับ security update</td></tr>
</table>
<pre class="code"><span style="color:#5b6b8c"># --- sysctl hardening: /etc/sysctl.d/99-hardening.conf ---</span>
net.ipv4.conf.all.rp_filter = 1               <span style="color:#5b6b8c"># กัน IP spoofing</span>
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.all.accept_source_route = 0
net.ipv4.tcp_syncookies = 1                   <span style="color:#5b6b8c"># กัน SYN flood</span>
net.ipv4.icmp_echo_ignore_broadcasts = 1
kernel.randomize_va_space = 2                 <span style="color:#5b6b8c"># ASLR</span>
fs.suid_dumpable = 0
<span style="color:#5b6b8c"># แล้วสั่ง</span>
sudo sysctl --system

<span style="color:#5b6b8c"># --- fail2ban: แบน IP ที่ล็อกอินผิดซ้ำ ๆ ---</span>
sudo apt install fail2ban
<span style="color:#5b6b8c"># /etc/fail2ban/jail.local</span>
[sshd]
enabled = true
maxretry = 3
bantime = 3600
findtime = 600

<span style="color:#5b6b8c"># --- ตรวจไฟล์ SUID ที่ไม่ควรมี ---</span>
sudo find / -perm -4000 -type f 2&gt;/dev/null</pre>
<div class="note"><b>CIS Benchmark</b> คือชุดมาตรฐาน hardening ที่ตรวจสอบได้จริง มีเครื่องมือช่วยสแกน เช่น <code>lynis audit system</code> หรือ OpenSCAP — ควรสแกนก่อนส่งมอบเซิร์ฟเวอร์ทุกตัว</div>`,
        },
        {
          t: 'Automation ด้วย Ansible',
          h: `
<p>เมื่อมีเซิร์ฟเวอร์เกิน 5 ตัว การ SSH เข้าไปแก้ทีละเครื่องคือการสร้าง configuration drift — Ansible แก้ปัญหานี้ด้วยการประกาศสถานะที่ต้องการ (declarative) และไม่ต้องลง agent</p>
<pre class="code"><span style="color:#5b6b8c"># inventory.ini</span>
[webservers]
web01 ansible_host=192.168.10.21
web02 ansible_host=192.168.10.22

[dbservers]
db01 ansible_host=192.168.10.31</pre>
<pre class="code"><span style="color:#5b6b8c"># playbook.yml</span>
- name: ตั้งค่า web server ให้เป็นมาตรฐานเดียวกัน
  hosts: webservers
  become: yes
  tasks:
    - name: ติดตั้ง nginx
      apt: { name: nginx, state: present, update_cache: yes }

    - name: วางไฟล์ config จาก template
      template:
        src: nginx.conf.j2
        dest: /etc/nginx/nginx.conf
        owner: root
        mode: '0644'
      notify: reload nginx

    - name: เปิด service และให้เริ่มตอนบูต
      systemd: { name: nginx, state: started, enabled: yes }

    - name: เปิดพอร์ต firewall
      ufw: { rule: allow, port: '80', proto: tcp }

  handlers:
    - name: reload nginx
      systemd: { name: nginx, state: reloaded }</pre>
<pre class="code">ansible-playbook -i inventory.ini playbook.yml --check    <span style="color:#5b6b8c"># dry run ดูว่าจะเปลี่ยนอะไร</span>
ansible-playbook -i inventory.ini playbook.yml
ansible webservers -i inventory.ini -m shell -a "uptime"  <span style="color:#5b6b8c"># สั่งงานเฉพาะกิจ</span></pre>
<div class="note"><b>Idempotency</b> — หัวใจของ Ansible คือรัน playbook เดิมซ้ำกี่ครั้งก็ได้ผลเหมือนเดิม ไม่สร้างของซ้ำ ทำให้ playbook กลายเป็น "เอกสารที่รันได้" ที่บอกว่าเซิร์ฟเวอร์ควรมีหน้าตาอย่างไร<br>
เก็บทุกอย่างใน <b>Git</b> แล้วคุณจะมี history ว่าใครเปลี่ยนอะไรเมื่อไร และย้อนกลับได้</div>`,
        },
        {
          t: 'Observability และ HA',
          h: `
<table class="tbl">
<tr><th>เสาหลัก</th><th>ตอบคำถาม</th><th>เครื่องมือ</th></tr>
<tr><td><b>Metrics</b></td><td>ระบบเป็นอย่างไรตอนนี้</td><td>Prometheus + Grafana, Zabbix</td></tr>
<tr><td><b>Logs</b></td><td>เกิดอะไรขึ้นตอนนั้น</td><td>Loki, ELK/Elastic, Graylog</td></tr>
<tr><td><b>Traces</b></td><td>request ช้าที่ขั้นตอนไหน</td><td>Jaeger, Tempo, OpenTelemetry</td></tr>
</table>
<pre class="code"><span style="color:#5b6b8c"># node_exporter — ส่ง metric ของเครื่องเข้า Prometheus</span>
sudo useradd -rs /bin/false node_exporter
sudo systemctl enable --now node_exporter
curl http://localhost:9100/metrics | head</pre>
<div class="note warn"><b>ตั้ง alert ให้น้อยแต่มีความหมาย</b> — ถ้าทีมได้ alert วันละ 200 ครั้ง จะไม่มีใครอ่านอีกต่อไป (alert fatigue) และ alert ที่สำคัญจริงจะถูกกลบไปด้วย<br>
เกณฑ์ง่าย ๆ: alert ทุกอันต้องมีคนต้องลุกขึ้นมาทำอะไรบางอย่าง ถ้าไม่มี ให้เป็น dashboard พอ</div>
<p><b>ตัวชี้วัดที่ควรมี alert จริง ๆ:</b> ดิสก์เหลือ &lt; 15% · service หลักตาย · certificate ใกล้หมดอายุ · backup ล้มเหลว · error rate ของ application พุ่ง · latency p95 เกินเป้า</p>
<table class="tbl">
<tr><th>เทคโนโลยี HA</th><th>ใช้กับ</th></tr>
<tr><td>Keepalived (VRRP)</td><td>Virtual IP ที่ย้ายไปเครื่องสำรองอัตโนมัติ</td></tr>
<tr><td>HAProxy / Nginx</td><td>Load balance ไปยัง backend หลายตัว พร้อม health check</td></tr>
<tr><td>Pacemaker + Corosync</td><td>Cluster resource manager เต็มรูปแบบ</td></tr>
<tr><td>DRBD / GlusterFS / Ceph</td><td>ทำให้ storage มีสำเนาหลายที่</td></tr>
<tr><td>Kubernetes</td><td>จัดการ container ให้ self-heal และ scale เอง</td></tr>
</table>
<div class="note"><b>DR ที่ทดสอบแล้วเท่านั้นที่นับ</b><br>
กำหนด <b>RPO</b> (ยอมเสียข้อมูลย้อนหลังได้กี่นาที) และ <b>RTO</b> (ยอมให้ล่มได้กี่นาที) ให้ชัด แล้วซ้อมกู้จริงอย่างน้อยปีละครั้ง พร้อมจับเวลาว่าทำได้ตาม RTO หรือไม่</div>`,
        },
      ],
      quiz: [
        { type: 'mcq', q: 'Idempotency ใน Ansible หมายถึงอะไร', opts: ['รันได้เร็วมาก', 'รัน playbook เดิมซ้ำกี่ครั้งก็ได้ผลลัพธ์เหมือนเดิม ไม่สร้างของซ้ำ', 'ทำงานแบบขนาน', 'ไม่ต้องใช้ SSH'], a: 1, why: 'ทำให้ playbook กลายเป็นเอกสารที่รันได้ ซึ่งบอกว่าเซิร์ฟเวอร์ควรมีหน้าตาอย่างไร และรันซ้ำเพื่อแก้ configuration drift ได้เสมอ' },
        { type: 'mcq', q: 'ควร mount <code>/tmp</code> ด้วยตัวเลือกใดเพื่อความปลอดภัย', opts: ['rw,exec', 'noexec,nosuid,nodev', 'ro', 'defaults'], a: 1, why: 'noexec ห้ามรันไฟล์ใน /tmp (ที่ใครก็เขียนได้), nosuid ปิด SUID bit, nodev ห้ามสร้าง device file — ตัดเส้นทางยกระดับสิทธิ์ที่พบบ่อย' },
        { type: 'mcq', q: 'fail2ban ทำงานอย่างไร', opts: ['บล็อกทุก IP ที่ไม่รู้จัก', 'อ่าน log หาการล็อกอินล้มเหลวซ้ำ ๆ แล้วเพิ่มกฎ firewall แบน IP นั้นชั่วคราว', 'เข้ารหัส SSH', 'สแกนหาไวรัส'], a: 1, why: 'ทำงานร่วมกับ log และ firewall ปรับ maxretry/bantime/findtime ได้ตามความเหมาะสม' },
        { type: 'multi', q: 'สามเสาหลักของ Observability คืออะไร (เลือกทุกข้อที่ถูก)', opts: ['Metrics', 'Logs', 'Traces', 'Backups'], a: [0, 1, 2], why: 'Backup สำคัญมากแต่เป็นเรื่อง data protection ไม่ใช่ observability' },
        { type: 'mcq', q: 'Alert fatigue คือปัญหาอะไร และแก้อย่างไร', opts: ['ระบบส่ง alert ช้า แก้ด้วยการเพิ่ม server', 'alert เยอะเกินจนไม่มีใครอ่าน แก้ด้วยการ alert เฉพาะสิ่งที่ต้องมีคนลงมือทำจริง', 'alert หายไป แก้ด้วยการเพิ่ม log', 'ไม่ใช่ปัญหา'], a: 1, why: 'สิ่งที่แค่ "น่ารู้" ควรอยู่บน dashboard ไม่ใช่ส่งเข้าโทรศัพท์ตอนตีสาม' },
        { type: 'mcq', q: 'RPO และ RTO ต่างกันอย่างไร', opts: ['เหมือนกัน', 'RPO = ยอมเสียข้อมูลย้อนหลังได้แค่ไหน, RTO = ยอมให้ระบบล่มได้นานแค่ไหน', 'RPO เป็นของ Windows RTO เป็นของ Linux', 'RPO คือความเร็ว backup'], a: 1, why: 'RPO กำหนดความถี่ของ backup ส่วน RTO กำหนดว่าต้องลงทุนกับ HA มากแค่ไหน — ตัวเลขทั้งสองมาจากธุรกิจ ไม่ใช่จากทีม IT' },
        { type: 'multi', q: 'ข้อใดควรมี alert แบบปลุกคน (เลือกทุกข้อที่ถูก)', opts: ['ดิสก์เหลือน้อยกว่า 15%', 'service หลักตาย', 'CPU ขึ้นถึง 60% ครั้งเดียว', 'backup ล้มเหลว'], a: [0, 1, 3], why: 'CPU พุ่งชั่วครู่เป็นเรื่องปกติของระบบที่ทำงาน — ควรดูใน dashboard หรือตั้ง alert เฉพาะเมื่อสูงต่อเนื่องนาน' },
        { type: 'mcq', q: 'เครื่องมือใดใช้สแกนความปลอดภัยของ Linux ตามมาตรฐาน CIS', opts: ['htop', 'lynis หรือ OpenSCAP', 'netstat', 'rsync'], a: 1, why: 'ทั้งสองสแกนระบบเทียบกับ benchmark และให้รายงานพร้อมคำแนะนำ ควรรันก่อนส่งมอบเซิร์ฟเวอร์ทุกตัว' },
      ],
      labs: [{
        id: 'lin-l5-harden',
        title: 'Lab 5 — Hardening เซิร์ฟเวอร์ก่อนขึ้น Production',
        brief: 'เซิร์ฟเวอร์กำลังจะเปิดให้เข้าถึงจากอินเทอร์เน็ต ทำ hardening ตาม baseline ขององค์กรก่อนส่งมอบ',
        device: 'linux',
        tasks: [
          { t: 'เปลี่ยน hostname เป็น <code>prod-web01</code>', hint: 'sudo hostnamectl set-hostname prod-web01', check: s => s.hostname === 'prod-web01' },
          { t: 'สร้างผู้ใช้สำหรับดูแลระบบ <code>sysops</code> พร้อม home', hint: 'sudo useradd -m -s /bin/bash sysops', check: s => !!s.users.sysops },
          { t: 'เพิ่ม <code>sysops</code> เข้ากลุ่ม <code>sudo</code>', hint: 'sudo usermod -aG sudo sysops', check: s => s.users.sysops && s.users.sysops.groups.includes('sudo') },
          { t: 'ตั้ง default policy ของ ufw เป็น deny incoming', hint: 'sudo ufw default deny incoming', check: (s, h) => h.some(c => /ufw\s+default\s+deny/i.test(c)) },
          { t: 'อนุญาต SSH (22/tcp) ก่อนเปิด firewall', hint: 'sudo ufw allow 22/tcp', check: s => s.ufw.rules.some(r => /22/.test(r.to)) },
          { t: 'อนุญาต HTTPS (443/tcp)', hint: 'sudo ufw allow 443/tcp', check: s => s.ufw.rules.some(r => /443/.test(r.to)) },
          { t: 'เปิดใช้งาน ufw', hint: 'sudo ufw enable', check: s => s.ufw.active },
          { t: 'สร้างไดเรกทอรี <code>/etc/sysctl.d</code> และไฟล์ <code>99-hardening.conf</code>', hint: 'sudo mkdir -p /etc/sysctl.d แล้ว echo "net.ipv4.tcp_syncookies = 1" > /etc/sysctl.d/99-hardening.conf', check: s => { const f = node(s, '/etc/sysctl.d/99-hardening.conf'); return f && f.content.length > 0; } },
          { t: 'ตรวจสอบว่ามีพอร์ตใดเปิดฟังอยู่บ้าง', hint: 'sudo ss -tulpn', check: (s, h) => h.some(c => /\bss\b|netstat/i.test(c)) },
          { t: 'ตรวจสอบการล็อกอินที่ล้มเหลวใน auth.log', hint: 'grep "Failed password" /var/log/auth.log', check: (s, h) => h.some(c => /grep.*auth\.log/i.test(c)) },
          { t: 'เปิดใช้งาน <code>fail2ban</code> และตั้งให้เริ่มอัตโนมัติตอนบูต', hint: 'sudo systemctl start fail2ban → sudo systemctl enable fail2ban', check: s => s.services.fail2ban.active && s.services.fail2ban.enabled },
        ],
      }],
    },
  },
};
