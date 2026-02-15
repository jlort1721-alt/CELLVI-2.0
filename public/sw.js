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
  // Enhanced: Process mutation queue from offline system
  if (event.tag === 'process-mutation-queue') {
    event.waitUntil(processMutationQueue());
  }

  // Legacy sync handlers (keep for backwards compatibility)
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

// New: Process mutation queue from IndexedDB
const processMutationQueue = async () => {
  try {
    // Open our new offline database
    const db = await openOfflineDB();
    const tx = db.transaction('offline_mutations', 'readonly');
    const store = tx.objectStore('offline_mutations');
    const index = store.index('status');
    const request = index.getAll('pending');

    const mutations = await new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    console.log(`[SW] Processing ${mutations.length} pending mutations`);

    // Notify main app to process queue
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'PROCESS_QUEUE',
        payload: { count: mutations.length }
      });
    });
  } catch (err) {
    console.warn('[SW] Mutation queue sync error:', err);
  }
};

// Open the new offline database
const openOfflineDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('cellvi_offline_db', 1);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

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

// ── Periodic Background Sync (refresh critical data when idle) ──
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic sync triggered:', event.tag);

  if (event.tag === 'refresh-fleet-data') {
    event.waitUntil(refreshFleetData());
  }

  if (event.tag === 'refresh-alerts') {
    event.waitUntil(refreshAlerts());
  }

  if (event.tag === 'cleanup-old-data') {
    event.waitUntil(cleanupOldCacheData());
  }
});

// Refresh fleet positions and status
const refreshFleetData = async () => {
  try {
    console.log('[SW] Refreshing fleet data in background');

    // Fetch latest vehicle positions
    const response = await fetch('/api/fleet/status');
    if (!response.ok) throw new Error('Fleet fetch failed');

    const data = await response.json();

    // Update cache
    const cache = await caches.open(API_CACHE);
    const cacheResponse = new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'max-age=300' },
    });
    await cache.put('/api/fleet/status', cacheResponse);

    // Notify open clients
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'FLEET_DATA_REFRESHED',
        payload: { timestamp: Date.now(), count: data.length }
      });
    });

    console.log('[SW] Fleet data refreshed successfully');
  } catch (err) {
    console.warn('[SW] Fleet data refresh failed:', err);
  }
};

// Refresh critical alerts
const refreshAlerts = async () => {
  try {
    console.log('[SW] Refreshing alerts in background');

    const response = await fetch('/api/alerts/critical');
    if (!response.ok) throw new Error('Alerts fetch failed');

    const data = await response.json();

    // If new critical alerts, show notification
    if (data.length > 0 && data.some(alert => alert.isNew)) {
      await self.registration.showNotification('CELLVI 2.0 - Alerta Crítica', {
        body: `${data.length} alerta(s) crítica(s) requieren atención`,
        icon: '/logo.png',
        badge: '/badge-icon.png',
        tag: 'critical-alerts',
        requireInteraction: true,
        data: { url: '/platform/alerts', alerts: data },
        actions: [
          { action: 'view', title: 'Ver Alertas' },
          { action: 'dismiss', title: 'Cerrar' },
        ],
      });
    }

    console.log('[SW] Alerts refreshed successfully');
  } catch (err) {
    console.warn('[SW] Alerts refresh failed:', err);
  }
};

// Cleanup old cache entries
const cleanupOldCacheData = async () => {
  try {
    console.log('[SW] Cleaning up old cache data');

    const cache = await caches.open(API_CACHE);
    const requests = await cache.keys();
    const now = Date.now();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

    let deletedCount = 0;

    for (const request of requests) {
      const response = await cache.match(request);
      if (!response) continue;

      const dateHeader = response.headers.get('date');
      if (dateHeader) {
        const cacheDate = new Date(dateHeader).getTime();
        if (now - cacheDate > maxAge) {
          await cache.delete(request);
          deletedCount++;
        }
      }
    }

    console.log(`[SW] Cleaned up ${deletedCount} old cache entries`);
  } catch (err) {
    console.warn('[SW] Cache cleanup failed:', err);
  }
};
