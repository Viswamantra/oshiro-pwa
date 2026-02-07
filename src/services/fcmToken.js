/**
 * =========================================================
 * FCM TOKEN SERVICE – FINAL PRODUCTION SAFE
 * ---------------------------------------------------------
 * ✔ Direct firebase/index import (Vite safe)
 * ✔ Service Worker ready wait
 * ✔ Permission safe
 * ✔ Messaging support safe
 * ✔ Token merge safe
 * ✔ Foreground listener safe
 * =========================================================
 */

import { getToken, onMessage } from "firebase/messaging";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

// 🔥 IMPORTANT → Direct import from index (Fixes build error)
import { db, getFirebaseMessaging } from "../firebase/index";

/* =========================================================
   WAIT FOR SERVICE WORKER READY
========================================================= */
async function waitForServiceWorkerReady() {

  if (typeof window === "undefined") {
    throw new Error("Window not available (SSR)");
  }

  if (!("serviceWorker" in navigator)) {
    throw new Error("Service Worker not supported");
  }

  console.log("⏳ Waiting for Service Worker ready...");

  const registration = await navigator.serviceWorker.ready;

  console.log("✅ Service Worker ready");

  return registration;
}

/* =========================================================
   GENERATE + SAVE TOKEN
========================================================= */
export async function generateAndSaveToken(customerId) {

  try {

    if (!customerId) {
      console.log("❌ No customerId → Cannot save token");
      return;
    }

    /* -------------------------
       NOTIFICATION PERMISSION
    ------------------------- */
    if (!("Notification" in window)) {
      console.log("❌ Notifications not supported");
      return;
    }

    console.log("🔔 Requesting notification permission...");

    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      console.log("❌ Notification permission denied");
      return;
    }

    console.log("✅ Notification permission granted");

    /* -------------------------
       GET FIREBASE MESSAGING
    ------------------------- */
    const messaging = await getFirebaseMessaging();

    if (!messaging) {
      console.log("❌ Firebase Messaging not supported on this device");
      return;
    }

    /* -------------------------
       WAIT FOR SERVICE WORKER
    ------------------------- */
    const registration = await waitForServiceWorkerReady();

    /* -------------------------
       GET TOKEN
    ------------------------- */
    console.log("📡 Requesting FCM token...");

    const token = await getToken(messaging, {
      vapidKey:
        "BLQz2BIY-XXDRG0euqFN0YSxRv0v_flyYEPsZUFQc3AxOz693IuHUrdz48A7z6EPTyffkr42ND3gB0mDUm4XroM",
      serviceWorkerRegistration: registration,
    });

    if (!token) {
      console.log("❌ No FCM token received");
      return;
    }

    console.log("✅ FCM TOKEN:", token);

    /* -------------------------
       SAVE TOKEN (MERGE SAFE)
    ------------------------- */
    await setDoc(
      doc(db, "customers", customerId),
      {
        fcmToken: token,
        tokenUpdatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    console.log("✅ Token saved to Firestore");

    /* -------------------------
       FOREGROUND PUSH LISTENER
    ------------------------- */
    onMessage(messaging, (payload) => {
      console.log("📩 Foreground Push Received:", payload);
    });

  } catch (err) {

    console.error("❌ FCM Token Error:", err);

  }
}
