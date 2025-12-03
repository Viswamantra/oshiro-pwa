import { useState } from "react";
import { useNavigate } from "react-router-dom";

const adminMobile = "7386361725";
const adminPassword = "4567";
const defaultOTP = "2345";

function Login() {
  const [mobile, setMobile] = useState("");
  const navigate = useNavigate();

  const handleLogin = () => {
    if (mobile.length !== 10) {
      alert("Enter valid 10-digit mobile number");
      return;
    }

    // Admin Login Validation
    if (mobile === adminMobile) {
      const password = prompt("Enter Admin Password (default 4567):");

      if (password === adminPassword) {
        localStorage.setItem("logged_role", "admin");
        localStorage.setItem("mobile", mobile);
        alert("Admin Login Successful");
        navigate("/admin");
        return;
      } else {
        alert("Invalid Admin Password");
        return;
      }
    }

    // OTP for customers and merchants
    const otp = prompt("Enter OTP (default 2345):");
    if (otp !== defaultOTP) {
      alert("Invalid OTP");
      return;
    }

    // If merchant
    // later check using firebase merchants list
    if (mobile.startsWith("9")) {
      localStorage.setItem("logged_role", "merchant");
      localStorage.setItem("mobile", mobile);
      alert("Merchant Login Successful");
      navigate("/merchant");
      return;
    }

    // Otherwise Customer
    localStorage.setItem("logged_role", "customer");
    localStorage.setItem("mobile", mobile);
    alert("Customer Login Successful");
    navigate("/home");
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>OshirO Login</h2>
      <input
        type="tel"
        maxLength={10}
        placeholder="Enter mobile number"
        value={mobile}
        onChange={(e) => setMobile(e.target.value)}
      />
      <br /><br />
      <button onClick={handleLogin}>Login</button>
    </div>
  );
}

export default Login;
