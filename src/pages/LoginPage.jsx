import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
} from "@mui/material";
import { useAuth } from "../auth/AuthContext";

export default function LoginPage() {
  const { loginWithPin } = useAuth();
  const [mobile, setMobile] = useState("");
  const [pin, setPin] = useState("");

  const handleLogin = async () => {
    const res = await loginWithPin(mobile, pin);
    if (!res.success) {
      alert(res.message);
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
          onClick={() => window.location.href = "/merchant-register"}
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
