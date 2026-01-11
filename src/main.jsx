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
 * Used for Firebase Cloud Messaging (Push Notifications)
 * =========================================================
 */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/firebase-messaging-sw.js")
      .then(() => {
        console.log("FCM service worker registered");
      })
      .catch((err) => {
        console.warn("FCM service worker registration failed:", err);
      });
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
