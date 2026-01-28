
import { NavLink } from "react-router-dom";

const links = [
  { to: "/admin", label: "Dashboard" },
  { to: "/admin/merchants", label: "Merchants" },
  { to: "/admin/customers", label: "Customers" },
  { to: "/admin/categories", label: "Categories" },
  { to: "/admin/offers", label: "Offers" },
  { to: "/admin/geo-alerts", label: "Geo Alerts" },
  { to: "/admin/notifications", label: "Notifications" },
];

export default function Sidebar() {
  return (
    <aside
      className="admin-sidebar"
      style={{
        width: 240,
        background: "#111827",
        color: "#fff",
        padding: 20,
      }}
    >
      <h2 style={{ marginBottom: 20 }}>OshirO Admin</h2>
      {links.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          style={({ isActive }) => ({
            display: "block",
            padding: "10px 12px",
            marginBottom: 8,
            borderRadius: 6,
            textDecoration: "none",
            color: isActive ? "#111827" : "#fff",
            background: isActive ? "#fff" : "transparent",
            fontWeight: 500,
          })}
        >
          {l.label}
        </NavLink>
      ))}
    </aside>
  );
}
