// ============================================================
//  Cisco IOS (Catalyst Switch) emulator
// ============================================================
import { words, pad, lpad, E, D, H, OK, isIp, maskToPrefix } from './util.js';

const IF_PREFIX = [
  ['fastethernet', 'FastEthernet', 'Fa'],
  ['gigabitethernet', 'GigabitEthernet', 'Gi'],
  ['tengigabitethernet', 'TenGigabitEthernet', 'Te'],
  ['ethernet', 'Ethernet', 'Et'],
  ['port-channel', 'Port-channel', 'Po'],
  ['vlan', 'Vlan', 'Vl'],
  ['loopback', 'Loopback', 'Lo'],
];

function newIface(name, short, extra = {}) {
  return {
    name, short,
    link: false,          // มีสายเสียบ / ปลายทาง up หรือไม่
    shutdown: false,
    desc: '',
    swMode: 'dynamic',    // dynamic | access | trunk
    routed: false,
    accessVlan: 1,
    voiceVlan: null,
    nativeVlan: 1,
    allowed: null,        // null = all
    encap: null,
    speed: 'auto',
    duplex: 'auto',
    portfast: false,
    bpduguard: false,
    psec: null,           // {max, violation, sticky, macs:[]}
    channel: null,        // {group, mode}
    ip: null, mask: null,
    // --- ฟีเจอร์เพิ่มเติม ---
    snoopTrust: false,
    snoopRate: null,
    arpTrust: false,
    stormControl: null,   // {broadcast, multicast, unicast}
    guard: null,          // 'root' | 'loop'
    udld: null,           // 'enable' | 'aggressive'
    nonegotiate: false,
    dot1x: false,
    poe: null,            // 'auto' | 'never' | 'static'
    ...extra,
  };
}

function newSvi(extra = {}) {
  return { ip: null, mask: null, shutdown: true, desc: '', helpers: [], standby: {}, standbyVersion: 1, ...extra };
}

export function createCisco(init = {}) {
  const st = {
    vendor: 'cisco',
    hostname: init.hostname || 'Switch',
    enabled: false,
    mode: 'user',            // user|priv|config|config-if|config-vlan|config-line
    ctx: null,
    enableSecret: null,
    enablePassword: null,
    vlans: { 1: { id: 1, name: 'default' } },
    ifaces: {},
    order: [],
    svis: {},                // vlanId -> {ip,mask,shutdown,desc}
    defaultGw: null,
    ipRouting: false,
    routes: [],
    stpMode: 'pvst',
    stpPriority: {},
    users: {},
    lines: {
      'console 0': { password: null, login: false, logsync: false, exectimeout: null },
      'vty 0 4': { password: null, login: false, transport: null, exectimeout: null },
    },
    banner: null,
    domainLookup: true,
    domainName: null,
    rsaKey: false,
    sshVersion: null,
    pwEncrypt: false,
    savedConfig: null,
    // --- ฟีเจอร์ระดับ 3-5 ---
    dhcpSnoop: { enabled: false, vlans: '', optionInsert: true },
    arpInspect: { vlans: '' },
    spanSessions: {},          // id -> {src:[], dst:[], dir}
    loggingHosts: [],
    snmp: [],                  // {name, mode}
    ntpServers: [],
    // --- routing / services (CCNA domain 3-5) ---
    ospf: null,            // {pid, routerId, networks:[{net,wc,area}], passive:[]}
    acls: {},              // ชื่อหรือเลข -> {kind:'standard'|'extended', rules:[]}
    natInside: [],         // ชื่อ interface ที่เป็นฝั่ง inside
    natOutside: [],
    natRules: [],          // {kind:'static'|'overload', local, global, list, iface}
    dhcpPools: {},         // ชื่อ pool -> {network, mask, router, dns, domain, lease}
    dhcpExcluded: [],      // {from, to}
    nameServers: [],
    vtp: { mode: 'server', domain: null, version: 2 },
    errdisableRecovery: { causes: [], interval: 300 },
    aaa: false,
    dot1x: false,
    radius: [],                // {name, ip, key}
    hosts: init.hosts || {},   // ip -> name  (สำหรับ ping)
    neighbors: init.neighbors || {},
    log: [],
  };

  // สร้างพอร์ตเริ่มต้น
  const build = (prefix, short, from, to) => {
    for (let i = from; i <= to; i++) {
      const n = `${prefix}0/${i}`;
      st.ifaces[n] = newIface(n, `${short}0/${i}`);
      st.order.push(n);
    }
  };
  build('FastEthernet', 'Fa', 1, init.faPorts ?? 24);
  build('GigabitEthernet', 'Gi', 1, init.giPorts ?? 2);

  // พอร์ตที่ "มีสายเสียบ" ตอนเริ่ม
  (init.linkUp || ['FastEthernet0/1', 'FastEthernet0/2', 'FastEthernet0/3', 'GigabitEthernet0/1'])
    .forEach(n => { if (st.ifaces[n]) st.ifaces[n].link = true; });

  st.svis[1] = newSvi();
  if (init.apply) init.apply(st);

  // ---------- utils ----------
  const ifList = () => st.order.map(n => st.ifaces[n]);

  function expandIfName(raw) {
    const s = raw.replace(/\s+/g, '').toLowerCase();
    const m = s.match(/^([a-z-]+)([\d/.]+)$/);
    if (!m) return null;
    const [, p, num] = m;
    const hit = IF_PREFIX.find(x => x[0].startsWith(p));
    if (!hit) return null;
    return { full: hit[1] + num, short: hit[2] + num, kind: hit[1], num };
  }

  function resolveIf(argTokens) {
    const raw = argTokens.join('');
    const r = expandIfName(raw);
    if (!r) return null;
    if (r.kind === 'Vlan') return { vlan: +r.num };
    if (st.ifaces[r.full]) return { iface: st.ifaces[r.full] };
    if (r.kind === 'Port-channel') {
      if (!st.ifaces[r.full]) {
        st.ifaces[r.full] = newIface(r.full, r.short);
        st.order.push(r.full);
      }
      return { iface: st.ifaces[r.full] };
    }
    return { missing: r.full };
  }

  function expandRange(argTokens) {
    // เช่น  fa0/1 - 5   หรือ  fa0/1-5   หรือ  fa0/1 , fa0/5
    const raw = argTokens.join(' ').replace(/\s*-\s*/g, '-');
    const out = [];
    for (const part of raw.split(',')) {
      const t = part.trim();
      const m = t.match(/^(.+?[\d/]*\/)(\d+)-(\d+)$/);
      if (m) {
        const base = expandIfName(m[1] + m[2]);
        if (!base) return null;
        const stem = base.full.replace(/\d+$/, '');
        for (let i = +m[2]; i <= +m[3]; i++) {
          if (st.ifaces[stem + i]) out.push(st.ifaces[stem + i]);
        }
      } else {
        const r = resolveIf([t]);
        if (r && r.iface) out.push(r.iface);
      }
    }
    return out.length ? out : null;
  }

  const ifStatus = i => (i.shutdown ? 'disabled' : i.link ? 'connected' : 'notconnect');
  const isUp = i => !i.shutdown && i.link;

  function vlanPorts(id) {
    return ifList().filter(i => !i.routed && i.swMode !== 'trunk' && i.accessVlan === id)
      .map(i => i.short);
  }

  function allowedList(i) {
    if (!i.allowed) return '1-4094';
    return i.allowed;
  }

  // ---------- prompt ----------
  function prompt() {
    const h = st.hostname;
    switch (st.mode) {
      case 'user': return `${h}>`;
      case 'priv': return `${h}#`;
      case 'config': return `${h}(config)#`;
      case 'config-if': return `${h}(config-if${st.ctx && st.ctx.list.length > 1 ? '-range' : ''})#`;
      case 'config-vlan': return `${h}(config-vlan)#`;
      case 'config-line': return `${h}(config-line)#`;
      case 'config-router': return `${h}(config-router)#`;
      case 'config-acl': return `${h}(config-${st.ctx && st.ctx.kind === 'extended' ? 'ext' : 'std'}-nacl)#`;
      case 'config-dhcp': return `${h}(dhcp-config)#`;
      default: return `${h}#`;
    }
  }

  // ---------- show running-config ----------
  function runningConfig() {
    const L = [];
    L.push('Building configuration...', '');
    L.push('Current configuration : 2114 bytes', '!', 'version 15.2', 'no service timestamps log datetime msec');
    L.push(st.pwEncrypt ? 'service password-encryption' : 'no service password-encryption', '!');
    L.push(`hostname ${st.hostname}`, '!');
    if (st.enableSecret) L.push(`enable secret 5 $1$mERr$${btoa(st.enableSecret).slice(0, 12)}`, '!');
    else if (st.enablePassword) L.push(`enable password ${st.enablePassword}`, '!');
    if (!st.domainLookup) L.push('no ip domain-lookup', '!');
    Object.values(st.users).forEach(u =>
      L.push(`username ${u.name} privilege ${u.priv} ${u.secret ? 'secret 5 $1$xyz$' + btoa(u.pass).slice(0, 10) : 'password ' + u.pass}`));
    if (Object.keys(st.users).length) L.push('!');
    if (st.stpMode !== 'pvst') L.push(`spanning-tree mode ${st.stpMode}`);
    Object.entries(st.stpPriority).forEach(([v, p]) => L.push(`spanning-tree vlan ${v} priority ${p}`));
    L.push('!');
    Object.values(st.vlans).filter(v => v.id !== 1).forEach(v => {
      L.push(`vlan ${v.id}`);
      if (v.name && v.name !== `VLAN${String(v.id).padStart(4, '0')}`) L.push(` name ${v.name}`);
      L.push('!');
    });
    ifList().forEach(i => {
      L.push(`interface ${i.name}`);
      if (i.desc) L.push(` description ${i.desc}`);
      if (i.routed) {
        L.push(' no switchport');
        if (i.ip) L.push(` ip address ${i.ip} ${i.mask}`);
      } else {
        if (i.swMode === 'access') L.push(' switchport mode access');
        if (i.swMode === 'trunk') {
          if (i.encap) L.push(` switchport trunk encapsulation ${i.encap}`);
          L.push(' switchport mode trunk');
          if (i.nativeVlan !== 1) L.push(` switchport trunk native vlan ${i.nativeVlan}`);
          if (i.allowed) L.push(` switchport trunk allowed vlan ${i.allowed}`);
        }
        if (i.accessVlan !== 1 && i.swMode !== 'trunk') L.push(` switchport access vlan ${i.accessVlan}`);
        if (i.voiceVlan) L.push(` switchport voice vlan ${i.voiceVlan}`);
        if (i.psec) {
          L.push(' switchport port-security');
          if (i.psec.max !== 1) L.push(` switchport port-security maximum ${i.psec.max}`);
          if (i.psec.violation !== 'shutdown') L.push(` switchport port-security violation ${i.psec.violation}`);
          if (i.psec.sticky) L.push(' switchport port-security mac-address sticky');
        }
      }
      if (i.channel) L.push(` channel-group ${i.channel.group} mode ${i.channel.mode}`);
      if (i.speed !== 'auto') L.push(` speed ${i.speed}`);
      if (i.duplex !== 'auto') L.push(` duplex ${i.duplex}`);
      if (i.portfast) L.push(' spanning-tree portfast');
      if (i.bpduguard) L.push(' spanning-tree bpduguard enable');
      if (i.shutdown) L.push(' shutdown');
      L.push('!');
    });
    Object.entries(st.svis).forEach(([id, s]) => {
      if (!s.ip && +id === 1 && s.shutdown) return;
      L.push(`interface Vlan${id}`);
      if (s.desc) L.push(` description ${s.desc}`);
      if (s.ip) L.push(` ip address ${s.ip} ${s.mask}`);
      else L.push(' no ip address');
      if (s.shutdown) L.push(' shutdown');
      L.push('!');
    });
    if (st.ipRouting) L.push('ip routing', '!');
    if (st.defaultGw) L.push(`ip default-gateway ${st.defaultGw}`, '!');
    st.routes.forEach(r => L.push(`ip route ${r.net} ${r.mask} ${r.nh}`));
    if (st.routes.length) L.push('!');
    if (st.banner) L.push(`banner motd ^C${st.banner}^C`, '!');
    Object.entries(st.lines).forEach(([n, l]) => {
      L.push(`line ${n}`);
      if (l.password) L.push(` password ${l.password}`);
      if (l.login) L.push(l.loginLocal ? ' login local' : ' login');
      if (l.logsync) L.push(' logging synchronous');
      if (l.transport) L.push(` transport input ${l.transport}`);
      if (l.exectimeout) L.push(` exec-timeout ${l.exectimeout}`);
      L.push('!');
    });
    L.push('!', 'end', '');
    return L;
  }

  // ---------- show handlers ----------
  function doShow(t) {
    const a = t.map(x => x.toLowerCase());
    const is = (i, ...opts) => opts.some(o => o.startsWith(a[i] || '\u0000'));

    if (!a.length) return [E('% Incomplete command.')];

    if (is(0, 'running-config')) return runningConfig();
    if (is(0, 'startup-config')) {
      return st.savedConfig ? st.savedConfig : [D('startup-config is not present')];
    }
    if (is(0, 'version')) return [
      'Cisco IOS Software, C2960 Software (C2960-LANBASEK9-M), Version 15.2(4)E7',
      'Technical Support: http://www.cisco.com/techsupport',
      'Copyright (c) 1986-2018 by Cisco Systems, Inc.',
      '',
      `${st.hostname} uptime is 1 hour, 24 minutes`,
      'System returned to ROM by power-on',
      'System image file is "flash:c2960-lanbasek9-mz.152-4.E7.bin"',
      '',
      'cisco WS-C2960-24TT-L (PowerPC405) processor (revision C0) with 65536K bytes of memory.',
      'Base ethernet MAC Address       : 00:1A:2B:3C:00:01',
      `${ifList().filter(i => i.name.startsWith('Fast')).length} FastEthernet Interfaces`,
      `${ifList().filter(i => i.name.startsWith('Giga')).length} Gigabit Ethernet Interfaces`,
      '',
      'Configuration register is 0xF',
    ];
    if (is(0, 'clock')) return ['*09:41:33.117 UTC Mon Aug 21 2026'];
    if (is(0, 'vlan')) {
      if (a[1] && !'brief'.startsWith(a[1])) return [E('% Invalid input detected.')];
      const L = [
        'VLAN Name                             Status    Ports',
        '---- -------------------------------- --------- -------------------------------',
      ];
      Object.values(st.vlans).sort((x, y) => x.id - y.id).forEach(v => {
        const ports = vlanPorts(v.id);
        const chunks = [];
        for (let i = 0; i < Math.max(1, ports.length); i += 6) chunks.push(ports.slice(i, i + 6).join(', '));
        L.push(`${lpad(v.id, 4)} ${pad(v.name, 32)} active    ${chunks[0] || ''}`);
        chunks.slice(1).forEach(c => L.push(`${' '.repeat(48)}${c}`));
      });
      L.push('1002 fddi-default                     act/unsup');
      L.push('1003 token-ring-default               act/unsup');
      return L;
    }
    if (a[0] && 'ip'.startsWith(a[0]) && is(1, 'interface') && is(2, 'brief')) {
      const L = ['Interface              IP-Address      OK? Method Status                Protocol'];
      ifList().forEach(i => {
        L.push(`${pad(i.name, 22)} ${pad(i.routed && i.ip ? i.ip : 'unassigned', 15)} ${i.ip ? 'YES' : 'YES'} ${pad(i.ip ? 'manual' : 'unset', 6)} ${pad(i.shutdown ? 'administratively down' : i.link ? 'up' : 'down', 21)} ${i.shutdown || !i.link ? 'down' : 'up'}`);
      });
      Object.entries(st.svis).forEach(([id, s]) => {
        const anyUp = ifList().some(i => isUp(i) && (i.swMode === 'trunk' || i.accessVlan === +id));
        const status = s.shutdown ? 'administratively down' : anyUp ? 'up' : 'down';
        L.push(`${pad('Vlan' + id, 22)} ${pad(s.ip || 'unassigned', 15)} YES ${pad(s.ip ? 'manual' : 'unset', 6)} ${pad(status, 21)} ${status === 'up' ? 'up' : 'down'}`);
      });
      return L;
    }
      // ---- OSPF ----
    if (a[0] && 'ip'.startsWith(a[0]) && is(1, 'ospf')) {
      if (!st.ospf) return [D('(ยังไม่ได้เปิด OSPF — สั่ง router ospf <pid> ก่อน)')];
      const o = st.ospf;
      const areas = [...new Set(o.networks.map(n => n.area))];
      if (is(2, 'neighbor')) {
        const nb = ospfNeighbors();
        return nb.length
          ? table(['Neighbor ID', 'Pri', 'State', 'Dead Time', 'Address', 'Interface'],
            nb.map(n => [n.id, '1', 'FULL/BDR', '00:00:35', n.addr, n.iface]))
          : [D('(ยังไม่มี neighbor — ตรวจว่า network ครอบคลุม interface และปลายทางเปิด OSPF แล้วหรือยัง)')];
      }
      if (is(2, 'interface')) {
        const ifs = ospfIfaces();
        return ifs.length
          ? table(['Interface', 'PID', 'Area', 'IP Address/Mask', 'Cost', 'State'],
            ifs.map(i => [i.short, String(o.pid), i.ospfArea || '0', `${i.ip}/${maskToPrefix(i.mask)}`, '1', 'DR']))
          : [D('(ยังไม่มี interface ใดเข้าร่วม OSPF)')];
      }
      return [`Routing Process "ospf ${o.pid}" with ID ${o.routerId || bestRouterId()}`,
        `  Number of areas in this router is ${areas.length || 0}`,
        ...o.networks.map(n => `  Network ${n.net} ${n.wc} area ${n.area}`),
        ...(o.passive.length ? [`  Passive Interface(s): ${o.passive.join(', ')}`] : [])];
    }
    if (a[0] && 'ip'.startsWith(a[0]) && is(1, 'protocols')) {
      if (!st.ospf) return [D('(ยังไม่ได้เปิด routing protocol ใด)')];
      return [`Routing Protocol is "ospf ${st.ospf.pid}"`,
        `  Router ID ${st.ospf.routerId || bestRouterId()}`,
        '  Routing for Networks:',
        ...st.ospf.networks.map(n => `    ${n.net} ${n.wc} area ${n.area}`)];
    }
    // ---- ACL ----
    if (is(0, 'access-lists') || (a[0] && 'ip'.startsWith(a[0]) && is(1, 'access-lists'))) {
      const names = Object.keys(st.acls);
      if (!names.length) return [D('(ยังไม่ได้สร้าง access-list)')];
      const out = [];
      names.forEach(n => {
        const acl = st.acls[n];
        out.push(`${acl.kind === 'extended' ? 'Extended' : 'Standard'} IP access list ${n}`);
        acl.rules.forEach((r, i) => out.push(`    ${(i + 1) * 10} ${aclLine(r)}`));
        if (!acl.rules.length) out.push(D('    (ยังไม่มี rule)'));
      });
      const applied = st.order.map(k => st.ifaces[k]).filter(i => i.aclIn || i.aclOut);
      if (applied.length) {
        out.push('');
        applied.forEach(i => out.push(D(`  ${i.short}: ${i.aclIn ? 'in=' + i.aclIn : ''} ${i.aclOut ? 'out=' + i.aclOut : ''}`)));
      }
      return out;
    }
    // ---- NAT ----
    if (a[0] && 'ip'.startsWith(a[0]) && is(1, 'nat')) {
      if (!st.natRules.length) return [D('(ยังไม่ได้ตั้ง NAT)')];
      if (is(2, 'statistics')) return [
        `Total active translations: ${st.natRules.length}`,
        `Outside interfaces: ${st.natOutside.join(', ') || '(ยังไม่ได้กำหนด)'}`,
        `Inside interfaces: ${st.natInside.join(', ') || '(ยังไม่ได้กำหนด)'}`,
        ...st.natRules.map(r => r.kind === 'static'
          ? `  Static: ${r.local} -> ${r.global}`
          : `  ${r.kind === 'overload' ? 'PAT (overload)' : 'Pool'} via list ${r.list} on ${r.iface || '?'}`),
      ];
      return table(['Pro', 'Inside global', 'Inside local', 'Outside local', 'Outside global'],
        st.natRules.filter(r => r.kind === 'static').map(r => ['---', r.global, r.local, '---', '---']));
    }
    // ---- DHCP server ----
    if (a[0] && 'ip'.startsWith(a[0]) && is(1, 'dhcp')) {
      const names = Object.keys(st.dhcpPools);
      if (is(2, 'binding')) return names.length
        ? [D('(lab นี้ไม่จำลอง client จริง จึงยังไม่มี binding)')]
        : [D('(ยังไม่ได้สร้าง DHCP pool)')];
      if (!names.length) return [D('(ยังไม่ได้สร้าง DHCP pool)')];
      const out = [];
      names.forEach(n => {
        const d = st.dhcpPools[n];
        out.push(`Pool ${n} :`);
        out.push(`  Network        : ${d.network || '-'} ${d.mask || ''}`);
        out.push(`  Default router : ${d.router || '-'}`);
        out.push(`  DNS server     : ${d.dns || '-'}`);
        if (d.domain) out.push(`  Domain name    : ${d.domain}`);
        out.push(`  Lease          : ${d.lease}`);
      });
      if (st.dhcpExcluded.length) {
        out.push('', 'Excluded addresses:');
        st.dhcpExcluded.forEach(e => out.push(`  ${e.from} - ${e.to}`));
      }
      return out;
    }
    if (a[0] && 'ip'.startsWith(a[0]) && is(1, 'route')) {
      const L = ['Codes: C - connected, S - static, L - local', ''];
      Object.entries(st.svis).forEach(([id, s]) => {
        if (s.ip && !s.shutdown) {
          const p = maskToPrefix(s.mask);
          L.push(`C    ${s.ip.split('.').slice(0, 3).join('.')}.0/${p} is directly connected, Vlan${id}`);
        }
      });
      st.routes.forEach(r => L.push(`S    ${r.net} [1/0] via ${r.nh}`));
      if (L.length === 2) L.push('% No routes');
      return L;
    }
    if (a[0] && 'ip'.startsWith(a[0]) && is(1, 'dhcp') && is(2, 'snooping')) {
      if (!st.dhcpSnoop.enabled) return [D('Switch DHCP snooping is disabled')];
      const L = ['Switch DHCP snooping is enabled',
        `DHCP snooping is configured on following VLANs:`,
        `${st.dhcpSnoop.vlans || 'none'}`, '',
        `Insertion of option 82 is ${st.dhcpSnoop.optionInsert ? 'enabled' : 'disabled'}`, '',
        'Interface                  Trusted    Rate limit (pps)',
        '------------------------   -------    ----------------'];
      ifList().filter(i => i.snoopTrust || i.snoopRate).forEach(i =>
        L.push(`${pad(i.name, 26)} ${pad(i.snoopTrust ? 'yes' : 'no', 10)} ${i.snoopRate ?? 'unlimited'}`));
      return L;
    }
    if (a[0] && 'ip'.startsWith(a[0]) && is(1, 'arp') && is(2, 'inspection')) {
      const L = [`Source Mac Validation      : Disabled`,
        `Destination Mac Validation : Disabled`, '',
        ' Vlan     Configuration    Operation', '----     -------------    ---------',
        `${lpad(st.arpInspect.vlans || '-', 5)}     ${pad(st.arpInspect.vlans ? 'Enabled' : 'Disabled', 16)} ${st.arpInspect.vlans ? 'Active' : 'Inactive'}`, ''];
      const tr = ifList().filter(i => i.arpTrust);
      if (tr.length) {
        L.push(' Interface        Trust State');
        tr.forEach(i => L.push(` ${pad(i.short, 16)} Trusted`));
      }
      return L;
    }
    if (is(0, 'interfaces', 'interface')) {
      if (is(1, 'status')) {
        const L = ['Port      Name               Status       Vlan       Duplex  Speed Type'];
        ifList().forEach(i => {
          const vl = i.routed ? 'routed' : i.swMode === 'trunk' ? 'trunk' : String(i.accessVlan);
          L.push(`${pad(i.short, 9)} ${pad(i.desc.slice(0, 18), 18)} ${pad(ifStatus(i), 12)} ${pad(vl, 10)} ${pad(isUp(i) ? 'a-full' : 'auto', 7)} ${pad(isUp(i) ? (i.name[0] === 'G' ? 'a-1000' : 'a-100') : 'auto', 5)} ${i.name[0] === 'G' ? '10/100/1000BaseTX' : '10/100BaseTX'}`);
        });
        return L;
      }
      if (is(1, 'trunk')) {
        const tr = ifList().filter(i => i.swMode === 'trunk');
        if (!tr.length) return [D('(ไม่มีพอร์ตที่เป็น trunk)')];
        const L = ['Port        Mode         Encapsulation  Status        Native vlan'];
        tr.forEach(i => L.push(`${pad(i.short, 11)} ${pad('on', 12)} ${pad(i.encap === 'dot1q' ? '802.1q' : 'n-802.1q', 14)} ${pad(isUp(i) ? 'trunking' : 'down', 13)} ${i.nativeVlan}`));
        L.push('', 'Port        Vlans allowed on trunk');
        tr.forEach(i => L.push(`${pad(i.short, 11)} ${allowedList(i)}`));
        return L;
      }
      if (a[1]) {
        const r = resolveIf([a.slice(1).join('')]);
        if (!r || r.missing) return [E('% Invalid interface')];
        if (r.vlan !== undefined) {
          const s = st.svis[r.vlan];
          if (!s) return [E('% Invalid interface')];
          return [
            `Vlan${r.vlan} is ${s.shutdown ? 'administratively down' : 'up'}, line protocol is ${s.shutdown ? 'down' : 'up'}`,
            `  Internet address is ${s.ip ? s.ip + '/' + maskToPrefix(s.mask) : 'not set'}`,
            '  MTU 1500 bytes, BW 1000000 Kbit/sec',
          ];
        }
        const i = r.iface;
        return [
          `${i.name} is ${i.shutdown ? 'administratively down' : i.link ? 'up' : 'down'}, line protocol is ${isUp(i) ? 'up (connected)' : 'down (notconnect)'}`,
          `  Hardware is Fast Ethernet, address is 001a.2b3c.00${lpad(st.order.indexOf(i.name) + 1, 2).replace(' ', '0')}`,
          `  Description: ${i.desc || '(none)'}`,
          '  MTU 1500 bytes, BW 100000 Kbit/sec, DLY 100 usec',
          `  ${isUp(i) ? 'Full-duplex, 100Mb/s' : 'Auto-duplex, Auto-speed'}, media type is 10/100BaseTX`,
          '  input flow-control is off, output flow-control is unsupported',
          '     1274 packets input, 108431 bytes',
          '     982 packets output, 91024 bytes',
        ];
      }
      return [E('% Incomplete command.')];
    }
    if (is(0, 'mac') && (is(1, 'address-table'))) {
      const L = [
        '          Mac Address Table',
        '-------------------------------------------',
        '',
        'Vlan    Mac Address       Type        Ports',
        '----    -----------       --------    -----',
      ];
      let n = 1;
      ifList().filter(isUp).forEach(i => {
        const vl = i.swMode === 'trunk' ? i.nativeVlan : i.accessVlan;
        L.push(`${lpad(vl, 4)}    00d0.58${lpad(n, 2).replace(' ', '0')}.${lpad(n * 7, 4).replace(/ /g, '0')}    DYNAMIC     ${i.short}`);
        n++;
      });
      L.push(`Total Mac Addresses for this criterion: ${n - 1}`);
      return L;
    }
    if (is(0, 'spanning-tree')) {
      const vl = a[1] === 'vlan' ? [+a[2]] : Object.keys(st.vlans).map(Number);
      const L = [];
      vl.forEach(v => {
        const pr = st.stpPriority[v] ?? 32768;
        L.push(`VLAN${lpad(v, 4).replace(/ /g, '0')}`);
        L.push(`  Spanning tree enabled protocol ${st.stpMode === 'rapid-pvst' ? 'rstp' : 'ieee'}`);
        L.push(`  Root ID    Priority    ${pr + v}`);
        L.push('             Address     0001.4278.9A01');
        L.push(pr <= 4096 ? '             This bridge is the root' : '             Cost        19');
        L.push('');
        L.push(`  Bridge ID  Priority    ${pr + v}  (priority ${pr} sys-id-ext ${v})`);
        L.push('             Address     001A.2B3C.0001');
        L.push('');
        L.push('Interface        Role Sts Cost      Prio.Nbr Type');
        L.push('---------------- ---- --- --------- -------- --------');
        ifList().filter(i => isUp(i) && (i.swMode === 'trunk' || i.accessVlan === v)).forEach(i => {
          L.push(`${pad(i.short, 16)} ${pad(pr <= 4096 ? 'Desg' : 'Root', 4)} FWD ${pad('19', 9)} ${pad('128.' + (st.order.indexOf(i.name) + 1), 8)} P2p${i.portfast ? ' Edge' : ''}`);
        });
        L.push('');
      });
      return L.length ? L : [E('% VLAN ไม่มีอยู่')];
    }
    if (is(0, 'port-security')) {
      const L = ['Secure Port  MaxSecureAddr  CurrentAddr  SecurityViolation  Security Action',
        '                (Count)       (Count)          (Count)'];
      const ps = ifList().filter(i => i.psec);
      if (!ps.length) return [D('(ยังไม่ได้เปิด port-security ที่พอร์ตใด)')];
      ps.forEach(i => L.push(`${pad(i.short, 12)} ${lpad(i.psec.max, 13)} ${lpad(i.psec.macs.length, 13)} ${lpad(0, 18)}  ${i.psec.violation}`));
      return L;
    }
    if (is(0, 'cdp')) {
      const L = ['Capability Codes: R - Router, T - Trans Bridge, S - Switch, H - Host', '',
        'Device ID    Local Intrfce   Holdtme   Capability  Platform   Port ID'];
      const ent = Object.entries(st.neighbors);
      if (!ent.length) return [...L, D('(ไม่มี neighbor ใน lab นี้)')];
      ent.forEach(([p, n]) => L.push(`${pad(n.name, 12)} ${pad(p, 15)} ${lpad(150, 7)}   ${pad(n.cap || 'S I', 11)} ${pad(n.platform || 'WS-C2960', 10)} ${n.port || 'Fas 0/1'}`));
      return L;
    }
    if (is(0, 'etherchannel')) {
      const groups = {};
      ifList().filter(i => i.channel).forEach(i => {
        (groups[i.channel.group] ||= { mode: i.channel.mode, ports: [] }).ports.push(i.short);
      });
      const keys = Object.keys(groups);
      if (!keys.length) return [D('(ยังไม่มี EtherChannel)')];
      const L = ['Flags:  D - down  P - bundled in port-channel', '        S - Layer2   U - in use', '',
        'Group  Port-channel  Protocol    Ports', '------+-------------+-----------+----------------'];
      keys.forEach(g => {
        const p = groups[g];
        const proto = ['active', 'passive'].includes(p.mode) ? 'LACP' : ['desirable', 'auto'].includes(p.mode) ? 'PAgP' : '-';
        L.push(`${lpad(g, 5)}  ${pad('Po' + g + '(SU)', 13)} ${pad(proto, 11)} ${p.ports.map(x => x + '(P)').join(' ')}`);
      });
      return L;
    }
    if (is(0, 'monitor')) {
      const ids = Object.keys(st.spanSessions);
      if (!ids.length) return [D('(ยังไม่มี SPAN session)')];
      const L = [];
      ids.forEach(id => {
        const s = st.spanSessions[id];
        L.push(`Session ${id}`, '---------', 'Type                   : Local Session',
          `Source Ports           :`, `    ${s.dir === 'rx' ? 'RX Only' : s.dir === 'tx' ? 'TX Only' : 'Both'}          : ${s.src.join(',') || '(none)'}`,
          `Destination Ports      : ${s.dst.join(',') || '(none)'}`, '');
      });
      return L;
    }
    if (is(0, 'vtp')) return [
      'VTP Version capable             : 1 to 3',
      `VTP version running             : ${st.vtp.version}`,
      `VTP Domain Name                 : ${st.vtp.domain || ''}`,
      'VTP Pruning Mode                : Disabled',
      `VTP Operating Mode              : ${st.vtp.mode.charAt(0).toUpperCase() + st.vtp.mode.slice(1)}`,
      `Maximum VLANs supported locally : 255`,
      `Number of existing VLANs        : ${Object.keys(st.vlans).length + 4}`,
      'Configuration Revision          : 0',
    ];
    if (is(0, 'standby')) {
      const rows = [];
      Object.entries(st.svis).forEach(([id, s]) => {
        Object.entries(s.standby || {}).forEach(([g, grp]) => rows.push({ id, g, grp, s }));
      });
      if (!rows.length) return [D('(ยังไม่ได้ตั้ง HSRP)')];
      if (is(1, 'brief')) {
        const L = ['                     P indicates configured to preempt.',
          '                     |',
          'Interface   Grp  Pri P State   Active          Standby         Virtual IP'];
        rows.forEach(({ id, g, grp }) =>
          L.push(`${pad('Vl' + id, 11)} ${pad(g, 4)} ${pad(grp.priority, 3)} ${grp.preempt ? 'P' : ' '} ${pad(grp.priority >= 100 ? 'Active' : 'Standby', 7)} ${pad('local', 15)} ${pad('unknown', 15)} ${grp.ip || 'unknown'}`));
        return L;
      }
      const L = [];
      rows.forEach(({ id, g, grp }) => {
        L.push(`Vlan${id} - Group ${g}`,
          `  State is ${grp.priority >= 100 ? 'Active' : 'Standby'}`,
          `  Virtual IP address is ${grp.ip || 'unknown'}`,
          `  Priority ${grp.priority} (configured ${grp.priority})`,
          `  Preemption ${grp.preempt ? 'enabled' : 'disabled'}`,
          grp.track ? `  Tracking ${grp.track}` : '  No tracking configured', '');
      });
      return L;
    }
    if (is(0, 'logging')) {
      const L = ['Syslog logging: enabled', '    Console logging: level debugging',
        '    Buffer logging: level debugging, 42 messages logged', ''];
      if (st.loggingHosts.length) st.loggingHosts.forEach(h => L.push(`    Logging to ${h}  (udp port 514, audit disabled)`));
      else L.push(D('    (ยังไม่ได้ตั้ง logging host)'));
      return L;
    }
    if (is(0, 'storm-control')) {
      const sc = ifList().filter(i => i.stormControl && Object.keys(i.stormControl).length);
      if (!sc.length) return [D('(ยังไม่ได้ตั้ง storm-control)')];
      const L = ['Interface  Filter State   Upper        Lower        Current',
        '---------  -------------  -----------  -----------  ----------'];
      sc.forEach(i => Object.entries(i.stormControl).forEach(([k, v]) =>
        L.push(`${pad(i.short, 10)} ${pad('Forwarding', 14)} ${pad(v + '%', 12)} ${pad(v + '%', 12)} 0.00%   (${k})`)));
      return L;
    }
    if (is(0, 'errdisable')) return [
      'ErrDisable Reason            Timer Status',
      '-----------------            --------------',
      ...['bpduguard', 'psecure-violation', 'link-flap', 'udld'].map(c =>
        `${pad(c, 29)}${st.errdisableRecovery.causes.includes(c) ? 'Enabled' : 'Disabled'}`),
      '', `Timer interval: ${st.errdisableRecovery.interval} seconds`,
    ];
    if (is(0, 'power')) {
      const L = ['Interface Admin  Oper       Power   Device              Class Max',
        '                            (Watts)', '--------- ------ ---------- ------- ------------------- ----- ----'];
      ifList().filter(i => i.poe).forEach(i =>
        L.push(`${pad(i.short, 9)} ${pad(i.poe, 6)} ${pad(i.poe === 'never' ? 'off' : 'on', 10)} ${pad(i.poe === 'never' ? '0.0' : '15.4', 7)} ${pad('IP Phone/AP', 19)} ${pad('3', 5)} 30.0`));
      return L.length > 3 ? L : [D('(ยังไม่ได้ตั้ง power inline ที่พอร์ตใด)')];
    }
    if (is(0, 'dot1x')) return st.dot1x
      ? ['Sysauthcontrol                 Enabled', 'Dot1x Protocol Version         3', '',
      ...ifList().filter(i => i.dot1x).map(i => `Dot1x Info for ${i.name}  — PAE: AUTHENTICATOR, PortControl: AUTO`)]
      : [D('(ยังไม่ได้เปิด dot1x system-auth-control)')];
    if (is(0, 'users')) return ['    Line       User       Host(s)              Idle', '*  0 con 0                idle                 00:00:00'];
    if (is(0, 'flash:', 'flash')) return ['Directory of flash:/', '', '    1  -rw-    11607161   c2960-lanbasek9-mz.152-4.E7.bin',
      '    2  -rw-        2114   config.text', '', '64016384 bytes total (52407109 bytes free)'];
    if (is(0, 'arp')) {
      const L = ['Protocol  Address          Age (min)  Hardware Addr   Type   Interface'];
      Object.entries(st.hosts).forEach(([ip], n) => L.push(`Internet  ${pad(ip, 16)} ${lpad(4, 9)}  00d0.58aa.00${lpad(n + 1, 2).replace(' ', '0')}  ARPA   Vlan1`));
      return L.length > 1 ? L : [D('(ARP table ว่าง)')];
    }
    return [E(`% Invalid input detected at '^' marker.`)];
  }

  // ---------- ping ----------
  function doPing(target) {
    if (!target) return [E('% Incomplete command.')];
    const local = Object.values(st.svis).find(s => s.ip && !s.shutdown);
    const known = st.hosts[target] !== undefined;
    let reach = known;
    if (!reach && local && local.ip) {
      const p = maskToPrefix(local.mask) || 24;
      const net = a => a.split('.').slice(0, Math.ceil(p / 8)).join('.');
      reach = net(local.ip) === net(target) && Object.keys(st.hosts).length === 0 ? false : reach;
    }
    const head = [`Type escape sequence to abort.`,
      `Sending 5, 100-byte ICMP Echos to ${target}, timeout is 2 seconds:`];
    if (reach) return [...head, OK('!!!!!'), 'Success rate is 100 percent (5/5), round-trip min/avg/max = 1/2/8 ms'];
    return [...head, E('.....'), 'Success rate is 0 percent (0/5)'];
  }

  // ---------- config mode ----------
  function cfgGlobal(t, raw) {
    const a = t.map(x => x.toLowerCase());
    const no = 'no'.startsWith(a[0]) && a[0].length >= 2 && a[0] === 'no';
    const c = no ? a.slice(1) : a;
    const rawArgs = raw.trim().split(/\s+/).slice(no ? 1 : 0);
    const w = (i, full) => full.startsWith(c[i] || '\u0000');

    if (!c.length) return [];

    if (w(0, 'hostname')) {
      if (no) { st.hostname = 'Switch'; return []; }
      if (!c[1]) return [E('% Incomplete command.')];
      st.hostname = rawArgs[1];
      return [];
    }
    if (w(0, 'enable')) {
      if (w(1, 'secret')) { st.enableSecret = rawArgs[2]; return rawArgs[2] ? [] : [E('% Incomplete command.')]; }
      if (w(1, 'password')) { st.enablePassword = rawArgs[2]; return rawArgs[2] ? [] : [E('% Incomplete command.')]; }
      return [E('% Invalid input')];
    }
    if (w(0, 'vlan')) {
      const id = +c[1];
      if (!id || id < 1 || id > 4094) return [E('% Invalid VLAN id')];
      if (no) { if (id === 1) return [E('% Default VLAN 1 may not be deleted.')]; delete st.vlans[id]; ifList().forEach(i => { if (i.accessVlan === id) i.accessVlan = 1; }); return []; }
      st.vlans[id] ||= { id, name: `VLAN${String(id).padStart(4, '0')}` };
      st.mode = 'config-vlan'; st.ctx = { vlan: id };
      return [];
    }
    if (w(0, 'interface')) {
      if (w(1, 'range')) {
        const list = expandRange(rawArgs.slice(2));
        if (!list) return [E('% Invalid interface range')];
        st.mode = 'config-if'; st.ctx = { list };
        return [];
      }
      const r = resolveIf(rawArgs.slice(1));
      if (!r) return [E('% Invalid input detected.')];
      if (r.missing) return [E(`% Invalid interface ${r.missing}`)];
      if (r.vlan !== undefined) {
        st.svis[r.vlan] ||= newSvi();
        if (!st.vlans[r.vlan]) st.vlans[r.vlan] = { id: r.vlan, name: `VLAN${String(r.vlan).padStart(4, '0')}` };
        st.mode = 'config-if'; st.ctx = { svi: r.vlan, list: [st.svis[r.vlan]] };
        return [];
      }
      st.mode = 'config-if'; st.ctx = { list: [r.iface] };
      return [];
    }
    if (w(0, 'ip')) {
      if (w(1, 'default-gateway')) { st.defaultGw = no ? null : rawArgs[2]; return []; }
      if (w(1, 'routing')) { st.ipRouting = !no; return []; }
      if (w(1, 'domain-lookup')) { st.domainLookup = !no; return []; }
      if (w(1, 'route')) {
        if (no) { st.routes = st.routes.filter(r => r.net !== rawArgs[2]); return []; }
        if (rawArgs.length < 5) return [E('% Incomplete command.')];
        st.routes.push({ net: rawArgs[2], mask: rawArgs[3], nh: rawArgs[4] });
        return [];
      }
      if (w(1, 'domain-name')) { st.domainName = no ? null : rawArgs[2]; return []; }
      if (w(1, 'name-server')) {
        const ips = rawArgs.slice(2).filter(isIp);
        if (!ips.length) return [E('% Incomplete command.')];
        if (no) st.nameServers = st.nameServers.filter(x => !ips.includes(x));
        else ips.forEach(x => { if (!st.nameServers.includes(x)) st.nameServers.push(x); });
        return [];
      }
      // ---- DHCP server (ไม่ใช่ snooping) ----
      if (w(1, 'dhcp') && w(2, 'pool')) {
        const name = rawArgs[3];
        if (!name) return [E('% Incomplete command.')];
        if (no) { delete st.dhcpPools[name]; return []; }
        st.dhcpPools[name] ||= { network: null, mask: null, router: null, dns: null, domain: null, lease: '1 0 0' };
        st.mode = 'config-dhcp'; st.ctx = { pool: name };
        return [];
      }
      if (w(1, 'dhcp') && w(2, 'excluded-address')) {
        const from = rawArgs[3], to = rawArgs[4] || rawArgs[3];
        if (!isIp(from)) return [E('% Incomplete command.')];
        if (no) st.dhcpExcluded = st.dhcpExcluded.filter(x => x.from !== from);
        else st.dhcpExcluded.push({ from, to });
        return [];
      }
      // ---- NAT ----
      if (w(1, 'nat') && w(2, 'inside') && w(3, 'source')) {
        if (w(4, 'static')) {
          const local = rawArgs[5], global_ = rawArgs[6];
          if (!isIp(local) || !isIp(global_)) return [E('% Incomplete command.')];
          if (no) st.natRules = st.natRules.filter(r => r.local !== local);
          else st.natRules.push({ kind: 'static', local, global: global_ });
          return [];
        }
        if (w(4, 'list')) {
          const list = rawArgs[5];
          const ii = rawArgs.findIndex(x => /^int/i.test(x));
          const r = ii > 0 ? resolveIf(rawArgs.slice(ii + 1)) : null;
          const overload = rawArgs.some(x => /^overl/i.test(x));
          if (!list) return [E('% Incomplete command.')];
          if (no) { st.natRules = st.natRules.filter(x => x.list !== list); return []; }
          st.natRules.push({ kind: overload ? 'overload' : 'pool', list, iface: r && r.iface ? r.iface.short : (rawArgs[ii + 1] || '') });
          return [];
        }
        return [E('% Invalid input detected.')];
      }
      // ---- ACL แบบตั้งชื่อ ----
      if (w(1, 'access-list')) {
        const kind = 'extended'.startsWith(c[2] || ' ') ? 'extended' : 'standard';
        const name = rawArgs[3];
        if (!name) return [E('% Incomplete command.')];
        if (no) { delete st.acls[name]; return []; }
        st.acls[name] ||= { kind, rules: [] };
        st.mode = 'config-acl'; st.ctx = { acl: name, kind };
        return [];
      }
      if (w(1, 'access-group')) return [E('% ใช้ ip access-group ที่ interface ไม่ใช่ global config')];
      if (w(1, 'ssh')) { if (w(2, 'version')) st.sshVersion = rawArgs[3]; return []; }
      if (w(1, 'dhcp') && w(2, 'snooping')) {
        if (w(3, 'vlan')) {
          st.dhcpSnoop.vlans = no ? '' : rawArgs[4];
          st.dhcpSnoop.enabled = st.dhcpSnoop.enabled || !no;
          return [];
        }
        if (w(3, 'information') && w(4, 'option')) { st.dhcpSnoop.optionInsert = !no; return []; }
        st.dhcpSnoop.enabled = !no;
        return [];
      }
      if (w(1, 'arp') && w(2, 'inspection')) {
        if (w(3, 'vlan')) { st.arpInspect.vlans = no ? '' : rawArgs[4]; return []; }
        return [];
      }
      return [E('% Invalid input detected.')];
    }
    if (w(0, 'monitor') && w(1, 'session')) {
      const id = +rawArgs[2];
      if (!id) return [E('% Incomplete command.')];
      if (no) { delete st.spanSessions[id]; return []; }
      const sess = (st.spanSessions[id] ||= { src: [], dst: [], dir: 'both' });
      const kind = (c[3] || '');
      const ii = rawArgs.findIndex((x, k) => k > 3 && /^int/i.test(x));
      const ifTok = rawArgs.slice(ii + 1).filter(x => !/^(both|rx|tx)$/i.test(x));
      const r = ii > 0 ? resolveIf(ifTok) : null;
      if ('source'.startsWith(kind)) {
        if (!r || !r.iface) return [E('% Invalid interface')];
        sess.src.push(r.iface.short);
        const d = rawArgs.find(x => /^(both|rx|tx)$/i.test(x));
        if (d) sess.dir = d.toLowerCase();
        return [];
      }
      if ('destination'.startsWith(kind)) {
        if (!r || !r.iface) return [E('% Invalid interface')];
        sess.dst.push(r.iface.short);
        return [];
      }
      return [E('% Invalid input detected.')];
    }
    // ---- ACL แบบเลข: access-list 10 permit 192.168.1.0 0.0.0.255 ----
    if (w(0, 'access-list')) {
      const num = rawArgs[1];
      if (!num || !/^\d+$/.test(num)) return [E('% Incomplete command.')];
      if (no) { delete st.acls[num]; return []; }
      const kind = +num >= 100 ? 'extended' : 'standard';
      const acl = (st.acls[num] ||= { kind, rules: [] });
      const action = (rawArgs[2] || '').toLowerCase();
      if (!['permit', 'deny', 'remark'].includes(action)) return [E('% Invalid input detected.')];
      if (action === 'remark') { acl.remark = rawArgs.slice(3).join(' '); return []; }
      acl.rules.push(parseAclRule(kind, action, rawArgs.slice(3)));
      return [];
    }
    // ---- OSPF ----
    if (w(0, 'router')) {
      if (!w(1, 'ospf')) return [E('% เดโมนี้รองรับเฉพาะ router ospf')];
      const pid = +rawArgs[2];
      if (!pid) return [E('% Incomplete command.')];
      if (no) { st.ospf = null; return []; }
      st.ospf ||= { pid, routerId: null, networks: [], passive: [] };
      st.ospf.pid = pid;
      st.mode = 'config-router'; st.ctx = { ospf: true };
      return [];
    }
    if (w(0, 'logging')) {
      const ip = w(1, 'host') ? rawArgs[2] : rawArgs[1];
      if (!ip || !isIp(ip)) return w(1, 'host') ? [E('% Incomplete command.')] : [];
      if (no) st.loggingHosts = st.loggingHosts.filter(x => x !== ip);
      else if (!st.loggingHosts.includes(ip)) st.loggingHosts.push(ip);
      return [];
    }
    if (w(0, 'snmp-server')) {
      if (w(1, 'community')) {
        const name = rawArgs[2];
        if (!name) return [E('% Incomplete command.')];
        st.snmp.push({ name, mode: (rawArgs[3] || 'RO').toUpperCase() });
        return [];
      }
      return [];
    }
    if (w(0, 'ntp')) {
      if (w(1, 'server') && rawArgs[2]) { st.ntpServers.push(rawArgs[2]); return []; }
      return [];
    }
    if (w(0, 'vtp')) {
      if (w(1, 'mode')) { st.vtp.mode = (c[2] || 'server'); return []; }
      if (w(1, 'domain')) { st.vtp.domain = rawArgs[2]; return []; }
      if (w(1, 'version')) { st.vtp.version = +rawArgs[2] || 2; return []; }
      return [E('% Invalid input detected.')];
    }
    if (w(0, 'errdisable') && w(1, 'recovery')) {
      if (w(2, 'cause')) {
        const cz = rawArgs[3];
        if (no) st.errdisableRecovery.causes = st.errdisableRecovery.causes.filter(x => x !== cz);
        else if (cz && !st.errdisableRecovery.causes.includes(cz)) st.errdisableRecovery.causes.push(cz);
        return [];
      }
      if (w(2, 'interval')) { st.errdisableRecovery.interval = +rawArgs[3] || 300; return []; }
      return [E('% Invalid input detected.')];
    }
    if (w(0, 'aaa')) { if (w(1, 'new-model')) st.aaa = !no; return []; }
    if (w(0, 'dot1x') && w(1, 'system-auth-control')) { st.dot1x = !no; return []; }
    if (w(0, 'radius')) {
      if (w(1, 'server') && rawArgs[2]) { st.radius.push({ name: rawArgs[2] }); return []; }
      return [];
    }
    if (w(0, 'crypto')) { st.rsaKey = true; return [D('% Generating 2048 bit RSA keys, keys will be non-exportable...[OK]')]; }
    if (w(0, 'udld')) return [];
    if (w(0, 'username')) {
      const name = rawArgs[1];
      if (!name) return [E('% Incomplete command.')];
      if (no) { delete st.users[name]; return []; }
      const pi = rawArgs.findIndex(x => x.toLowerCase() === 'privilege');
      const si = rawArgs.findIndex(x => /^(secret|password)$/i.test(x));
      if (si < 0) return [E('% Incomplete command.')];
      st.users[name] = { name, priv: pi > 0 ? rawArgs[pi + 1] : '1', secret: /secret/i.test(rawArgs[si]), pass: rawArgs[si + 1] || '' };
      return [];
    }
    if (w(0, 'spanning-tree')) {
      if (w(1, 'mode')) { st.stpMode = c[2] || 'pvst'; return []; }
      if (w(1, 'vlan') && w(3, 'priority')) {
        const pr = +rawArgs[4];
        if (pr % 4096 !== 0) return [E('% Bridge Priority must be in increments of 4096.')];
        rawArgs[2].split(',').forEach(v => { st.stpPriority[+v] = pr; });
        return [];
      }
      if (w(1, 'vlan') && w(3, 'root')) {
        rawArgs[2].split(',').forEach(v => { st.stpPriority[+v] = rawArgs[4] === 'secondary' ? 28672 : 24576; });
        return [];
      }
      if (w(1, 'portfast')) return [];
      return [E('% Invalid input detected.')];
    }
    if (w(0, 'service') && w(1, 'password-encryption')) { st.pwEncrypt = !no; return []; }
    if (w(0, 'banner')) {
      const m = raw.match(/banner\s+motd\s+(\S)(.*)\1/i);
      if (m) { st.banner = m[2]; return []; }
      return [E('% ใช้รูปแบบ: banner motd #ข้อความ#')];
    }
    if (w(0, 'line')) {
      const key = c[1] && 'console'.startsWith(c[1]) ? `console ${rawArgs[2] ?? 0}` : `vty ${rawArgs[2] ?? 0} ${rawArgs[3] ?? 4}`;
      const k = key.startsWith('console') ? 'console 0' : 'vty 0 4';
      st.lines[k] ||= {};
      st.mode = 'config-line'; st.ctx = { line: k };
      return [];
    }
    if (w(0, 'do')) return exec(rawArgs.slice(1).join(' '), true);
    if (w(0, 'exit')) { st.mode = 'priv'; st.ctx = null; return []; }
    if (w(0, 'end')) { st.mode = 'priv'; st.ctx = null; return []; }
    return [E(`% Invalid input detected at '^' marker.`)];
  }

  function cfgIface(t, raw) {
    const a = t.map(x => x.toLowerCase());
    const no = a[0] === 'no';
    const c = no ? a.slice(1) : a;
    const rawArgs = raw.trim().split(/\s+/).slice(no ? 1 : 0);
    const w = (i, full) => full.startsWith(c[i] || '\u0000');
    const targets = st.ctx.list;
    const out = [];

    if (!c.length) return [];
    if (w(0, 'exit')) { st.mode = 'config'; st.ctx = null; return []; }
    if (w(0, 'end')) { st.mode = 'priv'; st.ctx = null; return []; }
    if (w(0, 'do')) return exec(rawArgs.slice(1).join(' '), true);

    const each = fn => { targets.forEach(fn); return out; };

    if (w(0, 'description')) return each(i => { i.desc = no ? '' : rawArgs.slice(1).join(' '); });
    if (w(0, 'shutdown')) return each(i => { i.shutdown = !no; });

    if (w(0, 'ip') && w(1, 'ospf')) {
      if (!st.ospf) return [E('% ต้องสั่ง router ospf <pid> ก่อน')];
      const ai = rawArgs.findIndex(x => /^area$/i.test(x));
      const area = ai > 0 ? rawArgs[ai + 1] : '0';
      return each(i => { i.ospfArea = no ? null : area; });
    }
    if (w(0, 'ip') && w(1, 'access-group')) {
      const name = rawArgs[2], dir = (rawArgs[3] || 'in').toLowerCase();
      if (!name) return [E('% Incomplete command.')];
      if (!st.acls[name]) return [E(`% ACL ${name} does not exist`)];
      return each(i => {
        if (dir === 'out') i.aclOut = no ? null : name;
        else i.aclIn = no ? null : name;
      });
    }
    if (w(0, 'ip') && w(1, 'nat')) {
      const side = (c[2] || '');
      if ('inside'.startsWith(side) && side) {
        return each(i => { st.natInside = st.natInside.filter(x => x !== i.short); if (!no) st.natInside.push(i.short); });
      }
      if ('outside'.startsWith(side) && side) {
        return each(i => { st.natOutside = st.natOutside.filter(x => x !== i.short); if (!no) st.natOutside.push(i.short); });
      }
      return [E('% Invalid input detected.')];
    }
    if (st.ctx.svi !== undefined) {
      if (w(0, 'ip') && w(1, 'address')) {
        if (no) return each(i => { i.ip = null; i.mask = null; });
        const [ip, mask] = [rawArgs[2], rawArgs[3]];
        if (!isIp(ip) || !isIp(mask) || maskToPrefix(mask) === null) return [E('% Invalid IP address or subnet mask')];
        return each(i => { i.ip = ip; i.mask = mask; });
      }
      if (w(0, 'ip') && w(1, 'helper-address')) {
        const hip = rawArgs[2];
        if (!hip) return [E('% Incomplete command.')];
        return each(i => {
          if (no) i.helpers = i.helpers.filter(x => x !== hip);
          else if (!i.helpers.includes(hip)) i.helpers.push(hip);
        });
      }
      if (w(0, 'standby')) {
        if (w(1, 'version')) return each(i => { i.standbyVersion = +rawArgs[2] || 1; });
        const g = +rawArgs[1];
        if (!Number.isFinite(g)) return [E('% Incomplete command.')];
        const sub = c[2] || '';
        return each(i => {
          const grp = (i.standby[g] ||= { ip: null, priority: 100, preempt: false, track: null });
          if ('ip'.startsWith(sub)) grp.ip = rawArgs[3];
          else if ('priority'.startsWith(sub)) grp.priority = +rawArgs[3];
          else if ('preempt'.startsWith(sub)) grp.preempt = !no;
          else if ('track'.startsWith(sub)) grp.track = rawArgs.slice(3).join(' ');
          else if ('timers'.startsWith(sub)) grp.timers = rawArgs.slice(3).join(' ');
          else if ('authentication'.startsWith(sub)) grp.auth = rawArgs.slice(3).join(' ');
        });
      }
      if (w(0, 'switchport')) return [E('% Invalid input — interface Vlan เป็น Layer 3 ไม่มีคำสั่ง switchport')];
      return cfgGlobal(t, raw);
    }

    if (w(0, 'switchport')) {
      // "switchport" = ทำให้เป็น L2 , "no switchport" = ทำให้เป็น routed port
      if (!c[1]) return each(i => { i.routed = !!no; i.swMode = no ? 'routed' : 'dynamic'; });
      if (w(1, 'mode')) {
        const m = c[2];
        if (!m) return [E('% Incomplete command.')];
        if ('access'.startsWith(m)) return each(i => { i.swMode = 'access'; });
        if ('trunk'.startsWith(m)) return each(i => {
          if (i.name.startsWith('Fast') && !i.encap) i.encap = 'dot1q';
          i.swMode = 'trunk';
        });
        if ('dynamic'.startsWith(m)) return each(i => { i.swMode = 'dynamic'; });
        return [E('% Invalid switchport mode')];
      }
      if (w(1, 'access') && w(2, 'vlan')) {
        const id = +rawArgs[3];
        if (!id || id > 4094) return [E('% Invalid VLAN id')];
        if (!st.vlans[id]) {
          st.vlans[id] = { id, name: `VLAN${String(id).padStart(4, '0')}` };
          out.push(D(`% Access VLAN ${id} ยังไม่มีอยู่ — สร้างให้อัตโนมัติ`));
        }
        return each(i => { i.accessVlan = id; });
      }
      if (w(1, 'voice') && w(2, 'vlan')) return each(i => { i.voiceVlan = +rawArgs[3]; });
      if (w(1, 'nonegotiate')) return each(i => { i.nonegotiate = !no; });
      if (w(1, 'trunk')) {
        if (w(2, 'encapsulation')) return each(i => { i.encap = c[3]; });
        if (w(2, 'native') && w(3, 'vlan')) return each(i => { i.nativeVlan = +rawArgs[4]; });
        if (w(2, 'allowed') && w(3, 'vlan')) {
          const v = rawArgs[4];
          if (!v) return [E('% Incomplete command.')];
          if (['add', 'remove'].includes(v.toLowerCase())) {
            return each(i => {
              const cur = new Set((i.allowed || '').split(',').filter(Boolean));
              rawArgs[5].split(',').forEach(x => v.toLowerCase() === 'add' ? cur.add(x) : cur.delete(x));
              i.allowed = [...cur].join(',');
            });
          }
          return each(i => { i.allowed = no ? null : v; });
        }
        return [E('% Invalid input detected.')];
      }
      if (w(1, 'port-security')) {
        if (!c[2]) return each(i => {
          if (i.swMode !== 'access') out.push(E(`% Command rejected: ${i.name} is not an access port.`));
          else i.psec ||= { max: 1, violation: 'shutdown', sticky: false, macs: [] };
        });
        if (w(2, 'maximum')) return each(i => { if (i.psec) i.psec.max = +rawArgs[3]; });
        if (w(2, 'violation')) return each(i => { if (i.psec) i.psec.violation = c[3]; });
        if (w(2, 'mac-address') && w(3, 'sticky')) return each(i => { if (i.psec) i.psec.sticky = true; });
        return [E('% Invalid input detected.')];
      }
      if (no) return each(i => { i.routed = true; i.swMode = 'routed'; });
      return [E('% Invalid input detected.')];
    }
    if (w(0, 'ip') && w(1, 'address')) {
      return each(i => {
        if (!i.routed) out.push(E(`% IP addresses ตั้งบน switchport ไม่ได้ — ใช้ 'no switchport' ก่อน`));
        else { i.ip = rawArgs[2]; i.mask = rawArgs[3]; }
      });
    }
    if (w(0, 'ip')) {
      if (w(1, 'dhcp') && w(2, 'snooping')) {
        if (w(3, 'trust')) return each(i => { i.snoopTrust = !no; });
        if (w(3, 'limit') && w(4, 'rate')) return each(i => { i.snoopRate = no ? null : +rawArgs[5]; });
        return [E('% Invalid input detected.')];
      }
      if (w(1, 'arp') && w(2, 'inspection') && w(3, 'trust')) return each(i => { i.arpTrust = !no; });
      if (w(1, 'helper-address')) return [E('% ip helper-address ตั้งได้ที่ interface Vlan (SVI) เท่านั้น')];
    }
    if (w(0, 'storm-control')) {
      const kind = c[1] || 'broadcast';
      const lvl = rawArgs[3];
      return each(i => {
        i.stormControl ||= {};
        if (no) delete i.stormControl[kind];
        else i.stormControl[kind] = lvl;
      });
    }
    if (w(0, 'udld')) return each(i => { i.udld = no ? null : (c[2] || 'enable'); });
    if (w(0, 'authentication') || w(0, 'dot1x') || w(0, 'mab')) return each(i => { i.dot1x = !no; });
    if (w(0, 'power') && w(1, 'inline')) return each(i => { i.poe = no ? 'never' : (c[2] || 'auto'); });
    if (w(0, 'speed')) return each(i => { i.speed = no ? 'auto' : c[1]; });
    if (w(0, 'duplex')) return each(i => { i.duplex = no ? 'auto' : c[1]; });
    if (w(0, 'channel-group')) {
      const g = +rawArgs[1];
      const mi = rawArgs.findIndex(x => x.toLowerCase() === 'mode');
      if (!g || mi < 0) return [E('% Incomplete command.')];
      const poName = `Port-channel${g}`;
      if (!st.ifaces[poName]) {
        // ของจริง Port-channel รับค่ามาจากพอร์ตสมาชิกตอนที่ถูกรวม ไม่ได้เกิดมาเป็น trunk เสมอ
        // (เดิม hard-code เป็น trunk ทำให้ task "ตั้ง Po เป็น trunk" ผ่านเองโดยไม่ต้องพิมพ์)
        const src = targets[0] || {};
        st.ifaces[poName] = newIface(poName, `Po${g}`, {
          link: true,
          swMode: src.swMode || 'dynamic',
          accessVlan: src.accessVlan ?? 1,
          nativeVlan: src.nativeVlan ?? 1,
          allowed: src.allowed ?? null,
        });
        st.order.push(poName);
      }
      return each(i => { i.channel = { group: g, mode: rawArgs[mi + 1].toLowerCase() }; });
    }
    if (w(0, 'spanning-tree')) {
      if (w(1, 'portfast')) return each(i => { i.portfast = !no; });
      if (w(1, 'bpduguard')) return each(i => { i.bpduguard = !no; });
      if (w(1, 'guard')) return each(i => { i.guard = no ? null : c[2]; });
      if (w(1, 'cost')) return each(i => { i.stpCost = +rawArgs[2]; });
      if (w(1, 'port-priority')) return each(i => { i.stpPrio = +rawArgs[2]; });
      if (w(1, 'link-type')) return [];
      return cfgGlobal(t, raw);
    }
    // IOS ยอมให้พิมพ์คำสั่งระดับ global ได้เลยจาก config-if (เช่น interface อีกพอร์ต, vlan, hostname)
    return cfgGlobal(t, raw);
  }

  function cfgVlan(t, raw) {
    const a = t.map(x => x.toLowerCase());
    const no = a[0] === 'no';
    const c = no ? a.slice(1) : a;
    const rawArgs = raw.trim().split(/\s+/).slice(no ? 1 : 0);
    const v = st.vlans[st.ctx.vlan];
    if (!c.length) return [];
    if ('name'.startsWith(c[0])) {
      if (!rawArgs[1]) return [E('% Incomplete command.')];
      v.name = rawArgs[1]; return [];
    }
    if ('exit'.startsWith(c[0])) { st.mode = 'config'; st.ctx = null; return []; }
    if ('end'.startsWith(c[0])) { st.mode = 'priv'; st.ctx = null; return []; }
    if ('do'.startsWith(c[0])) return exec(rawArgs.slice(1).join(' '), true);
    return cfgGlobal(t, raw);
  }

  function cfgLine(t, raw) {
    const a = t.map(x => x.toLowerCase());
    const no = a[0] === 'no';
    const c = no ? a.slice(1) : a;
    const rawArgs = raw.trim().split(/\s+/).slice(no ? 1 : 0);
    const l = st.lines[st.ctx.line];
    const w = (i, full) => full.startsWith(c[i] || '\u0000');
    if (!c.length) return [];
    if (w(0, 'password')) { l.password = no ? null : rawArgs[1]; return []; }
    if (w(0, 'login')) { l.login = !no; l.loginLocal = c[1] === 'local'; return []; }
    if (w(0, 'logging') && w(1, 'synchronous')) { l.logsync = !no; return []; }
    if (w(0, 'transport') && w(1, 'input')) { l.transport = rawArgs.slice(2).join(' '); return []; }
    if (w(0, 'exec-timeout')) { l.exectimeout = rawArgs.slice(1).join(' '); return []; }
    if (w(0, 'exit')) { st.mode = 'config'; st.ctx = null; return []; }
    if (w(0, 'end')) { st.mode = 'priv'; st.ctx = null; return []; }
    if (w(0, 'do')) return exec(rawArgs.slice(1).join(' '), true);
    return cfgGlobal(t, raw);
  }

  /** ตารางอย่างง่ายให้หน้าตาใกล้ output ของ IOS */
  function table(cols, data) {
    const wd = cols.map((c, i) => Math.max(String(c).length, ...data.map(r => String(r[i] ?? '').length)) + 2);
    const line = r => r.map((x, i) => pad(String(x ?? ''), wd[i])).join('').replace(/\s+$/, '');
    return [line(cols), ...data.map(line)];
  }

  /** interface ที่มี IP และถูก network ของ OSPF ครอบคลุม */
  function ospfIfaces() {
    if (!st.ospf) return [];
    // SVI ไม่มีฟิลด์ short/name ของตัวเอง — ใส่ชื่อให้ตอนแสดงผล
    const svis = Object.entries(st.svis).map(([id, v]) => Object.assign(v, { short: v.short || `Vlan${id}` }));
    const all = [...svis, ...st.order.map(k => st.ifaces[k])].filter(i => i && i.ip);
    return all.filter(i => i.ospfArea || st.ospf.networks.some(n => sameWild(i.ip, n.net, n.wc)));
  }
  /** IP อยู่ในช่วงของ network+wildcard หรือไม่ */
  function sameWild(ip, net, wc) {
    const a = String(ip).split('.').map(Number), b = String(net).split('.').map(Number), m = String(wc).split('.').map(Number);
    if (a.length !== 4 || b.length !== 4 || m.length !== 4) return false;
    return a.every((x, i) => (x & ~m[i] & 255) === (b[i] & ~m[i] & 255));
  }
  const bestRouterId = () => {
    const ips = [...Object.values(st.svis), ...st.order.map(k => st.ifaces[k])].filter(i => i && i.ip).map(i => i.ip);
    return ips.sort().pop() || '0.0.0.0';
  };
  /** neighbor จำลอง — เกิดขึ้นเมื่อมี interface เข้าร่วม OSPF และพอร์ตมีสายต่ออยู่ */
  function ospfNeighbors() {
    return ospfIfaces().filter(i => i.link !== false && !st.ospf.passive.includes(i.short)).map((i, k) => ({
      id: `10.10.10.${k + 1}`, addr: i.ip.replace(/\.\d+$/, '.254'), iface: i.short,
    }));
  }

  /** แปลงหางคำสั่ง ACL ให้เป็นก้อนเดียวที่อ่านง่าย */
  function parseAclRule(kind, action, rest) {
    const r = { action, kind };
    let i = 0;
    if (kind === 'extended') { r.proto = (rest[i++] || 'ip').toLowerCase(); }
    const take = () => {
      const tok = (rest[i] || '').toLowerCase();
      if (tok === 'any') { i++; return { addr: 'any', wc: '' }; }
      if (tok === 'host') { i++; const a = rest[i++]; return { addr: a, wc: '0.0.0.0' }; }
      const a = rest[i++]; const wc = rest[i] && isIp(rest[i]) ? rest[i++] : '0.0.0.0';
      return { addr: a, wc };
    };
    r.src = take();
    if (kind === 'extended') {
      r.dst = take();
      const op = (rest[i] || '').toLowerCase();
      if (['eq', 'gt', 'lt', 'neq'].includes(op)) { r.op = op; r.port = rest[i + 1]; }
    }
    return r;
  }

  const aclLine = r => [r.action, r.kind === 'extended' ? r.proto : null,
    r.src.addr === 'any' ? 'any' : `${r.src.addr}${r.src.wc && r.src.wc !== '0.0.0.0' ? ' ' + r.src.wc : ''}`,
    r.dst ? (r.dst.addr === 'any' ? 'any' : `${r.dst.addr}${r.dst.wc && r.dst.wc !== '0.0.0.0' ? ' ' + r.dst.wc : ''}`) : null,
    r.op ? `${r.op} ${r.port}` : null].filter(Boolean).join(' ');

  // ---------- config-router (OSPF) ----------
  function cfgRouter(t, raw) {
    const a = t.map(x => x.toLowerCase());
    const no = a[0] === 'no';
    const c = no ? a.slice(1) : a;
    const rawArgs = raw.trim().split(/\s+/).slice(no ? 1 : 0);
    const w = (i, full) => full.startsWith(c[i] || ' ');
    if (!c.length) return [];
    const o = st.ospf;
    if (w(0, 'network')) {
      const net = rawArgs[1], wc = rawArgs[2];
      const ai = rawArgs.findIndex(x => /^area$/i.test(x));
      const area = ai > 0 ? rawArgs[ai + 1] : null;
      if (!isIp(net) || !isIp(wc) || area === null) return [E('% Incomplete command.')];
      if (no) o.networks = o.networks.filter(n => n.net !== net);
      else o.networks.push({ net, wc, area });
      return [];
    }
    if (w(0, 'router-id')) { o.routerId = no ? null : rawArgs[1]; return []; }
    if (w(0, 'passive-interface')) {
      const name = rawArgs.slice(1).join(' ');
      if (no) o.passive = o.passive.filter(x => x !== name);
      else o.passive.push(name);
      return [];
    }
    if (w(0, 'exit')) { st.mode = 'config'; st.ctx = null; return []; }
    if (w(0, 'end')) { st.mode = 'priv'; st.ctx = null; return []; }
    if (w(0, 'do')) return exec(rawArgs.slice(1).join(' '), true);
    return [E('% Invalid input detected.')];
  }

  // ---------- config-acl (named ACL) ----------
  function cfgAcl(t, raw) {
    const a = t.map(x => x.toLowerCase());
    const no = a[0] === 'no';
    const c = no ? a.slice(1) : a;
    const rawArgs = raw.trim().split(/\s+/).slice(no ? 1 : 0);
    const w = (i, full) => full.startsWith(c[i] || ' ');
    if (!c.length) return [];
    const acl = st.acls[st.ctx.acl];
    if (c[0] === 'permit' || c[0] === 'deny') {
      acl.rules.push(parseAclRule(acl.kind, c[0], rawArgs.slice(1)));
      return [];
    }
    if (w(0, 'remark')) { acl.remark = rawArgs.slice(1).join(' '); return []; }
    if (w(0, 'exit')) { st.mode = 'config'; st.ctx = null; return []; }
    if (w(0, 'end')) { st.mode = 'priv'; st.ctx = null; return []; }
    if (w(0, 'do')) return exec(rawArgs.slice(1).join(' '), true);
    return [E('% Invalid input detected.')];
  }

  // ---------- config-dhcp (DHCP pool) ----------
  function cfgDhcp(t, raw) {
    const a = t.map(x => x.toLowerCase());
    const no = a[0] === 'no';
    const c = no ? a.slice(1) : a;
    const rawArgs = raw.trim().split(/\s+/).slice(no ? 1 : 0);
    const w = (i, full) => full.startsWith(c[i] || ' ');
    if (!c.length) return [];
    const pool = st.dhcpPools[st.ctx.pool];
    if (w(0, 'network')) {
      if (!isIp(rawArgs[1])) return [E('% Incomplete command.')];
      pool.network = rawArgs[1]; pool.mask = rawArgs[2] || '255.255.255.0';
      return [];
    }
    if (w(0, 'default-router')) { pool.router = rawArgs[1]; return []; }
    if (w(0, 'dns-server')) { pool.dns = rawArgs.slice(1).join(' '); return []; }
    if (w(0, 'domain-name')) { pool.domain = rawArgs[1]; return []; }
    if (w(0, 'lease')) { pool.lease = rawArgs.slice(1).join(' '); return []; }
    if (w(0, 'exit')) { st.mode = 'config'; st.ctx = null; return []; }
    if (w(0, 'end')) { st.mode = 'priv'; st.ctx = null; return []; }
    if (w(0, 'do')) return exec(rawArgs.slice(1).join(' '), true);
    return [E('% Invalid input detected.')];
  }

  // ---------- main exec ----------
  function exec(raw, viaDo = false) {
    const line = raw.replace(/\t/g, ' ');
    const t = words(line);
    if (!t.length) return [];
    const a = t.map(x => x.toLowerCase());
    const w = (i, full) => full.startsWith(a[i] || '\u0000');

    if (a[0] === '?') return helpFor();

    // ---- config modes ----
    if (!viaDo) {
      if (st.mode === 'config') return cfgGlobal(t, line);
      if (st.mode === 'config-if') return cfgIface(t, line);
      if (st.mode === 'config-vlan') return cfgVlan(t, line);
      if (st.mode === 'config-line') return cfgLine(t, line);
      if (st.mode === 'config-router') return cfgRouter(t, line);
      if (st.mode === 'config-acl') return cfgAcl(t, line);
      if (st.mode === 'config-dhcp') return cfgDhcp(t, line);
    }

    // ---- user / priv ----
    if (w(0, 'enable') && a[0].length >= 2 && a[0] !== 'en0') {
      if (st.mode === 'user') {
        st.mode = 'priv'; st.enabled = true;
        return st.enableSecret ? [D('(lab นี้ข้ามการถามรหัสผ่าน)')] : [];
      }
      return [];
    }
    if (w(0, 'disable')) { st.mode = 'user'; return []; }
    if (w(0, 'exit') || w(0, 'logout')) {
      if (st.mode === 'priv') { st.mode = 'user'; return []; }
      return [D('(ออกจาก session — พิมพ์คำสั่งต่อได้เลย)')];
    }

    if (w(0, 'show') || (viaDo && w(0, 'sh'))) {
      if (st.mode === 'user' && !['version', 'clock'].some(x => x.startsWith(a[1] || '\u0000'))) {
        return [E('% Invalid input detected — ต้อง enable เข้าสู่ privileged mode ก่อน')];
      }
      return doShow(t.slice(1));
    }
    if (w(0, 'ping')) return doPing(t[1]);
    if (w(0, 'traceroute')) return t[1] ? ['Type escape sequence to abort.', `Tracing the route to ${t[1]}`, '  1   ' + t[1] + '   2 msec  1 msec  2 msec'] : [E('% Incomplete command.')];

    if (st.mode !== 'priv' && !viaDo) {
      return [E(`% Invalid input detected at '^' marker.  (คำสั่งนี้ต้องอยู่ใน privileged mode — พิมพ์ enable)`)];
    }

    if (w(0, 'configure')) {
      if (!a[1] || 'terminal'.startsWith(a[1])) {
        st.mode = 'config'; st.ctx = null;
        return ['Enter configuration commands, one per line.  End with CNTL/Z.'];
      }
      return [E('% Invalid input detected.')];
    }
    if (w(0, 'write')) { st.savedConfig = runningConfig(); return ['Building configuration...', OK('[OK]')]; }
    if (w(0, 'copy')) {
      if (/run/i.test(t[1] || '') && /start/i.test(t[2] || '')) {
        st.savedConfig = runningConfig();
        return ['Destination filename [startup-config]?', 'Building configuration...', OK('[OK]')];
      }
      return [E('% Invalid input detected.')];
    }
    if (w(0, 'erase')) { st.savedConfig = null; return ['Erasing the nvram filesystem...', OK('[OK]')]; }
    if (w(0, 'reload')) return [H('Proceed with reload? [confirm]  — (lab นี้ไม่ reboot จริง)')];
    if (w(0, 'clear')) return [];
    if (w(0, 'terminal')) return [];
    if (w(0, 'vlan') || w(0, 'interface') || w(0, 'hostname')) {
      return [E(`% Invalid input — คำสั่งนี้ต้องอยู่ใน global config mode (พิมพ์ configure terminal ก่อน)`)];
    }
    return [E(`% Invalid input detected at '^' marker.`)];
  }

  /**
   * ตัวเลือกสำหรับปุ่ม Tab — แยกตามโหมดเหมือน helpFor()
   * ถ้าไม่แยก คำสั่ง config อย่าง shutdown จะไปชนกับ show ตอนกด Tab หลังพิมพ์ "sh"
   */
  function completionsFor() {
    const SHOW = [
      'show running-config', 'show startup-config', 'show version', 'show clock',
      'show vlan brief', 'show ip interface brief', 'show ip route',
      'show interfaces status', 'show interfaces trunk', 'show mac address-table',
      'show spanning-tree', 'show cdp neighbors', 'show vtp status',
      'show etherchannel summary', 'show port-security', 'show monitor session 1', 'show standby brief',
      'show ip ospf', 'show ip ospf neighbor', 'show ip ospf interface', 'show ip protocols',
      'show access-lists', 'show ip nat statistics', 'show ip nat translations', 'show ip dhcp pool',
    ];
    const map = {
      user: ['enable', 'exit', 'ping ', 'show version', 'show clock'],
      priv: ['configure terminal', ...SHOW, 'ping ', 'write memory',
        'copy running-config startup-config', 'disable', 'exit'],
      config: ['hostname ', 'vlan ', 'interface ', 'interface range ', 'ip default-gateway ', 'ip routing',
        'router ospf 1', 'access-list ', 'ip access-list standard ', 'ip access-list extended ',
        'ip dhcp pool ', 'ip dhcp excluded-address ', 'ip nat inside source static ',
        'ip nat inside source list ', 'ip name-server ',
        'enable secret ', 'line vty 0 4', 'spanning-tree mode rapid-pvst', 'spanning-tree vlan 1 priority 4096',
        'banner motd ', 'exit', 'end', ...SHOW.map(x => 'do ' + x)],
      'config-if': ['description ', 'ip ospf 1 area 0', 'ip access-group ', 'ip nat inside', 'ip nat outside',
        'switchport mode access', 'switchport mode trunk', 'switchport access vlan ',
        'switchport trunk encapsulation dot1q', 'switchport trunk allowed vlan ', 'switchport trunk native vlan ',
        'switchport port-security', 'channel-group 1 mode active', 'spanning-tree portfast',
        'spanning-tree bpduguard enable', 'ip address ', 'speed ', 'duplex ', 'no shutdown', 'shutdown',
        'exit', 'end', ...SHOW.map(x => 'do ' + x)],
      'config-vlan': ['name ', 'exit', 'end'],
      'config-router': ['network ', 'router-id ', 'passive-interface ', 'exit', 'end'],
      'config-acl': ['permit ', 'deny ', 'remark ', 'exit', 'end'],
      'config-dhcp': ['network ', 'default-router ', 'dns-server ', 'domain-name ', 'lease ', 'exit', 'end'],
      'config-line': ['password ', 'login local', 'login', 'logging synchronous', 'transport input ssh',
        'exec-timeout 5 0', 'exit', 'end'],
    };
    return map[st.mode] || map.priv;
  }

  function helpFor() {
    const m = st.mode;
    const map = {
      user: ['enable', 'exit', 'ping', 'show version', 'show clock', '?'],
      priv: ['configure terminal', 'show running-config', 'show startup-config', 'show version', 'show clock',
        'show vlan brief', 'show ip interface brief', 'show ip route',
        'show interfaces status', 'show interfaces trunk', 'show mac address-table', 'show spanning-tree',
        'show port-security', 'show etherchannel summary', 'show cdp neighbors', 'show vtp status',
        'show ip ospf neighbor', 'show ip protocols', 'show access-lists', 'show ip nat statistics',
        'show ip dhcp pool', 'ping', 'write memory', 'disable'],
      config: ['hostname WORD', 'vlan <1-4094>', 'interface <if>', 'interface range <if - if>', 'ip default-gateway A.B.C.D',
        'router ospf <pid>', 'access-list <1-199> permit|deny ...', 'ip access-list standard|extended NAME',
        'ip dhcp pool NAME', 'ip dhcp excluded-address A B', 'ip nat inside source static LOCAL GLOBAL',
        'ip nat inside source list N interface <if> overload', 'ip name-server A.B.C.D',
        'ip routing', 'enable secret WORD', 'username WORD privilege N secret WORD', 'spanning-tree mode {pvst|rapid-pvst}',
        'spanning-tree vlan N priority N', 'line vty 0 4', 'banner motd #..#', 'do <exec-cmd>', 'exit / end'],
      'config-if': ['description LINE', 'switchport mode {access|trunk}', 'switchport access vlan N',
        'switchport trunk encapsulation dot1q', 'switchport trunk allowed vlan LIST', 'switchport trunk native vlan N',
        'switchport port-security [maximum N|violation X|mac-address sticky]', 'channel-group N mode active',
        'spanning-tree portfast', 'spanning-tree bpduguard enable', 'ip address A.B.C.D MASK (SVI)', 'shutdown / no shutdown', 'exit / end'],
      'config-vlan': ['name WORD', 'exit'],
      'config-router': ['network A.B.C.D WILDCARD area N', 'router-id A.B.C.D', 'passive-interface <if>', 'exit'],
      'config-acl': ['permit|deny <src> [wildcard]', 'permit|deny <proto> <src> <dst> [eq PORT]', 'remark LINE', 'exit'],
      'config-dhcp': ['network A.B.C.D MASK', 'default-router A.B.C.D', 'dns-server A.B.C.D', 'domain-name WORD', 'lease D H M', 'exit'],
      'config-line': ['password WORD', 'login [local]', 'logging synchronous', 'transport input ssh', 'exec-timeout N', 'exit'],
    };
    return [D(`คำสั่งที่ใช้ได้ใน ${m} mode:`), ...map[m].map(x => '  ' + x)];
  }

  return {
    state: st,
    prompt,
    exec,
    hint: () => helpFor(),
    banner: () => [
      D('Cisco IOS Software, C2960 Software (C2960-LANBASEK9-M), Version 15.2(4)E7'),
      D('Press ENTER to get started. พิมพ์ ? เพื่อดูคำสั่งที่ใช้ได้'),
      '',
    ],
    completions: () => completionsFor(),
  };
}
