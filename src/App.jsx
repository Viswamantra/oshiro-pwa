// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login.jsx";
import HomeScreen from "./pages/HomeScreen.jsx";
import MerchantDashboard from "./pages/MerchantDashboard.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";

// Simple helper
const getRole = () => localStorage.getItem("logged_role");

function App() {
  const role = getRole();

  return (
    <BrowserRouter>
      <Routes>
        {/* Default → Login */}
        <Route path="/" element={<Navigate to="/login" />} />

        <Route path="/login" element={<Login />} />

        {/* Customer Home */}
        <Route
          path="/home"
          element={
            role === "customer" ? <HomeScreen /> : <Navigate to="/login" />
          }
        />

        {/* Merchant */}
        <Route
          path="/merchant"
          element={
            role === "merchant" ? (
              <MerchantDashboard />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Admin */}
        <Route
          path="/admin"
          element={
            role === "admin" ? <AdminDashboard /> : <Navigate to="/login" />
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
