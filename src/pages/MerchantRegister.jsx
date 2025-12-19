// src/pages/MerchantRegister.jsx
import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Grid,
  MenuItem,
} from "@mui/material";
import { addDoc, collection } from "firebase/firestore";
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

export default function MerchantRegister() {
  const [form, setForm] = useState({
    mobile: "",
    contactPhone: "+91", // ✅ NEW
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
     GEOCODE (OSM)
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
    } catch (e) {
      console.error(e);
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

    setMsg("Getting current location...");
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
      setMsg("Login mobile must be 10 digits.");
      return;
    }

    // ✅ CONTACT NUMBER VALIDATION
    if (!/^\+91\d{10}$/.test(form.contactPhone)) {
      setMsg("Contact number must be in +91XXXXXXXXXX format.");
      return;
    }

    if (!form.category) {
      setMsg("Please select a category.");
      return;
    }

    setLoading(true);
    setMsg("");

    try {
      await addDoc(collection(db, "merchants"), {
        ...form,
        addressCombined: form.addressCombined || buildCombinedAddress(form),
        status: "pending",
        createdAt: Date.now(),
      });

      setMsg("Registration requested — admin will review.");

      setForm({
        mobile: "",
        contactPhone: "+91",
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
    } catch (err) {
      console.error(err);
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
          {/* LOGIN MOBILE */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="Login Mobile"
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
              label="Contact Number (for customers)"
              placeholder="+91 9876543210"
              value={form.contactPhone}
              onChange={(e) =>
                setForm({
                  ...form,
                  contactPhone: e.target.value.replace(/[^\d+]/g, ""),
                })
              }
              helperText="Customers can call this number"
              fullWidth
              required
            />
          </Grid>

          {/* SHOP */}
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

          {/* ADDRESS */}
          <Grid item xs={12} sm={4}>
            <TextField label="Door No" value={form.doorNo}
              onChange={(e) => setForm({ ...form, doorNo: e.target.value })}
              fullWidth />
          </Grid>
          <Grid item xs={12} sm={8}>
            <TextField label="Street" value={form.street}
              onChange={(e) => setForm({ ...form, street: e.target.value })}
              fullWidth />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Area" value={form.area}
              onChange={(e) => setForm({ ...form, area: e.target.value })}
              fullWidth />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField label="City" value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              fullWidth />
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextField label="Pincode" value={form.pincode}
              onChange={(e) =>
                setForm({
                  ...form,
                  pincode: e.target.value.replace(/\D/g, "").slice(0, 6),
                })
              }
              fullWidth />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField label="State" value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
              fullWidth />
          </Grid>

          {/* CATEGORY */}
          <Grid item xs={12} sm={6}>
            <TextField
              select
              label="Category"
              value={form.category}
              onChange={(e) =>
                setForm({ ...form, category: e.target.value })
              }
              fullWidth
              required
            >
              {CATEGORY_LIST.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
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
              variant="outlined"
              fullWidth
              onClick={geocodeAddress}
              disabled={loading}
            >
              Geocode Address
            </Button>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Button
              variant="outlined"
              fullWidth
              onClick={useMyLocation}
              disabled={loading}
            >
              Use My GPS Location
            </Button>
          </Grid>

          <Grid item xs={12}>
            <Typography>
              Lat: {form.lat ?? "-"} • Lng: {form.lng ?? "-"}
            </Typography>
          </Grid>

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
