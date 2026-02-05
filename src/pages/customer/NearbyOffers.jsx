import React, { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebase";
import { getDistanceInKm } from "../../utils/geo";

const RADIUS_OPTIONS = [
  { label: "300 m", value: 0.3 },
  { label: "1 km", value: 1 },
  { label: "3 km", value: 3 },
  { label: "5 km", value: 5 },
  { label: "10 km", value: 10 },
];

export default function NearbyOffers() {
  const [items, setItems] = useState([]);
  const [radiusKm, setRadiusKm] = useState(3);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const userLat = pos.coords.latitude;
          const userLng = pos.coords.longitude;

          // 1️⃣ Fetch approved merchants
          const merchantSnap = await getDocs(
            query(
              collection(db, "merchants"),
              where("status", "==", "approved")
            )
          );

          const flatResults = [];

          for (const m of merchantSnap.docs) {
            const merchant = m.data();

            // ✅ SUPPORT BOTH DATA STRUCTURES
            const lat = merchant.lat ?? merchant.location?.lat;
            const lng = merchant.lng ?? merchant.location?.lng;

            if (!lat || !lng) continue;

            const distanceKm = getDistanceInKm(
              userLat,
              userLng,
              lat,
              lng
            );

            if (distanceKm > radiusKm) continue;

            // 2️⃣ Fetch active offers for this merchant
            const offerSnap = await getDocs(
              query(
                collection(db, "offers"),
                where("merchantId", "==", m.id),
                where("isActive", "==", true)
              )
            );

            offerSnap.forEach((o) => {
              flatResults.push({
                id: o.id,
                merchantId: m.id,
                merchantName: merchant.shop_name || merchant.name,
                distanceKm,
                ...o.data(),
              });
            });
          }

          // 3️⃣ Group offers by merchant
          const grouped = {};
          flatResults.forEach((o) => {
            if (!grouped[o.merchantId]) {
              grouped[o.merchantId] = {
                merchantId: o.merchantId,
                merchantName: o.merchantName,
                distanceKm: o.distanceKm,
                offers: [],
              };
            }
            grouped[o.merchantId].offers.push(o);
          });

          setItems(Object.values(grouped));
        } catch (e) {
          console.error(e);
          setError("Failed to load nearby deals");
        } finally {
          setLoading(false);
        }
      },
      () => {
        setError("Location permission denied");
        setLoading(false);
      }
    );
  }, [radiusKm]);

  if (loading) return <p>Loading nearby deals…</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div>
      <h2>Nearby Deals</h2>

      <div style={{ marginBottom: 12 }}>
        <label>
          Distance:&nbsp;
          <select
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
          >
            {RADIUS_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {items.length === 0 && <p>No merchants found</p>}

      {items.map((m) => (
        <div key={m.merchantId} style={merchantCard}>
          <div style={{ marginBottom: 6 }}>
            <h3 style={{ margin: 0 }}>{m.merchantName}</h3>
            <small>{m.distanceKm.toFixed(2)} km away</small>
          </div>

          {m.offers.map((o) => (
            <div key={o.id} style={offerCard}>
              <strong>{o.title}</strong>
              {o.description && o.description !== o.title && (
                <p style={{ margin: "4px 0" }}>{o.description}</p>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ======================
   STYLES
====================== */
const merchantCard = {
  border: "1px solid #ddd",
  borderRadius: 8,
  padding: 12,
  marginBottom: 16,
  background: "#fafafa",
};

const offerCard = {
  borderTop: "1px dashed #ccc",
  paddingTop: 8,
  marginTop: 8,
};
