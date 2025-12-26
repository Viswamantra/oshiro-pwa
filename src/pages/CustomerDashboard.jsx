import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  IconButton,
} from "@mui/material";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import CallIcon from "@mui/icons-material/Call";
import DirectionsIcon from "@mui/icons-material/Directions";
import {
  collection,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";

/* =========================
   DISTANCE (HAVERSINE)
========================= */
function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

const GPS_BUFFER_KM = 0.5;
const RADIUS_OPTIONS = [1, 2, 3, 5];

export default function CustomerDashboard() {
  const navigate = useNavigate();

  /* ===== ROLE GUARD ===== */
  const role = localStorage.getItem("oshiro_role");
  if (role !== "customer") {
    navigate("/login", { replace: true });
    return null;
  }

  /* ===== LOGOUT ===== */
  const logout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  const [offers, setOffers] = useState([]);
  const [merchantsMap, setMerchantsMap] = useState({});
  const [categories, setCategories] = useState([]);

  const [customerLoc, setCustomerLoc] = useState(null);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);

  const [radiusKm, setRadiusKm] = useState(1);
  const [category, setCategory] = useState("All");
  const [selectedOffer, setSelectedOffer] = useState(null);

  /* ===== LIVE GPS ===== */
  useEffect(() => {
    if (!navigator.geolocation) return;

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setCustomerLoc({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setGpsAccuracy(pos.coords.accuracy);
      },
      () => {},
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(id);
  }, []);

  /* ===== LOAD CATEGORIES ===== */
  useEffect(() => {
    return onSnapshot(collection(db, "categories"), (snap) => {
      setCategories(
        snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      );
    });
  }, []);

  /* ===== LOAD OFFERS ===== */
  useEffect(() => {
    return onSnapshot(collection(db, "offers"), (snap) => {
      setOffers(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((o) => o.active !== false)
      );
    });
  }, []);

  /* ===== LOAD MERCHANTS ===== */
  useEffect(() => {
    return onSnapshot(collection(db, "merchants"), (snap) => {
      const map = {};
      snap.forEach((d) => (map[d.id] = d.data()));
      setMerchantsMap(map);
    });
  }, []);

  /* ===== FILTER ===== */
  const nearbyOffers = useMemo(() => {
    if (!customerLoc) return [];

    return offers
      .map((o) => {
        const m = merchantsMap[o.merchantId];
        if (!m?.lat || !m?.lng) return null;
        if (category !== "All" && o.category !== category) return null;

        const d = distanceKm(
          customerLoc.lat,
          customerLoc.lng,
          m.lat,
          m.lng
        );
        if (d > radiusKm + GPS_BUFFER_KM) return null;

        return {
          ...o,
          merchant: m,
          distanceLabel:
            d < 1 ? `${Math.round(d * 1000)} m` : `${d.toFixed(2)} km`,
        };
      })
      .filter(Boolean);
  }, [offers, merchantsMap, customerLoc, radiusKm, category]);

  return (
    <Box sx={{ p: 2 }}>
      <Button variant="outlined" color="error" onClick={logout}>
        Logout
      </Button>

      <Typography variant="h6" sx={{ mt: 2 }}>
        Nearby Offers
      </Typography>

      {gpsAccuracy && (
        <Typography variant="caption">
          GPS accuracy ~{Math.round(gpsAccuracy)} m
        </Typography>
      )}

      {/* FILTERS */}
      <Box sx={{ display: "flex", gap: 2, my: 2 }}>
        <TextField
          select
          label="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <MenuItem value="All">All</MenuItem>
          {categories.map((c) => (
            <MenuItem key={c.id} value={c.name}>
              {c.name}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="Distance (km)"
          value={radiusKm}
          onChange={(e) => setRadiusKm(Number(e.target.value))}
        >
          {RADIUS_OPTIONS.map((r) => (
            <MenuItem key={r} value={r}>
              {r} km
            </MenuItem>
          ))}
        </TextField>
      </Box>

      {nearbyOffers.map((o) => (
        <Card key={o.id} sx={{ mb: 1 }} onClick={() => setSelectedOffer(o)}>
          <CardContent>
            <Typography>
              <strong>{o.merchant.shopName}</strong> — {o.title}
            </Typography>
            <Typography variant="body2">
              {o.category} • {o.distanceLabel}
            </Typography>
          </CardContent>
        </Card>
      ))}

      {/* OFFER DIALOG */}
      <Dialog open={Boolean(selectedOffer)} onClose={() => setSelectedOffer(null)}>
        {selectedOffer && (
          <>
            <DialogTitle>{selectedOffer.title}</DialogTitle>
            <DialogContent>
              <Typography>{selectedOffer.merchant.shopName}</Typography>
            </DialogContent>
            <DialogActions>
              <IconButton
                color="success"
                href={`https://wa.me/${selectedOffer.merchant.mobile}`}
                target="_blank"
              >
                <WhatsAppIcon />
              </IconButton>

              <IconButton
                color="primary"
                href={`tel:${selectedOffer.merchant.mobile}`}
              >
                <CallIcon />
              </IconButton>

              <IconButton
                color="secondary"
                href={`https://www.google.com/maps?q=${selectedOffer.merchant.lat},${selectedOffer.merchant.lng}`}
                target="_blank"
              >
                <DirectionsIcon />
              </IconButton>

              <Button onClick={() => setSelectedOffer(null)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
