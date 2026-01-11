import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * =========================================================
 * CUSTOMER LOGIN
 * ---------------------------------------------------------
 * ✔ +91 locked mobile input
 * ✔ Allows only 10 digits after +91
 * ✔ Prevents deleting +91
 * ✔ Stores customer_mobile in localStorage
 * ✔ Compatible with ProtectedRoute.jsx
 * ✔ Includes Home navigation (UX improvement)
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

    // Always keep +91
    if (!value.startsWith("+91")) {
      value = "+91";
    }

    // Digits after +91 only
    let digits = value.slice(3).replace(/\D/g, "");

    // Limit to 10 digits
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

    // +91 + 10 digits = 13 chars
    if (mobile.length !== 13) {
      setError("Enter valid mobile number (+91XXXXXXXXXX)");
      return;
    }

    const customerMobile = mobile.slice(3); // remove +91

    console.log("✅ Customer logged in:", customerMobile);

    /* ======================
       SINGLE SOURCE OF TRUTH
       (USED BY ProtectedRoute)
    ====================== */
    localStorage.setItem("customer_mobile", customerMobile);

    navigate("/customer", { replace: true });
  };

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      {/* ======================
          HOME BUTTON (UX)
      ====================== */}
      <div
        onClick={() => navigate("/")}
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          cursor: "pointer",
          color: "#2563eb",
          fontSize: 14,
          fontWeight: 500,
        }}
      >
        ← Home
      </div>

      {/* ======================
          LOGIN CARD
      ====================== */}
      <div style={styles.container}>
        <h2 style={styles.title}>Customer Login</h2>

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

        {error && <p style={styles.error}>{error}</p>}

        <button onClick={handleLogin} style={styles.button}>
          Login
        </button>
      </div>
    </div>
  );
}

/* ======================
   STYLES
====================== */
const styles = {
  container: {
    padding: 30,
    maxWidth: 360,
    margin: "120px auto",
    border: "1px solid #ddd",
    borderRadius: 8,
    background: "#fff",
  },
  title: {
    textAlign: "center",
  },
  input: {
    width: "100%",
    padding: 10,
    fontSize: 16,
    marginTop: 15,
  },
  button: {
    width: "100%",
    padding: 10,
    marginTop: 20,
    cursor: "pointer",
  },
  error: {
    color: "red",
    marginTop: 8,
  },
};
