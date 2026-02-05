import React, { useState } from "react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase.js";

/**
 * =========================================================
 * MERCHANT PROFILE – GPS LOCATION
 * ---------------------------------------------------------
 * ✔ Button-based GPS fetch
 * ✔ Browser permission popup
 * ✔ Read-only coordinates
 * ✔ Save to Firestore
 * =========================================================
 */

export default function MerchantProfile() {
  /* ======================
     SAFE MERCHANT LOAD
  ====================== */
  let merchant = null;
  try {
    merchant = JSON.parse(localStorage.getItem("merchant"));
  } catch {
    merchant = null;
  }

  if (!merchant || merchant.status !== "approved") {
    return (
      <div style={{ padding: 20, color: "red" }}>
        Profile access available only after admin approval.
      </div>
    );
  }

  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  /* ======================
     GET GPS LOCATION
  ====================== */
  const getLocation = () => {
    setMsg("");

    if (!navigator.geolocation) {
      setMsg("Geolocation not supported by this browser");
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setLoading(false);
      },
      () => {
        setMsg("Location permission denied");
        setLoading(false);
      },
      { enableHighAccuracy: true }
    );
  };

  /* ======================
     SAVE LOCATION
  ====================== */
  const saveLocation = async () => {
    if (typeof lat !== "number" || typeof lng !== "number") {
      setMsg("Please fetch GPS location first");
      return;
    }

    try {
      setLoading(true);
      setMsg("");

      await updateDoc(doc(db, "merchants", merchant.id), {
        location: { lat, lng },
        locationUpdatedAt: serverTimestamp(),
      });

      setMsg("✅ GPS location saved successfully");
    } catch (err) {
      console.error("Save location error:", err);
      setMsg("❌ Failed to save location");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h3>Shop Profile</h3>

      {/* ======================
          GPS BUTTON
      ====================== */}
      <button
        onClick={getLocation}
        disabled={loading}
        style={{ padding: 10 }}
      >
        📍 Get GPS Location
      </button>

      {/* ======================
          LOCATION DISPLAY
      ====================== */}
      {typeof lat === "number" && typeof lng === "number" && (
        <div style={{ marginTop: 15 }}>
          <input
            value={`Latitude: ${lat}`}
            readOnly
            style={styles.input}
          />
          <input
            value={`Longitude: ${lng}`}
            readOnly
            style={styles.input}
          />
        </div>
      )}

      {/* ======================
          MESSAGE
      ====================== */}
      {msg && (
        <p style={{ marginTop: 10, color: msg.startsWith("✅") ? "green" : "red" }}>
          {msg}
        </p>
      )}

      {/* ======================
          SAVE BUTTON
      ====================== */}
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

const styles = {
  input: {
    width: "100%",
    padding: 10,
    marginTop: 8,
  },
};
