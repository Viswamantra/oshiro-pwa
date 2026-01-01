import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Divider,
  TextField,
  MenuItem,
} from "@mui/material";
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  addDoc,
  serverTimestamp,
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

  /* ===== LOGOUT ===== */
  const logout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  /* ===== STATE ===== */
  const [merchants, setMerchants] = useState([]);
  const [pendingMerchants, setPendingMerchants] = useState([]);
  const [approvedCount, setApprovedCount] = useState(0);
  const [customerCount, setCustomerCount] = useState(0);

  /* ===== LIVE ALERT STATE ===== */
  const [selectedMerchant, setSelectedMerchant] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [statusMsg, setStatusMsg] = useState("");

  /* =========================================================
     LOAD MERCHANTS
  ========================================================= */
  useEffect(() => {
    const q = query(collection(db, "merchants"));

    return onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      setMerchants(list);
      setPendingMerchants(list.filter((m) => m.status === "pending"));
      setApprovedCount(list.filter((m) => m.status === "approved").length);
    });
  }, []);

  /* =========================================================
     LOAD CUSTOMERS COUNT
  ========================================================= */
  useEffect(() => {
    const q = query(collection(db, "customers"));
    return onSnapshot(q, (snap) => setCustomerCount(snap.size));
  }, []);

  /* =========================================================
     MERCHANT APPROVAL ACTIONS
  ========================================================= */
  const approveMerchant = async (id) => {
    await updateDoc(doc(db, "merchants", id), {
      status: "approved",
      approvedAt: serverTimestamp(),
    });
  };

  const rejectMerchant = async (id) => {
    const reason = prompt("Enter rejection reason");
    if (!reason) return;

    await updateDoc(doc(db, "merchants", id), {
      status: "rejected",
      rejectionReason: reason,
    });
  };

  /* =========================================================
     SEND LIVE ALERT (OPTION A)
  ========================================================= */
  const sendLiveAlert = async () => {
    if (!selectedMerchant || !alertMessage.trim()) {
      alert("Select merchant and enter alert message");
      return;
    }

    await addDoc(collection(db, "admin_alerts"), {
      merchantId: selectedMerchant,
      message: alertMessage.trim(),
      read: false,
      createdAt: serverTimestamp(),
    });

    setAlertMessage("");
    setStatusMsg("✅ Alert sent successfully");

    setTimeout(() => setStatusMsg(""), 2000);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Button variant="outlined" color="error" onClick={logout}>
        Logout
      </Button>

      <Typography variant="h6" sx={{ mt: 2 }}>
        Admin Dashboard
      </Typography>

      {/* ================= STATS ================= */}
      <Box sx={{ display: "flex", gap: 2, mt: 2, flexWrap: "wrap" }}>
        <Card sx={{ minWidth: 180 }}>
          <CardContent>
            <Typography variant="subtitle2">Merchants</Typography>
            <Typography variant="h6">{merchants.length}</Typography>
          </CardContent>
        </Card>

        <Card sx={{ minWidth: 180 }}>
          <CardContent>
            <Typography variant="subtitle2">Approved</Typography>
            <Typography variant="h6">{approvedCount}</Typography>
          </CardContent>
        </Card>

        <Card sx={{ minWidth: 180 }}>
          <CardContent>
            <Typography variant="subtitle2">Customers</Typography>
            <Typography variant="h6">{customerCount}</Typography>
          </CardContent>
        </Card>
      </Box>

      {/* ================= MERCHANT APPROVALS ================= */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="subtitle1">
            Pending Merchant Approvals
          </Typography>

          {pendingMerchants.length === 0 && (
            <Typography sx={{ mt: 1 }}>No pending merchants</Typography>
          )}

          {pendingMerchants.map((m) => (
            <Box key={m.id} sx={{ mt: 2 }}>
              <Typography>
                <b>{m.shopName || "Unnamed Shop"}</b> — {m.mobile}
              </Typography>

              <Button
                size="small"
                variant="contained"
                sx={{ mt: 1, mr: 1 }}
                onClick={() => approveMerchant(m.id)}
              >
                Approve
              </Button>

              <Button
                size="small"
                variant="outlined"
                color="error"
                sx={{ mt: 1 }}
                onClick={() => rejectMerchant(m.id)}
              >
                Reject
              </Button>

              <Divider sx={{ mt: 1 }} />
            </Box>
          ))}
        </CardContent>
      </Card>

      {/* ================= SEND LIVE ALERT ================= */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="subtitle1">
            🔔 Send Live Alert to Merchant
          </Typography>

          <TextField
            select
            fullWidth
            sx={{ mt: 2 }}
            label="Select Merchant"
            value={selectedMerchant}
            onChange={(e) => setSelectedMerchant(e.target.value)}
          >
            {merchants.map((m) => (
              <MenuItem key={m.id} value={m.id}>
                {m.shopName || "Unnamed Shop"} — {m.mobile}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            multiline
            rows={3}
            sx={{ mt: 2 }}
            label="Alert Message"
            value={alertMessage}
            onChange={(e) => setAlertMessage(e.target.value)}
            placeholder="Customer nearby – send offer now"
          />

          <Button
            variant="contained"
            fullWidth
            sx={{ mt: 2 }}
            onClick={sendLiveAlert}
          >
            Send Alert
          </Button>

          {statusMsg && (
            <Typography sx={{ mt: 1, color: "green" }}>
              {statusMsg}
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
