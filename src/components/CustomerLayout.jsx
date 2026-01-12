import React from "react";
import { Outlet, useNavigate, NavLink } from "react-router-dom";

/**
 * =========================================================
 * CUSTOMER LAYOUT – HARD FIX (NO MORE JUMPING)
 * ---------------------------------------------------------
 * ✔ Bottom nav CANNOT steal clicks
 * ✔ Content clicks are 100% safe
 * ✔ No routing loops
 * ✔ Mobile-proof
 * =========================================================
 */

export default function CustomerLayout() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("customer_mobile");
    navigate("/customer/login", { replace: true });
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      {/* ================= HEADER ================= */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 1000,
          padding: "12px 16px",
          background: "#fff",
          borderBottom: "1px solid #ddd",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h3 style={{ margin: 0 }}>Nearby Deals</h3>
        <button onClick={logout}>Logout</button>
      </header>

      {/* ================= CONTENT ================= */}
      <main
        style={{
          padding: 16,
          paddingBottom: 120, // BIG buffer
        }}
      >
        <Outlet />
      </main>

      {/* ================= BOTTOM NAV ================= */}
      <nav
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: 56,
          background: "#fff",
          borderTop: "1px solid #ddd",
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",

          /* 🔥 THIS IS THE REAL FIX */
          pointerEvents: "none",
        }}
      >
        <NavLink
          to="/customer"
          end
          style={({ isActive }) => ({
            fontWeight: isActive ? "bold" : "normal",
            textDecoration: "none",
            color: "#000",
            pointerEvents: "auto", // ONLY ICON IS CLICKABLE
          })}
        >
          🏠 Home
        </NavLink>

        <NavLink
          to="/customer/nearby-offers"
          style={({ isActive }) => ({
            fontWeight: isActive ? "bold" : "normal",
            textDecoration: "none",
            color: "#000",
            pointerEvents: "auto", // ONLY ICON IS CLICKABLE
          })}
        >
          📍 Nearby
        </NavLink>
      </nav>
    </div>
  );
}
