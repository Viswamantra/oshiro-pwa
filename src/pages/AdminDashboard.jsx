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
} from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";

/* 🔐 ADMIN CONSTANTS */
const ADMIN_MOBILE = "7386361725";

export default function AdminDashboard() {
  const navigate = useNavigate();

  /* ======================
     🔐 ADMIN AUTH GUARD
  ====================== */
  useEffect(() => {
    const role = localStorage.getItem("oshiro_role");
    const adminMobile = localStorage.getItem("oshiro_admin_mobile");
    const isAuthed = localStorage.getItem("oshiro_admin_auth");

    if (
      role !== "admin" ||
      adminMobile !== ADMIN_MOBILE ||
      isAuthed !== "true"
    ) {
      localStorage.clear();
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  /* ======================
     LOGOUT
  ====================== */
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
  const [alerts, setAlerts] = useState([]);

  const [selected, setSelected] = useState([]);
  const [activeMerchant, setActiveMerchant] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

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

  useEffect(() => {
    const q = query(
      collection(db, "admin_alerts"),
      orderBy("createdAt", "desc")
    );
    return onSnapshot(q, (s) =>
      setAlerts(s.docs.map((d) => ({ id: d.id, ...d.data() })))
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
     BULK DELETE
  ====================== */
  const bulkDelete = async () => {
    if (!selected.length) return;

    const map = {
      merchants: "merchants",
      approved: "merchants",
      customers: "customers",
      offers: "offers",
      geo: "geo_events",
      alerts: "admin_alerts",
    };

    const col = map[view];
    if (!col) return;

    for (const id of selected) {
      await deleteDoc(doc(db, col, id));
    }

    clearSelection();
  };

  /* ======================
     MERCHANT APPROVAL
  ====================== */
  const approveMerchant = async () => {
    await updateDoc(doc(db, "merchants", activeMerchant.id), {
      status: "approved",
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
     TABLE RENDER
  ====================== */
  const renderTable = (rows, columns) => (
    <>
      {selected.length > 0 && (
        <Button
          color="error"
          variant="contained"
          sx={{ mb: 1 }}
          onClick={bulkDelete}
        >
          Delete Selected ({selected.length})
        </Button>
      )}

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell />
            {columns.map((c) => (
              <TableCell key={c}>{c}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((r) => (
            <TableRow
              key={r.id}
              hover
              sx={{
                cursor:
                  view === "merchants" ? "pointer" : "default",
              }}
              onClick={() =>
                view === "merchants" && setActiveMerchant(r)
              }
            >
              <TableCell>
                <Checkbox
                  checked={selected.includes(r.id)}
                  onChange={() => toggleSelect(r.id)}
                />
              </TableCell>
              {columns.map((c) => (
                <TableCell key={c}>
                  {r[c] ?? "-"}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
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

      <Grid container spacing={2} sx={{ mt: 2 }}>
        {[
          ["Merchants", merchants.length, "merchants"],
          [
            "Approved",
            merchants.filter((m) => m.status === "approved").length,
            "approved",
          ],
          ["Customers", customers.length, "customers"],
          ["Offers", offers.length, "offers"],
          ["Geo Events", geoEvents.length, "geo"],
          ["Alerts", alerts.length, "alerts"],
        ].map(([label, count, key]) => (
          <Grid item xs={6} md={2} key={key}>
            <Card
              sx={{ cursor: "pointer" }}
              onClick={() => {
                setView(key);
                clearSelection();
              }}
            >
              <CardContent>
                <Typography>{label}</Typography>
                <Typography variant="h6">{count}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ my: 3 }} />

      {view === "merchants" &&
        renderTable(merchants, [
          "shopName",
          "mobile",
          "category",
          "status",
        ])}

      {view === "approved" &&
        renderTable(
          merchants.filter((m) => m.status === "approved"),
          ["shopName", "mobile", "category"]
        )}

      {view === "customers" &&
        renderTable(customers, ["mobile", "category"])}

      {view === "offers" &&
        renderTable(offers, ["title", "merchantId", "active"])}

      {view === "geo" &&
        renderTable(geoEvents, [
          "merchantId",
          "customerId",
          "distanceMeters",
        ])}

      {view === "alerts" &&
        renderTable(alerts, ["merchantId", "message"])}

      {/* APPROVAL DIALOG */}
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
    </Box>
  );
}
