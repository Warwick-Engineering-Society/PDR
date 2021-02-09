const cacheName='cacheStorage'
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(cacheName).then(function (cache) {
      return cache.addAll(
        [
          '/offline.html',
          '/styles.css',
          '/manifest.json',
          '/img/icons/apple-touch-icon.png',
          '/img/icons/favicon-32x32.png',
          '/img/icons/favicon-16x16.png',
          '/img/icons/safari-pinned-tab.svg',
          '/img/icons/favicon.ico',
          '/img/icons/browserconfig.xml',
          'img/big_logo.png'
        ]
      );
    })
  );
});

self.addEventListener('activate', function(event){
  console.log('[Service Worker] Activating Service Worker.....',event);
  return self.clients.claim();
});

self.addEventListener('fetch', function (event) {
  event.respondWith(
    // Try the cache
    caches.match(event.request).then(function (response) {
      // Fall back to network
      return response || fetch(event.request);
    }).catch(function () {
      return caches.match('/offline.html');
    })
  );
});