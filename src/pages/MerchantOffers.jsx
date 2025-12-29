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
} from "firebase/firestore";
import { db } from "../firebase";

export default function MerchantOffers({ merchant }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [discountText, setDiscountText] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [offers, setOffers] = useState([]);

  /* ===== LOAD EXISTING OFFERS ===== */
  useEffect(() => {
    const q = query(
      collection(db, "offers"),
      where("merchantId", "==", merchant.id)
    );

    return onSnapshot(q, (snap) => {
      setOffers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, [merchant.id]);

  /* ===== CREATE OFFER ===== */
  const createOffer = async () => {
    if (!title || !discountText || !expiryDate) {
      alert("Offer title, discount, and expiry date are required");
      return;
    }

    const expiry = new Date(expiryDate);
    expiry.setHours(23, 59, 59, 999); // valid till end of day

    await addDoc(collection(db, "offers"), {
      merchantId: merchant.id,
      merchantMobile: merchant.mobile,
      shopName: merchant.shopName,
      category: merchant.category,
      title,
      description,
      discountText,
      expiryDate: expiry,       // ✅ IMPORTANT
      active: true,
      createdAt: new Date(),
    });

    // Reset form
    setTitle("");
    setDescription("");
    setDiscountText("");
    setExpiryDate("");
  };

  /* ===== TOGGLE OFFER ===== */
  const toggleOffer = async (id, active) => {
    await updateDoc(doc(db, "offers", id), { active: !active });
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Divider />

      <Typography variant="h6" sx={{ mt: 2 }}>
        Create New Offer
      </Typography>

      {/* ===== CREATE OFFER FORM ===== */}
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
            label="Description (shown to customer)"
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
            label="Offer Expiry Date"
            fullWidth
            sx={{ mt: 2 }}
            InputLabelProps={{ shrink: true }}
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            helperText="Offer will automatically expire on this date"
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
      <Typography variant="subtitle1" sx={{ mt: 3 }}>
        Your Offers
      </Typography>

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

            {o.expiryDate && (
              <Typography variant="caption" color="error">
                ⏰ Valid till{" "}
                {o.expiryDate.toDate().toLocaleDateString("en-IN")}
              </Typography>
            )}

            <Box sx={{ mt: 1 }}>
              <Button
                size="small"
                variant="outlined"
                color={o.active ? "error" : "success"}
                onClick={() => toggleOffer(o.id, o.active)}
              >
                {o.active ? "Disable" : "Enable"}
              </Button>
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}
