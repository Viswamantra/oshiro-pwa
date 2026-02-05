import { NavLink, useNavigate } from "react-router-dom";

export default function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // clear admin session
    localStorage.removeItem("admin");

    // redirect to login
    navigate("/admin-login", { replace: true });
  };

  return (
    <aside
      style={{
        width: 240,
        background: "#0f172a",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        padding: 20,
      }}
    >
      <h2 style={{ marginBottom: 24 }}>OshirO Admin</h2>

      {/* NAV LINKS */}
      <nav style={{ flex: 1 }}>
        <NavLink style={linkStyle} to="/admin">
          Dashboard
        </NavLink>
        <NavLink style={linkStyle} to="/admin/merchants">
          Merchants
        </NavLink>
        <NavLink style={linkStyle} to="/admin/customers">
          Customers
        </NavLink>
        <NavLink style={linkStyle} to="/admin/categories">
          Categories
        </NavLink>
        <NavLink style={linkStyle} to="/admin/offers">
          Offers
        </NavLink>
        <NavLink style={linkStyle} to="/admin/geo-alerts">
          Geo Alerts
        </NavLink>
        <NavLink style={linkStyle} to="/admin/notifications">
          Notifications
        </NavLink>
      </nav>

      {/* LOGOUT */}
      <button
        onClick={handleLogout}
        style={{
          background: "#dc2626",
          color: "#fff",
          border: "none",
          padding: "10px 14px",
          borderRadius: 8,
          cursor: "pointer",
          fontWeight: 600,
        }}
      >
        Logout
      </button>
    </aside>
  );
}

const linkStyle = ({ isActive }) => ({
  display: "block",
  padding: "10px 12px",
  marginBottom: 8,
  borderRadius: 6,
  textDecoration: "none",
  color: isActive ? "#0f172a" : "#fff",
  background: isActive ? "#fff" : "transparent",
  fontWeight: 500,
});
