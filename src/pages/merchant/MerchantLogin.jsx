import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getMerchantByMobile } from "../../firebase/barrel";
import { setActiveRole } from "../../utils/activeRole";

/**
 * =========================================================
 * MERCHANT LOGIN – FINAL (ROLE-GUARD SAFE)
 * ---------------------------------------------------------
 * ✔ Approved merchants only
 * ✔ profileComplete enforced
 * ✔ Single session source of truth
 * ✔ No OTP
 * ✔ Works with RouteGuard
 * =========================================================
 */

export default function MerchantLogin() {
  const navigate = useNavigate();

  const [mobile, setMobile] = useState("+91");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /* ======================
     MOBILE HANDLER
  ====================== */
  const handleMobileChange = (e) => {
    let value = e.target.value;

    if (!value.startsWith("+91")) value = "+91";
    value = "+91" + value.slice(3).replace(/\D/g, "");

    if (value.length > 13) value = value.slice(0, 13);
    setMobile(value);
  };

  /* ======================
     LOGIN HANDLER
  ====================== */
  const login = async () => {
    setError("");

    if (mobile.length !== 13) {
      setError("Enter valid mobile number (+91XXXXXXXXXX)");
      return;
    }

    const plainMobile = mobile.slice(3); // remove +91

    try {
      setLoading(true);

      const merchant = await getMerchantByMobile(plainMobile);

      if (!merchant) {
        setError("Merchant not registered");
        return;
      }

      if (merchant.status === "pending") {
        setError("Waiting for admin approval");
        return;
      }

      if (merchant.status === "rejected") {
        setError("Your account has been rejected");
        return;
      }

      if (merchant.status !== "approved") {
        setError("Merchant account inactive");
        return;
      }

      /* ======================
         🔐 SESSION (CRITICAL)
      ====================== */
      localStorage.setItem("mobile", plainMobile);
      setActiveRole("merchant");

      /* ======================
         MERCHANT DATA (UI USE)
      ====================== */
      localStorage.setItem(
        "merchant",
        JSON.stringify({
          id: merchant.id,
          mobile: plainMobile,
          shopName: merchant.shop_name || "",
          status: merchant.status,
          profileComplete: merchant.profileComplete === true,
        })
      );

      /* ======================
         FORCE PROFILE SETUP
      ====================== */
      if (merchant.profileComplete !== true) {
        navigate("/merchant/location", { replace: true });
        return;
      }

      /* ======================
         FULL ACCESS
      ====================== */
      navigate("/merchant", { replace: true });
    } catch (err) {
      console.error("Merchant login error:", err);
      setError("Login failed. Please try again.");
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

        <h2 style={styles.title}>Merchant Login</h2>
        <p style={styles.subtitle}>
          Login to manage your shop & offers
        </p>

        <input
          type="tel"
          value={mobile}
          onChange={handleMobileChange}
          placeholder="+91XXXXXXXXXX"
          onFocus={(e) => e.target.setSelectionRange(3, 3)}
          style={styles.input}
        />

        {error && <div style={styles.error}>{error}</div>}

        <button onClick={login} disabled={loading} style={styles.button}>
          {loading ? "Checking..." : "Login"}
        </button>

        <p style={styles.register}>
          New merchant?{" "}
          <Link to="/merchant/register" style={styles.link}>
            Register
          </Link>
        </p>
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
    color: "#fff",
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer",
  },
  register: {
    marginTop: 16,
    fontSize: 14,
  },
  link: {
    color: "#2563eb",
    fontWeight: 500,
    textDecoration: "none",
  },
};
