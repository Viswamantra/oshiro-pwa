import React from "react";
import { useNavigate } from "react-router-dom";
import HoverActions from "../../components/HoverActions";

/**
 * =========================================================
 * MERCHANT CARD – CUSTOMER MODULE
 * ---------------------------------------------------------
 * ✔ Schema-aligned (shop_name, category, location)
 * ✔ Card click → Merchant Details
 * ✔ Icons work independently
 * ✔ No bubbling / no redirect bugs
 * ✔ Safe & predictable rendering
 * =========================================================
 */

export default function MerchantCard({ merchant }) {
  const navigate = useNavigate();

  if (!merchant) return null;

  const {
    id,
    shop_name,
    category,
    mobile,
    location,
  } = merchant;

  /* ======================
     HARD GUARDS
  ====================== */
  if (!id || !shop_name || !category) {
    return null; // ❌ never render broken merchants
  }

  /* ======================
     OPEN DETAILS
  ====================== */
  const openDetails = () => {
    navigate(`/customer/merchant/${id}`);
  };

  return (
    <div
      className="merchant-card"
      role="button"
      tabIndex={0}
      aria-label={`Open details for ${shop_name}`}
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
        <h4 style={{ margin: 0 }}>{shop_name}</h4>
        <span style={{ fontSize: 13, color: "#666" }}>
          {category}
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
          mobile={mobile}
          lat={location?.lat}
          lng={location?.lng}
        />
      </div>
    </div>
  );
}
