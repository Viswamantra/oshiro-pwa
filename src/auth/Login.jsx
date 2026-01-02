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
   🔐 SUPER ADMIN CONFIG
====================== */
const ADMIN_MOBILE = "7386361725";
const ADMIN_PASSWORD = "45#67";

export default function Login() {
  const navigate = useNavigate();

  const [mobile, setMobile] = useState("");
  const [role, setRole] = useState(null);
  const [adminPassword, setAdminPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /* ======================
     🔍 CHECK MERCHANT EXISTS
  ====================== */
  const checkMerchantExists = async (mobile) => {
    const q = query(
      collection(db, "merchants"),
      where("mobile", "==", mobile)
    );
    const snap = await getDocs(q);
    return snap;
  };

  /* ======================
     🚀 LOGIN HANDLER
  ====================== */
  const handleLogin = async () => {
    setError("");

    /* ---- BASIC VALIDATION ---- */
    if (!/^\d{10}$/.test(mobile)) {
      setError("Enter valid 10-digit mobile number");
      return;
    }

    setLoading(true);

    try {
      /* ======================
         🔐 SUPER ADMIN LOGIN
      ====================== */
      if (mobile === ADMIN_MOBILE) {
        if (adminPassword !== ADMIN_PASSWORD) {
          setError("Invalid admin password");
          setLoading(false);
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
         ROLE REQUIRED
      ====================== */
      if (!role) {
        setError("Please select Merchant or Customer");
        setLoading(false);
        return;
      }

      localStorage.clear();
      localStorage.setItem("oshiro_role", role);
      localStorage.setItem(
        "oshiro_user",
        JSON.stringify({ mobile })
      );

      /* ======================
         👤 CUSTOMER LOGIN
      ====================== */
      if (role === "customer") {
        navigate("/customer", { replace: true });
        return;
      }

      /* ======================
         🏪 MERCHANT LOGIN
      ====================== */
      if (role === "merchant") {
        const snap = await checkMerchantExists(mobile);

        if (snap.empty) {
          // 🔥 NEW MERCHANT
          navigate("/merchant-register", { replace: true });
        } else {
          // ✅ EXISTING MERCHANT
          const merchantDoc = snap.docs[0];
          localStorage.setItem(
            "oshiro_merchant_id",
            merchantDoc.id
          );
          navigate("/merchant", { replace: true });
        }
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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

      {/* MOBILE NUMBER */}
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

      {/* ADMIN PASSWORD (ONLY FOR ADMIN NUMBER) */}
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

      {/* ROLE SELECTION (HIDDEN FOR ADMIN) */}
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
    </Box>
  );
}
