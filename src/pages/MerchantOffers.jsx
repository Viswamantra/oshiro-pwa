import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  MenuItem,
  Card,
  CardContent,
} from "@mui/material";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function MerchantOffers({ merchant }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [discountText, setDiscountText] = useState("");

  const createOffer = async () => {
    if (!title || !discountText) {
      alert("Offer title and discount are required");
      return;
    }

    await addDoc(collection(db, "offers"), {
      merchantId: merchant.id,
      merchantMobile: merchant.mobile,
      title,
      description,
      category: merchant.category,
      discountText,
      active: true,
      createdAt: new Date(),
    });

    setTitle("");
    setDescription("");
    setDiscountText("");
    alert("Offer created successfully");
  };

  return (
    <Card sx={{ my: 3 }}>
      <CardContent>
        <Typography variant="subtitle1">Create Offer</Typography>

        <TextField
          label="Offer Title"
          fullWidth
          sx={{ mt: 2 }}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <TextField
          label="Description"
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
  );
}
