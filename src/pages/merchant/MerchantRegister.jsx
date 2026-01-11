import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerMerchant } from "../../firebase/merchant";
import { fetchActiveCategories } from "../../firebase/categories";

/**
 * =========================================================
 * MERCHANT REGISTER
 * ---------------------------------------------------------
 * ✔ +91 locked mobile input
 * ✔ 10 digits only
 * ✔ Category selection
 * ✔ Status = pending (admin approval required)
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
     MOBILE HANDLER (+91 LOCK)
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
     REGISTER
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
        mobile: mobile.slice(3), // store only 10 digits
        shopName,
        categoryId,
      });

      alert(
        "Registration successful.\nWaiting for admin approval."
      );

      navigate("/merchant/login", { replace: true });
    } catch (err) {
      console.error("Merchant register error:", err);
      setError("Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.box}>
      <h2>Merchant Registration</h2>

      {/* ======================
          MOBILE
      ====================== */}
      <input
        type="tel"
        value={mobile}
        onChange={handleMobileChange}
        placeholder="+91XXXXXXXXXX"
        onFocus={(e) => e.target.setSelectionRange(3, 3)}
        style={styles.input}
      />

      {/* ======================
          SHOP NAME
      ====================== */}
      <input
        type="text"
        placeholder="Shop Name"
        value={shopName}
        onChange={(e) => setShopName(e.target.value)}
        style={styles.input}
      />

      {/* ======================
          CATEGORY
      ====================== */}
      <select
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        style={styles.input}
      >
        <option value="">Select Category</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      {error && <p style={styles.error}>{error}</p>}

      <button
        onClick={register}
        disabled={loading}
        style={styles.button}
      >
        {loading ? "Submitting..." : "Register"}
      </button>
    </div>
  );
}

/* ======================
   STYLES
====================== */
const styles = {
  box: {
    maxWidth: 380,
    margin: "80px auto",
    textAlign: "center",
  },
  input: {
    width: "100%",
    padding: 10,
    marginBottom: 12,
    fontSize: 16,
  },
  button: {
    width: "100%",
    padding: 10,
    cursor: "pointer",
  },
  error: {
    color: "red",
    marginBottom: 10,
  },
};
