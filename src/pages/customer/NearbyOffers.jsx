import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where
} from "firebase/firestore";
import { db } from "../../firebase";
import { getDistanceInKm } from "../../utils/geo";

const RADIUS_KM = 5; // 🔥 change anytime

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

          // 1️⃣ Get approved merchants with location
          const merchantsSnap = await getDocs(
            query(
              collection(db, "merchants"),
              where("status", "==", "approved")
            )
          );

          const nearbyMerchantIds = [];

          merchantsSnap.forEach((doc) => {
            const m = doc.data();
            if (!m.location) return;

            const d = getDistanceInKm(
              userLat,
              userLng,
              m.location.lat,
              m.location.lng
            );

            if (d <= RADIUS_KM) {
              nearbyMerchantIds.push(doc.id);
            }
          });

          if (nearbyMerchantIds.length === 0) {
            setOffers([]);
            setLoading(false);
            return;
          }

          // 2️⃣ Get offers for nearby merchants
          const offersSnap = await getDocs(
            query(
              collection(db, "offers"),
              where("merchantId", "in", nearbyMerchantIds),
              where("isActive", "==", true)
            )
          );

          setOffers(
            offersSnap.docs.map((d) => ({
              id: d.id,
              ...d.data()
            }))
          );
        } catch (err) {
          console.error(err);
          setError("Failed to load offers");
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
      <h2>Nearby Offers</h2>

      {offers.length === 0 && (
        <p>No nearby offers found</p>
      )}

      {offers.map((o) => (
        <div key={o.id} style={card}>
          <h4>{o.title}</h4>
          {o.description && <p>{o.description}</p>}
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
