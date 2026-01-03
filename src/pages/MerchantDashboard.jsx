import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
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
  updateDoc,
  doc,
  addDoc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";

export default function MerchantDashboard() {
  const navigate = useNavigate();

  /* ======================
     AUTH INFO
  ====================== */
  const merchantId = localStorage.getItem("oshiro_merchant_id");

  /* ======================
     STATE
  ====================== */
  const [alertEvent, setAlertEvent] = useState(null);
  const [offerText, setOfferText] = useState("");

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
     SOUND + VIBRATION
  ====================== */
  const playAlert = () => {
    try {
      // 🔊 Beep sound
      const audio = new Audio(
        "https://actions.google.com/sounds/v1/alarms/beep_short.ogg"
      );
      audio.play();

      // 📳 Vibration (mobile only)
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }
    } catch (e) {
      console.warn("Alert sound blocked by browser");
    }
  };

  /* ======================
     REAL-TIME GEOFENCE ALERT
  ====================== */
  useEffect(() => {
    if (!merchantId) return;

    const q = query(
      collection(db, "geo_events"),
      where("merchantId", "==", merchantId),
      where("notified", "==", false)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      snap.docs.forEach(async (d) => {
        const data = d.data();

        // 🔔 Play sound + vibration
        playAlert();

        setAlertEvent({
          id: d.id,
          customerId: data.customerId,
          distance: data.distanceMeters,
          createdAt: data.createdAt,
        });

        // ✅ Mark notified
        await updateDoc(doc(db, "geo_events", d.id), {
          notified: true,
        });
      });
    });

    return () => unsubscribe();
  }, [merchantId]);

  /* ======================
     SEND OFFER
  ====================== */
  const sendOffer = async () => {
    if (!offerText.trim()) return;

    const merchantSnap = await getDoc(
      doc(db, "merchants", merchantId)
    );
    const merchant = merchantSnap.data();

    await addDoc(collection(db, "offers"), {
      merchantId,
      merchantName: merchant.shopName,
      merchantMobile: merchant.mobile,
      category: merchant.category,
      title: "Special Offer",
      description: offerText.trim(),
      lat: merchant.lat,
      lng: merchant.lng,
      active: true,
      createdAt: serverTimestamp(),
      expiresAt: new Date(
        Date.now() + 30 * 60 * 1000
      ), // 30 mins
    });

    setOfferText("");
    setAlertEvent(null);
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
      <Typography variant="h4">
        Merchant Dashboard
      </Typography>

      <Button
        sx={{ mt: 2 }}
        color="error"
        variant="outlined"
        onClick={logout}
      >
        Logout
      </Button>

      <Typography sx={{ mt: 3 }}>
        🔔 Keep this screen open to receive
        customer proximity alerts.
      </Typography>

      {/* ======================
         ALERT POPUP
      ====================== */}
      {alertEvent && (
        <Dialog
          open
          onClose={() => setAlertEvent(null)}
          fullWidth
        >
          <DialogTitle>
            🚶 Customer Nearby!
          </DialogTitle>

          <DialogContent>
            <Typography>
              A customer is within{" "}
              <b>{alertEvent.distance} meters</b>{" "}
              of your shop.
            </Typography>

            <Typography sx={{ mt: 1 }}>
              Time:{" "}
              {alertEvent.createdAt
                ?.toDate()
                .toLocaleTimeString()}
            </Typography>

            <TextField
              sx={{ mt: 2 }}
              fullWidth
              multiline
              minRows={2}
              placeholder="Type a quick offer (Eg: 20% OFF for next 30 mins)"
              value={offerText}
              onChange={(e) =>
                setOfferText(e.target.value)
              }
            />
          </DialogContent>

          <DialogActions>
            <Button
              onClick={() => setAlertEvent(null)}
            >
              Ignore
            </Button>

            <Button
              variant="contained"
              onClick={sendOffer}
            >
              Send Offer
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
}
