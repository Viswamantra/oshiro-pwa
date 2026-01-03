import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
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
     REAL-TIME GEOFENCE ALERT LISTENER
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

        // 🔔 Show alert ONLY ONCE
        setAlertEvent({
          id: d.id,
          customerId: data.customerId,
          distance: data.distanceMeters,
          createdAt: data.createdAt,
        });

        // ✅ Mark as notified to prevent repeat alerts
        await updateDoc(doc(db, "geo_events", d.id), {
          notified: true,
        });
      });
    });

    return () => unsubscribe();
  }, [merchantId]);

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

            <Typography sx={{ mt: 2 }}>
              👉 You can now approach or
              prepare an offer.
            </Typography>
          </DialogContent>

          <DialogActions>
            <Button
              variant="contained"
              onClick={() =>
                setAlertEvent(null)
              }
            >
              OK
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
}
