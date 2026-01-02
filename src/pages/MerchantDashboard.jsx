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
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";

export default function MerchantDashboard() {
  const navigate = useNavigate();

  /* ======================
     AUTH + ROLE GUARD
  ====================== */
  const role = localStorage.getItem("oshiro_role");
  const user = JSON.parse(localStorage.getItem("oshiro_user") || "{}");
  const merchantMobile = user.mobile;

  useEffect(() => {
    if (role !== "merchant" || !merchantMobile) {
      localStorage.clear();
      navigate("/login", { replace: true });
    }
  }, [role, merchantMobile, navigate]);

  /* ======================
     STATE
  ====================== */
  const [merchant, setMerchant] = useState(null);
  const [offers, setOffers] = useState([]);
  const [geoEvents, setGeoEvents] = useState([]);

  /* ======================
     LOAD MERCHANT PROFILE
  ====================== */
  useEffect(() => {
    if (!merchantMobile) return;

    const q = query(
      collection(db, "merchants"),
      where("mobile", "==", merchantMobile)
    );

    return onSnapshot(q, (snap) => {
      if (snap.empty) {
        alert("Merchant not found");
        localStorage.clear();
        navigate("/login", { replace: true });
        return;
      }

      const m = snap.docs[0].data();

      if (m.status !== "approved") {
        alert("Merchant not approved yet");
        localStorage.clear();
        navigate("/login", { replace: true });
        return;
      }

      setMerchant(m);
    });
  }, [merchantMobile, navigate]);

  /* ======================
     LOAD OFFERS (ADMIN CREATED)
  ====================== */
  useEffect(() => {
    if (!merchantMobile) return;

    const q = query(
      collection(db, "offers"),
      where("merchantMobile", "==", merchantMobile),
      where("active", "==", true)
    );

    return onSnapshot(q, (snap) => {
      setOffers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [merchantMobile]);

  /* ======================
     LOAD GEO EVENTS
  ====================== */
  useEffect(() => {
    if (!merchantMobile) return;

    const q = query(
      collection(db, "geo_events"),
      where("merchantMobile", "==", merchantMobile)
    );

    return onSnapshot(q, (snap) => {
      setGeoEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [merchantMobile]);

  /* ======================
     LOGOUT
  ====================== */
  const logout = () => {
    localStorage.clear();
    navigate("/login", { replace: true });
  };

  if (!merchant) return null;

  /* ======================
     UI
  ====================== */
  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h5">
          🏪 {merchant.shopName}
        </Typography>
        <Button variant="outlined" color="error" onClick={logout}>
          Logout
        </Button>
      </Box>

      <Typography variant="body2" color="text.secondary">
        Category: {merchant.category}
      </Typography>

      <Typography variant="body2" sx={{ mt: 1 }}>
        📍 Location: {merchant.lat}, {merchant.lng}
      </Typography>

      <Divider sx={{ my: 3 }} />

      {/* ======================
         OFFERS
      ====================== */}
      <Typography variant="h6">📢 Active Offers</Typography>

      {offers.length === 0 && (
        <Typography color="text.secondary">
          No active offers
        </Typography>
      )}

      {offers.map(o => (
        <Card key={o.id} sx={{ my: 1 }}>
          <CardContent>
            <Typography>{o.message}</Typography>
            {o.expiresAt?.toDate && (
              <Typography variant="caption" color="error">
                ⏰ Expires at{" "}
                {o.expiresAt.toDate().toLocaleTimeString("en-IN")}
              </Typography>
            )}
          </CardContent>
        </Card>
      ))}

      <Divider sx={{ my: 3 }} />

      {/* ======================
         GEO EVENTS
      ====================== */}
      <Typography variant="h6">👣 Nearby Customers</Typography>

      {geoEvents.length === 0 && (
        <Typography color="text.secondary">
          No nearby customers yet
        </Typography>
      )}

      {geoEvents.map(e => (
        <Card key={e.id} sx={{ my: 1 }}>
          <CardContent>
            <Typography>
              Customer nearby — {e.distanceMeters} meters
            </Typography>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}
