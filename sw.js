/* Padi Tamil — offline cache.
   Once you have opened the app on a device with a connection,
   it keeps working with no internet at all. */
var CACHE = 'padi-tamil-v2';
var ASSETS = [
  './',
  './index.html',
  './app/style.css',
  './app/data.js',
  './app/register.js',
  './app/strokes.js',
  './app/engine.js',
  './app/ui.js',
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

/* Stale-while-revalidate: instant offline load from cache, but every
   visit quietly refreshes the cache in the background so edits to the
   app actually reach the user on their next open. */
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  if (e.request.url.indexOf('http') !== 0) return;
  e.respondWith(
    caches.open(CACHE).then(function (cache) {
      return cache.match(e.request).then(function (hit) {
        var net = fetch(e.request).then(function (res) {
          if (res && res.status === 200 && res.type !== 'opaque') cache.put(e.request, res.clone());
          return res;
        }).catch(function () { return hit || caches.match('./index.html'); });
        return hit || net;
      });
    })
  );
});
