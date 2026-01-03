import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
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

  /* ======================
     AUTH INFO
  ====================== */
  const customerId = localStorage.getItem("oshiro_uid");

  /* ======================
     STATE
  ====================== */
  const [location, setLocation] = useState(null);
  const [offers, setOffers] = useState([]);
  const [nearbyOffers, setNearbyOffers] = useState([]);
  const [gpsError, setGpsError] = useState("");

  /* ======================
     AUTH GUARD
  ====================== */
  useEffect(() => {
    if (
      localStorage.getItem("oshiro_role") !== "customer" ||
      !customerId
    ) {
      localStorage.clear();
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
          vapidKey: "6J9HA-kiDFVNQD4raJhMSuAI9afWE34DUDRhodaOvE8",
        });

        if (token) {
          await updateDoc(doc(db, "customers", customerId), {
            fcmToken: token,
            updatedAt: new Date(),
          });
          console.log("✅ FCM token saved");
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

        // 🔥 Save last known location (VERY IMPORTANT)
        await updateDoc(doc(db, "customers", customerId), {
          lastLat: coords.lat,
          lastLng: coords.lng,
          lastSeenAt: new Date(),
        });
      },
      () => {
        setGpsError("GPS permission denied");
      },
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
     FILTER NEARBY OFFERS
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

      return d <= 300; // 🔥 300 meters
    });

    setNearbyOffers(nearby);
  }, [location, offers]);

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

      {!location && !gpsError && (
        <Typography sx={{ mt: 2 }}>
          📍 Detecting your location...
        </Typography>
      )}

      {gpsError && (
        <Typography sx={{ mt: 2 }} color="error">
          {gpsError}
        </Typography>
      )}

      {location && nearbyOffers.length === 0 && (
        <Typography sx={{ mt: 2 }}>
          No nearby offers found
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
