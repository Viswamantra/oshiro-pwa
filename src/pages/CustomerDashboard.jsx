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
import { db } from "../../firebase"; // ✅ correct relative path

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
     CUSTOMER SESSION
  ====================== */
  const customerMobile = localStorage.getItem("customer_mobile");

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
    const loggedIn = localStorage.getItem("customer_logged_in");

    if (!loggedIn || !customerMobile) {
      navigate("/customer/login", { replace: true });
    }
  }, [navigate, customerMobile]);

  /* ======================
     SAVE FCM TOKEN (OPTIONAL)
  ====================== */
  useEffect(() => {
    if (!customerMobile) return;
    if (!("Notification" in window)) return;

    let messaging;
    try {
      messaging = getMessaging();
    } catch {
      return; // Firebase messaging not configured
    }

    Notification.requestPermission().then(async (permission) => {
      if (permission !== "granted") return;

      try {
        const token = await getToken(messaging, {
          vapidKey: "YOUR_VAPID_KEY_HERE",
        });

        if (!token) return;

        await setDoc(
          doc(db, "fcm_tokens", customerMobile),
          {
            token,
            updatedAt: serverTimestamp(),
            role: "customer",
          },
          { merge: true }
        );
      } catch (err) {
        console.warn("FCM skipped:", err.message);
      }
    });
  }, [customerMobile]);

  /* ======================
     LOAD OFFERS & CATEGORIES
  ====================== */
  useEffect(() => {
    if (!db) return;

    const unsubOffers = onSnapshot(
      query(collection(db, "offers"), where("active", "==", true)),
      (snapshot) => {
        setOffers(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      }
    );

    const unsubCats = onSnapshot(
      collection(db, "categories"),
      (snapshot) => {
        setCategories(snapshot.docs.map((d) => d.data().name));
      }
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

        try {
          await addDoc(collection(db, "geo_events"), {
            customerMobile,
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
  }, [location, offers, customerMobile]);

  /* ======================
     LOGOUT
  ====================== */
  const logout = () => {
    localStorage.removeItem("customer_logged_in");
    localStorage.removeItem("customer_mobile");
    navigate("/customer/login", { replace: true });
  };

  /* ======================
     UI
  ====================== */
  return (
    <Box p={3}>
      <Typography variant="h5">Nearby Offers</Typography>

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
