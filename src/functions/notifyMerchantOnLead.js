const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * =========================================================
 * LEAD → MERCHANT PUSH NOTIFICATION
 * =========================================================
 */
exports.notifyMerchantOnLead = functions.firestore
  .document("leads/{leadId}")
  .onCreate(async (snap, context) => {
    const lead = snap.data();
    if (!lead) return null;

    const {
      merchantId,
      type,
      notified,
      distance,
      offerId,
    } = lead;

    // Safety guards
    if (notified === true) return null;
    if (!merchantId || !type) return null;

    try {
      /* ======================
         FETCH MERCHANT
      ====================== */
      const merchantRef = db.collection("merchants").doc(merchantId);
      const merchantSnap = await merchantRef.get();

      if (!merchantSnap.exists) return null;

      const merchant = merchantSnap.data();
      const tokens = merchant.fcmTokens || [];
      const prefs = merchant.notificationPrefs || {};

      if (tokens.length === 0) {
        console.warn("No FCM tokens for merchant:", merchantId);
        return null;
      }

      // Preference check
      if (prefs[type?.toLowerCase()] === false) {
        console.log("Notification disabled for type:", type);
        return null;
      }

      /* ======================
         MESSAGE CONTENT
      ====================== */
      let title = "🔔 New Customer Activity";
      let body = "You have a new lead";

      if (type === "GEOFENCE") {
        title = "👀 Customer Nearby";
        body = distance
          ? `A customer is ${distance}m away`
          : "A customer just entered your area";
      }

      if (type === "VIEW") {
        title = "🔥 Offer Viewed";
        body = "A customer viewed your offer";
      }

      if (type === "REDEEM") {
        title = "🎉 Offer Redeemed";
        body = "A customer redeemed your offer";
      }

      /* ======================
         SEND PUSH
      ====================== */
      const message = {
        notification: { title, body },
        data: {
          leadId: context.params.leadId,
          type,
          merchantId,
          offerId: offerId || "",
        },
        tokens,
      };

      const response = await admin.messaging().sendEachForMulticast(message);

      console.log(
        `Push sent: ${response.successCount} success, ${response.failureCount} failed`
      );

      /* ======================
         MARK LEAD AS NOTIFIED
      ====================== */
      await snap.ref.update({
        notified: true,
        notifiedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return null;
    } catch (err) {
      console.error("Notify merchant failed:", err);
      return null;
    }
  });
