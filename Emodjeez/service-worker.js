const CACHE_NAME = 'emodjeez-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './logo.webp',
  'https://fonts.googleapis.com/css2?family=Fredoka:wght@400;600;700&family=Roboto:wght@400;700;900&display=swap',
  'https://fonts.gstatic.com/s/fredoka/v9/X7nP4b87MqzP8S_O6Y4.woff2'
];

// Installatie: Bestanden opslaan in de cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Bestanden worden gecached voor offline gebruik');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activeren: Oude caches opruimen
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Oude cache verwijderd');
            return caches.delete(cache);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch: Eerst proberen van netwerk, anders uit cache
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});