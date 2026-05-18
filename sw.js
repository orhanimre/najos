const CACHE_NAME = 'najos-admin-v3'; // bumped version forces old cache purge
const ADMIN_ONLY = ['/admin.html', '/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ADMIN_ONLY).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Delete ALL old caches (including v2 that caused the stale-page bug)
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Never intercept Firebase / Google API calls
  const url = event.request.url;
  if (
    url.includes('firestore') ||
    url.includes('firebase') ||
    url.includes('googleapis') ||
    url.includes('gstatic') ||
    url.includes('fonts.g')
  ) return;

  // NETWORK-FIRST: always try the network first so redeployments take effect immediately.
  // Only fall back to cache if the network fails (offline support for admin).
  event.respondWith(
    fetch(event.request).then((response) => {
      // Cache only admin assets
      if (response.ok && ADMIN_ONLY.some(path => url.endsWith(path))) {
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone()));
      }
      return response;
    }).catch(() => caches.match(event.request))
  );
});

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
    event.waitUntil(clients.openWindow('/admin.html'));
  }
});
