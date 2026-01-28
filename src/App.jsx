import { BrowserRouter, Routes, Route } from "react-router-dom";

/* ========== AUTH ========== */
import AdminLogin from "./pages/auth/AdminLogin";

/* ========== ADMIN ========== */
import AdminLayout from "./components/AdminLayout";
import ProtectedRoute from "./components/ProtectedRoute";

import Dashboard from "./pages/admin/Dashboard";
import Customers from "./pages/admin/Customers";
import Merchants from "./pages/admin/Merchants";
import Categories from "./pages/admin/Categories";
import Offers from "./pages/admin/Offers";
import GeoAlerts from "./pages/admin/GeoAlerts";
import Notifications from "./pages/admin/Notifications";

/* ========== CUSTOMER ========== */
import CustomerLayout from "./components/CustomerLayout";
import CustomerLogin from "./pages/customer/CustomerLogin";
import CustomerDashboard from "./pages/customer/CustomerDashboard";

/* ========== MERCHANT ========== */
import MerchantLayout from "./components/MerchantLayout";
import MerchantLogin from "./pages/merchant/MerchantLogin";
import MerchantDashboard from "./pages/merchant/MerchantDashboard";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ========== AUTH ROUTES ========== */}
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/customer-login" element={<CustomerLogin />} />
        <Route path="/merchant-login" element={<MerchantLogin />} />

        {/* ========== ADMIN (PROTECTED) ========== */}
        <Route element={<ProtectedRoute adminOnly />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="customers" element={<Customers />} />
            <Route path="merchants" element={<Merchants />} />
            <Route path="categories" element={<Categories />} />
            <Route path="offers" element={<Offers />} />
            <Route path="geo-alerts" element={<GeoAlerts />} />
            <Route path="notifications" element={<Notifications />} />
          </Route>
        </Route>

        {/* ========== CUSTOMER (PROTECTED) ========== */}
        <Route element={<ProtectedRoute customerOnly />}>
          <Route element={<CustomerLayout />}>
            <Route path="/customer" element={<CustomerDashboard />} />
          </Route>
        </Route>

        {/* ========== MERCHANT (PROTECTED) ========== */}
        <Route element={<ProtectedRoute merchantOnly />}>
          <Route element={<MerchantLayout />}>
            <Route path="/merchant" element={<MerchantDashboard />} />
          </Route>
        </Route>

      </Routes>
    </BrowserRouter>
  );
}
