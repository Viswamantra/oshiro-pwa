/* Firebase core */
importScripts(
  "https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js"
);

/* Initialize Firebase */
firebase.initializeApp({
  apiKey: "AIzaSyBekN6ULTaosrBQzv-JvBlnMcCOMXZ-_JU",
  authDomain: "oshiro-app.firebaseapp.com",
  projectId: "oshiro-app",
  storageBucket: "oshiro-app.firebasestorage.app",
  messagingSenderId: "1066886336420",
  appId: "1:1066886336420:web:458379909954c206917b31",
});

/* Messaging instance */
const messaging = firebase.messaging();

/* ======================================================
   1️⃣ BACKGROUND PUSH (already working)
====================================================== */
messaging.onBackgroundMessage((payload) => {
  console.log("🔔 Background message received:", payload);

  self.registration.showNotification(
    payload.notification?.title || "OshirO Alert",
    {
      body: payload.notification?.body || "You have a new message",
      icon: "/logo192.png",
      data: {
        url: payload.notification?.click_action || "/customer/inbox",
      },
    }
  );
});

/* ======================================================
   2️⃣ NOTIFICATION CLICK HANDLER (NEW – IMPORTANT)
====================================================== */
self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  const targetUrl =
    event.notification?.data?.url || "/customer/inbox";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(
      (clientList) => {
        for (const client of clientList) {
          if (client.url.includes(targetUrl) && "focus" in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      }
    )
  );
});
