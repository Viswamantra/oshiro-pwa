import React from "react";
import { useNavigate } from "react-router-dom";
import HoverActions from "../../components/HoverActions";

/**
 * =========================================================
 * MERCHANT CARD – CUSTOMER MODULE (MOBILE-FIRST)
 * ---------------------------------------------------------
 * ✔ Tap card → open merchant details
 * ✔ Icons still work (call / whatsapp / map)
 * ✔ Mobile-first (no hover dependency)
 * =========================================================
 */

export default function MerchantCard({ merchant }) {
  const navigate = useNavigate();

  const openDetails = () => {
    navigate("/customer/merchant", {
      state: { merchant },
    });
  };

  return (
    <div
      className="merchant-card"
      onClick={openDetails}
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
          (prevent card click)
      ====================== */}
      <div
        className="merchant-actions"
        onClick={(e) => e.stopPropagation()}
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
