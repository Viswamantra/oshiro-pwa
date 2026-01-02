import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Button,
  Card,
  CardContent,
  Chip,
} from "@mui/material";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";

/* 🔔 FCM */
import { getMessaging, getToken } from "firebase/messaging";

const VAPID_KEY =
  "BEzJ7FJ2GYuDTL7DS2B4EACTBp_vX9M3rS-cV-0Va1df8ouzOD-8qwUuwn3eHtI609065jtuon9pWVUyBoY-0CU";

const CATEGORIES = [
  "Food",
  "Home Kitchen",
  "Fashion & Clothing",
  "Beauty & Spa",
  "Hospitals",
  "Medicals",
];

export default function MerchantDashboard() {
  const navigate = useNavigate();

  /* 🔐 ROLE GUARD (CRITICAL) */
  const role = localStorage.getItem("oshiro_role");
  if (role !== "merchant") {
    navigate("/login", { replace: true });
    return null;
  }

  const stored = JSON.parse(localStorage.getItem("oshiro_user") || "{}");
  const mobile = stored.mobile;

  const [merchant, setMerchant] = useState(null);
  const [error, setError] = useState("");

  /* ================= LOAD MERCHANT ================= */
  useEffect(() => {
    if (!mobile) {
      setError("Mobile not found. Please login again.");
      return;
    }

    const q = query(
      collection(db, "merchants"),
      where("mobile", "==", mobile)
    );

    const unsub = onSnapshot(q, (snap) => {
      if (snap.empty) {
        setError(
          "❌ Merchant profile not found.\nPlease register as Merchant."
        );
        setMerchant(null);
        return;
      }

      const docSnap = snap.docs[0];
      setMerchant({ id: docSnap.id, ...docSnap.data() });
    });

    return () => unsub();
  }, [mobile]);

  /* ================= REGISTER FCM ================= */
  useEffect(() => {
    if (!merchant?.id) return;

    const registerPush = async () => {
      try {
        if (!("Notification" in window)) return;

        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

        const messaging = getMessaging();
        const token = await getToken(messaging, { vapidKey: VAPID_KEY });

        if (token) {
          await updateDoc(doc(db, "merchants", merchant.id), {
            fcmToken: token,
          });
        }
      } catch (e) {
        console.error("FCM error:", e);
      }
    };

    registerPush();
  }, [merchant?.id]);

  /* ================= UPDATE FIELD ================= */
  const updateField = async (field, value) => {
    if (!merchant?.id) return;

    await updateDoc(doc(db, "merchants", merchant.id), {
      [field]: value,
    });

    setMerchant((m) => ({ ...m, [field]: value }));
  };

  /* ================= UI STATES ================= */
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error" whiteSpace="pre-line">
          {error}
        </Typography>
        <Button sx={{ mt: 2 }} onClick={() => navigate("/login")}>
          Go to Login
        </Button>
      </Box>
    );
  }

  if (!merchant) {
    return <Typography sx={{ p: 3 }}>Loading merchant...</Typography>;
  }

  const isHomeKitchen = merchant.category === "Home Kitchen";

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6">Merchant Dashboard</Typography>

      <Typography sx={{ mt: 1 }}>
        Status: <strong>{merchant.status}</strong>
      </Typography>

      {/* ===== BUSINESS DETAILS ===== */}
      <Card sx={{ my: 2 }}>
        <CardContent>
          <Typography variant="subtitle1">Business Details</Typography>

          <TextField
            label="Shop Name"
            fullWidth
            sx={{ mt: 2 }}
            value={merchant.shopName || ""}
            onChange={(e) => updateField("shopName", e.target.value)}
          />

          <TextField
            label="Address"
            fullWidth
            sx={{ mt: 2 }}
            value={merchant.address || ""}
            onChange={(e) => updateField("address", e.target.value)}
          />
        </CardContent>
      </Card>

      {/* ===== CATEGORY ===== */}
      <Card sx={{ my: 2 }}>
        <CardContent>
          <Typography variant="subtitle1">Category</Typography>

          <TextField
            select
            fullWidth
            value={merchant.category || ""}
            onChange={(e) => updateField("category", e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </TextField>

          {isHomeKitchen && (
            <Chip label="🍱 Limited Orders" color="warning" sx={{ mt: 1 }} />
          )}
        </CardContent>
      </Card>

      {/* ===== GEO ===== */}
      <Card sx={{ my: 2 }}>
        <CardContent>
          <Typography variant="subtitle1">Geofence</Typography>

          <TextField
            label="Latitude"
            fullWidth
            sx={{ mt: 2 }}
            value={merchant.lat || ""}
            onChange={(e) => updateField("lat", Number(e.target.value))}
          />

          <TextField
            label="Longitude"
            fullWidth
            sx={{ mt: 2 }}
            value={merchant.lng || ""}
            onChange={(e) => updateField("lng", Number(e.target.value))}
          />

          <TextField
            label="Radius (meters)"
            type="number"
            fullWidth
            sx={{ mt: 2 }}
            value={merchant.geofenceRadius || 300}
            onChange={(e) =>
              updateField("geofenceRadius", Number(e.target.value))
            }
          />
        </CardContent>
      </Card>
    </Box>
  );
}
