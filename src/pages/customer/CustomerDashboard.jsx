import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchNearbyMerchants,
  fetchOffersByMerchantIds,
} from "../../firebase/barrel";

/**
 * =========================================================
 * CUSTOMER DASHBOARD – FINAL FIX
 * ---------------------------------------------------------
 * ✔ Call / WhatsApp / Maps WORK
 * ✔ Card navigation isolated
 * ✔ No event swallowing
 * ✔ Mobile + desktop safe
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
  const navigate = useNavigate();
  const customerName =
    localStorage.getItem("name") || "Customer";

  const [category, setCategory] = useState("");
  const [distance, setDistance] = useState(3000);
  const [shops, setShops] = useState([]);
  const [offersMap, setOffersMap] = useState({});
  const [loading, setLoading] = useState(true);

  /* ======================
     LOAD SHOPS + OFFERS
  ====================== */
  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        setLoading(true);

        const merchants = await fetchNearbyMerchants({
          category,
          distance,
        });

        if (!mounted) return;

        setShops(merchants || []);

        const merchantIds =
          (merchants || []).map((m) => m.id);

        const offers =
          await fetchOffersByMerchantIds(merchantIds);

        mounted && setOffersMap(offers || {});
      } catch (err) {
        console.error(err);
        mounted && setShops([]);
      } finally {
        mounted && setLoading(false);
      }
    }

    loadData();
    return () => (mounted = false);
  }, [category, distance]);

  return (
    <div style={styles.page}>
      {/* HERO */}
      <section style={styles.hero}>
        <h2 style={styles.greeting}>
          Hi {customerName} 👋
        </h2>
        <p style={styles.subText}>
          Find nearby shops & local offers
        </p>
      </section>

      {/* FILTERS */}
      <section style={styles.stickyFilters}>
        {/* CATEGORY */}
        <div style={styles.filterBlock}>
          <label style={styles.label}>📂 Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={styles.select}
          >
            <option value="">All</option>
            <option value="Food">Food</option>
            <option value="Beauty & Spa">Beauty & Spa</option>
            <option value="Fashions & Apparels">
              Fashions & Apparels
            </option>
            <option value="Pharmacy">Pharmacy</option>
            <option value="Hospitals">Hospitals</option>
            <option value="Education">Education</option>
            <option value="Other Services">
              Other Services
            </option>
          </select>
        </div>

        {/* DISTANCE */}
        <div style={styles.filterBlock}>
          <label style={styles.label}>📍 Distance</label>
          <div style={styles.distanceRow}>
            {DISTANCES.map((d) => (
              <button
                key={d.value}
                onClick={() => setDistance(d.value)}
                style={{
                  ...styles.distanceBtn,
                  ...(distance === d.value
                    ? styles.distanceActive
                    : {}),
                }}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* LIST */}
      <section style={styles.list}>
        <h3 style={styles.sectionTitle}>
          Nearby Shops
        </h3>

        {loading && (
          <p style={styles.helper}>
            Finding shops near you…
          </p>
        )}

        {!loading && shops.length === 0 && (
          <p style={styles.helper}>
            No shops found.
          </p>
        )}

        {!loading &&
          shops.map((shop) => {
            const offerCount =
              offersMap[shop.id]?.length || 0;

            const cleanMobile = shop.mobile
              ? shop.mobile.toString().replace(/\D/g, "").slice(-10)
              : null;

            return (
              <div
                key={shop.id}
                style={styles.card}
                onClick={() =>
                  offerCount > 0 &&
                  navigate(`/customer/offers/${shop.id}`)
                }
              >
                {/* TOP */}
                <div style={styles.cardTop}>
                  <div>
                    <div style={styles.shopName}>
                      {shop.shop_name || "Unnamed Shop"}
                    </div>

                    <span style={styles.offerBadge}>
                      🎁 {offerCount} OFFER
                      {offerCount !== 1 ? "S" : ""}
                    </span>
                  </div>

                  <span style={styles.status}>
                    OPEN
                  </span>
                </div>

                {/* ACTIONS – FIXED */}
                <div style={styles.actionsRow}>
                  {/* CALL */}
                  {cleanMobile && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = `tel:${cleanMobile}`;
                      }}
                      style={styles.actionBtn}
                    >
                      📞
                    </button>
                  )}

                  {/* WHATSAPP */}
                  {cleanMobile && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(
                          `https://wa.me/91${cleanMobile}`,
                          "_blank"
                        );
                      }}
                      style={styles.actionBtn}
                    >
                      💬
                    </button>
                  )}

                  {/* MAP */}
                  {shop.location && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(
                          `https://www.google.com/maps?q=${shop.location.lat},${shop.location.lng}`,
                          "_blank"
                        );
                      }}
                      style={styles.actionBtn}
                    >
                      🧭
                    </button>
                  )}
                </div>
              </div>
            );
          })}
      </section>
    </div>
  );
}

/* ======================
   STYLES
====================== */

const styles = {
  page: {
    background: "#f8fafc",
    minHeight: "100vh",
  },
  hero: { padding: 16 },
  greeting: { fontSize: 22, fontWeight: 700 },
  subText: { fontSize: 14, color: "#6b7280" },

  stickyFilters: {
    position: "sticky",
    top: 56,
    zIndex: 8,
    background: "#ffffff",
    padding: 12,
    boxShadow: "0 2px 10px rgba(0,0,0,.08)",
  },

  filterBlock: { marginBottom: 10 },
  label: { fontSize: 13, fontWeight: 600 },
  select: {
    width: "100%",
    height: 40,
    borderRadius: 8,
    border: "1px solid #d1d5db",
    padding: "0 10px",
  },

  distanceRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  distanceBtn: {
    padding: "6px 12px",
    borderRadius: 20,
    border: "1px solid #d1d5db",
    background: "#f8fafc",
    cursor: "pointer",
  },
  distanceActive: {
    background: "#16a34a",
    color: "#fff",
    borderColor: "#16a34a",
  },

  list: { padding: 16, maxWidth: 720, margin: "0 auto" },
  sectionTitle: { fontSize: 16, fontWeight: 600 },

  helper: { fontSize: 14, color: "#6b7280" },

  card: {
    background: "#ffffff",
    padding: 14,
    borderRadius: 16,
    marginBottom: 14,
    boxShadow: "0 6px 20px rgba(0,0,0,.08)",
    cursor: "pointer",
  },

  cardTop: {
    display: "flex",
    justifyContent: "space-between",
  },

  shopName: { fontSize: 16, fontWeight: 600 },

  offerBadge: {
    marginTop: 4,
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 600,
    background: "#ecfeff",
    color: "#0f766e",
  },

  status: {
    fontSize: 12,
    color: "#ffffff",
    padding: "4px 10px",
    borderRadius: 12,
    background: "#16a34a",
  },

  actionsRow: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 18,
    marginTop: 12,
  },

  actionBtn: {
    fontSize: 22,
    background: "none",
    border: "none",
    cursor: "pointer",
  },
};
