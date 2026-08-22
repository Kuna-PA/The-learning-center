export default {
  id: 'windows-server',
  name: 'Windows Server',
  icon: '🪟',
  device: 'windows',
  sub: 'Server 2019 / 2022 + PowerShell',
  desc: 'ตั้งแต่การติดตั้ง Role, Active Directory, DNS/DHCP, Group Policy, File Server ไปจนถึง HA, Hyper-V และการออกแบบ AD ระดับองค์กร',

  levels: {
    // =========================================================
    1: {
      title: 'พื้นฐาน Windows Server และ PowerShell',
      objectives: [
        'แยก edition และ installation option ของ Windows Server ได้',
        'เข้าใจความต่างระหว่าง Role และ Feature',
        'ใช้ PowerShell ตั้งค่าเครือข่ายและดูสถานะระบบได้',
        'ตั้งชื่อเครื่อง, ตั้ง IP static และตรวจสอบ service',
      ],
      sections: [
        {
          t: 'Edition, Installation Option และ Role vs Feature',
          h: `
<table class="tbl">
<tr><th>Edition</th><th>ใช้ทำอะไร</th><th>สิทธิ์ virtualization</th></tr>
<tr><td><b>Standard</b></td><td>งานทั่วไป ไฟล์เซิร์ฟเวอร์ AD DC</td><td>2 VM ต่อ license</td></tr>
<tr><td><b>Datacenter</b></td><td>ศูนย์ข้อมูลที่ virtualize หนัก</td><td>ไม่จำกัด VM + Storage Spaces Direct</td></tr>
<tr><td><b>Essentials</b></td><td>ธุรกิจเล็ก ≤25 users</td><td>จำกัด</td></tr>
</table>
<table class="tbl">
<tr><th>Installation Option</th><th>มี GUI</th><th>เหมาะกับ</th></tr>
<tr><td>Desktop Experience</td><td>✔</td><td>เครื่องที่ต้องใช้เครื่องมือ GUI บ่อย</td></tr>
<tr><td>Server Core</td><td>✘ (มีแต่ CLI)</td><td><b>แนะนำ</b> — พื้นที่น้อยกว่า patch น้อยกว่า พื้นผิวการโจมตีเล็กกว่า</td></tr>
</table>
<div class="note"><b>Role vs Feature</b><br>
<b>Role</b> = หน้าที่หลักของเซิร์ฟเวอร์ เช่น AD DS, DNS, DHCP, IIS, Hyper-V<br>
<b>Feature</b> = ส่วนเสริมที่ช่วยให้ role ทำงานหรือใช้บริหารจัดการ เช่น .NET Framework, RSAT, Failover Clustering, Windows Server Backup</div>
<pre class="code">Get-WindowsFeature                                  <span style="color:#5b6b8c"># ดูทั้งหมด</span>
Get-WindowsFeature -Name AD*                        <span style="color:#5b6b8c"># กรองด้วย wildcard</span>
Install-WindowsFeature -Name DNS -IncludeManagementTools
Uninstall-WindowsFeature -Name Web-Server</pre>
<div class="note warn">อย่าลืม <code>-IncludeManagementTools</code> ไม่งั้นติดตั้ง role ได้แต่ไม่มีเครื่องมือ (console/PowerShell module) ไว้จัดการ ซึ่งเป็นสาเหตุที่ <code>Get-ADUser</code> ใช้ไม่ได้บ่อย ๆ</div>`,
        },
        {
          t: 'PowerShell — สิ่งที่ต้องรู้ตั้งแต่วันแรก',
          h: `
<p>PowerShell ใช้รูปแบบ <b>Verb-Noun</b> เสมอ ทำให้เดาคำสั่งได้แม้ไม่เคยเห็น</p>
<table class="tbl">
<tr><th>Verb</th><th>ความหมาย</th><th>ตัวอย่าง</th></tr>
<tr><td><code>Get-</code></td><td>อ่านข้อมูล (ปลอดภัย ไม่เปลี่ยนแปลงอะไร)</td><td><code>Get-Service</code>, <code>Get-ADUser</code></td></tr>
<tr><td><code>Set-</code></td><td>แก้ค่าที่มีอยู่</td><td><code>Set-Service</code>, <code>Set-ADUser</code></td></tr>
<tr><td><code>New-</code></td><td>สร้างใหม่</td><td><code>New-ADUser</code>, <code>New-SmbShare</code></td></tr>
<tr><td><code>Remove-</code></td><td>ลบ</td><td><code>Remove-Item</code></td></tr>
<tr><td><code>Start-/Stop-/Restart-</code></td><td>ควบคุมสถานะ</td><td><code>Restart-Service</code></td></tr>
<tr><td><code>Test-</code></td><td>ทดสอบ</td><td><code>Test-NetConnection</code></td></tr>
</table>
<pre class="code">Get-Service                          <span style="color:#5b6b8c"># ดู service ทั้งหมด</span>
Get-Service -Name Spooler            <span style="color:#5b6b8c"># เจาะจงตัวเดียว</span>
Restart-Service -Name Spooler
Get-Process | Sort-Object CPU -Descending | Select-Object -First 5
Get-Help Get-Service -Examples       <span style="color:#5b6b8c"># วิธีเรียนคำสั่งที่ไม่รู้จัก</span></pre>
<div class="note"><b>ทางลัดที่ควรจำ</b><br>
กด <b>Tab</b> เพื่อเติมชื่อคำสั่งและพารามิเตอร์อัตโนมัติ · <code>Get-Command *ADUser*</code> เพื่อค้นคำสั่ง · <code>| Format-List *</code> เพื่อดูทุก property ของผลลัพธ์</div>`,
        },
        {
          t: 'ตั้งชื่อเครื่องและเครือข่าย',
          h: `
<pre class="code"><span style="color:#5b6b8c"># ดูการตั้งค่าเครือข่ายปัจจุบัน</span>
Get-NetIPConfiguration
Get-NetIPAddress
ipconfig /all

<span style="color:#5b6b8c"># ตั้ง IP แบบ static</span>
New-NetIPAddress -InterfaceAlias Ethernet0 -IPAddress 192.168.10.10 \`
  -PrefixLength 24 -DefaultGateway 192.168.10.1

<span style="color:#5b6b8c"># ตั้ง DNS server</span>
Set-DnsClientServerAddress -InterfaceAlias Ethernet0 -ServerAddresses 192.168.10.10,8.8.8.8

<span style="color:#5b6b8c"># ตั้งชื่อเครื่อง (ต้อง restart)</span>
Rename-Computer -NewName SRV-DC01 -Restart

<span style="color:#5b6b8c"># ทดสอบการเชื่อมต่อ — ดีกว่า ping เพราะทดสอบพอร์ตได้</span>
Test-NetConnection 8.8.8.8
Test-NetConnection -ComputerName srv-file01 -Port 445</pre>
<div class="note warn"><b>กฎเหล็กสำหรับ Domain Controller</b><br>
DC ต้องใช้ <b>IP แบบ static เสมอ</b> และ DNS ของตัวเองต้องชี้ไปที่ <b>ตัวเอง</b> (หรือ DC ตัวอื่นในโดเมน) — ห้ามชี้ไปที่ 8.8.8.8 เป็นตัวแรก มิฉะนั้น domain จะพังทั้งระบบเพราะหา SRV record ไม่เจอ</div>`,
        },
        {
          t: 'คำสั่ง cmd พื้นฐานที่ IT ต้องใช้ทุกวัน',
          h: `
<p>ถึงจะมี PowerShell แล้ว แต่คำสั่ง cmd ดั้งเดิมยังเป็นเครื่องมือแรกที่ทุกคนหยิบมาใช้เวลาไปหน้าเครื่องผู้ใช้
เพราะพิมพ์สั้น จำง่าย และมีอยู่ในทุกเครื่อง Windows ตั้งแต่ XP จนถึงปัจจุบัน</p>

<h4 style="margin:14px 0 6px">🌐 กลุ่มเครือข่าย — ใช้บ่อยที่สุด</h4>
<table class="tbl">
<tr><th>คำสั่ง</th><th>ใช้ทำอะไร</th><th>ดูอะไรจากผลลัพธ์</th></tr>
<tr><td><code>ipconfig</code></td><td>ดู IP ปัจจุบันแบบย่อ</td><td>IPv4, Subnet Mask, Default Gateway</td></tr>
<tr><td><code>ipconfig /all</code></td><td>ดูละเอียดทั้งหมด</td><td>MAC address, DHCP เปิดไหม, DNS servers, DHCP server ที่แจก</td></tr>
<tr><td><code>ipconfig /release</code></td><td>คืน IP ที่ได้จาก DHCP</td><td>IP จะกลายเป็น 0.0.0.0</td></tr>
<tr><td><code>ipconfig /renew</code></td><td>ขอ IP ใหม่จาก DHCP</td><td>ได้ IP ใหม่ — ถ้าไม่ได้แปลว่า DHCP มีปัญหา</td></tr>
<tr><td><code>ipconfig /flushdns</code></td><td>ล้าง DNS cache ในเครื่อง</td><td>ใช้เมื่อเว็บย้าย IP แล้วเครื่องยังจำของเก่า</td></tr>
<tr><td><code>ipconfig /displaydns</code></td><td>ดูว่าเครื่องจำชื่อไหนไว้บ้าง</td><td>ตรวจว่าจำ IP ผิดอยู่หรือเปล่า</td></tr>
<tr><td><code>ping</code></td><td>ทดสอบว่าปลายทางตอบไหม</td><td>Reply = ถึง · Request timed out = ไม่ถึง/โดนบล็อก · Destination host unreachable = ไม่มีเส้นทาง</td></tr>
<tr><td><code>tracert</code></td><td>ดูว่า packet วิ่งผ่านที่ไหนบ้าง</td><td>หยุดที่ hop ไหน = ปัญหาอยู่แถวนั้น</td></tr>
<tr><td><code>pathping</code></td><td>tracert + สถิติ packet loss</td><td>หา hop ที่ packet หายระหว่างทาง</td></tr>
<tr><td><code>nslookup</code></td><td>ถาม DNS ตรง ๆ</td><td>ชื่อนี้แปลงเป็น IP อะไร ใครตอบ</td></tr>
<tr><td><code>netstat -ano</code></td><td>ดูพอร์ตและ connection พร้อม PID</td><td>ใครเปิดพอร์ตอะไร ต่อไปที่ไหน</td></tr>
<tr><td><code>route print</code></td><td>ดูตาราง routing ของเครื่อง</td><td>Default gateway ถูกไหม มี route แปลกปลอมไหม</td></tr>
<tr><td><code>arp -a</code></td><td>ดู MAC ที่จับคู่กับ IP</td><td>ตรวจ IP ชนกัน / ARP spoofing</td></tr>
<tr><td><code>getmac</code></td><td>ดู MAC ของเครื่องตัวเอง</td><td>ใช้ตอนขอจอง IP หรือลงทะเบียนอุปกรณ์</td></tr>
</table>

<h4 style="margin:16px 0 6px">🖥️ กลุ่มระบบและ process</h4>
<table class="tbl">
<tr><th>คำสั่ง</th><th>ใช้ทำอะไร</th></tr>
<tr><td><code>systeminfo</code></td><td>สรุปสเปกเครื่อง OS build โดเมน RAM และ hotfix ที่ลง</td></tr>
<tr><td><code>hostname</code></td><td>ดูชื่อเครื่อง</td></tr>
<tr><td><code>whoami</code></td><td>ตอนนี้เราเป็นใคร (โดเมน\\ผู้ใช้)</td></tr>
<tr><td><code>tasklist</code></td><td>ดู process ทั้งหมดพร้อม PID และ RAM ที่ใช้</td></tr>
<tr><td><code>taskkill /PID 1234</code> หรือ <code>/IM app.exe</code></td><td>ปิด process ที่ค้าง</td></tr>
<tr><td><code>sc query &lt;service&gt;</code></td><td>ดูสถานะ service (คู่กับ <code>sc start</code> / <code>sc stop</code>)</td></tr>
<tr><td><code>schtasks /query</code></td><td>ดู scheduled task ที่ตั้งไว้</td></tr>
<tr><td><code>gpupdate /force</code> · <code>gpresult /r</code></td><td>ดึง Group Policy ใหม่ / ดูว่า policy ไหนถูก apply</td></tr>
<tr><td><code>sfc /scannow</code> · <code>chkdsk</code></td><td>ตรวจซ่อมไฟล์ระบบ / ตรวจดิสก์</td></tr>
<tr><td><code>driverquery</code> · <code>wmic</code></td><td>ดูไดรเวอร์ / ดึงข้อมูลระบบแบบเจาะจง</td></tr>
</table>

<h4 style="margin:16px 0 6px">⚙️ netsh — มีดพับสวิสของงานเครือข่ายบน Windows</h4>
<pre class="code"><span style="color:#5b6b8c">:: ดูการตั้งค่า IP ทุกการ์ด</span>
netsh interface ip show config

<span style="color:#5b6b8c">:: ตั้ง IP แบบ static</span>
netsh interface ip set address "Ethernet0" static 192.168.10.10 255.255.255.0 192.168.10.1

<span style="color:#5b6b8c">:: เปลี่ยนกลับเป็นรับ IP อัตโนมัติ</span>
netsh interface ip set address "Ethernet0" dhcp

<span style="color:#5b6b8c">:: ตั้ง DNS</span>
netsh interface ip set dns "Ethernet0" static 192.168.10.5

<span style="color:#5b6b8c">:: งาน Wi-Fi ที่ helpdesk ใช้บ่อย</span>
netsh wlan show profiles
netsh wlan show interfaces
netsh wlan delete profile name="CORP-WIFI"

<span style="color:#5b6b8c">:: เปิดพอร์ตใน firewall</span>
netsh advfirewall firewall add rule name="Allow-HTTP" dir=in action=allow protocol=TCP localport=80

<span style="color:#5b6b8c">:: กู้เครือข่ายที่พังแบบหาสาเหตุไม่เจอ (ต้องรีสตาร์ทหลังทำ)</span>
netsh winsock reset</pre>
<div class="note"><b>เทคนิคของช่าง:</b> เมื่อเจอเครื่องที่ "ต่อเน็ตไม่ได้แบบหาสาเหตุไม่เจอ" ลำดับที่ได้ผลบ่อยคือ
<code>ipconfig /release</code> → <code>ipconfig /flushdns</code> → <code>ipconfig /renew</code> → ถ้ายังไม่หาย ค่อย <code>netsh winsock reset</code> แล้วรีสตาร์ท</div>`,
        },
        {
          t: 'ไล่ปัญหาเครือข่ายด้วย cmd ทีละขั้น',
          h: `
<p>เมื่อผู้ใช้บอกว่า "เน็ตใช้ไม่ได้" อย่าเพิ่งเดา ให้ไล่จากใกล้ตัวออกไปไกลทีละขั้น
แต่ละขั้นที่ผ่านจะตัดสาเหตุออกไปได้เป็นกลุ่ม</p>
<table class="tbl">
<tr><th>ขั้น</th><th>คำสั่ง</th><th>ถ้าผ่านแปลว่า</th><th>ถ้าไม่ผ่านให้ดู</th></tr>
<tr><td>1. การ์ดเครือข่าย</td><td><code>ipconfig</code></td><td>ได้ IP มาแล้ว</td><td>IP ขึ้นต้น <b>169.254.x.x</b> = ไม่ได้ IP จาก DHCP · <b>0.0.0.0</b> = สายหลุด/การ์ดปิด</td></tr>
<tr><td>2. TCP/IP stack</td><td><code>ping 127.0.0.1</code></td><td>stack ในเครื่องปกติ</td><td>ถ้าไม่ผ่าน = TCP/IP เสีย ลอง <code>netsh winsock reset</code></td></tr>
<tr><td>3. ตัวเอง</td><td><code>ping &lt;IP ตัวเอง&gt;</code></td><td>การ์ดทำงาน</td><td>ไดรเวอร์การ์ดมีปัญหา</td></tr>
<tr><td>4. Gateway</td><td><code>ping 192.168.10.1</code></td><td>ถึง router ได้ = สายและ switch ปกติ</td><td>สาย/พอร์ต switch/VLAN ผิด</td></tr>
<tr><td>5. ออกนอก (IP)</td><td><code>ping 8.8.8.8</code></td><td>ออกอินเทอร์เน็ตได้</td><td>ปัญหาที่ router/WAN/firewall</td></tr>
<tr><td>6. ออกนอก (ชื่อ)</td><td><code>ping google.com</code></td><td>DNS ทำงาน</td><td><b>ข้อ 5 ผ่านแต่ข้อ 6 ไม่ผ่าน = ปัญหา DNS ล้วน ๆ</b></td></tr>
<tr><td>7. เส้นทาง</td><td><code>tracert 8.8.8.8</code></td><td>เห็นว่าไปตันตรงไหน</td><td>hop ที่หยุด = จุดที่มีปัญหา</td></tr>
</table>
<div class="note warn"><b>อ่านผลให้เป็น — สามข้อความที่ความหมายต่างกันมาก</b><br>
<code>Request timed out</code> = ส่งไปแล้วแต่ไม่มีใครตอบ (อาจโดน firewall บล็อก ICMP หรือปลายทางดับ)<br>
<code>Destination host unreachable</code> = <b>เครื่องเราไม่รู้ทางไป</b> ปัญหาอยู่ที่ gateway/route ของเราเอง<br>
<code>Ping request could not find host</code> = <b>แปลงชื่อไม่ได้</b> ปัญหาอยู่ที่ DNS</div>
<p><b>เคสตัวอย่างที่เจอจริง:</b></p>
<table class="tbl">
<tr><th>อาการ</th><th>สาเหตุที่พบบ่อย</th><th>คำสั่งที่ใช้ยืนยัน</th></tr>
<tr><td>IP เป็น 169.254.x.x</td><td>ไม่ได้ IP จาก DHCP (สายหลุด, DHCP หมด pool, VLAN ผิด)</td><td><code>ipconfig /all</code> ดูว่า DHCP Server ว่างไหม</td></tr>
<tr><td>ping IP ได้ แต่ ping ชื่อไม่ได้</td><td>DNS ผิดหรือ DNS server ล่ม</td><td><code>nslookup</code>, <code>ipconfig /all</code></td></tr>
<tr><td>เว็บเดียวเข้าไม่ได้ เว็บอื่นปกติ</td><td>DNS cache จำ IP เก่า</td><td><code>ipconfig /displaydns</code> แล้ว <code>/flushdns</code></td></tr>
<tr><td>เข้าได้บ้างไม่ได้บ้าง</td><td>IP ชนกัน</td><td><code>arp -a</code> ดู MAC ซ้ำ</td></tr>
<tr><td>ต่อ VPN แล้วเข้า server ในบริษัทไม่ได้</td><td>route ไม่ครบ</td><td><code>route print</code></td></tr>
</table>`,
        },
      ],
      quiz: [
        { type: 'mcq', q: 'ข้อใดคือความต่างระหว่าง Role และ Feature', opts: ['ไม่ต่างกัน เรียกแทนกันได้', 'Role คือหน้าที่หลักของเซิร์ฟเวอร์ (AD DS, DNS) ส่วน Feature คือส่วนเสริม (RSAT, .NET, Clustering)', 'Role ติดตั้งได้ทีละอัน Feature ติดตั้งได้หลายอัน', 'Feature ต้องซื้อ license เพิ่ม'], a: 1, why: 'Role กำหนดว่าเซิร์ฟเวอร์นี้ "เป็นอะไร" ส่วน Feature คือความสามารถเสริมที่มาช่วย' },
        { type: 'cmd', q: 'พิมพ์คำสั่ง PowerShell ติดตั้ง role DNS พร้อมเครื่องมือจัดการ', ans: ['install-windowsfeature -name dns -includemanagementtools', 'install-windowsfeature -name dns'], why: 'ควรใส่ -IncludeManagementTools เสมอ ไม่งั้นจะได้ role มาแต่ไม่มี console/PowerShell module ไว้จัดการ' },
        { type: 'mcq', q: 'Server Core ต่างจาก Desktop Experience อย่างไร', opts: ['Server Core เร็วกว่าเพราะไม่มี GUI จึงมี attack surface และ patch น้อยกว่า', 'Server Core ติดตั้ง role ไม่ได้', 'Server Core ไม่รองรับ Active Directory', 'ไม่ต่างกัน'], a: 0, why: 'Microsoft แนะนำ Server Core สำหรับ production เพราะกิน resource น้อยกว่า อัปเดตน้อยกว่า และปลอดภัยกว่า — จัดการผ่าน PowerShell หรือ RSAT จากเครื่องอื่น' },
        { type: 'cmd', q: 'พิมพ์คำสั่งดูสถานะ service ทั้งหมดบนเครื่อง', ans: ['get-service', 'gsv'], why: 'Get-Service แสดง Status / Name / DisplayName — ใส่ -Name เพื่อกรองเฉพาะตัวที่สนใจ' },
        { type: 'mcq', q: 'Domain Controller ควรตั้ง DNS ของตัวเองชี้ไปที่ใด', opts: ['8.8.8.8 เพื่อความเร็ว', 'ตัวเองหรือ DC ตัวอื่นในโดเมน', 'router ของออฟฟิศ', 'ไม่ต้องตั้งเลย'], a: 1, why: 'AD พึ่ง DNS ในการหา SRV record ของ domain services — ถ้าชี้ไป public DNS จะหา _ldap._tcp.dc._msdcs ไม่เจอ และ domain จะพังทั้งระบบ' },
        { type: 'multi', q: 'ข้อใดเป็นข้อกำหนดของเครื่องที่จะเป็น Domain Controller (เลือกทุกข้อที่ถูก)', opts: ['ใช้ IP แบบ static', 'DNS ชี้ไปที่ตัวเอง', 'ต้องเป็น Datacenter edition เท่านั้น', 'ต้องติดตั้ง role AD-Domain-Services'], a: [0, 1, 3], why: 'Standard edition เป็น DC ได้ตามปกติ — Datacenter จำเป็นเมื่อต้องการ virtualization ไม่จำกัดหรือ Storage Spaces Direct' },
        { type: 'mcq', q: 'เครื่องผู้ใช้ได้ IP เป็น <code>169.254.88.12</code> หมายความว่าอย่างไร', opts: ['ได้ IP จาก DHCP ปกติ', 'ขอ IP จาก DHCP ไม่สำเร็จ เครื่องจึงตั้ง APIPA ให้ตัวเอง', 'เครื่องติดไวรัส', 'IP นี้เป็นของ VPN'], a: 1, why: 'ช่วง 169.254.x.x คือ APIPA ที่ Windows ตั้งเองเมื่อหา DHCP ไม่เจอ — ให้ตรวจสาย, พอร์ต switch/VLAN และ DHCP server ตามลำดับ' },
        { type: 'cmd', q: 'พิมพ์คำสั่ง cmd เพื่อดูการตั้งค่าเครือข่ายแบบละเอียด (รวม MAC และ DNS server)', ans: ['ipconfig /all', 'ipconfig/all'], why: 'ipconfig เฉย ๆ แสดงแค่ IP/Mask/Gateway ส่วน /all เพิ่ม MAC address, DHCP เปิดไหม, DHCP server ที่แจก และ DNS servers' },
        { type: 'mcq', q: '<code>ping 8.8.8.8</code> สำเร็จ แต่ <code>ping google.com</code> ไม่สำเร็จ แปลว่าปัญหาอยู่ที่ไหน', opts: ['สายแลนหลุด', 'DNS', 'Default gateway ผิด', 'firewall บล็อกทั้งหมด'], a: 1, why: 'ออกอินเทอร์เน็ตด้วย IP ได้แปลว่าเส้นทางปกติ — ที่เหลือคือการแปลงชื่อเป็น IP ซึ่งเป็นหน้าที่ของ DNS ตรวจต่อด้วย nslookup และ ipconfig /all' },
        { type: 'mcq', q: 'ข้อความ <code>Destination host unreachable</code> ต่างจาก <code>Request timed out</code> อย่างไร', opts: ['เหมือนกัน', 'unreachable = เครื่องเราไม่รู้เส้นทางไป (ปัญหาที่ฝั่งเรา) ส่วน timed out = ส่งไปแล้วไม่มีใครตอบ', 'unreachable แปลว่าปลายทางปิดเครื่อง', 'timed out แปลว่า DNS ผิด'], a: 1, why: 'unreachable มักหมายถึง gateway/route ของเราเองมีปัญหา ส่วน timed out อาจเป็นเพราะปลายทางดับหรือ firewall บล็อก ICMP' },
        { type: 'cmd', q: 'พิมพ์คำสั่งล้าง DNS cache ของเครื่อง (ใช้เมื่อเว็บย้าย IP แล้วเครื่องยังจำของเก่า)', ans: ['ipconfig /flushdns', 'ipconfig/flushdns'], why: 'ดูของที่จำไว้ก่อนได้ด้วย ipconfig /displaydns แล้วค่อยล้าง' },
        { type: 'cmd', q: 'พิมพ์คำสั่งดูพอร์ตและ connection ทั้งหมดพร้อมหมายเลข PID ของ process', ans: ['netstat -ano', 'netstat -aon', 'netstat -no -a'], why: '-a ทุก connection, -n ไม่แปลงเป็นชื่อ (เร็วกว่า), -o แสดง PID เพื่อเอาไปหาต่อใน tasklist ว่าคือโปรแกรมอะไร' },
        { type: 'mcq', q: 'ต้องการปิดโปรแกรมที่ค้างโดยรู้แค่ชื่อไฟล์ ควรใช้คำสั่งใด', opts: ['taskkill /IM notepad.exe', 'tasklist /IM notepad.exe', 'sc stop notepad', 'net stop notepad'], a: 0, why: 'taskkill /IM ใช้ชื่อ image ส่วน /PID ใช้เลข process — หา PID ได้จาก tasklist หรือ netstat -ano' },
        { type: 'multi', q: 'ลำดับคำสั่งที่ช่างมักใช้กู้เครื่องที่ "ต่อเน็ตไม่ได้แบบหาสาเหตุไม่เจอ" (เลือกทุกข้อที่เกี่ยวข้อง)', opts: ['ipconfig /release แล้ว /renew', 'ipconfig /flushdns', 'netsh winsock reset แล้วรีสตาร์ท', 'format C:'], a: [0, 1, 2], why: 'สามข้อแรกคือลำดับมาตรฐานที่แก้ได้เกือบทุกเคสของ client — ส่วนการฟอร์แมตไม่ใช่การแก้ปัญหา' },
      ],
      labs: [{
        id: 'win-l1-base',
        title: 'Lab 1 — เตรียมเครื่องเซิร์ฟเวอร์ใหม่',
        brief: 'เซิร์ฟเวอร์ใหม่เพิ่งลง Windows Server 2022 เสร็จ ต้องตั้งชื่อ ตั้ง IP static และเตรียม role ที่จะใช้',
        device: 'windows',
        tasks: [
          { t: 'ดูการตั้งค่าเครือข่ายปัจจุบัน', hint: 'Get-NetIPConfiguration', check: (s, h) => h.some(c => /get-netipconfiguration|ipconfig/i.test(c)) },
          { t: 'ตั้ง IP <code>192.168.10.10/24</code> gateway <code>192.168.10.1</code> ที่ <code>Ethernet0</code>', hint: 'New-NetIPAddress -InterfaceAlias Ethernet0 -IPAddress 192.168.10.10 -PrefixLength 24 -DefaultGateway 192.168.10.1', check: s => s.nics.Ethernet0 && s.nics.Ethernet0.ip === '192.168.10.10' && s.nics.Ethernet0.prefix === 24 },
          { t: 'ตั้ง DNS ของ <code>Ethernet0</code> ให้ชี้ที่ตัวเอง <code>192.168.10.10</code>', hint: 'Set-DnsClientServerAddress -InterfaceAlias Ethernet0 -ServerAddresses 192.168.10.10', check: s => s.nics.Ethernet0.dns[0] === '192.168.10.10' },
          { t: 'เปลี่ยนชื่อเครื่องเป็น <code>SRV-DC01</code>', hint: 'Rename-Computer -NewName SRV-DC01', check: s => s.hostname === 'SRV-DC01' },
          { t: 'ดูรายการ Windows Feature ที่ขึ้นต้นด้วย AD', hint: 'Get-WindowsFeature -Name AD*', check: (s, h) => h.some(c => /get-windowsfeature/i.test(c)) },
          { t: 'ติดตั้ง role <code>AD-Domain-Services</code> พร้อมเครื่องมือจัดการ', hint: 'Install-WindowsFeature -Name AD-Domain-Services -IncludeManagementTools', check: s => s.features.has('AD-Domain-Services') },
          { t: 'ทดสอบการเชื่อมต่อออกอินเทอร์เน็ต', hint: 'Test-NetConnection 8.8.8.8', check: (s, h) => h.some(c => /test-netconnection|ping/i.test(c)) },
        ],
      }],
    },

    // =========================================================
    2: {
      title: 'Active Directory, DNS และ DHCP',
      objectives: [
        'สร้าง AD forest/domain และเข้าใจโครงสร้าง OU',
        'สร้างและจัดการ user / group ด้วย PowerShell',
        'เข้าใจว่า AD พึ่ง DNS อย่างไร',
        'ตั้ง DHCP scope พร้อม option ที่จำเป็น',
      ],
      sections: [
        {
          t: 'โครงสร้าง Active Directory',
          h: `
<table class="tbl">
<tr><th>ระดับ</th><th>คืออะไร</th></tr>
<tr><td><b>Forest</b></td><td>ขอบเขตความปลอดภัยสูงสุด มี schema เดียวกัน — องค์กรส่วนใหญ่ควรมี forest เดียว</td></tr>
<tr><td><b>Domain</b></td><td>ขอบเขตการจัดการ มี policy และฐานข้อมูลผู้ใช้ของตัวเอง</td></tr>
<tr><td><b>OU</b> (Organizational Unit)</td><td>โฟลเดอร์จัดกลุ่ม object เพื่อ apply GPO และมอบสิทธิ์ (delegate)</td></tr>
<tr><td><b>Object</b></td><td>User, Computer, Group, Printer</td></tr>
</table>
<pre class="code"><span style="color:#5b6b8c"># สร้าง forest ใหม่ (เครื่องจะรีบูตหลังทำเสร็จ)</span>
Install-WindowsFeature -Name AD-Domain-Services -IncludeManagementTools
Install-ADDSForest -DomainName corp.local -DomainNetbiosName CORP \`
  -InstallDns -SafeModeAdministratorPassword (Read-Host -AsSecureString)

<span style="color:#5b6b8c"># ตรวจสอบหลังรีบูต</span>
Get-ADDomain
Get-ADForest
nltest /dsgetdc:corp.local</pre>
<div class="note warn"><b>ตั้งชื่อโดเมนให้ถูกตั้งแต่แรก</b> — เปลี่ยนทีหลังยากมาก<br>
❌ อย่าใช้ <code>.local</code> (ชนกับ mDNS ของ Apple) หรือชื่อโดเมนจริงที่ใช้บนเว็บ<br>
✔ ใช้ subdomain ของโดเมนที่องค์กรเป็นเจ้าของ เช่น <code>ad.company.co.th</code> หรือ <code>corp.company.co.th</code></div>`,
        },
        {
          t: 'จัดการ User และ Group',
          h: `
<pre class="code"><span style="color:#5b6b8c"># สร้าง OU</span>
New-ADOrganizationalUnit -Name "IT" -Path "DC=corp,DC=local"

<span style="color:#5b6b8c"># สร้าง user</span>
New-ADUser -Name "Somchai Prasert" -SamAccountName somchai \`
  -UserPrincipalName somchai@corp.local -Path "OU=IT,DC=corp,DC=local" \`
  -AccountPassword (Read-Host -AsSecureString) -Enabled $true

<span style="color:#5b6b8c"># สร้างกลุ่มและเพิ่มสมาชิก</span>
New-ADGroup -Name "IT-Admins" -GroupScope Global -GroupCategory Security
Add-ADGroupMember -Identity "IT-Admins" -Members somchai

<span style="color:#5b6b8c"># ตรวจสอบ</span>
Get-ADUser -Filter * | Select-Object Name,SamAccountName,Enabled
Get-ADGroupMember -Identity "IT-Admins"</pre>
<table class="tbl">
<tr><th>Group Scope</th><th>ใส่สมาชิกจากไหนได้</th><th>ใช้ให้สิทธิ์ที่ไหนได้</th></tr>
<tr><td><b>Domain Local</b></td><td>ทั้ง forest</td><td>โดเมนตัวเองเท่านั้น</td></tr>
<tr><td><b>Global</b></td><td>โดเมนตัวเองเท่านั้น</td><td>ทั้ง forest</td></tr>
<tr><td><b>Universal</b></td><td>ทั้ง forest</td><td>ทั้ง forest (เก็บใน Global Catalog)</td></tr>
</table>
<div class="note"><b>แนวปฏิบัติ AGDLP</b> — <b>A</b>ccount → <b>G</b>lobal group → <b>D</b>omain <b>L</b>ocal group → <b>P</b>ermission<br>
เอา user ใส่ global group ตามหน้าที่ → เอา global group ใส่ domain local group ตามทรัพยากร → ให้สิทธิ์ที่ domain local group<br>
ทำแบบนี้แล้วเวลาคนย้ายแผนก แค่ย้าย group เดียว ไม่ต้องไล่แก้สิทธิ์ทีละโฟลเดอร์</div>`,
        },
        {
          t: 'DNS และ DHCP',
          h: `
<p><b>AD ขาด DNS ไม่ได้</b> — client หา domain controller ผ่าน SRV record ใน DNS ถ้า DNS พัง คนล็อกอินไม่ได้ทั้งองค์กร</p>
<table class="tbl">
<tr><th>Record</th><th>ใช้ทำอะไร</th></tr>
<tr><td><code>A</code></td><td>ชื่อ → IPv4</td></tr>
<tr><td><code>AAAA</code></td><td>ชื่อ → IPv6</td></tr>
<tr><td><code>CNAME</code></td><td>นามแฝงชี้ไปอีกชื่อ</td></tr>
<tr><td><code>MX</code></td><td>เซิร์ฟเวอร์เมลของโดเมน</td></tr>
<tr><td><code>SRV</code></td><td><b>หัวใจของ AD</b> — บอกว่า service อยู่ที่เครื่องไหน พอร์ตอะไร</td></tr>
<tr><td><code>PTR</code></td><td>IP → ชื่อ (reverse lookup) จำเป็นสำหรับ mail server และ log ที่อ่านรู้เรื่อง</td></tr>
</table>
<pre class="code">Add-DnsServerPrimaryZone -Name "corp.local" -ReplicationScope Domain
Add-DnsServerPrimaryZone -NetworkId "192.168.10.0/24" -ReplicationScope Domain   <span style="color:#5b6b8c"># reverse zone</span>
Add-DnsServerResourceRecordA -Name "srv-file01" -ZoneName "corp.local" -IPv4Address 192.168.10.20
Get-DnsServerZone
Resolve-DnsName srv-file01.corp.local</pre>
<pre class="code"><span style="color:#5b6b8c"># --- DHCP ---</span>
Install-WindowsFeature -Name DHCP -IncludeManagementTools
Add-DhcpServerv4Scope -Name "LAN-Office" -StartRange 192.168.10.100 \`
  -EndRange 192.168.10.200 -SubnetMask 255.255.255.0
Set-DhcpServerv4OptionValue -ScopeId 192.168.10.0 -Router 192.168.10.1 -DnsServer 192.168.10.10
Add-DhcpServerv4Reservation -ScopeId 192.168.10.0 -IPAddress 192.168.10.50 \`
  -ClientId "00-0C-29-11-22-33" -Description "เครื่องพิมพ์ชั้น 2"
Get-DhcpServerv4Scope</pre>
<div class="note warn"><b>ต้อง Authorize DHCP ใน AD</b> ด้วย <code>Add-DhcpServerInDC</code> ไม่งั้น service จะไม่ยอมแจก IP — เป็นกลไกป้องกัน rogue DHCP ในโดเมน</div>`,
        },
      ],
      quiz: [
        { type: 'mcq', q: 'ทำไม Active Directory ถึงขาด DNS ไม่ได้', opts: ['เพราะต้องใช้ DNS แปลงชื่อเว็บ', 'เพราะ client ใช้ SRV record ใน DNS เพื่อค้นหา domain controller และบริการต่าง ๆ', 'เพราะ DNS เก็บรหัสผ่านผู้ใช้', 'ไม่จริง AD ทำงานได้โดยไม่มี DNS'], a: 1, why: 'ถ้า SRV record หาย client จะหา DC ไม่เจอ ทำให้ล็อกอิน, apply GPO และ authentication พังทั้งระบบ' },
        { type: 'cmd', q: 'พิมพ์คำสั่งสร้าง AD forest ใหม่ชื่อโดเมน <code>corp.local</code> (เขียนเฉพาะส่วนหลัก)', ans: ['install-addsforest -domainname corp.local', 'install-addsforest -domainname corp.local -installdns'], why: 'Install-ADDSForest สร้าง forest+domain+DC ตัวแรกในคำสั่งเดียว ต้องติดตั้ง role AD-Domain-Services ก่อน' },
        { type: 'mcq', q: 'ตามแนวปฏิบัติ AGDLP ควรให้สิทธิ์ (permission) ที่กลุ่มชนิดใด', opts: ['Global group', 'Domain Local group', 'Universal group', 'ให้ที่ user โดยตรง'], a: 1, why: 'A→G→DL→P: user เข้า Global group ตามหน้าที่ → Global group เข้า Domain Local group ตามทรัพยากร → ให้สิทธิ์ที่ Domain Local' },
        { type: 'cmd', q: 'พิมพ์คำสั่งสร้าง AD user ชื่อ SamAccountName <code>somchai</code> โดยเปิดใช้งานบัญชี (ระบุแค่ -Name, -SamAccountName, -Enabled)', ans: ['new-aduser -name "somchai" -samaccountname somchai -enabled $true', 'new-aduser -name somchai -samaccountname somchai -enabled $true'], why: 'New-ADUser ต้องมีอย่างน้อย -Name ส่วน -Enabled $true จะเปิดบัญชีทันที (ในระบบจริงต้องใส่ -AccountPassword ด้วย)' },
        { type: 'mcq', q: 'DNS record ชนิดใดที่ AD ใช้ในการโฆษณาบริการของ domain controller', opts: ['A', 'MX', 'SRV', 'TXT'], a: 2, why: 'SRV record เช่น _ldap._tcp.dc._msdcs.corp.local บอก client ว่าจะหา LDAP/Kerberos ได้ที่เครื่องไหน พอร์ตอะไร' },
        { type: 'mcq', q: 'ทำไม DHCP server บน Windows ต้อง Authorize ใน AD ก่อนถึงจะแจก IP ได้', opts: ['เพื่อคิดค่า license', 'เป็นกลไกป้องกัน rogue DHCP server ในโดเมน', 'เพื่อ sync เวลา', 'ไม่จำเป็นต้อง authorize'], a: 1, why: 'DHCP server ที่เป็นสมาชิกโดเมนจะเช็คกับ AD ก่อนเริ่มบริการ ถ้าไม่ถูก authorize จะไม่ยอมตอบ DHCP request' },
        { type: 'mcq', q: 'ควรตั้งชื่อ AD domain อย่างไรจึงเหมาะสมที่สุด', opts: ['company.local', 'company.com (โดเมนจริงบนเว็บ)', 'ad.company.co.th (subdomain ของโดเมนที่องค์กรเป็นเจ้าของ)', 'ตั้งชื่ออะไรก็ได้'], a: 2, why: '.local ชนกับ mDNS ส่วนการใช้โดเมนเว็บจริงตรง ๆ ทำให้เกิด split-brain DNS ที่ปวดหัวมาก — subdomain แยกต่างหากคือคำตอบ' },
        { type: 'multi', q: 'DNS record ชนิดใดที่ควรมีสำหรับ mail server (เลือกทุกข้อที่ถูก)', opts: ['MX', 'A', 'PTR (reverse)', 'SRV'], a: [0, 1, 2], why: 'MX ชี้ไปยัง mail server, A แปลงชื่อเป็น IP และ PTR จำเป็นเพราะปลายทางส่วนใหญ่ตรวจ reverse DNS เพื่อกันสแปม' },
      ],
      labs: [{
        id: 'win-l2-ad',
        title: 'Lab 2 — สร้างโดเมนและผู้ใช้ชุดแรก',
        brief: 'สร้าง AD forest ใหม่สำหรับบริษัท จากนั้นสร้าง OU, ผู้ใช้ และกลุ่มตามโครงสร้างองค์กร',
        device: 'windows',
        tasks: [
          { t: 'ติดตั้ง role <code>AD-Domain-Services</code>', hint: 'Install-WindowsFeature -Name AD-Domain-Services -IncludeManagementTools', check: s => s.features.has('AD-Domain-Services') },
          { t: 'สร้าง forest ใหม่ชื่อ <code>corp.local</code>', hint: 'Install-ADDSForest -DomainName corp.local', check: s => s.domain === 'corp.local' && s.isDC },
          { t: 'ตรวจสอบข้อมูลโดเมนที่สร้าง', hint: 'Get-ADDomain', check: (s, h) => h.some(c => /get-addomain/i.test(c)) },
          { t: 'สร้าง OU ชื่อ <code>IT</code>', hint: 'New-ADOrganizationalUnit -Name "IT"', check: s => s.adOUs.some(o => String(o).toLowerCase() === 'it') },
          { t: 'สร้าง user <code>somchai</code> และเปิดใช้งาน', hint: 'New-ADUser -Name "Somchai P" -SamAccountName somchai -Enabled $true', check: s => s.adUsers.somchai && s.adUsers.somchai.enabled },
          { t: 'สร้าง user <code>nipa</code> และเปิดใช้งาน', hint: 'New-ADUser -Name "Nipa S" -SamAccountName nipa -Enabled $true', check: s => s.adUsers.nipa && s.adUsers.nipa.enabled },
          { t: 'สร้างกลุ่ม <code>IT-Admins</code>', hint: 'New-ADGroup -Name "IT-Admins" -GroupScope Global', check: s => Object.keys(s.adGroups).some(g => g.toLowerCase() === 'it-admins') },
          { t: 'เพิ่ม <code>somchai</code> เข้ากลุ่ม <code>IT-Admins</code>', hint: 'Add-ADGroupMember -Identity "IT-Admins" -Members somchai', check: s => { const g = Object.keys(s.adGroups).find(x => x.toLowerCase() === 'it-admins'); return g && s.adGroups[g].includes('somchai'); } },
          { t: 'ติดตั้ง role <code>DHCP</code>', hint: 'Install-WindowsFeature -Name DHCP -IncludeManagementTools', check: s => s.features.has('DHCP') },
          { t: 'สร้าง DHCP scope ชื่อ <code>LAN-Office</code> ช่วง <code>192.168.10.100</code> ถึง <code>192.168.10.200</code>', hint: 'Add-DhcpServerv4Scope -Name "LAN-Office" -StartRange 192.168.10.100 -EndRange 192.168.10.200 -SubnetMask 255.255.255.0', check: s => s.dhcpScopes.some(x => x.name === 'LAN-Office' && x.start === '192.168.10.100' && x.end === '192.168.10.200') },
        ],
      }],
    },

    // =========================================================
    3: {
      title: 'Group Policy, File Server และการสำรองข้อมูล',
      objectives: [
        'เข้าใจลำดับการ apply GPO และการแก้ปัญหา',
        'ตั้ง File Server พร้อมสิทธิ์ Share และ NTFS ให้ถูกต้อง',
        'ทำ backup / restore และเข้าใจ AD recycle bin',
        'จัดการ Windows Update ให้ทั้งองค์กร',
      ],
      sections: [
        {
          t: 'Group Policy — ลำดับและการไล่ปัญหา',
          h: `
<p>GPO ถูก apply ตามลำดับ <b>LSDOU</b> — อันหลังทับอันก่อนหน้า</p>
<table class="tbl">
<tr><th>ลำดับ</th><th>ระดับ</th><th>หมายเหตุ</th></tr>
<tr><td>1</td><td><b>L</b>ocal</td><td>นโยบายบนเครื่องเอง</td></tr>
<tr><td>2</td><td><b>S</b>ite</td><td>ตามที่ตั้งทางกายภาพ</td></tr>
<tr><td>3</td><td><b>D</b>omain</td><td>ทั้งโดเมน เช่น Default Domain Policy</td></tr>
<tr><td>4</td><td><b>OU</b></td><td>ไล่จาก OU ชั้นบนลงชั้นล่าง — <b>ชั้นล่างสุดชนะ</b></td></tr>
</table>
<div class="note"><b>ข้อยกเว้นที่ต้องรู้</b><br>
<code>Enforced</code> — บังคับให้ GPO นี้ชนะทุกอย่างที่มาทีหลัง<br>
<code>Block Inheritance</code> — OU นี้ไม่รับ GPO จากชั้นบน (แต่ยังแพ้ Enforced)<br>
<code>Security Filtering</code> — จำกัดว่า GPO นี้ใช้กับ user/group ใด<br>
<code>Loopback Processing</code> — ใช้ user setting ตามเครื่อง ไม่ใช่ตาม user (จำเป็นสำหรับห้อง lab, kiosk, Terminal Server)</div>
<pre class="code">New-GPO -Name "Password-Policy"
New-GPLink -Name "Password-Policy" -Target "OU=IT,DC=corp,DC=local"
Get-GPO -All | Select-Object DisplayName,GpoStatus

<span style="color:#5b6b8c"># ที่เครื่อง client — ไล่ปัญหา GPO</span>
gpupdate /force
gpresult /r                       <span style="color:#5b6b8c"># ดูว่า GPO ไหน apply / ถูกกรองออก</span>
gpresult /h C:\\report.html /f    <span style="color:#5b6b8c"># รายงาน HTML อ่านง่ายที่สุด</span></pre>
<div class="note warn"><b>เคสคลาสสิก:</b> ตั้ง GPO แล้วไม่มีผล → เช็ค <code>gpresult /r</code> ว่า GPO ถูก apply ไหม สาเหตุยอดฮิตคือ security filtering ไม่ครอบคลุม, ผูก GPO ผิด OU, หรือเครื่อง client ยังไม่ได้รีสตาร์ท (บาง policy ต้องรีบูต)</div>`,
        },
        {
          t: 'File Server — Share vs NTFS Permission',
          h: `
<p>สิทธิ์ที่ผู้ใช้ได้จริง = <b>สิทธิ์ที่เข้มงวดกว่า</b> ระหว่าง Share permission กับ NTFS permission</p>
<table class="tbl">
<tr><th></th><th>Share Permission</th><th>NTFS Permission</th></tr>
<tr><td>มีผลเมื่อ</td><td>เข้าถึงผ่านเครือข่ายเท่านั้น</td><td>ทั้งเครือข่ายและ local</td></tr>
<tr><td>ระดับ</td><td>ทั้ง share</td><td>ลงลึกได้ถึงไฟล์เดี่ยว</td></tr>
<tr><td>แนวปฏิบัติ</td><td>ตั้ง <b>Everyone = Full Control</b></td><td>คุมสิทธิ์จริงที่นี่ทั้งหมด</td></tr>
</table>
<pre class="code">New-Item -Path "C:\\Shares\\Finance" -ItemType Directory
New-SmbShare -Name "Finance" -Path "C:\\Shares\\Finance" -FullAccess "Everyone"

<span style="color:#5b6b8c"># คุมสิทธิ์จริงด้วย NTFS</span>
$acl = Get-Acl "C:\\Shares\\Finance"
$rule = New-Object System.Security.AccessControl.FileSystemAccessRule(
  "CORP\\Finance-RW","Modify","ContainerInherit,ObjectInherit","None","Allow")
$acl.SetAccessRule($rule)
Set-Acl "C:\\Shares\\Finance" $acl

Get-SmbShare
Get-SmbShareAccess -Name Finance</pre>
<div class="note"><b>ฟีเจอร์ที่ควรเปิดบน File Server</b><br>
<b>Shadow Copies</b> — ผู้ใช้กู้ไฟล์เวอร์ชันก่อนหน้าได้เอง ลดงาน helpdesk ได้มหาศาล<br>
<b>FSRM Quota</b> — จำกัดพื้นที่ต่อโฟลเดอร์<br>
<b>FSRM File Screen</b> — ห้ามเก็บไฟล์บางชนิด (.mp4, .exe) และช่วยลดผลกระทบจาก ransomware<br>
<b>Access-Based Enumeration</b> — ซ่อนโฟลเดอร์ที่ผู้ใช้ไม่มีสิทธิ์เห็น</div>`,
        },
        {
          t: 'Backup, Restore และ Windows Update',
          h: `
<pre class="code">Install-WindowsFeature -Name Windows-Server-Backup
wbadmin start backup -backupTarget:E: -include:C: -allCritical -quiet
wbadmin get versions</pre>
<table class="tbl">
<tr><th>สถานการณ์</th><th>วิธีกู้</th></tr>
<tr><td>ลบ AD object ผิด</td><td>AD Recycle Bin (ต้องเปิดไว้ล่วงหน้า!) — <code>Restore-ADObject</code></td></tr>
<tr><td>DC เสียหายหนึ่งตัว (มีตัวอื่นอยู่)</td><td>ลบ metadata แล้ว promote ตัวใหม่ — ง่ายและปลอดภัยกว่า restore</td></tr>
<tr><td>DC เสียหายทั้งหมด</td><td>Authoritative restore จาก system state backup</td></tr>
<tr><td>ไฟล์ผู้ใช้หาย</td><td>Shadow Copies / Previous Versions</td></tr>
</table>
<pre class="code"><span style="color:#5b6b8c"># เปิด AD Recycle Bin — ทำครั้งเดียว ย้อนกลับไม่ได้ ควรทำทันทีหลังสร้างโดเมน</span>
Enable-ADOptionalFeature -Identity "Recycle Bin Feature" \`
  -Scope ForestOrConfigurationSet -Target "corp.local"

<span style="color:#5b6b8c"># กู้ object ที่ลบไป</span>
Get-ADObject -Filter 'isDeleted -eq $true' -IncludeDeletedObjects
Restore-ADObject -Identity "&lt;DistinguishedName&gt;"</pre>
<div class="note warn"><b>กฎ 3-2-1</b> — เก็บสำเนา <b>3</b> ชุด บนสื่อ <b>2</b> ชนิด และมี <b>1</b> ชุดอยู่นอกสถานที่ (offsite/offline)<br>
และที่สำคัญที่สุด: <b>backup ที่ไม่เคยทดสอบ restore = ไม่มี backup</b> ต้องซ้อมกู้อย่างน้อยปีละครั้ง</div>
<p><b>Windows Update</b> — องค์กรควรควบคุมด้วย WSUS หรือ Intune/SCCM แทนที่จะให้แต่ละเครื่องโหลดเอง: ประหยัดแบนด์วิดท์ ทดสอบ patch ในกลุ่มนำร่องก่อน แล้วค่อยปล่อยทั้งองค์กร</p>`,
        },
      ],
      quiz: [
        { type: 'mcq', q: 'ลำดับการ apply GPO ที่ถูกต้องคือข้อใด', opts: ['Domain → Site → OU → Local', 'Local → Site → Domain → OU', 'OU → Domain → Site → Local', 'Site → Local → OU → Domain'], a: 1, why: 'LSDOU — Local, Site, Domain, OU โดย OU ชั้นล่างสุด apply ทีหลังจึงชนะ ยกเว้นมี Enforced' },
        { type: 'mcq', q: 'ผู้ใช้เข้าถึง share ผ่านเครือข่าย โดย Share permission = Read แต่ NTFS = Modify ผู้ใช้จะทำอะไรได้', opts: ['Modify', 'Read เท่านั้น', 'Full Control', 'ไม่มีสิทธิ์เลย'], a: 1, why: 'สิทธิ์ที่ได้จริงคือค่าที่เข้มงวดกว่าเสมอ — จึงนิยมตั้ง Share = Everyone Full Control แล้วคุมจริงที่ NTFS ชั้นเดียว' },
        { type: 'cmd', q: 'พิมพ์คำสั่ง (cmd) ที่ใช้บังคับให้เครื่อง client ดึง GPO ใหม่ทันที', ans: ['gpupdate /force', 'gpupdate'], why: 'gpupdate /force ดึงและ apply ทุก policy ใหม่ ส่วน gpresult /r ใช้ตรวจว่า GPO ใดถูก apply จริง' },
        { type: 'mcq', q: 'AD Recycle Bin มีข้อควรระวังอะไร', opts: ['เปิดแล้วปิดไม่ได้ และต้องเปิดไว้ก่อนที่ object จะถูกลบจึงจะกู้ได้', 'ใช้พื้นที่ดิสก์มหาศาล', 'ทำให้ AD ช้าลงมาก', 'ต้องซื้อ license เพิ่ม'], a: 0, why: 'เป็นฟีเจอร์ที่เปิดแล้วย้อนกลับไม่ได้ และไม่ช่วยกู้ object ที่ถูกลบก่อนเปิดใช้งาน — จึงควรเปิดทันทีหลังสร้างโดเมน' },
        { type: 'multi', q: 'ฟีเจอร์ใดบน File Server ที่ช่วยลดผลกระทบจาก ransomware และลดงาน helpdesk (เลือกทุกข้อที่ถูก)', opts: ['Shadow Copies (Previous Versions)', 'FSRM File Screen', 'Access-Based Enumeration', 'Disk Defragmenter'], a: [0, 1, 2], why: 'Shadow Copies ให้ผู้ใช้กู้ไฟล์เอง, File Screen บล็อกนามสกุลอันตราย, ABE ซ่อนสิ่งที่ผู้ใช้ไม่มีสิทธิ์เห็น' },
        { type: 'mcq', q: 'GPO ตั้งไว้แล้วแต่ไม่มีผลกับเครื่อง client ควรตรวจอะไรเป็นอย่างแรก', opts: ['รีบูต DC', 'รัน gpresult /r ที่เครื่อง client เพื่อดูว่า GPO ถูก apply หรือถูกกรองออก', 'ลบ GPO แล้วสร้างใหม่', 'เปลี่ยน IP เครื่อง client'], a: 1, why: 'gpresult บอกทั้ง GPO ที่ apply และที่ถูก filter ออก พร้อมเหตุผล ทำให้เจอสาเหตุ (security filtering, ผูกผิด OU, WMI filter) ได้เร็ว' },
        { type: 'mcq', q: 'กฎ 3-2-1 ในการสำรองข้อมูลหมายถึงอะไร', opts: ['สำรอง 3 ครั้งต่อวัน 2 สัปดาห์ 1 เดือน', 'สำเนา 3 ชุด สื่อ 2 ชนิด และ 1 ชุดอยู่นอกสถานที่', '3 เซิร์ฟเวอร์ 2 ไซต์ 1 ผู้ดูแล', 'ไม่มีความหมายเฉพาะ'], a: 1, why: 'และต้องทดสอบ restore สม่ำเสมอ — backup ที่ไม่เคยทดสอบกู้ ถือว่าไม่มี backup' },
      ],
      labs: [{
        id: 'win-l3-file',
        title: 'Lab 3 — File Server และการเตรียมกู้คืน',
        brief: 'สร้าง share สำหรับแผนกบัญชี พร้อมกลุ่มสิทธิ์ตามหลัก AGDLP และเตรียมเครื่องมือสำรองข้อมูล',
        device: 'windows',
        tasks: [
          { t: 'สร้าง forest <code>corp.local</code> (ถ้ายังไม่มี)', hint: 'Install-WindowsFeature -Name AD-Domain-Services → Install-ADDSForest -DomainName corp.local', check: s => s.domain === 'corp.local' },
          { t: 'สร้างกลุ่ม <code>Finance-RW</code>', hint: 'New-ADGroup -Name "Finance-RW" -GroupScope DomainLocal', check: s => Object.keys(s.adGroups).some(g => g.toLowerCase() === 'finance-rw') },
          { t: 'สร้างกลุ่ม <code>Finance-RO</code>', hint: 'New-ADGroup -Name "Finance-RO" -GroupScope DomainLocal', check: s => Object.keys(s.adGroups).some(g => g.toLowerCase() === 'finance-ro') },
          { t: 'สร้างโฟลเดอร์ <code>C:\\Shares</code>', hint: 'New-Item -Path C:\\Shares -ItemType Directory', check: s => !!s.fs['C:\\'].c.Shares },
          { t: 'สร้างโฟลเดอร์ <code>C:\\Shares\\Finance</code>', hint: 'New-Item -Path C:\\Shares\\Finance -ItemType Directory', check: s => s.fs['C:\\'].c.Shares && !!s.fs['C:\\'].c.Shares.c.Finance },
          { t: 'สร้าง SMB share ชื่อ <code>Finance</code> ชี้ไปที่ <code>C:\\Shares\\Finance</code>', hint: 'New-SmbShare -Name Finance -Path C:\\Shares\\Finance -FullAccess Everyone', check: s => s.shares.Finance && /Finance/i.test(s.shares.Finance.path) },
          { t: 'ตรวจสอบรายการ share ทั้งหมด', hint: 'Get-SmbShare', check: (s, h) => h.some(c => /get-smbshare|net share/i.test(c)) },
          { t: 'ติดตั้ง feature <code>Windows-Server-Backup</code>', hint: 'Install-WindowsFeature -Name Windows-Server-Backup', check: s => s.features.has('Windows-Server-Backup') },
          { t: 'บังคับดึง Group Policy ใหม่', hint: 'gpupdate /force', check: (s, h) => h.some(c => /gpupdate/i.test(c)) },
        ],
      }],
    },

    // =========================================================
    4: {
      title: 'Hyper-V, High Availability และความปลอดภัย',
      objectives: [
        'สร้างและจัดการ VM ด้วย Hyper-V',
        'เข้าใจ Failover Cluster และ quorum',
        'ทำ hardening ตาม security baseline',
        'อ่าน Event Log และวิเคราะห์ปัญหาประสิทธิภาพ',
      ],
      sections: [
        {
          t: 'Hyper-V',
          h: `
<pre class="code">Install-WindowsFeature -Name Hyper-V -IncludeManagementTools -Restart

New-VMSwitch -Name "vSwitch-LAN" -NetAdapterName "Ethernet0" -AllowManagementOS $true
New-VM -Name "SRV-APP01" -MemoryStartupBytes 4GB -Generation 2 \`
  -NewVHDPath "D:\\VMs\\SRV-APP01.vhdx" -NewVHDSizeBytes 80GB -SwitchName "vSwitch-LAN"
Set-VM -Name "SRV-APP01" -DynamicMemory -MemoryMinimumBytes 2GB -MemoryMaximumBytes 8GB
Start-VM -Name "SRV-APP01"
Get-VM</pre>
<table class="tbl">
<tr><th>ชนิด vSwitch</th><th>VM คุยกับ</th></tr>
<tr><td><b>External</b></td><td>เครือข่ายจริงภายนอก + host + VM อื่น</td></tr>
<tr><td><b>Internal</b></td><td>host และ VM อื่นเท่านั้น (ไม่ออกเน็ต)</td></tr>
<tr><td><b>Private</b></td><td>VM ด้วยกันเท่านั้น (host ก็เข้าไม่ได้)</td></tr>
</table>
<table class="tbl">
<tr><th>สิ่งที่ต้องรู้</th><th>รายละเอียด</th></tr>
<tr><td>Generation 2</td><td>UEFI, Secure Boot, บูตจาก SCSI — ใช้กับ OS ยุคใหม่ทั้งหมด</td></tr>
<tr><td>Dynamic Memory</td><td>คืน RAM ที่ไม่ใช้ให้ host — <b>อย่าใช้กับ SQL Server หรือ Exchange</b></td></tr>
<tr><td>Checkpoint</td><td>ใช้ทดสอบชั่วคราวเท่านั้น <b>ไม่ใช่ backup</b> — ทิ้งไว้นานทำให้ดิสก์เต็มและ VM ช้า</td></tr>
<tr><td>Integration Services</td><td>ต้องติดตั้งใน guest เพื่อให้ shutdown/heartbeat/time sync ทำงาน</td></tr>
</table>`,
        },
        {
          t: 'Failover Cluster และ Quorum',
          h: `
<pre class="code">Install-WindowsFeature -Name Failover-Clustering -IncludeManagementTools
Test-Cluster -Node SRV01,SRV02              <span style="color:#5b6b8c"># ต้องผ่านก่อนสร้าง cluster เสมอ</span>
New-Cluster -Name CL-APP -Node SRV01,SRV02 -StaticAddress 192.168.10.30
Get-ClusterNode
Get-ClusterQuorum</pre>
<div class="note"><b>Quorum คืออะไรและทำไมสำคัญ</b><br>
คือกลไก "โหวต" เพื่อตัดสินว่าฝั่งไหนของ cluster ที่ยังมีสิทธิ์ให้บริการเมื่อเกิดการแยกส่วน (split-brain)<br>
Cluster 2 โหนดต้องมี <b>witness</b> (File Share Witness หรือ Cloud Witness) เป็นเสียงที่ 3 เสมอ ไม่งั้นเมื่อโหนดหนึ่งดับ อีกโหนดจะไม่กล้าให้บริการต่อ</div>
<table class="tbl">
<tr><th>เทคโนโลยี HA</th><th>ใช้กับ</th></tr>
<tr><td>Failover Cluster</td><td>Hyper-V, File Server, SQL Server</td></tr>
<tr><td>DFS Replication + DFS Namespace</td><td>File server หลายสาขา — namespace เดียวชี้ไปหลาย server</td></tr>
<tr><td>NLB (Network Load Balancing)</td><td>Web server ที่ stateless</td></tr>
<tr><td>Storage Spaces Direct (S2D)</td><td>Hyper-converged (ต้องใช้ Datacenter edition)</td></tr>
</table>`,
        },
        {
          t: 'Hardening และการวิเคราะห์ปัญหา',
          h: `
<table class="tbl">
<tr><th>สิ่งที่ต้องทำ</th><th>เหตุผล</th></tr>
<tr><td>ปิด SMBv1</td><td>ช่องโหว่ WannaCry/EternalBlue — <code>Disable-WindowsOptionalFeature -Online -FeatureName SMB1Protocol</code></td></tr>
<tr><td>เปิด LAPS</td><td>รหัส local admin ต่างกันทุกเครื่องและหมุนอัตโนมัติ</td></tr>
<tr><td>แยกบัญชี admin</td><td>บัญชีใช้งานทั่วไป ≠ บัญชี admin ≠ บัญชี domain admin</td></tr>
<tr><td>เปิด Windows Defender + ASR rules</td><td>ป้องกัน ransomware ที่ระดับพฤติกรรม</td></tr>
<tr><td>เปิด audit logging</td><td>ต้องมี log ตอนเกิดเหตุ ไม่ใช่ไปเปิดตอนเกิดแล้ว</td></tr>
<tr><td>ปิด service/port ที่ไม่ใช้</td><td>ลดพื้นผิวการโจมตี</td></tr>
</table>
<pre class="code"><span style="color:#5b6b8c"># Event ID ที่ควรจำ</span>
Get-EventLog -LogName Security -InstanceId 4625 -Newest 20   <span style="color:#5b6b8c"># ล็อกอินล้มเหลว</span>
Get-WinEvent -FilterHashtable @{LogName='Security'; ID=4740}  <span style="color:#5b6b8c"># บัญชีถูกล็อก</span></pre>
<table class="tbl">
<tr><th>Event ID</th><th>ความหมาย</th></tr>
<tr><td>4624 / 4625</td><td>ล็อกอินสำเร็จ / ล้มเหลว</td></tr>
<tr><td>4740</td><td>บัญชีถูกล็อก (account lockout)</td></tr>
<tr><td>4720 / 4726</td><td>สร้าง / ลบบัญชีผู้ใช้</td></tr>
<tr><td>4728 / 4732</td><td>เพิ่มสมาชิกเข้ากลุ่ม (จับตากลุ่ม admin เป็นพิเศษ)</td></tr>
<tr><td>7045</td><td>ติดตั้ง service ใหม่ — สัญญาณของ malware ที่พบบ่อย</td></tr>
<tr><td>1102</td><td>ล้าง audit log — แทบทุกครั้งคือสัญญาณอันตราย</td></tr>
</table>
<pre class="code"><span style="color:#5b6b8c"># วิเคราะห์ประสิทธิภาพ</span>
Get-Counter '\\Processor(_Total)\\% Processor Time' -SampleInterval 2 -MaxSamples 5
Get-Counter '\\Memory\\Available MBytes'
Get-Counter '\\PhysicalDisk(_Total)\\Avg. Disk sec/Read'   <span style="color:#5b6b8c"># ควรต่ำกว่า 0.020 (20ms)</span></pre>`,
        },
      ],
      quiz: [
        { type: 'mcq', q: 'Hyper-V vSwitch ชนิดใดที่ทำให้ VM คุยกันเองได้แต่ไม่เห็น host และไม่ออกเน็ต', opts: ['External', 'Internal', 'Private', 'NAT'], a: 2, why: 'Private = VM คุยกันเองเท่านั้น, Internal = VM + host, External = ออกเครือข่ายจริงได้' },
        { type: 'mcq', q: 'ทำไม Checkpoint ของ Hyper-V จึงไม่ใช่ backup', opts: ['เพราะกู้ไม่ได้', 'เพราะอยู่บน storage เดียวกับ VM ถ้า storage พังก็หายไปด้วย และทิ้งไว้นานทำให้ดิสก์เต็มและ VM ช้า', 'เพราะใช้ได้กับ Gen 1 เท่านั้น', 'เพราะต้องปิด VM ก่อน'], a: 1, why: 'Checkpoint คือ differencing disk ที่โตขึ้นเรื่อย ๆ ใช้สำหรับทดสอบระยะสั้นแล้วลบทิ้ง ไม่ใช่กลไกสำรองข้อมูล' },
        { type: 'mcq', q: 'Failover Cluster 2 โหนดจำเป็นต้องมีอะไรเพิ่มเพื่อให้ quorum ทำงานถูกต้อง', opts: ['โหนดที่ 3', 'Witness (File Share หรือ Cloud Witness) เป็นเสียงที่ 3', 'SAN ราคาแพง', 'ไม่ต้องมีอะไรเพิ่ม'], a: 1, why: 'ถ้ามีแค่ 2 เสียงและเสียหนึ่งเสียงไป จะเหลือ 1 จาก 2 ซึ่งไม่ใช่เสียงข้างมาก — witness จึงเป็นตัวตัดสิน' },
        { type: 'mcq', q: 'Event ID <code>4625</code> หมายถึงอะไร', opts: ['ล็อกอินสำเร็จ', 'ล็อกอินล้มเหลว', 'สร้างบัญชีใหม่', 'ล้าง log'], a: 1, why: '4624 = สำเร็จ, 4625 = ล้มเหลว — 4625 จำนวนมากในเวลาสั้น ๆ คือสัญญาณของ brute force attack' },
        { type: 'multi', q: 'ข้อใดควรทำใน security baseline ของ Windows Server (เลือกทุกข้อที่ถูก)', opts: ['ปิด SMBv1', 'ใช้ LAPS สำหรับรหัส local admin', 'แยกบัญชีใช้งานทั่วไปออกจากบัญชี admin', 'ใช้บัญชี Domain Admin ล็อกอินเครื่อง client ทุกวันเพื่อความสะดวก'], a: [0, 1, 2], why: 'การล็อกอินด้วย Domain Admin บนเครื่อง client ทำให้ credential ค้างในหน่วยความจำและถูกขโมยด้วย pass-the-hash ได้ — เป็นเส้นทางโจมตีที่พบบ่อยที่สุด' },
        { type: 'mcq', q: 'Event ID <code>1102</code> (ล้าง audit log) ควรถูกตีความอย่างไร', opts: ['เป็นงานบำรุงรักษาปกติ', 'เป็นสัญญาณอันตราย ควรตรวจสอบทันทีว่าใครทำและทำไม', 'แปลว่าดิสก์เต็ม', 'ไม่มีความหมาย'], a: 1, why: 'ผู้โจมตีมักล้าง log เพื่อลบร่องรอย — จึงควรส่ง log ออกไปเก็บที่ SIEM ภายนอกแบบ real-time' },
        { type: 'mcq', q: 'ค่า <code>Avg. Disk sec/Read</code> เท่าไรที่ถือว่าเริ่มมีปัญหา', opts: ['สูงกว่า 0.020 (20ms)', 'สูงกว่า 0.001', 'ต่ำกว่า 0.010', 'ไม่มีเกณฑ์'], a: 0, why: 'latency ของดิสก์ที่เกิน 20ms ต่อเนื่องบ่งบอกว่า storage เป็นคอขวด — บน SSD ควรอยู่ระดับต่ำกว่า 5ms' },
        { type: 'mcq', q: 'ไม่ควรใช้ Dynamic Memory ของ Hyper-V กับ workload ใด', opts: ['File server', 'Domain controller', 'SQL Server และ Exchange', 'Print server'], a: 2, why: 'SQL/Exchange จองและจัดการ memory pool ของตัวเอง Dynamic Memory จะไปแย่งคืนทำให้ประสิทธิภาพตกอย่างมาก' },
      ],
      labs: [{
        id: 'win-l4-ops',
        title: 'Lab 4 — เตรียม Host และตรวจสอบระบบ',
        brief: 'เตรียมเซิร์ฟเวอร์ให้พร้อมทำ virtualization และ HA พร้อมตรวจสอบสถานะระบบตาม checklist',
        device: 'windows',
        tasks: [
          { t: 'เปลี่ยนชื่อเครื่องเป็น <code>SRV-HV01</code>', hint: 'Rename-Computer -NewName SRV-HV01', check: s => s.hostname === 'SRV-HV01' },
          { t: 'ติดตั้ง role <code>Hyper-V</code>', hint: 'Install-WindowsFeature -Name Hyper-V -IncludeManagementTools', check: s => s.features.has('Hyper-V') },
          { t: 'ติดตั้ง feature <code>Windows-Server-Backup</code>', hint: 'Install-WindowsFeature -Name Windows-Server-Backup', check: s => s.features.has('Windows-Server-Backup') },
          { t: 'ตรวจสอบข้อมูลเครื่อง (CPU/RAM/OS)', hint: 'Get-ComputerInfo หรือ systeminfo', check: (s, h) => h.some(c => /get-computerinfo|systeminfo/i.test(c)) },
          { t: 'ตรวจสอบดิสก์และ volume', hint: 'Get-Disk แล้ว Get-Volume', check: (s, h) => h.some(c => /get-disk/i.test(c)) && h.some(c => /get-volume/i.test(c)) },
          { t: 'ดู Security event log ล่าสุด', hint: 'Get-EventLog -LogName Security', check: (s, h) => h.some(c => /get-eventlog|get-winevent/i.test(c)) },
          { t: 'ตรวจสอบ firewall profile', hint: 'Get-NetFirewallProfile', check: (s, h) => h.some(c => /get-netfirewallprofile/i.test(c)) },
          { t: 'สร้าง local user <code>svc-backup</code>', hint: 'New-LocalUser -Name svc-backup', check: s => !!s.localUsers['svc-backup'] },
          { t: 'ตรวจสอบสถานะ service <code>WinRM</code>', hint: 'Get-Service -Name WinRM', check: (s, h) => h.some(c => /get-service.*winrm/i.test(c)) },
        ],
      }],
    },

    // =========================================================
    5: {
      title: 'ออกแบบ AD ระดับองค์กรและ Automation',
      objectives: [
        'ออกแบบ forest/domain/site ให้เหมาะกับองค์กร',
        'วางระบบ Tiered Administration ป้องกัน credential theft',
        'ออกแบบ DR plan และทดสอบ forest recovery',
        'ทำ automation ด้วย PowerShell และ configuration as code',
      ],
      sections: [
        {
          t: 'ออกแบบ Forest, Domain และ Sites',
          h: `
<div class="note"><b>หลักคิดที่ Microsoft แนะนำในปัจจุบัน:</b> องค์กรส่วนใหญ่ควรมี <b>forest เดียว domain เดียว</b> แล้วใช้ OU ในการแบ่งการจัดการ — ไม่ใช่การแตก domain เพิ่ม</div>
<table class="tbl">
<tr><th>ควรแตก domain/forest เพิ่มเมื่อ</th><th>เหตุผล</th></tr>
<tr><td>ต้องการ security boundary จริง ๆ</td><td>forest คือ security boundary ไม่ใช่ domain</td></tr>
<tr><td>ข้อกำหนดกฎหมาย/ข้อมูลแยกประเทศ</td><td>data residency</td></tr>
<tr><td>ควบรวมกิจการชั่วคราว</td><td>ใช้ forest trust ระหว่างกันก่อนรวมภายหลัง</td></tr>
</table>
<p><b>Sites และ Replication</b> — บอก AD ว่าเครื่องไหนอยู่ที่ไหนและลิงก์ระหว่างที่ตั้งเป็นอย่างไร</p>
<pre class="code">New-ADReplicationSite -Name "BKK-HQ"
New-ADReplicationSite -Name "CNX-Branch"
New-ADReplicationSubnet -Name "192.168.10.0/24" -Site "BKK-HQ"
New-ADReplicationSubnet -Name "192.168.20.0/24" -Site "CNX-Branch"
New-ADReplicationSiteLink -Name "HQ-Branch" -SitesIncluded BKK-HQ,CNX-Branch \`
  -Cost 100 -ReplicationFrequencyInMinutes 30

repadmin /replsummary          <span style="color:#5b6b8c"># สรุปสถานะ replication</span>
repadmin /showrepl
dcdiag /v                      <span style="color:#5b6b8c"># ตรวจสุขภาพ DC แบบครบ</span></pre>
<div class="note warn"><b>ถ้าไม่ประกาศ subnet ใน site</b> client จะสุ่มหา DC ที่ไหนก็ได้ในองค์กร รวมถึงข้ามจังหวัด — ทำให้ล็อกอินช้าและ WAN link เต็มโดยไม่จำเป็น เป็นสาเหตุอันดับต้น ๆ ของ "ล็อกอินช้าที่สาขา"</div>
<p><b>FSMO Roles ทั้ง 5</b> — บทบาทที่มีได้ตัวเดียวใน forest/domain</p>
<table class="tbl">
<tr><th>บทบาท</th><th>ขอบเขต</th><th>ถ้าล่มจะกระทบ</th></tr>
<tr><td>Schema Master</td><td>Forest</td><td>แก้ schema ไม่ได้ (นาน ๆ ใช้ที)</td></tr>
<tr><td>Domain Naming Master</td><td>Forest</td><td>เพิ่ม/ลบ domain ไม่ได้</td></tr>
<tr><td>PDC Emulator</td><td>Domain</td><td><b>กระทบมากสุด</b> — เวลา, account lockout, การเปลี่ยนรหัสผ่าน</td></tr>
<tr><td>RID Master</td><td>Domain</td><td>สร้าง object ใหม่ไม่ได้เมื่อ RID pool หมด</td></tr>
<tr><td>Infrastructure Master</td><td>Domain</td><td>การอ้างอิง object ข้ามโดเมนไม่อัปเดต</td></tr>
</table>`,
        },
        {
          t: 'Tiered Administration Model',
          h: `
<p>แบ่งชั้นบัญชีผู้ดูแลเพื่อไม่ให้ credential ของ Tier สูงไปโผล่บนเครื่องของ Tier ต่ำ ซึ่งเป็นเส้นทางที่ ransomware ใช้ยกระดับสิทธิ์</p>
<table class="tbl">
<tr><th>Tier</th><th>ควบคุมอะไร</th><th>ล็อกอินได้ที่ไหน</th></tr>
<tr><td><b>Tier 0</b></td><td>Domain Controller, AD, PKI, ระบบ identity</td><td>เฉพาะเครื่อง Tier 0 (PAW)</td></tr>
<tr><td><b>Tier 1</b></td><td>Server, application, database</td><td>เฉพาะเซิร์ฟเวอร์ Tier 1</td></tr>
<tr><td><b>Tier 2</b></td><td>Workstation ผู้ใช้, helpdesk</td><td>เฉพาะเครื่องผู้ใช้</td></tr>
</table>
<div class="note"><b>กฎที่ห้ามละเมิด:</b> บัญชี Tier 0 ต้องไม่เคยล็อกอินบนเครื่อง Tier 1/2 เลย เพราะเมื่อล็อกอินแล้ว credential จะค้างในหน่วยความจำ ถ้าเครื่องนั้นถูกยึด ผู้โจมตีจะได้สิทธิ์ Domain Admin ทันที (pass-the-hash)</div>
<p><b>เครื่องมือที่ควรใช้ควบคู่:</b></p>
<ul>
  <li><b>PAW</b> (Privileged Access Workstation) — เครื่องเฉพาะสำหรับงาน admin ไม่ใช้เปิดเว็บหรืออีเมล</li>
  <li><b>LAPS</b> — รหัส local admin ต่างกันทุกเครื่องและหมุนอัตโนมัติ</li>
  <li><b>Protected Users group</b> — บล็อก NTLM และ credential delegation สำหรับบัญชีสำคัญ</li>
  <li><b>Just-In-Time / PIM</b> — ให้สิทธิ์ admin เฉพาะช่วงเวลาที่ขอ แล้วถอนอัตโนมัติ</li>
  <li><b>MFA</b> สำหรับทุกการเข้าถึงระดับ admin</li>
</ul>`,
        },
        {
          t: 'Disaster Recovery และ Automation',
          h: `
<p><b>AD Forest Recovery</b> — สถานการณ์ที่ทุก DC เสียหาย (เช่นโดน ransomware ทั้งองค์กร)</p>
<ol>
  <li>เลือก DC หนึ่งตัวมา restore จาก system state backup ที่รู้ว่าสะอาด</li>
  <li>ทำ <b>authoritative restore</b> ของ SYSVOL</li>
  <li>ตัด DC ตัวนั้นออกจากเครือข่าย ทำความสะอาด metadata ของ DC ตัวอื่นทั้งหมด</li>
  <li>ยกระดับ DC ใหม่จากตัวที่กู้แล้ว แล้วค่อย ๆ ต่อกลับเข้าเครือข่าย</li>
  <li>รีเซ็ตรหัส krbtgt <b>สองครั้ง</b> (ระยะห่างเกิน tombstone lifetime) เพื่อตัด golden ticket</li>
</ol>
<div class="note warn"><b>ต้องมีเอกสาร forest recovery plan ที่พิมพ์ออกมาเก็บแบบ offline</b> — ตอนเกิดเหตุจริง คุณอาจเปิด SharePoint หรือ Wiki ที่เก็บเอกสารไม่ได้เลย เพราะมันก็อยู่ในระบบที่ล่มไปด้วย</div>
<pre class="code"><span style="color:#5b6b8c"># --- Automation: สร้าง user จำนวนมากจาก CSV ---</span>
Import-Csv C:\\newusers.csv | ForEach-Object {
  New-ADUser -Name $_.Name -SamAccountName $_.SamAccountName \`
    -UserPrincipalName "$($_.SamAccountName)@corp.local" \`
    -Path $_.OU -AccountPassword (ConvertTo-SecureString $_.Password -AsPlainText -Force) \`
    -Enabled $true
  Add-ADGroupMember -Identity $_.Group -Members $_.SamAccountName
}

<span style="color:#5b6b8c"># --- รายงานบัญชีที่ไม่ได้ใช้เกิน 90 วัน ---</span>
$cutoff = (Get-Date).AddDays(-90)
Get-ADUser -Filter {LastLogonDate -lt $cutoff -and Enabled -eq $true} \`
  -Properties LastLogonDate |
  Select-Object Name,SamAccountName,LastLogonDate |
  Export-Csv C:\\stale-accounts.csv -NoTypeInformation

<span style="color:#5b6b8c"># --- จัดการหลายเครื่องพร้อมกัน ---</span>
Invoke-Command -ComputerName SRV01,SRV02,SRV03 -ScriptBlock {
  Get-Service -Name Spooler | Select-Object MachineName,Status
}</pre>
<table class="tbl">
<tr><th>เครื่องมือ</th><th>ใช้ทำอะไร</th></tr>
<tr><td>PowerShell DSC</td><td>ประกาศสถานะที่ต้องการ ระบบรักษาให้เป็นแบบนั้นเสมอ</td></tr>
<tr><td>Ansible</td><td>จัดการ Windows + Linux ด้วยเครื่องมือเดียว (ผ่าน WinRM)</td></tr>
<tr><td>Git</td><td>เก็บ script และ config ทั้งหมด มี history ว่าใครแก้อะไรเมื่อไร</td></tr>
<tr><td>Intune / SCCM</td><td>จัดการ endpoint และ patch ทั้งองค์กร</td></tr>
</table>`,
        },
      ],
      quiz: [
        { type: 'mcq', q: 'อะไรคือ security boundary ที่แท้จริงใน Active Directory', opts: ['OU', 'Domain', 'Forest', 'Site'], a: 2, why: 'Domain เป็นแค่ขอบเขตการจัดการ — ผู้ที่เป็น admin ใน domain หนึ่งสามารถยกระดับสิทธิ์ข้าม domain ใน forest เดียวกันได้ ดังนั้นการแยกความปลอดภัยจริงต้องแยก forest' },
        { type: 'mcq', q: 'FSMO role ใดที่ล่มแล้วกระทบผู้ใช้ทันทีมากที่สุด', opts: ['Schema Master', 'Domain Naming Master', 'PDC Emulator', 'Infrastructure Master'], a: 2, why: 'PDC Emulator ดูแลการ sync เวลา, account lockout, การเปลี่ยนรหัสผ่าน และเป็นตัวสำรองสำหรับการ authenticate — ล่มแล้วรู้สึกได้ทันที' },
        { type: 'mcq', q: 'ทำไมต้องประกาศ subnet ให้กับแต่ละ AD site', opts: ['เพื่อความสวยงามของ console', 'เพื่อให้ client รู้ว่าควรใช้ DC ตัวไหนที่ใกล้ที่สุด ไม่ต้องข้าม WAN', 'เพื่อกำหนด IP ให้ client', 'ไม่จำเป็นต้องประกาศ'], a: 1, why: 'ถ้าไม่ประกาศ client จะสุ่มหา DC ที่ไหนก็ได้ ทำให้ล็อกอินช้าและ WAN link เต็ม — เป็นสาเหตุยอดฮิตของ "ล็อกอินช้าที่สาขา"' },
        { type: 'mcq', q: 'หลักการสำคัญที่สุดของ Tiered Administration Model คืออะไร', opts: ['ใช้รหัสผ่านยาว', 'บัญชี Tier 0 ต้องไม่ล็อกอินบนเครื่อง Tier 1/2 เพื่อไม่ให้ credential ค้างในหน่วยความจำ', 'เปลี่ยนรหัสทุก 30 วัน', 'ใช้ VPN เสมอ'], a: 1, why: 'เมื่อ Domain Admin ล็อกอินบนเครื่องผู้ใช้ที่ถูกยึดแล้ว ผู้โจมตีจะดึง credential ไปใช้ต่อได้ทันที (pass-the-hash) — นี่คือเส้นทางมาตรฐานของ ransomware' },
        { type: 'mcq', q: 'ในกระบวนการ forest recovery ทำไมต้องรีเซ็ตรหัส krbtgt สองครั้ง', opts: ['เพราะครั้งเดียวไม่พอตามข้อกำหนด', 'เพื่อทำให้ Kerberos ticket เก่า (รวมถึง golden ticket ของผู้โจมตี) ใช้ไม่ได้อีกอย่างสมบูรณ์', 'เพื่อ sync กับ DC ตัวอื่น', 'เพื่อล้าง cache'], a: 1, why: 'AD เก็บรหัส krbtgt เวอร์ชันปัจจุบันและก่อนหน้า — ต้องรีเซ็ตสองครั้ง (เว้นระยะให้ replicate เสร็จ) จึงจะตัด ticket เก่าได้ทั้งหมด' },
        { type: 'multi', q: 'เครื่องมือ/แนวทางใดช่วยป้องกัน credential theft (เลือกทุกข้อที่ถูก)', opts: ['LAPS', 'Privileged Access Workstation (PAW)', 'Protected Users group', 'ใช้บัญชี Domain Admin เดียวกันทุกเครื่องเพื่อความสะดวก'], a: [0, 1, 2], why: 'การใช้บัญชีเดียวทุกที่คือสิ่งที่ทำให้ผู้โจมตียึดเครื่องเดียวแล้วได้ทั้งองค์กร' },
        { type: 'mcq', q: 'องค์กรขนาดกลางที่มี 3 สาขาในประเทศเดียวกัน ควรออกแบบ AD อย่างไร', opts: ['3 forest แยกกัน', '1 forest 3 domain', '1 forest 1 domain แล้วใช้ OU และ Sites แบ่ง', 'ไม่ใช้ AD เลย'], a: 2, why: 'การแตก domain เพิ่มความซับซ้อนโดยไม่ได้เพิ่มความปลอดภัย — ใช้ OU สำหรับ delegation และ Sites สำหรับ replication ก็เพียงพอ' },
        { type: 'mcq', q: 'ทำไมเอกสาร forest recovery plan ควรพิมพ์เก็บแบบ offline', opts: ['เพื่อความเป็นทางการ', 'เพราะตอนเกิดเหตุจริง ระบบที่เก็บเอกสาร (SharePoint/Wiki) อาจล่มไปพร้อมกัน', 'เพื่อความรวดเร็วในการอ่าน', 'ตามข้อกำหนด ISO'], a: 1, why: 'เอกสารกู้ระบบที่เก็บอยู่ในระบบที่ต้องกู้ = ไม่มีเอกสาร — ต้องมีสำเนา offline ที่เข้าถึงได้เสมอ' },
      ],
      labs: [{
        id: 'win-l5-enterprise',
        title: 'Lab 5 — จัดโครงสร้างองค์กรและบัญชีผู้ดูแล',
        brief: 'จัดโครงสร้าง OU ตามแบบ tiered model สร้างบัญชีผู้ดูแลแยกชั้น และเตรียม service account',
        device: 'windows',
        tasks: [
          { t: 'สร้าง forest <code>corp.local</code>', hint: 'Install-WindowsFeature -Name AD-Domain-Services → Install-ADDSForest -DomainName corp.local', check: s => s.domain === 'corp.local' },
          { t: 'สร้าง OU ชื่อ <code>Tier0</code>', hint: 'New-ADOrganizationalUnit -Name "Tier0"', check: s => s.adOUs.some(o => String(o).toLowerCase() === 'tier0') },
          { t: 'สร้าง OU ชื่อ <code>Tier1</code>', hint: 'New-ADOrganizationalUnit -Name "Tier1"', check: s => s.adOUs.some(o => String(o).toLowerCase() === 'tier1') },
          { t: 'สร้าง OU ชื่อ <code>Tier2</code>', hint: 'New-ADOrganizationalUnit -Name "Tier2"', check: s => s.adOUs.some(o => String(o).toLowerCase() === 'tier2') },
          { t: 'สร้าง user <code>t0-admin</code> และเปิดใช้งาน', hint: 'New-ADUser -Name "Tier0 Admin" -SamAccountName t0-admin -Enabled $true', check: s => s.adUsers['t0-admin'] && s.adUsers['t0-admin'].enabled },
          { t: 'สร้าง user <code>t1-admin</code> และเปิดใช้งาน', hint: 'New-ADUser -Name "Tier1 Admin" -SamAccountName t1-admin -Enabled $true', check: s => s.adUsers['t1-admin'] && s.adUsers['t1-admin'].enabled },
          { t: 'สร้างกลุ่ม <code>Tier0-Admins</code>', hint: 'New-ADGroup -Name "Tier0-Admins" -GroupScope Global', check: s => Object.keys(s.adGroups).some(g => g.toLowerCase() === 'tier0-admins') },
          { t: 'เพิ่ม <code>t0-admin</code> เข้ากลุ่ม <code>Tier0-Admins</code>', hint: 'Add-ADGroupMember -Identity "Tier0-Admins" -Members t0-admin', check: s => { const g = Object.keys(s.adGroups).find(x => x.toLowerCase() === 'tier0-admins'); return g && s.adGroups[g].includes('t0-admin'); } },
          { t: 'ตรวจสอบรายชื่อ AD user ทั้งหมด', hint: 'Get-ADUser -Filter *', check: (s, h) => h.some(c => /get-aduser/i.test(c)) },
          { t: 'ตรวจสอบสมาชิกของกลุ่ม <code>Tier0-Admins</code>', hint: 'Get-ADGroupMember -Identity "Tier0-Admins"', check: (s, h) => h.some(c => /get-adgroupmember/i.test(c)) },
        ],
      }],
    },
  },
};
