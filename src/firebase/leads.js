import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";

import { db } from "./index";

/* =========================================================
   LEAD TYPES
========================================================= */
export const LEAD_TYPES = {
  OFFER_VIEW: "OFFER_VIEW",
  CALL_CLICK: "CALL_CLICK",
  WHATSAPP_CLICK: "WHATSAPP_CLICK",
  MAP_CLICK: "MAP_CLICK",
};

/* =========================================================
   CONFIG
========================================================= */
const LEAD_COOLDOWN_MINUTES = 30;

/* =========================================================
   CREATE LEAD (WITH DEDUP PROTECTION)
========================================================= */
export async function createLead({
  merchantId,
  customerMobile,
  customerId,
  customerName,
  type,
  source = "customer",
  offerId = null,
}) {
  try {
    if (!merchantId || !customerMobile || !type) {
      console.warn("Invalid lead payload");
      return;
    }

    /* ===========================
       DEDUP CHECK
    ============================ */

    const cooldownTime = new Date();
    cooldownTime.setMinutes(
      cooldownTime.getMinutes() - LEAD_COOLDOWN_MINUTES
    );

    const dedupQuery = query(
      collection(db, "leads"),
      where("merchantId", "==", merchantId),
      where("customerMobile", "==", customerMobile),
      where("type", "==", type),
      where("createdAt", ">=", Timestamp.fromDate(cooldownTime))
    );

    const existing = await getDocs(dedupQuery);

    if (!existing.empty) {
      console.log(
        `⏳ Dedup: Lead blocked (${type}) within ${LEAD_COOLDOWN_MINUTES} mins`
      );
      return; // ❌ Do not create duplicate
    }

    /* ===========================
       CREATE NEW LEAD
    ============================ */

    await addDoc(collection(db, "leads"), {
      merchantId,
      customerMobile,
      customerId: customerId || null,
      customerName: customerName || "",
      type,
      source,
      offerId,
      createdAt: serverTimestamp(),
    });

    console.log(`✅ Lead created: ${type}`);
  } catch (error) {
    console.error("Create lead failed:", error);
  }
}/* =========================================================
   FETCH LEADS BY MERCHANT
========================================================= */
export async function fetchLeadsByMerchant(merchantId) {
  try {
    if (!merchantId) return [];

    const q = query(
      collection(db, "leads"),
      where("merchantId", "==", merchantId)
    );

    const snap = await getDocs(q);

    return snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Fetch leads failed:", error);
    return [];
  }
}