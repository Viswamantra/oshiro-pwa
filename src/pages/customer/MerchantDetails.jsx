import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";

/**
 * =========================================================
 * MERCHANT DETAILS (CUSTOMER)
 * ---------------------------------------------------------
 * ✔ URL-based routing (no reset issues)
 * ✔ Safe fallback to navigation state
 * ✔ Mobile-first UX
 * =========================================================
 */

export default function MerchantDetails() {
  const navigate = useNavigate();
  const { id } = useParams();              // 🔑 URL param
  const { state } = useLocation();

  const [merchant, setMerchant] = useState(state?.merchant || null);

  /**
   * If user refreshed or landed directly on URL,
   * fetch merchant using ID
   */
  useEffect(() => {
    if (!merchant && id) {
      // ⛳ Replace this with Firestore fetch later
      console.warn("Merchant state missing, fetch by ID:", id);

      // Example placeholder (safe UX)
      // fetchMerchantById(id).then(setMerchant);
    }
  }, [id, merchant]);

  if (!merchant) {
    return (
      <div style={{ padding: 20 }}>
        <p>Loading merchant details…</p>
        <div
          onClick={() => navigate("/customer")}
          style={{
            marginTop: 12,
            color: "#2563eb",
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          ← Back to merchants
        </div>
      </div>
    );
  }

  const phone = `+91${merchant.mobile}`;
  const whatsappLink = `https://wa.me/91${merchant.mobile}`;
  const mapLink = `https://www.google.com/maps?q=${merchant.lat},${merchant.lng}`;

  return (
    <div style={{ padding: 16 }}>
      {/* BACK */}
      <div
        onClick={() => navigate(-1)}
        style={{
          marginBottom: 12,
          color: "#2563eb",
          cursor: "pointer",
          fontSize: 14,
        }}
      >
        ← Back
      </div>

      {/* MERCHANT INFO */}
      <h2>{merchant.shopName}</h2>
      <p style={{ color: "#555" }}>{merchant.category}</p>

      {/* OFFER */}
      {merchant.offer && (
        <div style={styles.card}>
          <h4>🎁 Offer</h4>
          <p>{merchant.offer}</p>
        </div>
      )}

      {/* ACTION BUTTONS */}
      <div style={styles.actions}>
        <a href={`tel:${phone}`} style={styles.call}>
          📞 Call
        </a>

        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          style={styles.whatsapp}
        >
          💬 WhatsApp
        </a>
      </div>

      {/* MAP */}
      <div style={styles.mapBox}>
        <iframe
          title="map"
          width="100%"
          height="200"
          style={{ border: 0, borderRadius: 8 }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          src={`https://www.google.com/maps?q=${merchant.lat},${merchant.lng}&output=embed`}
        />
      </div>

      <a
        href={mapLink}
        target="_blank"
        rel="noopener noreferrer"
        style={styles.mapLink}
      >
        🗺️ Open in Google Maps
      </a>
    </div>
  );
}

/* ======================
   STYLES
====================== */
const styles = {
  card: {
    marginTop: 16,
    padding: 14,
    border: "1px solid #eee",
    borderRadius: 8,
    background: "#fafafa",
  },
  actions: {
    display: "flex",
    gap: 12,
    marginTop: 20,
  },
  call: {
    flex: 1,
    padding: 12,
    textAlign: "center",
    borderRadius: 8,
    background: "#16a34a",
    color: "#fff",
    textDecoration: "none",
    fontWeight: 500,
  },
  whatsapp: {
    flex: 1,
    padding: 12,
    textAlign: "center",
    borderRadius: 8,
    background: "#25D366",
    color: "#fff",
    textDecoration: "none",
    fontWeight: 500,
  },
  mapBox: {
    marginTop: 20,
  },
  mapLink: {
    display: "block",
    marginTop: 10,
    textAlign: "center",
    color: "#2563eb",
    textDecoration: "none",
    fontWeight: 500,
  },
};
