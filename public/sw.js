const CACHE_NAME = 'logicheck_cache_v1';

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/index.css',
  '/sw.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('LogiCheck SW: Caching core assets...');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('LogiCheck SW: Removing old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Only cache GET requests
  if (event.request.method !== 'GET') return;

  // Do not attempt to cache API or auth endpoints
  if (event.request.url.includes('supabase.co') || event.request.url.includes('/api/') || event.request.url.includes('/auth/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // If navigation failed, return cached index.html as a friendly fallback
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});

// Background Sync
self.addEventListener('sync', (event) => {
  console.log('[BG Sync] Event:', event.tag);
  
  if (event.tag === 'sync-records') {
    event.waitUntil(syncPendingRecords());
  }
});

async function syncPendingRecords() {
  try {
    const db = await indexedDB.open('logicheck', 1);
    const tx = db.transaction('pendingRecords', 'readonly');
    const records = await tx.objectStore('pendingRecords').getAll();

    for (const record of records) {
      const response = await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
      });

      if (response.ok) {
        const deleteTx = db.transaction('pendingRecords', 'readwrite');
        await deleteTx.objectStore('pendingRecords').delete(record.id);
      }
    }

    console.log('[BG Sync] ✅ Sincronização completa');
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({ type: 'SYNC_COMPLETE' });
      });
    });
  } catch (error) {
    console.error('[BG Sync] ❌ Erro:', error);
    throw error;
  }
}

// Push Notifications
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title || 'LogiCheck Notificação';
  const options = {
    body: data.body || '',
    icon: '/manifest.json',
    badge: 'https://cdn-icons-png.flaticon.com/512/9356/9356230.png',
    tag: 'logicheck-notification',
    requireInteraction: data.requireInteraction || false,
    data: data.data || {}
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (let client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
