import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
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
  TextField,
  Tabs,
  Tab,
  MenuItem,
} from "@mui/material";
import {
  collection,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
  query,
  addDoc,
  serverTimestamp,
  orderBy,
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
     TABS
  ====================== */
  const [tab, setTab] = useState(0); // 0=Merchants, 1=Leads, 2=Analytics

  /* ======================
     MERCHANT STATE
  ====================== */
  const [merchants, setMerchants] = useState([]);
  const [activeMerchant, setActiveMerchant] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  /* ======================
     OFFER CREATION
  ====================== */
  const [offerOpen, setOfferOpen] = useState(false);
  const [offerMerchant, setOfferMerchant] = useState(null);
  const [offerText, setOfferText] = useState("");

  /* ======================
     LEADS STATE
  ====================== */
  const [leads, setLeads] = useState([]);
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [filters, setFilters] = useState({
    mobile: "",
    merchant: "",
    category: "",
  });

  /* ======================
     OFFER CLICK ANALYTICS
  ====================== */
  const [offerClicks, setOfferClicks] = useState([]);

  /* ======================
     LOAD MERCHANTS
  ====================== */
  useEffect(() => {
    return onSnapshot(collection(db, "merchants"), (snap) =>
      setMerchants(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
  }, []);

  /* ======================
     LOAD LEADS
  ====================== */
  useEffect(() => {
    const q = query(
      collection(db, "geoEvents"),
      orderBy("createdAt", "desc")
    );

    return onSnapshot(q, (snap) =>
      setLeads(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
  }, []);

  /* ======================
     LOAD OFFER CLICKS
  ====================== */
  useEffect(() => {
    const q = query(
      collection(db, "offerClicks"),
      orderBy("clickedAt", "desc")
    );

    return onSnapshot(q, (snap) =>
      setOfferClicks(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
  }, []);

  /* ======================
     DERIVED FILTER OPTIONS
  ====================== */
  const mobileOptions = [
    ...new Set(leads.map((l) => l.customerMobile).filter(Boolean)),
  ];
  const merchantOptions = [
    ...new Set(leads.map((l) => l.merchantName).filter(Boolean)),
  ];
  const categoryOptions = [
    ...new Set(leads.map((l) => l.category).filter(Boolean)),
  ];

  /* ======================
     FILTERED LEADS
  ====================== */
  const filteredLeads = leads.filter((l) => {
    return (
      (!filters.mobile || l.customerMobile === filters.mobile) &&
      (!filters.merchant || l.merchantName === filters.merchant) &&
      (!filters.category || l.category === filters.category)
    );
  });

  /* ======================
     LEAD SELECTION
  ====================== */
  const toggleLeadSelect = (id) => {
    setSelectedLeads((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    );
  };

  const selectAllLeads = () => {
    if (selectedLeads.length === filteredLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(filteredLeads.map((l) => l.id));
    }
  };

  const deleteSelectedLeads = async () => {
    if (selectedLeads.length === 0) return;

    const ok = window.confirm(
      `Delete ${selectedLeads.length} selected leads?`
    );
    if (!ok) return;

    for (const id of selectedLeads) {
      await deleteDoc(doc(db, "geoEvents", id));
    }

    setSelectedLeads([]);
  };

  /* ======================
     MERCHANT ACTIONS
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
    if (!rejectReason.trim()) return;
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
    if (!offerText.trim() || !offerMerchant) return;

    await addDoc(collection(db, "offers"), {
      merchantId: offerMerchant.id,
      merchantName: offerMerchant.shopName,
      mobile: offerMerchant.mobile,
      title: "Special Offer",
      description: offerText,
      category: offerMerchant.category,
      lat: offerMerchant.lat,
      lng: offerMerchant.lng,
      active: true,
      createdAt: serverTimestamp(),
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

      <Tabs
        sx={{ mt: 2 }}
        value={tab}
        onChange={(e, v) => setTab(v)}
      >
        <Tab label="Merchants" />
        <Tab label="Leads" />
        <Tab label="Offer Analytics" />
      </Tabs>

      <Divider sx={{ my: 2 }} />

      {/* ======================
         MERCHANTS TAB
      ====================== */}
      {tab === 0 && (
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
              const approved = m.status === "approved";
              return (
                <TableRow key={m.id}>
                  <TableCell>{m.shopName}</TableCell>
                  <TableCell>{m.mobile}</TableCell>
                  <TableCell>{m.category}</TableCell>
                  <TableCell>{m.status || "pending"}</TableCell>
                  <TableCell align="right">
                    <Button onClick={() => setActiveMerchant(m)}>
                      Review
                    </Button>
                    {approved && (
                      <Button
                        sx={{ ml: 1 }}
                        variant="contained"
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
      )}

      {/* ======================
         LEADS TAB
      ====================== */}
      {tab === 1 && (
        <>
          {/* FILTERS */}
          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            <TextField
              select
              size="small"
              label="Customer Mobile"
              value={filters.mobile}
              sx={{ minWidth: 200 }}
              onChange={(e) =>
                setFilters({ ...filters, mobile: e.target.value })
              }
            >
              <MenuItem value="">All</MenuItem>
              {mobileOptions.map((m) => (
                <MenuItem key={m} value={m}>
                  {m}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              size="small"
              label="Merchant"
              value={filters.merchant}
              sx={{ minWidth: 200 }}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  merchant: e.target.value,
                })
              }
            >
              <MenuItem value="">All</MenuItem>
              {merchantOptions.map((m) => (
                <MenuItem key={m} value={m}>
                  {m}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              size="small"
              label="Category"
              value={filters.category}
              sx={{ minWidth: 200 }}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  category: e.target.value,
                })
              }
            >
              <MenuItem value="">All</MenuItem>
              {categoryOptions.map((c) => (
                <MenuItem key={c} value={c}>
                  {c}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          {/* ACTION BAR */}
          <Box sx={{ mb: 2 }}>
            <Button onClick={selectAllLeads}>
              {selectedLeads.length === filteredLeads.length
                ? "Unselect All"
                : "Select All"}
            </Button>
            <Button
              sx={{ ml: 2 }}
              color="error"
              variant="contained"
              disabled={selectedLeads.length === 0}
              onClick={deleteSelectedLeads}
            >
              Delete Selected
            </Button>
          </Box>

          {/* LEADS TABLE */}
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={
                      filteredLeads.length > 0 &&
                      selectedLeads.length ===
                        filteredLeads.length
                    }
                    indeterminate={
                      selectedLeads.length > 0 &&
                      selectedLeads.length <
                        filteredLeads.length
                    }
                    onChange={selectAllLeads}
                  />
                </TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Merchant</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Time</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredLeads.map((l) => (
                <TableRow key={l.id} hover>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedLeads.includes(l.id)}
                      onChange={() => toggleLeadSelect(l.id)}
                    />
                  </TableCell>
                  <TableCell>{l.customerMobile}</TableCell>
                  <TableCell>{l.merchantName}</TableCell>
                  <TableCell>{l.category}</TableCell>
                  <TableCell>
                    {l.createdAt?.toDate?.().toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}

      {/* ======================
         OFFER ANALYTICS TAB
      ====================== */}
      {tab === 2 && (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Merchant</TableCell>
              <TableCell>Offer</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Clicked At</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {offerClicks.map((o) => (
              <TableRow key={o.id}>
                <TableCell>{o.merchantName}</TableCell>
                <TableCell>{o.offerTitle}</TableCell>
                <TableCell>{o.customerMobile}</TableCell>
                <TableCell>
                  {o.clickedAt?.toDate?.().toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* ======================
         MERCHANT REVIEW DIALOG
      ====================== */}
      {activeMerchant && (
        <Dialog open fullWidth maxWidth="sm">
          <DialogTitle>Merchant Review</DialogTitle>
          <DialogContent>
            <Typography>Shop: {activeMerchant.shopName}</Typography>
            <Typography>Mobile: {activeMerchant.mobile}</Typography>
            <Typography>Category: {activeMerchant.category}</Typography>

            {activeMerchant.status === "pending" && (
              <TextField
                fullWidth
                sx={{ mt: 2 }}
                label="Rejection Reason"
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

      {/* ======================
         OFFER CREATE DIALOG
      ====================== */}
      <Dialog open={offerOpen} onClose={() => setOfferOpen(false)}>
        <DialogTitle>Create Offer</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 1 }}>
            Merchant: <b>{offerMerchant?.shopName}</b>
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={3}
            value={offerText}
            onChange={(e) => setOfferText(e.target.value)}
            placeholder="Eg: 20% OFF for next 30 minutes"
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
