/**
 * =========================================================
 * OSHIRO APP ENTRY POINT – ENTERPRISE FINAL VERSION
 * ---------------------------------------------------------
 * ✔ Single BrowserRouter
 * ✔ React Strict Mode safe
 * ✔ Service Worker auto ready
 * ✔ Firebase Messaging foreground listener bootstrap
 * ✔ Global push event bridge logging
 * ✔ PWA ready
 * ✔ Mobile Chrome FCM reliability improved
 * ✔ Production logging safe
 * =========================================================
 */

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import "./index.css";

import { initForegroundPushListener } from "./firebase/firebase";

/* =========================================================
   SERVICE WORKER REGISTER
========================================================= */
async function ensureServiceWorkerReady() {

  try {

    if (!("serviceWorker" in navigator)) {
      console.log("[BOOT] ❌ SW not supported");
      return null;
    }

    console.log("[BOOT] ⏳ Registering SW...");

    const registration =
      await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js"
      );

    console.log(
      "[BOOT] ✅ SW Registered:",
      registration.scope
    );

    /* ---------- WAIT UNTIL ACTIVE ---------- */

    await navigator.serviceWorker.ready;

    console.log("[BOOT] ✅ SW Ready");

    return registration;

  } catch (err) {

    console.error("[BOOT] ❌ SW Register Error:", err);
    return null;
  }
}

/* =========================================================
   GLOBAL PUSH DEBUG LOGGER
   (Remove later if needed)
========================================================= */
function attachGlobalPushLogger() {

  window.addEventListener("oshiro:push", (e) => {

    console.log(
      "[BOOT] 🌍 GLOBAL PUSH EVENT:",
      e.detail?.notification?.title || "DATA PUSH"
    );

  });
}

/* =========================================================
   BOOTSTRAP APP
========================================================= */
async function bootstrap() {

  try {

    if (typeof window !== "undefined") {

      /* ---------- SERVICE WORKER FIRST ---------- */
      await ensureServiceWorkerReady();

      /* ---------- FOREGROUND PUSH LISTENER ---------- */
      await initForegroundPushListener();

      /* ---------- GLOBAL PUSH DEBUG ---------- */
      attachGlobalPushLogger();
    }

  } catch (e) {

    console.warn("[BOOT] SW / Push bootstrap skipped:", e);
  }

  /* =========================================================
     RENDER APP
  ========================================================= */

  const root = ReactDOM.createRoot(
    document.getElementById("root")
  );

  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
}

bootstrap();
