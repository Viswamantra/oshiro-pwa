/* ======================================================
   FIREBASE MESSAGING SERVICE WORKER
   OSHIRO PWA
====================================================== */

/* Firebase compat libraries (required for SW) */
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js");

/* ======================================================
   FIREBASE CONFIG
====================================================== */
firebase.initializeApp({
  apiKey: "AIzaSyBekN6ULTaosrBQzv-JvBlnMcCOMXZ-_JU",
  authDomain: "oshiro-app.firebaseapp.com",
  projectId: "oshiro-app",
  messagingSenderId: "1066886336420",
  appId: "1:1066886336420:web:458379909954c206917b31"
});

/* ======================================================
   MESSAGING INSTANCE
====================================================== */
const messaging = firebase.messaging();

/* ======================================================
   BACKGROUND MESSAGE HANDLER
====================================================== */
messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Background message:",
    payload
  );

  const title =
    payload?.notification?.title || "Oshiro Alert";

  const options = {
    body:
      payload?.notification?.body ||
      "You have a new notification",
    icon: "/icon-192.png",
    badge: "/badge-72.png",
    data: {
      click_action: payload?.notification?.click_action || "/"
    }
  };

  self.registration.showNotification(title, options);
});

/* ======================================================
   NOTIFICATION CLICK HANDLER
====================================================== */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl =
    event.notification?.data?.click_action || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === targetUrl && "focus" in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});
