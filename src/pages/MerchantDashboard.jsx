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
  addDoc,
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

  /* ===== LOAD / AUTO-CREATE MERCHANT ===== */
  useEffect(() => {
    if (!mobile) return;

    const q = query(
      collection(db, "merchants"),
      where("mobile", "==", mobile)
    );

    return onSnapshot(q, async (snap) => {
      if (!snap.empty) {
        setMerchant({ id: snap.docs[0].id, ...snap.docs[0].data() });
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
          createdAt: new Date(),
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

  /* ===== UPDATE FIELD ===== */
  const updateField = async (field, value) => {
    if (!merchant?.id) return;

    await updateDoc(doc(db, "merchants", merchant.id), {
      [field]: value,
    });

    setMsg("Saved successfully");
    setTimeout(() => setMsg(""), 2000);
  };

  if (!merchant) {
    return <Typography sx={{ p: 2 }}>Loading merchant...</Typography>;
  }

  const isHomeKitchen = merchant.category === "Home Kitchen";
  const isPending = merchant.status === "pending";
  const isApproved = merchant.status === "approved";
  const isRejected = merchant.status === "rejected";

  /* ===== VALIDATION ===== */
  const isProfileComplete = () => {
    return (
      merchant.shopName &&
      merchant.address &&
      merchant.category &&
      typeof merchant.lat === "number" &&
      typeof merchant.lng === "number"
    );
  };

  return (
    <Box sx={{ p: 2 }}>
      <Button variant="outlined" color="error" onClick={logout}>
        Logout
      </Button>

      <Typography variant="h6" sx={{ mt: 2 }}>
        Merchant Dashboard
      </Typography>

      {/* ===== STATUS ===== */}
      <Typography sx={{ mt: 1 }}>
        Status:{" "}
        <strong>
          {merchant.status === "draft" && "Draft (Not Submitted)"}
          {merchant.status === "pending" && "Pending Admin Approval"}
          {merchant.status === "approved" && "Approved"}
          {merchant.status === "rejected" && "Rejected"}
        </strong>
      </Typography>

      {/* ===== REJECTION REASON ===== */}
      {isRejected && (
        <Typography sx={{ mt: 1, color: "error.main" }}>
          ❌ Rejected by Admin: {merchant.rejectionReason}
        </Typography>
      )}

      {msg && <Typography sx={{ color: "green" }}>{msg}</Typography>}

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
            disabled={isPending}
          />

          <TextField
            label="Business Address"
            fullWidth
            sx={{ mt: 2 }}
            value={merchant.address}
            onChange={(e) => updateField("address", e.target.value)}
            disabled={isPending}
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
            disabled={isPending}
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
          <Typography variant="subtitle1">Geofence Settings</Typography>

          <TextField
            label="Latitude"
            fullWidth
            sx={{ mt: 2 }}
            value={merchant.lat ?? ""}
            onChange={(e) => updateField("lat", Number(e.target.value))}
            disabled={isPending}
          />

          <TextField
            label="Longitude"
            fullWidth
            sx={{ mt: 2 }}
            value={merchant.lng ?? ""}
            onChange={(e) => updateField("lng", Number(e.target.value))}
            disabled={isPending}
          />

          <TextField
            label="Geofence Radius (meters)"
            type="number"
            fullWidth
            sx={{ mt: 2 }}
            value={merchant.geofenceRadius}
            onChange={(e) =>
              updateField("geofenceRadius", Number(e.target.value))
            }
            disabled={isPending}
          />

          <Button
            sx={{ mt: 2 }}
            variant="outlined"
            disabled={isPending}
            onClick={() => {
              navigator.geolocation.getCurrentPosition((pos) => {
                updateField("lat", pos.coords.latitude);
                updateField("lng", pos.coords.longitude);
              });
            }}
          >
            📍 Use Current Location
          </Button>
        </CardContent>
      </Card>

      {/* ===== SUBMIT FOR ADMIN APPROVAL ===== */}
      {!isApproved && (
        <>
          <Button
            fullWidth
            sx={{ mt: 3 }}
            variant="contained"
            disabled={isPending || !isProfileComplete()}
            onClick={() => updateField("status", "pending")}
          >
            {isPending
              ? "Waiting for Admin Approval"
              : "Submit for Admin Approval"}
          </Button>

          {!isProfileComplete() && !isPending && (
            <Typography sx={{ mt: 1, color: "red" }}>
              ⚠️ Complete shop name, address, category, and location before submitting.
            </Typography>
          )}
        </>
      )}

      {/* ===== OFFER CREATION (ONLY AFTER APPROVAL) ===== */}
      {isApproved && (
        <>
          <Typography sx={{ mt: 3, color: "green" }}>
            ✅ Approved by Admin. You can now create offers.
          </Typography>

          <MerchantOffers merchant={merchant} />
        </>
      )}
    </Box>
  );
}
