const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

/* =========================
   DISTANCE (HAVERSINE)
========================= */
function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

/* =========================
   CONFIG
========================= */
const GEOFENCE_KM = 1;                 // 1 km entry zone
const COOLDOWN_MINUTES = 30;           // anti-spam

exports.notifyOnGeofenceEnter = functions.firestore
  .document("users/{userId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const userId = context.params.userId;

    // Basic validation
    if (!after?.lat || !after?.lng) return null;
    if (!after?.fcmToken) return null;
    if (after.pushEnabled === false) return null;

    // Ignore insignificant movement
    if (
      before?.lat === after.lat &&
      before?.lng === after.lng
    ) {
      return null;
    }

    const now = Date.now();

    // Cooldown check
    if (
      after.lastPushAt &&
      now - after.lastPushAt < COOLDOWN_MINUTES * 60 * 1000
    ) {
      return null;
    }

    // Load approved merchants
    const merchantsSnap = await db
      .collection("merchants")
      .where("status", "==", "approved")
      .get();

    if (merchantsSnap.empty) return null;

    // Load active offers
    const offersSnap = await db
      .collection("offers")
      .where("active", "==", true)
      .get();

    if (offersSnap.empty) return null;

    // Build merchant → offers map
    const offersByMerchant = {};
    offersSnap.forEach((d) => {
      const o = d.data();
      if (!offersByMerchant[o.merchantId]) {
        offersByMerchant[o.merchantId] = [];
      }
      offersByMerchant[o.merchantId].push(o);
    });

    let notifiedMerchantId = null;
    let notificationPayload = null;

    for (const mDoc of merchantsSnap.docs) {
      const merchant = mDoc.data();
      const merchantId = mDoc.id;

      if (!merchant.lat || !merchant.lng) continue;
      if (!offersByMerchant[merchantId]) continue;

      const dist = distanceKm(
        after.lat,
        after.lng,
        merchant.lat,
        merchant.lng
      );

      if (dist <= GEOFENCE_KM) {
        const offerTitles = offersByMerchant[merchantId]
          .map((o) => o.title)
          .slice(0, 2)
          .join(", ");

        notificationPayload = {
          title: `Offers near ${merchant.shopName}`,
          body: offerTitles || "New offer available",
        };

        notifiedMerchantId = merchantId;
        break; // notify only once
      }
    }

    if (!notificationPayload) return null;

    // Send push
    await admin.messaging().send({
      token: after.fcmToken,
      notification: notificationPayload,
      data: {
        merchantId: notifiedMerchantId,
      },
    });

    // Update cooldown info
    await db.doc(`users/${userId}`).update({
      lastPushAt: now,
      lastNotifiedMerchantId: notifiedMerchantId,
    });

    return null;
  });
