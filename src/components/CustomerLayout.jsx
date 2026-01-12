import React from "react";
import { Outlet, useNavigate, NavLink } from "react-router-dom";

/**
 * =========================================================
 * CUSTOMER LAYOUT (MOBILE-FIRST) – FINAL FIX
 * ---------------------------------------------------------
 * ✔ No auto redirects
 * ✔ Stable routing
 * ✔ Bottom nav does NOT intercept content clicks
 * ✔ Mobile-safe z-index & spacing
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
    <div
      className="customer-layout"
      style={{
        minHeight: "100vh",
        background: "#f5f5f5",
      }}
    >
      {/* ======================
          HEADER
      ====================== */}
      <header
        className="customer-header"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 200,
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
          paddingBottom: 96,       // 🔑 MORE than nav height
          position: "relative",
          zIndex: 150,             // 🔑 ABOVE bottom nav
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
          zIndex: 50,              // 🔑 LOWER than content
        }}
      >
        <NavLink
          to="/customer"
          end
          onClick={(e) => e.stopPropagation()}
          style={({ isActive }) => ({
            textDecoration: "none",
            fontWeight: isActive ? "bold" : "normal",
            color: "#111",
          })}
        >
          🏠 Home
        </NavLink>

        <NavLink
          to="/customer/nearby-offers"
          onClick={(e) => e.stopPropagation()}
          style={({ isActive }) => ({
            textDecoration: "none",
            fontWeight: isActive ? "bold" : "normal",
            color: "#111",
          })}
        >
          📍 Nearby
        </NavLink>
      </nav>
    </div>
  );
}
