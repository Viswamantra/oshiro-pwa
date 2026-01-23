import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./index.js";

/**
 * =========================================================
 * MERCHANT DATA ACCESS (SINGLE SOURCE OF TRUTH)
 * ---------------------------------------------------------
 * ✔ Merchant registration
 * ✔ Customer-side nearby queries
 * ✔ Schema-aligned with admin & security rules
 * ✔ Rollup / Vercel build-safe
 * =========================================================
 */

/* ======================
   PRIVATE: DISTANCE CALC (METERS)
   (NOT EXPORTED – Rollup safe)
====================== */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (v) => (v * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* =========================================================
   REGISTER MERCHANT (MERCHANT SIDE)
========================================================= */
export async function registerMerchant({
  mobile,
  shopName,
  category,
}) {
  if (!mobile || !shopName || !category) {
    throw new Error("Missing required merchant fields");
  }

  return addDoc(collection(db, "merchants"), {
    mobile,
    shop_name: shopName,
    category,
    status: "pending",

    // Required by Firestore security rules
    profileComplete: false,

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/* =========================================================
   FETCH NEARBY MERCHANTS (CUSTOMER SIDE)
========================================================= */
export async function fetchNearbyMerchants({
  userLat,
  userLng,
  category = "",
  distance = 3000, // meters
}) {
  if (typeof userLat !== "number" || typeof userLng !== "number") {
    return [];
  }

  let q = query(
    collection(db, "merchants"),
    where("status", "==", "approved"),
    where("profileComplete", "==", true)
  );

  if (category) {
    q = query(
      collection(db, "merchants"),
      where("status", "==", "approved"),
      where("profileComplete", "==", true),
      where("category", "==", category)
    );
  }

  const snapshot = await getDocs(q);

  return snapshot.docs
    .map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
    .filter((m) => {
      if (
        typeof m.location?.lat !== "number" ||
        typeof m.location?.lng !== "number"
      ) {
        return false;
      }

      const d = calculateDistance(
        userLat,
        userLng,
        m.location.lat,
        m.location.lng
      );

      return d <= distance;
    });
}
