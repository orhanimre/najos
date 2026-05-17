// ── Cache version: bump this string any time you deploy ──
// Even better: your build/deploy script can replace __DEPLOY_TIME__ with Date.now()
const CACHE_VERSION = typeof __DEPLOY_TIME__ !== 'undefined' ? __DEPLOY_TIME__ : 'najos-v3';
const CACHE_NAME = `najos-${CACHE_VERSION}`;

// HTML pages — always fetched from network first, cache is only a fallback for offline
const HTML_PAGES = [
  '/admin.html',
  '/index.html',
  '/apto2.html',
  '/apto3.html',
  '/apto4.html',
  '/registro-apto2.html',
  '/registro-apto3.html',
  '/registro-apto4.html',
  '/san-carlos.html',
  '/sobre-nosotros.html',
];

// Static assets that rarely change — cache-first is fine
const STATIC_ASSETS = [
  '/manifest.json',
];

// ── INSTALL: pre-cache only static assets, not HTML ──
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS).catch(() => {}))
      .then(() => self.skipWaiting())   // activate immediately, don't wait for old SW to die
  );
});

// ── ACTIVATE: delete ALL old caches ──
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())  // take control of all open tabs immediately
  );
});

// ── FETCH ──
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = event.request.url;

  // Never intercept Firebase / Google API calls
  if (
    url.includes('firestore') ||
    url.includes('firebase') ||
    url.includes('googleapis') ||
    url.includes('gstatic') ||
    url.includes('fonts.g')
  ) return;

  const isHTML = HTML_PAGES.some(p => url.endsWith(p)) || url === location.origin + '/';

  if (isHTML) {
    // ── NETWORK FIRST for HTML ──
    // Always try the network so fresh deploys are seen immediately.
    // Only fall back to cache when genuinely offline.
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache the fresh copy for offline use
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))  // offline fallback
    );
  } else {
    // ── CACHE FIRST for static assets (fonts, icons, etc.) ──
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        }).catch(() => {});
      })
    );
  }
});

// ── PUSH NOTIFICATIONS (unchanged) ──
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
