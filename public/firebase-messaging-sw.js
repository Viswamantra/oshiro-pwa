/* eslint-disable no-undef */
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBekN6ULTaosrBQzv-JvBlnMcCOMXZ-_JU",
  authDomain: "oshiro-app.firebaseapp.com",
  projectId: "oshiro-app",
  messagingSenderId: "1066886336420",
  appId: "1:1066886336420:web:458379909954c206917b31",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("📩 Background message received", payload);

  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: "/logo192.png",
  });
});
