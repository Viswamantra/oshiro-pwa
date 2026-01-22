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
 * ✔ Admin-compatible schema
 * ✔ Customer-safe fields
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
   - ALWAYS creates PENDING merchant
   - Admin reads SAME fields
====================== */
export async function registerMerchant({
  mobile,
  shopName,
  category,
  lat,
  lng,
}) {
  if (!mobile || !shopName || !category) {
    throw new Error("Missing required merchant fields");
  }

  const merchantData = {
    mobile,
    shop_name: shopName,       // ✅ FIXED: admin-compatible
    category: category,        // ✅ FIXED: no categoryId drift
    status: "pending",
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
