// Service Worker for PWA offline support
const CACHE_NAME = 'daymate-cache-v2';

// Install event - 快取防錯處理
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate event - 清理舊版本快取
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - 網路優先、快取備援 (Network First)
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // 僅處理同源 GET 請求，忽略 Firebase、Google Auth 及非 HTTP/HTTPS 請求
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.includes('/api/')) return;

  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (request.mode === 'navigate') {
            return caches.match('./') || caches.match('/schedule_app/');
          }
        });
      })
  );
});

