// src/components/merchants/MerchantCard.jsx
import React from "react";

export default function MerchantCard({ merchant, isInside }) {
  return (
    <div
      style={{
        borderRadius: "8px",
        border: isInside ? "2px solid #007AFF" : "1px solid #ddd",
        padding: "0.75rem",
        marginBottom: "0.5rem",
        background: "#fff",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      <div style={{ fontWeight: 600 }}>{merchant.name}</div>
      <div style={{ fontSize: "0.85rem", color: "#666" }}>{merchant.category}</div>
      <div style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>
        Radius: {merchant.radiusMeters} m
      </div>
      {merchant.offer && (
        <div
          style={{
            marginTop: "0.4rem",
            fontSize: "0.85rem",
            color: "#007A3D",
            fontWeight: 500,
          }}
        >
          {merchant.offer}
        </div>
      )}
      {isInside && (
        <div
          style={{
            marginTop: "0.4rem",
            fontSize: "0.8rem",
            color: "#FF3B30",
            fontWeight: 600,
          }}
        >
          You are inside this geofence 🎯
        </div>
      )}
    </div>
  );
}
