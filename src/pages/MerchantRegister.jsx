// src/pages/MerchantRegister.jsx
import React, { useState } from "react";
import { Box, TextField, Button, Typography, Grid } from "@mui/material";
import { addDoc, collection } from "firebase/firestore";
import { db } from "../firebase";

export default function MerchantRegister() {
  const [form, setForm] = useState({
    mobile: "",
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

  // Combine address according to format A
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

  // Geocode via Nominatim (OpenStreetMap)
  async function geocodeAddress() {
    const address = buildCombinedAddress(form);
    if (!address.trim()) {
      setMsg("Please enter address fields to geocode.");
      return;
    }
    setLoading(true);
    setMsg("");
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        address
      )}&limit=1`;
      const res = await fetch(url, {
        headers: {
          // Nominatim requires some identification; referer is fine in browser
          "Accept-Language": "en",
        },
      });
      const data = await res.json();
      if (data && data.length) {
        const first = data[0];
        setForm((s) => ({
          ...s,
          lat: Number(first.lat),
          lng: Number(first.lon),
          addressCombined: address,
        }));
        setMsg("Geocoding successful.");
      } else {
        setMsg("Address not found — try more details.");
      }
    } catch (e) {
      console.error("Geocode error", e);
      setMsg("Geocoding failed. Check network.");
    } finally {
      setLoading(false);
    }
  }

  // Use browser GPS
  function useMyLocation() {
    if (!navigator.geolocation) {
      setMsg("Geolocation not supported by your browser.");
      return;
    }
    setMsg("Getting current location...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((s) => ({
          ...s,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          addressCombined: s.addressCombined || "",
        }));
        setMsg("Location captured.");
      },
      (err) => {
        setMsg("Unable to get location: " + err.message);
      }
    );
  }

  // Save merchant registration (creates document in 'merchants' with status:'pending')
  async function handleSubmit(e) {
    e.preventDefault();
    if (!/^\d{10}$/.test(form.mobile)) {
      setMsg("Mobile must be 10 digits.");
      return;
    }
    setLoading(true);
    setMsg("");
    try {
      const payload = {
        mobile: form.mobile,
        shopName: form.shopName || "",
        doorNo: form.doorNo || "",
        street: form.street || "",
        area: form.area || "",
        city: form.city || "",
        state: form.state || "",
        pincode: form.pincode || "",
        addressCombined: form.addressCombined || buildCombinedAddress(form),
        lat: form.lat ?? null,
        lng: form.lng ?? null,
        category: form.category || "",
        status: "pending",
        createdAt: Date.now(),
      };
      await addDoc(collection(db, "merchants"), payload);
      setMsg("Registration requested — admin will review.");
      setForm({
        mobile: "",
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
    <Box sx={{ p: 3, maxWidth: 720, margin: "0 auto" }}>
      <Typography variant="h5" gutterBottom>
        New merchant? Request registration here
      </Typography>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Mobile"
              value={form.mobile}
              onChange={(e) => setForm({ ...form, mobile: e.target.value.replace(/\D/g, "").slice(0, 10) })}
              fullWidth
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Shop Name"
              value={form.shopName}
              onChange={(e) => setForm({ ...form, shopName: e.target.value })}
              fullWidth
            />
          </Grid>

          {/* Detailed address fields */}
          <Grid item xs={12} sm={4}>
            <TextField label="Door No" value={form.doorNo} onChange={(e) => setForm({ ...form, doorNo: e.target.value })} fullWidth />
          </Grid>
          <Grid item xs={12} sm={8}>
            <TextField label="Street" value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} fullWidth />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField label="Area" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} fullWidth />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField label="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} fullWidth />
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextField label="Pincode" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })} fullWidth />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField label="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} fullWidth />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              fullWidth
              placeholder="Food / Clothing / etc."
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Combined Address (preview)"
              value={buildCombinedAddress(form)}
              onChange={() => {}}
              fullWidth
              disabled
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Button variant="outlined" fullWidth onClick={geocodeAddress} disabled={loading}>
              Geocode Address (OpenStreetMap)
            </Button>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Button variant="outlined" fullWidth onClick={useMyLocation} disabled={loading}>
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
