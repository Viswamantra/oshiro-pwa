import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

/* 🚫 Service Worker DISABLED during debugging */
// if ("serviceWorker" in navigator) {
//   window.addEventListener("load", () => {
//     navigator.serviceWorker
//       .register("/firebase-messaging-sw.js")
//       .then(() => console.log("✅ Firebase SW registered"))
//       .catch((err) => console.error("❌ Firebase SW error", err));
//   });
// }

createRoot(document.getElementById("root")).render(
  <App />
);
