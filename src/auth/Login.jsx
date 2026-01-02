import React, { useState } from "react";
import { Box, Button, TextField, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [mobile, setMobile] = useState("");

  const handleLogin = () => {
    if (mobile.length !== 10) {
      alert("Enter exactly 10 digit mobile number");
      return;
    }

    const role = mobile === "9999999999" ? "merchant" : "customer";

    localStorage.setItem("oshiro_role", role);
    localStorage.setItem(
      "oshiro_user",
      JSON.stringify({ mobile })
    );

    console.log("LOGIN OK →", role);

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

      <Button variant="contained" onClick={handleLogin}>
        Continue
      </Button>
    </Box>
  );
}
