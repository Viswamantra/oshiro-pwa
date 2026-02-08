/**
 * =========================================================
 * FCM TOKEN SERVICE – FINAL UNIVERSAL (CUSTOMER + MERCHANT)
 * ---------------------------------------------------------
 * ✔ Customer token save
 * ✔ Merchant multi-token array support
 * ✔ Duplicate token safe
 * ✔ Service worker safe
 * ✔ Permission safe
 * ✔ Foreground listener safe
 * ✔ Production logging
 * =========================================================
 */

import { getToken, onMessage } from "firebase/messaging";
import {
  doc,
  setDoc,
  serverTimestamp,
  arrayUnion,
} from "firebase/firestore";

import { db, getFirebaseMessaging } from "../firebase/index";

/* =========================================================
   WAIT FOR SERVICE WORKER READY
========================================================= */
async function waitForServiceWorkerReady() {
  if (typeof window === "undefined") {
    throw new Error("Window not available");
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
   MAIN TOKEN FUNCTION
   role = "customer" | "merchant"
========================================================= */
export async function generateAndSaveToken(id, role = "customer") {
  try {

    if (!id) {
      console.log("❌ No id provided");
      return;
    }

    if (!("Notification" in window)) {
      console.log("❌ Notifications not supported");
      return;
    }

    /* ================= PERMISSION ================= */
    console.log("🔔 Requesting notification permission...");
    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      console.log("❌ Notification permission denied");
      return;
    }

    console.log("✅ Notification permission granted");

    /* ================= GET MESSAGING ================= */
    const messaging = await getFirebaseMessaging();
    if (!messaging) {
      console.log("❌ Messaging not supported");
      return;
    }

    /* ================= WAIT SW ================= */
    const registration = await waitForServiceWorkerReady();

    /* ================= GET TOKEN ================= */
    console.log("📡 Requesting FCM token...");

    const token = await getToken(messaging, {
      vapidKey:
        "BLQz2BIY-XXDRG0euqFN0YSxRv0v_flyYEPsZUFQc3AxOz693IuHUrdz48A7z6EPTyffkr42ND3gB0mDUm4XroM",
      serviceWorkerRegistration: registration,
    });

    if (!token) {
      console.log("❌ No token received");
      return;
    }

    console.log("✅ FCM TOKEN:", token);

    /* =================================================
       SAVE BASED ON ROLE
    ================================================= */

    if (role === "merchant") {

      await setDoc(
        doc(db, "merchants", id),
        {
          fcmTokens: arrayUnion(token),   // prevents duplicates automatically
          tokenUpdatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      console.log("✅ Merchant token saved");

    } else {

      await setDoc(
        doc(db, "customers", id),
        {
          fcmToken: token,
          tokenUpdatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      console.log("✅ Customer token saved");
    }

    /* ================= FOREGROUND LISTENER ================= */
    onMessage(messaging, (payload) => {
      console.log("📩 Foreground Push Received:", payload);
    });

  } catch (err) {
    console.error("❌ FCM Token Error:", err);
  }
}
