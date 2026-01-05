import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { getMessaging, isSupported } from "firebase/messaging";

/* =========================
   FIREBASE CONFIG
========================= */
const firebaseConfig = {
  apiKey: "AIzaSyBekN6ULTaosrBQzv-JvBlnMcCOMXZ-_JU",
  authDomain: "oshiro-app.firebaseapp.com",
  projectId: "oshiro-app",
  storageBucket: "oshiro-app.appspot.com",
  messagingSenderId: "1066886336420",
  appId: "1:1066886336420:web:458379909954c206917b31",
};

/* =========================
   INIT APP
========================= */
const app = initializeApp(firebaseConfig);

/* =========================
   CORE SERVICES
========================= */
export const auth = getAuth(app);
export const db = getFirestore(app);

/**
 * 🔴 Cloud Functions (match deployed region)
 */
export const functions = getFunctions(app, "asia-south1");

/* =========================
   MESSAGING (SAFE INIT)
========================= */
export let messaging = null;

// Messaging is NOT supported in all browsers (Safari private, etc.)
isSupported().then((supported) => {
  if (supported) {
    messaging = getMessaging(app);
    console.log("✅ Firebase Messaging supported");
  } else {
    console.warn("❌ Firebase Messaging NOT supported");
  }
});

export default app;
