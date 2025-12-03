// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import HomeScreen from "./pages/HomeScreen.jsx";
import MerchantDashboard from "./pages/MerchantDashboard.jsx";
import HeaderBar from "./components/layout/HeaderBar.jsx";
import BottomNav from "./components/layout/BottomNav.jsx";

function App() {
  return (
    <Router>
      <div className="app-shell">
        <HeaderBar />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<HomeScreen />} />
            <Route path="/merchant" element={<MerchantDashboard />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <BottomNav />
      </div>
    </Router>
  );
}

export default App;
