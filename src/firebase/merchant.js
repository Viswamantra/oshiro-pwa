/**
 * 🔒 LOCKED AFTER PHASE 2.6
 * Merchant data access layer
 * Contract file – do not refactor now
 */

import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "./index.js";

/**
 * =========================================================
 * MERCHANT AUTH & PROFILE (MERCHANT SIDE)
 * ---------------------------------------------------------
 * ✔ Mobile normalization
 * ✔ Location-safe (geo-ready)
 * ✔ Auto-sync location → active offers
 * ✔ Admin + Customer compatible
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
   SYNC LOCATION → ACTIVE OFFERS
====================== */
async function syncMerchantLocationToOffers(merchantId, location) {
  if (!merchantId || !location) return;

  const q = query(
    collection(db, "offers"),
    where("merchantId", "==", merchantId),
    where("isActive", "==", true)
  );

  const snap = await getDocs(q);

  const updates = snap.docs.map((d) =>
    updateDoc(doc(db, "offers", d.id), {
      location,
      updatedAt: serverTimestamp(),
    })
  );

  await Promise.all(updates);
}

/* ======================
   GET MERCHANT BY MOBILE
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

  const docSnap = snapshot.docs[0];

  return {
    id: docSnap.id,
    ...docSnap.data(),
  };
}

/* ======================
   REGISTER MERCHANT
   - ALWAYS creates PENDING merchant
   - Saves PRESENT LOCATION
   - Syncs location to offers (future-safe)
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

  let location = null;

  if (
    typeof lat === "number" &&
    typeof lng === "number" &&
    !isNaN(lat) &&
    !isNaN(lng)
  ) {
    location = { lat, lng };
    merchantData.location = location;
  }

  const docRef = await addDoc(
    collection(db, "merchants"),
    merchantData
  );

  // 🔥 FUTURE-SAFE: if offers already exist, sync location
  if (location) {
    await syncMerchantLocationToOffers(docRef.id, location);
  }

  return docRef;
}
