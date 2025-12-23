import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { getMessaging, getToken } from "firebase/messaging";

/* =========================
   FIREBASE CONFIG
========================= */
const firebaseConfig = {
  apiKey: "AIzaSyBekN6ULTaosrBQzv-JvBlnMcCOMXZ-_JU",
  authDomain: "oshiro-app.firebaseapp.com",
  projectId: "oshiro-app",
  storageBucket: "oshiro-app.firebasestorage.app",
  messagingSenderId: "1066886336420",
  appId: "1:1066886336420:web:458379909954c206917b31",
};

/* =========================
   INIT APP
========================= */
const app = initializeApp(firebaseConfig);

/* =========================
   SERVICES
========================= */
export const db = getFirestore(app);
export const functions = getFunctions(app);

/* =========================
   FCM TOKEN (SAFE)
========================= */
export async function getFcmToken(vapidKey) {
  try {
    // FCM only works in browser
    if (typeof window === "undefined") return null;

    const messaging = getMessaging(app);
    const token = await getToken(messaging, { vapidKey });
    return token || null;
  } catch (err) {
    console.warn("FCM token error:", err);
    return null;
  }
}
