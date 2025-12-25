import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Navbar from "./layout/Navbar";

import LoginPage from "./pages/LoginPage";
import MerchantDashboard from "./pages/MerchantDashboard";
import CustomerDashboard from "./pages/CustomerDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Notifications from "./pages/Notifications";

export default function App() {
  return (
    <>
      <Navbar />

      <Routes>
        {/* ======================
            AUTH
        ====================== */}
        <Route path="/login" element={<LoginPage />} />

        {/* ======================
            DASHBOARDS (TEMP: UNPROTECTED)
        ====================== */}
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/merchant-dashboard" element={<MerchantDashboard />} />
        <Route path="/customer-dashboard" element={<CustomerDashboard />} />

        {/* ======================
            COMMON
        ====================== */}
        <Route path="/notifications" element={<Notifications />} />

        {/* ======================
            FALLBACK
        ====================== */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}
