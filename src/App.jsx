import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./auth/Login";
import MerchantDashboard from "./pages/MerchantDashboard";
import CustomerDashboard from "./pages/CustomerDashboard";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/merchant" element={<MerchantDashboard />} />
      <Route path="/customer" element={<CustomerDashboard />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
