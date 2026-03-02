const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const admin = require("./firebaseAdmin");

const db = admin.firestore();
const messaging = admin.messaging();

/*
Trigger: when customer location updates
*/
exports.geoCustomerTrigger = onDocumentUpdated(
"customers/{customerId}",
async (event) => {

```
if (!event.data) return;

const before = event.data.before.data() || {};
const after = event.data.after.data() || {};
const customerId = event.params.customerId;

/* Run only if location changed */
if (before.lat === after.lat && before.lng === after.lng) return;

if (!after.lat || !after.lng) return;

const radiusKm = after.selectedDistanceKm || 0.5;

/* Cooldown protection (2 min) */
const lastAlert = after.lastGeoAlertAt?.toMillis?.() || 0;
if (Date.now() - lastAlert < 120000) return;

/* Get approved merchants */
const merchantsSnap = await db
  .collection("merchants")
  .where("approved", "==", true)
  .get();

if (merchantsSnap.empty) return;

const notifyPromises = [];

merchantsSnap.forEach(doc => {
  const m = doc.data();
  if (!m || !m.lat || !m.lng || !m.fcmTokens?.length) return;

  const distance = getDistance(after.lat, after.lng, m.lat, m.lng);

  if (distance <= radiusKm) {

    const message = {
      tokens: m.fcmTokens,
      notification: {
        title: "Customer nearby",
        body: "A customer entered your area"
      },
      data: {
        type: "NEARBY_CUSTOMER",
        customerId: String(customerId),
        distance: String(Math.round(distance * 1000))
      }
    };

    notifyPromises.push(
      messaging.sendEachForMulticast(message)
        .catch(err => console.error("Push failed:", err.message))
    );
  }
});

if (!notifyPromises.length) return;

await Promise.all(notifyPromises);

/* mark cooldown */
await event.data.after.ref.update({
  lastGeoAlertAt: admin.firestore.FieldValue.serverTimestamp()
});
```

}
);

/* Distance calculator (Haversine) */
function getDistance(lat1, lon1, lat2, lon2) {

const R = 6371;
const dLat = (lat2 - lat1) * Math.PI / 180;
const dLon = (lon2 - lon1) * Math.PI / 180;

const a =
Math.sin(dLat / 2) * Math.sin(dLat / 2) +
Math.cos(lat1 * Math.PI / 180) *
Math.cos(lat2 * Math.PI / 180) *
Math.sin(dLon / 2) * Math.sin(dLon / 2);

return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}
