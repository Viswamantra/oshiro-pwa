import React, { useEffect, useRef, useState } from "react";
import { fetchNearbyMerchants } from "../../firebase/barrel";
import { createLead, LEAD_TYPES } from "../../firebase/leads";

/**
 * =========================================================
 * CUSTOMER DASHBOARD – MOBILE FIRST (PHASE 2.7 – ROW 1)
 * ---------------------------------------------------------
 * ✔ Category + Distance (top)
 * ✔ Mobile-first cards
 * ✔ Call / WhatsApp / Navigation
 * ✔ OPEN / CLOSED status
 * ✔ GEO-ENTER lead trigger (NEW)
 * =========================================================
 */

const DISTANCES = [
  { label: "300 m", value: 300 },
  { label: "1 km", value: 1000 },
  { label: "3 km", value: 3000 },
  { label: "5 km", value: 5000 },
  { label: "10 km", value: 10000 },
];

export default function CustomerDashboard() {
  const customerName =
    localStorage.getItem("customerName") || "Customer";
  const customerMobile =
    localStorage.getItem("customerMobile") || null;
  const customerId =
    localStorage.getItem("customerId") || null;

  const [category, setCategory] = useState("");
  const [distance, setDistance] = useState(3000);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ======================
     GEO SESSION GUARD (NEW)
  ====================== */
  const geoTriggeredRef = useRef(new Set());

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      const data = await fetchNearbyMerchants({
        category,
        distance,
      });

      if (mounted) {
        setShops(Array.isArray(data) ? data : []);
        setLoading(false);
      }
    }

    load();
    return () => (mounted = false);
  }, [category, distance]);

  /* ======================
     GEO-ENTER LEAD TRIGGER
     (Phase 2.7 – Row 1)
  ====================== */
  useEffect(() => {
    if (!customerMobile || shops.length === 0) return;

    shops.forEach((shop) => {
      if (!shop.id) return;

      // One geo-lead per merchant per session
      if (geoTriggeredRef.current.has(shop.id)) return;

      createLead({
        merchantId: shop.id,
        customerMobile,
        customerId,
        customerName,
        type: LEAD_TYPES.GEO_ENTER,
        distance,
        source: "customer",
      });

      geoTriggeredRef.current.add(shop.id);
    });
  }, [shops, distance, customerMobile, customerId, customerName]);

  return (
    <div>
      {/* HERO */}
      <section style={styles.hero}>
        <h2 style={styles.greeting}>
          Hi {customerName} 👋
        </h2>
        <p style={styles.subText}>
          Discover nearby shops and exclusive local offers
        </p>
      </section>

      {/* FILTERS */}
      <section style={styles.filters}>
        <label style={styles.label}>Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={styles.select}
        >
          <option value="">All</option>
          <option value="Food">Food</option>
          <option value="Grocery">Grocery</option>
          <option value="Pharmacy">Pharmacy</option>
          <option value="Fashion">Fashion</option>
        </select>

        <label style={styles.label}>Distance</label>
        <div style={styles.distanceRow}>
          {DISTANCES.map((d) => (
            <button
              key={d.value}
              onClick={() => setDistance(d.value)}
              style={{
                ...styles.distanceBtn,
                ...(distance === d.value
                  ? styles.active
                  : {}),
              }}
            >
              {d.label}
            </button>
          ))}
        </div>
      </section>

      {/* LIST */}
      <section>
        <h3 style={styles.sectionTitle}>
          Nearby Shops
        </h3>

        {loading && (
          <p style={styles.helper}>Loading…</p>
        )}

        {!loading &&
          shops.map((shop) => {
            const isOpen = shop.isOpen !== false;

            return (
              <div key={shop.id} style={styles.card}>
                <div style={styles.cardTop}>
                  <div style={styles.shopName}>
                    {shop.shop_name ||
                      "Unnamed Shop"}
                  </div>

                  <span
                    style={{
                      ...styles.status,
                      background: isOpen
                        ? "#16a34a"
                        : "#dc2626",
                    }}
                  >
                    {isOpen ? "OPEN" : "CLOSED"}
                  </span>
                </div>

                <div style={styles.offerText}>
                  Offers available
                </div>

                {/* ACTIONS */}
                <div style={styles.actions}>
                  <a
                    href={`tel:${shop.mobile}`}
                    style={styles.actionBtn}
                  >
                    📞
                  </a>

                  <a
                    href={`https://wa.me/91${shop.mobile}`}
                    target="_blank"
                    rel="noreferrer"
                    style={styles.actionBtn}
                  >
                    💬
                  </a>

                  {shop.location && (
                    <a
                      href={`https://www.google.com/maps?q=${shop.location.lat},${shop.location.lng}`}
                      target="_blank"
                      rel="noreferrer"
                      style={styles.actionBtn}
                    >
                      🧭
                    </a>
                  )}
                </div>
              </div>
            );
          })}

        {!loading && shops.length === 0 && (
          <p style={styles.helper}>
            No shops found.
          </p>
        )}
      </section>
    </div>
  );
}

/* ======================
   STYLES – MOBILE FIRST
====================== */
const styles = {
  hero: { padding: "16px 8px" },
  greeting: { fontSize: 22, fontWeight: 700 },
  subText: { fontSize: 14, color: "#6b7280" },

  filters: {
    background: "#fff",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    boxShadow: "0 4px 12px rgba(0,0,0,.08)",
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    marginTop: 8,
  },
  select: {
    width: "100%",
    height: 40,
    borderRadius: 8,
    marginBottom: 8,
  },

  distanceRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  distanceBtn: {
    padding: "6px 12px",
    borderRadius: 20,
    border: "1px solid #d1d5db",
    background: "#f8fafc",
    fontSize: 13,
  },
  active: {
    background: "#16a34a",
    color: "#fff",
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: 600,
    margin: "8px 0",
  },

  card: {
    background: "#fff",
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
    boxShadow: "0 4px 14px rgba(0,0,0,.08)",
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  shopName: {
    fontSize: 16,
    fontWeight: 600,
  },
  status: {
    fontSize: 12,
    color: "#fff",
    padding: "4px 10px",
    borderRadius: 12,
  },
  offerText: {
    fontSize: 13,
    color: "#16a34a",
    marginTop: 6,
  },
  actions: {
    display: "flex",
    gap: 14,
    marginTop: 12,
  },
  actionBtn: {
    fontSize: 22,
    textDecoration: "none",
  },
  helper: {
    fontSize: 14,
    color: "#6b7280",
  },
};
