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
      } else {
        setMerchant(null);
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
     GEOCODE (OSM)
  ========================= */
  async function geocodeAddress() {
    const address = buildCombinedAddress(form);
    if (!address) {
      setMsg("Please fill address first");
      return;
    }

    setMsg("Geocoding address...");
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        address
      )}&limit=1`;

      const res = await fetch(url, {
        headers: { "Accept-Language": "en" },
      });

      const data = await res.json();

      if (data?.length) {
        setForm((s) => ({
          ...s,
          lat: Number(data[0].lat),
          lng: Number(data[0].lon),
          addressCombined: address,
        }));
        setMsg("Address located successfully");
      } else {
        setMsg("Address not found");
      }
    } catch (e) {
      console.error(e);
      setMsg("Geocoding failed");
    }
  }

  /* =========================
     GPS LOCATION (FIXED)
  ========================= */
 function useMyLocation() {
  alert("GPS button clicked"); // 🔥 HARD CHECK

  if (!navigator.geolocation) {
    alert("Geolocation NOT supported");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      alert("GPS SUCCESS");

      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      alert(`Lat: ${lat}, Lng: ${lng}`);

      setForm((prev) => ({
        ...prev,
        lat,
        lng,
      }));
    },
    (err) => {
      alert("GPS ERROR: " + err.message);
      console.error(err);
    },
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
    if (!merchant) {
      setMsg("Merchant record not found");
      return;
    }

    try {
      setMsg("Saving profile...");

      const payload = {
        shopName: form.shopName,
        doorNo: form.doorNo,
        street: form.street,
        area: form.area,
        city: form.city,
        state: form.state,
        pincode: form.pincode,
        addressCombined: form.addressCombined || buildCombinedAddress(form),
        lat: form.lat ?? null,
        lng: form.lng ?? null,
        category: form.category,
      };

      await updateDoc(doc(db, "merchants", merchant.id), payload);
      setMsg("Profile updated successfully");
    } catch (e) {
      console.error(e);
      setMsg("Save failed");
    }
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

        <Grid item xs={12} sm={4}>
          <TextField
            label="Door No"
            value={form.doorNo}
            onChange={(e) =>
              setForm({ ...form, doorNo: e.target.value })
            }
            fullWidth
          />
        </Grid>

        <Grid item xs={12} sm={8}>
          <TextField
            label="Street"
            value={form.street}
            onChange={(e) =>
              setForm({ ...form, street: e.target.value })
            }
            fullWidth
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            label="Area"
            value={form.area}
            onChange={(e) =>
              setForm({ ...form, area: e.target.value })
            }
            fullWidth
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <TextField
            label="City"
            value={form.city}
            onChange={(e) =>
              setForm({ ...form, city: e.target.value })
            }
            fullWidth
          />
        </Grid>

        <Grid item xs={12} sm={2}>
          <TextField
            label="Pincode"
            value={form.pincode}
            onChange={(e) =>
              setForm({
                ...form,
                pincode: e.target.value.replace(/\D/g, "").slice(0, 6),
              })
            }
            fullWidth
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Button fullWidth variant="outlined" onClick={geocodeAddress}>
            Geocode Address
          </Button>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Button fullWidth variant="outlined" onClick={useMyLocation}>
            Use My GPS Location
          </Button>
        </Grid>

        <Grid item xs={12}>
          <Typography>
            Latitude: <b>{form.lat ?? "-"}</b> &nbsp; | &nbsp;
            Longitude: <b>{form.lng ?? "-"}</b>
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
