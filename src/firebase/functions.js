/**
 * =========================================================
 * FIREBASE CLOUD FUNCTIONS CLIENT INIT
 * ---------------------------------------------------------
 * ✔ Uses existing Firebase app instance
 * ✔ Region locked (asia-south1) for latency + cost
 * ✔ Callable functions ready
 * ✔ Production safe
 * ✔ Lazy import safe
 * ✔ Vite / React safe
 * =========================================================
 */

import { getFunctions } from "firebase/functions";
import { app } from "./index";

/* =========================================================
   FUNCTIONS REGION CONFIG
========================================================= */

/**
 * IMPORTANT:
 * Must match your deployed Cloud Functions region
 *
 * From your logs earlier:
 * asia-south1 ✔
 */
export const functions = getFunctions(app, "asia-south1");

/* =========================================================
   OPTIONAL DEBUG HELPER
========================================================= */

export function getFunctionsRegion() {
  return "asia-south1";
}
