import { NavLink } from "react-router-dom";
import oshiroLogo from "../assets/logo/oshiro-logo-icon.png";

/**
 * =========================================================
 * ADMIN SIDEBAR (PRODUCTION SAFE)
 * ---------------------------------------------------------
 * ✔ Uses scoped CSS classes
 * ✔ Stable on Vercel
 * ✔ Active route highlighting
 * ✔ Logo support
 * =========================================================
 */

export default function Sidebar() {
  return (
    <aside className="admin-sidebar">
      {/* LOGO */}
      <div className="admin-logo-container">
        <img
          src={oshiroLogo}
          alt="Oshiro"
          className="admin-logo-image"
        />
      </div>

      {/* NAVIGATION */}
      <nav>
        <NavItem to="/admin" label="Dashboard" end />
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
   NAV ITEM
====================== */
function NavItem({ to, label, end = false }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `admin-nav-item ${isActive ? "active" : ""}`
      }
    >
      {label}
    </NavLink>
  );
}
