if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    // navigator.serviceWorker
      .register("/firebase-messaging-sw.js");
      .then(() => console.log("✅ Firebase SW registered"))
      .catch((err) => console.error("❌ Firebase SW error", err));
  });
}
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
