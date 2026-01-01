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
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const navigate = useNavigate();

  /* ===== ROLE GUARD ===== */
  if (localStorage.getItem("oshiro_role") !== "admin") {
    navigate("/login", { replace: true });
    return null;
  }

  const logout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  const [merchants, setMerchants] = useState([]);
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  /* ===== LOAD MERCHANTS ===== */
  useEffect(() => {
    return onSnapshot(collection(db, "merchants"), snap =>
      setMerchants(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  }, []);

  /* ===== ACTIONS ===== */
  const approveMerchant = async () => {
    await updateDoc(doc(db, "merchants", selectedMerchant.id), {
      status: "approved",
      rejectionReason: "",
    });
    setSelectedMerchant(null);
  };

  const rejectMerchant = async () => {
    if (!rejectReason.trim()) return alert("Enter rejection reason");

    await updateDoc(doc(db, "merchants", selectedMerchant.id), {
      status: "rejected",
      rejectionReason: rejectReason.trim(),
    });
    setRejectReason("");
    setSelectedMerchant(null);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Button variant="outlined" color="error" onClick={logout}>
        Logout
      </Button>

      <Typography variant="h5" sx={{ mt: 2 }}>
        Admin Dashboard
      </Typography>

      {/* ===== STATS ===== */}
      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid item xs={6} md={2}>
          <Card>
            <CardContent>
              <Typography>Merchants</Typography>
              <Typography variant="h6">{merchants.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={2}>
          <Card>
            <CardContent>
              <Typography>Approved</Typography>
              <Typography variant="h6">
                {merchants.filter(m => m.status === "approved").length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      {/* ===== MERCHANT TABLE ===== */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6">All Merchants</Typography>

        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Shop</TableCell>
              <TableCell>Mobile</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {merchants.map(m => (
              <TableRow
                key={m.id}
                hover
                sx={{ cursor: "pointer" }}
                onClick={() => setSelectedMerchant(m)}
              >
                <TableCell>{m.shopName || "-"}</TableCell>
                <TableCell>{m.mobile}</TableCell>
                <TableCell>{m.category}</TableCell>
                <TableCell>{m.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* ===== APPROVAL DIALOG ===== */}
      {selectedMerchant && (
        <Dialog open fullWidth maxWidth="sm">
          <DialogTitle>Merchant Review</DialogTitle>
          <DialogContent dividers>
            <Typography><b>Shop:</b> {selectedMerchant.shopName}</Typography>
            <Typography><b>Mobile:</b> {selectedMerchant.mobile}</Typography>
            <Typography><b>Category:</b> {selectedMerchant.category}</Typography>
            <Typography><b>Address:</b> {selectedMerchant.address}</Typography>
            <Typography><b>Status:</b> {selectedMerchant.status}</Typography>

            {selectedMerchant.status === "pending" && (
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Rejection Reason"
                sx={{ mt: 2 }}
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
              />
            )}
          </DialogContent>

          <DialogActions>
            <Button onClick={() => setSelectedMerchant(null)}>Close</Button>

            {selectedMerchant.status === "pending" && (
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
    </Box>
  );
}
