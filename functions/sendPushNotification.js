/**
=========================================================
OSHIRO GLOBAL PUSH ENGINE — FINAL UNIVERSAL VERSION
Now Fully Supports:
✔ Chrome PWA (WebPush protocol)
✔ Android
✔ Silent data refresh
✔ Multicast + fallback
✔ Invalid token cleanup
✔ Retry on transient failure
=========================================================
*/

const admin = require("firebase-admin");

/* =========================================================
RETRY HELPER
========================================================= */
async function retrySend(fn, retries = 2) {
  try {
    return await fn();
  } catch (err) {
    if (retries <= 0) throw err;
    console.log("[PUSH] Retry send...");
    await new Promise(r => setTimeout(r, 700));
    return retrySend(fn, retries - 1);
  }
}

/* =========================================================
BUILD MESSAGE (REAL UNIVERSAL FORMAT)
========================================================= */
function buildMessage(tokens, { title, body, data = {}, collapseKey }) {

  const safeData = Object.fromEntries(
    Object.entries(data).map(([k, v]) => [k, String(v)])
  );

  const visible = title && body;

  return {
    tokens,

    /* -------- DATA (always allowed) -------- */
    data: {
      ...safeData,
      ts: Date.now().toString()
    },

    /* -------- ANDROID -------- */
    android: {
      priority: "high",
      ttl: 60 * 1000,
      collapseKey: collapseKey || "oshiro",
      notification: visible ? {
        title,
        body,
        channelId: "oshiro_default",
        sound: "default",
        defaultVibrateTimings: true
      } : undefined
    },

    /* -------- WEB PUSH (THE CRITICAL FIX) -------- */
    webpush: {
      headers: {
        Urgency: "high",
        TTL: "60"
      },

      notification: visible ? {
        title: title,
        body: body,
        icon: "/icons/icon-192.png",
        badge: "/icons/badge.png",
        requireInteraction: true
      } : undefined,

      fcmOptions: {
        link: "https://oshiro-app.web.app/customer"
      }
    }
  };
}

/* =========================================================
MAIN SEND FUNCTION
========================================================= */
async function sendPushNotification({
  tokens = [],
  title = null,
  body = null,
  data = {},
  collapseKey = "oshiro"
}) {

  if (!tokens.length) {
    console.log("[PUSH] No tokens");
    return { success:0, failed:0, invalid:[] };
  }

  console.log(`[PUSH] Attempt → ${tokens.length} devices`);

  const message = buildMessage(tokens, { title, body, data, collapseKey });

  let response;

  /* ---------- MULTICAST ---------- */
  try {
    response = await retrySend(() =>
      admin.messaging().sendEachForMulticast(message)
    );
  } catch (err) {

    console.error("[PUSH] Multicast failed → fallback single");

    const results = await Promise.allSettled(
      tokens.map(token =>
        retrySend(() =>
          admin.messaging().send({
            ...message,
            token
          })
        )
      )
    );

    let success = 0;
    let failed = 0;
    const invalid = [];

    results.forEach((r, i) => {
      if (r.status === "fulfilled") success++;
      else {
        failed++;
        const code = r.reason?.errorInfo?.code;
        if (
          code === "messaging/registration-token-not-registered" ||
          code === "messaging/invalid-registration-token"
        ) {
          invalid.push(tokens[i]);
        }
      }
    });

    return { success, failed, invalid };
  }

  /* ---------- RESPONSE ANALYSIS ---------- */
  let invalidTokens = [];
  let transientFailures = 0;

  response.responses.forEach((resp, idx) => {
    if (!resp.success) {
      const code = resp.error?.code;

      if (
        code === "messaging/registration-token-not-registered" ||
        code === "messaging/invalid-registration-token"
      ) {
        invalidTokens.push(tokens[idx]);
      } else {
        transientFailures++;
      }
    }
  });

  console.log(
    `[PUSH] Success:${response.successCount} Failed:${response.failureCount} Invalid:${invalidTokens.length}`
  );

  return {
    success: response.successCount,
    failed: response.failureCount,
    invalid: invalidTokens,
    transientFailures
  };
}

module.exports = sendPushNotification;
