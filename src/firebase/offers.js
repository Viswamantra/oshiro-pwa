import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "./index";

/**
 * =========================================================
 * OFFERS DATA ACCESS (CUSTOMER SIDE)
 * ---------------------------------------------------------
 * ✔ Fetch active offers
 * ✔ Grouped by merchantId
 * ✔ Firestore-safe (IN query limit handled)
 * ✔ Ready for badge count + offer detail screen
 * =========================================================
 */

/* =========================================================
   FETCH ACTIVE OFFERS BY MERCHANT IDS
========================================================= */
export async function fetchOffersByMerchantIds(merchantIds = []) {
  if (!db || !Array.isArray(merchantIds) || merchantIds.length === 0) {
    return {};
  }

  const offersByMerchant = {};

  /**
   * 🔥 Firestore limitation:
   * "in" query supports max 10 values
   * → so we chunk merchantIds
   */
  const CHUNK_SIZE = 10;

  for (let i = 0; i < merchantIds.length; i += CHUNK_SIZE) {
    const chunk = merchantIds.slice(i, i + CHUNK_SIZE);

    const q = query(
      collection(db, "offers"),
      where("isActive", "==", true),
      where("merchantId", "in", chunk)
    );

    const snapshot = await getDocs(q);

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const merchantId = data.merchantId;

      if (!offersByMerchant[merchantId]) {
        offersByMerchant[merchantId] = [];
      }

      offersByMerchant[merchantId].push({
        id: doc.id,
        ...data,
      });
    });
  }

  return offersByMerchant;
}

/* =========================================================
   OPTIONAL: COUNT-ONLY HELPER (FAST BADGE MODE)
   (can be used later if needed)
========================================================= */
export function getOfferCountMap(offersByMerchant = {}) {
  const countMap = {};

  Object.keys(offersByMerchant).forEach((merchantId) => {
    countMap[merchantId] = offersByMerchant[merchantId].length;
  });

  return countMap;
}
