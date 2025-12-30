import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import SelectRole from "./pages/SelectRole";
import MerchantDashboard from "./pages/MerchantDashboard";
import CustomerDashboard from "./pages/CustomerDashboard";
import AdminDashboard from "./pages/AdminDashboard";

/* 🔔 Firebase foreground notifications */
import { getMessaging, onMessage } from "firebase/messaging";
import { initializeApp } from "firebase/app";

/* 🔥 SAME Firebase config (must match firebase.js) */
const firebaseConfig = {
  apiKey: "AIzaSyBekN6ULTaosrBQzv-JvBlnMcCOMXZ-_JU",
  authDomain: "oshiro-app.firebaseapp.com",
  projectId: "oshiro-app",
  storageBucket: "oshiro-app.firebasestorage.app",
  messagingSenderId: "1066886336420",
  appId: "1:1066886336420:web:458379909954c206917b31",
};

const app = initializeApp(firebaseConfig);

export default function App() {
  /* =========================================================
     🔔 FOREGROUND PUSH HANDLER (CRITICAL)
     Shows alert when app/tab is OPEN
  ========================================================= */
  useEffect(() => {
    try {
      const messaging = getMessaging(app);

      onMessage(messaging, (payload) => {
        console.log("🔔 Foreground notification received:", payload);

        // Simple visible alert (you can replace with Snackbar later)
        if (payload?.notification) {
          alert(
            `${payload.notification.title}\n\n${payload.notification.body}`
          );
        }
      });
    } catch (err) {
      console.error("FCM foreground error:", err);
    }
  }, []);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/select-role" element={<SelectRole />} />
      <Route path="/merchant" element={<MerchantDashboard />} />
      <Route path="/customer" element={<CustomerDashboard />} />
      <Route path="/admin" element={<AdminDashboard />} />

      {/* default */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* catch-all */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
