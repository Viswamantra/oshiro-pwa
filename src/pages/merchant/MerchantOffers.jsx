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
 * MERCHANT OFFERS (SESSION-DRIVEN – FINAL)
 * ---------------------------------------------------------
 * ✔ Uses localStorage merchant session
 * ✔ Firestore rules compliant
 * ✔ Works for new merchants (9888888888)
 * ✔ Offer creation + toggle supported
 * =========================================================
 */

export default function MerchantOffers() {
  /* ======================
     LOAD MERCHANT SESSION
  ====================== */
  const merchantRaw = localStorage.getItem("merchant");
  const merchant = merchantRaw ? JSON.parse(merchantRaw) : null;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [discountText, setDiscountText] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [offers, setOffers] = useState([]);

  if (!merchant?.id) {
    return (
      <p style={{ padding: 20, color: "red" }}>
        Merchant not logged in
      </p>
    );
  }

  /* ======================
     LOAD MERCHANT OFFERS
  ====================== */
  useEffect(() => {
    const q = query(
      collection(db, "offers"),
      where("merchantId", "==", merchant.id)
    );

    return onSnapshot(q, (snap) => {
      setOffers(
        snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      );
    });
  }, [merchant.id]);

  /* ======================
     CREATE OFFER  ✅ FIXED
  ====================== */
  const createOffer = async () => {
    if (!title || !discountText || !expiryDate) {
      alert("Title, discount & expiry are required");
      return;
    }

    const expiry = new Date(expiryDate);
    expiry.setHours(23, 59, 59, 999);

    try {
      await addDoc(collection(db, "offers"), {
        merchantId: merchant.id,
        mobile: merchant.mobile,              // ✅ REQUIRED BY RULES
        shop_name: merchant.shopName || "",
        category: merchant.category || "",
        title,
        description,
        discountText,
        expiryDate: expiry,
        isActive: true,
        createdAt: serverTimestamp(),
      });

      // Reset form
      setTitle("");
      setDescription("");
      setDiscountText("");
      setExpiryDate("");

    } catch (err) {
      console.error("Create offer failed:", err);
      alert("Failed to create offer");
    }
  };

  /* ======================
     TOGGLE OFFER
  ====================== */
  const toggleOffer = async (id, isActive) => {
    await updateDoc(doc(db, "offers", id), {
      isActive: !isActive,
    });
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6">Create New Offer</Typography>

      <Card sx={{ my: 2 }}>
        <CardContent>
          <TextField
            label="Offer Title"
            fullWidth
            sx={{ mt: 2 }}
            value={title}
