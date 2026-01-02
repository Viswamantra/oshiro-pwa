import React, { useEffect } from "react";
import { Box, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

const ADMIN_MOBILE = "7386361725";

export default function AdminDashboard() {
  const navigate = useNavigate();

  /* 🔐 ADMIN GUARD */
  useEffect(() => {
    const role = localStorage.getItem("oshiro_role");
    const user = JSON.parse(
      localStorage.getItem("oshiro_user") || "{}"
    );

    if (role !== "admin" || user.mobile !== ADMIN_MOBILE) {
      localStorage.clear();
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  const logout = () => {
    localStorage.clear();
    navigate("/login", { replace: true });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4">
        ✅ Admin Dashboard
      </Typography>

      <Typography sx={{ mt: 1 }}>
        Logged in as: {ADMIN_MOBILE}
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
