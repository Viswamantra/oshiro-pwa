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
  // Nothing to show
  if (!mobile && (lat == null || lng == null)) {
    return null;
  }

  return (
    <div style={styles.container}>
      {/* 📞 CALL */}
      {mobile && (
        <a
          href={`tel:${mobile}`}
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
      {mobile && (
        <a
          href={`https://wa.me/91${mobile}`}
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
