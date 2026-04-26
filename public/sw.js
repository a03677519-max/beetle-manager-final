const CACHE_NAME = 'beetlelog-v1';

// インストール時に古いキャッシュを即座に破棄
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // index.html または ルートへのリクエストは常にネットワークから取得
  if (url.origin === self.origin && (url.pathname === '/' || url.pathname === '/index.html')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }
  event.respondWith(caches.match(event.request).then((res) => res || fetch(event.request)));
});