import React from "react";
import { Navigate, useLocation } from "react-router-dom";

/**
 * =========================================================
 * PROTECTED ROUTE – FINAL HARDENED VERSION
 * ---------------------------------------------------------
 * ✔ Deep-link safe
 * ✔ No redirect loops
 * ✔ Nested routes safe
 * ✔ Backward-compatible auth checks
 * ✔ Rollup / Vercel safe
 * =========================================================
 */

export default function ProtectedRoute({
  children,
  adminOnly = false,
  customerOnly = false,
  merchantOnly = false,
}) {
  const location = useLocation();

  /* ======================
     AUTH STATE (SAFE PARSE)
  ====================== */

  // Admin (DEV + PROD compatible)
  const isAdmin =
    localStorage.getItem("admin") === "true" ||
    !!localStorage.getItem("admin_token");

  // Customer
  const customerMobile =
    localStorage.getItem("customer_mobile");

  // Merchant
  let merchant = null;
  try {
    merchant = JSON.parse(
      localStorage.getItem("merchant") || "null"
    );
  } catch {
    merchant = null;
  }

  const isMerchant =
    merchant &&
    typeof merchant === "object" &&
    !!merchant.id;

  /* ======================
     ADMIN ROUTES
  ====================== */
  if (adminOnly && !isAdmin) {
    return (
      <Navigate
        to="/admin/login"
        replace
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
        replace
        state={{ from: location }}
      />
    );
  }

  /* ======================
     MERCHANT ROUTES
  ====================== */
  if (merchantOnly && !isMerchant) {
    return (
      <Navigate
        to="/merchant/login"
        replace
        state={{ from: location }}
      />
    );
  }

  /* ======================
     ACCESS GRANTED
  ====================== */
  return children;
}
