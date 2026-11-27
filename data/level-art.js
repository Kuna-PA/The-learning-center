// ============================================================
//  ภาพประจำระดับ — ใช้บนการ์ดบทเรียนและหัวหน้าบทเรียน
//
//  เดิมใช้ emoji ตามโมเดล Dreyfus (🌱 🧭 ⚙️ 🎯 👑 🚀) ซึ่งสื่อถึง "ขั้นของความชำนาญ"
//  ได้ แต่ไม่ได้สื่อถึง **สายงาน** เลย — ต้นกล้าบนการ์ดบทเรียนเครือข่ายดูไม่เข้ากัน
//  จึงวาดใหม่เป็นของในงาน IT Infrastructure จริง ๆ โดยยังไล่ระดับตามเดิม
//
//    1 เสียบสายให้ถูกพอร์ต        → พอร์ต RJ45 กับสายแพตช์
//    2 ดูแลอุปกรณ์ตัวเดียวเป็น     → สวิตช์พร้อมพอร์ตและไฟสถานะ
//    3 ดูแลทั้งตู้แร็คได้           → ตู้แร็คที่มีอุปกรณ์ซ้อนกัน
//    4 ออกแบบให้ไม่มีจุดตายเดียว   → โทโพโลยีที่มีเส้นทางสำรองไขว้กัน
//    5 ออกแบบทั้งระบบ             → สถาปัตยกรรม ศูนย์ข้อมูล–คลาวด์–ไฟร์วอลล์
//    6 ลดงานซ้ำด้วยเครื่องมือใหม่  → หน้าต่างเทอร์มินัลกับเฟือง automation
//
//  ทุกตัวใช้ viewBox 48x36 และระบายสีเน้นด้วย currentColor
//  ผู้เรียกจึงกำหนดสีด้วย `color:` ได้ตามสีประจำระดับ โดยไม่ต้องมีไฟล์ละสี
// ============================================================

const art = (body) => `<svg class="lv-art" viewBox="0 0 48 36" fill="none" aria-hidden="true">${body}</svg>`;

const PANEL = '#0d1119';      // สีตัวเครื่อง — เข้มกว่าพื้นการ์ดเล็กน้อย
const WIRE = '#9fb3cd';       // สายและรายละเอียดที่ไม่ใช่สีเน้น
const OK = '#3ecf7a';         // ไฟ link สีเขียว

export const LEVEL_ART = {
  // ระดับ 1 — พอร์ต RJ45 ที่ผนัง กับสายแพตช์ที่เสียบอยู่
  1: art(`
    <rect x="3.5" y="9" width="17" height="18" rx="2.2" fill="${PANEL}" stroke="currentColor" stroke-width="1.6"/>
    <path d="M9 13.5h6v6H9z" fill="currentColor" fill-opacity=".22" stroke="currentColor" stroke-width="1.3"/>
    <path d="M10.6 13.5v-2.1h2.8v2.1" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
    <path d="M7 23.4h9.6" stroke="${WIRE}" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M20.5 18c5.6 0 6.4-7.2 12-7.2h8" stroke="currentColor" stroke-width="1.9"
      stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="39.5" y="7.4" width="6" height="6.8" rx="1.4" fill="${PANEL}" stroke="currentColor" stroke-width="1.5"/>
    <path d="M41.2 14.2v2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
    <circle cx="16.8" cy="12.4" r="1.1" fill="${OK}"/>`),

  // ระดับ 2 — สวิตช์หนึ่งตัว เห็นพอร์ตและไฟสถานะชัด ๆ
  2: art(`
    <path d="M12 12V6.5M24 12V4M36 12V6.5" stroke="${WIRE}" stroke-width="1.4" stroke-linecap="round"/>
    <circle cx="12" cy="5.2" r="1.5" fill="currentColor"/>
    <circle cx="24" cy="3" r="1.5" fill="currentColor"/>
    <circle cx="36" cy="5.2" r="1.5" fill="currentColor"/>
    <rect x="3" y="12" width="42" height="15" rx="2.6" fill="${PANEL}" stroke="currentColor" stroke-width="1.7"/>
    <path d="M7.5 22.5h3.4M13.2 22.5h3.4M18.9 22.5h3.4M24.6 22.5h3.4M30.3 22.5h3.4M36 22.5h3.4"
      stroke="${WIRE}" stroke-width="2" stroke-linecap="round"/>
    <circle cx="7.8" cy="16.4" r="1.1" fill="${OK}"/>
    <circle cx="12" cy="16.4" r="1.1" fill="${OK}"/>
    <circle cx="16.2" cy="16.4" r="1.1" fill="currentColor"/>
    <path d="M38.5 15.4h4.2M38.5 18.2h4.2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>`),

  // ระดับ 3 — ตู้แร็คที่มีอุปกรณ์หลายตัวซ้อนกัน
  3: art(`
    <rect x="11" y="2.5" width="26" height="29" rx="2.6" fill="${PANEL}" stroke="currentColor" stroke-width="1.7"/>
    <rect x="14.5" y="6" width="19" height="5.6" rx="1.2" fill="currentColor" fill-opacity=".22" stroke="currentColor" stroke-width="1.2"/>
    <rect x="14.5" y="13.6" width="19" height="5.6" rx="1.2" fill="currentColor" fill-opacity=".22" stroke="currentColor" stroke-width="1.2"/>
    <rect x="14.5" y="21.2" width="19" height="5.6" rx="1.2" fill="currentColor" fill-opacity=".22" stroke="currentColor" stroke-width="1.2"/>
    <path d="M17 8.8h7M17 16.4h7M17 24h7" stroke="${WIRE}" stroke-width="1.5" stroke-linecap="round"/>
    <circle cx="30.6" cy="8.8" r="1" fill="${OK}"/>
    <circle cx="30.6" cy="16.4" r="1" fill="${OK}"/>
    <circle cx="30.6" cy="24" r="1" fill="${OK}"/>
    <path d="M13.5 31.5v2.3M34.5 31.5v2.3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M37 7.5c4 1.4 5.6 4.4 5.6 9.5M11 26.4c-4-1.4-5.6-4.4-5.6-9.5" stroke="${WIRE}"
      stroke-width="1.4" stroke-linecap="round"/>`),

  // ระดับ 4 — โทโพโลยีที่มีเส้นทางสำรอง เส้นไขว้คือ redundancy
  4: art(`
    <path d="M11 11.5h26M11 24.5h26M11 11.5l26 13M37 11.5l-26 13" stroke="currentColor"
      stroke-width="1.5" stroke-opacity=".75" stroke-linecap="round"/>
    <rect x="3" y="7" width="16" height="9" rx="2.2" fill="${PANEL}" stroke="currentColor" stroke-width="1.6"/>
    <rect x="29" y="7" width="16" height="9" rx="2.2" fill="${PANEL}" stroke="currentColor" stroke-width="1.6"/>
    <rect x="3" y="20" width="16" height="9" rx="2.2" fill="${PANEL}" stroke="currentColor" stroke-width="1.6"/>
    <rect x="29" y="20" width="16" height="9" rx="2.2" fill="${PANEL}" stroke="currentColor" stroke-width="1.6"/>
    <path d="M6.5 13h5M32.5 13h5M6.5 26h5M32.5 26h5" stroke="${WIRE}" stroke-width="1.6" stroke-linecap="round"/>
    <circle cx="15.5" cy="10.5" r="1" fill="${OK}"/>
    <circle cx="41.5" cy="10.5" r="1" fill="${OK}"/>
    <circle cx="15.5" cy="23.5" r="1" fill="${OK}"/>
    <circle cx="41.5" cy="23.5" r="1" fill="${OK}"/>`),

  // ระดับ 5 — ภาพรวมทั้งระบบ: คลาวด์ ไฟร์วอลล์ และศูนย์ข้อมูล
  5: art(`
    <path d="M16.5 9.5a4.6 4.6 0 0 1 9-1.6 3.6 3.6 0 0 1 5 3.4 3.3 3.3 0 0 1-3.3 3.2H17.6a3.5 3.5 0 0 1-1.1-5z"
      fill="${PANEL}" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M24 14.5v4" stroke="${WIRE}" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M24 18.5 11 23M24 18.5 37 23" stroke="${WIRE}" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M19.4 18.6h9.2v4.1c0 2.6-2 4.4-4.6 5.3-2.6-.9-4.6-2.7-4.6-5.3z"
      fill="currentColor" fill-opacity=".22" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>
    <rect x="3" y="22.5" width="15" height="9.5" rx="2.2" fill="${PANEL}" stroke="currentColor" stroke-width="1.6"/>
    <rect x="30" y="22.5" width="15" height="9.5" rx="2.2" fill="${PANEL}" stroke="currentColor" stroke-width="1.6"/>
    <path d="M6.2 26h4.2M6.2 29h4.2M33.2 26h4.2M33.2 29h4.2" stroke="${WIRE}" stroke-width="1.5" stroke-linecap="round"/>
    <circle cx="14.6" cy="26" r="1" fill="${OK}"/>
    <circle cx="41.6" cy="26" r="1" fill="${OK}"/>`),

  // ระดับ 6 — ลดงานซ้ำ: สคริปต์ในเทอร์มินัล กับเฟือง automation
  6: art(`
    <rect x="3" y="5" width="36" height="23" rx="3" fill="${PANEL}" stroke="currentColor" stroke-width="1.7"/>
    <path d="M3 11.2h36" stroke="currentColor" stroke-width="1.3" stroke-opacity=".6"/>
    <circle cx="7.4" cy="8.1" r="1.1" fill="#ff5f57"/>
    <circle cx="11.2" cy="8.1" r="1.1" fill="#febc2e"/>
    <circle cx="15" cy="8.1" r="1.1" fill="#28c840"/>
    <path d="M7.6 16.2 11 18.9l-3.4 2.7" stroke="currentColor" stroke-width="1.7"
      stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M14.4 21.6h11" stroke="${WIRE}" stroke-width="1.7" stroke-linecap="round"/>
    <path d="M14.4 16.2h7" stroke="${WIRE}" stroke-width="1.7" stroke-linecap="round" stroke-opacity=".55"/>
    <circle cx="37" cy="27" r="6.3" fill="${PANEL}" stroke="currentColor" stroke-width="1.6"/>
    <circle cx="37" cy="27" r="2.1" fill="currentColor" fill-opacity=".3" stroke="currentColor" stroke-width="1.3"/>
    <path d="M37 19.2v2M37 32.8v-2M29.8 27h2M44.2 27h-2M31.9 21.9l1.4 1.4M42.1 32.1l-1.4-1.4M42.1 21.9l-1.4 1.4M31.9 32.1l1.4-1.4"
      stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`),
};

/** ภาพของระดับที่ขอ — ระดับที่ยังไม่มีภาพจะใช้ของระดับ 1 แทนเพื่อไม่ให้การ์ดว่าง */
export const levelArt = (n) => LEVEL_ART[n] || LEVEL_ART[1];
