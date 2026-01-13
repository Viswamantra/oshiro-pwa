import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
} from "firebase/auth";
import { getMessaging, isSupported } from "firebase/messaging";

/* ======================
   FIREBASE CONFIG
   (VITE + VERCEL SAFE)
====================== */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

/* ======================
   SAFE INIT (VITE + HMR)
====================== */
const app =
  getApps().length === 0
    ? initializeApp(firebaseConfig)
    : getApp();

/* ======================
   SERVICES
====================== */
export const db = getFirestore(app);
export const auth = getAuth(app);

/**
 * Messaging is NOT supported on all browsers
 * (e.g., Safari iOS)
 */
export let messaging = null;

isSupported()
  .then((supported) => {
    if (supported) {
      messaging = getMessaging(app);
      console.log("✅ Firebase Messaging supported");
    } else {
      console.warn(
        "⚠️ Firebase Messaging not supported on this browser"
      );
    }
  })
  .catch(console.error);

/* ======================
   DEV AUTO AUTH
====================== */
onAuthStateChanged(auth, (user) => {
  if (!user) {
    signInAnonymously(auth).catch(console.error);
  }
});

export default app;
