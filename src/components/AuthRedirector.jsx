import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { ROUTES } from "../constants/routes";

/**
 * FINAL STABLE AUTH REDIRECTOR
 * Handles login routes correctly
 */

export default function AuthRedirector({ children }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;

    const path = location.pathname;

    if (!user) return;

    const checkRole = async () => {
      const uid = user.uid;

      // ===== ADMIN =====
      const adminSnap = await getDoc(doc(db, "admins", uid));
      if (adminSnap.exists()) {
        if (path === "/admin/login") {
          navigate("/admin", { replace: true });
        }
        return;
      }

      // ===== MERCHANT =====
      const merchantSnap = await getDoc(doc(db, "merchants", uid));
      if (merchantSnap.exists()) {

        // 🔥 THIS FIXES YOUR ISSUE
        if (path === "/merchant/login") {
          navigate("/merchant", { replace: true });
          return;
        }

        return;
      }

      // ===== CUSTOMER =====
      const customerSnap = await getDoc(doc(db, "customers", uid));
      if (customerSnap.exists()) {

        if (path === "/customer-login") {
          navigate("/customer", { replace: true });
          return;
        }

        return;
      }

    };

    checkRole();

  }, [user, loading, location.pathname, navigate]);

  if (loading) return null;

  return children;
}