import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export async function sendNotification(to, role, title, message) {
  try {
    await addDoc(collection(db, 'notifications'), {
      to,
      role,
      title,
      message,
      timestamp: serverTimestamp(),
      read: false,
    });
  } catch (e) {
    console.error('sendNotification error', e);
  }
}
