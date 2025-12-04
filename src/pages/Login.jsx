// src/pages/Login.jsx

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

// Hard-coded admin credentials
const ADMIN_MOBILE = "7386361725";
const ADMIN_PASS = "4567";
const DEFAULT_OTP = "2345";

export default function Login() {
  const [mobile, setMobile] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  // Detect which login type from route
  // "/customer-login" → "customer"
  // "/merchant-login" → "merchant"
  // "/admin-login" → "admin"
  const currentRole = location.pathname.replace("/", "").replace("-login", "");

  useEffect(() => {
    // Prevent entering login pages without choosing role
    localStorage.setItem("user_role", currentRole);
  }, [currentRole]);

  const handleLogin = () => {
    if (mobile.length !== 10) {
      alert("Enter a valid 10-digit mobile number");
      return;
    }

    // --------------------
    // Admin Authentication
    // --------------------
    if (currentRole === "admin") {
      if (mobile !== ADMIN_MOBILE) {
        alert("Not an authorized admin.");
        return;
      }

      const password = prompt("Enter Admin password (4567):");
      if (password !== ADMIN_PASS) {
        alert("Invalid admin password");
        return;
      }

      localStorage.setItem("logged_role", "admin");
      localStorage.setItem("mobile", mobile);

      alert("Admin login success");
      navigate("/admin");
      return;
    }

    // --------------------
    // Customer / Merchant OTP Check
    // --------------------
    const otp = prompt("Enter OTP (default 2345):");
    if (otp !== DEFAULT_OTP) {
      alert("Invalid OTP");
      return;
    }

    localStorage.setItem("logged_role", currentRole);
    localStorage.setItem("mobile", mobile);

    if (currentRole === "merchant") {
      alert("Merchant login success");
      navigate("/merchant");
    } else if (currentRole === "customer") {
      alert("Customer login success");
      navigate("/home");
    }
  };

  return (
    <div style={{ padding: 16, maxWidth: 420, margin: "0 auto" }}>
      <h2 style={{ marginBottom: 8 }}>
        {currentRole === "customer" && "Customer Login"}
        {currentRole === "merchant" && "Merchant Login"}
        {currentRole === "admin" && "Admin Login"}
      </h2>

      <p>Enter your mobile number to continue</p>

      <input
        type="tel"
        maxLength={10}
        placeholder="10-digit mobile number"
        value={mobile}
        onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
        style={{
          width: "100%",
          padding: 10,
          fontSize: 16,
          borderRadius: 6,
          border: "1px solid #ccc",
        }}
      />

      <button
        onClick={handleLogin}
        style={{
          marginTop: 16,
          width: "100%",
          padding: 12,
          fontSize: 16,
          background: "#0066ff",
          color: "#fff",
          border: "none",
          borderRadius: 6,
        }}
      >
        Continue
      </button>
    </div>
  );
}
