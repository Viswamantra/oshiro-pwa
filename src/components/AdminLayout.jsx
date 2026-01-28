import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

/**
 * =========================================================
 * ADMIN LAYOUT (STABLE + PRODUCTION READY)
 * ---------------------------------------------------------
 * ✔ Persistent sidebar
 * ✔ Header stays visible
 * ✔ Outlet renders admin pages correctly
 * ✔ Safe logout (Firebase + localStorage)
 * =========================================================
 */

export default function AdminLayout() {
  const navigate = useNavigate();

  const logout = async () => {
    try {
      if (auth?.currentUser) {
        await signOut(auth);
      }
    } catch (err) {
      console.error("Admin logout error:", err);
    } finally {
      // Clear admin-related session only
      localStorage.removeItem("admin_mobile");
      localStorage.removeItem("admin_password");

      navigate("/admin/login", { replace: true });
    }
  };

  return (
    <div className="admin-wrapper">
      {/* ======================
          SIDEBAR
      ====================== */}
      <aside className="admin-sidebar">
        <div>
          <h2 className="admin-logo">OSHIRO</h2>

          <nav className="admin-nav">
            <NavItem to="/admin" label="Dashboard" end />
            <NavItem to="/admin/customers" label="Customers" />
            <NavItem to="/admin/merchants" label="Merchants" />
            <NavItem to="/admin/merchant-approval" label="Merchant Approval" />
            <NavItem to="/admin/categories" label="Categories" />
            <NavItem to="/admin/offers" label="Offers" />
            <NavItem to="/admin/geo-alerts" label="Geo Alerts" />
            <NavItem to="/admin/notifications" label="Notifications" />
          </nav>
        </div>

        <button className="admin-logout" onClick={logout}>
          Logout
        </button>
      </aside>

      {/* ======================
          MAIN CONTENT
      ====================== */}
      <div className="admin-main">
        <header className="admin-header">
          <h3>Admin Panel</h3>
        </header>

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
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
      className={({ isActive }) =>
        `admin-nav-item ${isActive ? "active" : ""}`
      }
    >
      {label}
    </NavLink>
  );
}
