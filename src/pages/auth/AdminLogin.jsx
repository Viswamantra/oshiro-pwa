import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { setActiveRole } from "../../utils/activeRole";

/**
 * =========================================================
 * ADMIN LOGIN – UI ALIGNED WITH CUSTOMER & MERCHANT
 * ---------------------------------------------------------
 * ✔ Same layout
 * ✔ Same card style
 * ✔ Same UX
 * ✔ No MUI
 * =========================================================
 */

export default function AdminLogin() {
  const navigate = useNavigate();

  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const login = () => {
    setError("");

    // 🔐 HARD-CODED ADMIN
    if (mobile === "7386361725" && password === "45#67") {
      localStorage.setItem("mobile", mobile);
      setActiveRole("admin");
      navigate("/admin", { replace: true });
    } else {
      setError("Invalid admin credentials");
    }
  };

  return (
    <div style={styles.page}>
      {/* HOME */}
      <div onClick={() => navigate("/")} style={styles.homeBtn}>
        ← Home
      </div>

      <div style={styles.card}>
        {/* LOGO */}
        <img
          src="/logo/oshiro-logo-compact-3.png"
          alt="OshirO"
          style={styles.logo}
        />

        <h2 style={styles.title}>Admin Login</h2>
        <p style={styles.subtitle}>
          Authorized access only
        </p>

        {/* MOBILE */}
        <input
          type="tel"
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
          placeholder="Admin mobile number"
          style={styles.input}
        />

        {/* PASSWORD */}
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          style={styles.input}
        />

        {error && <div style={styles.error}>{error}</div>}

        {/* CTA */}
        <button onClick={login} style={styles.button}>
          Login →
        </button>
      </div>
    </div>
  );
}

/* ======================
   STYLES (SAME AS OTHERS)
====================== */

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #f8fafc, #eef2ff)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    position: "relative",
  },
  homeBtn: {
    position: "absolute",
    top: 20,
    left: 16,
    padding: "6px 14px",
    borderRadius: 20,
    background: "#f1f5f9",
    color: "#2563eb",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
  },
  card: {
    width: "100%",
    maxWidth: 360,
    padding: 28,
    borderRadius: 16,
    background: "#ffffff",
    textAlign: "center",
    boxShadow: "0 16px 32px rgba(0, 0, 0, 0.1)",
  },
  logo: {
    height: 56,
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 600,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    height: 48,
    padding: "0 14px",
    fontSize: 16,
    borderRadius: 10,
    border: "1px solid #d1d5db",
    marginBottom: 14,
  },
  error: {
    marginBottom: 10,
    fontSize: 14,
    color: "#dc2626",
  },
  button: {
    width: "100%",
    height: 48,
    marginTop: 12,
    borderRadius: 10,
    border: "none",
    background: "linear-gradient(135deg, #2563eb, #1e40af)",
    color: "#fff",
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer",
  },
};
