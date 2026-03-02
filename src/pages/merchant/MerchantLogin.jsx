import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import { auth, db } from "../../firebase/barrel.js";

/**
 * ==========================================
 * OSHIRO MERCHANT LOGIN — FINAL FIXED
 * ==========================================
 * ✔ Proper navigation after OTP
 * ✔ No redirect loop
 * ✔ Strict 10-digit validation
 * ✔ Recaptcha safe cleanup
 */

export default function MerchantLogin() {
  const navigate = useNavigate();

  const [mobile, setMobile] = useState("");
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

  /* ================= MOBILE INPUT ================= */
  const handleMobileChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 10) {
      setMobile(value);
    }
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
      setError("OTP send failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ================= VERIFY OTP ================= */
  const verifyOTP = async () => {
    if (loading) return;

    if (!otp || otp.length !== 6) {
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

      /* ===== CREATE / UPDATE MERCHANT DOC ===== */
      const merchantRef = doc(db, "merchants", uid);
      const merchantSnap = await getDoc(merchantRef);

      if (!merchantSnap.exists()) {
        await setDoc(merchantRef, {
          uid,
          mobile: user.phoneNumber,
          role: "merchant",
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
        });
      } else {
        await setDoc(
          merchantRef,
          { lastLoginAt: serverTimestamp() },
          { merge: true }
        );
      }

      /* ================= FIXED PART ================= */
      // 🔥 Explicit navigation (required because you're using RouteGuard)
      navigate("/merchant/dashboard", { replace: true });

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
        <h2 style={styles.title}>Merchant Login</h2>

        {!confirmation && (
          <>
            <input
              type="tel"
              value={mobile}
              onChange={handleMobileChange}
              placeholder="Enter 10-digit mobile number"
              style={styles.input}
            />

            {error && <div style={styles.error}>{error}</div>}

            <button onClick={sendOTP} style={styles.button}>
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
              style={styles.input}
            />

            {error && <div style={styles.error}>{error}</div>}

            <button onClick={verifyOTP} style={styles.button}>
              {loading ? "Verifying..." : "Verify OTP"}
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
    background: "#2e7d32",
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