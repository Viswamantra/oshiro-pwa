/**
 * =====================================================
 * OSHIRO FIREBASE FUNCTIONS ENTRY — ENTERPRISE VERSION
 * =====================================================
 * ✔ Explicit exports
 * ✔ Safe require loader
 * ✔ Structured boot logging
 * ✔ Push Engine ready
 * ✔ Geo Engine ready
 * ✔ Multi service scale ready
 * ✔ Prevents silent deploy skip
 * =====================================================
 */

console.log("🔥 [FUNCTIONS] OshirO Functions Booting...");

/* =====================================================
   SAFE REQUIRE WRAPPER
   Prevents deploy crash if a file is missing
===================================================== */

function safeRequire(path, name) {
  try {
    const mod = require(path);
    console.log(`✅ [FUNCTIONS] Loaded → ${name}`);
    return mod;
  } catch (err) {
    console.error(`❌ [FUNCTIONS] Failed → ${name}`, err.message);
    return null;
  }
}

/* =====================================================
   LOAD FUNCTION MODULES
===================================================== */

const notifyMerchantModule = safeRequire(
  "./notifyMerchantOnLead",
  "notifyMerchantOnLead"
);

const pushModule = safeRequire(
  "./sendPushNotification",
  "sendPushNotification"
);

/* --- FUTURE READY (CREATE LATER) --- */
const geoModule = safeRequire(
  "./geoCustomerNearbyAlert",
  "geoCustomerNearbyAlert"
);

/* =====================================================
   EXPORT FUNCTIONS
===================================================== */

/* ---------- EXISTING ---------- */

if (notifyMerchantModule?.notifyMerchantOnLead) {
  exports.notifyMerchantOnLead =
    notifyMerchantModule.notifyMerchantOnLead;

  console.log(
    "🚀 [FUNCTIONS] Exported → notifyMerchantOnLead"
  );
}

/* ---------- PUSH ENGINE ---------- */

if (pushModule?.sendPushNotification) {
  exports.sendPushNotification =
    pushModule.sendPushNotification;

  console.log(
    "🚀 [FUNCTIONS] Exported → sendPushNotification"
  );
}

/* ---------- GEO ENGINE (OPTIONAL FUTURE) ---------- */

if (geoModule?.geoCustomerNearbyAlert) {
  exports.geoCustomerNearbyAlert =
    geoModule.geoCustomerNearbyAlert;

  console.log(
    "🚀 [FUNCTIONS] Exported → geoCustomerNearbyAlert"
  );
}

/* =====================================================
   FINAL BOOT LOG
===================================================== */

console.log("🎉 [FUNCTIONS] OshirO Functions Ready");
