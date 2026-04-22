// Service Worker for r>_ Blog Editor (admin)
const CACHE_NAME = 'blog-editor-admin-v1';

const STATIC_ASSETS = [
  '/admin/',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.allSettled(STATIC_ASSETS.map(url => cache.add(url)))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = event.request.url;

  // API 呼び出しは常にネットワーク優先
  if (url.includes('/api/')) {
    return;
  }

  if (event.request.method !== 'GET') {
    return;
  }

  // /admin/ 配下のみキャッシュ対象
  const requestUrl = new URL(url);
  if (!requestUrl.pathname.startsWith('/admin/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
