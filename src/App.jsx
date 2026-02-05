import { Routes, Route, Navigate } from "react-router-dom";

/* ========= CONFIG ========= */
import { APP_CONFIG } from "./config/appConfig";

/* ========= HOME ========= */
import Home from "./pages/Home";

/* ========= AUTH (PUBLIC) ========= */
import AdminLogin from "./pages/auth/AdminLogin";
import CustomerLogin from "./pages/customer/CustomerLogin";
import MerchantLogin from "./pages/merchant/MerchantLogin";
import MerchantRegister from "./pages/merchant/MerchantRegister";

/* ========= ROUTE GUARD ========= */
import RouteGuard from "./guards/RouteGuard";

/* ========= ADMIN ========= */
import AdminLayout from "./components/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import Customers from "./pages/admin/Customers";
import Merchants from "./pages/admin/Merchants";
import Categories from "./pages/admin/Categories";
import Offers from "./pages/admin/Offers";
import GeoAlerts from "./pages/admin/GeoAlerts";
import Notifications from "./pages/admin/Notifications";

/* ========= CUSTOMER ========= */
import CustomerLayout from "./components/CustomerLayout";
import CustomerDashboard from "./pages/customer/CustomerDashboard";
import OfferDetails from "./pages/customer/OfferDetails";
import CustomerLocked from "./pages/customer/CustomerLocked";

/* ========= MERCHANT ========= */
import MerchantLayout from "./components/MerchantLayout";
import MerchantDashboard from "./pages/merchant/MerchantDashboard";
import MerchantOffers from "./pages/merchant/MerchantOffers";
import MerchantProfile from "./pages/merchant/MerchantProfile";
import MerchantLeads from "./pages/merchant/MerchantLeads";
import MerchantLocation from "./pages/merchant/MerchantLocation";

export default function App() {
  return (
    <Routes>
      {/* ================= PUBLIC ================= */}
      <Route path="/" element={<Home />} />

      {/* ================= AUTH ================= */}
      <Route path="/admin-login" element={<AdminLogin />} />
      <Route path="/customer-login" element={<CustomerLogin />} />
      <Route path="/merchant/login" element={<MerchantLogin />} />
      <Route path="/merchant/register" element={<MerchantRegister />} />

      {/* ================= ADMIN ================= */}
      <Route
        path="/admin"
        element={
          <RouteGuard allowedRoles={["admin"]}>
            <AdminLayout />
          </RouteGuard>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="customers" element={<Customers />} />
        <Route path="merchants" element={<Merchants />} />
        <Route path="categories" element={<Categories />} />
        <Route path="offers" element={<Offers />} />
        <Route path="geo-alerts" element={<GeoAlerts />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>

      {/* ================= CUSTOMER (LOCKED) ================= */}
      <Route
        path="/customer/*"
        element={
          APP_CONFIG.CUSTOMER_ENABLED ? (
            <RouteGuard allowedRoles={["customer"]}>
              <CustomerLayout />
            </RouteGuard>
          ) : (
            <CustomerLocked />
          )
        }
      >
        {/* These routes will only work when CUSTOMER_ENABLED = true */}
        <Route index element={<CustomerDashboard />} />
        <Route
          path="offers/:merchantId"
          element={<OfferDetails />}
        />
      </Route>

      {/* ================= MERCHANT ================= */}
      <Route
        path="/merchant"
        element={
          <RouteGuard allowedRoles={["merchant"]}>
            <MerchantLayout />
          </RouteGuard>
        }
      >
        <Route index element={<MerchantDashboard />} />
        <Route path="dashboard" element={<MerchantDashboard />} />
        <Route path="location" element={<MerchantLocation />} />
        <Route path="offers" element={<MerchantOffers />} />
        <Route path="profile" element={<MerchantProfile />} />
        <Route path="leads" element={<MerchantLeads />} />
      </Route>

      {/* ================= FALLBACK ================= */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
