import { NavLink } from "react-router-dom";

/**
 * =========================================================
 * ADMIN SIDEBAR
 * ---------------------------------------------------------
 * Left navigation for Admin panel
 * =========================================================
 */

export default function Sidebar() {
  return (
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
    </aside>
  );
}

/* ======================
   SINGLE NAV ITEM
====================== */
function NavItem({ to, label, end = false }) {
  return (
    <NavLink
      to={to}
      end={end}
      style={({ isActive }) => ({
        ...styles.navItem,
        backgroundColor: isActive ? "#1976d2" : "transparent",
        color: isActive ? "#ffffff" : "#d0d0d0"
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
  sidebar: {
    width: 240,
    backgroundColor: "#1e1e2f",
    color: "#ffffff",
    padding: 20,
    display: "flex",
    flexDirection: "column",
  },
  logo: {
    marginBottom: 30,
    textAlign: "center",
    letterSpacing: 1,
    fontWeight: "bold",
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  navItem: {
    padding: "12px 16px",
    borderRadius: 6,
    textDecoration: "none",
    fontWeight: 500,
    transition: "background-color 0.2s ease",
  },
};
