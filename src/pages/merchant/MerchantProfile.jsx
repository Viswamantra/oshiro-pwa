import React, { useState, useEffect } from "react";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function MerchantProfile() {
  const [uid, setUid] = useState(null);
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  /* ==========================
     AUTH LISTENER
  ========================== */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setMsg("Merchant not logged in");
        return;
      }

      setUid(user.uid);

      try {
        const snap = await getDoc(doc(db, "merchants", user.uid));

        if (!snap.exists()) {
          setMsg("Merchant record not found. Contact admin.");
        } else {
          console.log("Merchant verified:", user.uid);
        }

      } catch (err) {
        console.error(err);
        setMsg("Unable to verify merchant");
      }
    });

    return () => unsub();
  }, []);

  /* ==========================
     GET GPS
  ========================== */
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

  /* ==========================
     SAVE LOCATION
  ========================== */
  const saveLocation = async () => {
    if (!uid) {
      setMsg("Login session not ready");
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
        doc(db, "merchants", uid),
        {
          ownerId: uid, // important for rules
          location: { lat, lng },
          profileComplete: true,
          locationUpdatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setMsg("✅ Location saved successfully");

    } catch (err) {
      console.error("Save error:", err);
      setMsg(err.message || "Failed to save location");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h3>Shop Profile</h3>

      <button
        onClick={getLocation}
        disabled={loading}
        style={{ padding: 10 }}
      >
        📍 Get GPS Location
      </button>

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

      {msg && (
        <p
          style={{
            marginTop: 10,
            color: msg.includes("✅") ? "green" : "red",
          }}
        >
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