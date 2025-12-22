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
import { useAuth } from "../auth/AuthContext";

const CATEGORIES = [
  "Food",
  "Home Kitchen",
  "Fashion & Clothing",
  "Beauty & Spa",
  "Hospitals",
  "Medicals",
];

export default function MerchantDashboard() {
  const { user } = useAuth();

  const [merchant, setMerchant] = useState(null);
  const [msg, setMsg] = useState("");

  /* =========================
     LOAD MERCHANT BY MOBILE
  ========================= */
  useEffect(() => {
    if (!user?.mobile) return;

    const q = query(
      collection(db, "merchants"),
      where("mobile", "==", user.mobile)
    );

    return onSnapshot(q, (snap) => {
      if (!snap.empty) {
        setMerchant({ id: snap.docs[0].id, ...snap.docs[0].data() });
      }
    });
  }, [user]);

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

  if (!merchant) return null;

  const isHomeKitchen = merchant.category === "Home Kitchen";

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6">Merchant Dashboard</Typography>

      {msg && (
        <Typography sx={{ color: "green", my: 1 }}>{msg}</Typography>
      )}

      {/* CATEGORY */}
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
            <Chip
              label="🍱 Limited Orders"
              color="warning"
              sx={{ mt: 1 }}
            />
          )}
        </CardContent>
      </Card>

      {/* HOME KITCHEN RULES */}
      {isHomeKitchen && (
        <Card sx={{ my: 2 }}>
          <CardContent>
            <Typography variant="subtitle1">
              Home Kitchen Settings
            </Typography>

            {/* ORDER CUT-OFF */}
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

            {/* MAX ORDERS */}
            <TextField
              label="Max orders per day"
              type="number"
              fullWidth
              sx={{ mt: 2 }}
              value={merchant.maxOrdersPerDay || 20}
              onChange={(e) =>
                updateField(
                  "maxOrdersPerDay",
                  Number(e.target.value)
                )
              }
            />

            {/* AVAILABLE DAYS */}
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

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 1, display: "block" }}
            >
              Customers can only pre-order before the cut-off time.
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* INFO */}
      {isHomeKitchen && (
        <Typography variant="body2" color="text.secondary">
          ✔ Pre-order only  
          <br />
          ✔ Limited daily quantity  
          <br />
          ✔ Cook when convenient  
        </Typography>
      )}

      <Button sx={{ mt: 3 }} variant="contained">
        Dashboard Ready
      </Button>
    </Box>
  );
}
