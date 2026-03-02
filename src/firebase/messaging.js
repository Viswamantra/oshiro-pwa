/**
 * =========================================================
 * OSHIRO FCM MESSAGING (FINAL PRODUCTION VERSION)
 * Supports:
 * ✔ Foreground popup
 * ✔ Background via SW
 * ✔ Multi-device tokens[]
 * ✔ Token deduplication
 * =========================================================
 */

import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { app, db } from "./index.js";

/* =========================================================
   INIT MESSAGING
========================================================= */
export async function initMessaging() {
  try {
    const messaging = getMessaging(app);

    const registration = await navigator.serviceWorker.getRegistration();

    if (!registration) {
      console.warn("⚠️ Service Worker not registered");
      return null;
    }

    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (!token) {
      console.warn("⚠️ No FCM token received");
      return null;
    }

    console.log("📲 FCM Token generated");

    /* ================= FOREGROUND HANDLER ================= */
    onMessage(messaging, (payload) => {
      console.log("[FCM] Foreground push:", payload);

      const notification = payload.notification || {};
      const data = payload.data || {};

      const title =
        notification.title ||
        data.title ||
        "OshirO";

      const body =
        notification.body ||
        data.body ||
        "You have a new update";

      if (Notification.permission === "granted") {
        const n = new Notification(title, {
          body,
          icon: "/icon-192.png",
          badge: "/badge-72.png",
          requireInteraction: true,
          data: {
            url: data.click_action || "/customer",
          },
        });

        n.onclick = function () {
          window.focus();
          if (this.data?.url) {
            window.location.href = this.data.url;
          }
        };
      }
    });

    return token;

  } catch (error) {
    console.error("❌ initMessaging error:", error);
    return null;
  }
}

/* =========================================================
   UPDATE TOKEN IN FIRESTORE (MULTI DEVICE SAFE)
========================================================= */
export async function updateFCMToken(uid, token) {
  if (!uid || !token) return;

  try {
    const tokenRef = doc(db, "fcmTokens", uid);
    const snap = await getDoc(tokenRef);

    let tokens = [];

    if (snap.exists()) {
      tokens = snap.data()?.tokens || [];
    }

    // Prevent duplicates
    if (!tokens.includes(token)) {
      tokens.push(token);
    }

    await setDoc(
      tokenRef,
      {
        tokens,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    console.log("✅ FCM Token stored in Firestore (array mode)");

  } catch (error) {
    console.error("❌ Failed to store FCM token:", error);
  }
}