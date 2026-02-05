import { useEffect, useRef, useState } from "react";
import { Box, AppBar, Toolbar, Typography, Tabs, Tab } from "@mui/material";

import MerchantManager from "./MerchantManager";
import OfferManager from "./OfferManager";
import PendingApprovals from "./PendingApprovals";
import AdminReports from "./AdminReports";
import CategoryManager from "./CategoryManager";

// 🔁 BACKFILL IMPORT (TEMPORARY)
import { backfillOffersOnce } from "../../admin/BackfillOffers";

export default function AdminDashboard() {
  const [tab, setTab] = useState(0);

  // 🛡 Prevent double run in React StrictMode
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    // 🔥 RUN BACKFILL ONCE
    backfillOffersOnce();
  }, []);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f3f4f6" }}>
      {/* Top Appbar */}
      <AppBar position="static" color="primary">
        <Toolbar>
          <Typography variant="h6">
            OshirO Admin
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Tabs */}
      <Box sx={{ bgcolor: "#fff" }}>
        <Tabs
          value={tab}
          onChange={(e, v) => setTab(v)}
          textColor="primary"
          indicatorColor="primary"
          variant="scrollable"
        >
          <Tab label="Merchants" />
          <Tab label="Offers" />
          <Tab label="Pending" />
          <Tab label="Reports" />
          <Tab label="Categories" />
        </Tabs>
      </Box>

      {/* Tab content */}
      <Box sx={{ p: 3 }}>
        {tab === 0 && <MerchantManager />}
        {tab === 1 && <OfferManager />}
        {tab === 2 && <PendingApprovals />}
        {tab === 3 && <AdminReports />}
        {tab === 4 && <CategoryManager />}
      </Box>
    </Box>
  );
}
