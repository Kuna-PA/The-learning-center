import network from './network.js';
import cisco from './cisco-switch.js';
import mtRouter from './mikrotik-router.js';
import mtSwitch from './mikrotik-switch.js';
import win from './windows-server.js';
import linux from './linux.js';
import cyber from './cyber-security.js';
import { mergeExtraLabs } from '../labs/index.js';
import { mergeExtraQuiz } from '../quiz/index.js';

// Network อยู่ตัวแรกเพราะเป็นพื้นฐานที่ไม่ผูกกับยี่ห้อ ควรเรียนก่อนลงลึกที่อุปกรณ์ตัวใดตัวหนึ่ง
export const TRACKS = mergeExtraQuiz(
  mergeExtraLabs([network, cisco, mtRouter, mtSwitch, win, linux, cyber])
);
export const trackById = id => TRACKS.find(t => t.id === id);

// รวมทุก lab ไว้ที่เดียว เพื่อให้หน้า Labs และ router หาเจอ
export const ALL_LABS = [];

/**
 * สร้างรายการ lab ใหม่จาก TRACKS
 * ต้องเรียกซ้ำหลังเอาเนื้อหาที่ผู้ดูแลเพิ่มเองมา merge เข้าไป (ดู js/content.js)
 * แก้ในตัว array เดิม ไม่สร้างตัวใหม่ เพราะที่อื่น import ตัวนี้ไปถือไว้แล้ว
 */
export function rebuildAllLabs() {
  ALL_LABS.length = 0;
  ALL_LABS.push(...TRACKS.flatMap(t =>
    Object.entries(t.levels).flatMap(([lvl, data]) =>
      (data.labs || []).map(l => ({ ...l, track: t.id, trackName: t.name, icon: t.icon, level: +lvl }))
    )
  ));
  return ALL_LABS;
}
rebuildAllLabs();
export const labById = (trackId, labId) => ALL_LABS.find(l => l.track === trackId && l.id === labId);
