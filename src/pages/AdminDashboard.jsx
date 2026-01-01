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
  Checkbox,
  Paper,
  Grid,
} from "@mui/material";
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  orderBy,
  where,
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

  const logout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  /* ================= STATE ================= */
  const [view, setView] = useState("merchants");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const [merchants, setMerchants] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [geoEvents, setGeoEvents] = useState([]);
  const [offers, setOffers] = useState([]);
  const [alerts, setAlerts] = useState([]);

  const [selectedAlerts, setSelectedAlerts] = useState([]);

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [newCategory, setNewCategory] = useState("");

  const [alertMerchant, setAlertMerchant] = useState("");
  const [alertMsg, setAlertMsg] = useState("");

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    return onSnapshot(collection(db, "merchants"), s =>
      setMerchants(s.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  }, []);

  useEffect(() => {
    return onSnapshot(collection(db, "customers"), s =>
      setCustomers(s.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  }, []);

  useEffect(() => {
    const q = query(collection(db, "geo_events"), orderBy("createdAt", "desc"));
    return onSnapshot(q, s =>
      setGeoEvents(s.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  }, []);

  useEffect(() => {
    const q = query(collection(db, "offers"), orderBy("createdAt", "desc"));
    return onSnapshot(q, s =>
      setOffers(s.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  }, []);

  useEffect(() => {
    const q = query(collection(db, "admin_alerts"), orderBy("createdAt", "desc"));
    return onSnapshot(q, s =>
      setAlerts(s.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  }, []);

  useEffect(() => {
    return onSnapshot(collection(db, "categories"), s =>
      setCategories(s.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  }, []);

  /* ================= FILTER HELPER ================= */
  const byCategory = list =>
    categoryFilter === "All"
      ? list
      : list.filter(i => i.category === categoryFilter);

  /* ================= ALERT ACTIONS ================= */
  const sendAlert = async () => {
    if (!alertMerchant || !alertMsg.trim()) return;

    await addDoc(collection(db, "admin_alerts"), {
      merchantId: alertMerchant,
      message: alertMsg.trim(),
      createdAt: serverTimestamp(),
    });

    setAlertMsg("");
  };

  const toggleAlert = id => {
    setSelectedAlerts(p =>
      p.includes(id) ? p.filter(x => x !== id) : [...p, id]
    );
  };

  const deleteSelectedAlerts = async () => {
    for (const id of selectedAlerts) {
      await deleteDoc(doc(db, "admin_alerts", id));
    }
    setSelectedAlerts([]);
  };

  /* ================= CATEGORY ================= */
  const addCategory = async () => {
    if (!newCategory.trim()) return;
    await addDoc(collection(db, "categories"), {
      name: newCategory.trim(),
      createdAt: serverTimestamp(),
    });
    setNewCategory("");
  };

  const deleteCategory = async () => {
    if (!selectedCategory) return;
    await deleteDoc(doc(db, "categories", selectedCategory));
    setSelectedCategory("");
  };

  /* ================= UI ================= */
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
        {[
          ["Merchants", merchants.length, "merchants"],
          ["Approved", merchants.filter(m => m.status === "approved").length, "approved"],
          ["Customers", customers.length, "customers"],
          ["Offers", offers.length, "offers"],
          ["Geo Events", geoEvents.length, "geo"],
          ["Alerts", alerts.length, "alerts"],
        ].map(([label, count, key]) => (
          <Grid item xs={6} md={2} key={key}>
            <Card onClick={() => setView(key)} sx={{ cursor: "pointer" }}>
              <CardContent>
                <Typography>{label}</Typography>
                <Typography variant="h6">{count}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* ===== CATEGORY FILTER ===== */}
      <TextField
        select
        label="Category Filter"
        value={categoryFilter}
        onChange={e => setCategoryFilter(e.target.value)}
        sx={{ mt: 3, width: 300 }}
      >
        <MenuItem value="All">All</MenuItem>
        {categories.map(c => (
          <MenuItem key={c.id} value={c.name}>
            {c.name}
          </MenuItem>
        ))}
      </TextField>

      <Divider sx={{ my: 3 }} />

      {/* ===== TABLES ===== */}
      {view === "merchants" && (
        <DataTable
          title="All Merchants"
          rows={byCategory(merchants)}
          cols={["shopName", "mobile", "category", "status"]}
        />
      )}

      {view === "approved" && (
        <DataTable
          title="Approved Merchants"
          rows={byCategory(merchants.filter(m => m.status === "approved"))}
          cols={["shopName", "mobile", "category"]}
        />
      )}

      {view === "customers" && (
        <DataTable
          title="Customers"
          rows={byCategory(customers)}
          cols={["mobile", "category"]}
        />
      )}

      {view === "offers" && (
        <DataTable
          title="Offers"
          rows={offers}
          cols={["merchantId", "title", "active"]}
        />
      )}

      {view === "geo" && (
        <DataTable
          title="Geo Events"
          rows={geoEvents}
          cols={["merchantId", "customerId", "distanceMeters"]}
        />
      )}

      {view === "alerts" && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6">Alert History</Typography>
          <Button
            color="error"
            disabled={!selectedAlerts.length}
            onClick={deleteSelectedAlerts}
          >
            Delete Selected
          </Button>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell />
                <TableCell>Merchant</TableCell>
                <TableCell>Message</TableCell>
                <TableCell>Time</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {alerts.map(a => (
                <TableRow key={a.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedAlerts.includes(a.id)}
                      onChange={() => toggleAlert(a.id)}
                    />
                  </TableCell>
                  <TableCell>{a.merchantId}</TableCell>
                  <TableCell>{a.message}</TableCell>
                  <TableCell>
                    {a.createdAt?.toDate?.().toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* ===== SEND ALERT ===== */}
      <Divider sx={{ my: 4 }} />
      <Typography variant="h6">Send Alert to Merchant</Typography>

      <TextField
        select
        fullWidth
        label="Merchant"
        value={alertMerchant}
        onChange={e => setAlertMerchant(e.target.value)}
        sx={{ mt: 1 }}
      >
        {merchants.map(m => (
          <MenuItem key={m.id} value={m.id}>
            {m.shopName || "Unnamed"} — {m.mobile}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        fullWidth
        multiline
        rows={3}
        sx={{ mt: 1 }}
        label="Message"
        value={alertMsg}
        onChange={e => setAlertMsg(e.target.value)}
      />

      <Button sx={{ mt: 1 }} variant="contained" onClick={sendAlert}>
        Send Alert
      </Button>

      {/* ===== CATEGORY MANAGEMENT ===== */}
      <Divider sx={{ my: 4 }} />
      <Typography variant="h6">Manage Categories</Typography>

      <TextField
        select
        fullWidth
        label="Select Category"
        value={selectedCategory}
        onChange={e => setSelectedCategory(e.target.value)}
        sx={{ mt: 1 }}
      >
        {categories.map(c => (
          <MenuItem key={c.id} value={c.id}>
            {c.name}
          </MenuItem>
        ))}
      </TextField>

      <Button color="error" sx={{ mt: 1 }} onClick={deleteCategory}>
        Delete Category
      </Button>

      <TextField
        fullWidth
        label="Add New Category"
        value={newCategory}
        onChange={e => setNewCategory(e.target.value)}
        sx={{ mt: 2 }}
      />

      <Button sx={{ mt: 1 }} variant="contained" onClick={addCategory}>
        Add Category
      </Button>
    </Box>
  );
}

/* ===== GENERIC TABLE ===== */
function DataTable({ title, rows, cols }) {
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6">{title}</Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            {cols.map(c => (
              <TableCell key={c}>{c}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map(r => (
            <TableRow key={r.id}>
              {cols.map(c => (
                <TableCell key={c}>{String(r[c] ?? "-")}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
}
