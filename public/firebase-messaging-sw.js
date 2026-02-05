/* ======================================================
   FIREBASE MESSAGING SERVICE WORKER
   OSHIRO PWA – PRODUCTION READY
---------------------------------------------------------
✔ Compatible with Firebase v9+ (compat)
✔ Reliable background notifications
✔ Safe defaults for title/body
✔ Proper click handling (focus / open)
✔ Works with Vite + HTTPS
====================================================== */

/* ======================
   FIREBASE COMPAT SDKS
====================== */
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js");

/* ======================
   FIREBASE CONFIG
====================== */
firebase.initializeApp({
  apiKey: "AIzaSyBekN6ULTaosrBQzv-JvBlnMcCOMXZ-_JU",
  authDomain: "oshiro-app.firebaseapp.com",
  projectId: "oshiro-app",
  storageBucket: "oshiro-app.appspot.com",
  messagingSenderId: "1066886336420",
  appId: "1:1066886336420:web:458379909954c206917b31",
});

/* ======================
   MESSAGING INSTANCE
====================== */
const messaging = firebase.messaging();

/* ======================
   BACKGROUND MESSAGE HANDLER
====================== */
messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Background message received:",
    payload
  );

  const notification = payload?.notification || {};
  const data = payload?.data || {};

  const title = notification.title || "OshirO Alert";
  const options = {
    body: notification.body || "You have a new update",
    icon: "/icon-192.png",
    badge: "/badge-72.png",
    tag: data.tag || "oshiro-alert",
    requireInteraction: true, // keeps notification until user acts
    data: {
      url: data.click_action || "/merchant",
    },
  };

  self.registration.showNotification(title, options);
});

/* ======================
   NOTIFICATION CLICK HANDLER
====================== */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl =
    event.notification?.data?.url || "/merchant";

  event.waitUntil(
    clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then((clientList) => {
        // Focus already open tab
        for (const client of clientList) {
          if (client.url.includes(targetUrl) && "focus" in client) {
            return client.focus();
          }
        }
        // Open new tab
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});
