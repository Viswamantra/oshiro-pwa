import React, { useState } from "react";
import { Box, TextField, Button, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function AdminLogin() {
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const login = () => {
    if (mobile === "7386361725" && password === "45#67") {
      localStorage.setItem("oshiro_admin", "true");
      navigate("/admin");
    } else {
      alert("Invalid admin credentials");
    }
  };

  return (
    <Box sx={{ maxWidth: 360, mx: "auto", mt: 6 }}>
      <Typography variant="h6">Admin Login</Typography>

      <TextField
        label="Mobile"
        fullWidth
        sx={{ mt: 2 }}
        value={mobile}
        onChange={(e) => setMobile(e.target.value)}
      />

      <TextField
        label="Password"
        type="password"
        fullWidth
        sx={{ mt: 2 }}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <Button fullWidth sx={{ mt: 2 }} onClick={login}>
        Login
      </Button>
    </Box>
  );
}
