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

/* 🔐 ADMIN CONFIG */
const ADMIN_MOBILE = "7386361725";

export default function AdminDashboard() {
  const navigate = useNavigate();

  /* ======================
     🔐 ADMIN AUTH GUARD
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

  const logout = () => {
    localStorage.clear();
    navigate("/login", { replace: true });
  };

  /* ======================
     STATE
  ====================== */
  const [view, setView] = useState("merchants");
  const [merchants, setMerchants] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [offers, setOffers] = useState([]);
  const [geoEvents, setGeoEvents] = useState([]);

  const [selected, setSelected] = useState([]);
  const [activeMerchant, setActiveMerchant] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  /* OFFER STATE */
  const [offerOpen, setOfferOpen] = useState(false);
  const [offerTitle, setOfferTitle] = useState("");
  const [offerDesc, setOfferDesc] = useState("");
  const [offerMerchant, setOfferMerchant] = useState(null);

  /* ======================
     LOAD DATA
  ====================== */
  useEffect(() => {
    return onSnapshot(collection(db, "merchants"), (s) =>
      setMerchants(s.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
  }, []);

  useEffect(() => {
    return onSnapshot(collection(db, "customers"), (s) =>
      setCustomers(s.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
  }, []);

  useEffect(() => {
    return onSnapshot(collection(db, "offers"), (s) =>
      setOffers(s.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, "geo_events"),
      orderBy("createdAt", "desc")
    );
    return onSnapshot(q, (s) =>
      setGeoEvents(s.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
  }, []);

  /* ======================
     SELECTION
  ====================== */
  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    );
  };

  const clearSelection = () => setSelected([]);

  /* ======================
     MERCHANT APPROVAL
  ====================== */
  const approveMerchant = async () => {
    await updateDoc(doc(db, "merchants", activeMerchant.id), {
      status: "approved",
      rejectionReason: "",
      approvedAt: serverTimestamp(),
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
     CREATE OFFER
  ====================== */
  const createOffer = async () => {
    if (!offerMerchant || offerMerchant.status !== "approved") {
      alert("Merchant not approved");
      return;
    }

    if (!offerTitle.trim()) {
      alert("Offer title required");
      return;
    }

    await addDoc(collection(db, "offers"), {
      merchantId: offerMerchant.id,
      merchantMobile: offerMerchant.mobile,
      merchantName: offerMerchant.shopName,
      category: offerMerchant.category,
      title: offerTitle,
      description: offerDesc,
      active: true,
      createdAt: serverTimestamp(),
    });

    setOfferOpen(false);
    setOfferTitle("");
    setOfferDesc("");
    setOfferMerchant(null);
  };

  /* ======================
     TABLE
  ====================== */
  const renderMerchants = () => (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell />
          <TableCell>Shop</TableCell>
          <TableCell>Mobile</TableCell>
          <TableCell>Category</TableCell>
          <TableCell>Status</TableCell>
          <TableCell>Action</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {merchants.map((m) => (
          <TableRow key={m.id} hover>
            <TableCell>
              <Checkbox
                checked={selected.includes(m.id)}
                onChange={() => toggleSelect(m.id)}
              />
            </TableCell>
            <TableCell>{m.shopName}</TableCell>
            <TableCell>{m.mobile}</TableCell>
            <TableCell>{m.category}</TableCell>
            <TableCell>{m.status}</TableCell>
            <TableCell>
              <Button
                size="small"
                onClick={() => setActiveMerchant(m)}
              >
                Review
              </Button>

              {m.status === "approved" && (
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
        ))}
      </TableBody>
    </Table>
  );

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

      {renderMerchants()}

      {/* MERCHANT REVIEW */}
      {activeMerchant && (
        <Dialog open fullWidth maxWidth="sm">
          <DialogTitle>Merchant Review</DialogTitle>
          <DialogContent dividers>
            <Typography>
              <b>Shop:</b> {activeMerchant.shopName}
            </Typography>
            <Typography>
              <b>Mobile:</b> {activeMerchant.mobile}
            </Typography>
            <Typography>
              <b>Category:</b> {activeMerchant.category}
            </Typography>
            <Typography>
              <b>Status:</b> {activeMerchant.status}
            </Typography>

            {activeMerchant.status === "pending" && (
              <TextField
                fullWidth
                label="Rejection Reason"
                sx={{ mt: 2 }}
                value={rejectReason}
                onChange={(e) =>
                  setRejectReason(e.target.value)
                }
              />
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setActiveMerchant(null)}>
              Close
            </Button>
            {activeMerchant.status === "pending" && (
              <>
                <Button color="error" onClick={rejectMerchant}>
                  Reject
                </Button>
                <Button
                  variant="contained"
                  onClick={approveMerchant}
                >
                  Approve
                </Button>
              </>
            )}
          </DialogActions>
        </Dialog>
      )}

      {/* CREATE OFFER */}
      {offerOpen && (
        <Dialog open fullWidth maxWidth="sm">
          <DialogTitle>
            Create Offer – {offerMerchant?.shopName}
          </DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Offer Title"
              sx={{ mb: 2 }}
              value={offerTitle}
              onChange={(e) =>
                setOfferTitle(e.target.value)
              }
            />
            <TextField
              fullWidth
              multiline
              minRows={3}
              label="Offer Description"
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
      )}
    </Box>
  );
}
