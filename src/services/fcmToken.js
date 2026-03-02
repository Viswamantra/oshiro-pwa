/**
 * =========================================================
 * OSHIRO FCM TOKEN SERVICE — FINAL STABLE VERSION
 * =========================================================
 * ✔ Tokens stored in fcmTokens/{uid}
 * ✔ Multi-device safe
 * ✔ Reinstall safe
 * ✔ Role safe
 * ✔ Cloud Function friendly
 * ✔ Prevent duplicate writes
 * ✔ Vite-safe dynamic imports
 * =========================================================
 */

import {
  doc,
  setDoc,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  getDoc,
  updateDoc,
} from "firebase/firestore";

import { db, getFirebaseMessaging } from "../firebase/index";

/* ========================================================= */
let listenerAttached = false;
let currentToken = null;

/* =========================================================
   WAIT FOR SERVICE WORKER
========================================================= */
async function waitForSW() {
  if (!("serviceWorker" in navigator)) return null;
  try {
    return await navigator.serviceWorker.ready;
  } catch {
    return null;
  }
}

/* =========================================================
   SAVE TOKEN → fcmTokens/{uid}
========================================================= */
async function saveToken(uid, role, token) {
  const ref = doc(db, "fcmTokens", uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      role,
      tokens: [token],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.log("[FCM] New device registered");
    return;
  }

  await updateDoc(ref, {
    role,
    tokens: arrayUnion(token),
    updatedAt: serverTimestamp(),
  });

  console.log("[FCM] Device added");
}

/* =========================================================
   REMOVE INVALID TOKEN
========================================================= */
export async function removeInvalidToken(uid, token) {
  try {
    const ref = doc(db, "fcmTokens", uid);

    await updateDoc(ref, {
      tokens: arrayRemove(token),
      updatedAt: serverTimestamp(),
    });

    console.log("[FCM] Invalid token removed");
  } catch {}
}

/* =========================================================
   ATTACH FOREGROUND LISTENER
========================================================= */
async function attachListener(messaging) {
  if (listenerAttached) return;
  listenerAttached = true;

  const { onMessage } = await import("firebase/messaging");

  onMessage(messaging, (payload) => {
    console.log("[FCM] Foreground push:", payload);

    window.dispatchEvent(
      new CustomEvent("oshiro:push", { detail: payload })
    );
  });
}

/* =========================================================
   MAIN TOKEN FLOW
========================================================= */
export async function generateAndSaveToken(
  uid,
  role = "customer"
) {
  try {
    if (!uid) return null;
    if (!("Notification" in window)) return null;

    /* ---------- PERMISSION ---------- */
    let permission = Notification.permission;
    if (permission !== "granted") {
      permission = await Notification.requestPermission();
    }
    if (permission !== "granted") return null;

    /* ---------- MESSAGING ---------- */
    const messaging = await getFirebaseMessaging();
    if (!messaging) return null;

    /* ---------- SERVICE WORKER ---------- */
    const registration = await waitForSW();
    if (!registration) return null;

    /* ---------- DYNAMIC IMPORT ---------- */
    const { getToken } = await import("firebase/messaging");

    const token = await getToken(messaging, {
      vapidKey:
        "BLQz2BIY-XXDRG0euqFN0YSxRv0v_flyYEPsZUFQc3AxOz693IuHUrdz48A7z6EPTyffkr42ND3gB0mDUm4XroM",
      serviceWorkerRegistration: registration,
    });

    if (!token) return null;

    /* ---------- PREVENT DUPLICATE WRITE ---------- */
    if (token === currentToken) {
      await attachListener(messaging);
      return token;
    }

    currentToken = token;

    await saveToken(uid, role, token);

    await attachListener(messaging);

    console.log("[FCM] Token active for UID:", uid);

    return token;
  } catch (err) {
    console.error("[FCM] Token error:", err);
    return null;
  }
}

/* =========================================================
   FORCE TOKEN REFRESH
========================================================= */
export async function refreshFCMToken(uid, role) {
  try {
    const messaging = await getFirebaseMessaging();
    if (!messaging) return;

    const { deleteToken } = await import("firebase/messaging");

    await deleteToken(messaging);

    currentToken = null;

    await generateAndSaveToken(uid, role);

    console.log("[FCM] Token refreshed");
  } catch {}
}