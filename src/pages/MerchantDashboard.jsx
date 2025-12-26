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
  addDoc,
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

  /* ===== ROLE GUARD ===== */
  const role = localStorage.getItem("oshiro_role");
  if (role !== "merchant") {
    navigate("/login", { replace: true });
    return null;
  }

  /* ===== LOGOUT ===== */
  const logout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  const stored = JSON.parse(localStorage.getItem("oshiro_user") || "{}");
  const mobile = stored.mobile;

  const [merchant, setMerchant] = useState(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!mobile) return;

    const q = query(
      collection(db, "merchants"),
      where("mobile", "==", mobile)
    );

    return onSnapshot(q, async (snap) => {
      if (!snap.empty) {
        setMerchant({ id: snap.docs[0].id, ...snap.docs[0].data() });
      } else {
        const ref = await addDoc(collection(db, "merchants"), {
          mobile,
          category: "",
          createdAt: new Date(),
        });
        setMerchant({ id: ref.id, mobile, category: "" });
      }
    });
  }, [mobile]);

  const updateField = async (field, value) => {
    if (!merchant?.id) return;

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
      <Button variant="outlined" color="error" onClick={logout}>
        Logout
      </Button>

      <Typography variant="h6" sx={{ mt: 2 }}>
        Merchant Dashboard
      </Typography>

      {msg && <Typography sx={{ color: "green" }}>{msg}</Typography>}

      <Card sx={{ my: 2 }}>
        <CardContent>
          <Typography>Business Category</Typography>
          <TextField
            select
            fullWidth
            value={merchant.category}
            onChange={(e) => updateField("category", e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </TextField>

          {isHomeKitchen && (
            <Chip label="🍱 Limited Orders" color="warning" sx={{ mt: 1 }} />
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
