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
function StatCard({ label, value }) {
  return (
    <Card>
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
  const [mainTab, setMainTab] = useState(0); // 0=Merchants,1=Offers,2=Customers
  const [statusTab, setStatusTab] = useState(0); // merchant status

  /* ===== DATA ===== */
  const [merchants, setMerchants] = useState([]);
  const [offers, setOffers] = useState([]);
  const [customers, setCustomers] = useState([]);

  /* ===== SELECTION ===== */
  const [selected, setSelected] = useState({});

  /* ===== FILTERS ===== */
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [testOnly, setTestOnly] = useState(false);

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
      const q = query(
        collection(db, "merchants"),
        where("status", "==", currentStatus)
      );
      return onSnapshot(q, (snap) =>
        setMerchants(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
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
  }, [mainTab, currentStatus]);

  /* =========================================================
     LOAD STATS
  ========================================================= */
  useEffect(() => {
    const loadStats = async () => {
      const merchantsSnap = await getCountFromServer(
        collection(db, "merchants")
      );

      const approvedSnap = await getCountFromServer(
        query(collection(db, "merchants"), where("status", "==", "approved"))
      );

      const customersSnap = await getCountFromServer(
        collection(db, "customers")
      );

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

    loadStats();
  }, []);

  /* =========================================================
     GEO CHART (LAST 7 DAYS)
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
    mainTab === 0 ? merchants : mainTab === 1 ? offers : customers;

  const data = useMemo(() => {
    return raw.filter((d) => {
      if (search && !JSON.stringify(d).toLowerCase().includes(search.toLowerCase()))
        return false;

      if (testOnly && d.isTest !== true) return false;

      if (dateFrom && d.createdAt?.toDate) {
        if (d.createdAt.toDate() < new Date(dateFrom)) return false;
      }
      return true;
    });
  }, [raw, search, testOnly, dateFrom]);

  /* =========================================================
     SELECTION + DELETE
  ========================================================= */
  const toggle = (id) =>
    setSelected((p) => ({ ...p, [id]: !p[id] }));

  const selectAll = () => {
    const s = {};
    data.forEach((d) => (s[d.id] = true));
    setSelected(s);
  };

  const selectedIds = Object.keys(selected).filter((k) => selected[k]);

  const bulkDelete = async () => {
    if (!selectedIds.length) return alert("No records selected");
    if (!window.confirm(`Delete ${selectedIds.length} records?`)) return;

    const col =
      mainTab === 0 ? "merchants" : mainTab === 1 ? "offers" : "customers";

    const batch = writeBatch(db);
    selectedIds.forEach((id) => batch.delete(doc(db, col, id)));
    await batch.commit();
    setSelected({});
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
    if (!reason.trim()) return alert("Reason required");

    await updateDoc(doc(db, "merchants", rejectingMerchant.id), {
      status: "rejected",
      rejectionReason: reason,
      rejectedAt: new Date(),
    });

    setRejectingMerchant(null);
    setReason("");
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
      <Button color="error" onClick={logout}>
        Logout
      </Button>

      <Typography variant="h6" sx={{ mt: 1 }}>
        Admin Dashboard
      </Typography>

      {/* ===== STATS ===== */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px,1fr))",
          gap: 2,
          my: 2,
        }}
      >
        <StatCard label="Merchants" value={stats.merchants} />
        <StatCard label="Approved" value={stats.approvedMerchants} />
        <StatCard label="Customers" value={stats.customers} />
        <StatCard label="Active Offers" value={stats.offers} />
        <StatCard label="Geo Events Today" value={stats.geoToday} />
      </Box>

      {/* ===== GEO CHART ===== */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography fontWeight="bold">
            Geo Events – Last 7 Days
          </Typography>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={geoChart}>
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#1976d2" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ===== MAIN TABS ===== */}
      <Tabs value={mainTab} onChange={(_, v) => setMainTab(v)}>
        <Tab label="Merchants" />
        <Tab label="Offers" />
        <Tab label="Customers" />
      </Tabs>

      {mainTab === 0 && (
        <Tabs value={statusTab} onChange={(_, v) => setStatusTab(v)}>
          <Tab label="Pending" />
          <Tab label="Approved" />
          <Tab label="Rejected" />
        </Tabs>
      )}

      <Divider sx={{ my: 2 }} />

      {/* ===== FILTERS ===== */}
      <Stack direction="row" spacing={2}>
        <TextField
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <TextField
          type="date"
          label="Created After"
          InputLabelProps={{ shrink: true }}
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
        />
        <Checkbox checked={testOnly} onChange={(e) => setTestOnly(e.target.checked)} />
        <Typography>Test only</Typography>
      </Stack>

      {/* ===== ACTIONS ===== */}
      <Box sx={{ mt: 2 }}>
        <Button onClick={selectAll}>Select All</Button>
        <Button
          color="error"
          variant="contained"
          onClick={bulkDelete}
          disabled={!selectedIds.length}
        >
          Delete Selected ({selectedIds.length})
        </Button>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* ===== LIST ===== */}
      {data.map((d) => (
        <Card key={d.id} sx={{ mb: 1 }}>
          <CardContent sx={{ display: "flex", gap: 2 }}>
            <Checkbox checked={!!selected[d.id]} onChange={() => toggle(d.id)} />
            <Box>
              <Typography fontWeight="bold">
                {d.shopName || d.title || d.id}
              </Typography>
              {d.mobile && <Typography>{d.mobile}</Typography>}

              {mainTab === 0 && d.status === "pending" && (
                <Box sx={{ mt: 1 }}>
                  <Button onClick={() => approve(d.id)}>Approve</Button>
                  <Button color="error" onClick={() => {
                    setRejectingMerchant(d);
                    setReason("");
                  }}>
                    Reject
                  </Button>
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>
      ))}

      {/* ===== REJECT DIALOG ===== */}
      <Dialog open={Boolean(rejectingMerchant)} onClose={() => setRejectingMerchant(null)}>
        <DialogTitle>Reject Merchant</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectingMerchant(null)}>Cancel</Button>
          <Button color="error" onClick={confirmReject}>Reject</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
