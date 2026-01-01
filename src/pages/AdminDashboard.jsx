import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  MenuItem,
  Divider,
} from "@mui/material";
import {
  collection,
  onSnapshot,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
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

  const [merchants, setMerchants] = useState([]);
  const [selectedMerchant, setSelectedMerchant] = useState("");
  const [message, setMessage] = useState("");
  const [statusMsg, setStatusMsg] = useState("");

  /* =========================================================
     LOAD MERCHANTS
  ========================================================= */
  useEffect(() => {
    const q = query(
      collection(db, "merchants"),
      orderBy("createdAt", "desc")
    );

    return onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setMerchants(list);
    });
  }, []);

  /* =========================================================
     SEND LIVE ALERT TO MERCHANT
  ========================================================= */
  const sendAlert = async () => {
    if (!selectedMerchant || !message.trim()) {
      alert("Select merchant and enter message");
      return;
    }

    await addDoc(collection(db, "admin_alerts"), {
      merchantId: selectedMerchant,
      message: message.trim(),
      read: false,
      createdAt: serverTimestamp(),
    });

    setMessage("");
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

      {/* ================= SEND ALERT ================= */}
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
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Customer nearby – send offer now"
          />

          <Button
            variant="contained"
            fullWidth
            sx={{ mt: 2 }}
            onClick={sendAlert}
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

      <Divider sx={{ my: 3 }} />

      {/* ================= INFO ================= */}
      <Typography variant="body2" color="text.secondary">
        ℹ️ Alerts are delivered instantly when merchant dashboard is open.
        <br />
        This is a zero-cost, real-time in-app alert system.
      </Typography>
    </Box>
  );
}
