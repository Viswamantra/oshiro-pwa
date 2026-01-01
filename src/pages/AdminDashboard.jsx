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
  const [view, setView] = useState("overview");

  const [merchants, setMerchants] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [geoEvents, setGeoEvents] = useState([]);

  const [alerts, setAlerts] = useState([]);
  const [selectedAlerts, setSelectedAlerts] = useState([]);

  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");

  const [alertMerchant, setAlertMerchant] = useState("");
  const [alertMsg, setAlertMsg] = useState("");

  /* ================= LOAD DATA ================= */
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
    const q = query(collection(db, "geo_events"), orderBy("createdAt", "desc"));
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

  useEffect(() => {
    return onSnapshot(collection(db, "categories"), (s) =>
      setCategories(s.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
  }, []);

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

  const toggleAlert = (id) => {
    setSelectedAlerts((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
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

  const deleteCategory = async (id) => {
    await deleteDoc(doc(db, "categories", id));
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
      <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
        <Card onClick={() => setView("merchants")} sx={{ cursor: "pointer" }}>
          <CardContent>
            <Typography>Merchants</Typography>
            <Typography>{merchants.length}</Typography>
          </CardContent>
        </Card>
        <Card onClick={() => setView("customers")} sx={{ cursor: "pointer" }}>
          <CardContent>
            <Typography>Customers</Typography>
            <Typography>{customers.length}</Typography>
          </CardContent>
        </Card>
        <Card onClick={() => setView("geo")} sx={{ cursor: "pointer" }}>
          <CardContent>
            <Typography>Geo Events</Typography>
            <Typography>{geoEvents.length}</Typography>
          </CardContent>
        </Card>
        <Card onClick={() => setView("alerts")} sx={{ cursor: "pointer" }}>
          <CardContent>
            <Typography>Alerts</Typography>
            <Typography>{alerts.length}</Typography>
          </CardContent>
        </Card>
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* ===== ALERT HISTORY TABLE ===== */}
      {view === "alerts" && (
        <>
          <Typography variant="subtitle1">Alert History</Typography>

          <Button
            color="error"
            disabled={!selectedAlerts.length}
            onClick={deleteSelectedAlerts}
          >
            Delete Selected
          </Button>

          <Table>
            <TableHead>
              <TableRow>
                <TableCell />
                <TableCell>Merchant</TableCell>
                <TableCell>Message</TableCell>
                <TableCell>Time</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {alerts.map((a) => (
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
        </>
      )}

      {/* ===== SEND ALERT ===== */}
      <Divider sx={{ my: 3 }} />
      <Typography variant="subtitle1">Send Alert</Typography>

      <TextField
        select
        fullWidth
        label="Merchant"
        value={alertMerchant}
        onChange={(e) => setAlertMerchant(e.target.value)}
        sx={{ mt: 1 }}
      >
        {merchants.map((m) => (
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
        onChange={(e) => setAlertMsg(e.target.value)}
      />

      <Button sx={{ mt: 1 }} variant="contained" onClick={sendAlert}>
        Send Alert
      </Button>

      {/* ===== CATEGORY MANAGEMENT ===== */}
      <Divider sx={{ my: 3 }} />
      <Typography variant="subtitle1">Manage Categories</Typography>

      <TextField
        fullWidth
        label="New Category"
        value={newCategory}
        onChange={(e) => setNewCategory(e.target.value)}
        sx={{ mt: 1 }}
      />
      <Button sx={{ mt: 1 }} onClick={addCategory} variant="contained">
        Add Category
      </Button>

      <Table sx={{ mt: 2 }}>
        <TableHead>
          <TableRow>
            <TableCell>Category</TableCell>
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {categories.map((c) => (
            <TableRow key={c.id}>
              <TableCell>{c.name}</TableCell>
              <TableCell>
                <Button color="error" onClick={() => deleteCategory(c.id)}>
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}
