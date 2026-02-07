/**
 * =========================================================
 * FIREBASE INITIALIZATION (ULTIMATE PRODUCTION SAFE FINAL)
 * ---------------------------------------------------------
 * ✔ Single app instance (HMR safe)
 * ✔ Lazy Messaging Init
 * ✔ Push System Ready
 * ✔ Vite / Rollup / Vercel Safe
 * ✔ SSR Safe
 * ✔ Race Condition Safe
 * ✔ Mobile Browser Safe
 * ✔ Service Worker Safe
 * =========================================================
 */

import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

/* ======================
   FIREBASE CONFIG
====================== */
const firebaseConfig = {
  apiKey: "AIzaSyBekN6ULTaosrBQzv-JvBlnMcCOMXZ-_JU",
  authDomain: "oshiro-app.firebaseapp.com",
  projectId: "oshiro-app",
  storageBucket: "oshiro-app.appspot.com",
  messagingSenderId: "1066886336420",
  appId: "1:1066886336420:web:458379909954c206917b31",
};

/* ======================
   APP INIT (HMR SAFE)
====================== */
export const app =
  getApps().length === 0
    ? initializeApp(firebaseConfig)
    : getApp();

/* ======================
   CORE EXPORTS
====================== */
export const db = getFirestore(app);
export const auth = getAuth(app);

/* =========================================================
   LAZY MESSAGING INIT (ULTRA SAFE)
========================================================= */

let _messaging = null;
let _messagingInitPromise = null;

/**
 * Safe Firebase Messaging Getter
 * Returns null if not supported
 */
export async function getFirebaseMessaging() {

  /* ---------- SSR SAFE ---------- */
  if (typeof window === "undefined") return null;

  /* ---------- Basic Browser Support ---------- */
  if (!("serviceWorker" in navigator)) {
    console.warn("❌ Service Worker not supported");
    return null;
  }

  if (!("Notification" in window)) {
    console.warn("❌ Notifications not supported");
    return null;
  }

  if (!("PushManager" in window)) {
    console.warn("❌ PushManager not supported");
    return null;
  }

  /* ---------- Already Ready ---------- */
  if (_messaging) return _messaging;

  /* ---------- Prevent Double Init ---------- */
  if (_messagingInitPromise) return _messagingInitPromise;

  _messagingInitPromise = (async () => {
    try {

      console.log("🔥 Initializing Firebase Messaging...");

      const messagingModule = await import("firebase/messaging");

      const isSupported = messagingModule.isSupported;
      const getMessaging = messagingModule.getMessaging;

      const supported = await isSupported();

      if (!supported) {
        console.warn("❌ Firebase Messaging not supported in browser");
        return null;
      }

      _messaging = getMessaging(app);

      console.log("✅ Firebase Messaging Ready");

      return _messaging;

    } catch (err) {

      console.error("❌ Messaging init failed:", err);
      return null;

    } finally {

      _messagingInitPromise = null;

    }
  })();

  return _messagingInitPromise;
}
