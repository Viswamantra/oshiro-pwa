import React, { useEffect, useState, useMemo } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tabs,
  Tab,
  Checkbox,
  Stack,
} from "@mui/material";
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";

/* =========================================================
   ADMIN DASHBOARD
========================================================= */

export default function AdminDashboard() {
  const navigate = useNavigate();

  /* ===== ROLE GUARD ===== */
  const role = localStorage.getItem("oshiro_role");
  if (role !== "admin") {
    navigate("/login", { replace: true });
    return null;
  }

  /* ===== MAIN TABS ===== */
  const [mainTab, setMainTab] = useState(0); // 0=Merchants,1=Offers,2=Customers
  const [statusTab, setStatusTab] = useState(0); // merchant status

  /* ===== COMMON ===== */
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState({});
  const [dateFrom, setDateFrom] = useState("");
  const [testOnly, setTestOnly] = useState(false);

  /* ===== MERCHANT STATES ===== */
  const [merchants, setMerchants] = useState([]);
  const [rejectingMerchant, setRejectingMerchant] = useState(null);
  const [reason, setReason] = useState("");

  /* ===== OFFERS / CUSTOMERS ===== */
  const [offers, setOffers] = useState([]);
  const [customers, setCustomers] = useState([]);

  const merchantStatusMap = ["pending", "approved", "rejected"];
  const currentStatus = merchantStatusMap[statusTab];

  /* =========================================================
     LOAD DATA
  ========================================================= */

  useEffect(() => {
    if (mainTab === 0) {
      const q = query(
        collection(db, "merchants"),
        where("status", "==", currentStatus)
      );
      return onSnapshot(q, (snap) =>
        setMerchants(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      );
    }

    if (mainTab === 1) {
      return onSnapshot(collection(db, "offers"), (snap) =>
        setOffers(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      );
    }

    if (mainTab === 2) {
      return onSnapshot(collection(db, "customers"), (snap) =>
        setCustomers(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      );
    }
  }, [mainTab, currentStatus]);

  /* =========================================================
     FILTERING
  ========================================================= */

  const applyFilters = (list) => {
    return list.filter((item) => {
      if (search) {
        const s = search.toLowerCase();
        if (
          !JSON.stringify(item).toLowerCase().includes(s)
        )
          return false;
      }

      if (testOnly && item.isTest !== true) return false;

      if (dateFrom && item.createdAt?.toDate) {
        if (item.createdAt.toDate() < new Date(dateFrom))
          return false;
      }

      return true;
    });
  };

  const data =
    mainTab === 0
      ? applyFilters(merchants)
      : mainTab === 1
      ? applyFilters(offers)
      : applyFilters(customers);

  /* =========================================================
     SELECTION
  ========================================================= */

  const toggle = (id) =>
    setSelected((p) => ({ ...p, [id]: !p[id] }));

  const selectAll = () => {
    const all = {};
    data.forEach((d) => (all[d.id] = true));
    setSelected(all);
  };

  const clearSelection = () => setSelected({});

  const selectedIds = Object.keys(selected).filter((k) => selected[k]);

  /* =========================================================
     BULK DELETE
  ========================================================= */

  const bulkDelete = async () => {
    if (!selectedIds.length) return alert("No records selected");
    if (!window.confirm(`Delete ${selectedIds.length} records?`)) return;

    const col =
      mainTab === 0
        ? "merchants"
        : mainTab === 1
        ? "offers"
        : "customers";

    const batch = writeBatch(db);
    selectedIds.forEach((id) =>
      batch.delete(doc(db, col, id))
    );

    await batch.commit();
    clearSelection();
  };

  /* =========================================================
     MERCHANT ACTIONS
  ========================================================= */

  const approve = async (id) =>
    updateDoc(doc(db, "merchants", id), {
      status: "approved",
      approvedAt: new Date(),
    });

  const confirmReject = async () => {
    if (!reason.trim()) return alert("Reason required");

    await updateDoc(doc(db, "merchants", rejectingMerchant.id), {
      status: "rejected",
      rejectionReason: reason,
      rejectedAt: new Date(),
    });

    setRejectingMerchant(null);
    setReason("");
  };

  const logout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  /* =========================================================
     UI
  ========================================================= */

  return (
    <Box sx={{ p: 2 }}>
      <Button color="error" onClick={logout}>
        Logout
      </Button>

      <Typography variant="h6" sx={{ mt: 1 }}>
        Admin Dashboard
      </Typography>

      {/* MAIN TABS */}
      <Tabs value={mainTab} onChange={(_, v) => setMainTab(v)}>
        <Tab label="Merchants" />
        <Tab label="Offers" />
        <Tab label="Customers" />
      </Tabs>

      {/* MERCHANT STATUS TABS */}
      {mainTab === 0 && (
        <Tabs
          value={statusTab}
          onChange={(_, v) => setStatusTab(v)}
          sx={{ mt: 1 }}
        >
          <Tab label="Pending" />
          <Tab label="Approved" />
          <Tab label="Rejected" />
        </Tabs>
      )}

      <Divider sx={{ my: 2 }} />

      {/* FILTERS */}
      <Stack direction="row" spacing={2}>
        <TextField
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <TextField
          type="date"
          label="Created After"
          InputLabelProps={{ shrink: true }}
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
        />

        <Checkbox
          checked={testOnly}
          onChange={(e) => setTestOnly(e.target.checked)}
        />
        <Typography>Test Only</Typography>
      </Stack>

      {/* BULK ACTIONS */}
      <Box sx={{ mt: 2 }}>
        <Button onClick={selectAll}>Select All</Button>
        <Button
          color="error"
          variant="contained"
          onClick={bulkDelete}
          disabled={!selectedIds.length}
        >
          Delete Selected ({selectedIds.length})
        </Button>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* LIST */}
      {data.map((d) => (
        <Card key={d.id} sx={{ mb: 1 }}>
          <CardContent sx={{ display: "flex", gap: 2 }}>
            <Checkbox
              checked={!!selected[d.id]}
              onChange={() => toggle(d.id)}
            />

            <Box>
              <Typography fontWeight="bold">
                {d.shopName || d.title || d.id}
              </Typography>

              {d.mobile && (
                <Typography variant="body2">
                  {d.mobile}
                </Typography>
              )}

              {d.category && (
                <Typography variant="body2">
                  {d.category}
                </Typography>
              )}

              {/* MERCHANT ACTIONS */}
              {mainTab === 0 && d.status === "pending" && (
                <Box sx={{ mt: 1 }}>
                  <Button
                    size="small"
                    onClick={() => approve(d.id)}
                  >
                    Approve
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    onClick={() => {
                      setRejectingMerchant(d);
                      setReason("");
                    }}
                  >
                    Reject
                  </Button>
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>
      ))}

      {/* REJECT DIALOG */}
      <Dialog
        open={Boolean(rejectingMerchant)}
        onClose={() => setRejectingMerchant(null)}
      >
        <DialogTitle>Reject Merchant</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectingMerchant(null)}>
            Cancel
          </Button>
          <Button color="error" onClick={confirmReject}>
            Reject
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
