import React from "react";
import { Navigate, useLocation } from "react-router-dom";

/**
 * =========================================================
 * PROTECTED ROUTE – STABLE VERSION
 * ---------------------------------------------------------
 * ✔ No history corruption
 * ✔ Nested routes safe
 * ✔ No auto-jump to parent
 * =========================================================
 */

export default function ProtectedRoute({
  children,
  adminOnly = false,
  customerOnly = false,
  merchantOnly = false,
}) {
  const location = useLocation();

  const isAdmin = localStorage.getItem("admin") === "true";
  const customerMobile = localStorage.getItem("customer_mobile");

  const merchantRaw = localStorage.getItem("merchant");
  const merchant = merchantRaw ? JSON.parse(merchantRaw) : null;

  /* ======================
     ADMIN ROUTES
  ====================== */
  if (adminOnly && !isAdmin) {
    return (
      <Navigate
        to="/admin/login"
        state={{ from: location }}
      />
    );
  }

  /* ======================
     CUSTOMER ROUTES
  ====================== */
  if (customerOnly && !customerMobile) {
    return (
      <Navigate
        to="/customer/login"
        state={{ from: location }}
      />
    );
  }

  /* ======================
     MERCHANT ROUTES
  ====================== */
  if (merchantOnly && (!merchant || merchant.role !== "merchant")) {
    return (
      <Navigate
        to="/merchant/login"
        state={{ from: location }}
      />
    );
  }

  return children;
}
