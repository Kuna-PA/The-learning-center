# วิธีติดตั้ง — ASD ACADEMY

โปรเจกต์นี้ **ไม่มี dependency ภายนอกเลย** และ **ไม่ต้อง build**
ของที่ใช้ทั้งหมดติดมากับ Node เองอยู่แล้ว (`node:http`, `node:sqlite`, `node:crypto`, `node:test`)
ดังนั้นการติดตั้งคือ "ลง Node → เอาไฟล์มาวาง → สั่งรัน" เท่านั้น

> เหมาะกับเครือข่ายปิดด้วย เพราะหลังคัดลอกไฟล์เข้ามาแล้วไม่ต้องต่อเน็ตอีก
> ไม่มีการโหลด package และตัวเว็บเรียกแค่ฟอนต์จาก Google Fonts ซึ่งไม่มีก็ยังใช้งานได้ปกติ

---

## 1. สิ่งที่ต้องมี

| | ต้องการ | ตรวจด้วย |
|---|---|---|
| Node.js | **22.5.0 ขึ้นไป · แนะนำ 24 LTS** | `node -v` |
| พื้นที่ดิสก์ | ~30 MB (โค้ด) + ฐานข้อมูลที่โตตามจำนวนผู้เรียน | |
| เบราว์เซอร์ | Chrome / Edge / Firefox รุ่นใหม่ | |

ทำไมต้อง 22.5 ขึ้นไป — เพราะใช้ `node:sqlite` ซึ่งเป็นโมดูลฐานข้อมูลที่ติดมากับ Node เอง
Node รุ่นเก่ากว่านี้จะไม่มีโมดูลนี้ และเซิร์ฟเวอร์จะตายทันทีตอนสตาร์ตด้วย
`Cannot find module 'node:sqlite'` — **Node 20 ใช้ไม่ได้** ถึงจะเป็น LTS ก็ตาม

ทำไมแนะนำ 24 — เพราะ `npm run backup` ใช้ `backup()` ของ `node:sqlite` ซึ่งเพิ่มเข้ามาทีหลัง
`DatabaseSync` พอสมควร Node 22 รุ่นแรก ๆ จะมีฐานข้อมูลแต่สำรองแบบไม่ต้องหยุดเซิร์ฟเวอร์ไม่ได้
(สคริปต์จะฟ้องให้ชัดเองถ้าเจอกรณีนี้ ไม่ได้พังเงียบ ๆ)

### ติดตั้ง Node บน Windows

โหลดตัวติดตั้ง **Windows Installer (.msi) รุ่น LTS** จาก <https://nodejs.org>
กด Next ไปตามค่าเริ่มต้นได้เลย (ไม่ต้องติ๊ก "Tools for Native Modules")
แล้วเปิด PowerShell **หน้าต่างใหม่** เพื่อให้ PATH อัปเดต

```powershell
node -v
```

### ติดตั้ง Node บน Ubuntu / Debian

**อย่าใช้ `apt install nodejs` เฉย ๆ** เพราะคลังของ Ubuntu ยังเป็นรุ่นเก่า (18 หรือ 20) ซึ่งใช้ไม่ได้
ให้เพิ่มคลังของ NodeSource ก่อน:

```bash
curl -fsSL https://deb.nodesource.com/setup_24.x -o /tmp/nodesource_setup.sh
```

เปิดอ่านก่อนรันได้ (สคริปต์นี้รันด้วยสิทธิ์ root — ควรดูสักหน่อยว่าทำอะไรบ้าง):

```bash
less /tmp/nodesource_setup.sh
```

```bash
sudo -E bash /tmp/nodesource_setup.sh
```

```bash
sudo apt-get install -y nodejs
```

แพ็กเกจ `nodejs` ของ NodeSource มี `npm` มาด้วยแล้ว ไม่ต้องลงแยก

> ถ้าไม่อยากใช้ sudo หรือต้องสลับหลายเวอร์ชันบนเครื่องเดียว ให้ใช้ [nvm](https://github.com/nvm-sh/nvm)
> แล้วสั่ง `nvm install 24` แทน — แต่ถ้าจะตั้งเป็น service ด้วย systemd ควรลงแบบ NodeSource
> เพราะ systemd มองไม่เห็น node ที่อยู่ใน nvm ของผู้ใช้

ตรวจผล — ต้องขึ้นเลขตั้งแต่ `v22.5.0` ขึ้นไป:

```bash
node -v
```

---

## 2. เอาไฟล์โปรเจกต์มาวาง

### แบบ A — git (ได้อัปเดตง่ายกว่า)

บน Windows:

```powershell
git clone https://github.com/Kuna-PA/The-learning-center.git "D:\Projects\Learning Center"
```

บน Ubuntu:

```bash
sudo apt-get install -y git
```

```bash
sudo git clone https://github.com/Kuna-PA/The-learning-center.git /opt/asd-academy
```

```bash
sudo chown -R $USER:$USER /opt/asd-academy
```

### แบบ B — ไม่มี git / เครือข่ายปิด

ดาวน์โหลด ZIP จากหน้า repo (ปุ่ม **Code → Download ZIP**) หรือคัดลอกโฟลเดอร์ทั้งก้อน
มาจากเครื่องที่มีอยู่แล้ว แล้วแตกไฟล์ไว้ที่ไหนก็ได้ เช่น `D:\Projects\Learning Center`

> ถ้าคัดลอกจากเครื่องอื่น **ไม่ต้องเอาโฟลเดอร์ `data-db\` และ `backup\` มาด้วย**
> นั่นคือฐานข้อมูลผู้ใช้ของเครื่องนั้น เครื่องใหม่จะสร้างของตัวเองให้อัตโนมัติ

### ไม่ต้อง `npm install`

`dependencies` ว่างเปล่า สั่งก็ได้แต่ไม่มีอะไรให้ลง และไม่ต้องมี `node_modules\` ก็รันได้

---

## 3. สั่งรัน

```powershell
cd "D:\Projects\Learning Center"
```

```powershell
npm start
```

จะได้ข้อความแบบนี้:

```
ASD ACADEMY พร้อมใช้งานที่  http://localhost:5173
ฐานข้อมูล: D:\Projects\Learning Center\data-db\learning-center.db

  สร้างบัญชีผู้ดูแลระบบให้แล้ว:
    ชื่อผู้ใช้ : admin
    รหัสผ่าน  : tFdUhyj4wxp7
    รหัสนี้แสดงครั้งเดียวเท่านั้น และต้องเปลี่ยนทันทีที่ล็อกอินครั้งแรก
```

แล้วเปิดเบราว์เซอร์ไปที่ <http://localhost:5173>

> ⚠️ **ต้องเปิดผ่าน `http://` เท่านั้น** — ดับเบิลคลิก `index.html` ให้เป็น `file://` จะไม่ทำงาน
> เพราะหน้าเว็บใช้ ES Modules และ service worker ซึ่งเบราว์เซอร์ไม่อนุญาตบน `file://`

### ล็อกอินครั้งแรก

1. **คัดลอกรหัสผ่านจากหน้าจอ console ไว้ก่อน** — มันแสดงครั้งเดียวจริง ๆ (ไม่ได้เก็บไว้ที่ไหนเลย)
2. ล็อกอินด้วย `admin` + รหัสนั้น
3. ระบบจะบังคับให้ตั้งรหัสใหม่ทันที (อย่างน้อย 8 ตัวอักษร) ยังทำอะไรอื่นไม่ได้จนกว่าจะตั้งเสร็จ

ถ้าเผลอปิดหน้าต่างไปก่อนคัดลอกรหัส ไม่ต้องลบฐานข้อมูล — หยุดเซิร์ฟเวอร์แล้วสั่ง:

```powershell
npm run reset-password -- admin
```

จะสุ่มรหัสใหม่ให้พร้อมพิมพ์ออกมา (ระบุรหัสเองได้ด้วย `npm run reset-password -- admin 'รหัสที่ต้องการ'`)
คำสั่งนี้ต้องรันบนเครื่องเซิร์ฟเวอร์เพราะต้องเข้าถึงไฟล์ฐานข้อมูลโดยตรง

### ตั้งรหัส admin เองตั้งแต่แรก

```powershell
$env:LC_ADMIN_PASSWORD = 'รหัสที่ต้องการอย่างน้อย8ตัว'; npm start
```

สั้นกว่า 8 ตัวจะถูกมองข้ามแล้วสุ่มให้แทน (บอกไว้ใน console)
ตัวแปรนี้มีผล **เฉพาะตอนสร้างบัญชีครั้งแรก** ตั้งทีหลังไม่เปลี่ยนรหัสของ admin ที่มีอยู่แล้ว

### ให้คนอื่นในวงเข้ามาใช้ด้วย

เซิร์ฟเวอร์ฟังทุก interface อยู่แล้ว คนอื่นเข้าที่ `http://<ไอพีเครื่องนี้>:5173` ได้เลย

```powershell
ipconfig | Select-String IPv4
```

ครั้งแรก Windows Firewall จะถามว่าจะอนุญาตให้ Node รับการเชื่อมต่อไหม — ตอบ **Allow** สำหรับ Private network
(ถ้าเผลอกด Cancel ไปแล้ว เปิด Windows Defender Firewall → Allow an app → หา Node.js แล้วติ๊ก Private)

---

## 4. ตัวแปรแวดล้อม

| ตัวแปร | ค่าเริ่มต้น | ใช้ทำอะไร |
|---|---|---|
| `PORT` | `5173` | พอร์ตที่เปิดฟัง |
| `LC_DATA_DIR` | `.\data-db` | โฟลเดอร์ที่เก็บไฟล์ฐานข้อมูล · ย้ายไปไดรฟ์อื่นหรือ volume ได้ |
| `LC_ADMIN_PASSWORD` | สุ่มให้ | รหัส admin ตอนสร้างครั้งแรกเท่านั้น · สั้นกว่า 8 ตัวจะสุ่มให้แทน |
| `LC_OPEN_REGISTER` | `1` | เปิดให้คนนอกกดสมัครเองได้ · **ตั้ง `0` เมื่อเอาขึ้นอินเทอร์เน็ต** แล้วให้ admin เป็นคนสร้างบัญชี |
| `LC_SECURE_COOKIE` | ตรวจเอง | `1` = บังคับติด `Secure` ที่คุกกี้ (ใช้เมื่อ reverse proxy ไม่ส่ง `X-Forwarded-Proto`) · `0` = ปิด |
| `LC_TRUST_PROXY` | `0` | `1` = เชื่อ `X-Forwarded-For` ตอนนับการเดารหัส — **เปิดเฉพาะเมื่อมี reverse proxy จริง** ไม่งั้นคนยิงปลอม IP หนีการล็อกได้ |

ตั้งหลายตัวพร้อมกันใน PowerShell:

```powershell
$env:PORT = '8080'; $env:LC_OPEN_REGISTER = '0'; $env:LC_DATA_DIR = 'E:\lc-data'; npm start
```

> ค่าที่ตั้งด้วย `$env:` อยู่แค่ในหน้าต่าง PowerShell นั้น ปิดแล้วหาย
> ถ้าอยากให้ติดถาวร ให้ตั้งตอนสร้าง service ในหัวข้อถัดไป

บน Linux / macOS:

```bash
PORT=8080 LC_OPEN_REGISTER=0 npm start
```

---

## 5. คำสั่งที่ใช้บ่อย

| คำสั่ง | ทำอะไร |
|---|---|
| `npm start` | รันเซิร์ฟเวอร์ |
| `npm run dev` | รันแบบรีสตาร์ตเองเมื่อแก้ไฟล์ (ตอนพัฒนา) |
| `npm test` | ชุดทดสอบทั้งหมด 233 เคส ใช้เวลา ~4 วินาที |
| `npm run validate` | ตรวจความถูกต้องของเนื้อหา (บทเรียน/ข้อสอบ/Lab) |
| `npm run backup` | สำรองฐานข้อมูลแบบไม่ต้องหยุดเซิร์ฟเวอร์ |
| `npm run reset-password -- admin` | ตั้งรหัสใหม่ให้ผู้ใช้ ตอนลืมรหัส admin (รันบนเครื่องเซิร์ฟเวอร์) |

ตรวจว่าเซิร์ฟเวอร์ยังดีอยู่ไหมจากที่ไหนก็ได้:

```powershell
Invoke-RestMethod http://localhost:5173/api/health
```

ได้ `ok`, จำนวนผู้ใช้, uptime และสถานะการเปิดสมัครกลับมา

---

## 6. ติดตั้งแบบใช้งานจริง (ให้รันค้างไว้เอง)

### Windows — ให้สตาร์ตเองตอนเปิดเครื่อง

วิธีที่ง่ายที่สุดและทนที่สุดคือทำเป็น **Windows Service ด้วย NSSM**
(ข้อดีกว่า Task Scheduler คือ service จะสตาร์ตก่อนมีคนล็อกอินเข้าเครื่อง และรีสตาร์ตเองเมื่อ process ตาย)

1. โหลด NSSM จาก <https://nssm.cc/download> แตกไฟล์แล้วเอา `nssm.exe` ไปวางไว้ เช่น `C:\Tools\nssm.exe`
2. เปิด PowerShell **แบบ Run as Administrator** แล้วสั่ง:

```powershell
C:\Tools\nssm.exe install AsdAcademy "C:\Program Files\nodejs\node.exe" "server.js"
```

```powershell
C:\Tools\nssm.exe set AsdAcademy AppDirectory "D:\Projects\Learning Center"
```

```powershell
C:\Tools\nssm.exe set AsdAcademy AppEnvironmentExtra PORT=5173 LC_OPEN_REGISTER=0 LC_DATA_DIR=E:\lc-data
```

```powershell
C:\Tools\nssm.exe set AsdAcademy AppStdout "E:\lc-data\service.log"
```

```powershell
C:\Tools\nssm.exe start AsdAcademy
```

ครั้งแรกให้ไปอ่านรหัส admin ที่สุ่มให้ในไฟล์ log:

```powershell
Get-Content E:\lc-data\service.log -Encoding utf8
```

จัดการ service ภายหลัง:

```powershell
C:\Tools\nssm.exe restart AsdAcademy
```

```powershell
C:\Tools\nssm.exe remove AsdAcademy confirm
```

> **ทางเลือกแบบไม่ลงอะไรเพิ่ม** — Task Scheduler: สร้าง task ที่ trigger *At startup*,
> ตั้ง Run whether user is logged on or not, Action = `node.exe`, Arguments = `server.js`,
> Start in = โฟลเดอร์โปรเจกต์ แต่จะไม่ได้การรีสตาร์ตอัตโนมัติเหมือน NSSM

### Linux — systemd

```ini
# /etc/systemd/system/asd-academy.service
[Unit]
Description=ASD ACADEMY
After=network.target

[Service]
Type=simple
User=lc
WorkingDirectory=/opt/asd-academy
ExecStart=/usr/bin/node server.js
Environment=PORT=5173
Environment=LC_OPEN_REGISTER=0
Environment=LC_DATA_DIR=/var/lib/asd-academy
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now asd-academy
sudo journalctl -u asd-academy -n 50    # อ่านรหัส admin ครั้งแรกที่นี่
```

### Docker

มี `Dockerfile` · `docker-compose.yml` · `.dockerignore` ให้พร้อมใช้ในโปรเจกต์แล้ว
สั่งครั้งเดียวจบ:

```bash
docker compose up -d --build
```

**รหัส admin ครั้งแรกอยู่ใน log และแสดงครั้งเดียว** — อ่านทันที:

```bash
docker compose logs
```

| | ตั้งค่าไว้อย่างไร |
|---|---|
| ฐาน image | `node:24-alpine` — ต้อง 24 เพราะ `backup()` ของ `node:sqlite` เพิ่มมาทีหลัง 22.5 |
| ขนาด | ~250 MB · ชั้นเดียว ไม่มี build step เพราะโปรเจกต์ไม่มี dependency |
| ผู้ใช้ที่รัน | `node` (uid 1000) **ไม่ใช่ root** · `/app` เป็นของ root แอปจึงแก้โค้ดตัวเองไม่ได้ |
| ข้อมูล | volume `asd-data` ที่ `/data` — ลบ container ทิ้งข้อมูลยังอยู่ |
| ไฟล์สำรอง | `/data/backup/` คืออยู่ใน volume เดียวกับข้อมูล ไม่หายไปกับ container |
| healthcheck | เรียก `/api/health` ทุก 30 วินาที (ใช้ `node` ตรวจเอง เพราะ alpine ไม่มี curl) |
| สมัครเอง | ปิดไว้ (`LC_OPEN_REGISTER=0`) ให้ผู้ดูแลเป็นคนสร้างบัญชี |

ตั้งรหัส admin เองตั้งแต่แรก: แก้ `LC_ADMIN_PASSWORD` ใน `docker-compose.yml` ก่อนสั่ง up ครั้งแรก

เครื่องมือดูแลระบบใช้ใน container ได้ตามปกติ:

```bash
docker compose exec asd-academy npm run backup
```

```bash
docker compose exec asd-academy npm run reset-password -- admin
```

ดึงไฟล์สำรองออกมาเก็บนอกเครื่อง:

```bash
docker compose cp asd-academy:/data/backup ./backup-from-container
```

หยุดโดยข้อมูลยังอยู่ · และคำสั่งที่**ลบข้อมูลทิ้งทั้งหมด** (ระวัง):

```bash
docker compose down
```

```bash
docker compose down -v
```

> `-v` ลบ volume ด้วย = บัญชีผู้เรียนและความคืบหน้าหายหมด ใช้ตอนอยากเริ่มใหม่จริง ๆ เท่านั้น

อัปเดตเป็นโค้ดใหม่ — ข้อมูลไม่หายเพราะอยู่คนละที่กับ image:

```bash
git pull && docker compose up -d --build
```

### ครอบ HTTPS

เซิร์ฟเวอร์นี้พูด HTTP เปล่า ให้เอา reverse proxy ครอบ (nginx / Caddy / IIS ARR)
แล้ว proxy มาที่พอร์ตที่ตั้งไว้ พร้อมส่ง header ต่อไปนี้มาด้วย:

```nginx
proxy_set_header Host              $host;
proxy_set_header X-Real-IP         $remote_addr;
proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
```

แล้วตั้ง `LC_TRUST_PROXY=1` เพื่อให้การนับความพยายามเดารหัสเห็น IP จริงของผู้ใช้
(ถ้าไม่ตั้ง ทุกคนจะถูกนับรวมเป็น IP ของ proxy ตัวเดียว)

เมื่อขึ้นอินเทอร์เน็ตแล้วอย่าลืม:
- `LC_OPEN_REGISTER=0` — ไม่ให้คนนอกสมัครบัญชีเอง
- เปลี่ยนรหัส admin ให้เรียบร้อย
- เปิดพอร์ตเฉพาะที่ proxy ใช้ ไม่ต้อง expose พอร์ต 5173 ออกไปตรง ๆ

---

## 7. ฐานข้อมูล · สำรอง · กู้คืน · อัปเกรด

ข้อมูลทั้งหมด (บัญชีผู้ใช้, เซสชัน, ความคืบหน้า, เนื้อหาที่ admin เพิ่มเอง)
อยู่ในไฟล์เดียวที่ `data-db\learning-center.db`
ส่วน `-wal` และ `-shm` ข้าง ๆ คือไฟล์ประกอบของโหมด WAL

> ชื่อไฟล์ยังเป็น `learning-center.db` ตามเดิม **โดยตั้งใจ** — ตอนเปลี่ยนชื่อเว็บเป็น ASD ACADEMY
> ไม่ได้เปลี่ยนชื่อไฟล์นี้ด้วย เพราะจะทำให้ระบบมองไม่เห็นข้อมูลเดิมแล้วสร้างฐานข้อมูลเปล่าขึ้นมาใหม่
> ถ้าอยากเปลี่ยนจริง ๆ ต้อง checkpoint WAL ก่อนแล้วค่อยเปลี่ยนชื่อทั้งชุด ไม่ใช่เปลี่ยนแค่ `.db`

### สำรอง

```powershell
npm run backup
```

ได้ไฟล์ `backup\learning-center-YYYYMMDD-HHMM.db` — **ทำได้ขณะเซิร์ฟเวอร์ยังทำงาน**
เพราะใช้ backup API ของ SQLite เอง ไม่ใช่การ copy ไฟล์ดิบ

ระบุที่เก็บเองก็ได้:

```powershell
npm run backup -- "\\nas\backup\lc-$(Get-Date -Format yyyyMMdd).db"
```

ตั้งให้สำรองทุกคืนด้วย Task Scheduler:

```powershell
schtasks /create /tn "LC Backup" /tr "cmd /c cd /d \"D:\Projects\Learning Center\" && npm run backup" /sc daily /st 23:00
```

> ถ้าจะ copy ไฟล์ดิบเอง ให้**หยุดเซิร์ฟเวอร์ก่อน** แล้วคัดลอกทั้งสามไฟล์ (`.db`, `.db-wal`, `.db-shm`)
> คัดลอกแค่ `.db` ขณะเซิร์ฟเวอร์ยังรันอยู่ จะได้ข้อมูลไม่ครบ

### กู้คืน

หยุดเซิร์ฟเวอร์ → ลบ `learning-center.db*` ทั้งสามไฟล์ → เอาไฟล์สำรองมาวางแล้วเปลี่ยนชื่อเป็น
`learning-center.db` → สั่ง `npm start` ใหม่

### อัปเกรดเป็นเวอร์ชันใหม่

ฐานข้อมูลใช้ `CREATE TABLE IF NOT EXISTS` และสร้างตารางที่ยังไม่มีให้เองตอนสตาร์ต
ดังนั้นแค่เอาโค้ดใหม่มาทับก็พอ ข้อมูลเดิมไม่หาย

```powershell
npm run backup
```

```powershell
git pull
```

```powershell
npm test
```

```powershell
npm start
```

ถ้าคัดลอกไฟล์มาทับด้วยมือ **ระวังอย่าทับโฟลเดอร์ `data-db\`** และหลังอัปเดตให้ผู้ใช้
กด `Ctrl+Shift+R` หนึ่งครั้ง (หรือรอ toast แจ้งเวอร์ชันใหม่) เพื่อให้ service worker โหลดไฟล์ใหม่

---

## 8. ปัญหาที่พบบ่อย

| อาการ | สาเหตุ / วิธีแก้ |
|---|---|
| `Cannot find module 'node:sqlite'` | Node เก่ากว่า 22.5 — ตรวจ `node -v` แล้วอัปเกรด |
| `Error: listen EADDRINUSE :::5173` | พอร์ตชนกับโปรแกรมอื่น — รันด้วยพอร์ตอื่น `$env:PORT='5174'; npm start` หรือหาตัวที่ยึดพอร์ตด้วย `Get-NetTCPConnection -LocalPort 5173` |
| เปิดเว็บแล้วหน้าขาว | เปิดด้วย `file://` อยู่ — ต้องเข้าผ่าน `http://localhost:5173` |
| ลืม/ไม่ได้คัดลอกรหัส admin ที่สุ่มให้ | หยุดเซิร์ฟเวอร์ แล้วสั่ง `npm run reset-password -- admin` จะสุ่มรหัสใหม่ให้ ข้อมูลผู้เรียนไม่หาย · ถ้ามี admin อีกคนอยู่ ใช้บัญชีนั้นเข้าไปตั้งรหัสให้ที่ `#/admin/users` ก็ได้ |
| ล็อกอินผิดหลายครั้งแล้วถูกล็อก | ผิด 8 ครั้งต่อบัญชีจะล็อก 5 นาที (ต่อ IP 30 ครั้ง / 10 นาที) — รอให้ครบเวลา หรือรีสตาร์ตเซิร์ฟเวอร์เพราะตัวนับอยู่ในหน่วยความจำ |
| คนอื่นในวงเข้าไม่ได้ | Windows Firewall บล็อก — อนุญาต Node.js สำหรับ Private network |
| หน้าเว็บไม่อัปเดตหลังแก้ไฟล์ | service worker แคชไว้ — กด `Ctrl+Shift+R` หรือเพิ่มเลข `VERSION` ใน `sw.js` |
| ฟอนต์ไม่สวยในเครือข่ายปิด | เรียก Google Fonts ไม่ออก ระบบจะใช้ฟอนต์ของเครื่องแทน ใช้งานได้ปกติทุกอย่าง |
| อยากแจกให้ดูเล่นโดยไม่ตั้งเซิร์ฟเวอร์ | เอาขึ้น static hosting ได้ (Vercel / IIS / nginx) แอปจะสลับเป็น**โหมดออฟไลน์** เก็บข้อมูลใน localStorage ของเบราว์เซอร์แต่ละเครื่อง — ดูหัวข้อ Deploy ใน [README](README.md#-deploy) |

---

## ทำอะไรต่อ

- เพิ่มบัญชีผู้เรียน: ล็อกอินเป็น admin แล้วไปที่ `#/admin/users`
- เพิ่มบทเรียน/ข้อสอบ/Lab จากหน้าเว็บโดยไม่ต้องแตะโค้ด: `#/admin/content`
- ดูความคืบหน้าของผู้เรียนทุกคน: `#/admin`
- รายละเอียดเนื้อหา โครงสร้างโปรเจกต์ และวิธีเพิ่มเนื้อหาในโค้ด: [README.md](README.md)
