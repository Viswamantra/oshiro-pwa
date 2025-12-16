import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getMessaging, getToken } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyBekN6ULTaosrBQzv-JvBlnMcCOMXZ-_JU",
  authDomain: "oshiro-app.firebaseapp.com",
  projectId: "oshiro-app",
  storageBucket: "oshiro-app.firebasestorage.app",
  messagingSenderId: "1066886336420",
  appId: "1:1066886336420:web:458379909954c206917b31",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export async function getFcmToken(vapidKey) {
  try {
    const messaging = getMessaging(app);
    return await getToken(messaging, { vapidKey });
  } catch {
    return null;
  }
}
