import React, { useEffect, useState, useRef } from "react";
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
  addDoc,
  serverTimestamp,
  getDocs,
  doc,
  setDoc,
} from "firebase/firestore";
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

/* ======================
   CONFIG
====================== */
const AUTO_RADIUS_STEPS = [300, 1000, 4000, 5000, 10000];
const PROXIMITY_TRIGGER_METERS = 300;
const COOLDOWN_MINUTES = 30;

export default function CustomerDashboard() {
  const navigate = useNavigate();

  const customerMobile = JSON.parse(
    localStorage.getItem("oshiro_user") || "{}"
  ).mobile;

  /* ======================
     STATE
  ====================== */
  const [location, setLocation] = useState(null);
  const [offers, setOffers] = useState([]);
  const [nearbyOffers, setNearbyOffers] = useState([]);
  const [gpsError, setGpsError] = useState("");

  const [radius, setRadius] = useState(300);
  const [autoExpanded, setAutoExpanded] = useState(false);
  const [category, setCategory] = useState(
    localStorage.getItem("oshiro_category") || ""
  );

  const lastTriggeredRef = useRef({});

  /* ======================
     AUTH GUARD
  ====================== */
  useEffect(() => {
    if (localStorage.getItem("oshiro_role") !== "customer") {
      localStorage.clear();
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  /* ======================
     GET GPS LOCATION
  ====================== */
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsError("Geolocation not supported");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => setGpsError("GPS permission denied"),
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  /* ======================================================
     🔥🔥🔥 THIS IS THE MISSING TRIGGER (MOST IMPORTANT)
     THIS FIRES customerGeofenceWatcher FUNCTION
  ====================================================== */
  useEffect(() => {
    if (!location || !customerMobile) return;

    const writeCustomerLocation = async () => {
      await setDoc(
        doc(db, "customers", customerMobile), // 🔴 DOC ID = MOBILE
        {
          mobile: customerMobile,
          lat: location.lat,
          lng: location.lng,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      console.log("📍 Customer location updated", location);
    };

    writeCustomerLocation();
  }, [location, customerMobile]);

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
     FILTER + AUTO EXPAND
  ====================== */
  useEffect(() => {
    if (!location) return;

    let results = [];
    let usedRadius = radius;

    for (let r of AUTO_RADIUS_STEPS) {
      if (r < radius) continue;

      results = offers.filter((o) => {
        if (!o.lat || !o.lng) return false;

        const d = distanceMeters(
          location.lat,
          location.lng,
          o.lat,
          o.lng
        );

        const offerCategory = (o.category || "").toLowerCase();
        if (category && offerCategory !== category.toLowerCase())
          return false;

        return d <= r;
      });

      if (results.length > 0) {
        usedRadius = r;
        break;
      }
    }

    setNearbyOffers(
      results
        .map((o) => ({
          ...o,
          distance: distanceMeters(
            location.lat,
            location.lng,
            o.lat,
            o.lng
          ),
        }))
        .sort((a, b) => a.distance - b.distance)
    );

    setAutoExpanded(usedRadius !== radius);
    setRadius(usedRadius);
  }, [location, offers, category]);

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

      {gpsError && (
        <Typography color="error" sx={{ mt: 2 }}>
          {gpsError}
        </Typography>
      )}

      <Box sx={{ mt: 3 }}>
        {nearbyOffers.map((o) => (
          <Card key={o.id} sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6">{o.title}</Typography>
              <Typography>{o.description}</Typography>

              <Typography variant="caption" color="primary">
                📍 {Math.round(o.distance)} meters away
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
}
