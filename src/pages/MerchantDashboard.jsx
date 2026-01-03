import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Divider,
} from "@mui/material";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";

export default function MerchantDashboard() {
  const navigate = useNavigate();

  const merchantId = localStorage.getItem("oshiro_merchant_id");
  const role = localStorage.getItem("oshiro_role");

  const [merchant, setMerchant] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ======================
     🔐 ROLE + ID GUARD
  ====================== */
  useEffect(() => {
    if (role !== "merchant" || !merchantId) {
      localStorage.clear();
      navigate("/login", { replace: true });
    }
  }, [role, merchantId, navigate]);

  /* ======================
     LOAD MERCHANT PROFILE
  ====================== */
  useEffect(() => {
    const loadMerchant = async () => {
      try {
        const ref = doc(db, "merchants", merchantId);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          alert("Merchant record not found");
          localStorage.clear();
          navigate("/login");
          return;
        }

        const data = snap.data();

        if (data.status !== "approved") {
          alert("Merchant not approved yet");
          localStorage.clear();
          navigate("/login");
          return;
        }

        setMerchant({ id: snap.id, ...data });
      } catch (err) {
        console.error(err);
        alert("Failed to load merchant data");
      } finally {
        setLoading(false);
      }
    };

    loadMerchant();
  }, [merchantId, navigate]);

  /* ======================
     LOGOUT
  ====================== */
  const logout = () => {
    localStorage.clear();
    navigate("/login", { replace: true });
  };

  /* ======================
     UI STATES
  ====================== */
  if (loading) {
    return <Typography sx={{ p: 3 }}>Loading...</Typography>;
  }

  if (!merchant) return null;

  /* ======================
     UI
  ====================== */
  return (
    <Box sx={{ p: 3 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
      >
        <Typography variant="h4">
          Merchant Dashboard
        </Typography>

        <Button
          variant="outlined"
          color="error"
          onClick={logout}
        >
          Logout
        </Button>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* MERCHANT PROFILE */}
      <Card sx={{ maxWidth: 600 }}>
        <CardContent>
          <Typography variant="h6">
            🏪 {merchant.shopName}
          </Typography>

          <Typography>
            📱 Mobile: {merchant.mobile}
          </Typography>

          <Typography>
            🗂 Category: {merchant.category}
          </Typography>

          <Typography color="success.main">
            ✅ Status: Approved
          </Typography>

          <Divider sx={{ my: 1 }} />

          <Typography>
            📍 Latitude: {merchant.lat}
          </Typography>

          <Typography>
            📍 Longitude: {merchant.lng}
          </Typography>
        </CardContent>
      </Card>

      {/* NEXT STEP BUTTON */}
      <Box sx={{ mt: 3 }}>
        <Button
          variant="contained"
          onClick={() =>
            alert("Create Offer — Step-3")
          }
        >
          Create Offer
        </Button>
      </Box>
    </Box>
  );
}
