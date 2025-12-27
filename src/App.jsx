import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import SelectRole from "./pages/SelectRole";
import MerchantDashboard from "./pages/MerchantDashboard";
import CustomerDashboard from "./pages/CustomerDashboard";
import AdminDashboard from "./pages/AdminDashboard";


export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/select-role" element={<SelectRole />} />
      <Route path="/merchant" element={<MerchantDashboard />} />
      <Route path="/customer" element={<CustomerDashboard />} />
      <Route path="/admin" element={<AdminDashboard />} />
      {/* default */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* catch-all */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
