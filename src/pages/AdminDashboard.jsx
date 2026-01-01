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
  deleteDoc,
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

  /* ===== LOGOUT ===== */
  const logout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  /* ================= STATE ================= */
  const [activeView, setActiveView] = useState("overview");

  const [merchants, setMerchants] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [geoEvents, setGeoEvents] = useState([]);

  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    return onSnapshot(collection(db, "merchants"), (snap) =>
      setMerchants(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
  }, []);

  useEffect(() => {
    return onSnapshot(collection(db, "customers"), (snap) =>
      setCustomers(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, "geo_events"),
      orderBy("createdAt", "desc")
    );
    return onSnapshot(q, (snap) =>
      setGeoEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
  }, []);

  useEffect(() => {
    return onSnapshot(collection(db, "categories"), (snap) =>
      setCategories(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
  }, []);

  /* ================= CATEGORY CRUD ================= */
  const addCategory = async () => {
    if (!newCategory.trim()) return;
    await addDoc(collection(db, "categories"), {
      name: newCategory.trim(),
      createdAt: serverTimestamp(),
    });
    setNewCategory("");
  };

  const deleteCategory = async (id) => {
    if (!window.confirm("Delete category?")) return;
    await deleteDoc(doc(db, "categories", id));
  };

  /* ================= HELPERS ================= */
  const approvedMerchants = merchants.filter(
    (m) => m.status === "approved"
  );

  /* ================= UI ================= */
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
        <Card onClick={() => setActiveView("merchants")} sx={{ cursor: "pointer" }}>
          <CardContent>
            <Typography>Merchants</Typography>
            <Typography variant="h6">{merchants.length}</Typography>
          </CardContent>
        </Card>

        <Card onClick={() => setActiveView("approved")} sx={{ cursor: "pointer" }}>
          <CardContent>
            <Typography>Approved</Typography>
            <Typography variant="h6">{approvedMerchants.length}</Typography>
          </CardContent>
        </Card>

        <Card onClick={() => setActiveView("customers")} sx={{ cursor: "pointer" }}>
          <CardContent>
            <Typography>Customers</Typography>
            <Typography variant="h6">{customers.length}</Typography>
          </CardContent>
        </Card>

        <Card onClick={() => setActiveView("geo")} sx={{ cursor: "pointer" }}>
          <CardContent>
            <Typography>Geo Events</Typography>
            <Typography variant="h6">{geoEvents.length}</Typography>
          </CardContent>
        </Card>
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* ================= LIST VIEWS ================= */}
      {activeView === "merchants" &&
        merchants.map((m) => (
          <Typography key={m.id}>
            {m.shopName || "Unnamed"} — {m.mobile} — {m.status}
          </Typography>
        ))}

      {activeView === "approved" &&
        approvedMerchants.map((m) => (
          <Typography key={m.id}>
            {m.shopName || "Unnamed"} — {m.mobile}
          </Typography>
        ))}

      {activeView === "customers" &&
        customers.map((c) => (
          <Typography key={c.id}>{c.mobile}</Typography>
        ))}

      {activeView === "geo" &&
        geoEvents.map((g) => (
          <Typography key={g.id}>
            Merchant: {g.merchantId} — {g.distanceMeters}m
          </Typography>
        ))}

      <Divider sx={{ my: 3 }} />

      {/* ================= CATEGORY MANAGEMENT ================= */}
      <Typography variant="subtitle1">Manage Categories</Typography>

      <TextField
        label="New Category"
        fullWidth
        sx={{ mt: 1 }}
        value={newCategory}
        onChange={(e) => setNewCategory(e.target.value)}
      />

      <Button sx={{ mt: 1 }} variant="contained" onClick={addCategory}>
        Add Category
      </Button>

      {categories.map((c) => (
        <Box key={c.id} sx={{ mt: 1 }}>
          <Typography>{c.name}</Typography>
          <Button size="small" color="error" onClick={() => deleteCategory(c.id)}>
            Delete
          </Button>
        </Box>
      ))}
    </Box>
  );
}
