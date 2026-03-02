import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
  query,
  where,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";

import { db } from "./index.js";

/* =========================================================
   FETCH ACTIVE CATEGORIES
========================================================= */
export async function fetchCategories() {
  if (!db) return [];

  try {
    const q = query(
      collection(db, "categories"),
      where("status", "==", "active")
    );

    const snap = await getDocs(q);

    return snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));
  } catch (err) {
    console.error("Fetch categories failed:", err);
    return [];
  }
}

/* =========================================================
   LOG CUSTOMER VISIT (UID BASED)
========================================================= */
export async function logCustomerVisit({
  uid,
  phoneNumber,
  lat,
  lng,
  source = "app",
}) {
  if (!db || !uid) return;

  const payload = {
    uid,
    phoneNumber: phoneNumber || null,
    source,
    createdAt: serverTimestamp(),
  };

  if (
    typeof lat === "number" &&
    typeof lng === "number" &&
    !isNaN(lat) &&
    !isNaN(lng)
  ) {
    payload.location = { lat, lng };
  }

  try {
    await addDoc(collection(db, "customer_visits"), payload);
  } catch (err) {
    console.error("Customer visit log failed:", err);
  }
}

/* =========================================================
   UPSERT CUSTOMER (UID BASED – PRODUCTION SAFE)
========================================================= */
export async function upsertCustomer({
  uid,
  phoneNumber,
  name,
}) {
  if (!db || !uid || !name) return;

  try {
    const ref = doc(db, "customers", uid);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      // Existing customer → update login timestamp + name
      await setDoc(
        ref,
        {
          name,
          mobile: phoneNumber || null,
          lastLoginAt: serverTimestamp(),
        },
        { merge: true }
      );
    } else {
      // New customer → create document
      await setDoc(ref, {
        uid,
        mobile: phoneNumber || null,
        name,
        role: "customer",
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      });
    }
  } catch (err) {
    console.error("Upsert customer failed:", err);
    throw err;
  }
}