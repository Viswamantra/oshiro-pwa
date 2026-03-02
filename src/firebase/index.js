import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getFunctions } from "firebase/functions";

/* =========================================================
   FIREBASE CONFIG
========================================================= */

const firebaseConfig = {
  apiKey: "AIzaSyBekN6ULTaosrBQzv-JvBlnMcCOMXZ-_JU",
  authDomain: "oshiro-app.firebaseapp.com",
  projectId: "oshiro-app",
  storageBucket: "oshiro-app.appspot.com",
  messagingSenderId: "1066886336420",
  appId: "1:1066886336420:web:458379909954c206917b31",
};

/* =========================================================
   SAFE APP INIT
========================================================= */

export const app =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

/* =========================================================
   CORE EXPORTS
========================================================= */

export const db = getFirestore(app);
export const auth = getAuth(app);

/* 🔥 FIX — REGION MATCH */
export const functions = getFunctions(app, "asia-south1");

/* =========================================================
   MESSAGING (LAZY + SAFE)
========================================================= */

let messagingInstance = null;

export async function getFirebaseMessaging() {
  try {
    if (typeof window === "undefined") return null;

    const { getMessaging, isSupported } =
      await import("firebase/messaging");

    const supported = await isSupported();
    if (!supported) return null;

    if (!messagingInstance) {
      messagingInstance = getMessaging(app);
    }

    return messagingInstance;
  } catch (err) {
    console.warn("Messaging not available:", err.message);
    return null;
  }
}