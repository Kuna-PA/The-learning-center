# วิธีติดตั้ง — ASD ACADEMY

ติดตั้งด้วย **Docker อย่างเดียว** — ไม่ต้องลง Node ไม่ต้องสนใจว่าเครื่องมี Node เวอร์ชันอะไร
และไม่ต้อง `npm install` เพราะทุกอย่างอยู่ใน image หมดแล้ว

> อยากรันแบบไม่ใช้ Docker ตอนพัฒนา ใช้ `npm start` ได้ (ต้องมี Node 22.5 ขึ้นไป) ดูใน [README](README.md)
> แต่สำหรับการ**ติดตั้งใช้งานจริง** ให้ใช้ Docker ตามคู่มือนี้

---

## 1. สิ่งที่ต้องมี

| | ต้องการ | ตรวจด้วย |
|---|---|---|
| Docker | รุ่นที่มี `docker compose` ในตัว | `docker --version` |
| พื้นที่ดิสก์ | ~700 MB (image + โค้ด) + ฐานข้อมูลที่โตตามจำนวนผู้เรียน | |
| เบราว์เซอร์ | Chrome / Edge / Firefox รุ่นใหม่ | |

```bash
docker --version && docker compose version
```

ถ้ายังไม่มี Docker — ลงด้วยสคริปต์ทางการของ Docker เอง:

```bash
curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
```

สคริปต์นี้รันด้วยสิทธิ์ root เปิดอ่านก่อนได้:

```bash
less /tmp/get-docker.sh
```

```bash
sudo sh /tmp/get-docker.sh
```

ให้ผู้ใช้ปัจจุบันสั่ง docker ได้โดยไม่ต้อง sudo:

```bash
sudo usermod -aG docker $USER && newgrp docker
```

> บน Windows / macOS ให้ลง **Docker Desktop** จาก <https://docker.com> แทน
> คำสั่งหลังจากนี้ใช้ได้เหมือนกันทุกระบบ

---

## 2. เอาไฟล์โปรเจกต์มาวาง

### แบบ A — git (อัปเดตง่ายกว่า)

```bash
sudo git clone https://github.com/Kuna-PA/The-learning-center.git /opt/asd-academy
```

```bash
sudo chown -R $USER:$USER /opt/asd-academy
```

### แบบ B — ไม่มี git / เครือข่ายปิด

ดาวน์โหลด ZIP จากหน้า repo (ปุ่ม **Code → Download ZIP**) หรือคัดลอกโฟลเดอร์ทั้งก้อนมาจากเครื่องที่มีอยู่แล้ว

> ถ้าคัดลอกจากเครื่องอื่น **ไม่ต้องเอาโฟลเดอร์ `data-db/` และ `backup/` มาด้วย**
> นั่นคือฐานข้อมูลผู้ใช้ของเครื่องนั้น เครื่องใหม่จะสร้างของตัวเองให้อัตโนมัติ

---

## 3. สั่งรัน

```bash
cd /opt/asd-academy && docker compose up -d --build
```

ครั้งแรกจะใช้เวลาสักพักเพราะต้องโหลด image ของ Node ครั้งต่อไปจะเร็วมาก

```bash
docker compose logs
```

จะได้ข้อความแบบนี้:

```
asd-academy  | ASD ACADEMY พร้อมใช้งานที่  http://localhost:5173
asd-academy  | ฐานข้อมูล: /data/learning-center.db
asd-academy  |
asd-academy  |   สร้างบัญชีผู้ดูแลระบบให้แล้ว:
asd-academy  |     ชื่อผู้ใช้ : admin
asd-academy  |     รหัสผ่าน  : xUywaHeu1Lmr
asd-academy  |     รหัสนี้แสดงครั้งเดียวเท่านั้น และต้องเปลี่ยนทันทีที่ล็อกอินครั้งแรก
```

แล้วเปิดเบราว์เซอร์ไปที่ <http://localhost:5173>

### ล็อกอินครั้งแรก

1. **คัดลอกรหัสผ่านจาก log ไว้ก่อน** — มันแสดงครั้งเดียวจริง ๆ (ไม่ได้เก็บไว้ที่ไหนเลย)
2. ล็อกอินด้วย `admin` + รหัสนั้น
3. ระบบจะบังคับให้ตั้งรหัสใหม่ทันที (อย่างน้อย 8 ตัวอักษร) ยังทำอะไรอื่นไม่ได้จนกว่าจะตั้งเสร็จ

ถ้าเผลอปิดไปก่อนคัดลอกรหัส ไม่ต้องลบอะไร — สั่งรีเซ็ตได้เลย:

```bash
docker compose exec asd-academy npm run reset-password -- admin
```

### ตั้งรหัส admin เองตั้งแต่แรก

แก้ `docker-compose.yml` เอาเครื่องหมาย `#` หน้าบรรทัด `LC_ADMIN_PASSWORD` ออกแล้วใส่รหัสที่ต้องการ
(ต้องยาว 8 ตัวขึ้นไป ไม่งั้นระบบจะสุ่มให้แทน) — ต้องทำ**ก่อน**สั่ง up ครั้งแรก
เพราะตัวแปรนี้มีผลเฉพาะตอนสร้างบัญชีครั้งแรกเท่านั้น

### ให้คนอื่นในวงเข้ามาใช้ด้วย

หาไอพีของเครื่อง:

```bash
hostname -I
```

แล้วให้ผู้อบรมเข้าที่ `http://<ไอพีเครื่องนี้>:5173`

ถ้าเปิดไฟร์วอลล์ไว้ ต้องเปิดพอร์ตก่อน:

```bash
sudo ufw allow 5173/tcp
```

---

## 4. ตัวแปรแวดล้อม

แก้ในส่วน `environment:` ของ `docker-compose.yml` แล้วสั่ง `docker compose up -d` ใหม่

| ตัวแปร | ค่าเริ่มต้น | ใช้ทำอะไร |
|---|---|---|
| `LC_OPEN_REGISTER` | `0` (ปิดไว้ใน compose) | `1` = เปิดให้คนนอกกดสมัครเองได้ |
| `LC_ADMIN_PASSWORD` | สุ่มให้ | รหัส admin ตอนสร้างครั้งแรกเท่านั้น · สั้นกว่า 8 ตัวจะสุ่มให้แทน |
| `LC_SECURE_COOKIE` | ตรวจเอง | `1` = บังคับติด `Secure` ที่คุกกี้ (ใช้เมื่อ reverse proxy ไม่ส่ง `X-Forwarded-Proto`) |
| `LC_TRUST_PROXY` | `0` | `1` = เชื่อ `X-Forwarded-For` ตอนนับการเดารหัส — **เปิดเฉพาะเมื่อมี reverse proxy จริง** ไม่งั้นคนยิงปลอม IP หนีการล็อกได้ |
| `PORT` · `LC_DATA_DIR` | `5173` · `/data` | ตั้งไว้ใน Dockerfile แล้ว ไม่ต้องแก้ |

เปลี่ยนพอร์ตที่เปิดออกนอกเครื่อง ให้แก้ฝั่งซ้ายของ `ports:` ใน compose เช่น `"8080:5173"`

---

## 5. คำสั่งที่ใช้บ่อย

| คำสั่ง | ทำอะไร |
|---|---|
| `docker compose up -d --build` | สร้างและรัน |
| `docker compose logs -f` | ดู log สด ๆ |
| `docker compose ps` | ดูสถานะและผล healthcheck |
| `docker compose restart` | รีสตาร์ต |
| `docker compose down` | หยุด · **ข้อมูลยังอยู่** |
| `docker compose exec asd-academy npm run backup` | สำรองฐานข้อมูล |
| `docker compose exec asd-academy npm run reset-password -- admin` | รีเซ็ตรหัสผู้ใช้ |

ตรวจว่าระบบยังดีอยู่ไหม:

```bash
curl -s http://localhost:5173/api/health
```

ได้ `ok`, จำนวนผู้ใช้, uptime และสถานะการเปิดสมัครกลับมา

> ⚠️ `docker compose down -v` จะ**ลบ volume ทิ้งด้วย** = บัญชีผู้เรียนและความคืบหน้าหายหมด
> ใช้ตอนอยากเริ่มใหม่จริง ๆ เท่านั้น

---

## 6. ครอบ HTTPS

container เปิดพอร์ต HTTP เปล่า ให้เอา reverse proxy (nginx / Caddy / Traefik) ครอบ
แล้ว proxy มาที่ `localhost:5173` พร้อมส่ง header ต่อไปนี้:

```nginx
proxy_set_header Host              $host;
proxy_set_header X-Real-IP         $remote_addr;
proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
```

แล้วตั้ง `LC_TRUST_PROXY: "1"` ใน compose เพื่อให้การนับความพยายามเดารหัสเห็น IP จริงของผู้ใช้
(ถ้าไม่ตั้ง ทุกคนจะถูกนับรวมเป็น IP ของ proxy ตัวเดียว)

เมื่อขึ้นอินเทอร์เน็ตแล้วอย่าลืม:
- `LC_OPEN_REGISTER` ต้องเป็น `0` — ไม่ให้คนนอกสมัครบัญชีเอง (ค่าเริ่มต้นเป็น 0 อยู่แล้ว)
- เปลี่ยนรหัส admin ให้เรียบร้อย
- ไม่ต้อง expose พอร์ต 5173 ออกไปตรง ๆ — แก้ `ports:` เป็น `"127.0.0.1:5173:5173"` ให้เข้าได้เฉพาะจากเครื่องเดียวกัน

---

## 7. ฐานข้อมูล · สำรอง · กู้คืน · อัปเกรด

ข้อมูลทั้งหมด (บัญชีผู้ใช้, เซสชัน, ความคืบหน้า, เนื้อหาที่ admin เพิ่มเอง) อยู่ใน
**volume ชื่อ `asd-data`** ที่ mount ไว้ที่ `/data` ใน container —
ไม่ได้อยู่ใน image ฉะนั้นลบ container ทิ้งหรือ build ใหม่ ข้อมูลก็ยังอยู่

> ชื่อไฟล์ยังเป็น `learning-center.db` ตามเดิม **โดยตั้งใจ** — ตอนเปลี่ยนชื่อเว็บเป็น ASD ACADEMY
> ไม่ได้เปลี่ยนชื่อไฟล์นี้ด้วย เพราะจะทำให้ระบบมองไม่เห็นข้อมูลเดิมแล้วสร้างฐานข้อมูลเปล่าขึ้นใหม่

### สำรอง

```bash
docker compose exec asd-academy npm run backup
```

ได้ไฟล์ใน `/data/backup/` ซึ่งอยู่ใน volume เดียวกับข้อมูล — **ทำได้ขณะเซิร์ฟเวอร์ยังทำงาน**
เพราะใช้ backup API ของ SQLite เอง ไม่ใช่การ copy ไฟล์ดิบ (ฐานข้อมูลเปิดโหมด WAL
การคัดลอกแค่ไฟล์ `.db` จะได้ข้อมูลไม่ครบ)

ดึงไฟล์สำรองออกมาเก็บนอกเครื่อง:

```bash
docker compose cp asd-academy:/data/backup ./backup-from-container
```

ตั้งให้สำรองทุกคืนด้วย cron:

```bash
(crontab -l 2>/dev/null; echo "0 23 * * * cd /opt/asd-academy && docker compose exec -T asd-academy npm run backup") | crontab -
```

### กู้คืน

```bash
docker compose cp ./learning-center-20261124-2300.db asd-academy:/data/restore.db
```

```bash
docker compose exec asd-academy sh -c 'rm -f /data/learning-center.db* && mv /data/restore.db /data/learning-center.db'
```

```bash
docker compose restart
```

### อัปเกรดเป็นเวอร์ชันใหม่

ฐานข้อมูลใช้ `CREATE TABLE IF NOT EXISTS` และสร้างตารางที่ยังไม่มีให้เองตอนสตาร์ต
ดังนั้นแค่ดึงโค้ดใหม่แล้ว build ใหม่ ข้อมูลเดิมไม่หายเพราะอยู่คนละที่กับ image

```bash
docker compose exec asd-academy npm run backup
```

```bash
cd /opt/asd-academy && git pull && docker compose up -d --build
```

หลังอัปเดตให้ผู้ใช้กด `Ctrl+Shift+R` หนึ่งครั้ง (หรือรอ toast แจ้งเวอร์ชันใหม่)
เพื่อให้ service worker โหลดไฟล์ใหม่

---

## 8. ปัญหาที่พบบ่อย

| อาการ | สาเหตุ / วิธีแก้ |
|---|---|
| `permission denied while trying to connect to the Docker daemon` | ผู้ใช้ยังไม่อยู่ในกลุ่ม docker — `sudo usermod -aG docker $USER` แล้ว `newgrp docker` หรือล็อกเอาต์เข้าใหม่ |
| `ports are not available ... 5173` | มีโปรแกรมอื่นยึดพอร์ตอยู่ — หาด้วย `ss -ltnp 'sport = :5173'` แล้วปิด หรือเปลี่ยนฝั่งซ้ายของ `ports:` เป็นพอร์ตอื่น |
| container ขึ้นแล้วดับทันที | ดูสาเหตุด้วย `docker compose logs` |
| `docker compose ps` ขึ้น `unhealthy` | แอปไม่ตอบ `/api/health` — ดู log · ถ้าเพิ่งสตาร์ตให้รออีก 30 วินาที |
| ลืม/ไม่ได้คัดลอกรหัส admin | `docker compose exec asd-academy npm run reset-password -- admin` · ข้อมูลผู้เรียนไม่หาย |
| ล็อกอินผิดหลายครั้งแล้วถูกล็อก | ผิด 8 ครั้งต่อบัญชีจะล็อก 5 นาที (ต่อ IP 30 ครั้ง / 10 นาที) — รอให้ครบเวลา หรือ `docker compose restart` เพราะตัวนับอยู่ในหน่วยความจำ |
| คนอื่นในวงเข้าไม่ได้ | ไฟร์วอลล์บล็อก — `sudo ufw allow 5173/tcp` |
| หน้าเว็บไม่อัปเดตหลัง build ใหม่ | service worker แคชไว้ — กด `Ctrl+Shift+R` |
| ฟอนต์ไม่สวยในเครือข่ายปิด | เรียก Google Fonts ไม่ออก ระบบจะใช้ฟอนต์ของเครื่องแทน ใช้งานได้ปกติทุกอย่าง |
| อยากเริ่มใหม่ทั้งหมด | `docker compose down -v` แล้ว `up -d --build` — **ข้อมูลผู้เรียนหายหมด** |

---

## ทำอะไรต่อ

- เพิ่มบัญชีผู้เรียน: ล็อกอินเป็น admin แล้วไปที่ `#/admin/users`
- เพิ่มบทเรียน/ข้อสอบ/Lab จากหน้าเว็บโดยไม่ต้องแตะโค้ด: `#/admin/content`
- ดูความคืบหน้าของผู้เรียนทุกคน: `#/admin`
- รายละเอียดเนื้อหา โครงสร้างโปรเจกต์ และวิธีเพิ่มเนื้อหาในโค้ด: [README.md](README.md)
