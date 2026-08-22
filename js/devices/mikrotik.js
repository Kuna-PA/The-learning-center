// ============================================================
//  MikroTik RouterOS emulator (ใช้ได้ทั้ง Router และ Switch CRS/CSS)
// ============================================================
import { words, pad, lpad, E, D, H, OK, isIp } from './util.js';

// ---- โครงสร้างเมนู: path -> spec ----
const SPEC = {
  'interface': { cols: ['name', 'type', 'actual-mtu', 'mac-address'], flags: true, readonly: true },
  'interface ethernet': { cols: ['name', 'mtu', 'mac-address'], readonly: true, derive: 'ether' },
  'interface bridge': { cols: ['name', 'protocol-mode', 'vlan-filtering'], required: ['name'], defaults: { 'protocol-mode': 'rstp', 'vlan-filtering': 'no' }, kind: 'bridge' },
  'interface bridge port': { cols: ['interface', 'bridge', 'pvid'], required: ['bridge', 'interface'], defaults: { pvid: '1' } },
  'interface bridge vlan': { cols: ['bridge', 'vlan-ids', 'tagged', 'untagged'], required: ['bridge', 'vlan-ids'], defaults: { tagged: '', untagged: '' } },
  'interface vlan': { cols: ['name', 'vlan-id', 'interface'], required: ['name', 'vlan-id', 'interface'], kind: 'vlan' },
  'interface bonding': { cols: ['name', 'slaves', 'mode'], required: ['name', 'slaves'], defaults: { mode: 'balance-rr' }, kind: 'bond' },
  'interface list': { cols: ['name'], required: ['name'] },
  'interface list member': { cols: ['list', 'interface'], required: ['list', 'interface'] },
  'ip address': { cols: ['address', 'network', 'interface'], required: ['address', 'interface'] },
  'ip route': { cols: ['dst-address', 'gateway', 'distance'], required: ['dst-address'], defaults: { distance: '1' } },
  'ip pool': { cols: ['name', 'ranges'], required: ['name', 'ranges'] },
  'ip dhcp-server': { cols: ['name', 'interface', 'address-pool', 'lease-time'], required: ['name', 'interface'], defaults: { 'lease-time': '10m', 'address-pool': 'static-only' } },
  'ip dhcp-server network': { cols: ['address', 'gateway', 'dns-server'], required: ['address'] },
  'ip dhcp-client': { cols: ['interface', 'disabled', 'status', 'address'], required: ['interface'], defaults: { disabled: 'no', status: 'bound', address: '203.0.113.25/24' } },
  'ip firewall nat': { cols: ['chain', 'action', 'out-interface', 'to-addresses', 'dst-port', 'protocol'], required: ['chain', 'action'] },
  'ip firewall filter': { cols: ['chain', 'action', 'protocol', 'dst-port', 'in-interface', 'connection-state'], required: ['chain', 'action'] },
  'ip firewall mangle': { cols: ['chain', 'action', 'new-packet-mark'], required: ['chain', 'action'] },
  'ip firewall address-list': { cols: ['list', 'address'], required: ['list', 'address'] },
  'ip service': { cols: ['name', 'port', 'disabled'], readonly: true },
  'ip dns static': { cols: ['name', 'address'], required: ['name', 'address'] },
  'user': { cols: ['name', 'group'], required: ['name'], defaults: { group: 'full' } },
  'queue simple': { cols: ['name', 'target', 'max-limit'], required: ['name', 'target'] },
  'system script': { cols: ['name', 'source'], required: ['name'] },
  'system scheduler': { cols: ['name', 'interval', 'on-event'], required: ['name'] },
  'system logging': { cols: ['topics', 'action'], required: ['action'], defaults: { topics: 'info' } },
  'system logging action': { cols: ['name', 'target', 'remote'], required: ['name'] },
  'tool netwatch': { cols: ['host', 'status'], required: ['host'], defaults: { status: 'up' } },
  // --- เพิ่มสำหรับ Lab ระดับสูง ---
  'ip dhcp-server lease': { cols: ['address', 'mac-address', 'server'], required: ['address', 'mac-address'] },
  'ip firewall raw': { cols: ['chain', 'action', 'src-address-list', 'protocol'], required: ['chain', 'action'] },
  'ip firewall layer7-protocol': { cols: ['name', 'regexp'], required: ['name', 'regexp'] },
  'interface wireguard': { cols: ['name', 'listen-port', 'public-key'], required: ['name'], defaults: { 'listen-port': '13231', 'public-key': 'kJ8xQpVv2Zt1c9Lm0Xw3Rb7Ns5Ty4Uq6Ei8Op0Ad=' }, kind: 'wg' },
  'interface wireguard peers': { cols: ['interface', 'public-key', 'allowed-address', 'endpoint-address'], required: ['interface', 'public-key'] },
  'interface vrrp': { cols: ['name', 'interface', 'vrid', 'priority'], required: ['name', 'interface'], defaults: { vrid: '1', priority: '100' }, kind: 'vrrp' },
  'interface eoip': { cols: ['name', 'remote-address', 'tunnel-id'], required: ['name', 'remote-address'], kind: 'eoip' },
  'routing ospf instance': { cols: ['name', 'router-id'], required: ['name'] },
  'routing ospf area': { cols: ['name', 'area-id', 'instance'], required: ['name', 'instance'], defaults: { 'area-id': '0.0.0.0' } },
  'routing ospf interface-template': { cols: ['interfaces', 'area', 'type'], required: ['interfaces', 'area'] },
  'routing bgp connection': { cols: ['name', 'remote.address', 'remote.as', 'local.role'], required: ['name'] },
  'routing filter rule': { cols: ['chain', 'rule'], required: ['chain', 'rule'] },
  'snmp community': { cols: ['name', 'addresses', 'security'], required: ['name'], defaults: { security: 'none' } },
  'ppp secret': { cols: ['name', 'service', 'profile', 'remote-address'], required: ['name'] },
  'ip ipsec peer': { cols: ['name', 'address', 'exchange-mode'], required: ['name', 'address'], defaults: { 'exchange-mode': 'ike2' } },
  'ip ipsec identity': { cols: ['peer', 'auth-method', 'secret'], required: ['peer'], defaults: { 'auth-method': 'pre-shared-key' } },
  'ip ipsec policy': { cols: ['src-address', 'dst-address', 'tunnel', 'peer'], required: ['peer'] },
};

const SETTINGS = {
  'system identity': { name: 'MikroTik' },
  'ip dns': { servers: '', 'allow-remote-requests': 'no' },
  'system clock': { 'time-zone-name': 'UTC' },
  'system ntp client': { enabled: 'no', servers: '' },
  'ip cloud': { 'ddns-enabled': 'no' },
  'interface ethernet switch': { 'name': 'switch1', 'mirror-source': 'none', 'mirror-target': 'none' },
  'system routerboard settings': { 'boot-os': 'router-os', 'auto-upgrade': 'no' },
  'ip neighbor discovery-settings': { 'discover-interface-list': 'all' },
  'tool mac-server': { 'allowed-interface-list': 'all' },
  'tool mac-server mac-winbox': { 'allowed-interface-list': 'all' },
  'tool bandwidth-server': { enabled: 'yes', authenticate: 'yes' },
  'snmp': { enabled: 'no', 'trap-version': '2', contact: '', location: '' },
  'system note': { 'show-at-login': 'no', note: '' },
  'ip settings': { 'ip-forward': 'yes', 'send-redirects': 'no', 'accept-source-route': 'no' },
};

// path ทั้งหมดที่ valid (รวม prefix)
const ALL_PATHS = new Set();
[...Object.keys(SPEC), ...Object.keys(SETTINGS)].forEach(p => {
  const seg = p.split(' ');
  for (let i = 1; i <= seg.length; i++) ALL_PATHS.add(seg.slice(0, i).join(' '));
});
['system', 'tool', 'ip', 'interface', 'queue', 'routing', 'file', 'log', 'certificate', 'ppp', 'snmp',
  'system resource', 'system health', 'system license', 'system package', 'interface ethernet switch port']
  .forEach(p => ALL_PATHS.add(p));

const ACTIONS = ['print', 'add', 'set', 'remove', 'enable', 'disable', 'export', 'find', 'get',
  'monitor', 'comment', 'move', 'edit', 'reset', 'ping', 'reboot', 'shutdown', 'identity'];

export function createMikrotik(init = {}) {
  const st = {
    vendor: 'mikrotik',
    role: init.role || 'router',            // router | switch
    path: [],
    user: 'admin',
    tables: {},
    settings: JSON.parse(JSON.stringify(SETTINGS)),
    hosts: init.hosts || {},
    log: [],
  };
  st.settings['system identity'].name = init.identity || (st.role === 'switch' ? 'MikroTik-SW' : 'MikroTik');

  Object.keys(SPEC).forEach(k => { st.tables[k] = []; });

  // physical interfaces
  const n = init.ports ?? (st.role === 'switch' ? 8 : 5);
  for (let i = 1; i <= n; i++) {
    st.tables['interface'].push({
      _id: `*${i}`, name: `ether${i}`, type: 'ether', 'actual-mtu': '1500',
      'mac-address': `48:8F:5A:11:00:${String(i).padStart(2, '0')}`,
      running: i <= (init.linkUp ?? 3), disabled: false, dynamic: false, mtu: '1500',
    });
  }
  if (init.wlan) {
    st.tables['interface'].push({ _id: '*A', name: 'wlan1', type: 'wlan', 'actual-mtu': '1500', 'mac-address': '48:8F:5A:11:00:0A', running: true, disabled: false });
  }
  st.tables['ip service'] = [
    { _id: '*1', name: 'telnet', port: '23', disabled: false },
    { _id: '*2', name: 'ftp', port: '21', disabled: 'no' },
    { _id: '*3', name: 'www', port: '80', disabled: 'no' },
    { _id: '*4', name: 'ssh', port: '22', disabled: 'no' },
    { _id: '*5', name: 'winbox', port: '8291', disabled: 'no' },
    { _id: '*6', name: 'api', port: '8728', disabled: 'no' },
  ];
  st.tables['user'] = [{ _id: '*1', name: 'admin', group: 'full', disabled: false }];

  if (init.apply) init.apply(st);

  // ---------- helpers ----------
  const idn = { v: 100 };
  const newId = () => `*${(idn.v++).toString(16).toUpperCase()}`;

  function ifaceNames() {
    const from = p => (st.tables[p] || []).map(r => r.name).filter(Boolean);
    return [
      ...from('interface'), ...from('interface bridge'), ...from('interface vlan'),
      ...from('interface bonding'), ...from('interface wireguard'), ...from('interface vrrp'),
      ...from('interface eoip'),
    ];
  }

  // แยก token โดยเคารพเครื่องหมายคำพูด เช่น  on-event="/system backup save name=x"
  function mtTokens(s) {
    const out = [];
    const re = /(\S+?=(?:"[^"]*"|'[^']*'|\S*))|"([^"]*)"|'([^']*)'|(\S+)/g;
    let m;
    while ((m = re.exec(s))) out.push(m[1] ?? m[2] ?? m[3] ?? m[4]);
    return out;
  }

  function parseKV(tokens) {
    const kv = {}; const rest = [];
    tokens.forEach(t => {
      const m = String(t).match(/^([a-z0-9\-_.]+)=([\s\S]*)$/i);
      if (m) kv[m[1].toLowerCase()] = m[2].replace(/^["']|["']$/g, '');
      else rest.push(t);
    });
    return { kv, rest };
  }

  const disabledOf = r => r.disabled === true || r.disabled === 'yes';

  function netFromCidr(a) {
    const m = a.match(/^(\d+\.\d+\.\d+\.\d+)\/(\d+)$/);
    if (!m) return '';
    const [, ip, p] = m;
    const bits = '1'.repeat(+p).padEnd(32, '0');
    const mask = [0, 8, 16, 24].map(i => parseInt(bits.slice(i, i + 8), 2));
    return ip.split('.').map((o, i) => +o & mask[i]).join('.');
  }

  // ---------- print ----------
  function printTable(p, args) {
    const spec = SPEC[p];
    const rows = st.tables[p] || [];
    const { kv } = parseKV(args);
    const detail = args.some(a => a === 'detail');
    let list = rows.map((r, i) => ({ r, i }));
    const wi = args.indexOf('where');
    if (wi >= 0) {
      const { kv: f } = parseKV(args.slice(wi + 1));
      list = list.filter(({ r }) => Object.entries(f).every(([k, v]) => String(r[k]) === v));
    }
    Object.entries(kv).forEach(([k, v]) => {
      if (spec.cols.includes(k)) list = list.filter(({ r }) => String(r[k]) === v);
    });

    if (!list.length) return [D('  (ไม่มีรายการ)')];

    const out = [];
    if (p === 'interface' || p === 'interface bridge port') {
      out.push(D('Flags: D - dynamic, X - disabled, R - running, S - slave'));
    } else if (!spec.readonly) {
      out.push(D('Flags: X - disabled, I - invalid, D - dynamic'));
    }

    const cell = (r, c) => (c === 'disabled' ? (disabledOf(r) ? 'yes' : 'no') : (r[c] ?? ''));

    if (detail) {
      list.forEach(({ r, i }) => {
        const fl = disabledOf(r) ? 'X' : r.running ? 'R' : ' ';
        out.push(` ${lpad(i, 2)} ${fl} ` + spec.cols.filter(c => r[c] !== undefined && r[c] !== '')
          .map(c => `${c}=${JSON.stringify(String(cell(r, c)))}`).join(' '));
      });
      return out;
    }

    const widths = spec.cols.map(c => Math.max(c.length, ...list.map(({ r }) => String(cell(r, c)).length)) + 2);
    out.push(' #   ' + spec.cols.map((c, i) => pad(c.toUpperCase(), widths[i])).join('').trimEnd());
    list.forEach(({ r, i }) => {
      const fl = disabledOf(r) ? 'X' : (p === 'interface' && r.running) ? 'R' : ' ';
      out.push(` ${lpad(i, 2)} ${fl} ` + spec.cols.map((c, j) => pad(cell(r, c), widths[j])).join('').trimEnd());
    });
    return out;
  }

  // รองรับ  0  |  0,1,2  |  [find name=x]  (ถูกแทนที่เป็น placeholder n ตั้งแต่ตอน tokenize)
  function resolveIndex(p, tok, finds) {
    if (tok === undefined) return null;
    if (/^\d+$/.test(tok)) return [+tok];
    if (/^\d+(,\d+)+$/.test(tok)) return tok.split(',').map(Number);
    const fm = String(tok).match(/^(\d+)$/);
    if (fm) {
      const { kv } = parseKV(mtTokens(finds[+fm[1]] || ''));
      const res = [];
      (st.tables[p] || []).forEach((r, i) => {
        const ok = Object.entries(kv).every(([k, v]) =>
          k === 'disabled' ? String(disabledOf(r) ? 'yes' : 'no') === v : String(r[k]) === v);
        if (ok) res.push(i);
      });
      return res;
    }
    return null;
  }

  // ---------- export ----------
  function doExport() {
    const out = [D(`# aug/21/2026 09:41:03 by RouterOS 7.14`), D(`# software id = LEARN-LAB`), ''];
    Object.keys(SPEC).forEach(p => {
      const rows = st.tables[p];
      if (!rows || !rows.length || SPEC[p].readonly) return;
      out.push(`/${p.replace(/ /g, ' ')}`);
      rows.forEach(r => {
        const kv = SPEC[p].cols.filter(c => r[c] !== undefined && r[c] !== '')
          .map(c => `${c}=${r[c]}`).join(' ');
        out.push(`add ${kv}`);
      });
    });
    Object.entries(st.settings).forEach(([p, s]) => {
      const kv = Object.entries(s).filter(([, v]) => v !== '' && v !== 'no').map(([k, v]) => `${k}=${v}`).join(' ');
      if (kv) out.push(`/${p}`, `set ${kv}`);
    });
    return out;
  }

  // ---------- prompt ----------
  function prompt() {
    const id = st.settings['system identity'].name;
    const p = st.path.length ? ' /' + st.path.join(' ') : '';
    return `[${st.user}@${id}]${p} > `;
  }

  // ---------- ping ----------
  function doPing(target, count = 4) {
    if (!target) return [E('no such item (ต้องระบุ address)')];
    const reach = st.hosts[target] !== undefined ||
      st.tables['ip address'].some(a => a.address.startsWith(target.split('.').slice(0, 3).join('.'))) ||
      st.tables['ip route'].some(r => r['dst-address'] === '0.0.0.0/0');
    const out = ['  SEQ HOST                                     SIZE TTL TIME  STATUS'];
    for (let i = 0; i < count; i++) {
      out.push(reach
        ? `    ${i} ${pad(target, 40)} 56  64  ${(0.5 + i * 0.3).toFixed(1)}ms`
        : `    ${i} ${pad(target, 40)}                    timeout`);
    }
    out.push(reach ? OK(`    sent=${count} received=${count} packet-loss=0% min-rtt=0ms avg-rtt=1ms max-rtt=2ms`)
      : E(`    sent=${count} received=0 packet-loss=100%`));
    return out;
  }

  // ---------- main ----------
  function exec(rawLine) {
    let raw = rawLine.trim();
    if (!raw) return [];
    if (raw === '?') return help();

    // ".." ขึ้นหนึ่งชั้น
    if (raw === '..') { st.path.pop(); return []; }
    if (raw === '/') { st.path = []; return []; }

    // ดึงบล็อก [find ...] ออกมาก่อน แล้วแทนที่ด้วย placeholder เพื่อไม่ให้ปนกับ key=value
    const finds = [];
    raw = raw.replace(/\[\s*find([^\]]*)\]/gi, (_, inner) => {
      finds.push(inner.trim());
      return '' + (finds.length - 1);
    });

    let tokens = mtTokens(raw);
    let path = [...st.path];

    // absolute path
    if (tokens[0].startsWith('/')) {
      path = [];
      tokens[0] = tokens[0].slice(1);
      if (!tokens[0]) tokens.shift();
      if (!tokens.length) { st.path = []; return []; }
    }

    // กิน token ที่เป็น menu segment
    while (tokens.length) {
      const cand = [...path, tokens[0].toLowerCase()].join(' ');
      if (ALL_PATHS.has(cand) && !(ACTIONS.includes(tokens[0].toLowerCase()) && SPEC[path.join(' ')])) {
        path.push(tokens.shift().toLowerCase());
      } else break;
    }

    const p = path.join(' ');

    // ไม่มี action -> เปลี่ยน path
    if (!tokens.length) {
      if (!ALL_PATHS.has(p) && p) return [E(`no such command or directory (${p})`)];
      st.path = path;
      return [];
    }

    const act = tokens.shift().toLowerCase();
    const args = tokens;

    // ---- คำสั่งพิเศษ ----
    if (p === 'system' && act === 'reboot') return [H('Reboot, yes? [y/N]: (lab นี้ไม่ reboot จริง)')];
    if (p === 'system' && act === 'identity') return exec('/system identity ' + args.join(' '));
    if (p === 'system' && act === 'resource' && !args.length) { st.path = ['system', 'resource']; return []; }
    if (p === 'system resource') {
      if (act === 'print' || args.includes('print')) return [
        `                   uptime: 3d04:12:55`,
        `                  version: 7.14.2 (stable)`,
        `               build-time: Feb/20/2026 09:00:00`,
        `              free-memory: 168.4MiB`,
        `             total-memory: 256.0MiB`,
        `                      cpu: ARM`,
        `                cpu-count: 4`,
        `            cpu-frequency: 800MHz`,
        `                 cpu-load: 3%`,
        `           free-hdd-space: 12.6MiB`,
        `          total-hdd-space: 16.0MiB`,
        `                board-name: ${st.role === 'switch' ? 'CRS328-24P-4S+' : 'hEX S (RB760iGS)'}`,
        `                 platform: MikroTik`,
      ];
    }
    if (act === 'ping' || (p === 'tool' && act === 'ping')) {
      const { kv, rest } = parseKV(args);
      return doPing(rest[0] || kv.address, +(kv.count || 4));
    }
    if (act === 'export') return doExport();
    if (act === 'quit') return [D('(ปิด session)')];

    // ---- settings menu ----
    if (SETTINGS[p]) {
      const s = st.settings[p];
      if (act === 'print') return Object.entries(s).map(([k, v]) => `${lpad(k, 26)}: ${v}`);
      if (act === 'set') {
        const { kv } = parseKV(args);
        if (!Object.keys(kv).length) return [E('ต้องระบุ parameter เช่น set name=R1')];
        Object.entries(kv).forEach(([k, v]) => {
          if (!(k in s)) return;
          s[k] = v;
        });
        const bad = Object.keys(kv).filter(k => !(k in s));
        return bad.length ? [E(`unknown parameter: ${bad.join(', ')}`)] : [];
      }
      return [E(`bad command name or arguments (${act})`)];
    }

    // ---- table menu ----
    const spec = SPEC[p];
    if (!spec) return [E(`no such command or directory (${p || act})`)];
    const table = st.tables[p];

    if (act === 'print') return printTable(p, args);

    if (act === 'add') {
      if (spec.readonly) return [E('cannot add to this menu (read-only)')];
      const { kv } = parseKV(args);
      const missing = (spec.required || []).filter(k => !(k in kv));
      if (missing.length) return [E(`ต้องระบุ: ${missing.map(m => m + '=').join(', ')}`)];
      // validate interface references
      for (const k of ['interface', 'in-interface', 'out-interface', 'bridge']) {
        if (kv[k] && !ifaceNames().includes(kv[k]) && !kv[k].startsWith('!')) {
          return [E(`no such item (interface "${kv[k]}" ไม่มีอยู่)`)];
        }
      }
      if (kv.address && p === 'ip address' && !/^\d+\.\d+\.\d+\.\d+\/\d+$/.test(kv.address)) {
        return [E('invalid value for argument address (ต้องเป็นรูปแบบ x.x.x.x/prefix)')];
      }
      const rec = { _id: newId(), ...(spec.defaults || {}), ...kv, disabled: kv.disabled === 'yes' };
      if (p === 'ip address') rec.network = netFromCidr(kv.address);
      table.push(rec);
      return [];
    }

    if (act === 'set') {
      const idx = resolveIndex(p, args[0], finds);
      if (!idx || !idx.length) return [E('no such item (ต้องระบุหมายเลขรายการ หรือ [find ...])')];
      const { kv } = parseKV(args.slice(1));
      idx.forEach(i => {
        if (!table[i]) return;
        Object.entries(kv).forEach(([k, v]) => {
          table[i][k] = v;
          if (k === 'disabled') table[i].disabled = (v === 'yes' || v === true);
          if (k === 'address' && p === 'ip address') table[i].network = netFromCidr(v);
        });
      });
      return [];
    }

    if (act === 'remove') {
      const idx = resolveIndex(p, args[0], finds);
      if (!idx || !idx.length) return [E('no such item')];
      idx.sort((a, b) => b - a).forEach(i => table.splice(i, 1));
      return [];
    }

    if (act === 'enable' || act === 'disable') {
      const idx = resolveIndex(p, args[0], finds);
      if (!idx || !idx.length) return [E('no such item')];
      idx.forEach(i => { if (table[i]) { table[i].disabled = act === 'disable'; table[i].disabled_s = act === 'disable' ? 'yes' : 'no'; } });
      return [];
    }

    if (act === 'find') {
      const { kv } = parseKV(args);
      const hits = table.map((r, i) => ({ r, i })).filter(({ r }) => Object.entries(kv).every(([k, v]) => String(r[k]) === v));
      return [hits.map(h => h.i).join(';') || D('(ไม่พบ)')];
    }

    if (act === 'monitor') return [D('(monitor ไม่รองรับใน lab)')];
    if (act === 'comment') return [];

    return [E(`bad command name or arguments (${act})`)];
  }

  function help() {
    const cur = st.path.join(' ');
    const kids = [...ALL_PATHS].filter(x => {
      const s = x.split(' ');
      return s.length === st.path.length + 1 && s.slice(0, -1).join(' ') === cur;
    }).map(x => x.split(' ').pop());
    const out = [D(`ตำแหน่งปัจจุบัน: /${cur || ''}`)];
    if (kids.length) out.push(D('เมนูย่อย: ') , '  ' + kids.join('  '));
    if (SPEC[cur]) out.push(D('คำสั่ง: print, add, set <n>, remove <n>, enable/disable <n>, export, find'),
      D('ฟิลด์: ') , '  ' + SPEC[cur].cols.join('  '));
    out.push(D('ทั่วไป: /  (กลับ root)   ..  (ขึ้น 1 ชั้น)   /export   /ping 8.8.8.8'));
    return out;
  }

  return {
    state: st,
    prompt,
    exec,
    hint: help,
    banner: () => [
      D('  MMM      MMM       KKK                          TTTTTTTTTTT       KKK'),
      D('  MMMM    MMMM       KKK                          TTTTTTTTTTT       KKK'),
      D('  MMM MMMM MMM  III  KKK  KKK  RRRRRR     OOOOOO      TTT     III   KKK  KKK'),
      D('  MMM  MM  MMM  III  KKKKK     RRR  RRR  OOO  OOO     TTT     III   KKKKK'),
      D('  MMM      MMM  III  KKK KKK   RRRRRR    OOO  OOO     TTT     III   KKK KKK'),
      D('  MMM      MMM  III  KKK  KKK  RRR  RRR   OOOOOO      TTT     III   KKK  KKK'),
      '',
      D('  MikroTik RouterOS 7.14.2 (c) 1999-2026    https://www.mikrotik.com/'),
      D('  พิมพ์ ? เพื่อดูเมนู/คำสั่งที่ตำแหน่งปัจจุบัน'),
      '',
    ],
    completions: () => [
      '/interface print', '/interface ethernet print', '/interface bridge add name=bridge1',
      '/interface bridge port add bridge=bridge1 interface=ether2', '/interface bridge print',
      '/interface bridge vlan add bridge=bridge1 vlan-ids=10 tagged=bridge1,ether1 untagged=ether2',
      '/interface vlan add name=vlan10 vlan-id=10 interface=bridge1',
      '/ip address add address=192.168.88.1/24 interface=bridge1', '/ip address print',
      '/ip route add dst-address=0.0.0.0/0 gateway=192.168.88.254', '/ip route print',
      '/ip pool add name=dhcp_pool ranges=192.168.88.10-192.168.88.254',
      '/ip dhcp-server add name=dhcp1 interface=bridge1 address-pool=dhcp_pool',
      '/ip dhcp-server network add address=192.168.88.0/24 gateway=192.168.88.1 dns-server=8.8.8.8',
      '/ip dhcp-client add interface=ether1 disabled=no',
      '/ip firewall nat add chain=srcnat out-interface=ether1 action=masquerade',
      '/ip firewall filter add chain=input action=accept connection-state=established,related',
      '/ip firewall filter print', '/ip dns set servers=8.8.8.8,1.1.1.1 allow-remote-requests=yes',
      '/system identity set name=R1', '/system resource print', '/user add name=noc group=full',
      '/ip service print', '/ip service set [find name=telnet] disabled=yes',
      '/ip dhcp-server lease add address=192.168.88.50 mac-address=00:0C:29:11:22:33 server=dhcp1',
      '/interface wireguard add name=wg0 listen-port=13231',
      '/interface wireguard peers add interface=wg0 public-key="AbC123=" allowed-address=10.99.0.2/32',
      '/interface vrrp add name=vrrp-lan interface=bridge1 vrid=10 priority=200',
      '/routing ospf instance add name=default router-id=10.0.0.1',
      '/routing ospf area add name=backbone area-id=0.0.0.0 instance=default',
      '/routing ospf interface-template add interfaces=ether2 area=backbone',
      '/system logging action add name=remote-log target=remote remote=10.10.10.60',
      '/snmp community add name=monitor addresses=10.10.10.0/24',
      '/ip neighbor discovery-settings set discover-interface-list=LAN',
      '/tool mac-server set allowed-interface-list=LAN',
      '/system routerboard settings print',
      '/export', '/ping 8.8.8.8', '..', '/',
    ],
  };
}
