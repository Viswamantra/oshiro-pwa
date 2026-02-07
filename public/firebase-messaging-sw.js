/* ======================================================
   OSHIRO FIREBASE MESSAGING SERVICE WORKER
   FINAL PRODUCTION VERSION
====================================================== */

/* ======================
   FORCE NEW SW TO ACTIVATE FAST
====================== */
self.addEventListener("install", (event) => {
  console.log("✅ SW Installed");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("✅ SW Activated");
  event.waitUntil(self.clients.claim());
});

/* ======================
   FIREBASE COMPAT SDKs
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

/* ======================================================
   BACKGROUND PUSH HANDLER
====================================================== */
messaging.onBackgroundMessage((payload) => {

  console.log("📩 Background Push Received:", payload);

  const notification = payload?.notification || {};
  const data = payload?.data || {};

  const title = notification.title || "OshirO Alert";

  const options = {
    body: notification.body || "You have a new update",
    icon: "/icon-192.png",
    badge: "/badge-72.png",
    tag: data.tag || "oshiro-push",
    requireInteraction: false,

    data: {
      url:
        data.click_action ||
        data.url ||
        "/customer", // safe fallback
    },
  };

  return self.registration.showNotification(title, options);

});

/* ======================================================
   CLICK HANDLER
====================================================== */
self.addEventListener("notificationclick", (event) => {

  event.notification.close();

  const targetUrl =
    event.notification?.data?.url || "/customer";

  console.log("🔗 Opening:", targetUrl);

  event.waitUntil(

    clients.matchAll({
      type: "window",
      includeUncontrolled: true,
    }).then((clientList) => {

      for (const client of clientList) {
        if (client.url.includes(targetUrl) && "focus" in client) {
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }

    })

  );

});
