// src/auth/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

const AuthContext = createContext(null);

const DEFAULT_OTP = "2345";
const ADMIN_MOBILE = "7386361725";
const STORAGE_KEY = "oshiro_user"; // 🔒 localStorage key

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  /* =========================
     RESTORE SESSION ON REFRESH
  ========================= */
  useEffect(() => {
    const savedUser = localStorage.getItem(STORAGE_KEY);
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  /* =========================
     LOGIN WITH OTP
  ========================= */
  const loginWithOtp = async (mobile, otp) => {
    if (!/^\d{10}$/.test(mobile)) {
      return { success: false, message: "Mobile must be 10 digits" };
    }
    if (otp !== DEFAULT_OTP) {
      return { success: false, message: "Invalid OTP" };
    }

    let role = "customer";

    if (mobile === ADMIN_MOBILE) {
      role = "admin";
    } else {
      try {
        const q = query(
          collection(db, "merchants"),
          where("mobile", "==", mobile),
          where("status", "==", "approved")
        );
        const snap = await getDocs(q);
        if (!snap.empty) role = "merchant";
      } catch (e) {
        console.error("Auth merchant check error", e);
      }
    }

    const loggedInUser = { mobile, role };

    // ✅ Persist session
    setUser(loggedInUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loggedInUser));

    // ✅ Role-based navigation
    if (role === "admin") navigate("/admin");
    else if (role === "merchant") navigate("/merchant");
    else navigate("/customer");

    return { success: true };
  };

  /* =========================
     LOGOUT (ONLY HERE)
  ========================= */
  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    navigate("/login");
  };

  // ⛔ Prevent rendering until session restored
  if (loading) return null;

  return (
    <AuthContext.Provider value={{ user, loginWithOtp, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
