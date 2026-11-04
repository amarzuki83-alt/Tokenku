/**
 * Service Worker for tokenku PWA
 * Supports offline asset caching & Android Web Share Target for receipt images.
 */

const CACHE_NAME = 'tokenku-cache-v1';
const SHARE_CACHE_NAME = 'pwa-share-target';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/apple-touch-icon.png',
  '/favicon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Some assets could not be precached during install:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== SHARE_CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Handle Android Web Share Target POST request
  if (event.request.method === 'POST' && url.pathname.includes('/share-target')) {
    event.respondWith(
      (async () => {
        try {
          const formData = await event.request.formData();
          const file = formData.get('receipt') || formData.get('image') || formData.get('file');

          if (file) {
            const shareCache = await caches.open(SHARE_CACHE_NAME);
            const response = new Response(file, {
              headers: {
                'Content-Type': file.type || 'image/png',
                'X-Filename': encodeURIComponent(file.name || 'shared-receipt.png'),
                'X-Timestamp': Date.now().toString()
              }
            });
            await shareCache.put('/shared-image', response);
          }
        } catch (error) {
          console.error('Error handling share_target in Service Worker:', error);
        }

        // Redirect to homepage with query param indicating shared image is ready
        return Response.redirect('/?shared=1', 303);
      })()
    );
    return;
  }

  // Handle standard GET requests
  if (event.request.method === 'GET') {
    // Avoid caching chrome-extension or external analytics
    if (!url.protocol.startsWith('http')) return;

    // Cache-first for images and fonts
    if (
      url.pathname.endsWith('.png') ||
      url.pathname.endsWith('.jpg') ||
      url.pathname.endsWith('.svg') ||
      url.pathname.endsWith('.woff2') ||
      url.hostname.includes('gstatic.com')
    ) {
      event.respondWith(
        caches.match(event.request).then((cached) => {
          if (cached) return cached;
          return fetch(event.request).then((networkRes) => {
            if (networkRes.status === 200) {
              const resClone = networkRes.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
            }
            return networkRes;
          }).catch(() => cached);
        })
      );
      return;
    }

    // Network-first for navigation and other requests with cache fallback
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.status === 200 && event.request.url.startsWith(self.location.origin)) {
            const resClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(event.request);
          if (cached) return cached;
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
          return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
        })
    );
  }
});
