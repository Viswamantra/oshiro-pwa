import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "../auth/AuthContext";
import { db } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import { Box, Typography, TextField, MenuItem } from "@mui/material";

/* =========================
   CATEGORY DROPDOWN WITH ICONS
========================= */
const CATEGORY_LIST = [
  { value: "All", label: "All", icon: "🌍" },
  { value: "Food", label: "Food", icon: "🍔" },
  { value: "Fashion & Clothing", label: "Fashion & Clothing", icon: "👗" },
  { value: "Beauty & Spa", label: "Beauty & Spa", icon: "💅" },
  { value: "Hospitals", label: "Hospitals", icon: "🏥" },
  { value: "Medicals", label: "Medicals", icon: "💊" },
];

/* =========================
   FALLBACK CITY — KAKINADA
========================= */
const FALLBACK_CITY = {
  name: "Kakinada",
  lat: 16.989064,
  lng: 82.247467,
};

/* =========================
   LEAFLET ICON FIX
========================= */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

/* =========================
   DISTANCE CALC (CORRECT)
========================= */
function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

/* =========================
   LOCAL NOTIFICATION
========================= */
function showLocalNotification(offer) {
  if (!("Notification" in window)) return;

  const fire = () =>
    new Notification(`🔥 Offer Nearby at ${offer.shopName}`, {
      body: `${offer.title} — ${offer.discount}% off`,
    });

  if (Notification.permission === "granted") fire();
  else if (Notification.permission !== "denied") {
    Notification.requestPermission().then(
      (p) => p === "granted" && fire()
    );
  }
}

export default function CustomerDashboard() {
  const { user } = useAuth();

  const [offers, setOffers] = useState([]);
  const [category, setCategory] = useState("All");
  const [radius, setRadius] = useState(500); // meters
  const [search, setSearch] = useState("");

  /* =========================
     LIVE LOCATION
  ========================= */
  const [custLoc, setCustLoc] = useState(null);
  const [city] = useState(FALLBACK_CITY.name);

  const [notified, setNotified] = useState(new Set());

  /* =========================
     FIRESTORE — LIVE OFFERS
  ========================= */
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "offers"), (snap) =>
      setOffers(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return () => unsub();
  }, []);

  /* =========================
     REAL-TIME GPS TRACKING
  ========================= */
  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setCustLoc({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => {
        setCustLoc(FALLBACK_CITY);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 3000,
        timeout: 10000,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  /* =========================
     PROCESS OFFERS (FIXED)
  ========================= */
  const processed = useMemo(() => {
    return offers
      .map((o) => {
        if (o.lat == null || o.lng == null) return null;

        const dKm = haversineKm(
          custLoc.lat,
          custLoc.lng,
          Number(o.lat),
          Number(o.lng)
        );

        return {
          ...o,
          distanceKm: dKm,
          distanceMeters: dKm * 1000,
        };
      })
      .filter(Boolean);
  }, [offers, custLoc]);

  /* =========================
     FILTERING
  ========================= */
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();

    return processed
      .filter((o) => {
        if (category !== "All" && o.category !== category) return false;
        if (o.distanceMeters > radius) return false;
        if (q && !(`${o.shopName} ${o.title}`.toLowerCase().includes(q)))
          return false;
        return true;
      })
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [processed, category, radius, search]);

  /* =========================
     REAL-TIME GEOFENCE ALERTS
  ========================= */
  useEffect(() => {
    filtered.forEach((o) => {
      if (!notified.has(o.id)) {
        showLocalNotification(o);
        setNotified((prev) => new Set(prev).add(o.id));
      }
    });
  }, [filtered, notified]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5">Customer Dashboard</Typography>
      <Typography sx={{ mb: 2 }}>
        {user?.mobile} • 📍 <b>{city}</b>
      </Typography>

      {/* FILTER BAR */}
      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
        <TextField
          select
          label="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {CATEGORY_LIST.map((c) => (
            <MenuItem key={c.value} value={c.value}>
              <span style={{ marginRight: 8 }}>{c.icon}</span>
              {c.label}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <TextField
          label="Radius (m)"
          type="number"
          value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
        />
      </Box>

      {/* MAP */}
      <Box sx={{ height: 360 }}>
        <MapContainer
          center={[custLoc.lat, custLoc.lng]}
          zoom={14}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          <Marker position={[custLoc.lat, custLoc.lng]}>
            <Popup>You are here</Popup>
          </Marker>

          {filtered.map((o) => (
            <Marker key={o.id} position={[o.lat, o.lng]}>
              <Popup>
                <b>{o.shopName}</b>
                <div>{o.title}</div>
                <div>{o.discount}%</div>
              </Popup>
            </Marker>
          ))}

          <Circle
            center={[custLoc.lat, custLoc.lng]}
            radius={radius}
            pathOptions={{ color: "blue", fillOpacity: 0.1 }}
          />
        </MapContainer>
      </Box>

      {/* OFFER LIST */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="h6">Nearby Offers</Typography>

        {filtered.length === 0 && (
          <Typography>No offers found</Typography>
        )}

        {filtered.map((o) => (
          <Box
            key={o.id}
            sx={{
              p: 1.5,
              border: "1px solid #ddd",
              borderRadius: 1,
              mt: 1,
            }}
          >
            <Typography>
              <b>{o.shopName}</b> — {o.title}
            </Typography>
            <Typography>
              {o.category} • {o.discount}%
            </Typography>
            <Typography>{o.distanceKm.toFixed(2)} km away</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
