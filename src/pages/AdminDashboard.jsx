import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
} from "@mui/material";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const navigate = useNavigate();

  if (localStorage.getItem("oshiro_admin") !== "true") {
    navigate("/admin-login");
    return null;
  }

  const [merchants, setMerchants] = useState([]);

  useEffect(() => {
    return onSnapshot(collection(db, "merchants"), (snap) => {
      setMerchants(
        snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      );
    });
  }, []);

  const approve = async (id) => {
    await updateDoc(doc(db, "merchants", id), {
      status: "approved",
    });
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6">Admin – Merchant Approvals</Typography>

      {merchants.map((m) => (
        <Card key={m.id} sx={{ my: 1 }}>
          <CardContent>
            <Typography>
              {m.shopName || "Unnamed"} ({m.mobile})
            </Typography>
            <Typography>Status: {m.status}</Typography>

            {m.status === "pending" && (
              <Button
                sx={{ mt: 1 }}
                variant="contained"
                onClick={() => approve(m.id)}
              >
                Approve
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}
