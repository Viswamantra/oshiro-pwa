import React, { useEffect, useState } from "react";
import { Phone, MessageCircle, Navigation } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase";

/**
 * =========================================================
 * MERCHANT LIST (CUSTOMER) — FINAL FIX
 * ---------------------------------------------------------
 * ✔ Firestore connected (works on localhost + prod)
 * ✔ Correct field mapping (fixes "Unnamed Shop")
 * ✔ ALL category works correctly
 * ✔ Distance filter supports 300 m + km
 * ✔ Call / WhatsApp / Google Maps actions
 * ✔ Open / Closed badge
 * =========================================================
 */

export default function MerchantList({ category, distanceKm }) {
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ======================
     FETCH MERCHANTS
  ====================== */
  useEffect(() => {
    const fetchMerchants = async () => {
      try {
        const snap = await getDocs(collection(db, "merchants"));

        const data = snap.docs.map((d) => {
          const m = d.data();

          return {
            id: d.id,

            /* ===== NAME (REAL FIX) ===== */
            name:
              m.name ||
              m.shopName ||
              m.storeName ||
              m.businessName ||
              m.merchantName ||
              "Unnamed Shop",

            /* ===== CONTACT ===== */
            phone:
              m.phone ||
              m.mobile ||
              m.phoneNumber ||
              "",

            /* ===== CATEGORY ===== */
            category:
              (m.category || "All").toLowerCase(),

            /* ===== STATUS ===== */
            isOpen:
              m.isOpen ??
              m.isOpenNow ??
              true,

            /* ===== OFFER ===== */
            offerText:
              m.offerText ||
              m.offer ||
              "Offers available",

            /* ===== LOCATION ===== */
            lat:
              m.lat ||
              m.location?.lat ||
              null,
            lng:
              m.lng ||
              m.location?.lng ||
              null,

            /* ===== DISTANCE (OPTIONAL) ===== */
            distanceKm: m.distanceKm, // may be undefined
          };
        });

        setMerchants(data);
      } catch (err) {
        console.error("Merchant fetch failed", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMerchants();
  }, []);

  /* ======================
     FILTER LOGIC (FINAL)
  ====================== */
  const filteredMerchants = merchants.filter((m) => {
    // ✅ Category: allow ALL
    if (
      category &&
      category !== "All" &&
      m.category !== category.toLowerCase()
    ) {
      return false;
    }

    // ✅ Distance: allow merchants without distance
    if (typeof m.distanceKm === "number") {
      return m.distanceKm <= distanceKm;
    }

    return true;
  });

  /* ======================
     STATES
  ====================== */
  if (loading) {
    return <p style={{ color: "#6b7280" }}>Loading merchants…</p>;
  }

  if (filteredMerchants.length === 0) {
    return (
      <div style={styles.empty}>
        <p>No nearby merchants yet</p>
        <span>We’re expanding rapidly in your area 👋</span>
      </div>
    );
  }

  /* ======================
     RENDER
  ====================== */
  return (
    <div style={styles.list}>
      {filteredMerchants.map((m) => (
        <div key={m.id} style={styles.card}>
          {/* HEADER */}
          <div style={styles.header}>
            <h4 style={styles.name}>{m.name}</h4>

            <span
              style={{
                ...styles.status,
                background: m.isOpen ? "#dcfce7" : "#fee2e2",
                color: m.isOpen ? "#166534" : "#991b1b",
              }}
            >
              {m.isOpen ? "OPEN" : "CLOSED"}
            </span>
          </div>

          {/* OFFER */}
          <p style={styles.offer}>{m.offerText}</p>

          {/* ACTIONS */}
          <div style={styles.actions}>
            {m.phone && (
              <>
                <a href={`tel:${m.phone}`} style={styles.icon}>
                  <Phone size={18} />
                </a>

                <a
                  href={`https://wa.me/91${m.phone}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    ...styles.icon,
                    background: "#dcfce7",
                    color: "#166534",
                  }}
                >
                  <MessageCircle size={18} />
                </a>
              </>
            )}

            {m.lat && m.lng && (
              <a
                href={`https://www.google.com/maps?q=${m.lat},${m.lng}`}
                target="_blank"
                rel="noreferrer"
                style={styles.icon}
              >
                <Navigation size={18} />
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ======================
   STYLES
====================== */
const styles = {
  list: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },

  card: {
    padding: 16,
    borderRadius: 14,
    background: "#ffffff",
    boxShadow: "0 8px 18px rgba(0,0,0,0.08)",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  name: {
    fontSize: 16,
    fontWeight: 600,
  },

  status: {
    fontSize: 11,
    fontWeight: 700,
    padding: "4px 8px",
    borderRadius: 12,
  },

  offer: {
    fontSize: 14,
    marginTop: 6,
    marginBottom: 10,
    color: "#065f46",
    fontWeight: 500,
  },

  actions: {
    display: "flex",
    gap: 14,
  },

  icon: {
    width: 42,
    height: 42,
    borderRadius: "50%",
    background: "#f1f5f9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#0f172a",
    textDecoration: "none",
  },

  empty: {
    padding: 24,
    textAlign: "center",
    color: "#6b7280",
    fontSize: 14,
  },
};
