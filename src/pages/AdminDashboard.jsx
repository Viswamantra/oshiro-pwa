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
  updateDoc,
  serverTimestamp,
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
      (s) =>
        setMerchants(
          s.docs.map((d) => ({ id: d.id, ...d.data() }))
        )
    );

    const unsubCustomers = onSnapshot(
      collection(db, "customers"),
      (s) =>
        setCustomers(
          s.docs.map((d) => ({ id: d.id, ...d.data() }))
        )
    );

    const unsubLeads = onSnapshot(
      collection(db, "geo_events"),
      (s) =>
        setLeads(
          s.docs.map((d) => ({ id: d.id, ...d.data() }))
        )
    );

    return () => {
      unsubMerchants();
      unsubCustomers();
      unsubLeads();
    };
  }, []);

  /* ======================
     MERCHANT ACTIONS (🔥 RESTORED)
  ====================== */
  const approveMerchant = async (id) => {
    await updateDoc(doc(db, "merchants", id), {
      status: "approved",
      approvedAt: serverTimestamp(),
    });
  };

  const rejectMerchant = async (id) => {
    await updateDoc(doc(db, "merchants", id), {
      status: "rejected",
      rejectionReason: "Rejected by admin",
    });
  };

  /* ======================
     SELECTION HELPERS
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
     DELETE HANDLER
  ====================== */
  const deleteSelected = async (collectionName) => {
    if (selected.length === 0) return;

    if (
      !window.confirm(
        `Delete ${selected.length} records permanently?`
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

  const rows =
    tab === 0 ? merchants : tab === 1 ? customers : leads;

  const collectionName =
    tab === 0
      ? "merchants"
      : tab === 1
      ? "customers"
      : "geo_events";

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
        Admin Dashboard (Cleanup Mode)
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

      <Box sx={{ mt: 2, display: "flex", gap: 2 }}>
        <Button size="small" onClick={() => selectAll(rows)}>
          Select All
        </Button>
        <Button size="small" onClick={clearSelection}>
          Unselect All
        </Button>
        <Button
          size="small"
          color="error"
          disabled={selected.length === 0}
          onClick={() => deleteSelected(collectionName)}
        >
          Delete Selected
        </Button>
      </Box>

      <Table size="small" sx={{ mt: 2 }}>
        <TableHead>
          <TableRow>
            <TableCell />
            {tab === 0 && (
              <>
                <TableCell>Shop</TableCell>
                <TableCell>Mobile</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Status / Action</TableCell>
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
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell>
                <Checkbox
                  checked={selected.includes(r.id)}
                  onChange={() => toggle(r.id)}
                />
              </TableCell>

              {tab === 0 && (
                <>
                  <TableCell>{r.shopName}</TableCell>
                  <TableCell>{r.mobile}</TableCell>
                  <TableCell>{r.category}</TableCell>
                  <TableCell>
                    {r.status === "pending" && (
                      <>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() =>
                            approveMerchant(r.id)
                          }
                        >
                          Approve
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          sx={{ ml: 1 }}
                          onClick={() =>
                            rejectMerchant(r.id)
                          }
                        >
                          Reject
                        </Button>
                      </>
                    )}
                    {r.status === "approved" &&
                      "Approved"}
                    {r.status === "rejected" &&
                      "Rejected"}
                  </TableCell>
                </>
              )}

              {tab === 1 && (
                <>
                  <TableCell>{r.mobile}</TableCell>
                  <TableCell>
                    {r.createdAt
                      ?.toDate?.()
                      .toLocaleString?.()}
                  </TableCell>
                </>
              )}

              {tab === 2 && (
                <>
                  <TableCell>{r.customerId}</TableCell>
                  <TableCell>{r.merchantId}</TableCell>
                  <TableCell>
                    {r.distanceMeters} m
                  </TableCell>
                  <TableCell>
                    {r.createdAt
                      ?.toDate?.()
                      .toLocaleString?.()}
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
