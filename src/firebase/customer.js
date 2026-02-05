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
import { db } from "./firebase"; // ✅ keep as-is

/* ======================
   FETCH ACTIVE CATEGORIES
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
====================== */
export async function logCustomerVisit({
  mobile,
  lat,
  lng,
  source = "app",
}) {
  if (!db || !mobile) return;

  const payload = {
    mobile,
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

/* ======================
   UPSERT CUSTOMER (NEW)
====================== */
export async function upsertCustomer({ mobile, name }) {
  if (!db || !mobile || !name) return;

  try {
    const ref = doc(db, "customers", mobile);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      // Existing customer → update login timestamp + name
      await setDoc(
        ref,
        {
          name,
          lastLoginAt: serverTimestamp(),
        },
        { merge: true }
      );
    } else {
      // New customer
      await setDoc(ref, {
        mobile,
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
