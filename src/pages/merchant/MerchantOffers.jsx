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
  Timestamp,
} from "firebase/firestore";
import { db } from "../../firebase";

/**
 * =========================================================
 * MERCHANT OFFERS – FINAL STABLE VERSION
 * ---------------------------------------------------------
 * ✔ No circular imports
 * ✔ Uses localStorage merchant session
 * ✔ Firestore rules compliant
 * ✔ Vercel + Vite safe
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
      <Typography sx={{ p: 3 }} color="error">
        Merchant not logged in
      </Typography>
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
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setOffers(list);
    });
  }, [merchant.id]);

  /* ======================
     CREATE OFFER
  ====================== */
  const createOffer = async () => {
    if (!title || !discountText || !expiryDate) {
      alert("Title, discount & expiry are required");
      return;
    }

    try {
      const expiry = new Date(expiryDate);
      expiry.setHours(23, 59, 59, 999);

      await addDoc(collection(db, "offers"), {
        merchantId: merchant.id,
        mobile: merchant.mobile,
        shop_name: merchant.shopName || "",
        category: merchant.category || "",
        title: title.trim(),
        description: description.trim(),
        discountText: discountText.trim(),
        expiryDate: Timestamp.fromDate(expiry),
        isActive: true,
        createdAt: serverTimestamp(),
      });

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
     TOGGLE OFFER STATUS
  ====================== */
  const toggleOffer = async (id, isActive) => {
    try {
      await updateDoc(doc(db, "offers", id), {
        isActive: !isActive,
      });
    } catch (err) {
      console.error("Toggle offer failed:", err);
    }
  };

  /* ======================
     RENDER
  ====================== */
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
            onChange={(e) => setTitle(e.target.value)}
          />

          <TextField
            label="Description"
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
            label="Expiry Date"
            fullWidth
            sx={{ mt: 2 }}
            InputLabelProps={{ shrink: true }}
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
          />

          <Button sx={{ mt: 3 }} variant="contained" onClick={createOffer}>
            Publish Offer
          </Button>
        </CardContent>
      </Card>

      <Divider />

      <Typography sx={{ mt: 2 }}>My Offers</Typography>

      {!offers.length && <p>No offers created yet</p>}

      {offers.map((o) => (
        <Card key={o.id} sx={{ my: 1 }}>
          <CardContent>
            <Typography fontWeight="bold">{o.title}</Typography>

            {o.description && (
              <Typography variant="body2">{o.description}</Typography>
            )}

            <Typography variant="body2">{o.discountText}</Typography>

            <Typography variant="caption">
              Status: {o.isActive ? "Active" : "Disabled"}
            </Typography>

            <Box sx={{ mt: 1 }}>
              <Button
                size="small"
                variant="outlined"
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
