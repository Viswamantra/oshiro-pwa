import { useEffect, useState } from "react";
import { requestFirebaseToken, onMessageListener } from "./firebase";
export default function App() {
  return <h1>Oshiro PWA Running</h1>;
}
<button
  onClick={async () => {
    const token = await requestFirebaseToken();
    alert("Your token:\n" + token);
  }}
>
  Enable Notifications
</button>
