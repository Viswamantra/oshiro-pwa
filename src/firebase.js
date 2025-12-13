import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getMessaging, getToken } from "firebase/messaging";

// --- Replace with your real config (this one was provided earlier) ---
const firebaseConfig = {
  apiKey: "AIzaSyBekN6ULTaosrBQzv-JvBlnMcCOMXZ-_JU",
  authDomain: "oshiro-app.firebaseapp.com",
  projectId: "oshiro-app",
  storageBucket: "oshiro-app.firebasestorage.app",
  messagingSenderId: "1066886336420",
  appId: "1:1066886336420:web:458379909954c206917b31",
  measurementId: "G-2ENRPXJC4Q",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// helper to get FCM token (if user supplies VAPID key)
export async function getFcmToken(vapidKey) {
  try {
    const messaging = getMessaging(app);
    const token = await getToken(messaging, { vapidKey });
    return token;
  } catch (e) {
    console.warn("Unable to get FCM token", e);
    return null;
  }
}
