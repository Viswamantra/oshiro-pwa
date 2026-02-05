import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { upsertCustomer } from "../../firebase/barrel";
import { setActiveRole } from "../../utils/activeRole";

export default function CustomerLogin() {
  const navigate = useNavigate();

  const [mobile, setMobile] = useState("");
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const [loading, setLoading] = useState(false);

  /* =========================
     NAME VALIDATION
  ========================= */
  const handleNameChange = (e) => {
    const value = e.target.value;

    if (!/^[A-Za-z]*$/.test(value)) {
      setNameError("Only English letters allowed");
      return;
    }

    if (value.length > 10) {
      setNameError("Maximum 10 characters");
      return;
    }

    setNameError("");
    setName(value);
  };

  /* =========================
     MOBILE VALIDATION
  ========================= */
  const handleMobileChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 10) setMobile(value);
  };

  /* =========================
     SUBMIT (LOGIN)
  ========================= */
  const handleSubmit = async () => {
    if (!name || mobile.length !== 10) {
      setNameError("Valid name and mobile required");
      return;
    }

    try {
      setLoading(true);

      // 🔥 Save / update customer in Firestore
      await upsertCustomer({
        mobile,
        name,
      });

      // 🔐 SESSION (SINGLE SOURCE OF TRUTH)
      localStorage.setItem("mobile", mobile);
      localStorage.setItem("name", name);
      setActiveRole("customer");

      navigate("/customer", { replace: true });
    } catch (err) {
      console.error("Customer login failed:", err);
      setNameError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isFormValid =
    mobile.length === 10 && name && !nameError && !loading;

  return (
    <div style={styles.page}>
      {/* HOME */}
      <div onClick={() => navigate("/")} style={styles.homeBtn}>
        ← Home
      </div>

      <div style={styles.card}>
        <img
          src="/logo/oshiro-logo-compact-3.png"
          alt="OshirO"
          style={styles.logo}
        />

        <h2 style={styles.title}>Welcome to OshirO 👋</h2>
        <p style={styles.subtitle}>
          Where every corner has a discount
        </p>

        {/* MOBILE */}
        <input
          type="tel"
          value={mobile}
          onChange={handleMobileChange}
          placeholder="Mobile number"
          style={styles.input}
        />

        {/* NAME */}
        <input
          type="text"
          value={name}
          onChange={handleNameChange}
          placeholder="Your name (Eg: Ravi)"
          style={styles.input}
        />

        {nameError && <div style={styles.error}>{nameError}</div>}

        {/* CTA */}
        <button
          onClick={handleSubmit}
          disabled={!isFormValid}
          style={{
            ...styles.button,
            opacity: isFormValid ? 1 : 0.6,
          }}
        >
          {loading ? "Please wait..." : "Continue →"}
        </button>
      </div>
    </div>
  );
}

/* ======================
   STYLES
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
