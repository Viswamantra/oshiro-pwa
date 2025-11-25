import React from "react";
import { createRoot } from "react-dom/client";
import App from "./pages/App.jsx";

// Register SW for Firebase Messaging
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/firebase-messaging-sw.js")
    .then(() => console.log("Firebase SW registered"))
    .catch((err) => console.error("SW registration failed:", err));
}

createRoot(document.getElementById("root")).render(<App />);
