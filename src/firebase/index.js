/**
 * =========================================================
 * FIREBASE INITIALIZATION (VITE SAFE – SINGLE INSTANCE)
 * ---------------------------------------------------------
 * ✔ Prevents duplicate app initialization
 * ✔ Exports Firestore + Auth
 * ✔ Compatible with DEV + PROD
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
   INIT (SAFE FOR HMR)
====================== */
const app =
  getApps().length === 0
    ? initializeApp(firebaseConfig)
    : getApp();

/* ======================
   EXPORTS
====================== */
export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;
