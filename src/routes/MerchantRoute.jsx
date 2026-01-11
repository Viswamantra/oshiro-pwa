import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function MerchantRoute({ children }) {
  const { user, loading } = useAuth();
  const role = localStorage.getItem("oshiro_role");

  if (loading) return null;

  if (!user || role !== "merchant") {
    localStorage.clear();
    return <Navigate to="/login" replace />;
  }

  return children;
}
