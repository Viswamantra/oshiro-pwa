/**
 * =========================================================
 * OSHIRO AUTH CONTEXT — PRODUCTION VERSION
 * ---------------------------------------------------------
 * ✔ Firebase Auth listener
 * ✔ Role detection support
 * ✔ Auto FCM token registration after login
 * ✔ Loading safe
 * ✔ Future multi-role ready
 * ✔ Production logging
 * =========================================================
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";

import { generateAndSaveToken } from "../services/fcmToken";

/* =========================================================
   CONTEXT
========================================================= */

const AuthContext = createContext();

/* =========================================================
   ROLE HELPER
   Priority:
   1️⃣ localStorage activeRole
   2️⃣ fallback = customer
========================================================= */

function resolveUserRole() {
  try {
    const role = localStorage.getItem("activeRole");
    if (role) return role;
    return "customer";
  } catch {
    return "customer";
  }
}

/* =========================================================
   PROVIDER
========================================================= */

export function AuthProvider({ children }) {

  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  /* =========================================================
     AUTH LISTENER
  ========================================================= */

  useEffect(() => {

    console.log("[AUTH] 🔐 Attaching auth listener");

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {

      console.log("[AUTH] Auth state changed", firebaseUser?.uid);

      if (!firebaseUser) {
        setUser(null);
        setRole(null);
        setLoading(false);
        return;
      }

      setUser(firebaseUser);

      /* ---------- ROLE ---------- */

      const resolvedRole = resolveUserRole();
      setRole(resolvedRole);

      console.log("[AUTH] Role resolved:", resolvedRole);

      /* ---------- FCM TOKEN AUTO REGISTER ---------- */

      try {

        console.log("[AUTH] Generating FCM token...");

        await generateAndSaveToken(
          firebaseUser.uid,
          resolvedRole
        );

        console.log("[AUTH] FCM token registration complete");

      } catch (err) {
        console.error("[AUTH] FCM registration failed", err);
      }

      setLoading(false);
    });

    return () => {
      console.log("[AUTH] 🔌 Detaching auth listener");
      unsub();
    };

  }, []);

  /* =========================================================
     CONTEXT VALUE
  ========================================================= */

  const value = {
    user,
    role,
    loading,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/* =========================================================
   HOOK
========================================================= */

export function useAuth() {
  return useContext(AuthContext);
}
