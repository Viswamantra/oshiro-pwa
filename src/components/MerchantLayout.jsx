import React from "react";
import { Outlet, NavLink } from "react-router-dom";
import { clearActiveRole } from "../utils/activeRole";

/**
 * =========================================================
 * MERCHANT LAYOUT
 * ---------------------------------------------------------
 * ✔ UI-only component
 * ✔ Logout clears history (UX-safe)
 * ✔ No auth logic inside layout
 * =========================================================
 */

export default function MerchantLayout() {
  /* ======================
     READ MERCHANT (UI ONLY)
  ====================== */
  let merchant = null;
  try {
    merchant = JSON.parse(localStorage.getItem("merchant"));
  } catch {
    merchant = null;
  }

  const isApproved = merchant?.status === "approved";

  /* ======================
     LOGOUT (HARD RESET)
  ====================== */
  const logout = () => {
    localStorage.removeItem("merchant");
    localStorage.removeItem("mobile");
    clearActiveRole();

    // 🔥 UX-CORRECT: clears browser history
    window.location.replace("/");
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
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
          {merchant?.shopName ? ` – ${merchant.shopName}` : ""}
          {!isApproved && merchant && (
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
          gap: 16,
          padding: 12,
          background: "#f5f5f5",
        }}
      >
        <NavLink to="." end style={linkStyle}>
          Dashboard
        </NavLink>

        <NavLink to="offers" style={linkStyle}>
          Offers
        </NavLink>

        <NavLink to="profile" style={linkStyle}>
          Profile
        </NavLink>

        <NavLink to="location" style={linkStyle}>
          Location
        </NavLink>
      </nav>

      {/* ======================
          CONTENT
      ====================== */}
      <main style={{ padding: 20, flex: 1 }}>
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
