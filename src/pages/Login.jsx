// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";

// Hard-coded admin credentials (later move to backend)
const ADMIN_MOBILE = "7386361725";
const ADMIN_PASS = "4567";
const DEFAULT_OTP = "2345";

function Login() {
  const [mobile, setMobile] = useState("");
  const navigate = useNavigate();

  const handleLogin = () => {
    if (mobile.length !== 10) {
      alert("Enter a valid 10-digit mobile number");
      return;
    }

    // 1) Admin login (mobile + password)
    if (mobile === ADMIN_MOBILE) {
      const password = prompt("Enter Admin password (4567):");
      if (password === ADMIN_PASS) {
        localStorage.setItem("logged_role", "admin");
        localStorage.setItem("mobile", mobile);
        alert("Admin login success");
        navigate("/admin");
        return;
      } else {
        alert("Invalid admin password");
        return;
      }
    }

    // 2) OTP verification for customer / merchant
    const otp = prompt("Enter OTP (default 2345):");
    if (otp !== DEFAULT_OTP) {
      alert("Invalid OTP");
      return;
    }

    // Simple rule for now:
    // mobile starting with 9 → treat as merchant
    // everything else → customer
    let role = "customer";
    if (mobile.startsWith("9")) {
      role = "merchant";
    }

    localStorage.setItem("logged_role", role);
    localStorage.setItem("mobile", mobile);

    if (role === "merchant") {
      alert("Merchant login success");
      navigate("/merchant");
    } else {
      alert("Customer login success");
      navigate("/home");
    }
  };

  return (
    <div style={{ padding: 16, maxWidth: 400, margin: "0 auto" }}>
      <h2>OshirO Login</h2>
      <p>Login using your mobile number</p>

      <input
        type="tel"
        maxLength={10}
        placeholder="10-digit mobile number"
        value={mobile}
        onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
        style={{ width: "100%", padding: 8, fontSize: 16 }}
      />

      <button
        onClick={handleLogin}
        style={{
          marginTop: 16,
          width: "100%",
          padding: 10,
          fontSize: 16,
          background: "#007bff",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          cursor: "pointer",
        }}
      >
        Continue
      </button>
    </div>
  );
}

export default Login;
