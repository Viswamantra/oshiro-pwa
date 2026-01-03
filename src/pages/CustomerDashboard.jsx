import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from "@mui/material";
import CallIcon from "@mui/icons-material/Call";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import NavigationIcon from "@mui/icons-material/Navigation";

import {
  collection,
  onSnapshot,
  query,
  where,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
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
  const customerMobile =
    JSON.parse(localStorage.getItem("oshiro_user") || "{}")
      ?.mobile || "";

  /* ======================
     STATE
  ====================== */
  const [location, setLocation] = useState(null);
  const [offers, setOffers] = useState([]);
  const [nearbyOffers, setNearbyOffers] = useState([]);
  const [gpsError, setGpsError] = useState("");

  const [category, setCategory] = useState(
    localStorage.getItem("oshiro_category") || ""
  );

  const [baseRadius, setBaseRadius] = useState(
    Number(localStorage.getItem("oshiro_radius")) || 300
  );

  const [effectiveRadius, setEffectiveRadius] =
    useState(baseRadius);

  const [selectedOffer, setSelectedOffer] = useState(null);

  // 🔒 Prevent duplicate click logs
  const clickedOfferRef = useRef(null);

  /* ======================
     AUTH GUARD
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
     GPS LOCATION
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
     LOAD OFFERS
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
     AUTO-EXPAND + SORT
  ====================== */
  useEffect(() => {
    if (!location) return;

    const radii = [baseRadius, 1000, 3000];

    for (let r of radii) {
      const results = offers
        .map((o) => {
          if (!o.lat || !o.lng) return null;

          const distance = distanceMeters(
            location.lat,
            location.lng,
            o.lat,
            o.lng
          );

          if (distance > r) return null;
          if (category && o.category !== category)
            return null;

          return { ...o, distance };
        })
        .filter(Boolean)
        .sort((a, b) => a.distance - b.distance);

      if (results.length > 0) {
        setNearbyOffers(results);
        setEffectiveRadius(r);
        return;
      }
    }

    setNearbyOffers([]);
    setEffectiveRadius(baseRadius);
  }, [location, offers, category, baseRadius]);

  /* ======================
     OFFER CLICK TRACKING
  ====================== */
  const trackOfferClick = async (offer) => {
    if (clickedOfferRef.current === offer.id) return;

    clickedOfferRef.current = offer.id;

    try {
      await addDoc(collection(db, "offerClicks"), {
        offerId: offer.id,
        offerTitle: offer.title,
        merchantId: offer.merchantId,
        merchantName: offer.shopName,
        customerId,
        customerMobile,
        clickedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Offer click log failed", err);
    }
  };

  /* ======================
     ACTION HANDLERS
  ====================== */
  const logout = () => {
    localStorage.clear();
    navigate("/login", { replace: true });
  };

  const openMaps = (lat, lng) => {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
      "_blank"
    );
  };

  const callMerchant = (mobile) => {
    window.location.href = `tel:${mobile}`;
  };

  const whatsappMerchant = (mobile) => {
    window.open(`https://wa.me/91${mobile}`, "_blank");
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

      {/* FILTERS */}
      <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
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
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="Food">Food</MenuItem>
          <MenuItem value="Beauty & Spa">Beauty & Spa</MenuItem>
          <MenuItem value="Fashion & Clothing">
            Fashion & Clothing
          </MenuItem>
        </TextField>

        <TextField
          select
          label="Distance"
          value={baseRadius}
          onChange={(e) => {
            const r = Number(e.target.value);
            setBaseRadius(r);
            localStorage.setItem("oshiro_radius", r);
          }}
        >
          <MenuItem value={300}>300 m</MenuItem>
          <MenuItem value={1000}>1 km</MenuItem>
          <MenuItem value={3000}>3 km</MenuItem>
        </TextField>
      </Box>

      {effectiveRadius !== baseRadius && (
        <Typography sx={{ mt: 2 }} color="text.secondary">
          Showing offers within{" "}
          {effectiveRadius >= 1000
            ? `${effectiveRadius / 1000} km`
            : `${effectiveRadius} m`}
        </Typography>
      )}

      {/* OFFERS */}
      <Box sx={{ mt: 3 }}>
        {nearbyOffers.map((o) => (
          <Card
            key={o.id}
            sx={{ mb: 2, cursor: "pointer" }}
            onClick={async () => {
              setSelectedOffer(o);
              await trackOfferClick(o);
            }}
          >
            <CardContent>
              <Typography variant="h6">{o.title}</Typography>
              <Typography>{o.description}</Typography>
              <Typography color="text.secondary">
                {o.shopName} • {o.category}
              </Typography>
              <Typography variant="caption" color="primary">
                📍 {Math.round(o.distance)} meters away
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* ACTION POPUP */}
      <Dialog
        open={!!selectedOffer}
        onClose={() => setSelectedOffer(null)}
      >
        {selectedOffer && (
          <>
            <DialogTitle>{selectedOffer.shopName}</DialogTitle>
            <DialogContent>
              <Typography variant="h6">
                {selectedOffer.title}
              </Typography>
              <Typography>{selectedOffer.description}</Typography>
              <Typography variant="caption">
                📍 {Math.round(selectedOffer.distance)} meters away
              </Typography>
            </DialogContent>

            <DialogActions sx={{ justifyContent: "space-around" }}>
              <IconButton
                color="success"
                onClick={() =>
                  whatsappMerchant(selectedOffer.mobile)
                }
              >
                <WhatsAppIcon />
              </IconButton>

              <IconButton
                color="primary"
                onClick={() =>
                  callMerchant(selectedOffer.mobile)
                }
              >
                <CallIcon />
              </IconButton>

              <IconButton
                color="secondary"
                onClick={() =>
                  openMaps(
                    selectedOffer.lat,
                    selectedOffer.lng
                  )
                }
              >
                <NavigationIcon />
              </IconButton>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
