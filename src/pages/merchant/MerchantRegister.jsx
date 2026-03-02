import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

/* ✅ Clean barrel import */
import { registerMerchant, fetchActiveCategories } from "../../firebase/barrel";

import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth } from "../../firebase";

/**
 * =========================================================
 * MERCHANT REGISTER – CLEAN STABLE VERSION
 * ---------------------------------------------------------
 * ✔ Mobile auto from Firebase Auth
 * ✔ No manual mobile entry
 * ✔ Uses merchant.js as single source
 * ✔ Category sync
 * ✔ Optional shop image upload
 * ✔ Default status: pending
 * =========================================================
 */

export default function MerchantRegister() {
  const navigate = useNavigate();
  const storage = getStorage();

  /* ======================
     STATE
  ====================== */
  const [shopName, setShopName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState([]);
  const [shopImageFile, setShopImageFile] = useState(null);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const currentUser = auth.currentUser;
  const phoneNumber = currentUser?.phoneNumber || "";

  /* ======================
     LOAD CATEGORIES
  ====================== */
  useEffect(() => {
    let mounted = true;

    async function loadCategories() {
      try {
        const data = await fetchActiveCategories();
        if (mounted) setCategories(data || []);
      } catch (err) {
        console.error(err);
        if (mounted) setCategories([]);
      }
    }

    loadCategories();
    return () => (mounted = false);
  }, []);

  /* ======================
     IMAGE HANDLER
  ====================== */
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setShopImageFile(file);
  };

  /* ======================
     REGISTER HANDLER
  ====================== */
  const handleRegister = async () => {
    if (loading) return;

    setError("");

    if (!currentUser) {
      setError("Authentication required. Please login again.");
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

      const selectedCategory = categories.find(
        (c) => c.id === categoryId
      );

      /* ===== Upload Shop Image (Optional) ===== */
      let shopImageUrl = "";

      if (shopImageFile) {
        const storageRef = ref(
          storage,
          `merchant-shops/${currentUser.uid}_${Date.now()}_${shopImageFile.name}`
        );

        await uploadBytes(storageRef, shopImageFile);
        shopImageUrl = await getDownloadURL(storageRef);
      }

      /* ===== Register Merchant ===== */
      await registerMerchant({
        mobile: phoneNumber, // Required by merchant.js
        shopName: shopName.trim(),
        category: selectedCategory?.name || "",
        lat: null,
        lng: null,
      });

      alert(
        "Registration successful.\nYour account is pending admin approval."
      );

      navigate("/merchant/login", { replace: true });

    } catch (err) {
      console.error(err);
      setError(err?.message || "Registration failed");
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

        <h2 style={styles.title}>Merchant Registration</h2>

        {/* AUTHENTICATED MOBILE DISPLAY */}
        <div style={styles.mobileBox}>
          Registered Mobile: {phoneNumber || "Not Available"}
        </div>

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

        {/* SHOP IMAGE */}
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          style={styles.input}
        />

        {error && <div style={styles.error}>{error}</div>}

        <button
          onClick={handleRegister}
          disabled={loading}
          style={styles.button}
        >
          {loading ? "Submitting..." : "Register"}
        </button>
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
    background: "linear-gradient(180deg,#f8fafc,#eef2ff)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  homeBtn: {
    position: "absolute",
    top: 20,
    left: 16,
    cursor: "pointer",
  },
  card: {
    width: "100%",
    maxWidth: 380,
    padding: 28,
    borderRadius: 16,
    background: "#fff",
    textAlign: "center",
  },
  logo: { height: 56, marginBottom: 24 },
  title: { fontSize: 22, fontWeight: 600, marginBottom: 20 },
  mobileBox: {
    background: "#eef2ff",
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
    fontSize: 14,
  },
  input: {
    width: "100%",
    height: 48,
    padding: "0 14px",
    borderRadius: 10,
    border: "1px solid #d1d5db",
    marginBottom: 14,
  },
  select: {
    width: "100%",
    height: 48,
    padding: "0 14px",
    borderRadius: 10,
    border: "1px solid #d1d5db",
    marginBottom: 14,
  },
  error: { color: "red", marginBottom: 10 },
  button: {
    width: "100%",
    height: 48,
    borderRadius: 10,
    border: "none",
    background: "#2563eb",
    color: "#fff",
    cursor: "pointer",
  },
};
