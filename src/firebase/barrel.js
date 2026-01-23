/**
 * =========================================================
 * FIREBASE BARREL (SINGLE ENTRY POINT)
 * ---------------------------------------------------------
 * ✔ Rollup / Vite / Vercel safe
 * ✔ Explicit named exports only
 * ✔ Prevents import/export mismatches
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
export * from "./customer";

/* ======================
   CATEGORIES
====================== */
export * from "./categories";

/* ======================
   NOTIFICATIONS
====================== */
export * from "./notifications";
