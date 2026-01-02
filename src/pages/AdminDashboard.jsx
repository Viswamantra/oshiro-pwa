import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Chip,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import {
  collection,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

/* 🔐 ADMIN CONFIG */
const ADMIN_MOBILE = "7386361725";

export default function AdminDashboard() {
  const navigate = useNavigate();

  /* ======================
     ADMIN AUTH GUARD
  ====================== */
  useEffect(() => {
    const role = localStorage.getItem("oshiro_role");
    const user = JSON.parse(
      localStorage.getItem("oshiro_user") || "{}"
    );

    if (role !== "admin" || user.mobile !== ADMIN_MOBILE) {
      localStorage.clear();
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  /* ======================
     STATE
  ====================== */
  const [merchants, setMerchants] = useState([]);
  const [offers, setOffers] = useState([]);
  const [activeMerchant, setActiveMerchant] = useState(null);

  const [offerOpen, setOfferOpen] = useState(false);
  const [offerTitle, setOfferTitle] = useState("");
  const [offerDesc, setOfferDesc] = useState("");

  /* ======================
     LOAD ALL MERCHANTS
  ====================== */
  useEffect(() => {
    return onSnapshot(collection(db, "merchants"), (snap) => {
      setMerchants(
        snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }))
      );
    });
  }, []);

  /* ======================
     LOAD OFFERS
  ====================== */
  useEffect(() => {
    return onSnapshot(collection(db, "offers"), (snap) => {
      setOffers(
        snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }))
      );
    });
  }, []);

  /* ======================
     CREATE OFFER
  ====================== */
  const createOffer = async () => {
    if (!offerTitle.trim()) {
      alert("Offer title required");
      return;
    }

    await addDoc(collection(db, "offers"), {
      merchantId: activeMerchant.id,
      merchantMobile: activeMerchant.mobile,
      merchantName: activeMerchant.shopName,
      category: activeMerchant.category,
      title: offerTitle,
      description: offerDesc,
      active: true,
      createdAt: serverTimestamp(),
    });

    setOfferTitle("");
    setOfferDesc("");
    setOfferOpen(false);
    alert("✅ Offer created successfully");
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
      {/* HEADER */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
      >
        <Typography variant="h4">
          Admin Dashboard
        </Typography>
        <Button
          variant="outlined"
          color="error"
          onClick={logout}
        >
          Logout
        </Button>
      </Box>

      <Typography sx={{ mt: 1 }}>
        Logged in as: {ADMIN_MOBILE}
      </Typography>

      {/* ======================
          MERCHANT LIST
      ====================== */}
      <Typography variant="h6" sx={{ mt: 4 }}>
        Merchants
      </Typography>

      <Grid container spacing={2} sx={{ mt: 1 }}>
        {merchants.map((m) => (
          <Grid item xs={12} md={4} key={m.id}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1">
                  {m.shopName || "Unnamed Shop"}
                </Typography>

                <Typography variant="body2">
                  {m.mobile} • {m.category || "—"}
                </Typography>

                <Chip
                  label={m.status || "unknown"}
                  color={
                    m.status === "approved"
                      ? "success"
                      : m.status === "pending"
                      ? "warning"
                      : "default"
                  }
                  size="small"
                  sx={{ mt: 1 }}
                />

                {/* ✅ CREATE OFFER ONLY IF APPROVED */}
                {m.status === "approved" && (
                  <Button
                    sx={{ mt: 2 }}
                    variant="contained"
                    size="small"
                    fullWidth
                    onClick={() => {
                      setActiveMerchant(m);
                      setOfferOpen(true);
                    }}
                  >
                    Create Offer
                  </Button>
                )}

                {/* INFO FOR NON-APPROVED */}
                {m.status !== "approved" && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 1, display: "block" }}
                  >
                    Offer can be created after approval
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* ======================
          OFFERS LIST
      ====================== */}
      <Typography variant="h6" sx={{ mt: 4 }}>
        All Offers
      </Typography>

      {offers.map((o) => (
        <Card key={o.id} sx={{ mt: 1 }}>
          <CardContent>
            <Typography>
              <b>{o.title}</b> — {o.merchantName}
            </Typography>
            <Typography variant="body2">
              {o.description}
            </Typography>
          </CardContent>
        </Card>
      ))}

      {/* ======================
          CREATE OFFER DIALOG
      ====================== */}
      <Dialog
        open={offerOpen}
        onClose={() => setOfferOpen(false)}
        fullWidth
      >
        <DialogTitle>
          Create Offer for {activeMerchant?.shopName}
        </DialogTitle>
        <DialogContent>
          <TextField
            label="Offer Title"
            fullWidth
            margin="normal"
            value={offerTitle}
            onChange={(e) =>
              setOfferTitle(e.target.value)
            }
          />

          <TextField
            label="Offer Description"
            fullWidth
            multiline
            minRows={3}
            margin="normal"
            value={offerDesc}
            onChange={(e) =>
              setOfferDesc(e.target.value)
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOfferOpen(false)}>
            Cancel
          </Button>
          <Button variant="contained" onClick={createOffer}>
            Publish Offer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
