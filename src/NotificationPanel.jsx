// src/NotificationPanel.jsx
import React, { useEffect, useState } from "react";
import firebase from "firebase/compat/app";
import "firebase/compat/messaging";

// Client-side Firebase config (same as SW)
const firebaseConfig = {
  apiKey: "AIzaSyBekN6ULTaosrBQzv-JvBlnMcCOMXZ-_JU",
  authDomain: "oshiro-app.firebaseapp.com",
  projectId: "oshiro-app",
  storageBucket: "oshiro-app.firebasestorage.app",
  messagingSenderId: "1066886336420",
  appId: "1:1066886336420:web:458379909954c206917b31",
};

// Initialize firebase only once
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export default function NotificationPanel() {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    // use compat messaging
    const messaging = firebase.messaging();

    // Request permission and get token
    const enableNotifications = async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          setError("Notification permission denied");
          return;
        }

        // In compat mode, getToken still works from messaging
        const currentToken = await messaging.getToken({
          vapidKey: process.env.VITE_FIREBASE_VAPID_KEY || ""
        });

        if (currentToken) {
          console.log("FCM token:", currentToken);
          setToken(currentToken);
        } else {
          setError("No registration token available.");
        }
      } catch (err) {
        console.error("Error getting token:", err);
        setError("Error getting token: " + (err.message || err));
      }
    };

    enableNotifications();

    // Foreground message handler
    messaging.onMessage((payload) => {
      console.log("Foreground message:", payload);
      if (payload?.notification?.title) {
        // show a simple alert (you can replace with your own UI)
        alert(`${payload.notification.title}\n\n${payload.notification.body || ""}`);
      }
    });
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>Push Notifications</h2>

      <div style={{ marginBottom: 12 }}>
        <button
          onClick={() => {
            // attempt to copy token
            if (token) navigator.clipboard?.writeText(token);
            alert(token ? "Token copied to clipboard" : "No token yet");
          }}
          style={{ padding: "8px 12px", borderRadius: 6 }}
        >
          Copy Token
        </button>
      </div>

      {token ? (
        <>
          <div><b>Your FCM token:</b></div>
          <textarea value={token} readOnly style={{ width: "100%", height: 120 }} />
        </>
      ) : (
        <div style={{ color: "red" }}>{error || "Generating token..."}</div>
      )}
    </div>
  );
}
