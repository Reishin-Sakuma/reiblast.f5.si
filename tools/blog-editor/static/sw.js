// Service Worker for r>_ Blog Editor
const CACHE_NAME = 'blog-editor-v1';

// キャッシュする静的アセット（CDN含む）
const STATIC_ASSETS = [
  '/',
  'https://cdn.quilljs.com/1.3.7/quill.snow.css',
  'https://cdn.quilljs.com/1.3.7/quill.min.js',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // CDN は失敗してもキャッシュ全体を壊さないよう個別に追加
      return cache.addAll(['/']).then(() =>
        Promise.allSettled(
          STATIC_ASSETS.slice(1).map(url => cache.add(url))
        )
      );
    })
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

  // API呼び出しは常にネットワーク優先
  if (url.includes('/api/')) {
    return;
  }

  // POSTリクエストはキャッシュしない
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // 成功したレスポンスのみキャッシュ
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
