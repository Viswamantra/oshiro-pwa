import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where
} from "firebase/firestore";
import { db } from "../../firebase";
import { getDistanceInKm } from "../../utils/geo";

/**
 * Change this dynamically from UI later
 * 0.3  = 300 meters
 * 10   = 10 km
 */
const RADIUS_KM = 10;

export default function NearbyOffers() {
  const [offers, setOffers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

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

          // ✅ 1. Fetch ALL active offers
          const offersSnap = await getDocs(
            query(
              collection(db, "offers"),
              where("isActive", "==", true)
            )
          );

          const nearbyOffers = [];

          offersSnap.forEach((doc) => {
            const offer = doc.data();

            // 🔴 MUST HAVE LOCATION
            if (!offer.location) return;

            const distanceKm = getDistanceInKm(
              userLat,
              userLng,
              offer.location.lat,
              offer.location.lng
            );

            // ✅ Distance filter (300m / 10km)
            if (distanceKm <= RADIUS_KM) {
              nearbyOffers.push({
                id: doc.id,
                distanceKm,
                ...offer
              });
            }
          });

          setOffers(nearbyOffers);
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
  }, []);

  if (loading) return <p>Loading nearby offers…</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div>
      <h2>Nearby Deals</h2>

      {offers.length === 0 && (
        <p>No nearby offers found</p>
      )}

      {offers.map((o) => (
        <div key={o.id} style={card}>
          <h4>{o.title}</h4>
          {o.description && <p>{o.description}</p>}
          {o.shop_name && <p><b>{o.shop_name}</b></p>}
          {o.distanceKm !== undefined && (
            <small>{o.distanceKm.toFixed(2)} km away</small>
          )}
        </div>
      ))}
    </div>
  );
}

const card = {
  border: "1px solid #ccc",
  padding: 12,
  marginBottom: 10,
  borderRadius: 6
};
