/**
 * Firebase Cloud Functions (v2)
 * OshirO App
 */

const admin = require("firebase-admin");
const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { onCall } = require("firebase-functions/v2/https");

admin.initializeApp();
const db = admin.firestore();

/* =========================================================
   CONFIG
========================================================= */
// 🔴 TEMP FOR TESTING — change back to 0.3 later
const GEOFENCE_KM = 5; // 5 KM TEMP
const COOLDOWN_MINUTES = 30;

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
   CUSTOMER → MERCHANT GEOFENCE WATCHER (V2)
========================================================= */
exports.customerGeofenceWatcher = onDocumentWritten(
  {
    document: "customers/{mobile}",
    region: "asia-south1",
  },
  async (event) => {
    if (!event.data || !event.data.after.exists) {
      console.log("No customer data");
      return;
    }

    const customer = event.data.after.data();
    const customerMobile = event.params.mobile;

    if (!customer.lat || !customer.lng) {
      console.log("Customer location missing", customerMobile);
      return;
    }

    console.log(
      "Customer update:",
      customerMobile,
      customer.lat,
      customer.lng
    );

    const merchantsSnap = await db
      .collection("merchants")
      .where("status", "==", "approved")
      .get();

    console.log("Approved merchants found:", merchantsSnap.size);

    for (const doc of merchantsSnap.docs) {
      const merchant = doc.data();

      if (!merchant.lat || !merchant.lng) {
        console.log("Merchant location missing", merchant.mobile);
        continue;
      }

      if (!merchant.fcmToken) {
        console.log("Merchant FCM token missing", merchant.mobile);
        continue;
      }

      const dist = distanceKm(
        customer.lat,
        customer.lng,
        merchant.lat,
        merchant.lng
      );

      console.log(
        "Distance check → merchant:",
        merchant.mobile,
        "distance:",
        dist
      );

      if (dist > GEOFENCE_KM) continue;

      const leadId = `${merchant.mobile}_${customerMobile}`;
      const leadRef = db.collection("merchant_leads").doc(leadId);
      const leadSnap = await leadRef.get();

      if (leadSnap.exists) {
        const lastAt = leadSnap.data().lastNotifiedAt?.toDate();
        if (lastAt) {
          const minsAgo = (Date.now() - lastAt.getTime()) / 60000;
          if (minsAgo < COOLDOWN_MINUTES) {
            console.log("Cooldown active for", leadId);
            continue;
          }
        }
      }

      console.log("Sending notification to", merchant.mobile);

      await admin.messaging().send({
        token: merchant.fcmToken,
        notification: {
          title: "🚶 Customer Nearby",
          body: "A customer is near your shop",
        },
      });

      await leadRef.set({
        merchantMobile: merchant.mobile,
        customerMobile,
        distanceKm: dist,
        lastNotifiedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      await db.collection("geo_events").add({
        merchantMobile: merchant.mobile,
        customerMobile,
        distanceKm: dist,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  }
);

/* =========================================================
   🔐 ROLE SETTER (ADMIN ONLY) — THIS IS THE KEY
========================================================= */
exports.setUserRole = onCall(
  { region: "asia-south1" },
  async (request) => {
    const { auth, data } = request;

    // 🔒 Only admin can assign roles
    if (!auth || auth.token.role !== "admin") {
      throw new Error("Permission denied: Admins only");
    }

    const { uid, role } = data;

    if (!uid || !role) {
      throw new Error("uid and role are required");
    }

    if (!["admin", "merchant", "customer"].includes(role)) {
      throw new Error("Invalid role");
    }

    await admin.auth().setCustomUserClaims(uid, { role });

    return {
      success: true,
      uid,
      role,
    };
  }
);
