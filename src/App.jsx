import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import ProtectedRoute from "./auth/ProtectedRoute";

import Navbar from "./layout/Navbar";

import LoginPage from "./pages/LoginPage";
import SetPin from "./pages/SetPin";
import MerchantRegister from "./pages/MerchantRegister";

import MerchantDashboard from "./pages/MerchantDashboard";
import CustomerDashboard from "./pages/CustomerDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Notifications from "./pages/Notifications";

export default function App() {
  return (
    <AuthProvider>
      <Navbar />

      <Routes>
        {/* ======================
            AUTH ROUTES
        ====================== */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/set-pin" element={<SetPin />} />

        {/* ======================
            MERCHANT REGISTRATION
        ====================== */}
        <Route path="/merchant-register" element={<MerchantRegister />} />

        {/* ======================
            PROTECTED ROUTES
        ====================== */}
        <Route
          path="/notifications"
          element={
            <ProtectedRoute allowedRoles={["admin", "merchant", "customer"]}>
              <Notifications />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/merchant"
          element={
            <ProtectedRoute allowedRoles={["merchant"]}>
              <MerchantDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/customer"
          element={
            <ProtectedRoute allowedRoles={["customer"]}>
              <CustomerDashboard />
            </ProtectedRoute>
          }
        />

        {/* ======================
            FALLBACK ROUTES
        ====================== */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}
