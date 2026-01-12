import React from "react";
import { useNavigate } from "react-router-dom";

/**
 * =========================================================
 * HOME / LANDING (MOBILE-FIRST)
 * ---------------------------------------------------------
 * ✔ Brand-first layout
 * ✔ Clear role selection
 * ✔ Matches login UI design system
 * ✔ Oshiro logo added (PUBLIC ASSET)
 * =========================================================
 */

export default function Home() {
  const navigate = useNavigate();

  return (
    <div style={styles.page}>
      {/* CONTENT CARD */}
      <div style={styles.card}>
        {/* LOGO */}
        <img
          src="/logo/oshiro-logo-compact-2.png"
          alt="Oshiro"
          style={styles.logo}
        />

        <h1 style={styles.title}>Welcome to Oshiro</h1>
        <p style={styles.subtitle}>
          Discover nearby deals or manage your shop
        </p>

        {/* CUSTOMER CTA */}
        <button
          onClick={() => navigate("/customer/login")}
          style={styles.primaryBtn}
        >
          I am a Customer
        </button>

        {/* MERCHANT CTA */}
        <button
          onClick={() => navigate("/merchant/login")}
          style={styles.secondaryBtn}
        >
          I am a Merchant
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
    maxWidth: 380,
    padding: 32,
    borderRadius: 18,
    background: "#ffffff",
    textAlign: "center",
    boxShadow: "0 16px 32px rgba(0, 0, 0, 0.1)",
  },

  logo: {
    height: 72,
    width: "auto",
    marginBottom: 28,
  },

  title: {
    fontSize: 26,
    fontWeight: 700,
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 15,
    color: "#6b7280",
    marginBottom: 28,
  },

  primaryBtn: {
    width: "100%",
    height: 52,
    marginBottom: 16,
    borderRadius: 12,
    border: "none",
    background: "linear-gradient(135deg, #2563eb, #1e40af)",
    color: "#ffffff",
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 6px 14px rgba(37, 99, 235, 0.35)",
  },

  secondaryBtn: {
    width: "100%",
    height: 52,
    borderRadius: 12,
    border: "1px solid #2563eb",
    background: "#ffffff",
    color: "#2563eb",
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer",
  },
};
