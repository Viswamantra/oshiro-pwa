/*
OSHIRO FIREBASE FUNCTIONS ENTRY
Firebase v2 requires direct static exports
*/

console.log("[OSHIRO] Initializing functions");

/* Direct imports */
const notifyMerchantOnLead = require("./notifyMerchantOnLead").notifyMerchantOnLead;
const geoCustomerTrigger = require("./geoCustomerTrigger").geoCustomerTrigger;
const sendInstantDeal = require("./sendInstantDeal").sendInstantDeal;

/* Direct exports */
exports.notifyMerchantOnLead = notifyMerchantOnLead;
exports.geoCustomerTrigger = geoCustomerTrigger;
exports.sendInstantDeal = sendInstantDeal;

console.log("[OSHIRO] Functions loaded successfully");
