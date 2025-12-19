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
    const p = f.pincode ? `- ${f.pincode}` : "";
    return parts.join(", ") + (parts.length ? ` ${p}` : p);
  }

  /* =========================
     DUPLICATE CHECK
  ========================= */
  async function checkDuplicateMerchant() {
    // Login mobile
    const qMobile = query(
      collection(db, "merchants"),
      where("mobile", "==", form.mobile)
    );
    if (!(await getDocs(qMobile)).empty) {
      return "This login mobile is already registered.";
    }

    // Contact phone
    const fullContact = `+91${form.contactPhone}`;
    const qContact = query(
      collection(db, "merchants"),
      where("contactPhone", "==", fullContact)
    );
    if (!(await getDocs(qContact)).empty) {
      return "This contact number is already registered.";
    }

    // GPS proximity (50 meters)
    if (form.lat && form.lng) {
      const snap = await getDocs(collection(db, "merchants"));
      for (const d of snap.docs) {
        const m = d.data();
        if (!m.lat || !m.lng) continue;
        if (distanceKm(form.lat, form.lng, m.lat, m.lng) < 0.05) {
          return "A merchant already exists at this location.";
        }
      }
    }

    return null;
  }

  /* =========================
     GEOCODE
  ========================= */
  async function geocodeAddress() {
    const address = buildCombinedAddress(form);
    if (!address.trim()) {
      setMsg("Please enter address fields to geocode.");
      return;
    }

    setLoading(true);
    setMsg("");

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          address
        )}&limit=1`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await res.json();

      if (data?.length) {
        setForm((s) => ({
          ...s,
          lat: Number(data[0].lat),
          lng: Number(data[0].lon),
          addressCombined: address,
        }));
        setMsg("Geocoding successful.");
      } else {
        setMsg("Address not found — try more details.");
      }
    } catch {
      setMsg("Geocoding failed.");
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     USE GPS
  ========================= */
  function useMyLocation() {
    if (!navigator.geolocation) {
      setMsg("Geolocation not supported.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((s) => ({
          ...s,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }));
        setMsg("Location captured.");
      },
      (err) => setMsg("Unable to get location: " + err.message)
    );
  }

  /* =========================
     SUBMIT
  ========================= */
  async function handleSubmit(e) {
    e.preventDefault();

    if (!/^\d{10}$/.test(form.mobile)) {
      setMsg("Login mobile must be exactly 10 digits.");
      return;
    }

    if (!/^\d{10}$/.test(form.contactPhone)) {
      setMsg("Contact number must be exactly 10 digits.");
      return;
    }

    if (!form.category) {
      setMsg("Please select a category.");
      return;
    }

    setLoading(true);
    setMsg("");

    const duplicateMsg = await checkDuplicateMerchant();
    if (duplicateMsg) {
      setMsg(duplicateMsg);
      setLoading(false);
      return;
    }

    try {
      await addDoc(collection(db, "merchants"), {
        ...form,
        contactPhone: `+91${form.contactPhone}`,
        addressCombined: form.addressCombined || buildCombinedAddress(form),
        status: "pending",
        createdAt: Date.now(),
      });

      setMsg("Registration requested — admin will review.");
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
      setMsg("Failed to submit registration.");
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
                setForm({ ...form, mobile: e.target.value.replace(/\D/g, "").slice(0, 10) })
              }
              inputProps={{ maxLength: 10 }}
              fullWidth
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Contact Number (for customers) *"
              value={form.contactPhone}
              onChange={(e) =>
                setForm({ ...form, contactPhone: e.target.value.replace(/\D/g, "").slice(0, 10) })
              }
              InputProps={{
                startAdornment: <InputAdornment position="start">+91</InputAdornment>,
              }}
              inputProps={{ maxLength: 10 }}
              fullWidth
              required
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Shop Name"
              value={form.shopName}
              onChange={(e) => setForm({ ...form, shopName: e.target.value })}
              fullWidth
            />
          </Grid>

          {/* Address + category (unchanged UI) */}
          {/* ... kept same as your version ... */}

          <Grid item xs={12}>
            <Button variant="contained" type="submit" disabled={loading}>
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
