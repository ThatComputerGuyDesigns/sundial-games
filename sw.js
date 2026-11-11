/* Sundial service worker: network-first so new editions always show, cache as offline fallback */
var CACHE = "sundial-v1";
self.addEventListener("install", function (e) { self.skipWaiting(); });
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request).then(function (r) {
      if (r && r.ok && (new URL(e.request.url).origin === location.origin || /fonts\.(googleapis|gstatic)\.com|flagcdn\.com/.test(e.request.url))) {
        var copy = r.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
      }
      return r;
    }).catch(function () { return caches.match(e.request, { ignoreSearch: true }); })
  );
});
