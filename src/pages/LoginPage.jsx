import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper
} from "@mui/material";
import { db } from "../firebase";
import { doc, getDoc, updateDoc, increment } from "firebase/firestore";
import bcrypt from "bcryptjs";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [mobile, setMobile] = useState("");
  const [pin, setPin] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!/^\d{10}$/.test(mobile)) {
      alert("Enter valid 10-digit mobile number");
      return;
    }

    if (!/^\d{4}$/.test(pin)) {
      alert("Enter 4-digit PIN");
      return;
    }

    const userRef = doc(db, "users", mobile);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      alert("User not registered");
      return;
    }

    const user = snap.data();

    if (user.pinAttempts >= 5) {
      alert("Account locked. Try later.");
      return;
    }

    const ok = await bcrypt.compare(pin, user.pinHash);

    if (!ok) {
      await updateDoc(userRef, {
        pinAttempts: increment(1),
      });
      alert("Wrong PIN");
      return;
    }

    // Reset attempts
    await updateDoc(userRef, { pinAttempts: 0 });

    // 🔀 ROLE ROUTING
    if (user.role === "admin") {
      navigate("/admin");
    } else if (user.role === "merchant") {
      navigate("/merchant");
    } else {
      navigate("/customer");
    }
  };

  return (
    <Box
      sx={{
        minHeight: "80vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Paper sx={{ p: 4, width: 350 }}>
        <Typography variant="h6" mb={2}>
          User Login
        </Typography>

        <TextField
          label="Mobile No"
          fullWidth
          margin="normal"
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
        />

        <TextField
          label="4-digit PIN"
          type="password"
          fullWidth
          margin="normal"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
        />

        <Button
          variant="contained"
          fullWidth
          sx={{ mt: 2 }}
          onClick={handleLogin}
        >
          Log In
        </Button>

        <Button
          variant="text"
          fullWidth
          sx={{ mt: 1 }}
          onClick={() => navigate("/merchant-register")}
        >
          New merchant? Request registration here
        </Button>

        <Typography
          variant="caption"
          display="block"
          mt={1}
          color="text.secondary"
        >
          For security, OTP may be required on new devices.
        </Typography>
      </Paper>
    </Box>
  );
}
