import { NavLink, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import oshiroLogo from "../assets/logo/oshiro-logo-icon.png";

/**
 * =========================================================
 * ADMIN SIDEBAR (FINAL / PRODUCTION)
 * ---------------------------------------------------------
 * ✔ Stable on Vercel
 * ✔ Logo + Navigation
 * ✔ Logout at bottom (persistent)
 * ✔ Clears admin session safely
 * =========================================================
 */

export default function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      if (auth?.currentUser) {
        await signOut(auth);
      }
    } catch (err) {
      console.error("Admin logout error:", err);
    } finally {
      // Clear admin session
      localStorage.removeItem("admin_mobile");
      localStorage.removeItem("admin_password");

      navigate("/admin/login", { replace: true });
    }
  };

  return (
    <aside className="admin-sidebar">
      {/* TOP: LOGO + NAV */}
      <div>
        <div className="admin-logo-container">
          <img
            src={oshiroLogo}
            alt="Oshiro"
            className="admin-logo-image"
          />
        </div>

        <nav>
          <NavItem to="/admin" label="Dashboard" end />
          <NavItem to="/admin/customers" label="Customers" />
          <NavItem to="/admin/merchants" label="Merchants" />
          <NavItem to="/admin/categories" label="Categories" />
          <NavItem to="/admin/offers" label="Offers" />
          <NavItem to="/admin/geo-alerts" label="Geo Alerts" />
          <NavItem to="/admin/notifications" label="Notifications" />
        </nav>
      </div>

      {/* BOTTOM: LOGOUT */}
      <button className="admin-logout" onClick={handleLogout}>
        Logout
      </button>
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
