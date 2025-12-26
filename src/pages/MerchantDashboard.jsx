import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Button,
  Card,
  CardContent,
  Chip,
} from "@mui/material";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";

const CATEGORIES = [
  "Food",
  "Home Kitchen",
  "Fashion & Clothing",
  "Beauty & Spa",
  "Hospitals",
  "Medicals",
];

export default function MerchantDashboard() {
  const navigate = useNavigate();

  /* =========================
     ROLE GUARD
  ========================= */
  const role = localStorage.getItem("oshiro_role");
  if (role !== "merchant") {
    navigate("/login", { replace: true });
    return null;
  }

  const stored = JSON.parse(localStorage.getItem("oshiro_user") || "{}");
  const mobile = stored.mobile;

  const [merchant, setMerchant] = useState(null);
  const [msg, setMsg] = useState("");

  /* =========================
     LOAD MERCHANT BY MOBILE
  ========================= */
  useEffect(() => {
    if (!mobile) return;

    const q = query(
      collection(db, "merchants"),
      where("mobile", "==", mobile)
    );

    return onSnapshot(q, (snap) => {
      if (!snap.empty) {
        setMerchant({ id: snap.docs[0].id, ...snap.docs[0].data() });
      }
    });
  }, [mobile]);

  /* =========================
     UPDATE HANDLER
  ========================= */
  const updateField = async (field, value) => {
    if (!merchant) return;
    await updateDoc(doc(db, "merchants", merchant.id), {
      [field]: value,
    });
    setMsg("Saved successfully");
    setTimeout(() => setMsg(""), 2000);
  };

  if (!merchant) {
    return <Typography sx={{ p: 2 }}>Loading merchant...</Typography>;
  }

  const isHomeKitchen = merchant.category === "Home Kitchen";

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6">Merchant Dashboard</Typography>

      {msg && (
        <Typography sx={{ color: "green", my: 1 }}>{msg}</Typography>
      )}

      <Card sx={{ my: 2 }}>
        <CardContent>
          <Typography variant="subtitle1">Business Category</Typography>

          <TextField
            select
            fullWidth
            value={merchant.category || ""}
            onChange={(e) => updateField("category", e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <MenuItem key={c} value={c}>
                {c === "Home Kitchen"
                  ? "Home Kitchen – Ghar ka khana • Limited orders"
                  : c}
              </MenuItem>
            ))}
          </TextField>

          {isHomeKitchen && (
            <Chip label="🍱 Limited Orders" color="warning" sx={{ mt: 1 }} />
          )}
        </CardContent>
      </Card>

      {isHomeKitchen && (
        <Card sx={{ my: 2 }}>
          <CardContent>
            <Typography variant="subtitle1">
              Home Kitchen Settings
            </Typography>

            <TextField
              label="Order cut-off time"
              type="time"
              fullWidth
              sx={{ mt: 2 }}
              value={merchant.orderCutoff || "11:00"}
              onChange={(e) =>
                updateField("orderCutoff", e.target.value)
              }
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="Max orders per day"
              type="number"
              fullWidth
              sx={{ mt: 2 }}
              value={merchant.maxOrdersPerDay || 20}
              onChange={(e) =>
                updateField("maxOrdersPerDay", Number(e.target.value))
              }
            />

            <TextField
              label="Available days"
              fullWidth
              sx={{ mt: 2 }}
              helperText="Example: Mon–Sat or Mon,Wed,Fri"
              value={merchant.availableDays || "Mon–Sun"}
              onChange={(e) =>
                updateField("availableDays", e.target.value)
              }
            />
          </CardContent>
        </Card>
      )}

      <Button sx={{ mt: 3 }} variant="contained">
        Dashboard Ready
      </Button>
    </Box>
  );
}
