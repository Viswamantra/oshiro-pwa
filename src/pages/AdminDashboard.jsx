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
  TextField,
  MenuItem,
  Tooltip,
} from "@mui/material";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
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
  const [tab, setTab] = useState(0); // 0=Leads, 1=Analytics
  const [leads, setLeads] = useState([]);
  const [selected, setSelected] = useState([]);

  const [filters, setFilters] = useState({
    customer: "",
    merchant: "",
    merchantMobile: "",
    category: "",
  });

  const [dateRange, setDateRange] = useState("7d");

  /* ======================
     LOAD + JOIN DATA
  ====================== */
  useEffect(() => {
    const loadData = async () => {
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
          merchantName: merchant.shopName || "Unknown",
          merchantMobile: merchant.mobile || "—",
          category: merchant.category || "Unknown",
          distanceMeters: g.distanceMeters || 0,
          createdAt: g.createdAt,
        };
      });

      setLeads(joined);
    };

    loadData();
  }, []);

  /* ======================
     DATE RANGE FILTER
  ====================== */
  const getStartDate = () => {
    const now = new Date();
    if (dateRange === "today")
      return new Date(now.setHours(0, 0, 0, 0));
    if (dateRange === "7d")
      return new Date(Date.now() - 7 * 86400000);
    if (dateRange === "30d")
      return new Date(Date.now() - 30 * 86400000);
    return null;
  };

  const startDate = getStartDate();

  /* ======================
     FILTER OPTIONS
  ====================== */
  const customerOptions = [...new Set(leads.map((l) => l.customerMobile))];
  const merchantOptions = [...new Set(leads.map((l) => l.merchantName))];
  const merchantMobileOptions = [
    ...new Set(leads.map((l) => l.merchantMobile)),
  ];
  const categoryOptions = [...new Set(leads.map((l) => l.category))];

  /* ======================
     FILTERED LEADS
  ====================== */
  const filteredLeads = leads.filter((l) => {
    const timeOk =
      !startDate ||
      (l.createdAt?.toDate &&
        l.createdAt.toDate() >= startDate);

    return (
      timeOk &&
      (!filters.customer ||
        l.customerMobile === filters.customer) &&
      (!filters.merchant ||
        l.merchantName === filters.merchant) &&
      (!filters.merchantMobile ||
        l.merchantMobile === filters.merchantMobile) &&
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
    if (
      !window.confirm(
        "Delete selected LEAD records only?\n(Customers & Merchants are NOT deleted)"
      )
    )
      return;

    for (const id of selected) {
      await deleteDoc(doc(db, "geo_events", id));
    }

    setLeads((p) => p.filter((l) => !selected.includes(l.id)));
    setSelected([]);
  };

  /* ======================
     AGGREGATE ANALYTICS
  ====================== */
  const merchantAnalytics = Object.values(
    filteredLeads.reduce((acc, l) => {
      if (!acc[l.merchantName]) {
        acc[l.merchantName] = {
          merchantName: l.merchantName,
          category: l.category,
          visits: 0,
          customers: new Set(),
          totalDistance: 0,
          lastSeen: l.createdAt,
        };
      }

      acc[l.merchantName].visits++;
      acc[l.merchantName].customers.add(l.customerMobile);
      acc[l.merchantName].totalDistance += l.distanceMeters;

      if (
        l.createdAt &&
        acc[l.merchantName].lastSeen < l.createdAt
      ) {
        acc[l.merchantName].lastSeen = l.createdAt;
      }

      return acc;
    }, {})
  ).map((m) => ({
    merchantName: m.merchantName,
    category: m.category,
    visits: m.visits,
    uniqueCustomers: m.customers.size,
    avgDistance:
      m.visits > 0
        ? Math.round(m.totalDistance / m.visits)
        : 0,
    lastSeen: m.lastSeen,
  }));

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

      <Tabs
        value={tab}
        onChange={(e, v) => setTab(v)}
        sx={{ mt: 2 }}
      >
        <Tab label="Leads" />
        <Tab label="Merchant Analytics" />
      </Tabs>

      <Divider sx={{ my: 2 }} />

      {/* DATE RANGE */}
      <TextField
        select
        size="small"
        label="Date Range"
        value={dateRange}
        onChange={(e) => setDateRange(e.target.value)}
        sx={{ mb: 2 }}
      >
        <MenuItem value="today">Today</MenuItem>
        <MenuItem value="7d">Last 7 Days</MenuItem>
        <MenuItem value="30d">Last 30 Days</MenuItem>
      </TextField>

      {/* ======================
         LEADS TAB
      ====================== */}
      {tab === 0 && (
        <>
          {/* FILTERS */}
          <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
            <TextField
              select
              size="small"
              label="Customer Mobile"
              value={filters.customer}
              onChange={(e) =>
                setFilters({ ...filters, customer: e.target.value })
              }
            >
              <MenuItem value="">All</MenuItem>
              {customerOptions.map((v) => (
                <MenuItem key={v} value={v}>
                  {v}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              size="small"
              label="Merchant Name"
              value={filters.merchant}
              onChange={(e) =>
                setFilters({ ...filters, merchant: e.target.value })
              }
            >
              <MenuItem value="">All</MenuItem>
              {merchantOptions.map((v) => (
                <MenuItem key={v} value={v}>
                  {v}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              size="small"
              label="Merchant Mobile"
              value={filters.merchantMobile}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  merchantMobile: e.target.value,
                })
              }
            >
              <MenuItem value="">All</MenuItem>
              {merchantMobileOptions.map((v) => (
                <MenuItem key={v} value={v}>
                  {v}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              size="small"
              label="Category"
              value={filters.category}
              onChange={(e) =>
                setFilters({ ...filters, category: e.target.value })
              }
            >
              <MenuItem value="">All</MenuItem>
              {categoryOptions.map((v) => (
                <MenuItem key={v} value={v}>
                  {v}
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

            <Tooltip title="Deletes only visit/lead records. Customers & merchants remain.">
              <span>
                <Button
                  sx={{ ml: 2 }}
                  color="error"
                  variant="contained"
                  disabled={!selected.length}
                  onClick={deleteSelected}
                >
                  Delete Selected Leads
                </Button>
              </span>
            </Tooltip>
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
                <TableCell>Customer Mobile</TableCell>
                <TableCell>Merchant Name</TableCell>
                <TableCell>Merchant Mobile</TableCell>
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
                  <TableCell>{l.merchantMobile}</TableCell>
                  <TableCell>{l.category}</TableCell>
                  <TableCell>{l.distanceMeters} m</TableCell>
                  <TableCell>
                    {l.createdAt?.toDate().toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}

      {/* ======================
         ANALYTICS TAB
      ====================== */}
      {tab === 1 && (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Merchant</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Visits</TableCell>
              <TableCell>Unique Customers</TableCell>
              <TableCell>Avg Distance</TableCell>
              <TableCell>Last Seen</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {merchantAnalytics.map((m) => (
              <TableRow key={m.merchantName}>
                <TableCell>{m.merchantName}</TableCell>
                <TableCell>{m.category}</TableCell>
                <TableCell>{m.visits}</TableCell>
                <TableCell>{m.uniqueCustomers}</TableCell>
                <TableCell>{m.avgDistance} m</TableCell>
                <TableCell>
                  {m.lastSeen?.toDate().toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Box>
  );
}
