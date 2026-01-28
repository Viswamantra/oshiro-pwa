import React from "react";
import { Navigate } from "react-router-dom";

/**
 * =========================================================
 * ADMIN ROUTE GUARD (ISOLATED)
 * ---------------------------------------------------------
 * ✔ Only checks admin session
 * ✔ Does NOT touch merchant / customer
 * ✔ Prevents cross-dashboard breakage
 * =========================================================
 */

export default function AdminRoute({ children }) {
  const adminRaw = localStorage.getItem("admin");
  const admin = adminRaw ? JSON.parse(adminRaw) : null;

  if (!admin || admin.role !== "admin") {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}
