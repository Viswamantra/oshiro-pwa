import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * =========================================================
 * CUSTOMER LOGIN (MOBILE-FIRST)
 * ---------------------------------------------------------
 * ✔ +91 locked mobile input
 * ✔ Allows only 10 digits after +91
 * ✔ Prevents deleting +91
 * ✔ Stores customer_mobile in localStorage
 * ✔ Triggers notification permission screen (one-time)
 * ✔ Clean, modern UI
 * ✔ Public logo usage (Vercel-safe)
 * =========================================================
 */

export default function CustomerLogin() {
  const navigate = useNavigate();

  /* ======================
     STATE
  ====================== */
  const [mobile, setMobile] = useState("+91");
  const [error, setError] = useState("");

  /* ======================
     MOBILE INPUT HANDLER
  ====================== */
  const handleMobileChange = (e) => {
    let value = e.target.value;

    if (!value.startsWith("+91")) {
      value = "+91";
    }

    let digits = value.slice(3).replace(/\D/g, "");
    if (digits.length > 10) {
      digits = digits.slice(0, 10);
    }

    setMobile("+91" + digits);
  };

  /* ======================
     LOCK CURSOR AFTER +91
  ====================== */
  const lockCursor = (e) => {
    if (e.target.selectionStart < 3) {
      e.target.setSelectionRange(3, 3);
    }
  };

  /* ======================
     LOGIN HANDLER
  ====================== */
  const handleLogin = () => {
    setError("");

    if (mobile.length !== 13) {
      setError("Enter valid mobile number (+91XXXXXXXXXX)");
      return;
    }

    const customerMobile = mobile.slice(3);

    /* ======================
       STORE SESSION
    ====================== */
    localStorage.setItem("customer_mobile", customerMobile);

    /* ======================
       NOTIFICATION PERMISSION FLOW
       (ONE-TIME ONLY)
    ====================== */
    const notificationPermission =
      localStorage.getItem("notification_permission");

    if (!notificationPermission) {
      navigate("/customer/notifications", {
        replace: true,
      });
    } else {
      navigate("/customer", { replace: true });
    }
  };

  return (
    <div style={styles.page}>
      {/* HOME BUTTON */}
      <div
        onClick={() => navigate("/")}
        style={styles.homeBtn}
      >
        ← Home
      </div>

      {/* LOGIN CARD */}
      <div style={styles.card}>
        {/* LOGO */}
        <img
          src="/logo/oshiro-logo-compact-3.png"
          alt="Oshiro"
          style={styles.logo}
        />

        <h2 style={styles.title}>Customer Login</h2>
        <p style={styles.subtitle}>
          Enter your mobile number to continue
        </p>

        <input
          type="tel"
          value={mobile}
          placeholder="+91XXXXXXXXXX"
          onChange={handleMobileChange}
          onFocus={lockCursor}
          onClick={lockCursor}
          onKeyUp={lockCursor}
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
  },

  error: {
    marginTop: 10,
    fontSize: 14,
    color: "#dc2626",
  },

  button: {
    width: "100%",
    height: 48,
    marginTop: 24,
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
