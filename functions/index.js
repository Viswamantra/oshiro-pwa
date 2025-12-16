exports.sendGeoNotification = functions.firestore
  .document("offers/{id}")
  .onCreate(async (snap) => {
    const offer = snap.data();

    const tokensSnap = await admin.firestore().collection("fcmTokens").get();
    const tokens = tokensSnap.docs.map(d => d.data().token);

    await admin.messaging().sendMulticast({
      tokens,
      notification: {
        title: "🔥 New Offer Nearby",
        body: `${offer.shopName} — ${offer.discount}% off`
      }
    });
  });
