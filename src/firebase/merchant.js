import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./index.js";

/**
 * =========================================================
 * MERCHANT AUTH & PROFILE (MERCHANT SIDE)
 * ---------------------------------------------------------
 * ✔ Single source of truth
 * ✔ Uses NEW merchant model
 * ✔ Compatible with Admin approval flow
 * ✔ Geo + Offers ready
 * =========================================================
 */

/* ======================
   GET MERCHANT BY MOBILE
   - Used during login
====================== */
export async function getMerchantByMobile(mobile) {
  if (!mobile) return null;

  const q = query(
    collection(db, "merchants"),
    where("mobile", "==", mobile)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];

  return {
    id: doc.id,
    ...doc.data(),
  };
}

/* ======================
   REGISTER MERCHANT
   - Always creates PENDING merchant
   - Admin must approve
====================== */
export async function registerMerchant({
  mobile,
  shopName,
  categoryId,
  lat,
  lng,
}) {
  if (!mobile || !shopName || !categoryId) {
    throw new Error("Missing required merchant fields");
  }

  const merchantData = {
    mobile,
    shopName,                  // ✅ consistent everywhere
    categoryId,
    status: "pending",         // 🔒 admin approval required
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  /* ======================
     OPTIONAL LOCATION
  ====================== */
  if (
    typeof lat === "number" &&
    typeof lng === "number" &&
    !isNaN(lat) &&
    !isNaN(lng)
  ) {
    merchantData.location = { lat, lng };
  }

  return await addDoc(
    collection(db, "merchants"),
    merchantData
  );
}
