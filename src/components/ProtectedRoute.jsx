import React from "react";
import { Navigate, useLocation } from "react-router-dom";

/**
 * =========================================================
 * PROTECTED ROUTE – FINAL STABLE VERSION
 * ---------------------------------------------------------
 * ✔ Deep-link safe (merchant details, offers, etc.)
 * ✔ No redirect loops
 * ✔ Nested routes safe
 * ✔ Preserves intended destination
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
     AUTH STATE
  ====================== */
  const isAdmin = localStorage.getItem("admin") === "true";

  const customerMobile = localStorage.getItem("customer_mobile");

  let merchant = null;
  try {
    merchant = JSON.parse(
      localStorage.getItem("merchant") || "null"
    );
  } catch {
    merchant = null;
  }

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
  if (
    merchantOnly &&
    (!merchant || merchant.role !== "merchant")
  ) {
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
