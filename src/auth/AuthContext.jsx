import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase";

const AuthContext = createContext(null);
const STORAGE_KEY = "oshiro_user";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setUser(JSON.parse(saved));
  }, []);

  const loginWithPin = async (mobile, pin) => {
    try {
      const verifyPin = httpsCallable(functions, "verifyPinLogin");
      const res = await verifyPin({ mobile, pin });

      if (!res.data.success) {
        return { success: false, message: res.data.message };
      }

      const loggedUser = { mobile, role: res.data.role };
      setUser(loggedUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(loggedUser));

      if (loggedUser.role === "merchant") navigate("/merchant");
      else if (loggedUser.role === "admin") navigate("/admin");
      else navigate("/customer");

      return { success: true };
    } catch (err) {
      console.error(err);
      return { success: false, message: "Login failed" };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ user, loginWithPin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
