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
async function send(sub, kind, keys) {
  const subscription = { endpoint: sub.endpoint, expirationTime: null, keys: { p256dh: sub.p256dh, auth: sub.auth } };
  const payload = await buildPushPayload({ data: { kind }, options: { ttl: 6 * 3600, urgency: 'normal', topic: kind } }, subscription, keys);
  const res = await fetch(sub.endpoint, payload);
  return !(res.status === 404 || res.status === 410);
}

// Group codes: 6 letters/digits without look-alikes (no 0/O, 1/I/L).
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const newCode = () => Array.from(crypto.getRandomValues(new Uint8Array(6)), b => CODE_CHARS[b % CODE_CHARS.length]).join('');
const clean = (s, n) => String(s || '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, n);
const groupOut = g => g && { code: g.code, name: g.name, practice: g.practice, target: g.target, total: g.total, adds: g.adds, updated: g.updated };

async function groups(req, db, path) {
  if (path === '/api/group' && req.method === 'POST') {          // start a group
    let b; try { b = await req.json(); } catch { return json({ error: 'json' }, 400); }
    const name = clean(b.name, 60), practice = clean(b.practice, 80), target = Math.floor(Number(b.target));
    if (!name || !practice || !(target >= 1 && target <= 100000000)) return json({ error: 'fields' }, 400);
    const now = new Date().toISOString();
    for (let i = 0; i < 5; i++) {
      const code = newCode();
      const r = await db.prepare('INSERT OR IGNORE INTO groups (code, name, practice, target, created, updated) VALUES (?,?,?,?,?,?)')
        .bind(code, name, practice, target, now, now).run();
      if (r.meta.changes) return json(groupOut(await db.prepare('SELECT * FROM groups WHERE code=?').bind(code).first()));
    }
    return json({ error: 'busy' }, 503);
  }
  const m = path.match(/^\/api\/group\/([A-Z0-9]{6})(\/add)?$/);
  if (!m) return null;
  const code = m[1];
  if (!m[2] && req.method === 'GET') {                              // see a group
    const g = await db.prepare('SELECT * FROM groups WHERE code=?').bind(code).first();
    return g ? json(groupOut(g)) : json({ error: 'not found' }, 404);
  }
  if (m[2] && req.method === 'POST') {                              // add to the shared count
    let b; try { b = await req.json(); } catch { return json({ error: 'json' }, 400); }
    const n = Math.floor(Number(b.n));
    if (!(n >= 1 && n <= 100000)) return json({ error: 'n' }, 400);
    await db.prepare('UPDATE groups SET total = total + ?, adds = adds + 1, updated = ? WHERE code = ?').bind(n, new Date().toISOString(), code).run();
    const g = await db.prepare('SELECT * FROM groups WHERE code=?').bind(code).first();
    return g ? json(groupOut(g)) : json({ error: 'not found' }, 404);
  }
  return json({ error: 'method' }, 405);
}

async function api(req, env, path) {
  const db = env.DB;
  await schema(db);
  if (path === '/api/vapid' && req.method === 'GET') return json({ publicKey: (await vapid(db)).publicKey });
  if (path.startsWith('/api/group')) { const r = await groups(req, db, path); if (r) return r; }
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  if (Number(req.headers.get('content-length') || 0) > 4000) return json({ error: 'too big' }, 413);
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

// Local date and minutes past midnight in a time zone.
function localNow(tz, now) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
    .formatToParts(now).map(p => [p.type, p.value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, mins: Number(parts.hour) * 60 + Number(parts.minute) };
}
const mins = t => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
// Due if the chosen time is within the last 15 minutes (the cron interval) and not yet sent today.
const due = (t, lastSent, local) => t && lastSent !== local.date && local.mins >= mins(t) && local.mins < mins(t) + 15;

async function tick(env, now = new Date()) {
  const db = env.DB;
  await schema(db);
  const keys = await vapid(db);
  const { results } = await db.prepare('SELECT * FROM subs WHERE quote_time IS NOT NULL OR nudge_time IS NOT NULL').all();
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
    } catch (e) { console.log('push failed', sub.id, String(e)); }
  }
}

export default {
  async fetch(req, env) {
    const path = new URL(req.url).pathname;
    if (path.startsWith('/api/')) {
      try { return await api(req, env, path); } catch (e) { console.log('api error', String(e)); return json({ error: 'server' }, 500); }
    }
    return env.ASSETS.fetch(req);   // everything else is the static site
  },
  async scheduled(event, env, ctx) { ctx.waitUntil(tick(env, new Date(event.scheduledTime))); },
};
