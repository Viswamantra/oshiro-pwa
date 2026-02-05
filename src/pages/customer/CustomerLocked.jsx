import React from "react";

export default function CustomerLocked() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f3f4f6",
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "#ffffff",
          padding: "40px",
          borderRadius: "12px",
          textAlign: "center",
          maxWidth: "420px",
          width: "100%",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
        }}
      >
        <h2 style={{ marginBottom: "10px" }}>
          🚧 App Under Maintenance
        </h2>

        <p style={{ marginTop: "12px", color: "#555", lineHeight: 1.6 }}>
          The customer app is temporarily unavailable while we
          make improvements.
          <br />
          <br />
          Please check back again soon.
        </p>

        <p
          style={{
            marginTop: "20px",
            fontSize: "14px",
            color: "#888",
          }}
        >
          Thank you for your patience 🙏
        </p>
      </div>
    </div>
  );
}
