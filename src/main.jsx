import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

/**
 * 🚫 SERVICE WORKER COMPLETELY DISABLED
 * (critical for fixing blank screen)
 */

createRoot(document.getElementById("root")).render(
  <App />
);
