const CACHE_NAME = 'najos-admin-v1';
const STATIC_ASSETS = [
  '/admin-app.html',
  '/manifest.json'
];

// Install - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Ignore cache errors for dynamic assets
      });
    })
  );
  self.skipWaiting();
});

// Activate - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

// Fetch - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  // Skip non-GET and Firebase requests
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('firestore') || 
      event.request.url.includes('firebase') ||
      event.request.url.includes('gstatic')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// Push notifications
self.addEventListener('push', (event) => {
  let data = { title: 'Nuevo Registro', body: 'Un huésped acaba de registrarse.', icon: '🏡' };
  try { data = event.data ? event.data.json() : data; } catch(e) {}
  
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'new-registration',
      renotify: true,
      data: data,
      actions: [
        { action: 'view', title: 'Ver Registro' },
        { action: 'dismiss', title: 'Ignorar' }
      ]
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'view') {
    event.waitUntil(clients.openWindow('/admin-app.html'));
  }
});
