import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import MerchantDashboard from "./pages/MerchantDashboard";
import CustomerDashboard from "./pages/CustomerDashboard";

export default function App() {
  return (
    <Routes>
      {/* LOGIN */}
      <Route path="/login" element={<LoginPage />} />

      {/* DASHBOARDS (NO PROTECTION YET) */}
      <Route path="/admin-dashboard" element={<AdminDashboard />} />
      <Route path="/merchant-dashboard" element={<MerchantDashboard />} />
      <Route path="/customer-dashboard" element={<CustomerDashboard />} />

      {/* FALLBACK */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
