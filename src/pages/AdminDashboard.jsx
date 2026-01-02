import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Divider,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
} from "@mui/material";
import {
  collection,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
  orderBy,
  query,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";

/* ======================
   ADMIN CONFIG
====================== */
const ADMIN_MOBILE = "7386361725";

export default function AdminDashboard() {
  const navigate = useNavigate();

  /* ======================
     🔐 ADMIN AUTH GUARD
  ====================== */
  useEffect(() => {
    const role = localStorage.getItem("oshiro_role");
    const user = JSON.parse(localStorage.getItem("oshiro_user") || "{}");

    if (role !== "admin" || user.mobile !== ADMIN_MOBILE) {
      localStorage.clear();
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  const logout = () => {
    localStorage.clear();
    navigate("/login", { replace: true });
  };

  /* ======================
     STATE
  ====================== */
  const [view, setView] = useState("merchants");
  const [merchants, setMerchants] = useState([]);
  const [selected, setSelected] = useState([]);

  const [activeMerchant, setActiveMerchant] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  /* OFFER STATE */
  const [offerOpen, setOfferOpen] = useState(false);
  const [offerMerchant, setOfferMerchant] = useState(null);
  const [offerText, setOfferText] = useState("");

  /* ======================
     LOAD MERCHANTS
  ====================== */
  useEffect(() => {
    return onSnapshot(collection(db, "merchants"), (s) =>
      setMerchants(s.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
  }, []);

  /* ======================
     APPROVE / REJECT
  ====================== */
  const approveMerchant = async () => {
    await updateDoc(doc(db, "merchants", activeMerchant.id), {
      status: "approved",
      approvedAt: serverTimestamp(),
      rejectionReason: "",
    });
    setActiveMerchant(null);
  };

  const rejectMerchant = async () => {
    if (!rejectReason.trim()) {
      alert("Enter rejection reason");
      return;
    }
    await updateDoc(doc(db, "merchants", activeMerchant.id), {
      status: "rejected",
      rejectionReason: rejectReason.trim(),
    });
    setRejectReason("");
    setActiveMerchant(null);
  };

  /* ======================
     CREATE OFFER (ADMIN)
  ====================== */
  const createOffer = async () => {
    if (!offerText.trim() || !offerMerchant) return;

    await addDoc(collection(db, "offers"), {
      merchantId: offerMerchant.id,
      merchantMobile: offerMerchant.mobile,
      message: offerText,
      active: true,
      createdAt: serverTimestamp(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 mins
    });

    setOfferText("");
    setOfferMerchant(null);
    setOfferOpen(false);
  };

  /* ======================
     UI
  ====================== */
  return (
    <Box sx={{ p: 2 }}>
      <Button variant="outlined" color="error" onClick={logout}>
        Logout
      </Button>

      <Typography variant="h5" sx={{ mt: 2 }}>
        Admin Dashboard
      </Typography>

      <Divider sx={{ my: 2 }} />

      {/* MERCHANT LIST */}
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Shop</TableCell>
            <TableCell>Mobile</TableCell>
            <TableCell>Category</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {merchants.map((m) => {
            const isApproved =
              (m.status || "").toLowerCase() === "approved" ||
              Boolean(m.approvedAt);

            return (
              <TableRow key={m.id} hover>
                <TableCell>{m.shopName || "-"}</TableCell>
                <TableCell>{m.mobile}</TableCell>
                <TableCell>{m.category}</TableCell>
                <TableCell>{m.status || "pending"}</TableCell>

                <TableCell align="right">
                  {/* REVIEW */}
                  <Button
                    size="small"
                    onClick={() => setActiveMerchant(m)}
                  >
                    Review
                  </Button>

                  {/* ✅ CREATE OFFER — ONLY AFTER APPROVAL */}
                  {isApproved && (
                    <Button
                      size="small"
                      variant="contained"
                      sx={{ ml: 1 }}
                      onClick={() => {
                        setOfferMerchant(m);
                        setOfferOpen(true);
                      }}
                    >
                      Create Offer
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* ======================
         MERCHANT REVIEW DIALOG
      ====================== */}
      {activeMerchant && (
        <Dialog open fullWidth maxWidth="sm">
          <DialogTitle>Merchant Review</DialogTitle>
          <DialogContent dividers>
            <Typography><b>Shop:</b> {activeMerchant.shopName}</Typography>
            <Typography><b>Mobile:</b> {activeMerchant.mobile}</Typography>
            <Typography><b>Category:</b> {activeMerchant.category}</Typography>
            <Typography><b>Status:</b> {activeMerchant.status}</Typography>

            {activeMerchant.status === "pending" && (
              <TextField
                fullWidth
                label="Rejection Reason"
                sx={{ mt: 2 }}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setActiveMerchant(null)}>Close</Button>
            {activeMerchant.status === "pending" && (
              <>
                <Button color="error" onClick={rejectMerchant}>
                  Reject
                </Button>
                <Button variant="contained" onClick={approveMerchant}>
                  Approve
                </Button>
              </>
            )}
          </DialogActions>
        </Dialog>
      )}

      {/* ======================
         CREATE OFFER DIALOG
      ====================== */}
      <Dialog open={offerOpen} onClose={() => setOfferOpen(false)} fullWidth>
        <DialogTitle>Create Offer</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 1 }}>
            Merchant: <b>{offerMerchant?.shopName}</b>
          </Typography>

          <TextField
            fullWidth
            multiline
            minRows={3}
            placeholder="Eg: 20% OFF for next 30 minutes"
            value={offerText}
            onChange={(e) => setOfferText(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOfferOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={createOffer}>
            Publish Offer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
