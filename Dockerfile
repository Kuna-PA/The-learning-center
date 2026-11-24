# ============================================================
#  ASD ACADEMY — container
#
#  ไม่มีขั้นตอน build และไม่มี dependency ให้ลง (package.json มี dependencies ว่าง)
#  จึงเป็น image ชั้นเดียว ไม่ต้องทำ multi-stage ให้ยุ่งยาก
#
#  ต้องใช้ Node 24 เพราะ:
#    - node:sqlite (ฐานข้อมูล) มีตั้งแต่ 22.5
#    - backup() ของ node:sqlite ที่ npm run backup ใช้ เพิ่มเข้ามาทีหลังกว่านั้นอีก
#
#  สร้างและรัน:
#    docker compose up -d --build
#    docker compose logs            <- รหัส admin ครั้งแรกอยู่ตรงนี้ แสดงครั้งเดียว
# ============================================================
FROM node:24-alpine

WORKDIR /app

# คัดลอกโค้ดทั้งหมด (ของที่ไม่ต้องการถูกกันไว้ใน .dockerignore แล้ว)
COPY --chown=node:node . .

ENV NODE_ENV=production \
    PORT=5173 \
    LC_DATA_DIR=/data \
    LC_OPEN_REGISTER=0

# สร้างที่เก็บฐานข้อมูลและยกให้ผู้ใช้ node ตั้งแต่ตอน build
# ต้องทำก่อนประกาศ VOLUME เพราะ Docker จะคัดลอกสิทธิ์ของโฟลเดอร์นี้
# ไปให้ volume ตอนสร้างครั้งแรก ถ้าทำทีหลัง volume จะเป็นของ root แล้วเขียนไม่ได้
RUN mkdir -p /data && chown node:node /data
VOLUME ["/data"]

# ไม่รันด้วย root — ถ้ามีช่องโหว่ในแอป ผู้บุกรุกจะไม่ได้สิทธิ์สูงสุดใน container ไปด้วย
USER node

EXPOSE 5173

# ใช้ node ตรวจเอง เพราะ image นี้ไม่มี curl ติดมาให้
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||5173)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
