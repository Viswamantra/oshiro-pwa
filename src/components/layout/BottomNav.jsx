// src/components/layout/BottomNav.jsx
import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function BottomNav() {
  const location = useLocation();

  const isActive = (path) =>
    location.pathname === path ? { color: "#007AFF", fontWeight: "600" } : {};

  return (
    <footer
      style={{
        borderTop: "1px solid #eee",
        padding: "0.5rem 1rem",
        display: "flex",
        justifyContent: "space-around",
        background: "#fff",
      }}
    >
      <Link to="/" style={{ textDecoration: "none", color: "#666", ...isActive("/") }}>
        Home
      </Link>
      <Link
        to="/merchant"
        style={{ textDecoration: "none", color: "#666", ...isActive("/merchant") }}
      >
        Merchant
      </Link>
    </footer>
  );
}
