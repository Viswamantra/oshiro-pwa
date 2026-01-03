import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Divider,
  TextField,
} from "@mui/material";
import {
  doc,
  getDoc,
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";

export default function MerchantDashboard() {
  const navigate = useNavigate();

  const merchantId = localStorage.getItem("oshiro_merchant_id");
  const role = localStorage.getItem("oshiro_role");

  const [merchant, setMerchant] = useState(null);
  const [loading, setLoading] = useState(true);

  /* OFFER STATE */
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [msg, setMsg] = useState("");

  /* ======================
     🔐 ROLE GUARD
  ====================== */
  useEffect(() => {
    if (role !== "merchant" || !merchantId) {
      localStorage.clear();
      navigate("/login", { replace: true });
    }
  }, [role, merchantId, navigate]);

  /* ======================
     LOAD MERCHANT
  ====================== */
  useEffect(() => {
    const loadMerchant = async () => {
      try {
        const ref = doc(db, "merchants", merchantId);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          alert("Merchant not found");
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
        alert("Error loading merchant");
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
     CREATE OFFER
  ====================== */
  const createOffer = async () => {
    setMsg("");

    if (!title.trim()) {
      setMsg("Offer title is required");
      return;
    }

    try {
      await addDoc(collection(db, "offers"), {
        merchantId: merchant.id,
        merchantMobile: merchant.mobile,
        shopName: merchant.shopName,
        category: merchant.category,
        title: title.trim(),
        description: description.trim(),
        active: true,
        createdAt: serverTimestamp(),
      });

      setTitle("");
      setDescription("");
      setMsg("✅ Offer created successfully");
    } catch (err) {
      console.error(err);
      setMsg("❌ Failed to create offer");
    }
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
      {/* HEADER */}
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

      {/* MERCHANT INFO */}
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

          <Typography>📍 Lat: {merchant.lat}</Typography>
          <Typography>📍 Lng: {merchant.lng}</Typography>
        </CardContent>
      </Card>

      {/* CREATE OFFER */}
      <Card sx={{ mt: 3, maxWidth: 600 }}>
        <CardContent>
          <Typography variant="h6">
            🎁 Create New Offer
          </Typography>

          <TextField
            label="Offer Title"
            fullWidth
            margin="normal"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <TextField
            label="Description (optional)"
            fullWidth
            multiline
            rows={3}
            margin="normal"
            value={description}
            onChange={(e) =>
              setDescription(e.target.value)
            }
          />

          {msg && (
            <Typography sx={{ mt: 1 }} color="primary">
              {msg}
            </Typography>
          )}

          <Button
            sx={{ mt: 2 }}
            variant="contained"
            onClick={createOffer}
          >
            Create Offer
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
