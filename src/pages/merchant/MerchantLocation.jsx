import React, { useEffect, useState } from "react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase";

/**
 * =========================================================
 * MERCHANT LOCATION
 * ---------------------------------------------------------
 * ✔ Geo capture
 * ✔ Address input
 * ✔ profileComplete enforcement
 * ✔ Firestore rules aligned
 * ✔ Runtime & Rollup safe
 * =========================================================
 */

export default function MerchantLocation() {
  /* ======================
     GET MERCHANT SESSION
  ====================== */
  let merchantId = null;

  try {
    const stored = JSON.parse(localStorage.getItem("merchant"));
    merchantId = stored?.id || null;
  } catch {
    merchantId = null;
  }

  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  /* ======================
     GET CURRENT LOCATION
  ====================== */
  useEffect(() => {
    if (!navigator.geolocation) {
      setMsg("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
      },
      () => setMsg("Location permission denied")
    );
  }, []);

  /* ======================
     SAVE LOCATION
  ====================== */
  const saveLocation = async () => {
    if (!merchantId) {
      setMsg("Merchant not logged in");
      return;
    }

    if (typeof lat !== "number" || typeof lng !== "number") {
      setMsg("Location not selected");
      return;
    }

    try {
      setLoading(true);

      await updateDoc(doc(db, "merchants", merchantId), {
        location: {
          lat,
          lng,
          address: address || "",
        },

        // 🔐 REQUIRED FOR CUSTOMER VISIBILITY
        profileComplete: true,

        updatedAt: serverTimestamp(),
        locationUpdatedAt: serverTimestamp(),
      });

      setMsg("Location saved successfully");

    } catch (err) {
      console.error("Save location failed:", err);
      setMsg("Failed to save location");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Set Shop Location</h2>

      {typeof lat === "number" && typeof lng === "number" ? (
        <iframe
          title="map"
          width="100%"
          height="300"
          style={{ border: 0 }}
          src={`https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed`}
        />
      ) : (
        <p>Fetching location…</p>
      )}

      <input
        type="text"
        placeholder="Shop address / landmark"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        style={{ width: "100%", padding: 10, marginTop: 10 }}
      />

      {msg && <p>{msg}</p>}

      <button
        onClick={saveLocation}
        disabled={loading}
        style={{ marginTop: 10, padding: 10 }}
      >
        {loading ? "Saving..." : "Save Location"}
      </button>
    </div>
  );
}
