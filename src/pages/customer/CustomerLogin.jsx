import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth } from "../../firebase/barrel";

/**
 * =========================================================
 * CUSTOMER LOGIN (PHONE AUTH - UID BASED)
 * ---------------------------------------------------------
 * ✔ Uses Firebase Phone Authentication
 * ✔ UID-based session (NO mobile localStorage logic)
 * ✔ Prevents login loop
 * ✔ Production-ready
 * =========================================================
 */

export default function CustomerLogin() {
  const navigate = useNavigate();

  const [mobile, setMobile] = useState("+91");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /* ======================
     AUTO REDIRECT IF LOGGED IN
  ====================== */
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        navigate("/customer", { replace: true });
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  /* ======================
     MOBILE INPUT HANDLER
  ====================== */
  const handleMobileChange = (e) => {
    let value = e.target.value;

    if (!value.startsWith("+91")) {
      value = "+91";
    }

    let digits = value.slice(3).replace(/\D/g, "");
    if (digits.length > 10) {
      digits = digits.slice(0, 10);
    }

    setMobile("+91" + digits);
  };

  const lockCursor = (e) => {
    if (e.target.selectionStart < 3) {
      e.target.setSelectionRange(3, 3);
    }
  };

  /* ======================
     LOGIN HANDLER
  ====================== */
  const handleLogin = async () => {
    setError("");

    if (mobile.length !== 13) {
      setError("Enter valid mobile number (+91XXXXXXXXXX)");
      return;
    }

    try {
      setLoading(true);

      // Setup invisible recaptcha
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        { size: "invisible" }
      );

      const confirmationResult = await signInWithPhoneNumber(
        auth,
        mobile,
        window.recaptchaVerifier
      );

      const otp = window.prompt("Enter OTP");

      if (!otp) {
        setError("OTP required");
        return;
      }

      await confirmationResult.confirm(otp);

      // Firebase session will persist automatically
      navigate("/customer", { replace: true });

    } catch (err) {
      console.error(err);
      setError("Login failed. Try again.");
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
          alt="Oshiro"
          style={styles.logo}
        />

        <h2 style={styles.title}>Customer Login</h2>
        <p style={styles.subtitle}>
          Enter your mobile number to continue
        </p>

        <input
          type="tel"
          value={mobile}
          placeholder="+91XXXXXXXXXX"
          onChange={handleMobileChange}
          onFocus={lockCursor}
          onClick={lockCursor}
          onKeyUp={lockCursor}
          style={styles.input}
        />

        {error && <div style={styles.error}>{error}</div>}

        <button onClick={handleLogin} style={styles.button}>
          {loading ? "Please wait..." : "Login"}
        </button>

        {/* Invisible Recaptcha */}
        <div id="recaptcha-container"></div>
      </div>
    </div>
  );
}

/* ======================
   STYLES
====================== */

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
  },
  error: {
    marginTop: 10,
    fontSize: 14,
    color: "#dc2626",
  },
  button: {
    width: "100%",
    height: 48,
    marginTop: 24,
    borderRadius: 10,
    border: "none",
    background: "linear-gradient(135deg, #2563eb, #1e40af)",
    color: "#ffffff",
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer",
  },
};