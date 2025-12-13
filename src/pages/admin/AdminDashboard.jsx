import { useState } from "react";
import { Box, AppBar, Toolbar, Typography, Tabs, Tab } from "@mui/material";

import MerchantManager from "./MerchantManager";
import OfferManager from "./OfferManager";
import PendingApprovals from "./PendingApprovals";
import AdminReports from "./AdminReports";

export default function AdminDashboard() {
  const [tab, setTab] = useState(0);

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
        >
          <Tab label="Merchants" />
          <Tab label="Offers" />
          <Tab label="Pending" />
          <Tab label="Reports" />
        </Tabs>
      </Box>

      {/* Tab content */}
      <Box sx={{ p: 3 }}>
        {tab === 0 && <MerchantManager />}
        {tab === 1 && <OfferManager />}
        {tab === 2 && <PendingApprovals />}
        {tab === 3 && <AdminReports />}
      </Box>
    </Box>
  );
}
