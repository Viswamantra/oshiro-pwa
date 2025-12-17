// src/pages/CustomerDashboard.jsx
import React, { useEffect, useState, useMemo } from "react";
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Card,
  CardContent,
} from "@mui/material";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

/* =========================
   DISTANCE (HAVERSINE)
   SAME LOGIC AS CLOUD FUNCTION
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

export default function CustomerDashboard() {
  const [offers, setOffers] = useState([]);
  const [customerLoc, setCustomerLoc] = useState(null);
  const [radiusKm, setRadiusKm] = useState(1);

  /* =========================
     GET LIVE CUSTOMER LOCATION
  ========================= */
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCustomerLoc({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => {
        alert("Please enable location to view nearby offers");
      },
      { enableHighAccuracy: true }
    );
  }, []);

  /* =========================
     FETCH OFFERS
  ========================= */
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "offers"), (snap) => {
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setOffers(list);
    });
    return () => unsub();
  }, []);

  /* =========================
     FILTER + CALCULATE DISTANCE
  ========================= */
  const nearbyOffers = useMemo(() => {
    if (!customerLoc) return [];

    return offers
      .map((offer) => {
        if (!offer.lat || !offer.lng) return null;

        const d = distanceKm(
          customerLoc.lat,
          customerLoc.lng,
          offer.lat,
          offer.lng
        );

        if (d > radiusKm) return null;

        return {
          ...offer,
          distanceValue: d,
          distanceLabel:
            d < 1 ? `${Math.round(d * 1000)} m` : `${d.toFixed(2)} km`,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.distanceValue - b.distanceValue);
  }, [offers, customerLoc, radiusKm]);

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Nearby Offers
      </Typography>

      {/* =========================
          RADIUS SELECTOR
      ========================= */}
      <TextField
        select
        label="Show offers within"
        value={radiusKm}
        onChange={(e) => setRadiusKm(Number(e.target.value))}
        sx={{ mb: 2, width: 220 }}
      >
        <MenuItem value={0.5}>500 meters</MenuItem>
        <MenuItem value={1}>1 km</MenuItem>
        <MenuItem value={2}>2 km</MenuItem>
        <MenuItem value={5}>5 km</MenuItem>
      </TextField>

      {/* =========================
          MAP VIEW
      ========================= */}
      {customerLoc && (
        <MapContainer
          center={[customerLoc.lat, customerLoc.lng]}
          zoom={14}
          style={{ height: 260, width: "100%", marginBottom: 16 }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          {/* Customer marker */}
          <Marker position={[customerLoc.lat, customerLoc.lng]}>
            <Popup>You are here</Popup>
          </Marker>

          {/* Offer markers */}
          {nearbyOffers.map((o) => (
            <Marker key={o.id} position={[o.lat, o.lng]}>
              <Popup>
                <strong>{o.shopName}</strong>
                <br />
                {o.title}
                <br />
                {o.distanceLabel} away
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      )}

      {/* =========================
          OFFER LIST
      ========================= */}
      {nearbyOffers.map((o) => (
        <Card key={o.id} sx={{ mb: 1 }}>
          <CardContent>
            <Typography variant="subtitle1">
              <strong>{o.shopName}</strong> — {o.title}
            </Typography>
            <Typography variant="body2">
              {o.category} • {o.discount}% • {o.distanceLabel} away
            </Typography>
          </CardContent>
        </Card>
      ))}

      {!nearbyOffers.length && (
        <Typography color="text.secondary">
          No offers within selected radius.
        </Typography>
      )}
    </Box>
  );
}
