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
 * ✔ Oshiro logo added (PUBLIC ASSET)
 * =========================================================
 */

export default function CustomerLogin() {
  const navigate = useNavigate();

  const [mobile, setMobile] = useState("+91");
  const [error, setError] = useState("");

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

  const lockCursor = (e) => {
    if (e.target.selectionStart < 3) {
      e.target.setSelectionRange(3, 3);
    }
  };

  const handleLogin = () => {
    setError("");

    if (mobile.length !== 13) {
      setError("Enter valid mobile number (+91XXXXXXXXXX)");
      return;
    }

    const customerMobile = mobile.slice(3);
    localStorage.setItem("customer_mobile", customerMobile);
    navigate("/customer", { replace: true });
  };

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      {/* HOME BUTTON */}
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

      {/* LOGIN CARD */}
      <div style={styles.container}>
        {/* LOGO (FROM PUBLIC) */}
        <img
          src="/logo/oshiro-logo-compact-2.png"
          alt="Oshiro"
          style={styles.logo}
        />

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

const styles = {
  container: {
    padding: 30,
    maxWidth: 360,
    margin: "120px auto",
    border: "1px solid #ddd",
    borderRadius: 8,
    background: "#fff",
    textAlign: "center",
  },
  logo: {
    height: 56,
    width: "auto",
    marginBottom: 20,
    display: "block",
    marginLeft: "auto",
    marginRight: "auto",
  },
  title: {
    marginBottom: 10,
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
