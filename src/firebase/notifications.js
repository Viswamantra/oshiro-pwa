/**
 * =========================================================
 * FIREBASE PUSH NOTIFICATIONS (WEB / VITE SAFE)
 * ---------------------------------------------------------
 * ✔ Requests notification permission
 * ✔ Gets & stores FCM token
 * ✔ Handles foreground messages
 * ✔ Safe when messaging is unavailable
 * =========================================================
 */

import { db, messaging } from "./index";
import { getToken, onMessage } from "firebase/messaging";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";

/* ======================
   CONFIG
====================== */

// 🔑 Firebase Console → Cloud Messaging → Web Push Certificates
const VAPID_KEY =
  "BLQz2BIY-XXDRG0euqFN0YSxRv0v_flyYEPsZUFQc3AxOz693IuHUrdz48A7z6EPTyffkr42ND3gB0mDUm4XroM";

/* ======================
   ENABLE PUSH (MERCHANT)
====================== */
export async function enablePushNotifications(merchantId) {
  try {
    // ✅ Browser support check
    if (typeof window === "undefined" || !("Notification" in window)) {
      console.warn("Notifications not supported in this environment");
      return;
    }

    // ✅ Messaging may be null (SSR / unsupported browser)
    if (!messaging) {
      console.warn("Firebase messaging not initialized");
      return;
    }

    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      console.warn("Notification permission denied");
      return;
    }

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
    });

    if (!token) {
      console.error("Failed to get FCM token");
      return;
    }

    // 🔥 Save token to Firestore (merchant document)
    await updateDoc(doc(db, "merchants", merchantId), {
      fcmToken: token,
      notificationsEnabled: true,
      tokenUpdatedAt: serverTimestamp(),
    });

    console.log("✅ Push notifications enabled");
    console.log("FCM Token:", token);
  } catch (error) {
    console.error("Enable push notification error:", error);
  }
}

/* ======================
   FOREGROUND LISTENER
====================== */
export function listenToForegroundMessages() {
  if (!messaging || typeof window === "undefined") return;

  onMessage(messaging, (payload) => {
    console.log("🔔 Foreground notification:", payload);

    const title =
      payload.notification?.title || "OshirO Alert";
    const body =
      payload.notification?.body ||
      "You have a new notification";

    // Simple UI feedback (replace with toast/snackbar later)
    alert(`${title}\n\n${body}`);
  });
}

/* ======================
   DISABLE PUSH (OPTIONAL)
====================== */
export async function disablePushNotifications(merchantId) {
  try {
    await updateDoc(doc(db, "merchants", merchantId), {
      fcmToken: null,
      notificationsEnabled: false,
      tokenUpdatedAt: serverTimestamp(),
    });

    console.log("❌ Push notifications disabled");
  } catch (err) {
    console.error("Disable notification error:", err);
  }
}
