import React from "react";
import { Navigate, Outlet } from "react-router-dom";

/**
 * =========================================================
 * PROTECTED ROUTE (ROLE + SESSION BASED)
 * ---------------------------------------------------------
 * ✔ No page imports
 * ✔ Vite / Vercel safe
 * ✔ Merchant / Admin / Customer supported
 * =========================================================
 */

export default function ProtectedRoute({ role }) {
  const merchant = localStorage.getItem("merchant");
  const admin = localStorage.getItem("admin");
  const customer = localStorage.getItem("customer");

  // Role-based access
  if (role === "merchant" && !merchant) {
    return <Navigate to="/merchant/login" replace />;
  }

  if (role === "admin" && !admin) {
    return <Navigate to="/admin/login" replace />;
  }

  if (role === "customer" && !customer) {
    return <Navigate to="/customer/login" replace />;
  }

  return <Outlet />;
}
