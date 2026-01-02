import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";

/* ✅ PAGES */
import Login from "./auth/Login";
import MerchantDashboard from "./pages/MerchantDashboard";
import CustomerDashboard from "./pages/CustomerDashboard";

/* ✅ ROUTE GUARDS */
import MerchantRoute from "./routes/MerchantRoute";
import CustomerRoute from "./routes/CustomerRoute";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* DEFAULT */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* LOGIN */}
          <Route path="/login" element={<Login />} />

          {/* MERCHANT */}
          <Route
            path="/merchant"
            element={
              <MerchantRoute>
                <MerchantDashboard />
              </MerchantRoute>
            }
          />

          {/* CUSTOMER */}
          <Route
            path="/customer"
            element={
              <CustomerRoute>
                <CustomerDashboard />
              </CustomerRoute>
            }
          />

          {/* FALLBACK */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
