import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute({
  adminOnly = false,
  merchantOnly = false,
  customerOnly = false,
}) {
  const admin = localStorage.getItem("admin") === "true";
  const merchant = localStorage.getItem("merchant") === "true";
  const customer = localStorage.getItem("customer") === "true";

  if (adminOnly && !admin) return <Navigate to="/admin/login" replace />;
  if (merchantOnly && !merchant) return <Navigate to="/merchant/login" replace />;
  if (customerOnly && !customer) return <Navigate to="/customer/login" replace />;

  return <Outlet />;
}
