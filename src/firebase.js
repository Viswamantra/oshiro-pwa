import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyBekN6ULTaosrBQzv-JvBlnMcCOMXZ-_JU",
  authDomain: "oshiro-app.firebaseapp.com",
  projectId: "oshiro-app",
  storageBucket: "oshiro-app.firebasestorage.app",
  messagingSenderId: "1066886336420",
  appId: "1:1066886336420:web:458379909954c206917b31",
};

const app = initializeApp(firebaseConfig);

/* ✅ SINGLE, CORRECT EXPORTS */
export const auth = getAuth(app);
export const db = getFirestore(app);
export const messaging = getMessaging(app);

/**
 * 🔴 Cloud Functions region
 */
export const functions = getFunctions(app, "us-central1");

export default app;
