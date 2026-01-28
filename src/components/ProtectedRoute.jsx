import React from "react";
import { Navigate, Outlet } from "react-router-dom";

/**
 * =========================================================
 * PROTECTED ROUTE (ROLE + SESSION BASED)
 * ---------------------------------------------------------
 * ✔ Supports adminOnly / merchantOnly / customerOnly
 * ✔ Supports BOTH children & Outlet
 * ✔ Matches App.jsx usage
 * ✔ Vercel & Vite safe
 * =========================================================
 */

export default function ProtectedRoute({
  adminOnly = false,
  merchantOnly = false,
  customerOnly = false,
  children,
}) {
  const admin = localStorage.getItem("admin");
  const merchant = localStorage.getItem("merchant");
  const customer = localStorage.getItem("customer");

  // ADMIN
  if (adminOnly && !admin) {
    return <Navigate to="/admin/login" replace />;
  }

  // MERCHANT
  if (merchantOnly && !merchant) {
    return <Navigate to="/merchant/login" replace />;
  }

  // CUSTOMER
  if (customerOnly && !customer) {
    return <Navigate to="/customer/login" replace />;
  }

  // ✅ CRITICAL FIX:
  // If a layout/component is passed as children, render it
  // Otherwise render nested routes via Outlet
  return children ? children : <Outlet />;
}
