// Service Worker for PWA offline support
const CACHE_NAME = 'daymate-cache-v3';

// Install event - 預先快取應用程式首頁，確保首次離線時仍有可載入的內容
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        const appShellUrl = new URL('./', self.registration.scope).toString();
        return cache.add(appShellUrl);
      })
      .catch((error) => {
        // 預快取失敗時仍允許 Service Worker 啟用，避免阻斷線上使用
        console.warn('Service Worker 預快取失敗:', error);
      })
      .then(() => self.skipWaiting())
  );
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
            const appShellUrl = new URL('./', self.registration.scope).toString();
            return caches.match(appShellUrl).then((appShell) => appShell || Response.error());
          }

          return Response.error();
        });
      })
  );
});
