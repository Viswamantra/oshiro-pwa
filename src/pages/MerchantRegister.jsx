import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  MenuItem,
} from "@mui/material";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";

export default function MerchantRegister() {
  const navigate = useNavigate();

  const stored = JSON.parse(localStorage.getItem("oshiro_user") || "{}");

  const [form, setForm] = useState({
    mobile: stored.mobile || "",
    shopName: "",
    category: "",
    lat: "",
    lng: "",
  });

  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  /* 🔍 DUPLICATE CHECK */
  const merchantExists = async () => {
    const q = query(
      collection(db, "merchants"),
      where("mobile", "==", form.mobile)
    );
    const snap = await getDocs(q);
    return !snap.empty;
  };

  const submit = async () => {
    setMsg("");
    setLoading(true);

    if (!form.shopName || !form.category) {
      setMsg("Fill all required fields");
      setLoading(false);
      return;
    }

    if (await merchantExists()) {
      setMsg("Merchant already exists. Please login.");
      setLoading(false);
      return;
    }

    await addDoc(collection(db, "merchants"), {
      mobile: form.mobile,
      shopName: form.shopName,
      category: form.category,
      lat: Number(form.lat),
      lng: Number(form.lng),
      status: "pending",
      createdAt: serverTimestamp(),
    });

    setMsg("✅ Registration submitted. Await admin approval.");
    setLoading(false);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 500, mx: "auto" }}>
      <Typography variant="h5">Merchant Registration</Typography>

      <TextField
        label="Mobile"
        fullWidth
        margin="normal"
        value={form.mobile}
        disabled
      />

      <TextField
        label="Shop Name"
        fullWidth
        margin="normal"
        value={form.shopName}
        onChange={(e) =>
          setForm({ ...form, shopName: e.target.value })
        }
      />

      <TextField
        select
        label="Category"
        fullWidth
        margin="normal"
        value={form.category}
        onChange={(e) =>
          setForm({ ...form, category: e.target.value })
        }
      >
        <MenuItem value="Food">Food</MenuItem>
        <MenuItem value="Fashion">Fashion</MenuItem>
        <MenuItem value="Electronics">Electronics</MenuItem>
      </TextField>

      <TextField
        label="Latitude"
        fullWidth
        margin="normal"
        value={form.lat}
        onChange={(e) =>
          setForm({ ...form, lat: e.target.value })
        }
      />

      <TextField
        label="Longitude"
        fullWidth
        margin="normal"
        value={form.lng}
        onChange={(e) =>
          setForm({ ...form, lng: e.target.value })
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
        fullWidth
        disabled={loading}
        onClick={submit}
      >
        Submit Registration
      </Button>

      <Button
        sx={{ mt: 1 }}
        fullWidth
        onClick={() => navigate("/login")}
      >
        Back to Login
      </Button>
    </Box>
  );
}
