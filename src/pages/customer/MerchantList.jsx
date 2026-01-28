import React from "react";

/**
 * =========================================================
 * MERCHANT LIST (CUSTOMER)
 * ---------------------------------------------------------
 * ✔ Filters by category
 * ✔ Filters by distance
 * ✔ Clean empty state
 * ✔ Firestore-ready structure
 * =========================================================
 */

// 🔹 TEMP DUMMY DATA (replace with Firestore later)
const MERCHANTS = [
  {
    id: "m1",
    name: "Fresh Mart",
    category: "grocery",
    distanceKm: 1.2,
    offer: "10% off on vegetables",
  },
  {
    id: "m2",
    name: "Spice Hub",
    category: "restaurant",
    distanceKm: 2.8,
    offer: "Flat ₹100 off",
  },
  {
    id: "m3",
    name: "HealthPlus Pharmacy",
    category: "pharmacy",
    distanceKm: 4.5,
    offer: "Buy 1 Get 1 Free",
  },
  {
    id: "m4",
    name: "Urban Fashion",
    category: "fashion",
    distanceKm: 6.5,
    offer: "Up to 40% off",
  },
];

export default function MerchantList({
  category,
  distanceKm,
}) {
  /* ======================
     FILTER LOGIC
  ====================== */
  const filteredMerchants = MERCHANTS.filter(
    (m) =>
      (!category || m.category === category) &&
      m.distanceKm <= distanceKm
  );

  /* ======================
     EMPTY STATE
  ====================== */
  if (filteredMerchants.length === 0) {
    return (
      <div style={styles.empty}>
        <p>No merchants found</p>
        <span>Try increasing distance</span>
      </div>
    );
  }

  return (
    <div style={styles.list}>
      {filteredMerchants.map((m) => (
        <div key={m.id} style={styles.card}>
          <div style={styles.header}>
            <h4 style={styles.name}>{m.name}</h4>
            <span style={styles.distance}>
              {m.distanceKm} km
            </span>
          </div>

          <p style={styles.offer}>{m.offer}</p>
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
    gap: 12,
  },

  card: {
    padding: 16,
    borderRadius: 12,
    background: "#ffffff",
    boxShadow: "0 6px 16px rgba(0,0,0,0.08)",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },

  name: {
    fontSize: 16,
    fontWeight: 600,
  },

  distance: {
    fontSize: 12,
    padding: "4px 8px",
    borderRadius: 12,
    background: "#e5f0ff",
    color: "#2563eb",
    fontWeight: 500,
  },

  offer: {
    fontSize: 14,
    color: "#065f46",
    fontWeight: 500,
  },

  empty: {
    padding: 24,
    textAlign: "center",
    color: "#6b7280",
    fontSize: 14,
  },
};
