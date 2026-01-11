import React, { useEffect, useState } from "react";
import CategoryList from "./CategoryList";
import MerchantList from "./MerchantList";
import DistanceSelector from "../../components/DistanceSelector";

/**
 * =========================================================
 * CUSTOMER DASHBOARD (MOBILE-FIRST)
 * ---------------------------------------------------------
 * ✔ GPS-based nearby merchants
 * ✔ Category + distance filtering
 * ✔ Permission & empty-state handling
 * ✔ Sticky filter bar
 * ✔ Logout handled by CustomerLayout
 * =========================================================
 */

export default function CustomerDashboard() {
  /* ======================
     FILTER STATE
  ====================== */
  const [categoryId, setCategoryId] = useState("");
  const [distance, setDistance] = useState(10000); // 10 km

  /* ======================
     LOCATION STATE
  ====================== */
  const [coords, setCoords] = useState(null);
  const [locationError, setLocationError] = useState("");
  const [loadingLocation, setLoadingLocation] = useState(true);

  /* ======================
     GET CUSTOMER LOCATION
  ====================== */
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported");
      setLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setLoadingLocation(false);
      },
      () => {
        setLocationError(
          "Location permission denied. Enable GPS and refresh."
        );
        setLoadingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }, []);

  /* ======================
     UI STATES
  ====================== */
  if (loadingLocation) {
    return <p style={{ textAlign: "center" }}>📍 Fetching location…</p>;
  }

  if (locationError) {
    return (
      <p style={{ color: "red", textAlign: "center" }}>
        {locationError}
      </p>
    );
  }

  return (
    <>
      {/* ======================
          FILTER BAR
      ====================== */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: "#fff",
          padding: 10,
          borderBottom: "1px solid #eee",
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <CategoryList onSelect={setCategoryId} />
        <DistanceSelector value={distance} onChange={setDistance} />
      </div>

      {/* ======================
          MERCHANT LIST
      ====================== */}
      <div style={{ padding: 10, paddingBottom: 80 }}>
        {coords && (
          <MerchantList
            category={categoryId}
            distance={distance}
            userLat={coords.lat}
            userLng={coords.lng}
          />
        )}
      </div>
    </>
  );
}
