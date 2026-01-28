import { Navigate, Outlet } from "react-router-dom";

/**
 * ROLE-BASED ROUTE GUARD (RRv6 SAFE)
 */
export default function ProtectedRoute({
  adminOnly = false,
  merchantOnly = false,
  customerOnly = false,
}) {
  const isAdmin = localStorage.getItem("admin") === "true";
  const isMerchant = localStorage.getItem("merchant") === "true";
  const isCustomer = localStorage.getItem("customer") === "true";

  if (adminOnly && !isAdmin) return <Navigate to="/admin/login" replace />;
  if (merchantOnly && !isMerchant) return <Navigate to="/merchant/login" replace />;
  if (customerOnly && !isCustomer) return <Navigate to="/customer/login" replace />;

  return <Outlet />;
}
