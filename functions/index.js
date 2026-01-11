const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");

admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();

const COOLDOWN_MINUTES = 30;
const MAX_DISTANCE_METERS = 500;
const EARTH_RADIUS = 6371000;

/* ================= UTIL ================= */

function distanceMeters(lat1, lon1, lat2, lon2) {
  const toRad = (v) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return 2 * EARTH_RADIUS * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function cooldownExpired(lastSent) {
  if (!lastSent) return true;
  const mins =
    (Date.now() - lastSent.toMillis()) / (1000 * 60);
  return mins >= COOLDOWN_MINUTES;
}

/* ================= MAIN FUNCTION ================= */

exports.customerGeoFenceWatcher = onDocumentWritten(
  "customer_locations/{customerId}",
  async (event) => {
    if (!event.data?.after.exists) return;

    const customerId = event.params.customerId;
    const customer = event.data.after.data();

    const { lat, lng, mobile } = customer || {};
    if (!lat || !lng || !mobile) return;

    const merchantsSnap = await db
      .collection("merchants")
      .where("status", "==", "approved")
      .get();

    for (const doc of merchantsSnap.docs) {
      const merchant = doc.data();
      if (!merchant.location || !merchant.fcmToken) continue;

      const distance = distanceMeters(
        lat,
        lng,
        merchant.location.lat,
        merchant.location.lng
      );

      if (distance > MAX_DISTANCE_METERS) continue;

      const alertRef = db
        .collection("merchant_alerts")
        .doc(`${doc.id}_${customerId}`);

      const alertSnap = await alertRef.get();
      if (
        alertSnap.exists &&
        !cooldownExpired(alertSnap.data().lastSent)
      ) {
        continue;
      }

      await messaging.send({
        token: merchant.fcmToken,
        notification: {
          title: "Nearby Customer Alert",
          body: `Customer within ${Math.round(distance)} meters`,
        },
        data: {
          customerMobile: mobile,
          merchantId: doc.id,
        },
      });

      await alertRef.set({
        lastSent: admin.firestore.FieldValue.serverTimestamp(),
        distance,
      });
    }
  }
);

/* ================= CLEANUP JOB ================= */

exports.cleanupOldAlerts = onSchedule("every 24 hours", async () => {
  const cutoff =
    Date.now() - 1000 * 60 * 60 * 24;

  const snap = await db.collection("merchant_alerts").get();
  const batch = db.batch();

  snap.docs.forEach((doc) => {
    if (doc.data().lastSent?.toMillis() < cutoff) {
      batch.delete(doc.ref);
    }
  });

  await batch.commit();
});
