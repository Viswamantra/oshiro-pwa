import React from "react";
import { Box, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function MerchantRegister() {
  const navigate = useNavigate();

  return (
    <Box p={3}>
      <Typography variant="h5">
        New Merchant Registration
      </Typography>

      <Typography sx={{ mt: 1 }}>
        This mobile is not registered yet.
      </Typography>

      <Button
        sx={{ mt: 2 }}
        variant="contained"
        onClick={() => navigate("/login")}
      >
        Back to Login
      </Button>
    </Box>
  );
}
