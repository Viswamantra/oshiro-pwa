import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";

import Login from "./auth/Login";
import MerchantDashboard from "./pages/MerchantDashboard";
import CustomerDashboard from "./pages/CustomerDashboard";

import MerchantRoute from "./routes/MerchantRoute";
import CustomerRoute from "./routes/CustomerRoute";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* ✅ SINGLE LOGIN SOURCE */}
        <Route path="/login" element={<Login />} />

        <Route
          path="/merchant"
          element={
            <MerchantRoute>
              <MerchantDashboard />
            </MerchantRoute>
          }
        />

        <Route
          path="/customer"
          element={
            <CustomerRoute>
              <CustomerDashboard />
            </CustomerRoute>
          }
        />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}
