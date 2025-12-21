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
import { collection, onSnapshot, doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../auth/AuthContext";

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
const LOCATION_WRITE_KM = 0.05;
const RADIUS_STEPS = [1, 2, 3, 5];

/* =========================
   WHATSAPP HELPER
========================= */
function openWhatsApp(merchant, offer) {
  if (!merchant?.contactPhone) {
    alert("WhatsApp number not available");
    return;
  }

  const phone = merchant.contactPhone.replace(/\D/g, "");
  const message = encodeURIComponent(
    `Hi, I saw your offer "${offer.title}" on OshirO. Please share more details.`
  );

  window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
}

export default function CustomerDashboard() {
  const { user } = useAuth();

  const [offers, setOffers] = useState([]);
  const [merchantsMap, setMerchantsMap] = useState({});
  const [customerLoc, setCustomerLoc] = useState(null);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);

  const [radiusKm, setRadiusKm] = useState(1);
  const [category, setCategory] = useState("All");

  const [selectedOffer, setSelectedOffer] = useState(null);
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
     FETCH OFFERS
  ========================= */
  useEffect(() => {
    return onSnapshot(collection(db, "offers"), (snap) => {
      setOffers(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((o) => o.active !== false && o.category)
      );
    });
  }, []);

  /* =========================
     FETCH MERCHANTS
  ========================= */
  useEffect(() => {
    return onSnapshot(collection(db, "merchants"), (snap) => {
      const map = {};
      snap.forEach((d) => (map[d.id] = d.data()));
      setMerchantsMap(map);
    });
  }, []);

  /* =========================
     DERIVED CATEGORIES
  ========================= */
  const derivedCategories = useMemo(() => {
    const set = new Set();
    offers.forEach((o) => o.category && set.add(o.category));
    return Array.from(set);
  }, [offers]);

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
          distanceValue: d,
          distanceLabel:
            d < 1 ? `${Math.round(d * 1000)} m` : `${d.toFixed(2)} km`,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.distanceValue - b.distanceValue);
  }, [offers, merchantsMap, customerLoc, radiusKm, category]);

  /* =========================
     AUTO-EXPAND RADIUS
  ========================= */
  useEffect(() => {
    if (!customerLoc || nearbyOffers.length) return;
    const idx = RADIUS_STEPS.indexOf(radiusKm);
    if (RADIUS_STEPS[idx + 1]) setRadiusKm(RADIUS_STEPS[idx + 1]);
  }, [nearbyOffers, customerLoc]);

  /* =========================
     ICON HELPER
  ========================= */
  const getCategoryIcon = (cat) => {
    if (/food/i.test(cat)) return "🍔";
    if (/fashion/i.test(cat)) return "👗";
    if (/beauty/i.test(cat)) return "💅";
    if (/medical/i.test(cat)) return "💊";
    if (/hospital/i.test(cat)) return "🏥";
    return "🏷️";
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6">Nearby Offers</Typography>

      {gpsAccuracy && (
        <Typography variant="caption" color="text.secondary">
          GPS accuracy ~{Math.round(gpsAccuracy)} m
        </Typography>
      )}

      {/* FILTERS */}
      <Box sx={{ display: "flex", gap: 2, my: 2, flexWrap: "wrap" }}>
        <TextField select label="Category" value={category}
          onChange={(e) => setCategory(e.target.value)} sx={{ width: 220 }}>
          <MenuItem value="All">All</MenuItem>
          {derivedCategories.map((cat) => (
            <MenuItem key={cat} value={cat}>
              {getCategoryIcon(cat)} {cat}
            </MenuItem>
          ))}
        </TextField>

        <TextField select label="Show offers within" value={radiusKm}
          onChange={(e) => setRadiusKm(Number(e.target.value))} sx={{ width: 220 }}>
          <MenuItem value={1}>1 km</MenuItem>
          <MenuItem value={2}>2 km</MenuItem>
          <MenuItem value={3}>3 km</MenuItem>
          <MenuItem value={5}>5 km</MenuItem>
        </TextField>
      </Box>

      {/* OFFER LIST */}
      {nearbyOffers.map((o) => (
        <Card key={o.id} sx={{ mb: 1, cursor: "pointer" }}
          onClick={() => setSelectedOffer(o)}>
          <CardContent>
            <Typography variant="subtitle1">
              <strong>{o.merchant.shopName}</strong> — {o.title}
            </Typography>
            <Typography variant="body2">
              {getCategoryIcon(o.category)} {o.category} • {o.discount}% • {o.distanceLabel}
            </Typography>
          </CardContent>
        </Card>
      ))}

      {/* OFFER DETAILS */}
      <Dialog open={Boolean(selectedOffer)}
        onClose={() => setSelectedOffer(null)} fullWidth>
        {selectedOffer && (
          <>
            <DialogTitle>{selectedOffer.title}</DialogTitle>
            <DialogContent dividers>
              <Typography><strong>Merchant:</strong> {selectedOffer.merchant.shopName}</Typography>
              <Typography sx={{ mt: 1 }}><strong>Category:</strong> {selectedOffer.category}</Typography>
              <Typography sx={{ mt: 1 }}><strong>Discount:</strong> {selectedOffer.discount}%</Typography>
              <Typography sx={{ mt: 1 }}><strong>Distance:</strong> {selectedOffer.distanceLabel}</Typography>
              <Typography sx={{ mt: 1 }}><strong>Address:</strong> {selectedOffer.merchant.addressCombined || "N/A"}</Typography>
              {selectedOffer.merchant.contactPhone && (
                <Typography sx={{ mt: 1 }}>
                  <strong>Contact:</strong> {selectedOffer.merchant.contactPhone}
                </Typography>
              )}
            </DialogContent>

            <DialogActions>
              {selectedOffer.merchant.contactPhone && (
                <Button color="success"
                  onClick={() => window.open(`tel:${selectedOffer.merchant.contactPhone}`)}>
                  📞 Call
                </Button>
              )}

              {selectedOffer.merchant.contactPhone && (
                <Button color="success" variant="outlined"
                  onClick={() => openWhatsApp(selectedOffer.merchant, selectedOffer)}>
                  💬 WhatsApp
                </Button>
              )}

              <Button onClick={() => {
                const { lat, lng } = selectedOffer.merchant;
                window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, "_blank");
              }}>
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
