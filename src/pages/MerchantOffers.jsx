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
    if (!title || !discountText) {
      alert("Offer title and discount are required");
      return;
    }

    await addDoc(collection(db, "offers"), {
      merchantId: merchant.id,
      merchantMobile: merchant.mobile,
      shopName: merchant.shopName,
      category: merchant.category,
      title,
      description,
      discountText,
      active: true,
      createdAt: new Date(),
    });

    setTitle("");
    setDescription("");
    setDiscountText("");
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

          <Button sx={{ mt: 2 }} variant="contained" onClick={createOffer}>
            Publish Offer
          </Button>
        </CardContent>
      </Card>

      {/* ===== LIST OFFERS ===== */}
      <Typography variant="subtitle1">Your Offers</Typography>

      {offers.map((o) => (
        <Card key={o.id} sx={{ my: 1 }}>
          <CardContent>
            <Typography>
              <strong>{o.title}</strong>
            </Typography>
            <Typography variant="body2">
              {o.discountText}
            </Typography>

            <Button
              sx={{ mt: 1 }}
              size="small"
              variant="outlined"
              color={o.active ? "error" : "success"}
              onClick={() => toggleOffer(o.id, o.active)}
            >
              {o.active ? "Disable" : "Enable"}
            </Button>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}
