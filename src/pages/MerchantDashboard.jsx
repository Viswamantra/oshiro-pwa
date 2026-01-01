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
  Divider,
} from "@mui/material";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";
import MerchantOffers from "./MerchantOffers";

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

  /* ===== LOGOUT ===== */
  const logout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  const stored = JSON.parse(localStorage.getItem("oshiro_user") || "{}");
  const mobile = stored.mobile;

  const [merchant, setMerchant] = useState(null);
  const [msg, setMsg] = useState("");
  const [liveAlerts, setLiveAlerts] = useState([]);

  /* =========================================================
     LOAD / AUTO-CREATE MERCHANT
  ========================================================= */
  useEffect(() => {
    if (!mobile) return;

    const q = query(collection(db, "merchants"), where("mobile", "==", mobile));

    return onSnapshot(q, async (snap) => {
      if (!snap.empty) {
        const docSnap = snap.docs[0];
        const data = docSnap.data();

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
      } else {
        const ref = await addDoc(collection(db, "merchants"), {
          mobile,
          status: "draft",
          category: "",
          shopName: "",
          address: "",
          lat: null,
          lng: null,
          geofenceRadius: 300,
          createdAt: serverTimestamp(),
        });

        setMerchant({
          id: ref.id,
          mobile,
          status: "draft",
          category: "",
          shopName: "",
          address: "",
          lat: null,
          lng: null,
          geofenceRadius: 300,
        });
      }
    });
  }, [mobile]);

  /* =========================================================
     🔔 REAL-TIME CUSTOMER ALERTS (ZERO COST)
  ========================================================= */
  useEffect(() => {
    if (!merchant?.id) return;

    const q = query(
      collection(db, "geo_events"),
      where("merchantId", "==", merchant.id),
      where("notified", "==", false)
    );

    const unsub = onSnapshot(q, (snap) => {
      const alerts = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setLiveAlerts(alerts);
    });

    return () => unsub();
  }, [merchant?.id]);

  /* =========================================================
     UPDATE FIELD (SAFE)
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

  /* =========================================================
     MARK ALERT AS HANDLED
  ========================================================= */
  const markAlertHandled = async (alertId) => {
    await updateDoc(doc(db, "geo_events", alertId), {
      notified: true,
      notifiedAt: serverTimestamp(),
    });
  };

  if (!merchant) {
    return <Typography sx={{ p: 2 }}>Loading merchant...</Typography>;
  }

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

  return (
    <Box sx={{ p: 2 }}>
      <Button variant="outlined" color="error" onClick={logout}>
        Logout
      </Button>

      <Typography variant="h6" sx={{ mt: 2 }}>
        Merchant Dashboard
      </Typography>

      <Typography sx={{ mt: 1 }}>
        Status: <strong>{merchant.status.toUpperCase()}</strong>
      </Typography>

      {isRejected && (
        <Typography color="error">
          ❌ Rejected: {merchant.rejectionReason}
        </Typography>
      )}

      {msg && <Typography color="green">{msg}</Typography>}

      {/* ================= LIVE CUSTOMER ALERTS ================= */}
      {liveAlerts.length > 0 && (
        <Card sx={{ mt: 2, bgcolor: "#ffebee" }}>
          <CardContent>
            <Typography variant="h6" color="error">
              🚨 Customer Nearby!
            </Typography>

            {liveAlerts.map((a) => (
              <Box key={a.id} sx={{ mt: 1 }}>
                <Typography>
                  Customer within <b>{a.distanceMeters} meters</b>
                </Typography>

                <Button
                  size="small"
                  variant="contained"
                  sx={{ mt: 1 }}
                  onClick={() => markAlertHandled(a.id)}
                >
                  Mark as Handled
                </Button>

                <Divider sx={{ mt: 1 }} />
              </Box>
            ))}
          </CardContent>
        </Card>
      )}

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
                {c === "Home Kitchen"
                  ? "Home Kitchen – Ghar ka khana • Limited orders"
                  : c}
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
            helperText="Minimum 100m (recommended 300m)"
            disabled={isPending || isApproved}
          />

          <Button
            sx={{ mt: 2 }}
            variant="outlined"
            disabled={isPending || isApproved}
            onClick={() =>
              navigator.geolocation.getCurrentPosition((pos) => {
                updateField("lat", pos.coords.latitude);
                updateField("lng", pos.coords.longitude);
                updateField("geofenceRadius", 300);
              })
            }
          >
            📍 Use Current Location
          </Button>
        </CardContent>
      </Card>

      {/* ===== SUBMIT ===== */}
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

      {/* ===== OFFERS ===== */}
      {isApproved && (
        <>
          <Typography sx={{ mt: 3, color: "green" }}>
            ✅ Approved — You can create offers
          </Typography>
          <MerchantOffers merchant={merchant} />
        </>
      )}
    </Box>
  );
}
