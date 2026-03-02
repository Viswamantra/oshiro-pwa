import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";
import {
  doc,
  setDoc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";

import { auth, db } from "../../firebase/barrel.js";
import { generateAndSaveToken } from "../../services/fcmToken";

export default function CustomerLogin() {
  const navigate = useNavigate();

  const [mobile, setMobile] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmation, setConfirmation] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /* ================= CLEANUP RECAPTCHA ================= */
  useEffect(() => {
    return () => {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    };
  }, []);

  /* ================= MOBILE VALIDATION ================= */
  const handleMobileChange = (e) => {
    const digits = e.target.value.replace(/\D/g, "");
    setMobile(digits.slice(0, 10));
  };

  /* ================= NAME VALIDATION ================= */
  const handleNameChange = (e) => {
    const value = e.target.value;
    if (!/^[A-Za-z ]*$/.test(value)) return;
    if (value.length > 30) return;
    setName(value);
  };

  /* ================= SETUP RECAPTCHA ================= */
  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        "recaptcha-container",
        { size: "invisible" },
        auth
      );
    }
  };

  /* ================= SEND OTP ================= */
  const sendOTP = async () => {
    if (loading) return;

    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    if (mobile.length !== 10) {
      setError("Enter valid 10-digit mobile number");
      return;
    }

    try {
      setLoading(true);
      setError("");

      setupRecaptcha();

      const formattedPhone = `+91${mobile}`;

      const confirmationResult = await signInWithPhoneNumber(
        auth,
        formattedPhone,
        window.recaptchaVerifier
      );

      setConfirmation(confirmationResult);
    } catch (err) {
      console.error("OTP send failed:", err);
      setError(err.message || "OTP send failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ================= VERIFY OTP ================= */
  const verifyOTP = async () => {
    if (loading) return;

    if (otp.length !== 6) {
      setError("Enter valid 6-digit OTP");
      return;
    }

    if (!confirmation) {
      setError("Session expired. Request OTP again.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const result = await confirmation.confirm(otp);
      const user = result.user;
      const uid = user.uid;

      /* ===== CREATE / UPDATE CUSTOMER DOC ===== */
      const ref = doc(db, "customers", uid);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        await setDoc(ref, {
          uid,
          mobile: user.phoneNumber,
          name: name.trim(),
          role: "customer",
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
        });
      } else {
        await setDoc(
          ref,
          {
            name: name.trim(),
            lastLoginAt: serverTimestamp(),
          },
          { merge: true }
        );
      }

      /* =====================================================
         🔥 FCM FIRST — CRITICAL FIX (NO RACE CONDITION)
      ====================================================== */
      try {
        await generateAndSaveToken(uid, "customer");
        console.log("[LOGIN] FCM token generated before navigation");
      } catch (e) {
        console.log("[LOGIN] FCM failed but login unaffected:", e.message);
      }

      /* ===== NAVIGATE AFTER TOKEN ===== */
      navigate("/customer", { replace: true });

    } catch (err) {
      console.error("OTP verification failed:", err);
      setError("Invalid or expired OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>Customer Login</h2>

        {!confirmation && (
          <>
            <input
              type="tel"
              value={mobile}
              onChange={handleMobileChange}
              placeholder="Enter 10-digit mobile number"
              maxLength={10}
              style={styles.input}
            />

            <input
              type="text"
              value={name}
              onChange={handleNameChange}
              placeholder="Enter your name"
              style={styles.input}
            />

            {error && <div style={styles.error}>{error}</div>}

            <button
              onClick={sendOTP}
              style={styles.button}
              disabled={loading}
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </>
        )}

        {confirmation && (
          <>
            <input
              type="text"
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="Enter 6-digit OTP"
              maxLength={6}
              style={styles.input}
            />

            {error && <div style={styles.error}>{error}</div>}

            <button
              onClick={verifyOTP}
              style={styles.button}
              disabled={loading}
            >
              {loading ? "Verifying..." : "Verify & Continue"}
            </button>
          </>
        )}

        <div id="recaptcha-container"></div>
      </div>
    </div>
  );
}

/* ================= STYLES ================= */

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f5f7fb",
  },
  card: {
    width: 340,
    padding: 24,
    borderRadius: 14,
    background: "#fff",
    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
  },
  title: { marginBottom: 16 },
  input: {
    width: "100%",
    height: 44,
    marginBottom: 12,
    padding: "0 10px",
    borderRadius: 8,
    border: "1px solid #ccc",
  },
  button: {
    width: "100%",
    height: 44,
    borderRadius: 8,
    border: "none",
    background: "#2563eb",
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
  },
  error: {
    color: "red",
    fontSize: 14,
    marginBottom: 10,
  },
};