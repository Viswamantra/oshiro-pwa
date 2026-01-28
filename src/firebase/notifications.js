/**
 * =========================================================
 * FIREBASE PUSH NOTIFICATIONS (VITE + SSR SAFE)
 * ---------------------------------------------------------
 * ✔ Lazy messaging initialization
 * ✔ Safe for unsupported browsers
 * ✔ No build-time crashes
 * ✔ Uses getFirebaseMessaging()
 * =========================================================
 */

import { db, getFirebaseMessaging } from "./index";
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
    if (typeof window === "undefined" || !("Notification" in window)) {
      console.warn("Notifications not supported");
      return;
    }

    const messaging = await getFirebaseMessaging();
    if (!messaging) {
      console.warn("Firebase messaging unavailable");
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

    // 🔥 Save token to Firestore
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
export async function listenToForegroundMessages() {
  if (typeof window === "undefined") return;

  const messaging = await getFirebaseMessaging();
  if (!messaging) return;

  onMessage(messaging, (payload) => {
    console.log("🔔 Foreground notification:", payload);

    const title =
      payload.notification?.title || "OshirO Alert";
    const body =
      payload.notification?.body ||
      "You have a new notification";

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
