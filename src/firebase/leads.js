import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "./index";

/**
 * =========================================================
 * 🔒 LEAD TYPES (STABLE CONTRACT)
 * ---------------------------------------------------------
 * Used across Client + Functions + Admin
 * DO NOT RENAME once Phase 2.7 is complete
 * =========================================================
 */
export const LEAD_TYPES = {
  OFFER_VIEW: "offer_view", // Phase 2.7 – Row 1
  GEO_ENTER: "geo_enter",   // Phase 2.7 – Row 1
  REDEEM: "redeem",         // Future
};

/**
 * =========================================================
 * CREATE LEAD (PHASE 2.7 – ROW 1)
 * ---------------------------------------------------------
 * ✔ Triggered on GEO ENTER or OFFER VIEW
 * ✔ Soft dedupe (15 min) – client side
 * ✔ Merchant-scoped
 * ✔ Safe for notifications & analytics
 * =========================================================
 */
export async function createLead({
  merchantId,
  customerMobile,
  customerId = null,
  customerName = "",
  offerId = null,
  type = LEAD_TYPES.OFFER_VIEW,
  distance = null,
  source = "customer", // customer | system | admin
}) {
  /* ======================
     BASIC VALIDATION
  ====================== */
  if (!merchantId || !customerMobile) {
    console.error(
      "❌ createLead: missing merchantId or customerMobile"
    );
    return { created: false };
  }

  if (!Object.values(LEAD_TYPES).includes(type)) {
    console.error("❌ Invalid lead type:", type);
    return { created: false };
  }

  try {
    /* ======================
       SOFT DEDUP (15 mins)
       ⚠ Will move to backend in Row 2/3
    ====================== */
    const dedupeKey = `${merchantId}_${customerMobile}_${type}`;

    const fifteenMinutesAgo = Timestamp.fromMillis(
      Date.now() - 15 * 60 * 1000
    );

    const dedupeQuery = query(
      collection(db, "leads"),
      where("dedupeKey", "==", dedupeKey),
      where("createdAt", ">", fifteenMinutesAgo)
    );

    const existing = await getDocs(dedupeQuery);

    if (!existing.empty) {
      console.log("⏭️ Lead deduplicated:", dedupeKey);
      return { created: false, reason: "DUPLICATE" };
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

      // notification pipeline (Row 3)
      notified: false,
      notifiedAt: null,

      // helpers
      dedupeKey,
    });

    console.log("✅ Lead created:", docRef.id);
    return { created: true, id: docRef.id };
  } catch (err) {
    console.error("🔥 createLead failed:", err);
    return { created: false, error: err };
  }
}

/**
 * =========================================================
 * FETCH LEADS FOR MERCHANT (MERCHANT PANEL)
 * ---------------------------------------------------------
 * ✔ Latest first
 * ✔ All lead types
 * ✔ Used by MerchantLeads.jsx (LOCKED)
 * =========================================================
 */
export async function fetchLeadsByMerchant(merchantId) {
  if (!merchantId) return [];

  try {
    const q = query(
      collection(db, "leads"),
      where("merchantId", "==", merchantId),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (err) {
    console.error("Fetch merchant leads failed:", err);
    return [];
  }
}
