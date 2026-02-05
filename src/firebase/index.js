/**
 * =========================================================
 * FIREBASE INITIALIZATION (VITE + ROLLUP SAFE)
 * ---------------------------------------------------------
 * ✔ Single app instance (HMR safe)
 * ✔ No top-level async side effects
 * ✔ Messaging loaded ONLY when needed
 * ✔ DEV + PROD + Vercel safe
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
   LAZY MESSAGING INIT (NO TOP-LEVEL IMPORT)
========================================================= */
let _messaging = null;

export async function getFirebaseMessaging() {
  if (typeof window === "undefined") return null;
  if (!("serviceWorker" in navigator)) return null;
  if (!("Notification" in window)) return null;

  if (_messaging) return _messaging;

  try {
    const { getMessaging, isSupported } = await import(
      "firebase/messaging"
    );

    const supported = await isSupported();
    if (!supported) {
      console.warn("❌ Firebase Messaging not supported");
      return null;
    }

    _messaging = getMessaging(app);
    console.log("🔥 Firebase Messaging initialized");
    return _messaging;
  } catch (err) {
    console.error("❌ Messaging init failed:", err);
    return null;
  }
}
