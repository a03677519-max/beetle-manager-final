const CACHE_NAME = 'beetlelog-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
];

// インストール時にアセットをキャッシュ
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// 古いキャッシュの削除
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// ネットワークリクエストのインターセプト
self.addEventListener('fetch', (event) => {
  // http/https 以外のリクエスト（chrome-extension等）や APIリクエストを除外
  if (!event.request.url.startsWith('http') || event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((networkResponse) => {
        // 正常なGETレスポンスのみキャッシュに保存
        if (event.request.method === 'GET' && networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      });
    }).catch(() => {
      // オフラインかつキャッシュもない場合のフォールバック（例：index.htmlを返す）
      return caches.match('/');
    })
  );
});

// プッシュ通知を受信した時の処理
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { title: 'BeetleLog', body: '新しい通知があります' };
  const options = {
    body: data.body,
    icon: '/assets/logo.png', // 公開ディレクトリのパス
    badge: '/assets/logo.png',
    data: data.url || '/'
  };
  event.waitUntil(self.registration.showNotification(data.title, options));
});

// 通知がクリックされた時の処理
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data));
});