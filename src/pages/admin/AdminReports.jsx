import React, { useEffect, useState, useMemo } from "react";
import { Box, Grid, Paper, Typography, Button } from "@mui/material";
import { db } from "../../firebase";
import {
  collection,
  onSnapshot,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { ResponsivePie } from "@nivo/pie";
import { ResponsiveBar } from "@nivo/bar";

/* ======================
   COLORS
====================== */
const COLORS = [
  "#1f2937",
  "#ff6b00",
  "#f59e0b",
  "#10b981",
  "#8b5cf6",
];

export default function AdminReports() {
  const [merchants, setMerchants] = useState([]);
  const [offers, setOffers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [leads, setLeads] = useState([]);

  const [selected, setSelected] = useState([]);

  /* ======================
     SNAPSHOTS
  ====================== */
  useEffect(() => {
    const u1 = onSnapshot(collection(db, "merchants"), (snap) =>
      setMerchants(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    const u2 = onSnapshot(collection(db, "offers"), (snap) =>
      setOffers(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    const u3 = onSnapshot(collection(db, "customers"), (snap) =>
      setCustomers(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    const u4 = onSnapshot(collection(db, "leads"), (snap) =>
      setLeads(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    return () => {
      u1();
      u2();
      u3();
      u4();
    };
  }, []);

  /* ======================
     ANALYTICS
  ====================== */
  const merchantsByCategory = useMemo(() => {
    const map = {};
    merchants.forEach((m) => {
      const key = m.category || "Unknown";
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).map(([id, value]) => ({
      id,
      label: id,
      value,
    }));
  }, [merchants]);

  const offersByCategory = useMemo(() => {
    const map = {};
    offers.forEach((o) => {
      const key = o.categoryName || o.category || "Unknown";
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).map(([category, value]) => ({
      category,
      value,
    }));
  }, [offers]);

  const merchantStatus = useMemo(() => {
    const approved = merchants.filter(
      (m) => m.status === "approved"
    ).length;
    const pending = merchants.filter(
      (m) => m.status === "pending"
    ).length;
    const rejected = merchants.filter(
      (m) => m.status === "rejected"
    ).length;

    return [
      { status: "Approved", count: approved },
      { status: "Pending", count: pending },
      { status: "Rejected", count: rejected },
    ];
  }, [merchants]);

  const offersActiveExpired = useMemo(() => {
    const now = new Date();
    const active = offers.filter(
      (o) => !o.expiryDate || new Date(o.expiryDate) >= now
    ).length;
    const expired = offers.length - active;

    return [
      { id: "active", label: "Active", value: active },
      { id: "expired", label: "Expired", value: expired },
    ];
  }, [offers]);

  /* ======================
     LEADS SELECTION
  ====================== */
  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selected.length === leads.length) {
      setSelected([]);
    } else {
      setSelected(leads.map((l) => l.id));
    }
  };

  /* ======================
     DELETE ACTIONS
  ====================== */
  const deleteOne = async (id) => {
    if (!window.confirm("Delete this lead permanently?")) return;
    await deleteDoc(doc(db, "leads", id));
  };

  const bulkDelete = async () => {
    if (selected.length === 0) return;

    if (
      !window.confirm(
        `Delete ${selected.length} lead(s) permanently?`
      )
    )
      return;

    await Promise.all(
      selected.map((id) => deleteDoc(doc(db, "leads", id)))
    );

    setSelected([]);
  };

  /* ======================
     UI
  ====================== */
  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Admin Reports
      </Typography>

      {/* ======= ANALYTICS ======= */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography>Merchants by Category</Typography>
            <div style={{ height: 300 }}>
              <ResponsivePie data={merchantsByCategory} />
            </div>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography>Offers by Category</Typography>
            <div style={{ height: 300 }}>
              <ResponsiveBar
                data={offersByCategory}
                keys={["value"]}
                indexBy="category"
              />
            </div>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography>Merchant Status</Typography>
            <div style={{ height: 260 }}>
              <ResponsiveBar
                data={merchantStatus}
                keys={["count"]}
                indexBy="status"
              />
            </div>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography>Offers: Active vs Expired</Typography>
            <div style={{ height: 260 }}>
              <ResponsivePie data={offersActiveExpired} />
            </div>
          </Paper>
        </Grid>
      </Grid>

      {/* ======= LEADS TABLE ======= */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Leads
        </Typography>

        {selected.length > 0 && (
          <Button
            color="error"
            variant="contained"
            sx={{ mb: 2 }}
            onClick={bulkDelete}
          >
            Delete Selected ({selected.length})
          </Button>
        )}

        <Paper>
          <table width="100%" cellPadding="10">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={
                      leads.length > 0 &&
                      selected.length === leads.length
                    }
                    onChange={selectAll}
                  />
                </th>
                <th>Customer</th>
                <th>Mobile</th>
                <th>Merchant</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {leads.length === 0 && (
                <tr>
                  <td colSpan="6" align="center">
                    No leads found
                  </td>
                </tr>
              )}

              {leads.map((l) => (
                <tr key={l.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.includes(l.id)}
                      onChange={() => toggleSelect(l.id)}
                    />
                  </td>
                  <td>{l.customerName || "—"}</td>
                  <td>{l.customerMobile || "—"}</td>
                  <td>{l.merchantName || "—"}</td>
                  <td>
                    {l.createdAt?.seconds
                      ? new Date(
                          l.createdAt.seconds * 1000
                        ).toLocaleString()
                      : "—"}
                  </td>
                  <td>
                    <Button
                      color="error"
                      size="small"
                      onClick={() => deleteOne(l.id)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Paper>
      </Box>
    </Box>
  );
}
