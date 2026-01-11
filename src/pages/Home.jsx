import React from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: 20,
        padding: 20,
        background: "#f9fafb",
      }}
    >
      <h1 style={{ marginBottom: 10 }}>Welcome to Oshiro</h1>
      <p style={{ marginBottom: 30, color: "#555" }}>
        Choose how you want to continue
      </p>

      <button
        onClick={() => navigate("/customer/login")}
        style={{
          width: 220,
          padding: "14px 20px",
          fontSize: 16,
          cursor: "pointer",
          borderRadius: 8,
          border: "none",
          background: "#2563eb",
          color: "#fff",
        }}
      >
        I am a Customer
      </button>

      <button
        onClick={() => navigate("/merchant/login")}
        style={{
          width: 220,
          padding: "14px 20px",
          fontSize: 16,
          cursor: "pointer",
          borderRadius: 8,
          border: "1px solid #2563eb",
          background: "#fff",
          color: "#2563eb",
        }}
      >
        I am a Merchant
      </button>
    </div>
  );
}
