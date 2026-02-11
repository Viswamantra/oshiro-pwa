/* ======================================================
   OSHIRO FIREBASE MESSAGING SERVICE WORKER
   FINAL PRODUCTION HARDENED VERSION
   Version: 2026.02 FINAL
====================================================== */

const SW_VERSION = "oshiro-sw-v2026-02";

/* ======================================================
   INSTALL
====================================================== */
self.addEventListener("install", (event) => {
  console.log("✅ SW Installed:", SW_VERSION);
  self.skipWaiting();
});

/* ======================================================
   ACTIVATE
====================================================== */
self.addEventListener("activate", (event) => {
  console.log("✅ SW Activated:", SW_VERSION);

  event.waitUntil(
    (async () => {
      try {
        await self.clients.claim();
        console.log("✅ SW Clients Claimed");
      } catch (err) {
        console.error("❌ SW Activate Error:", err);
      }
    })()
  );
});

/* ======================================================
   FIREBASE SDK LOAD (COMPAT FOR SW)
====================================================== */
importScripts(
  "https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"
);

importScripts(
  "https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js"
);

/* ======================================================
   FIREBASE INIT
====================================================== */
firebase.initializeApp({
  apiKey: "AIzaSyBekN6ULTaosrBQzv-JvBlnMcCOMXZ-_JU",
  authDomain: "oshiro-app.firebaseapp.com",
  projectId: "oshiro-app",
  storageBucket: "oshiro-app.appspot.com",
  messagingSenderId: "1066886336420",
  appId: "1:1066886336420:web:458379909954c206917b31",
});

/* ======================================================
   MESSAGING INSTANCE
====================================================== */
let messaging = null;

try {
  messaging = firebase.messaging();
  console.log("✅ Firebase Messaging SW Ready");
} catch (err) {
  console.error("❌ Messaging Init Failed:", err);
}

/* ======================================================
   BACKGROUND FCM PUSH HANDLER
====================================================== */
if (messaging) {
  messaging.onBackgroundMessage((payload) => {
    try {
      console.log("📩 Background Push Received:", payload);

      const notification = payload?.notification || {};
      const data = payload?.data || {};

      const title =
        notification.title ||
        data.title ||
        "OshirO Alert";

      const options = {
        body:
          notification.body ||
          data.body ||
          "You have a new update",

        icon: "/icon-192.png",
        badge: "/badge-72.png",

        tag: data.tag || "oshiro-push",
        renotify: true,
        requireInteraction: false,

        data: {
          url:
            data.click_action ||
            data.url ||
            "/customer",
        },
      };

      return self.registration.showNotification(title, options);

    } catch (err) {
      console.error("❌ SW Notification Error:", err);
    }
  });
}

/* ======================================================
   NOTIFICATION CLICK HANDLER
====================================================== */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl =
    event.notification?.data?.url || "/customer";

  console.log("🔗 Notification Click →", targetUrl);

  event.waitUntil(
    clients.matchAll({
      type: "window",
      includeUncontrolled: true,
    }).then((clientList) => {

      for (const client of clientList) {
        if (
          client.url.includes(targetUrl) &&
          "focus" in client
        ) {
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

/* ======================================================
   RAW PUSH FALLBACK (NON-FCM PUSH SUPPORT)
====================================================== */
self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const payload = event.data.json();
    console.log("📩 Raw Push JSON:", payload);
  } catch {
    console.log("📩 Raw Push Text:", event.data.text());
  }
});

/* ======================================================
   OPTIONAL: FUTURE CACHE SUPPORT PLACEHOLDER
====================================================== */
/*
self.addEventListener("fetch", (event) => {
  // Future offline caching logic can go here
});
*/
