import React from "react";
import { Outlet, useNavigate } from "react-router-dom";

/**
 * =========================================================
 * CUSTOMER LAYOUT – BRAND ALIGNED
 * ---------------------------------------------------------
 * ✔ Same logo as Merchant
 * ✔ Clean white header
 * ✔ Friendly greeting
 * ✔ Logout support
 * ✔ Mobile-first
 * =========================================================
 */

export default function CustomerLayout() {
  const navigate = useNavigate();

  const customerName = localStorage.getItem("customerName") || "Customer";

  /* ======================
     LOGOUT
  ====================== */
  const handleLogout = () => {
    localStorage.removeItem("customerName");
    localStorage.removeItem("customerMobile");
    navigate("/customer-login", { replace: true });
  };

  return (
    <div>
      {/* HEADER */}
      <header style={styles.header}>
        <div style={styles.left} onClick={() => navigate("/customer")}>
          <img
            src="/logo/oshiro-logo-compact-3.png"
            alt="OshirO"
            style={styles.logo}
          />
        </div>

        <div style={styles.right}>
          <span style={styles.greeting}>
            Hi {customerName} 👋
          </span>
          <button onClick={handleLogout} style={styles.logout}>
            Logout
          </button>
        </div>
      </header>

      {/* PAGE CONTENT */}
      <main style={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}

/* ======================
   STYLES
====================== */
const styles = {
  header: {
    height: 56,
    padding: "0 16px",
    background: "#ffffff",
    borderBottom: "1px solid #e5e7eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },
  left: {
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
  },
  logo: {
    height: 36,
  },
  right: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  greeting: {
    fontSize: 14,
    fontWeight: 500,
    color: "#111827",
  },
  logout: {
    padding: "6px 14px",
    borderRadius: 20,
    background: "#f1f5f9",
    border: "none",
    color: "#2563eb",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
  },
  main: {
    padding: 16,
    background: "#f8fafc",
    minHeight: "calc(100vh - 56px)",
  },
};
