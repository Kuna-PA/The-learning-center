// ============================================================
//  Linux shell emulator (bash) + virtual filesystem
// ============================================================
import { words, pad, lpad, E, D, H, OK } from './util.js';

// ---- ขนาดพื้นที่: เก็บเป็น KiB เหมือนที่ df ใช้จริง แล้วค่อยจัดรูปตอนแสดง ----
const UNIT = { K: 1, M: 1024, G: 1024 ** 2, T: 1024 ** 3 };

/** '30G' → จำนวน KiB */
export function toKiB(v) {
  const m = String(v ?? '').trim().match(/^\+?([\d.]+)\s*([KMGT])?i?B?$/i);
  if (!m) return 0;
  return Math.round(parseFloat(m[1]) * (UNIT[(m[2] || 'K').toUpperCase()] || 1));
}

/** จำนวน KiB → '40G' / '8.4G' / '974M' แบบเดียวกับ df -h */
export function humanKiB(kib) {
  if (!kib) return '0';
  for (const u of ['T', 'G', 'M']) {
    const v = kib / UNIT[u];
    if (v >= 1) return (v >= 10 ? Math.round(v) : Math.round(v * 10) / 10) + u;
  }
  return Math.round(kib) + 'K';
}

const dir = (children = {}, mode = '755', owner = 'root') => ({ t: 'd', mode, owner, group: owner, children });
const file = (content = '', mode = '644', owner = 'root') => ({ t: 'f', mode, owner, group: owner, content });

function baseFs() {
  return dir({
    etc: dir({
      passwd: file('root:x:0:0:root:/root:/bin/bash\ndaemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin\nsshd:x:105:65534::/run/sshd:/usr/sbin/nologin\nstudent:x:1000:1000:Student:/home/student:/bin/bash\n'),
      group: file('root:x:0:\nsudo:x:27:student\nstudent:x:1000:\n'),
      shadow: file('root:*:19700:0:99999:7:::\nstudent:$6$xyz$hash:19800:0:99999:7:::\n', '640'),
      hostname: file('srv01\n'),
      hosts: file('127.0.0.1   localhost\n127.0.1.1   srv01\n'),
      fstab: file('UUID=8f3a-21bc  /       ext4  defaults        0 1\nUUID=1a2b-33cd  /boot   ext4  defaults        0 2\n/swap.img       none    swap  sw              0 0\n'),
      'os-release': file('NAME="Ubuntu"\nVERSION="22.04.4 LTS (Jammy Jellyfish)"\nID=ubuntu\nVERSION_ID="22.04"\n'),
      resolv: file(''),
      'resolv.conf': file('# ไฟล์นี้ systemd-resolved เป็นคนดูแล\nnameserver 127.0.0.53\noptions edns0 trust-ad\nsearch example.co.th\n'),
      ssl: dir({ 'cert.pem': file('-----BEGIN CERTIFICATE-----\n(ใบรับรองตัวอย่างของ lab)\n-----END CERTIFICATE-----\n') }),
      ssh: dir({ sshd_config: file('#Port 22\n#PermitRootLogin prohibit-password\nPasswordAuthentication yes\n') }),
      nginx: dir({ 'nginx.conf': file('user www-data;\nworker_processes auto;\nhttp {\n  server {\n    listen 80;\n    root /var/www/html;\n  }\n}\n') }),
      netplan: dir({ '01-netcfg.yaml': file('network:\n  version: 2\n  ethernets:\n    ens33:\n      dhcp4: false\n      addresses: [192.168.10.20/24]\n      routes:\n        - to: default\n          via: 192.168.10.1\n      nameservers:\n        addresses: [8.8.8.8]\n') }),
      crontab: file('# m h dom mon dow user  command\n17 *  * * *  root  cd / && run-parts --report /etc/cron.hourly\n'),
      'logrotate.d': dir({
        nginx: file('/var/log/nginx/*.log {\n  daily\n  rotate 14\n  compress\n  missingok\n}\n'),
        rsyslog: file('/var/log/syslog {\n  rotate 7\n  daily\n  compress\n}\n'),
      }),
    }),
    home: dir({
      student: dir({
        'notes.txt': file('งานที่ต้องทำวันนี้:\n- ตรวจ log ของ ssh\n- backup /var/www\n', '644', 'student'),
        scripts: dir({
          'backup.sh': file('#!/bin/bash\nset -e\nSRC=/var/www/html\nDST=/backup\ntar -czf "$DST/www-$(date +%F).tar.gz" "$SRC"\necho "backup done"\n', '644', 'student'),
        }, '755', 'student'),
      }, '755', 'student'),
    }),
    root: dir({}, '700'),
    var: dir({
      log: dir({
        syslog: file('Aug 21 09:00:01 srv01 CRON[1201]: (root) CMD (run-parts /etc/cron.hourly)\nAug 21 09:12:44 srv01 systemd[1]: Started Session 12 of user student.\nAug 21 09:18:02 srv01 kernel: [  822.11] EXT4-fs (sda1): mounted filesystem\n'),
        'auth.log': file('Aug 21 09:12:40 srv01 sshd[1440]: Accepted password for student from 192.168.10.55 port 51022 ssh2\nAug 21 09:13:55 srv01 sshd[1466]: Failed password for invalid user admin from 45.9.148.3 port 40122 ssh2\nAug 21 09:13:58 srv01 sshd[1466]: Failed password for invalid user admin from 45.9.148.3 port 40122 ssh2\nAug 21 09:14:02 srv01 sshd[1470]: Failed password for root from 45.9.148.3 port 40190 ssh2\n'),
        nginx: dir({ 'access.log': file('192.168.10.55 - - [21/Aug/2026:09:20:11 +0700] "GET / HTTP/1.1" 200 612\n192.168.10.60 - - [21/Aug/2026:09:20:33 +0700] "GET /api HTTP/1.1" 404 153\n') }),
      }),
      www: dir({ html: dir({ 'index.html': file('<h1>It works!</h1>\n', '644', 'www-data') }) }),
    }),
    tmp: dir({}, '777'),
    opt: dir({}),
    backup: dir({}),
    usr: dir({ bin: dir({}), local: dir({ bin: dir({}) }), share: dir({}) }),
    proc: dir({}),
    mnt: dir({ app: dir({ uploads: dir({}), tmp: dir({}) }, '755', 'www-data') }),
  });
}

function shTokens(line) {
  const out = [];
  const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let m;
  while ((m = re.exec(line))) out.push(m[1] ?? m[2] ?? m[3]);
  return out;
}

export function createLinux(init = {}) {
  const st = {
    vendor: 'linux',
    hostname: init.hostname || 'srv01',
    user: init.user || 'student',
    cwd: init.cwd || `/home/${init.user || 'student'}`,
    fs: baseFs(),
    env: { PATH: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin', HOME: `/home/${init.user || 'student'}`, SHELL: '/bin/bash', LANG: 'en_US.UTF-8' },
    services: {
      sshd: { active: true, enabled: true, desc: 'OpenBSD Secure Shell server', pid: 1440 },
      nginx: { active: false, enabled: false, desc: 'A high performance web server', pid: null },
      cron: { active: true, enabled: true, desc: 'Regular background program processing daemon', pid: 812 },
      'systemd-resolved': { active: true, enabled: true, desc: 'Network Name Resolution', pid: 640 },
      firewalld: { active: false, enabled: false, desc: 'firewalld - dynamic firewall daemon', pid: null },
      chronyd: { active: true, enabled: true, desc: 'NTP client/server', pid: 733 },
      fail2ban: { active: false, enabled: false, desc: 'Fail2Ban Service', pid: null },
      auditd: { active: false, enabled: false, desc: 'Security Auditing Service', pid: null },
    },
    ifaces: {
      lo: { ip: '127.0.0.1', prefix: 8, up: true, mac: '00:00:00:00:00:00' },
      ens33: { ip: init.ip || '192.168.10.20', prefix: 24, up: true, mac: '00:0c:29:5b:11:a2' },
    },
    gateway: init.gw || '192.168.10.1',
    dns: ['8.8.8.8'],
    users: { root: { uid: 0, home: '/root', shell: '/bin/bash', groups: ['root'] }, student: { uid: 1000, home: '/home/student', shell: '/bin/bash', groups: ['student', 'sudo'] } },
    groups: { root: 0, sudo: 27, student: 1000 },
    ufw: { active: false, rules: [] },
    hosts: init.hosts || { '8.8.8.8': 'dns', '192.168.10.1': 'gw' },
    history: [],
    // --- สำหรับหัวข้อ scripts / IaC / storage ---
    scriptRuns: [],      // ไฟล์สคริปต์ที่ถูกรันสำเร็จ
    ansibleRuns: [],     // คำสั่ง ansible ที่รัน
    ansiblePlays: [],    // {file, tasks[]} ของ playbook ที่รัน
    vgs: {},             // volume group ที่สร้างเอง
    lvs: {},             // logical volume ที่สร้างเอง
    formatted: [],       // {dev, type} ที่ผ่าน mkfs
    lastCode: 0,
    // --- สำหรับ lab ระดับสูง ---
    sysctl: { 'net.ipv4.ip_forward': '0', 'net.ipv4.tcp_syncookies': '1', 'kernel.randomize_va_space': '0' },
    mounts: [{ dev: '/dev/sda1', mp: '/', fs: 'ext4', opts: 'defaults' }],
    // สิ่งที่ df รายงาน — หน่วยเป็น KiB · lab ตั้งค่าเริ่มต้นทับได้ผ่าน init.apply
    // มีทั้งพื้นที่และจำนวน inode เพราะ "ดิสก์ว่างแต่เขียนไฟล์ไม่ได้" คือเคสที่ inode หมด
    filesystems: [
      { dev: '/dev/sda1', mp: '/', type: 'ext4', size: 41943040, used: 12582912, avail: 27262976, inodes: 2621440, iused: 315234 },
      { dev: 'tmpfs', mp: '/dev/shm', type: 'tmpfs', size: 1992294, used: 0, avail: 1992294, inodes: 489283, iused: 1 },
      { dev: '/dev/sda2', mp: '/boot', type: 'ext4', size: 997376, used: 131072, avail: 797696, inodes: 65536, iused: 316 },
      { dev: '/dev/mapper/vg_data-lv_app', mp: '/mnt/app', type: 'ext4', size: 31457280, used: 8808038, avail: 21012480, inodes: 1966080, iused: 74213 },
    ],
    // ขนาดที่ du รายงานรายโฟลเดอร์ — lab ที่เล่าเรื่องดิสก์เต็มตั้งค่าทับได้
    dirSizes: { '/var/log': '148K', '/var': '1.2G', '/home': '820M', '/mnt/app': '8.4G' },
    disks: [
      { name: 'sda', size: '40G', parts: [{ name: 'sda1', size: '39G', mp: '/' }, { name: 'sda2', size: '1G', mp: '/boot' }] },
      { name: 'sdb', size: '30G', parts: [] },     // ดิสก์ก้อนใหม่ ยังไม่ได้ใช้
      { name: 'sdc', size: '40G', parts: [] },     // physical volume ของ vg_data
    ],
    lvm: { pvs: ['/dev/sdc'], vgs: { vg_data: { size: '40G', free: '10G', pvs: ['/dev/sdc'] } }, lvs: { lv_app: { vg: 'vg_data', size: '30G', mp: '/mnt/app' } } },
    containers: [],
    images: ['nginx:1.25-alpine', 'postgres:16-alpine', 'ubuntu:22.04'],
    timezone: 'Etc/UTC',
    ntpSync: true,
    fail2ban: { active: false, jails: [] },
    selinux: init.selinux || 'Permissive',
  };
  // ถ้า lab กำหนดผู้ใช้อื่น ให้สร้าง home directory และบัญชีให้ด้วย
  if (st.user !== 'student') {
    const home = st.fs.children.home;
    if (!home.children[st.user]) {
      home.children[st.user] = dir({
        'notes.txt': file('บันทึกงาน:\n- ตรวจ log\n- ทำรายงานส่งหัวหน้า\n', '644', st.user),
      }, '755', st.user);
    }
    st.users[st.user] ||= { uid: 1001, home: `/home/${st.user}`, shell: '/bin/bash', groups: [st.user, 'sudo'] };
    st.groups[st.user] ??= 1001;
  }
  if (init.apply) init.apply(st);

  // ---------- path helpers ----------
  function norm(p) {
    if (!p) return st.cwd;
    if (p === '~') return st.env.HOME;
    if (p.startsWith('~/')) p = st.env.HOME + p.slice(1);
    if (p === '-') return st.cwd;
    const abs = p.startsWith('/') ? p : st.cwd + '/' + p;
    const parts = [];
    abs.split('/').forEach(s => {
      if (!s || s === '.') return;
      if (s === '..') parts.pop();
      else parts.push(s);
    });
    return '/' + parts.join('/');
  }
  function node(p) {
    const parts = norm(p).split('/').filter(Boolean);
    let n = st.fs;
    for (const s of parts) {
      if (!n || n.t !== 'd' || !n.children[s]) return null;
      n = n.children[s];
    }
    return n;
  }
  function parentOf(p) {
    const abs = norm(p);
    const i = abs.lastIndexOf('/');
    const dp = i === 0 ? '/' : abs.slice(0, i);
    return { parent: node(dp), name: abs.slice(i + 1), abs, dirPath: dp };
  }
  function modeStr(n) {
    const m = n.mode.padStart(3, '0');
    const map = ['---', '--x', '-w-', '-wx', 'r--', 'r-x', 'rw-', 'rwx'];
    return (n.t === 'd' ? 'd' : '-') + m.split('').map(d => map[+d]).join('');
  }

  const prompt = () =>
    `${st.user}@${st.hostname}:${st.cwd === st.env.HOME ? '~' : st.cwd.replace(st.env.HOME, '~')}${st.user === 'root' ? '#' : '$'} `;

  // ---------- individual commands ----------
  function ls(args) {
    const flags = args.filter(a => a.startsWith('-')).join('');
    const targets = args.filter(a => !a.startsWith('-'));
    const t = targets[0] || '.';
    const n = node(t);
    if (!n) return [E(`ls: cannot access '${t}': No such file or directory`)];
    if (n.t === 'f') return flags.includes('l') ? [`${modeStr(n)} 1 ${n.owner} ${n.group} ${lpad(n.content.length, 6)} Aug 21 09:41 ${t}`] : [t];
    let names = Object.keys(n.children).sort();
    if (!flags.includes('a')) names = names.filter(x => !x.startsWith('.'));
    if (!names.length) return [];
    if (flags.includes('l')) {
      const out = [`total ${names.length * 4}`];
      names.forEach(k => {
        const c = n.children[k];
        const size = c.t === 'd' ? 4096 : c.content.length;
        out.push(`${modeStr(c)} ${c.t === 'd' ? 2 : 1} ${pad(c.owner, 8)} ${pad(c.group, 8)} ${lpad(size, 6)} Aug 21 09:41 ${c.t === 'd' ? H(k).s : k}`);
      });
      return out;
    }
    return [names.map(k => (n.children[k].t === 'd' ? k + '/' : k)).join('  ')];
  }

  function catf(args) {
    const out = [];
    const targets = args.filter(a => !a.startsWith('-'));
    if (!targets.length) return [E('cat: ต้องระบุไฟล์')];
    for (const t of targets) {
      const n = node(t);
      if (!n) { out.push(E(`cat: ${t}: No such file or directory`)); continue; }
      if (n.t === 'd') { out.push(E(`cat: ${t}: Is a directory`)); continue; }
      n.content.replace(/\n$/, '').split('\n').forEach(l => out.push(l));
    }
    return out;
  }

  function writeFile(path, content, append) {
    const { parent, name } = parentOf(path);
    if (!parent || parent.t !== 'd') return false;
    if (parent.children[name] && parent.children[name].t === 'f') {
      parent.children[name].content = append ? parent.children[name].content + content : content;
    } else {
      parent.children[name] = file(content, '644', st.user);
    }
    return true;
  }

  function systemctl(args) {
    const [sub, ...rest] = args.filter(a => !a.startsWith('-'));
    const name = (rest[0] || '').replace(/\.service$/, '');
    const svc = st.services[name];
    if (!sub || sub === 'list-units' || sub === 'list-unit-files') {
      const out = ['UNIT                       LOAD   ACTIVE   SUB     DESCRIPTION'];
      Object.entries(st.services).forEach(([k, s]) =>
        out.push(`${pad(k + '.service', 26)} loaded ${pad(s.active ? 'active' : 'inactive', 8)} ${pad(s.active ? 'running' : 'dead', 7)} ${s.desc}`));
      return out;
    }
    if (!svc) return [E(`Unit ${name}.service could not be found.`)];
    switch (sub) {
      case 'status': {
        const dot = svc.active ? OK('●') : E('●');
        return [
          { s: `${svc.active ? '●' : '○'} ${name}.service - ${svc.desc}`, c: svc.active ? 'okc' : 'dimc' },
          `     Loaded: loaded (/lib/systemd/system/${name}.service; ${svc.enabled ? 'enabled' : 'disabled'}; preset: enabled)`,
          svc.active
            ? { s: `     Active: active (running) since Fri 2026-08-21 08:55:12 +07; 46min ago`, c: 'okc' }
            : { s: `     Active: inactive (dead)`, c: 'dimc' },
          ...(svc.active ? [`   Main PID: ${svc.pid} (${name})`, `      Tasks: 2 (limit: 4571)`, `     Memory: 6.1M`] : []),
        ];
      }
      case 'start': svc.active = true; svc.pid ||= 2000 + Math.floor(Math.random() * 900); return [];
      case 'stop': svc.active = false; return [];
      case 'restart': svc.active = true; return [];
      case 'reload': return svc.active ? [] : [E(`Job for ${name}.service failed because the unit is not active.`)];
      case 'enable': svc.enabled = true; return [D(`Created symlink /etc/systemd/system/multi-user.target.wants/${name}.service → /lib/systemd/system/${name}.service.`)];
      case 'disable': svc.enabled = false; return [D(`Removed /etc/systemd/system/multi-user.target.wants/${name}.service.`)];
      case 'is-active': return [svc.active ? 'active' : 'inactive'];
      case 'is-enabled': return [svc.enabled ? 'enabled' : 'disabled'];
      default: return [E(`Unknown operation ${sub}.`)];
    }
  }

  /** link-local ของ IPv6 สร้างจาก MAC แบบ EUI-64 — ของจริงทุก interface มีเสมอ */
  function linkLocal(mac) {
    const b = String(mac || '00:0c:29:aa:bb:cc').split(':');
    if (b.length !== 6) return 'fe80::1';
    const first = (parseInt(b[0], 16) ^ 0x02).toString(16).padStart(2, '0');
    return `fe80::${first}${b[1]}:${b[2]}ff:fe${b[3]}:${b[4]}${b[5]}`;
  }

  function ipCmd(args) {
    // แยก option นำหน้าออกก่อน เช่น  ip -s link · ip -6 addr · ip -br a
    const opts = [];
    while (args.length && /^-/.test(args[0])) opts.push(args.shift().toLowerCase());
    const stats = opts.some(o => /^-s/.test(o));
    const v6 = opts.includes('-6');

    const a = args.map(x => x.toLowerCase());

    // ---- ip neigh — ตาราง ARP (v4) หรือ NDP (v6) ----
    if (['n', 'neigh', 'neighbor', 'neighbour'].includes(a[0])) {
      const rows = Object.entries(st.ifaces).filter(([n, i]) => n !== 'lo' && i.ip);
      if (!rows.length) return [D('(ตารางว่าง)')];
      const out = [];
      rows.forEach(([n, i]) => {
        if (v6) { out.push(`${linkLocal(i.mac)} dev ${n} lladdr ${i.mac} router REACHABLE`); return; }
        const base = i.ip.split('.').slice(0, 3).join('.');
        out.push(`${base}.1 dev ${n} lladdr 00:0c:29:11:00:01 REACHABLE`);
        out.push(`${base}.24 dev ${n} lladdr a4:5e:60:c1:22:01 STALE`);
      });
      return out;
    }

    if (!a.length || ['a', 'addr', 'address'].includes(a[0])) {
      if (a[1] === 'add') {
        const dev = args[args.indexOf('dev') + 1];
        const raw = args[2] || '';
        if (raw.includes(':')) {                                  // IPv6
          const m6 = raw.match(/^([0-9a-f:]+)\/(\d+)$/i);
          if (!m6 || !dev) return [E('Usage: ip addr add IP/PREFIX dev IFACE')];
          st.ifaces[dev] ||= { up: true, mac: '00:0c:29:aa:bb:cc' };
          (st.ifaces[dev].ip6 ||= []).push({ ip: m6[1], prefix: +m6[2] });
          return [];
        }
        const m = raw.match(/^(\d+\.\d+\.\d+\.\d+)\/(\d+)$/);
        if (!m || !dev) return [E('Usage: ip addr add IP/PREFIX dev IFACE')];
        st.ifaces[dev] ||= { up: true, mac: '00:0c:29:aa:bb:cc' };
        st.ifaces[dev].ip = m[1]; st.ifaces[dev].prefix = +m[2];
        return [];
      }
      if (v6) {
        const out6 = [];
        let k = 1;
        Object.entries(st.ifaces).forEach(([name, i]) => {
          out6.push(`${k}: ${name}: <${i.up ? 'BROADCAST,MULTICAST,UP,LOWER_UP' : 'BROADCAST,MULTICAST'}> mtu ${i.mtu || 1500} state ${i.up ? 'UP' : 'DOWN'}`);
          if (name === 'lo') out6.push('    inet6 ::1/128 scope host');
          else {
            (i.ip6 || []).forEach(x => out6.push(`    inet6 ${x.ip}/${x.prefix} scope global`));
            out6.push(`    inet6 ${linkLocal(i.mac)}/64 scope link`);
          }
          k++;
        });
        return out6;
      }
      const out = [];
      let n = 1;
      Object.entries(st.ifaces).forEach(([name, i]) => {
        out.push(`${n}: ${name}: <${name === 'lo' ? 'LOOPBACK,UP,LOWER_UP' : i.up ? 'BROADCAST,MULTICAST,UP,LOWER_UP' : 'BROADCAST,MULTICAST'}> mtu 1500 state ${i.up ? 'UP' : 'DOWN'}`);
        out.push(`    link/${name === 'lo' ? 'loopback' : 'ether'} ${i.mac} brd ff:ff:ff:ff:ff:ff`);
        if (i.ip) out.push(`    inet ${i.ip}/${i.prefix} brd ${i.ip.split('.').slice(0, 3).join('.')}.255 scope global ${name}`);
        n++;
      });
      return out;
    }
    if (['r', 'route'].includes(a[0])) {
      if (a[1] === 'add') {
        const via = args[args.indexOf('via') + 1];
        if (args[2] === 'default' || args[2] === '0.0.0.0/0') st.gateway = via;
        else (st.routes ||= []).push({ dst: args[2], via });
        return [];
      }
      if (v6) {
        const out6 = [];
        Object.entries(st.ifaces).forEach(([name, i]) => {
          if (name === 'lo') return;
          (i.ip6 || []).forEach(x => out6.push(`${x.ip}/${x.prefix} dev ${name} proto kernel metric 256`));
          out6.push(`fe80::/64 dev ${name} proto kernel metric 256`);
        });
        return out6.length ? out6 : [D('(ยังไม่มีเส้นทาง IPv6)')];
      }
      const out = [];
      if (st.gateway) out.push(`default via ${st.gateway} dev ens33 proto static`);
      Object.entries(st.ifaces).forEach(([name, i]) => {
        if (i.ip && name !== 'lo') out.push(`${i.ip.split('.').slice(0, 3).join('.')}.0/${i.prefix} dev ${name} proto kernel scope link src ${i.ip}`);
      });
      return out;
    }
    if (['l', 'link'].includes(a[0])) {
      if (a[1] === 'set') {
        const dev = args[2];
        if (!st.ifaces[dev]) return [E(`Cannot find device "${dev}"`)];
        const mi = a.indexOf('mtu');
        if (mi >= 0) { st.ifaces[dev].mtu = +args[mi + 1] || 1500; return []; }
        if (a.includes('up') || a.includes('down')) st.ifaces[dev].up = a.includes('up');
        return [];
      }
      // เลือกเฉพาะ interface ที่ระบุ เช่น  ip -s link show eth0
      const only = args.filter(x => !/^(show|dev)$/i.test(x)).slice(1)[0];
      const names = Object.keys(st.ifaces).filter(n => !only || n === only);
      if (only && !names.length) return [E(`Device "${only}" does not exist.`)];
      const out = [];
      names.forEach((n) => {
        const i = st.ifaces[n];
        const idx = Object.keys(st.ifaces).indexOf(n) + 1;
        out.push(`${idx}: ${n}: <${i.up ? 'BROADCAST,MULTICAST,UP,LOWER_UP' : 'BROADCAST,MULTICAST'}> mtu ${i.mtu || 1500} state ${i.up ? 'UP' : 'DOWN'}`);
        out.push(`    link/${n === 'lo' ? 'loopback' : 'ether'} ${i.mac} brd ff:ff:ff:ff:ff:ff`);
        if (stats) {
          const e = i.errors || 0;
          out.push('    RX: bytes  packets  errors  dropped overrun mcast');
          out.push(`    ${lpad(84213904, 12)} ${lpad(412330, 8)} ${lpad(e, 7)} ${lpad(0, 7)} ${lpad(0, 7)} ${lpad(120, 5)}`);
          out.push('    TX: bytes  packets  errors  dropped carrier collsns');
          out.push(`    ${lpad(20114552, 12)} ${lpad(388120, 8)} ${lpad(0, 7)} ${lpad(0, 7)} ${lpad(0, 7)} ${lpad(0, 7)}`);
        }
      });
      return out;
    }
    return [E('Object "' + a[0] + '" is unknown')];
  }

  /**
   * df — อ่านจากสถานะจริงของเครื่อง ไม่ใช่ข้อความตายตัว
   * รองรับ -h (หน่วยที่คนอ่านออก) · -i (จำนวน inode) · -T (ชนิด filesystem) และระบุ path ได้
   * เคยเป็นข้อความตายตัวชุดเดียว ทำให้ df -i ได้ผลเหมือน df -h เป๊ะ ๆ
   * และพื้นที่ไม่เคยเปลี่ยนแม้จะขยาย logical volume ไปแล้ว
   */
  function dfCmd(args) {
    const flags = args.filter(a => /^-/.test(a)).join('');
    const human = /h/.test(flags);
    const inode = /i/.test(flags);
    const withType = /T/.test(flags);

    let rows = st.filesystems;
    const target = args.find(a => !a.startsWith('-'));
    if (target) {
      const path = norm(target);
      const isMount = rows.some(f => f.mp === path);
      if (!isMount && !node(path)) return [E(`df: ${target}: No such file or directory`)];
      const hit = rows
        .filter(f => path === f.mp || path.startsWith(f.mp === '/' ? '/' : f.mp + '/'))
        .sort((a, b) => b.mp.length - a.mp.length)[0];
      rows = hit ? [hit] : rows.filter(f => f.mp === '/');
    }

    const pct = (used, total) => (total > 0 ? Math.ceil((used / total) * 100) : 0) + '%';
    const num = v => (human ? humanKiB(v) : String(v));
    const cnt = v => (human ? humanKiB(v) : String(v));

    const head = inode
      ? ['Filesystem', 'Inodes', 'IUsed', 'IFree', 'IUse%', 'Mounted on']
      : ['Filesystem', human ? 'Size' : '1K-blocks', 'Used', 'Avail', 'Use%', 'Mounted on'];
    if (withType) head.splice(1, 0, 'Type');

    const body = rows.map(f => {
      const cells = inode
        ? [f.dev, cnt(f.inodes), cnt(f.iused), cnt(f.inodes - f.iused), pct(f.iused, f.inodes), f.mp]
        : [f.dev, num(f.size), num(f.used), num(f.avail), pct(f.used, f.used + f.avail), f.mp];
      if (withType) cells.splice(1, 0, f.type);
      return cells;
    });

    // จัดคอลัมน์ตามค่าที่กว้างที่สุดจริง ๆ เหมือน df ของจริง
    const width = head.map((h, i) =>
      Math.max(h.length, ...body.map(r => r[i].length)));
    const line = (cells) => cells
      .map((c, i) => (i === 0 ? pad(c, width[0]) : i === cells.length - 1 ? ' ' + c : ' ' + lpad(c, width[i])))
      .join('').replace(/\s+$/, '');
    return [line(head), ...body.map(line)];
  }

  /** lsblk — สร้างจากรายการดิสก์จริงในสถานะ จะได้เห็นดิสก์ก้อนใหม่ที่เพิ่งเสียบเข้าเครื่อง */
  function lsblkCmd() {
    const rows = [['NAME', 'MAJ:MIN', 'RM', 'SIZE', 'RO', 'TYPE', 'MOUNTPOINTS']];
    const lvsOf = (dev, indent) => Object.entries(st.lvm.lvs)
      .filter(([, lv]) => st.lvm.vgs[lv.vg] && st.lvm.vgs[lv.vg].pvs.includes(dev))
      .map(([name, lv], i, arr) =>
        [`${indent}${i === arr.length - 1 ? '└─' : '├─'}${lv.vg}-${name}`, '253:' + i, '0', lv.size, '0', 'lvm', lv.mp || '']);
    let major = 0;
    st.disks.forEach((d) => {
      rows.push([d.name, `8:${major}`, '0', d.size, '0', 'disk', '']);
      rows.push(...lvsOf('/dev/' + d.name, ''));
      d.parts.forEach((part, i) => {
        const last = i === d.parts.length - 1;
        rows.push([`${last ? '└─' : '├─'}${part.name}`, `8:${major + i + 1}`, '0', part.size, '0', 'part', part.mp]);
        rows.push(...lvsOf('/dev/' + part.name, last ? '  ' : '│ '));
      });
      major += 16;
    });
    // NAME / MAJ:MIN / TYPE ชิดซ้าย · RM / SIZE / RO ชิดขวา — ตามหน้าตาของ lsblk จริง
    const alignLeft = [true, true, false, false, false, true, true];
    const width = rows[0].map((_, i) => Math.max(...rows.map(r => (r[i] || '').length)));
    return rows.map(r => r
      .map((c, i) => (i === 0 ? pad(c, width[0])
        : ' ' + (alignLeft[i] ? pad(c || '', width[i]) : lpad(c || '', width[i]))))
      .join('').replace(/\s+$/, ''));
  }

  function ps() {
    const rows = [['1', 'root', 'systemd'], ['640', 'systemd+', '/lib/systemd/systemd-resolved'],
    ['812', 'root', '/usr/sbin/cron -f'], ['1440', 'root', 'sshd: /usr/sbin/sshd -D'],
    ['1466', 'student', '-bash'], ['1502', 'student', 'ps aux']];
    const out = ['USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND'];
    rows.forEach(([pid, user, cmd]) =>
      out.push(`${pad(user, 10)} ${lpad(pid, 3)}  0.0  0.4 ${lpad(16820, 6)} ${lpad(9280, 5)} ?        Ss   08:55   0:00 ${cmd}`));
    Object.entries(st.services).filter(([, s]) => s.active && s.pid).forEach(([k, s]) => {
      if (!rows.some(r => r[0] === String(s.pid))) out.push(`${pad('root', 10)} ${lpad(s.pid, 3)}  0.0  0.6 ${lpad(55240, 6)} ${lpad(12400, 5)} ?        Ss   08:55   0:00 /usr/sbin/${k}`);
    });
    return out;
  }

  function useradd(args) {
    const name = args.filter(a => !a.startsWith('-') && !['-m', '-s', '-G', '-g', '-u'].includes(a)).pop();
    if (!name) return [E('useradd: ต้องระบุชื่อผู้ใช้')];
    if (st.users[name]) return [E(`useradd: user '${name}' already exists`)];
    const gi = args.indexOf('-G');
    const si = args.indexOf('-s');
    const uid = 1000 + Object.keys(st.users).length;
    st.users[name] = { uid, home: `/home/${name}`, shell: si > 0 ? args[si + 1] : '/bin/bash', groups: [name, ...(gi > 0 ? args[gi + 1].split(',') : [])] };
    const p = node('/home');
    if (args.includes('-m')) p.children[name] = dir({}, '755', name);
    const pw = node('/etc/passwd');
    pw.content += `${name}:x:${uid}:${uid}::/home/${name}:${st.users[name].shell}\n`;
    return [];
  }

  function chmod(args) {
    const [m, ...t] = args.filter(a => !a.startsWith('-'));
    if (!m || !t.length) return [E('chmod: missing operand')];
    const out = [];
    t.forEach(p => {
      const n = node(p);
      if (!n) { out.push(E(`chmod: cannot access '${p}': No such file or directory`)); return; }
      if (/^\d{3,4}$/.test(m)) n.mode = m.slice(-3);
      else if (/^[ugoa]*[+-][rwx]+$/.test(m)) {
        const add = m.includes('+');
        const bits = { r: 4, w: 2, x: 1 };
        const delta = m.split(/[+-]/)[1].split('').reduce((s, c) => s + (bits[c] || 0), 0);
        const who = m.split(/[+-]/)[0] || 'a';
        n.mode = n.mode.split('').map((d, i) => {
          const key = ['u', 'g', 'o'][i];
          if (who !== 'a' && !who.includes(key)) return d;
          return String(add ? (+d | delta) : (+d & ~delta));
        }).join('');
      } else out.push(E(`chmod: invalid mode: '${m}'`));
    });
    return out;
  }

  function grep(args, stdin) {
    const flags = args.filter(a => a.startsWith('-')).join('');
    const rest = args.filter(a => !a.startsWith('-'));
    const pat = (rest[0] || '').replace(/^["']|["']$/g, '');
    const files = rest.slice(1);
    const re = new RegExp(pat, flags.includes('i') ? 'i' : '');
    const scan = (lines, tag) => lines.filter(l => re.test(l) !== flags.includes('v'))
      .map(l => (files.length > 1 ? `${tag}:${l}` : l));
    if (!files.length) return stdin ? scan(stdin, '') : [E('grep: ต้องระบุไฟล์ หรือใช้กับ pipe')];
    const out = [];
    const recursive = flags.includes('r') || flags.includes('R');
    /** ไล่ทุกไฟล์ในไดเรกทอรี — ใช้กับ grep -r */
    const walk = (n, path, acc) => {
      if (n.t === 'f') { acc.push([path, n]); return acc; }
      Object.entries(n.children || {}).forEach(([k, v]) => walk(v, `${path}/${k}`, acc));
      return acc;
    };
    files.forEach(f => {
      const n = node(f);
      if (!n) { out.push(E(`grep: ${f}: No such file or directory`)); return; }
      if (n.t === 'd') {
        if (!recursive) { out.push(E(`grep: ${f}: Is a directory`)); return; }
        walk(n, f.replace(/\/$/, ''), []).forEach(([p, fn]) =>
          fn.content.replace(/\n$/, '').split('\n')
            .filter(l => re.test(l) !== flags.includes('v'))
            .forEach(l => out.push(`${p}:${l}`)));
        return;
      }
      out.push(...scan(n.content.replace(/\n$/, '').split('\n'), f));
    });
    if (flags.includes('c')) return [String(out.length)];
    return out;
  }

  function findCmd(args) {
    const start = args[0] && !args[0].startsWith('-') ? args[0] : '.';
    const ni = args.indexOf('-name');
    const ti = args.indexOf('-type');
    const patt = ni > 0 ? args[ni + 1].replace(/^["']|["']$/g, '') : null;
    const re = patt ? new RegExp('^' + patt.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$') : null;
    const want = ti > 0 ? args[ti + 1] : null;
    const out = [];
    const walk = (n, p) => {
      const base = p.split('/').pop() || '/';
      const typeOk = !want || (want === 'd' ? n.t === 'd' : n.t === 'f');
      if ((!re || re.test(base)) && typeOk) out.push(p);
      if (n.t === 'd') Object.entries(n.children).forEach(([k, c]) => walk(c, (p === '/' ? '' : p) + '/' + k));
    };
    const root = node(start);
    if (!root) return [E(`find: '${start}': No such file or directory`)];
    walk(root, norm(start));
    return out.length ? out : [];
  }

  function ufwCmd(args) {
    const a = args.map(x => x.toLowerCase());
    if (a[0] === 'status') {
      if (!st.ufw.active) return ['Status: inactive'];
      const out = [OK('Status: active'), '', 'To                         Action      From', '--                         ------      ----'];
      st.ufw.rules.forEach(r => out.push(`${pad(r.to, 26)} ${pad(r.action.toUpperCase(), 11)} ${r.from}`));
      return out;
    }
    if (a[0] === 'enable') { st.ufw.active = true; return ['Firewall is active and enabled on system startup']; }
    if (a[0] === 'disable') { st.ufw.active = false; return ['Firewall stopped and disabled on system startup']; }
    if (a[0] === 'allow' || a[0] === 'deny') {
      st.ufw.rules.push({ to: args[1], action: a[0], from: 'Anywhere' });
      return ['Rule added'];
    }
    if (a[0] === 'default') return [`Default ${a[1]} policy changed to '${a[1]}'`];
    return [E('ufw: unknown command')];
  }

  // ---------- dispatcher ----------
  /** รันไฟล์สคริปต์ทีละบรรทัดผ่าน shell ตัวเดียวกัน — รองรับ #! และคอมเมนต์ */
  function runScript(file) {
    const n = node(norm(file));
    if (!n) return [E(`bash: ${file}: No such file or directory`)];
    if (n.t === 'd') return [E(`bash: ${file}: Is a directory`)];
    const lines = String(n.content || '').split('\n')
      .map(l => l.trim()).filter(l => l && !l.startsWith('#'));
    if (!lines.length) return [];
    st.scriptRuns.push(norm(file));
    const out = [];
    for (const l of lines) {
      const r = runOne(l, null) || [];
      r.forEach(x => out.push(x));
    }
    return out;
  }

  function runOne(cmdline, stdin) {
    let redirect = null, append = false;
    let line = cmdline;
    const rm = line.match(/\s(>>?)\s*(\S+)\s*$/);
    if (rm) { append = rm[1] === '>>'; redirect = rm[2]; line = line.slice(0, rm.index); }

    let t = shTokens(line);
    if (!t.length) return [];
    let cmd = t[0];
    let args = t.slice(1);

    // เรียกสคริปต์ด้วย path ตรง ๆ เช่น ./backup.sh หรือ /usr/local/bin/x.sh
    if (/^(\.\/|\/|~\/)/.test(cmd) && /\.sh$/.test(cmd)) {
      const n = node(norm(cmd));
      if (!n) return [E(`bash: ${cmd}: No such file or directory`)];
      if (!(+String(n.mode || '644')[0] & 1)) return [E(`bash: ${cmd}: Permission denied`)];
      return runScript(cmd);
    }

    if (cmd === 'sudo') {
      if (!args.length) return [E('usage: sudo command')];
      const prev = st.user; st.user = 'root';
      const r = runOne(args.join(' '), stdin);
      st.user = prev;
      return r;
    }

    let out;
    switch (cmd) {
      case 'pwd': out = [st.cwd]; break;
      case 'whoami': out = [st.user]; break;
      case 'id': {
        const u = st.users[st.user] || { uid: 1000, groups: [st.user] };
        out = [`uid=${u.uid}(${st.user}) gid=${u.uid}(${st.user}) groups=${u.groups.map(g => `${st.groups[g] ?? 1000}(${g})`).join(',')}`];
        break;
      }
      case 'hostname': out = args.length ? (st.hostname = args[0], []) : [st.hostname]; break;
      case 'hostnamectl':
        if (args[0] === 'set-hostname') { st.hostname = args[1]; node('/etc/hostname').content = args[1] + '\n'; out = []; }
        else out = [`   Static hostname: ${st.hostname}`, `         Icon name: computer-vm`, `        Machine ID: 9f2c1b4d`,
          `  Operating System: Ubuntu 22.04.4 LTS`, `            Kernel: Linux 5.15.0-105-generic`, `      Architecture: x86-64`];
        break;
      case 'uname':
        out = [args.includes('-a')
          ? `Linux ${st.hostname} 5.15.0-105-generic #115-Ubuntu SMP Mon Apr 15 09:52:04 UTC 2026 x86_64 x86_64 x86_64 GNU/Linux`
          : 'Linux'];
        break;
      case 'ls': case 'll': out = ls(cmd === 'll' ? ['-l', ...args] : args); break;
      case 'cd': {
        const target = args[0] ? norm(args[0]) : st.env.HOME;
        const n = node(target);
        if (!n) out = [E(`bash: cd: ${args[0]}: No such file or directory`)];
        else if (n.t !== 'd') out = [E(`bash: cd: ${args[0]}: Not a directory`)];
        else { st.cwd = target || '/'; out = []; }
        break;
      }
      case 'cat': out = catf(args); break;

      // ---------- Authoring Text Files ----------
      case 'tee': {
        const txt = (stdin || []).map(o => (typeof o === 'string' ? o : o.s)).join('\n');
        const target = args.find(a => !a.startsWith('-'));
        if (!target) { out = [E('tee: ต้องระบุชื่อไฟล์')]; break; }
        writeFile(target, txt + '\n', args.includes('-a'));
        out = stdin || [];
        break;
      }
      case 'sed': {
        const script = args.find(a => /^(-n\s*)?['"]?s\//.test(a) || /^\d+[pd]$/.test(a) || /^s\//.test(a));
        const files = args.filter(a => !a.startsWith('-') && a !== script);
        const inPlace = args.includes('-i');
        const quiet = args.includes('-n');
        const src = files.length ? catf([files[0]]) : (stdin || []);
        if (!script) { out = [E('sed: ต้องระบุคำสั่ง เช่น sed -i "s/เดิม/ใหม่/" file')]; break; }
        const lines = src.map(o => (typeof o === 'string' ? o : o.s));
        const m = String(script).replace(/^['"]|['"]$/g, '').match(/^s\/(.*?)\/(.*?)\/(g?)$/);
        let res;
        if (m) {
          const re = new RegExp(m[1], m[3] ? 'g' : '');
          res = lines.map(l => l.replace(re, m[2]));
        } else {
          const pm = String(script).match(/^(\d+)([pd])$/);
          if (!pm) { out = [E('sed: รูปแบบที่รองรับคือ s/a/b/ หรือ Np / Nd')]; break; }
          const idx = +pm[1] - 1;
          res = pm[2] === 'p' ? [lines[idx] ?? ''] : lines.filter((_, i) => i !== idx);
        }
        if (inPlace && files.length) { writeFile(files[0], res.join('\n') + '\n', false); out = []; }
        else out = quiet && m ? res.filter(Boolean) : res;
        break;
      }

      // ---------- Implementing Simple Scripts ----------
      case 'bash': case 'sh': {
        const f = args.find(a => !a.startsWith('-'));
        if (!f) { out = [E(`${cmd}: ต้องระบุไฟล์สคริปต์`)]; break; }
        out = runScript(f);
        break;
      }

      // ---------- Infrastructure as Code ----------
      case 'ansible': {
        if (args.includes('--version')) { out = ['ansible [core 2.16.3]', '  config file = /etc/ansible/ansible.cfg', '  python version = 3.10.12']; break; }
        const mi = args.indexOf('-m');
        const mod = mi >= 0 ? args[mi + 1] : 'ping';
        const host = args[0] || 'all';
        st.ansibleRuns.push(`ansible ${host} -m ${mod}`);
        out = [OK(`${host} | SUCCESS => {`), '    "changed": false,', `    "ping": "pong"`, '}'];
        break;
      }
      case 'ansible-playbook': {
        const f = args.find(a => !a.startsWith('-'));
        const n = f ? node(norm(f)) : null;
        if (!n || n.t === 'd') { out = [E(`ERROR! the playbook: ${f} could not be found`)]; break; }
        const body = String(n.content || '');
        const tasks = (body.match(/^\s*-\s+name:\s*(.+)$/gm) || []).map(x => x.replace(/^\s*-\s+name:\s*/, '').trim());
        if (!tasks.length) { out = [E('ERROR! playbook ต้องมีอย่างน้อยหนึ่ง task ที่มี name:')]; break; }
        st.ansibleRuns.push(`ansible-playbook ${f}`);
        st.ansiblePlays.push({ file: f, tasks });
        out = [`PLAY [${(body.match(/^\s*-?\s*hosts:\s*(.+)$/m) || [, 'all'])[1].trim()}] ${'*'.repeat(30)}`, ''];
        tasks.forEach((tk) => {
          out.push(`TASK [${tk}] ${'*'.repeat(Math.max(4, 40 - tk.length))}`);
          out.push(OK('changed: [localhost]'), '');
        });
        out.push(`PLAY RECAP ${'*'.repeat(40)}`);
        out.push(`localhost : ok=${tasks.length}    changed=${tasks.length}    unreachable=0    failed=0`);
        break;
      }

      // ---------- Administering Storage (สร้างใหม่ ไม่ใช่แค่ขยาย) ----------
      case 'vgcreate': {
        const [vg, ...pvs] = args.filter(a => !a.startsWith('-'));
        if (!vg || !pvs.length) { out = [E('usage: vgcreate <vg> <pv...>')]; break; }
        st.vgs[vg] = { pvs, size: '20.00g', free: '20.00g' };
        out = [OK(`  Volume group "${vg}" successfully created`)];
        break;
      }
      case 'lvcreate': {
        const ni = args.findIndex(a => a === '-n' || a === '--name');
        const li = args.findIndex(a => a === '-L' || a === '--size');
        const name = ni >= 0 ? args[ni + 1] : null;
        const size = li >= 0 ? args[li + 1] : '1G';
        const vg = args.filter(a => !a.startsWith('-') && a !== name && a !== size).pop();
        if (!name || !vg) { out = [E('usage: lvcreate -n <name> -L <size> <vg>')]; break; }
        if (!st.vgs[vg]) { out = [E(`  Volume group "${vg}" not found`)]; break; }
        st.lvs[name] = { vg, size, fs: null, path: `/dev/${vg}/${name}` };
        out = [OK(`  Logical volume "${name}" created.`)];
        break;
      }
      case 'mkfs.ext4': case 'mkfs.xfs': case 'mkfs': {
        const type = cmd === 'mkfs' ? (args[args.indexOf('-t') + 1] || 'ext4') : cmd.split('.')[1];
        const dev = args.filter(a => !a.startsWith('-') && a !== type).pop();
        if (!dev) { out = [E('usage: mkfs.ext4 <device>')]; break; }
        const lv = Object.values(st.lvs).find(l => l.path === dev);
        if (lv) lv.fs = type;
        st.formatted.push({ dev, type });
        out = [`mke2fs 1.46.5 (30-Dec-2021)`, OK(`Creating filesystem with 1310720 4k blocks on ${dev} (${type})`), 'done'];
        break;
      }
      case 'head': case 'tail': {
        const ni = args.findIndex(a => a === '-n');
        const cnt = ni >= 0 ? +args[ni + 1] : 10;
        const f = args.filter(a => !a.startsWith('-') && a !== String(cnt));
        const src = f.length ? (node(f[0]) ? node(f[0]).content.replace(/\n$/, '').split('\n') : null) : stdin;
        if (!src) { out = [E(`${cmd}: ${f[0]}: No such file or directory`)]; break; }
        out = cmd === 'head' ? src.slice(0, cnt) : src.slice(-cnt);
        break;
      }
      case 'wc': {
        const f = args.filter(a => !a.startsWith('-'));
        const src = f.length ? (node(f[0]) ? node(f[0]).content : null) : (stdin || []).join('\n') + '\n';
        if (src === null) { out = [E(`wc: ${f[0]}: No such file or directory`)]; break; }
        const lines = src.replace(/\n$/, '').split('\n').length;
        out = [args.includes('-l') ? `${lines} ${f[0] || ''}`.trim()
          : `${lpad(lines, 6)} ${lpad(src.split(/\s+/).filter(Boolean).length, 6)} ${lpad(src.length, 6)} ${f[0] || ''}`.trimEnd()];
        break;
      }
      case 'grep': out = grep(args, stdin); break;
      case 'echo': {
        let s = args.join(' ').replace(/^["']|["']$/g, '');
        s = s.replace(/\$(\w+)/g, (_, k) => st.env[k] ?? '');
        out = [s];
        break;
      }
      case 'touch': {
        args.filter(a => !a.startsWith('-')).forEach(p => {
          const { parent, name } = parentOf(p);
          if (parent && parent.t === 'd' && !parent.children[name]) parent.children[name] = file('', '644', st.user);
        });
        out = [];
        break;
      }
      case 'mkdir': {
        const p_ = args.includes('-p');
        out = [];
        args.filter(a => !a.startsWith('-')).forEach(p => {
          if (p_) {
            let cur = '';
            norm(p).split('/').filter(Boolean).forEach(seg => {
              cur += '/' + seg;
              const { parent, name } = parentOf(cur);
              if (parent && !parent.children[name]) parent.children[name] = dir({}, '755', st.user);
            });
          } else {
            const { parent, name } = parentOf(p);
            if (!parent) out.push(E(`mkdir: cannot create directory '${p}': No such file or directory`));
            else if (parent.children[name]) out.push(E(`mkdir: cannot create directory '${p}': File exists`));
            else parent.children[name] = dir({}, '755', st.user);
          }
        });
        break;
      }
      case 'rm': {
        const rec = args.some(a => a.startsWith('-') && a.includes('r'));
        out = [];
        args.filter(a => !a.startsWith('-')).forEach(p => {
          const { parent, name } = parentOf(p);
          const n = parent && parent.children[name];
          if (!n) { if (!args.some(a => a.includes('f'))) out.push(E(`rm: cannot remove '${p}': No such file or directory`)); return; }
          if (n.t === 'd' && !rec) { out.push(E(`rm: cannot remove '${p}': Is a directory`)); return; }
          delete parent.children[name];
        });
        break;
      }
      case 'cp': case 'mv': {
        const f = args.filter(a => !a.startsWith('-'));
        if (f.length < 2) { out = [E(`${cmd}: missing destination file operand`)]; break; }
        const src = node(f[0]);
        if (!src) { out = [E(`${cmd}: cannot stat '${f[0]}': No such file or directory`)]; break; }
        const dst = node(f[1]);
        const nm = f[0].split('/').pop();
        const clone = JSON.parse(JSON.stringify(src));
        if (dst && dst.t === 'd') dst.children[nm] = clone;
        else { const { parent, name } = parentOf(f[1]); if (!parent) { out = [E(`${cmd}: target ไม่ถูกต้อง`)]; break; } parent.children[name] = clone; }
        if (cmd === 'mv') { const { parent, name } = parentOf(f[0]); delete parent.children[name]; }
        out = [];
        break;
      }
      case 'chmod': out = chmod(args); break;
      case 'chown': {
        const [own, ...t2] = args.filter(a => !a.startsWith('-'));
        out = [];
        t2.forEach(p => { const n = node(p); if (n) { n.owner = own.split(':')[0]; n.group = own.split(':')[1] || n.owner; } else out.push(E(`chown: cannot access '${p}'`)); });
        break;
      }
      case 'find': out = findCmd(args); break;
      case 'df': out = dfCmd(args); break;
      case 'du': {
        const target = norm(args.filter(a => !a.startsWith('-'))[0] || '.');
        if (!node(target)) { out = [E(`du: cannot access '${target}': No such file or directory`)]; break; }
        out = [`${lpad(st.dirSizes[target] || '148K', 6)}\t${target}`];
        break;
      }
      case 'free': out = ['               total        used        free      shared  buff/cache   available',
        'Mem:            3.8Gi       812Mi       1.9Gi        12Mi       1.1Gi       2.8Gi',
        'Swap:           2.0Gi          0B       2.0Gi']; break;
      case 'lsblk': out = lsblkCmd(); break;
      case 'uptime': out = [' 09:41:33 up 3 days,  4:12,  1 user,  load average: 0.08, 0.12, 0.09']; break;
      case 'date': out = ['Fri Aug 21 09:41:33 +07 2026']; break;
      case 'ps': out = ps(); break;
      case 'top': out = [D('(top เป็น interactive — lab นี้ใช้ ps aux แทน)')]; break;
      case 'kill': out = []; break;
      case 'systemctl': out = systemctl(args); break;
      case 'service': out = systemctl([args[1], args[0]]); break;
      case 'journalctl': {
        const n = node('/var/log/syslog');
        out = args.includes('-u') ? [`-- Logs begin at Fri 2026-08-21 08:55:12 +07 --`,
          `Aug 21 08:55:12 ${st.hostname} systemd[1]: Started ${args[args.indexOf('-u') + 1]}.`]
          : n.content.replace(/\n$/, '').split('\n');
        break;
      }
      case 'ip': out = ipCmd(args); break;
      case 'ifconfig': out = ipCmd(['a']); break;
      case 'arp': out = ipCmd(['neigh']); break;
      case 'ethtool': {
        const dev = args.filter(x => !x.startsWith('-'))[0];
        const i = st.ifaces[dev];
        if (!i) { out = [E(`ethtool: Cannot get device settings: No such device (${dev || 'ไม่ได้ระบุ interface'})`)]; break; }
        out = [`Settings for ${dev}:`,
          '\tSupported ports: [ TP ]',
          '\tSupported link modes:   10baseT/Half 10baseT/Full',
          '\t                        100baseT/Half 100baseT/Full',
          '\t                        1000baseT/Full',
          '\tSupports auto-negotiation: Yes',
          `\tSpeed: ${i.up ? '1000Mb/s' : 'Unknown!'}`,
          `\tDuplex: ${i.up ? 'Full' : 'Unknown!'}`,
          '\tPort: Twisted Pair',
          '\tAuto-negotiation: on',
          `\tLink detected: ${i.up ? 'yes' : 'no'}`];
        break;
      }
      case 'ping6': case 'ping': {
        const host = args.filter(a => !a.startsWith('-') && !/^\d+$/.test(a))[0];
        if (!host) { out = [E('ping: usage error: Destination address required')]; break; }
        const ok = st.hosts[host] !== undefined || host === '127.0.0.1' || Object.values(st.ifaces).some(i => i.ip === host) || host === st.gateway
          // IPv6: loopback, link-local และ address ที่ตั้งไว้บนเครื่องเอง ต้องตอบได้
          || host === '::1' || /^fe80:/i.test(host)
          || Object.values(st.ifaces).some(i => (i.ip6 || []).some(x => x.ip === host));
        out = [`PING ${host} (${host}) 56(84) bytes of data.`];
        for (let i = 1; i <= 4; i++) out.push(ok ? `64 bytes from ${host}: icmp_seq=${i} ttl=64 time=0.${i}${i} ms` : '');
        out.push('', `--- ${host} ping statistics ---`);
        out.push(ok ? OK('4 packets transmitted, 4 received, 0% packet loss, time 3005ms')
          : E('4 packets transmitted, 0 received, 100% packet loss, time 3050ms'));
        break;
      }
      case 'ss': case 'netstat': {
        out = ['Netid State  Recv-Q Send-Q Local Address:Port  Peer Address:Port Process'];
        if (st.services.sshd.active) out.push(`tcp   LISTEN 0      128          0.0.0.0:22         0.0.0.0:*     users:(("sshd",pid=${st.services.sshd.pid},fd=3))`);
        if (st.services.nginx.active) out.push(`tcp   LISTEN 0      511          0.0.0.0:80         0.0.0.0:*     users:(("nginx",pid=${st.services.nginx.pid},fd=6))`);
        out.push('udp   UNCONN 0      0        127.0.0.53:53         0.0.0.0:*     users:(("systemd-resolve",pid=640,fd=12))');
        break;
      }
      case 'useradd': case 'adduser': out = useradd(args); break;
      case 'usermod': {
        const gi = args.indexOf('-aG');
        const name = args[args.length - 1];
        if (gi >= 0 && st.users[name]) { st.users[name].groups.push(args[gi + 1]); out = []; }
        else out = st.users[name] ? [] : [E(`usermod: user '${name}' does not exist`)];
        break;
      }
      case 'groupadd': st.groups[args[0]] = 1001; out = []; break;
      case 'passwd': out = [D('(lab นี้ข้ามการตั้งรหัสผ่านจริง)'), OK('passwd: password updated successfully')]; break;
      case 'su': out = [D(`(สลับผู้ใช้เป็น ${args[0] || 'root'})`)], st.user = (args[0] === '-' ? args[1] : args[0]) || 'root'; break;
      case 'ufw': out = ufwCmd(args); break;
      case 'firewall-cmd': out = args.includes('--list-all')
        ? ['public (active)', '  target: default', '  interfaces: ens33', '  services: dhcpv6-client ssh', '  ports: ']
        : [OK('success')]; break;
      case 'tar': {
        const create = args.some(x => /^-?c/.test(x) && /f/.test(x));
        if (!create) { out = [D('(tar)')]; break; }
        // สร้างไฟล์ archive จริงในระบบไฟล์ จะได้ sha256sum / ls ต่อได้
        const fi = args.findIndex(x => /^-?[czjvf]*f$/.test(x));
        const target = fi >= 0 ? args[fi + 1] : args.filter(x => /\.(tar|tgz|gz)/.test(x))[0];
        if (target) { writeFile(norm(target), '(binary archive data)\n'); out = [D(`(สร้าง ${target} แล้ว)`)]; }
        else out = [D('(สร้าง archive แล้ว)')];
        break;
      }
      case 'nano': case 'vi': case 'vim': out = [D(`(editor แบบ interactive ใช้ใน lab ไม่ได้ — ใช้ echo "..." > ${args[0] || 'file'} แทน)`)]; break;
      case 'which': out = [args[0] ? `/usr/bin/${args[0]}` : E('which: missing argument')]; break;
      case 'env': out = Object.entries(st.env).map(([k, v]) => `${k}=${v}`); break;
      case 'export': {
        const m = args.join(' ').match(/^(\w+)=(.*)$/);
        if (m) st.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
        out = [];
        break;
      }
      case 'history': out = st.history.map((h, i) => `${lpad(i + 1, 5)}  ${h}`); break;
      case 'crontab': out = args.includes('-l') ? ['# m h  dom mon dow   command', '0 2 * * * /home/student/scripts/backup.sh'] : [D('(crontab editor ใช้ไม่ได้ใน lab)')]; break;
      case 'apt': case 'apt-get': case 'yum': case 'dnf':
        out = [D(`Reading package lists... Done`), D('Building dependency tree... Done'), OK(`${args[1] || 'package'} พร้อมใช้งาน (จำลอง)`)]; break;
      case 'sort': {
        const f = args.filter(a => !a.startsWith('-'));
        let src = f.length ? (node(f[0]) ? node(f[0]).content.replace(/\n$/, '').split('\n') : null) : stdin;
        if (!src) { out = [E(`sort: ${f[0] || ''}: No such file or directory`)]; break; }
        src = [...src].sort((a, b) => args.includes('-n') || args.includes('-rn')
          ? parseFloat(a) - parseFloat(b) : String(a).localeCompare(String(b)));
        if (args.some(a => a.startsWith('-') && a.includes('r'))) src.reverse();
        out = src;
        break;
      }
      case 'uniq': {
        const src = stdin || [];
        if (args.includes('-c')) {
          const seen = [];
          src.forEach(l => {
            const last = seen[seen.length - 1];
            if (last && last[1] === l) last[0]++;
            else seen.push([1, l]);
          });
          out = seen.map(([n, l]) => `${lpad(n, 7)} ${l}`);
        } else out = src.filter((l, i) => l !== src[i - 1]);
        break;
      }
      case 'cut': {
        const di = args.indexOf('-d');
        const fi = args.indexOf('-f');
        const delim = di >= 0 ? args[di + 1].replace(/^["']|["']$/g, '') : '\t';
        const fld = fi >= 0 ? +args[fi + 1] : 1;
        const f = args.filter((a, i) => !a.startsWith('-') && i !== di + 1 && i !== fi + 1);
        const src = f.length ? (node(f[0]) ? node(f[0]).content.replace(/\n$/, '').split('\n') : null) : stdin;
        if (!src) { out = [E('cut: ต้องระบุไฟล์ หรือใช้กับ pipe')]; break; }
        out = src.map(l => l.split(delim)[fld - 1] ?? '');
        break;
      }
      case 'ln': {
        const f = args.filter(a => !a.startsWith('-'));
        if (f.length < 2) { out = [E('ln: missing file operand')]; break; }
        const src = node(f[0]);
        if (!src) { out = [E(`ln: failed to access '${f[0]}': No such file or directory`)]; break; }
        const { parent, name } = parentOf(f[1]);
        if (!parent) { out = [E('ln: ปลายทางไม่ถูกต้อง')]; break; }
        parent.children[name] = { ...JSON.parse(JSON.stringify(src)), link: norm(f[0]) };
        out = [];
        break;
      }
      case 'stat': {
        const n = node(args[0]);
        if (!n) { out = [E(`stat: cannot statx '${args[0]}': No such file or directory`)]; break; }
        out = [`  File: ${args[0]}`, `  Size: ${n.t === 'd' ? 4096 : n.content.length}\tBlocks: 8\t${n.t === 'd' ? 'directory' : 'regular file'}`,
        `Access: (0${n.mode}/${modeStr(n)})  Uid: ( 1000/${n.owner})   Gid: ( 1000/${n.group})`,
        `Modify: 2026-08-21 09:41:33.000000000 +0700`];
        break;
      }
      case 'sysctl': {
        if (args.includes('-a')) { out = Object.entries(st.sysctl).map(([k, v]) => `${k} = ${v}`); break; }
        if (args.includes('--system') || args.includes('-p')) {
          const f = node('/etc/sysctl.d/99-hardening.conf');
          if (f) f.content.split('\n').filter(Boolean).forEach(l => {
            const m = l.match(/^\s*([\w.]+)\s*=\s*(\S+)/);
            if (m) st.sysctl[m[1]] = m[2];
          });
          out = [D('* Applying /etc/sysctl.d/99-hardening.conf ...'),
          ...Object.entries(st.sysctl).map(([k, v]) => `${k} = ${v}`)];
          break;
        }
        const wi = args.indexOf('-w');
        if (wi >= 0) {
          const m = args[wi + 1].match(/^([\w.]+)=(\S+)$/);
          if (m) { st.sysctl[m[1]] = m[2]; out = [`${m[1]} = ${m[2]}`]; }
          else out = [E('sysctl: ต้องเป็นรูปแบบ key=value')];
          break;
        }
        const k = args.filter(a => !a.startsWith('-'))[0];
        // sysctl ของจริงรับ key=value ได้โดยไม่ต้องใส่ -w
        const kv = k && k.match(/^([\w.]+)=(\S+)$/);
        if (kv) { st.sysctl[kv[1]] = kv[2]; out = [`${kv[1]} = ${kv[2]}`]; break; }
        out = k ? [st.sysctl[k] !== undefined ? `${k} = ${st.sysctl[k]}` : E(`sysctl: cannot stat /proc/sys/${k.replace(/\./g, '/')}`)]
          : [E('usage: sysctl [-a] [-w key=value] [--system]')];
        break;
      }
      case 'mount': {
        if (!args.length) { out = st.mounts.map(m => `${m.dev} on ${m.mp} type ${m.fs} (${m.opts})`); break; }
        if (args.includes('-a')) { out = [D('(อ่าน /etc/fstab และ mount ทั้งหมด — สำเร็จ)')]; break; }
        const f = args.filter(a => !a.startsWith('-'));
        if (f.length < 2) { out = [E('mount: ต้องระบุ device และ mountpoint')]; break; }
        if (!node(f[1])) { out = [E(`mount: mount point ${f[1]} does not exist`)]; break; }
        st.mounts.push({ dev: f[0], mp: f[1], fs: 'ext4', opts: 'defaults' });
        out = [];
        break;
      }
      case 'umount': {
        st.mounts = st.mounts.filter(m => m.mp !== args[0] && m.dev !== args[0]);
        out = [];
        break;
      }
      case 'blkid': {
        // ดิสก์ที่ยังไม่ถูกใช้จะไม่มีบรรทัดของตัวเอง เหมือน blkid จริง ๆ
        const uuid = (name) => {
          let h = 0x9e37;
          for (let i = 0; i < name.length; i++) h = ((h * 33) ^ name.charCodeAt(i)) >>> 0;
          const hex = (k) => ((h * (k + 7)) >>> 0).toString(16).padStart(8, '0').slice(0, k);
          return `${hex(8)}-${hex(4)}-4${hex(3)}-a${hex(3)}-${hex(8)}${hex(4)}`;
        };
        const lines = [];
        st.disks.forEach((d) => {
          d.parts.forEach((part) => {
            const dev = '/dev/' + part.name;
            const type = st.lvm.pvs.includes(dev) ? 'LVM2_member'
              : (st.formatted.find(f => f.dev === dev) || {}).type || 'ext4';
            lines.push(`${dev}: UUID="${uuid(part.name)}" TYPE="${type}"`);
          });
          const dev = '/dev/' + d.name;
          if (!d.parts.length) {
            const fmt = st.formatted.find(f => f.dev === dev);
            if (st.lvm.pvs.includes(dev)) lines.push(`${dev}: UUID="${uuid(d.name)}" TYPE="LVM2_member"`);
            else if (fmt) lines.push(`${dev}: UUID="${uuid(d.name)}" TYPE="${fmt.type}"`);
          }
        });
        Object.entries(st.lvm.lvs).forEach(([name, lv]) => {
          lines.push(`/dev/mapper/${lv.vg}-${name}: UUID="${uuid(name)}" TYPE="ext4"`);
        });
        out = lines;
        break;
      }
      case 'pvcreate': st.lvm.pvs.push(args[0]); out = [OK(`Physical volume "${args[0]}" successfully created.`)]; break;
      case 'vgextend': {
        const vg = st.lvm.vgs[args[0]];
        if (!vg) { out = [E(`Volume group "${args[0]}" not found`)]; break; }
        const pv = args[1];
        if (!st.lvm.pvs.includes(pv)) {
          out = [E(`  Physical volume "${pv}" not found.`), D('สร้างเป็น physical volume ก่อนด้วย pvcreate')];
          break;
        }
        if (vg.pvs.includes(pv)) { out = [E(`  Physical volume "${pv}" อยู่ใน ${args[0]} อยู่แล้ว`)]; break; }
        vg.pvs.push(pv);
        const disk = st.disks.find(d => '/dev/' + d.name === pv);
        const add = toKiB(disk ? disk.size : '20G');
        vg.size = humanKiB(toKiB(vg.size) + add);
        vg.free = humanKiB(toKiB(vg.free) + add);
        out = [OK(`Volume group "${args[0]}" successfully extended`)];
        break;
      }
      case 'vgs': out = ['  VG       #PV #LV #SN Attr   VSize  VFree',
      ...Object.entries(st.lvm.vgs).map(([k, v]) => `  ${pad(k, 8)} ${lpad(v.pvs.length, 3)}   1   0 wz--n- ${pad(v.size, 6)} ${v.free}`)]; break;
      case 'pvs': {
        // ขนาดของแต่ละ PV มาจากดิสก์จริง ส่วนพื้นที่ว่างของ VG จะเหลืออยู่ที่ PV ตัวท้ายที่เพิ่มเข้ามา
        // (LVM จัดสรรเรียงไปข้างหน้า) — ผลรวมจึงตรงกับที่ vgs รายงาน
        const sizeOf = (pv) => {
          for (const d of st.disks) {
            if ('/dev/' + d.name === pv) return toKiB(d.size);
            const part = d.parts.find(x => '/dev/' + x.name === pv);
            if (part) return toKiB(part.size);
          }
          return toKiB('40G');
        };
        const vgOf = (pv) => Object.keys(st.lvm.vgs).find(k => st.lvm.vgs[k].pvs.includes(pv)) || '';
        const freeLeft = {};
        Object.entries(st.lvm.vgs).forEach(([k, v]) => { freeLeft[k] = toKiB(v.free); });
        const freeOf = {};
        [...st.lvm.pvs].reverse().forEach((pv) => {
          const vg = vgOf(pv);
          if (!vg) { freeOf[pv] = sizeOf(pv); return; }        // ยังไม่ได้เข้า VG ก็ว่างทั้งก้อน
          const take = Math.min(freeLeft[vg] || 0, sizeOf(pv));
          freeOf[pv] = take;
          freeLeft[vg] -= take;
        });
        out = ['  PV         VG      Fmt  Attr PSize   PFree',
        ...st.lvm.pvs.map((pv) => {
          const vg = vgOf(pv);
          return `  ${pad(pv, 10)} ${pad(vg || '', 7)} lvm2 ${vg ? 'a--' : '---'}  ${pad(humanKiB(sizeOf(pv)), 7)} ${humanKiB(freeOf[pv])}`;
        })];
        break;
      }
      case 'lvs': out = ['  LV     VG      Attr       LSize  Pool Origin',
      ...Object.entries(st.lvm.lvs).map(([k, v]) => `  ${pad(k, 6)} ${pad(v.vg, 7)} -wi-ao---- ${v.size}`)]; break;
      case 'lvextend': {
        const target = args.filter(a => !a.startsWith('-')).pop();
        const name = String(target).split('/').pop();
        const lv = st.lvm.lvs[name];
        if (!lv) { out = [E(`Logical volume "${target}" not found.`)]; break; }
        const vg = st.lvm.vgs[lv.vg];
        const free = toKiB(vg ? vg.free : 0);
        // -l +100%FREE = เอาที่ว่างทั้งหมดของ VG · -L +20G = ระบุขนาดเอง
        const sized = args.find(a => /^\+?[\d.]+[KMGT]i?B?$/i.test(a));
        const add = /%FREE/i.test(args.join(' ')) || !sized ? free : toKiB(sized);
        if (add <= 0) { out = [E('  Insufficient free space: 0 extents needed, but only 0 available')]; break; }
        if (add > free) {
          out = [E(`  Insufficient free space: ต้องการ ${humanKiB(add)} แต่ ${lv.vg} เหลือ ${humanKiB(free)}`),
            D('เพิ่มดิสก์เข้า volume group ด้วย pvcreate + vgextend ก่อน')];
          break;
        }
        lv.size = humanKiB(toKiB(lv.size) + add);
        if (vg) vg.free = humanKiB(free - add);
        lv.pendingResize = true;
        lv.pendingGrow = (lv.pendingGrow || 0) + add;
        out = [OK(`Size of logical volume ${lv.vg}/${name} changed to ${lv.size}.`),
        OK('Logical volume successfully resized.'),
        D('อย่าลืมขยาย filesystem ด้วย resize2fs หรือ xfs_growfs — ไม่งั้น df ยังเห็นขนาดเท่าเดิม')];
        break;
      }
      case 'resize2fs': case 'xfs_growfs': {
        const arg = args.find(a => !a.startsWith('-'));
        const byPath = arg ? Object.entries(st.lvm.lvs)
          .find(([nm, l]) => String(arg).endsWith(nm) || arg === l.path) : null;
        const entry = byPath || Object.entries(st.lvm.lvs).find(([, l]) => l.pendingResize);
        const lv = entry ? entry[1] : null;
        if (!lv) { out = [E(`${cmd}: ไม่พบ logical volume ตามที่ระบุ`)]; break; }
        if (!lv.pendingResize) {
          out = [D('The filesystem is already the requested size. Nothing to do!')];
          break;
        }
        // ตรงนี้คือหัวใจของ lab: พื้นที่ใหม่จะโผล่ใน df ก็ต่อเมื่อขยาย filesystem แล้วเท่านั้น
        const target = st.filesystems.find(f => f.mp === lv.mp
          || f.dev === `/dev/mapper/${lv.vg}-${entry[0]}`);
        if (target) {
          target.size += lv.pendingGrow || 0;
          target.avail += lv.pendingGrow || 0;
          target.inodes += Math.round((lv.pendingGrow || 0) / 16);
        }
        lv.pendingResize = false;
        lv.pendingGrow = 0;
        out = [OK(`The filesystem on /dev/mapper/${lv.vg}-${entry[0]} is now ${Math.round((target ? target.size : 0) / 4)} (4k) blocks long.`)];
        break;
      }
      case 'timedatectl': {
        if (args[0] === 'set-timezone') { st.timezone = args[1]; out = []; break; }
        if (args[0] === 'set-ntp') { st.ntpSync = /true|1|yes/i.test(args[1]); out = []; break; }
        out = [`               Local time: Fri 2026-08-21 09:41:33 +07`,
          `           Universal time: Fri 2026-08-21 02:41:33 UTC`,
          `                Time zone: ${st.timezone} (+07, +0700)`,
          `System clock synchronized: ${st.ntpSync ? 'yes' : 'no'}`,
          `              NTP service: ${st.ntpSync ? 'active' : 'inactive'}`];
        break;
      }
      case 'ssh-keygen': {
        const home = st.env.HOME;
        let ssh = node(home + '/.ssh');
        if (!ssh) { const p2 = node(home); if (p2) { p2.children['.ssh'] = dir({}, '700', st.user); ssh = p2.children['.ssh']; } }
        const typ = args.includes('-t') ? args[args.indexOf('-t') + 1] : 'rsa';
        ssh.children[`id_${typ}`] = file('-----BEGIN OPENSSH PRIVATE KEY-----\n...\n', '600', st.user);
        ssh.children[`id_${typ}.pub`] = file(`ssh-${typ} AAAAC3NzaC1lZDI1NTE5AAAAI${st.user}@${st.hostname}\n`, '644', st.user);
        out = [`Generating public/private ${typ} key pair.`,
        `Your identification has been saved in ${home}/.ssh/id_${typ}`,
        `Your public key has been saved in ${home}/.ssh/id_${typ}.pub`];
        break;
      }
      case 'docker': {
        const sub = args[0];
        if (sub === 'ps') {
          const list = st.containers.filter(c => args.includes('-a') || c.state === 'Up');
          out = ['CONTAINER ID   IMAGE                  STATUS      PORTS                NAMES',
            ...list.map((c, i) => `${pad('a1b2c3d' + i, 14)} ${pad(c.image, 22)} ${pad(c.state, 11)} ${pad(c.ports || '', 20)} ${c.name}`)];
          if (list.length === 0) out.push(D('(ยังไม่มี container)'));
          break;
        }
        if (sub === 'images') { out = ['REPOSITORY   TAG            IMAGE ID       SIZE', ...st.images.map(i => `${pad(i.split(':')[0], 12)} ${pad(i.split(':')[1] || 'latest', 14)} ${'e3f1a2b4c5d6'} ${'48.2MB'}`)]; break; }
        if (sub === 'run') {
          const ni = args.indexOf('--name');
          const pi = args.indexOf('-p');
          const image = args.filter(a => !a.startsWith('-')).slice(1).find(a => st.images.some(i => i.startsWith(a.split(':')[0])));
          if (!image) { out = [E('Unable to find image locally — ลอง docker images เพื่อดู image ที่มี')]; break; }
          const name = ni >= 0 ? args[ni + 1] : 'container' + (st.containers.length + 1);
          st.containers.push({ name, image, state: 'Up', ports: pi >= 0 ? args[pi + 1] : '' });
          out = [OK('a1b2c3d4e5f6' + name)];
          break;
        }
        if (sub === 'stop' || sub === 'rm') {
          const c = st.containers.find(x => x.name === args[1]);
          if (!c) { out = [E(`Error: No such container: ${args[1]}`)]; break; }
          if (sub === 'stop') c.state = 'Exited'; else st.containers = st.containers.filter(x => x !== c);
          out = [args[1]];
          break;
        }
        if (sub === 'logs') out = [D(`(log ของ container ${args[args.length - 1]})`), '2026/08/21 09:41:33 [notice] start worker processes'];
        else if (sub === 'stats') out = ['CONTAINER   CPU %   MEM USAGE / LIMIT   NET I/O',
          ...st.containers.map(c => `${pad(c.name, 11)} 0.05%   12.4MiB / 1.9GiB    1.2kB / 850B`)];
        else out = [D('docker: รองรับ ps, images, run, stop, rm, logs, stats')];
        break;
      }
      case 'fail2ban-client': {
        if (args[0] === 'status') {
          // service ถูกสั่ง start แล้วก็ถือว่าใช้ได้ ไม่ต้องพึ่ง flag แยกอีกตัว
          out = (st.fail2ban.active || (st.services.fail2ban || {}).active)
            ? ['Status', '|- Number of jail:\t1', '`- Jail list:\tsshd']
            : [E('ERROR   Failed to access socket path — ยังไม่ได้เริ่ม service fail2ban')];
          break;
        }
        out = [D('(fail2ban-client: รองรับ status)')];
        break;
      }
      case 'getenforce': out = [st.selinux]; break;
      case 'setenforce': st.selinux = args[0] === '1' ? 'Enforcing' : 'Permissive'; out = []; break;
      case 'curl': {
        const url = args.filter(a => !a.startsWith('-'))[0];
        if (!url) { out = [E('curl: try \'curl --help\' for more information')]; break; }
        const local = /localhost|127\.0\.0\.1/.test(url);
        if (local && !st.services.nginx.active) { out = [D('*   Trying 127.0.0.1:80...'), E('curl: (7) Failed to connect to localhost port 80: Connection refused')]; break; }
        out = args.includes('-I')
          ? ['HTTP/1.1 200 OK', 'Server: nginx/1.24.0', 'Content-Type: text/html', 'Content-Length: 21', '']
          : ['<h1>It works!</h1>'];
        break;
      }
      case 'dig': {
        const host = args.filter(a => !a.startsWith('-') && !a.startsWith('@'))[0] || 'example.com';
        out = ['; <<>> DiG 9.18.18 <<>> ' + host, ';; QUESTION SECTION:', `;${host}.\t\t\tIN\tA`, '',
          ';; ANSWER SECTION:', `${host}.\t\t300\tIN\tA\t93.184.216.34`, '',
          `;; Query time: 12 msec`, `;; SERVER: ${st.dns[0]}#53(${st.dns[0]})`];
        break;
      }
      case 'traceroute': out = [`traceroute to ${args[0] || '8.8.8.8'} (${args[0] || '8.8.8.8'}), 30 hops max`,
        ` 1  ${st.gateway} (${st.gateway})  0.412 ms  0.388 ms`,
        ` 2  10.0.0.1 (10.0.0.1)  4.221 ms  4.115 ms`,
      ` 3  ${args[0] || '8.8.8.8'} (${args[0] || '8.8.8.8'})  11.902 ms  11.774 ms`]; break;
      case 'nmcli': {
        if (args[0] === 'con' && args[1] === 'mod') {
          const ai = args.findIndex(a => a === 'ipv4.addresses');
          const gi = args.findIndex(a => a === 'ipv4.gateway');
          const dev = args[2];
          st.ifaces[dev] ||= { up: true, mac: '00:0c:29:aa:bb:cc' };
          if (ai > 0) { const m = args[ai + 1].match(/^(\d+\.\d+\.\d+\.\d+)\/(\d+)$/); if (m) { st.ifaces[dev].ip = m[1]; st.ifaces[dev].prefix = +m[2]; } }
          if (gi > 0) st.gateway = args[gi + 1];
          out = [];
          break;
        }
        if (args[0] === 'con' && args[1] === 'up') { out = [OK('Connection successfully activated')]; break; }
        out = ['DEVICE  TYPE      STATE      CONNECTION',
          ...Object.keys(st.ifaces).map(k => `${pad(k, 7)} ${pad(k === 'lo' ? 'loopback' : 'ethernet', 9)} ${pad(st.ifaces[k].up ? 'connected' : 'disconnected', 10)} ${k}`)];
        break;
      }
      // ---------------- เครื่องมือด้าน Security / Forensics ----------------
      case 'awk': {
        const src = stdin || [];
        const fi = args.indexOf('-F');
        const fs2 = fi >= 0 ? args[fi + 1].replace(/^["']|["']$/g, '') : /\s+/;
        const prog = args.filter(a => /\{/.test(a)).join(' ') || args[args.length - 1] || '';
        const m = String(prog).match(/print\s+\$(\d+)/);
        if (!m) { out = [D('(lab นี้รองรับ awk เฉพาะรูปแบบ \'{print $N}\')')]; break; }
        const col = +m[1];
        out = src.map(l => (col === 0 ? l : (String(l).trim().split(fs2)[col - 1] ?? '')));
        break;
      }
      case 'nmap': {
        const target = args.filter(a => !a.startsWith('-'))[0];
        if (!target) { out = [E('Nmap: ต้องระบุเป้าหมาย เช่น nmap 192.168.10.0/24')]; break; }
        const openPorts = [];
        if (st.services.sshd.active) openPorts.push(['22/tcp', 'ssh', 'OpenSSH 8.9p1']);
        if (st.services.nginx.active) openPorts.push(['80/tcp', 'http', 'nginx 1.24.0']);
        st.containers.filter(c => c.state === 'Up' && /80/.test(c.ports || '')).forEach(() =>
          openPorts.push(['8080/tcp', 'http-proxy', 'docker']));
        out = ['Starting Nmap 7.94 ( https://nmap.org )',
          `Nmap scan report for ${target}`, 'Host is up (0.00042s latency).', '',
          'PORT     STATE SERVICE     VERSION'];
        (openPorts.length ? openPorts : [['22/tcp', 'ssh', 'OpenSSH 8.9p1']])
          .forEach(([p2, s2, v]) => out.push(`${pad(p2, 8)} open  ${pad(s2, 11)} ${v}`));
        out.push('', 'Nmap done: 1 IP address (1 host up) scanned in 1.42 seconds');
        break;
      }
      case 'tcpdump': {
        const ii = args.indexOf('-i');
        const iface = ii >= 0 ? args[ii + 1] : 'any';
        if (iface !== 'any' && !st.ifaces[iface]) { out = [E(`tcpdump: ${iface}: No such device exists`)]; break; }
        out = [`tcpdump: verbose output suppressed, use -v[v]... for full protocol decode`,
          `listening on ${iface}, link-type EN10MB (Ethernet), snapshot length 262144 bytes`,
          '09:41:33.104821 IP 192.168.10.55.51022 > 192.168.10.20.22: Flags [P.], length 96',
          '09:41:33.104988 IP 192.168.10.20.22 > 192.168.10.55.51022: Flags [.], ack 96',
          '09:41:34.221004 IP 45.9.148.3.40122 > 192.168.10.20.22: Flags [S], seq 1042, length 0',
          '09:41:34.221156 IP 45.9.148.3.40124 > 192.168.10.20.22: Flags [S], seq 1043, length 0',
          '09:41:34.221302 IP 45.9.148.3.40126 > 192.168.10.20.22: Flags [S], seq 1044, length 0',
          '', '6 packets captured'];
        break;
      }
      case 'sha256sum': case 'md5sum': {
        const f = args.filter(a => !a.startsWith('-'));
        if (!f.length) { out = [E(`${cmd}: ต้องระบุไฟล์`)]; break; }
        out = f.map(x => {
          const n = node(x);
          if (!n) return E(`${cmd}: ${x}: No such file or directory`);
          let hsh = 0;
          const content = n.t === 'd' ? x : n.content;
          for (let i = 0; i < content.length; i++) hsh = (hsh * 31 + content.charCodeAt(i)) >>> 0;
          const len = cmd === 'md5sum' ? 32 : 64;
          const hex = hsh.toString(16).padStart(8, '0').repeat(Math.ceil(len / 8)).slice(0, len);
          return `${hex}  ${x}`;
        });
        break;
      }
      case 'last': case 'lastb': {
        out = cmd === 'last'
          ? ['student  pts/0        192.168.10.55    Fri Aug 21 09:12   still logged in',
            'root     pts/1        192.168.10.55    Fri Aug 21 08:40 - 08:55  (00:15)',
            'reboot   system boot  5.15.0-105       Fri Aug 21 08:31   still running', '',
            'wtmp begins Mon Aug 18 07:02:11 2026']
          : [E('admin    ssh:notty    45.9.148.3       Fri Aug 21 09:13 - 09:13  (00:00)'),
            E('admin    ssh:notty    45.9.148.3       Fri Aug 21 09:13 - 09:13  (00:00)'),
            E('root     ssh:notty    45.9.148.3       Fri Aug 21 09:14 - 09:14  (00:00)'),
            '', 'btmp begins Fri Aug 21 09:13:55 2026'];
        break;
      }
      case 'who': out = [`${st.user}   pts/0        2026-08-21 09:12 (192.168.10.55)`]; break;
      case 'w': out = [' 09:41:33 up 3 days,  4:12,  1 user,  load average: 0.08, 0.12, 0.09',
        'USER     TTY      FROM             LOGIN@   IDLE   WHAT',
        `${pad(st.user, 8)} pts/0    192.168.10.55    09:12    0.00s  w`]; break;
      case 'iptables': case 'nft': {
        out = ['Chain INPUT (policy ' + (st.ufw.active ? 'DROP' : 'ACCEPT') + ')',
          'target     prot opt source               destination',
          ...st.ufw.rules.map(r => `${pad(r.action === 'allow' ? 'ACCEPT' : 'DROP', 10)} tcp  --  ${pad(r.from, 20)} anywhere    tcp dpt:${r.to}`),
          '', 'Chain FORWARD (policy DROP)', 'Chain OUTPUT (policy ACCEPT)'];
        break;
      }
      case 'lynis': {
        const score = 45 + (st.ufw.active ? 12 : 0) + (st.sysctl['net.ipv4.tcp_syncookies'] === '1' ? 8 : 0)
          + (st.services.auditd.active ? 10 : 0) + (st.services.fail2ban.active ? 8 : 0);
        out = ['[ Lynis 3.0.9 ]', '', '  - Performing system checks...',
          '  [+] Boot and services                                    [ DONE ]',
          '  [+] Kernel hardening                                     [ DONE ]',
          '  [+] Authentication                                       [ DONE ]',
          '  [+] Networking                                           [ DONE ]', '',
          '  Warnings:',
          ...(st.ufw.active ? [] : [E('  ! ไม่พบ firewall ที่ทำงานอยู่ [FIRE-4512]')]),
          ...(st.services.auditd.active ? [] : [E('  ! auditd ไม่ทำงาน — ไม่มี audit trail [ACCT-9628]')]),
          ...(st.smb1 === false ? [] : []),
          '', { s: `  Hardening index : ${Math.min(score, 100)} [${'#'.repeat(Math.floor(score / 10))}${'.'.repeat(10 - Math.floor(score / 10))}]`, c: score >= 70 ? 'okc' : 'hl' }];
        break;
      }
      case 'rkhunter': case 'chkrootkit': {
        out = ['Checking system commands...', '  Performing check of known rootkit files and directories',
          '  /usr/bin/ls                    [ OK ]', '  /usr/bin/ps                    [ OK ]',
          '  /usr/sbin/sshd                 [ OK ]', '',
          'Checking for suspicious files...',
          node('/tmp/.hidden') ? E('  พบไฟล์ซ่อนที่น่าสงสัย: /tmp/.hidden') : '  ไม่พบไฟล์ที่น่าสงสัยใน /tmp',
          '', OK('System checks summary: ' + (node('/tmp/.hidden') ? '1 warning' : 'no warnings found'))];
        break;
      }
      case 'aide': {
        out = ['AIDE 0.17.4 found differences between database and filesystem!!',
          '', 'Summary:', '  Total number of entries:\t42891',
          '  Added entries:\t\t' + (node('/tmp/.hidden') ? '1' : '0'),
          '  Removed entries:\t\t0', '  Changed entries:\t\t0'];
        break;
      }
      case 'auditctl': {
        if (args.includes('-l')) {
          out = st.services.auditd.active
            ? ['-w /etc/passwd -p wa -k identity', '-w /etc/sudoers -p wa -k scope', '-a always,exit -F arch=b64 -S execve -k exec']
            : [D('No rules — auditd ยังไม่ทำงาน')];
        } else out = [OK('rule added')];
        break;
      }
      case 'ausearch': {
        out = st.services.auditd.active
          ? ['----', 'time->Fri Aug 21 09:14:02 2026',
            'type=USER_AUTH msg=audit(1755765242.113:842): pid=1470 uid=0 auid=4294967295 ses=4294967295',
            ' msg=\'op=PAM:authentication acct="root" exe="/usr/sbin/sshd" hostname=45.9.148.3 res=failed\'']
          : [E('<no matches> — ต้องเปิด auditd ก่อน')];
        break;
      }
      case 'openssl': {
        if (args[0] === 'x509') {
          out = ['notBefore=Jan 15 00:00:00 2026 GMT', 'notAfter=Apr 15 23:59:59 2026 GMT',
            'subject=CN = www.company.co.th', 'issuer=C = US, O = Let\'s Encrypt, CN = R3'];
        } else if (args[0] === 's_client') {
          out = ['CONNECTED(00000003)', 'depth=2 C = US, O = Internet Security Research Group, CN = ISRG Root X1',
            'verify return:1', '---', 'SSL handshake has read 5142 bytes', 'Protocol  : TLSv1.3',
            'Cipher    : TLS_AES_256_GCM_SHA384'];
        } else if (args[0] === 'rand') out = [OK('bR7xK2mQ9vN4pL8sT1wY6zC3fH5jD0gA')];
        else if (args[0] === 'genrsa') {
          const o = args[args.indexOf('-out') + 1];
          const bits = args.find(x => /^\d{4}$/.test(x)) || '2048';
          if (o) writeFile(norm(o), '-----BEGIN PRIVATE KEY-----\n(lab key data)\n-----END PRIVATE KEY-----\n');
          out = [`Generating RSA private key, ${bits} bit long modulus (2 primes)`, '.....++++', 'e is 65537 (0x010001)',
            ...(o ? [OK(`เขียนคีย์ลง ${o} แล้ว`)] : [])];
        } else if (args[0] === 'req') {
          const o = args[args.indexOf('-out') + 1];
          if (args.includes('-new') && o) {
            writeFile(norm(o), '-----BEGIN CERTIFICATE REQUEST-----\n(lab csr data)\n-----END CERTIFICATE REQUEST-----\n');
            out = [D('กรอกข้อมูลองค์กรสำหรับใบรับรอง (lab นี้ใส่ค่าตัวอย่างให้แล้ว)'),
              'Country Name (2 letter code) [TH]:', 'Organization Name [Example Co., Ltd.]:',
              'Common Name (e.g. server FQDN) [www.example.co.th]:', OK(`สร้าง CSR ที่ ${o} แล้ว`)];
          } else {
            out = ['Certificate Request:', '    Data:', '        Version: 1 (0x0)',
              '        Subject: C = TH, O = Example Co., Ltd., CN = www.example.co.th',
              '        Subject Public Key Info:', '            Public Key Algorithm: rsaEncryption',
              '                RSA Public-Key: (2048 bit)'];
          }
        } else if (args[0] === 'verify') {
          const f = args.filter(x => !x.startsWith('-'))[1];
          out = node(norm(f || '')) ? [OK(`${f}: OK`)] : [E(`${f}: ไม่พบไฟล์`)];
        } else if (args[0] === 'enc') {
          const o = args[args.indexOf('-out') + 1];
          const i = args[args.indexOf('-in') + 1];
          if (i && !node(norm(i))) { out = [E(`openssl: ${i}: No such file or directory`)]; break; }
          if (o) writeFile(norm(o), 'Salted__(ciphertext)\n');
          out = [OK(o ? `เข้ารหัสแล้วเขียนลง ${o}` : 'เข้ารหัสแล้ว')];
        } else if (/^(sha256|sha1|md5|dgst)$/.test(args[0])) {
          const f = args.filter(x => !x.startsWith('-') && x !== args[0])[0];
          const n = f && node(norm(f));
          out = n ? [`SHA256(${f})= 9f2c4a1e7b3d5068ac91fe4472bd8e0351c6a7d9f0b2e4318c5a6d7e8f901234`]
            : [E(`openssl: ${f || '(ไม่ได้ระบุไฟล์)'}: No such file or directory`)];
        } else out = [D('openssl: lab นี้รองรับ x509, s_client, rand, genrsa, req, verify, enc, sha256')];
        break;
      }
      case 'file': {
        const n = node(args[0]);
        out = n ? [`${args[0]}: ${n.t === 'd' ? 'directory' : /^#!/.test(n.content) ? 'Bourne-Again shell script, ASCII text executable' : 'ASCII text'}`]
          : [E(`${args[0]}: cannot open (No such file or directory)`)];
        break;
      }
      case 'strings': {
        const n = node(args[0]);
        out = n && n.t === 'f' ? n.content.split('\n').filter(l => l.trim().length > 3) : [E(`strings: ${args[0]}: No such file`)];
        break;
      }
      case 'chage': {
        // แยกค่าที่ตามหลัง flag ออกก่อน ไม่งั้น chage -M 90 -W 7 somchai จะเข้าใจว่า user คือ "90"
        const FLAGV = new Set(['-m', '-M', '-W', '-E', '-I', '-d']);
        const rest = [];
        for (let k = 0; k < args.length; k++) {
          if (FLAGV.has(args[k])) { k++; continue; }
          if (!args[k].startsWith('-')) rest.push(args[k]);
        }
        const u = rest[0];
        if (u && st.users[u] && args.some(x => FLAGV.has(x))) {
          const g = f => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };
          const p = (st.users[u].pwAge ||= {});
          if (g('-M')) p.max = +g('-M');
          if (g('-m')) p.min = +g('-m');
          if (g('-W')) p.warn = +g('-W');
          if (g('-E')) p.expire = g('-E');
          out = [];
          break;
        }
        out = st.users[u]
          ? [`Last password change\t\t\t\t\t: Aug 01, 2026`, `Password expires\t\t\t\t\t: never`,
            `Password inactive\t\t\t\t\t: never`, `Account expires\t\t\t\t\t\t: never`,
            `Minimum number of days between password change\t\t: 0`,
            `Maximum number of days between password change\t\t: 99999`]
          : [E(`chage: user '${u}' does not exist`)];
        break;
      }
      case 'clear': out = ['\x00CLEAR']; break;
      case 'exit': case 'logout': out = [D('(ออกจาก shell)')]; break;
      case 'man': out = [D(`ดู help ของ ${args[0] || 'command'} — ใน lab ใช้ ? เพื่อดูคำสั่งที่รองรับ`)]; break;
      case 'help': case '?': out = helpList(); break;
      default:
        out = [E(`${cmd}: command not found`)];
        st.lastCode = 127;
    }

    if (redirect) {
      // stderr ไม่ไหลลงไฟล์ (ของจริงต้องเขียน 2> เอง) — คำสั่งที่พังจึงได้ไฟล์ว่าง
      // และ error ยังโผล่บนจอ ไม่ถูกกลืนหายจนดูเหมือนคำสั่งทำงานสำเร็จ
      const isErr = o => o && typeof o === 'object' && o.c === 'err';
      const errs = out.filter(isErr);
      out = out.filter(o => !isErr(o));
      const txt = out.map(o => (typeof o === 'string' ? o : o.s)).join('\n') + '\n';
      writeFile(redirect, txt, append);
      return errs;
    }
    return out;
  }

  function exec(raw) {
    const line = raw.trim();
    if (!line) return [];
    st.history.push(line);
    if (line === '?') return helpList();

    // pipes
    const parts = line.split('|').map(s => s.trim());
    let stdin = null, out = [];
    for (const p of parts) {
      out = runOne(p, stdin);
      // ต้นทางพังทั้งอัน — หยุดตรงนี้ ไม่ส่งท่อต่อ ไม่งั้นคำสั่งถัดไปจะพ่นผลออกมา
      // แล้วทั้งบรรทัดถูกนับว่า "รันสำเร็จ" ทั้งที่ผู้เรียนพิมพ์ผิด
      if (out.length && out.every(o => o && typeof o === 'object' && o.c === 'err')) return out;
      stdin = out.map(o => (typeof o === 'string' ? o : o.s));
    }
    return out;
  }

  function helpList() {
    return [
      D('คำสั่งที่ lab นี้รองรับ:'),
      '  ไฟล์/ไดเรกทอรี : ls  cd  pwd  cat  head  tail  touch  mkdir  rm  cp  mv  find  grep  wc  du',
      '  สิทธิ์/ผู้ใช้   : chmod  chown  useradd  usermod  groupadd  passwd  id  whoami  su  sudo',
      '  ระบบ          : systemctl  service  journalctl  ps  df  free  lsblk  uptime  uname  hostnamectl',
      '  เครือข่าย      : ip a  ip r  ip addr add  ip link set  ping  ss  netstat  ufw  firewall-cmd',
      '  อื่น ๆ         : echo  export  env  history  crontab -l  apt  tar  date  clear',
      '  ข้อความ/pipe   : sort  uniq -c  cut -d: -f1  ln -s  stat',
      '  Storage/LVM   : blkid  mount  umount  pvcreate  vgextend  lvextend  resize2fs  pvs  vgs  lvs',
      '  Tuning/เวลา    : sysctl -a  sysctl -w  sysctl --system  timedatectl',
      '  Container     : docker ps  docker images  docker run  docker stop  docker logs  docker stats',
      '  Security      : ssh-keygen  fail2ban-client status  getenforce  setenforce',
      '  Net เพิ่มเติม   : curl  dig  traceroute  nmcli',
      '  Security tools: nmap  tcpdump  lynis  rkhunter  aide  auditctl  ausearch  openssl',
      '  Forensics     : last  lastb  who  w  sha256sum  md5sum  file  strings  awk  iptables -L  chage',
      D('  รองรับ pipe (|) และ redirect (> , >>)'),
    ];
  }

  return {
    state: st,
    prompt,
    exec,
    hint: helpList,
    banner: () => [
      D('Welcome to Ubuntu 22.04.4 LTS (GNU/Linux 5.15.0-105-generic x86_64)'),
      D(' * Documentation:  https://help.ubuntu.com'),
      D(`Last login: Fri Aug 21 09:12:40 2026 from 192.168.10.55`),
      D('พิมพ์ ? เพื่อดูคำสั่งที่รองรับ'),
      '',
    ],
    completions: () => [
      'ls -la', 'cd /etc', 'pwd', 'cat /etc/os-release', 'cat /etc/passwd', 'grep -i fail /var/log/auth.log',
      'systemctl status sshd', 'systemctl start nginx', 'systemctl enable nginx', 'systemctl restart sshd',
      'ip a', 'ip r', 'ip addr add 192.168.10.30/24 dev ens33', 'ping 8.8.8.8', 'ss -tulpn',
      'useradd -m -s /bin/bash ops1', 'usermod -aG sudo ops1', 'chmod 750 /home/student/scripts',
      'chown student:student /var/www/html', 'df -h', 'free -h', 'ps aux', 'find /etc -name "*.conf"',
      'ufw allow 22/tcp', 'ufw enable', 'ufw status', 'journalctl -u sshd', 'mkdir -p /backup/www',
      'echo "hello" > /tmp/test.txt', 'tail -n 20 /var/log/syslog', 'hostnamectl set-hostname web01',
    ],
  };
}
