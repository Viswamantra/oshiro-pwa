import React, { useEffect, useState } from "react";
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
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";

export default function MerchantRegister() {
  const navigate = useNavigate();

  /* ======================
     USER FROM LOGIN (MANDATORY)
  ====================== */
  const storedUser = JSON.parse(
    localStorage.getItem("oshiro_user") || "{}"
  );

  /* 🚨 HARD STOP IF MOBILE MISSING */
  useEffect(() => {
    if (!storedUser.mobile || !/^\d{10}$/.test(storedUser.mobile)) {
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

    const unsub = onSnapshot(
      q,
      (snap) => {
        if (snap.empty) {
          setCategories([
            "Food",
            "Fashion",
            "Electronics",
            "Hospitals",
            "Medicals",
            "Education",
          ]);
          return;
        }

        setCategories(
          snap.docs.map((d) => d.data().name)
        );
      },
      () => {
        // fallback on error
        setCategories([
          "Food",
          "Fashion",
          "Electronics",
          "Hospitals",
          "Medicals",
          "Education",
        ]);
      }
    );

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
      setMsg("Geolocation not supported on this device");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({
          ...prev,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }));
        setMsg("📍 Location captured successfully");
      },
      () => {
        setMsg("❌ GPS permission denied");
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  /* ======================
     SUBMIT
  ====================== */
  const submit = async () => {
    setMsg("");

    if (!form.shopName.trim() || !form.category) {
      setMsg("Please fill all required fields");
      return;
    }

    if (!form.lat || !form.lng) {
      setMsg("Please capture GPS location");
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

      setMsg(
        "✅ Registration submitted. Await admin approval."
      );

      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 2000);
    } catch (err) {
      console.error(err);
      setMsg("❌ Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ======================
     UI
  ====================== */
  return (
    <Box sx={{ p: 3, maxWidth: 500, mx: "auto" }}>
      <Typography variant="h5" gutterBottom>
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
        label="Shop Name *"
        fullWidth
        margin="normal"
        value={form.shopName}
        onChange={(e) =>
          setForm({
            ...form,
            shopName: e.target.value,
          })
        }
      />

      <TextField
        select
        label="Category *"
        fullWidth
        margin="normal"
        value={form.category}
        onChange={(e) =>
          setForm({
            ...form,
            category: e.target.value,
          })
        }
      >
        {categories.map((c) => (
          <MenuItem key={c} value={c}>
            {c}
          </MenuItem>
        ))}
      </TextField>

      <Button
        sx={{ mt: 1 }}
        variant="outlined"
        fullWidth
        onClick={captureLocation}
      >
        Capture GPS Location
      </Button>

      <Typography sx={{ mt: 1 }}>
        Lat: {form.lat || "—"} | Lng:{" "}
        {form.lng || "—"}
      </Typography>

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
        {loading ? "Submitting..." : "Submit Registration"}
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
