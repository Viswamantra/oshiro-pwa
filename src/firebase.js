import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
} from "firebase/auth";

import {
  getMessaging,
  getToken,
  isSupported,
  onMessage,
} from "firebase/messaging";

/* ======================
   FIREBASE CONFIG
====================== */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

/* ======================
   SAFE INIT (VITE SAFE)
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

export let messaging = null;
export let messagingSupported = false;

/* ======================
   INIT MESSAGING SAFE
====================== */
export const initMessaging = async () => {
  try {
    messagingSupported = await isSupported();

    if (!messagingSupported) {
      console.warn("⚠️ FCM not supported in this browser");
      return null;
    }

    messaging = getMessaging(app);
    console.log("✅ Firebase Messaging Ready");

    return messaging;
  } catch (err) {
    console.error("❌ Messaging init failed:", err);
    return null;
  }
};

/* ======================
   GET & SAVE FCM TOKEN
====================== */
export const updateFCMToken = async ({
  userId,
  role, // "customers" OR "merchants"
}) => {
  try {
    if (!messaging) {
      console.warn("⚠️ Messaging not ready");
      return null;
    }

    if (!userId || !role) {
      console.warn("⚠️ Missing userId or role");
      return null;
    }

    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

    const token = await getToken(messaging, { vapidKey });

    if (!token) {
      console.warn("⚠️ No FCM token received");
      return null;
    }

    console.log("🔥 FCM TOKEN:", token);

    await updateDoc(doc(db, role, userId), {
      fcmToken: token,
      tokenUpdatedAt: serverTimestamp(),
    });

    console.log("✅ Token saved to Firestore");

    return token;
  } catch (err) {
    console.error("❌ Token update error:", err);
    return null;
  }
};

/* ======================
   FOREGROUND MESSAGE LISTENER
====================== */
export const listenForegroundMessages = () => {
  if (!messaging) return;

  onMessage(messaging, (payload) => {
    console.log("📩 Foreground Push Received:", payload);

    // Optional: show toast / UI notification
  });
};

/* ======================
   DEV AUTO AUTH
====================== */
onAuthStateChanged(auth, (user) => {
  if (!user) {
    signInAnonymously(auth).catch(console.error);
  }
});

export default app;
