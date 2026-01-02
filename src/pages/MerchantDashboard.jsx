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
} from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";

export default function MerchantDashboard() {
  const navigate = useNavigate();

  /* ==================================================
     ✅ SIMPLE ROLE GUARD (LOCALSTORAGE ONLY)
  ================================================== */
  const role = localStorage.getItem("oshiro_role");
  const merchantId =
    localStorage.getItem("oshiro_merchant_id") ||
    localStorage.getItem("oshiro_user")
      ? JSON.parse(localStorage.getItem("oshiro_user"))?.mobile
      : null;

  useEffect(() => {
    if (role !== "merchant" || !merchantId) {
      navigate("/login", { replace: true });
    }
  }, [role, merchantId, navigate]);

  /* ==================================================
     STATE
  ================================================== */
  const [nearbyCustomers, setNearbyCustomers] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [offerText, setOfferText] = useState("");

  /* ==================================================
     🚪 LOGOUT (LOCAL ONLY)
  ================================================== */
  const handleLogout = () => {
    localStorage.clear();
    navigate("/login", { replace: true });
  };

  /* ==================================================
     📍 LIVE GEO EVENTS
  ================================================== */
  useEffect(() => {
    if (!merchantId) return;

    const q = query(
      collection(db, "geo_events"),
      where("merchantId", "==", merchantId),
        orderBy("createdAt", "desc"),
      limit(5)
    );

    return onSnapshot(q, (snap) => {
      const rows = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setNearbyCustomers(rows);
    });
  }, [merchantId]);

  /* ==================================================
     ✉️ SEND OFFER
  ================================================== */
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
    setSelectedCustomer(null);
    setOpen(false);
  };

  /* ==================================================
     UI
  ================================================== */
  <Typography variant="body2" color="text.secondary">
  Merchant ID: {merchantId}
</Typography>
  return (
    <Box p={3}>
      {/* HEADER */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h5">
          📍 Live Nearby Customers
        </Typography>

        <Button
          color="error"
          variant="outlined"
          onClick={handleLogout}
        >
          Logout
        </Button>
      </Box>

      {nearbyCustomers.length === 0 && (
        <Typography color="text.secondary">
          No customers nearby right now
        </Typography>
      )}

      {nearbyCustomers.map((c) => (
        <Card key={c.id} sx={{ mb: 2 }}>
          <CardContent>
            <Typography>👤 Anonymous Customer</Typography>
            <Typography variant="body2">
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

      {/* SEND OFFER MODAL */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
      >
        <DialogTitle>Send Instant Offer</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            minRows={3}
            placeholder="Eg: 10% OFF for next 30 mins"
            value={offerText}
            onChange={(e) => setOfferText(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="contained" onClick={sendOffer}>
            Send
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
