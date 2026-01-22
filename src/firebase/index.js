/**
 * =========================================================
 * FIREBASE INITIALIZATION (VITE SAFE – SINGLE INSTANCE)
 * ---------------------------------------------------------
 * ✔ Prevents duplicate app initialization
 * ✔ Exports Firestore, Auth, Messaging
 * ✔ Compatible with DEV + PROD + HMR
 * ✔ Safe for Web Push (FCM)
 * =========================================================
 */

import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getMessaging, isSupported } from "firebase/messaging";

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
   INIT (SAFE FOR HMR)
====================== */
const app = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApp();

/* ======================
   CORE EXPORTS
====================== */
export const db = getFirestore(app);
export const auth = getAuth(app);

/* ======================
   MESSAGING (SAFE CHECK)
   - Required for Web Push
   - Avoids SSR / unsupported browser crash
====================== */
export let messaging = null;

if (typeof window !== "undefined") {
  isSupported()
    .then((supported) => {
      if (supported) {
        messaging = getMessaging(app);
        console.log("🔥 Firebase Messaging enabled");
      } else {
        console.warn("❌ Firebase Messaging not supported in this browser");
      }
    })
    .catch((err) => {
      console.error("Messaging init error:", err);
    });
}

export default app;
