import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { setActiveRole } from "../../utils/activeRole";

import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase";

import {
  initMessaging,
  updateFCMToken,
} from "../../firebase";

export default function CustomerLogin() {

  const navigate = useNavigate();

  const [mobile, setMobile] = useState("");
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const [loading, setLoading] = useState(false);

  /* ================= NAME VALIDATION ================= */
  const handleNameChange = (e) => {
    const value = e.target.value;

    if (!/^[A-Za-z]*$/.test(value)) {
      setNameError("Only English letters allowed");
      return;
    }

    if (value.length > 10) {
      setNameError("Maximum 10 characters");
      return;
    }

    setNameError("");
    setName(value);
  };

  /* ================= MOBILE VALIDATION ================= */
  const handleMobileChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 10) setMobile(value);
  };

  /* ================= SAFE LOCATION ================= */
  const getLocationSafe = () => {
    return new Promise((resolve, reject) => {

      if (!navigator.geolocation) {
        reject("No GPS");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        () => {
          navigator.geolocation.getCurrentPosition(
            (pos2) => {
              resolve({
                lat: pos2.coords.latitude,
                lng: pos2.coords.longitude,
              });
            },
            reject,
            { enableHighAccuracy: false, timeout: 15000 }
          );
        },
        { enableHighAccuracy: true, timeout: 7000 }
      );
    });
  };

  /* ================= LOGIN ================= */
  const handleSubmit = async () => {

    if (!name || mobile.length !== 10) {
      setNameError("Valid name and mobile required");
      return;
    }

    try {

      setLoading(true);
      console.log("🔥 Customer login start");

      /* ================= SAVE CUSTOMER ================= */
      await setDoc(
        doc(db, "customers", mobile),
        {
          mobile,
          name,
          role: "customer",
          lastLoginAt: serverTimestamp(),
        },
        { merge: true }
      );

      console.log("✅ Customer base saved");

      /* ================= SESSION ================= */
      localStorage.setItem("mobile", mobile);
      localStorage.setItem("name", name);
      setActiveRole("customer");

      /* ================= FCM TOKEN (CRITICAL — DO BEFORE NAV) ================= */
      try {

        console.log("📲 Initializing Messaging...");

        await initMessaging();

        console.log("📲 Updating FCM Token...");

        await updateFCMToken({
          userId: mobile,
          role: "customers",
        });

        console.log("✅ Customer token saved");

      } catch (e) {
        console.log("⚠ Token setup failed (non-blocking)", e);
      }

      /* ================= NAVIGATE ================= */
      navigate("/customer", { replace: true });

      /* ================= BACKGROUND JOBS ================= */
      setTimeout(async () => {

        try {

          console.log("🌍 Background jobs start");

          /* LOCATION SAVE */
          try {

            const loc = await getLocationSafe();

            await setDoc(
              doc(db, "customers", mobile),
              {
                lat: loc.lat,
                lng: loc.lng,
                selectedDistanceKm: 3,
                lastLocationUpdate: serverTimestamp(),
              },
              { merge: true }
            );

            console.log("✅ Location saved");

          } catch (e) {
            console.log("⚠ Location skipped", e);
          }

        } catch (err) {
          console.log("Background job error", err);
        }

      }, 1500);

    } catch (err) {

      console.error("Login failed:", err);
      setNameError("Something went wrong. Please try again.");

    } finally {

      setLoading(false);

    }
  };

  const isFormValid =
    mobile.length === 10 && name && !nameError && !loading;

  return (
    <div style={styles.page}>

      <div onClick={() => navigate("/")} style={styles.homeBtn}>
        ← Home
      </div>

      <div style={styles.card}>

        <img
          src="/logo/oshiro-logo-compact-3.png"
          alt="OshirO"
          style={styles.logo}
        />

        <h2 style={styles.title}>Welcome to OshirO 👋</h2>

        <p style={styles.subtitle}>
          Where every corner has a discount
        </p>

        <input
          type="tel"
          value={mobile}
          onChange={handleMobileChange}
          placeholder="Mobile number"
          style={styles.input}
        />

        <input
          type="text"
          value={name}
          onChange={handleNameChange}
          placeholder="Your name (Eg: Ravi)"
          style={styles.input}
        />

        {nameError && <div style={styles.error}>{nameError}</div>}

        <button
          onClick={handleSubmit}
          disabled={!isFormValid}
          style={{
            ...styles.button,
            opacity: isFormValid ? 1 : 0.6,
          }}
        >
          {loading ? "Please wait..." : "Continue →"}
        </button>

      </div>
    </div>
  );
}

/* ================= STYLES ================= */

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #f8fafc, #eef2ff)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    position: "relative",
  },
  homeBtn: {
    position: "absolute",
    top: 20,
    left: 16,
    padding: "6px 14px",
    borderRadius: 20,
    background: "#f1f5f9",
    color: "#2563eb",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
  },
  card: {
    width: "100%",
    maxWidth: 360,
    padding: 28,
    borderRadius: 16,
    background: "#ffffff",
    textAlign: "center",
    boxShadow: "0 16px 32px rgba(0, 0, 0, 0.1)",
  },
  logo: {
    height: 56,
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 600,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    height: 48,
    padding: "0 14px",
    fontSize: 16,
    borderRadius: 10,
    border: "1px solid #d1d5db",
    marginBottom: 14,
  },
  error: {
    marginBottom: 10,
    fontSize: 14,
    color: "#dc2626",
  },
  button: {
    width: "100%",
    height: 48,
    marginTop: 12,
    borderRadius: 10,
    border: "none",
    background: "linear-gradient(135deg, #2563eb, #1e40af)",
    color: "#fff",
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer",
  },
};
