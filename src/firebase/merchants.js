import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "./index.js";

/* =========================================================
   GET MERCHANT BY MOBILE
========================================================= */
export async function getMerchantByMobile(mobile) {

  try {

    if (!mobile || typeof mobile !== "string") {
      console.log("❌ Invalid mobile input");
      return null;
    }

    console.log("🔎 Searching merchant by mobile:", mobile);

    const q = query(
      collection(db, "merchants"),
      where("mobile", "==", mobile)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.log("❌ No merchant found");
      return null;
    }

    const docSnap = snapshot.docs[0];

    const merchant = {
      id: docSnap.id,
      ...docSnap.data(),
    };

    console.log("✅ Merchant Found:", merchant.id);

    return merchant;

  } catch (err) {
    console.error("❌ getMerchantByMobile error:", err);
    return null;
  }
}

/* =========================================================
   REGISTER MERCHANT
========================================================= */
export async function registerMerchant({
  mobile,
  shopName,
  category,
}) {

  try {

    if (!mobile || !shopName || !category) {
      throw new Error("Missing required merchant fields");
    }

    console.log("🆕 Registering merchant:", mobile);

    const docRef = await addDoc(
      collection(db, "merchants"),
      {
        mobile,
        shop_name: shopName,
        category,
        status: "pending",
        profileComplete: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }
    );

    console.log("✅ Merchant registered ID:", docRef.id);

    return docRef;

  } catch (err) {
    console.error("❌ registerMerchant error:", err);
    throw err;
  }
}

/* =========================================================
   DISTANCE HELPER
========================================================= */
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
   FETCH NEARBY MERCHANTS
========================================================= */
export async function fetchNearbyMerchants({
  userLat,
  userLng,
  category = "",
  distance = 3000,
} = {}) {

  try {

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

    const merchants = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    if (
      typeof userLat !== "number" ||
      typeof userLng !== "number"
    ) {
      return merchants.slice(0, 20);
    }

    return merchants.filter((m) => {

      if (
        typeof m.location?.lat !== "number" ||
        typeof m.location?.lng !== "number"
      ) return false;

      const d = calculateDistance(
        userLat,
        userLng,
        m.location.lat,
        m.location.lng
      );

      return d <= distance;
    });

  } catch (err) {
    console.error("❌ fetchNearbyMerchants error:", err);
    return [];
  }
}
