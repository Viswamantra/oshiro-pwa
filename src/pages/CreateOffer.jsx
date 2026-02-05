import React, { useEffect, useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
} from "@mui/material";
import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";

export default function CreateOffer() {
  const navigate = useNavigate();

  /* =========================
     🔐 MERCHANT GUARD
  ========================= */
  useEffect(() => {
    const role = localStorage.getItem("oshiro_role");
    const merchantId =
      localStorage.getItem("oshiro_merchant_id");

    if (role !== "merchant" || !merchantId) {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  /* =========================
     MERCHANT DATA
  ========================= */
  const merchantId =
    localStorage.getItem("oshiro_merchant_id");

  const user = JSON.parse(
    localStorage.getItem("oshiro_user") || "{}"
  );

  /* HARD STOP IF DATA MISSING */
  useEffect(() => {
    if (
      !user.mobile ||
      !user.shopName ||
      !user.category ||
      !user.lat ||
      !user.lng
    ) {
      navigate("/merchant", { replace: true });
    }
  }, [navigate, user]);

  /* =========================
     STATE
  ========================= */
  const [form, setForm] = useState({
    title: "",
    description: "",
    discount: "",
    radiusKm: 0.3, // 300 meters
  });

  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  /* =========================
     SUBMIT OFFER
  ========================= */
  const submit = async () => {
    setMsg("");

    if (!form.title.trim() || !form.description.trim()) {
      setMsg("Please fill offer title and description");
      return;
    }

    setLoading(true);

    try {
      await addDoc(collection(db, "offers"), {
        merchantId,
        merchantMobile: user.mobile,
        shopName: user.shopName,
        category: user.category,
        title: form.title.trim(),
        description: form.description.trim(),
        discount: form.discount.trim(),
        lat: Number(user.lat),
        lng: Number(user.lng),
        radiusKm: Number(form.radiusKm),
        active: true,
        createdAt: serverTimestamp(),
      });

      setMsg("✅ Offer published successfully");

      setForm({
        title: "",
        description: "",
        discount: "",
        radiusKm: 0.3,
      });
    } catch (err) {
      console.error(err);
      setMsg("❌ Failed to create offer");
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     UI
  ========================= */
  return (
    <Box sx={{ p: 3, maxWidth: 500, mx: "auto" }}>
      <Typography variant="h5" gutterBottom>
        Create Offer
      </Typography>

      <TextField
        label="Offer Title *"
        fullWidth
        margin="normal"
        value={form.title}
        onChange={(e) =>
          setForm({ ...form, title: e.target.value })
        }
      />

      <TextField
        label="Description *"
        fullWidth
        multiline
        rows={3}
        margin="normal"
        value={form.description}
        onChange={(e) =>
          setForm({
            ...form,
            description: e.target.value,
          })
        }
      />

      <TextField
        label="Discount (optional)"
        fullWidth
        margin="normal"
        value={form.discount}
        onChange={(e) =>
          setForm({
            ...form,
            discount: e.target.value,
          })
        }
      />

      <TextField
        label="Radius (km)"
        type="number"
        fullWidth
        margin="normal"
        value={form.radiusKm}
        inputProps={{ step: 0.1, min: 0.1 }}
        onChange={(e) =>
          setForm({
            ...form,
            radiusKm: e.target.value,
          })
        }
        helperText="0.3 km = 300 meters"
      />

      {msg && (
        <Typography sx={{ mt: 1 }} color="primary">
          {msg}
        </Typography>
      )}

      <Button
        sx={{ mt: 2 }}
        variant="contained"
        fullWidth
        disabled={loading}
        onClick={submit}
      >
        {loading ? "Publishing..." : "Publish Offer"}
      </Button>

      <Button
        sx={{ mt: 1 }}
        fullWidth
        onClick={() => navigate("/merchant")}
      >
        Back to Dashboard
      </Button>
    </Box>
  );
}
