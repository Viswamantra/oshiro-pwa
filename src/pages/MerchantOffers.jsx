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
    if (!t
