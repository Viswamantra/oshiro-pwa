import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./auth/Login";
import AdminDashboard from "./pages/AdminDashboard";
import CustomerDashboard from "./pages/CustomerDashboard";
import MerchantDashboard from "./pages/MerchantDashboard";
import MerchantRegister from "./pages/MerchantRegister";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />

      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/customer" element={<CustomerDashboard />} />
      <Route path="/merchant" element={<MerchantDashboard />} />
      <Route
        path="/merchant-register"
        element={<MerchantRegister />}
      />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
