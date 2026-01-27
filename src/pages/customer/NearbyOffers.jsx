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

          // 1️⃣ Fetch APPROVED merchants with location
          const merchantSnap = await getDocs(
            query(
              collection(db, "merchants"),
              where("status", "==", "approved")
            )
          );

          const results = [];

          for (const m of merchantSnap.docs) {
            const merchant = m.data();

            if (!merchant.lat || !merchant.lng) continue;

            const distanceKm = getDistanceInKm(
              userLat,
              userLng,
              merchant.lat,
              merchant.lng
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
              results.push({
                id: o.id,
                distanceKm,
                merchantName: merchant.shop_name || merchant.name,
                ...o.data(),
              });
            });
          }

          setItems(results);
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

      {items.map((o) => (
        <div key={o.id} style={card}>
          <h4>{o.title}</h4>
          <p><b>{o.merchantName}</b></p>
          {o.description && <p>{o.description}</p>}
          <small>{o.distanceKm.toFixed(2)} km away</small>
        </div>
      ))}
    </div>
  );
}

const card = {
  border: "1px solid #ccc",
  padding: 12,
  marginBottom: 10,
  borderRadius: 6,
};
