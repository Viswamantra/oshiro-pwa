// src/main.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./pages/App.jsx";

// Register Firebase Messaging Service Worker (Vite-friendly)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/firebase-messaging-sw.js", {
        scope: "/",
        type: "classic"
      })
      .then((reg) => {
        console.log("Firebase SW registered:", reg.scope);
      })
      .catch((err) => {
        console.error("SW registration failed:", err);
      });
  });
}

createRoot(document.getElementById("root")).render(<App />);
