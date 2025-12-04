// src/pages/MerchantDashboard.jsx

import { useEffect, useState } from "react";
import LogoutBtn from "../components/LogoutBtn";
import axios from "axios";

import { db } from "../firebase";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";

export default function MerchantDashboard() {
  const [mobile, setMobile] = useState("");
  const [merchant, setMerchant] = useState(null);
  const [loading, setLoading] = useState(true);

  // Merchant form fields
  const [shopName, setShopName] = useState("");
  const [address, setAddress] = useState("");
  const [pincode, setPincode] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [radius, setRadius] = useState(300);

  // Offer
  const [offerTitle, setOfferTitle] = useState("");
  const [offerDesc, setOfferDesc] = useState("");

  const [log, setLog] = useState([]);

  // ----------------------------
  // SECURITY: Merchant only page
  // ----------------------------
  useEffect(() => {
    const role = localStorage.getItem("logged_role");
    if (role !== "merchant") {
      alert("Please login as Merchant");
      window.location.href = "/";
      return;
    }
    const mob = localStorage.getItem("mobile");
    setMobile(mob);
    fetchMerchant(mob);
  }, []);

  // ----------------------------
  // Fetch merchant record by mobile
  // ----------------------------
  async function fetchMerchant(mob) {
    const qSnap = await getDocs(
      query(collection(db, "merchants"), where("mobile", "==", mob))
    );

    if (qSnap.empty) {
      setMerchant(null);
      setLoading(false);
      return;
    }

    const data = qSnap.docs[0].data();
    setMerchant({ id: qSnap.docs[0].id, ...data });

    setShopName(data.shopName);
    setAddress(data.address);
    setPincode(data.pincode);
    setCity(data.city);
    setStateName(data.state);
    setRadius(data.radius);

    setLoading(false);
  }

  // ----------------------------
  // Save Merchant Info
  // ----------------------------
  async function saveMerchant() {
    if (!shopName || !address || !pincode || !city || !stateName) {
      alert("Fill all fields");
      return;
    }

    const fullAddr = `${address}, ${city}, ${stateName}, ${pincode}`;

    try {
      // Convert Address → GPS
      const url =
        "https://nominatim.openstreetmap.org/search?format=json&q=" +
        encodeURIComponent(fullAddr);

      const res = await axios.get(url);

      if (res.data.length === 0) {
        alert("Address not found. Try again.");
        return;
      }

      const { lat, lon } = res.data[0];

      // Save merchant
      await addDoc(collection(db, "merchants"), {
        mobile,
        shopName,
        address,
        pincode,
        city,
        state: stateName,
        lat: parseFloat(lat),
        lng: parseFloat(lon),
        radius,
        offerTitle,
        offerDesc,
        createdAt: new Date(),
      });

      alert("Merchant saved successfully!");
      fetchMerchant(mobile);
    } catch (err) {
      console.error(err);
      alert("Error while geocoding or saving data.");
    }
  }

  // ----------------------------
  // Save offer to LOG (local only)
  // ----------------------------
  function saveOffer() {
    if (!offerTitle) return alert("Enter offer title");

    setLog((prev) => [
      {
        id: Date.now(),
        type: "offer",
        title: offerTitle,
        desc: offerDesc,
        time: new Date().toLocaleString(),
      },
      ...prev,
    ]);

    alert("Offer saved. Will sync to Firebase soon.");

    setOfferTitle("");
    setOfferDesc("");
  }

  // ----------------------------
  // Simulate customer geofence entry
  // ----------------------------
  function simulateEntry() {
    setLog((prev) => [
      {
        id: Date.now(),
        type: "entry",
        title: "Customer entered your geofence!",
        time: new Date().toLocaleString(),
      },
      ...prev,
    ]);

    alert("⚡ Simulated customer geofence entry");
  }

  if (loading) return <p>Loading Dashboard...</p>;

  return (
    <div style={{ padding: 14, maxWidth: 520, margin: "0 auto" }}>
      <LogoutBtn />

      <h2 style={{ marginBottom: 4 }}>Merchant Dashboard</h2>
      <p style={{ color: "#555" }}>
        Logged in as <b>{mobile}</b>
      </p>

      <hr style={{ margin: "10px 0" }} />

      <h3>Merchant Profile</h3>

      {/* Merchant Form */}
      <div
        style={{
          border: "1px solid #ddd",
          padding: 10,
          borderRadius: 8,
          marginBottom: 14,
          background: "#fff",
        }}
      >
        <input
          placeholder="Shop Name"
          value={shopName}
          onChange={(e) => setShopName(e.target.value)}
          style={inputStyle}
        />

        <textarea
          placeholder="Full Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          style={inputStyle}
        />

        <input
          placeholder="City"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          style={inputStyle}
        />

        <input
          placeholder="State"
          value={stateName}
          onChange={(e) => setStateName(e.target.value)}
          style={inputStyle}
        />

        <input
          placeholder="Pincode"
          value={pincode}
          maxLength={6}
          onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
          style={inputStyle}
        />

        {/* Geofence slider */}
        <div>
          <label>
            Geofence Radius: <b>{radius} m</b>
          </label>
          <input
            type="range"
            min="100"
            max="1000"
            step="50"
            value={radius}
            style={{ width: "100%" }}
            onChange={(e) => setRadius(Number(e.target.value))}
          />
        </div>

        <button style={saveBtn} onClick={saveMerchant}>
          Save Merchant Details & Location
        </button>
      </div>

      {/* Offer creation */}
      <h3>Create Offer</h3>

      <div
        style={{
          border: "1px solid #ddd",
          padding: 10,
          borderRadius: 8,
          marginBottom: 12,
          background: "#fff",
        }}
      >
        <input
          placeholder="Offer Title"
          value={offerTitle}
          onChange={(e) => setOfferTitle(e.target.value)}
          style={inputStyle}
        />

        <textarea
          placeholder="Offer Description"
          rows={3}
          value={offerDesc}
          onChange={(e) => setOfferDesc(e.target.value)}
          style={inputStyle}
        />

        <button style={offerBtn} onClick={saveOffer}>
          Save Offer
        </button>
      </div>

      <button onClick={simulateEntry} style={entryBtn}>
        Simulate Customer Entry
      </button>

      {/* Activity Log */}
      <h3 style={{ marginTop: 18 }}>Activity Log</h3>
      {!log.length && <p>No logs yet</p>}

      {log.map((l) => (
        <div
          key={l.id}
          style={{
            background: "#fafafa",
            border: "1px solid #eee",
            padding: 8,
            borderRadius: 6,
            marginBottom: 6,
          }}
        >
          <b>[{l.type}]</b> {l.title}
          <div style={{ fontSize: 12, color: "#666" }}>{l.time}</div>
          {l.desc && <div style={{ fontSize: 13 }}>{l.desc}</div>}
        </div>
      ))}
    </div>
  );
}

// STYLES
const inputStyle = {
  padding: 8,
  borderRadius: 6,
  width: "100%",
  marginBottom: 8,
  border: "1px solid #ccc",
};

const saveBtn = {
  padding: "8px 14px",
  background: "#007AFF",
  color: "#fff",
  borderRadius: 6,
  border: "none",
  width: "100%",
  marginTop: 8,
};

const offerBtn = {
  padding: "8px 14px",
  background: "green",
  color: "#fff",
  borderRadius: 6,
  border: "none",
  width
