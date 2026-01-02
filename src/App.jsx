import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";

/* ✅ CORRECT IMPORTS (MATCH YOUR FOLDER STRUCTURE) */
import Login from "./auth/Login";
import MerchantDashboard from "./pages/MerchantDashboard";
import CustomerDashboard from "./pages/CustomerDashboard";

import MerchantRoute from "./routes/MerchantRoute";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />

          <Route path="/login" element={<Login />} />

          <Route
            path="/merchant"
            element={
              <MerchantRoute>
                <MerchantDashboard />
              </MerchantRoute>
            }
          />

          <Route path="/customer" element={<CustomerDashboard />} />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
