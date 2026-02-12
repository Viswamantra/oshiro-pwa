import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from "firebase/firestore";
import { db } from "./index";

/* =========================================================
   LEAD TYPES
========================================================= */
export const LEAD_TYPES = {
  OFFER_VIEW: "offer_view",
  GEO_ENTER: "geo_enter",
  REDEEM: "redeem",
};

/* =========================================================
   CREATE LEAD (PRODUCTION SAFE)
========================================================= */
export async function createLead({
  merchantId,
  customerMobile,
  customerId = null,
  customerName = "",
  offerId = null,
  type = LEAD_TYPES.OFFER_VIEW,
  distance = null,
  source = "customer",
}) {

  if (!merchantId || !customerMobile) {
    console.error("❌ createLead: missing merchantId or customerMobile");
    return { created: false };
  }

  try {
    /* ======================
       SAFE DEDUPE (NO TIME FILTER QUERY)
       Avoids composite index chaos
    ====================== */

    const dedupeKey = `${merchantId}_${customerMobile}_${type}`;

    try {
      const dedupeQuery = query(
        collection(db, "leads"),
        where("dedupeKey", "==", dedupeKey),
        orderBy("createdAt", "desc"),
        limit(1)
      );

      const existing = await getDocs(dedupeQuery);

      if (!existing.empty) {
        const lastLead = existing.docs[0].data();

        if (lastLead.createdAt) {
          const lastTime = lastLead.createdAt.toMillis();
          const now = Date.now();

          if (now - lastTime < 15 * 60 * 1000) {
            console.log("⏭️ Lead deduplicated (15min window)");
            return { created: false, reason: "DUPLICATE" };
          }
        }
      }
    } catch (dedupeErr) {
      console.warn("⚠ Dedupe skipped (safe fallback):", dedupeErr);
    }

    /* ======================
       CREATE LEAD
    ====================== */

    const docRef = await addDoc(collection(db, "leads"), {
      merchantId,
      customerMobile,
      customerId,
      customerName,
      offerId,
      type,
      distance,
      source,

      createdAt: serverTimestamp(),

      notified: false,
      notifiedAt: null,

      dedupeKey,
    });

    console.log("✅ Lead created:", docRef.id);

    return {
      created: true,
      id: docRef.id,
    };

  } catch (err) {
    console.error("🔥 createLead failed:", err);
    return {
      created: false,
      error: err.message || err,
    };
  }
}

/* =========================================================
   FETCH MERCHANT LEADS
========================================================= */
export async function fetchLeadsByMerchant(merchantId) {
  if (!merchantId) return [];

  try {
    const q = query(
      collection(db, "leads"),
      where("merchantId", "==", merchantId),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

  } catch (err) {
    console.error("Fetch merchant leads failed:", err);
    return [];
  }
}
