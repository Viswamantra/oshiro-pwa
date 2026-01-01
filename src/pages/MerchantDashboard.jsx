import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  MenuItem,
  Button,
  Divider,
  Slider,
} from "@mui/material";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

/* ================= HELPERS ================= */
function distanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export default function MerchantDashboard() {
  const stored = JSON.parse(localStorage.getItem("oshiro_user") || "{}");
  const merchantId = stored.merchantId;

  const [merchant, setMerchant] = useState(null);
  const [offers, setOffers] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [offerId, setOfferId] = useState("");
  const [category, setCategory] = useState("All");
  const [radius, setRadius] = useState(300);
  const [message, setMessage] = useState("");
  const [sentCount, setSentCount] = useState(0);

  /* ================= LOAD MERCHANT ================= */
  useEffect(() => {
    if (!merchantId) return;
    return onSnapshot(
      collection(db, "merchants"),
      snap => {
        const m = snap.docs.find(d => d.id === merchantId);
        if (m) setMerchant({ id: m.id, ...m.data() });
      }
    );
  }, [merchantId]);

  /* ================= LOAD OFFERS ================= */
  useEffect(() => {
    if (!merchantId) return;
    const q = query(
      collection(db, "offers"),
      where("merchantId", "==", merchantId),
      where("active", "==", true)
    );
    return onSnapshot(q, snap =>
      setOffers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  }, [merchantId]);

  /* ================= LOAD CUSTOMERS ================= */
  useEffect(() => {
    return onSnapshot(collection(db, "customers"), snap =>
      setCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  }, []);

  /* ================= SEND MESSAGE ================= */
  const sendMessages = async () => {
    if (!merchant || !message.trim()) return alert("Missing data");

    let count = 0;

    for (const c of customers) {
      if (!c.lat || !c.lng) continue;

      if (category !== "All" && c.category !== category) continue;

      const dist = distanceMeters(
        merchant.lat,
        merchant.lng,
        c.lat,
        c.lng
      );

      if (dist > radius) continue;

      await addDoc(collection(db, "customer_alerts"), {
        customerId: c.id,
        merchantId,
        offerId,
        message: message.trim(),
        category,
        distanceMeters: Math.round(dist),
        createdAt: serverTimestamp(),
        read: false,
      });

      count++;
    }

    setSentCount(count);
    setMessage("");
  };

  if (!merchant)
    return <Typography sx={{ p: 2 }}>Loading...</Typography>;

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6">Merchant Dashboard</Typography>

      <Divider sx={{ my: 2 }} />

      <Card>
        <CardContent>
          <Typography variant="subtitle1">
            📣 Send Message to Nearby Customers
          </Typography>

          {/* OFFER */}
          <TextField
            select
            fullWidth
            label="Select Offer"
            value={offerId}
            onChange={e => setOfferId(e.target.value)}
            sx={{ mt: 2 }}
          >
            <MenuItem value="">No Offer</MenuItem>
            {offers.map(o => (
              <MenuItem key={o.id} value={o.id}>
                {o.title}
              </MenuItem>
            ))}
          </TextField>

          {/* CATEGORY */}
          <TextField
            select
            fullWidth
            label="Target Category"
            value={category}
            onChange={e => setCategory(e.target.value)}
            sx={{ mt: 2 }}
          >
            <MenuItem value="All">All</MenuItem>
            <MenuItem value="Food">Food</MenuItem>
            <MenuItem value="Fashion & Clothing">Fashion & Clothing</MenuItem>
            <MenuItem value="Medicals">Medicals</MenuItem>
            <MenuItem value="Hospitals">Hospitals</MenuItem>
            <MenuItem value="Home Kitchen">Home Kitchen</MenuItem>
          </TextField>

          {/* RADIUS */}
          <Typography sx={{ mt: 2 }}>
            Radius: {radius} meters
          </Typography>
          <Slider
            min={100}
            max={1000}
            step={50}
            value={radius}
            onChange={(_, v) => setRadius(v)}
          />

          {/* MESSAGE */}
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Message"
            value={message}
            onChange={e => setMessage(e.target.value)}
            sx={{ mt: 2 }}
          />

          <Button
            variant="contained"
            sx={{ mt: 2 }}
            onClick={sendMessages}
          >
            Send Message
          </Button>

          {sentCount > 0 && (
            <Typography sx={{ mt: 1, color: "green" }}>
              ✅ Sent to {sentCount} customers
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
