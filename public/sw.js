const CACHE_VERSION = 'v2';
const CACHE_NAME = `asegurar-${CACHE_VERSION}`;
const STATIC_CACHE = `asegurar-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `asegurar-dynamic-${CACHE_VERSION}`;
const API_CACHE = `asegurar-api-${CACHE_VERSION}`;

// ── Assets to pre-cache ──
const PRECACHE_URLS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/logo.png',
];

// ── Cache size limits ──
const DYNAMIC_CACHE_LIMIT = 50;
const API_CACHE_LIMIT = 30;

// ── Trim cache to limit ──
const trimCache = async (cacheName, maxItems) => {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    await cache.delete(keys[0]);
    await trimCache(cacheName, maxItems);
  }
};

// ── Install: pre-cache shell ──
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: clean old caches ──
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => !k.includes(CACHE_VERSION))
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ── Fetch strategy router ──
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET, chrome-extension, etc.
  if (request.method !== 'GET') return;
  if (url.protocol === 'chrome-extension:') return;

  // Navigation: Network-first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match('/offline.html'))
    );
    return;
  }

  // API calls: Network-first, cache fallback (stale-while-revalidate)
  if (url.pathname.includes('/rest/') || url.hostname.includes('supabase')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(API_CACHE).then((cache) => {
            cache.put(request, clone);
            trimCache(API_CACHE, API_CACHE_LIMIT);
          });
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Static assets: Cache-first
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff2|woff|ttf|webp)$/) ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          const clone = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          return response;
        });
      })
    );
    return;
  }

  // Dynamic content: Network-first with dynamic cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        const clone = response.clone();
        caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(request, clone);
          trimCache(DYNAMIC_CACHE, DYNAMIC_CACHE_LIMIT);
        });
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// ── Background Sync ──
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-telemetry') {
    event.waitUntil(syncTelemetryData());
  }
  if (event.tag === 'sync-alerts') {
    event.waitUntil(syncAlertData());
  }
  if (event.tag === 'sync-pqr') {
    event.waitUntil(syncPQRData());
  }
});

const syncTelemetryData = async () => {
  try {
    const db = await openIndexedDB();
    const tx = db.transaction('pending-telemetry', 'readonly');
    const store = tx.objectStore('pending-telemetry');
    const items = await getAllFromStore(store);

    for (const item of items) {
      try {
        await fetch('/api/telemetry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.data),
        });
        // Remove synced item
        const delTx = db.transaction('pending-telemetry', 'readwrite');
        delTx.objectStore('pending-telemetry').delete(item.id);
      } catch (err) {
        console.warn('[SW] Telemetry sync failed for item', item.id);
      }
    }
  } catch (err) {
    console.warn('[SW] Telemetry sync error:', err);
  }
};

const syncAlertData = async () => {
  try {
    const db = await openIndexedDB();
    const tx = db.transaction('pending-alerts', 'readonly');
    const store = tx.objectStore('pending-alerts');
    const items = await getAllFromStore(store);

    for (const item of items) {
      try {
        await fetch('/api/alerts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.data),
        });
        const delTx = db.transaction('pending-alerts', 'readwrite');
        delTx.objectStore('pending-alerts').delete(item.id);
      } catch (err) {
        console.warn('[SW] Alert sync failed');
      }
    }
  } catch (err) {
    console.warn('[SW] Alert sync error:', err);
  }
};

const syncPQRData = async () => {
  try {
    const db = await openIndexedDB();
    const tx = db.transaction('pending-pqr', 'readonly');
    const store = tx.objectStore('pending-pqr');
    const items = await getAllFromStore(store);

    for (const item of items) {
      try {
        await fetch('/api/pqr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.data),
        });
        const delTx = db.transaction('pending-pqr', 'readwrite');
        delTx.objectStore('pending-pqr').delete(item.id);
      } catch (err) {
        console.warn('[SW] PQR sync failed');
      }
    }
  } catch (err) {
    console.warn('[SW] PQR sync error:', err);
  }
};

// ── Push Notifications ──
self.addEventListener('push', (event) => {
  let data = { title: 'CELLVI 2.0', body: 'Nueva notificación', icon: '/logo.png' };

  try {
    if (event.data) {
      data = { ...data, ...event.data.json() };
    }
  } catch (e) {
    if (event.data) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/logo.png',
    badge: '/logo.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'cellvi-notification',
    renotify: true,
    requireInteraction: data.severity === 'critical',
    data: {
      url: data.url || '/',
      timestamp: Date.now(),
    },
    actions: [
      { action: 'open', title: 'Abrir' },
      { action: 'dismiss', title: 'Descartar' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const url = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        const existingClient = clients.find((c) => c.url.includes(url));
        if (existingClient) {
          return existingClient.focus();
        }
        return self.clients.openWindow(url);
      })
  );
});

// ── IndexedDB helpers ──
const openIndexedDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('cellvi-offline', 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pending-telemetry')) {
        db.createObjectStore('pending-telemetry', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('pending-alerts')) {
        db.createObjectStore('pending-alerts', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('pending-pqr')) {
        db.createObjectStore('pending-pqr', { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const getAllFromStore = (store) => {
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// ── Periodic Background Sync (for telemetry refresh) ──
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'refresh-fleet-data') {
    event.waitUntil(
      fetch('/api/fleet/status')
        .then((res) => res.json())
        .then((data) => {
          // Cache the refreshed fleet data
          return caches.open(API_CACHE).then((cache) => {
            const response = new Response(JSON.stringify(data), {
              headers: { 'Content-Type': 'application/json' },
            });
            return cache.put('/api/fleet/status', response);
          });
        })
        .catch(() => console.warn('[SW] Periodic sync failed'))
    );
  }
});
