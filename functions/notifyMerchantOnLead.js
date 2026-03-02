const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("./firebaseAdmin");

const db = admin.firestore();
const messaging = admin.messaging();

exports.notifyMerchantOnLead = onDocumentCreated(
"merchant_leads/{leadId}",
async (event) => {

```
const snap = event.data;
if (!snap) return;

const lead = snap.data();
if (!lead || !lead.merchantId) return;

const merchantRef = db.collection("merchants").doc(lead.merchantId);
const merchantSnap = await merchantRef.get();
if (!merchantSnap.exists) return;

const tokens = merchantSnap.data().fcmTokens || [];
if (!tokens.length) return;

await messaging.sendEachForMulticast({
  tokens,
  notification: {
    title: "Customer nearby",
    body: "A customer entered your area"
  },
  data: { leadId: event.params.leadId }
});

await snap.ref.update({ notified: true });
```

}
);
