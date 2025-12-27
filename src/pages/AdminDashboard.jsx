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
} from "@mui/material";
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const navigate = useNavigate();

  /* ===== ROLE GUARD ===== */
  const role = localStorage.getItem("oshiro_role");
  if (role !== "admin") {
    navigate("/login", { replace: true });
    return null;
  }

  const [tab, setTab] = useState(0);
  const [merchants, setMerchants] = useState([]);
  const [search, setSearch] = useState("");
  const [rejectingMerchant, setRejectingMerchant] = useState(null);
  const [reason, setReason] = useState("");

  const statusMap = ["pending", "approved", "rejected"];
  const currentStatus = statusMap[tab];

  /* ===== LOAD MERCHANTS BY STATUS ===== */
  useEffect(() => {
    const q = query(
      collection(db, "merchants"),
      where("status", "==", currentStatus)
    );

    return onSnapshot(q, (snap) => {
      setMerchants(
        snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      );
    });
  }, [currentStatus]);

  /* ===== SEARCH FILTER ===== */
  const filteredMerchants = useMemo(() => {
    if (!search.trim()) return merchants;

    const s = search.toLowerCase();

    return merchants.filter((m) => {
      return (
        (m.shopName || "").toLowerCase().includes(s) ||
        (m.mobile || "").includes(s)
      );
    });
  }, [search, merchants]);

  /* ===== ACTIONS ===== */
  const approve = async (id) => {
    await updateDoc(doc(db, "merchants", id), {
      status: "approved",
      approvedAt: new Date(),
    });
  };

  const confirmReject = async () => {
    if (!reason.trim()) {
      alert("Rejection reason is required");
      return;
    }

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

  return (
    <Box sx={{ p: 2 }}>
      <Button variant="outlined" color="error" onClick={logout}>
        Logout
      </Button>

      <Typography variant="h6" sx={{ mt: 2 }}>
        Admin Dashboard
      </Typography>

      {/* ===== SEARCH ===== */}
      <TextField
        fullWidth
        placeholder="Search by shop name or mobile number"
        sx={{ mt: 2 }}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* ===== TABS ===== */}
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ mt: 2 }}
      >
        <Tab label="Pending" />
        <Tab label="Approved" />
        <Tab label="Rejected" />
      </Tabs>

      <Divider sx={{ my: 2 }} />

      {filteredMerchants.length === 0 && (
        <Typography>No merchants found</Typography>
      )}

      {filteredMerchants.map((m) => (
        <Card key={m.id} sx={{ my: 1 }}>
          <CardContent>
            <Typography fontWeight="bold">
              {m.shopName || "Unnamed Shop"}
            </Typography>

            <Typography variant="body2">{m.mobile}</Typography>
            <Typography variant="body2">{m.category}</Typography>

            {m.status === "rejected" && (
              <Typography
                variant="body2"
                sx={{ color: "error.main", mt: 1 }}
              >
                ❌ {m.rejectionReason}
              </Typography>
            )}

            {m.status === "pending" && (
              <Box sx={{ mt: 1, display: "flex", gap: 1 }}>
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => approve(m.id)}
                >
                  Approve
                </Button>

                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => {
                    setRejectingMerchant(m);
                    setReason("");
                  }}
                >
                  Reject
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      ))}

      {/* ===== REJECT DIALOG ===== */}
      <Dialog
        open={Boolean(rejectingMerchant)}
        onClose={() => setRejectingMerchant(null)}
        fullWidth
      >
        <DialogTitle>Reject Merchant</DialogTitle>

        <DialogContent>
          <Typography sx={{ mb: 1 }}>
            Reason for rejecting{" "}
            <strong>{rejectingMerchant?.shopName}</strong>
          </Typography>

          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="Enter rejection reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setRejectingMerchant(null)}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={confirmReject}
          >
            Reject Merchant
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
