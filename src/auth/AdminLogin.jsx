import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * =========================================================
 * ADMIN LOGIN (DEV MODE | MOBILE-FIRST)
 * ---------------------------------------------------------
 * ✔ +91 locked mobile input
 * ✔ Fixed admin credentials
 * ✔ Admin session via localStorage
 * ✔ UI consistent with Customer & Merchant login
 * ✔ Oshiro logo added (PUBLIC ASSET)
 * =========================================================
 */

const ADMIN_MOBILE = "7386361725"; // stored WITHOUT +91
const ADMIN_PASSWORD = "45#67";

export default function AdminLogin() {
  const navigate = useNavigate();

  const [mobile, setMobile] = useState("+91");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  /* ======================
     MOBILE HANDLER (+91 LOCK)
  ====================== */
  const handleMobileChange = (e) => {
    let value = e.target.value;

    if (!value.startsWith("+91")) {
      value = "+91";
    }

    value = "+91" + value.slice(3).replace(/\D/g, "");

    if (value.length > 13) {
      value = value.slice(0, 13);
    }

    setMobile(value);
  };

  /* ======================
     LOGIN HANDLER
  ====================== */
  const handleLogin = () => {
    setError("");

    if (mobile.length !== 13 || !password) {
      setError("Enter valid admin mobile and password");
      return;
    }

    const plainMobile = mobile.slice(3);

    if (
      plainMobile === ADMIN_MOBILE &&
      password === ADMIN_PASSWORD
    ) {
      localStorage.setItem("admin", "true");
      navigate("/admin", { replace: true });
    } else {
      setError("Invalid admin credentials");
    }
  };

  return (
    <div style={styles.page}>
      {/* LOGIN CARD */}
      <div style={styles.card}>
        {/* LOGO */}
        <img
          src="/logo/oshiro-logo-compact-3.png"
          alt="Oshiro"
          style={styles.logo}
        />

        <h2 style={styles.title}>Admin Login</h2>
        <p style={styles.subtitle}>
          Secure access for administrators
        </p>

        <input
          type="tel"
          value={mobile}
          onChange={handleMobileChange}
          placeholder="+91XXXXXXXXXX"
          onFocus={(e) => e.target.setSelectionRange(3, 3)}
          style={styles.input}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
        />

        {error && <div style={styles.error}>{error}</div>}

        <button onClick={handleLogin} style={styles.button}>
          Login
        </button>
      </div>
    </div>
  );
}

/* ======================
   STYLES (MOBILE-FIRST)
====================== */
const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #f8fafc, #eef2ff)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
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
    width: "auto",
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
    outline: "none",
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
    color: "#ffffff",
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 6px 14px rgba(37, 99, 235, 0.35)",
  },
};
