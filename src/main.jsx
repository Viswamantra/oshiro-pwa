import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import "./index.css";
import { AuthProvider } from "./auth/AuthContext";

/* =========================================================
   SERVICE WORKER REGISTER (DEV + PROD SAFE)
========================================================= */
async function ensureServiceWorkerReady() {
  try {
    if (!("serviceWorker" in navigator)) {
      console.warn("[BOOT] ❌ Service Worker not supported");
      return;
    }

    // Check existing registration
    const existing = await navigator.serviceWorker.getRegistration();

    if (existing) {
      console.log("[BOOT] ✅ SW Already Registered:", existing.scope);
      return;
    }

    // Register SW
    const registration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js"
    );

    await navigator.serviceWorker.ready;

    console.log("[BOOT] ✅ SW Registered & Ready:", registration.scope);
  } catch (err) {
    console.error("[BOOT] ❌ SW Registration Failed:", err);
  }
}

/* =========================================================
   BACKGROUND BOOTSTRAP
========================================================= */
function bootstrapBackgroundTasks() {
  if (typeof window === "undefined") return;

  // Register SW after window load (non-blocking)
  window.addEventListener("load", () => {
    ensureServiceWorkerReady();
  });
}

/* =========================================================
   RENDER APP
========================================================= */
const root = ReactDOM.createRoot(
  document.getElementById("root")
);

root.render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);

/* =========================================================
   START BACKGROUND TASKS
========================================================= */
bootstrapBackgroundTasks();