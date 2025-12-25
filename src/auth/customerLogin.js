import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { TEST_CUSTOMER_OTP } from "./constants";

export async function customerLogin(mobile, otp) {
  if (otp !== TEST_CUSTOMER_OTP) {
    throw new Error("Invalid OTP");
  }

  const ref = doc(db, "customers", mobile);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      mobile,
      role: "customer",
      createdAt: new Date(),
    });
  }

  return { role: "customer", mobile };
}
