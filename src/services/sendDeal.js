import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase";

export async function sendInstantDeal(customerId) {
try {
const fn = httpsCallable(functions, "sendInstantDeal");

```
const res = await fn({
  customerId,
  title: "Special Offer Just For You",
  body: "A nearby shop sent you a deal"
});

return res.data;
```

} catch (err) {
console.error("Send deal failed:", err);
return { success:false };
}
}
