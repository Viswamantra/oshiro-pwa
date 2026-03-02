/**
 * =========================================================
 * ADMIN ROUTE GUARD — UID BASED PRODUCTION VERSION
 * ---------------------------------------------------------
 * ✔ Uses AuthContext (single source of truth)
 * ✔ Role from Firestore
 * ✔ No localStorage dependency
 * ✔ Isolated from merchant/customer dashboards
 * ✔ Prevents cross-dashboard breakage
 * =========================================================
 */

import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function AdminRoute({ children }) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  /* ===============================
     1️⃣ AUTH LOADING
  =============================== */
  if (loading) {
    return null; // silent bootstrap
  }

  /* ===============================
     2️⃣ NOT LOGGED IN
  =============================== */
  if (!user) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  /* ===============================
     3️⃣ ROLE VALIDATION
  =============================== */
  if (role !== "admin") {
    console.warn("[ROUTE] Unauthorized admin access attempt");
    return <Navigate to="/admin/login" replace />;
  }

  /* ===============================
     4️⃣ AUTHORIZED
  =============================== */
  return children;
}