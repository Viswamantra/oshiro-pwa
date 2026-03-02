const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("./firebaseAdmin");

const db = admin.firestore();

/* =========================================================
   SEND INSTANT DEAL (MERCHANT → CUSTOMER)
   PRODUCTION FINAL VERSION
========================================================= */
exports.sendInstantDeal = onCall(async (request) => {
  try {
    /* ================= AUTH CHECK ================= */
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "User must be logged in");
    }

    const callerUid = request.auth.uid;
    const { merchantId, customerPhone, title, body } = request.data || {};

    if (!merchantId)
      throw new HttpsError("invalid-argument", "merchantId missing");

    if (!customerPhone)
      throw new HttpsError("invalid-argument", "customerPhone missing");

    if (callerUid !== merchantId) {
      throw new HttpsError(
        "permission-denied",
        "Not authorized as this merchant"
      );
    }

    /* ================= NORMALIZE PHONE ================= */
    let normalizedPhone = customerPhone.trim();

    // Remove spaces
    normalizedPhone = normalizedPhone.replace(/\s+/g, "");

    // If only 10 digits → assume India
    if (!normalizedPhone.startsWith("+")) {
      if (/^\d{10}$/.test(normalizedPhone)) {
        normalizedPhone = "+91" + normalizedPhone;
      }
    }

    console.log("📞 Normalized phone:", normalizedPhone);

    /* ================= VERIFY MERCHANT ================= */
    const merchantSnap = await db
      .collection("merchants")
      .doc(merchantId)
      .get();

    if (!merchantSnap.exists) {
      throw new HttpsError("permission-denied", "Merchant not found");
    }

    /* ================= FIND CUSTOMER ================= */
    const customerQuery = await db
      .collection("customers")
      .where("mobile", "==", normalizedPhone)
      .limit(1)
      .get();

    if (customerQuery.empty) {
      throw new HttpsError("not-found", "Customer not found");
    }

    const customerDoc = customerQuery.docs[0];
    const customerId = customerDoc.id;

    console.log("👤 Customer found:", customerId);

    /* ================= GET FCM TOKENS ================= */
    const tokenDoc = await db
      .collection("fcmTokens")
      .doc(customerId)
      .get();

    if (!tokenDoc.exists) {
      return { success: false, reason: "NO_DEVICE" };
    }

    const tokens = tokenDoc.data()?.tokens || [];

    if (!tokens.length) {
      return { success: false, reason: "NO_DEVICE" };
    }

    console.log("📤 Sending to devices:", tokens.length);

    /* ================= BUILD UNIVERSAL MESSAGE ================= */
    const message = {
      tokens,

      data: {
        type: "INSTANT_DEAL",
        merchantId: String(merchantId),
        customerId: String(customerId),
        ts: Date.now().toString(),
      },

      notification: {
        title: title || "Special Offer 🎉",
        body: body || "You are near the shop — visit now!",
      },

      android: {
        priority: "high",
        ttl: 60 * 1000,
        collapseKey: "instant_deal",
        notification: {
          channelId: "oshiro_default",
          sound: "default",
        },
      },

      webpush: {
        headers: {
          Urgency: "high",
          TTL: "60",
        },
        notification: {
          title: title || "Special Offer 🎉",
          body: body || "You are near the shop — visit now!",
          icon: "/icons/icon-192.png",
          badge: "/icons/badge.png",
          requireInteraction: true,
        },
        fcmOptions: {
          link: "https://oshiro-app.web.app/customer",
        },
      },
    };

    /* ================= SEND MULTICAST ================= */
    const response =
      await admin.messaging().sendEachForMulticast(message);

    /* ================= CLEAN INVALID TOKENS ================= */
    const invalidTokens = [];

    response.responses.forEach((resp, index) => {
      if (!resp.success) {
        const code = resp.error?.code;

        if (
          code === "messaging/registration-token-not-registered" ||
          code === "messaging/invalid-registration-token"
        ) {
          invalidTokens.push(tokens[index]);
        }
      }
    });

    if (invalidTokens.length > 0) {
      const validTokens = tokens.filter(
        (t) => !invalidTokens.includes(t)
      );

      await db.collection("fcmTokens").doc(customerId).update({
        tokens: validTokens,
        updatedAt:
          admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(
        "🧹 Removed invalid tokens:",
        invalidTokens.length
      );
    }

    /* ================= UPDATE CUSTOMER META ================= */
    await db.collection("customers").doc(customerId).update({
      lastInstantDealAt:
        admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(
      "✅ Instant deal delivered:",
      response.successCount
    );

    return {
      success: true,
      delivered: response.successCount,
      failed: response.failureCount,
    };
  } catch (error) {
    console.error("❌ sendInstantDeal error:", error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError("internal", "Unexpected error occurred");
  }
});