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

export default function Login() {
  const navigate = useNavigate();

  const [mobile, setMobile] = useState("");
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(false);

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

    // Save common data
    localStorage.setItem("oshiro_role", role);
    localStorage.setItem(
      "oshiro_user",
      JSON.stringify({ mobile })
    );

    /* =========================
       CUSTOMER FLOW
    ========================= */
    if (role === "customer") {
      navigate("/customer", { replace: true });
      return;
    }

    /* =========================
       MERCHANT FLOW
    ========================= */
    try {
      const q = query(
        collection(db, "merchants"),
        where("mobile", "==", mobile)
      );

      const snap = await getDocs(q);

      if (snap.empty) {
        // 🆕 New merchant → registration
        navigate("/merchant-register", { replace: true });
      } else {
        // ✅ Existing merchant → dashboard
        const merchantDoc = snap.docs[0];
        localStorage.setItem(
          "oshiro_merchant_id",
          merchantDoc.id
        );
        navigate("/merchant", { replace: true });
      }
    } catch (err) {
      console.error("Login error:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box p={3} maxWidth={400} mx="auto">
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
        disabled={loading}
      >
        {loading ? "Checking..." : "Continue"}
      </Button>

      {role === "merchant" && (
        <Typography
          variant="caption"
          sx={{ mt: 2, display: "block" }}
        >
          New merchants will be asked to register
        </Typography>
      )}
    </Box>
  );
}
