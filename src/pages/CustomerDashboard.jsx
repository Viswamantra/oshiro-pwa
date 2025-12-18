// src/pages/CustomerDashboard.jsx
import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { collection, onSnapshot, doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../auth/AuthContext";

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

const GPS_BUFFER_KM = 0.5;
const LOCATION_WRITE_KM = 0.05;

export default function CustomerDashboard() {
  const { user } = useAuth();

  const [offers, setOffers] = useState([]);
  const [merchantsMap, setMerchantsMap] = useState({});
  const [customerLoc, setCustomerLoc] = useState(null);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);

  const [radiusKm, setRadiusKm] = useState(1);
  const [category, setCategory] = useState("All");

  const [selectedOffer, setSelectedOffer] = useState(null); // 🆕
  const lastWrittenLoc = useRef(null);

  /* =========================
     LIVE GPS + FIRESTORE WRITE
  ========================= */
  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        setCustomerLoc({ lat, lng });
        setGpsAccuracy(pos.coords.accuracy);

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
            { lat, lng, updatedAt: Date.now() },
            { merge: true }
          );
        }
      },
      () => {},
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [user]);

  /* =========================
     FETCH DATA
  ========================= */
  useEffect(() => {
    return onSnapshot(collection(db, "offers"), (snap) => {
      setOffers(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((o) => o.active !== false)
      );
    });
  }, []);

  useEffect(() => {
    return onSnapshot(collection(db, "merchants"), (snap) => {
      const map = {};
      snap.forEach((d) => (map[d.id] = d.data()));
      setMerchantsMap(map);
    });
  }, []);

  /* =========================
     FILTER + DISTANCE
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
          merchant,
          distanceLabel:
            d < 1 ? `${Math.round(d * 1000)} m` : `${d.toFixed(2)} km`,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.distanceValue - b.distanceValue);
  }, [offers, merchantsMap, customerLoc, radiusKm, category]);

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6">Nearby Offers</Typography>

      {/* OFFER LIST */}
      {nearbyOffers.map((o) => (
        <Card
          key={o.id}
          sx={{ mb: 1, cursor: "pointer" }}
          onClick={() => setSelectedOffer(o)}
        >
          <CardContent>
            <Typography variant="subtitle1">
              <strong>{o.merchant.shopName}</strong> — {o.title}
            </Typography>
            <Typography variant="body2">
              {o.category} • {o.discount}% • {o.distanceLabel} away
            </Typography>
          </CardContent>
        </Card>
      ))}

      {/* =========================
          OFFER DETAIL DIALOG
      ========================= */}
      <Dialog
        open={Boolean(selectedOffer)}
        onClose={() => setSelectedOffer(null)}
        fullWidth
      >
        {selectedOffer && (
          <>
            <DialogTitle>{selectedOffer.title}</DialogTitle>
            <DialogContent dividers>
              <Typography>
                <strong>Merchant:</strong>{" "}
                {selectedOffer.merchant.shopName}
              </Typography>
              <Typography sx={{ mt: 1 }}>
                <strong>Category:</strong> {selectedOffer.category}
              </Typography>
              <Typography sx={{ mt: 1 }}>
                <strong>Discount:</strong> {selectedOffer.discount}%
              </Typography>
              <Typography sx={{ mt: 1 }}>
                <strong>Distance:</strong>{" "}
                {selectedOffer.distanceLabel}
              </Typography>
              <Typography sx={{ mt: 1 }}>
                <strong>Address:</strong>{" "}
                {selectedOffer.merchant.addressCombined || "N/A"}
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => {
                  const { lat, lng } = selectedOffer.merchant;
                  window.open(
                    `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
                    "_blank"
                  );
                }}
              >
                Navigate
              </Button>
              <Button onClick={() => setSelectedOffer(null)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
