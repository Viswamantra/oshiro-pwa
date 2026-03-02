import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
  Timestamp,
  getDoc
} from "firebase/firestore";

import { db, auth } from "./index.js";

/* =========================================================
   CREATE OFFER  (SECURE UID BASED)
========================================================= */
export async function createOffer({
  title,
  description,
  discountText,
  categoryId,
  categoryName,
  expiryDate,
}) {

  const user = auth.currentUser;
  if (!user) throw new Error("Authentication required");

  const merchantId = user.uid;

  try {
    /* 1️⃣ Fetch Merchant Snapshot */
    const merchantSnap = await getDoc(doc(db, "merchants", merchantId));

    if (!merchantSnap.exists()) {
      throw new Error("Merchant profile not found");
    }

    const merchantData = merchantSnap.data();

    const shopName = merchantData.shopName || "";
    const merchantMobile = merchantData.mobile || "";

    const lat =
      typeof merchantData?.location?.lat === "number"
        ? merchantData.location.lat
        : null;

    const lng =
      typeof merchantData?.location?.lng === "number"
        ? merchantData.location.lng
        : null;

    /* 2️⃣ Handle Expiry */
    let expiryTimestamp = null;

    if (expiryDate) {
      const parsedDate = new Date(expiryDate);
      if (!isNaN(parsedDate.getTime())) {
        expiryTimestamp = Timestamp.fromDate(parsedDate);
      }
    }

    /* 3️⃣ Secure Payload */
    const payload = {
      merchantId,  // 🔒 CRITICAL: matches rules
      shopName,
      merchantMobile,
      lat,
      lng,
      title: title?.trim() || "",
      description: description?.trim() || "",
      discountText: discountText?.trim() || "",
      categoryId: categoryId || "",
      categoryName: categoryName || "",
      expiryDate: expiryTimestamp,
      isActive: true,
      status: "active",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await addDoc(collection(db, "offers"), payload);

  } catch (error) {
    console.error("Create offer failed:", error);
    throw error;
  }
}

/* =========================================================
   FETCH MERCHANT OFFERS
========================================================= */
export async function fetchMerchantOffers(uid) {
  if (!uid) return [];

  try {
    const q = query(
      collection(db, "offers"),
      where("merchantId", "==", uid)
    );

    const snap = await getDocs(q);

    return snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

  } catch (error) {
    console.error("Fetch merchant offers failed:", error);
    return [];
  }
}

/* =========================================================
   FETCH OFFERS FOR CUSTOMER
========================================================= */
export async function fetchOffersByMerchantIds(merchantIds = []) {
  if (!merchantIds.length) return [];

  try {
    const q = query(
      collection(db, "offers"),
      where("merchantId", "in", merchantIds.slice(0, 10)),
      where("isActive", "==", true)
    );

    const snap = await getDocs(q);

    return snap.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));

  } catch (error) {
    console.error("Fetch offers failed:", error);
    return [];
  }
}

/* =========================================================
   UPDATE OFFER (NO merchantId mutation)
========================================================= */
export async function updateOffer(offerId, updates = {}) {
  if (!offerId) return;

  try {

    // 🔒 Prevent merchantId overwrite
    delete updates.merchantId;

    if (updates.expiryDate) {
      const parsedDate = new Date(updates.expiryDate);
      if (!isNaN(parsedDate.getTime())) {
        updates.expiryDate = Timestamp.fromDate(parsedDate);
      } else {
        delete updates.expiryDate;
      }
    }

    await updateDoc(doc(db, "offers", offerId), {
      ...updates,
      updatedAt: serverTimestamp(),
    });

  } catch (error) {
    console.error("Update offer failed:", error);
    throw error;
  }
}

/* =========================================================
   DELETE OFFER
========================================================= */
export async function deleteOffer(offerId) {
  if (!offerId) return;

  try {
    await deleteDoc(doc(db, "offers", offerId));
  } catch (error) {
    console.error("Delete offer failed:", error);
    throw error;
  }
}