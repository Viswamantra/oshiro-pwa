/* =========================================================
   GLOBAL REGION CONFIG (INDIA)
========================================================= */
const { setGlobalOptions } = require("firebase-functions/v2");

setGlobalOptions({
  region: "asia-south1",
});

/* =========================================================
   IMPORTS
========================================================= */
const {
  onDocumentWritten,
  onDocumentCreated,
} = require("firebase-functions/v2/firestore");

const { onSchedule } = require("firebase-functions/v2/scheduler");

const admin = require("firebase-admin");

admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();

/* =========================================================
   CONSTANTS
========================================================= */
const COOLDOWN_MINUTES = 30;
const MAX_DISTANCE_METERS = 500;
const EARTH_RADIUS = 6371000;
const LEAD_DEDUP_MINUTES = 15;
const MAX_PUSH_CAP_KM = 10;

/* =========================================================
   RELIABLE PUSH SENDER (🔥 NEW)
========================================================= */
async function sendPushSafe(message, userType, userId) {
  try {
    await messaging.send(message);

    console.log("✅ Push Success:", userType, userId);
    return true;

  } catch (err) {

    console.log("❌ Push Failed:", userType, userId, err.code);

    if (
      err.code === "messaging/registration-token-not-registered" ||
      err.code === "messaging/invalid-registration-token"
    ) {
      try {
        await db.collection(userType).doc(userId).update({
          fcmToken: admin.firestore.FieldValue.delete(),
        });

        console.log("🧹 Token removed:", userType, userId);
      } catch (cleanupErr) {
        console.log("Cleanup failed:", cleanupErr);
      }
    }

    return false;
  }
}

/* =========================================================
   DISTANCE UTIL
========================================================= */
function distanceMeters(lat1, lon1, lat2, lon2) {
  const toRad = (v) => (v * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return (
    2 *
    EARTH_RADIUS *
    Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  );
}

function distanceKm(lat1, lon1, lat2, lon2) {
  return distanceMeters(lat1, lon1, lat2, lon2) / 1000;
}

function cooldownExpired(lastSent) {
  if (!lastSent) return true;

  const mins =
    (Date.now() - lastSent.toMillis()) / (1000 * 60);

  return mins >= COOLDOWN_MINUTES;
}

/* =========================================================
   OFFER → GEO CUSTOMER PUSH
========================================================= */
exports.offerGeoPushToCustomers = onDocumentCreated(
  "offers/{offerId}",
  async (event) => {
    try {
      const offer = event.data?.data();
      if (!offer?.lat || !offer?.lng) return;

      const customersSnap = await db.collection("customers").get();
      const sendJobs = [];

      customersSnap.forEach((doc) => {

        const customer = doc.data();

        if (!customer?.fcmToken) return;
        if (!customer?.lat || !customer?.lng) return;

        const userRadiusKm = customer.selectedDistanceKm || 3;
        const allowedRadiusKm = Math.min(userRadiusKm, MAX_PUSH_CAP_KM);

        const distance = distanceKm(
          offer.lat,
          offer.lng,
          customer.lat,
          customer.lng
        );

        if (distance <= allowedRadiusKm) {

          sendJobs.push(
            sendPushSafe(
              {
                token: customer.fcmToken,
                notification: {
                  title: offer.title || "🎉 New Offer Near You",
                  body: offer.description || "Tap to view offer",
                },
                data: {
                  offerId: event.params.offerId,
                  merchantId: offer.merchantId || "",
                },
              },
              "customers",
              doc.id
            )
          );

        }

      });

      await Promise.all(sendJobs);

      console.log("✅ Geo Offer Push Sent:", sendJobs.length);

    } catch (err) {
      console.error("offerGeoPushToCustomers error:", err);
    }
  }
);

/* =========================================================
   LEAD DEDUPLICATION
========================================================= */
exports.leadDeduplicator = onDocumentCreated(
  "leads/{leadId}",
  async (event) => {
    try {
      const snap = event.data;
      if (!snap?.exists) return;

      const lead = snap.data();
      const { merchantId, customerMobile, type } = lead || {};

      if (!merchantId || !customerMobile || !type) {
        await snap.ref.delete();
        return;
      }

      const cutoff =
        admin.firestore.Timestamp.fromMillis(
          Date.now() - LEAD_DEDUP_MINUTES * 60 * 1000
        );

      const dedupeSnap = await db
        .collection("leads")
        .where("merchantId", "==", merchantId)
        .where("customerMobile", "==", customerMobile)
        .where("type", "==", type)
        .where("createdAt", ">", cutoff)
        .get();

      if (dedupeSnap.size > 1) {
        await snap.ref.delete();
        return;
      }

      await snap.ref.update({
        confirmed: true,
        confirmedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    } catch (err) {
      console.error("leadDeduplicator error:", err);
    }
  }
);

/* =========================================================
   LEAD → MERCHANT PUSH
========================================================= */
exports.leadNotificationTrigger = onDocumentWritten(
  "leads/{leadId}",
  async (event) => {
    try {
      const before = event.data?.before;
      const after = event.data?.after;

      if (!before?.exists || !after?.exists) return;

      const prev = before.data();
      const lead = after.data();

      if (prev.confirmed === true) return;
      if (lead.confirmed !== true) return;
      if (lead.notified === true) return;

      const { merchantId, customerMobile, type, distance } = lead || {};
      if (!merchantId) return;

      const merchantSnap = await db.collection("merchants").doc(merchantId).get();
      if (!merchantSnap.exists) return;

      const merchant = merchantSnap.data();
      if (!merchant?.fcmToken) return;

      let title = "New Customer Lead";
      let body = `Customer ${customerMobile || ""}`;

      if (type === "geo_enter" && distance) {
        body = `Customer nearby (${Math.round(distance)}m)`;
      }

      if (type === "offer_view") {
        body = "Customer viewed your offer";
      }

      await sendPushSafe(
        {
          token: merchant.fcmToken,
          notification: { title, body },
        },
        "merchants",
        merchantId
      );

      await after.ref.update({
        notified: true,
        notifiedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    } catch (err) {
      console.error("leadNotificationTrigger error:", err);
    }
  }
);

/* =========================================================
   GEO FENCE WATCHER
========================================================= */
exports.customerGeoFenceWatcher = onDocumentWritten(
  "customer_locations/{customerId}",
  async (event) => {
    try {
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

        if (!merchant?.location || !merchant?.fcmToken) continue;

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

        if (alertSnap.exists && !cooldownExpired(alertSnap.data().lastSent)) {
          continue;
        }

        await sendPushSafe(
          {
            token: merchant.fcmToken,
            notification: {
              title: "Nearby Customer Alert",
              body: `Customer within ${Math.round(distance)}m`,
            },
          },
          "merchants",
          doc.id
        );

        await alertRef.set({
          lastSent: admin.firestore.FieldValue.serverTimestamp(),
          distance,
        });
      }

    } catch (err) {
      console.error("customerGeoFenceWatcher error:", err);
    }
  }
);

/* =========================================================
   ADMIN BROADCAST
========================================================= */
exports.adminNotificationSender = onDocumentCreated(
  "notifications/{id}",
  async (event) => {
    try {
      const data = event.data?.data();
      if (!data) return;

      const title = data.title || "Notification";
      const body = data.body || "";

      const customersSnap = await db.collection("customers").get();
      const tokens = [];

      customersSnap.forEach((doc) => {
        const t = doc.data()?.fcmToken;
        if (t) tokens.push(t);
      });

      if (!tokens.length) return;

      await messaging.sendEachForMulticast({
        tokens,
        notification: { title, body },
      });

    } catch (err) {
      console.error("adminNotificationSender error:", err);
    }
  }
);

/* =========================================================
   CLEANUP JOB
========================================================= */
exports.cleanupOldAlerts = onSchedule(
  "every 24 hours",
  async () => {
    try {
      const cutoff = Date.now() - 1000 * 60 * 60 * 24;

      const snap = await db.collection("merchant_alerts").get();
      const batch = db.batch();

      snap.docs.forEach((doc) => {
        if (doc.data()?.lastSent?.toMillis() < cutoff) {
          batch.delete(doc.ref);
        }
      });

      await batch.commit();

    } catch (err) {
      console.error("cleanupOldAlerts error:", err);
    }
  }
);
