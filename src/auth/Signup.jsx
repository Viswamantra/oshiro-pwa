import React, { useState } from "react";
import { Box, TextField, Button, Typography } from "@mui/material";
import { db } from "../firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import bcrypt from "bcryptjs";
import { useNavigate } from "react-router-dom";

export default function Signup() {
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [role, setRole] = useState("customer");
  const navigate = useNavigate();

  const createAccount = async () => {
    if (!/^\d{10}$/.test(phone)) {
      alert("Enter valid 10-digit mobile number");
      return;
    }

    if (!/^\d{4}$/.test(pin)) {
      alert("PIN must be exactly 4 digits");
      return;
    }

    const pinHash = await bcrypt.hash(pin, 10);

    await setDoc(doc(db, "users", phone), {
      phone: "91" + phone,
      pinHash,
      role, // customer | merchant
      pinAttempts: 0,
      status: "active",
      createdAt: serverTimestamp(),
    });

    navigate("/login");
  };

  return (
    <Box sx={{ maxWidth: 360, mx: "auto", mt: 6 }}>
      <Typography variant="h6">Create Account</Typography>

      <TextField
        label="Mobile Number"
        fullWidth
        margin="normal"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />

      <TextField
        label="Create 4-digit PIN"
        type="password"
        fullWidth
        margin="normal"
        value={pin}
        onChange={(e) => setPin(e.target.value)}
      />

      <TextField
        select
        label="Account Type"
        fullWidth
        margin="normal"
        SelectProps={{ native: true }}
        value={role}
        onChange={(e) => setRole(e.target.value)}
      >
        <option value="customer">Customer</option>
        <option value="merchant">Merchant</option>
      </TextField>

      <Button fullWidth variant="contained" onClick={createAccount}>
        Create Account
      </Button>
    </Box>
  );
}

