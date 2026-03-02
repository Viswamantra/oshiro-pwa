/**

* =========================================================
* OSHIRO SMART PUSH ROUTER — UID TOKEN ARCHITECTURE
* =========================================================
  */

import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase/functions";

import { db } from "../firebase";
import {
doc,
getDoc,
collection,
getDocs,
query,
where
} from "firebase/firestore";

/* ========================================================= */

const MAX_BATCH_SIZE = 400;

/* ========================================================= */

function normalizeDataPayload(data = {}) {
const out = {};
Object.keys(data || {}).forEach((k) => {
out[k] = data[k] === undefined || data[k] === null
? ""
: String(data[k]);
});
return out;
}

function dedupeTokens(tokens = []) {
return [...new Set(tokens.filter(Boolean))];
}

function chunkArray(arr, size) {
const chunks = [];
for (let i = 0; i < arr.length; i += size) {
chunks.push(arr.slice(i, i + size));
}
return chunks;
}

/* =========================================================
CLOUD CALL
========================================================= */

async function callPushFunction(payload) {
const callable = httpsCallable(functions, "sendPushNotification");

const res = await callable({
...payload,
dataPayload: normalizeDataPayload(payload.dataPayload),
});

console.log("[PUSH] Cloud success:", res.data);
return res.data;
}

/* =========================================================
TOKEN FETCH FROM fcmTokens COLLECTION
========================================================= */

async function getUserTokens(uid) {
try {
const snap = await getDoc(doc(db, "fcmTokens", uid));
if (!snap.exists()) return [];
return dedupeTokens(snap.data().tokens || []);
} catch (err) {
console.error("[PUSH] getUserTokens error:", err);
return [];
}
}

/* =========================================================
SAFE BATCH SENDER
========================================================= */

async function sendTokenBatches({ tokens, title, body, dataPayload }) {

const uniqueTokens = dedupeTokens(tokens);
if (!uniqueTokens.length) {
console.warn("[PUSH] No tokens to send");
return;
}

const chunks = chunkArray(uniqueTokens, MAX_BATCH_SIZE);

console.log(`[PUSH] ${uniqueTokens.length} tokens → ${chunks.length} batches`);

return Promise.all(
chunks.map(chunk =>
callPushFunction({
tokens: chunk,
title,
body,
dataPayload
})
)
);
}

/* =========================================================
PUSH → MERCHANT (UID)
========================================================= */

export async function sendPushToMerchant({
merchantId,
title,
body,
data = {},
}) {

const tokens = await getUserTokens(merchantId);
if (!tokens.length) return;

return sendTokenBatches({
tokens,
title,
body,
dataPayload: data
});
}

/* =========================================================
PUSH → CUSTOMER (UID)
========================================================= */

export async function sendPushToCustomer({
customerId,
title,
body,
data = {},
}) {

const tokens = await getUserTokens(customerId);
if (!tokens.length) return;

return sendTokenBatches({
tokens,
title,
body,
dataPayload: data
});
}

/* =========================================================
BROADCAST PUSH
========================================================= */

export async function sendBroadcastPush({
title,
body,
target = "all",
data = {},
}) {

try {

```
let tokens = [];

let qRef = collection(db, "fcmTokens");

if (target !== "all") {
  qRef = query(qRef, where("role", "==", target));
}

const snap = await getDocs(qRef);

snap.forEach(d => {
  tokens.push(...(d.data().tokens || []));
});

return sendTokenBatches({
  tokens,
  title,
  body,
  dataPayload: data
});
```

} catch (err) {
console.error("[PUSH] Broadcast failed:", err);
}
}

/* =========================================================
DIRECT TOKEN BATCH
========================================================= */

export async function sendBatchPush({
tokens = [],
title,
body,
data = {},
}) {

return sendTokenBatches({
tokens,
title,
body,
dataPayload: data
});
}
