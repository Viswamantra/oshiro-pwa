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
  CircularProgress,
} from "@mui/material";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
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

  /* ===== ROLE GUARD ===== */
  const role = localStorage.getItem("oshiro_role");
  if (role !== "merchant") {
    navigate("/login", { replace: true });
    return null;
  }

  /* ===== LOGOUT (ALWAYS AVAILABLE) ===== */
  const logout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  const stored = JSON.parse(localStorage.getItem("oshiro_user") || "{}");
  const rawMobile = stored.mobile || "";

  // normalize mobile: remove +91 if present
  const mobile = rawMobile.replace("+91", "");

  const [merchant, setMerchant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  /* =========================================================
     LOAD EXISTING MERCHANT (NO HANG)
  ========================================================= */
  useEffect(() => {
    if (!mobile) {
      logout();
      return;
    }

    const q = query(
      collection(db, "merchants"),
      where("mobile", "in", [mobile, "+91" + mobile])
    );

    const unsub = onSnapshot(
      q,
      async (snap) => {
        if (!snap.empty) {
          const docSnap = snap.docs[0];
          const data = docSnap.data();

          // Auto-fix geofence if bad
          if (
            typeof data.geofenceRadius !== "number" ||
            data.geofenceRadius < 100
          ) {
            await updateDoc(doc(db, "merchants", docSnap.id), {
              geofenceRadius: 300,
            });
            data.geofenceRadius = 300;
          }

          setMerchant({ id: docSnap.id, ...data });
          setLoading(false);
        } else {
          // Create only if truly new
          const ref = await addDoc(collection(db, "merchants"), {
            mobile: "+91" + mobile,
            status: "draft",
            category: "",
            shopName: "",
            address: "",
            lat: null,
            lng: null,
            geofenceRadius: 300,
            createdAt: new Date(),
          });

          setMerchant({
            id: ref.id,
            mobile: "+91" + mobile,
            status: "draft",
            category: "",
            shopName: "",
            address: "",
            lat: null,
            lng: null,
            geofenceRadius: 300,
          });
          setLoading(false);
        }
      },
      (err) => {
        console.error("Merchant load error:", err);
        setLoading(false);
      }
    );

    // SAFETY: never hang forever
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 8000);

    return () => {
      unsub();
      clearTimeout(timeout);
    };
  }, [mobile]);

  /* =========================================================
     🔔 REGISTER FCM TOKEN
  ========================================================= */
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
      } catch (err) {
        console.error("FCM error:", err);
      }
    };

    registerPush();
  }, [merchant?.id]);

  /* =========================================================
     UPDATE FIELD
  ========================================================= */
  const updateField = async (field, value) => {
    if (!merchant?.id) return;

    if (field === "geofenceRadius" && value < 100) {
      alert("Geofence radius must be at least 100 meters");
      return;
    }

    await updateDoc(doc(db, "merchants", merchant.id), {
      [field]: value,
    });

    setMsg("Saved successfully");
    setTimeout(() => setMsg(""), 1500);
  };

  /* ================= LOADING UI ================= */
  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Button variant="outlined" color="error" onClick={logout}>
          Logout
        </Button>

        <Box sx={{ mt: 4, textAlign: "center" }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Loading merchant profile…</Typography>
        </Box>
      </Box>
    );
  }

  if (!merchant) {
    return (
      <Box sx={{ p: 3 }}>
        <Button variant="outlined" color="error" onClick={logout}>
          Logout
        </Button>
        <Typography color="error" sx={{ mt: 2 }}>
          Unable to load merchant profile. Please login again.
        </Typography>
      </Box>
    );
  }

  /* ================= FLAGS ================= */
  const isHomeKitchen = merchant.category === "Home Kitchen";
  const isPending = merchant.status === "pending";
  const isApproved = merchant.status === "approved";
  const isRejected = merchant.status === "rejected";

  const isProfileComplete =
    merchant.shopName &&
    merchant.address &&
    merchant.category &&
    typeof merchant.lat === "number" &&
    typeof merchant.lng === "number" &&
    merchant.geofenceRadius >= 100;

  /* ================= UI ================= */
  return (
    <Box sx={{ p: 2 }}>
      <Button variant="outlined" color="error" onClick={logout}>
        Logout
      </Button>

      <Typography variant="h6" sx={{ mt: 2 }}>
        Merchant Dashboard
      </Typography>

      <Typography sx={{ mt: 1 }}>
        Status: <strong>{merchant.status}</strong>
      </Typography>

      {isRejected && (
        <Typography color="error">
          ❌ Rejected: {merchant.rejectionReason}
        </Typography>
      )}

      {msg && <Typography color="green">{msg}</Typography>}

      {/* ===== BUSINESS DETAILS ===== */}
      <Card sx={{ my: 2 }}>
        <CardContent>
          <Typography variant="subtitle1">Business Details</Typography>

          <TextField
            label="Shop Name"
            fullWidth
            sx={{ mt: 2 }}
            value={merchant.shopName}
            onChange={(e) => updateField("shopName", e.target.value)}
            disabled={isPending || isApproved}
          />

          <TextField
            label="Business Address"
            fullWidth
            sx={{ mt: 2 }}
            value={merchant.address}
            onChange={(e) => updateField("address", e.target.value)}
            disabled={isPending || isApproved}
          />
        </CardContent>
      </Card>

      {/* ===== CATEGORY ===== */}
      <Card sx={{ my: 2 }}>
        <CardContent>
          <Typography variant="subtitle1">Business Category</Typography>

          <TextField
            select
            fullWidth
            value={merchant.category}
            onChange={(e) => updateField("category", e.target.value)}
            disabled={isPending || isApproved}
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

      {/* ===== GEOFENCE ===== */}
      <Card sx={{ my: 2 }}>
        <CardContent>
          <Typography variant="subtitle1">Geofence</Typography>

          <TextField
            label="Latitude"
            fullWidth
            sx={{ mt: 2 }}
            value={merchant.lat ?? ""}
            onChange={(e) => updateField("lat", Number(e.target.value))}
            disabled={isPending || isApproved}
          />

          <TextField
            label="Longitude"
            fullWidth
            sx={{ mt: 2 }}
            value={merchant.lng ?? ""}
            onChange={(e) => updateField("lng", Number(e.target.value))}
            disabled={isPending || isApproved}
          />

          <TextField
            label="Radius (meters)"
            type="number"
            fullWidth
            sx={{ mt: 2 }}
            value={merchant.geofenceRadius}
            onChange={(e) =>
              updateField("geofenceRadius", Number(e.target.value))
            }
            disabled={isPending || isApproved}
          />
        </CardContent>
      </Card>

      {!isApproved && (
        <Button
          fullWidth
          sx={{ mt: 2 }}
          variant="contained"
          disabled={!isProfileComplete || isPending}
          onClick={() => updateField("status", "pending")}
        >
          Submit for Admin Approval
        </Button>
      )}

      {isApproved && (
        <Typography sx={{ mt: 3, color: "green" }}>
          ✅ Approved — Ready for offers & alerts
        </Typography>
      )}
    </Box>
  );
}
