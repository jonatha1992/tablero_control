importScripts('https://www.gstatic.com/firebasejs/12.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.12.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyDfdKHelBDB1N5sA_nQ5cQMDe93MAU8WjY",
  authDomain: "gestordetrabajo.firebaseapp.com",
  projectId: "gestordetrabajo",
  storageBucket: "gestordetrabajo.firebasestorage.app",
  messagingSenderId: "478008899800",
  appId: "1:478008899800:web:a5618898a550dff9f67fad"
};

// Initialize Firebase in the service worker
firebase.initializeApp(firebaseConfig);

// Retrieve firebase messaging
const messaging = firebase.messaging();

// Skip waiting so the new SW activates immediately and avoids stale channel issues
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle background messages — use event.waitUntil via the promise returned
// by onBackgroundMessage to keep the SW alive until showNotification resolves.
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  const notificationTitle = payload.notification?.title || 'Nueva Notificación';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/icon-cropped.png',
    badge: '/icon-cropped.png',
    data: payload.data,
  };

  // Return the promise so the compat SDK can wrap it with waitUntil internally
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
