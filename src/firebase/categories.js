import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase.js";

/**
 * =========================================================
 * CATEGORY QUERIES
 * ---------------------------------------------------------
 * ✔ Fetch ACTIVE categories
 * ✔ Used by Merchant & Customer
 * ✔ Firebase.json safe import
 * =========================================================
 */

/* ======================
   FETCH ACTIVE CATEGORIES
====================== */
export async function fetchActiveCategories() {
  const q = query(
    collection(db, "categories"),
    where("status", "==", "active")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}
