import React, { useEffect, useState } from "react"; 
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

import {
  fetchNearbyMerchants,
  fetchOffersByMerchantIds,
} from "../../firebase/barrel";

import { startLocationHybrid } from "../../services/locationHybrid";

import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";

/* ========================================================= */

const DISTANCES = [
  { label: "300 m", value: 300 },
  { label: "1 km", value: 1000 },
  { label: "3 km", value: 3000 },
  { label: "5 km", value: 5000 },
  { label: "10 km", value: 10000 },
];

/* ========================================================= */

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth();

  const [customerId, setCustomerId] = useState(null);
  const [customerName, setCustomerName] = useState("Customer");

  const [category, setCategory] = useState("");
  const [distance, setDistance] = useState(3000);
  const [shops, setShops] = useState([]);
  const [offersMap, setOffersMap] = useState({});
  const [loading, setLoading] = useState(true);

  /* ================= AUTH VALIDATION ================= */
  useEffect(() => {
    if (authLoading) return;

    if (!user || role !== "customer") {
      navigate("/customer-login", { replace: true });
      return;
    }

    setCustomerId(user.uid);
    setCustomerName("Customer");
  }, [user, role, authLoading, navigate]);

  /* ================= GEO ENGINE ================= */
  useEffect(() => {
    if (!customerId) return;

    const stopTracking = startLocationHybrid(customerId);
    return () => stopTracking && stopTracking();
  }, [customerId]);

  /* ================= SAVE DISTANCE ================= */
  useEffect(() => {
    if (!customerId) return;

    async function saveDistance() {
      try {
        await updateDoc(doc(db, "customers", customerId), {
          selectedDistanceKm: distance / 1000,
        });
      } catch (err) {
        console.log("Distance save skipped:", err.message);
      }
    }

    saveDistance();
  }, [distance, customerId]);

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    if (!customerId) return;

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

        const merchantIds = (merchants || []).map((m) => m.id);

        const offers = await fetchOffersByMerchantIds(merchantIds);

        if (!mounted) return;

        /* 🔥 GROUP OFFERS BY merchantId (FIX) */
        const grouped = {};

        for (const offer of offers || []) {
          if (!grouped[offer.ownerId]) {
            grouped[offer.ownerId] = [];
          }
          grouped[offer.ownerId].push(offer);
        }

        setOffersMap(grouped);

      } catch (err) {
        console.error("CustomerDashboard load error:", err);
        if (mounted) setShops([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();
    return () => (mounted = false);
  }, [category, distance, customerId]);

  /* ================= RENDER ================= */
  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <h2 style={styles.greeting}>Hi {customerName} 👋</h2>
        <p style={styles.subText}>Find nearby shops & local offers</p>
      </section>

      <section style={styles.stickyFilters}>
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
            <option value="Fashions & Apparels">Fashions & Apparels</option>
            <option value="Pharmacy">Pharmacy</option>
            <option value="Hospitals">Hospitals</option>
            <option value="Education">Education</option>
            <option value="Other Services">Other Services</option>
          </select>
        </div>

        <div style={styles.filterBlock}>
          <label style={styles.label}>📍 Distance</label>
          <div style={styles.distanceRow}>
            {DISTANCES.map((d) => (
              <button
                key={d.value}
                onClick={() => setDistance(d.value)}
                style={{
                  ...styles.distanceBtn,
                  ...(distance === d.value ? styles.distanceActive : {}),
                }}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section style={styles.list}>
        <h3 style={styles.sectionTitle}>Nearby Shops</h3>

        {loading && <p style={styles.helper}>Finding shops near you…</p>}

        {!loading && shops.length === 0 && (
          <p style={styles.helper}>No shops found.</p>
        )}

        {!loading &&
          shops.map((shop) => {
            const offerCount = offersMap[shop.id]?.length || 0;

            return (
              <div
                key={shop.id}
                style={styles.card}
                onClick={() =>
                  offerCount > 0 &&
                  navigate(`/customer/offers/${shop.id}`)
                }
              >
                <div style={styles.cardTop}>
                  <div>
                    <div style={styles.shopName}>
                      {shop.shopName || "Unnamed Shop"}
                    </div>

                    {offerCount > 0 ? (
                      <span style={styles.offerBadge}>
                        🎁 {offerCount} OFFER
                        {offerCount !== 1 ? "S" : ""}
                      </span>
                    ) : (
                      <span style={{ fontSize: "12px", color: "#999" }}>
                        No active offers
                      </span>
                    )}
                  </div>

                  <span style={styles.status}>OPEN</span>
                </div>
              </div>
            );
          })}
      </section>
    </div>
  );
}

/* ================= SIMPLE STYLES ================= */

const styles = {
  page: { padding: "20px" },
  hero: { marginBottom: "20px" },
  greeting: { margin: 0 },
  subText: { color: "#555" },
  stickyFilters: { marginBottom: "20px" },
  filterBlock: { marginBottom: "15px" },
  label: { fontWeight: "600", display: "block", marginBottom: "5px" },
  select: { padding: "6px", width: "100%" },
  distanceRow: { display: "flex", flexWrap: "wrap", gap: "8px" },
  distanceBtn: {
    padding: "6px 10px",
    border: "1px solid #ccc",
    borderRadius: "6px",
    cursor: "pointer",
    background: "#f5f5f5",
  },
  distanceActive: {
    background: "#2563eb",
    color: "#fff",
    borderColor: "#2563eb",
  },
  list: { marginTop: "20px" },
  sectionTitle: { marginBottom: "10px" },
  helper: { color: "#777" },
  card: {
    padding: "15px",
    borderRadius: "8px",
    background: "#fff",
    marginBottom: "10px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
    cursor: "pointer",
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  shopName: { fontWeight: "600" },
  offerBadge: { fontSize: "12px", color: "#2563eb" },
  status: { fontSize: "12px", color: "green" },
};