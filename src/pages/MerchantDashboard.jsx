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
  addDoc,
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
    if (!user) {
      console.warn("Auth user not ready");
      return;
    }

    const mobile =
      user.mobile || user.phoneNumber || user?.providerData?.[0]?.phoneNumber;

    if (!mobile) {
      console.error("❌ Mobile number not found in auth user");
      return;
    }

    const q = query(
      collection(db, "merchants"),
      where("mobile", "==", mobile)
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
  }, [user]);

  /* =========================
     GPS LOCATION (BULLETPROOF)
  ========================= */
  function useMyLocation() {
    console.log("✅ GPS button clicked");

    if (!navigator.geolocation) {
      setMsg("Geolocation not supported");
      return;
    }

    setMsg("Fetching GPS location...");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        console.log("📍 GPS success", pos.coords);
        setForm((p) => ({
          ...p,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }));
        setMsg("GPS location set");
      },
      (err) => {
        console.error("❌ GPS error", err);
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
     SAVE PROFILE (ALWAYS WORKS)
  ========================= */
  async function saveProfile() {
    try {
      const mobile =
        user.mobile ||
        user.phoneNumber ||
        user?.providerData?.[0]?.phoneNumber;

      if (!mobile) {
        setMsg("Mobile number missing in auth");
        return;
      }

      setMsg("Saving profile...");

      const payload = {
        ...form,
        mobile,
        updatedAt: new Date(),
      };

      if (merchant?.id) {
        await updateDoc(doc(db, "merchants", merchant.id), payload);
        setMsg("Profile updated");
      } else {
        await addDoc(collection(db, "merchants"), {
          ...payload,
          createdAt: new Date(),
        });
        setMsg("Merchant created");
      }
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
      <Typography sx={{ mb: 2 }}>
        Mobile: {user?.mobile || user?.phoneNumber || "N/A"}
      </Typography>

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
          <Button
            type="button"
            fullWidth
            variant="contained"
            onClick={useMyLocation}
          >
            Use My GPS Location
          </Button>
        </Grid>

        <Grid item xs={12}>
          <Typography>
            Lat: {form.lat !== null ? form.lat.toFixed(6) : "NOT SET"} <br />
            Lng: {form.lng !== null ? form.lng.toFixed(6) : "NOT SET"}
          </Typography>
        </Grid>

        <Grid item xs={12}>
          <Button
            type="button"
            fullWidth
            variant="contained"
            onClick={saveProfile}
          >
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
