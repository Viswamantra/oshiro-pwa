// src/pages/MerchantDashboard.jsx
import React, { useEffect, useState } from "react";
import { Box, Typography, TextField, Button, Grid } from "@mui/material";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";
import { useAuth } from "../auth/AuthContext";

export default function MerchantDashboard() {
  const { user } = useAuth();

  const [merchant, setMerchant] = useState(null);
  const [msg, setMsg] = useState("");

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

  /* =========================
     LOAD MERCHANT BY MOBILE
  ========================= */
  useEffect(() => {
    if (!user?.mobile) return;

    const q = query(
      collection(db, "merchants"),
      where("mobile", "==", user.mobile)
    );

    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const d = snap.docs[0];
        const data = d.data();

        setMerchant({ id: d.id, ...data });

        setForm({
          shopName: data.shopName || "",
          doorNo: data.doorNo || "",
          street: data.street || "",
          area: data.area || "",
          city: data.city || "",
          state: data.state || "",
          pincode: data.pincode || "",
          addressCombined: data.addressCombined || "",
          lat: data.lat ?? null,
          lng: data.lng ?? null,
          category: data.category || "",
        });
      }
    });

    return () => unsub();
  }, [user?.mobile]);

  /* =========================
     ADDRESS COMBINER
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
     GEOCODE
  ========================= */
  async function geocodeAddress() {
    const address = buildCombinedAddress(form);
    if (!address) {
      setMsg("Please fill address first");
      return;
    }

    try {
      setMsg("Geocoding...");
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
        setMsg("Address located");
      } else {
        setMsg("Address not found");
      }
    } catch {
      setMsg("Geocode failed");
    }
  }

  /* =========================
     GPS LOCATION (FORCED)
  ========================= */
  function useMyLocation() {
    alert("BUTTON CLICK CONFIRMED");

    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        alert("GPS SUCCESS");
        setForm((p) => ({
          ...p,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }));
      },
      (err) => alert("GPS ERROR: " + err.message),
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
      }
    );
  }

  /* =========================
     SAVE PROFILE
  ========================= */
  async function saveProfile() {
    if (!merchant) return;

    setMsg("Saving...");
    await updateDoc(doc(db, "merchants", merchant.id), {
      ...form,
      addressCombined: form.addressCombined || buildCombinedAddress(form),
    });
    setMsg("Profile saved");
  }

  /* =========================
     UI
  ========================= */
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5">Merchant Dashboard</Typography>
      <Typography sx={{ mb: 2 }}>Mobile: {user?.mobile}</Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Shop Name"
            value={form.shopName}
            onChange={(e) =>
              setForm({ ...form, shopName: e.target.value })
            }
            fullWidth
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            label="Category"
            value={form.category}
            onChange={(e) =>
              setForm({ ...form, category: e.target.value })
            }
            fullWidth
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Button fullWidth variant="outlined" onClick={geocodeAddress}>
            Geocode Address
          </Button>
        </Grid>

        {/* 🔥 CLICK-PROOF GPS BUTTON */}
        <Grid item xs={12} sm={6}>
          <Box sx={{ position: "relative", zIndex: 99999 }}>
            <Button
              fullWidth
              variant="contained"
              color="error"
              onClick={() => {
                alert("VISIBLE CLICK");
                useMyLocation();
              }}
            >
              Use My GPS Location (TEST)
            </Button>
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Typography>
            Lat: {form.lat !== null ? form.lat.toFixed(6) : "NOT SET"} <br />
            Lng: {form.lng !== null ? form.lng.toFixed(6) : "NOT SET"}
          </Typography>
        </Grid>

        <Grid item xs={12}>
          <Button fullWidth variant="contained" onClick={saveProfile}>
            Save Profile
          </Button>
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
