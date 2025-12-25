import { doc, getDoc } from "firebase/firestore";
import bcrypt from "bcryptjs";
import { db } from "../firebase";

export async function merchantLogin(mobile, password) {
  const ref = doc(db, "merchants", mobile);
  const snap = await getDoc(ref);

  if (!snap.exists()) throw new Error("Merchant not found");

  const data = snap.data();

  if (!data.active) throw new Error("Merchant disabled");

  const ok = await bcrypt.compare(password, data.passwordHash);
  if (!ok) throw new Error("Wrong password");

  return { role: "merchant", mobile };
}
