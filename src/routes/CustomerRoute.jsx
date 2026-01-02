import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function CustomerRoute({ children }) {
  const { user, loading } = useAuth();
  const role = localStorage.getItem("oshiro_role");

  if (loading) return <div>Authenticating…</div>;

  if (!user || role !== "customer") {
    localStorage.clear();
    return <Navigate to="/login" replace />;
  }

  return children;
}
