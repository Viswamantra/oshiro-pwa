import { Routes, Route, Navigate } from "react-router-dom";

/* ======================
   AUTH
====================== */
import Login from "./auth/Login";

/* ======================
   DASHBOARDS
====================== */
import MerchantDashboard from "./pages/MerchantDashboard";
import CustomerDashboard from "./pages/CustomerDashboard";
import AdminDashboard from "./pages/AdminDashboard";

/* ======================
   REGISTRATION
====================== */
import MerchantRegister from "./pages/MerchantRegister";

export default function App() {
  return (
    <Routes>
      {/* ======================
          DEFAULT
      ====================== */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* ======================
          LOGIN
      ====================== */}
      <Route path="/login" element={<Login />} />

      {/* ======================
          CUSTOMER FLOW
      ====================== */}
      <Route path="/customer" element={<CustomerDashboard />} />

      {/* ======================
          MERCHANT FLOW
      ====================== */}
      <Route path="/merchant" element={<MerchantDashboard />} />

      {/* ======================
          NEW MERCHANT REGISTRATION
      ====================== */}
      <Route
        path="/merchant-register"
        element={<MerchantRegister />}
      />

      {/* ======================
          ADMIN FLOW
      ====================== */}
      <Route path="/admin" element={<AdminDashboard />} />

      {/* ======================
          FALLBACK
      ====================== */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
