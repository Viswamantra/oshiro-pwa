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
import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase";

/* =========================
   DISTANCE (HAVERSINE)
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

const GPS_BUFFER_KM = 0.5;
const RADIUS_STEPS = [1, 2, 3, 5];

export default function CustomerDashboard() {
  const stored = JSON.parse(localStorage.getItem("oshiro_user") || "{}");

  const [offers, setOffers] = useState([]);
  const [merchantsMap, setMerchantsMap] = useState({});
  const [categories, setCategories] = useState([]);

  const [customerLoc, setCustomerLoc] = useState(null);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);

  const [radiusKm, setRadiusKm] = useState(1);
  const [category, setCategory] = useState("All");

  const [selectedOffer, setSelectedOffer] = useState(null);
  const lastWrittenLoc = useRef(null);

  /* =========================
     LIVE GPS
  ========================= */
  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setCustomerLoc({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setGpsAccuracy(pos.coords.accuracy);
      },
      () => {},
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  /* =========================
     LOAD CATEGORIES
  ========================= */
  useEffect(() => {
    const q = query(
      collection(db, "categories"),
      where("status", "==", "active")
    );

    return onSnapshot(q, (snap) => {
      setCategories(
        snap.docs.map((d) => ({
          id: d.id,
          name: d.data().name,
        }))
      );
    });
  }, []);

  /* =========================
     LOAD OFFERS
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

  /* =========================
     LOAD MERCHANTS
  ========================= */
  useEffect(() => {
    return onSnapshot(collection(db, "merchants"), (snap) => {
      const map = {};
      snap.forEach((d) => (map[d.id] = d.data()));
      setMerchantsMap(map);
    });
  }, []);

  /* =========================
     FILTER OFFERS
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
      .filter(Boolean);
  }, [offers, merchantsMap, customerLoc, radiusKm, category]);

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6">Nearby Offers</Typography>

      {gpsAccuracy && (
        <Typography variant="caption">
          GPS accuracy ~{Math.round(gpsAccuracy)} m
        </Typography>
      )}

      {nearbyOffers.map((o) => (
        <Card
          key={o.id}
          sx={{ mb: 1 }}
          onClick={() => setSelectedOffer(o)}
        >
          <CardContent>
            <Typography>
              <strong>{o.merchant.shopName}</strong> — {o.title}
            </Typography>
            <Typography variant="body2">
              {o.category} • {o.distanceLabel}
            </Typography>
          </CardContent>
        </Card>
      ))}

      <Dialog
        open={Boolean(selectedOffer)}
        onClose={() => setSelectedOffer(null)}
      >
        {selectedOffer && (
          <>
            <DialogTitle>{selectedOffer.title}</DialogTitle>
            <DialogContent>
              <Typography>
                {selectedOffer.merchant.shopName}
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedOffer(null)}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
