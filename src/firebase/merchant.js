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
 * ✔ Mobile normalization
 * ✔ Location-safe (geo-ready)
 * ✔ Admin + Customer compatible
 * ✔ Single source of truth
 * =========================================================
 */

/* ======================
   HELPERS
====================== */

/**
 * Normalize Indian mobile numbers
 * - Accepts: 9182653234, +919182653234, 91-9182653234
 * - Stores: +91XXXXXXXXXX
 */
function normalizeMobile(mobile) {
  if (!mobile) return null;

  let digits = mobile.replace(/\D/g, "");

  if (digits.length > 10) {
    digits = digits.slice(-10);
  }

  return "+91" + digits;
}

/* ======================
   GET MERCHANT BY MOBILE
   - Used during login
====================== */
export async function getMerchantByMobile(mobile) {
  const normalizedMobile = normalizeMobile(mobile);
  if (!normalizedMobile) return null;

  const q = query(
    collection(db, "merchants"),
    where("mobile", "==", normalizedMobile)
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
   - Saves PRESENT LOCATION
====================== */
export async function registerMerchant({
  mobile,
  shopName,
  category,
  lat,
  lng,
}) {
  const normalizedMobile = normalizeMobile(mobile);

  if (!normalizedMobile || !shopName || !category) {
    throw new Error("Missing required merchant fields");
  }

  const merchantData = {
    mobile: normalizedMobile,
    shop_name: shopName,
    category,
    status: "pending",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  /* ======================
     PRESENT LOCATION (CRITICAL)
  ====================== */
  if (
    typeof lat === "number" &&
    typeof lng === "number" &&
    !isNaN(lat) &&
    !isNaN(lng)
  ) {
    merchantData.location = {
      lat,
      lng,
    };
  }

  return await addDoc(
    collection(db, "merchants"),
    merchantData
  );
}
