import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";

/* ✅ CORRECT IMPORT PATHS */
import Login from "./auth/Login";
import MerchantDashboard from "./pages/MerchantDashboard";
import CustomerDashboard from "./pages/CustomerDashboard";

/* ROUTE GUARD */
import MerchantRoute from "./routes/MerchantRoute";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* DEFAULT */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* LOGIN */}
          <Route path="/login" element={<Login />} />

          {/* MERCHANT (PROTECTED) */}
          <Route
            path="/merchant"
            element={
              <MerchantRoute>
                <MerchantDashboard />
              </MerchantRoute>
            }
          />

          {/* CUSTOMER */}
          <Route path="/customer" element={<CustomerDashboard />} />

          {/* FALLBACK */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
