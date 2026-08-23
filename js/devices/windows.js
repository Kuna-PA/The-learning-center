// ============================================================
//  Windows Server emulator (PowerShell + คำสั่ง cmd บางส่วน)
// ============================================================
import { pad, lpad, E, D, H, OK } from './util.js';

function tokenize(line) {
  const out = [];
  const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let m;
  while ((m = re.exec(line))) out.push(m[1] ?? m[2] ?? m[3]);
  return out;
}

function parseParams(tokens) {
  const p = {}; const pos = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.startsWith('-') && !/^-?\d/.test(t)) {
      const key = t.slice(1).toLowerCase();
      const nxt = tokens[i + 1];
      if (nxt === undefined || (nxt.startsWith('-') && !/^-?\d/.test(nxt))) p[key] = true;
      else { p[key] = nxt; i++; }
    } else pos.push(t);
  }
  return { p, pos };
}

const FEATURES = {
  'AD-Domain-Services': 'Active Directory Domain Services',
  'DNS': 'DNS Server',
  'DHCP': 'DHCP Server',
  'Web-Server': 'Web Server (IIS)',
  'File-Services': 'File and Storage Services',
  'Hyper-V': 'Hyper-V',
  'RSAT-AD-PowerShell': 'Active Directory module for Windows PowerShell',
  'Print-Services': 'Print and Document Services',
  'Remote-Desktop-Services': 'Remote Desktop Services',
  'Windows-Server-Backup': 'Windows Server Backup',
};

export function createWindows(init = {}) {
  const st = {
    vendor: 'windows',
    hostname: init.hostname || 'WIN-SRV01',
    domain: init.domain || null,          // เช่น 'corp.local'
    workgroup: 'WORKGROUP',
    cwd: 'C:\\Users\\Administrator',
    user: 'Administrator',
    isDC: !!init.isDC,
    features: new Set(init.features || ['File-Services']),
    services: {
      Spooler: { display: 'Print Spooler', status: 'Running', start: 'Automatic' },
      W32Time: { display: 'Windows Time', status: 'Running', start: 'Automatic' },
      Dnscache: { display: 'DNS Client', status: 'Running', start: 'Automatic' },
      WinRM: { display: 'Windows Remote Management (WS-Management)', status: 'Running', start: 'Automatic' },
      TermService: { display: 'Remote Desktop Services', status: 'Stopped', start: 'Manual' },
      W3SVC: { display: 'World Wide Web Publishing Service', status: 'Stopped', start: 'Disabled' },
      DHCPServer: { display: 'DHCP Server', status: 'Stopped', start: 'Disabled' },
      MpsSvc: { display: 'Windows Defender Firewall', status: 'Running', start: 'Automatic' },
      LanmanServer: { display: 'Server', status: 'Running', start: 'Automatic' },
    },
    nics: {
      Ethernet0: { ip: init.ip || '192.168.10.5', prefix: 24, gw: init.gw || '192.168.10.1', dns: init.dns || ['8.8.8.8'], dhcp: false, mac: '00-15-5D-01-0A-01', status: 'Up' },
    },
    localUsers: {
      Administrator: { enabled: true, desc: 'Built-in account for administering the computer/domain', groups: ['Administrators'] },
      Guest: { enabled: false, desc: 'Built-in account for guest access', groups: ['Guests'] },
    },
    localGroups: { Administrators: ['Administrator'], 'Remote Desktop Users': [], Users: [] },
    adUsers: {},
    adGroups: {},
    adOUs: [],
    shares: { 'C$': { path: 'C:\\', desc: 'Default share' }, ADMIN$: { path: 'C:\\Windows', desc: 'Remote Admin' } },
    dhcpScopes: [],
    dhcpReservations: [],
    dhcpAuthorized: false,
    dnsZones: [],
    dnsRecords: [],
    gpos: ['Default Domain Policy', 'Default Domain Controllers Policy'],
    gpLinks: [],
    recycleBin: false,
    smb1: true,
    fwRules: [],
    vmSwitches: [],
    vms: [],
    adSites: [],
    adSubnets: [],
    scheduledTasks: [{ name: 'BackupJob', path: '\\', state: 'Ready' }],
    hosts: init.hosts || { '8.8.8.8': 'dns', '192.168.10.1': 'gw' },
    fs: {
      'C:\\': { d: true, c: { Users: { d: true, c: { Administrator: { d: true, c: { Desktop: { d: true, c: {} }, Documents: { d: true, c: {} } } } } }, Windows: { d: true, c: { System32: { d: true, c: {} } } }, Scripts: { d: true, c: {} }, inetpub: { d: true, c: { wwwroot: { d: true, c: { 'iisstart.htm': { d: false, c: '<h1>IIS</h1>' } } } } } } },
    },
    history: [],
    // --- สำหรับคำสั่ง cmd พื้นฐาน ---
    processes: [
      { pid: 4, name: 'System', mem: 148, user: 'SYSTEM', cpu: 0.1 },
      { pid: 652, name: 'lsass.exe', mem: 12044, user: 'SYSTEM', cpu: 0.4 },
      { pid: 812, name: 'svchost.exe', mem: 6212, user: 'NETWORK SERVICE', cpu: 0.2 },
      { pid: 1204, name: 'powershell.exe', mem: 48120, user: 'Administrator', cpu: 1.8 },
      { pid: 1508, name: 'spoolsv.exe', mem: 5040, user: 'SYSTEM', cpu: 0.0 },
      { pid: 2288, name: 'explorer.exe', mem: 62330, user: 'Administrator', cpu: 0.6 },
      { pid: 3104, name: 'MsMpEng.exe', mem: 91260, user: 'SYSTEM', cpu: 2.4 },
    ],
    dnsCache: [
      { name: 'corp.local', type: 'A', ttl: 600, data: '192.168.10.5' },
      { name: 'www.google.com', type: 'A', ttl: 122, data: '142.250.185.4' },
    ],
    arpTable: [
      { ip: '192.168.10.1', mac: '48-8f-5a-11-00-01', type: 'dynamic' },
      { ip: '192.168.10.20', mac: '00-0c-29-5b-11-a2', type: 'dynamic' },
      { ip: '192.168.10.255', mac: 'ff-ff-ff-ff-ff-ff', type: 'static' },
    ],
    wlanProfiles: ['CORP-WIFI', 'CORP-GUEST'],
    staticRoutes: [],
    winsockReset: false,
  };
  if (init.apply) init.apply(st);

  const prompt = () => `PS ${st.cwd}> `;
  const dn = () => (st.domain ? st.domain.split('.').map(x => `DC=${x}`).join(',') : '');

  // ---------- filesystem ----------
  function resolvePath(p) {
    if (!p) return st.cwd;
    p = String(p).replace(/\//g, '\\');
    if (/^[a-z]:$/i.test(p)) return p + '\\';
    if (/^[a-z]:\\/i.test(p)) return p;
    if (p === '..') return st.cwd.split('\\').slice(0, -1).join('\\') || 'C:\\';
    if (p.startsWith('.\\')) p = p.slice(2);
    return (st.cwd.endsWith('\\') ? st.cwd : st.cwd + '\\') + p;
  }
  function fsNode(p) {
    const parts = resolvePath(p).replace(/\\$/, '').split('\\');
    const root = parts.shift() + '\\';
    let n = st.fs[root.toUpperCase().replace(/^C/, 'C')] || st.fs['C:\\'];
    for (const s of parts) {
      if (!s) continue;
      if (!n || !n.d) return null;
      const key = Object.keys(n.c).find(k => k.toLowerCase() === s.toLowerCase());
      if (!key) return null;
      n = n.c[key];
    }
    return n;
  }
  function fsParent(p) {
    const abs = resolvePath(p).replace(/(.)\\$/, '$1');
    const i = abs.lastIndexOf('\\');
    // 'C:\Shares' -> parent คือ 'C:\'  (ไม่ใช่ 'C:')
    const dirPath = i <= 2 ? abs.slice(0, i + 1) : abs.slice(0, i);
    return { parent: fsNode(dirPath || 'C:\\'), name: abs.slice(i + 1), abs, dirPath };
  }

  // ---------- tables ----------
  function table(cols, rows) {
    if (!rows.length) return [];
    const w = cols.map((c, i) => Math.max(c.length, ...rows.map(r => String(r[i] ?? '').length)));
    const out = [
      cols.map((c, i) => pad(c, w[i])).join(' ').trimEnd(),
      cols.map((c, i) => '-'.repeat(Math.min(c.length, w[i])).padEnd(w[i])).join(' ').trimEnd(),
    ];
    rows.forEach(r => out.push(r.map((v, i) => pad(v, w[i])).join(' ').trimEnd()));
    return ['', ...out, ''];
  }
  const kvList = obj => ['', ...Object.entries(obj).map(([k, v]) => `${pad(k, 24)}: ${v}`), ''];

  // ---------- cmdlets ----------
  const CMDS = {};
  const alias = (a, real) => { CMDS[a.toLowerCase()] = (...x) => CMDS[real.toLowerCase()](...x); };

  CMDS['get-service'] = (t) => {
    const { p, pos } = parseParams(t);
    const nameF = (p.name || pos[0] || '').toString().replace(/\*/g, '');
    const rows = Object.entries(st.services)
      .filter(([k]) => !nameF || k.toLowerCase().includes(nameF.toLowerCase()))
      .map(([k, s]) => [s.status, k, s.display]);
    if (!rows.length) return [E(`Get-Service : Cannot find any service with service name '${nameF}'.`)];
    return table(['Status', 'Name', 'DisplayName'], rows);
  };
  CMDS['start-service'] = (t) => {
    const { p, pos } = parseParams(t); const n = p.name || pos[0];
    const k = Object.keys(st.services).find(x => x.toLowerCase() === String(n).toLowerCase());
    if (!k) return [E(`Start-Service : Cannot find any service with service name '${n}'.`)];
    st.services[k].status = 'Running'; return [];
  };
  CMDS['stop-service'] = (t) => {
    const { p, pos } = parseParams(t); const n = p.name || pos[0];
    const k = Object.keys(st.services).find(x => x.toLowerCase() === String(n).toLowerCase());
    if (!k) return [E(`Stop-Service : Cannot find any service with service name '${n}'.`)];
    st.services[k].status = 'Stopped'; return [];
  };
  CMDS['restart-service'] = (t) => { CMDS['stop-service'](t); return CMDS['start-service'](t); };
  CMDS['set-service'] = (t) => {
    const { p, pos } = parseParams(t); const n = p.name || pos[0];
    const k = Object.keys(st.services).find(x => x.toLowerCase() === String(n).toLowerCase());
    if (!k) return [E(`Set-Service : service '${n}' ไม่พบ`)];
    if (p.startuptype) st.services[k].start = p.startuptype;
    return [];
  };

  CMDS['get-windowsfeature'] = (t) => {
    const { p, pos } = parseParams(t);
    const f = (p.name || pos[0] || '').toString().replace(/\*/g, '');
    const rows = Object.entries(FEATURES)
      .filter(([k]) => !f || k.toLowerCase().includes(f.toLowerCase()))
      .map(([k, d]) => [st.features.has(k) ? '[X]' : '[ ]', d, k, st.features.has(k) ? 'Installed' : 'Available']);
    return table(['Display', 'Name', 'Feature', 'Install State'], rows);
  };
  CMDS['install-windowsfeature'] = (t) => {
    const { p, pos } = parseParams(t);
    const names = String(p.name || pos[0] || '').split(',');
    const bad = names.filter(n => !Object.keys(FEATURES).some(f => f.toLowerCase() === n.toLowerCase()));
    if (!names[0]) return [E('Install-WindowsFeature : ต้องระบุ -Name')];
    if (bad.length) return [E(`Install-WindowsFeature : ไม่รู้จัก feature: ${bad.join(', ')}`)];
    names.forEach(n => {
      const key = Object.keys(FEATURES).find(f => f.toLowerCase() === n.toLowerCase());
      st.features.add(key);
      if (key === 'Web-Server') { st.services.W3SVC.status = 'Running'; st.services.W3SVC.start = 'Automatic'; }
      if (key === 'DHCP') { st.services.DHCPServer.status = 'Running'; st.services.DHCPServer.start = 'Automatic'; }
    });
    return [...table(['Success', 'Restart Needed', 'Exit Code', 'Feature Result'],
      [['True', 'No', 'Success', `{${names.map(n => FEATURES[Object.keys(FEATURES).find(f => f.toLowerCase() === n.toLowerCase())]).join(', ')}}`]])];
  };
  CMDS['uninstall-windowsfeature'] = (t) => {
    const { p, pos } = parseParams(t);
    const key = Object.keys(FEATURES).find(f => f.toLowerCase() === String(p.name || pos[0]).toLowerCase());
    if (key) st.features.delete(key);
    return [OK('Success  Restart Needed  Exit Code  Feature Result'), 'True     No              Success    {}'];
  };

  CMDS['install-addsforest'] = (t) => {
    const { p } = parseParams(t);
    if (!st.features.has('AD-Domain-Services')) return [E('Install-ADDSForest : ต้องติดตั้ง feature AD-Domain-Services ก่อน')];
    const d = p.domainname;
    if (!d) return [E('Install-ADDSForest : ต้องระบุ -DomainName')];
    st.domain = d; st.isDC = true;
    st.features.add('DNS'); st.features.add('RSAT-AD-PowerShell');
    st.dnsZones.push({ name: d, type: 'Primary', dynamic: 'Secure' });
    st.adGroups['Domain Admins'] = ['Administrator'];
    st.adGroups['Domain Users'] = ['Administrator'];
    return [H('The target server will be configured as a domain controller.'),
      D('Warning: Windows Server 2022 domain controllers have a default for the security setting...'),
      OK(`Message : Operation completed successfully. Forest "${d}" created.`),
      OK('Status  : Success'), D('(เครื่องจะรีบูตในระบบจริง)')];
  };
  CMDS['get-addomain'] = () => {
    if (!st.domain) return [E('Get-ADDomain : Unable to find a default server with Active Directory Web Services running.')];
    return kvList({
      DNSRoot: st.domain, NetBIOSName: st.domain.split('.')[0].toUpperCase(),
      DistinguishedName: dn(), DomainMode: 'Windows2016Domain',
      InfrastructureMaster: `${st.hostname}.${st.domain}`, PDCEmulator: `${st.hostname}.${st.domain}`,
    });
  };

  const needAD = () => (!st.domain ? [E('ต้องมี Active Directory ก่อน (Install-ADDSForest -DomainName ...)')] : null);

  CMDS['new-aduser'] = (t) => {
    const bad = needAD(); if (bad) return bad;
    const { p, pos } = parseParams(t);
    const name = p.name || pos[0];
    if (!name) return [E('New-ADUser : ต้องระบุ -Name')];
    const sam = p.samaccountname || String(name).replace(/\s+/g, '').toLowerCase();
    if (st.adUsers[sam]) return [E(`New-ADUser : The specified account already exists`)];
    st.adUsers[sam] = {
      name, sam, enabled: p.enabled === '$true' || p.enabled === 'true' || p.enabled === true,
      upn: p.userprincipalname || `${sam}@${st.domain}`,
      path: p.path || `CN=Users,${dn()}`, groups: ['Domain Users'],
    };
    (st.adGroups['Domain Users'] ||= []).push(sam);
    return [];
  };
  CMDS['get-aduser'] = (t) => {
    const bad = needAD(); if (bad) return bad;
    const { p, pos } = parseParams(t);
    let list = Object.values(st.adUsers);
    const id = p.identity || (pos[0] !== '-Filter' ? pos[0] : null);
    if (id && id !== '*') list = list.filter(u => u.sam.toLowerCase() === String(id).toLowerCase());
    if (!list.length) return id && id !== '*' ? [E('Get-ADUser : Cannot find an object with identity: ' + id)] : [D('(ยังไม่มีผู้ใช้ในโดเมน)')];
    if (list.length === 1 && id) {
      const u = list[0];
      return kvList({ DistinguishedName: `CN=${u.name},${u.path.replace(/^CN=Users,/, 'CN=Users,')}`, Enabled: u.enabled, Name: u.name, SamAccountName: u.sam, UserPrincipalName: u.upn });
    }
    return table(['Name', 'SamAccountName', 'Enabled'], list.map(u => [u.name, u.sam, String(u.enabled)]));
  };
  CMDS['set-aduser'] = (t) => {
    const bad = needAD(); if (bad) return bad;
    const { p, pos } = parseParams(t);
    const u = st.adUsers[String(p.identity || pos[0]).toLowerCase()];
    if (!u) return [E('Set-ADUser : Cannot find an object with identity')];
    if (p.enabled !== undefined) u.enabled = /true/i.test(p.enabled);
    return [];
  };
  CMDS['enable-adaccount'] = (t) => {
    const { p, pos } = parseParams(t);
    const u = st.adUsers[String(p.identity || pos[0]).toLowerCase()];
    if (!u) return [E('Enable-ADAccount : Cannot find an object with identity')];
    u.enabled = true; return [];
  };
  CMDS['new-adgroup'] = (t) => {
    const bad = needAD(); if (bad) return bad;
    const { p, pos } = parseParams(t);
    const n = p.name || pos[0];
    if (!n) return [E('New-ADGroup : ต้องระบุ -Name')];
    st.adGroups[n] = [];
    return [];
  };
  CMDS['add-adgroupmember'] = (t) => {
    const bad = needAD(); if (bad) return bad;
    const { p, pos } = parseParams(t);
    const g = Object.keys(st.adGroups).find(x => x.toLowerCase() === String(p.identity || pos[0]).toLowerCase());
    if (!g) return [E('Add-ADGroupMember : Cannot find group')];
    String(p.members || pos[1] || '').split(',').map(s => s.trim()).forEach(m => {
      if (st.adUsers[m.toLowerCase()]) { st.adGroups[g].push(m.toLowerCase()); st.adUsers[m.toLowerCase()].groups.push(g); }
    });
    return [];
  };
  CMDS['get-adgroupmember'] = (t) => {
    const { p, pos } = parseParams(t);
    const g = Object.keys(st.adGroups).find(x => x.toLowerCase() === String(p.identity || pos[0]).toLowerCase());
    if (!g) return [E('Get-ADGroupMember : Cannot find group')];
    return table(['SamAccountName', 'objectClass'], st.adGroups[g].map(m => [m, 'user']));
  };
  CMDS['new-adorganizationalunit'] = (t) => {
    const bad = needAD(); if (bad) return bad;
    const { p, pos } = parseParams(t);
    st.adOUs.push(p.name || pos[0]); return [];
  };
  CMDS['get-adorganizationalunit'] = () => table(['Name', 'DistinguishedName'], st.adOUs.map(o => [o, `OU=${o},${dn()}`]));

  CMDS['get-localuser'] = () => table(['Name', 'Enabled', 'Description'],
    Object.entries(st.localUsers).map(([k, u]) => [k, String(u.enabled), u.desc]));
  CMDS['new-localuser'] = (t) => {
    const { p, pos } = parseParams(t);
    const n = p.name || pos[0];
    if (!n) return [E('New-LocalUser : ต้องระบุ -Name')];
    st.localUsers[n] = { enabled: true, desc: p.description || '', groups: ['Users'] };
    st.localGroups.Users.push(n);
    return table(['Name', 'Enabled', 'Description'], [[n, 'True', p.description || '']]);
  };
  CMDS['add-localgroupmember'] = (t) => {
    const { p, pos } = parseParams(t);
    const g = Object.keys(st.localGroups).find(x => x.toLowerCase() === String(p.group || pos[0]).toLowerCase());
    if (!g) return [E('Add-LocalGroupMember : Cannot find group')];
    String(p.member || pos[1] || '').split(',').forEach(m => st.localGroups[g].push(m.trim()));
    return [];
  };
  CMDS['get-localgroupmember'] = (t) => {
    const { p, pos } = parseParams(t);
    const g = Object.keys(st.localGroups).find(x => x.toLowerCase() === String(p.group || pos[0]).toLowerCase());
    if (!g) return [E('Cannot find group')];
    return table(['Name', 'ObjectClass'], st.localGroups[g].map(m => [`${st.hostname}\\${m}`, 'User']));
  };

  CMDS['get-netipaddress'] = () => table(['IPAddress', 'PrefixLength', 'InterfaceAlias', 'AddressFamily'],
    [['127.0.0.1', '8', 'Loopback', 'IPv4'],
    ...Object.entries(st.nics).map(([k, n]) => [n.ip, String(n.prefix), k, 'IPv4'])]);
  CMDS['get-netipconfiguration'] = () => {
    const out = [];
    Object.entries(st.nics).forEach(([k, n]) => out.push('',
      `InterfaceAlias       : ${k}`, `InterfaceIndex       : 5`,
      `InterfaceDescription : Intel(R) 82574L Gigabit Network Connection`,
      `IPv4Address          : ${n.ip}`, `IPv4DefaultGateway   : ${n.gw || '(none)'}`,
      `DNSServer            : ${n.dns.join(', ')}`));
    return out;
  };
  CMDS['new-netipaddress'] = (t) => {
    const { p } = parseParams(t);
    const nic = p.interfacealias || 'Ethernet0';
    if (!p.ipaddress) return [E('New-NetIPAddress : ต้องระบุ -IPAddress')];
    st.nics[nic] ||= { dns: [], mac: '00-15-5D-01-0A-02', status: 'Up' };
    st.nics[nic].ip = p.ipaddress;
    st.nics[nic].prefix = +(p.prefixlength || 24);
    if (p.defaultgateway) st.nics[nic].gw = p.defaultgateway;
    st.nics[nic].dhcp = false;
    return table(['IPAddress', 'PrefixLength', 'InterfaceAlias'], [[p.ipaddress, String(p.prefixlength || 24), nic]]);
  };
  CMDS['set-dnsclientserveraddress'] = (t) => {
    const { p } = parseParams(t);
    const nic = p.interfacealias || 'Ethernet0';
    if (!st.nics[nic]) return [E('Set-DnsClientServerAddress : ไม่พบ interface')];
    st.nics[nic].dns = String(p.serveraddresses || '').replace(/[()]/g, '').split(',').map(s => s.trim()).filter(Boolean);
    return [];
  };
  CMDS['test-netconnection'] = (t) => {
    const { p, pos } = parseParams(t);
    const host = p.computername || pos[0];
    if (!host) return [E('Test-NetConnection : ต้องระบุปลายทาง')];
    const ok = st.hosts[host] !== undefined || host === st.nics.Ethernet0.gw || /^127\./.test(host);
    const port = p.port;
    return ['', `ComputerName           : ${host}`, `RemoteAddress          : ${host}`,
      ...(port ? [`RemotePort             : ${port}`, `TcpTestSucceeded       : ${ok ? 'True' : 'False'}`] : []),
      `PingSucceeded          : ${ok ? 'True' : 'False'}`,
      `PingReplyDetails (RTT) : ${ok ? '1 ms' : '0 ms'}`, ''];
  };

  CMDS['add-dhcpserverv4scope'] = (t) => {
    const { p } = parseParams(t);
    if (!st.features.has('DHCP')) return [E('ต้องติดตั้ง feature DHCP ก่อน')];
    if (!p.name || !p.startrange || !p.endrange) return [E('ต้องระบุ -Name -StartRange -EndRange -SubnetMask')];
    st.dhcpScopes.push({ name: p.name, start: p.startrange, end: p.endrange, mask: p.subnetmask || '255.255.255.0', state: 'Active' });
    return [];
  };
  CMDS['get-dhcpserverv4scope'] = () => st.dhcpScopes.length
    ? table(['ScopeId', 'SubnetMask', 'Name', 'State', 'StartRange', 'EndRange'],
      st.dhcpScopes.map(s => [s.start.split('.').slice(0, 3).join('.') + '.0', s.mask, s.name, s.state, s.start, s.end]))
    : [D('(ยังไม่มี scope)')];
  CMDS['add-dnsserverprimaryzone'] = (t) => {
    const { p } = parseParams(t);
    if (!st.features.has('DNS')) return [E('ต้องติดตั้ง feature DNS ก่อน')];
    st.dnsZones.push({ name: p.name, type: 'Primary', dynamic: p.dynamicupdate || 'None' });
    return [];
  };
  CMDS['get-dnsserverzone'] = () => st.dnsZones.length
    ? table(['ZoneName', 'ZoneType', 'IsAutoCreated', 'IsDsIntegrated'], st.dnsZones.map(z => [z.name, z.type, 'False', String(st.isDC)]))
    : [D('(ยังไม่มี zone)')];

  CMDS['new-smbshare'] = (t) => {
    const { p } = parseParams(t);
    if (!p.name || !p.path) return [E('New-SmbShare : ต้องระบุ -Name และ -Path')];
    st.shares[p.name] = { path: p.path, desc: p.description || '', full: p.fullaccess || '' };
    return table(['Name', 'ScopeName', 'Path', 'Description'], [[p.name, '*', p.path, p.description || '']]);
  };
  CMDS['get-smbshare'] = () => table(['Name', 'ScopeName', 'Path', 'Description'],
    Object.entries(st.shares).map(([k, s]) => [k, '*', s.path, s.desc]));

  CMDS['rename-computer'] = (t) => {
    const { p, pos } = parseParams(t);
    const n = p.newname || pos[0];
    if (!n) return [E('Rename-Computer : ต้องระบุ -NewName')];
    st.hostname = n;
    return [H('WARNING: The changes will take effect after you restart the computer ' + n)];
  };
  CMDS['add-computer'] = (t) => {
    const { p } = parseParams(t);
    if (!p.domainname) return [E('Add-Computer : ต้องระบุ -DomainName')];
    st.domain = p.domainname;
    return [H('WARNING: The changes will take effect after you restart the computer.')];
  };
  CMDS['get-computerinfo'] = () => kvList({
    CsName: st.hostname, CsDomain: st.domain || st.workgroup,
    WindowsProductName: 'Windows Server 2022 Datacenter', WindowsVersion: '21H2',
    OsBuildNumber: '20348', CsNumberOfLogicalProcessors: 4,
    CsTotalPhysicalMemory: '8589934592', OsArchitecture: '64-bit',
  });
  CMDS['restart-computer'] = () => [H('(lab นี้ไม่รีบูตจริง)')];

  CMDS['get-process'] = () => table(['Handles', 'NPM(K)', 'PM(K)', 'WS(K)', 'CPU(s)', 'Id', 'ProcessName'],
    st.processes.map(p => ['412', '22', String(Math.round(p.mem / 4)), String(p.mem), p.cpu.toFixed(2), String(p.pid), p.name.replace(/.exe$/, '')]));
  CMDS['stop-process'] = (t) => {
    const { p, pos } = parseParams(t);
    const key = p.id || p.name || pos[0];
    const i = st.processes.findIndex(x => String(x.pid) === String(key) || x.name.toLowerCase().replace(/.exe$/, '') === String(key).toLowerCase().replace(/.exe$/, ''));
    if (i < 0) return [E('Stop-Process : Cannot find a process with the name or id "' + key + '"')];
    st.processes.splice(i, 1); return [];
  };
  CMDS['get-eventlog'] = (t) => {
    const { p, pos } = parseParams(t);
    const log = p.logname || pos[0] || 'System';
    return table(['Index', 'Time', 'EntryType', 'Source', 'Message'], [
      ['4412', 'Aug 21 09:12', 'Information', 'Service Control Manager', 'The Windows Time service entered the running state.'],
      ['4411', 'Aug 21 09:05', 'Warning', 'DNS', 'The DNS server could not resolve upstream.'],
      ['4410', 'Aug 21 08:55', 'Error', 'DCOM', 'DCOM got error "1084" attempting to start the service.'],
    ].map(r => r));
  };
  CMDS['get-winevent'] = (t) => CMDS['get-eventlog'](t);
  CMDS['get-executionpolicy'] = () => ['Restricted'];
  CMDS['set-executionpolicy'] = () => [D('Execution Policy Change — [Y] Yes  (ตอบ Y อัตโนมัติใน lab)'), OK('เปลี่ยนแล้ว')];
  CMDS['get-help'] = (t) => {
    const { pos } = parseParams(t);
    const n = (pos[0] || '').toLowerCase();
    return CMDS[n] ? [`NAME`, `    ${pos[0]}`, ``, `SYNOPSIS`, `    ดูตัวอย่างการใช้งานได้จาก cheat sheet ด้านขวา`, ``]
      : [D('พิมพ์ ? เพื่อดูรายการคำสั่งที่รองรับใน lab นี้')];
  };

  CMDS['get-childitem'] = (t) => {
    const { p, pos } = parseParams(t);
    const target = p.path || pos[0] || st.cwd;
    const n = fsNode(target);
    if (!n) return [E(`Get-ChildItem : Cannot find path '${resolvePath(target)}' because it does not exist.`)];
    if (!n.d) return [E('ไม่ใช่ไดเรกทอรี')];
    const rows = Object.entries(n.c).map(([k, v]) => [v.d ? 'd-----' : '-a----', '8/21/2026   9:41 AM', v.d ? '' : String(v.c.length), k]);
    if (!rows.length) return [D('(ว่าง)')];
    return ['', `    Directory: ${resolvePath(target)}`, '', ...table(['Mode', 'LastWriteTime', 'Length', 'Name'], rows)];
  };
  CMDS['set-location'] = (t) => {
    const { p, pos } = parseParams(t);
    const target = p.path || pos[0] || 'C:\\';
    const n = fsNode(target);
    if (!n || !n.d) return [E(`Set-Location : Cannot find path '${resolvePath(target)}' because it does not exist.`)];
    st.cwd = resolvePath(target).replace(/\\$/, '') || 'C:\\';
    if (/^[a-z]:$/i.test(st.cwd)) st.cwd += '\\';
    return [];
  };
  CMDS['new-item'] = (t) => {
    const { p, pos } = parseParams(t);
    const path = p.path || pos[0];
    if (!path) return [E('New-Item : ต้องระบุ -Path')];
    const { parent, name } = fsParent(path);
    if (!parent) return [E('New-Item : ไม่พบ path ปลายทาง')];
    const isDir = String(p.itemtype || '').toLowerCase() === 'directory';
    parent.c[name] = isDir ? { d: true, c: {} } : { d: false, c: String(p.value || '') };
    return ['', `    Directory: ${fsParent(path).abs.split('\\').slice(0, -1).join('\\')}`, '',
      ...table(['Mode', 'LastWriteTime', 'Length', 'Name'], [[isDir ? 'd-----' : '-a----', '8/21/2026   9:41 AM', isDir ? '' : String(p.value || '').length, name]])];
  };
  CMDS['remove-item'] = (t) => {
    const { p, pos } = parseParams(t);
    const { parent, name } = fsParent(p.path || pos[0]);
    if (!parent || !parent.c[name]) return [E('Remove-Item : Cannot find path')];
    delete parent.c[name]; return [];
  };
  CMDS['get-content'] = (t) => {
    const { p, pos } = parseParams(t);
    const n = fsNode(p.path || pos[0]);
    if (!n) return [E(`Get-Content : Cannot find path '${resolvePath(p.path || pos[0])}'`)];
    return String(n.c).split('\n');
  };
  CMDS['set-content'] = (t) => {
    const { p, pos } = parseParams(t);
    const { parent, name } = fsParent(p.path || pos[0]);
    if (!parent) return [E('Set-Content : ไม่พบ path')];
    parent.c[name] = { d: false, c: String(p.value ?? pos[1] ?? '') };
    return [];
  };
  CMDS['write-host'] = (t) => [tokenize(t.join(' ')).filter(x => !x.startsWith('-')).join(' ')];
  CMDS['write-output'] = CMDS['write-host'];
  CMDS['clear-host'] = () => ['\x00CLEAR'];
  CMDS['get-date'] = () => ['', 'Friday, August 21, 2026 9:41:33 AM', ''];
  CMDS['get-disk'] = () => table(['Number', 'Friendly Name', 'Serial Number', 'HealthStatus', 'OperationalStatus', 'Total Size', 'Partition Style'],
    [['0', 'VMware Virtual disk', '', 'Healthy', 'Online', '80 GB', 'GPT']]);
  CMDS['get-volume'] = () => table(['DriveLetter', 'FileSystemLabel', 'FileSystem', 'DriveType', 'HealthStatus', 'SizeRemaining', 'Size'],
    [['C', 'System', 'NTFS', 'Fixed', 'Healthy', '42.1 GB', '79.5 GB']]);
  CMDS['get-scheduledtask'] = () => table(['TaskPath', 'TaskName', 'State'],
    [...st.scheduledTasks.map(x => [x.path, x.name, x.state]),
    ['\\Microsoft\\Windows\\', 'ScheduledDefrag', 'Ready']]);
  CMDS['get-netfirewallprofile'] = () => table(['Name', 'Enabled', 'DefaultInboundAction'],
    [['Domain', 'True', 'Block'], ['Private', 'True', 'Block'], ['Public', 'True', 'Block']]);
  CMDS['new-netfirewallrule'] = (t) => {
    const { p } = parseParams(t);
    if (!p.displayname) return [E('New-NetFirewallRule : ต้องระบุ -DisplayName')];
    st.fwRules.push({
      name: p.displayname, dir: p.direction || 'Inbound',
      action: p.action || 'Allow', port: p.localport || '', proto: p.protocol || '',
    });
    return [OK(`สร้าง rule "${p.displayname}" แล้ว`)];
  };

  // ---------- DNS / DHCP เพิ่มเติม ----------
  CMDS['add-dnsserverresourcerecorda'] = (t) => {
    const { p } = parseParams(t);
    if (!st.features.has('DNS')) return [E('ต้องติดตั้ง feature DNS ก่อน')];
    if (!p.name || !p.zonename || !p.ipv4address) return [E('ต้องระบุ -Name -ZoneName -IPv4Address')];
    if (!st.dnsZones.some(z => z.name.toLowerCase() === String(p.zonename).toLowerCase()))
      return [E(`ไม่พบ zone "${p.zonename}" — สร้างด้วย Add-DnsServerPrimaryZone ก่อน`)];
    st.dnsRecords.push({ name: p.name, zone: p.zonename, type: 'A', data: p.ipv4address });
    return [];
  };
  CMDS['add-dnsserverresourcerecordcname'] = (t) => {
    const { p } = parseParams(t);
    if (!p.name || !p.zonename) return [E('ต้องระบุ -Name -ZoneName -HostNameAlias')];
    st.dnsRecords.push({ name: p.name, zone: p.zonename, type: 'CNAME', data: p.hostnamealias || '' });
    return [];
  };
  CMDS['get-dnsserverresourcerecord'] = (t) => {
    const { p, pos } = parseParams(t);
    const z = p.zonename || pos[0];
    const list = st.dnsRecords.filter(r => !z || r.zone.toLowerCase() === String(z).toLowerCase());
    return list.length ? table(['HostName', 'RecordType', 'RecordData'], list.map(r => [r.name, r.type, r.data]))
      : [D('(ยังไม่มี record ที่สร้างเอง)')];
  };
  CMDS['set-dhcpserverv4optionvalue'] = (t) => {
    const { p } = parseParams(t);
    const sc = st.dhcpScopes.find(s => !p.scopeid || s.start.split('.').slice(0, 3).join('.') === String(p.scopeid).split('.').slice(0, 3).join('.'));
    if (!sc) return [E('ไม่พบ scope ที่ระบุ')];
    if (p.router) sc.router = p.router;
    if (p.dnsserver) sc.dns = p.dnsserver;
    if (p.dnsdomain) sc.dnsDomain = p.dnsdomain;
    return [];
  };
  CMDS['add-dhcpserverv4reservation'] = (t) => {
    const { p } = parseParams(t);
    if (!p.ipaddress || !p.clientid) return [E('ต้องระบุ -IPAddress และ -ClientId')];
    st.dhcpReservations.push({ ip: p.ipaddress, mac: p.clientid, desc: p.description || '' });
    return [];
  };
  CMDS['get-dhcpserverv4reservation'] = () => st.dhcpReservations.length
    ? table(['IPAddress', 'ClientId', 'Description'], st.dhcpReservations.map(r => [r.ip, r.mac, r.desc]))
    : [D('(ยังไม่มี reservation)')];
  CMDS['add-dhcpserverindc'] = () => { st.dhcpAuthorized = true; return [OK('DHCP server ถูก authorize ใน AD แล้ว')]; };
  CMDS['get-dhcpserverindc'] = () => st.dhcpAuthorized
    ? table(['IPAddress', 'DnsName'], [[st.nics.Ethernet0.ip, `${st.hostname}.${st.domain || 'local'}`]])
    : [D('(ยังไม่ได้ authorize DHCP ใน AD)')];

  // ---------- Group Policy ----------
  CMDS['new-gpo'] = (t) => {
    const { p, pos } = parseParams(t);
    const n = p.name || pos[0];
    if (!n) return [E('New-GPO : ต้องระบุ -Name')];
    if (st.gpos.includes(n)) return [E(`GPO "${n}" มีอยู่แล้ว`)];
    st.gpos.push(n);
    return kvList({ DisplayName: n, DomainName: st.domain || '', Owner: 'Domain Admins', GpoStatus: 'AllSettingsEnabled' });
  };
  CMDS['get-gpo'] = () => table(['DisplayName', 'GpoStatus'], st.gpos.map(g => [g, 'AllSettingsEnabled']));
  CMDS['new-gplink'] = (t) => {
    const { p, pos } = parseParams(t);
    const n = p.name || pos[0];
    if (!st.gpos.includes(n)) return [E(`ไม่พบ GPO "${n}"`)];
    if (!p.target) return [E('ต้องระบุ -Target (distinguished name ของ OU)')];
    st.gpLinks.push({ gpo: n, target: p.target, enforced: p.enforced || 'No' });
    return [];
  };
  CMDS['get-gplink'] = () => st.gpLinks.length
    ? table(['GPO', 'Target', 'Enforced'], st.gpLinks.map(l => [l.gpo, l.target, l.enforced]))
    : [D('(ยังไม่ได้ link GPO)')];

  // ---------- AD เพิ่มเติม ----------
  CMDS['enable-adoptionalfeature'] = (t) => {
    const { p, pos } = parseParams(t);
    const id = String(p.identity || pos[0] || '');
    if (!/recycle/i.test(id)) return [E('รองรับเฉพาะ "Recycle Bin Feature" ใน lab นี้')];
    if (!st.domain) return [E('ต้องมี AD ก่อน')];
    st.recycleBin = true;
    return [H('คำเตือน: เปิดแล้วย้อนกลับไม่ได้'), OK('เปิด AD Recycle Bin เรียบร้อย')];
  };
  CMDS['get-adoptionalfeature'] = () => table(['Name', 'Enabled'], [['Recycle Bin Feature', String(st.recycleBin)]]);
  CMDS['get-adforest'] = () => st.domain
    ? kvList({ Name: st.domain, ForestMode: 'Windows2016Forest', RootDomain: st.domain, SchemaMaster: `${st.hostname}.${st.domain}`, DomainNamingMaster: `${st.hostname}.${st.domain}` })
    : [E('Get-ADForest : ไม่พบ Active Directory')];
  CMDS['new-adreplicationsite'] = (t) => {
    const { p, pos } = parseParams(t);
    const n = p.name || pos[0];
    if (!n) return [E('ต้องระบุ -Name')];
    st.adSites.push(n); return [];
  };
  CMDS['get-adreplicationsite'] = () => table(['Name'], st.adSites.map(s => [s]));
  CMDS['new-adreplicationsubnet'] = (t) => {
    const { p, pos } = parseParams(t);
    const n = p.name || pos[0];
    if (!n || !p.site) return [E('ต้องระบุ -Name และ -Site')];
    if (!st.adSites.includes(p.site)) return [E(`ไม่พบ site "${p.site}"`)];
    st.adSubnets.push({ name: n, site: p.site });
    return [];
  };
  CMDS['get-adreplicationsubnet'] = () => st.adSubnets.length
    ? table(['Name', 'Site'], st.adSubnets.map(s => [s.name, s.site]))
    : [D('(ยังไม่ได้ประกาศ subnet)')];

  // ---------- Hyper-V ----------
  CMDS['new-vmswitch'] = (t) => {
    const { p, pos } = parseParams(t);
    const n = p.name || pos[0];
    if (!st.features.has('Hyper-V')) return [E('ต้องติดตั้ง role Hyper-V ก่อน')];
    if (!n) return [E('ต้องระบุ -Name')];
    const type = p.switchtype || (p.netadaptername ? 'External' : 'Internal');
    st.vmSwitches.push({ name: n, type });
    return table(['Name', 'SwitchType', 'NetAdapterInterfaceDescription'], [[n, type, p.netadaptername || '']]);
  };
  CMDS['get-vmswitch'] = () => st.vmSwitches.length
    ? table(['Name', 'SwitchType'], st.vmSwitches.map(s => [s.name, s.type]))
    : [D('(ยังไม่มี virtual switch)')];
  CMDS['new-vm'] = (t) => {
    const { p, pos } = parseParams(t);
    const n = p.name || pos[0];
    if (!st.features.has('Hyper-V')) return [E('ต้องติดตั้ง role Hyper-V ก่อน')];
    if (!n) return [E('ต้องระบุ -Name')];
    if (p.switchname && !st.vmSwitches.some(s => s.name === p.switchname))
      return [E(`ไม่พบ virtual switch "${p.switchname}"`)];
    st.vms.push({ name: n, state: 'Off', mem: p.memorystartupbytes || '2GB', gen: p.generation || '2', sw: p.switchname || '' });
    return table(['Name', 'State', 'CPUUsage(%)', 'MemoryAssigned(M)', 'Status'], [[n, 'Off', '0', '0', 'Operating normally']]);
  };
  CMDS['get-vm'] = () => st.vms.length
    ? table(['Name', 'State', 'Generation', 'MemoryStartup', 'SwitchName'], st.vms.map(v => [v.name, v.state, v.gen, v.mem, v.sw]))
    : [D('(ยังไม่มี VM)')];
  CMDS['start-vm'] = (t) => {
    const { p, pos } = parseParams(t);
    const v = st.vms.find(x => x.name.toLowerCase() === String(p.name || pos[0]).toLowerCase());
    if (!v) return [E('ไม่พบ VM')];
    v.state = 'Running'; return [];
  };
  CMDS['stop-vm'] = (t) => {
    const { p, pos } = parseParams(t);
    const v = st.vms.find(x => x.name.toLowerCase() === String(p.name || pos[0]).toLowerCase());
    if (!v) return [E('ไม่พบ VM')];
    v.state = 'Off'; return [];
  };
  CMDS['set-vm'] = (t) => {
    const { p, pos } = parseParams(t);
    const v = st.vms.find(x => x.name.toLowerCase() === String(p.name || pos[0]).toLowerCase());
    if (!v) return [E('ไม่พบ VM')];
    if (p.dynamicmemory !== undefined) v.dynamic = true;
    return [];
  };

  // ---------- ความปลอดภัย ----------
  CMDS['disable-windowsoptionalfeature'] = (t) => {
    const { p } = parseParams(t);
    if (/smb1/i.test(String(p.featurename || ''))) { st.smb1 = false; return [OK('ปิด SMBv1 เรียบร้อย (ต้องรีสตาร์ทในระบบจริง)')]; }
    return [OK('ปิด feature เรียบร้อย')];
  };
  CMDS['get-windowsoptionalfeature'] = () => table(['FeatureName', 'State'],
    [['SMB1Protocol', st.smb1 ? 'Enabled' : 'Disabled'], ['TelnetClient', 'Disabled']]);
  CMDS['get-smbserverconfiguration'] = () => kvList({ EnableSMB1Protocol: String(st.smb1), EnableSMB2Protocol: 'True', RequireSecuritySignature: 'False' });
  CMDS['set-smbserverconfiguration'] = (t) => {
    const { p } = parseParams(t);
    if (p.enablesmb1protocol !== undefined) st.smb1 = /true/i.test(p.enablesmb1protocol);
    return [];
  };
  CMDS['get-netfirewallrule'] = () => st.fwRules.length
    ? table(['DisplayName', 'Direction', 'Action', 'Enabled'], st.fwRules.map(r => [r.name, r.dir, r.action, 'True']))
    : [D('(ยังไม่ได้สร้าง rule เอง)')];
  CMDS['new-scheduledtask'] = (t) => {
    const { p } = parseParams(t);
    if (!p.taskname) return [E('ต้องระบุ -TaskName')];
    st.scheduledTasks.push({ name: p.taskname, path: '\\', state: 'Ready' });
    return [];
  };
  CMDS['register-scheduledtask'] = (t) => CMDS['new-scheduledtask'](t);

  // aliases
  alias('gsv', 'get-service'); alias('sasv', 'start-service'); alias('spsv', 'stop-service');
  alias('gci', 'get-childitem'); alias('dir', 'get-childitem'); alias('ls', 'get-childitem');
  alias('cd', 'set-location'); alias('sl', 'set-location'); alias('chdir', 'set-location');
  alias('cat', 'get-content'); alias('type', 'get-content'); alias('gc', 'get-content');
  alias('echo', 'write-host'); alias('cls', 'clear-host'); alias('clear', 'clear-host');
  alias('ps', 'get-process'); alias('gps', 'get-process'); alias('del', 'remove-item'); alias('ri', 'remove-item');
  alias('ni', 'new-item'); alias('md', 'new-item'); alias('mkdir', 'new-item');

  // ---------- non-cmdlet (cmd.exe) ----------
  function cmdExe(cmd, args, raw) {
    switch (cmd) {
      case 'ipconfig': {
        const flag = args.map(a => a.toLowerCase()).find(a => a.startsWith('/')) || '';
        if (flag === '/flushdns') { st.dnsCache = []; return ['', 'Windows IP Configuration', '', OK('Successfully flushed the DNS Resolver Cache.')]; }
        if (flag === '/displaydns') {
          if (!st.dnsCache.length) return ['', 'Windows IP Configuration', '', D('Could not display the DNS Resolver Cache. (ว่างเปล่า)')];
          const out = ['', 'Windows IP Configuration', ''];
          st.dnsCache.forEach(c => out.push(`    ${c.name}`, '    ----------------------------------------',
            `    Record Name . . . . . : ${c.name}`, `    Record Type . . . . . : 1`,
            `    Time To Live  . . . . : ${c.ttl}`, `    A (Host) Record . . . : ${c.data}`, ''));
          return out;
        }
        if (flag === '/release') {
          Object.values(st.nics).forEach(n => { if (n.dhcp) { n.oldIp = n.ip; n.ip = '0.0.0.0'; n.gw = ''; } });
          const anyDhcp = Object.values(st.nics).some(n => n.dhcp);
          return anyDhcp
            ? ['', 'Windows IP Configuration', '', 'Ethernet adapter Ethernet0:', '',
              '   Connection-specific DNS Suffix  . :', '   IPv4 Address. . . . . . . . . . . : 0.0.0.0',
              '   Subnet Mask . . . . . . . . . . . : 0.0.0.0', '   Default Gateway . . . . . . . . . :', '']
            : ['', 'Windows IP Configuration', '',
              D('No operation can be performed on Ethernet0 while it has its media disconnected'),
              D('(การ์ดใบนี้ตั้ง IP แบบ static — /release ใช้ได้เฉพาะการ์ดที่รับ IP จาก DHCP)')];
        }
        if (flag === '/renew') {
          const anyDhcp = Object.values(st.nics).some(n => n.dhcp);
          if (!anyDhcp) return ['', 'Windows IP Configuration', '',
            D('(การ์ดใบนี้ตั้ง IP แบบ static — /renew ไม่มีผล)')];
          Object.values(st.nics).forEach(n => { if (n.dhcp) { n.ip = n.oldIp || '192.168.10.117'; n.gw = st.hosts && '192.168.10.1'; } });
          return ['', 'Windows IP Configuration', '', 'Ethernet adapter Ethernet0:', '',
            `   IPv4 Address. . . . . . . . . . . : ${st.nics.Ethernet0.ip}`,
            '   Subnet Mask . . . . . . . . . . . : 255.255.255.0',
            `   Default Gateway . . . . . . . . . : ${st.nics.Ethernet0.gw}`, ''];
        }
        if (flag === '/registerdns') return ['', 'Windows IP Configuration', '',
          OK('Registration of the DNS resource records for all adapters has been initiated.')];
        const all = args.some(a => /^\/all$/i.test(a));
        const out = ['', 'Windows IP Configuration', ''];
        if (all) out.push(`   Host Name . . . . . . . . . . . . : ${st.hostname}`,
          `   Primary Dns Suffix  . . . . . . . : ${st.domain || ''}`,
          `   Node Type . . . . . . . . . . . . : Hybrid`, '');
        Object.entries(st.nics).forEach(([k, n]) => {
          out.push(`Ethernet adapter ${k}:`, '');
          out.push(`   Connection-specific DNS Suffix  . : ${st.domain || ''}`);
          if (all) out.push(`   Physical Address. . . . . . . . . : ${n.mac}`,
            `   DHCP Enabled. . . . . . . . . . . : ${n.dhcp ? 'Yes' : 'No'}`);
          out.push(`   IPv4 Address. . . . . . . . . . . : ${n.ip}`,
            `   Subnet Mask . . . . . . . . . . . : ${['0.0.0.0', '128.0.0.0', '255.0.0.0'][0] && n.prefix === 24 ? '255.255.255.0' : '255.255.0.0'}`,
            `   Default Gateway . . . . . . . . . : ${n.gw || ''}`);
          if (all) out.push(`   DNS Servers . . . . . . . . . . . : ${n.dns.join('\n                                       ')}`);
          out.push('');
        });


        return out;
      }
      case 'hostname': return [st.hostname];
      case 'ping': {
        const host = args.find(a => !a.startsWith('-') && !a.startsWith('/'));
        if (!host) return [E('Usage: ping target_name')];
        const ok = st.hosts[host] !== undefined || host === st.nics.Ethernet0.gw || /^127\./.test(host);
        const out = ['', `Pinging ${host} with 32 bytes of data:`];
        for (let i = 0; i < 4; i++) out.push(ok ? `Reply from ${host}: bytes=32 time=1ms TTL=128` : E('Request timed out.'));
        out.push('', `Ping statistics for ${host}:`,
          ok ? OK('    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),') : E('    Packets: Sent = 4, Received = 0, Lost = 4 (100% loss),'));
        return out;
      }
      case 'net': {
        const sub = (args[0] || '').toLowerCase();
        if (sub === 'user') {
          if (args.length === 1) return ['', `User accounts for \\\\${st.hostname}`, '', '-------------------------------------------------------------------',
            Object.keys(st.localUsers).map(u => pad(u, 24)).join(''), 'The command completed successfully.', ''];
          if (args[2] && args.includes('/add')) { st.localUsers[args[1]] = { enabled: true, desc: '', groups: ['Users'] }; return [OK('The command completed successfully.')]; }
          return [OK('The command completed successfully.')];
        }
        if (sub === 'localgroup') return ['', `Aliases for \\\\${st.hostname}`, '', ...Object.keys(st.localGroups).map(g => `*${g}`), '', 'The command completed successfully.'];
        if (sub === 'share') return ['Share name   Resource                        Remark', '-------------------------------------------------------------',
          ...Object.entries(st.shares).map(([k, s]) => `${pad(k, 12)} ${pad(s.path, 31)} ${s.desc}`), 'The command completed successfully.'];
        if (sub === 'start' || sub === 'stop') {
          const k = Object.keys(st.services).find(x => x.toLowerCase() === String(args[1]).toLowerCase());
          if (!k) return [E('The service name is invalid.')];
          st.services[k].status = sub === 'start' ? 'Running' : 'Stopped';
          return [OK(`The ${st.services[k].display} service was ${sub}ed successfully.`)];
        }
        return [D('(net: รองรับ user / localgroup / share / start / stop)')];
      }
      // ---------------- คำสั่งเครือข่ายพื้นฐาน ----------------
      case 'tracert': case 'traceroute': {
        const host = args.find(a => !a.startsWith('-') && !a.startsWith('/'));
        if (!host) return [E('Usage: tracert [-d] target_name')];
        const ok = st.hosts[host] !== undefined || host === st.nics.Ethernet0.gw;
        const out = ['', `Tracing route to ${host} over a maximum of 30 hops`, ''];
        out.push(`  1     1 ms     1 ms     1 ms  ${st.nics.Ethernet0.gw}`);
        if (ok) {
          out.push('  2     8 ms     7 ms     9 ms  10.0.0.1');
          out.push(`  3    14 ms    12 ms    13 ms  ${host}`);
          out.push('', 'Trace complete.');
        } else {
          out.push(E('  2     *        *        *     Request timed out.'));
          out.push(E('  3     *        *        *     Request timed out.'));
          out.push('', D('(ปลายทางไม่ตอบ — หยุดที่ hop ที่ไปไม่ถึง)'));
        }
        return out;
      }
      case 'pathping': return ['', `Tracing route to ${args[0] || 'target'} over a maximum of 30 hops`,
        `  0  ${st.hostname} [${st.nics.Ethernet0.ip}]`, `  1  ${st.nics.Ethernet0.gw}`, '',
        'Computing statistics for 25 seconds...',
        'Hop  RTT    Lost/Sent = Pct  Address',
        `  1    1ms     0/ 100 =  0%   ${st.nics.Ethernet0.gw}`, '', 'Trace complete.'];

      case 'netstat': {
        const f = args.join(' ').toLowerCase();
        const out = ['', 'Active Connections', '',
          '  Proto  Local Address          Foreign Address        State' + (/-o/.test(f) ? '           PID' : '')];
        const rows = [
          ['TCP', '0.0.0.0:135', '0.0.0.0:0', 'LISTENING', 812],
          ['TCP', '0.0.0.0:445', '0.0.0.0:0', 'LISTENING', 4],
          ['TCP', `${st.nics.Ethernet0.ip}:3389`, '0.0.0.0:0', 'LISTENING', 1508],
          ['TCP', `${st.nics.Ethernet0.ip}:49712`, '142.250.185.4:443', 'ESTABLISHED', 2288],
          ['UDP', '0.0.0.0:53', '*:*', '', 652],
        ];
        if (st.services.W3SVC.status === 'Running') rows.splice(2, 0, ['TCP', '0.0.0.0:80', '0.0.0.0:0', 'LISTENING', 4]);
        if (st.services.DHCPServer.status === 'Running') rows.push(['UDP', '0.0.0.0:67', '*:*', '', 812]);
        rows.forEach(r => out.push(`  ${pad(r[0], 6)} ${pad(r[1], 22)} ${pad(r[2], 22)} ${pad(r[3], 15)}${/-o/.test(f) ? r[4] : ''}`));
        if (/-b/.test(f)) out.push('', D('(-b แสดงชื่อ executable ที่เปิดพอร์ต — ต้องรันเป็น Administrator)'));
        out.push('');
        return out;
      }
      case 'arp': {
        if (args.includes('-d')) { st.arpTable = st.arpTable.filter(a => a.type === 'static'); return [OK('ล้าง ARP cache แล้ว')]; }
        return ['', `Interface: ${st.nics.Ethernet0.ip} --- 0x5`,
          '  Internet Address      Physical Address      Type',
          ...st.arpTable.map(a => `  ${pad(a.ip, 21)} ${pad(a.mac, 21)} ${a.type}`), ''];
      }
      case 'getmac': return ['', 'Physical Address    Transport Name',
        '=================== ==========================================================',
        ...Object.entries(st.nics).map(([k, n]) => `${pad(n.mac, 19)} \\Device\\Tcpip_{${k}}`), ''];
      case 'nbtstat': return ['', `${st.nics.Ethernet0.ip}:`, '', '    NetBIOS Remote Machine Name Table', '',
        '       Name               Type         Status', '    ---------------------------------------------',
        `    ${pad(st.hostname, 15)}<00>  UNIQUE      Registered`,
        `    ${pad((st.domain || st.workgroup).split('.')[0].toUpperCase(), 15)}<00>  GROUP       Registered`, ''];

      case 'netsh': {
        const a = args.map(x => x.toLowerCase());
        // netsh interface ip show config / address
        if (a[0] && 'interface'.startsWith(a[0])) {
          if (a[1] && 'ip'.startsWith(a[1]) || a[1] === 'ipv4') {
            if (a[2] === 'show' && /config|address/.test(a[3] || 'config')) {
              const out = [];
              Object.entries(st.nics).forEach(([k, n]) => out.push('',
                `Configuration for interface "${k}"`,
                `    DHCP enabled:                         ${n.dhcp ? 'Yes' : 'No'}`,
                `    IP Address:                           ${n.ip}`,
                `    Subnet Prefix:                        ${n.ip.split('.').slice(0, 3).join('.')}.0/${n.prefix}`,
                `    Default Gateway:                      ${n.gw || '(none)'}`,
                `    Gateway Metric:                       0`,
                `    InterfaceMetric:                      25`,
                ...n.dns.map((d, i) => `    ${i === 0 ? 'Statically Configured DNS Servers:    ' : '                                          '}${d}`)));
              out.push('');
              return out;
            }
            if (a[2] === 'set' && a[3] === 'address') {
              // netsh interface ip set address "Ethernet0" static 192.168.10.10 255.255.255.0 192.168.10.1
              const nic = args.find(x => st.nics[x.replace(/"/g, '')]) || 'Ethernet0';
              const key = nic.replace(/"/g, '');
              const ips = args.filter(x => /^\d{1,3}(\.\d{1,3}){3}$/.test(x));
              if (a.includes('dhcp')) { st.nics[key].dhcp = true; return [OK('เปลี่ยนเป็นรับ IP อัตโนมัติแล้ว')]; }
              if (!ips.length) return [E('ต้องระบุ IP เช่น netsh interface ip set address "Ethernet0" static 192.168.10.10 255.255.255.0 192.168.10.1')];
              st.nics[key].ip = ips[0];
              if (ips[1]) st.nics[key].prefix = ips[1] === '255.255.255.0' ? 24 : ips[1] === '255.255.0.0' ? 16 : 24;
              if (ips[2]) st.nics[key].gw = ips[2];
              st.nics[key].dhcp = false;
              return [];
            }
            if (a[2] === 'set' && a[3] === 'dns') {
              const key = (args.find(x => st.nics[x.replace(/"/g, '')]) || 'Ethernet0').replace(/"/g, '');
              const ips = args.filter(x => /^\d{1,3}(\.\d{1,3}){3}$/.test(x));
              if (!ips.length) return [E('ต้องระบุ DNS server')];
              st.nics[key].dns = ips;
              return [];
            }
          }
          if (a[1] === 'show' && a[2] === 'interface') return ['',
            'Admin State    State          Type             Interface Name',
            '-------------------------------------------------------------------------',
            ...Object.entries(st.nics).map(([k, n]) => `Enabled        ${pad(n.status === 'Up' ? 'Connected' : 'Disconnected', 14)} Dedicated        ${k}`), ''];
          if (a[1] === 'set' && a[2] === 'interface') {
            const key = (args.find(x => st.nics[x.replace(/"/g, '')]) || '').replace(/"/g, '');
            if (st.nics[key]) st.nics[key].status = /enable/i.test(args.join(' ')) ? 'Up' : 'Down';
            return [OK('เปลี่ยนสถานะ interface แล้ว')];
          }
        }
        if (a[0] === 'wlan') {
          if (a[1] === 'show' && /profile/.test(a[2] || '')) return ['',
            `Profiles on interface Wi-Fi:`, '', 'User profiles', '-------------',
            ...st.wlanProfiles.map(p => `    All User Profile     : ${p}`), ''];
          if (a[1] === 'show' && a[2] === 'interfaces') return ['', 'There is 1 interface on the system:', '',
            '    Name                   : Wi-Fi', '    State                  : connected',
            `    SSID                   : ${st.wlanProfiles[0]}`, '    Signal                 : 82%', ''];
          if (a[1] === 'delete' && /profile/.test(a[2] || '')) {
            // ของจริงรับทั้ง name="CORP-WIFI" และ name=CORP-WIFI — ต้องตัดเครื่องหมายคำพูดออกก่อนเทียบ
            const m = args.join(' ').match(/names*=s*"([^"]+)"|names*=s*(S+)/i);
            const nm = m ? (m[1] || m[2]) : '';
            if (!nm) return [E('The parameter is incorrect. — netsh wlan delete profile name="<ชื่อโปรไฟล์>"')];
            if (!st.wlanProfiles.includes(nm)) return [E('Profile "' + nm + '" is not found on the system.')];
            st.wlanProfiles = st.wlanProfiles.filter(p => p !== nm);
            return [OK(`ลบโปรไฟล์ "${nm}" ออกจาก interface แล้ว`)];
          }
        }
        if (a[0] === 'advfirewall') {
          if (a[1] === 'show' && /allprofiles|currentprofile/.test(a[2] || '')) return ['',
            'Domain Profile Settings:', '----------------------------------------------------------------------',
            'State                                 ON', 'Firewall Policy                       BlockInbound,AllowOutbound', '',
            'Private Profile Settings:', '----------------------------------------------------------------------',
            'State                                 ON', ''];
          if (a[1] === 'firewall' && a[2] === 'add' && a[3] === 'rule') {
            const kv = {};
            args.join(' ').split(/\s+(?=[a-z]+=)/i).forEach(t => { const m = t.match(/^([a-z]+)=(.*)$/i); if (m) kv[m[1].toLowerCase()] = m[2].replace(/"/g, ''); });
            if (!kv.name) return [E('ต้องระบุ name= เช่น netsh advfirewall firewall add rule name="Allow-HTTP" dir=in action=allow protocol=TCP localport=80')];
            st.fwRules.push({ name: kv.name, dir: kv.dir === 'out' ? 'Outbound' : 'Inbound', action: (kv.action || 'allow') === 'block' ? 'Block' : 'Allow', port: kv.localport || '', proto: kv.protocol || '' });
            return [OK('Ok.')];
          }
          if (a[1] === 'set' && /profile/.test(a[2] || '')) return [OK('Ok.')];
        }
        if (a[0] === 'winsock' && a[1] === 'reset') { st.winsockReset = true; return [OK('Sucessfully reset the Winsock Catalog.'), H('You must restart the computer in order to complete the reset.')]; }
        if (a[0] === 'int' || a[0] === 'interface') return [D('netsh: ลองใช้ netsh interface ip show config')];
        return [D('netsh: lab นี้รองรับ interface ip / wlan / advfirewall / winsock reset')];
      }

      // ---------------- process / service ----------------
      case 'tasklist': {
        const svcMode = args.some(a => /^\/svc$/i.test(a));
        const out = ['', 'Image Name                     PID Session Name        Session#    Mem Usage',
          '========================= ======== ================ =========== ============'];
        st.processes.forEach(p => out.push(
          `${pad(p.name, 25)} ${lpad(p.pid, 8)} Services${' '.repeat(9)}0 ${lpad(p.mem.toLocaleString() + ' K', 12)}`));
        if (svcMode) out.push('', D('(/svc แสดง service ที่ทำงานในแต่ละ process)'));
        out.push('');
        return out;
      }
      case 'taskkill': {
        const pi = args.findIndex(a => /^\/pid$/i.test(a));
        const ii = args.findIndex(a => /^\/im$/i.test(a));
        if (pi < 0 && ii < 0) return [E('ERROR: Invalid syntax. ใช้ /PID <pid> หรือ /IM <imagename>')];
        const target = pi >= 0 ? args[pi + 1] : args[ii + 1];
        const idx = st.processes.findIndex(p => pi >= 0 ? String(p.pid) === String(target)
          : p.name.toLowerCase() === String(target).toLowerCase());
        if (idx < 0) return [E(`ERROR: The process "${target}" not found.`)];
        const p = st.processes[idx];
        st.processes.splice(idx, 1);
        return [OK(`SUCCESS: The process "${p.name}" with PID ${p.pid} has been terminated.`)];
      }
      case 'sc': {
        const sub = (args[0] || '').toLowerCase();
        const name = args[1];
        const k = Object.keys(st.services).find(x => x.toLowerCase() === String(name).toLowerCase());
        if (sub === 'query') {
          if (!k) return st.services[name] ? [] : [E(`[SC] EnumQueryServicesStatus:OpenService FAILED 1060: ไม่พบ service "${name}"`)];
          const s2 = st.services[k];
          return ['', `SERVICE_NAME: ${k}`, `        TYPE               : 10  WIN32_OWN_PROCESS`,
            `        STATE              : ${s2.status === 'Running' ? '4  RUNNING' : '1  STOPPED'}`,
            `        WIN32_EXIT_CODE    : 0  (0x0)`, ''];
        }
        if (sub === 'start' || sub === 'stop') {
          if (!k) return [E(`[SC] OpenService FAILED 1060: ไม่พบ service "${name}"`)];
          st.services[k].status = sub === 'start' ? 'Running' : 'Stopped';
          return [OK(`[SC] ${sub === 'start' ? 'StartService' : 'ControlService'} SUCCESS`)];
        }
        if (sub === 'config') {
          if (!k) return [E(`[SC] OpenService FAILED 1060`)];
          const st2 = (args.find(a => /^start=/i.test(a)) || '').split('=')[1];
          if (st2) st.services[k].start = /auto/i.test(st2) ? 'Automatic' : /disabled/i.test(st2) ? 'Disabled' : 'Manual';
          return [OK('[SC] ChangeServiceConfig SUCCESS')];
        }
        if (sub === 'queryex') return CMDS['get-service']([name]);
        return [D('sc: รองรับ query / queryex / start / stop / config')];
      }
      case 'schtasks': {
        if (args.some(a => /^\/query$/i.test(a))) return ['',
          'Folder: \\', 'TaskName                                 Next Run Time          Status',
          '======================================== ====================== ===============',
          ...st.scheduledTasks.map(t2 => `${pad(t2.name, 40)} ${pad('21/8/2569 2:00:00', 22)} ${t2.state}`), ''];
        if (args.some(a => /^\/create$/i.test(a))) {
          const ni = args.findIndex(a => /^\/tn$/i.test(a));
          const nm = ni >= 0 ? args[ni + 1].replace(/"/g, '') : 'NewTask';
          st.scheduledTasks.push({ name: nm, path: '\\', state: 'Ready' });
          return [OK(`SUCCESS: The scheduled task "${nm}" has successfully been created.`)];
        }
        return [D('schtasks: รองรับ /query และ /create /tn <name>')];
      }
      case 'reg': {
        const sub = (args[0] || '').toLowerCase();
        if (sub === 'query') return ['', args[1] || 'HKLM\\SOFTWARE',
          '    ProductName    REG_SZ    Windows Server 2022 Datacenter',
          '    CurrentBuild   REG_SZ    20348', ''];
        if (sub === 'add') return [OK('The operation completed successfully.')];
        return [D('reg: รองรับ query / add')];
      }

      // ---------------- ระบบ / ดิสก์ / ไฟล์ ----------------
      case 'chkdsk': return ['The type of the file system is NTFS.', '',
        'WARNING!  /F parameter not specified. Running CHKDSK in read-only mode.', '',
        'Stage 1: Examining basic file system structure ...', '  42891 file records processed.',
        'Stage 2: Examining file name linkage ...', '  53210 index entries processed.', '',
        OK('Windows has scanned the file system and found no problems.'),
        '  83,361,788 KB total disk space.', '  44,120,556 KB available on disk.'];
      case 'driverquery': return ['', 'Module Name  Display Name           Driver Type   Link Date',
        '============ ====================== ============= ======================',
        'ACPI         Microsoft ACPI Driver  Kernel        6/5/2022 3:22:15 AM',
        'netvsc       Hyper-V Network Adapt  Kernel        6/5/2022 3:22:15 AM',
        'storvsc      Storage VSC Driver     Kernel        6/5/2022 3:22:15 AM', ''];
      case 'wmic': {
        const q = args.join(' ').toLowerCase();
        if (/logicaldisk/.test(q)) return ['DeviceID  FreeSpace     Size          VolumeName',
          'C:        45179449344   85362470912   System'];
        if (/os get/.test(q)) return ['Caption                                     Version', 'Microsoft Windows Server 2022 Datacenter    10.0.20348'];
        if (/cpu/.test(q)) return ['Name', 'Intel(R) Xeon(R) Gold 6248R CPU @ 3.00GHz'];
        if (/product/.test(q)) return ['Name                          Version', 'Microsoft Edge                121.0.2277.98'];
        return [D('wmic: ลอง wmic logicaldisk get / wmic os get caption,version / wmic cpu get name')];
      }
      case 'powercfg': return args.some(a => /list/i.test(a))
        ? ['', 'Existing Power Schemes (* Active)', '-----------------------------------',
          'Power Scheme GUID: 381b4222-f694-41f0-9685-ff5bb260df2e  (Balanced) *',
          'Power Scheme GUID: 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c  (High performance)', '']
        : [D('powercfg: ลอง powercfg /list')];
      case 'dir': {
        const p = args.filter(a => !a.startsWith('/'))[0] || st.cwd;
        const n = fsNode(p);
        if (!n) return [E(`File Not Found`)];
        if (!n.d) return [E('ไม่ใช่ไดเรกทอรี')];
        const out = ['', ` Volume in drive C has no label.`, ` Directory of ${resolvePath(p)}`, ''];
        const ks = Object.keys(n.c);
        ks.forEach(k => {
          const v = n.c[k];
          out.push(`21/08/2569  09:41 ${v.d ? '    <DIR>          ' : lpad(String(v.c.length), 16) + ' '}${k}`);
        });
        out.push(`${lpad(ks.filter(k => !n.c[k].d).length, 15)} File(s)`,
          `${lpad(ks.filter(k => n.c[k].d).length, 15)} Dir(s)  45,179,449,344 bytes free`, '');
        return out;
      }
      case 'cd': case 'chdir': return args.length ? CMDS['set-location'](args) : [st.cwd];
      case 'type': return CMDS['get-content'](args);
      case 'md': case 'mkdir': return CMDS['new-item'](['-Path', args[0], '-ItemType', 'Directory']);
      case 'del': case 'erase': return CMDS['remove-item'](['-Path', args[0]]);
      case 'copy': case 'xcopy': case 'robocopy': {
        const f = args.filter(a => !a.startsWith('/'));
        if (f.length < 2) return [E('ต้องระบุต้นทางและปลายทาง')];
        const src = fsNode(f[0]);
        if (!src) return [E(`The system cannot find the file specified: ${f[0]}`)];
        const dst = fsNode(f[1]);
        const nm = f[0].split('\\').pop();
        const clone = JSON.parse(JSON.stringify(src));
        if (dst && dst.d) dst.c[nm] = clone;
        else { const { parent, name } = fsParent(f[1]); if (!parent) return [E('ปลายทางไม่ถูกต้อง')]; parent.c[name] = clone; }
        return [OK('        1 file(s) copied.')];
      }
      case 'findstr': case 'find': {
        const pat = args.find(a => !a.startsWith('/'))?.replace(/"/g, '') || '';
        const fname = args.filter(a => !a.startsWith('/')).slice(1)[0];
        const n = fname ? fsNode(fname) : null;
        if (fname && !n) return [E(`FINDSTR: Cannot open ${fname}`)];
        const lines = n ? String(n.c).split('\n') : [];
        const hit = lines.filter(l => l.toLowerCase().includes(pat.toLowerCase()));
        return hit.length ? hit : [D('(ไม่พบข้อความที่ค้นหา)')];
      }
      case 'icacls': {
        const p = args[0];
        if (!p) return [E('ต้องระบุ path')];
        if (args.some(a => /^\/grant/i.test(a))) return [OK(`processed file: ${p}`), OK('Successfully processed 1 files; Failed processing 0 files')];
        const n = fsNode(p);
        if (!n) return [E(`${p}: The system cannot find the file specified.`)];
        return [`${resolvePath(p)} BUILTIN\\Administrators:(OI)(CI)(F)`,
          '                       NT AUTHORITY\\SYSTEM:(OI)(CI)(F)',
          '                       BUILTIN\\Users:(OI)(CI)(RX)', '',
          'Successfully processed 1 files; Failed processing 0 files'];
      }
      case 'attrib': return [`A          ${resolvePath(args[0] || st.cwd)}`];
      case 'set': {
        if (!args.length) return ['COMPUTERNAME=' + st.hostname, 'OS=Windows_NT',
          'PATH=C:\\Windows\\system32;C:\\Windows', 'USERDOMAIN=' + (st.domain || st.workgroup),
          'USERNAME=' + st.user, 'USERPROFILE=C:\\Users\\' + st.user];
        return [];
      }
      case 'ver': return ['', 'Microsoft Windows [Version 10.0.20348.2340]', ''];
      case 'assoc': return ['.txt=txtfile', '.log=txtfile', '.ps1=Microsoft.PowerShellScript.1'];
      case 'cls': return ['\x00CLEAR'];
      case 'time': return ['The current time is: 9:41:33.12'];
      case 'echo': return [args.join(' ')];
      case 'systeminfo': return kvList({
        'Host Name': st.hostname, 'OS Name': 'Microsoft Windows Server 2022 Datacenter',
        'OS Version': '10.0.20348 N/A Build 20348', 'System Type': 'x64-based PC',
        'Domain': st.domain || st.workgroup, 'Total Physical Memory': '8,192 MB',
      });
      case 'gpupdate': return ['Updating policy...', '', OK('Computer Policy update has completed successfully.'), OK('User Policy update has completed successfully.')];
      case 'gpresult': return ['', `RSOP data for ${st.domain || st.workgroup}\\${st.user} on ${st.hostname} : Logging Mode`, '',
        'Applied Group Policy Objects', ...st.gpos.map(g => '    ' + g)];
      case 'nslookup': return ['', `Server:  ${st.nics.Ethernet0.dns[0]}`, `Address:  ${st.nics.Ethernet0.dns[0]}`, '',
        `Name:    ${args[0] || 'example.com'}`, `Address:  93.184.216.34`, ''];
      case 'route': {
        const sub = (args[0] || 'print').toLowerCase();
        const nic = st.nics.Ethernet0;
        if (sub === 'print') {
          const net = nic.ip.split('.').slice(0, 3).join('.');
          const out = ['', '===========================================================================',
            'Interface List', ` 5...${nic.mac} ......Intel(R) 82574L Gigabit Network Connection`,
            ' 1...........................Software Loopback Interface 1',
            '===========================================================================', '',
            'IPv4 Route Table', '===========================================================================',
            'Active Routes:', 'Network Destination        Netmask          Gateway       Interface  Metric',
            `          0.0.0.0          0.0.0.0  ${pad(nic.gw || 'On-link', 15)} ${pad(nic.ip, 15)}    25`,
            `        127.0.0.0        255.0.0.0         On-link         127.0.0.1    331`,
            `      ${pad(net + '.0', 15)}    255.255.255.0         On-link   ${pad(nic.ip, 15)}    281`];
          st.staticRoutes.forEach(r => out.push(`  ${pad(r.dst, 15)} ${pad(r.mask, 16)} ${pad(r.gw, 15)} ${pad(nic.ip, 15)} ${lpad(r.metric, 6)}`));
          out.push('===========================================================================', '',
            'Persistent Routes:');
          const per = st.staticRoutes.filter(r => r.persistent);
          if (per.length) {
            out.push('  Network Address          Netmask  Gateway Address  Metric');
            per.forEach(r => out.push(`  ${pad(r.dst, 15)} ${pad(r.mask, 16)} ${pad(r.gw, 16)} ${r.metric}`));
          } else out.push('  None');
          out.push('');
          return out;
        }
        if (sub === 'add') {
          const ips = args.filter(a => /^\d{1,3}(\.\d{1,3}){3}$/.test(a));
          if (ips.length < 2) return [E('The route addition failed: ต้องระบุ destination, mask และ gateway')];
          const mi = args.findIndex(a => /^mask$/i.test(a));
          const mtI = args.findIndex(a => /^metric$/i.test(a));
          st.staticRoutes.push({
            dst: ips[0], mask: mi >= 0 ? args[mi + 1] : (ips[1] || '255.255.255.0'),
            gw: mi >= 0 ? (ips.find((x, i) => i > 0 && x !== args[mi + 1]) || ips[ips.length - 1]) : ips[ips.length - 1],
            metric: mtI >= 0 ? args[mtI + 1] : '1',
            persistent: args.some(a => /^-p$/i.test(a)),
          });
          return [OK(' OK!')];
        }
        if (sub === 'delete') {
          const d = args[1];
          const before = st.staticRoutes.length;
          st.staticRoutes = st.staticRoutes.filter(r => r.dst !== d);
          return before === st.staticRoutes.length ? [E('The route deletion failed: ไม่พบเส้นทางนี้')] : [OK(' OK!')];
        }
        return [D('route: รองรับ print / add / delete')];
      }
      case 'sfc': return ['Beginning system scan.  This process will take some time.', '', OK('Windows Resource Protection did not find any integrity violations.')];
      case 'dism': return [D('Deployment Image Servicing and Management tool'), OK('The operation completed successfully.')];
      case 'shutdown': return [D('(lab นี้ไม่ปิดเครื่องจริง)')];
      case 'whoami': return [`${(st.domain || st.hostname).toLowerCase()}\\${st.user.toLowerCase()}`];
      case 'exit': return [D('(ออกจาก session)')];
      case 'tree': return ['C:.', '├───Scripts', '├───Users', '│   └───Administrator', '└───Windows', '    └───System32'];
      default: return null;
    }
  }

  // ---------- exec ----------
  function exec(raw) {
    const line = raw.trim();
    if (!line) return [];
    st.history.push(line);
    if (line === '?') return helpList();

    // pipeline: รองรับแค่ | Format-Table / Select-Object / Where-Object แบบผ่าน ๆ
    const seg = line.split('|')[0].trim();
    const tokens = tokenize(seg);
    const cmd = tokens[0].toLowerCase();
    const args = tokens.slice(1);

    if (CMDS[cmd]) return CMDS[cmd](args);
    const c = cmdExe(cmd, args, seg);
    if (c) return c;

    if (/^[a-z]:$/i.test(cmd)) { st.cwd = cmd.toUpperCase() + '\\'; return []; }
    return [E(`${tokens[0]} : The term '${tokens[0]}' is not recognized as the name of a cmdlet, function, script file, or operable program.`),
      E('ตรวจการสะกด หรือพิมพ์ ? เพื่อดูคำสั่งที่ lab นี้รองรับ')];
  }

  function helpList() {
    return [
      D('คำสั่งที่ lab นี้รองรับ (PowerShell + cmd):'),
      '  Service    : Get-Service  Start-Service  Stop-Service  Restart-Service  Set-Service',
      '  Role       : Get-WindowsFeature  Install-WindowsFeature  Uninstall-WindowsFeature',
      '  AD         : Install-ADDSForest  Get-ADDomain  New-ADUser  Get-ADUser  New-ADGroup',
      '               Add-ADGroupMember  Get-ADGroupMember  New-ADOrganizationalUnit',
      '  Local user : Get-LocalUser  New-LocalUser  Add-LocalGroupMember  net user',
      '  Network    : Get-NetIPAddress  New-NetIPAddress  Get-NetIPConfiguration',
      '               Set-DnsClientServerAddress  Test-NetConnection  ipconfig /all  ping  nslookup',
      '  DHCP/DNS   : Add-DhcpServerv4Scope  Get-DhcpServerv4Scope  Add-DnsServerPrimaryZone  Get-DnsServerZone',
      '  Share/FW   : New-SmbShare  Get-SmbShare  Get-NetFirewallProfile  New-NetFirewallRule',
      '  System     : Rename-Computer  Add-Computer  Get-ComputerInfo  systeminfo  gpupdate /force',
      '  File       : Get-ChildItem  Set-Location  New-Item  Remove-Item  Get-Content  Set-Content',
      '  DNS record : Add-DnsServerResourceRecordA  Get-DnsServerResourceRecord',
      '  DHCP       : Set-DhcpServerv4OptionValue  Add-DhcpServerv4Reservation  Add-DhcpServerInDC',
      '  GPO        : New-GPO  New-GPLink  Get-GPO  Get-GPLink  gpresult /r',
      '  Hyper-V    : New-VMSwitch  New-VM  Start-VM  Get-VM  Get-VMSwitch',
      '  Security   : Disable-WindowsOptionalFeature  Get-SmbServerConfiguration  New-NetFirewallRule',
      '  AD ขั้นสูง  : Get-ADForest  Enable-ADOptionalFeature  New-ADReplicationSite  New-ADReplicationSubnet',
    ];
  }

  return {
    state: st,
    prompt,
    exec,
    hint: helpList,
    banner: () => [
      D('Windows PowerShell'),
      D('Copyright (C) Microsoft Corporation. All rights reserved.'),
      '',
      D('พิมพ์ ? เพื่อดูคำสั่งที่ lab นี้รองรับ'),
      '',
    ],
    completions: () => [
      'Get-Service', 'Get-Service -Name Spooler', 'Start-Service -Name W3SVC', 'Restart-Service -Name Spooler',
      'Get-WindowsFeature', 'Install-WindowsFeature -Name AD-Domain-Services -IncludeManagementTools',
      'Install-WindowsFeature -Name DHCP -IncludeManagementTools', 'Install-WindowsFeature -Name Web-Server',
      'Install-ADDSForest -DomainName corp.local', 'Get-ADDomain',
      'New-ADUser -Name "Somchai P" -SamAccountName somchai -Enabled $true',
      'Get-ADUser -Filter *', 'New-ADGroup -Name "IT-Admins" -GroupScope Global',
      'Add-ADGroupMember -Identity "IT-Admins" -Members somchai',
      'Get-LocalUser', 'New-LocalUser -Name ops1', 'Add-LocalGroupMember -Group Administrators -Member ops1',
      'Get-NetIPAddress', 'Get-NetIPConfiguration',
      'New-NetIPAddress -InterfaceAlias Ethernet0 -IPAddress 192.168.10.10 -PrefixLength 24 -DefaultGateway 192.168.10.1',
      'Set-DnsClientServerAddress -InterfaceAlias Ethernet0 -ServerAddresses 8.8.8.8',
      'Test-NetConnection 8.8.8.8', 'ipconfig /all', 'Rename-Computer -NewName SRV-DC01',
      'Add-DhcpServerv4Scope -Name "LAN" -StartRange 192.168.10.100 -EndRange 192.168.10.200 -SubnetMask 255.255.255.0',
      'New-SmbShare -Name Data -Path C:\\Scripts', 'Get-SmbShare', 'Get-Process', 'Get-ChildItem C:\\',
      'gpupdate /force', 'systeminfo',
    ],
  };
}
