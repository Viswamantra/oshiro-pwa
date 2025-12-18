// src/pages/CustomerDashboard.jsx
import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Card,
  CardContent,
} from "@mui/material";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { collection, onSnapshot, doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../auth/AuthContext"; // 🔴 adjust path if needed

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

const GPS_BUFFER_KM = 0.5;           // UI tolerance
const LOCATION_WRITE_KM = 0.05;      // 50 meters write threshold

export default function CustomerDashboard() {
  const { user } = useAuth(); // 🔑 authenticated customer

  const [offers, setOffers] = useState([]);
  const [merchantsMap, setMerchantsMap] = useState({});
  const [customerLoc, setCustomerLoc] = useState(null);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);

  const [radiusKm, setRadiusKm] = useState(1);
  const [category, setCategory] = useState("All");

  const lastWrittenLoc = useRef(null);

  /* =========================
     LIVE CUSTOMER GPS
     + FIRESTORE LOCATION WRITE
  ========================= */
  useEffect(() => {
    if (!("geolocation" in navigator)) return;

    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        setCustomerLoc({ lat, lng });
        setGpsAccuracy(pos.coords.accuracy);

        // 🔔 WRITE LOCATION ONLY IF MOVED SIGNIFICANTLY
        if (user?.uid) {
          if (lastWrittenLoc.current) {
            const moved = distanceKm(
              lastWrittenLoc.current.lat,
              lastWrittenLoc.current.lng,
              lat,
              lng
            );
            if (moved < LOCATION_WRITE_KM) return;
          }

          lastWrittenLoc.current = { lat, lng };

          await setDoc(
            doc(db, "users", user.uid),
            {
              lat,
              lng,
              updatedAt: Date.now(),
            },
            { merge: true }
          );
        }
      },
      (err) => console.warn("GPS error:", err.message),
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [user]);

  /* =========================
     FETCH OFFERS
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

        if (category !== "All" && offer.category !== category) return null;

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
      <Typography variant="h6">Nearby Offers</Typography>

      {!customerLoc && (
        <Typography sx={{ mb: 1 }}>📍 Locating you…</Typography>
      )}

      {gpsAccuracy && (
        <Typography variant="caption">
          GPS accuracy ~{Math.round(gpsAccuracy)} m
        </Typography>
      )}

      {/* FILTER CONTROLS */}
      <Box sx={{ display: "flex", gap: 2, my: 2, flexWrap: "wrap" }}>
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

      {/* MAP */}
      {customerLoc && (
        <MapContainer
          center={[customerLoc.lat, customerLoc.lng]}
          zoom={14}
          style={{ height: 260, marginBottom: 16 }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          <Marker position={[customerLoc.lat, customerLoc.lng]}>
            <Popup>You are here</Popup>
          </Marker>

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

      {/* OFFER LIST */}
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
        <Typography>No offers found for selected filters.</Typography>
      )}
    </Box>
  );
}
