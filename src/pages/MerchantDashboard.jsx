// src/pages/MerchantDashboard.jsx
import React, { useState } from "react";

const DEFAULT_OTP = "2345";

export default function MerchantDashboard() {
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [radius, setRadius] = useState(300);
  const [offerTitle, setOfferTitle] = useState("");
  const [offerDesc, setOfferDesc] = useState("");
  const [log, setLog] = useState([]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (mobile.length !== 10) {
      alert("Enter 10-digit mobile number.");
      return;
    }
    if (otp !== DEFAULT_OTP) {
      alert("Invalid OTP. Use 2345 for now.");
      return;
    }
    setIsLoggedIn(true);
  };

  const handleCreateOffer = (e) => {
    e.preventDefault();
    if (!offerTitle) return;
    // TODO: send to Firebase
    setLog((prev) => [
      {
        id: Date.now(),
        type: "offer",
        title: offerTitle,
        desc: offerDesc,
        createdAt: new Date().toLocaleString(),
      },
      ...prev,
    ]);
    setOfferTitle("");
    setOfferDesc("");
  };

  const simulateCustomerEntry = () => {
    setLog((prev) => [
      {
        id: Date.now(),
        type: "entry",
        title: "Customer entered geofence",
        createdAt: new Date().toLocaleString(),
      },
      ...prev,
    ]);
    // TODO: trigger push via /api/sendPush + Firebase
  };

  if (!isLoggedIn) {
    return (
      <div style={{ padding: "0.75rem" }}>
        <h2 style={{ marginTop: 0 }}>Merchant Login</h2>
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          <div>
            <label style={{ fontSize: "0.85rem" }}>Mobile Number</label>
            <input
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
              maxLength={10}
              placeholder="10-digit mobile"
              style={{
                width: "100%",
                padding: "0.5rem",
                borderRadius: "6px",
                border: "1px solid #ccc",
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: "0.85rem" }}>OTP (demo)</label>
            <input
              type="password"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={4}
              placeholder="Use 2345"
              style={{
                width: "100%",
                padding: "0.5rem",
                borderRadius: "6px",
                border: "1px solid #ccc",
              }}
            />
          </div>
          <button
            type="submit"
            style={{
              padding: "0.6rem",
              borderRadius: "6px",
              border: "none",
              background: "#007AFF",
              color: "#fff",
              fontWeight: 600,
            }}
          >
            Login
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <h2 style={{ marginTop: 0 }}>Merchant Dashboard</h2>
      <p style={{ fontSize: "0.85rem", color: "#555" }}>
        Set your geofence, create instant offers, and see who enters your zone.
      </p>

      {/* Geofence radius */}
      <div
        style={{
          padding: "0.75rem",
          borderRadius: "8px",
          border: "1px solid #eee",
          background: "#fff",
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: "0.5rem" }}>Home Boundary Radius</div>
        <input
          type="range"
          min={100}
          max={1000}
          step={50}
          value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
          style={{ width: "100%" }}
        />
        <div style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>{radius} meters</div>
        <div style={{ fontSize: "0.75rem", color: "#777", marginTop: "0.25rem" }}>
          (Map integration to show circle can be wired to this radius.)
        </div>
      </div>

      {/* Offer creation */}
      <form
        onSubmit={handleCreateOffer}
        style={{
          padding: "0.75rem",
          borderRadius: "8px",
          border: "1px solid #eee",
          background: "#fff",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
        }}
      >
        <div style={{ fontWeight: 600 }}>Create Instant Offer</div>
        <input
          type="text"
          value={offerTitle}
          onChange={(e) => setOfferTitle(e.target.value)}
          placeholder="Offer title (e.g., 30% off lunch)"
          style={{
            width: "100%",
            padding: "0.5rem",
            borderRadius: "6px",
            border: "1px solid #ccc",
          }}
        />
        <textarea
          value={offerDesc}
          onChange={(e) => setOfferDesc(e.target.value)}
          placeholder="Offer details"
          rows={3}
          style={{
            width: "100%",
            padding: "0.5rem",
            borderRadius: "6px",
            border: "1px solid #ccc",
            resize: "vertical",
          }}
        />
        <button
          type="submit"
          style={{
            padding: "0.6rem",
            borderRadius: "6px",
            border: "none",
            background: "#28A745",
            color: "#fff",
            fontWeight: 600,
          }}
        >
          Save & Push Offer (hook to Firebase later)
        </button>
      </form>

      {/* Simulate geofence entry + push */}
      <button
        type="button"
        onClick={simulateCustomerEntry}
        style={{
          padding: "0.6rem",
          borderRadius: "6px",
          border: "none",
          background: "#FF9500",
          color: "#fff",
          fontWeight: 600,
        }}
      >
        Simulate Customer Entering Geofence
      </button>

      {/* Activity log */}
      <div
        style={{
          padding: "0.75rem",
          borderRadius: "8px",
          border: "1px solid #eee",
          background: "#fff",
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: "0.5rem" }}>Activity</div>
        {log.length === 0 && (
          <div style={{ fontSize: "0.85rem", color: "#777" }}>No activity yet.</div>
        )}
        {log.map((item) => (
          <div
            key={item.id}
            style={{
              padding: "0.4rem 0",
              borderBottom: "1px solid #f5f5f5",
              fontSize: "0.85rem",
            }}
          >
            <strong>[{item.type}]</strong> {item.title}
            <div style={{ fontSize: "0.75rem", color: "#777" }}>{item.createdAt}</div>
            {item.desc && (
              <div style={{ fontSize: "0.8rem", color: "#555" }}>{item.desc}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
<button
  style={{
    padding: "6px 12px",
    margin: "10px 0",
    background: "#ff4d4d",
    color: "#fff",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer"
  }}
  onClick={() => {
    localStorage.clear();
    window.location.href = "/";
  }}
>
  Logout
</button>
