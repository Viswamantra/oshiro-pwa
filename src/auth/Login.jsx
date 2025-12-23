
import React, { useState } from "react";
import { Box, TextField, Button, Typography } from "@mui/material";
import { db } from "../firebase";
import { doc, getDoc, updateDoc, increment } from "firebase/firestore";
import bcrypt from "bcryptjs";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const navigate = useNavigate();

  const login = async () => {
    const ref = doc(db, "users", phone);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      alert("User not found");
      return;
    }

    const user = snap.data();

    if (user.pinAttempts >= 5) {
      alert("Account locked. Try again later.");
      return;
    }

    const valid = await bcrypt.compare(pin, user.pinHash);

    if (!valid) {
      await updateDoc(ref, { pinAttempts: increment(1) });
      alert("Incorrect PIN");
      return;
    }

    await updateDoc(ref, { pinAttempts: 0 });

    if (user.role === "merchant") {
      navigate("/merchant-dashboard");
    } else {
      navigate("/customer-dashboard");
    }
  };

  return (
    <Box sx={{ maxWidth: 360, mx: "auto", mt: 6 }}>
      <Typography variant="h6">User Login</Typography>

      <TextField
        label="Mobile Number"
        fullWidth
        margin="normal"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />

      <TextField
        label="4-digit PIN"
        type="password"
        fullWidth
        margin="normal"
        value={pin}
        onChange={(e) => setPin(e.target.value)}
      />

      <Button fullWidth variant="contained" onClick={login}>
        Log In
      </Button>

      <Button fullWidth onClick={() => navigate("/forgot-pin")}>
        Forgot PIN?
      </Button>
    </Box>
  );
}
