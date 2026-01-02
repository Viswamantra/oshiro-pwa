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
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";

/* 🔑 ADMIN MOBILE */
const ADMIN_MOBILE = "7386361725";

export default function Login() {
  const navigate = useNavigate();

  const [mobile, setMobile] = useState("");
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(false);

  /* =========================
     CHECK MERCHANT EXISTS
  ========================= */
  async function merchantExists(mobile) {
    const q = query(
      collection(db, "merchants"),
      where("mobile", "==", mobile)
    );
    const snap = await getDocs(q);
    return !snap.empty;
  }

  /* =========================
     LOGIN HANDLER
  ========================= */
  const handleLogin = async () => {
    if (mobile.length !== 10) {
      alert("Enter exactly 10 digit mobile number");
      return;
    }

    if (!role) {
      alert("Please select Merchant or Customer");
      return;
    }

    setLoading(true);

    /* SAVE SESSION */
    localStorage.setItem("oshiro_role", role);
    localStorage.setItem(
      "oshiro_user",
      JSON.stringify({ mobile })
    );

    /* =========================
       ADMIN
    ========================= */
    if (mobile === ADMIN_MOBILE) {
      localStorage.setItem("oshiro_role", "admin");
      navigate("/admin", { replace: true });
      return;
    }

    /* =========================
       CUSTOMER
    ========================= */
    if (role === "customer") {
      navigate("/customer", { replace: true });
      return;
    }

    /* =========================
       MERCHANT
    ========================= */
    const exists = await merchantExists(mobile);

    if (exists) {
      localStorage.setItem("oshiro_merchant_id", mobile);
      navigate("/merchant", { replace: true });
    } else {
      navigate("/merchant-register", { replace: true });
    }

    setLoading(false);
  };

  /* =========================
     UI
  ========================= */
  return (
    <Box p={3} maxWidth={400} mx="auto">
      <Typography variant="h6" mb={2}>
        Login
      </Typography>

      <TextField
        label="Mobile Number"
        fullWidth
        value={mobile}
        inputProps={{ maxLength: 10 }}
        onChange={(e) =>
          setMobile(e.target.value.replace(/\D/g, ""))
        }
        sx={{ mb: 2 }}
      />

      <ToggleButtonGroup
        color="primary"
        exclusive
        value={role}
        onChange={(e, v) => setRole(v)}
        fullWidth
        sx={{ mb: 2 }}
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
        disabled={loading}
        onClick={handleLogin}
      >
        {loading ? "Checking..." : "Continue"}
      </Button>
    </Box>
  );
}
