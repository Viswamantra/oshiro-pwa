import { doc, updateDoc } from "firebase/firestore";
import bcrypt from "bcryptjs";
import { db } from "../firebase";

export async function changeMerchantPassword(mobile, newPassword) {
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await updateDoc(doc(db, "merchants", mobile), { passwordHash });
}
