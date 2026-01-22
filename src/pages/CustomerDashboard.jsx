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
  doc,
  setDoc,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { getMessaging, getToken } from "firebase/messaging";
import { db } from "../../firebase";

/* ======================
   DISTANCE HELPER
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
  const customerMobile = localStorage.getItem("customer_mobile");

  /* ======================
     STATE
  ====================== */
  const [offers, setOffers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState(null);
  const [trackingEnabled, setTrackingEnabled] = useState(false);

  const triggeredRef = useRef({});
  const watchIdRef = useRef(null);

  /* ======================
     AUTH GUARD
  ====================== */
  useEffect(() => {
    if (!localStorage.getItem("customer_logged_in") || !customerMobile) {
      navigate("/customer/login", { replace: true });
    }
  }, [navigate, customerMobile]);

  /* ======================
     SAVE CUSTOMER FCM TOKEN (OPTIONAL)
  ====================== */
  useEffect(() => {
    if (!customerMobile || !("Notification" in window)) return;

    Notification.requestPermission().then(async (permission) => {
      if (permission !== "granted") return;

      try {
        const messaging = getMessaging();
        const token = await getToken(messaging, {
          vapidKey: "BLQz2BIY-XXDRG0euqFN0YSxRv0v_flyYEPsZUFQc3AxOz693IuHUrdz48A7z6EPTyffkr42ND3gB0mDUm4XroM",
        });

        if (!token) return;

        await setDoc(
          doc(db, "fcm_tokens", customerMobile),
          {
            token,
            role: "customer",
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch {
        // silently skip
      }
    });
  }, [customerMobile]);

  /* ======================
     LOAD OFFERS & CATEGORIES
  ====================== */
  useEffect(() => {
    const unsubOffers = onSnapshot(
      query(collection(db, "offers"), where("active", "==", true)),
      (snap) =>
        setOffers(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    const unsubCats = onSnapshot(collection(db, "categories"), (snap) =>
      setCategories(snap.docs.map((d) => d.data().name))
    );

    return () => {
      unsubOffers();
      unsubCats();
    };
  }, []);

  /* ======================
     START LOCATION TRACKING (USER GESTURE)
  ====================== */
  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }

    if (watchIdRef.current !== null) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => {
        console.error("Location error:", err);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 15000,
      }
    );

    setTrackingEnabled(true);
  };

  /* ======================
     STOP TRACKING (OPTIONAL)
  ====================== */
  const stopLocationTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setTrackingEnabled(false);
  };

  /* ======================
     GEO-FENCE TRIGGER
  ====================== */
  useEffect(() => {
    if (!location || !customerMobile) return;

    offers.forEach(async (o) => {
      if (!o.lat || !o.lng || !o.merchantId) return;

      const key = `${o.merchantId}_${customerMobile}`;
      if (triggeredRef.current[key]) return;

      const d = distanceMeters(
        location.lat,
        location.lng,
        o.lat,
        o.lng
      );

      if (d <= GEOFENCE_RADIUS_METERS) {
        triggeredRef.current[key] = true;

        await addDoc(collection(db, "geo_events"), {
          customerMobile,
          merchantId: o.merchantId,
          distanceMeters: Math.round(d),
          status: "entered",
          createdAt: serverTimestamp(),
        });
      }
    });
  }, [location, offers, customerMobile]);

  /* ======================
     LOGOUT
  ====================== */
  const logout = () => {
    stopLocationTracking();
    localStorage.clear();
    navigate("/customer/login", { replace: true });
  };

  /* ======================
     UI
  ====================== */
  return (
    <Box p={3}>
      <Typography variant="h5">Nearby Offers</Typography>

      {/* 📍 LOCATION CTA */}
      {!trackingEnabled ? (
        <Button
          sx={{ mt: 2 }}
          variant="contained"
          onClick={startLocationTracking}
        >
          Enable Location Tracking
        </Button>
      ) : (
        <Button sx={{ mt: 2 }} color="success" variant="outlined">
          Location Tracking Active
        </Button>
      )}

      <Button
        sx={{ mt: 2, ml: 2 }}
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
        sx={{ mt: 3, minWidth: 220 }}
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
          .filter((o) => (category ? o.category === category : true))
          .map((o) => (
            <Card key={o.id} sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6">{o.title}</Typography>
                <Typography>{o.description}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {o.category}
                </Typography>
              </CardContent>
            </Card>
          ))}

        {offers.length === 0 && (
          <Typography color="text.secondary">
            No active offers available
          </Typography>
        )}
      </Box>
    </Box>
  );
}
