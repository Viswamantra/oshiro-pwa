// src/hooks/useGeofence.js
import { useEffect, useState } from "react";

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // meters
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * merchants: [{ id, name, lat, lng, radiusMeters }]
 */
export default function useGeofence(position, merchants = []) {
  const [activeMerchants, setActiveMerchants] = useState([]);

  useEffect(() => {
    if (!position) {
      setActiveMerchants([]);
      return;
    }

    const inside = merchants.filter((m) => {
      const dist = haversineDistance(
        position.lat,
        position.lng,
        m.lat,
        m.lng
      );
      return dist <= m.radiusMeters;
    });

    setActiveMerchants(inside);
  }, [position, merchants]);

  return { activeMerchants };
}
