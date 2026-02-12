import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase.js";

/**
 * =========================================================
 * CATEGORY QUERIES (GLOBAL MASTER)
 * ---------------------------------------------------------
 * ✔ Fetch ACTIVE categories
 * ✔ Supports Icons
 * ✔ Sorted order
 * ✔ Backward compatible
 * =========================================================
 */

export async function fetchActiveCategories() {
  try {
    const q = query(
      collection(db, "categories"),
      where("status", "==", "active"), // keep your existing logic
      orderBy("sortOrder", "asc") // NEW: UI consistency
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
      const data = doc.data();

      return {
        id: doc.id,
        name: data.name || "",
        icon: data.icon || "category", // default icon fallback
        iconUrl: data.iconUrl || null,
        status: data.status || "active",
        sortOrder: data.sortOrder || 999,
        ...data,
      };
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}
