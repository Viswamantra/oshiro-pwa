/**
 * =========================================================
 * OSHIRO FCM TOKEN SERVICE — ENTERPRISE PRODUCTION VERSION
 * ---------------------------------------------------------
 * ✔ Merchant + Customer + Admin unified
 * ✔ Multi-device merchant token array (deduplicated)
 * ✔ Token refresh safe
 * ✔ Single foreground listener attach
 * ✔ Service Worker verified
 * ✔ Permission safe
 * ✔ Mobile browser safe
 * ✔ Silent data push ready
 * ✔ Production logging structured
 * =========================================================
 */

import { getToken, onMessage } from "firebase/messaging";
import {
  doc,
  setDoc,
  serverTimestamp,
  arrayUnion,
  getDoc,
} from "firebase/firestore";

import { db, getFirebaseMessaging } from "../firebase/index";

/* =========================================================
   INTERNAL FLAGS
========================================================= */
let _foregroundListenerAttached = false;

/* =========================================================
   WAIT FOR SERVICE WORKER READY
========================================================= */
async function waitForServiceWorkerReady() {
  try {
    if (!("serviceWorker" in navigator)) {
      console.log("[FCM] ❌ Service Worker not supported");
      return null;
    }

    const registration = await navigator.serviceWorker.ready;

    if (!registration) {
      console.log("[FCM] ❌ SW ready returned null");
      return null;
    }

    console.log("[FCM] ✅ SW READY:", registration.scope);
    return registration;

  } catch (err) {
    console.error("[FCM] ❌ SW READY ERROR:", err);
    return null;
  }
}

/* =========================================================
   SAVE TOKEN SAFELY (DEDUPLICATE FOR MERCHANT)
========================================================= */
async function saveTokenToFirestore(id, role, token) {

  const collectionMap = {
    merchant: "merchants",
    customer: "customers",
    admin: "admins",
  };

  const collectionName = collectionMap[role] || "customers";

  const ref = doc(db, collectionName, id);
  const snap = await getDoc(ref);

  const basePayload = {
    fcmToken: token,
    tokenUpdatedAt: serverTimestamp(),
  };

  /* ---------- MERCHANT MULTI DEVICE SAFE ---------- */

  if (role === "merchant") {

    let tokens = [];

    if (snap.exists()) {
      tokens = snap.data()?.fcmTokens || [];
    }

    if (!tokens.includes(token)) {
      basePayload.fcmTokens = arrayUnion(token);
    }

    await setDoc(ref, basePayload, { merge: true });

    console.log("[FCM] ✅ Merchant token saved (dedup)");

  } else {

    await setDoc(ref, basePayload, { merge: true });

    console.log(`[FCM] ✅ ${role} token saved`);
  }
}

/* =========================================================
   FOREGROUND LISTENER
========================================================= */
function attachForegroundListener(messaging) {

  if (_foregroundListenerAttached) return;

  _foregroundListenerAttached = true;

  onMessage(messaging, (payload) => {

    console.log("[FCM] 📩 Foreground Push:", payload);

    /* ---------- OPTIONAL GLOBAL EVENT ---------- */

    window.dispatchEvent(
      new CustomEvent("oshiro:push", { detail: payload })
    );

    /* ---------- FALLBACK ALERT ---------- */

    if (payload?.notification?.title) {
      console.log(
        `[FCM] Notification → ${payload.notification.title}`
      );
    }
  });

  console.log("[FCM] ✅ Foreground listener attached");
}

/* =========================================================
   MAIN TOKEN FUNCTION
   role = merchant | customer | admin
========================================================= */
export async function generateAndSaveToken(
  id,
  role = "customer"
) {

  console.log("[FCM] 🚀 TOKEN FLOW START", { id, role });

  try {

    /* ================= BASIC GUARDS ================= */

    if (!id) {
      console.log("[FCM] ❌ Missing ID");
      return null;
    }

    if (!("Notification" in window)) {
      console.log("[FCM] ❌ Notification API not available");
      return null;
    }

    /* ================= PERMISSION ================= */

    let permission = Notification.permission;

    if (permission !== "granted") {
      console.log("[FCM] 🔔 Requesting permission...");
      permission = await Notification.requestPermission();
    }

    if (permission !== "granted") {
      console.log("[FCM] ❌ Permission denied");
      return null;
    }

    console.log("[FCM] ✅ Permission granted");

    /* ================= MESSAGING ================= */

    const messaging = await getFirebaseMessaging();

    if (!messaging) {
      console.log("[FCM] ❌ Messaging not available");
      return null;
    }

    /* ================= SERVICE WORKER ================= */

    const registration = await waitForServiceWorkerReady();

    if (!registration) return null;

    /* ================= TOKEN ================= */

    console.log("[FCM] 📡 Requesting token...");

    const token = await getToken(messaging, {
      vapidKey:
        "BLQz2BIY-XXDRG0euqFN0YSxRv0v_flyYEPsZUFQc3AxOz693IuHUrdz48A7z6EPTyffkr42ND3gB0mDUm4XroM",
      serviceWorkerRegistration: registration,
    });

    if (!token) {
      console.log("[FCM] ❌ Token null");
      return null;
    }

    console.log("[FCM] 📦 TOKEN:", token);

    /* ================= SAVE ================= */

    await saveTokenToFirestore(id, role, token);

    /* ================= FOREGROUND LISTENER ================= */

    attachForegroundListener(messaging);

    console.log("[FCM] 🎉 TOKEN FLOW COMPLETE");

    return token;

  } catch (err) {

    console.error("[FCM] ❌ TOKEN FLOW CRASH:", err);
    return null;
  }
}
