/**
 * 🔒 LOCKED AFTER PHASE 2.6
 * Merchant routing stable
 * Do not change route paths
 *
 * ✔ Role from AuthContext
 * ✔ No localStorage dependency
 * ✔ Safe redirect
 * ✔ Production hardened
 */

import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function MerchantRoute({ children }) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  /* ===============================
     1️⃣ AUTH LOADING STATE
  =============================== */
  if (loading) {
    return null; // Prevent flicker during auth bootstrap
  }

  /* ===============================
     2️⃣ NOT LOGGED IN
  =============================== */
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  /* ===============================
     3️⃣ ROLE VALIDATION
  =============================== */
  if (role !== "merchant") {
    console.warn("[ROUTE] Unauthorized access attempt to merchant route");
    return <Navigate to="/login" replace />;
  }

  /* ===============================
     4️⃣ AUTHORIZED
  =============================== */
  return children;
}