const CACHE_VERSION = 'v3';
const CACHE_NAME = `algo-infinity-verse-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `algo-infinity-verse-dynamic-${CACHE_VERSION}`;

function isCacheable(response) {
  return response && response.ok && (response.type === 'basic' || response.type === 'cors');
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Precache critical files for offline sandbox functionality
      return cache.addAll([
        '/offline.html',
        '/worker.js',
        '/data/practice-problems.js',
        '/data/quiz-questions.js',
        '/data/dsa-topics.js',
        '/modules/executeCode.js'
      ]);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  // Purge caches from previous CACHE_VERSIONs so a version bump actually
  // invalidates stale assets and Cache Storage does not grow unbounded.
  event.waitUntil(
    (async () => {
      const keep = new Set([CACHE_NAME, DYNAMIC_CACHE]);
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((key) => !keep.has(key)).map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  function tryCache(request, response, cacheName) {
    try {


      if (request.method === 'GET') { // Only cache GET requests
        const cloned = response.clone();
        caches.open(cacheName).then((cache) => cache.put(request, cloned)).catch(() => {});
      }
    } catch (e) {}
  }

  // NAVIGATION
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          if (isCacheable(res)) tryCache(event.request, res, CACHE_NAME);
          return res;
        })
        .catch(() =>
          caches.match(event.request).then((cached) => cached || caches.match('/offline.html'))
        )
    );
    return;
  }

  // API
  if (url.pathname.startsWith('/api/')) {
    if (event.request.method !== 'GET') {
      event.respondWith(fetch(event.request));
      return;
    }

    event.respondWith(
      fetch(event.request)
        .then((res) => {
          if (isCacheable(res)) tryCache(event.request, res, DYNAMIC_CACHE);
          return res;
        })
        .catch(() => caches.match(event.request).then(cached => cached || new Response('Offline', { status: 503 })))
    );
    return;
  }

  // STATIC ASSETS
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((res) => {
          if (isCacheable(res)) tryCache(event.request, res, CACHE_NAME);
          return res;
        })
        .catch(() => new Response('Offline', { status: 503 }));

      return cached || fetchPromise;
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-actions') {
    event.waitUntil(processOfflineQueue());
  }
});

async function processOfflineQueue() {
  const clients = await self.clients.matchAll({ includeUncontrolled: true });

  for (const client of clients) {
    client.postMessage({ type: 'PROCESS_OFFLINE_QUEUE' });
  }
}

