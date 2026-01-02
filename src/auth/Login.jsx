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

export default function Login() {
  const navigate = useNavigate();
  const [mobile, setMobile] = useState("");
  const [role, setRole] = useState(null);

  const handleLogin = () => {
    if (mobile.length !== 10) {
      alert("Enter exactly 10 digit mobile number");
      return;
    }

    if (!role) {
      alert("Please select Merchant or Customer");
      return;
    }

    localStorage.setItem("oshiro_role", role);
    localStorage.setItem(
      "oshiro_user",
      JSON.stringify({ mobile })
    );

    navigate(role === "merchant" ? "/merchant" : "/customer");
  };

  return (
    <Box p={3} maxWidth={400}>
      <Typography variant="h6">Login</Typography>

      <TextField
        label="Mobile Number"
        fullWidth
        sx={{ my: 2 }}
        value={mobile}
        inputProps={{ maxLength: 10 }}
        onChange={(e) =>
          setMobile(e.target.value.replace(/\D/g, ""))
        }
      />

      <ToggleButtonGroup
        color="primary"
        exclusive
        value={role}
        onChange={(e, v) => setRole(v)}
        sx={{ my: 2 }}
        fullWidth
      >
        <ToggleButton value="customer">
          Customer
        </ToggleButton>
        <ToggleButton value="merchant">
          Merchant
        </ToggleButton>
      </ToggleButtonGroup>

      <Button
        variant="contained"
        fullWidth
        onClick={handleLogin}
      >
        Continue
      </Button>
    </Box>
  );
}
