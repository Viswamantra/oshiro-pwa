import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";
import { setActiveRole } from "../../utils/activeRole";

export default function AdminLogin() {
  const navigate = useNavigate();
  const auth = getAuth();

  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmation, setConfirmation] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /* ================= SEND OTP ================= */
  const sendOTP = async () => {
    setError("");

    if (!mobile || mobile.length !== 10) {
      setError("Enter valid 10-digit mobile number");
      return;
    }

    try {
      setLoading(true);

      // Prevent duplicate recaptcha
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(
          "recaptcha-container",
          { size: "invisible" },
          auth
        );
      }

      const appVerifier = window.recaptchaVerifier;

      const result = await signInWithPhoneNumber(
        auth,
        "+91" + mobile,
        appVerifier
      );

      setConfirmation(result);
      alert("OTP sent. Use Firebase test OTP if configured.");

    } catch (err) {
      console.error("OTP Error:", err);
      setError("Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  /* ================= VERIFY OTP ================= */
  const verifyOTP = async () => {
    setError("");

    if (!otp) {
      setError("Enter OTP");
      return;
    }

    if (!confirmation) {
      setError("Send OTP first");
      return;
    }

    try {
      setLoading(true);

      const result = await confirmation.confirm(otp);
      const user = result.user;

      console.log("✅ Admin Logged In UID:", user.uid);

      // Store mobile for session
      localStorage.setItem("mobile", mobile);

      // 🔒 IMPORTANT: Set role properly
      setActiveRole("admin");

      navigate("/admin", { replace: true });

    } catch (err) {
      console.error("OTP Verify Error:", err);
      setError("Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

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

        <h2 style={styles.title}>Admin Login</h2>
        <p style={styles.subtitle}>Authorized access only</p>

        <input
          type="tel"
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
          placeholder="Admin mobile number"
          style={styles.input}
        />

        {!confirmation ? (
          <button onClick={sendOTP} style={styles.button} disabled={loading}>
            {loading ? "Sending..." : "Send OTP →"}
          </button>
        ) : (
          <>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter OTP"
              style={styles.input}
            />

            <button
              onClick={verifyOTP}
              style={styles.button}
              disabled={loading}
            >
              {loading ? "Verifying..." : "Verify OTP →"}
            </button>
          </>
        )}

        {error && <div style={styles.error}>{error}</div>}

        <div id="recaptcha-container"></div>
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