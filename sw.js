/* Padi Tamil — offline cache.
   Once you have opened the app on a device with a connection,
   it keeps working with no internet at all. */
var CACHE = 'padi-tamil-2026-08-23.6';
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
  /* addAll() may satisfy itself from the browser's own HTTP cache, which
     can bake a previous version's files into a brand new cache. Force
     each one down the wire so the precache always matches the deploy. */
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return Promise.all(ASSETS.map(function (u) {
        return fetch(new Request(u, { cache: 'reload' }))
          .then(function (r) { if (r && r.ok) return c.put(u, r); })
          .catch(function (){});
      }));
    }).then(function (){ return self.skipWaiting(); })
  );
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
    /* Network first is only true if the fetch actually reaches the network.
       Pages served these files with a four-hour max-age, so this fetch was
       being answered from the browser's own HTTP cache and the worker
       happily cached a stale copy on top. 'reload' forces the wire.

       A navigation request cannot be rebuilt with new options - the
       constructor rejects mode 'navigate' - and index.html is already
       no-cache, so those go through untouched. */
    var req = e.request;
    if (req.mode !== 'navigate'){
      try { req = new Request(req, { cache: 'reload' }); } catch (err) { req = e.request; }
    }
    e.respondWith(
      fetch(req).then(function (res) {
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
