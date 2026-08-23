// ============================================================
//  ไอคอนของแต่ละ Learning Path
//
//  เดิมใช้ emoji ซึ่งหารูปที่ตรงกับเนื้อหาไม่ได้ (สวิตช์เครือข่าย ชิปสวิตช์ เราเตอร์
//  ไม่มีใน emoji เลย ต้องยืมรูปอื่นมาใช้อย่าง 🔀 กับ 🧩 ซึ่งไม่สื่อถึงหัวข้อ)
//  จึงวาดเป็น SVG เองให้ตรงกับชื่อหัวข้อจริง ๆ
//
//  ทุกตัวใช้ viewBox 24x24 และคลาส .ic ซึ่งกำหนดขนาดเป็น 1em
//  จึงยืด–หดตาม font-size ของที่ที่เอาไปวางเหมือน emoji เดิมทุกประการ
//
//  TRACK_EMOJI ยังจำเป็นอยู่ สำหรับที่ที่แสดง SVG ไม่ได้ เช่น <option> ใน dropdown
// ============================================================

const svg = (body) => `<svg class="ic" viewBox="0 0 24 24" fill="none" aria-hidden="true">${body}</svg>`;

export const TRACK_ICONS = {
  // ลูกโลกพร้อมจุดเชื่อม — พื้นฐานเครือข่ายที่ไม่ผูกกับยี่ห้อ
  network: svg(`
    <circle cx="12" cy="12" r="8.6" stroke="#38bdf8" stroke-width="1.6"/>
    <ellipse cx="12" cy="12" rx="4" ry="8.6" stroke="#38bdf8" stroke-width="1.3"/>
    <path d="M3.6 9.2h16.8M3.6 14.8h16.8" stroke="#38bdf8" stroke-width="1.3"/>
    <circle cx="12" cy="3.4" r="2" fill="#7dd3fc"/>
    <circle cx="4.8" cy="17" r="2" fill="#7dd3fc"/>
    <circle cx="19.2" cy="17" r="2" fill="#7dd3fc"/>`),

  // สวิตช์ในตู้แร็คพร้อมพอร์ต และลูกศรสวนทางกัน = การสลับส่งเฟรมระหว่างพอร์ต
  'cisco-switch': svg(`
    <path d="M3.2 5.2h16m-2.6-2.4 2.6 2.4-2.6 2.4" stroke="#4fd1c5" stroke-width="1.5"
      stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M20.8 9.4H4.8m2.6-2.4L4.8 9.4l2.6 2.4" stroke="#4fd1c5" stroke-width="1.5"
      stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="2.4" y="13" width="19.2" height="7.6" rx="1.8" fill="#123a3d" stroke="#4fd1c5" stroke-width="1.4"/>
    <path d="M5 16.6h2.2M8.6 16.6h2.2M12.2 16.6h2.2M15.8 16.6h2.2" stroke="#b9f0ec" stroke-width="1.6" stroke-linecap="round"/>
    <circle cx="19.6" cy="18.4" r="1" fill="#3ecf7a"/>`),

  // เราเตอร์มีเสาอากาศและคลื่นสัญญาณ
  'mikrotik-router': svg(`
    <path d="M6 10.6V4.8M18 10.6V4.8" stroke="#fbbf24" stroke-width="1.5" stroke-linecap="round"/>
    <circle cx="6" cy="3.5" r="1.4" fill="#fbbf24"/>
    <circle cx="18" cy="3.5" r="1.4" fill="#fbbf24"/>
    <path d="M9.4 8.4a4.6 4.6 0 0 1 5.2 0" stroke="#fbbf24" stroke-width="1.3" stroke-linecap="round"/>
    <rect x="2.4" y="12.4" width="19.2" height="8" rx="2" fill="#4a3712" stroke="#fbbf24" stroke-width="1.4"/>
    <circle cx="6" cy="16.4" r="1.2" fill="#fde68a"/>
    <path d="M9.6 16.4h8.6" stroke="#fde68a" stroke-width="1.5" stroke-linecap="round"/>`),

  // ชิปสวิตช์พร้อมขา — หัวใจของ CRS/CSS คือ switch chip
  'mikrotik-switch': svg(`
    <path d="M9 2.6v3.2M12 2.6v3.2M15 2.6v3.2M9 18.2v3.2M12 18.2v3.2M15 18.2v3.2M2.6 9h3.2M2.6 12h3.2M2.6 15h3.2M18.2 9h3.2M18.2 12h3.2M18.2 15h3.2"
      stroke="#a78bfa" stroke-width="1.5" stroke-linecap="round"/>
    <rect x="5.6" y="5.6" width="12.8" height="12.8" rx="2.2" fill="#2c2550" stroke="#a78bfa" stroke-width="1.5"/>
    <rect x="9.2" y="9.2" width="5.6" height="5.6" rx="1.1" fill="#a78bfa"/>`),

  // ตู้เซิร์ฟเวอร์ที่ยูนิตบนเป็นบานหน้าต่างสี่ช่อง = Windows Server
  'windows-server': svg(`
    <rect x="3.8" y="2.8" width="16.4" height="9" rx="1.7" fill="#12395f" stroke="#7cc4ff" stroke-width="1.4"/>
    <path d="M12 3v8.6M4.2 7.3h15.6" stroke="#7cc4ff" stroke-width="1.3"/>
    <rect x="3.8" y="14.2" width="16.4" height="7" rx="1.7" fill="#12395f" stroke="#7cc4ff" stroke-width="1.4"/>
    <circle cx="7" cy="17.7" r="1.1" fill="#3ecf7a"/>
    <path d="M10.2 17.7h7" stroke="#9fd4ff" stroke-width="1.5" stroke-linecap="round"/>`),

  // เพนกวิน — สัญลักษณ์ของ Linux
  linux: svg(`
    <ellipse cx="12" cy="14" rx="6.5" ry="7.2" fill="#1f2430"/>
    <ellipse cx="12" cy="15.6" rx="4.2" ry="5.3" fill="#f2f4f8"/>
    <circle cx="12" cy="7.2" r="4.7" fill="#1f2430"/>
    <circle cx="10.2" cy="6.8" r="1.2" fill="#fff"/>
    <circle cx="13.8" cy="6.8" r="1.2" fill="#fff"/>
    <circle cx="10.4" cy="7" r=".6" fill="#151922"/>
    <circle cx="13.6" cy="7" r=".6" fill="#151922"/>
    <path d="M12 8.5c1.3 0 2.1.7 2.1 1.4 0 .8-1 1.4-2.1 1.4s-2.1-.6-2.1-1.4c0-.7.8-1.4 2.1-1.4z" fill="#fbbf24"/>
    <path d="M8.4 19.8c-.5 1.1-1.5 1.7-2.4 1.5-.6-.2-.4-1 .3-1.5zM15.6 19.8c.5 1.1 1.5 1.7 2.4 1.5.6-.2.4-1-.3-1.5z" fill="#fbbf24"/>`),

  // โล่พร้อมกุญแจ — ความมั่นคงปลอดภัย
  'cyber-security': svg(`
    <path d="M12 2.4 4.6 5.3v6.2c0 4.6 3 8.4 7.4 10.1 4.4-1.7 7.4-5.5 7.4-10.1V5.3z"
      fill="#3a1a20" stroke="#ff6b7a" stroke-width="1.5" stroke-linejoin="round"/>
    <rect x="9" y="11.4" width="6" height="5.2" rx="1.1" fill="#ff6b7a"/>
    <path d="M10.3 11.4V9.8a1.7 1.7 0 0 1 3.4 0v1.6" stroke="#ff6b7a" stroke-width="1.4"/>`),
};

/** ใช้ในที่ที่แสดง HTML ไม่ได้ เช่นตัวเลือกใน dropdown */
export const TRACK_EMOJI = {
  network: '🌐',
  'cisco-switch': '🔀',
  'mikrotik-router': '📡',
  'mikrotik-switch': '🧩',
  'windows-server': '🪟',
  linux: '🐧',
  'cyber-security': '🛡️',
};
