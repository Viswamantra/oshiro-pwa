import {
  collection,
  getDocs,
  updateDoc,
  doc
} from "firebase/firestore";
import { db } from "../firebase";

export async function backfillOffersOnce() {
  const offersSnap = await getDocs(collection(db, "offers"));

  for (const offerDoc of offersSnap.docs) {
    const offer = offerDoc.data();

    if (offer.shop_name && offer.mobile && offer.category) continue;
    if (!offer.merchantId) continue;

    const merchantRef = doc(db, "merchants", offer.merchantId);
    const merchantSnap = await getDocs(collection(db, "merchants"));

    const merchant = merchantSnap.docs.find(
      (m) => m.id === offer.merchantId
    )?.data();

    if (!merchant) continue;

    await updateDoc(doc(db, "offers", offerDoc.id), {
      shop_name: merchant.shop_name || "",
      mobile: merchant.mobile || "",
      category: merchant.category || "",
    });
  }

  console.log("✅ Offer backfill complete");
}
