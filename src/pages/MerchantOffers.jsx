import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Divider,
} from "@mui/material";
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase";

/**
 * =========================================================
 * MERCHANT OFFERS – FIXED & STABLE
 * =========================================================
 */

export default function MerchantOffers() {
  /* ======================
     MERCHANT SESSION
  ====================== */
  const stored = localStorage.getItem("merchant");
  const merchant = stored ? JSON.parse(stored) : null;

  if (!merchant?.id) {
    return (
      <Typography color="error">
        Merchant session missing. Please login again.
      </Typography>
    );
  }

  /* ======================
     STATE
  ====================== */
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [discountText, setDiscountText] = useState("");
  const [validTill, setValidTill] = useState("");
  const [offers, setOffers] = useState([]);

  /* ======================
     LOAD OFFERS
  ====================== */
  useEffect(() => {
    const q = query(
      collection(db, "offers"),
      where("merchantId", "==", merchant.id)
    );

    const unsub = onSnapshot(q, (snap) => {
      setOffers(
        snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }))
      );
    });

    return () => unsub();
  }, [merchant.id]);

  /* ======================
     CREATE OFFER
  ====================== */
  const createOffer = async () => {
    if (!title || !discountText || !validTill) {
      alert("Title, discount and expiry date are required");
      return;
    }

    const expiry = new Date(validTill);
    expiry.setHours(23, 59, 59, 999);

    await addDoc(collection(db, "offers"), {
      merchantId: merchant.id,
      shop_name: merchant.shopName || "",
      title,
      description,
      discountText,
      validTill: expiry,          // ✅ CUSTOMER USES THIS
      isActive: true,             // ✅ FIXED
      createdAt: serverTimestamp(),
    });

    setTitle("");
    setDescription("");
    setDiscountText("");
    setValidTill("");
  };

  /* ======================
     TOGGLE OFFER
  ====================== */
  const toggleOffer = async (id, isActive) => {
    await updateDoc(doc(db, "offers", id), {
      isActive: !isActive,
    });
  };

  /* ======================
     RENDER
  ====================== */
  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5">My Offers</Typography>
      <Divider sx={{ my: 2 }} />

      {/* ===== CREATE OFFER ===== */}
      <Typography variant="h6">Create New Offer</Typography>

      <Card sx={{ my: 2 }}>
        <CardContent>
          <TextField
            label="Offer Title"
            fullWidth
            sx={{ mt: 2 }}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <TextField
            label="Description (optional)"
            fullWidth
            multiline
            rows={2}
            sx={{ mt: 2 }}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <TextField
            label="Discount / Deal"
            fullWidth
            sx={{ mt: 2 }}
            value={discountText}
            onChange={(e) => setDiscountText(e.target.value)}
          />

          <TextField
            type="date"
            label="Valid Till"
            fullWidth
            sx={{ mt: 2 }}
            InputLabelProps={{ shrink: true }}
            value={validTill}
            onChange={(e) => setValidTill(e.target.value)}
          />

          <Button
            sx={{ mt: 3 }}
            variant="contained"
            onClick={createOffer}
          >
            Publish Offer
          </Button>
        </CardContent>
      </Card>

      {/* ===== LIST OFFERS ===== */}
      <Typography variant="subtitle1">Your Offers</Typography>

      {offers.length === 0 && (
        <Typography>No offers created yet</Typography>
      )}

      {offers.map((o) => (
        <Card key={o.id} sx={{ my: 1 }}>
          <CardContent>
            <Typography fontWeight="bold">{o.title}</Typography>

            {o.description && (
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {o.description}
              </Typography>
            )}

            <Typography variant="body2" sx={{ mt: 0.5 }}>
              {o.discountText}
            </Typography>

            {o.validTill && (
              <Typography variant="caption" color="error">
                ⏰ Valid till{" "}
                {o.validTill.toDate().toLocaleDateString("en-IN")}
              </Typography>
            )}

            <Box sx={{ mt: 1 }}>
              <Button
                size="small"
                variant="outlined"
                color={o.isActive ? "error" : "success"}
                onClick={() => toggleOffer(o.id, o.isActive)}
              >
                {o.isActive ? "Disable" : "Enable"}
              </Button>
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}
