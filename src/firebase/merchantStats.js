import {
  collection,
  query,
  where,
  getDocs
} from "firebase/firestore";

import { db } from "./index";

/* =========================================================
   FETCH MERCHANT STATS
   Phase 3A – Clean Aggregation
========================================================= */

export async function fetchMerchantStats(merchantId) {
  if (!merchantId) return null;

  try {
    const q = query(
      collection(db, "leads"),
      where("merchantId", "==", merchantId)
    );

    const snap = await getDocs(q);

    const leads = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    /* -----------------------------
       Aggregation Counters
    ------------------------------ */

    let totalLeads = 0;
    let offerViews = 0;
    let calls = 0;
    let whatsappClicks = 0;
    let directionsClicks = 0;

    const uniqueCustomers = new Set();

    const now = Date.now();
    const last24h = now - 24 * 60 * 60 * 1000;
    let last24hCount = 0;

    for (const lead of leads) {
      totalLeads++;

      // Unique customers
      if (lead.customerMobile) {
        uniqueCustomers.add(lead.customerMobile);
      }

      // Type based counting
      switch (lead.type) {
        case "OFFER_VIEW":
          offerViews++;
          break;
        case "CALL":
          calls++;
          break;
        case "WHATSAPP":
          whatsappClicks++;
          break;
        case "DIRECTION":
          directionsClicks++;
          break;
        default:
          break;
      }

      // Last 24 hours
      if (lead.createdAt?.toDate) {
        const created = lead.createdAt.toDate().getTime();
        if (created >= last24h) {
          last24hCount++;
        }
      }
    }

    return {
      totalLeads,
      offerViews,
      calls,
      whatsappClicks,
      directionsClicks,
      uniqueCustomers: uniqueCustomers.size,
      last24hCount,
    };

  } catch (error) {
    console.error("Fetch merchant stats failed:", error);
    return null;
  }
}