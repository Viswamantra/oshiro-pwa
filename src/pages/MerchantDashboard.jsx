import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  MenuItem,
  Divider,
} from "@mui/material";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";

export default function MerchantDashboard() {
  const navigate = useNavigate();

  const merchantId = localStorage.getItem("oshiro_merchant_id");
  const merchant = JSON.parse(
    localStorage.getItem("oshiro_user") || "{}"
  );

  /* ======================
     AUTH GUARD
  ====================== */
  useEffect(() => {
    if (
      localStorage.getItem("oshiro_role") !== "merchant" ||
      !merchantId
    ) {
      localStorage.clear();
      navigate("/login", { replace: true });
    }
  }, [navigate, merchantId]);

  /* ======================
     STATE
  ====================== */
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [activeOffers, setActiveOffers] = useState([]);

  /* ======================
     LOAD ACTIVE OFFERS
  ====================== */
  useEffect(() => {
    const q = query(
      collection(db, "offers"),
      where("merchantId", "==", merchantId),
      where("active", "==", true)
    );

    return onSnapshot(q, (snap) => {
      setActiveOffers(
        snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      );
    });
  }, [merchantId]);

  /* ======================
     CREATE OFFER
  ====================== */
  const createOffer = async () => {
    if (!title.trim() || !description.trim()) {
      alert("Enter offer title and description");
      return;
    }

    await addDoc(collection(db, "offers"), {
      merchantId,
      merchantName: merchant.shopName || "",
      merchantMobile: merchant.mobile,
      title: title.trim(),
      description: description.trim(),
      category: merchant.category,
      lat: merchant.lat,
      lng: merchant.lng,
      active: true,
      createdAt: serverTimestamp(),
    });

    setTitle("");
    setDescription("");
  };

  /* ======================
     DISABLE OFFER
  ====================== */
  const disableOffer = async (id) => {
    await updateDoc(doc(db, "offers", id), {
      active: false,
    });
  };

  /* ======================
     LOGOUT
  ====================== */
  const logout = () => {
    localStorage.clear();
    navigate("/login", { replace: true });
  };

  /* ======================
     UI
  ====================== */
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4">Merchant Dashboard</Typography>

      <Button
        sx={{ mt: 2 }}
        variant="outlined"
        color="error"
        onClick={logout}
      >
        Logout
      </Button>

      <Typography sx={{ mt: 2 }} color="primary">
        🔔 Keep this screen open to receive customer proximity alerts.
      </Typography>

      <Divider sx={{ my: 3 }} />

      {/* ======================
          CREATE OFFER FORM
      ====================== */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6">
            Create New Offer
          </Typography>

          <TextField
            fullWidth
            sx={{ mt: 2 }}
            label="Offer Title"
            placeholder="Eg: 10% OFF on Biryani"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <TextField
            fullWidth
            multiline
            minRows={2}
            sx={{ mt: 2 }}
            label="Offer Description"
            placeholder="Valid today only"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <TextField
            fullWidth
            disabled
            sx={{ mt: 2 }}
            label="Category"
            value={merchant.category || ""}
          />

          <Button
            sx={{ mt: 2 }}
            variant="contained"
            onClick={createOffer}
          >
            Publish Offer
          </Button>
        </CardContent>
      </Card>

      {/* ======================
          ACTIVE OFFERS
      ====================== */}
      <Typography variant="h6">My Active Offers</Typography>

      {activeOffers.map((o) => (
        <Card key={o.id} sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="subtitle1">
              {o.title}
            </Typography>
            <Typography>{o.description}</Typography>

            <Button
              size="small"
              color="error"
              sx={{ mt: 1 }}
              onClick={() => disableOffer(o.id)}
            >
              Disable
            </Button>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}
