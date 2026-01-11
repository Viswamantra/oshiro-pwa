import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getMerchantByMobile } from "../../firebase/merchant";

/**
 * =========================================================
 * MERCHANT LOGIN
 * ---------------------------------------------------------
 * ✔ Mobile-based login (DEV MODE)
 * ✔ +91 locked mobile input
 * ✔ Status-based access control
 * ✔ Stores merchant session in localStorage
 * ✔ Enables GPS Location tab only after approval
 * =========================================================
 */

export default function MerchantLogin() {
  const navigate = useNavigate();

  /* ======================
     STATE
  ====================== */
  const [mobile, setMobile] = useState("+91");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /* ======================
     MOBILE HANDLER (+91 LOCK)
  ====================== */
  const handleMobileChange = (e) => {
    let value = e.target.value;

    // Always keep +91
    if (!value.startsWith("+91")) {
      value = "+91";
    }

    // Remove non-digits after +91
    value = "+91" + value.slice(3).replace(/\D/g, "");

    // Limit to +91 + 10 digits
    if (value.length > 13) {
      value = value.slice(0, 13);
    }

    setMobile(value);
  };

  /* ======================
     LOGIN
  ====================== */
  const login = async () => {
    setError("");

    // +91 + 10 digits = length 13
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

      /* ======================
         STATUS CHECK
      ====================== */
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
         STORE SESSION
      ====================== */
      localStorage.setItem(
        "merchant",
        JSON.stringify({
          id: merchant.id,
          mobile: mobile, // stored with +91
          name: merchant.shopName || "",
          status: merchant.status,
          role: "merchant",
        })
      );

      navigate("/merchant", { replace: true });
    } catch (err) {
      console.error("Merchant login error:", err);
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.box}>
      <h2>Merchant Login</h2>

      <input
        type="tel"
        value={mobile}
        onChange={handleMobileChange}
        placeholder="+91XXXXXXXXXX"
        onFocus={(e) => e.target.setSelectionRange(3, 3)}
        style={styles.input}
      />

      {error && <p style={styles.error}>{error}</p>}

      <button
        onClick={login}
        style={styles.button}
        disabled={loading}
      >
        {loading ? "Checking..." : "Login"}
      </button>

      <p style={{ marginTop: 10 }}>
        New merchant?{" "}
        <Link to="/merchant/register">Register</Link>
      </p>
    </div>
  );
}

/* ======================
   STYLES
====================== */
const styles = {
  box: {
    maxWidth: 360,
    margin: "100px auto",
    textAlign: "center",
  },
  input: {
    width: "100%",
    padding: 10,
    marginBottom: 10,
    fontSize: 16,
  },
  button: {
    width: "100%",
    padding: 10,
    cursor: "pointer",
  },
  error: {
    color: "red",
  },
};
