const CACHE_NAME = 'emodjeez-v4';
const APP_ASSETS = [
  './index.html',
  './manifest.json',
  './logo.webp',
  './logo.png',
];

// Firebase, gstatic en andere externe domeinen: nooit cachen
const SKIP_CACHE_PATTERNS = [
  'firebaseio.com',
  'firebasestorage',
  'googleapis.com',
  'gstatic.com',
  'flagcdn.com',
  'firebase',
];

function shouldSkipCache(url) {
  return SKIP_CACHE_PATTERNS.some(pattern => url.includes(pattern));
}

// Installatie: app-assets in cache zetten
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_ASSETS))
  );
  self.skipWaiting();
});

// Activeren: verwijder verouderde caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  return self.clients.claim();
});

// Fetch strategie:
// - Firebase/externe API's: altijd netwerk (nooit cachen)
// - App-navigatie (HTML): stale-while-revalidate (direct uit cache + update op achtergrond)
// - Overige assets: cache-first, netwerk als fallback
self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Externe/Firebase verzoeken: gewoon doorlaten, geen service worker tussenkomst
  if (shouldSkipCache(url) || !url.startsWith(self.location.origin)) {
    return;
  }

  // Navigatieverzoeken (pagina laden)
  if (event.request.mode === 'navigate') {
    const pathname = new URL(event.request.url).pathname;

    // Specifieke HTML-pagina's (reset-data.html, privacy.html etc.): altijd van netwerk
    if (pathname !== '/' && pathname !== '/index.html' && pathname.endsWith('.html')) {
      event.respondWith(fetch(event.request));
      return;
    }

    // Hoofd-app: stale-while-revalidate
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match('./index.html');
        const networkFetch = fetch(event.request).then((response) => {
          if (response.ok) cache.put('./index.html', response.clone());
          return response;
        }).catch(() => null);

        // Geef direct de gecachede versie terug als die er is, anders wacht op netwerk
        return cached || networkFetch || caches.match('./index.html');
      })
    );
    return;
  }

  // Statische assets: cache-first
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response.ok) {
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response.clone()));
        }
        return response;
      });
    })
  );
});
