import React from "react";
import { useNavigate } from "react-router-dom";
import HoverActions from "../../components/HoverActions";

/**
 * =========================================================
 * MERCHANT CARD – CUSTOMER MODULE (MOBILE-FIRST)
 * ---------------------------------------------------------
 * ✔ Tap card → open merchant details
 * ✔ Icons work independently (call / whatsapp / map)
 * ✔ No event bubbling issues
 * ✔ URL-based navigation (no state loss)
 * =========================================================
 */

export default function MerchantCard({ merchant }) {
  const navigate = useNavigate();

  // 🔑 Use ID-based routing instead of state
  const openDetails = () => {
    navigate(`/customer/merchant/${merchant.id}`);
  };

  return (
    <div
      className="merchant-card"
      role="button"
      tabIndex={0}
      onClick={openDetails}
      onKeyDown={(e) => e.key === "Enter" && openDetails()}
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 14,
        marginBottom: 12,
        borderRadius: 8,
        background: "#fff",
        cursor: "pointer",
        boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
      }}
    >
      {/* ======================
          MERCHANT INFO
      ====================== */}
      <div className="merchant-info">
        <h4 style={{ margin: 0 }}>{merchant.shopName}</h4>
        <span style={{ fontSize: 13, color: "#666" }}>
          {merchant.category}
        </span>
      </div>

      {/* ======================
          ACTIONS
          (STOP EVENT BUBBLING)
      ====================== */}
      <div
        className="merchant-actions"
        onClick={(e) => e.stopPropagation()}
        role="presentation"
      >
        <HoverActions
          mobile={merchant.mobile}
          lat={merchant.lat}
          lng={merchant.lng}
        />
      </div>
    </div>
  );
}
