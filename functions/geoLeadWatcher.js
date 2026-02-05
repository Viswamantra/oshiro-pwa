const functions = require("firebase-functions");
const admin = require("firebase-admin");

const db = admin.firestore();

/**
 * =========================================================
 * PHASE 2.7 – ROW 2
 * BACKEND LEAD DEDUPLICATION
 * ---------------------------------------------------------
 * ✔ Server-side authority
 * ✔ 15 min rolling window
 * ✔ Merchant-scoped
 * =========================================================
 */

exports.leadDeduplicator = functions.firestore
  .document("leads/{leadId}")
  .onCreate(async (snap, context) => {
    const lead = snap.data();
    const leadId = context.params.leadId;

    const {
      merchantId,
      customerMobile,
      type,
      createdAt,
    } = lead;

    // Safety check
    if (!merchantId || !customerMobile || !type) {
      console.log("❌ Invalid lead payload, deleting:", leadId);
      await snap.ref.delete();
      return;
    }

    // 15 min window
    const fifteenMinutesAgo = admin.firestore.Timestamp.fromMillis(
      Date.now() - 15 * 60 * 1000
    );

    const dedupeQuery = await db
      .collection("leads")
      .where("merchantId", "==", merchantId)
      .where("customerMobile", "==", customerMobile)
      .where("type", "==", type)
      .where("createdAt", ">", fifteenMinutesAgo)
      .get();

    // If more than 1 → this is a duplicate
    if (dedupeQuery.size > 1) {
      console.log(
        "⏭️ Backend dedup – deleting duplicate lead:",
        leadId
      );
      await snap.ref.delete();
      return;
    }

    // Mark as confirmed (important for Row 3)
    await snap.ref.update({
      confirmed: true,
      confirmedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log("✅ Lead confirmed:", leadId);
  });
