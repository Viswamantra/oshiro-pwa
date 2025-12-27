import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Divider,
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

  const [pendingMerchants, setPendingMerchants] = useState([]);

  /* ===== LOAD PENDING MERCHANTS ===== */
  useEffect(() => {
    const q = query(
      collection(db, "merchants"),
      where("status", "==", "pending")
    );

    return onSnapshot(q, (snap) => {
      setPendingMerchants(
        snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      );
    });
  }, []);

  /* ===== ACTIONS ===== */
  const approve = async (id) => {
    await updateDoc(doc(db, "merchants", id), {
      status: "approved",
    });
  };

  const reject = async (id) => {
    await updateDoc(doc(db, "merchants", id), {
      status: "rejected",
    });
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

      <Divider sx={{ my: 2 }} />

      {pendingMerchants.length === 0 && (
        <Typography>No pending merchants 🎉</Typography>
      )}

      {pendingMerchants.map((m) => (
        <Card key={m.id} sx={{ my: 1 }}>
          <CardContent>
            <Typography fontWeight="bold">
              {m.shopName || "Unnamed Shop"}
            </Typography>

            <Typography variant="body2">
              {m.mobile}
            </Typography>

            <Typography variant="body2">
              {m.category}
            </Typography>

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
                onClick={() => reject(m.id)}
              >
                Reject
              </Button>
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}
