import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp,
  arrayUnion
} from "firebase/firestore";

import {
  getAuth,
  onAuthStateChanged
} from "firebase/auth";

import {
  getMessaging,
  getToken,
  isSupported,
  onMessage
} from "firebase/messaging";

import { getFunctions } from "firebase/functions";

/* =====================================================
   FIREBASE CONFIG
===================================================== */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

/* =====================================================
   SAFE INIT
===================================================== */
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);

/* ⭐ REGION MUST MATCH CLOUD FUNCTIONS */
export const functions = getFunctions(app, "us-central1");

/* =====================================================
   MESSAGING STATE
===================================================== */
let messaging = null;
let messagingReady = false;

/* =====================================================
   INITIALIZE MESSAGING
===================================================== */
export const initMessaging = async () => {
  try {
    const supported = await isSupported();

    if (!supported) {
      console.warn("FCM not supported");
      return null;
    }

    messaging = getMessaging(app);
    messagingReady = true;

    console.log("Firebase Messaging Initialized");

    return messaging;

  } catch (err) {
    console.error("Messaging init error:", err);
    return null;
  }
};

/* =====================================================
   REQUEST PERMISSION + SAVE TOKEN
===================================================== */
export const updateFCMToken = async ({ userId, role }) => {
  try {
    if (!("Notification" in window)) {
      console.warn("Notifications not supported");
      return null;
    }

    let permission = Notification.permission;

    if (permission === "default") {
      permission = await Notification.requestPermission();
    }

    if (permission !== "granted") {
      console.warn("User blocked notifications");
      return null;
    }

    if (!messagingReady) {
      await initMessaging();
      if (!messaging) return null;
    }

    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

    const token = await getToken(messaging, { vapidKey });

    if (!token) {
      console.warn("No FCM token");
      return null;
    }

    console.log("NEW FCM TOKEN:", token);

    const ref = doc(db, role + "s", userId);

    await setDoc(
      ref,
      {
        fcmToken: token,
        fcmTokens: arrayUnion(token),
        tokenUpdatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    console.log("Token stored in Firestore");

    return token;

  } catch (err) {
    console.error("Token save failed:", err);
    return null;
  }
};

/* =====================================================
   FOREGROUND MESSAGE LISTENER
===================================================== */
export const listenForegroundMessages = async () => {
  if (!messagingReady) await initMessaging();
  if (!messaging) return;

  onMessage(messaging, (payload) => {
    console.log("Foreground push received:", payload);

    if (payload?.notification) {
      new Notification(payload.notification.title, {
        body: payload.notification.body,
        icon: "/icon-192.png"
      });
    }
  });
};

/* =====================================================
   AUTH OBSERVER (NO AUTO LOGIN)
===================================================== */
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("Authenticated UID:", user.uid);
  } else {
    console.log("No authenticated user");
  }
});

export default app;