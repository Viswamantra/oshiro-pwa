import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Divider,
} from "@mui/material";
import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";

/* =========================
   DISTANCE CALC (HAVERSINE)
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

const MAX_DISTANCE_KM = 2; // show offers within 2km

export default function CustomerDashboard() {
  const navigate = useNavigate();

  const role = localStorage.getItem("oshiro_role");
  const user = JSON.parse(localStorage.getItem("oshiro_user") || "{}");

  const [customerLoc, setCustomerLoc] = useState(null);
  const [offers, setOffers] = useState([]);
  const [nearbyOffers, setNearbyOffers] = useState([]);

  /* ======================
     🔐 ROLE GUARD
  ====================== */
  useEffect(() => {
    if (role !== "customer" || !user.mobile) {
      localStorage.clear();
      navigate("/login", { replace: true });
    }
  }, [role, user, navigate]);

  /* ======================
     GPS TRACKING
  ====================== */
  useEffect(() => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setCustomerLoc({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => alert("GPS permission denied"),
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(id);
  }, []);

  /* ======================
     LOAD ACTIVE OFFERS
  ====================== */
  useEffect(() => {
    const q = query(
      collection(db, "offers"),
      where("active", "==", true)
    );

    return onSnapshot(q, (snap) => {
      setOffers(
        snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }))
      );
    });
  }, []);

  /* ======================
     FILTER BY DISTANCE
  ====================== */
  useEffect(() => {
    if (!customerLoc) return;

    const filtered = offers
      .map((o) => {
        if (
          o.lat == null ||
          o.lng == null
        )
          return null;

        const d = distanceKm(
          customerLoc.lat,
          customerLoc.lng,
          o.lat,
          o.lng
        );

        if (d > MAX_DISTANCE_KM) return null;

        return {
          ...o,
          distanceLabel:
            d < 1
              ? `${Math.round(d * 1000)} m`
              : `${d.toFixed(2)} km`,
        };
      })
      .filter(Boolean);

    setNearbyOffers(filtered);
  }, [offers, customerLoc]);

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
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
      >
        <Typography variant="h4">
          Nearby Offers
        </Typography>

        <Button
          variant="outlined"
          color="error"
          onClick={logout}
        >
          Logout
        </Button>
      </Box>

      <Divider sx={{ my: 2 }} />

      {!customerLoc && (
        <Typography>
          📍 Waiting for GPS location…
        </Typography>
      )}

      {nearbyOffers.length === 0 && (
        <Typography color="text.secondary">
          No nearby offers found
        </Typography>
      )}

      {nearbyOffers.map((o) => (
        <Card key={o.id} sx={{ my: 1 }}>
          <CardContent>
            <Typography variant="h6">
              🏪 {o.shopName}
            </Typography>

            <Typography>
              🎁 {o.title}
            </Typography>

            {o.description && (
              <Typography variant="body2">
                {o.description}
              </Typography>
            )}

            <Typography variant="caption">
              📍 {o.distanceLabel} away
            </Typography>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}
