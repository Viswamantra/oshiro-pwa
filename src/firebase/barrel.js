/**
 * 🔒 LOCKED AFTER PHASE 2.6
 * Central Firebase exports
 * Only ADD new exports – do NOT rename or remove
 */

/**
 * =========================================================
 * FIREBASE BARREL (SINGLE ENTRY POINT)
 * ---------------------------------------------------------
 * ✔ Rollup / Vite / Vercel safe
 * ✔ Explicit named exports only
 * ✔ Prevents import/export mismatches
 * ✔ Synced with unified Leads system (2.7.x)
 * =========================================================
 */

/* ======================
   CORE FIREBASE
====================== */
export { db, auth } from "./index";

/* ======================
   MERCHANT API (CRITICAL)
====================== */
export {
  getMerchantByMobile,
  registerMerchant,
  fetchNearbyMerchants,
} from "./merchants";

/* ======================
   CUSTOMER API
====================== */
// Includes:
// - fetchCategories
// - logCustomerVisit
// - upsertCustomer
export * from "./customer";

/* ======================
   CATEGORIES
====================== */
export * from "./categories";

/* ======================
   OFFERS
====================== */
export * from "./offers";

/* ======================
   LEADS (NEW UNIFIED SYSTEM)
====================== */
// Exports:
// - createLead
// - fetchLeadsByMerchant
// - LEAD_TYPES
export * from "./leads";

/* ======================
   NOTIFICATIONS
====================== */
// Exports:
// - enablePushNotifications
// - saveMerchantFcmToken
// - listenToForegroundMessages

