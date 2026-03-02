import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/barrel.js";
import { getActiveRole, clearActiveRole } from "../utils/activeRole";

export default function RouteGuard({ children }) {
  const [user, setUser] = useState(undefined);
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);

      // If Firebase user is gone, clear role
      if (!firebaseUser) {
        clearActiveRole();
      }
    });

    return () => unsubscribe();
  }, []);

  /* ================= LOADING ================= */
  if (user === undefined) {
    return null;
  }

  /* ================= NOT LOGGED IN ================= */
  if (!user) {
    if (location.pathname.startsWith("/admin")) {
      return <Navigate to="/admin-login" replace />;
    }

    if (location.pathname.startsWith("/merchant")) {
      return <Navigate to="/merchant/login" replace />;
    }

    return <Navigate to="/customer-login" replace />;
  }

  /* ================= ROLE CHECK ================= */
  const activeRole = getActiveRole();

  if (!activeRole) {
    return <Navigate to="/" replace />;
  }

  if (location.pathname.startsWith("/admin") && activeRole !== "admin") {
    return <Navigate to="/" replace />;
  }

  if (location.pathname.startsWith("/merchant") && activeRole !== "merchant") {
    return <Navigate to="/" replace />;
  }

  if (location.pathname.startsWith("/customer") && activeRole !== "customer") {
    return <Navigate to="/" replace />;
  }

  return children;
}