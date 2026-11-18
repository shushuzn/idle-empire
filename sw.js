// 离线缓存：网络优先，断网时回落缓存。改版本号即可让旧缓存失效。
const CACHE = 'idle-empire-v0.1.0';

const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/app.css',
  './assets/icon.svg',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/icon-maskable.png',
  './src/main.js',
  './src/ui/views.js',
  './src/ui/format.js',
  './src/ui/haptics.js',
  './src/ui/theme.js',
  './src/ui/floaters.js',
  './src/ui/icons.js',
  './src/game/balance.js',
  './src/game/data.js',
  './src/game/engine.js',
  './src/game/state.js',
  './src/game/story.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      // 只清理本作的旧缓存，同一域名下的其他项目不受影响
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith('idle-empire-') && key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        if (request.mode === 'navigate') {
          const fallback = await caches.match(new URL('./index.html', self.registration.scope).href);
          if (fallback) return fallback;
        }
        return Response.error();
      }),
  );
});
