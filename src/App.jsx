import { Routes, Route, Navigate } from "react-router-dom";

/* AUTH */
import Login from "./auth/Login";

/* DASHBOARDS */
import AdminDashboard from "./pages/AdminDashboard";
import CustomerDashboard from "./pages/CustomerDashboard";

export default function App() {
  return (
    <Routes>
      {/* DEFAULT */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* LOGIN */}
      <Route path="/login" element={<Login />} />

      {/* ADMIN */}
      <Route path="/admin" element={<AdminDashboard />} />

      {/* CUSTOMER */}
      <Route path="/customer" element={<CustomerDashboard />} />

      {/* FALLBACK */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
