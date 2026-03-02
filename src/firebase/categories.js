import { collection, getDocs } from "firebase/firestore";
import { db } from "./index.js";

/**
 * =========================================================
 * CATEGORY QUERIES (INDEX FREE SAFE VERSION)
 * ---------------------------------------------------------
 * ✔ No where()
 * ✔ No orderBy()
 * ✔ No index dependency
 * ✔ Works with all old + new data
 * =========================================================
 */

export async function fetchActiveCategories() {
  if (!db) {
    console.error("Firestore DB not initialized");
    return [];
  }

  try {
    const snapshot = await getDocs(collection(db, "categories"));

    const allCategories = snapshot.docs.map((doc) => {
      const data = doc.data();

      return {
        id: doc.id,
        name: data.name || "",
        icon: data.icon || "🏬",
        iconUrl: data.iconUrl || null,
        status: data.status ?? "active",
        sortOrder: data.sortOrder ?? 999,
      };
    });

    const active = allCategories.filter((cat) => {
      if (!cat.status) return true;
      if (cat.status === true) return true;
      if (String(cat.status).toLowerCase() === "active") return true;
      return false;
    });

    active.sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));

    console.log("Fetched categories:", active);

    return active;
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}