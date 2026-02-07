import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  doc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "./index";

/**
 * =========================================================
 * OFFERS DATA ACCESS (CUSTOMER + MERCHANT SAFE)
 * =========================================================
 */

/* =========================================================
   ⭐ CREATE OFFER WITH GEO (NEW — REQUIRED FOR GEO PUSH)
========================================================= */
export async function createOfferWithGeo(offerData) {
  try {
    if (!offerData?.merchantId) {
      throw new Error("merchantId required");
    }

    /* =========================
       FETCH MERCHANT LOCATION
    ========================= */
    const merchantRef = doc(db, "merchants", offerData.merchantId);
    const merchantSnap = await getDoc(merchantRef);

    if (!merchantSnap.exists()) {
      throw new Error("Merchant not found");
    }

    const merchant = merchantSnap.data();

    if (!merchant?.location?.lat || !merchant?.location?.lng) {
      throw new Error("Merchant location missing");
    }

    /* =========================
       FINAL OFFER OBJECT
    ========================= */
    const finalOffer = {
      ...offerData,

      lat: merchant.location.lat,
      lng: merchant.location.lng,

      isActive: true,
      createdAt: serverTimestamp(),
    };

    const ref = await addDoc(collection(db, "offers"), finalOffer);

    console.log("✅ Offer created with Geo:", ref.id);

    return ref.id;
  } catch (err) {
    console.error("❌ Offer create error:", err);
    throw err;
  }
}

/* =========================================================
   FETCH ACTIVE OFFERS BY MERCHANT IDS (EXISTING SAFE CODE)
========================================================= */
export async function fetchOffersByMerchantIds(merchantIds = []) {
  if (!db || !Array.isArray(merchantIds) || merchantIds.length === 0) {
    return {};
  }

  const offersByMerchant = {};
  const CHUNK_SIZE = 10;

  for (let i = 0; i < merchantIds.length; i += CHUNK_SIZE) {
    const chunk = merchantIds.slice(i, i + CHUNK_SIZE);

    const q = query(
      collection(db, "offers"),
      where("isActive", "==", true),
      where("merchantId", "in", chunk)
    );

    const snapshot = await getDocs(q);

    snapshot.docs.forEach((docSnap) => {
      const data = docSnap.data();
      const merchantId = data.merchantId;

      if (!offersByMerchant[merchantId]) {
        offersByMerchant[merchantId] = [];
      }

      offersByMerchant[merchantId].push({
        id: docSnap.id,
        ...data,
      });
    });
  }

  return offersByMerchant;
}

/* =========================================================
   OPTIONAL COUNT HELPER
========================================================= */
export function getOfferCountMap(offersByMerchant = {}) {
  const countMap = {};

  Object.keys(offersByMerchant).forEach((merchantId) => {
    countMap[merchantId] = offersByMerchant[merchantId].length;
  });

  return countMap;
}
