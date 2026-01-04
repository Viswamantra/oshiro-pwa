import React, { useState } from "react";
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

export default function CreateOffer() {
  const merchantId = localStorage.getItem("oshiro_merchant_id");
  const user = JSON.parse(localStorage.getItem("oshiro_user") || "{}");

  const [form, setForm] = useState({
    title: "",
    description: "",
    discount: "",
    radiusKm: 0.3,
  });

  const submit = async () => {
    if (!form.title || !form.description) return;

    await addDoc(collection(db, "offers"), {
      merchantId,
      merchantMobile: user.mobile,
      shopName: user.shopName,
      category: user.category,
      title: form.title,
      description: form.description,
      discount: form.discount,
      lat: user.lat,
      lng: user.lng,
      radiusKm: Number(form.radiusKm),
      active: true,
      createdAt: serverTimestamp(),
    });

    alert("✅ Offer created");
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6">Create Offer</Typography>

      <TextField
        label="Offer Title"
        fullWidth
        margin="normal"
        onChange={(e) =>
          setForm({ ...form, title: e.target.value })
        }
      />

      <TextField
        label="Description"
        fullWidth
        margin="normal"
        onChange={(e) =>
          setForm({ ...form, description: e.target.value })
        }
      />

      <TextField
        label="Discount (optional)"
        fullWidth
        margin="normal"
        onChange={(e) =>
          setForm({ ...form, discount: e.target.value })
        }
      />

      <Button variant="contained" onClick={submit}>
        Publish Offer
      </Button>
    </Box>
  );
}
