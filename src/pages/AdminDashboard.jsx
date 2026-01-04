import React, { useEffect, useState } from "react";
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
} from "@mui/material";
import {
  collection,
  onSnapshot,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";

/* 🔐 ADMIN CONFIG */
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

  /* ======================
     STATE
  ====================== */
  const [tab, setTab] = useState(0);

  const [merchants, setMerchants] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [leads, setLeads] = useState([]);

  const [selected, setSelected] = useState([]);

  /* ======================
     LOAD DATA
  ====================== */
  useEffect(() => {
    const unsubMerchants = onSnapshot(
      collection(db, "merchants"),
      (snap) =>
        setMerchants(
          snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        )
    );

    const unsubCustomers = onSnapshot(
      collection(db, "customers"),
      (snap) =>
        setCustomers(
          snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        )
    );

    const unsubLeads = onSnapshot(
      collection(db, "geo_events"),
      (snap) =>
        setLeads(
          snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        )
    );

    return () => {
      unsubMerchants();
      unsubCustomers();
      unsubLeads();
    };
  }, []);

  /* ======================
     SELECTION
  ====================== */
  const toggle = (id) => {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    );
  };

  const selectAll = (rows) =>
    setSelected(rows.map((r) => r.id));

  const clearSelection = () => setSelected([]);

  /* ======================
     DELETE
  ====================== */
  const deleteSelected = async (collectionName) => {
    if (selected.length === 0) return;

    if (
      !window.confirm(
        `Delete ${selected.length} records? This cannot be undone.`
      )
    )
      return;

    for (let id of selected) {
      await deleteDoc(doc(db, collectionName, id));
    }

    setSelected([]);
  };

  /* ======================
     LOGOUT
  ====================== */
  const logout = () => {
    localStorage.clear();
    navigate("/login", { replace: true });
  };

  /* ======================
     UI
  ====================== */
  return (
    <Box sx={{ p: 3 }}>
      <Button
        variant="outlined"
        color="error"
        onClick={logout}
      >
        Logout
      </Button>

      <Typography variant="h4" sx={{ mt: 2 }}>
        Admin Dashboard
      </Typography>

      <Tabs
        value={tab}
        onChange={(e, v) => {
          setTab(v);
          setSelected([]);
        }}
        sx={{ mt: 2 }}
      >
        <Tab label="MERCHANTS" />
        <Tab label="CUSTOMERS" />
        <Tab label="LEADS" />
      </Tabs>

      {/* ======================
         ACTION BAR
      ====================== */}
      <Box sx={{ mt: 2, display: "flex", gap: 2 }}>
        <Button
          size="small"
          onClick={() =>
            selectAll(
              tab === 0
                ? merchants
                : tab === 1
                ? customers
                : leads
            )
          }
        >
          Select All
        </Button>

        <Button
          size="small"
          onClick={clearSelection}
        >
          Unselect All
        </Button>

        <Button
          size="small"
          color="error"
          disabled={selected.length === 0}
          onClick={() =>
            deleteSelected(
              tab === 0
                ? "merchants"
                : tab === 1
                ? "customers"
                : "geo_events"
            )
          }
        >
          Delete Selected
        </Button>
      </Box>

      {/* ======================
         TABLE
      ====================== */}
      <Table size="small" sx={{ mt: 2 }}>
        <TableHead>
          <TableRow>
            <TableCell />
            {tab === 0 && (
              <>
                <TableCell>Shop</TableCell>
                <TableCell>Mobile</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Status</TableCell>
              </>
            )}
            {tab === 1 && (
              <>
                <TableCell>Customer Mobile</TableCell>
                <TableCell>Created</TableCell>
              </>
            )}
            {tab === 2 && (
              <>
                <TableCell>Customer</TableCell>
                <TableCell>Merchant</TableCell>
                <TableCell>Distance</TableCell>
                <TableCell>Time</TableCell>
              </>
            )}
          </TableRow>
        </TableHead>

        <TableBody>
          {(tab === 0
            ? merchants
            : tab === 1
            ? customers
            : leads
          ).map((row) => (
            <TableRow key={row.id}>
              <TableCell>
                <Checkbox
                  checked={selected.includes(row.id)}
                  onChange={() => toggle(row.id)}
                />
              </TableCell>

              {tab === 0 && (
                <>
                  <TableCell>{row.shopName}</TableCell>
                  <TableCell>{row.mobile}</TableCell>
                  <TableCell>{row.category}</TableCell>
                  <TableCell>
                    {row.status || "pending"}
                  </TableCell>
                </>
              )}

              {tab === 1 && (
                <>
                  <TableCell>{row.mobile}</TableCell>
                  <TableCell>
                    {row.createdAt?.toDate?.().toLocaleString?.()}
                  </TableCell>
                </>
              )}

              {tab === 2 && (
                <>
                  <TableCell>{row.customerId}</TableCell>
                  <TableCell>{row.merchantId}</TableCell>
                  <TableCell>
                    {row.distanceMeters} m
                  </TableCell>
                  <TableCell>
                    {row.createdAt?.toDate?.().toLocaleString?.()}
                  </TableCell>
                </>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}
