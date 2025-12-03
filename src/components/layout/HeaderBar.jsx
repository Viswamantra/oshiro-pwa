// src/components/layout/HeaderBar.jsx
import React from "react";
import { useLocation, Link } from "react-router-dom";

export default function HeaderBar() {
  const location = useLocation();
  const isMerchant = location.pathname.startsWith("/merchant");

  return (
    <header
      style={{
        padding: "0.75rem 1rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid #eee",
        background: "#ffffff",
      }}
    >
      <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "#007AFF" }}>
        OshirO
      </div>
      <nav style={{ fontSize: "0.9rem" }}>
        {isMerchant ? (
          <Link to="/" style={{ textDecoration: "none", color: "#333" }}>
            Customer View
          </Link>
        ) : (
          <Link to="/merchant" style={{ textDecoration: "none", color: "#333" }}>
            Merchant Panel
          </Link>
        )}
      </nav>
    </header>
  );
}
