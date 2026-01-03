import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  MenuItem,
} from "@mui/material";
import {
  collection,
  onSnapshot,
  query,
  where,
  doc,
  updateDoc,
} from "firebase/firestore";
import { getMessaging, getToken } from "firebase/messaging";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";

/* ======================
   DISTANCE (HAVERSINE)
====================== */
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

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const customerId = localStorage.getItem("oshiro_uid");

  /* ======================
     STATE
  ====================== */
  const [location, setLocation] = useState(null);
  const [offers, setOffers] = useState([]);
  const [nearbyOffers, setNearbyOffers] = useState([]);
  const [gpsError, setGpsError] = useState("");

  // 🔥 NEW: User preferences
  const [category, setCategory] = useState(
    localStorage.getItem("oshiro_category") || ""
  );
  const [radius, setRadius] = useState(
    Number(localStorage.getItem("oshiro_radius")) || 1000
  );

  /* ======================
     AUTH GUARD (SAFE)
  ====================== */
  useEffect(() => {
    if (
      localStorage.getItem("oshiro_role") !== "customer" ||
      !customerId
    ) {
      navigate("/login", { replace: true });
    }
  }, [navigate, customerId]);

  /* ======================
     SAVE FCM TOKEN
  ====================== */
  useEffect(() => {
    const saveFcmToken = async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

        const messaging = getMessaging();
        const token = await getToken(messaging, {
          vapidKey:
            "BEzJ7FJ2GYuDTL7DS2B4EACTBp_vX9M3rS-cV-0Va1df8ouzOD-8qwUuwn3eHtI609065jtuon9pWVUyBoY-0CU",
        });

        if (token) {
          await updateDoc(doc(db, "customers", customerId), {
            fcmToken: token,
            updatedAt: new Date(),
          });
        }
      } catch (err) {
        console.error("FCM error:", err);
      }
    };

    saveFcmToken();
  }, [customerId]);

  /* ======================
     GET GPS LOCATION
  ====================== */
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsError("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };

        setLocation(coords);

        await updateDoc(doc(db, "customers", customerId), {
          lastLat: coords.lat,
          lastLng: coords.lng,
          lastSeenAt: new Date(),
        });
      },
      () => setGpsError("GPS permission denied"),
      { enableHighAccuracy: true }
    );
  }, [customerId]);

  /* ======================
     LOAD ACTIVE OFFERS
  ====================== */
  useEffect(() => {
    const q = query(
      collection(db, "offers"),
      where("active", "==", true)
    );

    return onSnapshot(q, (snap) => {
      setOffers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, []);

  /* ======================
     FILTER OFFERS (CATEGORY + DISTANCE)
  ====================== */
  useEffect(() => {
    if (!location) return;

    const nearby = offers.filter((o) => {
      if (!o.lat || !o.lng) return false;

      const d = distanceMeters(
        location.lat,
        location.lng,
        o.lat,
        o.lng
      );

      if (d > radius) return false;
      if (category && o.category !== category) return false;

      return true;
    });

    setNearbyOffers(nearby);
  }, [location, offers, category, radius]);

  /* ======================
     LOGOUT
  ====================== */
  const logout = () => {
    localStorage.clear();
    navigate("/login", { replace: true });
  };

  /* ======================
     UI
  ====================== */
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4">Nearby Offers</Typography>

      <Button
        sx={{ mt: 2 }}
        variant="outlined"
        color="error"
        onClick={logout}
      >
        Logout
      </Button>

      {/* 🔍 CATEGORY + DISTANCE */}
      <Box sx={{ mt: 3, display: "flex", gap: 2, flexWrap: "wrap" }}>
        <TextField
          select
          label="Category"
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            localStorage.setItem(
              "oshiro_category",
              e.target.value
            );
          }}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="Food">Food</MenuItem>
          <MenuItem value="Fashion & Clothing">
            Fashion & Clothing
          </MenuItem>
          <MenuItem value="Beauty & Spa">
            Beauty & Spa
          </MenuItem>
          <MenuItem value="Hospitals">Hospitals</MenuItem>
          <MenuItem value="Medicals">Medicals</MenuItem>
          <MenuItem value="Education">Education</MenuItem>
          <MenuItem value="Services">Services</MenuItem>
        </TextField>

        <TextField
          select
          label="Distance"
          value={radius}
          onChange={(e) => {
            setRadius(Number(e.target.value));
            localStorage.setItem(
              "oshiro_radius",
              e.target.value
            );
          }}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value={300}>300 meters</MenuItem>
          <MenuItem value={500}>500 meters</MenuItem>
          <MenuItem value={1000}>1 km</MenuItem>
          <MenuItem value={3000}>3 km</MenuItem>
        </TextField>
      </Box>

      {!location && !gpsError && (
        <Typography sx={{ mt: 3 }}>
          📍 Detecting your location...
        </Typography>
      )}

      {gpsError && (
        <Typography sx={{ mt: 3 }} color="error">
          {gpsError}
        </Typography>
      )}

      {location && nearbyOffers.length === 0 && (
        <Typography sx={{ mt: 3 }}>
          No offers found for selected category & distance
        </Typography>
      )}

      <Box sx={{ mt: 3 }}>
        {nearbyOffers.map((o) => (
          <Card key={o.id} sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6">{o.title}</Typography>
              <Typography>{o.description}</Typography>
              <Typography sx={{ mt: 1 }} color="text.secondary">
                {o.shopName} • {o.category}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
}
