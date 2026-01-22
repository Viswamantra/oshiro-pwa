import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

/* ======================
   GLOBAL STYLES
====================== */
import "./index.css";

/**
 * =========================================================
 * FCM SERVICE WORKER REGISTRATION
 * ---------------------------------------------------------
 * ✔ Required for background push notifications
 * ✔ Safe for Vite / React 18
 * ✔ Prevents duplicate registrations
 * =========================================================
 */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      // Avoid duplicate registration during HMR / refresh
      const registrations =
        await navigator.serviceWorker.getRegistrations();

      const alreadyRegistered = registrations.some(
        (reg) =>
          reg.active &&
          reg.active.scriptURL.includes("firebase-messaging-sw.js")
      );

      if (!alreadyRegistered) {
        await navigator.serviceWorker.register(
          "/firebase-messaging-sw.js"
        );
        console.log("✅ FCM service worker registered");
      } else {
        console.log("ℹ️ FCM service worker already registered");
      }
    } catch (err) {
      console.warn(
        "❌ FCM service worker registration failed:",
        err
      );
    }
  });
}

/**
 * =========================================================
 * APPLICATION BOOTSTRAP (REACT 18)
 * =========================================================
 */
const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
