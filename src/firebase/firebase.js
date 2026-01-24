import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

/**
 * =========================================
 * FIREBASE INITIALIZATION (SINGLE SOURCE)
 * -----------------------------------------
 * ✔ Vite-compatible env vars
 * ✔ Firestore
 * ✔ Auth (future-ready)
 * =========================================
 */

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
};

const app = initializeApp(firebaseConfig);

// 🔥 Export shared Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
