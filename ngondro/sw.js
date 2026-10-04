const CACHE = 'dp-v10-14';
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
  './fonts/jomolhari-seeds.woff2',
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
  './sounds/bowl.mp3',
  './sounds/bowl-small.mp3',
  './sounds/rin.mp3',
  './sounds/temple-bell.mp3',
  './sounds/gong.mp3',
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
  let d = {};
  try { d = (e.data && e.data.json()) || {}; } catch {}
  const kind = d.kind || 'quote';
  const all = QUOTES, cont = QUOTES.filter(q => q.cont);
  const q = kind === 'nudge' || kind === 'rem' ? cont[dayNum() % cont.length] : all[dayNum() % all.length];
  const words = `${q.t.replace(/\n/g, ' ')}\n— ${q.a}`;
  const N = {
    quote: ['Words for today', words],
    nudge: ['A moment of practice today?', words],
    test: ['Notifications are on', 'This is how your notifications will look.'],
    rem: [d.label || 'Time to practise', words],
    bell: ['A mindfulness bell', 'Pause for a moment. One breath, just as it is.'],
    moon: ['Full moon today', 'In many traditions a day for practice: in the Tibetan tradition its effects are said to be greatly multiplied. Tap for what you might do.'],
  }[kind] || ['Dharma Practice', words];
  if (kind === 'bell') self.clients.matchAll({ type: 'window' }).then(l => l.forEach(c => c.postMessage({ kind: 'bell' })));
  e.waitUntil(self.registration.showNotification(N[0], { body: N[1], icon: './icon-192.png', badge: './favicon-32.png', tag: 'dharma-' + kind, renotify: kind === 'bell', data: { kind } }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    const hash = (e.notification.data || {}).kind === 'moon' ? '#fullmoon' : '';
    const open = list.find(c => c.url.includes('/ngondro/'));
    if (open) { if (hash) open.navigate('./' + hash).catch(() => {}); return open.focus(); }
    return self.clients.openWindow('./' + hash);
  }));
});
