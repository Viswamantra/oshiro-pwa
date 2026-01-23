import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "./index.js";

/**
 * =========================================================
 * CUSTOMER-SIDE MERCHANT QUERIES
 * ---------------------------------------------------------
 * ✔ Fetch nearby merchants
 * ✔ Filter by category (optional)
 * ✔ Distance-based filtering (client-side)
 * ✔ ONLY approved & COMPLETE merchants
 * ✔ Schema-aligned with onboarding & admin
 * =========================================================
 */

/* ======================
   DISTANCE CALC (METERS)
====================== */
function getDistance(lat1, lon1, lat2, lon2) {
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

/* ======================
   FETCH NEARBY MERCHANTS
====================== */
export async function fetchNearbyMerchants({
  userLat,
  userLng,
  category = "",
  distance = 3000, // meters
}) {
  /* ======================
     SAFETY CHECK
  ====================== */
  if (
    typeof userLat !== "number" ||
    typeof userLng !== "number"
  ) {
    return [];
  }

  /* ======================
     BASE QUERY
     - ONLY approved merchants
  ====================== */
  let q = query(
    collection(db, "merchants"),
    where("status", "==", "approved")
  );

  /* ======================
     OPTIONAL CATEGORY FILTER
     (SCHEMA-ALIGNED)
  ====================== */
  if (category) {
    q = query(
      collection(db, "merchants"),
      where("status", "==", "approved"),
      where("category", "==", category)
    );
  }

  /* ======================
     FETCH DATA
  ====================== */
  const snapshot = await getDocs(q);

  const merchants = snapshot.docs
    .map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
    .filter((m) => {
      /* ======================
         HARD GUARDS (CRITICAL)
      ====================== */

      // Must have valid identity
      if (!m.shop_name || !m.category) {
        return false;
      }

      // Must have valid location
      if (
        typeof m.location?.lat !== "number" ||
        typeof m.location?.lng !== "number"
      ) {
        return false;
      }

      const d = getDistance(
        userLat,
        userLng,
        m.location.lat,
        m.location.lng
      );

      return d <= distance;
    });

  return merchants;
}
