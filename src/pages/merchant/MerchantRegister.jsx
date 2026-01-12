import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerMerchant } from "../../firebase/merchant";
import { fetchActiveCategories } from "../../firebase/categories";

/**
 * =========================================================
 * MERCHANT REGISTER (MOBILE-FIRST)
 * ---------------------------------------------------------
 * ✔ +91 locked mobile input
 * ✔ 10 digits only
 * ✔ Category selection
 * ✔ Status = pending (admin approval required)
 * ✔ UI consistent with Merchant Login
 * ✔ Oshiro logo added (PUBLIC ASSET)
 * =========================================================
 */

export default function MerchantRegister() {
  const navigate = useNavigate();

  /* ======================
     STATE
  ====================== */
  const [mobile, setMobile] = useState("+91");
  const [shopName, setShopName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /* ======================
     LOAD CATEGORIES
  ====================== */
  useEffect(() => {
    fetchActiveCategories().then(setCategories);
  }, []);

  /* ======================
     MOBILE HANDLER
  ====================== */
  const handleMobileChange = (e) => {
    let value = e.target.value;

    if (!value.startsWith("+91")) {
      value = "+91";
    }

    value = "+91" + value.slice(3).replace(/\D/g, "");
    if (value.length > 13) {
      value = value.slice(0, 13);
    }

    setMobile(value);
  };

  /* ======================
     REGISTER HANDLER
  ====================== */
  const register = async () => {
    setError("");

    if (mobile.length !== 13) {
      setError("Enter valid mobile number (+91XXXXXXXXXX)");
      return;
    }

    if (!shopName.trim()) {
      setError("Enter shop name");
      return;
    }

    if (!categoryId) {
      setError("Select category");
      return;
    }

    try {
      setLoading(true);

      await registerMerchant({
        mobile: mobile.slice(3),
        shopName,
        categoryId,
      });

      alert("Registration successful.\nWaiting for admin approval.");
      navigate("/merchant/login", { replace: true });
    } catch (err) {
      console.error("Merchant register error:", err);
      setError("Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* HOME BUTTON */}
      <div
        onClick={() => navigate("/")}
        style={styles.homeBtn}
      >
        ← Home
      </div>

      {/* REGISTER CARD */}
      <div style={styles.card}>
        {/* LOGO */}
        <img
          src="/logo/oshiro-logo-compact-3.png"
          alt="Oshiro"
          style={styles.logo}
        />

        <h2 style={styles.title}>Merchant Registration</h2>
        <p style={styles.subtitle}>
          Register your shop to start offering deals
        </p>

        {/* MOBILE */}
        <input
          type="tel"
          value={mobile}
          onChange={handleMobileChange}
          placeholder="+91XXXXXXXXXX"
          onFocus={(e) => e.target.setSelectionRange(3, 3)}
          style={styles.input}
        />

        {/* SHOP NAME */}
        <input
          type="text"
          placeholder="Shop Name"
          value={shopName}
          onChange={(e) => setShopName(e.target.value)}
          style={styles.input}
        />

        {/* CATEGORY */}
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          style={styles.select}
        >
          <option value="">Select Category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {error && <div style={styles.error}>{error}</div>}

        <button
          onClick={register}
          disabled={loading}
          style={styles.button}
        >
          {loading ? "Submitting..." : "Register"}
        </button>

        <p style={styles.note}>
          After registration, admin approval is required.
        </p>
      </div>
    </div>
  );
}

/* ======================
   STYLES (MOBILE-FIRST)
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
    maxWidth: 380,
    padding: 28,
    borderRadius: 16,
    background: "#ffffff",
    textAlign: "center",
    boxShadow: "0 16px 32px rgba(0, 0, 0, 0.1)",
  },

  logo: {
    height: 56,
    width: "auto",
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
    outline: "none",
    marginBottom: 14,
  },

  select: {
    width: "100%",
    height: 48,
    padding: "0 14px",
    fontSize: 16,
    borderRadius: 10,
    border: "1px solid #d1d5db",
    outline: "none",
    marginBottom: 14,
    background: "#fff",
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
    color: "#ffffff",
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 6px 14px rgba(37, 99, 235, 0.35)",
  },

  note: {
    marginTop: 14,
    fontSize: 13,
    color: "#6b7280",
  },
};
