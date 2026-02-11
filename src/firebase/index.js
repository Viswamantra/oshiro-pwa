import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

/* ================= CONFIG ================= */

const firebaseConfig = {
  apiKey: "AIzaSyBekN6ULTaosrBQzv-JvBlnMcCOMXZ-_JU",
  authDomain: "oshiro-app.firebaseapp.com",
  projectId: "oshiro-app",
  storageBucket: "oshiro-app.appspot.com",
  messagingSenderId: "1066886336420",
  appId: "1:1066886336420:web:458379909954c206917b31",
};

/* ================= APP ================= */

export const app =
  getApps().length === 0
    ? initializeApp(firebaseConfig)
    : getApp();

/* ================= CORE ================= */

export const db = getFirestore(app);
export const auth = getAuth(app);

/* ================= MESSAGING ================= */

let _messaging = null;
let _initPromise = null;

export async function getFirebaseMessaging() {

  if (typeof window === "undefined") return null;

  if (!("serviceWorker" in navigator)) return null;
  if (!("Notification" in window)) return null;
  if (!("PushManager" in window)) return null;

  if (_messaging) return _messaging;
  if (_initPromise) return _initPromise;

  _initPromise = (async () => {

    try {

      const { isSupported, getMessaging } =
        await import("firebase/messaging");

      const supported = await isSupported();
      if (!supported) return null;

      _messaging = getMessaging(app);
      return _messaging;

    } catch (err) {
      console.error("Messaging init error:", err);
      return null;
    }

  })();

  return _initPromise;
}
