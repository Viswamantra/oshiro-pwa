/**
 * =========================================================
 * OSHIRO FIREBASE CLIENT GATEWAY — FINAL PRODUCTION VERSION
 * ---------------------------------------------------------
 * ✔ Central Firebase export bridge
 * ✔ Foreground Push handler
 * ✔ Safe messaging lazy loader support
 * ✔ Global push event bridge (oshiro:push)
 * ✔ Mobile browser safe
 * ✔ Production logging
 * ✔ Future topic + silent push ready
 * =========================================================
 */

/* =========================================================
   BASE EXPORTS (DO NOT BREAK EXISTING IMPORTS)
========================================================= */

export {
  app,
  db,
  auth,
  getFirebaseMessaging,
} from "./index";

/* =========================================================
   PUSH FOREGROUND HANDLER
========================================================= */

import { onMessage } from "firebase/messaging";
import { getFirebaseMessaging } from "./index";

/* =========================================================
   INTERNAL FLAGS
========================================================= */

let _foregroundInitialized = false;

/* =========================================================
   INIT FOREGROUND PUSH LISTENER
   Call once from main.jsx OR App.jsx
========================================================= */

export async function initForegroundPushListener() {

  try {

    if (_foregroundInitialized) {
      console.log("[PUSH] Foreground already initialized");
      return;
    }

    const messaging = await getFirebaseMessaging();

    if (!messaging) {
      console.log("[PUSH] Messaging not available");
      return;
    }

    onMessage(messaging, (payload) => {

      console.log("[PUSH] 📩 Foreground Push Received:", payload);

      /* ---------- GLOBAL EVENT (APP WIDE) ---------- */

      window.dispatchEvent(
        new CustomEvent("oshiro:push", {
          detail: payload,
        })
      );

      /* ---------- OPTIONAL DEFAULT FALLBACK ---------- */

      if (payload?.notification?.title) {
        console.log(
          `[PUSH] Notification → ${payload.notification.title}`
        );
      }
    });

    _foregroundInitialized = true;

    console.log("[PUSH] ✅ Foreground listener initialized");

  } catch (err) {
    console.error("[PUSH] ❌ Foreground listener crash:", err);
  }
}
