const CACHE = 'tablero-v2';
const PRECACHE = [];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (!e.request.url.startsWith('http')) return;
  if (e.request.method !== 'GET') return;
  if (e.request.url.includes('/api/')) return;

  // Nunca cachear navegaciones/HTML: en Vercel cada deploy cambia el shell.
  // Cache viejo de `/` o `/dashboard` dejaba a usuarios en versiones anteriores.
  if (e.request.mode === 'navigate' || e.request.destination === 'document') {
    e.respondWith(fetch(e.request));
    return;
  }

  // version.json siempre de red (para detectar deploy)
  if (e.request.url.includes('/version.json')) {
    e.respondWith(fetch(e.request, { cache: 'no-store' }));
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const clone = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request).then((r) => r ?? fetch(e.request)))
  );
});
