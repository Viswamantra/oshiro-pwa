import React, { useState } from "react";
import { Box, TextField, Button, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

/* =====================
   CONSTANTS
===================== */
const TEST_CUSTOMER_OTP = "2345";
const ADMIN_MOBILE = "7386361725";
const ADMIN_PASSWORD = "2#345";

export default function Login() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const login = async () => {
    try {
      if (!phone) {
        alert("Enter mobile number");
        return;
      }

      /* =====================
         ADMIN LOGIN
      ===================== */
      if (phone === ADMIN_MOBILE && password) {
        if (password !== ADMIN_PASSWORD) {
          alert("Invalid admin password");
          return;
        }
        navigate("/admin-dashboard");
        return;
      }

      /* =====================
         MERCHANT LOGIN
      ===================== */
      if (password) {
        const ref = doc(db, "merchants", phone);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          alert("Merchant not found");
          return;
        }

        const merchant = snap.data();

        if (!merchant.active) {
          alert("Merchant account disabled");
          return;
        }

        if (merchant.password !== password) {
          alert("Wrong password");
          return;
        }

        navigate("/merchant-dashboard");
        return;
      }

      /* =====================
         CUSTOMER LOGIN (OTP)
      ===================== */
      if (otp !== TEST_CUSTOMER_OTP) {
        alert("Invalid OTP");
        return;
      }

      const ref = doc(db, "customers", phone);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        await setDoc(ref, {
          mobile: phone,
          role: "customer",
          createdAt: Date.now(),
        });
      }

      navigate("/customer-dashboard");
    } catch (err) {
      console.error(err);
      alert("Login failed");
    }
  };

  return (
    <Box sx={{ maxWidth: 360, mx: "auto", mt: 6 }}>
      <Typography variant="h6" align="center">
        Customer / Merchant Login
      </Typography>

      <TextField
        label="Mobile Number"
        fullWidth
        margin="normal"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />

      <TextField
        label="OTP (Customer: 2345)"
        fullWidth
        margin="normal"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
      />

      <TextField
        label="Password (Merchant / Admin)"
        type="password"
        fullWidth
        margin="normal"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <Button fullWidth variant="contained" onClick={login}>
        CONTINUE
      </Button>
    </Box>
  );
}
