const CACHE = 'dp-v10-11';
// Small app shell, precached so the app opens offline. Not precached, but
// cached the first time they're used: the ~2MB practice booklet PDF and the ~0.7MB
// Tibetan font (fonts/noto-serif-tibetan.woff2).
const SHELL = [
  './',
  './index.html',
  './quotes.js',
  './manifest.json',
  './fonts/atkinson-latin.woff2',
  './fonts/atkinson-latin-ext.woff2',
  './fonts/fraunces-latin.woff2',
  './fonts/fraunces-latin-ext.woff2',
  './refuge-tree.jpg',
  './dm.jpg',
  './mandala.jpg',
  './guru.jpg',
  './phowa.jpg',
  './lovingeyes.jpg',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png',
  './apple-touch-icon.png',
  './favicon-32.png',
];

// The quotes, for the daily "words for today" notification (the same file the app uses).
importScripts('./quotes.js');

self.addEventListener('install', e => {
  // Add each file independently so one 404 can't fail the whole install.
  e.waitUntil(caches.open(CACHE).then(c => Promise.allSettled(SHELL.map(a => c.add(a)))));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

const put = (req, res) => {
  if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {}); }
  return res;
};

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (new URL(req.url).pathname.startsWith('/api/')) return;   // the push server: never cached
  if (req.mode === 'navigate' || req.destination === 'document') {
    // Page: network-first so edits show up when online; cache when offline.
    e.respondWith(fetch(req).then(res => put(req, res))
      .catch(() => caches.match(req).then(c => c || caches.match('./'))));
  } else {
    // Assets: serve from cache instantly, refresh the cache in the background
    // (stale-while-revalidate), so replaced images reach users without a
    // cache-name bump.
    // The big PDF is cache-first only, so it isn't re-downloaded on every open.
    const big = req.url.endsWith('.pdf');
    e.respondWith(caches.match(req).then(cached => {
      if (cached && big) return cached;
      const net = fetch(req).then(res => put(req, res));
      if (cached) { net.catch(() => {}); return cached; }
      return net;
    }));
  }
});

// ── Notifications (opt-in, from Settings > Reminders). The server only says which kind to show;
// the words are chosen here on the phone, so the server never holds any texts.
const dayNum = () => { const d = new Date(); return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())) / 86400000); };
self.addEventListener('push', e => {
  let kind = 'quote';
  try { kind = (e.data && e.data.json().kind) || 'quote'; } catch {}
  const all = QUOTES, cont = QUOTES.filter(q => q.cont);
  const q = kind === 'nudge' ? cont[dayNum() % cont.length] : all[dayNum() % all.length];
  const title = kind === 'nudge' ? 'A moment of practice today?' : kind === 'test' ? 'Notifications are on' : 'Words for today';
  const body = kind === 'test' ? 'This is how your daily notifications will look.' : `${q.t.replace(/
/g, ' ')}
— ${q.a}`;
  e.waitUntil(self.registration.showNotification(title, { body, icon: './icon-192.png', badge: './icon-192.png', tag: 'dharma-' + kind, data: { kind } }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    const open = list.find(c => c.url.includes('/ngondro/'));
    return open ? open.focus() : self.clients.openWindow('./');
  }));
});
