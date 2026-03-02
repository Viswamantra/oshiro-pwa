const admin = require("firebase-admin");

if (!admin.apps.length) {
admin.initializeApp();
console.log("[OSHIRO] Firebase Admin initialized");
}

module.exports = admin;
