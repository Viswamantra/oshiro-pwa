import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";

/**
 * =========================================================
 * MERCHANT DETAILS (CUSTOMER)
 * ---------------------------------------------------------
 * ✔ URL-safe (refresh proof)
 * ✔ Firestore fetch by ID
 * ✔ No Home redirect bugs
 * ✔ Mobile-first UX
 * =========================================================
 */

export default function MerchantDetails() {
  const navigate = useNavigate();
  const { merchantId } = useParams(); // ✅ MUST match App.jsx
  const [merchant, setMerchant] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ======================
     FETCH MERCHANT
  ====================== */
  useEffect(() => {
    let mounted = true;

    async function fetchMerchant() {
      try {
        const ref = doc(db, "merchants", merchantId);
        const snap = await getDoc(ref);

        if (snap.exists() && mounted) {
          setMerchant(snap.data());
        }
      } catch (err) {
        console.error("Failed to load merchant:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    if (merchantId) fetchMerchant();

    return () => {
      mounted = false;
    };
  }, [merchantId]);

  /* ======================
     UI STATES
  ====================== */
  if (loading) {
    return (
      <div style={{ padding: 20 }}>
        <p>Loading merchant details…</p>
      </div>
    );
  }

  if (!merchant) {
    return (
      <div style={{ padding: 20 }}>
        <p>Merchant not found.</p>
        <div
          onClick={() => navigate("/customer")}
          style={styles.back}
        >
          ← Back to merchants
        </div>
      </div>
    );
  }

  /* ======================
     DATA
  ====================== */
  const phone = `+91${merchant.mobile}`;
  const whatsappLink = `https://wa.me/91${merchant.mobile}`;
  const mapLink = `https://www.google.com/maps?q=${merchant.lat},${merchant.lng}`;

  /* ======================
     RENDER
  ====================== */
  return (
    <div style={{ padding: 16 }}>
      {/* BACK */}
      <div onClick={() => navigate(-1)} style={styles.back}>
        ← Back
      </div>

      {/* INFO */}
      <h2>{merchant.shopName}</h2>
      <p style={{ color: "#555" }}>{merchant.category}</p>

      {/* OFFER */}
      {merchant.offer && (
        <div style={styles.card}>
          <h4>🎁 Offer</h4>
          <p>{merchant.offer}</p>
        </div>
      )}

      {/* ACTIONS */}
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
      {merchant.lat && merchant.lng && (
        <>
          <div style={styles.mapBox}>
            <iframe
              title="map"
              width="100%"
              height="200"
              style={{ border: 0, borderRadius: 8 }}
              loading="lazy"
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
        </>
      )}
    </div>
  );
}

/* ======================
   STYLES
====================== */
const styles = {
  back: {
    marginBottom: 12,
    color: "#2563eb",
    cursor: "pointer",
    fontSize: 14,
  },
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
