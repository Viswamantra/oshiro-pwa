import React, { useEffect, useState, useMemo } from "react";
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
  Grid,
  Paper,
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
  useEffect(() =>
    onSnapshot(collection(db, "merchants"), s =>
      setMerchants(s.docs.map(d => ({ id: d.id, ...d.data() })))
    ), []);

  useEffect(() =>
    onSnapshot(collection(db, "customers"), s =>
      setCustomers(s.docs.map(d => ({ id: d.id, ...d.data() })))
    ), []);

  useEffect(() =>
    onSnapshot(query(collection(db, "geo_events"), orderBy("createdAt", "desc")),
      s => setGeoEvents(s.docs.map(d => ({ id: d.id, ...d.data() })))
    ), []);

  useEffect(() =>
    onSnapshot(collection(db, "offers"), s =>
      setOffers(s.docs.map(d => ({ id: d.id, ...d.data() })))
    ), []);

  useEffect(() =>
    onSnapshot(query(collection(db, "admin_alerts"), orderBy("createdAt", "desc")),
      s => setAlerts(s.docs.map(d => ({ id: d.id, ...d.data() })))
    ), []);

  useEffect(() =>
    onSnapshot(collection(db, "categories"), s =>
      setCategories(s.docs.map(d => ({ id: d.id, ...d.data() })))
    ), []);

  /* ================= FILTERED DATA ================= */
  const filteredMerchants = useMemo(() => {
    let data = merchants;
    if (view === "approved") data = data.filter(m => m.status === "approved");
    if (categoryFilter !== "All")
      data = data.filter(m => m.category === categoryFilter);
    return data;
  }, [merchants, view, categoryFilter]);

  /* ================= ALERT ================= */
  const sendAlert = async () => {
    if (!alertMerchant || !alertMsg.trim()) return;
    await addDoc(collection(db, "admin_alerts"), {
      merchantId: alertMerchant,
      message: alertMsg.trim(),
      createdAt: serverTimestamp(),
    });
    setAlertMsg("");
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

      <Typography variant="h6" sx={{ mt: 2 }}>
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
        ].map(([label, count, v]) => (
          <Grid item xs={6} md={2} key={label}>
            <Card onClick={() => setView(v)} sx={{ cursor: "pointer" }}>
              <CardContent sx={{ textAlign: "center" }}>
                <Typography variant="body2">{label}</Typography>
                <Typography variant="h6">{count}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ my: 3 }} />

      {/* ===== FILTER BAR ===== */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              select
              fullWidth
              label="Category Filter"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <MenuItem value="All">All</MenuItem>
              {categories.map(c => (
                <MenuItem key={c.id} value={c.name}>{c.name}</MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {/* ===== MERCHANTS TABLE ===== */}
      {(view === "merchants" || view === "approved") && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1">Merchants</Typography>
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
              {filteredMerchants.map(m => (
                <TableRow key={m.id}>
                  <TableCell>{m.shopName}</TableCell>
                  <TableCell>{m.mobile}</TableCell>
                  <TableCell>{m.category}</TableCell>
                  <TableCell>{m.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* ===== CATEGORY MANAGEMENT (COMPACT) ===== */}
      <Divider sx={{ my: 3 }} />
      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle1">Manage Categories</Typography>

        <TextField
          select
          fullWidth
          sx={{ mt: 1 }}
          label="Select Category"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          {categories.map(c => (
            <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
          ))}
        </TextField>

        <Box sx={{ display: "flex", gap: 2, mt: 1 }}>
          <Button color="error" onClick={deleteCategory} disabled={!selectedCategory}>
            Delete
          </Button>
        </Box>

        <TextField
          fullWidth
          sx={{ mt: 2 }}
          label="Add New Category"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
        />
        <Button sx={{ mt: 1 }} onClick={addCategory} variant="contained">
          Add Category
        </Button>
      </Paper>
    </Box>
  );
}
