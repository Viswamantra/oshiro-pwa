import {
  collection,
  getDocs,
  updateDoc,
  doc
} from "firebase/firestore";
import { db } from "../firebase";

/**
 * =========================================================
 * ONE-TIME MERCHANT SCHEMA MIGRATION
 * ---------------------------------------------------------
 * - Converts old fields to new canonical fields
 * - SAFE to run once
 * =========================================================
 */

export async function migrateMerchants() {
  const snap = await getDocs(collection(db, "merchants"));

  const updates = snap.docs.map(async (d) => {
    const data = d.data();
    const ref = doc(db, "merchants", d.id);

    const updatePayload = {};

    // migrate shopName → shop_name
    if (!data.shop_name && data.shopName) {
      updatePayload.shop_name = data.shopName;
    }

    // migrate categoryId → category
    if (!data.category && data.categoryId) {
      updatePayload.category = data.categoryId;
    }

    if (Object.keys(updatePayload).length > 0) {
      console.log("Migrating merchant:", d.id, updatePayload);
      return updateDoc(ref, updatePayload);
    }
  });

  await Promise.all(updates.filter(Boolean));
  console.log("✅ Merchant migration completed");
}
