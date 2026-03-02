import React, { useState, useEffect } from "react";
import { Box, Typography, TextField, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import {
RecaptchaVerifier,
signInWithPhoneNumber,
onAuthStateChanged
} from "firebase/auth";
import {
doc,
setDoc,
getDoc,
serverTimestamp
} from "firebase/firestore";
import { auth, db } from "../firebase";

const ADMIN_MOBILE = "+917386361725";
const ADMIN_OTP = "4567"; // fallback emergency admin login

export default function Login() {
const navigate = useNavigate();

const [mobile, setMobile] = useState("");
const [role, setRole] = useState("");
const [otp, setOtp] = useState("");
const [confirm, setConfirm] = useState(null);
const [error, setError] = useState("");
const [step, setStep] = useState("mobile");

/* ---------------- Recaptcha ---------------- */
useEffect(() => {
if (!window.recaptchaVerifier) {
window.recaptchaVerifier = new RecaptchaVerifier(
auth,
"recaptcha-container",
{ size: "invisible" }
);
}
}, []);

/* ---------------- Send OTP ---------------- */
const sendOtp = async () => {
try {
setError("");
const phone = "+91" + mobile;

```
  // Admin fallback login
  if (phone === ADMIN_MOBILE) {
    setStep("otp");
    return;
  }

  const confirmation = await signInWithPhoneNumber(
    auth,
    phone,
    window.recaptchaVerifier
  );

  setConfirm(confirmation);
  setStep("otp");
} catch (e) {
  console.error(e);
  setError("Failed to send OTP");
}
```

};

/* ---------------- Verify OTP ---------------- */
const verifyOtp = async () => {
try {
setError("");

```
  // Admin fallback
  if ("+91" + mobile === ADMIN_MOBILE && otp === ADMIN_OTP) {
    localStorage.setItem("oshiro_role", "admin");
    navigate("/admin", { replace: true });
    return;
  }

  const result = await confirm.confirm(otp);
  const user = result.user;
  const uid = user.uid;
  const phone = user.phoneNumber;

  /* ---------- Universal user profile ---------- */
  await setDoc(
    doc(db, "users", uid),
    {
      phone,
      role,
      lastLogin: serverTimestamp()
    },
    { merge: true }
  );

  /* ---------- Role specific ---------- */
  if (role === "customer") {
    await setDoc(
      doc(db, "customers", uid),
      {
        uid,
        phone,
        createdAt: serverTimestamp()
      },
      { merge: true }
    );

    localStorage.setItem("oshiro_role", "customer");
    navigate("/customer", { replace: true });
  }

  if (role === "merchant") {
    const merchantRef = doc(db, "merchants", uid);
    const merchantSnap = await getDoc(merchantRef);

    if (!merchantSnap.exists()) {
      localStorage.setItem("oshiro_role", "merchant");
      navigate("/merchant-register", { replace: true });
      return;
    }

    const data = merchantSnap.data();
    if (data.status !== "approved") {
      setError("Merchant approval pending");
      return;
    }

    localStorage.setItem("oshiro_role", "merchant");
    navigate("/merchant", { replace: true });
  }
} catch (e) {
  console.error(e);
  setError("Invalid OTP");
}
```

};

/* ---------------- UI ---------------- */
return (
<Box sx={{ p: 4, maxWidth: 360, mx: "auto" }}> <Typography variant="h5">Login</Typography>

```
  {step === "mobile" && (
    <>
      <TextField
        label="Mobile Number"
        fullWidth
        sx={{ mt: 2 }}
        value={mobile}
        onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
      />

      <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
        <Button onClick={() => setRole("customer")}>Customer</Button>
        <Button onClick={() => setRole("merchant")}>Merchant</Button>
      </Box>

      <Button variant="contained" sx={{ mt: 2 }} onClick={sendOtp}>
        Send OTP
      </Button>
    </>
  )}

  {step === "otp" && (
    <>
      <TextField
        label="Enter OTP"
        fullWidth
        sx={{ mt: 2 }}
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
      />

      <Button variant="contained" sx={{ mt: 2 }} onClick={verifyOtp}>
        Verify & Continue
      </Button>
    </>
  )}

  {error && (
    <Typography color="error" sx={{ mt: 2 }}>
      {error}
    </Typography>
  )}

  <div id="recaptcha-container"></div>
</Box>
```

);
}
