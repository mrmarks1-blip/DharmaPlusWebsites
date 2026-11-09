// Dharma Practice push server (Phase 2b). The site itself is static files (the `assets` in
// wrangler.jsonc); only /api/* runs this code, and a cron every 15 minutes sends due notifications.
//
// What is stored (D1 database "dharma-push"), per phone that opts in: its push address and keys,
// its time zone, the two chosen times, and the dates we last sent / last heard "practised today".
// No counts, no names, no practice data. One tap in the app removes the row.
//
// The VAPID keys that sign our pushes are made here on first use and kept in the same database, so
// no secret has to be typed into the dashboard by anyone.
import { buildPushPayload } from './vendor/webcrypto-web-push/main.js';

const SUBJECT = 'https://slicedharma.com/ngondro/';
const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

let migrated = false;
async function migrate(db) {
  if (migrated) return; migrated = true;
  for (const sql of [
    'ALTER TABLE groups ADD COLUMN members INTEGER NOT NULL DEFAULT 1',
    'ALTER TABLE groups ADD COLUMN unit TEXT NOT NULL DEFAULT \'count\'',
    'ALTER TABLE groups ADD COLUMN meet TEXT',
    'ALTER TABLE groups ADD COLUMN admin TEXT',
    'ALTER TABLE subs ADD COLUMN sched TEXT',
    'ALTER TABLE subs ADD COLUMN sent TEXT',
  ]) { try { await db.prepare(sql).run(); } catch { /* already there */ } }
}
async function schema(db) {
  await db.batch([
    db.prepare('CREATE TABLE IF NOT EXISTS config (k TEXT PRIMARY KEY, v TEXT NOT NULL)'),
    db.prepare(`CREATE TABLE IF NOT EXISTS subs (
      id TEXT PRIMARY KEY, endpoint TEXT NOT NULL, p256dh TEXT NOT NULL, auth TEXT NOT NULL,
      tz TEXT NOT NULL, quote_time TEXT, nudge_time TEXT,
      last_done TEXT, last_quote TEXT, last_nudge TEXT, created TEXT NOT NULL)`),
    // Shared counts ("group accumulations"): a name, what is counted, a target and the total. No names of members.
    db.prepare(`CREATE TABLE IF NOT EXISTS groups (
      code TEXT PRIMARY KEY, name TEXT NOT NULL, practice TEXT NOT NULL, target INTEGER NOT NULL,
      total INTEGER NOT NULL DEFAULT 0, adds INTEGER NOT NULL DEFAULT 0, created TEXT NOT NULL, updated TEXT NOT NULL)`),
  ]);
  await migrate(db);
}

const b64url = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromB64url = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));

// The VAPID key pair: publicKey = the raw P-256 point (base64url), privateKey = its "d" (base64url).
async function vapid(db) {
  const row = await db.prepare("SELECT v FROM config WHERE k='vapid'").first();
  if (row) return JSON.parse(row.v);
  const kp = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const jwk = await crypto.subtle.exportKey('jwk', kp.privateKey);
  const pub = new Uint8Array([4, ...fromB64url(jwk.x), ...fromB64url(jwk.y)]);
  const keys = { subject: SUBJECT, publicKey: b64url(pub), privateKey: jwk.d };
  // INSERT OR IGNORE: if two first requests race, both read back the same winner.
  await db.prepare("INSERT OR IGNORE INTO config (k, v) VALUES ('vapid', ?)").bind(JSON.stringify(keys)).run();
  return JSON.parse((await db.prepare("SELECT v FROM config WHERE k='vapid'").first()).v);
}

const idOf = async endpoint => b64url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(endpoint)));
const validTz = tz => { try { new Intl.DateTimeFormat('en', { timeZone: tz }); return true; } catch { return false; } };

// Send one notification; returns false if the push service says the subscription is gone.
async function send(sub, kind, keys, extra = {}) {
  const subscription = { endpoint: sub.endpoint, expirationTime: null, keys: { p256dh: sub.p256dh, auth: sub.auth } };
  const payload = await buildPushPayload({ data: { kind, ...extra }, options: { ttl: kind === 'bell' ? 900 : 6 * 3600, urgency: 'normal', topic: kind } }, subscription, keys);
  const res = await fetch(sub.endpoint, payload);
  return !(res.status === 404 || res.status === 410);
}

// Group codes: 6 letters/digits without look-alikes (no 0/O, 1/I/L).
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const newCode = () => Array.from(crypto.getRandomValues(new Uint8Array(6)), b => CODE_CHARS[b % CODE_CHARS.length]).join('');
const clean = (s, n) => String(s || '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, n);
const groupOut = g => g && { code: g.code, name: g.name, practice: g.practice, target: g.target, total: g.total, adds: g.adds, updated: g.updated,
  members: Math.max(1, g.mc ?? g.members ?? 1), unit: g.unit || 'count', max: g.max_add || 100000, locked: !!g.pw_hash, meet: g.meet ? JSON.parse(g.meet) : null };
const cleanUrl = u => { try { const x = new URL(String(u || '')); return x.protocol === 'https:' ? x.href.slice(0, 300) : ''; } catch { return ''; } };

// ── Groups: member keys, join password, admins ──
// A phone that joins is given a random key once; the server keeps only its SHA-256 (group_members.mid).
// Every add is a row in group_adds, so an admin can remove one. groups.total is kept in step for speed.
// Passwords are kept as a salted PBKDF2 hash, never the password. Admin keys are kept hashed too
// (group_admins); the starter's older plain key in groups.admin still works.
let groupReady = false;
async function groupSchema(db) {
  if (groupReady) return;
  await db.batch([
    db.prepare('CREATE TABLE IF NOT EXISTS group_members (code TEXT NOT NULL, mid TEXT NOT NULL, created TEXT NOT NULL, blocked INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (code, mid))'),
    db.prepare('CREATE TABLE IF NOT EXISTS group_adds (id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT NOT NULL, mid TEXT NOT NULL, n INTEGER NOT NULL, at TEXT NOT NULL, removed INTEGER NOT NULL DEFAULT 0)'),
    db.prepare('CREATE INDEX IF NOT EXISTS group_adds_code ON group_adds (code, id)'),
    db.prepare('CREATE TABLE IF NOT EXISTS group_admins (code TEXT NOT NULL, khash TEXT NOT NULL, created TEXT NOT NULL, PRIMARY KEY (code, khash))'),
    db.prepare('CREATE TABLE IF NOT EXISTS group_invites (code TEXT NOT NULL, thash TEXT NOT NULL, created TEXT NOT NULL, PRIMARY KEY (code, thash))'),
    // Wrong-password tries per device (see checkPw). Rows older than a day are deleted.
    db.prepare('CREATE TABLE IF NOT EXISTS group_fails (code TEXT NOT NULL, who TEXT NOT NULL, fails INTEGER NOT NULL, until INTEGER NOT NULL, at INTEGER NOT NULL, PRIMARY KEY (code, who))'),
  ]);
  for (const sql of [
    'ALTER TABLE groups ADD COLUMN pw_salt TEXT',
    'ALTER TABLE groups ADD COLUMN pw_hash TEXT',
    'ALTER TABLE groups ADD COLUMN max_add INTEGER NOT NULL DEFAULT 100000',
    'ALTER TABLE groups ADD COLUMN fails INTEGER NOT NULL DEFAULT 0',
    'ALTER TABLE groups ADD COLUMN lock_until INTEGER NOT NULL DEFAULT 0',
    'ALTER TABLE groups ADD COLUMN closed INTEGER NOT NULL DEFAULT 0',
  ]) { try { await db.prepare(sql).run(); } catch { /* already there */ } }
  groupReady = true;
}
const sha = async s => b64url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)));
const newKey = () => b64url(crypto.getRandomValues(new Uint8Array(18)));
const sameStr = (a, b) => { a = String(a); b = String(b); if (a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0; };
const keyOK = k => typeof k === 'string' && k.length >= 8 && k.length <= 100;
const cleanPw = p => String(p == null ? '' : p).trim().slice(0, 64);
const GSQL = 'SELECT g.*, (SELECT COUNT(*) FROM group_members m WHERE m.code = g.code AND m.blocked = 0) AS mc FROM groups g WHERE g.code = ?';
const getG = (db, code) => db.prepare(GSQL).bind(code).first();

// Workers allow at most 100,000 PBKDF2 rounds.
async function pwHash(pw, salt) {
  const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveBits']);
  return b64url(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 5000 }, k, 256));   // kept low for the free plan's 10 ms CPU limit; the 5-tries lockout limits guessing
}
async function setPw(db, code, pw) {       // pw '' removes the password
  if (!pw) return db.prepare('UPDATE groups SET pw_salt = NULL, pw_hash = NULL, fails = 0, lock_until = 0 WHERE code = ?').bind(code).run();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return db.prepare('UPDATE groups SET pw_salt = ?, pw_hash = ?, fails = 0, lock_until = 0 WHERE code = ?').bind(b64url(salt), await pwHash(pw, salt), code).run();
}
// null = password fine. Otherwise the error to send. Five tries, then ten minutes' wait, for that device only
// (`who` = a hash of its internet address, the group and today's date, so it can't be traced and resets daily).
// The try is counted before the password is checked, in one statement, so a burst of guesses can't slip past.
async function checkPw(db, g, pw, who) {
  pw = cleanPw(pw);
  if (!pw) return json({ error: 'password' }, 401);
  const now = Date.now();
  await db.prepare('DELETE FROM group_fails WHERE at < ?').bind(now - 86400000).run();   // forget old tries
  const r = await db.prepare(`INSERT INTO group_fails (code, who, fails, until, at) VALUES (?1, ?2, 1, 0, ?3)
    ON CONFLICT(code, who) DO UPDATE SET fails = CASE WHEN until > ?3 THEN fails ELSE fails + 1 END, at = ?3
    RETURNING fails, until`).bind(g.code, who, now).first();
  if (r.until > now) return json({ error: 'wait', secs: Math.ceil((r.until - now) / 1000) }, 429);
  if (r.fails > 5) {
    await db.prepare('UPDATE group_fails SET fails = 0, until = ? WHERE code = ? AND who = ?').bind(now + 600000, g.code, who).run();
    return json({ error: 'wait', secs: 600 }, 429);
  }
  if (sameStr(await pwHash(pw, fromB64url(g.pw_salt)), g.pw_hash)) {
    await db.prepare('DELETE FROM group_fails WHERE code = ? AND who = ?').bind(g.code, who).run();
    return null;
  }
  return json({ error: 'wrong' }, 403);
}
async function findMember(db, code, mkey) {
  if (!keyOK(mkey)) return null;
  return db.prepare('SELECT mid, blocked FROM group_members WHERE code = ? AND mid = ?').bind(code, await sha(mkey)).first();
}
async function newMember(db, code) {       // returns the new key, or '' if the group is full
  const c = await db.prepare('SELECT COUNT(*) AS c FROM group_members WHERE code = ?').bind(code).first();
  if (c.c >= 5000) return '';
  const key = newKey();
  await db.prepare('INSERT INTO group_members (code, mid, created) VALUES (?,?,?)').bind(code, await sha(key), new Date().toISOString()).run();
  return key;
}
async function isAdmin(db, g, key) {
  if (!keyOK(key)) return false;
  const h = await sha(key);
  if (g.admin && sameStr(h, await sha(g.admin))) return true;
  return !!(await db.prepare('SELECT 1 AS x FROM group_admins WHERE code = ? AND khash = ?').bind(g.code, h).first());
}

// What an admin sees: the group, the latest adds and each member's number (join order, no names).
async function adminState(db, code, extra) {
  const g = await getG(db, code);
  const mem = (await db.prepare('SELECT mid, blocked FROM group_members WHERE code = ? ORDER BY rowid LIMIT 5000').bind(code).all()).results;   // same cap as newMember, so every member can be blocked
  const num = new Map(mem.map((x, i) => [x.mid, i + 1]));
  const adds = (await db.prepare('SELECT id, mid, n, at, removed FROM group_adds WHERE code = ? ORDER BY id DESC LIMIT 40').bind(code).all()).results;
  const sums = new Map((await db.prepare('SELECT mid, COUNT(*) AS c, SUM(n) AS s FROM group_adds WHERE code = ? AND removed = 0 GROUP BY mid').bind(code).all()).results.map(x => [x.mid, x]));
  return { ...extra, group: groupOut(g),
    adds: adds.map(a => ({ id: a.id, n: a.n, at: a.at, m: num.get(a.mid) || 0, removed: !!a.removed })),
    members: mem.map((x, i) => ({ m: i + 1, blocked: !!x.blocked, c: (sums.get(x.mid) || {}).c || 0, s: (sums.get(x.mid) || {}).s || 0 })).filter(x => x.c || x.blocked).slice(0, 60) };
}
// Take away an add (or all of one member's adds) and fix the total, in one go.
const unwind = (db, code, now, where, ...vals) => [
  db.prepare(`UPDATE groups SET total = MAX(0, total - COALESCE((SELECT SUM(n) FROM group_adds WHERE code = ? AND removed = 0 AND ${where}), 0)),
    adds = MAX(0, adds - (SELECT COUNT(*) FROM group_adds WHERE code = ? AND removed = 0 AND ${where})), updated = ? WHERE code = ?`).bind(code, ...vals, code, ...vals, now, code),
  db.prepare(`UPDATE group_adds SET removed = 1 WHERE code = ? AND removed = 0 AND ${where}`).bind(code, ...vals),
];
async function adminDo(db, g, b) {
  const code = g.code, now = new Date().toISOString();
  const midOf = async m => { m = Math.floor(Number(m)); if (!(m >= 1 && m <= 5000)) return null;
    const r = await db.prepare('SELECT mid FROM group_members WHERE code = ? ORDER BY rowid LIMIT 1 OFFSET ?').bind(code, m - 1).first(); return r && r.mid; };
  let extra = {};
  switch (b.do) {
    case undefined: case 'list': break;
    case 'remove': {
      const id = Math.floor(Number(b.id)); if (!(id >= 1)) return json({ error: 'id' }, 400);
      await db.batch(unwind(db, code, now, 'id = ?', id)); break; }
    case 'block': case 'unblock': {
      const mid = await midOf(b.m); if (!mid) return json({ error: 'member' }, 404);
      const st = [];
      if (b.do === 'block' && b.wipe === true) st.push(...unwind(db, code, now, 'mid = ?', mid));
      st.push(db.prepare('UPDATE group_members SET blocked = ? WHERE code = ? AND mid = ?').bind(b.do === 'block' ? 1 : 0, code, mid));
      await db.batch(st); break; }
    case 'max': {
      const v = Math.floor(Number(b.value)); if (!(v >= 1 && v <= 100000000)) return json({ error: 'max' }, 400);
      await db.prepare('UPDATE groups SET max_add = ?, updated = ? WHERE code = ?').bind(v, now, code).run(); break; }
    case 'password': {
      const pw = cleanPw(b.password); if (pw && pw.length < 6) return json({ error: 'password' }, 400);
      await setPw(db, code, pw); break; }
    case 'invite': {
      const token = newKey();
      await db.prepare('DELETE FROM group_invites WHERE code = ? AND created < ?').bind(code, new Date(Date.now() - 7 * 864e5).toISOString()).run();
      await db.prepare('INSERT INTO group_invites (code, thash, created) VALUES (?,?,?)').bind(code, await sha(token), now).run();
      extra = { token }; break; }
    case 'delete':
      await db.batch([
        db.prepare("UPDATE groups SET closed = 1, pw_salt = NULL, pw_hash = NULL, admin = NULL, meet = NULL, updated = ? WHERE code = ?").bind(now, code),
        db.prepare('DELETE FROM group_members WHERE code = ?').bind(code), db.prepare('DELETE FROM group_adds WHERE code = ?').bind(code),
        db.prepare('DELETE FROM group_admins WHERE code = ?').bind(code), db.prepare('DELETE FROM group_invites WHERE code = ?').bind(code)]);
      return json({ closed: true });
    default: return json({ error: 'do' }, 400);
  }
  return json(await adminState(db, code, extra));
}

async function groups(req, db, path) {
  const start = path === '/api/group' && req.method === 'POST';
  const m = path.match(/^\/api\/group\/([A-Z0-9]{6})(\/add|\/join|\/meet|\/admin|\/accept)?$/);
  if (!start && !m) return path === '/api/group' ? json({ error: 'method' }, 405) : json({ error: 'not found' }, 404);
  await groupSchema(db);
  let b = {};
  if (req.method === 'POST') {
    if (Number(req.headers.get('content-length') || 0) > 4000) return json({ error: 'too big' }, 413);
    try { b = await req.json(); } catch { return json({ error: 'json' }, 400); }
    if (!b || typeof b !== 'object' || Array.isArray(b)) return json({ error: 'json' }, 400);
  }
  if (start) {                                                      // start a group
    const name = clean(b.name, 60), practice = clean(b.practice, 80), target = Math.floor(Number(b.target)), unit = b.unit === 'minutes' ? 'minutes' : 'count';
    if (!name || !practice || !(target >= 1 && target <= 100000000)) return json({ error: 'fields' }, 400);
    const pw = cleanPw(b.password);
    if (pw && pw.length < 6) return json({ error: 'password' }, 400);
    const now = new Date().toISOString();
    for (let i = 0; i < 5; i++) {
      const code = newCode(), admin = newKey();
      const r = await db.batch([
        db.prepare('INSERT OR IGNORE INTO groups (code, name, practice, target, created, updated, unit, members) VALUES (?,?,?,?,?,?,?,1)').bind(code, name, practice, target, now, now, unit),
        db.prepare('INSERT INTO group_admins (code, khash, created) SELECT ?, ?, ? WHERE changes() > 0').bind(code, await sha(admin), now)]);
      if (r[0].meta.changes) {
        if (pw) await setPw(db, code, pw);
        const mkey = await newMember(db, code);
        return json({ ...groupOut(await getG(db, code)), key: admin, mkey });
      }
    }
    return json({ error: 'busy' }, 503);
  }
  const code = m[1], act = m[2] || '';
  const g = await getG(db, code);
  if (!g) return json({ error: 'not found' }, 404);
  if (g.closed) return json({ error: 'closed' }, 410);
  if (!act && req.method === 'GET') return json(g.pw_hash ? { code: g.code, name: g.name, locked: true } : groupOut(g));
  if (req.method !== 'POST') return json({ error: 'method' }, 405);

  if (act === '/join') {                                            // join, or just refresh when the phone already has its key
    const mem = await findMember(db, code, b.mkey);
    let mkey = '';
    if (!mem) {
      if (g.pw_hash) {
        const who = await sha(`${req.headers.get('CF-Connecting-IP') || ''}|${code}|${new Date().toISOString().slice(0, 10)}`);
        const bad = await checkPw(db, g, b.password, who); if (bad) return bad;
      }
      mkey = await newMember(db, code);
      if (!mkey) return json({ error: 'full' }, 403);
    }
    return json({ ...groupOut(await getG(db, code)), ...(mkey && { mkey }), ...(mem && mem.blocked && { blocked: true }) });
  }
  if (act === '/add') {                                             // add to the shared count
    const n = Math.floor(Number(b.n)), mx = g.max_add || 100000;
    if (!(n >= 1 && n <= mx)) return json({ error: 'n', max: mx }, 400);
    let mem = await findMember(db, code, b.mkey), mkey = '';
    if (!mem) {                                                     // a phone from before member keys: it gets one, unless there is a password
      if (g.pw_hash) return json({ error: 'password' }, 401);
      if (b.join !== true) return json({ error: 'key' }, 403);
      mkey = await newMember(db, code);
      if (!mkey) return json({ error: 'full' }, 403);
      mem = { mid: await sha(mkey) };
    } else if (mem.blocked) return json({ error: 'blocked' }, 403);
    const at = new Date().toISOString();
    await db.batch([
      db.prepare('INSERT INTO group_adds (code, mid, n, at) VALUES (?,?,?,?)').bind(code, mem.mid, n, at),
      db.prepare('UPDATE groups SET total = total + ?, adds = adds + 1, updated = ? WHERE code = ?').bind(n, at, code)]);
    return json({ ...groupOut(await getG(db, code)), ...(mkey && { mkey }) });
  }
  if (act === '/accept') {                                          // use a co-admin invite (works once, for a week)
    const tok = keyOK(b.token) ? b.token : '';
    if (!tok) return json({ error: 'invite' }, 400);
    const r = await db.prepare('DELETE FROM group_invites WHERE code = ? AND thash = ? AND created > ?').bind(code, await sha(tok), new Date(Date.now() - 7 * 864e5).toISOString()).run();
    if (!r.meta.changes) return json({ error: 'invite' }, 403);
    const key = newKey();
    await db.prepare('INSERT INTO group_admins (code, khash, created) VALUES (?,?,?)').bind(code, await sha(key), new Date().toISOString()).run();
    const mem = await findMember(db, code, b.mkey), mkey = mem ? '' : await newMember(db, code);
    return json({ ...groupOut(await getG(db, code)), key, ...(mkey && { mkey }) });
  }
  if (!(await isAdmin(db, g, b.key))) return json({ error: 'key' }, 403);   // everything below is for admins
  if (act === '/admin') return adminDo(db, g, b);
  if (act === '/meet') {                                            // an admin sets when and where (in person / online link)
    const meet = b.meet && typeof b.meet === 'object' ? { when: clean(b.meet.when, 80), how: ['in person', 'Zoom', 'Google Meet', 'online'].includes(b.meet.how) ? b.meet.how : 'online',
      where: clean(b.meet.where, 120), link: cleanUrl(b.meet.link), date: /^\d{4}-\d{2}-\d{2}$/.test(b.meet.date) ? b.meet.date : '', time: /^\d{2}:\d{2}$/.test(b.meet.time) ? b.meet.time : '',
      repeat: ['once', 'daily', 'weekly'].includes(b.meet.repeat) ? b.meet.repeat : 'once' } : null;
    await db.prepare('UPDATE groups SET meet = ?, updated = ? WHERE code = ?').bind(meet ? JSON.stringify(meet) : null, new Date().toISOString(), code).run();
    return json(groupOut(await getG(db, code)));
  }
  return json({ error: 'method' }, 405);
}

async function api(req, env, path) {
  const db = env.DB;
  await schema(db);
  if (path === '/api/vapid' && req.method === 'GET') return json({ publicKey: (await vapid(db)).publicKey });
  if (path.startsWith('/api/group')) { const r = await groups(req, db, path); if (r) return r; }
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  if (Number(req.headers.get('content-length') || 0) > 8000) return json({ error: 'too big' }, 413);
  let b; try { b = await req.json(); } catch { return json({ error: 'json' }, 400); }
  const endpoint = b && (b.endpoint || (b.subscription && b.subscription.endpoint));
  if (typeof endpoint !== 'string' || !endpoint.startsWith('https://') || endpoint.length > 1000) return json({ error: 'endpoint' }, 400);
  const id = await idOf(endpoint);

  if (path === '/api/subscribe') {
    const k = (b.subscription && b.subscription.keys) || {};
    const tz = typeof b.tz === 'string' && validTz(b.tz) ? b.tz : 'UTC';
    const qt = TIME.test(b.quoteTime) ? b.quoteTime : null, nt = TIME.test(b.nudgeTime) ? b.nudgeTime : null;
    if (typeof k.p256dh !== 'string' || typeof k.auth !== 'string') return json({ error: 'keys' }, 400);
    await db.prepare(`INSERT INTO subs (id, endpoint, p256dh, auth, tz, quote_time, nudge_time, created) VALUES (?,?,?,?,?,?,?,?)
      ON CONFLICT(id) DO UPDATE SET p256dh=excluded.p256dh, auth=excluded.auth, tz=excluded.tz, quote_time=excluded.quote_time, nudge_time=excluded.nudge_time`)
      .bind(id, endpoint, k.p256dh, k.auth, tz, qt, nt, new Date().toISOString()).run();
    const sched = cleanSched(b.sched);
    await db.prepare('UPDATE subs SET sched = ? WHERE id = ?').bind(sched ? JSON.stringify(sched) : null, id).run();
    if (b.test) { const sub = await db.prepare('SELECT * FROM subs WHERE id=?').bind(id).first(); await send(sub, 'test', await vapid(db)); }
    return json({ ok: true });
  }
  if (path === '/api/unsubscribe') { await db.prepare('DELETE FROM subs WHERE id=?').bind(id).run(); return json({ ok: true }); }
  if (path === '/api/done') {   // "practised today" (the phone's own date), so the evening nudge skips today
    if (!DATE.test(b.date)) return json({ error: 'date' }, 400);
    await db.prepare('UPDATE subs SET last_done=? WHERE id=?').bind(b.date, id).run();
    return json({ ok: true });
  }
  return json({ error: 'not found' }, 404);
}

// The phone's schedule, checked: reminders [{id,t,d:[weekdays 0-6],label}], a mindfulness bell {every,from,to,d},
// and full-moon dates (worked out on the phone) with the time to tell.
function cleanSched(s) {
  if (!s || typeof s !== 'object') return null;
  const days = d => Array.isArray(d) ? d.filter(x => Number.isInteger(x) && x >= 0 && x <= 6).slice(0, 7) : [0, 1, 2, 3, 4, 5, 6];
  const rem = (Array.isArray(s.rem) ? s.rem : []).slice(0, 12).filter(r => r && TIME.test(r.t))
    .map(r => ({ id: clean(r.id, 12) || 'r', t: r.t, d: days(r.d), label: clean(r.label, 80), pr: /^[\w-]{1,40}$/.test(r.pr) ? r.pr : '' }));
  const bell = s.bell && TIME.test(s.bell.from) && TIME.test(s.bell.to) && [15, 30, 45, 60, 90, 120, 180].includes(Number(s.bell.every))
    ? { every: Number(s.bell.every), from: s.bell.from, to: s.bell.to, d: days(s.bell.d) } : null;
  const moons = (Array.isArray(s.moons) ? s.moons : []).filter(x => DATE.test(x)).slice(0, 30);
  const moonTime = TIME.test(s.moonTime) ? s.moonTime : null;
  return { rem, bell, moons, moonTime };
}

// Local date and minutes past midnight in a time zone.
function localNow(tz, now) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
    .formatToParts(now).map(p => [p.type, p.value]));
  const wd = new Date(`${parts.year}-${parts.month}-${parts.day}T12:00:00Z`).getUTCDay();
  return { date: `${parts.year}-${parts.month}-${parts.day}`, mins: Number(parts.hour) * 60 + Number(parts.minute), wd };
}
const mins = t => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
// Due if the chosen time is within the last 15 minutes (the cron interval) and not yet sent today.
const due = (t, lastSent, local) => t && lastSent !== local.date && local.mins >= mins(t) && local.mins < mins(t) + 15;

async function tick(env, now = new Date()) {
  const db = env.DB;
  await schema(db);
  const keys = await vapid(db);
  const { results } = await db.prepare('SELECT * FROM subs WHERE quote_time IS NOT NULL OR nudge_time IS NOT NULL OR sched IS NOT NULL').all();
  for (const sub of results) {
    const local = localNow(sub.tz, now);
    try {
      if (due(sub.quote_time, sub.last_quote, local)) {
        if (!await send(sub, 'quote', keys)) { await db.prepare('DELETE FROM subs WHERE id=?').bind(sub.id).run(); continue; }
        await db.prepare('UPDATE subs SET last_quote=? WHERE id=?').bind(local.date, sub.id).run();
      }
      // The evening nudge only if nothing was practised today. Gentle, never more than once a day.
      if (due(sub.nudge_time, sub.last_nudge, local) && sub.last_done !== local.date) {
        if (!await send(sub, 'nudge', keys)) { await db.prepare('DELETE FROM subs WHERE id=?').bind(sub.id).run(); continue; }
        await db.prepare('UPDATE subs SET last_nudge=? WHERE id=?').bind(local.date, sub.id).run();
      }
      // The schedule: extra reminders, mindfulness bells, full moons. `sent` remembers what went out today.
      if (sub.sched) {
        const S = JSON.parse(sub.sched), sent = sub.sent ? JSON.parse(sub.sent) : {}, todo = [];
        for (const r of S.rem || []) if (r.d.includes(local.wd) && due(r.t, sent['r' + r.id], local)) todo.push(['rem', { label: r.label, pr: r.pr || '' }, 'r' + r.id, local.date]);
        const B = S.bell;
        if (B && B.d.includes(local.wd) && local.mins >= mins(B.from) && local.mins <= mins(B.to)) {
          const slot = Math.floor((local.mins - mins(B.from)) / B.every), at = mins(B.from) + slot * B.every, key = `${local.date} ${slot}`;
          if (local.mins < at + 15 && sent.bell !== key) todo.push(['bell', {}, 'bell', key]);
        }
        if (S.moonTime && (S.moons || []).includes(local.date) && due(S.moonTime, sent.moon, local)) todo.push(['moon', {}, 'moon', local.date]);
        let gone = false;
        for (const [kind, extra, k, v] of todo) { if (!await send(sub, kind, keys, extra)) { gone = true; break; } sent[k] = v; }
        if (gone) { await db.prepare('DELETE FROM subs WHERE id=?').bind(sub.id).run(); continue; }
        if (todo.length) await db.prepare('UPDATE subs SET sent=? WHERE id=?').bind(JSON.stringify(sent), sub.id).run();
      }
    } catch (e) { console.log('push failed', sub.id, String(e)); }
  }
}

// The app moved from /ngondro/ to /practice/ (2026-11-05). Phones that installed it earlier keep
// opening /ngondro/, so that address serves the same files rather than redirecting: their app,
// offline copy and reminders carry on unchanged, and counts are shared (same site, same storage).
// Search engines are told to use /practice/ instead.
async function oldAddress(req, env) {
  const url = new URL(req.url);
  url.pathname = url.pathname.replace(/^\/ngondro/, '/practice');
  const res = await env.ASSETS.fetch(new Request(url, req));
  const out = new Response(res.body, res);
  const loc = out.headers.get('location');
  if (loc) out.headers.set('location', loc.replace(/^(https?:\/\/[^/]+)?\/practice/, '$1/ngondro'));
  out.headers.set('x-robots-tag', 'noindex');
  return out;
}

export default {
  async fetch(req, env) {
    const path = new URL(req.url).pathname;
    if (path.startsWith('/api/')) {
      try { return await api(req, env, path); } catch (e) { console.log('api error', String(e)); return json({ error: 'server' }, 500); }
    }
    if (path === '/ngondro' || path.startsWith('/ngondro/')) return oldAddress(req, env);
    return env.ASSETS.fetch(req);   // everything else is the static site
  },
  async scheduled(event, env, ctx) { ctx.waitUntil(tick(env, new Date(event.scheduledTime))); },
};
