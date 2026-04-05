const CACHE_NAME = 'pbb-images-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (event) => {
  const { request } = event;

  const isImage =
    request.destination === 'image' ||
    /\.(jpe?g|png|webp|gif|svg)(\?.*)?$/i.test(new URL(request.url).pathname);

  if (!isImage) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request);
      if (cached) return cached;

      try {
        const response = await fetch(request);
        if (response.ok || response.type === 'opaque') {
          cache.put(request, response.clone());
        }
        return response;
      } catch (err) {
        return cached || new Response('', { status: 408 });
      }
    })
  );
});
