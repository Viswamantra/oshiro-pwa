import React, { useEffect, useState } from "react";
import firebase from "firebase/compat/app";
import "firebase/compat/messaging";

// Firebase client-side config
const firebaseConfig = {
  apiKey: "AIzaSyBekN6ULTaosrBQzv-JvBlnMcCOMXZ-_JU",
  authDomain: "oshiro-app.firebaseapp.com",
  projectId: "oshiro-app",
  storageBucket: "oshiro-app.firebasestorage.app",
  messagingSenderId: "1066886336420",
  appId: "1:1066886336420:web:458379909954c206917b31"
};

// Prevent re-initializing Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const NotificationPanel = () => {
  const [token, setToken] = useState("");

  useEffect(() => {
    const messaging = firebase.messaging();

    messaging
      .getToken({ vapidKey: "BJWn6AVm4x..." }) // optional, or remove
      .then((currentToken) => {
        if (currentToken) {
          console.log("🔑 FCM Token:", currentToken);
          setToken(currentToken);
        } else {
          console.warn("❗ No registration token available.");
        }
      })
      .catch((err) => console.error("Token Error: ", err));

    messaging.onMessage((payload) => {
      console.log("📩 Foreground Message:", payload);

      alert(
        `Notification:\n${payload.notification?.title}\n${payload.notification?.body}`
      );
    });
  }, []);

  return (
    <div style={{ padding: "20px", color: "#444" }}>
      <h2>Notifications Active</h2>
      <p>Token (for testing):</p>
      <textarea
        value={token}
        readOnly
        style={{ width: "100%", height: "120px" }}
      />
    </div>
  );
};

export default NotificationPanel;
