// src/App.jsx

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Pages
import Login from "./pages/Login.jsx";
import HomeScreen from "./pages/HomeScreen.jsx";
import MerchantDashboard from "./pages/MerchantDashboard.jsx";

// Optional: simple login check
function isLoggedIn() {
  return localStorage.getItem("customer_logged_in") === "true";
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default route → Login */}
        <Route path="/" element={<Navigate to="/login" />} />

        {/* Customer Login */}
        <Route path="/login" element={<Login />} />

        {/* Customer Home (only after login) */}
        <Route
          path="/home"
          element={
            isLoggedIn() ? (
              <HomeScreen />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Merchant Panel */}
        <Route path="/merchant" element={<MerchantDashboard />} />

        {/* If unknown route → send to login */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
