import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../firebase";
import { getDistanceInKm } from "../../utils/geo";

/* ======================
   RADIUS OPTIONS
====================== */
const RADIUS_OPTIONS = [
  { label: "300 m", value: 0.3 },
  { label: "1 km", value: 1 },
  { label: "5 km", value: 5 },
  { label: "10 km", value: 10 },
];

export default function NearbyOffers() {
  const [offers, setOffers] = useState([]);
  const [radiusKm, setRadiusKm] = useState(10);
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

          // 🔥 FETCH ONLY ACTIVE OFFERS
          const snap = await getDocs(
            query(
              collection(db, "offers"),
              where("isActive", "==", true)
            )
          );

          const nearby = [];

          snap.forEach((doc) => {
            const offer = doc.data();

            // ❗ Offer MUST have location
            if (!offer.location) return;

            const distanceKm = getDistanceInKm(
              userLat,
              userLng,
              offer.location.lat,
              offer.location.lng
            );

            if (distanceKm <= radiusKm) {
              nearby.push({
                id: doc.id,
                distanceKm,
                ...offer,
              });
            }
          });

          setOffers(nearby);
        } catch (err) {
          console.error(err);
          setError("Failed to load nearby offers");
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

      {/* 🔥 Radius Dropdown */}
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

      {offers.length === 0 && <p>No nearby offers found</p>}

      {offers.map((o) => (
        <div key={o.id} style={card}>
          <h4>{o.title}</h4>
          {o.shop_name && <p><b>{o.shop_name}</b></p>}
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
