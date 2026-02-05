import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase";

/**
 * =========================================================
 * PHASE 2.7 – ROW 1
 * LEAD CREATION TRIGGER
 * ---------------------------------------------------------
 * ✔ Geo enter
 * ✔ Offer view
 * ✔ Session-guarded
 * ❌ No dedup here (Row 2)
 * =========================================================
 */

const sessionCache = new Set();

/**
 * Create lead (session-safe)
 */
export async function triggerLead({
  merchantId,
  customerId,
  customerMobile,
  customerName = "",
  source, // "geo_enter" | "offer_view"
}) {
  if (!merchantId || !customerId || !customerMobile || !source) {
    return;
  }

  // Session-level guard (prevents rapid duplicates)
  const sessionKey = `${merchantId}_${customerId}_${source}`;
  if (sessionCache.has(sessionKey)) return;

  sessionCache.add(sessionKey);

  try {
    await addDoc(collection(db, "leads"), {
      merchantId,
      customerId,
      customerMobile,
      customerName,
      source,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("Lead creation failed", err);
    sessionCache.delete(sessionKey); // rollback guard on failure
  }
}
