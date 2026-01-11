import React, { useEffect, useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";

export default function MerchantLocation() {
  const merchant = JSON.parse(localStorage.getItem("merchant"));
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

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

  const saveLocation = async () => {
    if (!lat || !lng) {
      setMsg("Location not selected");
      return;
    }

    try {
      setLoading(true);

      await updateDoc(doc(db, "merchants", merchant.id), {
        location: { lat, lng, address },
        locationUpdatedAt: new Date()
      });

      setMsg("Location saved successfully");
    } catch (err) {
      console.error(err);
      setMsg("Failed to save location");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Set Shop Location</h2>

      {lat && lng ? (
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
