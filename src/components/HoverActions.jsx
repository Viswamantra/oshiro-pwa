import React from "react";

/**
 * =========================================================
 * HOVER ACTIONS – CUSTOMER MODULE
 * ---------------------------------------------------------
 * Displays:
 * 📞 Call | 🗺️ Google Maps | 💬 WhatsApp
 * Shown on MerchantCard hover
 * =========================================================
 */

export default function HoverActions({ mobile, lat, lng }) {
  // Normalize mobile (remove spaces / +91 if already present)
  const cleanMobile =
    typeof mobile === "string"
      ? mobile.replace(/\D/g, "").slice(-10)
      : null;

  // Nothing to show
  if (!cleanMobile && (lat == null || lng == null)) {
    return null;
  }

  return (
    <div style={styles.container}>
      {/* 📞 CALL MERCHANT */}
      {cleanMobile && (
        <a
          href={`tel:${cleanMobile}`}
          title="Call Merchant"
          style={styles.icon}
        >
          📞
        </a>
      )}

      {/* 🗺️ GOOGLE MAPS */}
      {lat != null && lng != null && (
        <a
          href={`https://www.google.com/maps?q=${lat},${lng}`}
          target="_blank"
          rel="noreferrer"
          title="Open in Google Maps"
          style={styles.icon}
        >
          🗺️
        </a>
      )}

      {/* 💬 WHATSAPP */}
      {cleanMobile && (
        <a
          href={`https://wa.me/91${cleanMobile}`}
          target="_blank"
          rel="noreferrer"
          title="Chat on WhatsApp"
          style={styles.icon}
        >
          💬
        </a>
      )}
    </div>
  );
}

/* ======================
   STYLES
====================== */

const styles = {
  container: {
    display: "flex",
    gap: 12,
    alignItems: "center",
  },
  icon: {
    fontSize: 20,
    textDecoration: "none",
    cursor: "pointer",
    transition: "transform 0.15s ease",
  },
};
