/**
 * =========================================================
 * OSHIRO FIREBASE BARREL
 * CLEAN & STABLE EXPORTS
 * =========================================================
 */

/* ================= CORE ================= */
export * from "./index.js";
export * from "./functions.js";

/* ================= MESSAGING ================= */
export {
  initMessaging,
  updateFCMToken,
} from "./messaging.js";

/* ================= CATEGORY ================= */
export {
  fetchActiveCategories,
} from "./categories.js";

/* ================= CUSTOMER ================= */
export * from "./customer.js";

/* ================= MERCHANT ================= */
export {
  registerMerchant,
  getMerchantByUid,
  getMerchantByMobile,
  fetchNearbyMerchants,
} from "./merchants.js";

/* ================= LEADS ================= */
export * from "./leads.js";

/* ================= OFFERS ================= */
export {
  createOffer,
  fetchMerchantOffers,
  fetchOffersByMerchantIds,
  updateOffer,
  deleteOffer,
  autoExpireOffers,
} from "./offers.js";