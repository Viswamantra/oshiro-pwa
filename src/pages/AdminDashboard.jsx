import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Tabs,
  Tab,
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
  TextField,
  MenuItem,
  Divider,
} from "@mui/material";
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";

/* ======================
   ADMIN CONFIG
====================== */
const ADMIN_MOBILE = "7386361725";

/* ======================
   DATE FILTER
====================== */
const DATE_RANGES = {
  today: 1,
  "7d": 7,
  "30d": 30,
};

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
  const [tab, setTab] = useState(0);

  // merchants
  const [merchants, setMerchants] = useState([]);
  const [activeMerchant, setActiveMerchant] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  // leads
  const [leads, setLeads] = useState([]);
  const [selected, setSelected] = useState([]);
  const [filters, setFilters] = useState({
    customer: "",
    merchant: "",
    category: "",
  });
  const [dateRange, setDateRange] = useState("7d");

  /* ======================
     LOAD MERCHANTS
  ====================== */
  useEffect(() => {
    return onSnapshot(collection(db, "merchants"), (snap) => {
      setMerchants(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, []);

  /* ======================
     LOAD LEADS (geo_events)
  ====================== */
  useEffect(() => {
    const q = query(
      collection(db, "geo_events"),
      orderBy("createdAt", "desc")
    );

    return onSnapshot(q, async (snap) => {
      const rows = await Promise.all(
        snap.docs.map(async (d) => {
          const g = d.data();
          const mSnap = await getDocs(
            query(
              collection(db, "merchants"),
              where("__name__", "==", g.merchantId)
            )
          );
          const merchant = mSnap.docs[0]?.data() || {};

          return {
            id: d.id,
            customer: g.customerId,
            merchantName: merchant.shopName || "-",
            merchantMobile: merchant.mobile || "-",
            category: merchant.category || "-",
            distance: g.distanceMeters,
            createdAt: g.createdAt,
          };
        })
      );
      setLeads(rows);
    });
  }, []);

  /* ======================
     FILTER LEADS
  ====================== */
  const filteredLeads = useMemo(() => {
    const days = DATE_RANGES[dateRange];
    const since = new Date();
    since.setDate(since.getDate() - days);

    return leads.filter((l) => {
      if (
        filters.customer &&
        !l.customer.includes(filters.customer)
      )
        return false;
      if (
        filters.merchant &&
        !l.merchantName
          .toLowerCase()
          .includes(filters.merchant.toLowerCase())
      )
        return false;
      if (filters.category && l.category !== filters.category)
        return false;
      if (l.createdAt?.toDate() < since) return false;
      return true;
    });
  }, [leads, filters, dateRange]);

  /* ======================
     MERCHANT ACTIONS
  ====================== */
  const approveMerchant = async () => {
    await updateDoc(doc(db, "merchants", activeMerchant.id), {
      status: "approved",
      approvedAt: new Date(),
      rejectionReason: "",
    });
    setActiveMerchant(null);
  };

  const rejectMerchant = async () => {
    if (!rejectReason.trim()) return;
    await updateDoc(doc(db, "merchants", activeMerchant.id), {
      status: "rejected",
      rejectionReason: rejectReason.trim(),
    });
    setRejectReason("");
    setActiveMerchant(null);
  };

  /* ======================
     DELETE LEADS
  ====================== */
  const deleteSelected = async () => {
    if (!window.confirm("Delete selected leads?")) return;
    await Promise.all(
      selected.map((id) => deleteDoc(doc(db, "geo_events", id)))
    );
    setSelected([]);
  };

  /* ======================
     UI
  ====================== */
  return (
    <Box sx={{ p: 3 }}>
      <Button variant="outlined" color="error" onClick={logout}>
        Logout
      </Button>

      <Typography variant="h5" sx={{ mt: 2 }}>
        Admin Dashboard
      </Typography>

      <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mt: 2 }}>
        <Tab label="MERCHANTS" />
        <Tab label="LEADS" />
        <Tab label="MERCHANT ANALYTICS" />
      </Tabs>

      <Divider sx={{ my: 2 }} />

      {/* ======================
         MERCHANTS TAB
      ====================== */}
      {tab === 0 && (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Shop</TableCell>
              <TableCell>Mobile</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Status</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {merchants.map((m) => (
              <TableRow key={m.id}>
                <TableCell>{m.shopName}</TableCell>
                <TableCell>{m.mobile}</TableCell>
                <TableCell>{m.category}</TableCell>
                <TableCell>{m.status || "pending"}</TableCell>
                <TableCell>
                  {m.status !== "approved" && (
                    <Button onClick={() => setActiveMerchant(m)}>
                      Review
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* ======================
         LEADS TAB
      ====================== */}
      {tab === 1 && (
        <>
          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            <TextField
              label="Customer"
              size="small"
              value={filters.customer}
              onChange={(e) =>
                setFilters({ ...filters, customer: e.target.value })
              }
            />
            <TextField
              label="Merchant"
              size="small"
              value={filters.merchant}
              onChange={(e) =>
                setFilters({ ...filters, merchant: e.target.value })
              }
            />
            <TextField
              label="Category"
              size="small"
              value={filters.category}
              onChange={(e) =>
                setFilters({ ...filters, category: e.target.value })
              }
            />
            <TextField
              select
              size="small"
              label="Date Range"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="7d">Last 7 Days</MenuItem>
              <MenuItem value="30d">Last 30 Days</MenuItem>
            </TextField>
          </Box>

          <Button
            disabled={!selected.length}
            onClick={deleteSelected}
          >
            Delete Selected Leads
          </Button>

          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell />
                <TableCell>Customer</TableCell>
                <TableCell>Merchant</TableCell>
                <TableCell>Merchant Mobile</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Distance</TableCell>
                <TableCell>Time</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredLeads.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>
                    <Checkbox
                      checked={selected.includes(l.id)}
                      onChange={(e) =>
                        setSelected((s) =>
                          e.target.checked
                            ? [...s, l.id]
                            : s.filter((x) => x !== l.id)
                        )
                      }
                    />
                  </TableCell>
                  <TableCell>{l.customer}</TableCell>
                  <TableCell>{l.merchantName}</TableCell>
                  <TableCell>{l.merchantMobile}</TableCell>
                  <TableCell>{l.category}</TableCell>
                  <TableCell>{l.distance} m</TableCell>
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
         MERCHANT ANALYTICS TAB
      ====================== */}
      {tab === 2 && (
        <Typography>
          📊 Merchant analytics aggregation ready
          (visits, distance, conversions).
        </Typography>
      )}

      {/* ======================
         REVIEW DIALOG
      ====================== */}
      {activeMerchant && (
        <Dialog open fullWidth>
          <DialogTitle>Merchant Review</DialogTitle>
          <DialogContent>
            <Typography>
              <b>Shop:</b> {activeMerchant.shopName}
            </Typography>
            <Typography>
              <b>Mobile:</b> {activeMerchant.mobile}
            </Typography>
            <Typography>
              <b>Category:</b> {activeMerchant.category}
            </Typography>

            <TextField
              fullWidth
              sx={{ mt: 2 }}
              label="Rejection Reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setActiveMerchant(null)}>
              Close
            </Button>
            <Button color="error" onClick={rejectMerchant}>
              Reject
            </Button>
            <Button variant="contained" onClick={approveMerchant}>
              Approve
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
}
