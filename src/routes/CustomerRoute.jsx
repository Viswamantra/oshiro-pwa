import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function CustomerRoute({ children }) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  /* ===============================
     1️⃣ AUTH LOADING STATE
  =============================== */
  if (loading) {
    return (
      <div style={styles.center}>
        <div style={styles.card}>
          <div style={styles.loader}></div>
          <p style={styles.text}>Authenticating...</p>
        </div>
      </div>
    );
  }

  /* ===============================
     2️⃣ NOT LOGGED IN
  =============================== */
  if (!user) {
    return (
      <Navigate
        to="/customer-login"
        replace
        state={{ from: location }}
      />
    );
  }

  /* ===============================
     3️⃣ ROLE STILL RESOLVING
  =============================== */
  if (!role) {
    return (
      <div style={styles.center}>
        <div style={styles.card}>
          <div style={styles.loader}></div>
          <p style={styles.text}>Loading profile...</p>
        </div>
      </div>
    );
  }

  /* ===============================
     4️⃣ WRONG ROLE
  =============================== */
  if (role !== "customer") {
    console.warn("[ROUTE] Unauthorized access attempt to customer route");
    return <Navigate to="/customer-login" replace />;
  }

  /* ===============================
     5️⃣ AUTHORIZED
  =============================== */
  return children;
}

/* ======================================
   Clean Professional Loader UI
====================================== */

const styles = {
  center: {
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f9fafb",
  },
  card: {
    padding: "30px 40px",
    borderRadius: "12px",
    backgroundColor: "#ffffff",
    boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
    textAlign: "center",
  },
  text: {
    marginTop: "15px",
    fontSize: "14px",
    color: "#555",
  },
  loader: {
    width: "35px",
    height: "35px",
    border: "4px solid #eee",
    borderTop: "4px solid #2563eb",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
};