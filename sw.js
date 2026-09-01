/* Research Radar Pro service worker: app-shell cache + fresh-data strategy. */
const VERSION = 'rr-pro-v5-corrected-three-pillar-20260901';
const STATIC_CACHE = `${VERSION}-static`;
const DATA_CACHE = `${VERSION}-data`;
const APP_SHELL = [
  './',
  'index.html',
  'offline.html',
  'manifest.webmanifest',
  'assets/css/app.css',
  'assets/js/fallback-data.js',
  'assets/js/scoring.js',
  'assets/js/storage.js',
  'assets/js/app.js',
  'assets/icons/icon-192.png',
  'assets/icons/icon-512.png',
  'data/feed.json',
  'data/profile.json',
  'data/topics.json',
  'data/meta.json',
  'data/source-health.json',
  'data/sources.json',
  'data/daily-brief.json',
  'data/deadlines.ics',
  'feed.xml'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => ![STATIC_CACHE, DATA_CACHE].includes(key)).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

async function networkFirst(request) {
  const cache = await caches.open(DATA_CACHE);
  try {
    const response = await fetch(request, { cache: 'no-store' });
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (error) {
    return (await cache.match(request)) || (await caches.match(request));
  }
}

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);
  const network = fetch(request).then(async response => {
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => null);
  return cached || network;
}

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(STATIC_CACHE).then(cache => cache.put('index.html', copy));
          return response;
        })
        .catch(async () => (await caches.match('index.html')) || (await caches.match('offline.html')))
    );
    return;
  }

  if (url.pathname.includes('/data/') || url.pathname.endsWith('/feed.xml')) {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(staleWhileRevalidate(request));
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
