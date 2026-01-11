import React from "react";
import { Outlet, useNavigate, NavLink } from "react-router-dom";

export default function MerchantLayout() {
  const navigate = useNavigate();

  /* ======================
     SAFE MERCHANT LOAD
  ====================== */
  let merchant = null;
  try {
    merchant = JSON.parse(localStorage.getItem("merchant"));
  } catch {
    merchant = null;
  }

  const isApproved = merchant?.status === "approved";

  const logout = () => {
    localStorage.removeItem("merchant");
    navigate("/merchant/login", { replace: true });
  };

  return (
    <div>
      {/* ======================
          HEADER
      ====================== */}
      <header
        style={{
          padding: 12,
          background: "#1976d2",
          color: "#fff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <strong>
          Merchant Panel
          {merchant?.name ? ` – ${merchant.name}` : ""}
          {!isApproved && (
            <span style={{ fontSize: 12, marginLeft: 8 }}>
              (Pending Approval)
            </span>
          )}
        </strong>

        <button onClick={logout}>Logout</button>
      </header>

      {/* ======================
          NAVIGATION
      ====================== */}
      <nav
        style={{
          display: "flex",
          gap: 15,
          padding: 12,
          background: "#f5f5f5",
        }}
      >
        <NavLink to="/merchant" end style={linkStyle}>
          Dashboard
        </NavLink>

        <NavLink to="/merchant/offers" style={linkStyle}>
          Offers
        </NavLink>

        {/* 🔥 GPS LOCATION – ONLY AFTER APPROVAL */}
        {isApproved && (
          <NavLink to="/merchant/location" style={linkStyle}>
            📍 Location
          </NavLink>
        )}

        <NavLink to="/merchant/profile" style={linkStyle}>
          Profile
        </NavLink>
      </nav>

      {/* ======================
          CONTENT
      ====================== */}
      <main style={{ padding: 20 }}>
        <Outlet />
      </main>
    </div>
  );
}

/* ======================
   LINK STYLES
====================== */
const linkStyle = ({ isActive }) => ({
  textDecoration: "none",
  fontWeight: isActive ? "bold" : "normal",
  color: isActive ? "#1976d2" : "#333",
});
