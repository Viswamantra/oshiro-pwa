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

/* ======================
   SUPER ADMIN CONFIG
====================== */
const ADMIN_MOBILE = "7386361725";
const ADMIN_PASSWORD = "45#67";

export default function Login() {
  const navigate = useNavigate();

  const [mobile, setMobile] = useState("");
  const [role, setRole] = useState(null);
  const [adminPassword, setAdminPassword] = useState("");
  const [error, setError] = useState("");

  /* ======================
     CHECK MERCHANT STATUS
  ====================== */
  const getMerchantStatus = async (mobile) => {
    const q = query(
      collection(db, "merchants"),
      where("mobile", "==", mobile)
    );
    const snap = await getDocs(q);

    if (snap.empty) return { exists: false };

    const merchant = snap.docs[0].data();
    return {
      exists: true,
      status: merchant.status,
    };
  };

  /* ======================
     LOGIN HANDLER
  ====================== */
  const handleLogin = async () => {
    setError("");

    /* BASIC MOBILE CHECK */
    if (!/^\d{10}$/.test(mobile)) {
      setError("Enter valid 10 digit mobile number");
      return;
    }

    /* ======================
       🔐 SUPER ADMIN LOGIN
    ====================== */
    if (mobile === ADMIN_MOBILE) {
      if (adminPassword !== ADMIN_PASSWORD) {
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
       ROLE REQUIRED BELOW
    ====================== */
    if (!role) {
      setError("Please select Merchant or Customer");
      return;
    }

    localStorage.clear();
    localStorage.setItem("oshiro_role", role);
    localStorage.setItem(
      "oshiro_user",
      JSON.stringify({ mobile })
    );

    /* ======================
       CUSTOMER LOGIN
    ====================== */
    if (role === "customer") {
      navigate("/customer", { replace: true });
      return;
    }

    /* ======================
       MERCHANT LOGIN (STRICT)
    ====================== */
    if (role === "merchant") {
      const { exists, status } =
        await getMerchantStatus(mobile);

      if (!exists) {
        navigate("/merchant-register", { replace: true });
        return;
      }

      if (status !== "approved") {
        setError(
          "Merchant registration pending admin approval"
        );
        localStorage.clear();
        return;
      }

      navigate("/merchant", { replace: true });
    }
  };

  /* ======================
     UI
  ====================== */
  return (
    <Box
      sx={{
        p: 3,
        maxWidth: 420,
        mx: "auto",
        mt: 6,
      }}
    >
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
          onChange={(e) =>
            setAdminPassword(e.target.value)
          }
        />
      )}

      {/* ROLE SELECT (NOT FOR ADMIN) */}
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
        onClick={handleLogin}
      >
        Continue
      </Button>
    </Box>
  );
}
