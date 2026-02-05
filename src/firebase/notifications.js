import { getToken, onMessage } from "firebase/messaging";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db, app } from "./index";

/**
 * =========================================================
 * SAFE MESSAGING INITIALIZER
 * =========================================================
 */
let messagingInstance = null;

async function getMessagingSafe() {
  if (typeof window === "undefined") return null;
  if (!("serviceWorker" in navigator)) return null;
  if (!("Notification" in window)) return null;

  if (messagingInstance) return messagingInstance;

  const { getMessaging } = await import("firebase/messaging");
  messagingInstance = getMessaging(app);
  return messagingInstance;
}

/**
 * =========================================================
 * ENABLE PUSH + RETURN TOKEN
 * =========================================================
 */
export async function enablePushNotifications(merchantId) {
  if (!merchantId) return null;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;

  const messaging = await getMessagingSafe();
  if (!messaging) return null;

  const token = await getToken(messaging, {
    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
  });

  return token;
}

/**
 * =========================================================
 * SAVE MERCHANT FCM TOKEN
 * =========================================================
 */
export async function saveMerchantFcmToken(merchantId, token) {
  if (!merchantId || !token) return;

  const ref = doc(db, "merchants", merchantId);

  await updateDoc(ref, {
    fcmTokens: arrayUnion(token),
  });
}

/**
 * =========================================================
 * FOREGROUND MESSAGE LISTENER
 * =========================================================
 */
export async function listenToForegroundMessages() {
  const messaging = await getMessagingSafe();
  if (!messaging) return;

  onMessage(messaging, (payload) => {
    console.log("🔔 Foreground message:", payload);
  });
}
