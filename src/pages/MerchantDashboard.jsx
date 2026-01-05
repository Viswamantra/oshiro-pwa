import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
import { getToken } from "firebase/messaging";
import { db, messaging } from "../firebase";
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
     🔔 REGISTER FCM TOKEN (CRITICAL FIX)
  ====================== */
  useEffect(() => {
    const registerFCM = async () => {
      if (!messaging || !merchantId) return;

      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          console.warn("Notification permission denied");
          return;
        }

        const token = await getToken(messaging, {
          vapidKey: "BEzJ7FJ2GYuDTL7DS2B4EACTBp_vX9M3rS-cV-0Va1df8ouzOD-8qwUuwn3eHtI609065jtuon9pWVUyBoY-0CU",
        });

        if (!token) {
          console.warn("FCM token not generated");
          return;
        }

        await updateDoc(doc(db, "merchants", merchantId), {
          fcmToken: token,
          fcmUpdatedAt: serverTimestamp(),
        });

        console.log("✅ Merchant FCM token saved");
      } catch (err) {
        console.error("FCM registration failed", err);
      }
    };

    registerFCM();
  }, [merchantId]);

  /* ======================
     STATE
  ====================== */
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [activeOffers, setActiveOffers] = useState([]);

  const [liveCustomers, setLiveCustomers] = useState([]);
  const [selectedGeo, setSelectedGeo] = useState(null);
  const [extraDiscount, setExtraDiscount] = useState("");
  const [message, setMessage] = useState("");

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
     LIVE GEO EVENTS
  ====================== */
  useEffect(() => {
    const q = query(
      collection(db, "geo_events"),
      where("merchantMobile", "==", merchant.mobile)
    );

    return onSnapshot(q, (snap) => {
      setLiveCustomers(
        snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      );
    });
  }, [merchantId, merchant.mobile]);

  /* ======================
     CREATE BASE OFFER
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
      baseDiscount: 15,
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
     SEND INSTANT OFFER
  ====================== */
  const sendInstantOffer = async () => {
    if (!extraDiscount) {
      alert("Enter extra discount");
      return;
    }

    const base = selectedGeo.baseDiscount || 15;
    const finalDiscount =
      Number(base) + Number(extraDiscount);

    await addDoc(collection(db, "instant_offers"), {
      customerMobile: selectedGeo.customerMobile,
      merchantId,
      baseDiscount: base,
      extraDiscount: Number(extraDiscount),
      finalDiscount,
      message:
        message ||
        `Special ${finalDiscount}% OFF just for you!`,
      sentAt: serverTimestamp(),
    });

    await updateDoc(
      doc(db, "geo_events", selectedGeo.id),
      { status: "offer_sent" }
    );

    setSelectedGeo(null);
    setExtraDiscount("");
    setMessage("");
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
        variant="outlined"
        color="error"
        onClick={logout}
      >
        Logout
      </Button>

      <Typography sx={{ mt: 2 }} color="error">
        🔔 Keep this screen open — customers nearby will
        notify you instantly.
      </Typography>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h6">
        Customers Nearby
      </Typography>

      {liveCustomers.length === 0 && (
        <Typography color="text.secondary">
          No customers nearby
        </Typography>
      )}

      {liveCustomers.map((g) => (
        <Card key={g.id} sx={{ mt: 2 }}>
          <CardContent>
            <Typography>
              📍 Customer entered your area
            </Typography>

            <Button
              sx={{ mt: 1 }}
              variant="contained"
              onClick={() => setSelectedGeo(g)}
            >
              Send Instant Offer
            </Button>
          </CardContent>
        </Card>
      ))}

      <Divider sx={{ my: 3 }} />

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6">
            Create Base Offer
          </Typography>

          <TextField
            fullWidth
            sx={{ mt: 2 }}
            label="Offer Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <TextField
            fullWidth
            multiline
            minRows={2}
            sx={{ mt: 2 }}
            label="Description"
            value={description}
            onChange={(e) =>
              setDescription(e.target.value)
            }
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

      <Typography variant="h6">
        My Active Offers
      </Typography>

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

      <Dialog
        open={Boolean(selectedGeo)}
        onClose={() => setSelectedGeo(null)}
      >
        <DialogTitle>
          Send Instant Offer
        </DialogTitle>

        <DialogContent>
          <TextField
            fullWidth
            label="Extra Discount (%)"
            type="number"
            sx={{ mt: 2 }}
            value={extraDiscount}
            onChange={(e) =>
              setExtraDiscount(e.target.value)
            }
          />

          <TextField
            fullWidth
            multiline
            minRows={2}
            sx={{ mt: 2 }}
            label="Optional Message"
            value={message}
            onChange={(e) =>
              setMessage(e.target.value)
            }
          />
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => setSelectedGeo(null)}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={sendInstantOffer}
          >
            Send
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
