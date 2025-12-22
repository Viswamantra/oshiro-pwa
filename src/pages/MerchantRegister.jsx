import React, { useEffect, useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Grid,
  MenuItem,
  InputAdornment,
} from "@mui/material";
import {
  addDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase";

export default function MerchantRegister() {
  const [form, setForm] = useState({
    mobile: "",
    contactPhone: "",
    shopName: "",
    doorNo: "",
    street: "",
    area: "",
    city: "",
    state: "",
    pincode: "",
    lat: null,
    lng: null,
    category: "",
  });

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  /* =========================
     LOAD ACTIVE CATEGORIES
  ========================= */
  useEffect(() => {
    const q = query(
      collection(db, "categories"),
      where("status", "==", "active")
    );

    const unsub = onSnapshot(q, (snap) => {
      setCategories(
        snap.docs.map((d) => ({
          id: d.id,
          name: d.data().name,
        }))
      );
    });

    return () => unsub();
  }, []);

  /* =========================
     ADDRESS BUILDER
  ========================= */
  const buildCombinedAddress = () =>
    [
      form.doorNo,
      form.street,
      form.area,
      form.city,
      form.state,
      form.pincode,
    ]
      .filter(Boolean)
      .join(", ");

  /* =========================
     DUPLICATE CHECK (MOBILE ONLY)
  ========================= */
  async function checkDuplicateMerchant() {
    const q = query(
      collection(db, "merchants"),
      where("mobile", "==", form.mobile)
    );

    const snap = await getDocs(q);
    if (!snap.empty) {
      return "This mobile number is already registered";
    }
    return null;
  }

  /* =========================
     GPS LOCATION
  ========================= */
  function useMyLocation() {
    if (!navigator.geolocation) {
      setMsg("Geolocation not supported");
      return;
    }

    setMsg("Fetching GPS location...");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((s) => ({
          ...s,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }));
        setMsg("GPS location captured");
      },
      (err) => {
        console.error("GPS error:", err);
        setMsg("GPS permission denied");
      },
      { enableHighAccuracy: true }
    );
  }

  /* =========================
     SUBMIT
  ========================= */
  async function handleSubmit(e) {
    e.preventDefault();

    if (!/^\d{10}$/.test(form.mobile)) {
      setMsg("Login mobile must be 10 digits");
      return;
    }

    if (!form.category) {
      setMsg("Please select a category");
      return;
    }

    if (!form.lat || !form.lng) {
      setMsg("Please use GPS location");
      return;
    }

    setLoading(true);
    setMsg("");

    try {
      const dup = await checkDuplicateMerchant();
      if (dup) throw new Error(dup);

      await addDoc(collection(db, "merchants"), {
        mobile: form.mobile,
        contactPhone: form.contactPhone
          ? `+91${form.contactPhone}`
          : "",
        shopName: form.shopName,
        category: form.category,
        addressCombined: buildCombinedAddress(),
        lat: form.lat,
        lng: form.lng,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      setMsg("✅ Registration submitted for approval");

      setForm({
        mobile: "",
        contactPhone: "",
        shopName: "",
        doorNo: "",
        street: "",
        area: "",
        city: "",
        state: "",
        pincode: "",
        lat: null,
        lng: null,
        category: "",
      });
    } catch (err) {
      console.error("🔥 Firestore error:", err);
      setMsg(err.message || "Submission failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box sx={{ p: 3, maxWidth: 720, mx: "auto" }}>
      <Typography variant="h5" gutterBottom>
        New merchant? Request registration here
      </Typography>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Login Mobile *"
              value={form.mobile}
              onChange={(e) =>
                setForm({
                  ...form,
                  mobile: e.target.value.replace(/\D/g, "").slice(0, 10),
                })
              }
              required
              fullWidth
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Contact Number"
              value={form.contactPhone}
              onChange={(e) =>
                setForm({
                  ...form,
                  contactPhone: e.target.value.replace(/\D/g, "").slice(0, 10),
                })
              }
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">+91</InputAdornment>
                ),
              }}
              fullWidth
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Shop Name"
              value={form.shopName}
              onChange={(e) =>
                setForm({ ...form, shopName: e.target.value })
              }
              fullWidth
            />
          </Grid>

          {/* 🔥 DYNAMIC CATEGORY DROPDOWN */}
          <Grid item xs={12}>
            <TextField
              select
              label="Category *"
              value={form.category}
              onChange={(e) =>
                setForm({ ...form, category: e.target.value })
              }
              required
              fullWidth
            >
              {categories.map((c) => (
                <MenuItem key={c.id} value={c.name}>
                  {c.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12}>
            <Button
              type="button"
              variant="outlined"
              fullWidth
              onClick={useMyLocation}
            >
              Use My GPS Location
            </Button>
          </Grid>

          <Grid item xs={12}>
            <Typography>
              Lat: {form.lat ?? "—"} | Lng: {form.lng ?? "—"}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Button type="submit" variant="contained" disabled={loading}>
              Request Registration
            </Button>
          </Grid>

          {msg && (
            <Grid item xs={12}>
              <Typography color="primary">{msg}</Typography>
            </Grid>
          )}
        </Grid>
      </form>
    </Box>
  );
}
