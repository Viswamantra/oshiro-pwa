import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const [mobile, setMobile] = useState("");
  const navigate = useNavigate();

  const handleLogin = () => {
    if (mobile.length === 10) {
      // Default OTP
      const OTP = "2345";
      const userEntered = prompt("Enter OTP (default 2345):");
      if (userEntered === OTP) {
        navigate("/");
      } else {
        alert("Invalid OTP");
      }
    } else {
      alert("Enter a valid 10-digit mobile number");
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Customer Login</h2>

      <input
        type="tel"
        maxLength={10}
        placeholder="Enter 10-digit mobile"
        value={mobile}
        onChange={(e) => setMobile(e.target.value)}
      />
      <br /><br />

      <button onClick={handleLogin}>Login</button>
    </div>
  );
}

export default Login;
