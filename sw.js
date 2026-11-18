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
  './assets/art/rift-mine.webp',
  './assets/art/rift-arena.webp',
  './assets/art/buildings/mine.webp',
  './assets/art/buildings/lumber.webp',
  './assets/art/buildings/farm.webp',
  './assets/art/buildings/factory.webp',
  './assets/art/buildings/bank.webp',
  './assets/art/buildings/castle.webp',
  './assets/art/buildings/temple.webp',
  './assets/art/buildings/station.webp',
  './assets/art/buildings/quantum.webp',
  './assets/art/buildings/dyson.webp',
  './assets/art/buildings/time.webp',
  './assets/art/buildings/multiverse.webp',
  './assets/art/buildings/research.webp',
  './assets/art/buildings/stargate.webp',
  './assets/art/buildings/dark.webp',
  './assets/art/buildings/rift.webp',
  './assets/art/buildings/warp.webp',
  './assets/art/buildings/infinity.webp',
  './assets/art/bosses/goblin.webp',
  './assets/art/bosses/troll.webp',
  './assets/art/bosses/dragon.webp',
  './assets/art/bosses/demon.webp',
  './assets/art/bosses/titan.webp',
  './assets/art/bosses/void.webp',
  './assets/art/bosses/guardian.webp',
  './assets/art/bosses/god.webp',
  './assets/art/bosses/chaos.webp',
  './assets/art/bosses/eye.webp',
  './assets/art/bosses/darklord.webp',
  './assets/art/bosses/wraith.webp',
  './assets/art/bosses/shatterer.webp',
  './assets/art/bosses/tyrant.webp',
  './assets/art/bosses/emperor.webp',
  './assets/art/icons/hand.webp',
  './assets/art/icons/bricks.webp',
  './assets/art/icons/dagger.webp',
  './assets/art/icons/robot.webp',
  './assets/art/icons/laurel.webp',
  './assets/art/icons/moon.webp',
  './assets/art/icons/gear.webp',
  './assets/art/icons/tower.webp',
  './assets/art/icons/skull.webp',
  './assets/art/icons/coin.webp',
  './assets/art/icons/upgrade.webp',
  './assets/art/icons/rebirth.webp',
  './assets/art/icons/shard.webp',
  './assets/art/icons/castle.webp',
  './assets/art/icons/trophy.webp',
  './assets/art/icons/book.webp',
  './assets/art/icons/bolt.webp',
  './assets/art/icons/mine.webp',
  './assets/art/start-sunrise.webp',
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
