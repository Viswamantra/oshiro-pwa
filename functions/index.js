const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

exports.sendOfferPush = functions.firestore
  .document("offers/{offerId}")
  .onCreate(async (snap) => {
    const offer = snap.data();
    if (!offer?.lat || !offer?.lng) return;

    const customersSnap = await admin
      .firestore()
      .collection("customers")
      .get();

    const tokens = [];

    customersSnap.forEach((doc) => {
      const c = doc.data();
      if (!c.fcmToken || !c.lat || !c.lng) return;

      const dist = getDistanceKm(
        offer.lat,
        offer.lng,
        c.lat,
        c.lng
      );

      if (dist <= (offer.radiusKm || 3)) {
        tokens.push(c.fcmToken);
      }
    });

    if (!tokens.length) return;

    await admin.messaging().sendEachForMulticast({
      tokens,
      notification: {
        title: offer.title || "New Offer Nearby!",
        body: offer.description || "Open Oshiro to view",
      },
    });
  });
