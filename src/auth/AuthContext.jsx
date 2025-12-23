// src/auth/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import {
  doc,
  getDoc,
  updateDoc,
  increment,
} from "firebase/firestore";
import bcrypt from "bcryptjs";

const AuthContext = createContext(null);

const ADMIN_MOBILE = "7386361725";
const STORAGE_KEY = "oshiro_user";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  /* =========================
     RESTORE SESSION
  ========================= */
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setUser(JSON.parse(saved));
    setLoading(false);
  }, []);

  /* =========================
     LOGIN WITH PIN
  ========================= */
  const loginWithPin = async (mobile, pin) => {
    if (!/^\d{10}$/.test(mobile)) {
      return { success: false, message: "Mobile must be 10 digits" };
    }

    if (!/^\d{4}$/.test(pin)) {
      return { success: false, message: "PIN must be 4 digits" };
    }

    // 🔐 Admin shortcut
    if (mobile === ADMIN_MOBILE && pin === "0000") {
      const adminUser = { mobile, role: "admin" };
      setUser(adminUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(adminUser));
      navigate("/admin");
      return { success: true };
    }

    const userRef = doc(db, "users", mobile);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      return { success: false, message: "User not registered" };
    }

    const data = snap.data();

    if (data.pinAttempts >= 5) {
      return {
        success: false,
        message: "Account locked. Try later.",
      };
    }

    const valid = await bcrypt.compare(pin, data.pinHash);

    if (!valid) {
      await updateDoc(userRef, {
        pinAttempts: increment(1),
      });
      return { success: false, message: "Wrong PIN" };
    }

    // ✅ Reset attempts
    await updateDoc(userRef, { pinAttempts: 0 });

    const loggedUser = {
      mobile,
      role: data.role || "customer",
    };

    setUser(loggedUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loggedUser));

    // 🔀 Role routing
    if (loggedUser.role === "merchant") navigate("/merchant");
    else navigate("/customer");

    return { success: true };
  };

  /* =========================
     LOGOUT
  ========================= */
  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    navigate("/login");
  };

  if (loading) return null;

  return (
    <AuthContext.Provider value={{ user, loginWithPin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
