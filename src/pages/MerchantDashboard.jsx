// src/pages/MerchantDashboard.jsx
import React, { useEffect, useState } from "react";
import { Box, Typography, TextField, Button, Grid } from "@mui/material";
import { db } from "../firebase";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { useAuth } from "../auth/AuthContext";

export default function MerchantDashboard() {
  const { user } = useAuth();
  const [merchant, setMerchant] = useState(null);
  const [form, setForm] = useState({
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
  const [msg, setMsg] = useState("");

  // load merchant record by mobile
  useEffect(() => {
    if (!user?.mobile) return;
    const q = query(collection(db, "merchants"), where("mobile", "==", user.mobile));
    const unsub = onSnapshot(q, (snap) => {
      const docData = snap.docs[0];
      if (docData) {
        setMerchant({ id: docData.id, ...docData.data() });
        setForm({
          shopName: docData.data().shopName || "",
          doorNo: docData.data().doorNo || "",
          street: docData.data().street || "",
          area: docData.data().area || "",
          city: docData.data().city || "",
          state: docData.data().state || "",
          pincode: docData.data().pincode || "",
          addressCombined: docData.data().addressCombined || "",
          lat: docData.data().lat ?? null,
          lng: docData.data().lng ?? null,
          category: docData.data().category || "",
        });
      } else {
        setMerchant(null);
      }
    });
    return () => unsub();
  }, [user?.mobile]);

  // combine address helper (format A)
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

  // Nominatim geocode
  async function geocodeAddress() {
    const address = buildCombinedAddress(form);
    if (!address.trim()) { setMsg("Please fill address to geocode"); return; }
    setMsg("Geocoding...");
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
      const res = await fetch(url, { headers: { "Accept-Language": "en" }});
      const data = await res.json();
      if (data && data.length) {
        setForm((s) => ({ ...s, lat: Number(data[0].lat), lng: Number(data[0].lon), addressCombined: address }));
        setMsg("Geocode success");
      } else {
        setMsg("Address not found");
      }
    } catch (e) {
      console.error(e);
      setMsg("Geocode error");
    }
  }

  function useMyLocation() {
    if (!navigator.geolocation) { setMsg("No geolocation"); return; }
    setMsg("Getting location...");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setForm((s) => ({ ...s, lat: p.coords.latitude, lng: p.coords.longitude }));
        setMsg("Location set");
      },
      (err) => setMsg("Unable to get location: " + err.message)
    );
  }

  async function saveProfile() {
    if (!merchant) { setMsg("No merchant record to update"); return; }
    try {
      setMsg("Saving...");
      const payload = {
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
      };
      await updateDoc(doc(db, "merchants", merchant.id), payload);
      setMsg("Profile updated.");
    } catch (e) {
      console.error(e);
      setMsg("Update failed.");
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5">Merchant Dashboard</Typography>
      <Typography sx={{ mb: 2 }}>{user?.mobile}</Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField label="Shop Name" value={form.shopName} onChange={(e) => setForm({ ...form, shopName: e.target.value })} fullWidth />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} fullWidth />
        </Grid>

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
          <Button variant="outlined" onClick={geocodeAddress}>Geocode Address</Button>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Button variant="outlined" onClick={useMyLocation}>Use My GPS Location</Button>
        </Grid>

        <Grid item xs={12}>
          <Typography>Lat: {form.lat ?? "-"} • Lng: {form.lng ?? "-"}</Typography>
        </Grid>

        <Grid item xs={12}>
          <Button variant="contained" onClick={saveProfile}>Save Profile</Button>
        </Grid>

        {msg && (
          <Grid item xs={12}>
            <Typography color="primary">{msg}</Typography>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
