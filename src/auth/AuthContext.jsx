import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

/* ========================================================= */

const AuthContext = createContext();

/* ========================================================= */

export function AuthProvider({ children }) {

  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    console.log("[AUTH] 🔐 Session observer started");

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {

      if (firebaseUser) {

        console.log("[AUTH] ✅ Authenticated UID:", firebaseUser.uid);
        setUser(firebaseUser);

        try {
          // 🔎 Check customers collection
          const customerSnap = await getDoc(
            doc(db, "customers", firebaseUser.uid)
          );

          if (customerSnap.exists()) {
            setRole("customer");
            setLoading(false);
            return;
          }

          // 🔎 Check merchants collection
          const merchantSnap = await getDoc(
            doc(db, "merchants", firebaseUser.uid)
          );

          if (merchantSnap.exists()) {
            setRole("merchant");
            setLoading(false);
            return;
          }

          // 🔎 No role found
          setRole(null);

        } catch (error) {
          console.error("[AUTH] Role detection failed:", error);
          setRole(null);
        }

      } else {
        console.log("[AUTH] ❌ No authenticated user");
        setUser(null);
        setRole(null);
      }

      setLoading(false);

    });

    return () => unsubscribe();

  }, []);

  const value = {
    user,
    uid: user?.uid || null,
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

/* ========================================================= */

export function useAuth() {
  return useContext(AuthContext);
}