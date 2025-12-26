import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  InputAdornment,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [mobile, setMobile] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const digits = e.target.value.replace(/\D/g, "");
    if (digits.length <= 10) {
      setMobile(digits);
      setError("");
    }
  };

  const handleContinue = (e) => {
    // 🔒 ABSOLUTE SAFETY (prevents any form-submit behaviour)
    e.preventDefault();

    if (mobile.length !== 10) {
      setError("Enter exactly 10 digits");
      return;
    }

    // ✅ SAVE USER INFO
    localStorage.setItem(
      "oshiro_user",
      JSON.stringify({ mobile: "+91" + mobile })
    );

    // reset role on fresh login
    localStorage.removeItem("oshiro_role");

    // ✅ NAVIGATE
    navigate("/select-role", { replace: true });
  };

  return (
    <Box sx={{ maxWidth: 360, mx: "auto", mt: 6 }}>
      <Typography variant="h6" align="center">
        Login Screen
      </Typography>

      <TextField
        label="Mobile Number"
        fullWidth
        margin="normal"
        value={mobile}
        onChange={handleChange}
        error={!!error}
        helperText={error}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">+91</InputAdornment>
          ),
        }}
      />

     <Box
  role="button"
  tabIndex={0}
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();
    handleContinue(e);
  }}
  sx={{
    mt: 2,
    width: "100%",
    bgcolor: "primary.main",
    color: "#fff",
    textAlign: "center",
    py: 1.5,
    borderRadius: 1,
    cursor: "pointer",
    userSelect: "none",
  }}
>
  CONTINUE
    </Box>
  );
}
