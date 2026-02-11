/**
 * =========================================================
 * OSHIRO SMART PUSH ROUTER — FINAL ENTERPRISE VERSION
 * ---------------------------------------------------------
 * ✔ Admin → Merchant Push
 * ✔ Admin → Customer Push
 * ✔ Admin → Broadcast Push
 * ✔ Batch Push Support
 * ✔ Multi-device Merchant Support
 * ✔ Master Cloud Function Based (sendPushNotification)
 * ✔ Production error handling
 * ✔ Logging structured
 * ✔ Future Geo + Topic Ready
 * =========================================================
 */

import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase/functions";

import { db } from "../firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";

/* =========================================================
   MASTER PUSH CALLER
========================================================= */

async function callPushFunction(payload) {

  try {

    const callable = httpsCallable(
      functions,
      "sendPushNotification"
    );

    const res = await callable(payload);

    console.log("[PUSH] ✅ Cloud push success:", res.data);

    return res.data;

  } catch (err) {

    console.error("[PUSH] ❌ Cloud push failed:", err);
    throw err;

  }
}

/* =========================================================
   TOKEN HELPERS
========================================================= */

async function getMerchantTokens(merchantId) {

  const snap = await getDoc(doc(db, "merchants", merchantId));

  if (!snap.exists()) return [];

  const data = snap.data();

  return data.fcmTokens || data.fcmToken
    ? data.fcmTokens || [data.fcmToken]
    : [];
}

async function getCustomerToken(customerId) {

  const snap = await getDoc(doc(db, "customers", customerId));

  if (!snap.exists()) return null;

  return snap.data()?.fcmToken || null;
}

/* =========================================================
   PUSH → MERCHANT
========================================================= */

export async function sendPushToMerchant({
  merchantId,
  title,
  body,
  data = {},
}) {

  try {

    if (!merchantId) throw new Error("Missing merchantId");

    const tokens = await getMerchantTokens(merchantId);

    if (!tokens.length) {
      console.warn("[PUSH] No merchant tokens found");
      return;
    }

    return callPushFunction({
      tokens,
      title,
      body,
      dataPayload: data,
    });

  } catch (err) {

    console.error("[PUSH] Merchant push failed:", err);
    throw err;

  }
}

/* =========================================================
   PUSH → CUSTOMER
========================================================= */

export async function sendPushToCustomer({
  customerId,
  title,
  body,
  data = {},
}) {

  try {

    if (!customerId) throw new Error("Missing customerId");

    const token = await getCustomerToken(customerId);

    if (!token) {
      console.warn("[PUSH] No customer token found");
      return;
    }

    return callPushFunction({
      tokens: [token],
      title,
      body,
      dataPayload: data,
    });

  } catch (err) {

    console.error("[PUSH] Customer push failed:", err);
    throw err;

  }
}

/* =========================================================
   BROADCAST PUSH
========================================================= */

export async function sendBroadcastPush({
  title,
  body,
  target = "all", // merchant | customer | all
  data = {},
}) {

  try {

    let tokens = [];

    if (target === "merchant" || target === "all") {

      const snap = await getDocs(collection(db, "merchants"));

      snap.forEach((d) => {
        const data = d.data();
        if (data.fcmTokens) tokens.push(...data.fcmTokens);
        else if (data.fcmToken) tokens.push(data.fcmToken);
      });
    }

    if (target === "customer" || target === "all") {

      const snap = await getDocs(collection(db, "customers"));

      snap.forEach((d) => {
        if (d.data()?.fcmToken) tokens.push(d.data().fcmToken);
      });
    }

    if (!tokens.length) {
      console.warn("[PUSH] Broadcast → No tokens found");
      return;
    }

    return callPushFunction({
      tokens,
      title,
      body,
      dataPayload: data,
    });

  } catch (err) {

    console.error("[PUSH] Broadcast push failed:", err);
    throw err;

  }
}

/* =========================================================
   BATCH PUSH (FOR OFFERS / GEO / AI)
========================================================= */

export async function sendBatchPush({
  tokens = [],
  title,
  body,
  data = {},
}) {

  try {

    if (!tokens.length) return;

    return callPushFunction({
      tokens,
      title,
      body,
      dataPayload: data,
    });

  } catch (err) {

    console.error("[PUSH] Batch push failed:", err);
    throw err;

  }
}
