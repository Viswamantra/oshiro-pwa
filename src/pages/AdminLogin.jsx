import React, { useState } from "react";
import { Box, TextField, Button, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { setActiveRole } from "../../utils/activeRole";

export default function AdminLogin() {
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const login = () => {
    setError("");

    // 🔐 HARD-CODED ADMIN CREDENTIALS (NO OTP)
    if (mobile === "7386361725" && password === "45#67") {
      /* ======================
         SESSION (CRITICAL)
      ====================== */
      localStorage.setItem("mobile", mobile);
      setActiveRole("admin");

      navigate("/admin", { replace: true });
    } else {
      setError("Invalid admin credentials");
    }
  };

  return (
    <Box sx={{ maxWidth: 360, mx: "auto", mt: 6 }}>
      <Typography variant="h6" mb={1}>
        Admin Login
      </Typography>

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

      {error && (
        <Typography sx={{ mt: 1 }} color="error">
          {error}
        </Typography>
      )}

      <Button fullWidth sx={{ mt: 2 }} onClick={login}>
        Login
      </Button>
    </Box>
  );
}
