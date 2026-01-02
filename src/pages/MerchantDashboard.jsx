import React, { useEffect } from "react";
import { Box, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function MerchantDashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem("oshiro_role");
    const merchantId = localStorage.getItem("oshiro_merchant_id");

    if (role !== "merchant" || !merchantId) {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  const logout = () => {
    localStorage.clear();
    navigate("/login", { replace: true });
  };

  return (
    <Box p={3}>
      <Typography variant="h5">
        Merchant Dashboard
      </Typography>

      <Typography sx={{ mt: 1 }}>
        Merchant ID: {localStorage.getItem("oshiro_merchant_id")}
      </Typography>

      <Button
        sx={{ mt: 2 }}
        variant="outlined"
        color="error"
        onClick={logout}
      >
        Logout
      </Button>
    </Box>
  );
}
