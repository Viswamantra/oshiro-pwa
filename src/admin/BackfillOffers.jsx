import React from "react";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  query,
} from "firebase/firestore";
import { db } from "../../firebase";

export default function BackfillOffers() {
  const runBackfill = async () => {
    try {
      const offersSnap = await getDocs(collection(db, "offers"));

      let updatedCount = 0;

      for (const offerDoc of offersSnap.docs) {
        const offer = offerDoc.data();

        // ✅ Skip already fixed offers
        if (offer.shop_name && offer.mobile && offer.category) {
          continue;
        }

        if (!offer.merchantId) continue;

        // 🔍 Fetch merchant by document ID
        const merchantRef = doc(db, "merchants", offer.merchantId);
        const merchantSnap = await getDocs(
          query(collection(db, "merchants"))
        );

        const merchantDoc = merchantSnap.docs.find(
          (m) => m.id === offer.merchantId
        );

        if (!merchantDoc) continue;

        const merchant = merchantDoc.data();

        await updateDoc(doc(db, "offers", offerDoc.id), {
          shop_name: merchant.shop_name || "",
          mobile: merchant.mobile || "",
          category: merchant.category || "",
        });

        updatedCount++;
      }

      alert(`✅ Backfill complete. Updated ${updatedCount} offers.`);
    } catch (err) {
      console.error("Backfill failed:", err);
      alert("❌ Backfill failed. Check console.");
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>⚠️ One-Time Offer Backfill</h2>
      <p>
        This will add <strong>shop name, mobile, and category</strong> to
        existing offers.
      </p>

      <button
        onClick={runBackfill}
        style={{
          padding: "12px 20px",
          background: "#16a34a",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          cursor: "pointer",
        }}
      >
        Run Backfill
      </button>
    </div>
  );
}
