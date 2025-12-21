// src/pages/MerchantRegister.jsx
import React, { useState } from "react";
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
} from "firebase/firestore";
import { db } from "../firebase";

/* =========================
   CATEGORY MASTER LIST
========================= */
const CATEGORY_LIST = [
  "Food",
  "Fashion & Clothing",
  "Beauty & Spa",
  "Hospitals",
  "Medicals",
  "Electronics",
  "Education",
  "Services",
];

/* =========================
   DISTANCE (HAVERSINE)
========================= */
function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

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
    addressCombined: "",
    lat: null,
    lng: null,
    category: "",
  });

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  /* =========================
     BUILD ADDRESS
  ========================= */
  function buildCombinedAddress(f) {
    const parts = [];
    if (f.doorNo) parts.push(f.doorNo);
    if (f.street) parts.push(f.street);
    if (f.area) parts.push(f.area);
    if (f.city) parts.push(f.city);
    if (f.state) parts.push(f.state);
    if (f.pincode) parts.push(f.pincode);
    return parts.join(", ");
  }

  /* =========================
     DUPLICATE CHECK
  ========================= */
  async function checkDuplicateMerchant() {
    const qMobile = query(
      collection(db, "merchants"),
      where("mobile", "==", form.mobile)
    );
    if (!(await getDocs(qMobile)).empty)
      return "This login mobile is already registered.";

    const fullContact = `+91${form.contactPhone}`;
    const qContact = query(
      collection(db, "merchants"),
      where("contactPhone", "==", fullContact)
    );
    if (!(await getDocs(qContact)).empty)
      return "This contact number is already registered.";

    if (form.lat && form.lng) {
      const snap = await getDocs(collection(db, "merchants"));
      for (const d of snap.docs) {
        const m = d.data();
        if (!m.lat || !m.lng) continue;
        if (distanceKm(form.lat, form.lng, m.lat, m.lng) < 0.05)
          return "A merchant already exists at this location.";
      }
    }
    return null;
  }

  /* =========================
     GEOCODE
  ========================= */
  async function geocodeAddress() {
    const address = buildCombinedAddress(form);
    if (!address) {
      setMsg("Please fill address fields first");
      return;
    }

    setLoading(true);
    setMsg("Geocoding address...");
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          address
        )}&limit=1`
      );
      const data = await res.json();

      if (data?.length) {
        setForm((s) => ({
          ...s,
          lat: Number(data[0].lat),
          lng: Number(data[0].lon),
          addressCombined: address,
        }));
        setMsg("Address geocoded successfully");
      } else {
        setMsg("Address not found");
      }
    } catch {
      setMsg("Geocoding failed");
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     GPS LOCATION (FIXED)
  ========================= */
  function useMyLocation() {
    console.log("📍 GPS button clicked");

    if (!navigator.geolocation) {
      setMsg("Geolocation not supported");
      return;
    }

    setMsg("Fetching GPS location...");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        console.log("📍 GPS success", pos.coords);
        setForm((s) => ({
          ...s,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }));
        setMsg("GPS location set");
      },
      (err) => {
        console.error("GPS error", err);
        setMsg("GPS error: " + err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }

  /* =========================
     SUBMIT
  ========================= */
  async function handleSubmit(e) {
    e.preventDefault();

    if (!/^\d{10}$/.test(form.mobile)) {
      setMsg("Login mobile must be 10 digits.");
      return;
    }
    if (!/^\d{10}$/.test(form.contactPhone)) {
      setMsg("Contact number must be 10 digits.");
      return;
    }
    if (!form.category) {
      setMsg("Please select a category.");
      return;
    }

    setLoading(true);
    setMsg("");

    const dup = await checkDuplicateMerchant();
    if (dup) {
      setMsg(dup);
      setLoading(false);
      return;
    }

    try {
      await addDoc(collection(db, "merchants"), {
        ...form,
        contactPhone: `+91${form.contactPhone}`,
        addressCombined:
          form.addressCombined || buildCombinedAddress(form),
        status: "pending",
        createdAt: Date.now(),
      });

      setMsg("Registration requested. Admin will review.");
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
        addressCombined: "",
        lat: null,
        lng: null,
        category: "",
      });
    } catch {
      setMsg("Submission failed.");
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
          {/* LOGIN MOBILE */}
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
              fullWidth
              required
            />
          </Grid>

          {/* CONTACT PHONE */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="Contact Number (for customers) *"
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
              required
            />
          </Grid>

          {/* SHOP NAME */}
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

          {/* CATEGORY */}
          <Grid item xs={12}>
            <TextField
              select
              label="Category *"
              value={form.category}
              onChange={(e) =>
                setForm({ ...form, category: e.target.value })
              }
              fullWidth
              required
            >
              {CATEGORY_LIST.map((c) => (
                <MenuItem key={c} value={c}>
                  {c}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* ADDRESS PREVIEW */}
          <Grid item xs={12}>
            <TextField
              label="Combined Address (preview)"
              value={buildCombinedAddress(form)}
              fullWidth
              disabled
            />
          </Grid>

          {/* GEO BUTTONS */}
          <Grid item xs={12} sm={6}>
            <Button
              type="button"
              variant="outlined"
              fullWidth
              onClick={geocodeAddress}
            >
              Geocode Address
            </Button>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Button
              type="button"      // 🔥 CRITICAL FIX
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
            <Button
              variant="contained"
              type="submit"
              disabled={loading}
            >
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
