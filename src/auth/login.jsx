import React from "react";
import { Box, Typography, TextField, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  const handleContinue = () => {
    // TEMP: navigate after login
    navigate("/dashboard"); 
  };

  return (
    <Box sx={{ maxWidth: 360, mx: "auto", mt: 6 }}>
      <Typography variant="h6" align="center">
        Login Screen
      </Typography>

      <TextField label="Mobile Number" fullWidth margin="normal" />
      <TextField label="OTP" fullWidth margin="normal" />
      <TextField
        label="Password"
        type="password"
        fullWidth
        margin="normal"
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
