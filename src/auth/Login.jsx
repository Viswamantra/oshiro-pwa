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
import {
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase";

/* =========================
   ADMIN CREDENTIALS
========================= */
const ADMIN_MOBILE = "7386361725";
const ADMIN_PASSWORD = "45#67";

export default function Login() {
  const navigate = useNavigate();

  const [mobile, setMobile] = useState("");
  const [role, setRole] = useState(null);
  const [adminPassword, setAdminPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    setError("");

    if (!/^\d{10}$/.test(mobile)) {
      setError("Enter exactly 10 digit mobile number");
      return;
    }

    if (!role) {
      setError("Please select Merchant or Customer");
      return;
    }

    setLoading(true);

    /* =========================
       ADMIN FLOW
    ========================= */
    if (mobile === ADMIN_MOBILE) {
      if (adminPassword !== ADMIN_PASSWORD) {
        setError("Invalid admin password");
        setLoading(false);
        return;
      }

      localStorage.setItem("oshiro_role", "admin");
      localStorage.setItem("oshiro_admin_mobile", ADMIN_MOBILE);
      localStorage.setItem("oshiro_admin_auth", "true");

      navigate("/admin", { replace: true });
      return;
    }

    /* =========================
       CUSTOMER FLOW
    ========================= */
    if (role === "customer") {
      localStorage.setItem("oshiro_role", "customer");
      localStorage.setItem(
        "oshiro_user",
        JSON.stringify({ mobile })
      );

      navigate("/customer", { replace: true });
      return;
    }

    /* =========================
       MERCHANT FLOW
    ========================= */
    try {
      localStorage.setItem("oshiro_role", "merchant");
      localStorage.setItem(
        "oshiro_user",
        JSON.stringify({ mobile })
      );

      const exists = await merchantExists(mobile);

      if (exists) {
        localStorage.setItem("oshiro_merchant_id", mobile);
        navigate("/merchant", { replace: true });
      } else {
        navigate("/merchant-register", { replace: true });
      }
    } catch (err) {
      console.error(err);
      setError("Login failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     UI
  ========================= */
  return (
    <Box sx={{ p: 3, maxWidth: 420, mx: "auto", mt: 6 }}>
      <Typography variant="h5" gutterBottom>
        Login
      </Typography>

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
          value={adminPassword}
          onChange={(e) => setAdminPassword(e.target.value)}
        />
      )}

      {/* ROLE SELECTION (NOT FOR ADMIN) */}
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
          <ToggleButton value="merchant">
            Merchant
          </ToggleButton>
        </ToggleButtonGroup>
      )}

      {error && (
        <Typography color="error" sx={{ mb: 1 }}>
          {error}
        </Typography>
      )}

      <Button
        variant="contained"
        fullWidth
        disabled={loading}
        onClick={handleLogin}
      >
        {loading ? "Please wait..." : "Continue"}
      </Button>

      {role === "merchant" && (
        <Typography variant="caption" sx={{ mt: 2, display: "block" }}>
          New merchants will be asked to register
        </Typography>
      )}
    </Box>
  );
}
