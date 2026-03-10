// Mentis Service Worker for PWA Support
// Version 2 - Enhanced for PWA Builder compatibility
const CACHE_VERSION = 'v2';
const CACHE_NAME = `mentis-cache-${CACHE_VERSION}`;
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png'
];

// Install event - cache core assets
self.addEventListener('install', (event) => {
  console.log('Mentis SW: Installing version', CACHE_VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Mentis SW: Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .catch((err) => {
        console.log('Mentis SW: Cache failed', err);
      })
  );
  // Force the waiting service worker to become active
  self.skipWaiting();
});

// Activate event - clean up old caches and take control
self.addEventListener('activate', (event) => {
  console.log('Mentis SW: Activating version', CACHE_VERSION);
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName.startsWith('mentis-cache')) {
            console.log('Mentis SW: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all clients immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip API requests (always fetch from network)
  if (event.request.url.includes('/api/')) return;
  
  // Skip WebSocket requests
  if (event.request.url.includes('ws://') || event.request.url.includes('wss://')) return;
  
  // Skip chrome-extension and other non-http(s) requests
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone the response for caching
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache if network fails
        return caches.match(event.request)
          .then((response) => {
            if (response) {
              return response;
            }
            // If the request is for a page, return the cached index.html
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
            return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
          });
      })
  );
});

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('Mentis SW: Push received');
  
  let notificationData = {
    title: 'Mentis',
    body: 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: 'mentis-notification',
    data: { url: '/' }
  };
  
  // Try to parse push data
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (e) {
      notificationData.body = event.data.text();
    }
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon || '/icons/icon-192x192.png',
    badge: notificationData.badge || '/icons/icon-72x72.png',
    vibrate: [100, 50, 100, 50, 100],
    tag: notificationData.tag || 'mentis-notification',
    renotify: true,
    requireInteraction: false,
    data: notificationData.data || { url: '/' },
    actions: [
      { action: 'open', title: 'Open Mentis' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Mentis SW: Notification clicked', event.action);
  event.notification.close();
  
  if (event.action === 'dismiss') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        // Open new window if none exists
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('Mentis SW: Notification closed');
});

// Listen for messages from the main app
self.addEventListener('message', (event) => {
  console.log('Mentis SW: Message received', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CHECK_UPDATE') {
    // Force update check
    self.registration.update();
  }
});

// Background sync for offline actions (future feature)
self.addEventListener('sync', (event) => {
  console.log('Mentis SW: Sync event', event.tag);
  
  if (event.tag === 'send-message') {
    event.waitUntil(
      // Handle queued messages when back online
      Promise.resolve()
    );
  }
});
