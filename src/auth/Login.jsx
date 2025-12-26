import React, { useState } from "react";
import { Box, Typography, TextField, Button, InputAdornment } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [mobile, setMobile] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const value = e.target.value.replace(/\D/g, ""); // only numbers

    if (value.length <= 10) {
      setMobile(value);
      setError("");
    }
  };

  const handleContinue = () => {
    if (mobile.length !== 10) {
      setError("Enter exactly 10 digits");
      return;
    }

    // TEMP success navigation
    navigate("/dashboard");
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

      <Button
        fullWidth
        variant="contained"
        sx={{ mt: 2 }}
        onClick={handleContinue}
      >
        CONTINUE
      </Button>
    </Box>
  );
}
