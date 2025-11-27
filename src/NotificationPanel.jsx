// src/NotificationPanel.jsx
import React, { useState, useEffect } from "react";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyBekN6ULTaosrBQzv-JvBlnMcCOMXZ-_JU",
  authDomain: "oshiro-app.firebaseapp.com",
  projectId: "oshiro-app",
  storageBucket: "oshiro-app.firebasestorage.app",
  messagingSenderId: "1066886336420",
  appId: "1:1066886336420:web:458379909954c206917b31"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export default function NotificationPanel() {
  const [token, setToken] = useState("");
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    // Request permission
    Notification.requestPermission().then(async (status) => {
      if (status === "granted") {
        try {
          const currentToken = await getToken(messaging, {
            vapidKey:
              "BDWXe8Zg_7QgJT8l6m-ZB9P0F3TrchdNVUOmWM1qfH0hFgezGOKiDqV6XT4FnGCFNXpE51Q8KiOkW1pEMRkEo8g",
          });
          setToken(currentToken);
        } catch (error) {
          console.error("Token error:", error);
        }
      }
    });

    // Foreground messages
    onMessage(messaging, (payload) => {
      setMessages((prev) => [...prev, payload.notification]);
    });
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>Firebase Push Notifications</h2>

      <h4>Your FCM Token:</h4>
      <textarea
        value={token}
        readOnly
        rows={3}
        style={{ width: "100%" }}
      />

      <h4>Incoming Messages:</h4>
      <ul>
        {messages.map((msg, i) => (
          <li key={i}>
            <b>{msg.title}</b> — {msg.body}
          </li>
        ))}
      </ul>
    </div>
  );
}
