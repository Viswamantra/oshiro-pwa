import React, { useState } from "react";
import { Box, Button, TextField, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [mobile, setMobile] = useState("");

  const handleLogin = () => {
    if (!mobile) return;

    // TEMP: role simulation (adjust to your real logic)
    const role = mobile === "9999999999" ? "merchant" : "customer";

    localStorage.setItem("oshiro_role", role);
    localStorage.setItem(
      "oshiro_user",
      JSON.stringify({ mobile })
    );

    navigate(role === "merchant" ? "/merchant" : "/customer", {
      replace: true,
    });
  };

  return (
    <Box p={3}>
      <Typography variant="h6">Login</Typography>

      <TextField
        label="Mobile Number"
        fullWidth
        sx={{ my: 2 }}
        value={mobile}
        onChange={(e) => setMobile(e.target.value)}
      />

      <Button variant="contained" onClick={handleLogin}>
        Continue
      </Button>
    </Box>
  );
}
