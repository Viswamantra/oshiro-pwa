import { doc, setDoc } from "firebase/firestore";
import bcrypt from "bcryptjs";
import { db } from "../firebase";

export async function createMerchant(mobile, plainPassword) {
  const passwordHash = await bcrypt.hash(plainPassword, 10);

  await setDoc(doc(db, "merchants", mobile), {
    mobile,
    passwordHash,
    role: "merchant",
    active: true,
    createdBy: "admin",
    createdAt: new Date(),
  });
}
