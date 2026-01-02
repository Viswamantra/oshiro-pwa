import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  /* ================= MOBILE INPUT ================= */
  const handleMobileChange = (e) => {
    const digits = e.target.value.replace(/\D/g, "");
    if (digits.length <= 10) {
      setMobile(digits);
      setError("");
      setPassword(""); // reset admin password if mobile changes
    }
  };

  /* ================= CONTINUE ================= */
  const handleContinue = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (mobile.length !== 10) {
      setError("Enter exactly 10 digits");
      return;
    }

    const fullMobile = "+91" + mobile;

    /* ================= ADMIN LOGIN ================= */
    if (mobile === "7386361725") {
      if (password !== "45#67") {
        setError("Invalid admin password");
        return;
      }

      localStorage.setItem("oshiro_role", "admin");
      localStorage.setItem(
        "oshiro_user",
        JSON.stringify({ mobile: fullMobile })
      );

      navigate("/admin", { replace: true });
      return;
    }

    /* ================= NORMAL USER ================= */
    // IMPORTANT: role is NOT set here
    // Role will be selected in SelectRole screen
    localStorage.removeItem("oshiro_role");
    localStorage.setItem(
      "oshiro_user",
      JSON.stringify({ mobile: fullMobile })
    );

    navigate("/select-role", { replace: true });
  };

  /* ================= UI ================= */
  return (
    <Box sx={{ maxWidth: 360, mx: "auto", mt: 6 }}>
      <Typography variant="h6" align="center">
        Login
      </Typography>

      <TextField
        label="Mobile Number"
        fullWidth
        margin="normal"
        value={mobile}
        onChange={handleMobileChange}
        error={!!error}
        helperText={error}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">+91</InputAdornment>
          ),
        }}
      />

      {/* ===== ADMIN PASSWORD (ONLY FOR ADMIN MOBILE) ===== */}
      {mobile === "7386361725" && (
        <TextField
          label="Admin Password"
          type="password"
          fullWidth
          margin="normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      )}

      <Box
        role="button"
        tabIndex={0}
        onClick={handleContinue}
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
    </Box>
  );
}
