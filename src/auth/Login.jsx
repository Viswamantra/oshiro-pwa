import React, { useState } from "react";
import { Box, Button, TextField, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

/* ADMIN CREDENTIALS */
const ADMIN_MOBILE = "7386361725";
const ADMIN_PASSWORD = "45#67";

export default function Login() {
  const navigate = useNavigate();

  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    setError("");

    if (!/^\d{10}$/.test(mobile)) {
      setError("Enter valid 10-digit mobile number");
      return;
    }

    if (mobile !== ADMIN_MOBILE) {
      setError("Not an admin number");
      return;
    }

    if (password !== ADMIN_PASSWORD) {
      setError("Invalid admin password");
      return;
    }

    /* ✅ SAVE ADMIN SESSION */
    localStorage.clear();
    localStorage.setItem("oshiro_role", "admin");
    localStorage.setItem(
      "oshiro_user",
      JSON.stringify({ mobile })
    );

    navigate("/admin", { replace: true });
  };

  return (
    <Box sx={{ p: 3, maxWidth: 400, mx: "auto", mt: 6 }}>
      <Typography variant="h5" gutterBottom>
        Admin Login
      </Typography>

      <TextField
        label="Admin Mobile"
        fullWidth
        margin="normal"
        value={mobile}
        inputProps={{ maxLength: 10 }}
        onChange={(e) =>
          setMobile(e.target.value.replace(/\D/g, ""))
        }
      />

      <TextField
        label="Admin Password"
        type="password"
        fullWidth
        margin="normal"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {error && (
        <Typography color="error" sx={{ mt: 1 }}>
          {error}
        </Typography>
      )}

      <Button
        variant="contained"
        fullWidth
        sx={{ mt: 2 }}
        onClick={handleLogin}
      >
        Login
      </Button>
    </Box>
  );
}
