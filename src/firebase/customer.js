import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
  query,
  where,
} from "firebase/firestore";
import { db } from "../index"; // ✅ correct + consistent import

/**
 * =========================================================
 * CUSTOMER FIREBASE QUERIES
 * ---------------------------------------------------------
 * ✔ Fetch active categories
 * ✔ Log customer visits (safe)
 * ✔ Optional geo capture
 * ✔ Analytics-ready structure
 * =========================================================
 */

/* ======================
   FETCH ACTIVE CATEGORIES
   (Customer UI)
====================== */
export async function fetchCategories() {
  if (!db) return [];

  try {
    const q = query(
      collection(db, "categories"),
      where("status", "==", "active")
    );

    const snap = await getDocs(q);

    return snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (err) {
    console.error("Fetch categories failed:", err);
    return [];
  }
}

/* ======================
   LOG CUSTOMER VISIT
   (OPTIONAL – SAFE)
====================== */
export async function logCustomerVisit({
  mobile,
  lat,
  lng,
  source = "app", // optional analytics tag
}) {
  if (!db || !mobile) return;

  const payload = {
    mobile,
    source,
    createdAt: serverTimestamp(),
  };

  // ✅ Attach location only if valid
  if (
    typeof lat === "number" &&
    typeof lng === "number" &&
    !isNaN(lat) &&
    !isNaN(lng)
  ) {
    payload.location = {
      lat,
      lng,
    };
  }

  try {
    await addDoc(collection(db, "customer_visits"), payload);
  } catch (err) {
    console.error("Customer visit log failed:", err);
  }
}
