import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  MenuItem,
} from "@mui/material";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";

export default function MerchantRegister() {
  const navigate = useNavigate();

  /* ======================
     USER FROM LOGIN
  ====================== */
  const storedUser = JSON.parse(
    localStorage.getItem("oshiro_user") || "{}"
  );

  /* ======================
     AUTH GUARD
  ====================== */
  useEffect(() => {
    if (!storedUser.mobile) {
      navigate("/login", { replace: true });
    }
  }, [navigate, storedUser.mobile]);

  /* ======================
     STATE
  ====================== */
  const [form, setForm] = useState({
    mobile: storedUser.mobile || "",
    shopName: "",
    category: "",
    lat: "",
    lng: "",
  });

  const [categories, setCategories] = useState([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  /* ======================
     LOAD ACTIVE CATEGORIES
  ====================== */
  useEffect(() => {
    const q = query(
      collection(db, "categories"),
      where("status", "==", "active")
    );

    const unsub = onSnapshot(q, (snap) => {
      setCategories(snap.docs.map((d) => d.data().name));
    });

    return () => unsub();
  }, []);

  /* ======================
     DUPLICATE CHECK
  ====================== */
  const merchantExists = async () => {
    const q = query(
      collection(db, "merchants"),
      where("mobile", "==", form.mobile)
    );
    const snap = await getDocs(q);
    return !snap.empty;
  };

  /* ======================
     GPS LOCATION
  ====================== */
  const captureLocation = () => {
    setMsg("");

    if (!navigator.geolocation) {
      setMsg("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((p) => ({
          ...p,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }));
        setMsg("📍 Location captured");
      },
      () => setMsg("❌ GPS permission denied"),
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  /* ======================
     SUBMIT
  ====================== */
  const submit = async () => {
    setMsg("");

    if (!form.shopName || !form.category) {
      setMsg("Please fill all fields");
      return;
    }

    if (!form.lat || !form.lng) {
      setMsg("Please capture location");
      return;
    }

    setLoading(true);

    try {
      if (await merchantExists()) {
        setMsg("Merchant already exists. Please login.");
        setLoading(false);
        return;
      }

      await addDoc(collection(db, "merchants"), {
        mobile: form.mobile,
        shopName: form.shopName.trim(),
        category: form.category,
        lat: Number(form.lat),
        lng: Number(form.lng),
        status: "pending",
        createdAt: serverTimestamp(),
      });

      setMsg("✅ Registration submitted for approval");

      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 2000);
    } catch (e) {
      console.error(e);
      setMsg("❌ Registration failed");
    } finally {
      setLoading(false);
    }
  };

  /* ======================
     UI
  ====================== */
  return (
    <Box sx={{ p: 3, maxWidth: 480, mx: "auto" }}>
      <Typography variant="h5">
        Merchant Registration
      </Typography>

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
        {categories.map((c) => (
          <MenuItem key={c} value={c}>
            {c}
          </MenuItem>
        ))}
      </TextField>

      <Button
        variant="outlined"
        fullWidth
        sx={{ mt: 1 }}
        onClick={captureLocation}
      >
        Capture GPS Location
      </Button>

      <Typography sx={{ mt: 1 }}>
        Lat: {form.lat || "—"} | Lng: {form.lng || "—"}
      </Typography>

      {msg && (
        <Typography sx={{ mt: 1 }} color="primary">
          {msg}
        </Typography>
      )}

      <Button
        variant="contained"
        fullWidth
        sx={{ mt: 2 }}
        disabled={loading}
        onClick={submit}
      >
        {loading ? "Submitting..." : "Submit"}
      </Button>

      <Button
        fullWidth
        sx={{ mt: 1 }}
        onClick={() => navigate("/login")}
      >
        Back to Login
      </Button>
    </Box>
  );
}
