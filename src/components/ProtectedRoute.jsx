import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute({ adminOnly }) {
  const isAdmin = localStorage.getItem("admin") === "true";

  if (adminOnly && !isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
}
