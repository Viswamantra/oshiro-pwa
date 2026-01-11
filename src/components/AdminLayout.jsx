import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

/**
 * =========================================================
 * ADMIN LAYOUT
 * ---------------------------------------------------------
 * Sidebar + Header + Protected Admin Content
 * Logout clears localStorage + Firebase session (if any)
 * =========================================================
 */

export default function AdminLayout() {
  const navigate = useNavigate();

  const logout = async () => {
    try {
      // Firebase logout (safe in dev mode)
      if (auth?.currentUser) {
        await signOut(auth);
      }
    } catch (error) {
      console.error("Firebase logout error:", error);
    } finally {
      // Clear ALL session data
      localStorage.removeItem("admin_mobile");
      localStorage.removeItem("admin_password");
      localStorage.removeItem("customer_mobile");

      navigate("/admin/login", { replace: true });
    }
  };

  return (
    <div style={styles.wrapper}>
      {/* ======================
          SIDEBAR
      ====================== */}
      <aside style={styles.sidebar}>
        <h2 style={styles.logo}>OSHIRO</h2>

        <nav style={styles.nav}>
          <NavItem to="/admin" label="Home" end />
          <NavItem to="/admin/customers" label="Customers" />
          <NavItem to="/admin/merchants" label="Merchants" />
          <NavItem to="/admin/categories" label="Categories" />
          <NavItem to="/admin/offers" label="Offers" />
          <NavItem to="/admin/geo-alerts" label="Geo Alerts" />
          <NavItem to="/admin/notifications" label="Notifications" />
        </nav>

        <button onClick={logout} style={styles.logout}>
          Logout
        </button>
      </aside>

      {/* ======================
          MAIN CONTENT
      ====================== */}
      <main style={styles.main}>
        <header style={styles.header}>
          <h3>Admin Panel</h3>
        </header>

        <section style={styles.content}>
          <Outlet />
        </section>
      </main>
    </div>
  );
}

/* ======================
   NAV ITEM
====================== */
function NavItem({ to, label, end = false }) {
  return (
    <NavLink
      to={to}
      end={end}
      style={({ isActive }) => ({
        ...styles.navItem,
        backgroundColor: isActive ? "#1976d2" : "transparent",
        color: isActive ? "#fff" : "#ddd",
      })}
    >
      {label}
    </NavLink>
  );
}

/* ======================
   STYLES
====================== */
const styles = {
  wrapper: {
    display: "flex",
    minHeight: "100vh",
    background: "#f4f6f8",
    fontFamily: "Arial, sans-serif",
  },
  sidebar: {
    width: 240,
    background: "#1e1e2f",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    padding: 20,
  },
  logo: {
    marginBottom: 30,
    textAlign: "center",
    letterSpacing: 1,
  },
  nav: {
    flex: 1,
  },
  navItem: {
    display: "block",
    padding: "12px 15px",
    borderRadius: 6,
    textDecoration: "none",
    marginBottom: 8,
    fontWeight: 500,
    transition: "all 0.2s ease",
  },
  logout: {
    padding: 12,
    border: "none",
    background: "#c62828",
    color: "#fff",
    cursor: "pointer",
    borderRadius: 6,
    fontWeight: "bold",
  },
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  header: {
    height: 60,
    background: "#fff",
    borderBottom: "1px solid #ddd",
    padding: "0 20px",
    display: "flex",
    alignItems: "center",
  },
  content: {
    padding: 20,
    overflowY: "auto",
  },
};
