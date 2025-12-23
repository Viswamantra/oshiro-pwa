import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase";

const AuthContext = createContext(null);
const STORAGE_KEY = "oshiro_user";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setUser(JSON.parse(saved));
    setLoading(false);
  }, []);

  const loginWithPin = async (mobile, pin) => {
    if (!/^\d{10}$/.test(mobile)) {
      return { success: false, message: "Mobile must be 10 digits" };
    }

    if (!/^\d{4}$/.test(pin)) {
      return { success: false, message: "PIN must be 4 digits" };
    }

    try {
      const verifyPin = httpsCallable(functions, "verifyPinLogin");
      const res = await verifyPin({ mobile, pin });

      if (!res.data.success) {
        return { success: false, message: res.data.message };
      }

      const loggedUser = {
        mobile,
        role: res.data.role,
      };

      setUser(loggedUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(loggedUser));

      if (loggedUser.role === "admin") navigate("/admin");
      else if (loggedUser.role === "merchant") navigate("/merchant");
      else navigate("/customer");

      return { success: true };
    } catch (err) {
      console.error("loginWithPin error:", err);
      return { success: false, message: "Login failed" };
    }
  };

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
