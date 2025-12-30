import React, { useEffect, useState, useMemo } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tabs,
  Tab,
  Checkbox,
  Stack,
} from "@mui/material";
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  writeBatch,
  getCountFromServer,
  orderBy,
  addDoc, // 🔔 REQUIRED
} from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";

/* ===== CHART ===== */
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

/* ===== STAT CARD ===== */
function StatCard({ label, value, onClick }) {
  return (
    <Card onClick={onClick} sx={{ cursor: "pointer", "&:hover": { boxShadow: 6 } }}>
      <CardContent>
        <Typography variant="caption">{label}</Typography>
        <Typography variant="h5" fontWeight="bold">
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();

  /* ===== ROLE GUARD ===== */
  const role = localStorage.getItem("oshiro_role");
  if (role !== "admin") {
    navigate("/login", { replace: true });
    return null;
  }

  /* ===== TABS ===== */
  const [mainTab, setMainTab] = useState(0); // 0=Merchants,1=Offers,2=Customers,3=Geo
  const [statusTab, setStatusTab] = useState(0);

  /* ===== DATA ===== */
  const [merchants, setMerchants] = useState([]);
  const [offers, setOffers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [geoEvents, setGeoEvents] = useState([]);

  /* ===== SELECTION ===== */
  const [selected, setSelected] = useState({});

  /* ===== FILTERS ===== */
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");

  /* ===== REJECT ===== */
  const [rejectingMerchant, setRejectingMerchant] = useState(null);
  const [reason, setReason] = useState("");

  /* ===== STATS ===== */
  const [stats, setStats] = useState({
    merchants: 0,
    approvedMerchants: 0,
    customers: 0,
    offers: 0,
    geoToday: 0,
  });
  const [geoChart, setGeoChart] = useState([]);

  const merchantStatusMap = ["pending", "approved", "rejected"];
  const currentStatus = merchantStatusMap[statusTab];

  /* =========================================================
     LOAD LIST DATA
  ========================================================= */
  useEffect(() => {
    if (mainTab === 0) {
      return onSnapshot(
        query(collection(db, "merchants"), where("status", "==", currentStatus)),
        (snap) => setMerchants(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      );
    }
    if (mainTab === 1) {
      return onSnapshot(collection(db, "offers"), (snap) =>
        setOffers(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      );
    }
    if (mainTab === 2) {
      return onSnapshot(collection(db, "customers"), (snap) =>
        setCustomers(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      );
    }
    if (mainTab === 3) {
      return onSnapshot(
        query(collection(db, "geo_events"), orderBy("createdAt", "desc")),
        (snap) => setGeoEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      );
    }
  }, [mainTab, currentStatus]);

  /* =========================================================
     LOAD STATS
  ========================================================= */
  const loadStats = async () => {
    const merchantsSnap = await getCountFromServer(collection(db, "merchants"));
    const approvedSnap = await getCountFromServer(
      query(collection(db, "merchants"), where("status", "==", "approved"))
    );
    const customersSnap = await getCountFromServer(collection(db, "customers"));
    const offersSnap = await getCountFromServer(
      query(collection(db, "offers"), where("active", "==", true))
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const geoTodaySnap = await getCountFromServer(
      query(collection(db, "geo_events"), where("createdAt", ">=", today))
    );

    setStats({
      merchants: merchantsSnap.data().count,
      approvedMerchants: approvedSnap.data().count,
      customers: customersSnap.data().count,
      offers: offersSnap.data().count,
      geoToday: geoTodaySnap.data().count,
    });
  };

  useEffect(() => {
    loadStats();
  }, []);

  /* =========================================================
     GEO CHART
  ========================================================= */
  useEffect(() => {
    const loadChart = async () => {
      const arr = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        const next = new Date(d);
        next.setDate(next.getDate() + 1);

        const snap = await getCountFromServer(
          query(
            collection(db, "geo_events"),
            where("createdAt", ">=", d),
            where("createdAt", "<", next)
          )
        );

        arr.push({
          day: d.toLocaleDateString("en-IN", { weekday: "short" }),
          count: snap.data().count,
        });
      }
      setGeoChart(arr);
    };
    loadChart();
  }, []);

  /* =========================================================
     FILTERED DATA
  ========================================================= */
  const raw =
    mainTab === 0 ? merchants : mainTab === 1 ? offers : mainTab === 2 ? customers : geoEvents;

  const data = useMemo(() => {
    return raw.filter((d) => {
      if (search && !JSON.stringify(d).toLowerCase().includes(search.toLowerCase()))
        return false;
      if (dateFrom && d.createdAt?.toDate) {
        if (d.createdAt.toDate() < new Date(dateFrom)) return false;
      }
      return true;
    });
  }, [raw, search, dateFrom]);

  /* =========================================================
     SELECTION
  ========================================================= */
  const toggle = (id) => setSelected((p) => ({ ...p, [id]: !p[id] }));
  const selectAll = () => {
    const s = {};
    data.forEach((d) => (s[d.id] = true));
    setSelected(s);
  };
  const deselectAll = () => setSelected({});
  const selectedIds = Object.keys(selected).filter((k) => selected[k]);

  const bulkDelete = async () => {
    if (!selectedIds.length) return;
    if (!window.confirm(`Delete ${selectedIds.length} records?`)) return;

    const col =
      mainTab === 0 ? "merchants" : mainTab === 1 ? "offers" : mainTab === 2 ? "customers" : "geo_events";

    const batch = writeBatch(db);
    selectedIds.forEach((id) => batch.delete(doc(db, col, id)));
    await batch.commit();
    setSelected({});
    await loadStats();
  };

  /* =========================================================
     MERCHANT ACTIONS
  ========================================================= */
  const approve = async (id) =>
    updateDoc(doc(db, "merchants", id), {
      status: "approved",
      approvedAt: new Date(),
    });

  const confirmReject = async () => {
    if (!reason.trim()) return;
    await updateDoc(doc(db, "merchants", rejectingMerchant.id), {
      status: "rejected",
      rejectionReason: reason,
      rejectedAt: new Date(),
    });
    setRejectingMerchant(null);
    setReason("");
    await loadStats();
  };

  const logout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  /* =========================================================
     UI
  ========================================================= */
  return (
    <Box sx={{ p: 2 }}>
      <Button color="error" onClick={logout}>Logout</Button>

      <Typography variant="h6" sx={{ mt: 1 }}>Admin Dashboard</Typography>

      {/* ===== STATS ===== */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 2, my: 2 }}>
        <StatCard label="Merchants" value={stats.merchants} onClick={() => { setMainTab(0); setStatusTab(0); }} />
        <StatCard label="Approved" value={stats.approvedMerchants} onClick={() => { setMainTab(0); setStatusTab(1); }} />
        <StatCard label="Customers" value={stats.customers} onClick={() => setMainTab(2)} />
        <StatCard label="Active Offers" value={stats.offers} onClick={() => setMainTab(1)} />
        <StatCard label="Geo Events Today" value={stats.geoToday} onClick={() => setMainTab(3)} />
      </Box>

      {/* ===== MAIN TABS ===== */}
      <Tabs value={mainTab} onChange={(_, v) => setMainTab(v)}>
        <Tab label="Merchants" />
        <Tab label="Offers" />
        <Tab label="Customers" />
        <Tab label="Geo Events" />
      </Tabs>

      {mainTab === 0 && (
        <Tabs value={statusTab} onChange={(_, v) => setStatusTab(v)}>
          <Tab label="Pending" />
          <Tab label="Approved" />
          <Tab label="Rejected" />
        </Tabs>
      )}

      <Divider sx={{ my: 2 }} />

      {/* ===== ACTIONS ===== */}
      <Button onClick={selectAll}>Select All</Button>
      <Button onClick={deselectAll}>Deselect All</Button>
      <Button color="error" variant="contained" onClick={bulkDelete} disabled={!selectedIds.length}>
        Delete Selected ({selectedIds.length})
      </Button>

      <Divider sx={{ my: 2 }} />

      {/* ===== LIST ===== */}
      {data.map((d) => (
        <Card key={d.id} sx={{ mb: 1 }}>
          <CardContent>
            <Typography fontWeight="bold">
              {d.shopName || d.title || d.merchantId || d.id}
            </Typography>

            {/* 🔔 TEST NOTIFICATION BUTTON */}
            {mainTab === 0 && d.status === "approved" && (
              <Button
                size="small"
                sx={{ mt: 1 }}
                variant="outlined"
                onClick={async () => {
                  await addDoc(collection(db, "notifications_test"), {
                    merchantId: d.id,
                    createdAt: new Date(),
                  });
                  alert("🔔 Test notification sent");
                }}
              >
                🔔 Send Test Notification
              </Button>
            )}

            {mainTab === 0 && d.status === "pending" && (
              <Box sx={{ mt: 1 }}>
                <Button onClick={() => approve(d.id)}>Approve</Button>
                <Button color="error" onClick={() => { setRejectingMerchant(d); setReason(""); }}>
                  Reject
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      ))}

      {/* ===== REJECT DIALOG ===== */}
      <Dialog open={Boolean(rejectingMerchant)} onClose={() => setRejectingMerchant(null)}>
        <DialogTitle>Reject Merchant</DialogTitle>
        <DialogContent>
          <TextField fullWidth multiline rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectingMerchant(null)}>Cancel</Button>
          <Button color="error" onClick={confirmReject}>Reject</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
