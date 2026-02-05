import {
  collection,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebase";

/**
 * =================================================
 * FINAL BACKFILL FOR OFFERS (MATCHES REAL DB STRUCTURE)
 * =================================================
 * Merchants use: shop_name, mobile, category
 * Offers must get: shopName, merchantMobile, categoryName
 */

export async function backfillOffersOnce() {
  console.log("🔁 Offer backfill started...");

  /* ======================
     LOAD MERCHANTS
  ====================== */
  const merchantsSnap = await getDocs(collection(db, "merchants"));
  const merchantsMap = {};

  merchantsSnap.forEach((m) => {
    merchantsMap[m.id] = m.data();
  });

  /* ======================
     LOAD OFFERS
  ====================== */
  const offersSnap = await getDocs(collection(db, "offers"));

  let updated = 0;
  let skipped = 0;

  for (const offerDoc of offersSnap.docs) {
    const offer = offerDoc.data();

    // ✅ merchantId is CORRECT in your DB
    const merchantId = offer.merchantId;
    if (!merchantId) {
      skipped++;
      continue;
    }

    // ✅ Skip if already backfilled
    if (
      offer.shopName &&
      offer.merchantMobile &&
      offer.categoryName
    ) {
      skipped++;
      continue;
    }

    const merchant = merchantsMap[merchantId];
    if (!merchant) {
      console.warn("❌ Merchant not found:", merchantId);
      skipped++;
      continue;
    }

    /* ======================
       WRITE CAMELCASE SNAPSHOT
    ====================== */
    await updateDoc(doc(db, "offers", offerDoc.id), {
      shopName: merchant.shop_name || "",
      merchantMobile: merchant.mobile || "",
      categoryName: merchant.category || "",
      backfilledAt: new Date(),
    });

    updated++;
  }

  console.log("✅ Offer backfill finished");
  console.log("➡ Updated offers:", updated);
  console.log("➡ Skipped offers:", skipped);
}

// 🔥 TEMP: auto-run once during dev
backfillOffersOnce();
