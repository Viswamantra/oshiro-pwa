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
const GEOFENCE_KM = 1;          // 1 km radius
const COOLDOWN_MINUTES = 30;   // anti-spam
const MAX_PIN_ATTEMPTS = 5;

/* =========================================================
   🔐 SET 4-DIGIT PIN (CUSTOMER / MERCHANT)
   Called during signup or first-time setup
========================================================= */
exports.setUserPin = functions.https.onCall(async (data) => {
  try {
    const { mobile, pin, role } = data;

    if (!/^\d{10}$/.test(mobile)) {
      return { success: false, message: "Invalid mobile number" };
    }

    if (!/^\d{4}$/.test(pin)) {
      return { success: false, message: "PIN must be 4 digits" };
    }

    const pinHash = await bcrypt.hash(pin, 10);

    await db.collection("users").doc(mobile).set(
      {
        mobile,
        role: role || "customer", // customer | merchant
        pinHash,
        pinAttempts: 0,
        status: "active",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return { success: true };
  } catch (err) {
    console.error("setUserPin error:", err);
    return { success: false, message: "Failed to set PIN" };
  }
});

/* =========================================================
   🔐 PIN LOGIN VERIFICATION
   Used by AuthContext → loginWithPin()
========================================================= */
exports.verifyPinLogin = functions.https.onCall(async (data) => {
  try {
    const { mobile, pin } = data;

    if (!/^\d{10}$/.test(mobile) || !/^\d{4}$/.test(pin)) {
      return { success: false, message: "Invalid input" };
    }

    const userRef = db.collection("users").doc(mobile);
    const snap = await userRef.get();

    if (!snap.exists) {
      return { success: false, message: "User not registered" };
    }

    const user = snap.data();

    if (user.pinAttempts >= MAX_PIN_ATTEMPTS) {
      return {
        success: false,
        message: "Account locked. Try again later.",
      };
    }

    const isValid = await bcrypt.compare(pin, user.pinHash);

    if (!isValid) {
      await userRef.update({
        pinAttempts: admin.firestore.FieldValue.increment(1),
      });
      return { success: false, message: "Wrong PIN" };
    }

    // ✅ Reset attempts after success
    await userRef.update({ pinAttempts: 0 });

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

    /* =========================
       BASIC VALIDATION
    ========================= */
    if (!after?.lat || !after?.lng) return null;
    if (!after?.fcmToken) return null;
    if (after.pushEnabled === false) return null;

    // Ignore insignificant movement
    if (before?.lat === after.lat && before?.lng === after.lng) {
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

    const userCategories = Array.isArray(after.categories)
      ? after.categories
      : [];

    /* =========================
       LOAD MERCHANTS & OFFERS
    ========================= */
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

    /* =========================
       GROUP OFFERS BY MERCHANT
    ========================= */
    const offersByMerchant = {};

    offersSnap.forEach((doc) => {
      const o = doc.data();

      // Category preference filter
      if (
        userCategories.length > 0 &&
        !userCategories.includes(o.category)
      ) {
        return;
      }

      if (!offersByMerchant[o.merchantId]) {
        offersByMerchant[o.merchantId] = [];
      }
      offersByMerchant[o.merchantId].push(o);
    });

    let notifiedMerchantId = null;
    let notificationPayload = null;

    /* =========================
       GEOFENCE CHECK
    ========================= */
    for (const mDoc of merchantsSnap.docs) {
      const merchant = mDoc.data();
      const merchantId = mDoc.id;

      if (!merchant.lat || !merchant.lng) continue;
      if (!offersByMerchant[merchantId]) continue;

      // Avoid repeat notification
      if (after.lastNotifiedMerchantId === merchantId) continue;

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
        break; // 🔒 only ONE push
      }
    }

    if (!notificationPayload) return null;

    /* =========================
       SEND PUSH
    ========================= */
    await admin.messaging().send({
      token: after.fcmToken,
      notification: notificationPayload,
      android: { priority: "high" },
      data: {
        merchantId: notifiedMerchantId,
      },
    });

    /* =========================
       UPDATE COOLDOWN STATE
    ========================= */
    await db.doc(`users/${userId}`).update({
      lastPushAt: now,
      lastNotifiedMerchantId: notifiedMerchantId,
    });

    return null;
  });
