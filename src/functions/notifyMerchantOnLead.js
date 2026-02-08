const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * =========================================================
 * LEAD → MERCHANT PUSH NOTIFICATION (FINAL FIXED VERSION)
 * =========================================================
 */
exports.notifyMerchantOnLead = functions.firestore
  // ⭐⭐⭐ CRITICAL FIX HERE ⭐⭐⭐
  .document("merchant_leads/{leadId}")
  .onCreate(async (snap, context) => {

    console.log("🔥 Lead trigger fired");

    const lead = snap.data();
    if (!lead) return null;

    const {
      merchantId,
      type,
      notified,
      distance,
      offerId,
    } = lead;

    /* ================= SAFETY GUARDS ================= */

    if (notified === true) {
      console.log("Already notified");
      return null;
    }

    if (!merchantId) {
      console.log("Missing merchantId");
      return null;
    }

    try {

      /* ================= FETCH MERCHANT ================= */

      const merchantRef = db.collection("merchants").doc(merchantId);
      const merchantSnap = await merchantRef.get();

      if (!merchantSnap.exists) {
        console.log("Merchant not found:", merchantId);
        return null;
      }

      const merchant = merchantSnap.data();

      const tokens = merchant.fcmTokens || [];

      if (!tokens.length) {
        console.log("No merchant FCM tokens");
        return null;
      }

      /* ================= MESSAGE CONTENT ================= */

      let title = "🔔 New Customer Activity";
      let body = "You have a new lead";

      if (type === "GEOFENCE") {
        title = "👀 Customer Nearby";
        body = distance
          ? `Customer is ${distance}m away`
          : "Customer entered your zone";
      }

      if (type === "VIEW") {
        title = "🔥 Offer Viewed";
        body = "Customer viewed your offer";
      }

      if (type === "REDEEM") {
        title = "🎉 Offer Redeemed";
        body = "Customer redeemed your offer";
      }

      /* ================= SEND PUSH ================= */

      const message = {
        notification: { title, body },
        data: {
          leadId: context.params.leadId,
          merchantId: merchantId || "",
          type: type || "",
          offerId: offerId || "",
        },
        tokens,
      };

      const response =
        await admin.messaging().sendEachForMulticast(message);

      console.log(
        `✅ Push sent → Success: ${response.successCount}, Failed: ${response.failureCount}`
      );

      /* ================= MARK AS NOTIFIED ================= */

      await snap.ref.update({
        notified: true,
        notifiedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return null;

    } catch (err) {
      console.error("❌ Push send failed:", err);
      return null;
    }
  });
