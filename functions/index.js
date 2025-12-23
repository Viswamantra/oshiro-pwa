const functions = require("firebase-functions");
const admin = require("firebase-admin");
const bcrypt = require("bcryptjs");

admin.initializeApp();
const db = admin.firestore();

/* =========================================================
   DISTANCE (HAVERSINE)
========================================================= */
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

/* =========================================================
   CONFIG
========================================================= */
const GEOFENCE_KM = 1;
const COOLDOWN_MINUTES = 30;
const MAX_PIN_ATTEMPTS = 5;

/* =========================================================
   🔍 CHECK USER EXISTS
========================================================= */
exports.checkUserExists = functions.https.onCall(async ({ mobile }) => {
  if (!/^\d{10}$/.test(mobile)) {
    return { exists: false };
  }

  const snap = await db.collection("users").doc(mobile).get();
  return { exists: snap.exists };
});

/* =========================================================
   🔐 SET / RESET 4-DIGIT PIN
   (Customer OR Merchant)
========================================================= */
exports.setUserPin = functions.https.onCall(async ({ mobile, pin, role }) => {
  try {
    if (!/^\d{10}$/.test(mobile)) {
      return { success: false, message: "Invalid mobile number" };
    }

    if (!/^\d{4}$/.test(pin)) {
      return { success: false, message: "PIN must be 4 digits" };
    }

    const ref = db.collection("users").doc(mobile);
    const snap = await ref.get();

    const pinHash = await bcrypt.hash(pin, 10);

    // Preserve existing role (merchant stays merchant)
    const finalRole = snap.exists
      ? snap.data().role || "customer"
      : role || "customer";

    await ref.set(
      {
        mobile,
        role: finalRole,
        pinHash,
        pinAttempts: 0,
        status: "active",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: snap.exists
          ? snap.data().createdAt
          : admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return { success: true, role: finalRole };
  } catch (err) {
    console.error("setUserPin error:", err);
    return { success: false, message: "Failed to set PIN" };
  }
});

/* =========================================================
   🔐 PIN LOGIN (CUSTOMER + MERCHANT)
========================================================= */
exports.verifyPinLogin = functions.https.onCall(async ({ mobile, pin }) => {
  try {
    if (!/^\d{10}$/.test(mobile) || !/^\d{4}$/.test(pin)) {
      return { success: false, message: "Invalid input" };
    }

    const ref = db.collection("users").doc(mobile);
    const snap = await ref.get();

    if (!snap.exists) {
      return { success: false, message: "User not registered" };
    }

    const user = snap.data();

    if (user.pinAttempts >= MAX_PIN_ATTEMPTS) {
      return {
        success: false,
        message: "Account locked. Try again later",
      };
    }

    const isValid = await bcrypt.compare(pin, user.pinHash);

    if (!isValid) {
      await ref.update({
        pinAttempts: admin.firestore.FieldValue.increment(1),
      });
      return { success: false, message: "Wrong PIN" };
    }

    // Reset attempts
    await ref.update({ pinAttempts: 0 });

    return {
      success: true,
      role: user.role || "customer",
    };
  } catch (err) {
    console.error("verifyPinLogin error:", err);
    return { success: false, message: "Server error" };
  }
});

/* =========================================================
   📍 GEOFENCE + PUSH NOTIFICATIONS
========================================================= */
exports.notifyOnGeofenceEnter = functions.firestore
  .document("users/{userId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const userId = context.params.userId;

    if (!after?.lat || !after?.lng) return null;
    if (!after?.fcmToken) return null;
    if (after.pushEnabled === false) return null;

    if (before?.lat === after.lat && before?.lng === after.lng) {
      return null;
    }

    const now = Date.now();

    if (
      after.lastPushAt &&
      now - after.lastPushAt < COOLDOWN_MINUTES * 60 * 1000
    ) {
      return null;
    }

    const userCategories = Array.isArray(after.categories)
      ? after.categories
      : [];

    const merchantsSnap = await db
      .collection("merchants")
      .where("status", "==", "approved")
      .get();

    if (merchantsSnap.empty) return null;

    const offersSnap = await db
      .collection("offers")
      .where("active", "==", true)
      .get();

    if (offersSnap.empty) return null;

    const offersByMerchant = {};

    offersSnap.forEach((doc) => {
      const o = doc.data();
      if (
        userCategories.length > 0 &&
        !userCategories.includes(o.category)
      )
        return;

      if (!offersByMerchant[o.merchantId]) {
        offersByMerchant[o.merchantId] = [];
      }
      offersByMerchant[o.merchantId].push(o);
    });

    let notifiedMerchantId = null;
    let payload = null;

    for (const mDoc of merchantsSnap.docs) {
      const m = mDoc.data();
      const merchantId = mDoc.id;

      if (!m.lat || !m.lng) continue;
      if (!offersByMerchant[merchantId]) continue;
      if (after.lastNotifiedMerchantId === merchantId) continue;

      const dist = distanceKm(after.lat, after.lng, m.lat, m.lng);

      if (dist <= GEOFENCE_KM) {
        payload = {
          title: `Offers near ${m.shopName}`,
          body:
            offersByMerchant[merchantId]
              .map((o) => o.title)
              .slice(0, 2)
              .join(", ") || "New offer available",
        };
        notifiedMerchantId = merchantId;
        break;
      }
    }

    if (!payload) return null;

    await admin.messaging().send({
      token: after.fcmToken,
      notification: payload,
      android: { priority: "high" },
      data: { merchantId: notifiedMerchantId },
    });

    await db.doc(`users/${userId}`).update({
      lastPushAt: now,
      lastNotifiedMerchantId: notifiedMerchantId,
    });

    return null;
  });
