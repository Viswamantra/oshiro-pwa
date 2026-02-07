import React, { useEffect, useState } from "react";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase";

/**
 * PRODUCTION SAFE LOCATION FILE
 */

export default function MerchantLocation() {
  let merchant = null;

  try {
    merchant = JSON.parse(localStorage.getItem("merchant"));
  } catch {
    merchant = null;
  }

  const merchantId =
    merchant?.id ||
    merchant?.uid ||
    merchant?.docId ||
    merchant?.merchantId ||
    null;

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
    if (!merchantId) {
      setMsg("Merchant not logged in");
      return;
    }

    if (typeof lat !== "number" || typeof lng !== "number") {
      setMsg("Location not available");
      return;
    }

    try {
      setLoading(true);

      await setDoc(
        doc(db, "merchants", merchantId),
        {
          location: {
            lat,
            lng,
            address: address || "",
          },
          profileComplete: true,
          updatedAt: serverTimestamp(),
          locationUpdatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setMsg("✅ Location saved successfully");
    } catch (err) {
      console.error(err);
      setMsg(err.message || "Failed to save location");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Set Shop Location</h2>

      {typeof lat === "number" ? (
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

      {msg && <p style={{ marginTop: 10 }}>{msg}</p>}

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
