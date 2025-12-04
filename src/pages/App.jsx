// src/App.jsx

import { BrowserRouter, Routes, Route } from "react-router-dom";

// First screen: choose role
import RoleSelect from "./pages/RoleSelect";

// Single shared login screen
import Login from "./pages/Login";

// After login screens
import HomeScreen from "./pages/HomeScreen";
import MerchantDashboard from "./pages/MerchantDashboard";
import AdminDashboard from "./pages/AdminDashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 1️⃣ First, ask user to choose identity */}
        <Route path="/" element={<RoleSelect />} />

        {/* 2️⃣ Same Login component, role based on URL */}
        <Route path="/customer-login" element={<Login />} />
        <Route path="/merchant-login" element={<Login />} />
        <Route path="/admin-login" element={<Login />} />

        {/* 3️⃣ Post-login dashboards */}
        <Route path="/home" element={<HomeScreen />} />
        <Route path="/merchant" element={<MerchantDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
