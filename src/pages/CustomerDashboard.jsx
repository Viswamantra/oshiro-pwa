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

const GPS_BUFFER_KM = 0.5; // 500m tolerance for mobile GPS

export default function CustomerDashboard() {
  const [offers, setOffers] = useState([]);
  const [merchantsMap, setMerchantsMap] = useState({});
  const [customerLoc, setCustomerLoc] = useState(null);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);

  const [radiusKm, setRadiusKm] = useState(1);
  const [category, setCategory] = useState("All"); // ✅ NEW

  /* =========================
     LIVE CUSTOMER GPS (MOBILE SAFE)
  ========================= */
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      alert("Location not supported on this device");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setCustomerLoc({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setGpsAccuracy(pos.coords.accuracy);
      },
      (err) => {
        console.warn("GPS error:", err.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  /* =========================
     FETCH OFFERS (NO GPS HERE)
  ========================= */
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "offers"), (snap) => {
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setOffers(list.filter((o) => o.active !== false));
    });
    return () => unsub();
  }, []);

  /* =========================
     FETCH MERCHANTS (GPS SOURCE)
  ========================= */
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "merchants"), (snap) => {
      const map = {};
      snap.forEach((d) => {
        map[d.id] = d.data();
      });
      setMerchantsMap(map);
    });
    return () => unsub();
  }, []);

  /* =========================
     MERCHANT-BASED DISTANCE
     + CATEGORY FILTER
     + MOBILE GPS BUFFER
  ========================= */
  const nearbyOffers = useMemo(() => {
    if (!customerLoc) return [];

    return offers
      .map((offer) => {
        const merchant = merchantsMap[offer.merchantId];
        if (!merchant?.lat || !merchant?.lng) return null;

        // ✅ CATEGORY FILTER
        if (category !== "All" && offer.category !== category) {
          return null;
        }

        const d = distanceKm(
          customerLoc.lat,
          customerLoc.lng,
          merchant.lat,
          merchant.lng
        );

        if (d > radiusKm + GPS_BUFFER_KM) return null;

        return {
          ...offer,
          shopName: merchant.shopName,
          distanceValue: d,
          distanceLabel:
            d < 1 ? `${Math.round(d * 1000)} m` : `${d.toFixed(2)} km`,
          merchantLat: merchant.lat,
          merchantLng: merchant.lng,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.distanceValue - b.distanceValue);
  }, [offers, merchantsMap, customerLoc, radiusKm, category]);

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Nearby Offers
      </Typography>

      {/* =========================
          GPS STATUS
      ========================= */}
      {!customerLoc && (
        <Typography color="text.secondary" sx={{ mb: 1 }}>
          📍 Locating you…
        </Typography>
      )}

      {gpsAccuracy && (
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
          GPS accuracy: ~{Math.round(gpsAccuracy)} meters
        </Typography>
      )}

      {/* =========================
          FILTER CONTROLS
      ========================= */}
      <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
        {/* CATEGORY SELECT */}
        <TextField
          select
          label="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          sx={{ width: 220 }}
        >
          <MenuItem value="All">All</MenuItem>
          <MenuItem value="Food">Food</MenuItem>
          <MenuItem value="Fashion & Clothing">Fashion & Clothing</MenuItem>
          <MenuItem value="Beauty & Spa">Beauty & Spa</MenuItem>
          <MenuItem value="Hospitals">Hospitals</MenuItem>
          <MenuItem value="Medical">Medical</MenuItem>
          <MenuItem value="Others">Others</MenuItem>
        </TextField>

        {/* RADIUS SELECT */}
        <TextField
          select
          label="Show offers within"
          value={radiusKm}
          onChange={(e) => setRadiusKm(Number(e.target.value))}
          sx={{ width: 220 }}
        >
          <MenuItem value={0.5}>500 meters</MenuItem>
          <MenuItem value={1}>1 km</MenuItem>
          <MenuItem value={2}>2 km</MenuItem>
          <MenuItem value={5}>5 km</MenuItem>
        </TextField>
      </Box>

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

          {/* Merchant markers */}
          {nearbyOffers.map((o) => (
            <Marker
              key={o.id}
              position={[o.merchantLat, o.merchantLng]}
            >
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

      {customerLoc && !nearbyOffers.length && (
        <Typography color="text.secondary">
          No offers found for selected filters.
        </Typography>
      )}
    </Box>
  );
}
