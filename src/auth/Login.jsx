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
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

/* 🔐 ADMIN CONFIG */
const ADMIN_MOBILE = "7386361725";
const ADMIN_PASSWORD = "45#67";

export default function Login() {
  const navigate = useNavigate();

  const [mobile, setMobile] = useState("");
  const [role, setRole] = useState(null);
  const [adminPassword, setAdminPassword] = useState("");
  const [error, setError] = useState("");

  /* =========================
     VALID MOBILE CHECK
  ========================= */
  const isValidMobile = /^\d{10}$/.test(mobile);

  /* =========================
     GET MERCHANT BY MOBILE
  ========================= */
  const getMerchantByMobile = async (mobile) => {
    const q = query(
      collection(db, "merchants"),
      where("mobile", "==", mobile)
    );
    const snap = await getDocs(q);
    return snap.empty
      ? null
      : { id: snap.docs[0].id, ...snap.docs[0].data() };
  };

  /* =========================
     GET / CREATE CUSTOMER
     ✅ AUTO-APPROVED
  ========================= */
  const getOrCreateCustomer = async (mobile) => {
    const q = query(
      collection(db, "customers"),
      where("mobile", "==", mobile)
    );
    const snap = await getDocs(q);

    if (!snap.empty) {
      return snap.docs[0].id;
    }

    const ref = await addDoc(collection(db, "customers"), {
      mobile,
      status: "approved",             // ✅ REQUIRED
      createdAt: serverTimestamp(),
      approvedAt: serverTimestamp(),  // ✅ REQUIRED
    });

    return ref.id;
  };

  /* =========================
     LOGIN HANDLER
  ========================= */
  const handleLogin = async () => {
    setError("");

    if (!isValidMobile) {
      setError("Enter valid 10 digit mobile number");
      return;
    }

    /* ================= ADMIN ================= */
    if (mobile === ADMIN_MOBILE) {
      if (!adminPassword) {
        setError("Admin password required");
        return;
      }

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

    /* ================= ROLE REQUIRED ================= */
    if (!role) {
      setError("Please select Merchant or Customer");
      return;
    }

    localStorage.clear();
    localStorage.setItem("oshiro_role", role);

    /* ================= CUSTOMER ================= */
    if (role === "customer") {
      const customerId = await getOrCreateCustomer(mobile);

      localStorage.setItem("oshiro_uid", customerId);
      localStorage.setItem(
        "oshiro_user",
        JSON.stringify({ mobile })
      );

      navigate("/customer", { replace: true });
      return;
    }

    /* ================= MERCHANT ================= */
    const merchant = await getMerchantByMobile(mobile);

    if (!merchant) {
      localStorage.setItem(
        "oshiro_user",
        JSON.stringify({ mobile })
      );
      navigate("/merchant-register", { replace: true });
      return;
    }

    if (merchant.status === "pending") {
      setError("⏳ Awaiting admin approval");
      return;
    }

    if (merchant.status === "rejected") {
      setError(
        `❌ Rejected: ${merchant.rejectionReason || "Contact admin"}`
      );
      return;
    }

    /* ================= APPROVED MERCHANT ================= */
    localStorage.setItem("oshiro_role", "merchant");
    localStorage.setItem("oshiro_merchant_id", merchant.id);

    localStorage.setItem(
      "oshiro_user",
      JSON.stringify({
        mobile: merchant.mobile,
        shopName: merchant.shopName,
        category: merchant.category,
        lat: merchant.lat,
        lng: merchant.lng,
      })
    );

    navigate("/merchant", { replace: true });
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
        required
        margin="normal"
        value={mobile}
        inputProps={{ maxLength: 10 }}
        onChange={(e) =>
          setMobile(e.target.value.replace(/\D/g, ""))
        }
        helperText="10 digit mobile number required"
      />

      {mobile === ADMIN_MOBILE && (
        <TextField
          label="Admin Password"
          type="password"
          required
          fullWidth
          margin="normal"
          value={adminPassword}
          onChange={(e) =>
            setAdminPassword(e.target.value)
          }
        />
      )}

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
        disabled={!isValidMobile}
        onClick={handleLogin}
      >
        Continue
      </Button>
    </Box>
  );
}
