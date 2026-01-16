import React from "react";
import { useNavigate } from "react-router-dom";
import HoverActions from "../../components/HoverActions";

/**
 * =========================================================
 * MERCHANT CARD – CUSTOMER MODULE
 * ---------------------------------------------------------
 * ✔ Card click → Merchant Details
 * ✔ Icons work independently
 * ✔ No bubbling / no redirect bugs
 * ✔ Keyboard & mobile friendly
 * =========================================================
 */

export default function MerchantCard({ merchant }) {
  const navigate = useNavigate();

  /* ======================
     OPEN DETAILS
  ====================== */
  const openDetails = () => {
    if (!merchant?.id) return;
    navigate(`/customer/merchant/${merchant.id}`);
  };

  return (
    <div
      className="merchant-card"
      role="button"
      tabIndex={0}
      aria-label={`Open details for ${merchant.shopName}`}
      onClick={openDetails}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openDetails();
        }
      }}
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 14,
        marginBottom: 12,
        borderRadius: 10,
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
          ACTIONS (NO BUBBLING)
      ====================== */}
      <div
        className="merchant-actions"
        role="presentation"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
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
