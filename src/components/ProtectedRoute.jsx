import React from "react";
import { Navigate } from "react-router-dom";

/**
 * =========================================================
 * PROTECTED ROUTE – DEV MODE (FINAL)
 * ---------------------------------------------------------
 * ✔ Admin routes    → admin flag
 * ✔ Customer routes → customer_mobile
 * ✔ Merchant routes → merchant object
 * ✔ Deterministic & stable
 * =========================================================
 */

export default function ProtectedRoute({
  children,
  adminOnly = false,
  customerOnly = false,
  merchantOnly = false,
}) {
  /* ======================
     READ SESSIONS
  ====================== */
  const isAdmin = localStorage.getItem("admin") === "true";
  const customerMobile = localStorage.getItem("customer_mobile");

  const merchantRaw = localStorage.getItem("merchant");
  const merchant = merchantRaw ? JSON.parse(merchantRaw) : null;

  /* ======================
     ADMIN ROUTES
  ====================== */
  if (adminOnly) {
    if (!isAdmin) {
      return <Navigate to="/admin/login" replace />;
    }
    return children;
  }

  /* ======================
     CUSTOMER ROUTES
  ====================== */
  if (customerOnly) {
    if (!customerMobile) {
      return <Navigate to="/customer/login" replace />;
    }
    return children;
  }

  /* ======================
     MERCHANT ROUTES
  ====================== */
  if (merchantOnly) {
    if (!merchant || merchant.role !== "merchant") {
      return <Navigate to="/merchant/login" replace />;
    }
    return children;
  }

  /* ======================
     PUBLIC ROUTES
  ====================== */
  return children;
}
