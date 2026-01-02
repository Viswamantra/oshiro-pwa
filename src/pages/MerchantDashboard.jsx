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
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  Timestamp,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";

export default function MerchantDashboard() {
  const navigate = useNavigate();

  /* ===============================
     BASIC AUTH (LOCAL)
  =============================== */
  const role = localStorage.getItem("oshiro_role");
  const merchantId = JSON.parse(
    localStorage.getItem("oshiro_user") || "{}"
  )?.mobile;

  const [merchant, setMerchant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (role !== "merchant" || !merchantId) {
      navigate("/login", { replace: true });
      return;
    }

    // 🔍 Check merchant existence
    const checkMerchant = async () => {
      const ref = doc(db, "merchants", merchantId);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        // ❌ New merchant → onboarding
        navigate("/merchant/register", { replace: true });
        return;
      }

      setMerchant(snap.data());
      setLoading(false);
    };

    checkMerchant();
  }, [role, merchantId, navigate]);

  /* ===============================
     LOGOUT
  =============================== */
  const handleLogout = () => {
    localStorage.clear();
    navigate("/login", { replace: true });
  };

  /* ===============================
     GEO EVENTS (only after approval)
  =============================== */
  const [nearbyCustomers, setNearbyCustomers] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [offerText, setOfferText] = useState("");

  useEffect(() => {
    if (!merchant || merchant.status !== "approved") return;

    const q = query(
      collection(db, "geo_events"),
      where("merchantId", "==", merchantId),
      orderBy("createdAt", "desc"),
      limit(5)
    );

    return onSnapshot(q, (snap) => {
      setNearbyCustomers(
        snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      );
    });
  }, [merchant, merchantId]);

  /* ===============================
     SEND OFFER
  =============================== */
  const sendOffer = async () => {
    if (!offerText || !selectedCustomer) return;

    await addDoc(collection(db, "merchant_messages"), {
      merchantId,
      customerId: selectedCustomer.customerId,
      message: offerText,
      createdAt: Timestamp.now(),
      expiresAt: Timestamp.fromDate(
        new Date(Date.now() + 30 * 60 * 1000)
      ),
      read: false,
    });

    setOfferText("");
    setOpen(false);
  };

  /* ===============================
     UI STATES
  =============================== */
  if (loading) {
    return <Typography p={3}>Loading merchant profile…</Typography>;
  }

  if (merchant.status !== "approved") {
    return (
      <Box p={3}>
        <Typography variant="h6">
          ⏳ Your merchant account is under review
        </Typography>
        <Typography variant="body2">
          We’ll notify you once approved.
        </Typography>
        <Button onClick={handleLogout} sx={{ mt: 2 }}>
          Logout
        </Button>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="body2" color="text.secondary">
        Merchant ID: {merchantId}
      </Typography>

      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h5">
          📍 Live Nearby Customers
        </Typography>

        <Button color="error" onClick={handleLogout}>
          Logout
        </Button>
      </Box>

      {nearbyCustomers.length === 0 && (
        <Typography>No customers nearby</Typography>
      )}

      {nearbyCustomers.map((c) => (
        <Card key={c.id} sx={{ mb: 2 }}>
          <CardContent>
            <Typography>👤 Anonymous Customer</Typography>
            <Typography>
              Distance: {Math.round(c.distanceMeters)} m
            </Typography>
            <Button
              sx={{ mt: 1 }}
              variant="contained"
              onClick={() => {
                setSelectedCustomer(c);
                setOpen(true);
              }}
            >
              Send Offer
            </Button>
          </CardContent>
        </Card>
      ))}

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Send Instant Offer</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            minRows={3}
            value={offerText}
            onChange={(e) => setOfferText(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={sendOffer}>Send</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
