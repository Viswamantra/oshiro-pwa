// src/App.jsx

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Pages
import Login from "./pages/Login.jsx";
import HomeScreen from "./pages/HomeScreen.jsx";
import MerchantDashboard from "./pages/MerchantDashboard.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";

function App() {
  const role = localStorage.getItem("logged_role");

  return (
    <BrowserRouter>
      <Routes>

        {/* LOGIN */}
        <Route path="/login" element={<Login />} />

        {/* CUSTOMER HOME */}
        <Route
          path="/home"
          element={
            role === "customer" ? <HomeScreen /> : <Navigate to="/login" />
          }
        />

        {/* MERCHANT DASHBOARD */}
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

        {/* ADMIN DASHBOARD */}
        <Route
          path="/admin"
          element={
            role === "admin" ? (
              <AdminDashboard />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* DEFAULT ROUTE */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
