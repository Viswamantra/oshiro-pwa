/* =========================================================
   OSHIRO UNIVERSAL PUSH SERVICE WORKER — PRODUCTION FINAL
   Works on: foreground, background, killed, Android Chrome
========================================================= */

const SW_VERSION = "oshiro-sw-v3";

/* ================= INSTALL ================= */
self.addEventListener("install", () => {
  console.log("SW Installed:", SW_VERSION);
  self.skipWaiting();
});

/* ================= ACTIVATE ================= */
self.addEventListener("activate", (event) => {
  console.log("SW Activated:", SW_VERSION);
  event.waitUntil(self.clients.claim());
});

/* ================= FIREBASE ================= */
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBekN6ULTaosrBQzv-JvBlnMcCOMXZ-_JU",
  authDomain: "oshiro-app.firebaseapp.com",
  projectId: "oshiro-app",
  storageBucket: "oshiro-app.appspot.com",
  messagingSenderId: "1066886336420",
  appId: "1:1066886336420:web:458379909954c206917b31",
});

const messaging = firebase.messaging();

/* =========================================================
   SAFE DISPLAY FUNCTION
========================================================= */
function displayNotification(payload) {

  if (!payload) return;

  const notification = payload.notification || {};
  const data = payload.data || {};

  const title =
    notification.title ||
    data.title ||
    "OshirO";

  const options = {
    body:
      notification.body ||
      data.body ||
      "You have a new update",
    icon: "/icon-192.png",
    badge: "/badge-72.png",
    tag: data.leadId || "oshiro",
    renotify: true,
    requireInteraction: true,
    data: {
      url: data.click_action || "/merchant"
    }
  };

  return self.registration.showNotification(title, options);
}

/* =========================================================
   FCM HANDLER (IMPORTANT)
   Handles notification + data payload
========================================================= */
messaging.onBackgroundMessage((payload) => {
  console.log("FCM Background:", payload);
  return displayNotification(payload);
});

/* =========================================================
   RAW PUSH HANDLER (ANDROID RELIABILITY)
========================================================= */
self.addEventListener("push", (event) => {

  if (!event.data) return;

  let payload = {};

  try {
    payload = event.data.json();
  } catch {
    console.log("Push non-json");
    return;
  }

  console.log("RAW PUSH:", payload);

  event.waitUntil(displayNotification(payload));
});

/* =========================================================
   CLICK ACTION
========================================================= */
self.addEventListener("notificationclick", (event) => {

  event.notification.close();

  const target = event.notification?.data?.url || "/merchant";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true })
      .then((clientsArr) => {

        for (const client of clientsArr) {
          if (client.url.includes(target) && "focus" in client)
            return client.focus();
        }

        return clients.openWindow(target);
      })
  );
});
