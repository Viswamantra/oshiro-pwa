/* =========================================================
   FIREBASE CLOUD FUNCTIONS – OSHIRO
   Geofence → Merchant Push Notification
========================================================= */

const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();

/* =========================================================
   CONFIGURATION
========================================================= */
const GEOFENCE_RADIUS_METERS = 300;
const COOLDOWN_MINUTES = 30;

/* =========================================================
   HELPER: CHECK COOLDOWN
========================================================= */
async function isInCooldown(merchantId) {
  const ref = db.collection("merchant_alerts").doc(merchantId);
  const snap = await ref.get();

  if (!snap.exists) return false;

  const lastAlert = snap.data().lastAlertAt.toDate();
  const diffMinutes =
    (Date.now() - lastAlert.getTime()) / (1000 * 60);

  return diffMinutes < COOLDOWN_MINUTES;
}

/* =========================================================
   HELPER: UPDATE ALERT TIME
========================================================= */
async function updateAlertTime(merchantId) {
  await db.collection("merchant_alerts").doc(merchantId).set({
    lastAlertAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

/* =========================================================
   MAIN FUNCTION
   Triggered when customer enters geofence
========================================================= */
exports.sendMerchantGeofenceAlert = functions.firestore
  .document("geo_events/{eventId}")
  .onCreate(async (snap, context) => {
    try {
      const event = snap.data();

      const {
        merchantId,
        customerId,
        distanceMeters,
        customerName = "A customer",
      } = event;

      // ❌ Ignore if outside geofence
      if (distanceMeters > GEOFENCE_RADIUS_METERS) {
        return null;
      }

      // ⏳ Cooldown protection
      const cooldown = await isInCooldown(merchantId);
      if (cooldown) {
        console.log("Cooldown active. Notification skipped.");
        return null;
      }

      // 🔍 Fetch merchant
      const merchantRef = db.collection("merchants").doc(merchantId);
      const merchantSnap = await merchantRef.get();

      if (!merchantSnap.exists) {
        console.error("Merchant not found");
        return null;
      }

      const merchant = merchantSnap.data();

      if (!merchant.fcmToken) {
        console.error("Merchant FCM token missing");
        return null;
      }

      /* =========================================================
         PUSH PAYLOAD
      ========================================================= */
      const payload = {
        notification: {
          title: "👣 Customer Nearby!",
          body: `${customerName} is within 300 meters. Tap to send an offer.`,
        },
        data: {
          merchantId: merchantId,
          customerId: customerId,
          type: "GEOFENCE_ALERT",
        },
        android: {
          priority: "high",
          notification: {
            sound: "default",
          },
        },
        webpush: {
          headers: {
            Urgency: "high",
          },
        },
      };

      // 🚀 Send Push
      await messaging.sendToDevice(merchant.fcmToken, payload);

      // 🕒 Update cooldown timestamp
      await updateAlertTime(merchantId);

      // ✅ Mark event as notified
      await snap.ref.update({
        notified: true,
        notifiedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log("Push notification sent successfully");
      return null;
    } catch (error) {
      console.error("Error sending notification:", error);
      return null;
    }
  });

/* =========================================================
   OPTIONAL: CLEANUP OLD GEO EVENTS (CRON – DAILY)
========================================================= */
exports.cleanupOldGeoEvents = functions.pubsub
  .schedule("every 24 hours")
  .onRun(async () => {
    const snapshot = await db
      .collection("geo_events")
      .where("createdAt", "<", admin.firestore.Timestamp.fromMillis(
        Date.now() - 24 * 60 * 60 * 1000
      ))
      .get();

    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();

    console.log("Old geo events cleaned up");
    return null;
  });
