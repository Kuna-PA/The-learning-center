// ============================================================
//  Windows GUI simulator — เดสก์ท็อป Windows Server จำลอง
//  ใช้ state ก้อนเดียวกับ emulator ฝั่ง PowerShell (js/devices/windows.js)
//  ทุกการคลิกจะบันทึกเป็น action ลง history เพื่อให้ lab ตรวจได้
// ============================================================
import { createDevice } from '../devices/index.js';

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ============================================================
//  การกระทำทั้งหมดที่หน้าจอ GUI ทำกับ state ได้
//  แยกออกมาเป็นฟังก์ชันบริสุทธิ์เพื่อให้ทดสอบได้โดยไม่ต้องมี DOM
//  แต่ละตัวคืนค่าเป็น action string ที่จะถูกบันทึกลง history (หรือ null = ไม่บันทึก)
// ============================================================
export const GUI_ACTIONS = {
  'open': (s, p) => `gui:open:${p.app}`,
  'nic-props': (s, p) => `gui:nic-props:${p.nic}`,
  'nic-toggle': (s, p) => {
    const n = s.nics[p.nic];
    if (!n) return null;
    n.status = n.status === 'Up' ? 'Down' : 'Up';
    return `gui:nic-${n.status === 'Up' ? 'enable' : 'disable'}:${p.nic}`;
  },
  'ip-dhcp': (s, p) => { const n = s.nics[p.nic]; if (!n) return null; n.dhcp = true; return `gui:ip-dhcp:${p.nic}`; },
  'ip-static': (s, p) => {
    const n = s.nics[p.nic];
    if (!n || !/^\d{1,3}(\.\d{1,3}){3}$/.test(p.ip || '')) return null;
    n.dhcp = false; n.ip = p.ip;
    n.prefix = p.mask === '255.255.0.0' ? 16 : p.mask === '255.255.255.252' ? 30 : 24;
    if (p.gw) n.gw = p.gw;
    return `gui:ip-static:${p.nic}=${p.ip}`;
  },
  'dns-set': (s, p) => {
    const n = s.nics[p.nic];
    if (!n) return null;
    n.dns = [p.dns1, p.dns2].filter(Boolean);
    return `gui:dns-set:${p.nic}=${n.dns.join(',')}`;
  },
  'dns-auto': (s, p) => { const n = s.nics[p.nic]; if (n) n.dns = []; return null; },
  'service-start': (s, p) => { if (!s.services[p.svc]) return null; s.services[p.svc].status = 'Running'; return `gui:service-start:${p.svc}`; },
  'service-stop': (s, p) => { if (!s.services[p.svc]) return null; s.services[p.svc].status = 'Stopped'; return `gui:service-stop:${p.svc}`; },
  'service-restart': (s, p) => { if (!s.services[p.svc]) return null; s.services[p.svc].status = 'Running'; return `gui:service-restart:${p.svc}`; },
  'service-startup': (s, p) => { if (!s.services[p.svc]) return null; s.services[p.svc].start = p.value; return `gui:service-startup:${p.svc}=${p.value}`; },
  'kill': (s, p) => {
    const i = s.processes.findIndex(x => String(x.pid) === String(p.pid) || x.name === p.name);
    if (i < 0) return null;
    const nm = s.processes[i].name;
    s.processes.splice(i, 1);
    return `gui:kill:${nm}`;
  },
  'localuser-new': (s, p) => {
    if (!p.user || s.localUsers[p.user]) return null;
    s.localUsers[p.user] = { enabled: true, desc: p.desc || '', groups: ['Users'] };
    s.localGroups.Users.push(p.user);
    return `gui:localuser-new:${p.user}`;
  },
  'localgroup-add': (s, p) => {
    if (!s.localGroups[p.group]) return null;
    if (!s.localGroups[p.group].includes(p.user)) s.localGroups[p.group].push(p.user);
    return `gui:localgroup-add:${p.group}+${p.user}`;
  },
  'install-role': (s, p) => {
    s.features.add(p.role);
    if (p.role === 'Web-Server') { s.services.W3SVC.status = 'Running'; s.services.W3SVC.start = 'Automatic'; }
    if (p.role === 'DHCP') { s.services.DHCPServer.status = 'Running'; s.services.DHCPServer.start = 'Automatic'; }
    return `gui:install-role:${p.role}`;
  },
  'promote-dc': (s, p) => {
    if (!s.features.has('AD-Domain-Services')) return null;
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(p.domain || '')) return null;
    s.domain = p.domain; s.isDC = true;
    s.features.add('DNS'); s.features.add('RSAT-AD-PowerShell');
    s.dnsZones.push({ name: p.domain, type: 'Primary', dynamic: 'Secure' });
    s.adGroups['Domain Admins'] = ['Administrator'];
    s.adGroups['Domain Users'] = ['Administrator'];
    return `gui:promote-dc:${p.domain}`;
  },
  'ad-newou': (s, p) => {
    if (!p.name) return null;
    if (!s.adOUs.includes(p.name)) s.adOUs.push(p.name);
    return `gui:ad-newou:${p.name}`;
  },
  'ad-newuser': (s, p) => {
    const sam = String(p.sam || '').toLowerCase();
    if (!p.name || !sam || s.adUsers[sam]) return null;
    s.adUsers[sam] = {
      name: p.name, sam, enabled: true, upn: `${sam}@${s.domain}`,
      path: `CN=Users,DC=${String(s.domain).split('.').join(',DC=')}`, groups: ['Domain Users'],
    };
    (s.adGroups['Domain Users'] ||= []).push(sam);
    return `gui:ad-newuser:${sam}`;
  },
  'ad-newgroup': (s, p) => { if (!p.name) return null; s.adGroups[p.name] ||= []; return `gui:ad-newgroup:${p.name}`; },
  'ad-addmember': (s, p) => {
    if (!s.adGroups[p.group]) return null;
    if (!s.adGroups[p.group].includes(p.user)) s.adGroups[p.group].push(p.user);
    if (s.adUsers[p.user]) s.adUsers[p.user].groups.push(p.group);
    return `gui:ad-addmember:${p.group}+${p.user}`;
  },
  'ad-disable': (s, p) => { if (!s.adUsers[p.user]) return null; s.adUsers[p.user].enabled = false; return `gui:ad-disable:${p.user}`; },
  'ad-enable': (s, p) => { if (!s.adUsers[p.user]) return null; s.adUsers[p.user].enabled = true; return `gui:ad-enable:${p.user}`; },
  'newfolder': (s, p) => {
    const parts = String(p.path).replace(/\\$/, '').split('\\');
    let n = s.fs['C:\\'];
    for (const seg of parts.slice(1)) {
      const k = n && n.d && Object.keys(n.c).find(x => x.toLowerCase() === seg.toLowerCase());
      if (!k) return null;
      n = n.c[k];
    }
    if (!p.name) return null;
    n.c[p.name] = { d: true, c: {} };
    return `gui:newfolder:${String(p.path).replace(/\\$/, '')}\\${p.name}`;
  },
  'props': (s, p) => `gui:props:${p.target}`,
  'share': (s, p) => {
    if (!p.name) return null;
    s.shares[p.name] = { path: p.target, desc: '', full: 'Everyone' };
    return `gui:share:${p.name}=${p.target}`;
  },
  'ntfs': (s, p) => (p.principal ? `gui:ntfs:${p.principal}=${p.perm}` : null),
  'fw-rule': (s, p) => {
    if (!p.name) return null;
    s.fwRules.push({ name: p.name, dir: 'Inbound', action: p.action || 'Allow', port: p.port || '', proto: 'TCP' });
    return `gui:fw-rule:${p.name}:${p.action}:${p.port}`;
  },
  'rename': (s, p) => { if (!p.name) return null; s.hostname = p.name; return `gui:rename:${p.name}`; },
  'joindomain': (s, p) => { if (!p.domain) return null; s.domain = p.domain; return `gui:joindomain:${p.domain}`; },
  'eventlog': () => 'gui:eventlog',
  'sm-view': (s, p) => `gui:sm:${p.view}`,

  // ---------- DNS Manager ----------
  'dns-newzone': (s, p) => {
    const name = String(p.name || '').trim().toLowerCase();
    if (!name) return null;
    if (s.dnsZones.some(z => String(z.name).toLowerCase() === name)) return null;
    s.dnsZones.push({ name, type: p.kind === 'reverse' ? 'Reverse' : 'Primary', dynamic: p.dynamic || 'None' });
    return `gui:dns-newzone:${name}`;
  },
  'dns-newrecord': (s, p) => {
    const zone = String(p.zone || '');
    const name = String(p.name || '').trim();
    const data = String(p.data || '').trim();
    if (!zone || !name || !data) return null;
    if (!s.dnsZones.some(z => String(z.name).toLowerCase() === zone.toLowerCase())) return null;
    const type = p.type || 'A';
    if (type === 'A' && !/^\d{1,3}(\.\d{1,3}){3}$/.test(data)) return null;
    s.dnsRecords.push({ name, zone, type, data });
    return `gui:dns-record:${type}:${name}.${zone}=${data}`;
  },
  'dns-delrecord': (s, p) => {
    const i = s.dnsRecords.findIndex(r => r.zone === p.zone && r.name === p.name && r.type === p.type);
    if (i < 0) return null;
    s.dnsRecords.splice(i, 1);
    return `gui:dns-delrecord:${p.name}.${p.zone}`;
  },
  'dns-forwarder': (s, p) => {
    if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(p.ip || '')) return null;
    s.dnsForwarders ||= [];
    if (s.dnsForwarders.includes(p.ip)) return null;
    s.dnsForwarders.push(p.ip);
    return `gui:dns-forwarder:${p.ip}`;
  },

  // ---------- Group Policy Management ----------
  'gpo-new': (s, p) => {
    const n = String(p.name || '').trim();
    if (!n || s.gpos.includes(n)) return null;
    s.gpos.push(n);
    (s.gpoSettings ||= {})[n] = {};
    return `gui:gpo-new:${n}`;
  },
  'gpo-link': (s, p) => {
    if (!s.gpos.includes(p.gpo) || !p.target) return null;
    if (s.gpLinks.some(l => l.gpo === p.gpo && l.target === p.target)) return null;
    s.gpLinks.push({ gpo: p.gpo, target: p.target, enforced: 'No' });
    return `gui:gpo-link:${p.gpo}>${p.target}`;
  },
  'gpo-unlink': (s, p) => {
    const i = s.gpLinks.findIndex(l => l.gpo === p.gpo && l.target === p.target);
    if (i < 0) return null;
    s.gpLinks.splice(i, 1);
    return `gui:gpo-unlink:${p.gpo}>${p.target}`;
  },
  'gpo-enforce': (s, p) => {
    const l = s.gpLinks.find(x => x.gpo === p.gpo && x.target === p.target);
    if (!l) return null;
    l.enforced = l.enforced === 'Yes' ? 'No' : 'Yes';
    return `gui:gpo-enforce:${p.gpo}=${l.enforced}`;
  },
  'gpo-set': (s, p) => {
    if (!s.gpos.includes(p.gpo) || !p.key) return null;
    const cfg = ((s.gpoSettings ||= {})[p.gpo] ||= {});
    if (!p.value || p.value === NOT_SET) { delete cfg[p.key]; return null; }
    cfg[p.key] = p.value;
    return `gui:gpo-set:${p.gpo}:${p.key}=${p.value}`;
  },
  'gpupdate': () => 'gui:gpupdate',

  // ---------- DHCP ----------
  'dhcp-authorize': (s) => {
    if (!s.features.has('DHCP') || s.dhcpAuthorized) return null;
    s.dhcpAuthorized = true;
    return 'gui:dhcp-authorize';
  },
  'dhcp-newscope': (s, p) => {
    const ip = x => /^\d{1,3}(\.\d{1,3}){3}$/.test(x || '');
    if (!s.features.has('DHCP') || !p.name || !ip(p.start) || !ip(p.end)) return null;
    if (s.dhcpScopes.some(x => x.name === p.name)) return null;
    s.dhcpScopes.push({
      name: p.name, start: p.start, end: p.end, mask: p.mask || '255.255.255.0',
      state: 'Active', router: p.router || '', dns: p.dns || '',
    });
    return `gui:dhcp-scope:${p.name}=${p.start}-${p.end}`;
  },
  'dhcp-scope-option': (s, p) => {
    const sc = s.dhcpScopes.find(x => x.name === p.name);
    if (!sc || (!p.router && !p.dns)) return null;
    if (p.router) sc.router = p.router;
    if (p.dns) sc.dns = p.dns;
    return `gui:dhcp-option:${p.name}:router=${sc.router},dns=${sc.dns}`;
  },
  'dhcp-reservation': (s, p) => {
    if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(p.ip || '') || !p.mac) return null;
    s.dhcpReservations.push({ ip: p.ip, mac: p.mac, desc: p.desc || '' });
    return `gui:dhcp-reservation:${p.ip}`;
  },

  // ---------- Active Directory (เพิ่มเติม) ----------
  'ad-moveou': (s, p) => {
    const u = s.adUsers[String(p.user || '').toLowerCase()];
    if (!u || !s.adOUs.includes(p.ou)) return null;
    u.path = `OU=${p.ou},${String(s.domain).split('.').map(x => 'DC=' + x).join(',')}`;
    return `gui:ad-move:${u.sam}>OU=${p.ou}`;
  },
  'ad-resetpw': (s, p) => {
    const u = s.adUsers[String(p.user || '').toLowerCase()];
    if (!u) return null;
    u.mustChange = true;
    return `gui:ad-resetpw:${u.sam}`;
  },

  // ---------- Task Scheduler ----------
  'task-new': (s, p) => {
    if (!p.name || s.scheduledTasks.some(t => t.name === p.name)) return null;
    s.scheduledTasks.push({
      name: p.name, path: '\\', state: 'Ready',
      trigger: p.trigger || 'Daily', action: p.action || '',
    });
    return `gui:task-new:${p.name}`;
  },
  'task-run': (s, p) => {
    const t = s.scheduledTasks.find(x => x.name === p.name);
    if (!t || t.state === 'Disabled') return null;
    t.lastRun = 'just now';
    return `gui:task-run:${p.name}`;
  },
  'task-toggle': (s, p) => {
    const t = s.scheduledTasks.find(x => x.name === p.name);
    if (!t) return null;
    t.state = t.state === 'Disabled' ? 'Ready' : 'Disabled';
    return `gui:task-${t.state === 'Disabled' ? 'disable' : 'enable'}:${p.name}`;
  },
};

/** ค่าที่หมายถึง Not Configured ในหน้าแก้ GPO */
const NOT_SET = '(ไม่กำหนด)';

/** ชุดนโยบายที่หน้า Group Policy Management เปิดให้ตั้ง */
const GPO_SETTINGS = [
  { k: 'MinPasswordLength', label: 'ความยาวรหัสผ่านขั้นต่ำ (ตัวอักษร)', opts: ['8', '12', '14'] },
  { k: 'PasswordComplexity', label: 'บังคับรหัสผ่านซับซ้อน', opts: ['Enabled', 'Disabled'] },
  { k: 'MaxPasswordAge', label: 'อายุรหัสผ่านสูงสุด (วัน)', opts: ['30', '60', '90'] },
  { k: 'LockoutThreshold', label: 'ล็อคบัญชีเมื่อใส่รหัสผิด (ครั้ง)', opts: ['3', '5', '10'] },
  { k: 'ScreenSaverTimeout', label: 'ล็อคหน้าจอเมื่อไม่ใช้งาน (นาที)', opts: ['5', '10', '15'] },
  { k: 'DisableControlPanel', label: 'ห้ามเข้า Control Panel', opts: ['Enabled', 'Disabled'] },
  { k: 'DisableUSBStorage', label: 'ห้ามใช้ USB storage', opts: ['Enabled', 'Disabled'] },
  { k: 'AuditLogon', label: 'เก็บ log การล็อกอิน (Audit logon)', opts: ['Success and Failure', 'Failure only'] },
  { k: 'MappedDrive', label: 'Map network drive อัตโนมัติ', opts: ['Z: \\\\SRV-DC01\\Finance', 'S: \\\\SRV-DC01\\Shared'] },
];

// ---------- รายการแอปในเดสก์ท็อป ----------
const APPS = {
  'ncpa.cpl': { title: 'Network Connections', icon: '🌐', w: 620 },
  'services.msc': { title: 'Services', icon: '⚙️', w: 660 },
  'taskmgr': { title: 'Task Manager', icon: '📊', w: 600 },
  'lusrmgr.msc': { title: 'Local Users and Groups', icon: '👥', w: 620 },
  'dsa.msc': { title: 'Active Directory Users and Computers', icon: '🏢', w: 700 },
  'servermanager': { title: 'Server Manager', icon: '🖥️', w: 700 },
  'explorer': { title: 'File Explorer', icon: '📁', w: 680 },
  'wf.msc': { title: 'Windows Defender Firewall with Advanced Security', icon: '🛡️', w: 700 },
  'eventvwr': { title: 'Event Viewer', icon: '📋', w: 700 },
  'sysdm.cpl': { title: 'System Properties', icon: '💻', w: 560 },
  'cmd': { title: 'Command Prompt', icon: '⌨️', w: 660 },
  'dnsmgmt.msc': { title: 'DNS Manager', icon: '🌍', w: 700 },
  'gpmc.msc': { title: 'Group Policy Management', icon: '📜', w: 720 },
  'dhcpmgmt.msc': { title: 'DHCP', icon: '📦', w: 700 },
  'taskschd.msc': { title: 'Task Scheduler', icon: '⏰', w: 680 },
};

export function createWindowsGui({ initial = {}, onExec }) {
  let dev = createDevice('windows', initial);
  const st = () => dev.state;
  const history = [];        // action ที่ทำสำเร็จ (ใช้ตรวจ lab)
  let z = 10;
  const open = [];           // [{app, el, ctx}]

  const root = document.createElement('div');
  root.className = 'winos';
  root.innerHTML = `
    <div class="winos-desktop" id="wdesk">
      <div class="winos-icons" id="wicons"></div>
      <div class="winos-windows" id="wwins"></div>
    </div>
    <div class="winos-taskbar">
      <button class="winos-start" id="wstart">⊞ Start</button>
      <div class="winos-tasks" id="wtasks"></div>
      <div class="winos-tray"><span id="wclock">09:41</span> · <span>${esc(initial.hostname || 'WIN-SRV01')}</span></div>
    </div>
    <div class="winos-startmenu" id="wmenu" hidden></div>`;

  const $ = s => root.querySelector(s);
  const act = (a, detail = '') => {
    const line = detail ? `${a}:${detail}` : a;
    history.push(line);
    if (onExec) onExec({ cmd: line, state: st(), history });
  };

  // ---------- window manager ----------
  function openApp(id, ctx = {}) {
    const meta = APPS[id];
    if (!meta) return;
    const exist = open.find(o => o.app === id);
    if (exist) { focus(exist); Object.assign(exist.ctx, ctx); paint(exist); return exist; }
    const el = document.createElement('div');
    el.className = 'winos-win';
    const deskW = $('#wdesk').clientWidth || 900;
    const deskH = $('#wdesk').clientHeight || 560;
    const w0 = Math.min(meta.w, Math.max(280, deskW - 24));
    el.style.width = w0 + 'px';
    el.style.left = Math.max(8, Math.min(40 + open.length * 26, deskW - w0 - 8)) + 'px';
    el.style.top = Math.max(8, Math.min(26 + open.length * 22, deskH - 120)) + 'px';
    el.style.zIndex = ++z;
    el.innerHTML = `
      <div class="winos-title">
        <span class="ic">${meta.icon}</span><span class="tt">${esc(meta.title)}</span>
        <span class="winos-btns"><button data-x="min">–</button><button data-x="close">✕</button></span>
      </div>
      <div class="winos-body"></div>`;
    $('#wwins').appendChild(el);
    const w = { app: id, el, ctx };
    open.push(w);

    el.addEventListener('mousedown', () => focus(w));
    el.querySelector('[data-x="close"]').addEventListener('click', e => { e.stopPropagation(); closeApp(w); });
    el.querySelector('[data-x="min"]').addEventListener('click', e => { e.stopPropagation(); el.hidden = true; renderTasks(); });

    // ลากหน้าต่าง
    const bar = el.querySelector('.winos-title');
    bar.addEventListener('mousedown', e => {
      if (e.target.closest('.winos-btns')) return;
      const r = el.getBoundingClientRect(), pr = $('#wdesk').getBoundingClientRect();
      const dx = e.clientX - r.left, dy = e.clientY - r.top;
      const mv = ev => {
        el.style.left = Math.max(0, Math.min(ev.clientX - pr.left - dx, pr.width - 120)) + 'px';
        el.style.top = Math.max(0, Math.min(ev.clientY - pr.top - dy, pr.height - 40)) + 'px';
      };
      const up = () => { document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', up); };
      document.addEventListener('mousemove', mv); document.addEventListener('mouseup', up);
      e.preventDefault();
    });

    act('gui:open', id);
    focus(w); paint(w); renderTasks();
    return w;
  }
  function closeApp(w) {
    w.el.remove();
    open.splice(open.indexOf(w), 1);
    renderTasks();
  }
  function focus(w) { w.el.hidden = false; w.el.style.zIndex = ++z; renderTasks(); }
  function repaintAll() { open.forEach(paint); }
  function paint(w) {
    const body = w.el.querySelector('.winos-body');
    body.innerHTML = VIEWS[w.app] ? VIEWS[w.app](st(), w.ctx) : '<div class="winos-pad">ยังไม่รองรับ</div>';
    body.querySelectorAll('[data-do]').forEach(b =>
      // ช่อง select ต้องรอจนเลือกเสร็จ — click จะยิงตั้งแต่ตอนกดเปิดรายการ
      b.addEventListener(b.tagName === 'SELECT' ? 'change' : 'click',
        () => handle(w, b.dataset.do, b.dataset, b)));
    body.querySelectorAll('[data-open]').forEach(b =>
      b.addEventListener('click', () => openApp(b.dataset.open, JSON.parse(b.dataset.ctx || '{}'))));
  }
  function renderTasks() {
    $('#wtasks').innerHTML = open.map((o, i) =>
      `<button class="winos-task ${o.el.hidden ? '' : 'on'}" data-i="${i}">${APPS[o.app].icon} ${esc(APPS[o.app].title.split(' ')[0])}</button>`).join('');
    $('#wtasks').querySelectorAll('[data-i]').forEach(b =>
      b.addEventListener('click', () => { const w = open[+b.dataset.i]; w.el.hidden ? focus(w) : (w.el.hidden = true, renderTasks()); }));
  }

  // ---------- helper UI ----------
  const T = (cols, rows) => `<table class="winos-tbl"><tr>${cols.map(c => `<th>${c}</th>`).join('')}</tr>
    ${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</table>`;
  const btn = (label, doAttr, data = '', cls = '') =>
    `<button class="winos-btn ${cls}" data-do="${doAttr}" ${data}>${label}</button>`;
  const field = (label, id, val = '', ph = '') =>
    `<label class="winos-fld"><span>${label}</span><input id="${id}" value="${esc(val)}" placeholder="${esc(ph)}"></label>`;
  const pick = (id, opts, cur = '') =>
    `<select class="winos-sel" id="${id}">${opts.map(o => `<option ${o === cur ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
  /** corp.local -> DC=corp,DC=local */
  const dnOf = st2 => String(st2.domain || '').split('.').map(x => 'DC=' + x).join(',');
  const zoneOf = (st2, name) => (st2.dnsZones || []).find(z => String(z.name).toLowerCase() === String(name).toLowerCase());
  const isReverse = name => /in-addr\.arpa$/i.test(String(name));

  // ---------- หน้าจอของแต่ละแอป ----------
  const VIEWS = {
    'ncpa.cpl': (s, ctx) => {
      if (ctx.view === 'ipv4') {
        const n = s.nics[ctx.nic];
        const mask = n.prefix === 24 ? '255.255.255.0' : n.prefix === 16 ? '255.255.0.0' : '255.255.255.0';
        return `<div class="winos-pad">
          <div class="winos-h">Internet Protocol Version 4 (TCP/IPv4) Properties — ${esc(ctx.nic)}</div>
          <div class="winos-radio">
            <label><input type="radio" name="ipmode" value="dhcp" ${n.dhcp ? 'checked' : ''}> Obtain an IP address automatically</label>
            <label><input type="radio" name="ipmode" value="static" ${n.dhcp ? '' : 'checked'}> Use the following IP address:</label>
          </div>
          ${field('IP address', 'g-ip', n.dhcp ? '' : n.ip)}
          ${field('Subnet mask', 'g-mask', n.dhcp ? '' : mask)}
          ${field('Default gateway', 'g-gw', n.dhcp ? '' : (n.gw || ''))}
          <div class="winos-sep"></div>
          <div class="winos-radio">
            <label><input type="radio" name="dnsmode" value="auto" ${n.dns.length ? '' : 'checked'}> Obtain DNS server address automatically</label>
            <label><input type="radio" name="dnsmode" value="static" ${n.dns.length ? 'checked' : ''}> Use the following DNS server addresses:</label>
          </div>
          ${field('Preferred DNS server', 'g-dns1', n.dns[0] || '')}
          ${field('Alternate DNS server', 'g-dns2', n.dns[1] || '')}
          <div class="winos-actions">${btn('OK', 'ipv4-ok', `data-nic="${esc(ctx.nic)}"`, 'primary')}
          ${btn('Cancel', 'back-nics')}</div>
        </div>`;
      }
      return `<div class="winos-pad">
        <div class="winos-h">Network Connections</div>
        <div class="winos-note">ดับเบิลคลิกที่การ์ด → Properties → Internet Protocol Version 4 (TCP/IPv4)</div>
        <div class="winos-grid">
          ${Object.entries(s.nics).map(([k, n]) => `<div class="winos-item">
            <div class="winos-item-ic">🔌</div>
            <div><b>${esc(k)}</b><div class="winos-sub">${n.status === 'Up' ? (n.dhcp ? 'Enabled · DHCP' : 'Enabled · Static ' + n.ip) : 'Network cable unplugged'}</div></div>
            <div class="winos-item-act">
              ${btn('Properties', 'nic-props', `data-nic="${esc(k)}"`, 'primary')}
              ${btn(n.status === 'Up' ? 'Disable' : 'Enable', 'nic-toggle', `data-nic="${esc(k)}"`)}
            </div></div>`).join('')}
        </div></div>`;
    },

    'services.msc': (s) => `<div class="winos-pad">
      <div class="winos-h">Services (Local)</div>
      <div class="winos-note">คลิกเลือก service แล้วใช้ปุ่ม Start / Stop / Restart หรือเปลี่ยน Startup Type</div>
      <table class="winos-tbl">
        <tr><th>Name</th><th>Description</th><th>Status</th><th>Startup Type</th><th>Actions</th></tr>
        ${Object.entries(s.services).map(([k, v]) => `<tr>
          <td><b>${esc(k)}</b></td><td class="winos-sub">${esc(v.display)}</td>
          <td>${v.status === 'Running' ? '<span class="winos-ok">Running</span>' : '<span class="winos-mute">Stopped</span>'}</td>
          <td>
            <select class="winos-sel" data-do="svc-startup" data-svc="${esc(k)}">
              ${['Automatic', 'Manual', 'Disabled'].map(o => `<option ${v.start === o ? 'selected' : ''}>${o}</option>`).join('')}
            </select>
          </td>
          <td class="winos-nowrap">
            ${btn('Start', 'svc-start', `data-svc="${esc(k)}"`)}
            ${btn('Stop', 'svc-stop', `data-svc="${esc(k)}"`)}
            ${btn('Restart', 'svc-restart', `data-svc="${esc(k)}"`)}
          </td></tr>`).join('')}
      </table></div>`,

    'taskmgr': (s) => `<div class="winos-pad">
      <div class="winos-h">Task Manager — Processes</div>
      ${T(['Name', 'User', 'CPU', 'Memory', ''],
      s.processes.map(p => [`<b>${esc(p.name)}</b> <span class="winos-sub">PID ${p.pid}</span>`,
      esc(p.user), p.cpu.toFixed(1) + '%', p.mem.toLocaleString() + ' K',
      btn('End task', 'proc-kill', `data-pid="${p.pid}"`, 'danger')]))}
      <div class="winos-sep"></div>
      <div class="winos-h">Services</div>
      ${T(['Name', 'Status'], Object.entries(s.services).slice(0, 5).map(([k, v]) =>
        [esc(k), v.status === 'Running' ? '<span class="winos-ok">Running</span>' : '<span class="winos-mute">Stopped</span>']))}
    </div>`,

    'lusrmgr.msc': (s, ctx) => `<div class="winos-pad">
      <div class="winos-h">Local Users and Groups</div>
      <div class="winos-tabs">
        ${btn('Users', 'lu-tab', 'data-tab="users"', ctx.tab !== 'groups' ? 'primary' : '')}
        ${btn('Groups', 'lu-tab', 'data-tab="groups"', ctx.tab === 'groups' ? 'primary' : '')}
      </div>
      ${ctx.tab === 'groups' ? `
        ${T(['Group', 'Members'], Object.entries(s.localGroups).map(([g, m]) => [`<b>${esc(g)}</b>`, m.join(', ') || '<span class="winos-mute">(ว่าง)</span>']))}
        <div class="winos-sep"></div>
        <div class="winos-h">Add member to group</div>
        <div class="winos-row">
          <select class="winos-sel" id="g-grp">${Object.keys(s.localGroups).map(g => `<option>${esc(g)}</option>`).join('')}</select>
          <select class="winos-sel" id="g-usr">${Object.keys(s.localUsers).map(u => `<option>${esc(u)}</option>`).join('')}</select>
          ${btn('Add', 'lu-addmember', '', 'primary')}
        </div>` : `
        ${T(['User', 'Full name', 'Status'], Object.entries(s.localUsers).map(([u, v]) =>
        [`<b>${esc(u)}</b>`, esc(v.desc || ''), v.enabled ? '<span class="winos-ok">Enabled</span>' : '<span class="winos-mute">Disabled</span>']))}
        <div class="winos-sep"></div>
        <div class="winos-h">New User</div>
        <div class="winos-row">${field('User name', 'g-newuser')}${field('Description', 'g-newdesc')}
        ${btn('Create', 'lu-newuser', '', 'primary')}</div>`}
    </div>`,

    'dsa.msc': (s, ctx) => {
      if (!s.domain) return `<div class="winos-pad">
        <div class="winos-h">Active Directory Users and Computers</div>
        <div class="winos-err">Naming information cannot be located — เครื่องนี้ยังไม่ได้เป็น Domain Controller<br>
        เปิด <b>Server Manager</b> เพื่อติดตั้ง role AD DS และสร้างโดเมนก่อน</div>
        <div class="winos-actions">${btn('เปิด Server Manager', 'goto-sm', '', 'primary')}</div></div>`;
      return `<div class="winos-pad">
        <div class="winos-h">Active Directory Users and Computers — ${esc(s.domain)}</div>
        <div class="winos-cols">
          <div class="winos-tree">
            <div class="winos-node root">🏢 ${esc(s.domain)}</div>
            ${s.adOUs.map(o => `<div class="winos-node">📁 ${esc(o)}</div>`).join('')}
            <div class="winos-node">📁 Users</div>
          </div>
          <div style="flex:1;min-width:0">
            ${T(['Name', 'Type', 'Status', 'Location'], [
        ...Object.values(s.adUsers).map(u => [`<b>${esc(u.name)}</b> <span class="winos-sub">${esc(u.sam)}</span>`, 'User',
          (u.enabled ? '<span class="winos-ok">Enabled</span>' : '<span class="winos-mute">Disabled</span>')
          + (u.mustChange ? ' <span class="winos-warn">· ต้องเปลี่ยนรหัส</span>' : ''),
          `<span class="winos-sub">${esc(String(u.path || '').split(',')[0])}</span>`]),
        ...Object.keys(s.adGroups).map(g => [`<b>${esc(g)}</b>`, 'Group', `${s.adGroups[g].length} members`, '<span class="winos-sub">CN=Users</span>']),
      ])}
          </div>
        </div>
        <div class="winos-sep"></div>
        <div class="winos-h">New Organizational Unit</div>
        <div class="winos-row">${field('Name', 'g-ouname')}${btn('Create OU', 'ad-newou', '', 'primary')}</div>
        <div class="winos-h">New User</div>
        <div class="winos-row">${field('Full name', 'g-adname')}${field('User logon name', 'g-adsam')}
        ${btn('Create user', 'ad-newuser', '', 'primary')}</div>
        <div class="winos-h">New Group / Add member</div>
        <div class="winos-row">${field('Group name', 'g-adgrp')}${btn('Create group', 'ad-newgroup', '', 'primary')}</div>
        <div class="winos-row">
          <select class="winos-sel" id="g-mgrp">${Object.keys(s.adGroups).map(g => `<option>${esc(g)}</option>`).join('')}</select>
          <select class="winos-sel" id="g-musr">${Object.keys(s.adUsers).map(u => `<option>${esc(u)}</option>`).join('')}</select>
          ${btn('Add to group', 'ad-addmember', '', 'primary')}
          ${btn('Disable selected user', 'ad-disable')}
          ${btn('Enable selected user', 'ad-enable')}
        </div>
        <div class="winos-h">ย้าย OU / รีเซ็ตรหัสผ่าน</div>
        <div class="winos-row">
          ${pick('g-mvusr', Object.keys(s.adUsers))}
          ${pick('g-mvou', s.adOUs)}
          ${btn('Move to OU', 'ad-domove', '', 'primary')}
          ${btn('Reset password', 'ad-doresetpw')}
        </div>
        <div class="winos-note">ผู้ใช้ที่อยู่ใน OU จะได้รับ GPO ที่ link กับ OU นั้น — สร้างผู้ใช้เสร็จแล้วอย่าลืมย้ายเข้า OU</div>
      </div>`;
    },

    'servermanager': (s, ctx) => {
      if (ctx.view === 'addroles') {
        const FEATS = ['AD-Domain-Services', 'DNS', 'DHCP', 'Web-Server', 'File-Services', 'Hyper-V', 'Windows-Server-Backup', 'Remote-Desktop-Services'];
        return `<div class="winos-pad">
          <div class="winos-h">Add Roles and Features Wizard</div>
          <div class="winos-note">เลือก role ที่ต้องการติดตั้ง แล้วกด Install</div>
          <div class="winos-checks">
            ${FEATS.map(f => `<label><input type="checkbox" class="g-feat" value="${f}" ${s.features.has(f) ? 'checked disabled' : ''}>
              ${f} ${s.features.has(f) ? '<span class="winos-ok">(ติดตั้งแล้ว)</span>' : ''}</label>`).join('')}
          </div>
          <div class="winos-actions">${btn('Install', 'sm-install', '', 'primary')}${btn('Back', 'sm-back')}</div>
        </div>`;
      }
      if (ctx.view === 'promote') {
        return `<div class="winos-pad">
          <div class="winos-h">Active Directory Domain Services Configuration Wizard</div>
          ${s.features.has('AD-Domain-Services') ? '' : '<div class="winos-err">ต้องติดตั้ง role AD-Domain-Services ก่อน</div>'}
          <div class="winos-note">Deployment Configuration → Add a new forest</div>
          ${field('Root domain name', 'g-domain', s.domain || '', 'เช่น corp.local')}
          ${field('DSRM password', 'g-dsrm', '', 'รหัสสำหรับกู้ระบบ')}
          <div class="winos-actions">${btn('Promote to Domain Controller', 'sm-promote', '', 'primary')}${btn('Back', 'sm-back')}</div>
        </div>`;
      }
      return `<div class="winos-pad">
        <div class="winos-h">Server Manager — Dashboard</div>
        <div class="winos-cards">
          <div class="winos-card"><b>${esc(s.hostname)}</b><div class="winos-sub">${s.domain ? 'Domain: ' + esc(s.domain) : 'Workgroup: ' + esc(s.workgroup)}</div>
            <div class="winos-sub">IP ${esc(s.nics.Ethernet0.ip)}</div></div>
          <div class="winos-card"><b>Roles</b><div class="winos-sub">${[...s.features].join(', ') || '(ยังไม่มี)'}</div></div>
        </div>
        <div class="winos-actions">
          ${btn('Add roles and features', 'sm-goto', 'data-view="addroles"', 'primary')}
          ${btn('Promote this server to a domain controller', 'sm-goto', 'data-view="promote"')}
          ${btn('Local Server: Rename / Join domain', 'goto-sysdm')}
        </div>
        <div class="winos-sep"></div>
        <div class="winos-h">Local Server</div>
        ${T(['Property', 'Value'], [
        ['Computer name', esc(s.hostname)],
        ['Domain / Workgroup', esc(s.domain || s.workgroup)],
        ['Ethernet0', esc(s.nics.Ethernet0.ip) + ' / ' + s.nics.Ethernet0.prefix],
        ['Windows Firewall', 'Public: On'],
        ['Remote Desktop', s.services.TermService.status === 'Running' ? 'Enabled' : 'Disabled'],
      ])}</div>`;
    },

    'explorer': (s, ctx) => {
      const path = ctx.path || 'C:\\';
      const parts = path.replace(/\\$/, '').split('\\');
      let n = s.fs['C:\\'];
      for (const p of parts.slice(1)) {
        const k = n && n.d && Object.keys(n.c).find(x => x.toLowerCase() === p.toLowerCase());
        if (!k) { n = null; break; }
        n = n.c[k];
      }
      if (ctx.view === 'props' && ctx.target) {
        const shared = Object.entries(s.shares).find(([, v]) => v.path.toLowerCase() === ctx.target.toLowerCase());
        return `<div class="winos-pad">
          <div class="winos-h">${esc(ctx.target)} Properties</div>
          <div class="winos-tabs">
            ${btn('Sharing', 'ex-tab', 'data-tab="share"', ctx.tab !== 'sec' ? 'primary' : '')}
            ${btn('Security', 'ex-tab', 'data-tab="sec"', ctx.tab === 'sec' ? 'primary' : '')}
          </div>
          ${ctx.tab === 'sec' ? `
            <div class="winos-note">Group or user names — สิทธิ์ NTFS ที่มีผลจริงทั้งจาก local และ network</div>
            ${T(['Principal', 'Permission'], [
          ['BUILTIN\\Administrators', 'Full control'],
          ['NT AUTHORITY\\SYSTEM', 'Full control'],
          ['BUILTIN\\Users', 'Read &amp; execute'],
        ])}
            <div class="winos-row">${field('Add principal', 'g-princ', '', 'เช่น CORP\\Finance-RW')}
            <select class="winos-sel" id="g-perm"><option>Read</option><option>Modify</option><option>Full control</option></select>
            ${btn('Apply', 'ex-ntfs', '', 'primary')}</div>` : `
            <div class="winos-note">Network File and Folder Sharing</div>
            ${shared ? `<div class="winos-ok">✔ แชร์อยู่ในชื่อ <b>${esc(shared[0])}</b> — \\\\${esc(s.hostname)}\\${esc(shared[0])}</div>`
            : '<div class="winos-mute">โฟลเดอร์นี้ยังไม่ถูกแชร์</div>'}
            <div class="winos-row">${field('Share name', 'g-sharename', shared ? shared[0] : (ctx.target.split('\\').pop() || ''))}
            ${btn('Share', 'ex-share', `data-target="${esc(ctx.target)}"`, 'primary')}</div>`}
          <div class="winos-actions">${btn('Close', 'ex-back')}</div>
        </div>`;
      }
      return `<div class="winos-pad">
        <div class="winos-h">📁 ${esc(path)}</div>
        <div class="winos-row">
          ${parts.length > 1 ? btn('⬆ Up', 'ex-up', `data-path="${esc(parts.slice(0, -1).join('\\') || 'C:')}"`) : ''}
          ${field('New folder name', 'g-newdir')}${btn('New folder', 'ex-newdir', `data-path="${esc(path)}"`, 'primary')}
        </div>
        ${n && n.d ? `<div class="winos-grid">
          ${Object.entries(n.c).map(([k, v]) => `<div class="winos-item">
            <div class="winos-item-ic">${v.d ? '📁' : '📄'}</div>
            <div><b>${esc(k)}</b><div class="winos-sub">${v.d ? 'File folder' : String(v.c).length + ' bytes'}</div></div>
            <div class="winos-item-act">
              ${v.d ? btn('Open', 'ex-open', `data-path="${esc((path.replace(/\\$/, '')) + '\\' + k)}"`) : ''}
              ${btn('Properties', 'ex-props', `data-target="${esc((path.replace(/\\$/, '')) + '\\' + k)}"`, 'primary')}
            </div></div>`).join('') || '<div class="winos-mute">(โฟลเดอร์ว่าง)</div>'}
        </div>` : '<div class="winos-err">ไม่พบ path นี้</div>'}
      </div>`;
    },

    'wf.msc': (s) => `<div class="winos-pad">
      <div class="winos-h">Windows Defender Firewall with Advanced Security</div>
      ${T(['Profile', 'State', 'Inbound'], [['Domain', '<span class="winos-ok">On</span>', 'Block (default)'],
      ['Private', '<span class="winos-ok">On</span>', 'Block (default)'], ['Public', '<span class="winos-ok">On</span>', 'Block (default)']])}
      <div class="winos-sep"></div>
      <div class="winos-h">Inbound Rules</div>
      ${s.fwRules.length ? T(['Name', 'Direction', 'Action', 'Port'],
      s.fwRules.map(r => [`<b>${esc(r.name)}</b>`, esc(r.dir), r.action === 'Allow' ? '<span class="winos-ok">Allow</span>' : '<span class="winos-bad">Block</span>', esc(r.port || '—')]))
      : '<div class="winos-mute">(ยังไม่มี rule ที่สร้างเอง)</div>'}
      <div class="winos-sep"></div>
      <div class="winos-h">New Inbound Rule Wizard</div>
      <div class="winos-row">${field('Name', 'g-fwname')}${field('Local port', 'g-fwport', '', 'เช่น 80')}
        <select class="winos-sel" id="g-fwaction"><option>Allow</option><option>Block</option></select>
        ${btn('Finish', 'fw-add', '', 'primary')}</div></div>`,

    'eventvwr': (s) => `<div class="winos-pad">
      <div class="winos-h">Event Viewer — Windows Logs ▸ Security</div>
      ${T(['Level', 'Date and Time', 'Event ID', 'Source', 'Task'], [
      ['<span class="winos-ok">Information</span>', '21/8/2569 09:12:40', '4624', 'Microsoft-Windows-Security-Auditing', 'Logon'],
      ['<span class="winos-bad">Audit Failure</span>', '21/8/2569 09:13:55', '4625', 'Microsoft-Windows-Security-Auditing', 'Logon'],
      ['<span class="winos-bad">Audit Failure</span>', '21/8/2569 09:13:58', '4625', 'Microsoft-Windows-Security-Auditing', 'Logon'],
      ['<span class="winos-warn">Warning</span>', '21/8/2569 09:14:02', '4740', 'Microsoft-Windows-Security-Auditing', 'User Account Lockout'],
      ['<span class="winos-ok">Information</span>', '21/8/2569 08:55:12', '7045', 'Service Control Manager', 'Service installed'],
    ])}
      <div class="winos-note">4624 = ล็อกอินสำเร็จ · 4625 = ล็อกอินล้มเหลว · 4740 = บัญชีถูกล็อก · 7045 = ติดตั้ง service ใหม่</div>
      <div class="winos-actions">${btn('Refresh', 'ev-refresh')}</div></div>`,

    'sysdm.cpl': (s) => `<div class="winos-pad">
      <div class="winos-h">System Properties — Computer Name</div>
      ${T(['Property', 'Value'], [['Full computer name', esc(s.hostname) + (s.domain ? '.' + esc(s.domain) : '')],
      [s.domain ? 'Domain' : 'Workgroup', esc(s.domain || s.workgroup)]])}
      <div class="winos-sep"></div>
      <div class="winos-h">Computer Name/Domain Changes</div>
      ${field('Computer name', 'g-cname', s.hostname)}
      <div class="winos-radio">
        <label><input type="radio" name="memb" value="domain" ${s.domain ? 'checked' : ''}> Member of Domain</label>
        <label><input type="radio" name="memb" value="wg" ${s.domain ? '' : 'checked'}> Member of Workgroup</label>
      </div>
      ${field('Domain / Workgroup', 'g-cdomain', s.domain || s.workgroup)}
      <div class="winos-actions">${btn('OK', 'sys-ok', '', 'primary')}</div>
      <div class="winos-note">การเปลี่ยนชื่อเครื่องหรือเข้าโดเมนต้องรีสตาร์ทจึงจะมีผลจริง</div></div>`,

    'cmd': (s, ctx) => `<div class="winos-pad">
      <div class="winos-h">Command Prompt</div>
      <div class="winos-console" id="g-console">${(ctx.lines || ['Microsoft Windows [Version 10.0.20348.2340]', '(c) Microsoft Corporation. All rights reserved.', '']).map(l =>
      `<div class="${l.c || ''}">${esc(typeof l === 'string' ? l : l.s)}</div>`).join('')}</div>
      <div class="winos-row"><input class="winos-cmdin" id="g-cmd" placeholder="พิมพ์คำสั่งแล้วกด Enter เช่น ipconfig /all">
      ${btn('Run', 'cmd-run', '', 'primary')}</div></div>`,

    // ---------------- DNS Manager ----------------
    'dnsmgmt.msc': (s, ctx) => {
      if (!s.features.has('DNS')) return `<div class="winos-pad">
        <div class="winos-h">DNS Manager</div>
        <div class="winos-err">เครื่องนี้ยังไม่ได้ติดตั้ง role <b>DNS</b><br>
        เปิด Server Manager → Add roles and features → ติ๊ก DNS → Install</div>
        <div class="winos-actions">${btn('เปิด Server Manager', 'goto-sm', '', 'primary')}</div></div>`;

      const zones = s.dnsZones || [];
      const fwd = s.dnsForwarders || [];
      const countOf = z => (s.dnsRecords || []).filter(r => String(r.zone).toLowerCase() === String(z.name).toLowerCase()).length;

      if (ctx.zone) {
        const z = zoneOf(s, ctx.zone);
        if (!z) return `<div class="winos-pad"><div class="winos-err">ไม่พบโซนนี้</div>
          <div class="winos-actions">${btn('⬅ Back', 'dns-back')}</div></div>`;
        const rev = isReverse(z.name);
        const recs = (s.dnsRecords || []).filter(r => String(r.zone).toLowerCase() === String(z.name).toLowerCase());
        return `<div class="winos-pad">
          <div class="winos-h">${esc(z.name)} — ${rev ? 'Reverse Lookup Zone' : 'Forward Lookup Zone'}</div>
          <div class="winos-note">A = ชื่อ→IP · CNAME = ชื่อเล่นชี้ไปชื่อจริง · PTR = IP→ชื่อ (ใช้ใน reverse zone)</div>
          ${T(['Name', 'Type', 'Data', ''], [
        ['<b>(same as parent folder)</b>', 'SOA', `${esc(s.hostname)}.${esc(s.domain || 'local')}.`, ''],
        ...recs.map(r => [`<b>${esc(r.name)}</b>`, esc(r.type), esc(r.data),
          btn('Delete', 'dns-delrec', `data-zone="${esc(r.zone)}" data-rname="${esc(r.name)}" data-rtype="${esc(r.type)}"`, 'danger')]),
      ])}
          <div class="winos-sep"></div>
          <div class="winos-h">New Resource Record</div>
          <div class="winos-row">
            ${field(rev ? 'Host IP (เลขท้าย)' : 'Name', 'g-recname', '', rev ? 'เช่น 20' : 'เช่น srv-app01')}
            ${pick('g-rectype', rev ? ['PTR'] : ['A', 'CNAME', 'MX', 'TXT'])}
            ${field('Data', 'g-recdata', '', rev ? 'เช่น srv-app01.corp.local' : 'เช่น 192.168.10.20')}
            ${btn('Add record', 'dns-addrec', `data-zone="${esc(z.name)}"`, 'primary')}
          </div>
          <div class="winos-actions">${btn('⬅ Back to zones', 'dns-back')}</div></div>`;
      }

      const listOf = rev => {
        const arr = zones.filter(z => isReverse(z.name) === rev);
        return arr.length ? `<div class="winos-grid">${arr.map(z => `<div class="winos-item">
          <div class="winos-item-ic">🗂️</div>
          <div><b>${esc(z.name)}</b><div class="winos-sub">${esc(z.type)} · Dynamic updates: ${esc(z.dynamic)} · ${countOf(z)} records</div></div>
          <div class="winos-item-act">${btn('Open', 'dns-openzone', `data-zone="${esc(z.name)}"`, 'primary')}</div>
        </div>`).join('')}</div>` : '<div class="winos-mute">(ยังไม่มีโซน)</div>';
      };

      return `<div class="winos-pad">
        <div class="winos-h">DNS Manager — ${esc(s.hostname)}</div>
        <div class="winos-note">โซนคือสมุดรายชื่อของโดเมนหนึ่ง · Forward = ชื่อ→IP · Reverse = IP→ชื่อ</div>
        <div class="winos-h">Forward Lookup Zones</div>
        ${listOf(false)}
        <div class="winos-h" style="margin-top:12px">Reverse Lookup Zones</div>
        ${listOf(true)}
        <div class="winos-sep"></div>
        <div class="winos-h">New Zone Wizard</div>
        <div class="winos-row">
          <select class="winos-sel" id="g-zonekind">
            <option value="forward">Forward Lookup Zone</option>
            <option value="reverse">Reverse Lookup Zone</option>
          </select>
          ${field('ชื่อโซน / Network ID', 'g-zonename', '', 'corp.local หรือ 192.168.10')}
          ${pick('g-zonedyn', ['None', 'Secure', 'NonsecureAndSecure'])}
          ${btn('Create zone', 'dns-addzone', '', 'primary')}
        </div>
        <div class="winos-sep"></div>
        <div class="winos-h">Forwarders</div>
        ${fwd.length ? T(['IP address', 'สถานะ'], fwd.map(f => [esc(f), '<span class="winos-ok">OK</span>']))
        : '<div class="winos-mute">(ยังไม่ได้ตั้ง forwarder — คิวรีที่ไม่รู้จักจะวิ่งไป root hints)</div>'}
        <div class="winos-row">${field('Forwarder IP', 'g-fwdip', '', 'เช่น 8.8.8.8')}
        ${btn('Add forwarder', 'dns-addfwd', '', 'primary')}</div>
      </div>`;
    },

    // ---------------- Group Policy Management ----------------
    'gpmc.msc': (s, ctx) => {
      if (!s.domain) return `<div class="winos-pad">
        <div class="winos-h">Group Policy Management</div>
        <div class="winos-err">เครื่องนี้ยังไม่มีโดเมน — Group Policy ใช้ได้เฉพาะเมื่อมี Active Directory</div>
        <div class="winos-actions">${btn('เปิด Server Manager', 'goto-sm', '', 'primary')}</div></div>`;

      const cfgAll = s.gpoSettings || {};

      if (ctx.view === 'edit' && ctx.gpo) {
        const cfg = cfgAll[ctx.gpo] || {};
        return `<div class="winos-pad">
          <div class="winos-h">Group Policy Management Editor — ${esc(ctx.gpo)}</div>
          <div class="winos-note">เลือกค่าที่ต้องการบังคับ · ค่าที่เป็น ${esc(NOT_SET)} จะไม่ไปทับ policy อื่น</div>
          <div class="winos-row">
            ${GPO_SETTINGS.map(g => `<label class="winos-fld" style="min-width:270px"><span>${esc(g.label)}</span>
              <select class="winos-sel" data-do="gpo-setopt" data-gpo="${esc(ctx.gpo)}" data-key="${g.k}">
                ${[NOT_SET, ...g.opts].map(o => `<option ${String(cfg[g.k] || NOT_SET) === o ? 'selected' : ''}>${esc(o)}</option>`).join('')}
              </select></label>`).join('')}
          </div>
          <div class="winos-sep"></div>
          <div class="winos-h">ค่าที่ตั้งไว้แล้ว</div>
          ${Object.keys(cfg).length ? T(['Setting', 'Value'], Object.entries(cfg).map(([k, v]) => [esc(k), `<b>${esc(v)}</b>`]))
        : '<div class="winos-mute">(ยังไม่ได้ตั้งค่าใด)</div>'}
          <div class="winos-actions">${btn('⬅ Back', 'gpo-back')}</div></div>`;
      }

      const targets = [s.domain, ...s.adOUs.map(o => `OU=${o},${dnOf(s)}`)];
      return `<div class="winos-pad">
        <div class="winos-h">Group Policy Management — Forest: ${esc(s.domain)}</div>
        <div class="winos-cols">
          <div class="winos-tree">
            <div class="winos-node root">🌐 Forest: ${esc(s.domain)}</div>
            <div class="winos-node">🏢 Domain: ${esc(s.domain)}</div>
            ${s.adOUs.map(o => `<div class="winos-node">📁 ${esc(o)}</div>`).join('')}
            <div class="winos-node">📄 Group Policy Objects (${s.gpos.length})</div>
          </div>
          <div style="flex:1;min-width:0">
            ${T(['GPO', 'Settings', 'Linked to', ''], s.gpos.map(g => [
        `<b>${esc(g)}</b>`,
        Object.keys(cfgAll[g] || {}).length ? `${Object.keys(cfgAll[g]).length} ค่า` : '<span class="winos-mute">ยังไม่ตั้ง</span>',
        s.gpLinks.filter(l => l.gpo === g).map(l => esc(l.target) + (l.enforced === 'Yes' ? ' <span class="winos-warn">(Enforced)</span>' : '')).join('<br>')
        || '<span class="winos-mute">— ยังไม่ link</span>',
        btn('Edit', 'gpo-edit', `data-gpo="${esc(g)}"`, 'primary'),
      ]))}
          </div>
        </div>
        <div class="winos-sep"></div>
        <div class="winos-h">New GPO</div>
        <div class="winos-row">${field('ชื่อ GPO', 'g-gponame', '', 'เช่น IT-Security-Policy')}
        ${btn('Create GPO', 'gpo-create', '', 'primary')}</div>
        <div class="winos-h">Link an Existing GPO</div>
        <div class="winos-row">
          ${pick('g-lgpo', s.gpos)}
          ${pick('g-ltarget', targets)}
          ${btn('Link', 'gpo-dolink', '', 'primary')}
        </div>
        ${s.gpLinks.length ? `<div class="winos-h">Links</div>
        ${T(['GPO', 'Target', 'Enforced', ''], s.gpLinks.map(l => [esc(l.gpo), esc(l.target),
        l.enforced === 'Yes' ? '<span class="winos-ok">Yes</span>' : 'No',
        btn(l.enforced === 'Yes' ? 'Remove Enforced' : 'Enforced', 'gpo-doenforce', `data-gpo="${esc(l.gpo)}" data-target="${esc(l.target)}"`)
        + btn('Unlink', 'gpo-dounlink', `data-gpo="${esc(l.gpo)}" data-target="${esc(l.target)}"`, 'danger')]))}` : ''}
        <div class="winos-actions">${btn('Run gpupdate /force', 'gpo-update', '', 'primary')}</div>
        <div class="winos-note">ลำดับการบังคับใช้: Local → Site → Domain → OU (ตัวหลังทับตัวหน้า) ยกเว้น link ที่ตั้ง Enforced ไว้</div>
      </div>`;
    },

    // ---------------- DHCP ----------------
    'dhcpmgmt.msc': (s) => {
      if (!s.features.has('DHCP')) return `<div class="winos-pad">
        <div class="winos-h">DHCP</div>
        <div class="winos-err">เครื่องนี้ยังไม่ได้ติดตั้ง role <b>DHCP</b><br>
        เปิด Server Manager → Add roles and features → ติ๊ก DHCP → Install</div>
        <div class="winos-actions">${btn('เปิด Server Manager', 'goto-sm', '', 'primary')}</div></div>`;

      return `<div class="winos-pad">
        <div class="winos-h">DHCP — ${esc(s.hostname)}${s.domain ? '.' + esc(s.domain) : ''}</div>
        ${s.dhcpAuthorized
        ? '<div class="winos-note"><span class="winos-ok">✔ Authorized ใน Active Directory</span> — พร้อมแจก IP</div>'
        : `<div class="winos-err">เซิร์ฟเวอร์ยังไม่ถูก authorize — DHCP ที่ไม่ได้ authorize ในโดเมนจะไม่แจก IP ให้ใครเลย</div>
          <div class="winos-actions">${btn('Authorize this server', 'dhcp-auth', '', 'primary')}</div>`}
        <div class="winos-sep"></div>
        <div class="winos-h">IPv4 ▸ Scopes</div>
        ${s.dhcpScopes.length ? T(['Scope', 'Range', 'Subnet mask', 'Router (003)', 'DNS (006)', 'State'],
        s.dhcpScopes.map(sc => [`<b>${esc(sc.name)}</b>`, `${esc(sc.start)} – ${esc(sc.end)}`, esc(sc.mask),
          sc.router ? esc(sc.router) : '<span class="winos-mute">—</span>',
          sc.dns ? esc(sc.dns) : '<span class="winos-mute">—</span>',
          '<span class="winos-ok">' + esc(sc.state) + '</span>']))
        : '<div class="winos-mute">(ยังไม่มี scope)</div>'}
        <div class="winos-h">New Scope Wizard</div>
        <div class="winos-row">
          ${field('Scope name', 'g-scname', '', 'เช่น Office-LAN')}
          ${field('Start IP', 'g-scstart', '', '192.168.10.100')}
          ${field('End IP', 'g-scend', '', '192.168.10.200')}
          ${field('Subnet mask', 'g-scmask', '255.255.255.0')}
          ${btn('Create scope', 'dhcp-addscope', '', 'primary')}
        </div>
        ${s.dhcpScopes.length ? `<div class="winos-h">Scope Options</div>
        <div class="winos-row">
          ${pick('g-scopt', s.dhcpScopes.map(sc => sc.name))}
          ${field('003 Router', 'g-scrouter', '', '192.168.10.1')}
          ${field('006 DNS Servers', 'g-scdns', '', '192.168.10.10')}
          ${btn('Apply options', 'dhcp-setopt', '', 'primary')}
        </div>` : ''}
        <div class="winos-sep"></div>
        <div class="winos-h">Reservations</div>
        ${s.dhcpReservations.length ? T(['IP address', 'MAC / Client ID', 'Description'],
        s.dhcpReservations.map(r => [`<b>${esc(r.ip)}</b>`, esc(r.mac), esc(r.desc || '')]))
        : '<div class="winos-mute">(ยังไม่มี reservation)</div>'}
        <div class="winos-row">
          ${field('IP address', 'g-resip', '', '192.168.10.150')}
          ${field('MAC address', 'g-resmac', '', '00-0c-29-5b-11-a2')}
          ${field('Description', 'g-resdesc', '', 'เช่น Printer-HR')}
          ${btn('Add reservation', 'dhcp-addres', '', 'primary')}
        </div>
        <div class="winos-note">Reservation คือการจอง IP ให้เครื่องที่ MAC ตรงกัน — เหมาะกับปริ้นเตอร์หรือกล้องวงจรปิด</div>
      </div>`;
    },

    // ---------------- Task Scheduler ----------------
    'taskschd.msc': (s) => `<div class="winos-pad">
      <div class="winos-h">Task Scheduler — Task Scheduler Library</div>
      ${T(['Name', 'Status', 'Triggers', 'Actions', ''], s.scheduledTasks.map(t => [
      `<b>${esc(t.name)}</b>`,
      t.state === 'Disabled' ? '<span class="winos-mute">Disabled</span>' : '<span class="winos-ok">Ready</span>',
      esc(t.trigger || 'Daily'),
      esc(t.action || '—'),
      btn('Run', 'task-dorun', `data-tname="${esc(t.name)}"`)
      + btn(t.state === 'Disabled' ? 'Enable' : 'Disable', 'task-dotoggle', `data-tname="${esc(t.name)}"`),
    ]))}
      <div class="winos-sep"></div>
      <div class="winos-h">Create Basic Task</div>
      <div class="winos-row">
        ${field('Name', 'g-tkname', '', 'เช่น Nightly-Backup')}
        ${pick('g-tktrig', ['Daily', 'Weekly', 'At startup', 'At log on'])}
        ${field('Program / script', 'g-tkact', '', 'เช่น C:\\Scripts\\backup.ps1')}
        ${btn('Create', 'task-create', '', 'primary')}
      </div>
      <div class="winos-note">งานที่ต้องทำซ้ำ ๆ เช่น backup หรือล้าง log ควรตั้งเป็น scheduled task แทนการจำทำเอง</div>
    </div>`,
  };

  // ---------- การกระทำเมื่อคลิก ----------
  function handle(w, what, data, srcEl) {
    const s = st();
    const val = id => { const e = w.el.querySelector('#' + id); return e ? e.value.trim() : ''; };
    const radio = name => { const e = w.el.querySelector(`input[name="${name}"]:checked`); return e ? e.value : ''; };
    const run = (a, params) => { const line = GUI_ACTIONS[a](s, params); if (line) act(line); };

    switch (what) {
      // ---- Network Connections ----
      case 'nic-props': w.ctx = { view: 'ipv4', nic: data.nic }; run('nic-props', { nic: data.nic }); break;
      case 'back-nics': w.ctx = {}; break;
      case 'nic-toggle': run('nic-toggle', { nic: data.nic }); break;
      case 'ipv4-ok': {
        if (radio('ipmode') === 'dhcp') run('ip-dhcp', { nic: data.nic });
        else {
          const ip = val('g-ip');
          if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) { alert('IP address ไม่ถูกต้อง'); return; }
          run('ip-static', { nic: data.nic, ip, mask: val('g-mask'), gw: val('g-gw') });
        }
        if (radio('dnsmode') === 'static' && val('g-dns1')) run('dns-set', { nic: data.nic, dns1: val('g-dns1'), dns2: val('g-dns2') });
        else if (radio('dnsmode') === 'auto') run('dns-auto', { nic: data.nic });
        w.ctx = {};
        break;
      }
      // ---- Services ----
      case 'svc-start': run('service-start', { svc: data.svc }); break;
      case 'svc-stop': run('service-stop', { svc: data.svc }); break;
      case 'svc-restart': run('service-restart', { svc: data.svc }); break;
      case 'svc-startup': run('service-startup', { svc: data.svc, value: srcEl.value }); break;
      // ---- Task Manager ----
      case 'proc-kill': run('kill', { pid: data.pid }); break;
      // ---- Local users and groups ----
      case 'lu-tab': w.ctx.tab = data.tab; break;
      case 'lu-newuser': {
        const u = val('g-newuser');
        if (!u) { alert('ใส่ชื่อผู้ใช้ก่อน'); return; }
        if (s.localUsers[u]) { alert('มีผู้ใช้นี้แล้ว'); return; }
        run('localuser-new', { user: u, desc: val('g-newdesc') });
        break;
      }
      case 'lu-addmember': run('localgroup-add', { group: val('g-grp'), user: val('g-usr') }); break;
      // ---- Server Manager ----
      case 'goto-sm': openApp('servermanager'); return;
      case 'goto-sysdm': openApp('sysdm.cpl'); return;
      case 'sm-goto': w.ctx = { view: data.view }; run('sm-view', { view: data.view }); break;
      case 'sm-back': w.ctx = {}; break;
      case 'sm-install': {
        const picked = [...w.el.querySelectorAll('.g-feat:checked:not([disabled])')].map(c => c.value);
        if (!picked.length) { alert('เลือก role ที่จะติดตั้งก่อน'); return; }
        picked.forEach(f => run('install-role', { role: f }));
        w.ctx = {};
        break;
      }
      case 'sm-promote': {
        if (!s.features.has('AD-Domain-Services')) { alert('ต้องติดตั้ง role AD-Domain-Services ก่อน'); return; }
        const d = val('g-domain');
        if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(d)) { alert('ใส่ชื่อโดเมนให้ถูกต้อง เช่น corp.local'); return; }
        run('promote-dc', { domain: d });
        w.ctx = {};
        break;
      }
      // ---- Active Directory ----
      case 'ad-newou': {
        if (!val('g-ouname')) { alert('ใส่ชื่อ OU'); return; }
        run('ad-newou', { name: val('g-ouname') });
        break;
      }
      case 'ad-newuser': {
        const name = val('g-adname'), sam = val('g-adsam');
        if (!name || !sam) { alert('ใส่ทั้งชื่อเต็มและ logon name'); return; }
        if (s.adUsers[sam.toLowerCase()]) { alert('มีผู้ใช้นี้แล้ว'); return; }
        run('ad-newuser', { name, sam });
        break;
      }
      case 'ad-newgroup': {
        if (!val('g-adgrp')) { alert('ใส่ชื่อกลุ่ม'); return; }
        run('ad-newgroup', { name: val('g-adgrp') });
        break;
      }
      case 'ad-addmember': run('ad-addmember', { group: val('g-mgrp'), user: val('g-musr') }); break;
      case 'ad-disable': run('ad-disable', { user: val('g-musr') }); break;
      case 'ad-enable': run('ad-enable', { user: val('g-musr') }); break;
      // ---- File Explorer ----
      case 'ex-open': w.ctx = { path: data.path }; break;
      case 'ex-up': w.ctx = { path: data.path.endsWith(':') ? data.path + '\\' : data.path }; break;
      case 'ex-props': w.ctx = { view: 'props', target: data.target, path: w.ctx.path }; run('props', { target: data.target }); break;
      case 'ex-tab': w.ctx.tab = data.tab; break;
      case 'ex-back': w.ctx = { path: w.ctx.path || 'C:\\' }; break;
      case 'ex-newdir': {
        if (!val('g-newdir')) { alert('ใส่ชื่อโฟลเดอร์'); return; }
        run('newfolder', { path: data.path, name: val('g-newdir') });
        break;
      }
      case 'ex-share': {
        if (!val('g-sharename')) { alert('ใส่ชื่อ share'); return; }
        run('share', { name: val('g-sharename'), target: data.target });
        break;
      }
      case 'ex-ntfs': {
        if (!val('g-princ')) { alert('ใส่ชื่อ user/group'); return; }
        run('ntfs', { principal: val('g-princ'), perm: val('g-perm') });
        alert(`ให้สิทธิ์ ${val('g-perm')} แก่ ${val('g-princ')} เรียบร้อย`);
        break;
      }
      // ---- Firewall ----
      case 'fw-add': {
        if (!val('g-fwname')) { alert('ใส่ชื่อ rule'); return; }
        run('fw-rule', { name: val('g-fwname'), port: val('g-fwport'), action: val('g-fwaction') });
        break;
      }
      // ---- System Properties ----
      case 'sys-ok': {
        const nm = val('g-cname'), dm = val('g-cdomain');
        if (nm && nm !== s.hostname) run('rename', { name: nm });
        if (radio('memb') === 'domain' && dm && dm !== s.domain) run('joindomain', { domain: dm });
        if (radio('memb') === 'wg') { s.workgroup = dm || 'WORKGROUP'; s.domain = null; }
        alert('บันทึกแล้ว — ในระบบจริงต้องรีสตาร์ทเครื่อง');
        break;
      }
      // ---- Active Directory: ย้าย OU / รีเซ็ตรหัส ----
      case 'ad-domove': {
        const u = val('g-mvusr'), ou = val('g-mvou');
        if (!u || !ou) { alert('ต้องมีทั้งผู้ใช้และ OU ก่อน'); return; }
        run('ad-moveou', { user: u, ou });
        break;
      }
      case 'ad-doresetpw': {
        const u = val('g-mvusr');
        if (!u) { alert('เลือกผู้ใช้ก่อน'); return; }
        run('ad-resetpw', { user: u });
        alert(`รีเซ็ตรหัสผ่านของ ${u} แล้ว — ผู้ใช้ต้องเปลี่ยนรหัสตอนล็อกอินครั้งถัดไป`);
        break;
      }

      // ---- DNS Manager ----
      case 'dns-openzone': w.ctx = { zone: data.zone }; act('gui:dns-openzone', data.zone); break;
      case 'dns-back': w.ctx = {}; break;
      case 'dns-addzone': {
        const kind = val('g-zonekind');
        let name = val('g-zonename');
        if (!name) { alert('ใส่ชื่อโซนหรือ Network ID ก่อน'); return; }
        if (kind === 'reverse') {
          const oct = name.replace(/\.$/, '').split('.').filter(Boolean);
          if (oct.length < 2 || oct.length > 3 || oct.some(o => !/^\d{1,3}$/.test(o))) {
            alert('Reverse zone ต้องใส่ Network ID เป็นตัวเลข เช่น 192.168.10');
            return;
          }
          name = oct.slice().reverse().join('.') + '.in-addr.arpa';
        }
        if (zoneOf(s, name)) { alert(`มีโซน ${name} อยู่แล้ว`); return; }
        run('dns-newzone', { name, kind, dynamic: val('g-zonedyn') });
        break;
      }
      case 'dns-addrec': {
        const name = val('g-recname'), type = val('g-rectype'), rdata = val('g-recdata');
        if (!name || !rdata) { alert('ใส่ Name และ Data ให้ครบ'); return; }
        if (type === 'A' && !/^\d{1,3}(\.\d{1,3}){3}$/.test(rdata)) { alert('A record ต้องใส่ IP address ในช่อง Data'); return; }
        run('dns-newrecord', { zone: data.zone, name, type, data: rdata });
        break;
      }
      case 'dns-delrec': run('dns-delrecord', { zone: data.zone, name: data.rname, type: data.rtype }); break;
      case 'dns-addfwd': {
        const ip = val('g-fwdip');
        if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) { alert('ใส่ IP ของ forwarder ให้ถูกต้อง'); return; }
        run('dns-forwarder', { ip });
        break;
      }

      // ---- Group Policy Management ----
      case 'gpo-create': {
        const n = val('g-gponame');
        if (!n) { alert('ใส่ชื่อ GPO ก่อน'); return; }
        if (s.gpos.includes(n)) { alert('มี GPO ชื่อนี้แล้ว'); return; }
        run('gpo-new', { name: n });
        break;
      }
      case 'gpo-dolink': run('gpo-link', { gpo: val('g-lgpo'), target: val('g-ltarget') }); break;
      case 'gpo-dounlink': run('gpo-unlink', { gpo: data.gpo, target: data.target }); break;
      case 'gpo-doenforce': run('gpo-enforce', { gpo: data.gpo, target: data.target }); break;
      case 'gpo-edit': w.ctx = { view: 'edit', gpo: data.gpo }; act('gui:gpo-edit', data.gpo); break;
      case 'gpo-back': w.ctx = {}; break;
      case 'gpo-setopt': run('gpo-set', { gpo: data.gpo, key: data.key, value: srcEl.value }); break;
      case 'gpo-update': {
        run('gpupdate', {});
        alert('gpupdate /force — นโยบายถูกนำไปใช้กับเครื่องในโดเมนแล้ว');
        break;
      }

      // ---- DHCP ----
      case 'dhcp-auth': run('dhcp-authorize', {}); break;
      case 'dhcp-addscope': {
        const name = val('g-scname'), start = val('g-scstart'), end = val('g-scend');
        const ip = x => /^\d{1,3}(\.\d{1,3}){3}$/.test(x);
        if (!name) { alert('ใส่ชื่อ scope ก่อน'); return; }
        if (!ip(start) || !ip(end)) { alert('Start / End IP ไม่ถูกต้อง'); return; }
        if (s.dhcpScopes.some(x => x.name === name)) { alert('มี scope ชื่อนี้แล้ว'); return; }
        run('dhcp-newscope', { name, start, end, mask: val('g-scmask') });
        break;
      }
      case 'dhcp-setopt': {
        const name = val('g-scopt'), router = val('g-scrouter'), dns = val('g-scdns');
        if (!router && !dns) { alert('ใส่ Router หรือ DNS อย่างน้อยหนึ่งอย่าง'); return; }
        run('dhcp-scope-option', { name, router, dns });
        break;
      }
      case 'dhcp-addres': {
        const ip = val('g-resip'), mac = val('g-resmac');
        if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(ip) || !mac) { alert('ต้องใส่ทั้ง IP และ MAC'); return; }
        run('dhcp-reservation', { ip, mac, desc: val('g-resdesc') });
        break;
      }

      // ---- Task Scheduler ----
      case 'task-create': {
        const n = val('g-tkname');
        if (!n) { alert('ใส่ชื่อ task ก่อน'); return; }
        if (s.scheduledTasks.some(t => t.name === n)) { alert('มี task ชื่อนี้แล้ว'); return; }
        run('task-new', { name: n, trigger: val('g-tktrig'), action: val('g-tkact') });
        break;
      }
      case 'task-dorun': run('task-run', { name: data.tname }); break;
      case 'task-dotoggle': run('task-toggle', { name: data.tname }); break;

      // ---- Event Viewer / Command Prompt ----
      case 'ev-refresh': run('eventlog', {}); break;
      case 'cmd-run': {
        const c = val('g-cmd');
        if (!c) return;
        const lines = w.ctx.lines || ['Microsoft Windows [Version 10.0.20348.2340]', '(c) Microsoft Corporation. All rights reserved.', ''];
        lines.push({ s: 'C:\\> ' + c, c: 'in' });
        let out = [];
        try { out = dev.exec(c) || []; } catch (e) { out = [{ s: 'error: ' + e.message, c: 'err' }]; }
        const anyErr = out.some(o => o && typeof o === 'object' && o.c === 'err');
        const anyOk = out.some(o => typeof o === 'string' ? o.trim() !== '' : (o && o.c !== 'err' && String(o.s).trim() !== ''));
        out.forEach(o => lines.push(o));
        lines.push('');
        w.ctx.lines = lines.slice(-200);
        if (!(anyErr && !anyOk)) act(c);
        break;
      }
      default: break;
    }
    repaintAll();
    if (onExec) onExec({ cmd: '', state: st(), history });
  }

  // ---------- desktop icons + start menu ----------
  const DESKTOP = ['servermanager', 'ncpa.cpl', 'dsa.msc', 'dnsmgmt.msc', 'dhcpmgmt.msc', 'gpmc.msc',
    'services.msc', 'taskmgr', 'taskschd.msc', 'explorer', 'lusrmgr.msc', 'wf.msc', 'eventvwr', 'sysdm.cpl', 'cmd'];
  $('#wicons').innerHTML = DESKTOP.map(id =>
    `<div class="winos-ico" data-app="${id}"><div class="e">${APPS[id].icon}</div><div class="l">${esc(APPS[id].title)}</div></div>`).join('');
  $('#wicons').querySelectorAll('[data-app]').forEach(i =>
    i.addEventListener('dblclick', () => openApp(i.dataset.app)));
  $('#wicons').querySelectorAll('[data-app]').forEach(i =>
    i.addEventListener('click', () => { i.classList.add('sel'); setTimeout(() => i.classList.remove('sel'), 300); }));

  $('#wmenu').innerHTML = `<div class="winos-menu-h">แอปทั้งหมด</div>` +
    DESKTOP.map(id => `<div class="winos-menu-i" data-app="${id}">${APPS[id].icon} ${esc(APPS[id].title)}</div>`).join('');
  $('#wmenu').querySelectorAll('[data-app]').forEach(i =>
    i.addEventListener('click', () => { openApp(i.dataset.app); $('#wmenu').hidden = true; }));
  $('#wstart').addEventListener('click', () => { $('#wmenu').hidden = !$('#wmenu').hidden; });
  $('#wdesk').addEventListener('click', e => { if (e.target.id === 'wdesk') $('#wmenu').hidden = true; });

  // เปิดแอปเริ่มต้นตามที่ lab กำหนด
  if (initial.openApps) initial.openApps.forEach(a => openApp(a));

  return {
    el: root,
    get device() { return dev; },
    get history() { return history; },
    focus() { },
    reset() {
      dev = createDevice('windows', initial);
      history.length = 0;
      [...open].forEach(closeApp);
      if (initial.openApps) initial.openApps.forEach(a => openApp(a));
      if (onExec) onExec({ cmd: '', state: st(), history });
    },
    openApp,
  };
}
