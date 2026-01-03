import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  serverTimestamp,
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

  const [open, setOpen] = useState(false);
  const [offerTitle, setOfferTitle] = useState("");
  const [offerDesc, setOfferDesc] = useState("");

  /* ======================
     LOAD MERCHANT DETAILS
  ====================== */
  useEffect(() => {
    const q = query(
      collection(db, "merchants"),
      where("mobile", "==", merchantMobile),
      where("status", "==", "approved")
    );

    return onSnapshot(q, (snap) => {
      if (!snap.empty) {
        setMerchant({ id: snap.docs[0].id, ...snap.docs[0].data() });
      }
    });
  }, [merchantMobile]);

  /* ======================
     LOAD OFFERS
  ====================== */
  useEffect(() => {
    if (!merchant) return;

    const q = query(
      collection(db, "offers"),
      where("merchantId", "==", merchant.id)
    );

    return onSnapshot(q, (snap) => {
      setOffers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, [merchant]);

  /* ======================
     CREATE OFFER (🔥 FIX HERE 🔥)
  ====================== */
  const createOffer = async () => {
    if (!offerTitle || !offerDesc) {
      alert("Fill all fields");
      return;
    }

    if (!merchant?.lat || !merchant?.lng) {
      alert("Merchant GPS missing");
      return;
    }

    await addDoc(collection(db, "offers"), {
      merchantId: merchant.id,
      merchantMobile: merchant.mobile,
      shopName: merchant.shopName,
      category: merchant.category,

      title: offerTitle,
      description: offerDesc,

      /* 🔥 THIS IS THE FIX 🔥 */
      lat: merchant.lat,
      lng: merchant.lng,

      active: true,
      createdAt: serverTimestamp(),
    });

    setOfferTitle("");
    setOfferDesc("");
    setOpen(false);
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

      {merchant && (
        <Typography sx={{ mt: 1 }}>
          {merchant.shopName} | {merchant.category}
        </Typography>
      )}

      <Button
        sx={{ mt: 2 }}
        variant="contained"
        onClick={() => setOpen(true)}
      >
        Create Offer
      </Button>

      <Button
        sx={{ mt: 2, ml: 2 }}
        variant="outlined"
        color="error"
        onClick={logout}
      >
        Logout
      </Button>

      {/* OFFERS LIST */}
      <Box sx={{ mt: 3 }}>
        {offers.map((o) => (
          <Card key={o.id} sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6">{o.title}</Typography>
              <Typography>{o.description}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* CREATE OFFER DIALOG */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth>
        <DialogTitle>Create Offer</DialogTitle>
        <DialogContent>
          <TextField
            label="Offer Title"
            fullWidth
            margin="normal"
            value={offerTitle}
            onChange={(e) => setOfferTitle(e.target.value)}
          />
          <TextField
            label="Offer Description"
            fullWidth
            margin="normal"
            multiline
            rows={3}
            value={offerDesc}
            onChange={(e) => setOfferDesc(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={createOffer}>
            Save Offer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
