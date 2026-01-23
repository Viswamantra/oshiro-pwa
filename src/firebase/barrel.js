/**
 * =========================================================
 * FIREBASE BARREL EXPORT
 * ---------------------------------------------------------
 * ✔ Single import surface for entire app
 * ✔ Prevents path mistakes
 * ✔ Rollup / Vite / Vercel safe
 * ✔ Explicit named exports (no magic)
 * =========================================================
 */

/* ======================
   CORE FIREBASE
====================== */
export { app, db, auth, getFirebaseMessaging } from "./index";

/* ======================
   MERCHANT APIs
====================== */
export {
  getMerchantByMobile,
  registerMerchant,
  fetchNearbyMerchants,
} from "./merchants";

/* ======================
   CUSTOMER APIs
====================== */
export * from "./customer";

/* ======================
   CATEGORY APIs
====================== */
export * from "./categories";

/* ======================
   NOTIFICATIONS (OPTIONAL)
====================== */
export * from "./notifications";
