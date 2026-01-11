import React, { useEffect, useRef, useState } from "react";
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
} from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";

/* ======================
   DISTANCE HELPER (HAVERSINE)
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

const GEOFENCE_RADIUS_METERS = 300;

export default function CustomerDashboard() {
  const navigate = useNavigate();

  /* ======================
     AUTH USER
  ====================== */
  const user = JSON.parse(
    localStorage.getItem("oshiro_user") || "{}"
  );

  /* ======================
     STATE
  ====================== */
  const [offers, setOffers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState(null);
  const triggeredRef = useRef({}); // prevent repeat triggers

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
     LOAD OFFERS + CATEGORIES
  ====================== */
  useEffect(() => {
    const unsubOffers = onSnapshot(
      query(collection(db, "offers"), where("active", "==", true)),
      (s) =>
        setOffers(s.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    const unsubCats = onSnapshot(
      collection(db, "categories"),
      (s) => setCategories(s.docs.map((d) => d.data().name))
    );

    return () => {
      unsubOffers();
      unsubCats();
    };
  }, []);

  /* ======================
     GPS TRACKING
  ====================== */
  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => {},
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  /* ======================
     GEO-FENCE TRIGGER
  ====================== */
  useEffect(() => {
    if (!location || !user.mobile) return;

    offers.forEach(async (o) => {
      if (!o.lat || !o.lng || !o.merchantId) return;

      const key = `${o.merchantId}_${user.mobile}`;
      if (triggeredRef.current[key]) return;

      const d = distanceMeters(
        location.lat,
        location.lng,
        o.lat,
        o.lng
      );

      if (d <= GEOFENCE_RADIUS_METERS) {
        triggeredRef.current[key] = true;

        try {
          await addDoc(collection(db, "geo_events"), {
            customerMobile: user.mobile,
            merchantId: o.merchantId,
            merchantMobile: o.merchantMobile || "",
            distanceMeters: Math.round(d),
            status: "entered",
            createdAt: serverTimestamp(),
          });
        } catch (e) {
          console.error("Geo event failed", e);
        }
      }
    });
  }, [location, offers, user.mobile]);

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
    <Box p={3}>
      <Typography variant="h4">
        Customer Dashboard
      </Typography>

      <Button
        sx={{ mt: 1 }}
        color="error"
        variant="outlined"
        onClick={logout}
      >
        Logout
      </Button>

      <TextField
        select
        label="Category"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        sx={{ mt: 3, minWidth: 200 }}
      >
        <MenuItem value="">All</MenuItem>
        {categories.map((c) => (
          <MenuItem key={c} value={c}>
            {c}
          </MenuItem>
        ))}
      </TextField>

      <Box mt={3}>
        {offers
          .filter((o) =>
            category ? o.category === category : true
          )
          .map((o) => (
            <Card key={o.id} sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6">
                  {o.title}
                </Typography>
                <Typography>
                  {o.description}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  {o.category}
                </Typography>
              </CardContent>
            </Card>
          ))}
      </Box>
    </Box>
  );
}
