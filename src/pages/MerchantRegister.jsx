// src/pages/MerchantRegister.jsx
import React, { useState } from "react";
import { Box, TextField, Button, Typography, Grid, MenuItem } from "@mui/material";
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

  // Combine address
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

  // Geocode via OpenStreetMap
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
        headers: { "Accept-Language": "en" },
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
        setMsg
