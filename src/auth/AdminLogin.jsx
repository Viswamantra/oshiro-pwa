import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * =========================================================
 * ADMIN LOGIN – DEV MODE (NO FIREBASE)
 * ---------------------------------------------------------
 * ✔ +91 locked mobile input
 * ✔ Fixed admin mobile + password
 * ✔ Single admin flag in localStorage
 * ✔ Matches ProtectedRoute.jsx
 * =========================================================
 */

const ADMIN_MOBILE = "7386361725"; // stored WITHOUT +91
const ADMIN_PASSWORD = "45#67";

export default function AdminLogin() {
  const navigate = useNavigate();

  /* ======================
     STATE
  ====================== */
  const [mobile, setMobile] = useState("+91");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  /* ======================
     MOBILE HANDLER (+91 LOCK)
  ====================== */
  const handleMobileChange = (e) => {
    let value = e.target.value;

    // Always keep +91
    if (!value.startsWith("+91")) {
      value = "+91";
    }

    // Remove non-digits after +91
    value = "+91" + value.slice(3).replace(/\D/g, "");

    // Limit to +91 + 10 digits
    if (value.length > 13) {
      value = value.slice(0, 13);
    }

    setMobile(value);
  };

  /* ======================
     LOGIN
  ====================== */
  const handleLogin = () => {
    setError("");

    // +91 + 10 digits = length 13
    if (mobile.length !== 13 || !password) {
      setError("Enter valid admin mobile and password");
      return;
    }

    const plainMobile = mobile.slice(3); // remove +91

    if (
      plainMobile === ADMIN_MOBILE &&
      password === ADMIN_PASSWORD
    ) {
      /* ======================
         STORE ADMIN SESSION
      ====================== */
      localStorage.setItem("admin", "true");

      navigate("/admin", { replace: true });
    } else {
      setError("Invalid admin credentials");
    }
  };

  return (
    <div style={styles.container}>
      <h2>Admin Login</h2>

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

      {error && <p style={styles.error}>{error}</p>}

      <button onClick={handleLogin} style={styles.button}>
        Login
      </button>
    </div>
  );
}

/* ======================
   STYLES
====================== */
const styles = {
  container: {
    maxWidth: 360,
    margin: "100px auto",
    padding: 20,
    border: "1px solid #ddd",
    borderRadius: 8,
    textAlign: "center",
    background: "#fff",
  },
  input: {
    width: "100%",
    padding: 10,
    marginBottom: 12,
    fontSize: 14,
  },
  button: {
    width: "100%",
    padding: 10,
    background: "#1976d2",
    color: "#fff",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
  },
  error: {
    color: "red",
    marginBottom: 10,
  },
};
