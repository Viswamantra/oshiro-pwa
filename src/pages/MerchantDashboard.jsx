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

export default function MerchantDashboard() {
  const merchantId = localStorage.getItem("oshiro_merchant_id");

  const [nearbyCustomers, setNearbyCustomers] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [offerText, setOfferText] = useState("");

  /* ============================
     LIVE GEO EVENTS LISTENER
  ============================ */
  useEffect(() => {
    if (!merchantId) return;

    const q = query(
      collection(db, "geo_events"),
      where("merchantId", "==", merchantId),
      where("notified", "==", true),
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

  /* ============================
     SEND OFFER
  ============================ */
  const sendOffer = async () => {
    if (!offerText || !selectedCustomer) return;

    await addDoc(collection(db, "merchant_messages"), {
      merchantId,
      customerId: selectedCustomer.customerId,
      message: offerText,
      createdAt: Timestamp.now(),
      expiresAt: Timestamp.fromDate(
        new Date(Date.now() + 30 * 60 * 1000) // 30 mins
      ),
      read: false,
    });

    setOfferText("");
    setSelectedCustomer(null);
    setOpen(false);
  };

  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>
        📍 Live Nearby Customers
      </Typography>

      {nearbyCustomers.length === 0 && (
        <Typography color="text.secondary">
          No customers nearby right now
        </Typography>
      )}

      {nearbyCustomers.map((c) => (
        <Card key={c.id} sx={{ mb: 2 }}>
          <CardContent>
            <Typography>
              👤 Anonymous Customer
            </Typography>
            <Typography variant="body2">
              Distance: {Math.round(c.distanceMeters)} meters
            </Typography>
            <Typography variant="body2">
              Time: just now
            </Typography>

            <Button
              variant="contained"
              sx={{ mt: 1 }}
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

      {/* ================= SEND OFFER DIALOG ================= */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth>
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
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={sendOffer}>
            Send
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
