const CACHE = 'esm-ngondro-v9';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './refuge-tree.jpg',
  './refuge-map.jpg',
  './prostr.jpg',
  './dm.jpg',
  './mandala.jpg',
  './guru.jpg',
  './phowa.jpg',
  './lovingeyes.jpg',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS.filter(Boolean)))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const req = e.request;
  // Network-first for the page itself (HTML/navigation) so edits show up when
  // online; fall back to cache offline. Cache-first for static assets (images).
  const isDoc = req.mode === 'navigate' || req.destination === 'document' || req.url.endsWith('.html');
  if (isDoc) {
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match(req).then(c => c || caches.match('./')))
    );
  } else {
    e.respondWith(caches.match(req).then(cached => cached || fetch(req)));
  }
});
