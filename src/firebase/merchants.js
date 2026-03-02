import {
  collection,
  getDocs,
  query,
  where,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";

import { auth, db } from "./index.js";

/* =========================================================
   HELPER – Normalize Indian Mobile (+91XXXXXXXXXX)
========================================================= */
function normalizeMobile(phone) {
  if (!phone) return null;

  let digits = phone.replace(/\D/g, "");

  if (digits.length > 10) {
    digits = digits.slice(-10);
  }

  if (digits.length !== 10) {
    console.warn("Invalid mobile length:", digits);
    return null;
  }

  return "+91" + digits;
}

/* =========================================================
   GET MERCHANT BY UID
========================================================= */
export async function getMerchantByUid(uid) {
  try {
    if (!uid) return null;

    const snap = await getDoc(doc(db, "merchants", uid));
    if (!snap.exists()) return null;

    const data = snap.data();

    return {
      id: snap.id,
      shopName: data.shopName || "",
      mobile: data.mobile || "",
      category: data.category || "",
      categoryId: data.categoryId || "",
      shopImageUrl: data.shopImageUrl || "",
      status: data.status || "pending",
      profileComplete: data.profileComplete || false,
      approved: data.approved || false,
      createdAt: data.createdAt || null,
      updatedAt: data.updatedAt || null,
    };

  } catch (err) {
    console.error("❌ getMerchantByUid error:", err);
    return null;
  }
}

/* =========================================================
   REGISTER / UPDATE MERCHANT (SECURE – UID BASED)
========================================================= */
export async function registerMerchant({
  shopName,
  category,
  categoryId,
  shopImageUrl,
}) {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const uid = user.uid;
    const normalizedMobile = normalizeMobile(user.phoneNumber);

    if (!shopName || !category) {
      throw new Error("Missing required merchant fields");
    }

    const merchantRef = doc(db, "merchants", uid);
    const existingSnap = await getDoc(merchantRef);

    const basePayload = {
      mobile: normalizedMobile,
      shopName: shopName.trim(),
      category: category.trim(),
      categoryId: categoryId || "",
      shopImageUrl: shopImageUrl || "",
      updatedAt: serverTimestamp(),
    };

    /* =========================
       NEW MERCHANT
    ========================= */
    if (!existingSnap.exists()) {
      await setDoc(merchantRef, {
        ...basePayload,
        status: "pending",      // 🔒 Admin approval required
        profileComplete: true,
        approved: false,
        createdAt: serverTimestamp(),
      });
    }

    /* =========================
       EXISTING MERCHANT
       (No approval control)
    ========================= */
    else {
      await setDoc(merchantRef, basePayload, { merge: true });
    }

    console.log("✅ Merchant registered/updated:", uid);

  } catch (err) {
    console.error("❌ registerMerchant error:", err);
    throw err;
  }
}

/* =========================================================
   FETCH APPROVED MERCHANTS (Customer Side)
========================================================= */
export async function fetchNearbyMerchants({ category = "" } = {}) {
  try {

    let baseQuery = query(
      collection(db, "merchants"),
      where("approved", "==", true),
      where("profileComplete", "==", true)
    );

    if (category) {
      baseQuery = query(
        collection(db, "merchants"),
        where("approved", "==", true),
        where("profileComplete", "==", true),
        where("category", "==", category)
      );
    }

    const snapshot = await getDocs(baseQuery);

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();

      return {
        id: docSnap.id,
        shopName: data.shopName || "",
        mobile: data.mobile || "",
        category: data.category || "",
        categoryId: data.categoryId || "",
        shopImageUrl: data.shopImageUrl || "",
        status: data.status || "",
        profileComplete: data.profileComplete || false,
        approved: data.approved || false,
      };
    });

  } catch (err) {
    console.error("❌ fetchNearbyMerchants error:", err);
    return [];
  }
}

/* =========================================================
   GET MERCHANT BY MOBILE
========================================================= */
export async function getMerchantByMobile(mobile) {
  try {
    if (!mobile) return null;

    const normalizedMobile = normalizeMobile(mobile);
    if (!normalizedMobile) return null;

    const q = query(
      collection(db, "merchants"),
      where("mobile", "==", normalizedMobile)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    const docSnap = snapshot.docs[0];
    return {
      id: docSnap.id,
      ...docSnap.data(),
    };

  } catch (err) {
    console.error("❌ getMerchantByMobile error:", err);
    return null;
  }
}