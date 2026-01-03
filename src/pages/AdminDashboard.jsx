import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Divider,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Checkbox,
  Tabs,
  Tab,
  MenuItem,
  TextField,
} from "@mui/material";
import {
  collection,
  onSnapshot,
  getDocs,
  doc,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";

/* ======================
   ADMIN CONFIG
====================== */
const ADMIN_MOBILE = "7386361725";

export default function AdminDashboard() {
  const navigate = useNavigate();

  /* ======================
     AUTH GUARD
  ====================== */
  useEffect(() => {
    const role = localStorage.getItem("oshiro_role");
    const user = JSON.parse(localStorage.getItem("oshiro_user") || "{}");
    if (role !== "admin" || user.mobile !== ADMIN_MOBILE) {
      localStorage.clear();
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  const logout = () => {
    localStorage.clear();
    navigate("/login", { replace: true });
  };

  /* ======================
     STATE
  ====================== */
  const [tab, setTab] = useState(1); // default LEADS
  const [leads, setLeads] = useState([]);
  const [selected, setSelected] = useState([]);

  const [filters, setFilters] = useState({
    mobile: "",
    merchant: "",
    category: "",
  });

  /* ======================
     LOAD + JOIN GEO EVENTS
  ====================== */
  useEffect(() => {
    const loadLeads = async () => {
      const geoSnap = await getDocs(
        query(collection(db, "geo_events"), orderBy("createdAt", "desc"))
      );
      const custSnap = await getDocs(collection(db, "customers"));
      const merchSnap = await getDocs(collection(db, "merchants"));

      const customers = {};
      custSnap.forEach((d) => (customers[d.id] = d.data()));

      const merchants = {};
      merchSnap.forEach((d) => (merchants[d.id] = d.data()));

      const joined = geoSnap.docs.map((d) => {
        const g = d.data();
        const customer = customers[g.customerId] || {};
        const merchant = merchants[g.merchantId] || {};

        return {
          id: d.id,
          customerMobile: customer.mobile || g.customerId,
          merchantName: merchant.shopName || "-",
          category: merchant.category || "-",
          distanceMeters: g.distanceMeters,
          createdAt: g.createdAt,
        };
      });

      setLeads(joined);
    };

    loadLeads();
  }, []);

  /* ======================
     FILTER OPTIONS
  ====================== */
  const mobileOptions = [...new Set(leads.map((l) => l.customerMobile))];
  const merchantOptions = [...new Set(leads.map((l) => l.merchantName))];
  const categoryOptions = [...new Set(leads.map((l) => l.category))];

  /* ======================
     FILTERED LEADS
  ====================== */
  const filteredLeads = leads.filter((l) => {
    return (
      (!filters.mobile || l.customerMobile === filters.mobile) &&
      (!filters.merchant || l.merchantName === filters.merchant) &&
      (!filters.category || l.category === filters.category)
    );
  });

  /* ======================
     SELECTION
  ====================== */
  const toggle = (id) => {
    setSelected((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id]
    );
  };

  const selectAll = () => {
    setSelected(
      selected.length === filteredLeads.length
        ? []
        : filteredLeads.map((l) => l.id)
    );
  };

  const deleteSelected = async () => {
    if (!selected.length) return;
    if (!window.confirm("Delete selected leads?")) return;

    for (const id of selected) {
      await deleteDoc(doc(db, "geo_events", id));
    }
    setSelected([]);
    setLeads((p) => p.filter((l) => !selected.includes(l.id)));
  };

  /* ======================
     UI
  ====================== */
  return (
    <Box sx={{ p: 2 }}>
      <Button color="error" variant="outlined" onClick={logout}>
        Logout
      </Button>

      <Typography variant="h5" sx={{ mt: 2 }}>
        Admin Dashboard
      </Typography>

      <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mt: 2 }}>
        <Tab label="Leads" />
      </Tabs>

      <Divider sx={{ my: 2 }} />

      {/* FILTERS */}
      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
        <TextField
          select
          label="Customer Mobile"
          size="small"
          value={filters.mobile}
          onChange={(e) =>
            setFilters({ ...filters, mobile: e.target.value })
          }
        >
          <MenuItem value="">All</MenuItem>
          {mobileOptions.map((m) => (
            <MenuItem key={m} value={m}>
              {m}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="Merchant"
          size="small"
          value={filters.merchant}
          onChange={(e) =>
            setFilters({ ...filters, merchant: e.target.value })
          }
        >
          <MenuItem value="">All</MenuItem>
          {merchantOptions.map((m) => (
            <MenuItem key={m} value={m}>
              {m}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="Category"
          size="small"
          value={filters.category}
          onChange={(e) =>
            setFilters({ ...filters, category: e.target.value })
          }
        >
          <MenuItem value="">All</MenuItem>
          {categoryOptions.map((c) => (
            <MenuItem key={c} value={c}>
              {c}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      {/* ACTIONS */}
      <Box sx={{ mb: 2 }}>
        <Button onClick={selectAll}>
          {selected.length === filteredLeads.length
            ? "Unselect All"
            : "Select All"}
        </Button>
        <Button
          sx={{ ml: 2 }}
          color="error"
          variant="contained"
          disabled={!selected.length}
          onClick={deleteSelected}
        >
          Delete Selected
        </Button>
      </Box>

      {/* TABLE */}
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox">
              <Checkbox
                checked={
                  filteredLeads.length > 0 &&
                  selected.length === filteredLeads.length
                }
                indeterminate={
                  selected.length > 0 &&
                  selected.length < filteredLeads.length
                }
                onChange={selectAll}
              />
            </TableCell>
            <TableCell>Customer</TableCell>
            <TableCell>Merchant</TableCell>
            <TableCell>Category</TableCell>
            <TableCell>Distance</TableCell>
            <TableCell>Time</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredLeads.map((l) => (
            <TableRow key={l.id}>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={selected.includes(l.id)}
                  onChange={() => toggle(l.id)}
                />
              </TableCell>
              <TableCell>{l.customerMobile}</TableCell>
              <TableCell>{l.merchantName}</TableCell>
              <TableCell>{l.category}</TableCell>
              <TableCell>{l.distanceMeters} m</TableCell>
              <TableCell>
                {l.createdAt?.toDate().toLocaleString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}
