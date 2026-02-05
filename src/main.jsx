import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

/**
 * =========================================================
 * APP ENTRY POINT
 * ---------------------------------------------------------
 * ✔ Single BrowserRouter
 * ✔ No duplicate routers
 * ✔ Stable for auth + routing
 * ✔ Localhost & production safe
 * =========================================================
 */

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
