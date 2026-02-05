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

/* =========================================================
   UTIL
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

function cooldownExpired(lastSent) {
  if (!lastSent) return true;
  const mins =
    (Date.now() - lastSent.toMillis()) /
    (1000 * 60);
  return mins >= COOLDOWN_MINUTES;
}

/* =========================================================
   PHASE 2.7 – ROW 2
   BACKEND LEAD DEDUPLICATION (AUTHORITATIVE)
========================================================= */
exports.leadDeduplicator = onDocumentCreated(
  "leads/{leadId}",
  async (event) => {
    const snap = event.data;
    if (!snap?.exists) return;

    const lead = snap.data();
    const leadId = event.params.leadId;

    const { merchantId, customerMobile, type } =
      lead;

    // Basic validation
    if (!merchantId || !customerMobile || !type) {
      console.log(
        "❌ Invalid lead payload, deleting:",
        leadId
      );
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

    // If more than one lead exists → duplicate
    if (dedupeSnap.size > 1) {
      console.log(
        "⏭️ Backend dedup: deleting duplicate lead",
        leadId
      );
      await snap.ref.delete();
      return;
    }

    // Mark lead as confirmed (Row 3 depends on this)
    await snap.ref.update({
      confirmed: true,
      confirmedAt:
        admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log("✅ Lead confirmed:", leadId);
  }
);

/* =========================================================
   PHASE 2.7 – ROW 3
   LEAD → MERCHANT NOTIFICATION TRIGGER
========================================================= */
exports.leadNotificationTrigger = onDocumentWritten(
  "leads/{leadId}",
  async (event) => {
    const before = event.data?.before;
    const after = event.data?.after;

    // Only act on updates
    if (!before?.exists || !after?.exists) return;

    const prev = before.data();
    const lead = after.data();

    // Trigger ONLY when confirmed flips to true
    if (
      prev.confirmed === true ||
      lead.confirmed !== true
    ) {
      return;
    }

    // Prevent duplicate notifications
    if (lead.notified === true) return;

    const {
      merchantId,
      customerMobile,
      type,
      distance,
    } = lead;

    if (!merchantId || !customerMobile) return;

    /* ======================
       LOAD MERCHANT
    ====================== */
    const merchantSnap = await db
      .collection("merchants")
      .doc(merchantId)
      .get();

    if (!merchantSnap.exists) return;

    const merchant = merchantSnap.data();
    const fcmToken = merchant.fcmToken;

    if (!fcmToken) return;

    /* ======================
       BUILD MESSAGE
    ====================== */
    let title = "New Customer Lead";
    let body = `Customer ${customerMobile}`;

    if (type === "geo_enter" && distance) {
      body = `Customer nearby (${Math.round(
        distance
      )} m away)`;
    }

    if (type === "offer_view") {
      body = "Customer viewed your offer";
    }

    /* ======================
       SEND NOTIFICATION
    ====================== */
    await messaging.send({
      token: fcmToken,
      notification: {
        title,
        body,
      },
      data: {
        leadType: type,
        merchantId,
        customerMobile,
      },
    });

    /* ======================
       MARK AS NOTIFIED
    ====================== */
    await after.ref.update({
      notified: true,
      notifiedAt:
        admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(
      "🔔 Lead notification sent:",
      event.params.leadId
    );
  }
);

/* =========================================================
   EXISTING: CUSTOMER GEO-FENCE WATCHER
   (UNCHANGED BEHAVIOR)
========================================================= */
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
      if (!merchant.location || !merchant.fcmToken)
        continue;

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
          body: `Customer within ${Math.round(
            distance
          )} meters`,
        },
        data: {
          customerMobile: mobile,
          merchantId: doc.id,
        },
      });

      await alertRef.set({
        lastSent:
          admin.firestore.FieldValue.serverTimestamp(),
        distance,
      });
    }
  }
);

/* =========================================================
   CLEANUP JOB
========================================================= */
exports.cleanupOldAlerts = onSchedule(
  "every 24 hours",
  async () => {
    const cutoff =
      Date.now() - 1000 * 60 * 60 * 24;

    const snap = await db
      .collection("merchant_alerts")
      .get();

    const batch = db.batch();

    snap.docs.forEach((doc) => {
      if (
        doc.data().lastSent?.toMillis() < cutoff
      ) {
        batch.delete(doc.ref);
      }
    });

    await batch.commit();
  }
);
