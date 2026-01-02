import React, { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

/* ======================
   ADMIN CONFIG
====================== */
const ADMIN_MOBILE = "7386361725";
const ADMIN_PASSWORD = "45#67";

export default function Login() {
  const navigate = useNavigate();

  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(null);
  const [error, setError] = useState("");

  const handleLogin = () => {
    setError("");

    if (!/^\d{10}$/.test(mobile)) {
      setError("Enter valid 10-digit mobile number");
      return;
    }

    /* ======================
       🔐 ADMIN LOGIN
    ====================== */
    if (mobile === ADMIN_MOBILE) {
      if (password !== ADMIN_PASSWORD) {
        setError("Invalid admin password");
        return;
      }

      localStorage.clear();
      localStorage.setItem("oshiro_role", "admin");
      localStorage.setItem(
        "oshiro_user",
        JSON.stringify({ mobile })
      );

      navigate("/admin", { replace: true });
      return;
    }

    /* ======================
       CUSTOMER LOGIN
    ====================== */
    if (role === "customer") {
      localStorage.clear();
      localStorage.setItem("oshiro_role", "customer");
      localStorage.setItem(
        "oshiro_user",
        JSON.stringify({ mobile })
      );

      navigate("/customer", { replace: true });
      return;
    }

    setError("Please select Customer");
  };

  return (
    <Box sx={{ p: 3, maxWidth: 420, mx: "auto", mt: 6 }}>
      <Typography variant="h5">Login</Typography>

      {/* MOBILE */}
      <TextField
        label="Mobile Number"
        fullWidth
        margin="normal"
        value={mobile}
        inputProps={{ maxLength: 10 }}
        onChange={(e) =>
          setMobile(e.target.value.replace(/\D/g, ""))
        }
      />

      {/* ADMIN PASSWORD */}
      {mobile === ADMIN_MOBILE && (
        <TextField
          label="Admin Password"
          type="password"
          fullWidth
          margin="normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      )}

      {/* ROLE (CUSTOMER ONLY FOR NOW) */}
      {mobile !== ADMIN_MOBILE && (
        <ToggleButtonGroup
          exclusive
          value={role}
          onChange={(e, v) => setRole(v)}
          fullWidth
          sx={{ my: 2 }}
        >
          <ToggleButton value="customer">
            Customer
          </ToggleButton>
        </ToggleButtonGroup>
      )}

      {error && (
        <Typography color="error" sx={{ mb: 1 }}>
          {error}
        </Typography>
      )}

      <Button variant="contained" fullWidth onClick={handleLogin}>
        Continue
      </Button>
    </Box>
  );
}
