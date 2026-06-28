const CACHE_NAME = 'oaplay-static-v1';

const STATIC_PATH_PREFIXES = [
  '/_next/static/',
  '/icons/',
  '/favicon',
  '/oaplay-icon',
  '/oaplay-logo',
  '/oaplay-og-image',
];

const STATIC_EXTENSIONS = [
  '.css',
  '.js',
  '.woff',
  '.woff2',
  '.ttf',
  '.otf',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.svg',
  '.ico',
];

const BLOCKED_PREFIXES = [
  '/api/',
  '/admin',
  '/auth',
  '/premium',
  '/checkout',
  '/profile',
];

function shouldBypass(request, url) {
  if (request.method !== 'GET') return true;
  if (url.origin !== self.location.origin) return true;
  if (request.mode === 'navigate') return true;

  return BLOCKED_PREFIXES.some((prefix) => url.pathname.startsWith(prefix));
}

function isStaticAsset(url) {
  return (
    STATIC_PATH_PREFIXES.some((prefix) => url.pathname.startsWith(prefix)) ||
    STATIC_EXTENSIONS.some((extension) => url.pathname.endsWith(extension))
  );
}

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (shouldBypass(request, url) || !isStaticAsset(url)) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request).then((response) => {
        if (response && response.ok && response.type === 'basic') {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }

        return response;
      });
    })
  );
});
