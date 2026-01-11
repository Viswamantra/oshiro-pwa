import React from "react";
import { Outlet, useNavigate, NavLink } from "react-router-dom";

/**
 * =========================================================
 * CUSTOMER LAYOUT (MOBILE-FIRST) – FIXED
 * ---------------------------------------------------------
 * ✔ NO session guard here (handled by ProtectedRoute)
 * ✔ Sticky header
 * ✔ Bottom navigation
 * ✔ Stable (no redirect loops)
 * =========================================================
 */

export default function CustomerLayout() {
  const navigate = useNavigate();

  /* ======================
     LOGOUT (EXPLICIT ONLY)
  ====================== */
  const logout = () => {
    localStorage.removeItem("customer_mobile");
    navigate("/customer/login", { replace: true });
  };

  return (
    <div className="customer-layout">
      {/* ======================
          HEADER
      ====================== */}
      <header
        className="customer-header"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          padding: "12px 16px",
          background: "#ffffff",
          borderBottom: "1px solid #ddd",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h3 style={{ margin: 0 }}>Nearby Deals</h3>
        <button
          onClick={logout}
          style={{
            padding: "6px 12px",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </header>

      {/* ======================
          PAGE CONTENT
      ====================== */}
      <main
        className="customer-content"
        style={{
          padding: 16,
          paddingBottom: 70, // space for bottom nav
        }}
      >
        <Outlet />
      </main>

      {/* ======================
          BOTTOM NAVIGATION
      ====================== */}
      <nav
        className="customer-nav"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: 56,
          background: "#ffffff",
          borderTop: "1px solid #ddd",
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
        }}
      >
        <NavLink
          to="/customer"
          end
          style={({ isActive }) => ({
            textDecoration: "none",
            fontWeight: isActive ? "bold" : "normal",
          })}
        >
          🏠 Home
        </NavLink>

        <NavLink
          to="/customer/nearby-offers"
          style={({ isActive }) => ({
            textDecoration: "none",
            fontWeight: isActive ? "bold" : "normal",
          })}
        >
          📍 Nearby
        </NavLink>
      </nav>
    </div>
  );
}
