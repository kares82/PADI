/* Padi Tamil — offline cache.
   Once you have opened the app on a device with a connection,
   it keeps working with no internet at all. */
var CACHE = 'padi-tamil-2026-08-23.1';
var ASSETS = [
  './',
  './index.html',
  './app/style.css',
  './app/data.js',
  './app/stories.js',
  './app/register.js',
  './app/strokes.js',
  './app/compose.js',
  './app/engine.js',
  './app/ui.js',
  './app/splash.js',
  './manifest.webmanifest'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }).then(function(){ return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.map(function (k) { return k === CACHE ? null : caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});

/* Network first for our own files. The app is small, and being one
   deploy behind is far worse than a few milliseconds. The cache is
   kept fully populated so offline still works; it is just no longer
   allowed to answer while the network is available.
   Cross-origin (the web fonts) stays cache-first - it never changes. */
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  if (e.request.url.indexOf('http') !== 0) return;

  var sameOrigin = e.request.url.indexOf(self.location.origin) === 0;

  if (sameOrigin) {
    e.respondWith(
      fetch(e.request).then(function (res) {
        if (res && res.status === 200) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        }
        return res;
      }).catch(function () {
        return caches.match(e.request).then(function (hit) {
          return hit || caches.match('./index.html');
        });
      })
    );
  } else {
    e.respondWith(
      caches.match(e.request).then(function (hit) {
        return hit || fetch(e.request).then(function (res) {
          if (res && res.status === 200 && res.type !== 'opaque') {
            var copy = res.clone();
            caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
          }
          return res;
        });
      })
    );
  }
});
