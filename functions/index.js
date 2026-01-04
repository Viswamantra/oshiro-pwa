/* =========================================================
   FIREBASE CLOUD FUNCTIONS – OSHIRO
   GeoFence → Merchant Alert
   Merchant Instant Offer → Customer Push
========================================================= */

const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();

/* =========================================================
   CONFIG
========================================================= */
const COOLDOWN_MINUTES = 30;
const MIN_GEOFENCE_RADIUS = 100;
const DEFAULT_GEOFENCE_RADIUS = 300;

/* =========================================================
   HELPER: COOLDOWN CHECK (MERCHANT ALERT)
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
   HELPER: UPDATE COOLDOWN
========================================================= */
async function updateAlertTime(merchantId) {
  await db.collection("merchant_alerts").doc(merchantId).set({
    lastAlertAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

/* =========================================================
   🔔 GEO EVENT → MERCHANT PUSH ALERT
========================================================= */
exports.sendMerchantGeofenceAlert = functions.firestore
  .document("geo_events/{eventId}")
  .onCreate(async (snap) => {
    try {
      const event = snap.data();
      if (!event) return null;

      const {
        merchantId,
        customerId,
        distanceMeters,
        notified,
      } = event;

      if (!merchantId || notified === true) return null;

      const merchantSnap = await db
        .collection("merchants")
        .doc(merchantId)
        .get();

      if (!merchantSnap.exists) return null;

      const merchant = merchantSnap.data();

      const geofenceRadius =
        typeof merchant.geofenceRadius === "number" &&
        merchant.geofenceRadius >= MIN_GEOFENCE_RADIUS
          ? merchant.geofenceRadius
          : DEFAULT_GEOFENCE_RADIUS;

      if (distanceMeters > geofenceRadius) return null;

      if (!merchant.fcmToken) {
        console.log("⚠️ Merchant FCM token missing");
        return null;
      }

      const cooldown = await isInCooldown(merchantId);
      if (cooldown) {
        console.log("⏳ Merchant alert cooldown active");
        return null;
      }

      const message = {
        token: merchant.fcmToken,
        notification: {
          title: "👣 Customer Nearby!",
          body: `A customer is within ${distanceMeters} meters`,
        },
        webpush: {
          notification: {
            title: "👣 Customer Nearby!",
            body: `A customer is within ${distanceMeters} meters`,
            icon: "/logo192.png",
            badge: "/logo192.png",
            requireInteraction: true,
          },
        },
        data: {
          type: "GEOFENCE_ALERT",
          merchantId,
          customerId,
        },
      };

      await messaging.send(message);

      await updateAlertTime(merchantId);

      await snap.ref.update({
        notified: true,
        notifiedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log("✅ Merchant geofence alert sent:", merchantId);
      return null;
    } catch (err) {
      console.error("🔥 Geo alert error:", err);
      return null;
    }
  });

/* =========================================================
   🔥 MERCHANT INSTANT OFFER → CUSTOMER PUSH
========================================================= */
exports.sendInstantOfferPush = functions.firestore
  .document("instant_offers/{offerId}")
  .onCreate(async (snap) => {
    try {
      const offer = snap.data();
      if (!offer) return null;

      const {
        customerId,
        merchantId,
        finalDiscount,
        message,
      } = offer;

      if (!customerId || !merchantId) return null;

      const customerSnap = await db
        .collection("customers")
        .doc(customerId)
        .get();

      if (!customerSnap.exists) return null;

      const customer = customerSnap.data();
      const tokens = customer.fcmTokens || [];

      if (!tokens.length) {
        console.log("⚠️ No FCM tokens for customer");
        return null;
      }

      const payload = {
        notification: {
          title: "🔥 Instant Offer Just For You!",
          body:
            message ||
            `${finalDiscount}% OFF – Walk in now`,
        },
        webpush: {
          notification: {
            title: "🔥 Instant Offer Just For You!",
            body:
              message ||
              `${finalDiscount}% OFF – Walk in now`,
            icon: "/logo192.png",
            requireInteraction: true,
          },
        },
        data: {
          type: "INSTANT_OFFER",
          merchantId,
        },
      };

      await messaging.sendToDevice(tokens, payload);

      console.log(
        "✅ Instant offer push sent to customer:",
        customerId
      );
      return null;
    } catch (err) {
      console.error("🔥 Instant offer push error:", err);
      return null;
    }
  });

/* =========================================================
   🔔 ADMIN TEST PUSH
========================================================= */
exports.sendAdminTestNotification = functions.firestore
  .document("notifications_test/{docId}")
  .onCreate(async (snap) => {
    try {
      const { merchantId } = snap.data();
      if (!merchantId) return null;

      const merchantSnap = await db
        .collection("merchants")
        .doc(merchantId)
        .get();

      if (!merchantSnap.exists) return null;

      const merchant = merchantSnap.data();
      if (!merchant.fcmToken) return null;

      const message = {
        token: merchant.fcmToken,
        notification: {
          title: "🔔 OshirO Test Notification",
          body: "Push notifications are working 🎉",
        },
        webpush: {
          notification: {
            title: "🔔 OshirO Test Notification",
            body: "Push notifications are working 🎉",
            icon: "/logo192.png",
            requireInteraction: true,
          },
        },
      };

      await messaging.send(message);
      console.log("✅ Admin test push sent");
      return null;
    } catch (err) {
      console.error("❌ Test push error:", err);
      return null;
    }
  });

/* =========================================================
   🧹 CLEANUP OLD GEO EVENTS
========================================================= */
exports.cleanupOldGeoEvents = functions.pubsub
  .schedule("every 24 hours")
  .onRun(async () => {
    const cutoff = admin.firestore.Timestamp.fromMillis(
      Date.now() - 24 * 60 * 60 * 1000
    );

    const snap = await db
      .collection("geo_events")
      .where("createdAt", "<", cutoff)
      .get();

    const batch = db.batch();
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();

    console.log("🧹 Old geo events cleaned");
    return null;
  });

/* =========================================================
   ⏰ AUTO-EXPIRE OFFERS
========================================================= */
exports.autoExpireOffers = functions.pubsub
  .schedule("every 10 minutes")
  .onRun(async () => {
    const now = admin.firestore.Timestamp.now();

    const snap = await db
      .collection("offers")
      .where("active", "==", true)
      .where("expiresAt", "<=", now)
      .get();

    if (snap.empty) return null;

    const batch = db.batch();
    snap.docs.forEach((d) =>
      batch.update(d.ref, {
        active: false,
        expiredAt:
          admin.firestore.FieldValue.serverTimestamp(),
      })
    );

    await batch.commit();

    console.log(`⏰ Auto-expired ${snap.size} offers`);
    return null;
  });
