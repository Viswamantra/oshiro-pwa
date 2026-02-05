import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <img
          src="/logo/oshiro-logo-compact-3.png"
          alt="OshirO"
          style={styles.logo}
        />

        <h1 style={styles.title}>Welcome to OshirO</h1>
        <p style={styles.subtitle}>
          Discover nearby shops, offers & services
        </p>

        {/* CUSTOMER */}
        <button
          style={{ ...styles.button, background: "#2563eb" }}
          onClick={() => navigate("/customer-login")}
        >
          Continue as Customer
        </button>

        {/* MERCHANT */}
        <button
          style={{ ...styles.button, background: "#16a34a" }}
          onClick={() => navigate("/merchant/login")}
        >
          Continue as Merchant
        </button>

        {/* ADMIN */}
        <button
          style={{ ...styles.button, background: "#0f172a" }}
          onClick={() => navigate("/admin-login")}
        >
          Admin Login
        </button>
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
    maxWidth: 380,
    background: "#fff",
    borderRadius: 16,
    padding: 32,
    textAlign: "center",
    boxShadow: "0 16px 32px rgba(0,0,0,0.1)",
  },
  logo: {
    height: 60,
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 700,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 28,
  },
  button: {
    width: "100%",
    height: 48,
    borderRadius: 10,
    border: "none",
    color: "#fff",
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer",
    marginBottom: 12,
  },
};
