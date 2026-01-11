import React from "react";
import HoverActions from "../../components/HoverActions";

/**
 * =========================================================
 * MERCHANT CARD – CUSTOMER MODULE (MOBILE-FIRST)
 * ---------------------------------------------------------
 * • Compact layout
 * • No hover dependency
 * • Tap-friendly actions
 * =========================================================
 */

export default function MerchantCard({ merchant }) {
  return (
    <div className="merchant-card">
      {/* ======================
          MERCHANT INFO
      ====================== */}
      <div className="merchant-info">
        <h4>{merchant.shopName}</h4>
        <span>{merchant.category}</span>
      </div>

      {/* ======================
          ACTIONS
      ====================== */}
      <div className="merchant-actions">
        <HoverActions
          mobile={merchant.mobile}
          lat={merchant.lat}
          lng={merchant.lng}
        />
      </div>
    </div>
  );
}
