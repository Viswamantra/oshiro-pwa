import { Navigate, useLocation } from "react-router-dom";
import { getActiveRole } from "../utils/activeRole";

/**
 * =========================================================
 * ROUTE GUARD – FINAL & STABLE
 * ---------------------------------------------------------
 * ✔ Single source of truth: activeRole + mobile
 * ✔ Prevents role leakage
 * ✔ Refresh safe
 * ✔ No OTP / no auth provider
 * =========================================================
 */

export default function RouteGuard({ allowedRoles, children }) {
  const location = useLocation();

  const role = getActiveRole();
  const mobile = localStorage.getItem("mobile");

  /* ======================
     NO SESSION
  ====================== */
  if (!role || !mobile) {
    return (
      <Navigate
        to="/"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  /* ======================
     ROLE NOT ALLOWED
  ====================== */
  if (
    !Array.isArray(allowedRoles) ||
    !allowedRoles.includes(role)
  ) {
    return <Navigate to="/" replace />;
  }

  /* ======================
     ACCESS GRANTED
  ====================== */
  return children;
}
