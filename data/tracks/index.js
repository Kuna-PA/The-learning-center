import network from './network.js';
import cisco from './cisco-switch.js';
import mtRouter from './mikrotik-router.js';
import mtSwitch from './mikrotik-switch.js';
import win from './windows-server.js';
import linux from './linux.js';
import cyber from './cyber-security.js';
import { mergeExtraLabs } from '../labs/index.js';

// Network อยู่ตัวแรกเพราะเป็นพื้นฐานที่ไม่ผูกกับยี่ห้อ ควรเรียนก่อนลงลึกที่อุปกรณ์ตัวใดตัวหนึ่ง
export const TRACKS = mergeExtraLabs([network, cisco, mtRouter, mtSwitch, win, linux, cyber]);
export const trackById = id => TRACKS.find(t => t.id === id);

// รวมทุก lab ไว้ที่เดียว เพื่อให้หน้า Labs และ router หาเจอ
export const ALL_LABS = TRACKS.flatMap(t =>
  Object.entries(t.levels).flatMap(([lvl, data]) =>
    (data.labs || []).map(l => ({ ...l, track: t.id, trackName: t.name, icon: t.icon, level: +lvl }))
  )
);
export const labById = (trackId, labId) => ALL_LABS.find(l => l.track === trackId && l.id === labId);
