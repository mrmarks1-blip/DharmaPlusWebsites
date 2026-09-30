const CACHE = 'dp-v10-1';
// Small app shell, precached so the app opens offline. The ~24MB practice PDF
// is deliberately NOT here: it gets cached the first time someone opens it.
const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './refuge-tree.jpg',
  './dm.jpg',
  './mandala.jpg',
  './guru.jpg',
  './phowa.jpg',
  './lovingeyes.jpg',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png',
];

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
