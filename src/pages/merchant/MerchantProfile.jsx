import React, { useState } from "react";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase";

/**
 * PRODUCTION SAFE VERSION
 * ✔ Handles missing merchant id
 * ✔ Handles doc not existing
 * ✔ Firestore merge safe
 */

export default function MerchantProfile() {
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

  // 🔥 SAFE ID PICKER
  const merchantId =
    merchant?.id ||
    merchant?.uid ||
    merchant?.docId ||
    merchant?.merchantId ||
    null;

  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const getLocation = () => {
    setMsg("");

    if (!navigator.geolocation) {
      setMsg("Geolocation not supported");
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

  const saveLocation = async () => {
    if (!merchantId) {
      setMsg("Merchant session missing. Login again.");
      return;
    }

    if (typeof lat !== "number" || typeof lng !== "number") {
      setMsg("Please fetch GPS first");
      return;
    }

    try {
      setLoading(true);
      setMsg("");

      await setDoc(
        doc(db, "merchants", merchantId),
        {
          location: { lat, lng },
          profileComplete: true,
          locationUpdatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setMsg("✅ Location saved successfully");
    } catch (err) {
      console.error("Save error:", err);
      setMsg(err.message || "❌ Failed to save location");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h3>Shop Profile</h3>

      <button onClick={getLocation} disabled={loading} style={{ padding: 10 }}>
        📍 Get GPS Location
      </button>

      {typeof lat === "number" && typeof lng === "number" && (
        <div style={{ marginTop: 15 }}>
          <input value={`Latitude: ${lat}`} readOnly style={styles.input} />
          <input value={`Longitude: ${lng}`} readOnly style={styles.input} />
        </div>
      )}

      {msg && (
        <p style={{ marginTop: 10, color: msg.includes("✅") ? "green" : "red" }}>
          {msg}
        </p>
      )}

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
