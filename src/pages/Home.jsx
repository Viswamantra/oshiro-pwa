import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Home() {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(null);

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* LOGO */}
        <img
          src="/logo/oshiro-logo-compact-3.png"
          alt="OshirO"
          style={styles.logo}
        />

        {/* TITLE */}
        <h1 style={styles.title}>Welcome to OshirO</h1>
        <p style={styles.subtitle}>
          Discover nearby shops, offers & services
        </p>

        {/* CUSTOMER */}
        <button
          style={{
            ...styles.button,
            background: hovered === "customer" ? "#1d4ed8" : "#2563eb",
          }}
          onMouseEnter={() => setHovered("customer")}
          onMouseLeave={() => setHovered(null)}
          onClick={() => navigate("/customer-login")}
        >
          Continue as Customer
        </button>

        {/* MERCHANT */}
        <button
          style={{
            ...styles.button,
            background: hovered === "merchant" ? "#15803d" : "#16a34a",
          }}
          onMouseEnter={() => setHovered("merchant")}
          onMouseLeave={() => setHovered(null)}
          onClick={() => navigate("/merchant/login")}
        >
          Continue as Merchant
        </button>

        {/* ADMIN */}
        <button
          style={{
            ...styles.button,
            background: hovered === "admin" ? "#020617" : "#0f172a",
          }}
          onMouseEnter={() => setHovered("admin")}
          onMouseLeave={() => setHovered(null)}
          onClick={() => navigate("/admin-login")}
        >
          Admin Login
        </button>

        {/* FOOTER NOTE */}
        <p style={styles.footer}>
          Secure. Simple. Local-first platform.
        </p>
      </div>
    </div>
  );
}

/* ================= STYLES ================= */

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(180deg, #f8fafc, #eef2ff)",
    padding: 16,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    background: "#ffffff",
    borderRadius: 18,
    padding: 36,
    textAlign: "center",
    boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
    transition: "transform 0.2s ease",
  },
  logo: {
    height: 64,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    marginBottom: 8,
    color: "#111827",
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 32,
  },
  button: {
    width: "100%",
    height: 50,
    borderRadius: 12,
    border: "none",
    color: "#ffffff",
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer",
    marginBottom: 14,
    transition: "all 0.2s ease",
  },
  footer: {
    marginTop: 12,
    fontSize: 12,
    color: "#9ca3af",
  },
};