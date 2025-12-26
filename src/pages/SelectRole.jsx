import React from "react";
import { Box, Button, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function SelectRole() {
  const navigate = useNavigate();

  const selectRole = (role) => {
    localStorage.setItem("oshiro_role", role);

    if (role === "merchant") {
      navigate("/merchant");
    } else {
      navigate("/customer");
    }
  };

  return (
    <Box sx={{ maxWidth: 360, mx: "auto", mt: 8, textAlign: "center" }}>
      <Typography variant="h6" gutterBottom>
        Choose Your Role
      </Typography>

      <Button
        fullWidth
        variant="contained"
        sx={{ mt: 2 }}
        onClick={() => selectRole("merchant")}
      >
        I am a Merchant
      </Button>

      <Button
        fullWidth
        variant="outlined"
        sx={{ mt: 2 }}
        onClick={() => selectRole("customer")}
      >
        I am a Customer
      </Button>
    </Box>
  );
}
