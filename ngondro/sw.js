const CACHE = 'esm-ngondro-v9-3';
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
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png',
  './ngondro-full.pdf',   // full practice text (~24MB) — precached for offline
];

self.addEventListener('install', e => {
  // ponytail: add each asset independently so one 404 can't fail the whole
  // install (the classic "PWA never caches" bug). allSettled ignores misses.
  e.waitUntil(
    caches.open(CACHE).then(c => Promise.allSettled(ASSETS.map(a => c.add(a))))
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
